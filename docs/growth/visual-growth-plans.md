# Feature: Visual Growth Plans
Created: 2026-02-14
Status: 🌳 Complete

## Seed (what & why)

Growth plan files and stage reports are functional but visually flat. Every file is plain markdown with generic markers (`⬜`, `✅`, `🌱`, `🌳`). Two improvements: (1) the gardener's GROW mode report (step 8) should show a clear stage-by-stage progress map — not just the single-line `"Stage 4/~12 — 🌱🌱🌱🌱⬜⬜⬜⬜..."` but a structured list showing each stage's title and its completion status, so the user immediately sees where they are. (2) Growth plan files should carry plant/growth-themed visual decorations — section dividers, header ornaments, and stage markers that reinforce the organic metaphor. Together these make the methodology more legible and more alive.

## Growth Stages

### Concrete (next 3-5 stages, detailed)

- ✅ Stage 1: Enhanced progress map in GROW mode report (replaced single-line progress with multi-line stage map using three-state markers)
  - Intent: Replace the single-line progress indicator in GROW mode step 8 with a multi-line stage map that lists every stage with its status marker and title, making the current position obvious at a glance
  - Properties:
    - P1: GROW mode step 8 report instructions include a multi-line stage progress section that lists each stage with its status and title [invariant]
      Captures: Agent only outputs "Stage 4/~12 — 🌱🌱🌱🌱⬜⬜⬜⬜..." which gives count but no stage names — user cannot tell what was done or what's next without opening the plan file
    - P2: The stage progress section distinguishes at least three states: completed, current (active), and upcoming [invariant]
      Captures: Only two states (done/not-done) — user cannot distinguish "what I just finished" from "what I'm about to do"
    - P3: The existing single-line progress format is replaced, not duplicated — there is exactly one progress display specification in step 8 [invariant]
      Captures: Two progress displays in the same report step — agent outputs both, cluttering the report
    - P4: The progress section is positioned after "What's next" in the report, keeping the most actionable information first [invariant]
      Captures: Large progress map pushes "What's next" below the fold — user must scroll past decoration to find the important part
  - Depends on: none (first stage)
  - Touches: `templates/.claude/agents/gardener.md` (GROW mode step 8), `.claude/agents/gardener.md`
  - Implementation hint: Replace the `Progress: "Stage 4/~12 — ..."` line in step 8 with a multi-line progress map format. Use plant markers for states: 🌱 for completed, 🌿 for current/active, ⬜ for upcoming. The format should look like a stage list the agent renders from the plan file.

- ✅ Stage 2: Plant-themed decorations in growth plan file format (added 🌱 header ornament, 🌱/🌳 stage markers, 🌿 Horizon markers, vine divider)
  - Intent: Add plant/growth-themed visual markers to the growth plan markdown template in PLAN mode — header ornaments, section dividers, and stage status markers that reinforce the organic metaphor
  - Properties:
    - P5: The growth plan template in PLAN mode contains at least one plant-themed section divider or ornament character beyond the existing status markers [invariant]
      Captures: Plan files remain visually indistinguishable from any other markdown — the organic metaphor exists only in naming, not in presentation
    - P6: Stage completion markers in the plan template use plant-themed symbols — completed stages use a grown/mature marker, pending stages use a seed/sprout marker [invariant]
      Captures: Generic checkbox markers (⬜/✅) that could be any project management tool — the organic metaphor is lost in the most frequently viewed element
    - P7: The plan template header (title + status line) includes a plant-themed visual element [invariant]
      Captures: Plan header is plain text — opening the file gives no immediate visual signal that this is a "growth" document
    - P8: All structural markers used in the plan template are valid Unicode characters that render correctly in standard markdown viewers (GitHub, VS Code, terminal cat) [boundary]
      Captures: Decorative characters that render as boxes or question marks on common platforms — decoration becomes visual noise
    - P9: The plan template Status field still uses 🌱 Growing and 🌳 Complete as its two values — decorations augment but do not replace these semantic markers [invariant]
      Captures: New decorations overwrite the Status markers that other parts of the system (PLAN mode step 3a) parse to detect in-progress plans
  - Depends on: P1, P2, P3, P4 (progress map established — decorations must be compatible)
  - Touches: `templates/.claude/agents/gardener.md` (PLAN mode template), `.claude/agents/gardener.md`
  - Implementation hint: Use 🌱 for pending stages (seed waiting to grow), 🌳 for completed stages (fully grown), 🌿 for Horizon items (rough growth). Add a vine or leaf divider between major sections (e.g., `---` replaced with a plant-themed line). Add a small plant ornament to the feature header line. Keep it tasteful — 3-4 decorative elements total, not every line.

