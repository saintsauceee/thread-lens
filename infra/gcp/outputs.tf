# ---------------------------------------------------------------------------
# GKE
# ---------------------------------------------------------------------------

output "gke_cluster_name" {
  description = "Name of the GKE cluster — use with: gcloud container clusters get-credentials"
  value       = google_container_cluster.primary.name
}

output "gke_cluster_endpoint" {
  description = "GKE API endpoint for kubectl"
  value       = google_container_cluster.primary.endpoint
  sensitive   = true
}

output "gke_cluster_ca_certificate" {
  description = "Base64-encoded CA cert for the cluster API"
  value       = google_container_cluster.primary.master_auth[0].cluster_ca_certificate
  sensitive   = true
}

# ---------------------------------------------------------------------------
# Cloud SQL
# ---------------------------------------------------------------------------

output "cloudsql_connection_name" {
  description = "Connection name in project:region:instance format — used by Cloud SQL Proxy"
  value       = google_sql_database_instance.postgres.connection_name
}

output "cloudsql_private_ip" {
  description = "Private IP of the Cloud SQL instance (reachable from within the VPC)"
  value       = google_sql_database_instance.postgres.private_ip_address
}

# Matches the DATABASE_URL format in k8s/configmap.yaml
output "database_url" {
  description = "PostgreSQL connection string for the app"
  value       = "postgresql://${google_sql_user.app.name}:${random_password.db_password.result}@${google_sql_database_instance.postgres.private_ip_address}:5432/${var.cloudsql_db_name}"
  sensitive   = true
}

# ---------------------------------------------------------------------------
# Memorystore
# ---------------------------------------------------------------------------

output "redis_host" {
  description = "Private IP of the Memorystore Redis instance"
  value       = google_redis_instance.cache.host
}

output "redis_port" {
  description = "Redis port (always 6379)"
  value       = google_redis_instance.cache.port
}

# Matches the REDIS_URL format in k8s/configmap.yaml
output "redis_url" {
  description = "Redis connection string for the app"
  value       = "redis://${google_redis_instance.cache.host}:${google_redis_instance.cache.port}"
}

# ---------------------------------------------------------------------------
# Artifact Registry
# ---------------------------------------------------------------------------

output "artifact_registry_url" {
  description = "Base URL for pushing images — append /research:tag, /worker:tag, /client:tag"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.images.repository_id}"
}
