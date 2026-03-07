# Product DNA: Organic Growth

## Vision

A CLI tool and template system that installs an incremental development workflow into any project using Claude Code (or opencode). Features grow in natural stages — like plants — where each stage delivers a complete, working system rather than a partial one.

## For Whom

Developers using Claude Code or opencode for AI-assisted development who want structured, incremental feature development with quality gates, property-based planning, and context hygiene.

## Core Problem

AI coding agents tend to produce large, monolithic changes that are hard to review and easy to break. Organic Growth constrains the agent into small, vertical stages — each with defined properties, tests first, and a quality gate — so that every commit is a working system.

## Key Domain Concepts

- **Growth Stage**: A single, focused increment with one intent, one commit. Defines properties before code.
- **Property**: A rule that must always hold about the system. Properties accumulate across stages and become tests.
- **Growth Plan**: A rolling plan of 3-5 stages ahead, stored in `.organic-growth/growth/<feature>.md`.
- **Product DNA**: A structured document describing the product's vision, users, domain, and constraints (`.organic-growth/product-dna.md`).
- **Growth Map**: A system-level view of all capabilities and their growth sequence (`.organic-growth/growth-map.md`).
- **Gardener Agent**: The agent that plans, implements, and validates growth stages.
- **Quality Gate**: Build + lint + typecheck + test + smoke check after every stage.
- **Context Hygiene**: Fresh session every 3 stages; the growth plan is the continuity mechanism.

## User Roles

- **Developer**: Installs organic-growth into their project, fills in product context, then uses `/seed`, `/grow`, `/next`, `/review`, `/replan`, `/map` commands to grow features incrementally.

## Business Rules

- Each stage must produce a complete, working system (build passes, tests pass, app runs).
- Properties accumulate — stage N must still satisfy all properties from stages 1 through N-1.
- `--upgrade` never overwrites user-customized files (CLAUDE.md, AGENTS.md, .mcp.json, opencode.json).
- `--upgrade` and `--force` are mutually exclusive.
- The CLI has zero runtime dependencies — it copies templates only.
- Supports both Claude Code (`.claude/`) and opencode (`.opencode/`) template sets.

## Architecture

- **CLI** (`bin/cli.mjs`): Node.js script that copies templates, handles DNA documents, migration, and upgrades.
- **Templates** (`templates/`): Claude Code templates (CLAUDE.md, agents, commands, hooks, skills, settings).
- **Templates-opencode** (`templates-opencode/`): opencode equivalents (AGENTS.md, commands, agents, skills, plugin).
- **Tests** (`test/ci.test.mjs`): CI workflow validation tests using Node's built-in test runner.
- **GitHub Actions**: Test (node 20/22 + bun), publish to npm on tag, manual release workflow.

## Non-Functional Requirements

- Node >= 20 required
- Zero runtime dependencies
- Works with both npx and bunx
- Published to npm with provenance

## Current State

Production — published on npm as `organic-growth`, version 3.x, with CI/CD pipeline, release workflow, and active development on the `feature/upgrade-cli` branch.
