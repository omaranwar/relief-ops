output "website_URL" {
  description = "The URL of the Cloudfront distribution"
  value = aws_cloudfront_distribution.web_app_cloudfront_distribution.domain_name
}