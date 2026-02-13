# Organic Growth — Product DNA

## What
An npm package (`organic-growth`) that installs AI coding assistant configuration for incremental software development using thin vertical slices. Supports Claude Code (`.claude/`) and GitHub Copilot (`.github/copilot-instructions.md`). Project context is defined once in `docs/project-context.md` and shared across all tools via a `sync` command.

## For Whom
Developers using Claude Code or GitHub Copilot who want a structured, controlled workflow instead of "fire and forget" autonomous coding.

## Core Problem
Claude Code without structure produces inconsistent results — sprawling changes, lost context over long sessions, no clear checkpoints. Developers need a methodology that works WITH LLM limitations (context window degradation, weak self-review) rather than ignoring them.

## How It Works
- **Shared context:** `docs/project-context.md` is the single source of truth for product, tech stack, quality tools, and priorities. All AI tool configs derive their project context from this file
- **Sync architecture:** Tool-specific config files contain sync markers (`<!-- BEGIN PROJECT CONTEXT -->` / `<!-- END PROJECT CONTEXT -->`). The `sync` command reads `project-context.md` and injects its content between these markers in each target file. Claude Code reads the file directly; Copilot and other tools receive injected copies
- **One agent (gardener)** with three modes: PLAN, GROW, REPLAN
- **Rolling plans** stored in `docs/growth/<feature>.md` — 3-5 concrete stages + horizon
- **One stage = one intent = one test = one commit**
- **Two-layer quality:** deterministic tools (build/lint/typecheck/test) after every stage, LLM deep review on demand
- **Context hygiene:** fresh session every 3 stages, plan file provides continuity

## Key Commands
- `/seed` — bootstrap project (fills `docs/project-context.md` from DNA document or interview)
- `/grow` — plan a new feature
- `/next` — implement next stage
- `/replan` — adjust when reality changes
- `/review` — deep quality check with fresh context
- `sync` — CLI subcommand that pushes `docs/project-context.md` content into tool config files (supports `--target` filtering)

## Tech Stack
- Node.js CLI (bin/cli.mjs) — zero dependencies, pure Node.js
- Templates in `templates/.claude/`, `templates/.github/`, and `templates/docs/` — markdown files
- `templates/docs/project-context.md` — shared context template, always installed regardless of `--target`
- `--target` flag selects which tool configs to install/sync (`claude`, `copilot`, or `all`)
- Sync markers in tool config templates enable content injection from `project-context.md`
- Published to npm, invoked via `bunx organic-growth` or `npx organic-growth`

## Constraints
- Zero runtime dependencies
- Single executable file (cli.mjs)
- Must work with bun and npm
- Templates are plain markdown — no templating engine
- Package size under 50KB

## Current State
v0.1.0 — Post-MVP, infrastructure mature. CLI installs templates with all commands and agent defined. Full CI/CD pipeline in place:
- Test workflow (Node 20/22 + bun matrix)
- Publish workflow (npm with provenance on version tags)
- Automated daily release workflow (configurable bump, dry-run mode, loop prevention)
- Release notes with changelog categories
- Dependabot for GitHub Actions (grouped minor/patch updates)
- Multi-tool support: Claude Code + GitHub Copilot via `--target` flag
- Shared context architecture: `docs/project-context.md` as single source of truth, `sync` command to push context into tool configs, placeholder validation warns on unfilled templates
- 86 tests, 16 suites, zero failures

## Priorities
1. Correctness of templates (gardener instructions, command definitions)
2. Developer experience (clear README, easy install, helpful CLI output)
3. Simplicity (resist adding features — one agent, five commands, that's it)