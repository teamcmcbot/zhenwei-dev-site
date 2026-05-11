variable "bucket_name" {
  description = "Name of the private S3 bucket."
  type        = string
}

variable "tags" {
  description = "Tags for resources."
  type        = map(string)
  default     = {}
}

variable "enable_versioning" {
  description = "Whether to enable bucket versioning."
  type        = bool
  default     = true
}

variable "reader_principal_arns" {
  description = "IAM principal ARNs allowed to read objects (for example Lambda execution roles used for presigned URL generation)."
  type        = list(string)
  default     = []
}

variable "writer_principal_arns" {
  description = "IAM principal ARNs allowed to upload or delete objects in the private bucket."
  type        = list(string)
  default     = []
}
