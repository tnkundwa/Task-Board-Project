# Probe design (Challenge 6)

None of the five application services expose Spring Boot Actuator (out of scope — no new
`pom.xml` dependencies). So every probe below is built from what the services already expose:
their existing REST endpoints, a raw TCP port check, or (for MySQL) an `exec` into a client
that ships in the image already. No sidecar was needed for any of these seven workloads.

Two liveness/readiness rules apply everywhere in this file and aren't repeated per-service:

- **Liveness never checks a downstream dependency.** A slow or dead MySQL/RabbitMQ/upstream
  service is not evidence *this* process is broken — restarting a perfectly healthy container
  because something it talks to is unavailable just adds a second outage on top of the first.
- **Readiness failures never restart a container** — that's what makes them safe to use for
  "not ready while a dependency is down." Kubernetes pulls the pod out of the Service's endpoints
  on readiness failure and puts it back on success; it only ever restarts on *liveness* failure.
  This is standard kubelet behaviour, not something configured per-probe.

## Task Service (`task-service-deployment.yaml`)

| Probe | Mechanism | Rationale |
|---|---|---|
| startup | `GET /api/tasks`, period 5s, failureThreshold 60 | Up to 5 minutes to finish JVM startup + first DB connection before the other probes engage at all. |
| readiness | `GET /api/tasks`, period 10s, timeout 3s, failureThreshold 3 | `/api/tasks` runs a real query against MySQL, so this doubles as a MySQL-reachability check: MySQL down → the query errors → non-2xx → not ready → pulled from the gateway's routing until MySQL recovers. |
| liveness | same endpoint, period 15s, timeout 3s, failureThreshold 5 | Deliberately more tolerant (longer period, higher failure threshold) than readiness — the goal here is only "is the process wedged," not "is everything downstream fine." |

**Deliberately does *not* react to RabbitMQ.** `/api/tasks` never touches RabbitMQ, so a
RabbitMQ outage has zero effect on this probe. That's intentional, not an oversight: Challenge 6
requires "the Task Service must still accept and process task creation, assignment, and status
changes" while RabbitMQ is down. Making readiness depend on RabbitMQ would pull Task Service out
of rotation for exactly the operations it's required to keep serving. RabbitMQ is a soft
dependency for this service (see [decisions.md](decisions.md) for how publish failures are
handled instead — a retry buffer, not a readiness flag).

**Team Service outage** is handled the same way, for the same reason: `assignTask` is the only
operation that calls Team Service, and it now fails fast (2s bounded timeout) with a `503` rather
than hanging — see `TeamServiceClient`/`AppConfig`. Every other Task Service endpoint keeps
working untouched, so, again, readiness shouldn't reflect Team Service's health either.

## Team Service (`team-service-deployment.yaml`)

Same shape as Task Service: `GET /api/teams` for all three probes, same periods/thresholds. It
depends only on MySQL, and the endpoint queries MySQL directly, so the same "query fails →
non-2xx → not ready" logic applies without any extra wiring.

## Notification Service (`notification-service-deployment.yaml`)

Same shape again, `GET /api/notifications` against its own MySQL-backed data. Its RabbitMQ
consumer (`@RabbitListener`) is not on any HTTP request path and isn't reflected in these probes:
Spring AMQP's listener container retries its broker connection with its own internal backoff
independent of the web server, so RabbitMQ being down neither breaks `/api/notifications` (still
answers from MySQL) nor needs a probe change. When RabbitMQ recovers, the existing listener
container reconnects on its own — this doesn't require a redelivery mechanism the way the
publish side does, since a durable queue naturally accumulates messages while there's no active
listener.

## Gateway (`gateway-deployment.yaml`)

| Probe | Mechanism | Rationale |
|---|---|---|
| startup | `tcpSocket:8080`, period 5s, failureThreshold 24 | Just "is the port open" — doesn't wait on any downstream service being up yet, since the gateway itself can start independently of them. |
| readiness | `GET /api/teams` (proxied through to Team Service), period 10s, timeout 3s, failureThreshold 3 | Because this *proxies*, it reports not-ready whenever Team Service (or the path to it) is unreachable — satisfying "the Gateway must report not-ready if any of its upstream services are unreachable" without any gateway code change. |
| liveness | `tcpSocket:8080`, period 15s, timeout 3s, failureThreshold 5 | Explicitly does not proxy anywhere — a slow/down upstream must not restart a healthy gateway process. |

This readiness check only exercises the Team Service route. It was judged a reasonable proxy for
"gateway can reach its upstreams" rather than adding routes to probe all three services — Task
Service and Notification Service failures already surface directly to callers as fast, clear
errors (Task Service: the 503 from the Team Service change above; both: normal HTTP error
passthrough), so gateway-level readiness doesn't need to duplicate that.

## Frontend (`frontend-deployment.yaml`)

`GET /` for all three probes — nginx serving a static asset. No backend dependency to reflect;
API calls happen client-side from the browser, not from nginx itself.

## RabbitMQ (`rabbitmq-statefulset.yaml`)

Readiness and liveness both use `tcpSocket:5672` rather than `rabbitmq-diagnostics`. The
diagnostics CLI spins up its own BEAM VM and talks to the broker over Erlang distribution, which
was observed to time out unreliably under CPU contention in this environment even at 15s — well
past what a genuinely healthy broker needs. A plain TCP check on the AMQP port needs no process
spawn and is a reasonable substitute when the diagnostics tool itself is the flaky part.
Readiness: initialDelay 20s, period 10s, timeout 5s, failureThreshold 6. Liveness is looser
(initialDelay 45s, period 20s, failureThreshold 15) for the same "don't restart a slow-but-alive
process" reasoning as everywhere else.

## MySQL (`mysql-statefulset.yaml`)

Both probes run `mysqladmin ping -h 127.0.0.1` via `exec`, through a shell so `$MYSQL_ROOT_PASSWORD`
expands (probe `exec.command` doesn't get the `$(VAR)` substitution that container `command`/`args`
get). `127.0.0.1`, not `localhost` — the mysql client treats `localhost` as "use the Unix socket,"
and on this image/volume the classic protocol socket under `/var/lib/mysql` never actually gets
created (only the X Protocol socket under `/var/run/mysqld` does), so a literal TCP address is
needed. Liveness is deliberately tolerant (timeout 15s, failureThreshold 15): a slow probe exec
under CPU contention is not the same as mysqld actually being down, and restarting the one
stateful, single-replica datastore on a false positive is worse than a slightly late real
restart. Readiness is stricter (timeout 10s, failureThreshold 6) since failing it only pulls
MySQL from rotation, it doesn't restart anything.

## Verified behaviour

Confirmed directly against the running cluster while building this challenge (not just read from
the manifests):

- Killing `rabbitmq-0` and updating a task's status: request succeeded (task-service correctly
  stayed ready and kept serving), but the *pre-fix* publisher blocked the request for ~60s on an
  unbounded connect attempt and then silently dropped the event forever — see
  [decisions.md](decisions.md) for the fix (bounded connection timeout + retry buffer).
- Scaling `team-service` to 0 and calling `PUT /api/tasks/{id}/assign`: the *pre-fix* request
  hung past 60 seconds with no response at all. Other Task Service endpoints (`GET /api/tasks`)
  kept responding `200` the entire time, confirming the probe design's assumption that Task
  Service's core operations are independent of Team Service being up.
