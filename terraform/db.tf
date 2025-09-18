resource "aws_dynamodb_table" "incidents_table" {
  name         = "${var.project_name}-Incidents"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "incidentId"

  attribute {
    name = "incidentId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "plans_table" {
  name         = "${var.project_name}-PlansAndAllocations"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "planId"

  attribute {
    name = "planId"
    type = "S"
  }
}
