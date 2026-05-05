# zhenwei.dev portfolio site

Personal DevOps CV portfolio site hosted on AWS with Terraform-managed infrastructure and GitHub Actions CI/CD.

## Architecture

- Frontend: Static HTML/CSS/JavaScript in site/
- Hosting: Amazon S3 (private bucket)
- CDN: Amazon CloudFront with Origin Access Control
- DNS: Amazon Route53
- TLS: ACM certificate in us-east-1
- CI/CD: GitHub Actions with OIDC (no static AWS keys)

Request flow:

User -> Route53 -> CloudFront -> S3

## Repository structure

- site/: portfolio frontend files
- terraform/: IaC for S3, CloudFront, Route53, ACM, IAM OIDC role
- .github/workflows/: all CI/CD automation — the only deployment path

## Prerequisites

### Already assumed to exist

- A registered domain (e.g. `example.com`) with a public Route53 hosted zone already created in AWS
- An AWS account with sufficient IAM permissions to create S3, CloudFront, ACM, Route53 records, and IAM resources
- An S3 bucket for Terraform remote state — this must exist before running `terraform init`. Create it manually once:
  ```bash
  aws s3api create-bucket \
    --bucket your-terraform-state-bucket \
    --region ap-southeast-1 \
    --create-bucket-configuration LocationConstraint=ap-southeast-1
  aws s3api put-bucket-versioning \
    --bucket your-terraform-state-bucket \
    --versioning-configuration Status=Enabled
  ```
  Then update the `bucket` value in the `backend "s3"` block in `terraform/providers.tf` to match.

### Local tooling (for one-time infrastructure bootstrap only)

- Terraform >= 1.15
- AWS CLI v2 configured with credentials that can bootstrap the infrastructure

### GitHub repository configuration (required before first deploy)

After running `terraform apply`, configure the following in GitHub repo **Settings → Secrets and variables → Actions**:

**Secrets** (encrypted, never exposed in logs):

| Name | Value |
|---|---|
| `AWS_ROLE_ARN` | IAM role ARN from `terraform output github_deploy_role_arn` |

**Variables** (non-sensitive, visible in logs):

| Name | Value |
|---|---|
| `AWS_REGION` | AWS region used in your tfvars (e.g. `ap-southeast-1`) |
| `S3_BUCKET_NAME` | Bucket name from `terraform output s3_bucket_name` |
| `CLOUDFRONT_DISTRIBUTION_ID` | Distribution ID from `terraform output cloudfront_distribution_id` |

## 1) Bootstrap infrastructure (one-time, local)

Terraform is run locally once to create the AWS resources. After that, all deployments are driven by GitHub Actions.

1. Copy terraform/terraform.tfvars.example to terraform/terraform.tfvars and update values.
2. Run:

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

3. Capture outputs:
- s3_bucket_name
- cloudfront_distribution_id
- github_deploy_role_arn

## 2) Configure GitHub repository

In GitHub repo settings:

1. Add secret:
- AWS_ROLE_ARN = output github_deploy_role_arn

2. Add variables:
- AWS_REGION = same as terraform aws_region
- S3_BUCKET_NAME = output s3_bucket_name
- CLOUDFRONT_DISTRIBUTION_ID = output cloudfront_distribution_id

## 3) Deploy website

All deployments happen automatically via GitHub Actions. Push any change to site/ on main and the workflow:

1. Authenticates to AWS using OIDC (no stored credentials)
2. Syncs static assets to S3 with correct cache headers
3. Invalidates the CloudFront distribution

## Security model

- GitHub Actions assumes AWS IAM role via OIDC
- No long-lived AWS access keys in GitHub
- S3 bucket is private; CloudFront accesses S3 through OAC
- IAM policy grants least privileges for deployment actions

## Next customization

- Replace placeholder CV sections in site/index.html with your actual experience and projects.
- Add your profile image and project screenshots in site/assets/.
- Optionally add a strict Content-Security-Policy header via CloudFront response headers policy.
