# Feature: Git Worktree Guidance for Parallel Feature Growth
Created: 2026-02-14
Status: 🌱 Growing

## Seed (what & why)

The organic growth workflow currently assumes one feature at a time: one branch, sequential stages, temporal context hygiene via `/clear`. But real development requires parallel work — growing Feature A while pausing to fix a bug, or `/review`-ing a completed feature while starting a new one. Git worktrees are the natural solution: each worktree gives a feature its own working directory without branch-switching overhead, and the growth plan in `docs/growth/` travels with the branch. This is spatial context hygiene — separate directories for separate concerns — complementing the existing temporal approach.

This is a documentation/guidance feature, not a code feature. The value is telling users and the gardener agent how to leverage worktrees within the methodology.

## Growth Stages

### Concrete (next 3-5 stages, detailed)

- ✅ Stage 1: Worktree guidance section in README
  - Intent: Add a section to the README that explains how git worktrees complement the organic growth workflow, with concrete commands showing the setup-to-teardown lifecycle
  - Properties:
    - P1: README contains a section with a worktree-related heading, positioned after the Workflow section and before Releases [invariant]
      Captures: Guidance buried at the bottom where users miss it, or placed before the user understands the core workflow
    - P2: The section explains the WHY for organic growth specifically — parallel feature growth, review isolation, spatial context hygiene — not just generic git worktree documentation [invariant]
      Captures: Generic "how to use git worktree" docs that don't connect to the methodology; users can find those anywhere
    - P3: The section includes concrete shell commands for creating a worktree for a feature, working in it, and cleaning it up [invariant]
      Captures: Conceptual explanation without actionable commands — user understands the idea but doesn't know the steps
    - P4: The section recommends a naming convention that ties worktrees to growth plans (branch name matches `docs/growth/<feature>.md`) [invariant]
      Captures: Disconnected naming — user creates worktree "wt-1" and can't tell which feature it grows, breaking traceability
    - P5: All existing README content remains intact and functional (links, heading anchors, structure) [invariant]
      Captures: New section insertion breaks existing heading anchors or disrupts reading flow
  - Depends on: none (first stage)
  - Touches: `README.md`

- ✅ Stage 2: Tests for README worktree section
  - Intent: Add test assertions validating that the README contains the worktree guidance section with its essential elements, preventing future edits from accidentally removing it
  - Properties:
    - P6: Test validates README contains a worktree-related heading [invariant]
      Captures: Section accidentally deleted during future README edits
    - P7: Test validates the section contains at least one `git worktree` command example [invariant]
      Captures: Commands removed, leaving only conceptual text — the most actionable part disappears
    - P8: Test validates the section connects worktrees to organic growth concepts (growth plan, feature, or parallel) [invariant]
      Captures: Section reduced to generic git documentation that doesn't reference the methodology
    - P9: Test validates the section mentions a naming convention linking branch names to growth plan files [invariant]
      Captures: Naming convention guidance (P4) removed during editing — the key detail that ties worktrees to the methodology's traceability disappears
    - P1-P5 from Stage 1 still hold
  - Depends on: P1, P3, P5
  - Touches: `test/cli.test.mjs`

- ✅ Stage 3: Gardener agent and CLAUDE.md worktree awareness
  - Intent: Update the gardener agent template to mention worktrees at context hygiene boundaries, and update the CLAUDE.md template's context hygiene rule to mention worktrees as spatial complement to temporal `/clear`
  - Properties:
    - P10: Gardener template mentions worktrees in the context of stage reporting or context hygiene (every 3 stages) [invariant]
      Captures: User hits the 3-stage boundary, clears context, but doesn't know they could start a parallel feature in a worktree
    - P11: Gardener PLAN mode includes guidance about checking whether a growth plan already exists for another feature, and suggests a worktree if so [transition]
      Captures: User runs /grow for Feature B while Feature A is in progress — no warning, two plans competing for the same working directory
    - P12: Worktrees are presented as an option, not a requirement — no "must" or "always" adjacent to "worktree" [boundary]
      Captures: Worktrees become mandatory, breaking the experience for simple single-feature development
    - P13: Template CLAUDE.md context hygiene rule mentions worktrees for parallel feature development [invariant]
      Captures: User reads CLAUDE.md hygiene guidance but only learns about /clear — never discovers worktrees for parallel work
    - P14: Context hygiene worktree mention is concise — no more than 2 additional lines [boundary]
      Captures: CLAUDE.md balloons with detailed worktree instructions; the README is the right place for detail
    - P15: Template gardener.md and project .claude/agents/gardener.md remain synchronized [invariant]
      Captures: Project's own workflow diverges from what it ships to users
    - P16: Template CLAUDE.md and project .claude/CLAUDE.md remain synchronized for the context hygiene rule [invariant]
      Captures: Project's own CLAUDE.md diverges from the template
  - Depends on: P1, P2 (worktree concepts established in README)
  - Touches: `templates/.claude/agents/gardener.md`, `.claude/agents/gardener.md`, `templates/.claude/CLAUDE.md`, `.claude/CLAUDE.md`

- ✅ Stage 4: Tests for gardener and CLAUDE.md worktree awareness
  - Intent: Add test assertions validating that the gardener template and CLAUDE.md template contain worktree-related guidance
  - Properties:
    - P17: Test validates gardener template mentions worktrees in context of context hygiene or stage reporting [invariant]
      Captures: Worktree guidance removed from gardener during future refactoring
    - P18: Test validates gardener PLAN mode mentions worktrees in context of existing growth plans or starting a new feature [invariant]
      Captures: PLAN mode worktree awareness (P11) removed — user gets no warning when starting a second feature in the same directory
    - P19: Test validates gardener template does not require worktrees — guidance is optional [boundary]
      Captures: Future edits escalate optional guidance to mandatory requirement, breaking P12
    - P20: Test validates CLAUDE.md template mentions worktrees in context hygiene section [invariant]
      Captures: Worktree mention removed from CLAUDE.md during future edits
    - P10-P16 from Stage 3 still hold
  - Depends on: P10, P11, P12, P13, P15, P16
  - Touches: `test/cli.test.mjs`

