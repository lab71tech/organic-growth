# Project Context

## Product

**What:** [One sentence. What is this product?]
**For whom:** [Who uses it? What's their context?]
**Core problem:** [What pain does it solve?]
**Key domain concepts:** [3-7 terms that someone new needs to understand]
**Current state:** [Greenfield / MVP exists / Production system]

## Tech Stack

- [Any non-standard commands, frameworks, or conventions]
- [Hard constraints, e.g.: "no ORM", "must use PostgreSQL"]

### Quality tools

- **Build:** [e.g.: `npm run build` or N/A]
- **Lint:** [e.g.: `npm run lint` or N/A]
- **Type check:** [e.g.: `tsc --noEmit` or N/A]
- **Test:** [e.g.: `npm test`]
- **Smoke:** [e.g.: `curl http://localhost:8080/health`]

## Priorities

- [e.g.: "MVP speed over production polish"]
- [e.g.: "Security is non-negotiable, even for MVP"]

---

# Development Philosophy: Organic Growth

Every feature is grown in stages from seed to maturity.
Each stage produces a complete, working system — not a partial one.
A seedling is a whole plant, not 10% of a tree.

## How to Work With Me

When I ask you to implement a feature or make changes, follow these principles:

### 1. One change at a time
- Each change should have a single purpose
- Each change should have at least one test proving it works
- The app builds, tests pass, and runs after every change
- Do not bundle unrelated changes together

### 2. Vertical, not horizontal
- Each change touches all layers needed (API + service + DB + test)
- No "build all the backend first, then the frontend"
- Early stages can return hardcoded values — that's natural
- Growth: hardcoded → configurable → dynamic → optimized

### 3. Quality gate after every change
- Build must pass
- Linter must pass (zero new warnings)
- Type check must pass (if applicable)
- ALL tests must pass (not just new ones)
- App must start (health check / smoke test)
- Fix all failures before moving on — don't carry debt forward

### 4. Keep it simple
- Only make changes that are directly requested or clearly necessary
- Don't add features, refactor code, or make "improvements" beyond what was asked
- Don't add error handling or validation for scenarios that can't happen
- Three similar lines of code is better than a premature abstraction

## Growth Plans

This project uses rolling growth plans stored in `docs/growth/<feature>.md`.
Each plan has 3-5 concrete next stages and a rough horizon of what comes after.
When working on a feature, check the growth plan for context on what stage we're at.

### Growth plan format
- **⬜** = not started
- **✅** = completed
- Each stage has: description, intent, verification criteria

## Commit Convention

```
feat(scope): stage N — <what grew>

Growth plan: docs/growth/<feature>.md
```
