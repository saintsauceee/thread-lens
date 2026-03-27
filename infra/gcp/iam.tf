# ---------------------------------------------------------------------------
# Service account for GKE nodes
# ---------------------------------------------------------------------------
# Replaces the default Compute Engine SA which has overly broad permissions.
# This SA can only: write logs, write metrics, and pull container images.

resource "google_service_account" "gke_nodes" {
  account_id   = "thread-lens-${var.environment}-gke"
  display_name = "Thread Lens GKE Nodes (${var.environment})"
}

# Node permissions — the minimum set for GKE nodes to function.
resource "google_project_iam_member" "node_log_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.gke_nodes.email}"
}

resource "google_project_iam_member" "node_metric_writer" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.gke_nodes.email}"
}

resource "google_project_iam_member" "node_monitoring_viewer" {
  project = var.project_id
  role    = "roles/monitoring.viewer"
  member  = "serviceAccount:${google_service_account.gke_nodes.email}"
}

resource "google_project_iam_member" "node_resource_metadata_writer" {
  project = var.project_id
  role    = "roles/stackdriver.resourceMetadata.writer"
  member  = "serviceAccount:${google_service_account.gke_nodes.email}"
}

resource "google_project_iam_member" "node_ar_reader" {
  project = var.project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.gke_nodes.email}"
}

# ---------------------------------------------------------------------------
# Service account for app workloads (Workload Identity)
# ---------------------------------------------------------------------------
# Instead of mounting a JSON key file into pods (fragile, leakable), Workload
# Identity lets K8s service accounts impersonate GCP service accounts.
#
# How it works:
# 1. Pod runs as K8s SA "research" in namespace "thread-lens"
# 2. GKE intercepts metadata requests and exchanges the K8s token for a
#    GCP access token scoped to this SA's permissions
# 3. Pod can now call Cloud SQL without any key files
#
# The binding below says: "K8s SA thread-lens/research can act as this GCP SA"

resource "google_service_account" "app_workload" {
  account_id   = "thread-lens-${var.environment}-app"
  display_name = "Thread Lens App Workload (${var.environment})"
}

resource "google_project_iam_member" "app_cloudsql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.app_workload.email}"
}

resource "google_service_account_iam_member" "workload_identity_binding" {
  service_account_id = google_service_account.app_workload.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[thread-lens/research]"
}