- ✅ Stage 5: `/worktree` command template + test adjustments
  - Intent: Add a convenience command that automates worktree creation with the right naming convention, and update existing tests to account for the new template file
  - Properties:
    - P21: Template file exists at `templates/.claude/commands/worktree.md` with YAML frontmatter containing a description [invariant]
      Captures: Command template missing or malformed — `/worktree` silently fails or isn't discoverable
    - P22: Command uses `$ARGUMENTS` for feature name input [invariant]
      Captures: Command ignores user input — `/worktree auth` doesn't know the feature is "auth"
    - P23: Command instructs creation of a git worktree with naming convention matching `docs/growth/<feature>.md` [invariant]
      Captures: Worktree created with arbitrary name, breaking traceability between branch, directory, and growth plan (P4)
    - P24: Command suggests running `/grow` in the new worktree as the next step [transition]
      Captures: User creates worktree but doesn't know what to do next — worktree sits empty
    - P25: Command handles missing `$ARGUMENTS` — asks or tells the user to provide a feature name [boundary]
      Captures: `/worktree` with no argument creates worktree with empty or broken name
    - P26: CLI installs 8 template files (was 7) — `worktree.md` included in template completeness test [invariant]
      Captures: Template file exists but isn't installed, or test count becomes wrong
    - P1-P20 from Stages 1-4 still hold
  - Depends on: P4 (naming convention), P10 (gardener already mentions worktrees)
  - Touches: `templates/.claude/commands/worktree.md`, `test/cli.test.mjs`

- Stage 6: Tests for `/worktree` command content
  - Intent: Add test assertions validating the worktree command template contains essential guidance
  - Properties:
    - P27: Test validates worktree command mentions `git worktree` [invariant]
      Captures: Command rewritten to generic "create a branch" without worktree instruction
    - P28: Test validates command mentions `/grow` as the next step [invariant]
      Captures: Next-step guidance removed — user creates worktree but doesn't know the workflow continues with /grow
    - P29: Test validates command references `$ARGUMENTS` [invariant]
      Captures: Feature name parameter removed — command becomes non-interactive
    - P21-P26 from Stage 5 still hold
  - Depends on: P21, P22, P23, P24
  - Touches: `test/cli.test.mjs`

- Stage 7: Documentation — update README and product DNA
  - Intent: Document the `/worktree` command in user-facing documentation so users discover it
  - Properties:
    - P30: README worktree section mentions `/worktree` as a command [invariant]
      Captures: Command exists but users never discover it — they keep typing `git worktree add` manually
    - P31: Product DNA key commands list includes `/worktree` [invariant]
      Captures: Gardener agent plans features without knowing `/worktree` exists — never suggests it
    - P1-P5 from Stage 1 still hold (README structure intact)
  - Depends on: P21 (command exists), P1 (README worktree section exists)
  - Touches: `README.md`, `docs/product-dna.md`

### Horizon (rough outline of what comes after)
- Guidance in the gardener on handling growth plan merges when two worktree features complete in sequence
- Example in `docs/example-growth-plan.md` showing a multi-worktree development session

## Growth Log
<!-- Auto-updated after each stage -->
- 2026-02-14: Stage 1 complete. Added "Parallel Growth with Worktrees" section to README between After Install and Releases. Explains spatial context hygiene, parallel feature growth, and review isolation. Includes create/work/cleanup commands and branch-to-growth-plan naming convention. All 65 tests pass.
- 2026-02-14: Stage 2 complete. Added 4 tests in "README worktree section" describe block. Tests validate heading position, git worktree command presence, connection to organic growth concepts, and naming convention linking branches to growth plans. Key-phrase matching allows prose to evolve. All 69 tests pass.
- 2026-02-14: Stage 3 complete. Added worktree awareness to gardener template (PLAN mode step 3a checks for in-progress plans; GROW mode step 8 mentions worktrees at context hygiene boundary) and CLAUDE.md template (1 line in context hygiene rule). Both template/project pairs synchronized. Worktrees always presented as optional. All 69 tests pass.
- 2026-02-14: Stage 4 complete. Added 4 tests in "Gardener and CLAUDE.md worktree awareness" describe block. P17: GROW mode mentions worktrees with parallel/reporting context. P18: PLAN mode mentions worktrees with in-progress plan context. P19: no mandatory language ("must"/"always") on worktree lines. P20: CLAUDE.md context hygiene section includes worktree mention. All 73 tests pass.
- 2026-02-14: REPLAN — Reopened feature to add `/worktree` convenience command (from Horizon). Three new stages: Stage 5 (command template + test adjustments), Stage 6 (command content tests), Stage 7 (README + product DNA docs). Note: adds a 6th command, expanding beyond the original "five commands" constraint in product DNA — DNA will be updated in Stage 7.
- 2026-02-14: Stage 5 complete. Created `templates/.claude/commands/worktree.md` with YAML frontmatter description, `$ARGUMENTS` for feature name input, `git worktree add` with `feature/<name>` branch naming convention matching `docs/growth/<name>.md`, `/grow` as next step, and missing-argument handling. Updated template completeness test from 7 to 8 files and added `worktree` to frontmatter description test. All 73 tests pass.
