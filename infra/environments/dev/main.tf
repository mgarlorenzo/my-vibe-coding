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
# Uncomment as needed when adding resources

# resource "google_project_service" "apis" {
#   for_each = toset([
#     "compute.googleapis.com",
#     "container.googleapis.com",
#     "run.googleapis.com",
#     "cloudsql.googleapis.com",
#     "secretmanager.googleapis.com",
#     "cloudresourcemanager.googleapis.com",
#     "iam.googleapis.com",
#   ])
#
#   project = var.project_id
#   service = each.value
#
#   disable_dependent_services = false
#   disable_on_destroy         = false
# }
