terraform {
  backend "s3" {
    bucket       = "terraform-state-wishlist-basket-tobyp123"
    key          = "terraform.tfstate"
    region       = "eu-west-2"
    encrypt      = true
    use_lockfile = true
  }
}
