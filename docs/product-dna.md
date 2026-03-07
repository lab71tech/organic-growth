# Organic Growth — Product DNA

## What
An npm package (`organic-growth`) that installs a Claude Code configuration for incremental software development using thin vertical slices.

## For Whom
Developers using Claude Code who want a structured, controlled workflow instead of "fire and forget" autonomous coding.

## Core Problem
Claude Code without structure produces inconsistent results — sprawling changes, lost context over long sessions, no clear checkpoints. Developers need a methodology that works WITH LLM limitations (context window degradation, weak self-review) rather than ignoring them.

## How It Works
- **One agent (gardener)** with three modes: PLAN, GROW, REPLAN
- **Rolling plans** stored in `.organic-growth/growth/<feature>.md` — 3-5 concrete stages + horizon, with plant-themed visual markers for stage status
- **One stage = one intent = one commit**
- **Two-layer quality:** deterministic tools (build/lint/typecheck/test) after every stage, LLM deep review on demand. Post-stage hooks enforce this automatically: a test hook runs the test suite after every stage commit (deterministic gate), then a review hook injects the diff as review context
- **Commit discipline:** a commit-format-check hook validates the `type(scope): stage N — description` convention before every commit
- **Curated skills:** three skill files ship with the package — `property-planning`, `stage-writing`, `quality-gates` — giving the gardener agent domain knowledge out of the box
- **MCP configuration:** a `.mcp.json` template pre-configures Context7 for library documentation lookup during planning
- **Growth map support:** optional `.organic-growth/growth-map.md` gives a system-level capability sequence with statuses and links to plans
- **Capability tags:** each growth plan includes searchable `Capabilities:` tags for related-plan discovery
- **Context hygiene:** fresh session every 3 stages, plan file provides continuity

## Key Commands
- `/seed` — bootstrap project (from DNA document or interview)
- `/grow` — plan a new feature
- `/next` — implement next stage
- `/next-automatic` — run multiple stages automatically (optional max-stages argument)
- `/replan` — adjust when reality changes
- `/review` — deep quality check with fresh context

## Tech Stack
- Node.js CLI (bin/cli.mjs) — zero dependencies, pure Node.js
- Templates in `templates/` — `CLAUDE.md` at root, agents and commands under `templates/.claude/`
- Published to npm, invoked via `bunx organic-growth` or `npx organic-growth`

## Constraints
- Zero runtime dependencies
- Single executable file (cli.mjs)
- Must work with bun and npm
- Templates are plain markdown — no templating engine
- Package size under 50KB

## Current State
v1.0.1 — Post-MVP, infrastructure mature. CLI installs templates with all commands and agent defined. Full CI/CD pipeline in place:
- Test workflow (Node 20/22 + bun matrix)
- Publish workflow (npm with provenance on version tags)
- Manual release workflow (configurable bump, dry-run mode, loop prevention)
- Release notes with changelog categories
- Dependabot for GitHub Actions (grouped minor/patch updates)
- 137 tests, zero failures

## Priorities
1. Correctness of templates (gardener instructions, command definitions)
2. Developer experience (clear README, easy install, helpful CLI output)
3. Simplicity (resist unnecessary complexity — one agent, focused command set)
