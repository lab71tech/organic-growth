# Growth Plan: Project Bootstrap

Feature: organic-growth npm package — CLI + templates for incremental development

## Completed Stages

### Stage 1 — Seed project with build and first test ✅
- **Intent:** Initialize npm project with zero-dep CLI skeleton
- **What grew:** `package.json`, `bin/cli.mjs`, `test/cli.test.mjs`, basic template copying
- **Test:** CLI smoke test — runs without error, copies templates, creates CLAUDE.md
- **Commit:** `2a0035a`

### Stage 2 — All templates and commands defined ✅
- **Intent:** Define the full set of templates that get installed
- **What grew:** `templates/.claude/CLAUDE.md`, gardener agent, all 5 commands (seed, grow, next, replan, review)
- **Test:** Existing smoke test covers template installation
- **Commit:** `63a53ad`

### Stage 3 — Product DNA and README ✅
- **Intent:** Document the product and make it installable
- **What grew:** `docs/product-dna.md`, `README.md`, DNA copy feature in CLI
- **Test:** Existing smoke test (DNA copy not yet tested)
- **Commit:** `00204fd`

### Stage 4 — Test CLI template completeness ✅
- **Intent:** Verify all expected templates are installed and contain required content
- **What grew:** Two new tests in `test/cli.test.mjs` — one asserts all 7 template files exist and are non-empty after install, another asserts `docs/growth/` directory is created. Extracted shared `runCLI()` helper to avoid duplication.
- **Test:** `node --test` passes (3 tests, 0 failures)
- **Commit:** `468f9b1`

### Stage 5 — Test DNA document handling ✅
- **Intent:** Verify the DNA path copies the document correctly and warns on missing files
- **What grew:** 3 new tests — copies DNA file with correct content, prints success message, warns when DNA file missing. Extended `runCLI()` to accept extra args.
- **Test:** `node --test` passes (6 tests, 0 failures)

### Stage 6 — CLI help and version flags ✅
- **Intent:** Add `--help` and `--version` flags so the CLI behaves like a proper tool
- **What grew:** `printHelp()` and `readVersion()` functions, short-circuit before install, `-h`/`-v` aliases
- **Test:** 4 new tests — `--help` prints usage and doesn't install, `-h` works, `--version` prints version from package.json and doesn't install, `-v` works
- **Commit:** `87d0f7f`

### Stage 7 — Validate template content integrity ✅
- **Intent:** Ensure templates contain the key markers (e.g. CLAUDE.md has "THE SEED", gardener has "PLAN" mode)
- **What grew:** 3 new tests — CLAUDE.md contains key section markers (THE SEED, THE SOIL, LIGHT & WATER, Organic Growth, Growth Rules), gardener agent contains all three modes and quality gate, all 5 commands have description in frontmatter
- **Test:** `node --test` passes (13 tests, 0 failures)

### Stage 8 — Package size and publish readiness ✅
- **Intent:** Verify package meets constraints (<50KB, correct files included, bin works)
- **What grew:** 4 new tests — tarball includes only expected files (no test/docs/.claude leakage), unpacked size under 50KB, bin entry points to cli.mjs, package.json has all required publish fields
- **Test:** `node --test` passes (17 tests, 0 failures)

## All Planned Stages Complete

## Horizon (not planned in detail)

- CI/CD pipeline (GitHub Actions: test on node 18/20/22, bun)
- Upgrade path (detect existing install, show diff)
- Template versioning (track which version of templates was installed)
- Interactive seed mode (CLI-based interview, not just Claude Code command)
