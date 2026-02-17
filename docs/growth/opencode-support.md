# 🌱 Feature: opencode Support

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

Created: 2026-02-17
Status: 🌱 Growing

## Seed (what & why)

organic-growth is currently Claude Code-only. opencode — an open-source AI coding agent with a remarkably similar architecture (.opencode/ with agents, commands, skills, plugins) — cannot use organic-growth today. Adding a `--opencode` flag to the CLI that installs a parallel set of opencode-native templates gives opencode users the same organic growth methodology. The design uses parallel template trees (no shared templates, no conditional rendering) for clean separation and easy maintenance.

Design document: `docs/plans/2026-02-17-opencode-support-design.md`

---

## Growth Stages

### Concrete (next 5 stages, detailed)

- 🌳 Stage 1: --opencode flag + AGENTS.md template
  - Done: Created `templates-opencode/AGENTS.md` (same methodology content as CLAUDE.md, opencode-specific comments). Added `TEMPLATES_OPENCODE_DIR` constant and `isOpencode` flag to CLI. Template source switches to opencode tree when `--opencode` is passed. Updated `package.json` `files` to include `templates-opencode/`. Updated size limit from 50KB to 200KB (two template sets). 6 property tests (P1-P6) all passing. Total: 174 tests.
  - Intent: Prove the opencode install path works end-to-end with the simplest possible vertical slice — CLI accepts `--opencode`, copies AGENTS.md from a new `templates-opencode/` directory into the target project root.
  - Properties:
    - P1: CLI accepts `--opencode` flag without error [transition]
      Captures: `--opencode` is parsed as a DNA file path or causes an unknown-flag error
    - P2: When `--opencode` is passed, AGENTS.md is installed at the project root [invariant]
      Captures: opencode flag is accepted but no files are actually installed
    - P3: When `--opencode` is passed, CLAUDE.md is NOT installed at the project root [invariant]
      Captures: Both rule files are installed — opencode user gets a confusing duplicate
    - P4: Without `--opencode`, CLI behavior is identical to current (backward compatible) — CLAUDE.md installed, no AGENTS.md [invariant]
      Captures: Adding the opencode path breaks the existing Claude Code install
    - P5: AGENTS.md contains the same methodology content as CLAUDE.md (Organic Growth philosophy, Growth Rules 1-6, Growth Stage Patterns, Commit Convention) [invariant]
      Captures: AGENTS.md is a stub or missing the methodology — opencode users get a broken experience
    - P6: `docs/growth/` directory is created in --opencode mode [invariant]
      Captures: Growth plans have nowhere to go in opencode installs
  - Depends on: none (first stage)
  - Touches: `bin/cli.mjs`, `templates-opencode/AGENTS.md`, `package.json` (files array), `test/cli.test.mjs`
  - Implementation hint: Create `templates-opencode/AGENTS.md` with same content as `templates/CLAUDE.md` but with opencode-specific naming in comments (e.g., "opencode reads your build files" instead of "Claude Code reads your build files"). Add `--opencode` flag parsing in CLI. New constant `TEMPLATES_OPENCODE_DIR`. Add `"templates-opencode/"` to package.json `files` array.

- 🌱 Stage 2: .opencode/ agents, commands, and skills
  - Intent: Port the gardener agent, all 5 commands, and all 3 skills into the opencode template tree. After this stage, an opencode user has the full organic growth workflow minus hooks.
  - Properties:
    - P7: `.opencode/agents/gardener.md` is installed in --opencode mode [invariant]
      Captures: The core gardener agent is missing — no /next, /grow workflow
    - P8: All 5 commands (`seed`, `grow`, `next`, `replan`, `review`) are installed under `.opencode/commands/` in --opencode mode [invariant]
      Captures: Commands are partially ported — user has /grow but not /next
    - P9: All 3 skills (`property-planning`, `stage-writing`, `quality-gates`) are installed under `.opencode/skills/` in --opencode mode [invariant]
      Captures: Skills are forgotten — gardener loses planning discipline
    - P10: No `.claude/` directory is created in --opencode mode [invariant]
      Captures: Both .claude/ and .opencode/ are installed — confusing and wasteful
    - P11: Gardener agent references AGENTS.md (not CLAUDE.md) for product context [invariant]
      Captures: Gardener tries to read CLAUDE.md which doesn't exist in opencode installs
    - P12: Command files use `$ARGUMENTS` placeholder (same in both tools) [invariant]
      Captures: Placeholder syntax is wrong — commands produce literal "$ARGUMENTS" text
    - P13: Gardener agent contains all three modes (PLAN, GROW, REPLAN) with all existing steps [invariant]
      Captures: Translation loses gardener functionality
    - P14: All template files are non-empty [invariant]
      Captures: Empty placeholder files are installed
  - Depends on: P1-P6 (opencode install path works)
  - Touches: `templates-opencode/.opencode/agents/gardener.md`, `templates-opencode/.opencode/commands/{seed,grow,next,replan,review}.md`, `templates-opencode/.opencode/skills/{property-planning,stage-writing,quality-gates}.md`, `test/cli.test.mjs`
  - Implementation hint: Start with gardener.md — mostly identical content, adjust frontmatter to opencode format (tools as object not array), replace CLAUDE.md references with AGENTS.md. Commands are nearly identical — remove superpowers skill references (Claude Code-specific). Skills are identical content, just placed under .opencode/skills/.

