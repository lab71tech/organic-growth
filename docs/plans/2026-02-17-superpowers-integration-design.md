# Superpowers Integration Design

**Date:** 2026-02-17
**Feature:** Integrate organic-growth with the superpowers plugin

## Context

organic-growth is an npm package (v1.1.0) providing a Claude Code setup for
incremental software development. The superpowers plugin provides process
skills (brainstorming, TDD, debugging, verification). This design integrates
them so the organic growth workflow leverages superpowers skills end-to-end.

## Decisions

1. **Full integration** — commands invoke skills AND gardener references them
2. **Required companion** — superpowers is a required dependency, no conditional logic
3. **Keep both skill sets** — organic-growth domain skills (property-planning,
   stage-writing, quality-gates) stay; superpowers adds process skills (TDD,
   debugging, verification)

## Approach: Reference-Based Integration

Commands and gardener reference superpowers skills by name. Commands invoke
skills directly (they run in main context with Skill tool access). Gardener
embeds key principles inline (it runs as a subagent without Skill tool).

## Integration Map

| Organic Growth Phase            | Superpowers Skill                  | Integration Point     |
|---------------------------------|------------------------------------|-----------------------|
| `/grow` (before planning)       | `brainstorming`                    | grow.md command       |
| `/seed` (new project, no DNA)   | `brainstorming`                    | seed.md command       |
| `/next` (writing property tests)| `test-driven-development`          | gardener GROW mode    |
| `/next` (stuck on failure)      | `systematic-debugging`             | gardener GROW mode    |
| `/next` (before commit)         | `verification-before-completion`   | gardener GROW mode    |
| `/next` (feature complete)      | `finishing-a-development-branch`   | gardener GROW mode    |
| `/review`                       | `requesting-code-review`           | review.md command     |

## Changes by File

### Commands

**`grow.md`** — Add brainstorming skill invocation before gardener PLAN mode.

**`seed.md`** — Add brainstorming for Path B (no DNA). Skip for Path A (DNA
exists).

**`next.md`** — Add fallback note: "If stuck, use systematic-debugging skill."

**`review.md`** — Reference requesting-code-review for structured findings,
receiving-code-review for handling feedback.

**`replan.md`** — No changes (organic-growth-specific, no superpowers equivalent).

### Gardener Agent

Add "Superpowers Integration" section with embedded principles:

- **GROW step 4b (tests):** TDD discipline — red/green/refactor cycle. Property
  tests = TDD's failing tests.
- **GROW step 4d (quality gate):** Verification checklist — no TODO/FIXME, no
  debug code, changes match single intent.
- **GROW (test failure):** Systematic debugging — reproduce, isolate, root cause,
  fix, verify. Don't guess.
- **GROW step 8 (feature complete):** Reference finishing-a-development-branch
  skill for merge/PR/cleanup.

### Template & Infrastructure

**`templates/CLAUDE.md`** — Note superpowers integration in Development Philosophy.

**`bin/cli.mjs`** — Update install summary to show superpowers integration status.

**Tests** — Update expectations for new content in commands, gardener, CLAUDE.md.
