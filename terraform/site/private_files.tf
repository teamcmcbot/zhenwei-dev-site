module "private_files_bucket" {
  source = "../modules/s3_private_bucket"

  bucket_name           = var.private_bucket_name
  enable_versioning     = true
  reader_principal_arns = var.presign_reader_role_arns
  writer_principal_arns = var.uploader_role_arns
  tags = merge(var.tags, {
    Stack = "private-files"
  })
}