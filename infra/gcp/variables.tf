# ---------------------------------------------------------------------------
# Project
# ---------------------------------------------------------------------------

variable "project_id" {
  description = "GCP project ID (not the display name — the globally unique ID)"
  type        = string
}

variable "region" {
  description = "GCP region for all resources"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "GCP zone for the GKE cluster (zonal cluster = cheaper, fine for dev)"
  type        = string
  default     = "us-central1-a"
}

variable "environment" {
  description = "Environment label applied to all resources"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of: dev, staging, prod"
  }
}

# ---------------------------------------------------------------------------
# GKE
# ---------------------------------------------------------------------------

variable "gke_num_nodes" {
  description = "Number of nodes in the GKE node pool"
  type        = number
  default     = 1

  validation {
    condition     = var.gke_num_nodes >= 1
    error_message = "gke_num_nodes must be at least 1"
  }
}

variable "gke_machine_type" {
  description = "Machine type for GKE nodes (e2-medium is ~$25/mo, enough for dev)"
  type        = string
  default     = "e2-medium"
}

variable "gke_disk_size_gb" {
  description = "Boot disk size in GB for each GKE node"
  type        = number
  default     = 50
}

# ---------------------------------------------------------------------------
# Cloud SQL (PostgreSQL)
# ---------------------------------------------------------------------------

variable "cloudsql_tier" {
  description = "Cloud SQL machine tier (db-f1-micro is the smallest, ~$7/mo)"
  type        = string
  default     = "db-f1-micro"
}

variable "cloudsql_disk_size_gb" {
  description = "Initial disk size in GB for Cloud SQL (autoresize is enabled)"
  type        = number
  default     = 10
}

variable "cloudsql_db_name" {
  description = "Name of the PostgreSQL database to create"
  type        = string
  default     = "thread_lens"
}

# ---------------------------------------------------------------------------
# Memorystore (Redis)
# ---------------------------------------------------------------------------

variable "redis_memory_size_gb" {
  description = "Memory size in GB for Memorystore Redis"
  type        = number
  default     = 1
}

variable "redis_version" {
  description = "Redis version for Memorystore"
  type        = string
  default     = "REDIS_7_0"
}
