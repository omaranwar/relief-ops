terraform {
  required_providers {
    aws = {
        source = "hashicorp/aws"
        version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "value"
    key = "value"
    region = var.region
  }
}

provider "aws" {
    region = var.region
  
}

