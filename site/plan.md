# Data-Driven Static Portfolio Plan

## Goal

Build the initial portfolio as a client-side static application hosted on AWS S3 and CloudFront, while demonstrating a modern content-driven deployment model.

The site should feel dynamic to visitors, but remain simple and inexpensive to operate:

- Static React app served from S3 through CloudFront
- Content stored as JSON files under a public data directory
- React fetches JSON files at runtime and renders each section
- GitHub Actions deploys application assets and JSON content to S3
- CloudFront invalidation makes updates visible after each deployment
- New portfolio content can be added by committing a new or updated JSON file

This makes the website itself part of the DevOps portfolio: it demonstrates static hosting, CDN delivery, infrastructure as code, CI/CD, and data-driven frontend architecture.

## Recommended Architecture

```text
User Browser
  -> Route53
  -> CloudFront
  -> S3 static assets
       -> index.html
       -> app JS/CSS bundle
       -> /data/*.json
```

The React app should be deployed as static files only. No backend service is required for the first version.

## Why This Fits The Initial Portfolio

This approach is a good match for a first portfolio version because it is:

- Simple to host and maintain
- Cheap to run
- Easy to secure with CloudFront, ACM, and S3 private origin access
- Good enough for resume, project, skill, certification, and contact content
- Strong as a DevOps demonstration because the deployment pipeline is visible and explainable

A backend can be added later only if the site needs authenticated editing, server-side rendering, form handling, personalized content, or a real CMS.

## Proposed Site Structure

The current repo has a static HTML/CSS/JS site in `site/`. The target structure should evolve toward:

```text
site/
├── plan.md
├── package.json
├── index.html
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── components/
│   │   ├── Hero.jsx
│   │   ├── About.jsx
│   │   ├── Experience.jsx
│   │   ├── Projects.jsx
│   │   ├── Skills.jsx
│   │   ├── Certifications.jsx
│   │   ├── AwsStaticHosting.jsx
│   │   └── Contact.jsx
│   └── styles.css
├── public/
│   ├── data/
│   │   ├── profile.json
│   │   ├── about.json
│   │   ├── skills.json
│   │   ├── certifications.json
│   │   ├── experiences.json
│   │   ├── projects.json
│   │   ├── aws-static-hosting.json
│   │   └── contact.json
│   └── assets/
└── dist/
```

If the project remains plain HTML/CSS/JS for a short first step, the same JSON files can still be used from:

```text
site/
├── data/
│   ├── profile.json
│   ├── about.json
│   ├── skills.json
│   ├── certifications.json
│   ├── experiences.json
│   ├── projects.json
│   ├── aws-static-hosting.json
│   └── contact.json
```

For a Vite React app, JSON files should live in `site/public/data/` so they are copied into `dist/data/` during build.

## Data Files To Generate First

Before migrating the UI, generate dummy JSON files. This lets the content model stabilize first and gives the frontend a clean contract to consume.

### `profile.json`

Purpose: top-level identity and hero content.

```json
{
  "name": "Zhenwei Seo",
  "domain": "zhenwei.dev",
  "role": "DevOps Engineer",
  "headline": "Building reliable delivery pipelines and cloud platforms that teams trust.",
  "summary": "I design and automate infrastructure with Terraform, secure deployment pipelines with GitHub OIDC, and production-ready systems on AWS.",
  "location": "Your City, Your Region",
  "resumeUrl": "/assets/resume-placeholder.pdf",
  "primaryAction": {
    "label": "View Projects",
    "href": "#projects"
  },
  "secondaryAction": {
    "label": "Contact",
    "href": "#contact"
  }
}
```

### `about.json`

Purpose: about section and positioning.

```json
{
  "title": "About",
  "paragraphs": [
    "I focus on shipping fast without trading off security or reliability.",
    "My work centers on infrastructure as code, CI/CD excellence, cloud-native architecture, and observability-first operations.",
    "This portfolio is also a working DevOps showcase: static hosting, CDN delivery, Terraform-managed infrastructure, and automated deployment through GitHub Actions."
  ],
  "focusAreas": [
    "Infrastructure as Code",
    "Secure CI/CD",
    "AWS Static Hosting",
    "CloudFront and DNS",
    "Platform Reliability"
  ]
}
```

### `skills.json`

Purpose: skills grouped by discipline.

```json
[
  {
    "group": "Cloud",
    "items": ["AWS", "S3", "CloudFront", "Route53", "IAM", "ACM"]
  },
  {
    "group": "Infrastructure as Code",
    "items": ["Terraform", "Remote State", "Reusable Modules", "Environment Variables"]
  },
  {
    "group": "CI/CD",
    "items": ["GitHub Actions", "OIDC Federation", "S3 Sync", "CloudFront Invalidation"]
  },
  {
    "group": "Containers and Runtime",
    "items": ["Docker", "Kubernetes", "Linux", "Shell Scripting"]
  },
  {
    "group": "Operations",
    "items": ["Monitoring", "Alerting", "Incident Response", "Cost Awareness"]
  }
]
```

### `certifications.json`

Purpose: certification cards and badges.

