variable "name" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "security_group_id" {
  type = string
}

variable "instance_type" {
  type    = string
  default = "g5.xlarge"
}

variable "instance_profile_name" {
  type = string
}

variable "user_data" {
  type = string
}

variable "min_size" {
  type    = number
  default = 1
}

variable "max_size" {
  type    = number
  default = 3
}

variable "desired_capacity" {
  type    = number
  default = 1
}

variable "tags" {
  type    = map(string)
  default = {}
}
