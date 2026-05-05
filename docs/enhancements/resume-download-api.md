# Resume Download via Presigned URL (v2 Enhancement)

## Overview

Replace the static PDF link with a short-lived AWS presigned URL generated on-demand.
A Lambda function (behind API Gateway) creates the URL each time the button is clicked,
so the actual PDF lives in a **private** S3 bucket that is never publicly accessible.

This is deliberately over-engineered relative to the problem — it serves as a live
showcase of AWS serverless + IAM least-privilege patterns on a personal site.

---

## Architecture

```
Browser
  │
  │  GET /resume/download
  ▼
API Gateway (HTTP API)
  │  throttled, CORS-restricted
  ▼
Lambda (Python)
  │  generates presigned URL (TTL = 300 s)
  ▼
S3 Presigned URL (302 redirect)
  │
  ▼
Private S3 Bucket  ←  manual upload only, never in git
  (resume PDF)
```

### Why a redirect instead of streaming through Lambda?

- Lambda response payload limit is 6 MB (10 MB with response streaming).
- A presigned URL offloads bandwidth to S3 and avoids that limit.
- The browser receives a `302` and downloads directly from S3.
- S3 presigned URLs work even on private buckets — the signature grants temporary access.

---

## S3 Bucket (resume-private)

A **separate** bucket from the site bucket. The site bucket already has a CloudFront
OAC policy that blocks Lambda access, so keeping the resume in its own bucket avoids
policy conflicts and keeps concerns separated.

| Setting | Value |
|---|---|
| Bucket name | `${project_name}-resume` |
| Block all public access | ✅ |
| Versioning | Enabled (keep old PDF versions) |
| Encryption | SSE-S3 (default) |
| Bucket policy | Deny all except Lambda execution role |

### Upload workflow

The PDF is uploaded **manually** via AWS CLI or Console — it is never committed to git.

```bash
aws s3 cp zhenwei-seo-resume.pdf \
  s3://<bucket-name>/zhenwei-seo-resume.pdf \
  --region ap-southeast-1
```

---

## Lambda Function

**Runtime:** Python 3.12  
**Location:** `api/resume_download/handler.py`

### Handler sketch

```python
import json
import os
import boto3
from botocore.exceptions import ClientError

BUCKET   = os.environ["RESUME_BUCKET"]
KEY      = os.environ["RESUME_KEY"]       # e.g. "zhenwei-seo-resume.pdf"
FILENAME = os.environ["RESUME_FILENAME"]  # Content-Disposition filename
TTL      = int(os.environ.get("URL_TTL_SECONDS", "300"))

s3 = boto3.client("s3")

ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "").split(",")


def handler(event, context):
    origin = (event.get("headers") or {}).get("origin", "")

    try:
        url = s3.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": BUCKET,
                "Key": KEY,
                "ResponseContentDisposition": f'attachment; filename="{FILENAME}"',
            },
            ExpiresIn=TTL,
        )
    except ClientError as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Could not generate download URL"}),
        }

    cors_origin = origin if origin in ALLOWED_ORIGINS else ALLOWED_ORIGINS[0]

    return {
        "statusCode": 302,
        "headers": {
            "Location": url,
            "Access-Control-Allow-Origin": cors_origin,
            "Cache-Control": "no-store",
        },
        "body": "",
    }
```

### Environment variables (set in Terraform, not SSM)

| Variable | Example value |
|---|---|
| `RESUME_BUCKET` | `zhenwei-dev-resume` |
| `RESUME_KEY` | `zhenwei-seo-resume.pdf` |
| `RESUME_FILENAME` | `zhenwei-seo-resume.pdf` |
| `URL_TTL_SECONDS` | `300` |
| `ALLOWED_ORIGINS` | `https://zhenwei.dev,https://www.zhenwei.dev` |

---

## IAM

### Lambda execution role policy (least-privilege)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "GeneratePresignedUrl",
      "Effect": "Allow",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${resume_bucket_name}/${resume_key}"
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

The existing GitHub OIDC deploy role (`iam.tf`) will need additional permissions
to deploy the Lambda and API Gateway resources:

```
lambda:CreateFunction, lambda:UpdateFunctionCode, lambda:UpdateFunctionConfiguration,
lambda:GetFunction, lambda:AddPermission,
apigatewayv2:CreateApi, apigatewayv2:CreateIntegration, apigatewayv2:CreateRoute,
apigatewayv2:CreateStage, apigatewayv2:DeployApi,
iam:PassRole  (scoped to the Lambda execution role ARN)
```

---

## API Gateway (HTTP API)

HTTP API (v2) is preferred over REST API — lower cost, lower latency, built-in CORS.

| Setting | Value |
|---|---|
| Type | HTTP API |
| Route | `GET /resume/download` |
| Integration | Lambda proxy |
| CORS origins | `https://zhenwei.dev`, `https://www.zhenwei.dev` |
| Throttle (stage default) | 10 req/s burst, 5 req/s rate |
| Logging | CloudWatch, INFO level |

