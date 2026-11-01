variable "region" {
  description = "The AWS region to deploy resources in"
  type        = string
}

variable "top_level_domain" {
  description = "The top-level domain for the application"
  type        = string
}

variable "aliases" {
  description = "A list of aliases for the CloudFront distribution"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "steam_wishlist_api_base_url" {
  description = "The base URL for the Steam Wishlist API"
  type        = string
  default     = "https://api.steampowered.com"
}