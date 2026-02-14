#!/bin/bash
# Post-stage test hook for Claude Code
# Triggers after Bash tool use — detects stage commits and runs
# the test suite, injecting results back into the conversation.
#
# Wired via .claude/settings.json PostToolUse hook.
# Runs BEFORE the review hook so tests gate the review.
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

# This was a stage commit — run tests
SUBJECT=$(git log -1 --pretty=%s 2>/dev/null)
TEST_OUTPUT=$(node --test 2>&1 || true)
TEST_EXIT=$?

# Cap output to 100 lines to avoid overwhelming context
TEST_OUTPUT=$(echo "$TEST_OUTPUT" | tail -100)

if echo "$TEST_OUTPUT" | grep -qE '# fail [1-9]|failing|not ok'; then
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
