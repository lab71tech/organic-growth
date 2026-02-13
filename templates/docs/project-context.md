# Project Context

This is the single source of truth for your project's identity.
All AI tool configurations (Claude Code, GitHub Copilot, etc.) read from this file.

Edit this file, then run `npx organic-growth sync` to update tool configs.

## Product

**What:** [One sentence. What is this product?]
**For whom:** [Who uses it? What's their context?]
**Core problem:** [What pain does it solve?]
**Key domain concepts:** [3-7 terms that someone new needs to understand]
**Current state:** [Greenfield / MVP exists / Production system]
**Full DNA:** [docs/product-dna.md if exists, otherwise "N/A"]

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
