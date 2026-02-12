# Feature: Automated Daily Releases
Created: 2026-02-12
Status: 🌱 Growing (replanned)

## Seed (what & why)

A GitHub Actions workflow that automatically releases a new version every day if there are changes on `main` since the last `v*` tag. The workflow checks for new commits, bumps the patch version in `package.json`, creates a GitHub Release with auto-generated release notes, and pushes a `v*` tag. The existing `publish.yml` workflow picks up the new tag and handles npm publishing. This eliminates manual release overhead entirely -- changes land on `main` through normal development, and users get a new version within 24 hours.

## Growth Stages

### Concrete (next 3-5 stages, detailed)

- ✅ Stage 1: Minimal release workflow that creates a GitHub Release when changes exist
  - Intent: Prove the workflow structure works end-to-end. A cron-triggered workflow that checks for commits since the last tag, bumps the patch version in package.json, commits the version bump, creates a `v*` tag, and creates a GitHub Release using `gh release create --generate-notes`. Include `workflow_dispatch` trigger for manual runs.
  - Verify: `node --test` passes (new test in `test/ci.test.mjs` validates the workflow YAML structure -- cron schedule, permissions, key steps). Workflow YAML is valid (no syntax errors).
  - Touches: `.github/workflows/release.yml`, `test/ci.test.mjs`
  - Done: Created `.github/workflows/release.yml` with daily cron (noon UTC), workflow_dispatch, change detection via git describe/rev-list, npm version patch bump, commit+tag+push with [skip ci], and gh release create --generate-notes. Added 8 tests validating the workflow structure. All 36 tests pass.

- ⬜ Stage 2: Release note categories via `.github/release.yml` configuration
  - Intent: Configure GitHub's auto-generated release notes to categorize changes using labels (features, fixes, CI, documentation). This makes the generated notes structured and readable instead of a flat commit list.
  - Verify: `node --test` passes (new test validates `.github/release.yml` exists and contains expected category configuration). The config file is valid YAML with `changelog.categories` structure.
  - Touches: `.github/release.yml`, `test/ci.test.mjs`

- ⬜ Stage 3: Loop prevention and robustness hardening
  - Intent: Ensure the version-bump commit created by the release workflow does not trigger another release cycle. Use `[skip ci]` in the commit message and add a check that the HEAD commit is not a version bump. Also add a guard that skips release if the only new commit since the last tag is a version bump.
  - Verify: `node --test` passes (test validates the workflow YAML contains skip-ci and version-bump-detection logic). Manual review of the workflow confirms no infinite loop scenario.
  - Touches: `.github/workflows/release.yml`, `test/ci.test.mjs`

- ⬜ Stage 4: README documentation update
  - Intent: Document the auto-release workflow in the README. Explain the daily release cycle, how it connects to the existing publish workflow, and how to trigger a manual release via `workflow_dispatch`.
  - Verify: `node --test` passes, README contains auto-release section.
  - Touches: `README.md`

### Horizon (rough outline of what comes after)
- Add a release badge to README (latest version from GitHub Releases)
- Support configurable release schedule (not just daily) via workflow inputs
- Option to bump minor version instead of patch (e.g., when growth plan stages complete a feature)

## Growth Log
<!-- Auto-updated after each stage -->
- 2026-02-12: Replanned. Pivoted from `/release-notes` command template to automated GitHub Actions daily release workflow. Original plan had 3 unstarted stages for a CLI command; new plan has 4 stages for a CI/CD workflow that creates GitHub Releases with auto-generated notes.
- 2026-02-12: Stage 1 complete. Created daily release workflow (`.github/workflows/release.yml`) with cron schedule, manual dispatch, change detection, patch version bump, tagging, and GitHub Release creation. Added 8 structural tests. Total: 36 tests passing.
