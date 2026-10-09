# Backend Services

Four Spring Boot microservices behind the API Gateway.

## Service overview

| Service | Port | Framework | Database | Dependencies |
|---------|------|-----------|----------|-------------|
| API Gateway | 8080 | Spring Cloud Gateway | — | Task Service, Team Service, Notification Service |
| Task Service | 8081 | Spring Boot + JPA | MySQL `taskdb` | Team Service (HTTP), RabbitMQ |
| Team Service | 8082 | Spring Boot + JPA | MySQL `teamdb` | — |
| Notification Service | 8083 | Spring Boot + JPA + RabbitMQ | MySQL `notificationdb` | RabbitMQ |

## API Gateway

Routes incoming requests to the correct backend service. All external traffic enters through this single point.

Routes:
- `/api/teams/**` → Team Service
- `/api/tasks/**` → Task Service
- `/api/notifications/**` → Notification Service

## Task Service

Manages tasks and their lifecycle. Publishes events to RabbitMQ when tasks are assigned or change status.

**Endpoints:** `GET/POST /api/tasks`, `PUT /api/tasks/{id}`, `DELETE /api/tasks/{id}`, `PUT /api/tasks/{id}/assign`, `PUT /api/tasks/{id}/status`

**Events published:**
- `task.assigned` — when a task is assigned to a member
- `task.completed` — when a task moves to DONE
- `task.status.changed` — when a task moves from DONE back to TODO/IN_PROGRESS

**External calls:** Calls Team Service to validate that a member belongs to a team before assignment.

## Team Service

Manages teams and their members. No external dependencies (only its database).

**Endpoints:** `GET/POST /api/teams`, `GET/PUT/DELETE /api/teams/{id}`, `POST/DELETE /api/teams/{id}/members`

Teams have a `color` field (hex string) used by the frontend for visual identification. Members are deduplicated by email address within a team.

## Notification Service

Consumes RabbitMQ events and persists them as notifications. Exposes a REST API for querying, marking as read, and deleting notifications.

**Endpoints:** `GET /api/notifications`, `GET /api/notifications/unread-count`, `PUT /api/notifications/{id}/read`, `DELETE /api/notifications/{id}`

**Queues:**
- `task.assigned.queue` — bound to `task.assigned` routing key
- `task.completed.queue` — bound to `task.completed` routing key
- `task.status.changed.queue` — bound to `task.status.changed` routing key

## Configuration reference

Each service reads configuration from `src/main/resources/application.yml`. Configurable values:

| Property | Services using it | Default |
|----------|------------------|---------|
| `spring.datasource.url` | Task, Team, Notification | `jdbc:mysql://localhost:3306/{dbname}` |
| `spring.datasource.username` | Task, Team, Notification | `root` |
| `spring.datasource.password` | Task, Team, Notification | `password` |
| `spring.rabbitmq.host` | Task, Notification | `localhost` |
| `spring.rabbitmq.port` | Task, Notification | `5672` |

All values are overridable via environment variables (Spring Boot convention: `SPRING_DATASOURCE_URL`, `SPRING_RABBITMQ_HOST`, etc.) or a local `application-local.yml`.

## Communication

### Synchronous

```
Frontend ──HTTP──▶ Gateway ──HTTP──▶ Task Service ──HTTP──▶ Team Service
                        └──HTTP──▶ Team Service
                        └──HTTP──▶ Notification Service
```

### Asynchronous (RabbitMQ)

```
Task Service ──publish──▶ RabbitMQ ──consume──▶ Notification Service
```

## Swagger UI

Each service exposes interactive API documentation at `/swagger-ui.html` on its port:
- Task Service: `http://localhost:8081/swagger-ui.html`
- Team Service: `http://localhost:8082/swagger-ui.html`
- Notification Service: `http://localhost:8083/swagger-ui.html`
