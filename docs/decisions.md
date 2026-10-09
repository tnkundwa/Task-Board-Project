# Architecture Decision Log

Each entry: the decision, at least two alternatives considered, and why the chosen approach won.
Entries are added as they're made, oldest first.

---

## Challenge 6: Resilience and self-healing

### Decision: Redeliver dropped RabbitMQ events with an in-memory retry buffer, not a durable outbox

**Context.** Task Service publishes to RabbitMQ with `RabbitTemplate.convertAndSend`. Confirmed
by observation (kill `rabbitmq-0`, then update a task's status): the original code caught the
publish failure, logged it, and threw the event away permanently — `/api/notifications` stayed
empty minutes after RabbitMQ came back healthy. Challenge 6 requires delayed notifications to
arrive within 30 seconds of RabbitMQ recovering, so *something* has to hold a failed event and
retry it.

**Alternatives considered:**

1. **In-memory retry buffer (chosen).** `TaskEventPublisher` keeps a `ConcurrentLinkedQueue` of
   events that failed to publish. A `@Scheduled` sweep every 5s retries everything currently in
   the queue. No new dependency (uses `spring-context`, already present), no schema change.
   Trade-off: the buffer lives in the JVM heap, so if the Task Service *pod itself* restarts
   while events are pending, they're lost — there is nothing on disk to recover from.
2. **Durable outbox table.** Persist failed events to a new `outbox_event` table via JPA
   (already a dependency) before/instead of publishing, with a scheduled sweeper reading from
   the table instead of memory. Survives a Task Service pod restart too, at the cost of a new
   entity, repository, and migration, plus transactional-outbox bookkeeping (marking rows sent,
   pruning them, etc.).
3. **Spring's built-in `RabbitTemplate` retry** (`spring.rabbitmq.template.retry.enabled=true`,
   available for free since `spring-retry` is already on the classpath transitively via
   `spring-boot-starter-amqp`). Rejected as the *sole* mechanism: this retry is synchronous
   within the original publish call — it blocks the HTTP request thread for the retry window
   before giving up, and once it gives up the event is still dropped. It's useful for smoothing
   over sub-second network blips, not for surviving an outage that outlives the retry window.

**Chosen: option 1.** The acceptance test for this challenge (`kubectl delete pod rabbitmq-0`)
only kills the RabbitMQ pod, never Task Service, so the in-memory buffer's one real weakness
never gets exercised by the actual requirement. Given that, the outbox table (option 2) is more
correct in the general case but is meaningfully more code for a property this specific challenge
doesn't test. If a future requirement is "must survive Task Service also restarting mid-outage,"
revisit this and move to option 2 — the queue/scheduler shape carries over almost unchanged,
only the storage backing it needs to become the `outbox_event` table.

---

### Decision: Distinguish "Team Service is down" from "member not in team" as different exceptions/status codes

**Context.** `TeamServiceClient.memberExistsInTeam` originally caught *any* exception (timeout,
connection refused, 5xx, ...) and returned `false`. `TaskService.assignTask` then threw
`RuntimeException("Member X does not belong to team Y")` for a `false` result, which
`GlobalExceptionHandler` mapped to `400 Bad Request`. So a Team Service outage and a genuinely
invalid assignment looked identical to the caller: same status code, same misleading message.

**Alternatives considered:**

1. **Keep collapsing to `false`/400 (status quo).** Simplest, but violates the explicit
   requirement that "the Gateway must propagate this error as a clear message to the frontend" —
   a 400 saying "member does not belong to team" during an actual Team Service outage is not a
   clear message, it's a wrong one.
2. **Add a dedicated `TeamServiceUnavailableException` mapped to `503` (chosen).** Client-side
   code (or a human reading logs/the response body) can tell "Team Service didn't answer" apart
   from "Team Service answered no" — and can safely retry a 503 in a way it must not retry a 400.
3. **Circuit breaker (Resilience4j/Spring Cloud Circuit Breaker).** Would add proper
   open/half-open state and avoid hammering a downed Team Service with a request per assignment
   attempt. Rejected for now: it's a new `pom.xml` dependency, and at current traffic a single
   bounded-timeout call per request is not a load concern. Worth revisiting if assignment volume
   grows enough that repeated 2-second-timeout calls to a down Team Service become their own
   problem.

**Chosen: option 2**, paired with explicit connect/read timeouts (`team-service.connect-timeout-ms`,
`team-service.read-timeout-ms`, both default 2000ms) on the `RestTemplate` bean — the default
`RestTemplate` has no timeout at all, and empirically (Team Service scaled to 0 replicas) that
left assignment requests hanging 60+ seconds with no response, not even an error. Spring Cloud
Gateway forwards the downstream status and body through by default with no gateway-side
changes needed, so the 503 and its message reach the frontend unmodified.

---

### Decision: Bound `spring.rabbitmq.connection-timeout` explicitly

**Context.** Same class of problem as above, on the publish side. Observed directly in
task-service logs during a RabbitMQ-pod-deleted test: `CachingConnectionFactory` logged
`Attempting to connect to: [rabbitmq:5672]` and didn't fail until exactly 60 seconds later
(`SocketTimeoutException: Connect timed out`) — during which the request thread that triggered
the publish (a task status update) was blocked. Set `spring.rabbitmq.connection-timeout: 2000` so
a publish attempt against an unreachable broker fails fast into the retry buffer instead.

No real alternative considered here beyond "leave the default" — an unbounded connect timeout on
a synchronous call from a request thread has no upside.

---

### Verification

Re-ran both scenarios against the live cluster after the fixes above, through the Gateway from
outside the cluster (same path the acceptance criteria use):

- **Team Service outage** (`kubectl scale deployment team-service --replicas=0`): assign requests
  now return `503` with `"Team Service is unavailable; cannot verify team membership"` in
  **~1.65s steady-state** (first request after a fresh Task Service pod restart costs a one-off
  ~4.7s of JVM/connection-pool warm-up — the 1500ms timeout was picked with that margin in mind).
  `GET /api/tasks` kept returning `200` throughout.
- **RabbitMQ outage** (`kubectl delete pod rabbitmq-0`): two status-change requests both returned
  `200` in 2-3.4s (no 60s hang). Both events landed in the retry buffer. Once RabbitMQ reported
  Ready again, both notifications (`TASK_COMPLETED`, `TASK_STATUS_CHANGED`) appeared within 5
  seconds — the scheduled sweep interval — comfortably inside the 30-second requirement.
