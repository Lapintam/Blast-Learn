variable "name" {
  type = string
}

variable "image" {
  type        = string
  description = "Container image URI"
}

variable "cpu" {
  type    = number
  default = 1024
}

variable "memory" {
  type    = number
  default = 2048
}

variable "desired_count" {
  type    = number
  default = 2
}

variable "environment" {
  type    = map(string)
  default = {}
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "vpc_id" {
  type = string
}

variable "alb_security_group_id" {
  type = string
}

variable "listener_arn" {
  type = string
}

variable "listener_priority" {
  type    = number
  default = 10
}

variable "host_names" {
  type    = list(string)
  default = ["*"]
}

variable "region" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
