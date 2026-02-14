# Feature: Post-Stage Review Hook
Created: 2026-02-14
Status: 🌱 Growing

## Seed (what & why)

The organic growth workflow emphasizes quality gates after every stage, but code review currently requires manual invocation via `/review`. A Claude Code PostToolUse hook can automatically detect when a stage is committed and inject the diff + review checklist back into the conversation as `additionalContext`. This gives the gardener agent immediate feedback after every stage — a built-in second opinion at zero extra effort. The hook watches for `git commit` bash commands whose resulting commit message matches the stage pattern (`stage N`), then outputs a structured JSON response that Claude sees as review context.

## Growth Stages

### Concrete (next 3-5 stages, detailed)

- ✅ Stage 1: Working post-stage review hook for this project
  - Intent: Create a Claude Code PostToolUse hook that detects stage commits and returns the diff as review context to Claude
  - Properties:
    - P1: A file exists at `.claude/hooks/post-stage-review.sh` [invariant]
      Captures: Hook script missing — no automatic review happens
    - P2: A file exists at `.claude/settings.json` containing a `hooks` key with a `PostToolUse` entry whose matcher is `Bash` and whose command references the hook script path [invariant]
      Captures: Hook script exists but isn't wired — Claude Code never invokes it
    - P3: The hook script only triggers when the bash command contains `git commit` AND the most recent commit message matches the pattern `stage` followed by a digit [boundary]
      Captures: Hook fires on every bash command (noisy) or fires on non-stage commits (false positives)
    - P4: When the hook triggers, its stdout is valid JSON containing a `hookSpecificOutput.additionalContext` field with the commit's diff information [invariant]
      Captures: Hook triggers but output is malformed — Claude never sees the review context
    - P5: When the bash command is not a git commit (e.g. `ls`, `npm test`), the hook exits with code 0 and produces no stdout [boundary]
      Captures: Hook interferes with normal workflow by outputting noise on every command
    - P6: The hook invokes the script via `bash` in the command field, so no executable permission bit is required on the script file [invariant]
      Captures: Hook fails on systems where copyFileSync doesn't preserve executable bit
    - P7: All existing tests (78) still pass [invariant]
      Captures: New files break existing test assumptions
  - Depends on: none (first stage)
  - Touches: `.claude/hooks/post-stage-review.sh`, `.claude/settings.json`, `test/cli.test.mjs`
  - Implementation hint: Hook reads JSON from stdin, extracts `tool_input.command`, checks for `git commit`, then runs `git log -1 --pretty=%B` to verify stage pattern. Uses `jq` for JSON I/O. Settings uses `bash "$CLAUDE_PROJECT_DIR"/.claude/hooks/post-stage-review.sh` as command.

- ⬜ Stage 2: Template hook + CLI installation + tests
  - Intent: Ship the hook as a template that gets installed by the CLI, with tests validating template content and installation
  - Properties:
    - P8: Template file exists at `templates/.claude/hooks/post-stage-review.sh` with the same stage-detection and diff-output logic as the project's own hook [invariant]
      Captures: Template missing — users don't get the hook when they install organic-growth
    - P9: Template file exists at `templates/.claude/settings.json` with the PostToolUse hook configuration [invariant]
      Captures: Hook script ships but isn't wired in settings — useless without manual configuration
    - P10: CLI installs both new files to the target directory (total template files increases from 8 to 10) [invariant]
      Captures: New templates exist but CLI doesn't copy them — user gets nothing
    - P11: Test validates hook template contains stage-commit detection logic (checks for `git commit` and stage pattern) [invariant]
      Captures: Hook template gutted during future edits — becomes a no-op
    - P12: Test validates settings template contains PostToolUse hook referencing the hook script [invariant]
      Captures: Settings template decoupled from hook script — hook never fires
    - P13: Test validates hook template outputs JSON with `additionalContext` [invariant]
      Captures: Hook output format changed — Claude no longer receives review context
    - P1-P7 still hold
  - Depends on: P1, P2, P4 (project hook established as reference)
  - Touches: `templates/.claude/hooks/post-stage-review.sh`, `templates/.claude/settings.json`, `bin/cli.mjs` (if needed), `test/cli.test.mjs`
  - Implementation hint: Copy project hook as template. CLI's `getAllFiles` already recurses `templates/`, so new files are auto-discovered. Update template count test from 8 to 10.

- ⬜ Stage 3: Documentation
  - Intent: Document the automatic review hook in README and product DNA so users discover and understand it
  - Properties:
    - P14: README contains a section or mention of automatic post-stage review [invariant]
      Captures: Feature exists but users never learn about it
    - P15: README explains what triggers the hook (stage commits) and what it does (injects diff for review) [invariant]
      Captures: Feature mentioned but not explained — users don't understand the mechanism
    - P16: Product DNA reflects the automatic review capability [invariant]
      Captures: Gardener agent plans without knowing automatic review exists
    - P17: All existing README structure (headings, links, anchors) remains intact [invariant]
      Captures: New section breaks existing navigation
    - P1-P13 still hold
  - Depends on: P8, P9 (templates exist to document)
  - Touches: `README.md`, `docs/product-dna.md`, `test/cli.test.mjs`
  - Implementation hint: Add to the "What You Get" section or create a small subsection near the workflow description. Keep it concise — this is a quality-of-life feature, not a core concept.

### Horizon (rough outline of what comes after)
- Make review depth configurable (quick check vs full review) via hook environment variable
- Option to auto-pause growth if review finds 🔴 issues (exit code 2 to block)
- Support for custom review checklists per project (read from `.claude/review-checklist.md`)

## Growth Log
<!-- Auto-updated after each stage -->
- 2026-02-14: Stage 1 complete. Created `.claude/hooks/post-stage-review.sh` (bash + jq, detects stage commits via commit message pattern, outputs diff as `additionalContext` JSON) and `.claude/settings.json` (PostToolUse hook wired to Bash matcher). Uses `bash` invocation to avoid executable-bit issues. Added 6 tests (P1-P6) in "Post-stage review hook (project)" describe block. All 85 tests pass.
