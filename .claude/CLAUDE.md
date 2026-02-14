# Project Context

## Product (THE SEED — fill this in)

<!-- Without this section, the agent grows weeds. Be brief but specific. -->
<!-- If you have a full product document, put it in docs/product-dna.md -->
<!-- This section is the distilled version — what the agent sees always. -->
<!-- The DNA document is read only during planning (/grow, /replan). -->

**What:** An npm package that installs Claude Code configuration for incremental software development using thin vertical slices.
**For whom:** Developers using Claude Code who want structured, controlled workflow instead of autonomous coding.
**Core problem:** Claude Code without structure produces sprawling changes, lost context, and no checkpoints. Developers need methodology that works with LLM limitations.
**Key domain concepts:** Growth stage, gardener agent, rolling plan, DNA document, quality gate, context hygiene, vertical slice
**Current state:** v1.0.1 — Post-MVP, infrastructure mature (CLI, full CI/CD, automated releases, dependabot, 61 tests)
**Full DNA:** docs/product-dna.md

## Tech Stack (THE SOIL — auto-discovered, but document the non-obvious)

<!-- Claude Code reads your build files. Only add what it CAN'T discover. -->

- Node.js CLI (`bin/cli.mjs`) — zero runtime dependencies, pure Node.js
- Templates in `templates/.claude/` — plain markdown, no templating engine
- Published to npm, invoked via `bunx organic-growth` or `npx organic-growth`
- Hard constraints: zero deps, single executable, bun + npm compat, package <50KB

### Quality tools (fill in for your project)

<!-- Gardener runs these after every stage. List the exact commands. -->

- **Build:** N/A (no build step, plain JS)
- **Lint:** N/A (not configured yet)
- **Type check:** N/A (plain JavaScript)
- **Test:** `node --test`
- **Smoke:** `node bin/cli.mjs --force` in a temp directory

## Priorities (LIGHT & WATER — what matters now)

<!-- This changes. Update it when priorities shift. -->

- Correctness of templates (gardener instructions, command definitions)
- Developer experience (clear README, easy install, helpful CLI output)
- Simplicity (resist adding features — one agent, five commands, that's it)

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
   - Update `docs/growth/<feature>.md` after every stage

3. **Vertical, not horizontal**
   - Each stage touches all layers needed (API + service + DB + test)
   - No "build all the backend first, then the frontend"
   - Early stages can return hardcoded values — that's natural
   - Growth: hardcoded → configurable → dynamic → optimized

4. **Context hygiene**
   - Start a fresh session every 3 stages
   - The growth plan in `docs/growth/` is the continuity mechanism
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

Growth plan: docs/growth/<feature>.md
```

## Growth Plan Location

All plans live in `docs/growth/<feature-name>.md`.
Format documented in the gardener agent.
