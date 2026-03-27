terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  # Uncomment when you have a GCS bucket for remote state.
  # Create the bucket first: gsutil mb gs://thread-lens-tfstate
  #
  # backend "gcs" {
  #   bucket = "thread-lens-tfstate"
  #   prefix = "env/dev"
  # }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ---------------------------------------------------------------------------
# Enable GCP APIs
# ---------------------------------------------------------------------------
# GCP requires APIs to be explicitly enabled before you can create resources.
# disable_on_destroy = false prevents `terraform destroy` from turning off
# APIs that other projects/services in the same GCP project might depend on.

resource "google_project_service" "compute" {
  service            = "compute.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "container" {
  service            = "container.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "sqladmin" {
  service            = "sqladmin.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "redis" {
  service            = "redis.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "artifact_registry" {
  service            = "artifactregistry.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "iam" {
  service            = "iam.googleapis.com"
  disable_on_destroy = false
}

# Private services access — lets Cloud SQL and Memorystore get private IPs
# inside your VPC instead of being exposed to the public internet.
resource "google_project_service" "servicenetworking" {
  service            = "servicenetworking.googleapis.com"
  disable_on_destroy = false
}
