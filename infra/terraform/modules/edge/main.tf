resource "aws_security_group" "alb" {
  name        = "${var.name}-alb"
  description = "ALB security group"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, { Name = "${var.name}-alb" })
}

resource "aws_lb" "this" {
  name               = "${var.name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids
  idle_timeout       = 60
  enable_deletion_protection = var.enable_deletion_protection
  tags = merge(var.tags, { Name = "${var.name}-alb" })
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.this.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.acm_certificate_arn

  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "Not configured"
      status_code  = "503"
    }
  }
}

resource "aws_wafv2_web_acl" "this" {
  name        = "${var.name}-waf"
  description = "Protects ALB"
  scope       = "REGIONAL"
  default_action {
    allow {}
  }
  rule {
    name     = "rate-limit"
    priority = 1
    action {
      block {}
    }
    statement {
      rate_based_statement {
        limit              = 1000
        aggregate_key_type = "IP"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name}-rate-limit"
      sampled_requests_enabled   = true
    }
  }
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.name}-waf"
    sampled_requests_enabled   = true
  }
  tags = var.tags
}

resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = aws_lb.this.arn
  web_acl_arn  = aws_wafv2_web_acl.this.arn
}

resource "aws_cognito_user_pool" "this" {
  name                = "${var.name}-user-pool"
  auto_verified_attributes = ["email"]
  mfa_configuration   = "OFF"
  schema {
    name                = "tenant_id"
    attribute_data_type = "String"
    mutable             = true
  }
  tags = var.tags
}

resource "aws_cognito_user_pool_client" "this" {
  name         = "${var.name}-app"
  user_pool_id = aws_cognito_user_pool.this.id
  generate_secret = false
  explicit_auth_flows = ["ALLOW_REFRESH_TOKEN_AUTH", "ALLOW_USER_SRP_AUTH"]
  callback_urls       = var.cognito_callback_urls
  logout_urls         = var.cognito_logout_urls
  supported_identity_providers = ["COGNITO"]
}

output "alb_dns_name" {
  value = aws_lb.this.dns_name
}

output "listener_arn" {
  value = aws_lb_listener.https.arn
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.this.id
}

output "cognito_app_client_id" {
  value = aws_cognito_user_pool_client.this.id
}

output "alb_security_group_id" {
  value = aws_security_group.alb.id
}
