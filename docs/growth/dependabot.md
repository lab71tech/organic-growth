# Feature: Dependabot for GitHub Actions
Created: 2026-02-12
Status: 🌳 Complete

## Seed (what & why)

Keep GitHub Actions up to date automatically via Dependabot. The project uses three third-party actions (`actions/checkout@v4`, `actions/setup-node@v4`, `oven-sh/setup-bun@v2`) across two workflows. Without automated updates, pinned versions go stale and miss security patches.

## Growth Stages

### Concrete (next 1-2 stages, detailed)

- ✅ Stage 1: Dependabot config for github-actions ecosystem
  - Intent: Add `.github/dependabot.yml` that monitors the `github-actions` ecosystem on a weekly schedule
  - What grew: `.github/dependabot.yml` (version 2, github-actions ecosystem, weekly schedule), 3 new tests in `test/ci.test.mjs`
  - Test: `node --test` passes (28 tests, 0 failures)

### Horizon (rough outline of what comes after)

- If npm dependencies are ever added, extend dependabot.yml with an `npm` ecosystem entry
- Consider grouping minor/patch updates to reduce PR noise

## Growth Log
<!-- Auto-updated after each stage -->