### Optional: WAF

A WAF Web ACL with a rate-based rule (`100 req / 5 min per IP`) can be attached to
the API Gateway stage. Low priority for v2 — the throttle above is sufficient for a
personal site.

---

## Terraform Resources

New file: `terraform/resume_api.tf`

```hcl
# Private S3 bucket for resume PDF
resource "aws_s3_bucket" "resume" { ... }
resource "aws_s3_bucket_versioning" "resume" { ... }
resource "aws_s3_bucket_public_access_block" "resume" { ... }
resource "aws_s3_bucket_policy" "resume" { ... }   # deny all except lambda role

# Lambda
resource "aws_lambda_function" "resume_download" { ... }
resource "aws_iam_role" "resume_lambda" { ... }
resource "aws_iam_role_policy" "resume_lambda" { ... }
resource "aws_cloudwatch_log_group" "resume_lambda" { ... }

# API Gateway HTTP API
resource "aws_apigatewayv2_api" "resume" { ... }
resource "aws_apigatewayv2_integration" "resume" { ... }
resource "aws_apigatewayv2_route" "resume" { ... }
resource "aws_apigatewayv2_stage" "default" { ... }
resource "aws_lambda_permission" "apigw_resume" { ... }
```

Output the invoke URL so it can be copy-pasted into `intro.json`:

```hcl
output "resume_api_url" {
  value = "${aws_apigatewayv2_api.resume.api_endpoint}/resume/download"
}
```

---

## Frontend Change (post-deploy)

After the API is deployed, update `site/public/data/intro.json`:

```json
"resumeAction": {
  "label": "Download Resume",
  "href": "https://api.zhenwei.dev/resume/download",
  "download": false
}
```

Setting `"download": false` makes the button navigate to the API URL (which issues
the `302` redirect) rather than using the HTML `download` attribute, which does not
follow cross-origin redirects correctly.

Optionally set up a custom domain (`api.zhenwei.dev`) mapped to the API Gateway stage
and add a Route 53 A-record (alias) — this keeps the URL clean and avoids exposing the
raw `execute-api` hostname in the source code.

---

## Deployment Steps (when ready)

1. Write `api/resume_download/handler.py` (sketch above).
2. Add `terraform/resume_api.tf` with all resources.
3. Extend the GitHub OIDC deploy role policy in `terraform/iam.tf`.
4. `terraform plan` → review → `terraform apply`.
5. Upload PDF: `aws s3 cp ... s3://<resume-bucket>/zhenwei-seo-resume.pdf`.
6. Copy `resume_api_url` output → update `intro.json` `resumeAction.href`.
7. `npm run build` → push → CI deploys site.
8. Verify end-to-end: button → API → 302 → PDF download.

---

## Files to Create / Modify

| File | Action |
|---|---|
| `api/resume_download/handler.py` | Create |
| `api/resume_download/requirements.txt` | Create (boto3 only, usually pre-installed in Lambda) |
| `terraform/resume_api.tf` | Create |
| `terraform/iam.tf` | Modify — extend deploy role permissions |
| `terraform/variables.tf` | Modify — add `resume_key`, `url_ttl_seconds` variables |
| `terraform/outputs.tf` | Modify — add `resume_api_url` output |
| `site/public/data/intro.json` | Modify — update `resumeAction.href` and `download: false` |
| `site/public/assets/resume/README.md` | Remove or keep as placeholder |

---

## Terminal UX — `resume` Command

Rather than a plain button click, the download is surfaced as a **terminal command**
that fits the existing interactive terminal in `IntroTerminal.jsx`.

### User flow

```
visitor@zhenwei.dev:~$ resume

> Requesting presigned URL from S3...
> Connecting to api.zhenwei.dev...

--2026-05-05 12:00:01--  https://zhenwei-dev-resume.s3.ap-southeast-1.amazonaws.com/zhenwei-seo-resume.pdf
Resolving zhenwei-dev-resume.s3.ap-southeast-1.amazonaws.com... 52.xx.xx.xx
Connecting to zhenwei-dev-resume.s3... connected.
HTTP request sent, awaiting response... 200 OK
Length: 182341 (178K) [application/pdf]
Saving to: 'zhenwei-seo-resume.pdf'

zhenwei-seo-resume.pdf    100%[===================>] 178K  --.-KB/s    in 0.3s

> Download complete. Check your downloads folder.
```

On error:

```
visitor@zhenwei.dev:~$ resume

> Requesting presigned URL from S3...
> Error: Could not reach download API. Try the button below or check back later.
```

### Accepted command names

Add both `resume` and `get resume` as recognized inputs (via `commandAliases` in
`canonicalizeCommand`):

```js
const commandAliases = {
  exp: "experience",
  certifications: "certs",
  "get resume": "resume",   // multi-word alias
};
```

Register `resume` in `intro.json` commands array so it appears in `help` and the
command deck:

