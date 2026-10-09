# API Documentation

Base URL: `http://localhost:8080` (API Gateway)

## Interactive Documentation (Swagger UI)

| Service | Swagger UI | OpenAPI JSON |
|---------|-----------|--------------|
| Task Service | [http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html) | [http://localhost:8081/v3/api-docs](http://localhost:8081/v3/api-docs) |
| Team Service | [http://localhost:8082/swagger-ui.html](http://localhost:8082/swagger-ui.html) | [http://localhost:8082/v3/api-docs](http://localhost:8082/v3/api-docs) |
| Notification Service | [http://localhost:8083/swagger-ui.html](http://localhost:8083/swagger-ui.html) | [http://localhost:8083/v3/api-docs](http://localhost:8083/v3/api-docs) |

Open the Swagger UI links in your browser to explore and test endpoints interactively.

---

## Team Service Endpoints

All team endpoints are routed through the API Gateway at `/api/teams/**`.

---

### Create a Team

Creates a new team with an empty members list.

```
POST /api/teams
```

**Request body:**
```json
{
  "name": "Engineering",
  "description": "Engineering team",
  "color": "#6366f1"
}
```

The `color` field is optional (defaults to `#6366f1`).

**Response** `201 Created`:
```json
{
  "id": 1,
  "name": "Engineering",
  "description": "Engineering team",
  "color": "#6366f1",
  "createdAt": "2025-01-01T12:00:00",
  "members": []
}
```

---

### List All Teams

```
GET /api/teams
```

**Response** `200 OK`:
```json
[
  {
    "id": 1,
    "name": "Engineering",
    "description": "Engineering team",
    "color": "#6366f1",
    "createdAt": "2025-01-01T12:00:00",
    "members": [
      {
        "id": 1,
        "name": "Alice",
        "email": "alice@example.com",
        "role": "Developer",
        "teamId": 1
      }
    ]
  }
]
```

---

### Get a Team

```
GET /api/teams/{id}
```

**Response** `200 OK`:
```json
{
  "id": 1,
  "name": "Engineering",
  "description": "Engineering team",
  "createdAt": "2025-01-01T12:00:00",
  "members": []
}
```

**Response** `404 Not Found`:
```json
{
  "timestamp": "2025-01-01T12:00:00",
  "message": "Team not found with id: 99",
  "status": 404
}
```

---

### Update a Team

```
PUT /api/teams/{id}
```

**Request body:**
```json
{
  "name": "Engineering Team",
  "description": "Updated description",
  "color": "#8b5cf6"
}
```

All fields are optional — only provided fields will be updated.

**Response** `200 OK`: Returns the updated team object (including `color`).

---

### Delete a Team

```
DELETE /api/teams/{id}
```

**Response** `204 No Content`

---

### Add a Member to a Team

```
POST /api/teams/{teamId}/members
```

**Request body:**
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "role": "Developer"
}
```

**Response** `201 Created`:
```json
{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com",
  "role": "Developer",
  "teamId": 1
}
```

---

### List Members of a Team

```
GET /api/teams/{teamId}/members
```

**Response** `200 OK`:
```json
[
  {
    "id": 1,
    "name": "Alice",
    "email": "alice@example.com",
    "role": "Developer",
    "teamId": 1
  }
]
```

---

### Get a Specific Member

```
GET /api/teams/{teamId}/members/{memberId}
```

**Response** `200 OK`:
```json
{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com",
  "role": "Developer",
  "teamId": 1
}
```

---

### Check if Member Exists in Team

Used internally by Task Service to validate assignments.

```
GET /api/teams/{teamId}/members/{memberId}/exists
```

**Response** `200 OK`:
```
true
```
or
```
false
```

---

### Remove a Member from a Team

```
DELETE /api/teams/{teamId}/members/{memberId}
```

**Response** `204 No Content`

---

## Task Service Endpoints

All task endpoints are routed through the API Gateway at `/api/tasks/**`.

---

### Create a Task

Creates a new task with status `TODO`.

```
POST /api/tasks
```

**Request body:**
```json
{
  "title": "Implement login",
  "description": "Build the login page",
  "teamId": 1
}
```

**Response** `201 Created`:
```json
{
  "id": 1,
  "title": "Implement login",
  "description": "Build the login page",
  "status": "TODO",
  "teamId": 1,
  "assigneeId": null,
  "createdAt": "2025-01-01T12:00:00",
  "updatedAt": "2025-01-01T12:00:00"
}
```

---

### List Tasks

Optional query parameters for filtering. All parameters can be combined.

```
GET /api/tasks
GET /api/tasks?teamId=1
GET /api/tasks?teamId=1&status=TODO
GET /api/tasks?teamId=1&status=IN_PROGRESS&assigneeId=1
GET /api/tasks?assigneeId=1
```

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `teamId` | Long | Filter by team |
| `status` | Enum | Filter by status: `TODO`, `IN_PROGRESS`, `DONE` |
| `assigneeId` | Long | Filter by assigned member |

**Response** `200 OK`:
```json
[
  {
    "id": 1,
    "title": "Implement login",
    "description": "Build the login page",
    "status": "TODO",
    "teamId": 1,
    "assigneeId": null,
    "createdAt": "2025-01-01T12:00:00",
    "updatedAt": "2025-01-01T12:00:00"
  }
]
```

---

### Get a Task

```
GET /api/tasks/{id}
```

**Response** `200 OK`: Returns the task object.

**Response** `400 Bad Request`:
```json
{
  "timestamp": "2025-01-01T12:00:00",
  "message": "Task not found with id: 99",
  "status": 400
}
```

---

### Update a Task

```
PUT /api/tasks/{id}
```

**Request body:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "teamId": 1
}
```

**Response** `200 OK`: Returns the updated task object.

---

### Delete a Task

```
DELETE /api/tasks/{id}
```

**Response** `204 No Content`

---

### Assign a Task to a Member

Validates that the member belongs to the task's team before assigning.
Publishes a `task.assigned` event to RabbitMQ.

```
PUT /api/tasks/{id}/assign
```

**Request body:**
```json
{
  "assigneeId": 1
}
```

**Response** `200 OK`:
```json
{
  "id": 1,
  "title": "Implement login",
  "description": "Build the login page",
  "status": "TODO",
  "teamId": 1,
  "assigneeId": 1,
  "createdAt": "2025-01-01T12:00:00",
  "updatedAt": "2025-01-01T12:00:01"
}
```

**Response** `400 Bad Request` (if member does not belong to team):
```json
{
  "timestamp": "2025-01-01T12:00:00",
  "message": "Member 99 does not belong to team 1",
  "status": 400
}
```

---

### Update Task Status

Publishes a `task.completed` event to RabbitMQ when status changes to `DONE`.

```
PUT /api/tasks/{id}/status
```

**Request body:**
```json
{
  "status": "IN_PROGRESS"
}
```

**Valid status values:** `TODO`, `IN_PROGRESS`, `DONE`

**Response** `200 OK`: Returns the task with updated status.

---

---
## Notification Service Endpoints

All notification endpoints are routed through the API Gateway at `/api/notifications/**`.

---

### List Notifications

Returns all notifications ordered by creation time (newest first).

```
GET /api/notifications
```

**Response** `200 OK`:
```json
[
  {
    "id": 1,
    "eventType": "TASK_ASSIGNED",
    "taskId": 1,
    "taskTitle": "Implement login",
    "teamId": 1,
    "read": false,
    "createdAt": "2025-01-01T12:00:00"
  }
]
```

`eventType` can be `TASK_ASSIGNED`, `TASK_COMPLETED`, or `TASK_STATUS_CHANGED`.

---

### Get Unread Count

```
GET /api/notifications/unread-count
```

**Response** `200 OK`:
```
3
```

---

### Mark as Read

```
PUT /api/notifications/{id}/read
```

**Response** `204 No Content`

---

### Delete a Notification

```
DELETE /api/notifications/{id}
```

**Response** `204 No Content`

---

## Task Statuses

## Validation Error Format

When a request fails validation, all errors are returned together:

```json
{
  "timestamp": "2025-01-01T12:00:00",
  "status": 400,
  "errors": {
    "title": "Title is required",
    "teamId": "Team ID is required"
  }
}
```

---

## RabbitMQ Events

Events are published to the `task.exchange` topic exchange.

### task.assigned

Published when a task is assigned to a member.

**Routing key:** `task.assigned`

**Payload:**
```json
{
  "eventType": "task.assigned",
  "taskId": 1,
  "taskTitle": "Implement login",
  "teamId": 1,
  "assigneeId": 1,
  "assignedBy": "system",
  "timestamp": "2025-01-01T12:00:00"
}
```

### task.completed

Published when a task's status changes to `DONE`.

**Routing key:** `task.completed`

**Payload:**
```json
{
  "eventType": "task.completed",
  "taskId": 1,
  "taskTitle": "Implement login",
  "teamId": 1,
  "assigneeId": 1,
  "assignedBy": "system",
  "timestamp": "2025-01-01T12:00:00"
}
```

### task.status.changed

Published when a task moves from `DONE` back to `TODO` or `IN_PROGRESS`.

**Routing key:** `task.status.changed`

**Payload:**
```json
{
  "eventType": "task.status.changed",
  "taskId": 1,
  "taskTitle": "Implement login",
  "teamId": 1,
  "assigneeId": 1,
  "assignedBy": "system",
  "timestamp": "2025-01-01T12:00:00"
}
```

---

## Complete Test Flow (curl)

```bash
# 1. Create a team (with optional color)
curl -s -X POST http://localhost:8080/api/teams \
  -H "Content-Type: application/json" \
  -d '{"name": "Engineering", "description": "Engineering team", "color": "#6366f1"}' | jq

# 2. Add a member
curl -s -X POST http://localhost:8080/api/teams/1/members \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "email": "alice@example.com", "role": "Developer"}' | jq

# 3. Create a task
curl -s -X POST http://localhost:8080/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Implement login", "description": "Build the login page", "teamId": 1}' | jq

# 4. Assign the task (triggers a notification)
curl -s -X PUT http://localhost:8080/api/tasks/1/assign \
  -H "Content-Type: application/json" \
  -d '{"assigneeId": 1}' | jq

# 5. Complete the task (triggers another notification)
curl -s -X PUT http://localhost:8080/api/tasks/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "DONE"}' | jq

# 6. View notifications
curl -s http://localhost:8080/api/notifications | jq

# 7. Mark a notification as read
curl -s -X PUT http://localhost:8080/api/notifications/1/read

# 8. Delete a notification
curl -s -X DELETE http://localhost:8080/api/notifications/1
```

> Notifications are persisted in `notificationdb` and served via REST API.
> The frontend polls every 10 seconds and displays them in the bell icon and `/notifications` page.
