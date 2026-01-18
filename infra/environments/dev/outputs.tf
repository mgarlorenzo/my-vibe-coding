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

# -----------------------------------------------------------------------------
# Backend Infrastructure Outputs
# -----------------------------------------------------------------------------

output "artifact_registry_repo" {
  description = "Artifact Registry repository URL for Docker images"
  value       = "${google_artifact_registry_repository.docker.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker.repository_id}"
}

output "cloud_run_service_url" {
  description = "Cloud Run service URL"
  value       = google_cloud_run_v2_service.api.uri
}

# -----------------------------------------------------------------------------
# Cloud SQL Outputs
# -----------------------------------------------------------------------------

output "cloudsql_connection_name" {
  description = "Cloud SQL connection name for Cloud SQL Auth Proxy"
  value       = google_sql_database_instance.main.connection_name
}

output "db_name" {
  description = "Database name"
  value       = google_sql_database.app.name
}

output "db_user" {
  description = "Database application user"
  value       = google_sql_user.app.name
}

output "db_password_secret" {
  description = "Secret Manager secret ID containing DB password"
  value       = google_secret_manager_secret.db_password.secret_id
}

output "cloud_run_service_account" {
  description = "Cloud Run service account email"
  value       = google_service_account.cloud_run.email
}
