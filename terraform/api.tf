# -----------------------------
# API Gateway
# -----------------------------
resource "aws_apigatewayv2_api" "api_gateway" {
  name          = "${var.project_name}-Api-main"
  protocol_type = "HTTP"

  cors_configuration {
    allow_methods = ["GET", "POST", "PUT", "DELETE"]
    allow_headers = ["*"]
    allow_origins = ["*"]
  }
}

# -----------------------------
# Lambda Integrations
# -----------------------------
# Common Lambda for recalculation (used by multiple routes)
resource "aws_apigatewayv2_integration" "recalc_lambda_integration" {
  api_id                 = aws_apigatewayv2_api.api_gateway.id
  integration_type       = "AWS_PROXY"
  integration_uri        = "arn:aws:lambda:us-east-1:430118817587:function:reliefops-recalc-eta"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "get_action_plan_integration" {
  api_id                 = aws_apigatewayv2_api.api_gateway.id
  integration_type       = "AWS_PROXY"
  integration_uri        = "arn:aws:lambda:us-east-1:430118817587:function:reliefops-get-action-plan"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "create_incident_integration" {
  api_id                 = aws_apigatewayv2_api.api_gateway.id
  integration_type       = "AWS_PROXY"
  integration_uri        = "arn:aws:lambda:us-east-1:430118817587:function:reliefops-create-incident"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "list_incidents_integration" {
  api_id                 = aws_apigatewayv2_api.api_gateway.id
  integration_type       = "AWS_PROXY"
  integration_uri        = "arn:aws:lambda:us-east-1:430118817587:function:reliefops-list-incidents"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "delete_incident_integration" {
  api_id                 = aws_apigatewayv2_api.api_gateway.id
  integration_type       = "AWS_PROXY"
  integration_uri        = "arn:aws:lambda:us-east-1:430118817587:function:reliefops-delete-incident"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "stock_update_integration" {
  api_id                 = aws_apigatewayv2_api.api_gateway.id
  integration_type       = "AWS_PROXY"
  integration_uri        = "arn:aws:lambda:us-east-1:430118817587:function:reliefops-stock-update"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "stock_get_integration" {
  api_id                 = aws_apigatewayv2_api.api_gateway.id
  integration_type       = "AWS_PROXY"
  integration_uri        = "arn:aws:lambda:us-east-1:430118817587:function:reliefops-stock-get"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "summary_integration" {
  api_id                 = aws_apigatewayv2_api.api_gateway.id
  integration_type       = "AWS_PROXY"
  integration_uri        = "arn:aws:lambda:us-east-1:430118817587:function:reliefops-summary"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "publish_sitrep_integration" {
  api_id                 = aws_apigatewayv2_api.api_gateway.id
  integration_type       = "AWS_PROXY"
  integration_uri        = "arn:aws:lambda:us-east-1:430118817587:function:reliefops-publish-sitrep"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "logistics_reserve_integration" {
  api_id                 = aws_apigatewayv2_api.api_gateway.id
  integration_type       = "AWS_PROXY"
  integration_uri        = "arn:aws:lambda:us-east-1:430118817587:function:reliefops-logistics-reserve"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "depots_near_integration" {
  api_id                 = aws_apigatewayv2_api.api_gateway.id
  integration_type       = "AWS_PROXY"
  integration_uri        = "arn:aws:lambda:us-east-1:430118817587:function:reliefops-depots-near"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "close_incident_integration" {
  api_id                 = aws_apigatewayv2_api.api_gateway.id
  integration_type       = "AWS_PROXY"
  integration_uri        = "arn:aws:lambda:us-east-1:430118817587:function:reliefops-close-incident"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "notify_integration" {
  api_id                 = aws_apigatewayv2_api.api_gateway.id
  integration_type       = "AWS_PROXY"
  integration_uri        = "arn:aws:lambda:us-east-1:430118817587:function:reliefops-notify"
  payload_format_version = "2.0"
}

# -----------------------------
# API Gateway Routes
# -----------------------------
resource "aws_apigatewayv2_route" "create_incident_route" {
  api_id    = aws_apigatewayv2_api.api_gateway.id
  route_key = "POST /v1/incident"
  target    = "integrations/${aws_apigatewayv2_integration.create_incident_integration.id}"
}

resource "aws_apigatewayv2_route" "list_incidents_route" {
  api_id    = aws_apigatewayv2_api.api_gateway.id
  route_key = "GET /v1/incidents"
  target    = "integrations/${aws_apigatewayv2_integration.list_incidents_integration.id}"
}

resource "aws_apigatewayv2_route" "delete_incident_route" {
  api_id    = aws_apigatewayv2_api.api_gateway.id
  route_key = "POST /v1/delete"
  target    = "integrations/${aws_apigatewayv2_integration.delete_incident_integration.id}"
}

resource "aws_apigatewayv2_route" "close_incident_route" {
  api_id    = aws_apigatewayv2_api.api_gateway.id
  route_key = "POST /v1/close"
  target    = "integrations/${aws_apigatewayv2_integration.close_incident_integration.id}"
}

resource "aws_apigatewayv2_route" "eta_route" {
  api_id    = aws_apigatewayv2_api.api_gateway.id
  route_key = "POST /v1/eta"
  target    = "integrations/${aws_apigatewayv2_integration.recalc_lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "recalc_route" {
  api_id    = aws_apigatewayv2_api.api_gateway.id
  route_key = "POST /v1/recalc"
  target    = "integrations/${aws_apigatewayv2_integration.recalc_lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "id_eta_route" {
  api_id    = aws_apigatewayv2_api.api_gateway.id
  route_key = "POST /v1/{id}/eta"
  target    = "integrations/${aws_apigatewayv2_integration.recalc_lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "get_action_plan_route" {
  api_id    = aws_apigatewayv2_api.api_gateway.id
  route_key = "POST /v1/actionPlan"
  target    = "integrations/${aws_apigatewayv2_integration.get_action_plan_integration.id}"
}

resource "aws_apigatewayv2_route" "plan_route" {
  api_id    = aws_apigatewayv2_api.api_gateway.id
  route_key = "GET /v1/plan/{incidentId}"
  target    = "integrations/${aws_apigatewayv2_integration.get_action_plan_integration.id}"
}

resource "aws_apigatewayv2_route" "stock_update_route" {
  api_id    = aws_apigatewayv2_api.api_gateway.id
  route_key = "POST /v1/update"
  target    = "integrations/${aws_apigatewayv2_integration.stock_update_integration.id}"
}

resource "aws_apigatewayv2_route" "stock_get_route" {
  api_id    = aws_apigatewayv2_api.api_gateway.id
  route_key = "GET /v1/stock/{city}"
  target    = "integrations/${aws_apigatewayv2_integration.stock_get_integration.id}"
}

resource "aws_apigatewayv2_route" "summary_route" {
  api_id    = aws_apigatewayv2_api.api_gateway.id
  route_key = "GET /v1/summary"
  target    = "integrations/${aws_apigatewayv2_integration.summary_integration.id}"
}

resource "aws_apigatewayv2_route" "publish_sitrep_route" {
  api_id    = aws_apigatewayv2_api.api_gateway.id
  route_key = "POST /v1/sitrep"
  target    = "integrations/${aws_apigatewayv2_integration.publish_sitrep_integration.id}"
}

resource "aws_apigatewayv2_route" "logistics_reserve_route" {
  api_id    = aws_apigatewayv2_api.api_gateway.id
  route_key = "POST /v1/logistics/reserve"
  target    = "integrations/${aws_apigatewayv2_integration.logistics_reserve_integration.id}"
}

resource "aws_apigatewayv2_route" "depots_near_route" {
  api_id    = aws_apigatewayv2_api.api_gateway.id
  route_key = "GET /v1/depotsNear"
  target    = "integrations/${aws_apigatewayv2_integration.depots_near_integration.id}"
}

resource "aws_apigatewayv2_route" "notify_route" {
  api_id    = aws_apigatewayv2_api.api_gateway.id
  route_key = "POST /v1/notify"
  target    = "integrations/${aws_apigatewayv2_integration.notify_integration.id}"
}

# -----------------------------
# API Gateway Stage
# -----------------------------
resource "aws_apigatewayv2_stage" "api_gateway_stage" {
  api_id      = aws_apigatewayv2_api.api_gateway.id
  name        = "$default"
  auto_deploy = true
}

# -----------------------------
# Lambda Permissions
# -----------------------------
locals {
  lambda_permissions = {
    "reliefops-get-action-plan"   = "GetActionPlan"
    "reliefops-create-incident"   = "CreateIncident"
    "reliefops-list-incidents"    = "ListIncidents"
    "reliefops-recalc-eta"        = "RecalcETA"
    "reliefops-delete-incident"   = "DeleteIncident"
    "reliefops-stock-update"      = "StockUpdate"
    "reliefops-stock-get"         = "StockGet"
    "reliefops-summary"           = "Summary"
    "reliefops-publish-sitrep"   = "PublishSitrep"
    "reliefops-logistics-reserve" = "LogisticsReserve"
    "reliefops-depots-near"       = "DepotsNear"
    "reliefops-close-incident"    = "CloseIncident"
    "reliefops-notify"            = "Notify"
  }
}

resource "aws_lambda_permission" "all" {
  for_each = local.lambda_permissions

  statement_id  = "AllowAPIGateway_${each.value}"
  action        = "lambda:InvokeFunction"
  function_name = each.key
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api_gateway.execution_arn}/*/*"
}
