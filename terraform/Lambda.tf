resource "aws_iam_role" "lambda_exec_role" {
  name = "${var.project_name}-lambda-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = {
        Service = "lambda.amazonaws.com"
      },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# --- Get Action Plan ---
resource "aws_lambda_function" "get_action_plan_function" {
  function_name = "${var.project_name}-get-action-plan"
  role          = aws_iam_role.lambda_exec_role.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.10"

  filename         = "${path.module}/../lambda_src/get_action_plan.zip"
  source_code_hash = filebase64sha256("${path.module}/../lambda_src/get_action_plan.zip")
}

# --- Create Incident ---
resource "aws_lambda_function" "create_incident_function" {
  function_name = "${var.project_name}-create-incident"
  role          = aws_iam_role.lambda_exec_role.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.10"

  filename         = "${path.module}/../lambda_src/create_incident.zip"
  source_code_hash = filebase64sha256("${path.module}/../lambda_src/create_incident.zip")
}

# --- List Incidents ---
resource "aws_lambda_function" "list_incidents_function" {
  function_name = "${var.project_name}-list-incidents"
  role          = aws_iam_role.lambda_exec_role.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.10"

  filename         = "${path.module}/../lambda_src/list_incidents.zip"
  source_code_hash = filebase64sha256("${path.module}/../lambda_src/list_incidents.zip")
}
