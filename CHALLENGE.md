# Task Board Platform — Infrastructure Challenges

The application code is written, compiles, and runs on a developer's machine. None of it is containerised, none of it is deployed, none of it survives a reboot.
These challenges take you from "works on my machine" to a deployed, observable, failure-tolerant platform on Kubernetes. Each challenge is a user story with acceptance criteria.
## Team approach

Split the work. Challenge each other's decisions. Every team member must be able to explain and defend any part of the system in the final review.
Document every major decision in `docs/decisions.md` with at least two alternatives considered and the rationale for the chosen approach.


## Challenge 1: Local platform startup

**As a** platform engineer,
**I want** to start the entire platform with one command on a bare Linux machine
**so that** any team member can run the full system without reading service-specific documentation.

### What you need to do

There is no startup script. Environment variables for database URLs, credentials, and RabbitMQ addresses are scattered across multiple `application.yml` files. The services must start in a specific order (databases → Team Service → Task Service → Notification Service → API Gateway → Frontend), and each must be reachable before the next one starts.

Build `infrastructure/scripts/start-local.sh` — idempotent, checks prerequisites (Java, Maven, MySQL, RabbitMQ, Node.js, pnpm), creates databases if they do not exist, starts services in dependency order, waits for each to be ready before proceeding, handles failures gracefully.

### Constraints

- Services must start without human interaction after the script is invoked
- The script must detect missing prerequisites and report them clearly
- Stopping the script (Ctrl+C) must clean up all started processes
- Switching from MySQL to PostgreSQL is permitted but must be documented in `docs/decisions.md` with buy-in from all five team members

### Acceptance criteria

```bash
git clone <repo> && cd task-board-platform
./infrastructure/scripts/start-local.sh
# exits 0 when all services respond
```

---

## Challenge 2: Containerised services

**As a** platform engineer,
**I want** each service packaged as a self-contained, reproducible Docker image under 200 MB
**so that** the platform can be deployed to any container runtime without host dependencies.

### What you need to do

Write five Dockerfiles, one per service. The Spring Boot services produce a fat JAR via Maven in the first stage, then copy only the JAR and a minimal JRE into the runtime stage. The frontend builds with `pnpm` and is served by nginx — not the Next.js dev server.

### Constraints

- No image may exceed 200 MB. You will need to understand what goes into a JRE image, how Alpine vs distroless base images compare, and how to strip unnecessary files
- Images run as a non-root user. Spring Boot writes to `tmpdir` and the application root — you must configure these at runtime via environment variables
- All configuration enters through environment variables. No hard-coded values from the build stage may survive into the runtime image
- Every image has a `HEALTHCHECK` that validates the service is actually responding, not just that the process is alive
- Every image has a `.dockerignore` to avoid sending `target/`, `node_modules/`, and local config into the build context
- Builds must be reproducible: the same commit + same Dockerfile always produces the same image digest
- The frontend image must handle client-side routing (serve `index.html` for unknown paths, not return 404)

### Acceptance criteria

```bash
docker build -t task-board/frontend:1.0.0 ./frontend
docker run -d -p 3000:3000 task-board/frontend:1.0.0
curl -s http://localhost:3000/teams/some-team-id | head -3
# returns HTML, not 404

docker build -t task-board/task-service:1.0.0 ./services/task-service
docker run -d -p 8081:8081 -e SPRING_DATASOURCE_URL=jdbc:mysql://host.docker.internal:3306/taskdb \
  task-board/task-service:1.0.0
# service passes HEALTHCHECK within 30 seconds

docker images task-board/* --format "table {{.Repository}}\t{{.Size}}"
# every image under 200 MB
```

---

## Challenge 3: Multi-container orchestration

**As a** platform engineer,
**I want** a single `docker compose up` to start the entire platform with all dependencies
**so that** local development and CI environments are identical and reproducible.

### What you need to do

Create `infrastructure/docker/docker-compose.yml` and an associated `.env` file.

All seven containers (five application services + MySQL + RabbitMQ) must be defined. They must share a dedicated Docker network where services resolve each other by container name.

MySQL needs initialisation scripts that create `taskdb`, `teamdb`, and `notificationdb` on first start. The application services must not start before MySQL and RabbitMQ are healthy — use Docker health checks with `condition: service_healthy`, not bare `depends_on`.

