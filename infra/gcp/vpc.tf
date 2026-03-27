# ---------------------------------------------------------------------------
# VPC — the private network that ties everything together
# ---------------------------------------------------------------------------
# Every resource (GKE, Cloud SQL, Memorystore) lives in this VPC.
# Custom mode = we define subnets explicitly instead of GCP auto-creating
# one per region. This gives us control over CIDR ranges, which matters
# because GKE needs non-overlapping secondary ranges for pods and services.

resource "google_compute_network" "vpc" {
  name                    = "thread-lens-${var.environment}-vpc"
  auto_create_subnetworks = false
}

# ---------------------------------------------------------------------------
# Subnet for GKE nodes + secondary ranges for pods and services
# ---------------------------------------------------------------------------
# GKE gives every pod its own IP (not just every node). A 3-node cluster
# can easily run 100+ pods, so the pod range needs to be large.
#
# 10.10.0.0/24  = 254 node IPs   (more than enough for 1-3 dev nodes)
# 10.20.0.0/16  = 65,536 pod IPs (GKE default expectation)
# 10.30.0.0/20  = 4,096 service IPs (internal ClusterIP services)

resource "google_compute_subnetwork" "gke" {
  name          = "thread-lens-${var.environment}-gke"
  region        = var.region
  network       = google_compute_network.vpc.id
  ip_cidr_range = "10.10.0.0/24"

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.20.0.0/16"
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.30.0.0/20"
  }

  # Lets nodes reach Google APIs (Cloud SQL, Artifact Registry, etc.)
  # without needing external IPs.
  private_ip_google_access = true
}

# ---------------------------------------------------------------------------
# Private services access — private IPs for Cloud SQL and Memorystore
# ---------------------------------------------------------------------------
# Instead of giving managed services public IPs and firewalling them,
# we reserve a block of IPs inside our VPC and let Google place the
# database/cache there. The result: your DB is only reachable from
# within your network, just like the minikube setup — but enforced
# at the network level.
#
# This resource can take 5+ minutes to create/destroy. That's normal —
# Google is peering your VPC with their internal services network.

resource "google_compute_global_address" "private_services" {
  name          = "thread-lens-${var.environment}-private-services"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "private_vpc" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_services.name]
}
