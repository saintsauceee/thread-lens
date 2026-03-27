# ---------------------------------------------------------------------------
# Artifact Registry — container image storage
# ---------------------------------------------------------------------------
# Replaces minikube's `imagePullPolicy: Never` + local builds.
# GKE nodes pull images from here. The IAM section grants the node
# service account read access.
#
# After provisioning, push images like:
#   docker push {region}-docker.pkg.dev/{project_id}/thread-lens/research:latest

resource "google_artifact_registry_repository" "images" {
  location      = var.region
  repository_id = "thread-lens"
  format        = "DOCKER"
  description   = "Container images for Thread Lens"

  labels = {
    environment = var.environment
  }
}
