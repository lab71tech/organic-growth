# Growth Plan: Project Bootstrap

**Feature:** Harden the MVP — tests, quality gates, and developer polish
**Status:** in progress
**Current stage:** 1 of 5

## Context

organic-growth v0.1.0 exists as a working CLI that copies templates into a project.
The code works but has no tests, no linting, and no structured quality checks.
This bootstrap plan adds the foundation needed before growing new features.

## Stages

### Stage 1: Add first test — CLI runs without error ✅ done
**Intent:** Prove the test infrastructure works and the CLI is invocable.
**What grew:**
- `test/cli.test.mjs` — uses Node.js built-in test runner (`node --test`)
- Test: runs CLI with `--force` in a temp dir, verifies exit 0 + banner + CLAUDE.md created
- Added `"test": "node --test"` script to package.json
**Verified:** `npm test` — 1 test, 1 pass

### Stage 2: Test template installation into temp directory ✅ pending
**Intent:** Verify the core behavior — templates get copied correctly.
**What grows:**
- Test: invoke CLI in a temp directory, verify all expected files are created
- Test: verify files are not overwritten without `--force`
**Verify:** `npm test` passes, both tests green

### Stage 3: Test DNA document handling ✅ pending
**Intent:** Verify that DNA file argument is processed correctly.
**What grows:**
- Test: invoke CLI with a DNA .md file, verify it's copied to `docs/product-dna.md`
- Test: invoke CLI with a nonexistent DNA file, verify graceful warning
**Verify:** `npm test` passes

### Stage 4: Add --help flag and version output ✅ pending
**Intent:** Improve CLI ergonomics with standard flags.
**What grows:**
- `--help` flag prints usage information and exits
- `--version` flag prints version from package.json and exits
- Tests for both flags
**Verify:** `npm test` passes, `node bin/cli.mjs --help` and `--version` work

### Stage 5: Validate template content correctness ✅ pending
**Intent:** Ensure the installed templates are self-consistent.
**What grows:**
- Test: CLAUDE.md references agents that exist in templates
- Test: command files reference the gardener agent correctly
- Test: all template files are valid markdown (no broken structure)
**Verify:** `npm test` passes

## Horizon (rough ideas, not committed)

- Add a `--dry-run` flag to preview what would be installed
- Validate that target project has a `.git` directory (warn if not)
- Support `--no-color` flag for CI environments
- Publish to npm with GitHub Actions