- ✅ Stage 3: Tests for visual markers in gardener template (added P10-P12 regression tests for progress map format, plant markers, and file identity)
  - Intent: Add test assertions validating that the gardener template contains the new visual elements — progress map format and plant-themed decorations — preventing future edits from stripping them
  - Properties:
    - P10: Test validates the gardener template GROW mode step 8 contains a multi-line progress display specification (not just a single-line "Progress:" format) [invariant]
      Captures: Future refactoring collapses the progress map back to a single line
    - P11: Test validates the gardener template PLAN mode plan template contains plant-themed stage markers distinct from generic ⬜/✅ [invariant]
      Captures: Future edits revert to generic markers — the organic visual identity silently disappears
    - P12: Test validates templates/.claude/agents/gardener.md and .claude/agents/gardener.md are identical [invariant]
      Captures: Template and project copy drift apart after visual changes
    - P10-P12 depend on P1-P9 from Stages 1-2 still holding
  - Depends on: P1, P2, P5, P6, P7
  - Touches: `test/cli.test.mjs`
  - Implementation hint: Add a new test (or extend the existing "gardener agent contains property-based planning structure" test) that checks for the presence of progress map markers (🌿 or equivalent) and plan template decorations. Check that both gardener files are byte-identical.

- ✅ Stage 4: Documentation update (added plant-themed mention to README and product DNA)
  - Intent: Update README and product DNA to mention the visual growth plan format, so users know what to expect when they see plan files
  - Properties:
    - P13: README mentions the visual/plant-themed format of growth plans somewhere in the existing content (no new heading required) [invariant]
      Captures: Users see decorated plan files but find no mention of this in the README — looks like an accident rather than intentional design
    - P14: All existing README headings remain intact and in order [invariant]
      Captures: Documentation update breaks existing heading structure
    - P15: All existing tests pass unchanged [invariant]
      Captures: Documentation changes accidentally affect test expectations
    - P1-P12 from Stages 1-3 still hold
  - Depends on: P5, P7 (decorations exist before documenting them)
  - Touches: `README.md`, `docs/product-dna.md`
  - Implementation hint: Add a brief mention in the "What You Get" or "Workflow" section about growth plans having plant-themed visual markers. Update product DNA if relevant. Keep it minimal — one sentence or a parenthetical.

### Horizon (rough outline of what comes after)
- Consider a `/status` command that reads all growth plans and shows a garden overview (which features are growing, complete, etc.)
- Example growth plan updated with new visual format

## Growth Log
<!-- Auto-updated after each stage -->
- 2026-02-14: Stage 1 complete. Replaced single-line progress format in GROW mode step 8 with multi-line stage map. Three states: completed, current, upcoming. Four property tests added (P1-P4). All 70 tests pass.
- 2026-02-14: Stage 2 complete. Added plant-themed decorations to PLAN mode template: header ornament (🌱 Feature:), seed markers (🌱) for pending stages, herb markers (🌿) for Horizon items, vine divider between Growth Stages and Growth Log. Updated GROW mode step 2 (find next 🌱 stage) and step 6 (mark as 🌳). Five property tests added (P5-P9). All 113 tests pass.
- 2026-02-14: Stage 3 complete. Added regression guard tests (P10-P12) validating visual markers in the source template: multi-line progress display in GROW step 8, plant-themed stage markers in PLAN template, and byte-identity between template and project gardener files. Re-evaluated plan at stage 3 checkpoint — remaining Stage 4 (docs update) still valid. All 116 tests pass.
- 2026-02-14: Stage 4 complete. Added one sentence to README "What You Get" section mentioning plant-themed visual markers in growth plan files. Updated product DNA "How It Works" to note plant-themed markers on rolling plans. Added P13-P14 tests. All 80 tests pass. Feature complete.