For local development, create `docker-compose.override.yml` that mounts the frontend source code as a volume and runs `pnpm dev` instead of the production build, enabling hot-reload.

### Constraints

- The `.env` file is committed to the repository with sensible defaults (credentials are for local development only)
- The compose file does not hard-code any values that could be in `.env`
- MySQL data and RabbitMQ data persist across restarts via named volumes
- The health check for each application service must test actual readiness: Spring Boot services must demonstrate they can accept connections (use the port being open via `CMD curl` or `CMD nc` inside the container), not just that the container is running
- A validation script `infrastructure/scripts/validate-compose.sh` must exist that exercises every API endpoint through the Gateway and exits non-zero if any check fails

### Acceptance criteria

```bash
docker compose up -d
docker compose ps
# all 7 services show "healthy"
./infrastructure/scripts/validate-compose.sh
# exits 0
```

---

## Challenge 4: Kubernetes deployment

**As a** platform engineer,
**I want** the entire platform deployed to a Kubernetes cluster with a single `kubectl apply`
**so that** the system runs on a production-grade orchestrator with self-healing, scaling, and rolling updates.

### What you need to do

Create Kubernetes manifests under `infrastructure/kubernetes/`.

Structure:

```
infrastructure/kubernetes/
├── base/
│   ├── kustomization.yaml
│   ├── frontend-deployment.yaml + service.yaml
│   ├── gateway-deployment.yaml + service.yaml
│   ├── task-service-deployment.yaml + service.yaml
│   ├── team-service-deployment.yaml + service.yaml
│   ├── notification-service-deployment.yaml + service.yaml
│   ├── mysql-statefulset.yaml + service.yaml + pvc.yaml
│   ├── rabbitmq-statefulset.yaml + service.yaml
│   ├── ingress.yaml
│   └── configmap.yaml
└── overlays/
    └── dev/
        ├── kustomization.yaml
        └── secrets.yaml
```

All application Services must be `ClusterIP`. The only way in is through the Ingress.

The Ingress must route:
- `/*` → Frontend (port 3000)
- `/api/*` → Gateway (port 8080)
- Each service's Swagger UI must be reachable through the Gateway (design the path routing yourself)

MySQL requires an init container or a one-shot Job that runs `CREATE DATABASE IF NOT EXISTS` for `taskdb`, `teamdb`, and `notificationdb` before the application services start. Database credentials live in a Secret, not a ConfigMap.

The Gateway's `application.yml` hard-codes `localhost` for upstream services. This will not work in Kubernetes. Override it — your choices are environment variables, a ConfigMap mounted over the default config, or a separate Kustomize patch. You must not modify the packaged JAR.

Resource requests and limits must be set on every container. Start with educated guesses, then refine based on observation.

### Constraints

- Every Service is `ClusterIP`. No `NodePort`, no `LoadBalancer`
- Secrets are plain-text in the repo (this is a training project). Production would use SOPS or SealedSecrets
- Use kind or Minikube. Provide a cluster configuration file at `infrastructure/kubernetes/kind-config.yaml` or `minikube-config.yaml`
- A validation script `infrastructure/scripts/validate-k8s.sh` must run inside the cluster, call every API endpoint through the Gateway by DNS name, and exit non-zero if any check fails

### Acceptance criteria

```bash
kind create cluster --config infrastructure/kubernetes/kind-config.yaml
kubectl apply -k infrastructure/kubernetes/overlays/dev
kubectl wait --for=condition=Ready pods --all -n taskboard --timeout=120s
kubectl run validate-k8s --image=task-board/validate-k8s --restart=Never \
  --env="BASE_URL=http://gateway:8080"
kubectl logs validate-k8s | tail -3
# "All checks passed"
curl http://localhost/api/teams  # through Ingress → Gateway
```

---

## Challenge 5: Network isolation

**As a** security engineer,
**I want** only the API Gateway reachable from outside the cluster and all inter-service traffic restricted to explicitly permitted paths
**so that** a compromised service cannot pivot laterally to other services.

### What you need to do

Write NetworkPolicy resources and a validation script that proves the policies work.

The permitted communication matrix:

