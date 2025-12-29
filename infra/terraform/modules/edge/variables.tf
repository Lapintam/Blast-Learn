variable "name" {
  type        = string
  description = "Name prefix"
}

variable "vpc_id" {
  type        = string
  description = "VPC identifier"
}

variable "public_subnet_ids" {
  type        = list(string)
  description = "Public subnet IDs"
}

variable "acm_certificate_arn" {
  type        = string
  description = "ACM certificate ARN"
}

variable "enable_deletion_protection" {
  type    = bool
  default = true
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "cognito_callback_urls" {
  type    = list(string)
  default = []
}

variable "cognito_logout_urls" {
  type    = list(string)
  default = []
}
