#!/bin/bash
INPUT=$(cat)
PORT_FILE="$HOME/.petdex-cc/data/port.lock"
PORT=17321
if [ -f "$PORT_FILE" ]; then
  PORT=$(cat "$PORT_FILE" 2>/dev/null || echo "17321")
fi

# 1) Forward the event → drives pet animation + level/events counter
curl -s -X POST "http://localhost:$PORT/event" \
  -H "Content-Type: application/json" \
  -d "$INPUT" > /dev/null 2>&1 &

# 2) Real-time token bar: derive the current context size from the session
#    transcript and push it. (statusLine hook doesn't fire in non-TUI
#    environments, so we feed tokens from this always-firing event hook.)
{
  TP=$(printf '%s' "$INPUT" | jq -r '.transcript_path // empty' 2>/dev/null)
  if [ -z "$TP" ] || [ ! -f "$TP" ]; then
    TP=$(ls -t "$HOME"/.claude/projects/*/*.jsonl 2>/dev/null | head -1)
  fi
  if [ -n "$TP" ] && [ -f "$TP" ]; then
    # context size = prompt size (input + cache_creation + cache_read).
    # NO output_tokens (that's generated content → causes per-turn jitter and
    # isn't part of context usage). Exclude sidechain (sub-agent) messages and
    # take the last main-conversation message → stable, matches Claude Code gauge.
    CTX=$(jq -rs 'map(select(.message.usage != null and ((.isSidechain // false) == false))) | last | .message.usage
      | ((.input_tokens//0)+(.cache_creation_input_tokens//0)+(.cache_read_input_tokens//0))' "$TP" 2>/dev/null)
    if [ -n "$CTX" ] && [ "$CTX" -gt 0 ] 2>/dev/null; then
      BODY=$(jq -nc --argjson t "$CTX" '{total_tokens:$t,cost_usd:0}')
      curl -s -X POST "http://localhost:$PORT/statusline" \
        -H "Content-Type: application/json" \
        -d "$BODY" > /dev/null 2>&1
    fi
  fi
} &