- 🌱 Stage 3: Hooks → opencode JS plugin
  - Intent: Translate the 3 Claude Code shell hooks into a single opencode JS plugin. This is the most structurally different piece — shell scripts with jq become a JS module with event handlers.
  - Properties:
    - P15: `.opencode/plugins/organic-growth.js` is installed in --opencode mode [invariant]
      Captures: Hooks are simply dropped — opencode users lose post-stage test/review automation
    - P16: No `.claude/settings.json` or `.claude/hooks/` files are installed in --opencode mode [invariant]
      Captures: Claude Code hook files leak into opencode installs
    - P17: Plugin file exports a default function [invariant]
      Captures: Plugin doesn't follow opencode's export convention — silently ignored
    - P18: Plugin registers a `tool.execute.after` event handler [invariant]
      Captures: Plugin exports correctly but doesn't hook into any events
    - P19: Plugin contains test-runner logic that reads the test command from AGENTS.md [invariant]
      Captures: Plugin tries to read CLAUDE.md or has no test discovery
    - P20: Plugin contains review-context logic that gathers git diff after stage commits [invariant]
      Captures: Post-stage review functionality is lost
    - P21: Plugin contains commit-format checking logic [invariant]
      Captures: Commit convention enforcement is lost
  - Depends on: P7-P14 (agents/commands/skills exist for the plugin to complement)
  - Touches: `templates-opencode/.opencode/plugins/organic-growth.js`, `test/cli.test.mjs`
  - Implementation hint: Single JS file. Export default function receiving `{ $, directory }`. Return object with `"tool.execute.after"` handler. Guard on bash tool + git commit + "stage N" pattern. Three sequential checks: run tests, gather diff, check format. Use `$` shell API for running commands. Read test command from AGENTS.md using fs.readFileSync + regex (same pattern as shell hooks but in JS).

- 🌱 Stage 4: opencode.json (MCP config) + package.json updates
  - Intent: Complete the template set with opencode.json for MCP config. Update package.json metadata to reflect both-tool support.
  - Properties:
    - P22: `opencode.json` is installed at project root in --opencode mode [invariant]
      Captures: MCP configuration is missing — no Context7 in opencode
    - P23: opencode.json contains Context7 MCP server configuration [invariant]
      Captures: opencode.json exists but is empty or misconfigured
    - P24: No `.mcp.json` is installed in --opencode mode [invariant]
      Captures: Claude Code MCP format leaks into opencode installs
    - P25: package.json `files` array includes `"templates-opencode/"` [invariant]
      Captures: npm publish excludes opencode templates — --opencode flag works locally but not via npx
    - P26: package.json `description` mentions both Claude Code and opencode [invariant]
      Captures: Package description is stale — npm users don't know opencode is supported
    - P27: package.json `keywords` includes `"opencode"` [invariant]
      Captures: Package is not discoverable by opencode users searching npm
  - Depends on: P15-P21 (plugin exists for a complete template set)
  - Touches: `templates-opencode/opencode.json`, `package.json`, `test/cli.test.mjs`
  - Implementation hint: opencode.json uses `{ "mcp": { "context7": { "type": "stdio", "command": "npx", "args": ["-y", "@upstash/context7-mcp"] } } }`. Package.json: add `"templates-opencode/"` to files, update description, add keyword.

- 🌱 Stage 5: CLI messaging + help text polish
  - Intent: Make the CLI output context-aware — banner, next-steps, and help text adjust for the selected tool. Skip superpowers detection in opencode mode.
  - Properties:
    - P28: CLI banner says "opencode setup" (not "Claude Code setup") when --opencode is used [invariant]
      Captures: opencode user sees "Claude Code setup" — confusing branding
    - P29: Next-steps output references AGENTS.md (not CLAUDE.md) in --opencode mode [invariant]
      Captures: CLI tells opencode user to edit a file that doesn't exist
    - P30: Help text (`--help`) mentions `--opencode` option [invariant]
      Captures: Flag is undiscoverable — user must read source code to learn about it
    - P31: Superpowers plugin detection is skipped in --opencode mode [transition]
      Captures: CLI looks for ~/.claude/plugins/ in opencode mode — wrong tool's plugin directory
    - P32: --force flag works with --opencode [invariant]
      Captures: Force flag only works for Claude Code installs
    - P33: DNA file argument works with --opencode [invariant]
      Captures: `npx organic-growth --opencode spec.md` ignores the DNA file
  - Depends on: P22-P27 (template set is complete, package metadata updated)
  - Touches: `bin/cli.mjs`, `test/cli.test.mjs`
  - Implementation hint: Most changes are in the `install()` function. Use a boolean `isOpencode` derived from flag parsing. Conditionally adjust: banner text, next-steps file reference, superpowers section. Help text: add `--opencode` to the options list.

### Horizon (rough outline of what comes after)

- 🌿 Template content tests: verify methodology parity between CLAUDE.md and AGENTS.md (detect drift)
- 🌿 opencode plugin integration tests: verify the JS plugin actually works in a real opencode session
- 🌿 `--both` flag: install templates for both tools simultaneously (for teams using both)
- 🌿 opencode agent frontmatter refinement: tune model, temperature, tools config based on real-world usage

🌿 ─── ─── ─── 🌿

## Growth Log
<!-- Auto-updated after each stage -->
- 2026-02-17: Stage 1 complete. `--opencode` flag routes CLI to `templates-opencode/` tree. AGENTS.md installed (not CLAUDE.md) in opencode mode. Package size limit updated to 200KB for two template sets. 6 property tests (P1-P6) all passing. Total: 174 tests.
