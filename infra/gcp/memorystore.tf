# ---------------------------------------------------------------------------
# Memorystore — managed Redis replacing the K8s Deployment
# ---------------------------------------------------------------------------
# BASIC tier = no replication. Fine for dev where Redis is used for caching
# and pub/sub (both ephemeral). For prod, switch to STANDARD_HA for automatic
# failover to a replica.
#
# BASIC tier does not support AUTH, so the connection string has no password —
# same pattern as the current K8s redis:// URL.

resource "google_redis_instance" "cache" {
  name           = "thread-lens-${var.environment}-redis"
  tier           = "BASIC"
  memory_size_gb = var.redis_memory_size_gb
  region         = var.region
  redis_version  = var.redis_version

  authorized_network = google_compute_network.vpc.id
  connect_mode       = "PRIVATE_SERVICE_ACCESS"

  labels = {
    environment = var.environment
  }

  depends_on = [google_service_networking_connection.private_vpc]
}
