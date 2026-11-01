# --- Lambda --- #
data "archive_file" "game_capsule_image_lookup" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/capsule_image_lookup/"
  output_path = "${path.module}/files/capsule_image_lookup.zip"
  excludes    = ["requirements.txt"]
}

resource "aws_iam_role" "game_capsule_image_lookup_lambda_role" {
  name = "game-capsule_image-lookup-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "game_capsule_image_lookup_lambda_policy" {
  name = "ddb-export-lambda-policy"
  role = aws_iam_role.game_capsule_image_lookup_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject"]
        Resource = "${aws_s3_bucket.website.arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
        Resource = aws_sqs_queue.game_capsule_image_lookup.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_lambda_function" "game_capsule_image_lookup" {
  filename         = data.archive_file.game_capsule_image_lookup.output_path
  source_code_hash = data.archive_file.game_capsule_image_lookup.output_base64sha256

  function_name = "game-capsule-image-lookup"
  role          = aws_iam_role.game_capsule_image_lookup_lambda_role.arn
  handler       = "capsule_image_lookup.handler"
  runtime       = "python3.12"
  timeout       = 60
  memory_size   = 128

  environment {
    variables = {
      BUCKET_NAME          = aws_s3_bucket.website.bucket
      STEAM_STORE_BASE_URL = var.steam_store_base_url
    }
  }
}

resource "aws_lambda_event_source_mapping" "new_game_item_stream" {
  event_source_arn = aws_sqs_queue.game_capsule_image_lookup.arn
  function_name    = aws_lambda_function.game_capsule_image_lookup.arn

  # Batch settings -  need to consider initial setup scenario
  batch_size                         = 10
  maximum_batching_window_in_seconds = 10
  function_response_types            = ["ReportBatchItemFailures"]

  scaling_config {
    maximum_concurrency = 5
  }
}