#!/bin/bash
# Commit format check hook for Claude Code
# Triggers after Bash tool use — detects stage commits and checks
# that they follow the feat(scope): stage N — <what grew> convention.
#
# Advisory only — outputs a warning but does not block.
# Runs AFTER test and review hooks.
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
COMMIT_MSG=$(git log -1 --pretty=%s 2>/dev/null || true)
if ! echo "$COMMIT_MSG" | grep -qiE 'stage [0-9]+'; then
  exit 0
fi

# This was a stage commit — check format
# Expected: feat(scope): stage N — <description>
if echo "$COMMIT_MSG" | grep -qE '^feat\([^)]+\): stage [0-9]+ — .+'; then
  # Correct format — exit silently
  exit 0
fi

# Format doesn't match — output advisory warning
echo "⚠️ Stage commit format suggestion" >&2

jq -n --arg msg "$COMMIT_MSG" '{
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: ("Commit format suggestion: the stage commit message does not follow the expected convention.\n\nActual:   " + $msg + "\nExpected: feat(scope): stage N — <what grew>\n\nThis is advisory only — the commit has already been made. Consider amending if appropriate.")
  }
}'

exit 0
