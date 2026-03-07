# Project Context

## Product (THE SEED)

**What:** A CLI tool and template system that installs an incremental development workflow (agents, commands, hooks, skills) into any project using Claude Code or opencode.
**For whom:** Developers using AI-assisted coding who want structured, reviewable, incremental feature growth instead of monolithic changes.
**Core problem:** AI coding agents produce large, hard-to-review changes. Organic Growth constrains the agent into small vertical stages with properties-first planning and quality gates, so every commit is a working system.
**Key domain concepts:** Growth Stage, Property (invariant rule), Growth Plan, Product DNA, Growth Map, Gardener Agent, Quality Gate, Context Hygiene
**Current state:** Production — published on npm v3.x with CI/CD pipeline
**Full DNA:** .organic-growth/product-dna.md

## Tech Stack (THE SOIL)

- Node.js >= 20, zero runtime dependencies
- CLI entry point: `bin/cli.mjs` (pure ESM)
- Templates copied to target projects — no transpilation, no bundling
- Supports both Claude Code (`.claude/`) and opencode (`.opencode/`) template sets
- Tests use Node's built-in test runner (`node:test` + `node:assert/strict`)
- Published to npm with provenance; works with both `npx` and `bunx`

### Quality tools

- **Build:** N/A (no build step — plain JS)
- **Lint:** N/A
- **Type check:** N/A (plain JavaScript)
- **Test:** `node --test`
- **Smoke:** `node bin/cli.mjs --help` and `node bin/cli.mjs --version`

## Priorities (LIGHT & WATER — what matters now)

- Zero dependencies — the CLI must remain dependency-free
- Upgrade safety — `--upgrade` must never overwrite user-customized files
- Template quality — commands, agents, and skills are the core product; they must produce excellent growth plans
- Dual-platform parity — Claude Code and opencode templates should offer equivalent functionality

---

# Development Philosophy: Organic Growth

Every feature is grown in stages from seed to maturity.
Each stage produces a complete, working system — not a partial one.
A seedling is a whole plant, not 10% of a tree.

## Growth Rules

1. **One stage = one intent = one commit**
   - Each stage has a single purpose
   - Each stage defines properties (rules that must be true) before implementation
   - Properties become tests — write tests first, then code to pass them
   - Each stage is committed separately with a clear message
   - The app builds, tests pass, and runs after every stage

2. **Rolling plan: 3-5 stages ahead**
   - Never plan more than 5 concrete stages ahead
   - Keep a rough outline of what comes after, but expect it to change
   - Re-evaluate the plan every 3 stages or when something unexpected happens
   - Update `.organic-growth/growth/<feature>.md` after every stage

3. **Vertical, not horizontal**
   - Each stage touches all layers needed (API + service + DB + test)
   - No "build all the backend first, then the frontend"
   - Early stages can return hardcoded values — that's natural
   - Growth: hardcoded -> configurable -> dynamic -> optimized

4. **Context hygiene**
   - Start a fresh session every 3 stages
   - The growth plan in `.organic-growth/growth/` is the continuity mechanism
   - After `/clear`, run `/next` — the agent reads the plan and continues

5. **Quality gate after every stage**
   - Build must pass
   - Linter must pass (zero new warnings)
   - Type check must pass (if applicable)
   - ALL tests must pass (not just new ones)
   - App must start (health check / smoke test)
   - Fix all failures within the stage — don't carry debt forward

6. **Deep review on demand**
   - Run `/review` after every 3-5 stages or before merging
   - Reviews run with fresh context (no implementation bias)
   - Check: correctness, consistency, simplicity, security, test quality
   - Fix 🔴 issues before continuing growth

## Growth Stage Patterns

For **greenfield** projects, first stages always follow this pattern:
1. Empty project with passing build
2. Hello World endpoint/page (proves the stack works end-to-end)
3. First real domain concept with hardcoded data
4. Persistence (database, migration, repository)
5. First real behavior with real data

For **existing** projects, first stages are:
1. The simplest possible version of the new behavior (even hardcoded)
2. Connect it to existing data/services
3. Add the real logic incrementally

## Commit Convention

```
feat(scope): stage N — <what grew>

Growth plan: .organic-growth/growth/<feature>.md
```

## Growth Plan Location

All plans live in `.organic-growth/growth/<feature-name>.md`.
Product DNA lives in `.organic-growth/product-dna.md`.
Growth map lives in `.organic-growth/growth-map.md` (if exists).
Format documented in the gardener agent.