| Source | Destination | Port | Reason |
|--------|-------------|------|--------|
| Ingress controller | Frontend | 3000 | external traffic |
| Ingress controller | Gateway | 8080 | external traffic |
| Frontend (pods) | Gateway | 8080 | API calls |
| Gateway | Task Service | 8081 | routing |
| Gateway | Team Service | 8082 | routing |
| Gateway | Notification Service | 8083 | routing |
| Task Service | Team Service | 8082 | member validation |
| Task Service | RabbitMQ | 5672 | event publishing |
| Notification Service | RabbitMQ | 5672 | event consumption |
| Any pod | MySQL | 3306 | database access |
| Any pod | kube-dns | 53 (TCP+UDP) | DNS |
| Everything else | — | — | DENY |

Create `infrastructure/scripts/validate-network.sh` that runs inside the cluster (via `kubectl run` or a Job), probes every permitted and forbidden path, and prints `[PASS]` or `[FAIL]` for each. It must exit non-zero if any expected-to-pass check fails or any expected-to-fail check passes.

### Constraints

- NetworkPolicies must be placed in `infrastructure/kubernetes/overlays/dev/network-policies/` and applied via a separate `kubectl apply` command (not mixed into the main kustomize)
- Policies must use pod selectors that match the Deployment labels. If the labels change in a future iteration, the policies must automatically apply to the new pods
- The validation script must be self-contained: it creates its own debug pod, runs checks, collects results, and cleans up
- kind uses Calico or a basic CNI — test that your policies work on kind before assuming they are correct

### Acceptance criteria

```bash
kubectl apply -f infrastructure/kubernetes/overlays/dev/network-policies/
./infrastructure/scripts/validate-network.sh
# [PASS] Frontend → Gateway: 200
# [FAIL] Frontend → Task Service: connection refused (expected)
# [PASS] Task Service → Team Service: 200
# [PASS] Task Service → RabbitMQ: 5672 open
# ... all 12+ checks
# Exit code 0
```

---

## Challenge 6: Resilience and self-healing

**As a** site reliability engineer,
**I want** the platform to survive infrastructure failures without data loss or cascading crashes
**so that** users experience degraded-but-functional behaviour instead of a complete outage.

### What you need to do

#### Probes

None of the services expose Spring Boot Actuator (you cannot add it — modifying service code is out of scope). You must decide how to probe them. `tcpSocket` probes can check that the port is open. `exec` probes can run a script inside the container. A sidecar container could expose a health endpoint. Choose the approach that best matches each service's behaviour and document your reasoning in `docs/probes.md`.

Configure liveness, readiness, and startup probes on every container with tuned thresholds. Services that depend on MySQL or RabbitMQ must report not-ready when their dependency is unavailable, but must not be killed. The Gateway must report not-ready if any of its upstream services are unreachable.

#### Failure scenarios

**RabbitMQ outage:** When RabbitMQ goes down, the Task Service must still accept and process task creation, assignment, and status changes. Notifications must be delivered once RabbitMQ recovers. Read the Task Service source code to understand how it publishes to RabbitMQ — does it use confirms? A retry template? Simple fire-and-forget? Your probe and recovery strategy must account for this.

**Team Service outage:** When the Team Service is down and the Task Service tries to validate a member during assignment:
- The Task Service must return an HTTP error to the caller quickly (not hang until the HTTP client timeout)
- The Gateway must propagate this error as a clear message to the frontend
- Other endpoints on the Task Service (create task, list tasks, change status) must continue working

#### Resource limits

Set CPU and memory requests and limits on every container. Document the values and how you determined them in `docs/resource-planning.md`.

### Constraints

- You may not add Spring Boot Actuator or any other dependency to the service `pom.xml` files
- Probes must not depend on endpoints that do not exist in the services
- When RabbitMQ recovers, delayed notifications must arrive within 30 seconds
- Readiness probe failures must never cause a container restart — that is what liveness probes are for
- Document probe types and thresholds with explicit justification in `docs/probes.md`

### Acceptance criteria

```bash
# Kill RabbitMQ
kubectl delete pod rabbitmq-0 -n taskboard
# Create and assign a task — must succeed
curl -X POST http://localhost/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Resilience test","teamId":1}'
# 200
curl -X PUT http://localhost/api/tasks/1/assign \
  -H "Content-Type: application/json" \
  -d '{"assigneeId":1}'
# 200
# Restart RabbitMQ
kubectl apply -f infrastructure/kubernetes/base/rabbitmq-statefulset.yaml
# Within 30 seconds, the notification appears
curl -s http://localhost/api/notifications | jq 'length'
# ≥ 1

# Kill Team Service
kubectl delete pod -l app=team-service -n taskboard
# Assigning a task fails fast
time curl -X PUT http://localhost/api/tasks/1/assign \
  -H "Content-Type: application/json" \
  -d '{"assigneeId":1}'
# returns 4xx/5xx in under 2 seconds
# Other operations still work
curl -s http://localhost/api/tasks | jq 'length'
# ≥ 1
```

