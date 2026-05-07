# Branching, Environment, and Deployment Strategy

## Purpose

This document defines the next delivery model for the portfolio so the repository demonstrates stronger DevOps practices without adding unnecessary complexity.

The recommended next step is a two-environment setup:

- `dev` for automatic integration deployments
- `main` for manual production releases

This intentionally excludes a staging environment for now. A `stg` environment is possible later, but it would add infrastructure and workflow overhead without much immediate value for this project.

## Current State

The repository currently implements a single environment with a manual deployment workflow.

Current implementation:

- Frontend: React SPA built with Vite
- Runtime content: static JSON files under `site/public/data/`
- Deployment workflow: manual `workflow_dispatch`
- Deploy modes: `app` and `data`
- Infrastructure: one S3 bucket, one CloudFront distribution, one Route53 site domain, one ACM certificate, one GitHub OIDC deploy role
- OIDC trust policy: restricted to one branch via `github_branch`

Relevant files:

- `.github/workflows/deploy.yml`
- `terraform/variables.tf`
- `terraform/iam.tf`
- `terraform/storage.tf`
- `terraform/cdn.tf`
- `terraform/dns.tf`
- `terraform/outputs.tf`

## Recommended Branch Strategy

Long-lived branches:

- `dev`
- `main`

Short-lived branches:

- `feature/*`
- `fix/*`
- `chore/*`

Recommended development flow:

1. Create a feature branch from `dev`.
2. Open a pull request into `dev`.
3. Merge into `dev` after review and required checks pass.
4. GitHub Actions deploys the `dev` environment automatically.
5. When the `dev` environment is validated, open a pull request from `dev` into `main`.
6. Merge into `main` after final review.
7. Trigger the production deployment manually from GitHub Actions.

### Why feature branches should come from `dev`

If `dev` is the shared integration branch, feature work should branch from `dev`, not `main`.

That keeps the promotion path honest:

- feature work is integrated in `dev`
- validated work is promoted to `main`
- production releases come only from `main`

## Recommended Environment Model

### Development environment

Purpose:

- fast feedback for integrated feature work
- shared validation environment
- automatic deployment target for `dev`

Recommended domain:

- `dev.zhenwei.dev`

Deployment trigger:

- automatic on push to `dev`

Controls:

- build must pass
- optional JSON validation
- optional smoke test after deploy
- no manual approval required

### Production environment

Purpose:

- public site
- stable and intentional releases

Recommended domain:

- `zhenwei.dev`

Deployment trigger:

- manual `workflow_dispatch` from `main`

Controls:

- protected GitHub Environment
- manual approval required before deploy
- deploy only from `main`

## Deployment Workflow Strategy

## Development deployment

Recommended workflow behavior:

- trigger on push to `dev`
- build app when source changes
- allow data-only deploy when only content changes
- deploy to the `dev` GitHub Environment
- invalidate CloudFront paths appropriately

Recommended workflow file:

- `.github/workflows/deploy-dev.yml`

Recommended deploy types:

- `app`
- `data`

## Production deployment

Recommended workflow behavior:

- trigger only with `workflow_dispatch`
- run only from `main`
- require approval through GitHub Environments
- support both `app` and `data` deploy types if desired

Recommended workflow file:

- `.github/workflows/deploy-prod.yml`

## Can GitHub Actions be scheduled?

Yes. GitHub Actions supports cron-based scheduling with the `schedule` trigger.

Example:

```yaml
on:
  schedule:
    - cron: "0 1,13 * * *"
```

That would run twice per day at 01:00 and 13:00 UTC.

For this repository, scheduled deployment is not recommended yet because there is no staging environment and production is intended to remain manual. Scheduling could still be useful later for:

- smoke tests
- link checks
- Lighthouse checks
- content validation jobs

## Terraform Strategy

The current Terraform stack is single-environment oriented.

Current limitations:

- one `domain_name`
- one `github_branch`
- one S3 bucket
- one CloudFront distribution
- one Route53 alias target
- one IAM OIDC deploy role

To support `dev` and `prod`, Terraform should become environment-aware.

## Recommended Terraform Model

Use one reusable Terraform codebase with environment-specific variable files.

Recommended environment variable:

- `environment = "dev" | "prod"`

Recommended tfvars files:

- `terraform/dev.tfvars`
- `terraform/prod.tfvars`

Recommended state key separation:

- `zhenwei-dev-site/dev/terraform.tfstate`
- `zhenwei-dev-site/prod/terraform.tfstate`

This keeps environments isolated while reusing the same modules and resources.

## Terraform Changes Required

### 1. variables.tf

Current limitation:

- `github_branch` is a single string

Recommended changes:

- add `environment`
- add either `site_domain` or `subdomain_prefix`
- replace `github_branch` with `github_branches` as `list(string)` or create separate per-environment roles

Preferred direction:

- one role per environment instead of one shared role

### 2. main.tf locals

Current behavior:

- bucket name derives from `domain_name`

Recommended changes:

- derive the effective site domain from environment
- derive bucket names from environment
- add common environment tags

Suggested domain model:

- `prod` -> `zhenwei.dev`
- `dev` -> `dev.zhenwei.dev`

Suggested bucket naming model:

- `zhenwei-dev-prod`
- `zhenwei-dev-dev`

