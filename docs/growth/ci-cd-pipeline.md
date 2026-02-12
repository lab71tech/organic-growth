# Feature: CI/CD Pipeline
Created: 2026-02-12
Status: 🌳 Complete

## Seed (what & why)

Automated testing and publishing via GitHub Actions. Every push and PR runs tests across Node 18/20/22 + bun. Version tags trigger npm publish. Without CI, regressions ship silently and publishing is a manual process prone to mistakes.

## Growth Stages

### Concrete (next 3-5 stages, detailed)

- ✅ Stage 1: Basic test workflow on Node 22
  - Intent: Simplest possible CI — a single workflow that runs `node --test` on push/PR
  - What grew: `.github/workflows/test.yml` (checkout, setup-node 22, run tests), `test/ci.test.mjs` validating workflow structure
  - Test: `node --test` passes (18 tests, 0 failures)

- ✅ Stage 2: Node version matrix (18, 20, 22)
  - Intent: Expand to test across all supported Node versions
  - What grew: Added `strategy.matrix.node-version: [18, 20, 22]` to workflow, test verifies all three versions in matrix
  - Test: `node --test` passes (19 tests, 0 failures)

- ✅ Stage 3: Add bun to the test matrix
  - Intent: Validate bun compatibility (both test runner and `bunx` install path)
  - What grew: Separate `test-bun` job using `oven-sh/setup-bun@v2` + `bun run test`, renamed node job to `test-node`, test verifies bun job exists
  - Test: `node --test` passes (20 tests, 0 failures)

- ✅ Stage 4: Publish to npm on version tag
  - Intent: Automate npm publish when a `v*` tag is pushed
  - What grew: `.github/workflows/publish.yml` — triggers on `v*` tags, uses `--provenance --access public`, authenticates via `NPM_TOKEN` secret, `id-token: write` permission for provenance
  - Test: `node --test` passes (23 tests, 0 failures)

- ✅ Stage 5: README badge and repo URL fix
  - Intent: Add CI status badge to README, fix the placeholder repo URL in package.json
  - What grew: CI badge in README linking to test workflow, `package.json` repo URL fixed to `lab71tech/organic-growth`, tests verify badge exists and URL has no TODO placeholder
  - Test: `node --test` passes (25 tests, 0 failures)

### Horizon (rough outline of what comes after)
- ~~Dependabot or Renovate for keeping actions up to date~~ → done (see `docs/growth/dependabot.md`)
- Release notes generation from growth plan commits
- npm provenance (--provenance flag for supply chain security)

## Growth Log
<!-- Auto-updated after each stage -->