---

## Challenge 7: Observability

**As a** production engineer,
**I want** real-time visibility into the platform's health, performance, and behaviour
**so that** I can detect, diagnose, and respond to issues before users notice them.

### What you need to do

#### Structured logs

Write `infrastructure/scripts/fetch-logs.sh` — a script that fetches logs from all services in a given time window, colour-coded by service, with ISO timestamps. It must accept `--since` (e.g., `--since 10m`), `--service` (filter to one service), and `--follow` (tail mode). For Kubernetes, it delegates to `kubectl logs`. For Docker, it delegates to `docker compose logs`.

#### Metrics

The services expose no Prometheus metrics endpoint. You must collect infrastructure-level metrics using exporters:

- Deploy Prometheus and Grafana in the cluster (Helm or raw manifests)
- nginx-exporter for frontend request metrics (request rate, HTTP error rate, latency)
- rabbitmq-exporter for queue depths (events per queue, consumer count, delivery rate)
- mysqld-exporter for database metrics (connections, query throughput, InnoDB status)
- node-exporter for node-level CPU, memory, disk
- kube-state-metrics for pod-level resource usage (already available in most clusters via the kube-prometheus-stack)

Create a Grafana dashboard with at least these panels:

| Panel | Data source | What it shows |
|-------|-------------|---------------|
| Request rate | nginx-exporter | Requests per second to frontend |
| HTTP error rate | nginx-exporter | 4xx/5xx percentage over time |
| Queue depth | rabbitmq-exporter | Messages per queue (task.assigned, task.completed, task.status.changed) |
| DB connections | mysqld-exporter | Active / idle / max connections per database |
| Pod CPU | kube-state-metrics | CPU usage per pod as percentage of request |
| Pod memory | kube-state-metrics | Memory usage per pod as percentage of limit |
| Container restarts | kube-state-metrics | Restart count per container over time |

#### Runbook

Create `docs/runbook.md` covering these scenarios. Each entry must start with symptoms an on-call engineer would actually see, then guide them through investigation to resolution.

| # | Symptom | Covers |
|---|---------|--------|
| 1 | Pod is in CrashLoopBackOff | Finding crash reason, viewing previous logs, getting a shell in a crash-looping pod |
| 2 | Service cannot reach its database | Checking DNS resolution from within the pod, testing the connection, verifying Secret contents |
| 3 | Ingress returns 404 | Inspecting Ingress rules, checking backend Service endpoints, testing upstream directly |
| 4 | RabbitMQ is unreachable | Checking RabbitMQ pod health, verifying Service endpoints, inspecting Spring Boot publisher logs |
| 5 | Pod fails with "Permission denied" | Checking filesystem permissions, verifying container user ID, identifying files owned by root |
| 6 | Deployment not becoming ready | Checking individual pod conditions, inspecting readiness probe logs, testing probe endpoint manually |
| 7 | Secret is missing | Verifying Secret existence, checking Deployment volume/Env references, decoding Secret data |
| 8 | OOMKill detected | Identifying the killed pod, checking resource limits against actual usage, adjusting limits safely |

### Constraints

- You may not add micrometer, actuator, logstash, or any other dependency to service `pom.xml` files
- All observability must be achieved through infrastructure-level tooling
- The Grafana dashboard must be exportable as JSON and committed to the repo at `infrastructure/monitoring/dashboard.json`
- Prometheus and Grafana configurations go in `infrastructure/monitoring/`

### Acceptance criteria

```bash
# Log script
./infrastructure/scripts/fetch-logs.sh --since 10m --service task-service
# [2025-06-01T12:00:00Z] [task-service] [INFO] Task created: id=42
# [2025-06-01T12:00:01Z] [task-service] [INFO] Task assigned: id=42 → member=3

# Metrics available
kubectl port-forward svc/prometheus 9090:9090
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets | length'
# ≥ 6

# Grafana dashboard loads with data
kubectl port-forward svc/grafana 3000:3000
# http://localhost:3000 → "Task Board Platform" dashboard
# Dashboard shows real-time metrics
```

