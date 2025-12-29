resource "aws_db_subnet_group" "this" {
  name       = "${var.name}-db-subnet"
  subnet_ids = var.private_subnet_ids
  tags       = var.tags
}

resource "aws_security_group" "db" {
  name        = "${var.name}-db"
  description = "Database security group"
  vpc_id      = var.vpc_id
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = var.allowed_security_group_ids
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = var.tags
}

resource "aws_db_instance" "this" {
  identifier              = "${var.name}-db"
  engine                  = "postgres"
  engine_version          = var.engine_version
  instance_class          = var.instance_class
  allocated_storage       = var.allocated_storage
  max_allocated_storage   = var.max_allocated_storage
  db_subnet_group_name    = aws_db_subnet_group.this.name
  vpc_security_group_ids  = [aws_security_group.db.id]
  username                = var.master_username
  password                = var.master_password
  skip_final_snapshot     = true
  deletion_protection     = var.deletion_protection
  backup_retention_period = 7
  publicly_accessible     = false
  performance_insights_enabled = true
  storage_encrypted       = true
  tags                    = var.tags
}

output "endpoint" {
  value = aws_db_instance.this.endpoint
}

output "security_group_id" {
  value = aws_security_group.db.id
}
