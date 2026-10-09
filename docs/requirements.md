# Requirements

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Java | 17+ | Run Spring Boot services |
| Maven | 3.8+ | Build Java services |
| MySQL | 8.0+ | Primary datastore |
| RabbitMQ | 3.12+ | Async event broker |
| Node.js | 20+ (LTS) | Build and run frontend |
| pnpm | 8+ | Frontend package manager |

## Startup order

Services depend on each other and must start in order:

1. MySQL + RabbitMQ (prerequisites)
2. Team Service (no dependencies)
3. Task Service (depends on Team Service + RabbitMQ)
4. Notification Service (depends on RabbitMQ)
5. API Gateway (depends on all backend services)
6. Frontend (depends on Gateway)

## Database setup

Connect to MySQL and create the required databases:

```sql
CREATE DATABASE taskdb;
CREATE DATABASE teamdb;
CREATE DATABASE notificationdb;

```

## Environment variables

Each backend service reads credentials from environment variables at startup. Copy the example file and fill in your values:

```bash
cp services/.env.example services/.env
```

Then edit `services/.env`:

```env
SPRING_DATASOURCE_USERNAME=<your MySQL username>
SPRING_DATASOURCE_PASSWORD=<your MySQL password>

RABBITMQ_USERNAME=<your RabbitMQ username>
RABBITMQ_PASSWORD=<your RabbitMQ password>
```

The default RabbitMQ credentials (local dev) are `guest` / `guest`. Set the MySQL credentials to match the user you created when setting up the databases.


## RabbitMQ setup

Start RabbitMQ on default settings (port 5672, management UI on 15672):

```bash
# Native install
rabbitmq-server

# Or via Docker (Recommended)
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3.12-management
```

Management UI: `http://localhost:15672` (username: `guest` || password: `guest`)

### Run
```bash
# Prerequisites: Java 17+, Maven 3.8+, MySQL 8.0+, RabbitMQ 3.x+
mvn clean install -DskipTests

# Start in this order (separate terminals):
cd services/team-service       && mvn spring-boot:run   # port 8082
cd services/task-service       && mvn spring-boot:run   # port 8081
cd services/notification-service && mvn spring-boot:run # port 8083
cd services/api-gateway        && mvn spring-boot:run   # port 8080

# Verify:
curl http://localhost:8080/api/teams    # []
curl http://localhost:8080/api/tasks    # []
```

API contracts with example requests: `docs/api-contracts.md`.  
Interactive Swagger UI at `/swagger-ui.html` on each service port.

# Frontend setup

The frontend is a Next.js application located in the `frontend/` directory. Make sure the API Gateway is running on `:8080` before starting it.

## Local development

```bash
pnpm install
pnpm dev
# Opens http://localhost:3000
# API requests go to http://localhost:8080 (API Gateway must be running)
```

## Production build

```bash
pnpm build
pnpm start
```
 