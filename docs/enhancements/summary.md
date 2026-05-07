# Zhenwei DevOps Portfolio Website - Project Summary

---

## Purpose

This project builds a personal DevOps portfolio website that serves as both:

### 1. Professional Resume (CV)
- Showcase experience, skills, certifications, and projects
- Provide a clean, fast, recruiter-friendly website

### 2. DevOps Showcase Platform
- Demonstrate practical DevOps patterns:
   - Infrastructure as Code (Terraform)
   - CI/CD with GitHub Actions
   - Cloud architecture (AWS S3, CloudFront, Route53, ACM)
   - Secure auth with GitHub OIDC and IAM roles

The website itself is part of the portfolio, not just the content.

---

## Domain Structure

- zhenwei.dev: Main CV and portfolio site (this repository)
- blog.zhenwei.dev: Blog site (separate repository/project)

---

## Current Product Direction

The site is moving to a data-driven client-side architecture:

- Frontend: React SPA (planned next step)
- Content source: static JSON files fetched at runtime
- Hosting: S3 behind CloudFront
- DNS/TLS: Route53 + ACM

This allows content updates by changing JSON files while keeping infrastructure static and simple.

---

## High-Level Architecture

### Components

- App shell: `index.html` + bundled JS/CSS assets
- Data layer: `/data/*.json` files (`intro` plus section datasets)
- Hosting: AWS S3 (private bucket)
- CDN and HTTPS: AWS CloudFront
- DNS: AWS Route53
- Infrastructure: Terraform
- Deployment: GitHub Actions

### Request Flow

User -> Route53 -> CloudFront -> S3 objects

Runtime data flow:

Browser app -> `/data/*.json` via CloudFront -> S3

---

## Repository Structure (Current Baseline)

```text
zhenwei-dev-site/
├── .github/workflows/
│   └── deploy.yml
├── site/
│   ├── plan.md
│   ├── assets/
│   └── public/
│       └── data/
│           ├── intro.json
│           ├── aws-static-hosting.json
│           ├── certifications.json
│           ├── experiences.json
│           ├── projects.json
│           └── skills.json
├── terraform/
├── README.md
└── summary.md
```

Notes:

- Legacy `site/index.html`, `site/css/`, and `site/js/` were removed.
- JSON dummy data is now in place first to define the content contract before React UI implementation.

---

## Deployment Status Right Now

The deployment workflow is intentionally set to manual-only for safe baseline commits:

- Trigger enabled: `workflow_dispatch`
- Automatic `push` trigger: disabled for now

This means pushing to GitHub will not auto-deploy until deployment controls are intentionally enabled later.

---

## Target CI/CD Design (After Setup)

After Terraform apply and GitHub repo secrets/variables are configured:

1. Build React app into `site/dist`
2. Upload static assets and HTML to S3 with appropriate cache headers
3. Keep `/data/*.json` as independent runtime content files, with identity/about/contact consolidated in `intro.json`
4. Invalidate CloudFront cache (all paths or targeted data paths)

Planned improvement:

- Separate app deploys from data-only deploys so JSON updates can ship without rebuilding app bundles.

---

## Security Model

- S3 bucket remains private (no public bucket website hosting)
- CloudFront accesses S3 via Origin Access Control (OAC)
- GitHub Actions assumes AWS role via OIDC (no static access keys)
- IAM policy is scoped to required S3 and CloudFront actions

---

## Terraform Scope

Terraform manages:

- S3 bucket and access controls
- CloudFront distribution and SPA fallback behavior
- Route53 records
- ACM certificate (us-east-1 for CloudFront)
- GitHub OIDC provider + deploy IAM role/policy

---

## Outcome Goal

A production-ready portfolio that demonstrates:

- Static-first cloud architecture
- Data-driven frontend design
- Infrastructure as Code
- Secure CI/CD deployment patterns

---

## Related Planning Docs

- Blog strategy draft: [blog-architecture-draft.md](blog-architecture-draft.md)
