# Architecture

## Design principles

- **Database per service** — each service owns its data and is the only direct consumer of its database
- **API Gateway as entry point** — all external requests go through the Gateway; backend services are never directly exposed
- **Event-driven async communication** — task lifecycle events flow through RabbitMQ to decouple producers from consumers
- **Stateless services** — backend services can be scaled horizontally; state lives in MySQL and RabbitMQ

## Communication

### Synchronous (HTTP)

```
Frontend ──▶ Gateway ──▶ Task Service ──▶ Team Service
                 ├──▶ Team Service
                 └──▶ Notification Service
```

The Gateway routes by path prefix:
- `/api/teams/**` → Team Service (`:8082`)
- `/api/tasks/**` → Task Service (`:8081`)
- `/api/notifications/**` → Notification Service (`:8083`)

Task Service calls Team Service synchronously to validate that a member belongs to a team before allowing assignment. This is the only inter-service HTTP call.

### Asynchronous (RabbitMQ)

Task Service publishes to the `task.exchange` topic exchange. Notification Service binds queues for each routing key.

```
                    ┌──────────────────┐
                    │  task.exchange    │
                    │  (topic)          │
                    └──┬────┬────┬─────┘
                       │    │    │
              ┌────────┘    │    └────────┐
              v             v             v
        task.assigned  task.completed  task.status.changed
              │             │             │
              v             v             v
        ┌─────────────────────────────────────┐
        │       Notification Service          │
        │  (persists to notificationdb)       │
        └─────────────────────────────────────┘
```

### Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `task.assigned` | Task assigned to a member | taskId, taskTitle, teamId, assigneeId, timestamp |
| `task.completed` | Task status changes to DONE | taskId, taskTitle, teamId, assigneeId, timestamp |
| `task.status.changed` | Task moves from DONE to TODO/IN_PROGRESS | taskId, taskTitle, teamId, assigneeId, timestamp |

## Database strategy

Each service has an independent MySQL database. Services never access another service's database directly — they use HTTP or RabbitMQ to communicate.

| Service | Database | Schema management |
|---------|----------|-------------------|
| Task Service | `taskdb` | Hibernate `ddl-auto: update` |
| Team Service | `teamdb` | Hibernate `ddl-auto: update` |
| Notification Service | `notificationdb` | Hibernate `ddl-auto: update` |

Hibernate auto-creates and updates tables based on JPA entity annotations. In production, schema changes would use Flyway or Liquibase migrations.

## Frontend integration

The frontend (Next.js) calls the API Gateway through a proxy rewrite in `next.config.mjs`. This makes all requests appear same-origin to the browser, avoiding CORS configuration.

```
Browser ──▶ Next.js (port 3000) ──proxy──▶ API Gateway (port 8080)
```

The frontend uses a repository layer to transform backend JSON responses into frontend models, adding sensible defaults for fields the backend does not provide (priority, dueDate, avatarUrl, etc.).

## Architecture decisions

| Decision | Rationale |
|----------|-----------|
| API Gateway as single entry point | Centralised routing, authentication (future), rate limiting |
| Database per service | Services are independently deployable and scalable |
| RabbitMQ for async events | Decouples task operations from notification delivery |
| MySQL over PostgreSQL | Team preference — both are equally viable |
| Hibernate auto-DDL | Simplifies local development; would use migrations in production |
