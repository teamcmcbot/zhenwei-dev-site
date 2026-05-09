variable "project_name" {
  description = "Project name used for tagging and naming."
  type        = string
  default     = "zhenwei-dev-site"
}

variable "domain_name" {
  description = "Primary domain for the portfolio site (for example zhenwei.dev)."
  type        = string
}

variable "hosted_zone_name" {
  description = "Route53 public hosted zone name ending with a dot (for example zhenwei.dev.)."
  type        = string
}

variable "aws_region" {
  description = "AWS region for S3 and Route53-linked resources."
  type        = string
  default     = "ap-southeast-1"
}

variable "github_repo" {
  description = "GitHub repository in owner/name format used by OIDC trust policy."
  type        = string
  default     = "zhenwei-seo/zhenwei-dev-site"
}

variable "github_branch" {
  description = "Branch allowed to assume deploy role via GitHub OIDC."
  type        = string
  default     = "main"
}

variable "google_site_verification_txt" {
  description = "Google Search Console TXT record value (for example google-site-verification=xxxx). Leave empty to skip creating the record."
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags."
  type        = map(string)
  default = {
    ManagedBy = "terraform"
    Project   = "zhenwei-dev-site"
  }
}
