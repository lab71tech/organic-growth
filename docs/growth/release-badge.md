# Feature: Release Badge in README
Created: 2026-02-12
Status: 🌳 Complete

## Seed (what & why)

Add a GitHub Release version badge to the README so visitors immediately see the latest published version. The README already has a Test CI badge; a release badge sits naturally beside it and signals that the project is actively released. This was identified as the next step in the `release-notes` growth plan's Horizon section after the daily release workflow was completed.

## Growth Stages

### Concrete (next 3-5 stages, detailed)

- ✅ Stage 1: Add a GitHub Release badge next to the existing CI badge
  - Intent: Place a shields.io badge showing the latest GitHub Release version on the same line as the existing Test badge. Use `https://img.shields.io/github/v/release/lab71tech/organic-growth` which automatically reflects the latest `v*` tag created by the daily release workflow. Link the badge to the GitHub Releases page.
  - Verify: `node --test` passes (add a test in `test/readme.test.mjs` or existing test file that validates the README contains the release badge URL and that it links to the releases page). Visual check: badge renders correctly on GitHub.
  - Touches: `README.md`, test file
  - Done: Added shields.io release badge to README.md on the same line as the Test badge. Added test in `test/ci.test.mjs` within the existing "README badge and repo URL" describe block. All 45 tests pass.

### Horizon (rough outline of what comes after)
- Add an npm version badge (shields.io/npm/v/organic-growth) for npm-specific visibility
- Add a license badge for quick license identification

## Growth Log
<!-- Auto-updated after each stage -->
- 2026-02-12: Stage 1 complete. Release badge added to README, test added to ci.test.mjs. Feature complete.
