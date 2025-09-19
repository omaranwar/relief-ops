output "website_URL" {
  description = "The URL of the Cloudfront distribution"
  value = aws_cloudfront_distribution.web_app_cloudfront_distribution.domain_name
}

output "api_gateway_url" {
  description = "Base URL for the API Gateway"
  value       = aws_apigatewayv2_stage.api_gateway_stage.invoke_url
}
