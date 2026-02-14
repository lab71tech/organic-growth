# Feature: README Section Explaining Property-Based Approach
Created: 2026-02-14
Status: 🌳 Complete

## Seed (what & why)

New users reading the README encounter "property-based planning" in passing (Philosophy bullets, example growth plan link) but have no explanation of what it means, why it matters, or how it differs from typical test-driven or task-driven planning. The README needs a dedicated section that gives users a mental model for properties before they install and encounter the gardener's output. This section should answer: "What are properties, why are they the primary review gate, and what does a property look like?" — without duplicating the full taxonomy that lives in the gardener agent.

## Growth Stages

### Concrete (next 3-5 stages, detailed)

- ✅ Stage 1: Core "Property-Based Planning" section in README
  - Intent: Add a new section to the README between "Philosophy" and "After Install" that explains what properties are, why they matter for LLM-assisted development, and shows one concrete before/after example
  - Properties:
    - P1: README contains a section with heading "Property-Based Planning" or "Properties" positioned after "Philosophy" and before "After Install" [invariant]
      Captures: Section placed at the end of README where users won't find it, or buried inside another section
    - P2: The section explains WHAT a property is (a rule that must be true about the system, not a test scenario or implementation step) [invariant]
      Captures: Users confuse properties with unit test cases or acceptance criteria — they write "when I click X, Y happens" instead of domain rules
    - P3: The section explains WHY properties matter specifically for LLM-assisted development (review properties before implementation, not 300-line diffs after) [invariant]
      Captures: Users see properties as bureaucratic overhead rather than understanding the core value — shifting review from code to rules
    - P4: The section includes at least one concrete example showing a bad property (scenario-style) vs. a good property (rule-style) [invariant]
      Captures: Users understand the concept abstractly but can't apply it — they need to see the difference to internalize it
    - P5: The section does NOT duplicate the full four-category taxonomy from the gardener agent [boundary]
      Captures: README becomes a second source of truth that drifts from the gardener template — maintenance burden and desynchronization (same issue P13 from property-based-planning.md captured)
    - P6: The section mentions that properties accumulate across stages — later stages cannot break earlier properties [invariant]
      Captures: Users treat each stage's properties as independent, missing the key insight that properties are permanent commitments
    - P7: All existing README content remains intact and functional (links work, structure coherent) [invariant]
      Captures: New section insertion breaks existing heading anchors or disrupts reading flow
  - Depends on: none (first stage)
  - Touches: `README.md`
  - Done: Added ~17 lines of markdown with bad/good property example, LLM-specific rationale, accumulation explanation, and link to example growth plan. Defers full taxonomy to gardener agent. All 61 tests pass.

- ✅ Stage 2: Test that README property section exists and contains key concepts
  - Intent: Add test assertions validating that the README contains the property-based planning section with its essential elements, preventing future edits from accidentally removing it
  - Properties:
    - P8: Test validates README contains a property-related heading [invariant]
      Captures: Section accidentally deleted during future README edits
    - P9: Test validates README contains at least one good/bad property example pair [invariant]
      Captures: Example removed leaving only abstract explanation — the most useful part for new users disappears
    - P10: Test validates README mentions property accumulation concept [invariant]
      Captures: The accumulation explanation — the hardest concept for new users — dropped during editing
    - P1 (from Stage 1): Section positioned correctly [still holds]
    - P7 (from Stage 1): Existing content intact [still holds]
  - Depends on: P1, P4, P6, P7
  - Touches: `test/cli.test.mjs`
  - Done: Added 3 tests in "README property-based planning section" describe block. Tests use regex/key phrases, not exact wording. Validates heading position, good/bad example pair, and accumulation concept. All 64 tests pass.

- ✅ Stage 3: Connect Philosophy bullets to the new section
  - Intent: Update the existing Philosophy section to reference the new property-based planning section, creating a coherent reading path from overview to detail
  - Properties:
    - P11: The Philosophy bullet about quality mentions or links to the property-based planning section [transition]
      Captures: Two disconnected sections — user reads Philosophy, skips ahead, never sees the property explanation
    - P12: The "After Install" section's example growth plan link is contextualized by the property section above it — a reader encounters concept before example [invariant]
      Captures: User clicks example growth plan link without understanding properties, sees P1/P2/Captures syntax and is confused
    - P1 (from Stage 1): Property section heading and position [still holds]
    - P5 (from Stage 1): No taxonomy duplication [still holds]
    - P7 (from Stage 1): Existing content intact [still holds]
  - Depends on: P1, P5, P7, P8
  - Touches: `README.md`
  - Done: Added anchor link from Philosophy "Two-layer quality" bullet to #property-based-planning. Updated After Install example link text to reference "properties, stages, and accumulation" — terms the reader just learned above. All 64 tests pass.

### Horizon (rough outline of what comes after)
- Consider whether the README property section should show a mini growth plan snippet (2-3 lines) inline, or if linking to the example is sufficient
- Evaluate if a "Concepts" or "Glossary" section is needed as the README grows

## Growth Log
<!-- Auto-updated after each stage -->
- 2026-02-14: Stage 1 complete. Added "Property-Based Planning" section to README between Philosophy and After Install. Explains what/why/example, mentions accumulation, defers taxonomy to gardener. All 61 tests pass.
- 2026-02-14: Stage 2 complete. Added 3 tests validating heading position, example pair, and accumulation concept. Key-phrase matching allows prose to evolve. All 64 tests pass.
- 2026-02-14: Stage 3 complete. Philosophy bullet links to property section. After Install example link contextualized with property terminology. Feature complete. All 64 tests pass.
