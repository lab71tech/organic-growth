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

- ⬜ Stage 2: Update CLAUDE.md template to reference shared context
  - Intent: CLAUDE.md becomes reference-only for project context; gardener agent reads project-context.md explicitly
  - Verify: CLAUDE.md template has no fill-in placeholders for product/tech/priorities; has reference to `docs/project-context.md`; gardener.md reads project-context.md in PLAN mode; existing tests updated
  - Touches: `templates/.claude/CLAUDE.md`, `templates/.claude/agents/gardener.md`, `templates/.claude/commands/seed.md`, `test/cli.test.mjs`

- ⬜ Stage 3: Add sync markers to copilot-instructions.md
  - Intent: Copilot config has marker placeholders ready for the sync command to inject shared context
  - Verify: copilot-instructions.md has `<!-- BEGIN PROJECT CONTEXT -->` / `<!-- END PROJECT CONTEXT -->` markers with placeholder text; Copilot-specific methodology sections unchanged
  - Touches: `templates/.github/copilot-instructions.md`, `test/cli.test.mjs`

- ⬜ Stage 4: Implement `sync` subcommand in CLI
  - Intent: `npx organic-growth sync` reads docs/project-context.md and injects its content between markers in target config files
  - Verify: `node bin/cli.mjs sync` replaces content between markers in copilot-instructions.md; handles missing project-context.md gracefully; reports what was synced; `--target` flag filters which files to sync
  - Touches: `bin/cli.mjs`, `test/cli.test.mjs`

- ⬜ Stage 5: Update /seed command and CLI output for shared context architecture
  - Intent: /seed populates project-context.md; CLI next steps guide users to edit the shared file; suggest sync after editing
  - Verify: /seed instructions reference project-context.md as the file to fill in; CLI "next steps" mention project-context.md; suggest running sync for non-Claude tools
  - Touches: `templates/.claude/commands/seed.md`, `templates/.claude/commands/grow.md`, `bin/cli.mjs` (output messages), `test/cli.test.mjs`

### Horizon (rough outline of what comes after)
- opencode template (`templates/.opencode/`) with sync markers + CLI target support
- VSCode template (`.vscode/settings.json` or similar) with sync support
- `sync --watch` mode for auto-syncing on project-context.md changes
- Validation: warn if project-context.md still has placeholder text
- Update README to explain the shared context architecture
- Update product-dna.md to reflect multi-tool architecture

## Growth Log
- 2026-02-13: Stage 1 ✅ — shared project-context.md template installed via CLI (68 tests)
