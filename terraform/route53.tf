
locals {
  ## CloudFront requires ACM certificates to be in us-east-1.
  cert_region = "us-east-1"
}

data "aws_route53_zone" "wishlist_basket" {
  name         = var.top_level_domain
  private_zone = false
}

resource "aws_route53_record" "wishlist_basket_cloudfront_a" {
  for_each = toset(var.aliases)
  zone_id  = data.aws_route53_zone.wishlist_basket.zone_id
  name     = each.value
  type     = "A"

  alias {
    name                   = aws_cloudfront_distribution.wishlist_basket.domain_name
    zone_id                = aws_cloudfront_distribution.wishlist_basket.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "wishlist_basket_cloudfront_aaaa" {
  for_each = toset(var.aliases)
  zone_id  = data.aws_route53_zone.wishlist_basket.zone_id
  name     = each.value
  type     = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.wishlist_basket.domain_name
    zone_id                = aws_cloudfront_distribution.wishlist_basket.hosted_zone_id
    evaluate_target_health = false
  }
}

data "aws_acm_certificate" "wishlist_basket_cert" {
  region      = "us-east-1"
  domain      = "*.${var.top_level_domain}"
  statuses    = ["ISSUED"]
  most_recent = true
}