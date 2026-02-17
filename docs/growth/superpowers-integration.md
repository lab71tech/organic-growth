# 🌱 Feature: Superpowers Plugin Integration
Created: 2026-02-17
Status: 🌱 Growing

## Seed (what & why)

organic-growth commands and the gardener agent currently operate in isolation from superpowers process skills (brainstorming, TDD, systematic-debugging, verification-before-completion, finishing-a-development-branch, requesting-code-review). Integrating them means commands invoke superpowers skills at the right moments and the gardener embeds minimal reminders at precise decision points. The result: users get a complete workflow where methodology (organic-growth) and process discipline (superpowers) reinforce each other without manual coordination.

---

## Growth Stages

### Concrete (next 4 stages, detailed)

- 🌳 Stage 1: Command integration — grow.md and seed.md brainstorming
  - Done: Added brainstorming skill invocation as step 1 in grow.md (before PLAN mode) and as a bullet in seed.md Path B (before interview). Both use explicit "Invoke the brainstorming skill" wording. Mirror invariant maintained. 8 property tests added.
  - Intent: Prove the integration pattern works end-to-end by adding superpowers skill invocations to the two planning commands. grow.md invokes brainstorming before PLAN mode. seed.md invokes brainstorming for Path B only.
  - Properties:
    - P1: grow.md contains a brainstorming skill invocation that appears BEFORE the gardener PLAN mode instruction [invariant]
      Captures: Brainstorming is referenced but placed after planning — the agent plans before exploring the problem space
    - P2: seed.md contains a brainstorming skill invocation inside Path B (no DNA) only — not in Path A [invariant]
      Captures: Brainstorming fires when DNA already exists, wasting time on a solved problem
    - P3: grow.md brainstorming invocation uses the Skill tool explicitly (not a vague reference) [invariant]
      Captures: Command says "consider brainstorming" instead of actually invoking the skill — agent ignores it
    - P4: seed.md brainstorming invocation uses the Skill tool explicitly [invariant]
      Captures: Same as P3 but for seed command
    - P5: templates/.claude/commands/grow.md and .claude/commands/grow.md are identical [invariant]
      Captures: Template and project copies drift — project ships stale commands
    - P6: templates/.claude/commands/seed.md and .claude/commands/seed.md are identical [invariant]
      Captures: Same drift problem for seed command
    - P7: grow.md still contains all existing instruction steps (gardener PLAN mode, property review gate, "Plan ready" prompt) [invariant]
      Captures: Integration replaces existing functionality instead of augmenting it
    - P8: seed.md still contains all existing paths (Path A and Path B) and all interview questions [invariant]
      Captures: Integration disrupts the seed flow
  - Depends on: none (first stage)
  - Touches: `templates/.claude/commands/grow.md`, `.claude/commands/grow.md`, `templates/.claude/commands/seed.md`, `.claude/commands/seed.md`, `test/cli.test.mjs`
  - Implementation hint: Add a step 0 to grow.md that invokes brainstorming skill. In seed.md, add a brainstorming step inside Path B's bullet list, before the interview. Use wording like "Use the brainstorming skill to..." which Claude Code interprets as a Skill tool invocation.

- 🌱 Stage 2: Command integration — next.md and review.md
  - Intent: Complete command-level integration. next.md gets a debugging fallback note. review.md references code review skills for structured output.
  - Properties:
    - P9: next.md contains a reference to systematic-debugging skill as a fallback when stuck [invariant]
      Captures: User hits a wall during /next and has no guidance on what to do
    - P10: review.md contains a reference to requesting-code-review skill [invariant]
      Captures: Review command produces unstructured findings instead of leveraging the skill's format
    - P11: review.md contains a reference to receiving-code-review skill for handling feedback [invariant]
      Captures: Review identifies issues but gives no guidance on processing them
    - P12: next.md debugging reference appears in a context where the user would see it when stuck (near the "no plan" or "all done" guidance, or as a general tip) [invariant]
      Captures: Debugging reference is buried in a place the agent only reads at start, not when encountering failure
    - P13: templates/.claude/commands/next.md and .claude/commands/next.md are identical [invariant]
      Captures: Template/project drift for next command
    - P14: templates/.claude/commands/review.md and .claude/commands/review.md are identical [invariant]
      Captures: Template/project drift for review command
    - P15: next.md still contains all existing steps (find plan, use gardener, no-plan fallback, all-done case) [invariant]
      Captures: Integration replaces existing functionality
    - P16: review.md still contains all existing review dimensions (correctness, consistency, simplicity, security, test quality) and the report format [invariant]
      Captures: Code review skill reference replaces the structured review criteria
    - P17: replan.md is unchanged — no superpowers equivalent exists for replanning [invariant]
      Captures: Unnecessary modification to a command that has no corresponding skill
  - Depends on: P5, P6 (mirror invariant established in stage 1)
  - Touches: `templates/.claude/commands/next.md`, `.claude/commands/next.md`, `templates/.claude/commands/review.md`, `.claude/commands/review.md`, `test/cli.test.mjs`
  - Implementation hint: In next.md, add a tip after the existing steps. In review.md, add skill references in step 4 (output) and step 5 (fix). Keep additions brief — one line each.

