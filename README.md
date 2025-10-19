# ReliefOps AI Dashboard

## Overview

This README provides step-by-step instructions for deploying the **ReliefOps Disaster Response Dashboard**, including infrastructure deployment on AWS using **Terraform**, and running the **React frontend locally or via AWS S3 + CloudFront**.

---

## Prerequisites

Before starting, ensure the following tools and permissions are available:

### ✅ AWS Access

- **IAM Access**: You must have access to the target AWS account. Configure this either via:

  - AWS CLI with access and secret keys, or
  - AWS SSO (Single Sign-On)

- **Permissions**: Ensure your IAM user or role has the following AWS permissions:

  - Lambda
  - S3
  - DynamoDB
  - CloudFront
  - API Gateway (HTTP APIs - V2)
  - AWS Bedrock

### ✅ Tools

- **Terraform**: Install the [Terraform CLI](https://developer.hashicorp.com/terraform/downloads).
- **Node.js & npm**: Required to run and build the frontend. You can download both from [nodejs.org](https://nodejs.org/).
- **AWS CLI**: Required for deploying frontend assets to S3. Install it from [AWS CLI docs](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html).

---

## Deployment Guide

### 1. Configure S3 Bucket Name (Important)

Before deploying the infrastructure, edit the `terraform/variables.tf` file and set a unique name for the S3 bucket used by the frontend app.

```hcl
variable "s3_bucket_name" {
  default = "your-unique-app-bucket-name"
}
```

> ⚠️ **The S3 bucket name must be globally unique** across AWS.

---

### 2. Deploy AWS Infrastructure (via Terraform)

1. Navigate to the `terraform` directory:

   ```bash
   cd terraform
   ```

2. Initialize the Terraform project:

   ```bash
   terraform init
   ```

3. Set the AWS CLI profile to use:

   ```bash
   export AWS_PROFILE=your_profile_name
   ```

4. Apply the Terraform configuration:

   ```bash
   terraform apply -auto-approve
   ```

5. After deployment, **note down the API Gateway URL** and **CloudFront domain** — you'll need these for the frontend.

---

### 3. Run the React Frontend Locally

1. Navigate to the `web` directory at the project root:

   ```bash
   cd ../web
   ```

2. Create a file named `.env.local` and add the following environment variable, replacing the placeholder with your API Gateway URL:

   ```env
   VITE_API_BASE=https://your-api-gateway-url.com
   ```

3. Install frontend dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the provided `localhost` link in your browser to view the web app.

---

### 4. (Optional) Deploy Frontend to AWS S3 + CloudFront

To serve the frontend from AWS instead of locally:

1. Build the frontend app:

   ```bash
   npm run build
   ```

2. Sync the contents of the `dist/` folder to your deployed S3 bucket (replace `<your-bucket-name>` with the one you set earlier):

   ```bash
   aws s3 sync dist/ s3://<your-bucket-name> --delete
   ```

3. Once synced, access the app via the **CloudFront domain** output by Terraform.

> ✅ **Note**: The CloudFront distribution is already configured to serve content from your S3 bucket with appropriate caching and routing rules.

---

## Notes

- Keep `.env.local` out of version control to protect sensitive data.
- If using AWS SSO, make sure your session is active when running AWS CLI or Terraform commands.

---
