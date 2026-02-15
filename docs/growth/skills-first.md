# 🌱 Feature: Skills-First Expansion
Created: 2026-02-15
Status: 🌳 Complete

## Seed (what & why)

Organic-growth started as a methodology installer — it laid down a `CLAUDE.md`, a gardener agent, and five slash commands. But the gardener's effectiveness depends on skills it references but doesn't ship (property-planning, stage-writing, quality-gates), MCP servers it can't auto-discover (Context7), and commit discipline it can't enforce. Expanding the package to include curated skills, MCP configuration, a commit format hook, and superpowers detection makes it batteries-included: install once, get the full workflow without manual setup.

---

## Growth Stages

### Concrete (next 5 stages, detailed)

🌳 Stage 1: Skills templates (property-planning, stage-writing, quality-gates)
  - Intent: Ship three curated skill files that the gardener agent already references, so they're available immediately after install
  - Properties:
    - P1: Three skill files exist under `templates/.claude/skills/`: `property-planning.md`, `stage-writing.md`, `quality-gates.md` [invariant]
      Captures: Gardener references skills that don't exist — user must create them manually
    - P2: Each skill file starts with a YAML frontmatter block containing a `description` field [invariant]
      Captures: Claude Code can't discover skills without frontmatter metadata
    - P3: Project copies under `.claude/skills/` are identical to their template counterparts [invariant]
      Captures: Template and project copies drift — project ships stale skills
    - P4: CLI installs all three skill files (template file count updated) [invariant]
      Captures: CLI doesn't know about the new files — install skips them
    - P5: `property-planning.md` contains guidance on writing properties that capture invariants [invariant]
      Captures: Skill file exists but lacks the methodology content the gardener depends on
    - P6: `quality-gates.md` references the post-stage hook workflow [invariant]
      Captures: Quality skill doesn't mention the automated hooks — user thinks gates are manual-only
  - Depends on: none (first stage)
  - Touches: `templates/.claude/skills/`, `.claude/skills/`, `test/cli.test.mjs`
  - Done: Created all three skill files in both template and project directories. 6 property tests added. Template file count updated to 16.

🌳 Stage 2: MCP configuration template (Context7)
  - Intent: Ship a `.mcp.json` template with Context7 pre-configured so the gardener can look up library documentation during planning
  - Properties:
    - P7: `templates/.mcp.json` exists and contains valid JSON [invariant]
      Captures: MCP config missing — user must create it from scratch
    - P8: The MCP config includes a Context7 server entry with the correct npx command [invariant]
      Captures: Config exists but doesn't include the one MCP server the gardener actually uses
    - P9: CLI copies `.mcp.json` to the project root during install [invariant]
      Captures: Template exists but install doesn't deploy it — dead file
    - P10: The MCP config does not include any API keys or secrets [invariant]
      Captures: Template ships credentials — security violation
    - P11: `.mcp.json` is a top-level template file, not nested under `.claude/` [invariant]
      Captures: MCP config placed in wrong directory — Claude Code won't discover it
  - Depends on: none
  - Touches: `templates/.mcp.json`, `test/cli.test.mjs`
  - Done: Created `.mcp.json` with Context7 stdio server. 5 property tests added. CLI install copies it to project root.

