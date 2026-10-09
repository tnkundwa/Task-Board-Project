set -uo pipefail

NAMESPACE="${NAMESPACE:-taskboard}"
INGRESS_NAMESPACE="${INGRESS_NAMESPACE:-ingress-nginx}"
PROBE_IMAGE="${PROBE_IMAGE:-busybox:1.36}"
TIMEOUT="${PROBE_TIMEOUT:-4}"

FAILURES=0
POD_COUNTER=0

# run_probe <expect: pass|fail> <description> <source-namespace> <source-label|-> <target-host> <target-port>
run_probe() {
  local expect="$1" description="$2" src_ns="$3" src_label="$4" host="$5" port="$6"
  POD_COUNTER=$((POD_COUNTER + 1))
  local pod="netpol-probe-$$-$POD_COUNTER"

  local label_args=()
  if [ "$src_label" != "-" ]; then
    label_args=(--labels="$src_label")
  fi

  local result
  result=$(kubectl run "$pod" -n "$src_ns" --image="$PROBE_IMAGE" --restart=Never \
    "${label_args[@]}" --command --quiet -i --rm --pod-running-timeout=30s \
    -- sh -c "nc -z -w $TIMEOUT $host $port && echo OK || echo FAIL" 2>/dev/null | tail -1)

  if [ "$result" = "OK" ] && [ "$expect" = "pass" ]; then
    echo "[PASS] $description"
  elif [ "$result" != "OK" ] && [ "$expect" = "fail" ]; then
    echo "[PASS] $description (blocked as expected)"
  elif [ "$expect" = "pass" ]; then
    echo "[FAIL] $description (expected to reach $host:$port, but it was blocked)"
    FAILURES=$((FAILURES + 1))
  else
    echo "[FAIL] $description (expected to be blocked from $host:$port, but it succeeded)"
    FAILURES=$((FAILURES + 1))
  fi

  kubectl delete pod "$pod" -n "$src_ns" --ignore-not-found --now >/dev/null 2>&1
}

echo "== Validating NetworkPolicies in namespace '$NAMESPACE' =="
echo ""

echo "-- permitted paths --"
run_probe pass "Ingress controller -> Frontend:3000"      "$INGRESS_NAMESPACE" "-"                        "frontend.$NAMESPACE.svc.cluster.local"             3000
run_probe pass "Ingress controller -> Gateway:8080"       "$INGRESS_NAMESPACE" "-"                        "gateway.$NAMESPACE.svc.cluster.local"              8080
run_probe pass "Frontend -> Gateway:8080"                 "$NAMESPACE"         "app=frontend"              "gateway.$NAMESPACE.svc.cluster.local"              8080
run_probe pass "Gateway -> Task Service:8081"              "$NAMESPACE"         "app=gateway"               "task-service.$NAMESPACE.svc.cluster.local"         8081
run_probe pass "Gateway -> Team Service:8082"              "$NAMESPACE"         "app=gateway"               "team-service.$NAMESPACE.svc.cluster.local"         8082
run_probe pass "Gateway -> Notification Service:8083"      "$NAMESPACE"         "app=gateway"               "notification-service.$NAMESPACE.svc.cluster.local" 8083
run_probe pass "Task Service -> Team Service:8082"         "$NAMESPACE"         "app=task-service"          "team-service.$NAMESPACE.svc.cluster.local"         8082
run_probe pass "Task Service -> RabbitMQ:5672"             "$NAMESPACE"         "app=task-service"          "rabbitmq.$NAMESPACE.svc.cluster.local"             5672
run_probe pass "Notification Service -> RabbitMQ:5672"     "$NAMESPACE"         "app=notification-service"  "rabbitmq.$NAMESPACE.svc.cluster.local"             5672
run_probe pass "Task Service -> MySQL:3306"                "$NAMESPACE"         "app=task-service"          "mysql.$NAMESPACE.svc.cluster.local"                3306
run_probe pass "Any pod -> kube-dns:53"                    "$NAMESPACE"         "app=task-service"          "kube-dns.kube-system.svc.cluster.local"            53

echo ""
echo "-- forbidden paths (must be blocked) --"
run_probe fail "Frontend -> Task Service:8081"              "$NAMESPACE" "app=frontend"             "task-service.$NAMESPACE.svc.cluster.local"         8081
run_probe fail "Frontend -> MySQL:3306 (not via a service)" "$NAMESPACE" "app=frontend"             "mysql.$NAMESPACE.svc.cluster.local"                3306
run_probe fail "Task Service -> Notification Service:8083"  "$NAMESPACE" "app=task-service"         "notification-service.$NAMESPACE.svc.cluster.local" 8083
run_probe fail "Notification Service -> Team Service:8082"  "$NAMESPACE" "app=notification-service"  "team-service.$NAMESPACE.svc.cluster.local"        8082
run_probe fail "Team Service -> RabbitMQ:5672"              "$NAMESPACE" "app=team-service"          "rabbitmq.$NAMESPACE.svc.cluster.local"            5672

echo ""
if [ "$FAILURES" -eq 0 ]; then
  echo "All checks passed."
  exit 0
else
  echo "$FAILURES check(s) failed."
  exit 1
fi