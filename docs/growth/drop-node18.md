# Feature: Drop Node.js 18 Support
Created: 2026-02-12
Status: 🌳 Complete

## Seed (what & why)

Node.js 18 reached end-of-life. Remove it from the CI test matrix and update the corresponding test assertion. Only two files are affected — the GitHub Actions workflow and the CI test file.

## Growth Stages

### Concrete (next 3-5 stages, detailed)

- ✅ Stage 1: Remove Node 18 from CI matrix and test
  - What grew: Removed `18` from workflow matrix (`[20, 22]`), updated test assertion to match
  - Test: `node --test` passes (28 tests, 0 failures)

### Horizon (rough outline of what comes after)
- Add Node 24 when it reaches LTS

## Growth Log
- 2026-02-12: Stage 1 — removed Node 18 from CI matrix and test assertion. Feature complete.
