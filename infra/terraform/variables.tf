variable "project" { type = string }
variable "environment" { type = string }
variable "aws_region" { type = string  default = "us-east-1" }
variable "vpc_cidr" { type = string  default = "10.20.0.0/16" }
variable "public_subnet_cidrs" { type = list(string) default = ["10.20.1.0/24", "10.20.2.0/24"] }
variable "private_subnet_cidrs" { type = list(string) default = ["10.20.11.0/24", "10.20.12.0/24"] }
variable "alb_oidc_client_id" { type = string }
variable "alb_oidc_client_secret" { type = string  sensitive = true }
variable "alb_oidc_issuer" { type = string }
variable "allowed_cidrs" { type = list(string) default = ["0.0.0.0/0"] }
variable "instance_type" { type = string default = "m6i.large" }
variable "asg_min_size" { type = number default = 2 }
variable "asg_max_size" { type = number default = 6 }
variable "asg_desired_capacity" { type = number default = 2 }
variable "enable_spot" { type = bool default = true }
variable "key_name" { type = string default = null }
