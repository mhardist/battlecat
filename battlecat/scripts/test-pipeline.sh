#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# Battlecat Pipeline Diagnostic Script
#
# Tests every stage of the WhatsApp → tutorial pipeline via the
# /api/debug endpoints.
#
# Usage:
#   ./scripts/test-pipeline.sh                     # test against localhost:3000
#   ./scripts/test-pipeline.sh https://battlecat.ai  # test against production
#   ./scripts/test-pipeline.sh https://battlecat.ai https://example.com/article
# ──────────────────────────────────────────────────────────────────────

set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
TEST_URL="${2:-https://www.anthropic.com/engineering/claude-code-best-practices}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Battlecat Pipeline Diagnostic${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════${NC}"
echo -e "  Target:   ${CYAN}${BASE_URL}${NC}"
echo -e "  Test URL: ${CYAN}${TEST_URL}${NC}"
echo ""

# ── Test 1: Health Check ──────────────────────────────────────────────

echo -e "${BOLD}[1/5] Health Check${NC}"
echo -e "  GET ${BASE_URL}/api/debug/health"
echo ""

HEALTH=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/debug/health" 2>&1)
HTTP_CODE=$(echo "$HEALTH" | tail -1)
BODY=$(echo "$HEALTH" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "  ${GREEN}✓ HTTP 200${NC}"
else
  echo -e "  ${RED}✗ HTTP ${HTTP_CODE}${NC}"
fi

# Parse and display checks
if command -v jq &> /dev/null; then
  echo "$BODY" | jq -r '.checks[] | "  " + (if .status == "pass" then "✓" elif .status == "warn" then "⚠" else "✗" end) + " " + .name + " → " + .detail' 2>/dev/null | while IFS= read -r line; do
    if echo "$line" | grep -q "✗"; then
      echo -e "  ${RED}${line}${NC}"
    elif echo "$line" | grep -q "⚠"; then
      echo -e "  ${YELLOW}${line}${NC}"
    else
      echo -e "  ${GREEN}${line}${NC}"
    fi
  done

  echo ""
  echo -e "  Summary: $(echo "$BODY" | jq -r '.summary' 2>/dev/null)"
else
  echo "  (install jq for pretty output)"
  echo "  Raw response: ${BODY:0:500}"
fi

echo ""

# ── Test 2: Can we reach the ingest endpoint? ─────────────────────────

echo -e "${BOLD}[2/5] Ingest Endpoint Reachability${NC}"
echo -e "  POST ${BASE_URL}/api/ingest (empty body → should return 400)"
echo ""

INGEST_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/ingest" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "" 2>&1)

if [ "$INGEST_CODE" = "400" ]; then
  echo -e "  ${GREEN}✓ HTTP 400 (expected — endpoint is alive and validating)${NC}"
elif [ "$INGEST_CODE" = "000" ]; then
  echo -e "  ${RED}✗ Connection failed — server unreachable${NC}"
else
  echo -e "  ${YELLOW}⚠ HTTP ${INGEST_CODE} (unexpected)${NC}"
fi

echo ""

# ── Test 3: Simulate WhatsApp message ─────────────────────────────────

echo -e "${BOLD}[3/5] Simulate WhatsApp Message${NC}"
echo -e "  POST ${BASE_URL}/api/ingest (Form: Body=url, From=whatsapp:+test)"
echo ""

WHATSAPP_RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/ingest" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "Body=Check+this+out+${TEST_URL}&From=whatsapp%3A%2B10000000000" 2>&1)

WA_CODE=$(echo "$WHATSAPP_RESP" | tail -1)
WA_BODY=$(echo "$WHATSAPP_RESP" | sed '$d')

if [ "$WA_CODE" = "200" ]; then
  echo -e "  ${GREEN}✓ HTTP 200 — submission accepted${NC}"
  echo "  TwiML response: ${WA_BODY:0:200}"
elif [ "$WA_CODE" = "500" ]; then
  echo -e "  ${RED}✗ HTTP 500 — Supabase INSERT likely failed${NC}"
  echo "  Response: ${WA_BODY:0:300}"
else
  echo -e "  ${YELLOW}⚠ HTTP ${WA_CODE}${NC}"
  echo "  Response: ${WA_BODY:0:300}"
fi

echo ""

# ── Test 4: Dry-run pipeline test ─────────────────────────────────────

echo -e "${BOLD}[4/5] Dry-Run Pipeline (extract + classify, no tutorial created)${NC}"
echo -e "  POST ${BASE_URL}/api/debug/test-ingest"
echo -e "  URL: ${TEST_URL}"
echo -e "  (this may take 20-40 seconds)${NC}"
echo ""

PIPELINE_RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/debug/test-ingest" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${TEST_URL}\", \"dry_run\": true}" \
  --max-time 90 2>&1)

