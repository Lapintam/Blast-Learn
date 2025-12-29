terraform {
  required_version = ">= 1.6.0"
  backend "s3" {}
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

locals {
  tags = merge(var.tags, {
    environment = var.environment
  })
}

module "network" {
  source   = "../../modules/network"
  name     = "${var.project}-${var.environment}"
  vpc_cidr = var.vpc_cidr
  azs      = var.azs
  tags     = local.tags
}

module "edge" {
  source                  = "../../modules/edge"
  name                    = "${var.project}-${var.environment}"
  vpc_id                  = module.network.vpc_id
  public_subnet_ids       = module.network.public_subnet_ids
  acm_certificate_arn     = var.acm_certificate_arn
  enable_deletion_protection = var.environment != "dev"
  cognito_callback_urls   = var.cognito_callback_urls
  cognito_logout_urls     = var.cognito_logout_urls
  tags                    = local.tags
}

module "tenant_store" {
  source      = "../../modules/tenant_store"
  bucket_name = var.rag_bucket_name
  tags        = local.tags
}

module "ecs_web" {
  source                 = "../../modules/ecs_web"
  name                   = "${var.project}-${var.environment}"
  image                  = var.web_image
  region                 = var.region
  vpc_id                 = module.network.vpc_id
  private_subnet_ids     = module.network.private_subnet_ids
  alb_security_group_id  = module.edge.alb_security_group_id
  listener_arn           = module.edge.listener_arn
  host_names             = var.web_hostnames
  environment            = var.web_environment
  desired_count          = var.web_desired_count
  tags                   = local.tags
}

module "rds" {
  source                    = "../../modules/rds"
  name                      = "${var.project}-${var.environment}"
  vpc_id                    = module.network.vpc_id
  private_subnet_ids        = module.network.private_subnet_ids
  allowed_security_group_ids = [module.ecs_web.service_security_group_id]
  master_username           = var.db_username
  master_password           = var.db_password
  deletion_protection       = var.environment != "dev"
  tags                      = local.tags
}

module "ollama" {
  source              = "../../modules/ollama_asg"
  name                = "${var.project}-${var.environment}"
  private_subnet_ids  = module.network.private_subnet_ids
  security_group_id   = module.ecs_web.service_security_group_id
  instance_profile_name = var.ollama_instance_profile
  user_data           = var.ollama_user_data
  tags                = local.tags
}

module "ops" {
  source            = "../../modules/ops"
  name              = "${var.project}-${var.environment}"
  ssm_config_prefix = var.ssm_config_prefix
  tags              = local.tags
}
