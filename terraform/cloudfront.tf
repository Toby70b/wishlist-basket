locals {
  s3_origin_id     = "wishlist-basket-website-bucket"
  lambda_origin_id = "wishlist-basket-lambda-proxy"
}

resource "aws_cloudfront_origin_access_control" "website" {
  name                              = "website-oac"
  origin_access_control_origin_type = "s3"
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

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = local.s3_origin_id
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    cache_policy_id            = aws_cloudfront_cache_policy.website.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.website.id
  }

  ## TODO add lambda cache behavior for /api/* to proxy to the lambda function

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

