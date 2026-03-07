# Feature: Seed on Existing Project
Created: 2026-03-07
Status: Growing
Capabilities: seed-command, existing-project-detection, auto-discovery, interview-flow, template-parity

## Seed (what & why)

The `/seed` command currently assumes greenfield projects: its description says "Bootstrap a new project", the interview asks greenfield questions ("What are you building?", "What tech stack?"), and Step 4 always generates a bootstrap growth plan with init/hello-world stages. For existing projects, seed should instead auto-discover the tech stack and quality tools from build files, adjust the interview to focus on documenting what exists rather than planning what to build, and skip bootstrap plan generation entirely. Both Claude Code and opencode templates must change in parity.

## Growth Stages

### Concrete (next 5 stages, detailed)

- 🌳 Stage 1: Description and framing -- remove greenfield-only language (done)
  - Intent: Make the seed command description and opening line accurate for both new and existing projects, and restructure Step 0 into a clear existing-project detection gate that controls the flow of all subsequent steps.
  - Properties:
    - P1: The frontmatter description field does not contain the word "new" [invariant]
      Captures: misleading description when used on existing projects
    - P2: The opening instruction line (first non-frontmatter line) does not contain the word "new" [invariant]
      Captures: framing bias that makes agents treat existing projects as greenfield
    - P3: Step 0 defines a clear boolean outcome (existing project detected: yes/no) that subsequent steps reference [invariant]
      Captures: ambiguous detection that does not clearly gate the rest of the flow
    - P4: Claude Code and opencode seed templates have identical step structure and logic (differing only in the config file name: CLAUDE.md vs AGENTS.md) [invariant]
      Captures: template drift between platforms
  - Depends on: none (first stage)
  - Touches: templates/.claude/commands/seed.md, templates-opencode/.opencode/commands/seed.md, test/cli.test.mjs
  - Implementation hint: Change description to "Plant the seed for a project -- from DNA document or interview". Change opening line to "Plant the seed for a project." Make Step 0 produce an explicit "EXISTING = true/false" decision. Add tests asserting the template content.