- 🌱 Stage 3: Gardener agent — superpowers integration section
  - Intent: Add precisely placed one-sentence reminders at the four GROW mode decision points: writing tests (TDD), quality gate (verification), test failure (debugging), and feature complete (finishing branch).
  - Properties:
    - P18: Gardener contains a TDD reminder within or immediately adjacent to GROW step 4b (write tests) [invariant]
      Captures: TDD principle is mentioned in a general section but not at the moment the agent decides how to write tests
    - P19: Gardener contains a verification reminder within or immediately adjacent to GROW step 4d (quality gate) [invariant]
      Captures: Verification checklist is in a separate section — agent skips it when running the quality gate
    - P20: Gardener contains a debugging reminder within or immediately adjacent to GROW step 4e (fix failures) [invariant]
      Captures: Agent encounters test failure and guesses at fixes instead of following systematic debugging
    - P21: Gardener contains a finishing-branch reference within or immediately adjacent to GROW step 6 or step 8 (feature complete / all stages done) [invariant]
      Captures: Feature completes but no guidance on branch cleanup, PR preparation
    - P22: Each superpowers reminder is one sentence or less — no multi-paragraph additions [boundary]
      Captures: Integration bloats the gardener prompt, diluting core instructions
    - P23: Gardener still contains all three modes (PLAN, GROW, REPLAN) with all existing steps intact [invariant]
      Captures: Integration accidentally removes or renumbers existing gardener instructions
    - P24: Gardener still contains all property-based planning content (INVARIANTS, STATE TRANSITIONS, ROUNDTRIPS, BOUNDARIES) [invariant]
      Captures: Integration disrupts the property-based planning section
    - P25: templates/.claude/agents/gardener.md and .claude/agents/gardener.md are identical [invariant]
      Captures: Template/project gardener drift
  - Depends on: P7, P8, P15, P16 (existing content preservation from stages 1-2)
  - Touches: `templates/.claude/agents/gardener.md`, `.claude/agents/gardener.md`, `test/cli.test.mjs`
  - Implementation hint: Add inline comments at each decision point rather than a separate section. Example at step 4b: "Follow red/green/refactor — write a failing test first, then the minimum code to pass it." Keep each under one sentence.

- 🌱 Stage 4: CLAUDE.md template + CLI summary + product DNA
  - Intent: Complete the integration by noting superpowers in the template CLAUDE.md's Development Philosophy, updating the CLI install summary, and updating product DNA.
  - Properties:
    - P26: templates/CLAUDE.md Development Philosophy section mentions superpowers as a companion for process skills [invariant]
      Captures: CLAUDE.md doesn't mention superpowers — users reading it don't know about the integration
    - P27: templates/CLAUDE.md superpowers mention is one sentence within an existing section — not a new top-level section [boundary]
      Captures: CLAUDE.md gets a large new section that changes its structure
    - P28: templates/CLAUDE.md still contains all existing sections (Product, Tech Stack, Priorities, Growth Rules 1-6, Growth Stage Patterns, Commit Convention) [invariant]
      Captures: Integration modifies CLAUDE.md structure
    - P29: CLI install summary mentions superpowers integration status (not just plugin detection) [invariant]
      Captures: CLI detects the plugin but doesn't tell users what it enables
    - P30: docs/product-dna.md reflects the superpowers integration as a capability [invariant]
      Captures: Product DNA is stale — gardener plans future features unaware of superpowers integration
    - P31: CLAUDE.md key section markers still pass existing tests (THE SEED, THE SOIL, LIGHT & WATER, Organic Growth, Growth Rules) [invariant]
      Captures: CLAUDE.md edits break the existing template content integrity tests
  - Depends on: P5, P6, P13, P14, P25 (all mirror invariants), P7, P8, P15, P16, P23, P24 (all preservation invariants)
  - Touches: `templates/CLAUDE.md`, `bin/cli.mjs`, `docs/product-dna.md`, `test/cli.test.mjs`
  - Implementation hint: Add one line to Growth Rules or a new bullet under rule 5 (Quality gate). CLI: update the superpowers detection message to mention what integration it enables. DNA: add a bullet about superpowers integration.

### Horizon (rough outline of what comes after)
- 🌿 Deeper gardener integration: gardener PLAN mode could invoke brainstorming skill via a command-level wrapper (if subagent Skill tool access is added in the future)
- 🌿 Superpowers skill version pinning: detect and warn when superpowers skills have changed in ways that affect organic-growth integration points
- 🌿 Project-type-aware suggestions: CLI recommends specific superpowers skills based on detected tech stack (e.g., "frontend project detected — consider Playwright skill")

🌿 ─── ─── ─── 🌿

## Growth Log
<!-- Auto-updated after each stage -->
- 2026-02-17: Stage 1 complete. grow.md and seed.md now invoke brainstorming skill at the right moments. 8 property tests (P1-P8) all passing. Total: 107 tests.
