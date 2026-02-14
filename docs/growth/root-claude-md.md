# Feature: Move CLAUDE.md to Project Root
Created: 2026-02-14
Status: 🌱 Growing

## Seed (what & why)

CLAUDE.md currently lives at `.claude/CLAUDE.md` both in the template directory and when installed to user projects. This is less discoverable than placing it at the project root, which is the standard Claude Code convention. Root-level CLAUDE.md is immediately visible in the project directory listing and in GitHub, making it easier for contributors to find the project context and development philosophy. The `.claude/` directory retains agents and commands — only CLAUDE.md moves out.

This is a structural/refactoring feature. The template content stays the same; only its location changes. The CLI's recursive copy-from-templates design means the template file path directly determines the installed path, so moving `templates/.claude/CLAUDE.md` to `templates/CLAUDE.md` is the core change.

## Growth Stages

### Concrete (next 3-5 stages, detailed)

- Stage 1: Move template file and update CLI + tests
  - Intent: Move the template CLAUDE.md from `templates/.claude/CLAUDE.md` to `templates/CLAUDE.md`, update the CLI post-install message, and update all tests to expect the new path. After this stage, `npx organic-growth` installs CLAUDE.md at the project root.
  - Properties:
    - P1: Running the CLI installs CLAUDE.md at the project root (`<target>/CLAUDE.md`), not at `<target>/.claude/CLAUDE.md` [transition]
      Captures: Template file moved but CLI still installs to old path, or test passes at old location
    - P2: The `.claude/` directory is still created and contains `agents/` and `commands/` subdirectories with all 7 files [invariant]
      Captures: Moving CLAUDE.md accidentally breaks the rest of `.claude/` structure
    - P3: Template completeness test expects exactly 8 template files — 1 at root (`CLAUDE.md`) and 7 under `.claude/` [invariant]
      Captures: File count changes unexpectedly, or the list becomes stale
    - P4: CLAUDE.md content integrity tests (key section markers, Growth Rules properties reference, no contradictions) read from the new root path and still pass [invariant]
      Captures: Tests still read from old path and pass vacuously or fail with "file not found"
    - P5: The npm tarball includes `templates/CLAUDE.md` (not `templates/.claude/CLAUDE.md`) [transition]
      Captures: File moved in the repo but excluded from the published package
    - P6: CLI post-install output says `Edit CLAUDE.md` (not `.claude/CLAUDE.md`) [transition]
      Captures: User follows the printed instructions and edits a file that doesn't exist
    - P7: Worktree awareness test for CLAUDE.md context hygiene reads from root path [invariant]
      Captures: Test reads from old `.claude/CLAUDE.md` location and silently breaks
  - Depends on: none (first stage)
  - Touches: `templates/.claude/CLAUDE.md` (delete), `templates/CLAUDE.md` (create), `bin/cli.mjs`, `test/cli.test.mjs`

- Stage 2: Update README and user-facing documentation
  - Intent: Update the README "What You Get" tree, "After Install" instructions, install description, and product DNA to reflect the new CLAUDE.md location.
  - Properties:
    - P8: README "What You Get" shows `CLAUDE.md` at the project root level, separate from the `.claude/` directory tree [invariant]
      Captures: Tree still shows CLAUDE.md nested under `.claude/` — user looks in the wrong place
    - P9: README "After Install" step 1 says `Edit CLAUDE.md` (not `.claude/CLAUDE.md`) [invariant]
      Captures: Documentation tells user to edit a file at a path that no longer exists
    - P10: README install description accurately describes what gets installed (CLAUDE.md at root + .claude/ directory with agents and commands) [invariant]
      Captures: Description says "copies the .claude/ configuration" implying everything is under .claude/
    - P11: Product DNA tech stack description accurately reflects the template structure [invariant]
      Captures: DNA says "Templates in templates/.claude/" when CLAUDE.md is now at `templates/` root
    - P1-P7 from Stage 1 still hold
  - Depends on: P1 (file is actually at root before documenting it)
  - Touches: `README.md`, `docs/product-dna.md`

- Stage 3: Move project's own CLAUDE.md to root
  - Intent: Move the project's own `.claude/CLAUDE.md` to root `CLAUDE.md` for consistency with what the package ships. Update tech stack description.
  - Properties:
    - P12: Project's own CLAUDE.md exists at the repository root (`CLAUDE.md`), not at `.claude/CLAUDE.md` [transition]
      Captures: Package ships root CLAUDE.md but the project itself still uses the old layout
    - P13: Project root CLAUDE.md tech stack section accurately describes template structure [invariant]
      Captures: Tech stack says "Templates in templates/.claude/" when CLAUDE.md is now one level up
    - P14: Project root CLAUDE.md philosophy section (Growth Rules, Growth Stage Patterns, Commit Convention) matches the template [invariant]
      Captures: Project CLAUDE.md diverges from template on shared sections
    - P1-P11 from Stages 1-2 still hold
  - Depends on: P1 (template at root), P8 (README updated)
  - Touches: `.claude/CLAUDE.md` (delete), `CLAUDE.md` (create at root)

### Horizon (rough outline of what comes after)
- Migration guidance for existing users: detect `.claude/CLAUDE.md` from previous install and suggest moving it
- Update CONTRIBUTING.md if it exists and references CLAUDE.md path

## Growth Log
<!-- Auto-updated after each stage -->