```json
[
  {
    "name": "AWS Certified Solutions Architect - Associate",
    "issuer": "Amazon Web Services",
    "status": "Planned or In Progress",
    "issuedDate": "TBD",
    "credentialUrl": "#",
    "badgeImage": "/assets/certifications/aws-placeholder.svg"
  },
  {
    "name": "Certified Kubernetes Administrator",
    "issuer": "Cloud Native Computing Foundation",
    "status": "Planned or In Progress",
    "issuedDate": "TBD",
    "credentialUrl": "#",
    "badgeImage": "/assets/certifications/cka-placeholder.svg"
  }
]
```

### `experiences.json`

Purpose: professional timeline.

```json
[
  {
    "company": "Example Cloud Platform Team",
    "role": "DevOps Engineer",
    "location": "Remote",
    "period": "2024 - Present",
    "summary": "Supported cloud infrastructure, deployment automation, and operational reliability for internal engineering teams.",
    "highlights": [
      "Built Terraform workflows for repeatable AWS infrastructure provisioning.",
      "Implemented GitHub Actions deployment pipelines using OIDC instead of long-lived AWS keys.",
      "Improved deployment confidence with automated validation and rollback-oriented release practices."
    ],
    "technologies": ["AWS", "Terraform", "GitHub Actions", "CloudFront", "S3", "IAM"]
  },
  {
    "company": "Example Infrastructure Operations",
    "role": "Platform Support Engineer",
    "location": "Your City",
    "period": "2022 - 2024",
    "summary": "Worked on Linux systems, automation scripts, monitoring, and service reliability improvements.",
    "highlights": [
      "Automated recurring operational tasks with shell scripts.",
      "Helped standardize deployment checklists and environment configuration.",
      "Investigated production issues using logs, metrics, and infrastructure state."
    ],
    "technologies": ["Linux", "Bash", "Docker", "Monitoring", "Networking"]
  }
]
```

### `projects.json`

Purpose: portfolio project cards and proof points.

```json
[
  {
    "title": "Static Portfolio on AWS",
    "slug": "aws-static-portfolio",
    "status": "In Progress",
    "summary": "A data-driven portfolio site hosted on S3 and CloudFront with Terraform-managed infrastructure and GitHub Actions deployment.",
    "problem": "Create a fast, inexpensive portfolio that also demonstrates real DevOps practices.",
    "solution": "Use a static React app, JSON content files, S3 private origin, CloudFront CDN, Route53 DNS, ACM TLS, and OIDC-based GitHub Actions deployment.",
    "outcomes": [
      "Low-cost global static hosting",
      "Content updates through version-controlled JSON files",
      "No long-lived AWS credentials in CI/CD"
    ],
    "technologies": ["React", "AWS S3", "CloudFront", "Route53", "Terraform", "GitHub Actions", "OIDC"],
    "links": {
      "demo": "https://zhenwei.dev",
      "repo": "#",
      "caseStudy": "#aws-static-hosting"
    }
  },
  {
    "title": "Terraform CloudFront Foundation",
    "slug": "terraform-cloudfront-foundation",
    "status": "Planned",
    "summary": "Reusable Terraform configuration for secure static web hosting on AWS.",
    "problem": "Static sites often start simple but become inconsistent when DNS, TLS, caching, and bucket policies are configured manually.",
    "solution": "Codify S3, CloudFront, Route53, IAM, and output values with Terraform.",
    "outcomes": [
      "Repeatable infrastructure",
      "Clear separation between app content and cloud resources",
      "Auditable changes through Git history"
    ],
    "technologies": ["Terraform", "AWS", "S3", "CloudFront", "Route53", "ACM"],
    "links": {
      "demo": "#",
      "repo": "#",
      "caseStudy": "#"
    }
  }
]
```

### `aws-static-hosting.json`

Purpose: dedicated section that explains the AWS static hosting architecture as part of the portfolio.

```json
{
  "title": "AWS Static Hosting Architecture",
  "summary": "This website is intentionally built as a static, data-driven app to demonstrate practical AWS hosting and deployment patterns.",
  "requestFlow": [
    "Visitor requests zhenwei.dev",
    "Route53 resolves the domain",
    "CloudFront serves cached assets over HTTPS",
    "CloudFront retrieves origin files from S3 when needed",
    "React loads JSON files from /data and renders the portfolio"
  ],
  "components": [
    {
      "name": "S3",
      "purpose": "Stores the built React app and JSON content files."
    },
    {
      "name": "CloudFront",
      "purpose": "Provides CDN caching, HTTPS entry point, and SPA routing behavior."
    },
    {
      "name": "Route53",
      "purpose": "Maps zhenwei.dev to the CloudFront distribution."
    },
    {
      "name": "ACM",
      "purpose": "Provides the TLS certificate for HTTPS."
    },
    {
      "name": "GitHub Actions",
      "purpose": "Builds and deploys the app and JSON content after changes are merged."
    },
    {
      "name": "OIDC + IAM",
      "purpose": "Allows GitHub Actions to deploy without storing long-lived AWS access keys."
    }
  ],
  "pipelineDemo": {
    "title": "Content Update Demo",
    "steps": [
      "Update or add a JSON file under public/data",
      "Open a pull request and review the content change",
      "Merge to main",
      "GitHub Actions syncs the changed data files to S3",
      "CloudFront cache is invalidated for the affected paths",
      "The live website renders the new content without changing application code"
    ]
  }
}
```

