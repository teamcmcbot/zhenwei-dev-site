resource "aws_s3_bucket" "this" {
  bucket = var.bucket_name
  tags   = var.tags
}

resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id

  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Suspended"
  }
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.this.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

data "aws_iam_policy_document" "bucket" {
  statement {
    sid    = "DenyInsecureTransport"
    effect = "Deny"

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions = ["s3:*"]

    resources = [
      aws_s3_bucket.this.arn,
      "${aws_s3_bucket.this.arn}/*"
    ]

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }

  dynamic "statement" {
    for_each = length(var.reader_principal_arns) > 0 ? [1] : []
    content {
      sid    = "AllowReadForApprovedPrincipals"
      effect = "Allow"

      principals {
        type        = "AWS"
        identifiers = var.reader_principal_arns
      }

      actions = ["s3:GetObject"]

      resources = [
        "${aws_s3_bucket.this.arn}/*"
      ]
    }
  }

  dynamic "statement" {
    for_each = length(var.writer_principal_arns) > 0 ? [1] : []
    content {
      sid    = "AllowWriteForApprovedPrincipals"
      effect = "Allow"

      principals {
        type        = "AWS"
        identifiers = var.writer_principal_arns
      }

      actions = [
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:AbortMultipartUpload"
      ]

      resources = [
        "${aws_s3_bucket.this.arn}/*"
      ]
    }
  }

  dynamic "statement" {
    for_each = length(var.writer_principal_arns) > 0 ? [1] : []
    content {
      sid    = "AllowListForApprovedWriters"
      effect = "Allow"

      principals {
        type        = "AWS"
        identifiers = var.writer_principal_arns
      }

      actions = [
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ]

      resources = [
        aws_s3_bucket.this.arn
      ]
    }
  }
}

resource "aws_s3_bucket_policy" "this" {
  bucket = aws_s3_bucket.this.id
  policy = data.aws_iam_policy_document.bucket.json

  depends_on = [aws_s3_bucket_public_access_block.this]
}
