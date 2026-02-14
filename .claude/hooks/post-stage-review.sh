#!/bin/bash
# Post-stage review hook for Claude Code
# Triggers after Bash tool use — detects stage commits and injects
# the diff as review context back into the conversation.
#
# Wired via .claude/settings.json PostToolUse hook.
# Requires: jq (for JSON I/O). Silently exits if jq is missing.

# Bail out if jq is not available
command -v jq >/dev/null 2>&1 || exit 0

# Read hook input from stdin
INPUT=$(cat)

# Extract the bash command that was executed
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Guard: only proceed if this was a git commit
if ! echo "$COMMAND" | grep -q 'git commit'; then
  exit 0
fi

# Check if the last commit message matches the stage pattern
COMMIT_MSG=$(git log -1 --pretty=%B 2>/dev/null || true)
if ! echo "$COMMIT_MSG" | grep -qiE 'stage [0-9]+'; then
  exit 0
fi

# This was a stage commit — gather review context
SUBJECT=$(git log -1 --pretty=%s 2>/dev/null)
DIFF_STAT=$(git diff HEAD~1 --stat 2>/dev/null || true)
DIFF=$(git diff HEAD~1 2>/dev/null | head -300 || true)

REVIEW_CONTEXT="Stage commit detected: ${SUBJECT}

Changes:
${DIFF_STAT}

Please review this stage:
1. Does the code match the stage intent from the growth plan?
2. Are all stage properties properly tested?
3. Are properties from previous stages preserved?
4. Any over-engineering, security concerns, or missed edge cases?

Diff (first 300 lines):
${DIFF}"

# Output structured JSON so Claude receives the review context
jq -n --arg ctx "$REVIEW_CONTEXT" '{
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: $ctx
  }
}'

exit 0
