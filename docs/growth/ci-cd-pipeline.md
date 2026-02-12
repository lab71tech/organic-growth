# Feature: CI/CD Pipeline
Created: 2026-02-12
Status: 🌱 Growing

## Seed (what & why)

Automated testing and publishing via GitHub Actions. Every push and PR runs tests across Node 18/20/22 + bun. Version tags trigger npm publish. Without CI, regressions ship silently and publishing is a manual process prone to mistakes.

## Growth Stages

### Concrete (next 3-5 stages, detailed)

- ✅ Stage 1: Basic test workflow on Node 22
  - Intent: Simplest possible CI — a single workflow that runs `node --test` on push/PR
  - What grew: `.github/workflows/test.yml` (checkout, setup-node 22, run tests), `test/ci.test.mjs` validating workflow structure
  - Test: `node --test` passes (18 tests, 0 failures)

- ⬜ Stage 2: Node version matrix (18, 20, 22)
  - Intent: Expand to test across all supported Node versions
  - Verify: Matrix shows 3 jobs, all green
  - Touches: `.github/workflows/test.yml`

- ⬜ Stage 3: Add bun to the test matrix
  - Intent: Validate bun compatibility (both test runner and `bunx` install path)
  - Verify: Matrix shows 4 jobs (3 node + 1 bun), all green
  - Touches: `.github/workflows/test.yml`

- ⬜ Stage 4: Publish to npm on version tag
  - Intent: Automate npm publish when a `v*` tag is pushed
  - Verify: Workflow file has correct trigger, npm publish step, uses NPM_TOKEN secret
  - Touches: `.github/workflows/publish.yml`

- ⬜ Stage 5: README badge and repo URL fix
  - Intent: Add CI status badge to README, fix the placeholder repo URL in package.json
  - Verify: Badge renders, repo URL is correct
  - Touches: `README.md`, `package.json`

### Horizon (rough outline of what comes after)
- Dependabot or Renovate for keeping actions up to date
- Release notes generation from growth plan commits
- npm provenance (--provenance flag for supply chain security)

## Growth Log
<!-- Auto-updated after each stage -->
