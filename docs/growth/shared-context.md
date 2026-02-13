# Feature: Shared Project Context
Created: 2026-02-13
Status: 🌱 Growing (phase 2)

## Seed (what & why)
Project context (product, tech stack, quality tools, priorities) is currently duplicated across tool-specific config files (CLAUDE.md, copilot-instructions.md). When users change priorities, they update multiple files. Adding new tools (opencode, VSCode) would mean more duplication. This feature extracts project context into a single shared file (`docs/project-context.md`) that serves as the source of truth. Claude Code references it dynamically (gardener reads the file). Other tools get context injected via a CLI `sync` command that replaces content between markers.

## Growth Stages

### Concrete (next 3-5 stages, detailed)

- ✅ Stage 1: Create shared project-context.md template and install via CLI
  - Created `templates/docs/project-context.md` with Product, Tech Stack, Quality Tools, Priorities sections
  - CLI installs it always (regardless of --target), with prompt-on-conflict support
  - 3 new tests: content integrity, placeholders, target-independence; tarball test updated
  - 68 tests passing (up from 65)

- ✅ Stage 2: Update CLAUDE.md template to reference shared context
  - CLAUDE.md now reference-only: points to project-context.md, keeps methodology
  - Gardener agent reads project-context.md in PLAN mode (description + steps updated)
  - /seed command fills project-context.md instead of CLAUDE.md
  - Tests updated: CLAUDE.md checks reference + no placeholders; gardener checks project-context.md reference

- ✅ Stage 3: Add sync markers to copilot-instructions.md
  - Added `<!-- BEGIN PROJECT CONTEXT -->` / `<!-- END PROJECT CONTEXT -->` markers wrapping the project context section
  - Comment notes the sync command: `Run npx organic-growth sync to update this section`
  - Copilot-specific methodology sections unchanged below the markers
  - 1 new test verifying markers exist and are in correct order; 69 tests total
  - Re-evaluated plan: adjusted stage 5 scope (/seed already done in stage 2)

- ✅ Stage 4: Implement `sync` subcommand in CLI
  - `npx organic-growth sync` reads docs/project-context.md and replaces content between BEGIN/END markers in target config files
  - Supports `--target copilot` to filter which files to sync, `--help` for usage info
  - Handles missing project-context.md (exit 1 with message), missing target files, and files without markers gracefully
  - Reports synced/unchanged/missing/no-markers status per file; idempotent (second sync reports "already up to date")
  - Help text updated to document the sync command with examples
  - 8 new sync tests; 77 tests total, all passing

- ✅ Stage 5: Update CLI install output for shared context architecture
  - "Next steps" now guides users to edit `docs/project-context.md` as the single file
  - When copilot is installed, suggests `npx organic-growth sync` to push context
  - /seed suggestion updated: "in Claude Code to fill project-context.md via interview"
  - Removed old "Edit .claude/CLAUDE.md" and "Edit .github/copilot-instructions.md" lines
  - 3 new tests (project-context.md guidance, sync suggestion, no direct config edit); 80 tests total

- ✅ Stage 6: Validate project-context.md for placeholder text during sync
  - Added `hasPlaceholders()` function with regex matching template placeholder patterns (e.g., `[One sentence...`, `[e.g.: ...`)
  - `sync` prints a non-blocking warning when placeholders detected, then continues syncing normally
  - 2 new tests: warns on template defaults, silent on filled-in content; 82 tests total
  - Re-evaluation point (stage 6): remaining stages 7-9 still appropriate, no changes needed

- ⬜ Stage 7: Update README to explain shared context architecture
  - Intent: The "After Install" and "What You Get" sections still tell users to edit CLAUDE.md and copilot-instructions.md directly. Update to reflect the new single-file workflow: edit project-context.md, run sync
  - Verify: README mentions `docs/project-context.md` as the file to edit, documents the `sync` command, file tree includes `docs/project-context.md`, "After Install" steps are correct for both tools
  - Touches: `README.md`, `test/cli.test.mjs` (optional: test that README is consistent, or skip if not warranted)

- ⬜ Stage 8: Update product-dna.md to reflect shared context architecture
  - Intent: The product DNA document is outdated -- references 65 tests, doesn't mention shared context, sync command, or project-context.md. Update to accurately describe the current system so future planning sessions have correct context
  - Verify: product-dna.md mentions project-context.md, sync command, current test count, shared context as an architectural concept
  - Touches: `docs/product-dna.md`

- ⬜ Stage 9: Add `sync --watch` mode for auto-syncing on file changes
  - Intent: Running `sync` manually after every edit is friction. `sync --watch` uses `fs.watch` to monitor `docs/project-context.md` and auto-sync to all targets when it changes. Exits on Ctrl+C
  - Verify: `--watch` flag accepted, initial sync runs on start, file change triggers re-sync, Ctrl+C exits cleanly; test covers at least: watch starts, detects a change, syncs; help text documents `--watch`
  - Touches: `bin/cli.mjs` (sync function, fs.watch), `test/cli.test.mjs` (watch tests), help text

### Horizon (rough outline of what comes after)
- opencode template (`templates/.opencode/`) with sync markers + CLI target support
- VSCode template (`.vscode/settings.json` or similar) with sync support
- `sync --dry-run` mode to preview what would change without writing
- `sync` auto-detect: warn when target files are stale (older sync timestamp than project-context.md mtime)

## Growth Log
- 2026-02-13: Stage 1 ✅ — shared project-context.md template installed via CLI (68 tests)
- 2026-02-13: Stage 2 ✅ — CLAUDE.md reference-only, gardener + /seed read project-context.md
- 2026-02-13: Stage 3 ✅ — sync markers in copilot-instructions.md (69 tests)
- 2026-02-13: Stage 4 ✅ — sync subcommand reads project-context.md and injects into target files (77 tests)
- 2026-02-13: Stage 5 ✅ — install output guides users to project-context.md as single source of truth (80 tests)
- 2026-02-13: Feature COMPLETE — all 5 concrete stages done. Shared context architecture is fully functional.
- 2026-02-13: REPLAN — Phase 2 started. Added stages 6-9: validation, README update, product-dna update, sync --watch mode.
- 2026-02-13: Stage 6 ✅ — placeholder validation during sync warns users about unfilled template text (82 tests)
