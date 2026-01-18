# -----------------------------------------------------------------------------
# Required Variables
# -----------------------------------------------------------------------------

variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region for resources"
  type        = string
  default     = "europe-west1"
}

# -----------------------------------------------------------------------------
# Environment Variables
# -----------------------------------------------------------------------------

variable "env" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.env)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "app_name" {
  description = "Application name used for resource naming"
  type        = string
  default     = "employee-platform"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,28}[a-z0-9]$", var.app_name))
    error_message = "App name must be lowercase, start with a letter, and be 4-30 characters."
  }
}

# -----------------------------------------------------------------------------
# Optional Variables
# -----------------------------------------------------------------------------

variable "labels" {
  description = "Common labels to apply to all resources"
  type        = map(string)
  default     = {}
}

# -----------------------------------------------------------------------------
# Locals
# -----------------------------------------------------------------------------

locals {
  # Common labels for all resources
  common_labels = merge(
    {
      env        = var.env
      app        = var.app_name
      managed_by = "terraform"
      repository = "my-vibe-coding"
    },
    var.labels
  )

  # Naming convention: {app_name}-{resource}-{env}
  name_prefix = "${var.app_name}-${var.env}"
}
