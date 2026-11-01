# --- Lambda --- #
locals {
  lambda_zip    = "${path.module}/../steam-wishlist-api-proxy-lambda/dist/lambda.zip"
  function_name = "wishlist-basket-api-proxy"
}
resource "aws_lambda_function" "api_proxy" {
  filename         = local.lambda_zip
  source_code_hash = filebase64sha256(local.lambda_zip)

  function_name                  = local.function_name
  role                           = aws_iam_role.api_proxy.arn
  handler                        = "handler.lambda_handler"
  runtime                        = "python3.12"
  timeout                        = 10
  memory_size                    = 256
  reserved_concurrent_executions = 10

  environment {
    variables = {
      STEAM_API_BASE_URL = var.steam_wishlist_api_base_url
    }
  }

  logging_config {
    log_format = "Text"
    log_group  = aws_cloudwatch_log_group.api_proxy.name
  }
}

resource "aws_lambda_function_url" "api_proxy" {
  function_name = aws_lambda_function.api_proxy.function_name
  # only CloudFront, signing via the OAC, can call it
  authorization_type = "AWS_IAM"
}

resource "aws_iam_role" "api_proxy" {
  name = "${local.function_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "api_proxy_logs" {
  role       = aws_iam_role.api_proxy.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_cloudwatch_log_group" "api_proxy" {
  name              = "/aws/lambda/${local.function_name}"
  retention_in_days = 14
}

resource "terraform_data" "require_lambda_build" {
  lifecycle {
    precondition {
      condition     = fileexists(local.lambda_zip)
      error_message = "No Lambda build at ${local.lambda_zip}. Run steam-wishlist-api-proxy-lambda/build.sh first."
    }
  }
}