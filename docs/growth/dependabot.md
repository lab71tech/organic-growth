# Feature: Dependabot for GitHub Actions
Created: 2026-02-12
Status: 🌳 Complete

## Seed (what & why)

Keep GitHub Actions up to date automatically via Dependabot. The project uses three third-party actions (`actions/checkout@v4`, `actions/setup-node@v4`, `oven-sh/setup-bun@v2`) across two workflows. Without automated updates, pinned versions go stale and miss security patches.

**Replan reason:** Add grouping for minor/patch updates to reduce PR noise, with a 7-day grouping window.

## Growth Stages

### Concrete (next 1-2 stages, detailed)

- ✅ Stage 1: Dependabot config for github-actions ecosystem
  - Intent: Add `.github/dependabot.yml` that monitors the `github-actions` ecosystem on a weekly schedule
  - What grew: `.github/dependabot.yml` (version 2, github-actions ecosystem, weekly schedule), 3 new tests in `test/ci.test.mjs`
  - Test: `node --test` passes (28 tests, 0 failures)

- ✅ Stage 2: Group minor/patch updates to reduce PR noise
  - Intent: Add a `groups` configuration to the github-actions ecosystem that batches minor and patch version updates into a single PR
  - What grew: `groups.actions-minor-patch` block in `.github/dependabot.yml` (applies-to: version-updates, update-types: minor + patch), 1 new test in `test/ci.test.mjs`
  - Test: `node --test` passes (53 tests, 0 failures)

### Horizon (rough outline of what comes after)

- If npm dependencies are ever added, extend dependabot.yml with an `npm` ecosystem entry

## Growth Log
<!-- Auto-updated after each stage -->
- 2026-02-12: Replanned — reopened to add minor/patch grouping (stage 2)
- 2026-02-12: Stage 2 complete — groups block added, 53 tests passing
