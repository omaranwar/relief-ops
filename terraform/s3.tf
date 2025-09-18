resource "aws_s3_bucket" "static_web_app_bucket" {
    bucket = var.static_web_app_bucket_name
    force_destroy = true
    
    website {
        index_document = "index.html"
    }
}

resource "aws_s3_bucket_policy" "static_web_app_bucket_policy" {
  bucket = aws_s3_bucket.static_web_app_bucket.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid = "CloudFrontReadAccess",
        Effect = "Allow",
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.origin_access_identity.iam_arn
        },
        Action = "s3:GetObject",
        Resource = "${aws_s3_bucket.static_web_app_bucket.arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket" "sitreps_bucket" {
    bucket = "${var.project_name}-sitrep-reports"
    force_destroy = true
    
}

resource "aws_s3_bucket" "bedrock_schema_bucket" {
    bucket = "${var.project_name}-bedrock-schemas"
    force_destroy = true
    
}