- 🌳 Stage 2: Auto-discovery checklist -- explicit file scanning instructions (done)
  - Intent: Replace Step 0's vague "Read README/build files" with an explicit checklist of files to scan and what to extract from each, so the agent reliably fills in Tech Stack and Quality Tools.
  - Properties:
    - P5: Step 0 contains an explicit file-scanning checklist that names at least: package.json, Makefile, build.gradle(.kts), pyproject.toml, Cargo.toml, go.mod, pom.xml, README.md, and CI config files (.github/workflows/*.yml or .gitlab-ci.yml) [invariant]
      Captures: agent guessing at quality tools instead of reading build files
    - P6: For each file in the checklist, the template specifies what to extract (e.g., "package.json: scripts.build, scripts.test, scripts.lint, engines, dependencies for stack detection") [invariant]
      Captures: agent reading the file but not knowing which fields matter
    - P7: Step 0 instructs the agent to populate the Quality Tools section of CLAUDE.md/AGENTS.md with discovered commands and present them to the user for confirmation [invariant]
      Captures: auto-discovered tools silently written without user review
    - P4: (carried) Claude Code and opencode templates remain identical in step structure [invariant]
  - Depends on: P1, P2, P3, P4
  - Touches: templates/.claude/commands/seed.md, templates-opencode/.opencode/commands/seed.md, test/cli.test.mjs
  - Implementation hint: Expand Step 0's existing-project branch with the explicit checklist. The checklist is instructions for the agent (markdown), not executable code.

- 🌳 Stage 3: Interview path split -- existing vs greenfield questions (done)
  - Intent: When an existing project is detected, replace the greenfield interview questions with discovery-first questions that document what already exists, then ask only about gaps the code cannot reveal.
  - Properties:
    - P8: When existing project is detected (Step 0 = EXISTING), Path B does NOT contain the questions "What are you building?" or "What tech stack do you want?" [invariant]
      Captures: asking redundant questions when the answers are already in the code
    - P9: When existing project is detected, Path B instructs the agent to present auto-discovered product context first ("Here's what I discovered...") and ask the user to confirm or adjust [invariant]
      Captures: agent ignoring what it discovered and interviewing from scratch
    - P10: When existing project is detected, Path B asks only gap-filling questions: core problem (if not clear from README), business rules, current priorities, and hard constraints [invariant]
      Captures: over-interviewing when most context is already discoverable
    - P11: When NO existing project is detected (greenfield), the full original interview question set is preserved unchanged [invariant]
      Captures: regression -- greenfield path must not lose any questions
    - P4: (carried) Claude Code and opencode templates remain identical in step structure [invariant]
  - Depends on: P1, P2, P3, P4, P5, P6, P7
  - Touches: templates/.claude/commands/seed.md, templates-opencode/.opencode/commands/seed.md, test/cli.test.mjs
  - Implementation hint: Split Path B into "Path B1 -- Existing project, no DNA" and "Path B2 -- Greenfield, no DNA". B1 presents discoveries then asks gaps. B2 is the current interview verbatim.

- 🌳 Stage 4: Skip bootstrap plan for existing projects (done)
  - Intent: When an existing project is detected, do not generate project-bootstrap.md. The seed output for existing projects is CLAUDE.md/AGENTS.md + product-dna.md only. The user runs /grow when ready to plan their first feature.
  - Properties:
    - P12: When existing project is detected, Step 4 (growth plan generation) is skipped entirely -- the template explicitly instructs the agent NOT to generate project-bootstrap.md [invariant]
      Captures: generating greenfield bootstrap stages for a project that already has code
    - P13: When existing project is detected, Step 5 (growth map generation) is skipped -- no growth map is generated during seed [invariant]
      Captures: generating a growth map with a bootstrap plan that does not exist
    - P14: When existing project is detected, the MANDATORY STOP section (Step 7) lists only the files that were actually created (CLAUDE.md/AGENTS.md + product-dna.md), not project-bootstrap.md or growth-map.md [invariant]
      Captures: stop section referencing files that were never created
    - P15: When existing project is detected, the closing message says "Seed planted. Run /grow when you're ready to plan your first feature." instead of referencing /next [invariant]
      Captures: directing user to /next when there is no growth plan to execute
    - P16: When NO existing project is detected (greenfield), Steps 4, 5, 6, and 7 remain unchanged -- bootstrap plan and growth map are still generated [invariant]
      Captures: regression -- greenfield path must still produce bootstrap plan
    - P4: (carried) Claude Code and opencode templates remain identical in step structure [invariant]
  - Depends on: P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11
  - Touches: templates/.claude/commands/seed.md, templates-opencode/.opencode/commands/seed.md, test/cli.test.mjs
  - Implementation hint: Wrap Steps 4 and 5 in a conditional on the Step 0 detection outcome. Add a parallel existing-project branch for Steps 6 and 7 with the correct file list and closing message.

- Stage 5: Sync project copies and verify full template parity
  - Intent: Copy the updated templates to the project's own .claude/ and .opencode/ directories (which the project uses for its own development), and add a comprehensive parity test that verifies Claude Code and opencode seed templates are structurally identical.
  - Properties:
    - P17: The project's own .claude/commands/seed.md is identical to templates/.claude/commands/seed.md [roundtrip]
      Captures: project copy drifting from template (existing test covers this, but must still pass)
    - P18: Every numbered step present in the Claude Code seed template has a corresponding step in the opencode seed template with identical logic (differing only in CLAUDE.md vs AGENTS.md and .claude vs .opencode references) [invariant]
      Captures: one template getting changes the other does not
    - P4: (carried) Claude Code and opencode templates remain identical in step structure [invariant]
  - Depends on: P1-P16
  - Touches: .claude/commands/seed.md, .opencode/commands/seed.md, test/cli.test.mjs
  - Implementation hint: Copy templates to project dirs. Add a test that reads both seed templates, normalizes CLAUDE.md/AGENTS.md and .claude/.opencode references, and asserts they match.

### Horizon (rough outline of what comes after)

- Path A (DNA exists) also needs existing-project awareness -- when DNA is provided for an existing project, merge auto-discovered tech stack with DNA content rather than relying solely on the document.
- Step 0's git commit convention detection ("Check recent git commits and ask whether to follow existing commit convention") could be expanded with concrete heuristics (conventional commits, scope patterns, etc.).
- Consider adding a `--existing` flag to the CLI itself (not just the seed template) that pre-populates CLAUDE.md Quality Tools from the target project's build files during `npx organic-growth` installation.

## Growth Log
<!-- Auto-updated after each stage -->
- **2026-03-07 -- Stage 1 complete:** Removed greenfield-only language from seed template frontmatter and opening line. Restructured Step 0 into a clear EXISTING = true/false detection gate. Synced both Claude Code and opencode templates. 7 tests added, all pass.
- **2026-03-07 -- Stage 2 complete:** Added explicit auto-discovery checklist to Step 0 naming 10 file types (package.json, build.gradle/.kts, pyproject.toml, Cargo.toml, go.mod, pom.xml, Makefile, README.md, GitHub/GitLab CI configs) with extraction instructions for each. Added Quality Tools population instructions with user confirmation gate. 22 tests added, 86 total pass.
- **2026-03-07 -- Stage 3 complete:** Split Path B into Path B1 (existing project) and Path B2 (greenfield). B1 presents auto-discovered context first, asks user to confirm/adjust, then asks only gap-filling questions (core problem, business rules, priorities, constraints). B2 preserves original greenfield interview verbatim. Both Claude Code and opencode templates updated in parity. 39 tests added, 159 total pass.
- **2026-03-07 -- Stage 4 complete:** Wrapped Steps 4-7 in EXISTING conditionals. When EXISTING=true: Step 4 skips project-bootstrap.md generation, Step 5 skips growth-map.md generation, Step 6 lists only product-dna.md + CLAUDE.md/AGENTS.md, Step 7 closing message says "/grow" instead of "/next". Greenfield path unchanged. Both templates updated in parity, project copy synced. 15 tests added, 174 total pass.
