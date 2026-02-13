# Feature: GitHub Copilot Support
Created: 2026-02-13
Status: 🌱 Growing

## Seed (what & why)
Add GitHub Copilot as a supported AI coding assistant alongside Claude Code. Currently the package only installs `.claude/` configuration. Copilot users should be able to get the organic growth methodology via `.github/copilot-instructions.md`. A `--target` CLI flag lets users choose which AI tool configs to install (`claude`, `copilot`, or `all`).

## Growth Stages

### Concrete (next 3-5 stages, detailed)

- ✅ Stage 1: Copilot instructions template
  - Intent: Create a standalone `.github/copilot-instructions.md` template with the organic growth methodology adapted for Copilot's interaction model
  - Verify: Template exists in `templates/.github/copilot-instructions.md`, CLI copies it (already recursive), test proves it gets installed and has key sections
  - Touches: `templates/.github/copilot-instructions.md` (new), `test/cli.test.mjs`
  - Done: Template created with product context placeholders, adapted methodology (no agents/commands, chat-oriented guidance), growth plan references. 2 new tests (55 total).

- ⬜ Stage 2: --target flag for CLI
  - Intent: Add `--target <claude|copilot|all>` flag to CLI. Default is `all`. Filters which template subdirectories get installed. Only `.claude/` for claude, only `.github/` for copilot, both for all.
  - Verify: `npx organic-growth --target claude` installs only `.claude/` files. `--target copilot` installs only `.github/` files. `--target all` (or no flag) installs both. Tests cover all three modes.
  - Touches: `bin/cli.mjs`, `test/cli.test.mjs`

- ⬜ Stage 3: Adapt CLI messaging for multi-tool support
  - Intent: Update banner, help text, and "next steps" output to reflect multi-tool support. Show tool-appropriate next steps based on what was installed.
  - Verify: Help text shows --target option. Banner says "AI coding assistant setup" instead of "Claude Code setup". Next steps adapt based on target. Tests verify help output.
  - Touches: `bin/cli.mjs`, `test/cli.test.mjs`

- ⬜ Stage 4: Copilot template content integrity tests
  - Intent: Add detailed content verification tests for the Copilot instructions template, mirroring the existing CLAUDE.md integrity tests
  - Verify: Tests check for key sections (product context, tech stack, organic growth methodology, Copilot-specific guidance). All tests pass.
  - Touches: `test/cli.test.mjs`

- ⬜ Stage 5: Update README and documentation
  - Intent: Document Copilot support in README, update product-dna.md, mention --target flag
  - Verify: README mentions Copilot, shows usage examples with --target flag. Product DNA reflects multi-tool support.
  - Touches: `README.md`, `docs/product-dna.md`

### Horizon (rough outline of what comes after)
- Support for Cursor (.cursorrules), Windsurf, and other AI assistants
- Shared project context mechanism (single source of truth for product/tech/priorities)
- /seed command generates Copilot instructions from interview alongside CLAUDE.md
- --target flag supports additional targets as new AI tools are added

## Growth Log
- 2026-02-13: Stage 1 ✅ — Created `templates/.github/copilot-instructions.md` with standalone project context + adapted organic growth methodology. CLI auto-installs it (recursive copy). Added template completeness test (7→8 files) and content integrity test. 55 tests pass.
