# zhenwei.dev portfolio site

Personal DevOps CV portfolio site hosted on AWS with Terraform-managed infrastructure and GitHub Actions CI/CD.

## Architecture

- Frontend: React SPA built with Vite in site/
- Runtime data: JSON files served from site/public/data/
- Canonical profile payload: intro.json contains identity/about/contact/terminal content
- Hosting: Amazon S3 (private bucket)
- CDN: Amazon CloudFront with Origin Access Control
- DNS: Amazon Route53
- TLS: ACM certificate in us-east-1
- CI/CD: GitHub Actions with OIDC (no static AWS keys)

Request flow:

User -> Route53 -> CloudFront -> S3

## Repository structure

- site/: React app source, public data files, and build output
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

### GitHub Environment configuration (required before first deploy)

After running `terraform apply`, configure environment-scoped settings in GitHub:

- Go to **Settings → Environments**
- Create environments (currently `prod`, optionally `dev` later)
- Add the following values under each environment

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
| `VITE_APP_ENV` | `prod` for prod env, `dev` for dev env |
| `VITE_RESUME_MODE` | `api` in deployed environments |
| `VITE_RESUME_API_URL` | Presigned URL API endpoint for that environment |
| `VITE_RESUME_OBJECT_KEY` | `private-downloads/resume/zhenwei-seo-cv.pdf` |
| `VITE_RESUME_EXPIRY_SECONDS` | `300` |

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

## 2) Configure GitHub environments

In GitHub repository settings:

1. Open Settings -> Environments.
2. Create environment `prod`.
3. Add secret:
- AWS_ROLE_ARN = output github_deploy_role_arn
4. Add variables:
- AWS_REGION = same as terraform aws_region
- S3_BUCKET_NAME = output s3_bucket_name
- CLOUDFRONT_DISTRIBUTION_ID = output cloudfront_distribution_id
- VITE_APP_ENV = prod
- VITE_RESUME_MODE = api
- VITE_RESUME_API_URL = https://api.zhenwei.dev/get-presigned-url
- VITE_RESUME_OBJECT_KEY = private-downloads/resume/zhenwei-seo-cv.pdf
- VITE_RESUME_EXPIRY_SECONDS = 300
5. Optional: create environment `dev` with the same variable names but dev-specific values.

## 3) Deploy website

Deployments run from GitHub Actions workflow_dispatch in .github/workflows/deploy.yml.

Choose one deploy mode when running the workflow manually:

- app: build and deploy full site output
- data: deploy JSON files only from site/public/data

Choose target environment when running the workflow manually:

- prod: production variables and secrets
- dev: development variables and secrets (when configured)

Deployment flow:

1. Authenticates to AWS using OIDC (no stored credentials)
2. Syncs app assets, HTML, and JSON data to S3 with cache-control split by file type
3. Invalidates CloudFront (full path for app deploy, /data/* for data-only deploy)

## 4) Local Vite environment setup

Local runs do not read GitHub Actions variables. Configure local Vite values in `site/.env.local`.

1. Create local env file from template:

```bash
cp site/.env.example site/.env.local
```

2. Run local development:

```bash
cd site
npm run dev
```

3. To test resume download against deployed API locally, set in `site/.env.local`:

```bash
VITE_APP_ENV=prod
VITE_RESUME_MODE=api
VITE_RESUME_API_URL=https://api.zhenwei.dev/get-presigned-url
VITE_RESUME_OBJECT_KEY=private-downloads/resume/zhenwei-seo-cv.pdf
VITE_RESUME_EXPIRY_SECONDS=300
```

4. To return to local static fallback mode, set in `site/.env.local`:

```bash
VITE_APP_ENV=local
VITE_RESUME_MODE=local-static
```

Note: `VITE_*` values are embedded into frontend bundles, so do not store sensitive secrets in them.

## Local pre-commit hook (Terraform fmt)

This repository includes a shared pre-commit configuration in `.pre-commit-config.yaml`.

What it does:

- On `git commit`, if staged files include `terraform/*.tf`, it runs `terraform fmt -check -recursive terraform`.
- If formatting changes are needed, commit stops and shows which files are not formatted.
- Then run `terraform fmt -recursive terraform`, stage changes, and commit again.

One-time local setup:

```bash
pip3 install pre-commit
pre-commit install
```

Manual run (all files):

```bash
pre-commit run --all-files
```

CI should still enforce formatting with `terraform fmt -check -recursive` for repository-level enforcement.

## Security model

- GitHub Actions assumes AWS IAM role via OIDC
- No long-lived AWS access keys in GitHub
- S3 bucket is private; CloudFront accesses S3 through OAC
- IAM policy grants least privileges for deployment actions

## Next customization

- Update content under site/public/data/ (intro.json, skills.json, certifications.json, experiences.json, projects.json, aws-static-hosting.json).
- Use npm run dev in site/ for local iteration and npm run build for production validation.
- Add your profile image and project screenshots under site/public/assets/.
- Optionally add a strict Content-Security-Policy header via CloudFront response headers policy.
