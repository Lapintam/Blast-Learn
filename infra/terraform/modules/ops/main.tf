resource "aws_cloudwatch_log_group" "audit" {
  name              = "/ironsight/${var.name}/audit"
  retention_in_days = 30
  tags              = var.tags
}

resource "aws_ssm_parameter" "tenant_config_root" {
  name  = var.ssm_config_prefix
  type  = "String"
  value = "placeholder"
  tags  = var.tags
}

output "audit_log_group" {
  value = aws_cloudwatch_log_group.audit.name
}

output "ssm_config_prefix" {
  value = aws_ssm_parameter.tenant_config_root.name
}
