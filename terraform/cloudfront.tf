locals {
  s3_origin_id     = "wishlist-basket-website-bucket"
  lambda_origin_id = "wishlist-basket-lambda-proxy"
}

resource "aws_cloudfront_origin_access_control" "website" {
  name                              = "wishlist-basket-website-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_origin_access_control" "api_proxy" {
  name                              = "wishlist-basket-lambda-oac"
  origin_access_control_origin_type = "lambda"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

## TODO: replace in future with aws_cloudfront_cache_policy managed policy, deploy s3 website files with s3 sync and github actions
resource "aws_cloudfront_cache_policy" "website" {
  name        = "wishlist-basket-website"
  comment     = "Short TTL so deploys show up within minutes without invalidations"
  min_ttl     = 0
  default_ttl = 300 # S3 sends no Cache-Control, so this is what applies
  max_ttl     = 300

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config { cookie_behavior = "none" }
    headers_config { header_behavior = "none" }
    query_strings_config { query_string_behavior = "none" }
    enable_accept_encoding_gzip   = true # keeps compression working
    enable_accept_encoding_brotli = true
  }
}

resource "aws_cloudfront_response_headers_policy" "website" {
  name = "wishlist-basket-website-response-headers-policy"

  custom_headers_config {
    items {
      header   = "Cache-Control"
      value    = "public, max-age=300, s-maxage=300"
      override = true
    }
  }
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "all_viewer_except_host" {
  name = "Managed-AllViewerExceptHostHeader"
}

resource "aws_cloudfront_distribution" "wishlist_basket" {
  enabled             = true
  is_ipv6_enabled     = true
  aliases             = var.aliases
  price_class         = "PriceClass_100"
  default_root_object = "index.html"

  origin {
    domain_name              = aws_s3_bucket.website.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.website.id
    origin_id                = local.s3_origin_id
  }

  origin {
    # Remove the https:// prefix and any trailing '/'
    domain_name              = split("/", aws_lambda_function_url.api_proxy.function_url)[2]
    origin_id                = local.lambda_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.api_proxy.id

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  ## Default cache behavior for the S3 bucket
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = local.s3_origin_id
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    cache_policy_id            = aws_cloudfront_cache_policy.website.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.website.id
  }

  ## Lambda cache behavior for /api/* to proxy to the lambda function
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = local.lambda_origin_id
    compress               = true

    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = data.aws_acm_certificate.wishlist_basket_cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

resource "aws_lambda_permission" "cloudfront_invoke_function_url" {
  statement_id  = "AllowCloudFrontInvokeFunctionUrl"
  action        = "lambda:InvokeFunctionUrl"
  function_name = aws_lambda_function.api_proxy.function_name
  principal     = "cloudfront.amazonaws.com"
  source_arn    = aws_cloudfront_distribution.wishlist_basket.arn
}

resource "aws_lambda_permission" "cloudfront_invoke_function" {
  statement_id  = "AllowCloudFrontInvokeFunction"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_proxy.function_name
  principal     = "cloudfront.amazonaws.com"
  source_arn    = aws_cloudfront_distribution.wishlist_basket.arn
}

