variable "region" {
    type = string
    description = "value of aws region"
    default = "eu-west-1"
}

variable "static_web_app_bucket_name" {
    type = string
    description = "name of the web app bucket"
    default = "app.reliefops.ai"
}

variable "project_name" {
    type = string
    description = "name a unique prefix for all resources"
    default = "reliefops"
}
