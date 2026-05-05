# Terraform Stack

This directory manages the infrastructure for the `zhenwei.dev` portfolio site.

It is intentionally scoped to the site stack, not the full DNS foundation.

What this stack owns:

- Private S3 bucket for static site assets
- CloudFront distribution in front of the bucket
- ACM certificate for the site domain
- Route53 records needed by this site
- GitHub OIDC provider and deploy role for GitHub Actions

What this stack does not own:

- The Route53 hosted zone itself
- Domain registration
- Shared DNS foundation outside this site

The hosted zone is looked up as existing infrastructure using `data "aws_route53_zone" "main"`.

## Current File Layout

- `providers.tf`: Terraform version, AWS provider requirements, S3 backend, and provider configuration
- `main.tf`: shared locals only
- `storage.tf`: private S3 bucket, versioning, public access block, ownership controls, and bucket policy
- `cdn.tf`: CloudFront OAC, ACM certificate, certificate validation, and CloudFront distribution
- `dns.tf`: existing hosted zone lookup plus ACM validation and site alias records
- `iam.tf`: GitHub OIDC provider, trust policy, deploy role, and deploy permissions
- `variables.tf`: input variables for domain, region, repo, and tags
- `outputs.tf`: values needed by GitHub Actions and operators
- `terraform.tfvars.example`: example input file with placeholders

## How The Current Configuration Works

### 1. Terraform Backend and Providers

`providers.tf` defines:

- Terraform `required_version`
- AWS provider version constraint
- S3 backend for remote state
- `use_lockfile = true` for native S3 state locking
- Default AWS provider in `var.aws_region`
- Aliased AWS provider in `us-east-1` for ACM

Why two AWS providers exist:

- Most resources are created in `var.aws_region`
- CloudFront requires ACM certificates from `us-east-1`

### 2. Existing Hosted Zone Lookup

`main.tf` starts by looking up the existing public Route53 hosted zone:

```hcl
data "aws_route53_zone" "main" {
  name         = var.hosted_zone_name
  private_zone = false
}
```

This means:

- Terraform expects the hosted zone to already exist
- Terraform will not create or destroy the hosted zone
- Terraform only manages records inside that hosted zone for this site

### 3. S3 Bucket for Site Content

This stack creates an S3 bucket derived from the domain name.

For example:

- `zhenwei.dev` becomes `zhenwei-dev`

The bucket is configured with:

- Versioning enabled
- Public access blocked
- Bucket-owner enforced object ownership

This bucket is not public. CloudFront is the only intended reader.

### 4. CloudFront Access to S3

The stack creates a CloudFront Origin Access Control (OAC) and attaches it to the distribution.

This is the modern replacement for older Origin Access Identity patterns.

The S3 bucket policy then allows read access only from the CloudFront distribution ARN.

Result:

- Users cannot browse the bucket directly
- Traffic is forced through CloudFront
- TLS, caching, and CDN delivery happen at CloudFront

### 5. ACM Certificate

The certificate is created in `us-east-1` using the aliased provider:

```hcl
resource "aws_acm_certificate" "site" {
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"
}
```

Terraform then:

- Reads ACM-generated DNS validation records
- Creates the validation CNAME records in the existing Route53 hosted zone
- Waits for certificate validation to complete

This is the correct pattern for CloudFront because CloudFront only accepts ACM certificates from `us-east-1`.

### 6. CloudFront Distribution

The distribution is configured to:

- Use the S3 bucket as origin
- Redirect HTTP to HTTPS
- Serve `index.html` as the default root object
- Use the validated ACM certificate
- Return `index.html` for 403 and 404 responses

Those custom error responses are useful for static single-page-style routing and friendly fallback behavior.

### 7. Route53 Records Managed By This Stack

This stack manages only site-specific DNS records:

- ACM validation records
- `A` alias record for `var.domain_name` to CloudFront
- `AAAA` alias record for IPv6 support to CloudFront

It does not manage the hosted zone itself.

### 8. GitHub Actions OIDC Access

The stack creates:

- An AWS IAM OIDC provider for GitHub Actions
- An IAM role trusted by that OIDC provider
- A least-privilege inline policy for deployment

The trust policy only allows a specific GitHub repository and branch to assume the role:

- Repo: `var.github_repo`
- Branch: `var.github_branch`

The deploy role can:

- List the S3 bucket
- Upload and delete objects in the bucket
- Create CloudFront invalidations

This avoids storing long-lived AWS keys in GitHub.

## Inputs

The main inputs are:

- `project_name`: naming prefix for some resources
- `domain_name`: site domain, for example `zhenwei.dev`
- `hosted_zone_name`: existing hosted zone name with trailing dot, for example `zhenwei.dev.`
- `aws_region`: main AWS region for non-ACM resources
- `github_repo`: GitHub repo allowed to deploy
- `github_branch`: branch allowed to deploy
- `tags`: extra AWS tags

Example values belong in a local `terraform.tfvars` file copied from `terraform.tfvars.example`.

## Outputs

This stack outputs:

- `s3_bucket_name`
- `cloudfront_distribution_id`
- `cloudfront_domain_name`
- `github_deploy_role_arn`

These are used to configure the GitHub Actions workflow.

## Expected Apply Flow

1. Terraform reads the existing hosted zone.
2. Terraform creates the S3 bucket and CloudFront OAC.
3. Terraform requests the ACM certificate in `us-east-1`.
4. Terraform creates Route53 validation records.
5. ACM validates the certificate.
6. Terraform creates the CloudFront distribution using that certificate.
7. Terraform creates Route53 alias records pointing the domain to CloudFront.
8. Terraform creates the GitHub OIDC provider and deploy role.

## Operational Notes

- The backend bucket in `providers.tf` is currently hardcoded. That is acceptable if you intentionally use a shared, pre-created state bucket.
- The hosted zone must already exist before `terraform apply`.
- ACM is regional, but CloudFront certificates must be created in `us-east-1`.
- Route53 hosted zones are global.
- This stack is intentionally not designed to own foundational DNS resources.

## Typical Usage

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
```

After apply, take the outputs and configure the GitHub repository with:

- Secret: `AWS_ROLE_ARN`
- Variables: `AWS_REGION`, `S3_BUCKET_NAME`, `CLOUDFRONT_DISTRIBUTION_ID`