output "s3_bucket_name" {
  description = "S3 bucket used for static site files."
  value       = aws_s3_bucket.site.id
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for cache invalidation."
  value       = aws_cloudfront_distribution.site.id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "github_deploy_role_arn" {
  description = "IAM role ARN for GitHub Actions OIDC deploys."
  value       = aws_iam_role.github_deploy.arn
}

output "private_bucket_name" {
  description = "Private bucket name for presigned URL files."
  value       = module.private_files_bucket.bucket_name
}

output "private_bucket_arn" {
  description = "Private bucket ARN for API repo policy wiring."
  value       = module.private_files_bucket.bucket_arn
}
