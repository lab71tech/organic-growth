---
description: Plan and start growing a new feature from seed
---

Grow a new feature using the Organic Growth approach.

1. Read `AGENTS.md` first.
   - If the Product section is still placeholders or empty, stop and tell the user to run `/seed` first.

2. Read `.organic-growth/product-dna.md` and `.organic-growth/growth-map.md` if they exist.
   - Treat business rules and completed capabilities as constraints.
   - Search `.organic-growth/growth/` for related plans by capability tag when needed.

3. Explore the current codebase so the plan reflects reality, not assumptions.

4. Briefly reason through the problem space for `$ARGUMENTS`:
   - 2-3 possible approaches
   - riskiest assumption
   - likely failure points
   Keep this internal. Do not create separate artifacts.

5. Ask the user 2-3 clarifying questions at most.
   Focus on acceptance criteria, constraints, and the riskiest part.

6. Create `.organic-growth/growth/<feature-name>.md` with:
   - `Status: 🌱 Growing`
   - 3-7 capability tags
   - a one-paragraph Seed section
   - 3-5 concrete stages
   - a short horizon
   - a Growth Log section

7. For every concrete stage, define properties before implementation hints.
   Consider invariants, state transitions, roundtrips, and boundaries.
   Properties must express domain rules, not implementation details.

8. Self-check the plan before presenting it:
   - completeness
   - independence from implementation
   - property accumulation across stages
   - boundary coverage where meaningful

9. If `.organic-growth/growth-map.md` exists, update it:
   - mark matching capabilities as `🌱`
   - add the plan link
   - insert new capabilities in the best-fit section when missing

10. Present the plan for review.
    Focus the user on reviewing properties, not implementation hints.

11. Stop after the plan is approved.
    Do not implement stage 1.
    Say exactly: `Plan ready. Run /next when you're ready to grow stage 1.`
