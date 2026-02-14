# 🌱 Feature: Hook Visual Feedback
Created: 2026-02-15
Status: 🌱 Growing

## Seed (what & why)

The post-stage hooks (test and review) run silently — they produce JSON on stdout for Claude Code to consume, but the user sees no visual feedback during execution. When a stage commit triggers the hooks, there's an invisible pause while tests run and diffs are gathered, with no indication of what's happening. Adding emoji-prefixed status messages to stderr gives the user immediate visual confirmation that hooks fired and shows progress (e.g., "🧪 Running quality gate..." → "✅ Tests passed"). This makes the organic growth workflow feel alive and transparent.

---

## Growth Stages

### Concrete (next 3-5 stages, detailed)

🌳 Stage 1: Visual feedback for the test hook
  - Intent: Add emoji-prefixed stderr messages to the post-stage test hook so the user sees when the hook fires, when tests run, and whether they pass or fail
  - Properties:
    - P1: Both project and template test hook scripts contain at least one `>&2` (stderr) echo statement that includes an emoji character [invariant]
      Captures: Hook runs silently — user sees a pause with no explanation of what's happening
    - P2: The test hook emits a stderr message BEFORE running the test suite, indicating that tests are about to run [invariant]
      Captures: Long test suites run with no progress indication — user wonders if the hook hung
    - P3: The test hook emits a stderr message AFTER running tests that visually distinguishes pass from fail using different emoji [invariant]
      Captures: User must read the JSON context injection to learn the result — the quick visual signal is missing
    - P4: The stderr messages do not interfere with the JSON stdout output — hook still produces valid JSON on stdout [invariant]
      Captures: Emoji accidentally written to stdout corrupts the JSON that Claude Code parses
    - P5: Project and template test hook scripts are functionally equivalent (same stderr messages, same emoji) [invariant]
      Captures: Template and project copies diverge — users get different feedback than the project itself shows
  - Depends on: none (first stage)
  - Touches: `.claude/hooks/post-stage-test.sh`, `templates/.claude/hooks/post-stage-test.sh`, `test/cli.test.mjs`
  - Done: Added three stderr messages to both hooks (test tube before tests, check mark on pass, cross on fail). 5 property tests added. All 72 tests pass.

🌳 Stage 2: Visual feedback for the review hook
  - Intent: Add emoji-prefixed stderr messages to the post-stage review hook so the user sees when review context is being gathered and when it's ready
  - Properties:
    - P6: Both project and template review hook scripts contain at least one `>&2` (stderr) echo statement that includes an emoji character [invariant]
      Captures: Review hook runs silently after test hook — user doesn't know a second hook is working
    - P7: The review hook emits a stderr message indicating it is gathering review context [invariant]
      Captures: Diff/stat gathering has no visual signal — appears as dead time between test results and review injection
    - P8: The review hook emits a stderr message when review context is ready for injection [invariant]
      Captures: User doesn't know when the review hook finished — no closure signal
    - P9: The stderr messages do not interfere with the JSON stdout output — hook still produces valid JSON on stdout [invariant]
      Captures: Emoji accidentally written to stdout corrupts the JSON that Claude Code parses
    - P10: Project and template review hook scripts are functionally equivalent (same stderr messages, same emoji) [invariant]
      Captures: Template and project copies diverge
    - P1-P5 from Stage 1 still hold [regression]
  - Depends on: none (independent of Stage 1 but naturally follows)
  - Touches: `.claude/hooks/post-stage-review.sh`, `templates/.claude/hooks/post-stage-review.sh`, `test/cli.test.mjs`
  - Done: Added two stderr messages to both review hooks (magnifying glass for gathering, clipboard for ready). 5 property tests added (P6-P10). All 77 tests pass.

🌱 Stage 3: End-to-end stderr verification
  - Intent: Add end-to-end tests that actually execute the hooks and verify stderr contains the expected emoji, complementing the existing stdout JSON tests
  - Properties:
    - P11: An end-to-end test executes the test hook with a simulated stage commit and verifies stderr contains emoji feedback [invariant]
      Captures: Emoji messages exist in source code but a shell quoting or redirect bug prevents them from appearing at runtime
    - P12: An end-to-end test executes the review hook with a simulated stage commit and verifies stderr contains emoji feedback [invariant]
      Captures: Same as P11 but for the review hook
    - P13: Existing end-to-end test for test hook stdout JSON still passes unchanged [regression]
      Captures: New stderr assertions break the existing stdout test
    - P1-P10 from Stages 1-2 still hold [regression]
  - Depends on: P1-P5, P6-P10
  - Touches: `test/cli.test.mjs`

─── 🌿 Horizon ───

- Consider adding a `--quiet` flag or environment variable to suppress stderr emoji (for CI environments)
- Consider a summary line at the very end showing total hook execution time
- Themed emoji selection (plant-themed 🌱/🌿/🌳 vs tool-themed 🧪/🔍) — match project's organic metaphor

## Growth Log
<!-- Auto-updated after each stage -->

### 2026-02-15 — Stage 1 complete
Added emoji-prefixed stderr messages to both project and template test hooks:
- `echo "🧪 Running quality gate tests..." >&2` before test execution
- `echo "✅ All tests passed after: ..." >&2` on success
- `echo "❌ Tests failed after: ..." >&2` on failure
All output goes to stderr; stdout JSON remains untouched.
5 property tests (P1-P5) added and passing. Total: 72/72 tests pass.

### 2026-02-15 — Stage 2 complete
Added emoji-prefixed stderr messages to both project and template review hooks:
- `echo "🔍 Gathering review context..." >&2` after stage-commit guard passes, before diff gathering
- `echo "📋 Review context ready for: ${SUBJECT}" >&2` after context assembly, before JSON output
All output goes to stderr; stdout JSON remains untouched.
5 property tests (P6-P10) added and passing. Total: 77/77 tests pass.
