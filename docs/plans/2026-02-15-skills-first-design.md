# Skills-First Expansion

**Date:** 2026-02-15
**Status:** Approved

## Summary

Expand organic-growth from a methodology installer into a batteries-included project bootstrap by adding curated skills, MCP configuration, and a commit format hook. The approach is hybrid: ship organic-growth-specific skills, install MCP configs, and detect companion plugins like superpowers.

## What We're Adding

### Skills (3 files)

Location: `templates/.claude/skills/`

**`property-planning.md`** (rigid skill)
Loaded when writing growth plans or defining stage properties. Teaches how to express behavior as testable properties before writing code. Covers property patterns (invariants, state transitions, boundary conditions), anti-patterns ("test the implementation"), and mapping properties to test frameworks. Follow the process, don't skip steps.

**`stage-writing.md`** (flexible skill)
Loaded when scoping or implementing a growth stage. Teaches how to size a stage (one intent), vertical slicing (touch all layers), when to split vs. combine. Covers the "seedling, not 10% of a tree" principle, hardcoded-to-dynamic progression, and what belongs in one commit. Principles adapt to project context.

**`quality-gates.md`** (flexible skill)
Loaded when a quality gate fails or when setting up quality tools. Teaches how to configure the quality section of CLAUDE.md, how to fix failures within the current stage (no debt carried forward). Covers common failure patterns, "fix it now" discipline, and when to adjust stage scope vs. fix the failure.

### MCP Configuration (1 file)

Location: `templates/.mcp.json` (installed at project root)

**Context7** only. Zero auth required, installed via `npx -y @upstash/context7-mcp`. Gives every new project instant library docs lookup. No other MCP servers included — GitHub and Playwright require auth or are use-case-specific.

### Hooks (1 file)

Location: `templates/.claude/hooks/`

**`commit-format-check.sh`** (PostToolUse on Bash/git commit)
Validates that stage commits follow `feat(scope): stage N — <what grew>` format. Checks the latest commit message after a git commit is made. Outputs a warning to stderr if the format is wrong (informational, not blocking — the commit already happened). Registered in `templates/.claude/settings.json`.

### CLI Changes

**Installation additions in `bin/cli.mjs`:**
- Copy `templates/.claude/skills/` (3 files) into `.claude/skills/`
- Copy `templates/.mcp.json` to project root
- Copy new hook, update settings.json registration
- Same skip/overwrite logic as existing files

**Superpowers detection (informational):**
- After installation, check if `~/.claude/plugins/` contains a superpowers plugin
- If found: print `Superpowers plugin detected — great companion for organic-growth!`
- If not found: print `Tip: Install the superpowers plugin for TDD, debugging, and brainstorming skills`
- No behavior change either way

No new CLI flags or options.

## What We're NOT Adding

- General-purpose skills (TDD, debugging, brainstorming) — those belong in superpowers
- Auth-required MCP servers (GitHub, Playwright) — too project-specific
- Hard-blocking commit hooks — the commit already happened, feedback is advisory
- Plugin system restructuring — the npm installer approach works well

## Constraints

- Zero runtime dependencies (maintained)
- Single executable file (maintained)
- Must work with bun and npm (maintained)
- Package size under 50KB (maintained)
- No overlap with superpowers plugin skills
