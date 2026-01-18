# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "project_id" {
  description = "The GCP project ID"
  value       = var.project_id
}

output "region" {
  description = "The GCP region"
  value       = var.region
}

output "env" {
  description = "The environment name"
  value       = var.env
}

output "name_prefix" {
  description = "The naming prefix for resources"
  value       = local.name_prefix
}

output "common_labels" {
  description = "Common labels applied to resources"
  value       = local.common_labels
}
