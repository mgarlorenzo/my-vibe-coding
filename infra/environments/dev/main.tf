# -----------------------------------------------------------------------------
# Employee Platform - Dev Environment
# -----------------------------------------------------------------------------
#
# This is the main entry point for the dev environment.
# Add module calls here as infrastructure grows.
#
# Example:
#   module "network" {
#     source = "../../modules/network"
#     
#     project_id  = var.project_id
#     region      = var.region
#     env         = var.env
#     name_prefix = local.name_prefix
#     labels      = local.common_labels
#   }
# -----------------------------------------------------------------------------

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "sts.googleapis.com",
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "secretmanager.googleapis.com",
    "sqladmin.googleapis.com",
    "serviceusage.googleapis.com",
  ])

  project = var.project_id
  service = each.value

  disable_dependent_services = false
  disable_on_destroy         = false
}

# -----------------------------------------------------------------------------
# Artifact Registry - Docker Repository
# -----------------------------------------------------------------------------

resource "google_artifact_registry_repository" "docker" {
  repository_id = "${var.app_name}-repo"
  location      = var.region
  format        = "DOCKER"
  description   = "Docker repository for ${var.app_name}"

  labels = local.common_labels

  depends_on = [google_project_service.apis]
}

# -----------------------------------------------------------------------------
# Cloud Run Service - Backend API (placeholder)
# -----------------------------------------------------------------------------

resource "google_cloud_run_v2_service" "api" {
  name     = "${var.app_name}-api"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.cloud_run.email

    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }

    timeout = "3600s"

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.main.connection_name]
      }
    }

    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello"

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      ports {
        container_port = 8080
      }

      # Environment variables for DB connection
      env {
        name  = "DB_HOST"
        value = "/cloudsql/${google_sql_database_instance.main.connection_name}"
      }
      env {
        name  = "DB_CONNECTION_NAME"
        value = google_sql_database_instance.main.connection_name
      }
      env {
        name  = "DB_NAME"
        value = google_sql_database.app.name
      }
      env {
        name  = "DB_USER"
        value = google_sql_user.app.name
      }
      env {
        name = "DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_password.secret_id
            version = "latest"
          }
        }
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
    }
  }

  labels = local.common_labels

  depends_on = [
    google_project_service.apis,
    google_sql_database_instance.main,
    google_secret_manager_secret_version.db_password,
  ]
}

# Allow unauthenticated access (public API for now)
resource "google_cloud_run_v2_service_iam_member" "public" {
  project  = var.project_id
  location = google_cloud_run_v2_service.api.location
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# -----------------------------------------------------------------------------
# Cloud SQL - PostgreSQL Instance
# -----------------------------------------------------------------------------

resource "google_sql_database_instance" "main" {
  name             = local.db_instance_name
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier              = "db-f1-micro" # Dev tier, small and cost-effective
    availability_type = "ZONAL"       # Single zone for dev
    disk_size         = 10            # GB
    disk_type         = "PD_SSD"

    backup_configuration {
      enabled                        = true
      start_time                     = "03:00" # 3 AM UTC
      point_in_time_recovery_enabled = true
      backup_retention_settings {
        retained_backups = 7
      }
    }

    ip_configuration {
      ipv4_enabled = true # Public IP for Cloud SQL Auth Proxy connection
    }

    database_flags {
      name  = "max_connections"
      value = "50" # Low for dev, increase for prod
    }

    user_labels = local.common_labels
  }

  deletion_protection = false # Set to true for prod

  depends_on = [google_project_service.apis]
}

# -----------------------------------------------------------------------------
# Cloud SQL - Database
# -----------------------------------------------------------------------------

resource "google_sql_database" "app" {
  name     = local.db_name
  instance = google_sql_database_instance.main.name
}

# -----------------------------------------------------------------------------
# Cloud SQL - Application User
# -----------------------------------------------------------------------------

resource "random_password" "db_password" {
  length  = 32
  special = false # Avoid special chars for connection string compatibility
}

resource "google_sql_user" "app" {
  name     = local.db_user
  instance = google_sql_database_instance.main.name
  password = random_password.db_password.result
}

# Store password in Secret Manager
resource "google_secret_manager_secret" "db_password" {
  secret_id = "${var.app_name}-db-password"

  replication {
    auto {}
  }

  labels = local.common_labels

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}

# -----------------------------------------------------------------------------
# Service Account for Cloud Run
# -----------------------------------------------------------------------------

resource "google_service_account" "cloud_run" {
  account_id   = "${var.app_name}-run-sa"
  display_name = "Cloud Run Service Account for ${var.app_name}"
}

# Grant Cloud SQL Client role to Cloud Run SA
resource "google_project_iam_member" "cloud_run_cloudsql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Grant Secret Manager access for DB password
resource "google_secret_manager_secret_iam_member" "cloud_run_db_password" {
  secret_id = google_secret_manager_secret.db_password.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}
