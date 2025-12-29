variable "name" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "vpc_id" {
  type = string
}

variable "allowed_security_group_ids" {
  type    = list(string)
  default = []
}

variable "instance_class" {
  type    = string
  default = "db.r6g.large"
}

variable "allocated_storage" {
  type    = number
  default = 100
}

variable "max_allocated_storage" {
  type    = number
  default = 1000
}

variable "engine_version" {
  type    = string
  default = "15.5"
}

variable "master_username" {
  type = string
}

variable "master_password" {
  type      = string
  sensitive = true
}

variable "deletion_protection" {
  type    = bool
  default = true
}

variable "tags" {
  type    = map(string)
  default = {}
}
