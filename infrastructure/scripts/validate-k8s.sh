set -uo pipefail

NAMESPACE="${NAMESPACE:-taskboard}"
BASE_URL="${BASE_URL:-http://gateway.${NAMESPACE}.svc.cluster.local:8080}"
FRONTEND_URL="${FRONTEND_URL:-http://frontend.${NAMESPACE}.svc.cluster.local:3000}"

FAILURES=0
pass() { echo "[PASS] $1"; }
fail() { echo "[FAIL] $1"; FAILURES=$((FAILURES + 1)); }

extract_id() {
  grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2
}

check_status() {
  local description="$1" expected="$2" method="$3" url="$4" body="${5:-}"
  local code
  if [ -n "$body" ]; then
    code=$(curl -s -o /tmp/validate-k8s-body.json -w "%{http_code}" -X "$method" "$url" \
      -H "Content-Type: application/json" -d "$body")
  else
    code=$(curl -s -o /tmp/validate-k8s-body.json -w "%{http_code}" -X "$method" "$url")
  fi
  if [ "$code" = "$expected" ]; then
    pass "$description ($code)"
  else
    fail "$description (expected $expected, got $code: $(cat /tmp/validate-k8s-body.json 2>/dev/null))"
  fi
}

echo "== Validating in-cluster stack via Gateway at $BASE_URL =="

check_status "GET /api/teams"         200 GET "$BASE_URL/api/teams"
check_status "GET /api/tasks"         200 GET "$BASE_URL/api/tasks"
check_status "GET /api/notifications" 200 GET "$BASE_URL/api/notifications"

echo "-- swagger through the gateway --"
check_status "GET /task-service/v3/api-docs"         200 GET "$BASE_URL/task-service/v3/api-docs"
check_status "GET /team-service/v3/api-docs"         200 GET "$BASE_URL/team-service/v3/api-docs"
check_status "GET /notification-service/v3/api-docs" 200 GET "$BASE_URL/notification-service/v3/api-docs"

echo "-- smoke flow: create team -> add member -> create task -> assign --"

TEAM_NAME="validate-k8s-$(date +%s)"
TEAM_JSON=$(curl -s -w '\n%{http_code}' -X POST "$BASE_URL/api/teams" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$TEAM_NAME\",\"color\":\"#336699\"}")
TEAM_CODE=$(echo "$TEAM_JSON" | tail -1)
TEAM_BODY=$(echo "$TEAM_JSON" | sed '$d')
TEAM_ID=$(echo "$TEAM_BODY" | extract_id)

if [ "$TEAM_CODE" = "201" ] && [ -n "$TEAM_ID" ]; then
  pass "POST /api/teams ($TEAM_CODE, id=$TEAM_ID)"
else
  fail "POST /api/teams (expected 201 with an id, got $TEAM_CODE: $TEAM_BODY)"
fi

if [ -n "$TEAM_ID" ]; then
  MEMBER_JSON=$(curl -s -w '\n%{http_code}' -X POST "$BASE_URL/api/teams/$TEAM_ID/members" \
    -H "Content-Type: application/json" \
    -d '{"name":"Validate Bot","email":"validate-bot@example.com","role":"QA"}')
  MEMBER_CODE=$(echo "$MEMBER_JSON" | tail -1)
  MEMBER_BODY=$(echo "$MEMBER_JSON" | sed '$d')
  MEMBER_ID=$(echo "$MEMBER_BODY" | extract_id)
  if [ "$MEMBER_CODE" = "201" ] && [ -n "$MEMBER_ID" ]; then
    pass "POST /api/teams/$TEAM_ID/members ($MEMBER_CODE, id=$MEMBER_ID)"
  else
    fail "POST /api/teams/$TEAM_ID/members (expected 201 with an id, got $MEMBER_CODE: $MEMBER_BODY)"
  fi

  TASK_JSON=$(curl -s -w '\n%{http_code}' -X POST "$BASE_URL/api/tasks" \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"validate-k8s task\",\"teamId\":$TEAM_ID}")
  TASK_CODE=$(echo "$TASK_JSON" | tail -1)
  TASK_BODY=$(echo "$TASK_JSON" | sed '$d')
  TASK_ID=$(echo "$TASK_BODY" | extract_id)
  if [ "$TASK_CODE" = "201" ] && [ -n "$TASK_ID" ]; then
    pass "POST /api/tasks ($TASK_CODE, id=$TASK_ID)"
  else
    fail "POST /api/tasks (expected 201 with an id, got $TASK_CODE: $TASK_BODY)"
  fi

  if [ -n "$TASK_ID" ] && [ -n "$MEMBER_ID" ]; then
    check_status "PUT /api/tasks/$TASK_ID/assign" 200 PUT "$BASE_URL/api/tasks/$TASK_ID/assign" \
      "{\"assigneeId\":$MEMBER_ID}"
  fi
else
  fail "smoke flow skipped (no team id)"
fi

echo "-- frontend --"
check_status "GET / (frontend)" 200 GET "$FRONTEND_URL/"

rm -f /tmp/validate-k8s-body.json

echo ""
if [ "$FAILURES" -eq 0 ]; then
  echo "All checks passed."
  exit 0
else
  echo "$FAILURES check(s) failed."
  exit 1
fi