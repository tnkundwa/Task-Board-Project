#!/bin/bash
set -euo pipefail

# Assumes services/.env has MySQL credentials with CREATE DATABASE privilege.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SERVICES_DIR="$ROOT_DIR/services"
LOG_DIR="$ROOT_DIR/infrastructure/.logs"
PID_DIR="$ROOT_DIR/infrastructure/.pids"
mkdir -p "$LOG_DIR" "$PID_DIR"

READY_TIMEOUT=90
POLL_INTERVAL=2

PIDS=()

# ---------------------------------------------------------------------------
# Cleanup only runs if the script itself is interrupted mid-startup.
# Once main() finishes and exits 0, services are meant to keep running.
# ---------------------------------------------------------------------------
cleanup() {
  echo ""
  echo "Interrupted!! stopping services started by this run..."
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "$pid" 2>/dev/null; then
      pkill -P "$pid" 2>/dev/null || true   # mvn spring-boot:run forks a child JVM
      kill "$pid" 2>/dev/null || true
    fi
  done
  exit 1
}
trap cleanup INT TERM

# ---------------------------------------------------------------------------
# Networking helpers
# ---------------------------------------------------------------------------
is_port_open() {
  local host="$1" port="$2"
  (exec 3<>"/dev/tcp/$host/$port") 2>/dev/null
}

http_ok() {
  local url="$1"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 "$url" 2>/dev/null || echo "000")
  [ "$code" != "000" ]
}

wait_until() {
  local description="$1" check_fn="$2"
  shift 2
  local waited=0
  until "$check_fn" "$@"; do
    if [ "$waited" -ge "$READY_TIMEOUT" ]; then
      echo "Timed out waiting for $description"
      return 1
    fi
    sleep "$POLL_INTERVAL"
    waited=$((waited + POLL_INTERVAL))
    echo "  ...still waiting for $description (${waited}s)"
  done
  echo "$description is ready."
}

# ---------------------------------------------------------------------------
# Prerequisite checks
# ---------------------------------------------------------------------------
check_prerequisites() {
  local missing=()
  local tools=(java mvn mysql node pnpm)

  for tool in "${tools[@]}"; do
    if ! command -v "$tool" > /dev/null 2>&1; then
      missing+=("$tool")
    fi
  done

  if ! is_port_open 127.0.0.1 5672; then
    missing+=("rabbitmq (port 5672 not reachable)")
  fi

  if [ "${#missing[@]}" -gt 0 ]; then
    echo "Missing prerequisites:"
    for m in "${missing[@]}"; do
      echo "  - $m"
    done
    exit 1
  fi

  echo "All prerequisites found."
}

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------
load_env() {
  local env_file="$SERVICES_DIR/.env"
  if [ ! -f "$env_file" ]; then
    echo "Missing $env_file"
    echo "Run: cp services/.env.example services/.env   and fill in credentials."
    exit 1
  fi
  set -a
  # shellcheck disable=SC1090
  source "$env_file"
  set +a
}

# ---------------------------------------------------------------------------
# MySQL
# ---------------------------------------------------------------------------
mysql_ping() {
  mysqladmin ping -h 127.0.0.1 -P 3306 \
    -u"$SPRING_DATASOURCE_USERNAME" -p"$SPRING_DATASOURCE_PASSWORD" \
    --silent > /dev/null 2>&1
}

create_databases() {
  echo "Ensuring databases exist (idempotent)..."
  if ! mysql -h 127.0.0.1 -P 3306 \
    -u"$SPRING_DATASOURCE_USERNAME" -p"$SPRING_DATASOURCE_PASSWORD" <<-SQL
      CREATE DATABASE IF NOT EXISTS taskdb;
      CREATE DATABASE IF NOT EXISTS teamdb;
      CREATE DATABASE IF NOT EXISTS notificationdb;
SQL
  then
    echo "Failed to create databases — check credentials in services/.env"
    exit 1
  fi
}

# ---------------------------------------------------------------------------
# Start one Spring Boot service, skipping it if already up (idempotent)
# ---------------------------------------------------------------------------
start_service() {
  local name="$1" dir="$2" port="$3" health_url="$4"

  if http_ok "$health_url"; then
    echo "$name already running on port $port — skipping."
    return 0
  fi

  echo "Starting $name..."
  (
    cd "$SERVICES_DIR/$dir"
    nohup mvn -q spring-boot:run > "$LOG_DIR/$name.log" 2>&1 &
    echo $! > "$PID_DIR/$name.pid"
  )
  local pid
  pid=$(cat "$PID_DIR/$name.pid")
  PIDS+=("$pid")

  wait_until "$name" http_ok "$health_url"
}

start_frontend() {
  local health_url="http://localhost:3000"

  if http_ok "$health_url"; then
    echo "frontend already running on port 3000 — skipping."
    return 0
  fi

  echo "Starting frontend..."
  (
    cd "$ROOT_DIR/frontend"
    pnpm install --frozen-lockfile > "$LOG_DIR/frontend-install.log" 2>&1
    nohup pnpm dev > "$LOG_DIR/frontend.log" 2>&1 &
    echo $! > "$PID_DIR/frontend.pid"
  )
  local pid
  pid=$(cat "$PID_DIR/frontend.pid")
  PIDS+=("$pid")

  wait_until "frontend" http_ok "$health_url"
}

# ---------------------------------------------------------------------------
main() {
  echo "== Task Board Platform: local startup =="

  check_prerequisites
  load_env

  echo ""
  echo "-- Databases --"
  wait_until "MySQL" mysql_ping
  create_databases

  echo ""
  echo "-- RabbitMQ --"
  wait_until "RabbitMQ" is_port_open 127.0.0.1 5672

  echo ""
  echo "-- Backend services (in dependency order) --"
  start_service "team-service"          "team-service"          8082 "http://localhost:8082/api/teams"
  start_service "task-service"          "task-service"          8081 "http://localhost:8081/api/tasks"
  start_service "notification-service"  "notification-service"  8083 "http://localhost:8083/api/notifications"
  start_service "api-gateway"           "api-gateway"           8080 "http://localhost:8080/api/teams"

  echo ""
  echo "-- Frontend --"
  start_frontend

  echo ""
  echo "All services are up:"
  echo "  Frontend:            http://localhost:3000"
  echo "  API Gateway:         http://localhost:8080"
  echo "  Team Service:        http://localhost:8082"
  echo "  Task Service:        http://localhost:8081"
  echo "  Notification Service: http://localhost:8083"
}

main