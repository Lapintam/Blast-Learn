variable "project" {
  type        = string
  description = "Project name"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "region" {
  type = string
}

variable "vpc_cidr" {
  type    = string
  default = "10.20.0.0/16"
}

variable "azs" {
  type    = list(string)
  default = []
}

variable "acm_certificate_arn" {
  type = string
}

variable "rag_bucket_name" {
  type = string
}

variable "web_image" {
  type = string
}

variable "web_hostnames" {
  type    = list(string)
  default = ["*.example.com"]
}

variable "web_environment" {
  type    = map(string)
  default = {}
}

variable "web_desired_count" {
  type    = number
  default = 2
}

variable "db_username" {
  type = string
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "ollama_instance_profile" {
  type = string
}

variable "ollama_user_data" {
  type    = string
  default = "#!/bin/bash\n# install ollama"
}

variable "ssm_config_prefix" {
  type    = string
  default = "/ironsight/dev"
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
