variable "name" {
  type = string
}

variable "ssm_config_prefix" {
  type    = string
  default = "/ironsight"
}

variable "tags" {
  type    = map(string)
  default = {}
}
