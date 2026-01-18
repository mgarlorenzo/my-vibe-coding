# Backend configuration for remote state in GCS
# The bucket name is passed via -backend-config in CI/CD
# 
# Example:
#   terraform init \
#     -backend-config="bucket=${TF_STATE_BUCKET}" \
#     -backend-config="prefix=infra/dev"

terraform {
  backend "gcs" {
    # These values are provided via -backend-config in GitHub Actions
    # bucket = "${project_id}-tfstate"  # Set via TF_STATE_BUCKET
    # prefix = "infra/dev"              # Set via -backend-config
  }
}
