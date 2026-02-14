# Feature: Property-Based Growth Planning
Created: 2026-02-14
Status: 🌱 Growing

## Seed (what & why)

Shift the review gate from code (300-line diffs after implementation) to properties (8-12 domain rules before implementation). Each growth stage defines "what must be true" as properties — invariants, state transitions, roundtrips, boundaries — which become acceptance criteria and tests. The reviewer answers "are these rules complete?" instead of "is this code correct?". Properties accumulate across stages: if a new stage breaks an old property, that's a REPLAN, not a quiet change.

## Growth Stages

### Concrete (next 3-5 stages, detailed)

- ✅ Stage 1: Property-based stage format in growth plan template
  - Intent: Replace "Verify:" field with "Properties:" and "Depends on:" in the stage template inside gardener PLAN mode
  - Properties:
    - P1: Each stage in the plan template has a Properties section with typed entries (invariant/transition/roundtrip/boundary) [invariant]
      Captures: Stages without explicit properties default to vague "verify it works" checks
    - P2: Each property has a "Captures:" line explaining what bug it prevents [invariant]
      Captures: Mechanical assertions without intent — LLM generates tests that check nothing meaningful
    - P3: Each stage has a "Depends on:" field referencing earlier properties [invariant]
      Captures: Stage 4 silently breaking a rule from stage 1
  - Touches: `templates/.claude/agents/gardener.md` (PLAN mode, stage template)
  - Done: Added Properties/Depends on/Implementation hint to stage template, replacing Verify field.

- ✅ Stage 2: Property taxonomy and self-check in PLAN mode
  - Intent: Add the four property categories (invariants/transitions/roundtrips/boundaries) with prompting questions, plus a self-check checklist before presenting the plan
  - Properties:
    - P1 (from Stage 1): stage template has Properties section [still holds]
    - P4: Gardener PLAN mode includes all four property categories with "Ask yourself" prompts [invariant]
      Captures: LLM naturally generates only happy-path properties without taxonomy forcing completeness
    - P5: Plan self-check verifies completeness, independence, accumulation, and boundary coverage before presenting [transition]
      Captures: Plan presented to user without internal validation — missing properties not caught
  - Depends on: P1, P2, P3
  - Touches: `templates/.claude/agents/gardener.md` (PLAN mode, new sections)
  - Done: Added Property-Based Planning section with taxonomy (INVARIANTS, STATE TRANSITIONS, ROUNDTRIPS, BOUNDARIES) and Plan Self-Check with 4-point verification.

- ✅ Stage 3: Properties-first workflow in GROW mode
  - Intent: Reorder GROW mode to: read properties → write tests encoding properties → write code to pass tests. Add property-aware self-review and reporting.
  - Properties:
    - P6: GROW mode step 4 starts with "read properties" before any code is written [transition]
      Captures: Implementation without acceptance criteria — code written before knowing what "correct" means
    - P7: Tests are written before implementation code in GROW mode [transition]
      Captures: Tests fitted to implementation rather than encoding domain rules
    - P8: Self-review checks if implementation could be WRONG and still pass properties [boundary]
      Captures: Property gaps — plan looks complete but allows incorrect implementations
    - P9: Report includes "Properties verified" and "Property gaps found" [invariant]
      Captures: No visibility into which properties were tested vs which were assumed
  - Depends on: P1, P4, P5
  - Touches: `templates/.claude/agents/gardener.md` (GROW mode)
  - Done: Restructured GROW mode steps 4a-4e (properties → tests → code → quality gate), added property-aware self-review and reporting.

- ✅ Stage 4: Property accumulation in REPLAN mode and Critical Rules
  - Intent: REPLAN mode must verify new stages don't break properties from completed stages. Critical Rules enforce property permanence.
  - Properties:
    - P10: REPLAN mode explicitly checks property accumulation and flags breaking changes [transition]
      Captures: Replan silently invalidates properties from completed stages
    - P11: Critical Rules state properties are PERMANENT — breaking one requires explicit REPLAN [invariant]
      Captures: Quiet property violations hidden in normal stage implementation
  - Depends on: P1, P3
  - Touches: `templates/.claude/agents/gardener.md` (REPLAN mode, Critical Rules)
  - Done: Added property accumulation verification to REPLAN, added PERMANENT property rule and property-first rules to Critical Rules.

