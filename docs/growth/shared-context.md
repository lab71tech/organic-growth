# Feature: Shared Project Context
Created: 2026-02-13
Status: 🌱 Growing

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

- ⬜ Stage 5: Update CLI install output for shared context architecture
  - Intent: CLI "next steps" guide users to edit project-context.md as the single file; suggest sync for non-Claude tools
  - Verify: CLI output mentions project-context.md as the file to edit; suggests running sync when copilot is installed; help text documents sync subcommand
  - Touches: `bin/cli.mjs` (output messages + help), `test/cli.test.mjs`
  - Note: /seed was already updated in stage 2; /grow delegates to gardener which already reads project-context.md

### Horizon (rough outline of what comes after)
- opencode template (`templates/.opencode/`) with sync markers + CLI target support
- VSCode template (`.vscode/settings.json` or similar) with sync support
- `sync --watch` mode for auto-syncing on project-context.md changes
- Validation: warn if project-context.md still has placeholder text
- Update README to explain the shared context architecture
- Update product-dna.md to reflect multi-tool architecture

## Growth Log
- 2026-02-13: Stage 1 ✅ — shared project-context.md template installed via CLI (68 tests)
- 2026-02-13: Stage 2 ✅ — CLAUDE.md reference-only, gardener + /seed read project-context.md
- 2026-02-13: Stage 3 ✅ — sync markers in copilot-instructions.md (69 tests)
- 2026-02-13: Stage 4 ✅ — sync subcommand reads project-context.md and injects into target files (77 tests)
