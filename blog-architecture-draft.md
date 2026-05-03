# Blog Architecture and Repository Strategy Draft

## Target Setup

- Keep two application repositories:
  - `zhenwei-dev-site` for `zhenwei.dev`
  - `zhenwei-blog` for `blog.zhenwei.dev`
- Keep infrastructure either:
  - Option A (recommended): one shared infra repo plus per-app Terraform in each app repo
  - Option B: Terraform fully inside each app repo, with careful separation and remote state references

Option A scales better once environments grow.

## Repository Layout Draft

### `zhenwei-dev-site`

- `site` (React app + `public/data` JSON)
- `terraform` (resources for `zhenwei.dev` app stack only)
- `.github/workflows` (`deploy-main`, validate, optional preview)
- `docs` (optional architecture notes)

### `zhenwei-blog`

- `blog-app` (static blog app or framework-generated static output)
- `content` (Markdown or MDX posts)
- `terraform` (resources for `blog.zhenwei.dev` app stack only)
- `.github/workflows` (`deploy-blog`, content validation, optional preview)

### `zhenwei-cloud-foundation` (optional but recommended)

- `terraform/global-dns` (public hosted zone if centrally owned)
- `terraform/certs` (wildcard/shared cert strategy if desired)
- `terraform/iam-oidc` (shared GitHub OIDC provider and role patterns)
- `terraform/modules` (reusable modules: `s3-static-site`, `cloudfront-site`, `github-oidc-role`)

## Terraform Boundary Map

### Shared (foundation)

- Route53 hosted zone ownership
- Reusable IAM/OIDC module patterns
- Optional shared ACM strategy

### Per-app (main or blog)

- S3 bucket
- CloudFront distribution
- Route53 alias records for that app host
- App deploy IAM role policy scope
- Cache policies and invalidation behavior
- App-specific outputs (`bucket_name`, `distribution_id`, `role_arn`)

This keeps blast radius small and avoids cross-site accidental changes.

## Blog Architecture Phases

### Phase 1 (recommended now): Static blog

- Content in Markdown or MDX
- Build generates static pages
- Deploy to S3 + CloudFront
- No database and no server runtime

### Phase 2 (optional): Headless CMS

- Continue static builds
- Pull content from CMS at build time
- Keep CDN model and low ops burden

### Phase 3 (only when required): Server + database

- Introduce only if needed for auth, drafts/roles, comments, advanced search, or personalization

## CI/CD Draft

### Main repo workflow

- Trigger on main-site app or data changes
- Build app
- Sync to app S3 bucket
- CloudFront invalidation
- Keep manual trigger available for safety

### Blog repo workflow

- Trigger on content or blog-app changes
- Validate frontmatter/content schema
- Build static blog
- Sync to blog S3 bucket
- CloudFront invalidation
- Keep manual trigger available for safety

## Environment Strategy

- Start with one production environment
- Add dev/staging later when needed
- Use Terraform workspaces or separate state keys per environment
- Keep separate deploy roles per environment for least privilege

## Naming Draft

- Main domain: `zhenwei.dev`
- Blog domain: `blog.zhenwei.dev`
- Buckets (example): `zhenwei-dev-site-prod`, `zhenwei-blog-prod`
- CloudFront distributions: one per app
- IAM deploy roles: `github-deploy-main-prod`, `github-deploy-blog-prod`

## Recommended Immediate Next Moves

1. Commit and push current baseline in main repo (manual-only deploy is already in place).
2. Create `zhenwei-blog` repo with static-first blog skeleton.
3. Start blog as static Markdown-based content system.
4. Reuse the same OIDC + S3 + CloudFront deployment pattern from main site.
5. Add shared modules later once both stacks are stable.
