# ---------------------------------------------------------------------------
# GKE cluster
# ---------------------------------------------------------------------------
# Standard mode (not Autopilot) — explicit node pool config so you can see
# exactly what you're paying for and how it works.
#
# Zonal (not Regional) — control plane runs in a single zone. Cheaper for
# dev. For prod, change `location` to `var.region` to get a regional cluster
# with 3 control plane replicas.

resource "google_container_cluster" "primary" {
  name     = "thread-lens-${var.environment}"
  location = var.zone

  # Best practice: remove the default node pool that GKE creates automatically,
  # then define our own with explicit settings. The default pool uses the
  # Compute Engine default SA and generic settings — we want control.
  initial_node_count       = 1
  remove_default_node_pool = true

  network    = google_compute_network.vpc.id
  subnetwork = google_compute_subnetwork.gke.id

  # Tell GKE which secondary IP ranges to use for pods and services.
  # These were defined in vpc.tf on the subnet.
  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  # Private cluster: nodes only get internal IPs. They reach the internet
  # through Cloud NAT (if needed) or private Google access for GCP APIs.
  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false # Keep API endpoint public so kubectl works from your laptop
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  # Workload Identity: lets pods authenticate as GCP service accounts
  # without key files. See iam.tf for the binding.
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # Learning project — allow deletion without the safety net.
  deletion_protection = false

  resource_labels = {
    environment = var.environment
    app         = "thread-lens"
  }
}

# ---------------------------------------------------------------------------
# Node pool — the actual VMs running your containers
# ---------------------------------------------------------------------------

resource "google_container_node_pool" "primary" {
  name     = "thread-lens-${var.environment}-pool"
  location = var.zone
  cluster  = google_container_cluster.primary.name

  node_count = var.gke_num_nodes

  node_config {
    machine_type = var.gke_machine_type
    disk_size_gb = var.gke_disk_size_gb

    # Use our dedicated SA instead of the default Compute Engine SA.
    service_account = google_service_account.gke_nodes.email

    # OAuth scopes limit what the node's SA can access at the API level.
    # Even though the SA has IAM roles, scopes are a second gate.
    oauth_scopes = [
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
      "https://www.googleapis.com/auth/devstorage.read_only",
    ]

    # Required for Workload Identity to intercept metadata requests.
    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    labels = {
      environment = var.environment
    }
  }
}
