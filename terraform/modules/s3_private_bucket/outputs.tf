output "bucket_name" {
  description = "Private bucket name."
  value       = aws_s3_bucket.this.id
}

output "bucket_arn" {
  description = "Private bucket ARN."
  value       = aws_s3_bucket.this.arn
}
