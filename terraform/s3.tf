resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "website" {
  bucket = "wishlist-basket-${random_id.bucket_suffix.hex}"
}

data "aws_iam_policy_document" "website" {
  statement {
    sid    = "AllowCloudFrontServicePrincipalReadOnly"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions = [
      "s3:GetObject",
    ]

    resources = [
      "${aws_s3_bucket.website.arn}/*"
    ]


    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.wishlist_basket.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.bucket
  policy = data.aws_iam_policy_document.website.json
}

resource "aws_s3_bucket_public_access_block" "website" {
  bucket                  = aws_s3_bucket.website.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

locals {
  website_dist = "${path.module}/../dist"
  media_content_types = {
    "html"  = "text/html"
    "css"   = "text/css"
    "js"    = "text/javascript"
    "svg"   = "image/svg+xml"
    "png"   = "image/png"
    "ico"   = "image/x-icon"
    "json"  = "application/json"
    "woff2" = "font/woff2"
  }
}

resource "terraform_data" "require_website_build" {
  lifecycle {
    precondition {
      condition     = fileexists("${local.website_dist}/index.html")
      error_message = "No build found in ${local.website_dist}. Run `npm run build` first."
    }
  }
}

resource "aws_s3_object" "website" {
  for_each = fileset(local.website_dist, "**")

  bucket       = aws_s3_bucket.website.id
  key          = each.value
  source       = "${local.website_dist}/${each.value}"
  etag         = filemd5("${local.website_dist}/${each.value}")
  content_type = lookup(local.media_content_types, lower(reverse(split(".", each.value))[0]), "application/octet-stream")
}
