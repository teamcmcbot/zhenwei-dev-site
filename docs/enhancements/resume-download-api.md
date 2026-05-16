# Resume Download via Presigned URL (v2 Enhancement)

## Status

Backend API and presigned URL generation are already implemented in a separate repository:

- API repo: https://github.com/teamcmcbot/zhenwei-dev-api
- Endpoint: POST https://api.zhenwei.dev/get-presigned-url
- Storage bucket: zhenwei-private-bucket
- Resume object key: private-downloads/resume/zhenwei-seo-cv.pdf

This document is updated to reflect the current live contract and the remaining integration work for this site repository.

---

## Overview

The site should request a short-lived S3 presigned URL from the existing API on demand.
The browser then downloads the file directly from S3 using the returned URL.

Benefits:

- Private S3 object remains non-public.
- Download bandwidth is served by S3, not Lambda.
- Frontend can manage clear request/download/error states.

---

## Architecture (Current)

```text
Browser (zhenwei.dev)
  |
  | POST /get-presigned-url
  | body: { objectKey, expirySeconds }
  v
API Gateway
  |
  v
Lambda (in zhenwei-dev-api)
  |
  | generates presigned S3 GetObject URL
  v
Browser receives JSON { url, fileName, expiresIn, ... }
  |
  v
Private S3 bucket: zhenwei-private-bucket
  object: private-downloads/resume/zhenwei-seo-cv.pdf
```

---

## Live API Contract

### Request

```bash
curl -i -X POST "https://api.zhenwei.dev/get-presigned-url" \
  -H "Origin: https://zhenwei.dev" \
  -H "Content-Type: application/json" \
  -d '{
    "objectKey": "private-downloads/resume/zhenwei-seo-cv.pdf",
    "expirySeconds": 300
  }'
```

### Response (200)

```json
{
  "url": "https://zhenwei-private-bucket.s3.amazonaws.com/...signed...",
  "bucketName": "zhenwei-private-bucket",
  "objectKey": "private-downloads/resume/zhenwei-seo-cv.pdf",
  "versionId": null,
  "fileName": "zhenwei-seo-cv.pdf",
  "expiresIn": 300
}
```

Observed response headers include:

- content-type: application/json
- access-control-allow-origin: https://zhenwei.dev
- vary: Origin

Notes:

- Method is POST (not GET).
- The endpoint expects objectKey and expirySeconds in JSON body.
- The API currently supports zhenwei.dev origin based on sampled response.

---

## S3 Source of Truth

- Bucket: zhenwei-private-bucket
- Folder prefix: private-downloads/
- Resume key used by frontend request: private-downloads/resume/zhenwei-seo-cv.pdf

Example verification:

```bash
aws s3 ls s3://zhenwei-private-bucket --recursive
```

Expected relevant item:

```text
private-downloads/resume/zhenwei-seo-cv.pdf
```

---

## Frontend Integration for This Repo

Current site status:

- Resume CTA in Intro panel triggers the hidden `resume` command flow.
- `resume` / `get resume` are supported as hidden typed commands (not listed in command deck/help).
- API mode falls back automatically to local static download when API fetch fails.

Integration target:

1. Keep local fallback in site/public/data/intro.json resumeAction.
2. In dev/prod mode, call API endpoint and trigger download from returned URL.
3. Keep resume command hidden from visible command lists; trigger primarily from Download CV button.

### Suggested environment variables

Configure these in GitHub Environment variables (for example `prod`, and `dev` later), using the same names with environment-specific values.

Current practical strategy for this site repo:

- Local/testing default: local-static mode.
- Production: api mode using production endpoint.
- Dev API endpoint: optional/manual only (no site dev CI/CD yet).

```bash
# Local developer machine
VITE_APP_ENV=local
VITE_RESUME_MODE=local-static
VITE_RESUME_API_URL=
VITE_RESUME_OBJECT_KEY=private-downloads/resume/zhenwei-seo-cv.pdf
VITE_RESUME_EXPIRY_SECONDS=300

# Development testing (optional manual override)
# Use only when you explicitly want to test against dev API from local site build.
VITE_APP_ENV=dev
VITE_RESUME_MODE=api
VITE_RESUME_API_URL=https://4tm8h7iot5.execute-api.ap-southeast-1.amazonaws.com/get-presigned-url
VITE_RESUME_OBJECT_KEY=private-downloads/resume/zhenwei-seo-cv.pdf
VITE_RESUME_EXPIRY_SECONDS=300

# Production deployment
VITE_APP_ENV=prod
VITE_RESUME_MODE=api
VITE_RESUME_API_URL=https://api.zhenwei.dev/get-presigned-url
VITE_RESUME_OBJECT_KEY=private-downloads/resume/zhenwei-seo-cv.pdf
VITE_RESUME_EXPIRY_SECONDS=300
```

### Recommended mode resolution

For now, keep logic intentionally simple:

1. If VITE_APP_ENV=prod: use API mode (VITE_RESUME_MODE=api).
2. Else: default to local-static mode.
3. Optional: allow explicit override to API mode for manual dev testing.

This matches current delivery setup where site dev CI/CD is not yet implemented.

### Frontend request payload

```json
{
  "objectKey": "private-downloads/resume/zhenwei-seo-cv.pdf",
  "expirySeconds": 300
}
```

### Frontend success flow

1. POST to VITE_RESUME_API_URL.
2. Parse JSON and read url and fileName.
3. Create temporary anchor with href=url and download=fileName, then click.
4. Show terminal-style success output.

### Error flow

1. If API call fails, show terminal error state.
2. Then auto-fallback to local resumeAction.href download flow.
3. Keep error context visible in terminal output while fallback proceeds.

---

## Terminal UX Plan (Still Valid)

Resume logic is implemented inside IntroTerminal and includes get resume alias.

The command is intentionally hidden from the command deck/help list.

State model:

- idle
- requesting
- downloading
- done
- error

The download lifecycle should be independent from activeCommand so the async request can finish safely.

---

## Files to Update in This Repo

| File | Action |
|---|---|
| site/src/components/IntroTerminal.jsx | Implemented: resume command behavior, API POST flow, fallback handling, and terminal output states |
| site/public/data/intro.json | Keep static resumeAction fallback; resume command remains hidden from terminal.commands |
| site/src/styles.css | Implemented: terminal download block and state styling |
| site/.env.local (local only) | Configure local resume mode variables |

Cross-repo reference only:

- API/Lambda/IAM/API Gateway details are maintained in zhenwei-dev-api.

---

## What Changed From Previous Draft

- Updated route from GET /resume/download to POST /get-presigned-url.
- Replaced planned bucket naming with actual bucket and object key.
- Marked backend implementation as completed in external API repo.
- Narrowed this repo plan to frontend integration work.
- Removed repo-local Terraform implementation steps that are no longer source-of-truth for the backend API.
- Clarified current environment strategy: prod uses API, non-prod defaults to local-static, with optional manual dev API override.