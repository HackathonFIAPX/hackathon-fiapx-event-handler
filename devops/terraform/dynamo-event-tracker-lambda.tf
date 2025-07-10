resource "aws_lambda_function" "dynamo_event_tracker" {
  function_name    = "fiapx-dynamo-event-tracker"
  filename         = "lambda.zip"
  source_code_hash = filebase64sha256("lambda.zip")
  role             = data.aws_iam_role.lab_role.arn
  timeout          = 300
  handler          = "dist/src/dynamo-event-tracker.handler"
  runtime          = "nodejs18.x"
}

resource "aws_lambda_event_source_mapping" "dynamodb_trigger" {
  event_source_arn = data.terraform_remote_state.processor-service.outputs.dynamo_stream_arn
  function_name    = aws_lambda_function.dynamo_event_tracker.arn
  starting_position = "LATEST"
}