PIPE_CODE=$(echo "$PIPELINE_RESP" | tail -1)
PIPE_BODY=$(echo "$PIPELINE_RESP" | sed '$d')

if [ "$PIPE_CODE" = "200" ]; then
  echo -e "  ${GREEN}✓ HTTP 200${NC}"
else
  echo -e "  ${RED}✗ HTTP ${PIPE_CODE}${NC}"
fi

if command -v jq &> /dev/null; then
  echo "$PIPE_BODY" | jq -r '.stages[] | "  " + (if .status == "pass" then "✓" elif .status == "skip" then "⊘" else "✗" end) + " " + .stage + " (" + (.ms|tostring) + "ms) → " + .detail' 2>/dev/null | while IFS= read -r line; do
    if echo "$line" | grep -q "✗"; then
      echo -e "  ${RED}${line}${NC}"
    elif echo "$line" | grep -q "⊘"; then
      echo -e "  ${YELLOW}${line}${NC}"
    else
      echo -e "  ${GREEN}${line}${NC}"
    fi
  done

  CLASSIFIED=$(echo "$PIPE_BODY" | jq '.classification' 2>/dev/null)
  if [ "$CLASSIFIED" != "null" ] && [ -n "$CLASSIFIED" ]; then
    echo ""
    echo -e "  ${BOLD}Classification result:${NC}"
    echo "$CLASSIFIED" | jq '.' 2>/dev/null | sed 's/^/    /'
  fi
else
  echo "  Raw: ${PIPE_BODY:0:500}"
fi

echo ""

# ── Test 5: Check recent submissions status ───────────────────────────

echo -e "${BOLD}[5/5] Recent Submission Status (from health check)${NC}"
echo ""

if command -v jq &> /dev/null; then
  COUNTS=$(echo "$BODY" | jq -r '.checks[] | select(.name == "pipeline:submission_counts") | .detail' 2>/dev/null)
  if [ -n "$COUNTS" ]; then
    echo -e "  ${CYAN}${COUNTS}${NC}"
  fi

  STUCK=$(echo "$BODY" | jq -r '.checks[] | select(.name == "pipeline:stuck_received") | .detail' 2>/dev/null)
  if [ -n "$STUCK" ]; then
    echo -e "  ${RED}⚠ ${STUCK}${NC}"
  fi

  FAILURES=$(echo "$BODY" | jq -r '.checks[] | select(.name == "pipeline:recent_failures") | .detail' 2>/dev/null)
  if [ -n "$FAILURES" ]; then
    echo -e "  ${RED}Recent failures:${NC}"
    echo "$FAILURES" | jq '.' 2>/dev/null | sed 's/^/    /'
  fi
fi

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Diagnostic Complete${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════${NC}"
echo ""
echo "  Next steps if things are broken:"
echo "  1. If health check fails → fix env vars or Supabase tables"
echo "  2. If ingest returns 500 → Supabase INSERT failing (schema missing?)"
echo "  3. If WhatsApp test passes but no tutorial appears → after() not firing"
echo "  4. If dry-run extract fails → check source type (Jina/Deepgram/YouTube)"
echo "  5. If dry-run classify fails → check ANTHROPIC_API_KEY"
echo ""
echo "  To retry a stuck submission manually:"
echo "  curl -X POST ${BASE_URL}/api/process -H 'Content-Type: application/json' -d '{\"submission_id\": \"<ID>\"}'"
echo ""
