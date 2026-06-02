#!/bin/bash
INPUT=$(cat)
PORT_FILE="$HOME/.petdex-cc/data/port.lock"
PORT=17321
if [ -f "$PORT_FILE" ]; then
  PORT=$(cat "$PORT_FILE" 2>/dev/null || echo "17321")
fi

# Extract token totals, trying several known schema paths
TOTAL=$(echo "$INPUT" | jq -r '
  (( .context_window.total_input_tokens
   // .context_window.input_tokens
   // .cost.total_input_tokens
   // .usage.input_tokens
   // .tokens.input // 0 ) +
   ( .context_window.total_output_tokens
   // .context_window.output_tokens
   // .cost.total_output_tokens
   // .usage.output_tokens
   // .tokens.output // 0 ))
' 2>/dev/null)
[ -z "$TOTAL" ] && TOTAL=0

COST=$(echo "$INPUT" | jq -r '.cost.total_cost_usd // 0' 2>/dev/null)
[ -z "$COST" ] && COST=0

# Build VALID json with jq (fixes the original unquoted-keys bug)
BODY=$(jq -nc --argjson t "$TOTAL" --argjson c "$COST" '{total_tokens:$t,cost_usd:$c}' 2>/dev/null)

curl -s -X POST "http://localhost:$PORT/statusline" \
  -H "Content-Type: application/json" \
  -d "$BODY" > /dev/null 2>&1 &
