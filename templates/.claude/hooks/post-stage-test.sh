#!/bin/bash
# Post-stage test hook for Claude Code
# Triggers after Bash tool use — detects stage commits and runs
# the test suite, injecting results back into the conversation.
#
# Wired via .claude/settings.json PostToolUse hook.
# Runs BEFORE the review hook so tests gate the review.
# Requires: jq (for JSON I/O). Silently exits if jq is missing.
#
# Test command is auto-discovered from the **Test:** field in CLAUDE.md.
# If the field is empty or contains a placeholder, the hook exits silently.

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

# Discover the test command from CLAUDE.md
CLAUDE_MD="CLAUDE.md"
if [ ! -f "$CLAUDE_MD" ]; then
  exit 0
fi

# Extract content between backticks after **Test:**
TEST_CMD=$(sed -n 's/.*\*\*Test:\*\*.*`\([^`]*\)`.*/\1/p' "$CLAUDE_MD" | head -1)

# Exit silently if no test command found or if it's a placeholder
if [ -z "$TEST_CMD" ]; then
  exit 0
fi
if echo "$TEST_CMD" | grep -qE '^\[e\.g\.|^\['; then
  exit 0
fi

# This was a stage commit — run tests
SUBJECT=$(git log -1 --pretty=%s 2>/dev/null)
TEST_OUTPUT=$(eval "$TEST_CMD" 2>&1 || true)

# Cap output to 100 lines to avoid overwhelming context
TEST_OUTPUT=$(echo "$TEST_OUTPUT" | tail -100)

if echo "$TEST_OUTPUT" | grep -qE '# fail [1-9]|failing|not ok|FAIL|FAILED'; then
  TEST_CONTEXT="TESTS FAILED after stage commit: ${SUBJECT}

Some tests are failing. You MUST fix these failures before continuing to the next stage.
The quality gate requires ALL tests to pass after every stage.

Test output (last 100 lines):
${TEST_OUTPUT}"
else
  TEST_CONTEXT="All tests passed after stage commit: ${SUBJECT}"
fi

# Output structured JSON so Claude receives the test results
jq -n --arg ctx "$TEST_CONTEXT" '{
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: $ctx
  }
}'

exit 0