🌳 Stage 3: Commit format check hook
  - Intent: Add a pre-commit hook that validates the organic-growth commit format (`type(scope): stage N — description`) and rejects malformed messages
  - Properties:
    - P12: `templates/.claude/hooks/commit-format-check.sh` exists and is executable [invariant]
      Captures: No automated enforcement of commit convention — gardener writes free-form messages
    - P13: The hook validates the `type(scope): ...` prefix format [invariant]
      Captures: Hook exists but doesn't check the convention the methodology requires
    - P14: The hook allows standard non-stage commits (merge, revert, chore, docs, ci) [invariant]
      Captures: Hook is too strict — blocks legitimate maintenance commits
    - P15: The hook rejects messages that don't match any accepted pattern [invariant]
      Captures: Hook accepts everything — provides no enforcement value
    - P16: Project copy under `.claude/hooks/` is identical to the template [invariant]
      Captures: Template and project copies diverge
    - P17: Hook is registered in `settings.json` under the pre-commit event [invariant]
      Captures: Hook file exists but Claude Code doesn't know to run it
    - P18: Hook stderr output uses emoji for visual feedback (consistent with other hooks) [invariant]
      Captures: Commit format hook is silent — inconsistent with test/review hook UX
    - P19: Hook produces valid JSON on stdout for Claude Code context injection [invariant]
      Captures: Non-JSON stdout breaks Claude Code's hook result parsing
    - P20: End-to-end test verifies hook accepts a valid stage commit [invariant]
      Captures: Hook logic looks correct in source but fails at runtime due to shell issues
    - P21: End-to-end test verifies hook rejects an invalid commit message [invariant]
      Captures: Hook appears to validate but actually passes everything through
  - Depends on: none
  - Touches: `templates/.claude/hooks/commit-format-check.sh`, `.claude/hooks/commit-format-check.sh`, `templates/.claude/settings.json`, `.claude/settings.json`, `test/cli.test.mjs`
  - Done: Created commit-format-check.sh with regex validation for stage commits and allowlist for maintenance types. Registered in settings.json. 10 property tests added including 2 end-to-end tests.

🌳 Stage 4: Superpowers plugin detection
  - Intent: Detect at install time whether useful MCP plugins (Playwright, Figma, Context7) are available and print a superpowers summary
  - Properties:
    - P22: CLI output after install includes a "Superpowers" section listing detected MCP plugins [invariant]
      Captures: User doesn't know which plugins are active — no discovery mechanism
  - Depends on: none
  - Touches: `bin/cli.mjs`, `test/cli.test.mjs`
  - Done: Added superpowers detection that checks for Playwright, Figma, and Context7 MCP tools. Prints detected plugins in install summary. 1 test added.

🌳 Stage 5: Documentation and growth plan
  - Intent: Create the growth plan document and update product DNA to reflect all new capabilities
  - Properties:
    - P23: `docs/growth/skills-first.md` exists with all 5 stages documented [invariant]
      Captures: Feature was grown without a plan file — breaks continuity for future sessions
    - P24: `docs/product-dna.md` mentions skills, MCP config, commit format hook, and superpowers [invariant]
      Captures: Product DNA is stale — gardener plans features unaware of new capabilities
    - P25: Product DNA test count matches actual test count (137) [invariant]
      Captures: DNA says wrong test count — misleading for planning
  - Depends on: Stages 1-4
  - Touches: `docs/growth/skills-first.md`, `docs/product-dna.md`

─── 🌿 Horizon ───

- Additional skills: `session-hygiene.md`, `review-checklist.md`
- More MCP servers: Playwright for visual testing, Figma for design-to-code
- Commit hook configurability: allow projects to customize the accepted format pattern
- Superpowers: suggest missing plugins based on project type (e.g., "You have a frontend — consider Figma")

## Growth Log
<!-- Auto-updated after each stage -->

### 2026-02-15 — Stage 1 complete
Created three skill templates (`property-planning.md`, `stage-writing.md`, `quality-gates.md`) in both `templates/.claude/skills/` and `.claude/skills/`. Each has YAML frontmatter with description. Template file count updated from 13 to 16. 6 property tests added. All tests pass.

### 2026-02-15 — Stage 2 complete
Created `templates/.mcp.json` with Context7 MCP server configuration (stdio transport, `npx -y @anthropic/context7-mcp@latest`). CLI copies it to project root during install. 5 property tests added. All tests pass.

### 2026-02-15 — Stage 3 complete
Created `commit-format-check.sh` hook in both template and project directories. Validates `type(scope): ...` format for stage commits, allows maintenance types (merge, revert, chore, docs, ci, test, refactor, fix, feat, build, style, perf). Registered in `settings.json` as pre-commit hook. Emoji stderr feedback consistent with other hooks. 10 property tests added including 2 end-to-end tests. All tests pass.

### 2026-02-15 — Stage 4 complete
Added superpowers detection to CLI install output. Checks for Playwright, Figma, and Context7 MCP tools at runtime. Prints detected plugins in a "Superpowers" summary section. 1 test added. All tests pass.

### 2026-02-15 — Stage 5 complete (feature complete)
Created growth plan document. Updated product DNA with new capabilities (skills, MCP config, commit format hook, superpowers detection) and corrected test count to 137. Feature status set to complete.
