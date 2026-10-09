# Resource requests and limits (Challenge 6)

Every container in `infrastructure/kubernetes/base/` has both a CPU/memory request and a limit
set. This documents where the numbers came from and how to revise them.

## Current values

| Container | CPU request | CPU limit | Mem request | Mem limit | Basis |
|---|---|---|---|---|---|
| task-service | 100m | 500m | 128Mi | 384Mi | Spring Boot 3 / JRE 17, single instance, dev-scale traffic |
| team-service | 100m | 500m | 128Mi | 384Mi | Same as task-service — nearly identical workload shape |
| notification-service | 100m | 500m | 128Mi | 384Mi | Same as above; lighter actual load (fewer endpoints), kept identical for consistency and because it's the same JVM baseline cost |
| gateway | 100m | 500m | 128Mi | 384Mi | Spring Cloud Gateway is reactive/Netty-based rather than servlet-based, but carries the same JVM baseline and was not observed to need a different envelope |
| frontend | 50m | 200m | 64Mi | 128Mi | nginx serving a static build — much lighter than any JVM service |
| mysql | 250m | 500m | 256Mi | 512Mi | InnoDB buffer pool + connection handling for 3 databases (`taskdb`, `teamdb`, `notificationdb`) on one instance |
| rabbitmq | 250m | 500m | 384Mi | 1Gi | Erlang VM baseline plus the management plugin (enabled via the `-management` image) is the biggest fixed memory cost in the stack |

## Methodology

1. **Start from a JVM floor.** A default JRE 17 + Spring Boot app with `-XX:+UseContainerSupport`
   (default since JRE 10) sizes its heap off the container's memory *limit*, not the request —
   by default `-XX:MaxRAMPercentage=25%`. At a 384Mi limit that's a ~96Mi max heap, which is
   tight but workable for these services: each exposes a handful of CRUD endpoints over a single
   JPA entity, not a wide object graph. 384Mi was chosen as the point where heap plus JVM
   metaspace/thread-stack/JIT-code-cache overhead fits comfortably without the container
   approaching an OOMKill under normal load — not derived from a load test, since this is a dev
   deployment fronting handfuls of requests, not production traffic.
2. **CPU requests are set low, limits generously above the request.** 100m request means the
   scheduler only needs to find 0.1 CPU free to place the pod — with 7 containers plus 2
   StatefulSet members on a single kind/minikube node, keeping requests low avoids resource
   contention at scheduling time. The 500m limit (5x the request) leaves headroom for JVM
   warm-up/JIT compilation and request bursts without letting one container starve its
   neighbours indefinitely (CPU limits throttle rather than kill, so this is a soft ceiling, not
   a hard failure mode the way a memory limit is).
3. **MySQL and RabbitMQ get more of both**, reflecting that they're doing more persistent,
   stateful work than any single Spring Boot service and that their StatefulSets have exactly one
   replica each — there's no horizontal capacity to fall back on if either gets starved.
4. **Frontend gets the smallest envelope** on the reasoning that nginx serving pre-built static
   assets has an essentially flat, low resource profile regardless of request volume in this
   deployment's scale.

## How to refine these

These are the "educated guess" starting point the challenge asks for, not final production
numbers. To refine with real data once the cluster has been under load:

```bash
kubectl top pods -n taskboard
```

or with kube-state-metrics / Prometheus (Challenge 7) charted over time, look for:

- **CPU**: containers consistently pinned near their limit → raise the limit; containers never
  above ~30% of their request → the request can come down, freeing scheduling headroom.
- **Memory**: `kubectl describe pod` showing `OOMKilled` in a previous container state is the
  clearest signal a limit is too low — raise it directly rather than guessing further. Memory
  sitting well under the request across observation is a signal the request (not the limit) is
  oversized and wasting scheduling headroom, since unlike CPU, memory requests are not
  compressible/throttleable.

None of the values above have needed revision under the manual failure-scenario testing done for
this challenge (see [probes.md](probes.md)) — no OOMKills or CPU-throttling-related probe
failures were observed while exercising the RabbitMQ- and Team-Service-outage scenarios.
