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
  default     = "europe-west3" # Frankfurt
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
# Database Configuration (from GitHub Variables)
# -----------------------------------------------------------------------------

variable "db_name" {
  description = "Database name (passed from GitHub vars)"
  type        = string
  default     = null # Will use app_name if not provided
}

variable "db_user" {
  description = "Database user name (passed from GitHub vars)"
  type        = string
  default     = null # Will use {app_name}_app if not provided
}

variable "db_instance_name" {
  description = "Cloud SQL instance name (passed from GitHub vars)"
  type        = string
  default     = null # Will use {app_name}-db if not provided
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

  # Database naming - use variables if provided, otherwise derive from app_name
  db_instance_name = coalesce(var.db_instance_name, "${var.app_name}-db")
  db_name          = coalesce(var.db_name, var.app_name)
  db_user          = coalesce(var.db_user, "${replace(var.app_name, "-", "_")}_app")
}
