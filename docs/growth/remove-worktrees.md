# 🌱 Feature: Remove Worktrees Functionality
Created: 2026-02-14
Status: 🌳 Complete

## Seed (what & why)

The worktrees feature (guidance, `/worktree` command, gardener awareness, README section) added complexity for a workflow pattern that hasn't proven essential. Removing it simplifies the tool — fewer commands, less template surface area, cleaner documentation. This reverses all 7 stages from `docs/growth/worktrees.md`.

## Growth Stages

### Concrete (next 3 stages, detailed)

- 🌳 Stage 1: Remove `/worktree` command and its tests
  - Intent: Delete the worktree command template files and remove all test assertions that validate them, updating the template file count
  - Properties:
    - P1: No file named `worktree.md` exists under `templates/.claude/commands/` or `.claude/commands/` [invariant]
      Captures: Command file left behind — users still see `/worktree` even though it's unsupported
    - P2: Template completeness test expects 10 files (was 11) and the file list does not include `worktree.md` [invariant]
      Captures: Test count still expects the deleted file, causing false failures
    - P3: The frontmatter description test does not check a `worktree` command [invariant]
      Captures: Test tries to read a deleted file and crashes
    - P4: No test describe block named "Worktree command content" exists [invariant]
      Captures: Tests reference deleted file, causing failures
    - P5: All existing tests that are NOT worktree-specific still pass unchanged [invariant]
      Captures: Removal accidentally breaks unrelated tests
  - Depends on: none (first stage)
  - Touches: `templates/.claude/commands/worktree.md` (delete), `.claude/commands/worktree.md` (delete), `test/cli.test.mjs`

- 🌳 Stage 2: Remove worktree awareness from gardener and CLAUDE.md templates
  - Intent: Remove worktree mentions from gardener agent (PLAN mode step 3a, GROW mode step 8) and CLAUDE.md context hygiene rule, plus their tests
  - Properties:
    - P6: Gardener PLAN mode has no step 3a and does not mention "worktree" [invariant]
      Captures: Gardener still suggests worktrees to users even though the command is gone
    - P7: Gardener GROW mode step 8 does not mention "worktree" [invariant]
      Captures: Report section still references a removed concept
    - P8: CLAUDE.md context hygiene rule (rule 4) does not mention "worktree" [invariant]
      Captures: CLAUDE.md still promotes a removed workflow
    - P9: Template gardener and project gardener remain identical [invariant]
      Captures: Removing from one copy but not the other causes drift
    - P10: Template CLAUDE.md and project CLAUDE.md remain identical for the context hygiene rule [invariant]
      Captures: Removing from template but not project copy (or vice versa) causes drift
    - P11: No test describe block named "Gardener and CLAUDE.md worktree awareness" exists [invariant]
      Captures: Tests validate removed functionality and fail
    - P1-P5 from Stage 1 still hold
  - Depends on: P1 (command already removed — no point keeping awareness for a nonexistent command)
  - Touches: `templates/.claude/agents/gardener.md`, `.claude/agents/gardener.md`, `templates/CLAUDE.md`, `CLAUDE.md`, `test/cli.test.mjs`

- 🌳 Stage 3: Remove README worktree section, product DNA reference, heading tests, and growth plan
  - Intent: Remove the "Parallel Growth with Worktrees" section from README, the `/worktree` entry from product DNA, update heading-order tests, remove worktree-specific test blocks, and delete the original growth plan
  - Properties:
    - P12: README has no section with a worktree-related heading [invariant]
      Captures: Dead documentation section left in README confuses users
    - P13: README "What You Get" file tree does not list `worktree.md` [invariant]
      Captures: File tree shows a file that no longer exists
    - P14: Product DNA Key Commands does not list `/worktree` [invariant]
      Captures: Gardener agent still sees `/worktree` during planning and suggests it
    - P15: Product DNA says "five commands" (not six) [invariant]
      Captures: Command count is wrong — users expect 6 commands but only 5 exist
    - P16: No test describe block named "README worktree section" exists [invariant]
      Captures: Tests validate a removed section and fail
    - P17: No test describe block named "Product DNA documentation" with a `/worktree` assertion exists [invariant]
      Captures: Test asserts presence of a removed command in DNA
    - P18: README heading-order tests do not include "Parallel Growth with Worktrees" [invariant]
      Captures: Heading-order test expects a deleted heading, causing false failures
    - P19: `docs/growth/worktrees.md` does not exist [invariant]
      Captures: Stale growth plan left behind clutters the growth directory
    - P12-P18 imply: all tests pass after this stage
    - P1-P11 from Stages 1-2 still hold
  - Depends on: P6, P7, P8 (gardener/CLAUDE.md already cleaned — README section references concepts that are gone)
  - Touches: `README.md`, `docs/product-dna.md`, `test/cli.test.mjs`, `docs/growth/worktrees.md` (delete), `docs/growth/remove-worktrees.md` (update status)

### Horizon (rough outline of what comes after)
- 🌿 Nothing — removal is complete after 3 stages

🌿 ─── ─── ─── 🌿

## Growth Log
<!-- Auto-updated after each stage -->
- 2026-02-14: Stage 1 complete. Deleted `templates/.claude/commands/worktree.md` and `.claude/commands/worktree.md`. Updated template completeness test (11→10 files), removed `worktree` from frontmatter commands list, removed "Worktree command content" test block (3 tests). 115 tests pass (was 118).
- 2026-02-14: Stage 2 complete. Removed step 3a (worktree suggestion for parallel features) from gardener PLAN mode and worktree mention from GROW mode step 8, in both template and project copies. Removed worktree line from CLAUDE.md context hygiene rule in both template and project copies. Removed "Gardener and CLAUDE.md worktree awareness" test block (4 tests). 111 tests pass (was 115).
- 2026-02-14: Stage 3 complete. Removed "Parallel Growth with Worktrees" section from README. Removed `worktree.md` from "What You Get" file tree. Removed `/worktree` from product DNA Key Commands and updated "six commands" to "five commands". Removed "README worktree section" (5 tests) and "Product DNA documentation" (1 test) test blocks. Updated both heading-order tests. Deleted `docs/growth/worktrees.md`. 105 tests pass (was 111). Feature complete.