Or, if you want stronger consistency with the repo name:

- `zhenwei-dev-site-prod`
- `zhenwei-dev-site-dev`

### 3. storage.tf

Current behavior:

- creates one private site bucket

Required changes:

- create one bucket per environment by applying the same stack with different tfvars
- preserve versioning and private access controls in both environments

### 4. cdn.tf

Current behavior:

- creates one CloudFront distribution and one ACM certificate for one domain

Required changes:

- create one distribution per environment
- create one certificate per environment domain in `us-east-1`
- configure aliases per environment domain

Environment mapping:

- `dev.zhenwei.dev`
- `zhenwei.dev`

### 5. dns.tf

Current behavior:

- creates Route53 A and AAAA records for one site domain

Required changes:

- create records for `dev.zhenwei.dev`
- keep production records for `zhenwei.dev`

### 6. iam.tf

Current behavior:

- one OIDC role allows a single branch to assume the deploy role

Required changes:

- create a dev deploy role trusted by `refs/heads/dev`
- create a prod deploy role trusted by `refs/heads/main`

Recommended outputs:

- `dev_github_deploy_role_arn`
- `prod_github_deploy_role_arn`

This is cleaner than a shared role because it gives clearer least-privilege boundaries and simpler GitHub Environment configuration.

### 7. outputs.tf

Current behavior:

- outputs a single bucket, distribution, and role ARN

Required changes:

- output environment-specific values per stack
- if separate stacks are applied independently, each stack can keep the same output names and rely on separate state

Recommended simple approach:

- keep output names the same
- apply `dev.tfvars` and `prod.tfvars` independently
- wire each environment to its own GitHub Environment secrets and variables

## GitHub Actions Changes Required

## Option A: Separate workflows per environment

Recommended starting point.

Advantages:

- easier to explain in a portfolio
- easier to debug
- clearer ownership and trigger rules

Recommended files:

- `.github/workflows/deploy-dev.yml`
- `.github/workflows/deploy-prod.yml`

### deploy-dev.yml

Recommended behavior:

- trigger on push to `dev`
- optionally restrict with path filters to `site/**` and `.github/workflows/**`
- build app when needed
- support data-only deploy path if you want to optimize
- assume dev AWS role
- deploy to dev bucket and distribution

### deploy-prod.yml

Recommended behavior:

- trigger on `workflow_dispatch`
- guard to ensure branch is `main`
- require prod environment approval
- assume prod AWS role
- deploy to prod bucket and distribution

## Option B: One workflow with environment input

This is also viable, but less clear for demonstration purposes.

Recommendation:

- start with separate workflows
- refactor to reusable workflows later only if duplication becomes significant

## GitHub Environment Configuration

Create GitHub Environments:

- `dev`
- `prod`

Recommended secrets and variables per environment:

Secrets:

- `AWS_ROLE_ARN`

Variables:

- `AWS_REGION`
- `S3_BUCKET_NAME`
- `CLOUDFRONT_DISTRIBUTION_ID`

Recommended protections:

- `dev`: no approval required
- `prod`: required reviewers before deployment

## Code and Repository Changes Required

### 1. Update repository documentation

Files to update:

- `README.md`
- `site/public/data/aws-static-hosting.json`
- optionally `docs/enhancements/summary.md`

Documentation should clearly distinguish:

- current implementation
- planned environment expansion

### 2. Keep app code environment-agnostic

The React app itself does not need separate environment logic for this strategy.

Why:

- all environment differences are in DNS, bucket, CDN, and deploy workflow
- the app is static and reads the same shape of JSON data

Potential future enhancement:

- add a small environment badge for `dev` builds if you want visible non-production branding

### 3. Keep data-only deployment support

The current split between app deploy and data-only deploy is good and should be preserved.

Why:

- it demonstrates separation of code and content
- it reduces unnecessary rebuilds
- it is a good portfolio example of deployment optimization

## Suggested Implementation Phases

### Phase 1

Refactor Terraform for environment-aware naming and separate state.

Deliverables:

- `environment` variable
- dev/prod tfvars
- environment-specific domains
- environment-specific bucket/distribution names

### Phase 2

Create dev environment resources.

Deliverables:

- `dev.zhenwei.dev`
- dev S3 bucket
- dev CloudFront distribution
- dev ACM certificate
- dev Route53 records
- dev GitHub OIDC role

### Phase 3

Create dev deployment workflow.

Deliverables:

- auto deploy on push to `dev`
- optional data-only optimization
- optional smoke test after deploy

### Phase 4

Split production deployment workflow.

Deliverables:

- manual deploy only from `main`
- GitHub Environment approval
- prod-specific AWS role and repo variables

### Phase 5

Add quality and operational checks.

Suggested checks:

- JSON validation
- build validation
- post-deploy smoke test
- optional scheduled health or quality job

## Recommendation Summary

Recommended next architecture:

- `dev` branch -> automatic deploy to `dev.zhenwei.dev`
- `main` branch -> manual approved deploy to `zhenwei.dev`

Recommended implementation stance:

- do not add staging yet
- keep the app/data deployment split
- use separate deploy roles and GitHub Environments for dev and prod
- keep the React app itself environment-agnostic

This gives a strong and credible DevOps demonstration without introducing unnecessary moving parts.