- ✅ Stage 5: Review fixes — indentation, deduplication, formatting, sync
  - Intent: Fix all issues identified in review: broken GROW mode indentation, grow.md/gardener.md content duplication, overly strict boundary requirement, YAML frontmatter spacing, trailing newlines, and .claude/ ↔ templates/.claude/ sync.
  - Properties:
    - P12: GROW mode step 4a-4e has consistent indentation (a-e at same level, sub-bullets nested under parent) [invariant]
      Captures: Broken formatting causes LLM to misparse instruction hierarchy
    - P13: grow.md contains no duplicated taxonomy or self-check from gardener.md — only review emphasis questions [invariant]
      Captures: Desynchronization when future edits update one copy but not the other
    - P14: .claude/ files are identical to templates/.claude/ files [invariant]
      Captures: Project's own workflow diverges from what it ships to users
  - Depends on: P1-P11
  - Touches: `templates/.claude/agents/gardener.md`, `templates/.claude/commands/grow.md`, `.claude/agents/gardener.md`, `.claude/commands/grow.md`
  - Done: Fixed all 6 review issues. Softened boundary requirement to "consider" instead of "require". Removed ~60 lines of duplication from grow.md. Restored 2-space YAML. Added trailing newlines. All 54 tests pass.

- ✅ Stage 6: Test property format markers in gardener template
  - Intent: Add test assertions that validate the gardener template contains property-based planning markers (Properties:, Depends on:, Captures:, property categories, self-check)
  - Properties:
    - P15: Test suite validates presence of property-related markers in gardener.md template [invariant]
      Captures: Future edits accidentally removing property-based planning structure
    - P16: Test validates all four property categories are present (invariant, transition, roundtrip, boundary) [invariant]
      Captures: Taxonomy silently losing a category during refactoring
  - Depends on: P1, P4, P12
  - Touches: `test/cli.test.mjs`
  - Done: Added "gardener agent contains property-based planning structure" test in Template content integrity suite. Checks 5 property markers (Properties:, Depends on:, Captures:, Property-Based Planning, Plan Self-Check) and all 4 categories (INVARIANTS, STATE TRANSITIONS, ROUNDTRIPS, BOUNDARIES). All 55 tests pass.

- ⬜ Stage 7: Update template CLAUDE.md Growth Rules to reference properties
  - Intent: The template CLAUDE.md shipped to users still says "one test" in rule 1 — update to mention properties as the planning mechanism, consistent with the gardener agent.
  - Properties:
    - P17: Template CLAUDE.md Growth Rules mention properties as the stage definition mechanism [invariant]
      Captures: User reads CLAUDE.md and sees no mention of properties, then is surprised when gardener generates them
    - P18: Template CLAUDE.md and gardener.md are conceptually consistent — no contradictions [invariant]
      Captures: CLAUDE.md describes old workflow (Verify:) while gardener uses new workflow (Properties:)
  - Depends on: P1, P14
  - Touches: `templates/.claude/CLAUDE.md`, `.claude/CLAUDE.md`
  - Implementation hint: Update Growth Rules section — keep it light, don't duplicate the taxonomy. Reference "properties defined in the growth plan" rather than repeating the full system.

### Horizon (rough outline of what comes after)
- Example growth plan demonstrating property-based planning (docs or README)
- README section explaining the property-based approach for new users
- Consider a `/validate` command that checks accumulated properties still hold

## Growth Log
<!-- Auto-updated after each stage -->
- 2026-02-14: Stages 1-4 implemented in initial session. Property-based stage format, taxonomy with four categories, self-check, properties-first GROW mode, accumulation in REPLAN, critical rules updated.
- 2026-02-14: Stage 5 complete. Review fixes: GROW mode indentation, grow.md deduplication (~60 lines removed), boundary requirement softened, YAML frontmatter restored to 2-space, trailing newlines added, .claude/ synced with templates/.claude/. All 54 tests pass.
- 2026-02-14: Stage 6 complete. Added test validating property-based planning markers and all four property categories in gardener template. All 55 tests pass.
