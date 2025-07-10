resource "aws_lambda_function" "event_handler" {
  function_name    = "fiapx-event-handler"
  filename         = "lambda.zip"
  source_code_hash = filebase64sha256("lambda.zip")
  role             = data.aws_iam_role.lab_role.arn
  timeout          = 300
  handler          = "dist/index.handler"
  runtime          = "nodejs18.x"

  environment {
    variables = {
      ADMIN_URL = data.terraform_remote_state.admin-service.outputs.admin_service_api_url
    }
  }
}

resource "aws_lambda_permission" "allow_sqs" {
  statement_id  = "AllowSQSToInvokeLambda"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.event_handler.function_name
  principal     = "sqs.amazonaws.com"
  source_arn    = aws_sqs_queue.event_handler_queue.arn
}

resource "aws_lambda_event_source_mapping" "sqs_to_lambda" {
  event_source_arn  = aws_sqs_queue.event_handler_queue.arn
  function_name     = aws_lambda_function.event_handler.function_name
  enabled           = true
}