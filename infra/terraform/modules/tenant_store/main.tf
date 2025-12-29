resource "aws_kms_key" "tenant" {
  description             = "CMK for tenant document storage"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  tags                    = var.tags
}

resource "aws_s3_bucket" "rag" {
  bucket        = var.bucket_name
  force_destroy = false
  tags          = var.tags
}

resource "aws_s3_bucket_server_side_encryption_configuration" "rag" {
  bucket = aws_s3_bucket.rag.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.tenant.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "rag" {
  bucket = aws_s3_bucket.rag.id
  versioning_configuration {
    status = "Enabled"
  }
}

output "bucket_name" {
  value = aws_s3_bucket.rag.bucket
}

output "kms_key_arn" {
  value = aws_kms_key.tenant.arn
}
