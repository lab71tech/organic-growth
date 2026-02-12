# Feature: Configurable Release via Workflow Dispatch Inputs
Created: 2026-02-12
Status: 🌱 Growing

## Seed (what & why)

The daily release workflow currently always bumps the patch version, whether triggered by cron or manually via `workflow_dispatch`. Manual releases should be more powerful: the person triggering should be able to choose the version bump type (patch, minor, or major) and optionally preview what would happen without actually releasing. This makes the manual dispatch useful for milestone releases (minor/major bumps) and for safely verifying the release pipeline without side effects (dry run).

## Growth Stages

### Concrete (next 3-5 stages, detailed)

- ✅ Stage 1: Add `bump` input to workflow_dispatch (patch/minor/major) -- Added choice input with patch/minor/major options (default: patch), expanded version calculation to handle all three bump types with fallback to patch for cron triggers, added 3 new tests
  - Intent: Let manual releases choose the version bump type. The `workflow_dispatch` trigger gains a `bump` input with options `patch`, `minor`, `major` (default: `patch`). The "Bump patch version" step is updated to read from `github.event.inputs.bump` when present, falling back to `patch` for cron runs. The version calculation expands to handle minor (reset patch to 0) and major (reset minor and patch to 0) bumps.
  - Verify: `node --test` passes. New tests in `test/ci.test.mjs` validate: (1) `workflow_dispatch` has an `inputs` block with a `bump` input, (2) the input has `patch`, `minor`, `major` as options, (3) the version bump step references `github.event.inputs.bump` or the inputs context, (4) the step name reflects that it handles multiple bump types. Existing release workflow tests still pass.
  - Touches: `.github/workflows/release.yml`, `test/ci.test.mjs`

- ✅ Stage 2: Add `dry-run` input that previews without releasing -- Added boolean dry-run input (default: false). Commit/tag/push and release creation steps now skip when dry-run is true. New "Dry run summary" step outputs would-be version, commit count, and bump type to GITHUB_STEP_SUMMARY. 4 new tests, all 52 pass.
  - Intent: Add a boolean `dry-run` input to `workflow_dispatch` (default: `false`). When true, the workflow runs the change detection and version calculation steps but skips the commit, tag, push, and GitHub Release steps. It outputs what version would have been created and how many commits would be included. This lets maintainers verify the pipeline works correctly without side effects.
  - Verify: `node --test` passes. New tests validate: (1) `workflow_dispatch` has a `dry-run` input of type boolean, (2) the commit/tag/push and release creation steps have conditions that check the dry-run flag, (3) there is a dry-run summary step that outputs the preview. Existing tests still pass.
  - Touches: `.github/workflows/release.yml`, `test/ci.test.mjs`

- ⬜ Stage 3: Update README Releases section to document the new inputs
  - Intent: Document the `bump` and `dry-run` inputs in the README's Releases section. Update the manual release example to show how to pass inputs via `gh workflow run`. Add a brief explanation of when to use minor/major bumps and the dry-run option.
  - Verify: `node --test` passes. All existing tests pass unchanged. README contains documentation of both inputs.
  - Touches: `README.md`

### Horizon (rough outline of what comes after)
- Pre-release version support (e.g., `1.2.0-beta.1` via an optional `pre` input)
- Changelog generation beyond GitHub's auto-generated notes (e.g., CHANGELOG.md file)

## Growth Log
<!-- Auto-updated after each stage -->
- **2026-02-12 Stage 1**: Added `bump` input (patch/minor/major) to workflow_dispatch. Version calculation now handles all three bump types with patch fallback for cron. Step renamed from "Bump patch version" to "Bump version". 3 new tests, 1 updated test, all 48 pass.
- **2026-02-12 Stage 2**: Added `dry-run` boolean input to workflow_dispatch. When true, commit/tag/push and release creation are skipped; a summary step outputs the would-be version and commit count. 4 new tests, all 52 pass.