```json
{
  "name": "resume",
  "label": "resume",
  "description": "Download resume (PDF)"
}
```

### State model

The download flow needs its own async state, separate from `activeCommand`:

| State | Terminal shows |
|---|---|
| `idle` | nothing / previous output |
| `requesting` | "Requesting presigned URL..." spinner line |
| `downloading` | animated wget-style block (fake progress, then 100%) |
| `done` | success line + "Check your downloads folder" |
| `error` | error line + fallback link |

Use a dedicated `useState` for this: `const [resumeState, setResumeState] = useState("idle")`.

The download state is **independent** of `activeCommand` — switching to another command
resets the view, but the actual `fetch()` + `<a download>` trigger continues in the
background.

### Implementation sketch (`renderResumeOutput`)

```jsx
function renderResumeOutput() {
  return (
    <div className="terminal-output-block">
      {resumeState === "idle" && null}

      {(resumeState === "requesting" || resumeState === "downloading" || resumeState === "done") && (
        <>
          <p className="terminal-line terminal-line--muted">
            Requesting presigned URL from S3...
          </p>
          <p className="terminal-line terminal-line--muted">
            Connecting to api.zhenwei.dev...
          </p>
        </>
      )}

      {(resumeState === "downloading" || resumeState === "done") && (
        <pre className="terminal-wget-block">
{`--${timestamp}--  https://...s3.amazonaws.com/zhenwei-seo-resume.pdf
Resolving ...s3.amazonaws.com... resolved.
Connecting... connected.
HTTP request sent, awaiting response... 200 OK
Length: ~180K [application/pdf]
Saving to: 'zhenwei-seo-resume.pdf'

zhenwei-seo-resume.pdf    100%[===================>] 178K  in 0.3s`}
        </pre>
      )}

      {resumeState === "done" && (
        <p className="terminal-line terminal-line--success">
          Download complete. Check your downloads folder.
        </p>
      )}

      {resumeState === "error" && (
        <>
          <p className="terminal-line terminal-line--error">
            Error: Could not reach download API.
          </p>
          <p className="terminal-line">
            Try the <a href={resumeHref} download={resumeFileName}>direct link</a> instead.
          </p>
        </>
      )}
    </div>
  );
}
```

### Triggering the download

When `runCommand("resume")` is called:

1. `setActiveCommand("resume")` — shows the output block.
2. `setResumeState("requesting")`.
3. `fetch(API_URL)` — API returns `302` with `Location` header.
   - Because `fetch` follows redirects by default, use `redirect: "manual"` or
     parse the response URL to extract the presigned URL, then create a temporary
     `<a download>` element and `.click()` it programmatically.
4. On success: `setResumeState("downloading")` → short `setTimeout` →
   `setResumeState("done")`.
5. On failure: `setResumeState("error")`.

> **Cross-origin redirect note:** `fetch` with `redirect: "follow"` on a cross-origin
> `302` to S3 will succeed for the download, but the response will be `opaque` (type
> `"opaque"`), meaning you cannot read status or headers. To keep the UX honest
> (detecting real errors), use `redirect: "manual"` and read `response.headers.get("Location")`
> — but this requires the API to set `Access-Control-Expose-Headers: Location`.
> Alternatively, change the Lambda to return `200` with `{"url": "..."}` JSON and
> let the frontend trigger the download — simpler to implement and easier to test.

### JSON response approach (recommended for frontend simplicity)

Change the Lambda to return `200 + JSON` instead of `302`:

```python
return {
    "statusCode": 200,
    "headers": { "Content-Type": "application/json", ... },
    "body": json.dumps({"url": url, "fileName": FILENAME}),
}
```

Frontend:

```js
const { url, fileName } = await res.json();
const a = document.createElement("a");
a.href = url;
a.download = fileName;
a.click();
```

This is easier to handle error states from and avoids CORS preflight complexities
with the `Location` header.

### Animated wget progress (CSS)

The `terminal-wget-block` can use a CSS animation to reveal the progress bar
character-by-character using `clip-path` or a `max-width` transition on the
`[===================>]` span, giving a realistic "filling" effect before snapping
to 100%.

### Files to touch (frontend side)

| File | Change |
|---|---|
| `site/src/components/IntroTerminal.jsx` | Add `resumeState` state, `renderResumeOutput()`, `resume` case in `renderOutput()`, download trigger logic in `runCommand()` |
| `site/public/data/intro.json` | Add `resume` entry to `terminal.commands` array; add `resumeApiUrl` field to `identity` or `resumeAction` |
| `site/src/styles.css` | Add `.terminal-wget-block`, `.terminal-wget-bar` animation styles |

---

## v1 Status

Current v1 ships with a **static path** pointing to `/assets/resume/zhenwei-seo-resume.pdf`.
Place the actual PDF at `site/public/assets/resume/zhenwei-seo-resume.pdf` before
publishing — it will be served directly from CloudFront.

The presigned URL approach is a v2 enhancement. v1 is fully functional without it.
