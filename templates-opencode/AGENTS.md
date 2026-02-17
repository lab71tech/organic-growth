# Project Context

## Product (THE SEED — fill this in)

<!-- Without this section, the agent grows weeds. Be brief but specific. -->
<!-- If you have a full product document, put it in docs/product-dna.md -->
<!-- This section is the distilled version — what the agent sees always. -->
<!-- The DNA document is read only during planning (/grow, /replan). -->

**What:** [One sentence. What is this product?]
**For whom:** [Who uses it? What's their context?]
**Core problem:** [What pain does it solve?]
**Key domain concepts:** [3-7 terms that someone new needs to understand]
**Current state:** [Greenfield / MVP exists / Production system]
**Full DNA:** [docs/product-dna.md if exists, otherwise "N/A"]

## Tech Stack (THE SOIL — auto-discovered, but document the non-obvious)

<!-- opencode reads your build files. Only add what it CAN'T discover. -->

- [Any non-standard commands, e.g.: `./gradlew test --profile staging`]
- [Unusual conventions, e.g.: "endpoint names in Polish"]
- [Hard constraints, e.g.: "no Lombok", "Flyway not Liquibase"]

### Quality tools (fill in for your project)

<!-- Gardener runs these after every stage. List the exact commands. -->

- **Build:** [e.g.: `./gradlew build` or `npm run build`]
- **Lint:** [e.g.: `./gradlew ktlintCheck` or `npm run lint`]
- **Type check:** [e.g.: `tsc --noEmit` or N/A for dynamic languages]
- **Test:** [e.g.: `./gradlew test` or `npm test`]
- **Smoke:** [e.g.: `curl http://localhost:8080/health` or `npm run dev` + check]

## Priorities (LIGHT & WATER — what matters now)

<!-- This changes. Update it when priorities shift. -->

- [e.g.: "MVP speed over production polish"]
- [e.g.: "Must work offline first"]
- [e.g.: "Security is non-negotiable, even for MVP"]

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
