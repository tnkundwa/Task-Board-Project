# Team Task Board Platform

A microservices-based task management platform with teams, tasks, and event-driven notifications.

## Architecture

### Request flow (HTTP)

```
                  ┌─────────────────────┐
                  │      Frontend        │
                  │     (Next.js)        │
                  └──────────┬──────────┘
                             │
                           HTTP
                             ▼
                  ┌─────────────────────┐
                  │    API Gateway       │
                  │       :8080          │
                  └──┬──────┬──────┬─────┘
                     │      │      │
          ┌──────────┘      │      └────────────┐
          ▼                 ▼                   ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────────┐
│  Task Service  │ │  Team Service  │ │ Notification Svc  │
│    :8081       │ │    :8082       │ │    :8083           │
│  MySQL taskdb  │ │  MySQL teamdb  │ │ MySQL notifdb      │
└───────┬────────┘ └────────────────┘ └────────────────────┘
        │ HTTP (member validation)
        └──────────────────────────────────────────────────┘
```

### Event flow (RabbitMQ)

```
Task Service ──publishes──▶ RabbitMQ ──consumes──▶ Notification Service
  (task.assigned, task.completed, task.status.changed)
```

### Services

| Service | Port | Responsibility | Datastore |
|---------|------|----------------|-----------|
| Frontend | 3000 | User interface (Next.js) | — |
| API Gateway | 8080 | Routes traffic to backend services | — |
| Task Service | 8081 | Task CRUD, assignment, status transitions | MySQL `taskdb` |
| Team Service | 8082 | Team and member management | MySQL `teamdb` |
| Notification Service | 8083 | Consumes RabbitMQ events, persists + serves notifications | MySQL `notificationdb` |

The Gateway is the single entry point — the frontend never calls backend services directly.
Task Service calls Team Service synchronously to validate member assignments.
Events (task assigned, completed, status changed) flow asynchronously through RabbitMQ.


## Project structure

```
task-board-platform/
├── services/
│   ├── api-gateway/              # Spring Cloud Gateway — single entry point
│   ├── task-service/             # Task CRUD + RabbitMQ event publisher
│   ├── team-service/             # Team and member management
│   └── notification-service/     # RabbitMQ consumer + notification REST API
├── frontend/                     # Next.js application
├── infrastructure/               # Scripts, Docker, Kubernetes
├── docs/                         # Architecture, API contracts, requirements
└── CHALLENGE.md                  # Infrastructure challenges (group project)
```


## Quick start

See [docs/requirements.md](./docs/requirements.md) for the full startup guide covering prerequisites, database setup, environment variables, and running the frontend.

**TL;DR** — once prerequisites are installed and databases are created:

```bash
# 1. Build all services (from repo root)
mvn clean install -DskipTests

# 2. Start backend services in order (separate terminals)
cd services/team-service         && mvn spring-boot:run   # :8082
cd services/task-service         && mvn spring-boot:run   # :8081
cd services/notification-service && mvn spring-boot:run   # :8083
cd services/api-gateway          && mvn spring-boot:run   # :8080

# 3. Start the frontend
cd frontend && pnpm install && pnpm dev                   # :3000
```

## Documentation

| File | What it covers |
|------|---------------|
| [services/README.md](./services/README.md) | Backend services: tech stack, ports, dependencies, configuration |
| [frontend/README.md](./frontend/README.md) | Frontend architecture: stores, repositories, proxy, pages |
| [docs/architecture.md](./docs/architecture.md) | Deep dive: communication patterns, event system, database strategy |
| [docs/api-contracts.md](./docs/api-contracts.md) | Complete API reference with request/response examples |
| [docs/requirements.md](./docs/requirements.md) | Prerequisites, database setup, environment configuration |
| [CHALLENGE.md](./CHALLENGE.md) | Infrastructure challenges for containerisation, K8s, observability |
 