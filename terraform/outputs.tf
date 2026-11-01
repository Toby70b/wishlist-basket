output "cloudfront_distribution_id" {
  description = "Distribution ID, needed for cache invalidations."
  value       = aws_cloudfront_distribution.wishlist_basket.id
}

output "website_bucket_name" {
  description = "The name of the S3 bucket used for the website."
  value       = aws_s3_bucket.website.bucket
}