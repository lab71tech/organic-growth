# Growth Plan: Post-Stage Test Hook

## Context

The quality gate in CLAUDE.md requires "ALL tests must pass" after every stage, but currently this relies on the gardener agent remembering to run tests. The post-stage review hook already auto-triggers on stage commits — we need a companion hook that runs tests automatically, **before** the review hook. This makes the quality gate deterministic rather than relying on agent discipline.

## Design Decisions

- **Hook ordering:** `settings.json` hooks array within a matcher runs in order. Test hook goes first, review hook second.
- **Test command discovery (template):** Parse CLAUDE.md `**Test:**` field — every organic-growth project has this filled in. Falls back gracefully if not found.
- **Test command (this project):** Hardcoded `node --test` since this project has a known test command.
- **On failure:** Exit 0 (don't break Claude Code flow) but inject failure output in `additionalContext` telling Claude to fix before continuing.
- **On pass:** Inject brief confirmation in `additionalContext`.
- **Output cap:** Limit test output to 100 lines to avoid overwhelming context.
- **Same guards as review hook:** jq check, `git commit` check, stage pattern check.

---

## Stages

### Stage 1: Working test-runner hook for this project

**Intent:** Create a PostToolUse hook that runs `node --test` after every stage commit, registered before the review hook.

**Properties:**
- P1: Script `.claude/hooks/post-stage-test.sh` exists and is non-empty
- P2: `settings.json` registers the test hook as the **first** entry in the Bash matcher's `hooks` array; the review hook is second
- P3: Hook detects stage commits (command contains `git commit` AND last commit message matches `stage [0-9]+`)
- P4: Hook exits cleanly (exit 0, no stdout) for non-stage bash commands (e.g., `ls`, `npm install`)
- P5: Hook runs `node --test` when a stage commit is detected
- P6: Hook outputs JSON with `hookSpecificOutput.additionalContext` containing test results (pass or fail details)
- P7: Hook uses `bash` invocation in settings (no executable bit needed), consistent with review hook pattern

Done: 2026-02-14

### Stage 2: Template hook + settings update + tests

**Intent:** Add the test hook to templates so it's installed in user projects, with test command auto-discovery from CLAUDE.md.

**Properties:**
- P8: Template hook exists at `templates/.claude/hooks/post-stage-test.sh`
- P9: Template `settings.json` has test hook **before** review hook in the Bash matcher's hooks array
- P10: Template hook extracts test command from CLAUDE.md `**Test:**` field (backtick-delimited command)
- P11: Template hook exits cleanly (exit 0, no stdout) when no test command is found in CLAUDE.md (e.g., unfilled placeholder `[e.g.: ...]`)
- P12: CLI installs the template automatically (auto-discovered by `getAllFiles()`, no CLI code changes needed)
- P13: Expected file list in tests updated to 11 files (adding `post-stage-test.sh`)
- P14: All existing tests pass unchanged

Depends on: P1-P7
Done: 2026-02-14

### Stage 3: Documentation

**Intent:** Update README and product DNA to document the automatic test quality gate.

**Properties:**
- P15: README mentions automatic test running after stage commits
- P16: README explains hook ordering (tests run first, then code review)
- P17: Product DNA reflects deterministic test quality gate (not just agent discipline)
- P18: All existing README headings remain intact and in order
- P19: All existing tests pass unchanged

Depends on: P8-P14
Done: 2026-02-14
