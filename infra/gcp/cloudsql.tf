# ---------------------------------------------------------------------------
# Cloud SQL — managed PostgreSQL replacing the K8s StatefulSet
# ---------------------------------------------------------------------------

# Cloud SQL instance names are globally unique across all of GCP, and after
# deletion they're reserved for ~1 week. The random suffix prevents name
# collisions when tearing down and recreating the environment.
resource "random_id" "db_suffix" {
  byte_length = 4
}

# Strong password for the app database user. No special characters to avoid
# URL-encoding headaches in DATABASE_URL connection strings.
resource "random_password" "db_password" {
  length  = 32
  special = false
}

resource "google_sql_database_instance" "postgres" {
  name                = "thread-lens-${var.environment}-${random_id.db_suffix.hex}"
  database_version    = "POSTGRES_17"
  region              = var.region
  deletion_protection = false # Learning project — easy teardown

  settings {
    tier              = var.cloudsql_tier
    disk_size         = var.cloudsql_disk_size_gb
    disk_autoresize   = true
    availability_type = "ZONAL" # Single zone — cheaper for dev. Use REGIONAL for prod HA.

    ip_configuration {
      ipv4_enabled    = false # No public IP — only reachable from within the VPC
      private_network = google_compute_network.vpc.id
    }

    backup_configuration {
      enabled    = true
      start_time = "03:00" # UTC — run backups during off-peak
    }

    insights_config {
      query_insights_enabled = true # Free query performance dashboard
    }
  }

  # Cloud SQL needs the private services connection to exist before it can
  # get a private IP inside the VPC.
  depends_on = [google_service_networking_connection.private_vpc]
}

resource "google_sql_database" "thread_lens" {
  name     = var.cloudsql_db_name
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_user" "app" {
  name     = "thread-lens"
  instance = google_sql_database_instance.postgres.name
  password = random_password.db_password.result
}