### `contact.json`

Purpose: contact links and call to action.

```json
{
  "title": "Contact",
  "message": "Interested in DevOps, cloud infrastructure, or platform engineering work? Let us connect.",
  "links": [
    {
      "label": "Email",
      "href": "mailto:hello@example.com",
      "type": "email"
    },
    {
      "label": "LinkedIn",
      "href": "https://www.linkedin.com/in/example",
      "type": "social"
    },
    {
      "label": "GitHub",
      "href": "https://github.com/example",
      "type": "social"
    }
  ]
}
```

## Frontend Implementation Plan

### Phase 1: Create Data Contract

- Add the sample JSON files first.
- Keep field names stable and predictable.
- Validate that every required section has enough dummy content to render a complete page.
- Use arrays for repeatable content such as skills, experiences, projects, certifications, and links.
- Use objects for single-page identity content such as profile, about, and architecture summary.

### Phase 2: Convert Site To React

- Use Vite for a lightweight React setup.
- Preserve the existing visual direction where it works.
- Replace hardcoded HTML sections with React components.
- Each section should load from the JSON data contract.
- Keep the first screen as the real portfolio experience, not a marketing landing page.

Suggested component loading pattern:

```js
async function loadJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }

  return response.json();
}
```

Suggested data loading paths:

```js
const dataPaths = {
  profile: "/data/profile.json",
  about: "/data/about.json",
  skills: "/data/skills.json",
  certifications: "/data/certifications.json",
  experiences: "/data/experiences.json",
  projects: "/data/projects.json",
  awsStaticHosting: "/data/aws-static-hosting.json",
  contact: "/data/contact.json"
};
```

### Phase 3: Build UI Sections

Create the following sections:

- Hero: uses `profile.json`
- About: uses `about.json`
- Skills: uses `skills.json`
- Certifications: uses `certifications.json`
- Experience: uses `experiences.json`
- Projects: uses `projects.json`
- AWS Static Hosting: uses `aws-static-hosting.json`
- Contact: uses `contact.json`

The AWS Static Hosting section should be treated as a featured case study. It should show:

- Request flow
- Infrastructure components
- CI/CD deployment flow
- Data-only update demonstration

### Phase 4: Add Loading And Error States

Because content is fetched at runtime, the app needs basic states:

- Loading state while JSON files are fetched
- Error state if one or more JSON files fail to load
- Empty state for sections with empty arrays

For the first version, a simple page-level loading state is enough.

### Phase 5: Update Build And Deploy Pipeline

Use separate deployment logic for app code and data changes when possible.

Recommended GitHub Actions behavior:

```text
On push to main:
  If app source changed:
    npm ci
    npm run build
    aws s3 sync site/dist s3://zhenwei-dev-site --delete
    aws cloudfront create-invalidation --paths "/*"

  If only data changed:
    aws s3 sync site/public/data s3://zhenwei-dev-site/data --delete
    aws cloudfront create-invalidation --paths "/data/*"
```

This makes the pipeline demo clearer: content updates do not require rebuilding the React bundle.

### Phase 6: Terraform Alignment

Terraform should support the static SPA behavior:

- S3 bucket for static website assets
- CloudFront distribution in front of S3
- Origin Access Control if using a private S3 bucket
- ACM certificate for HTTPS
- Route53 alias record for `zhenwei.dev`
- CloudFront custom error responses for SPA fallback

For client-side routing, configure CloudFront to return `index.html` for `403` and `404` responses if needed.

Recommended SPA fallback behavior:

```text
403 -> /index.html with 200
404 -> /index.html with 200
```

### Phase 7: Validation

Before considering the migration complete, validate:

- `npm run build` succeeds
- All JSON files are valid JSON
- The site renders with dummy data
- Refreshing routes does not break the app
- CloudFront serves `/data/*.json` correctly
- Updating one JSON file can update the live site through the pipeline
- Mobile layout remains readable and polished
- Lighthouse basics are acceptable for performance and accessibility

## Acceptance Criteria

The first implementation is complete when:

- Sample JSON files exist with dummy data
- React components render from JSON instead of hardcoded content
- AWS static hosting section is present as a case study
- Build output is deployable to S3
- GitHub Actions can deploy app changes and data-only changes
- CloudFront invalidation behavior is documented and wired into the pipeline
- The site still works as a fully static client-side app

## Future Enhancements

Possible later improvements:

- Add JSON schema validation in CI
- Add preview deployments for pull requests
- Add image optimization workflow
- Add project detail pages using client-side routing
- Add a lightweight CMS later if manual JSON editing becomes painful
- Add analytics with a privacy-friendly provider
- Add automated Lighthouse checks in CI

## Immediate Next Step

Generate the dummy JSON files first, then wire the current frontend to read them. After that, migrate the UI to Vite + React once the content contract feels right.
