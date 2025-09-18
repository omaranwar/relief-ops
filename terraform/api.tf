resource "aws_apigatewayv2_api" "api_gateway" {
  name          = "${var.project_name}-Api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_methods = ["GET", "POST", "PUT", "DELETE"]
    allow_headers = ["*"]
    allow_origins = ["*"]
  }
}

#Api gateway integrations and routes

resource "aws_apigatewayv2_integration" "get_action_plan_integration" {
  api_id           = aws_apigatewayv2_api.api_gateway.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.get_action_plan_function.arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "create_incident_integration" {
  api_id           = aws_apigatewayv2_api.api_gateway.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.create_incident_function.arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "list_incidents_integration" {
  api_id           = aws_apigatewayv2_api.api_gateway.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.list_incidents_function.arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_action_plan_route" {
  api_id = aws_apigatewayv2_api.api_gateway.id
  route_key = "POST /v1/actionPlan"
  target = "integrations/${aws_apigatewayv2_integration.get_action_plan_integration.id}"
}

resource "aws_apigatewayv2_route" "create_incident_route" {
  api_id = aws_apigatewayv2_api.api_gateway.id
  route_key = "POST /v1/incident"
  target = "integrations/${aws_apigatewayv2_integration.create_incident_integration.id}"
}

resource "aws_apigatewayv2_route" "list_incidents_route" {
  api_id = aws_apigatewayv2_api.api_gateway.id
  route_key = "GET /v1/incidents"
  target = "integrations/${aws_apigatewayv2_integration.list_incidents_integration.id}"
}

resource "aws_apigatewayv2_stage" "api_gateway_stage" {
  api_id = aws_apigatewayv2_api.api_gateway.id
  name = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "api_gateway_permission_get_action_plan" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_action_plan_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api_gateway.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_permission_create_incident" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create_incident_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api_gateway.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_permission_list_incidents" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.list_incidents_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api_gateway.execution_arn}/*/*"
}