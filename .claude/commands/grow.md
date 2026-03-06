---
description: Plan and start growing a new feature from seed
---

Grow a new feature using the Organic Growth approach.

1. Before planning, briefly explore the problem space for: $ARGUMENTS
   - What are 2-3 possible approaches?
   - What is the riskiest assumption?
   - What could fail or be harder than expected?
   Think through this internally. Do not create separate brainstorming artifacts.
2. Use the gardener agent in PLAN mode
3. Feature to grow: $ARGUMENTS
4. If `.organic-growth/growth-map.md` exists:
   - If capability exists on the map: set status to 🌱 and add plan link
   - If missing: add it in the best-fit section and note it was unplanned
   - If this modifies a 🌳 capability: add as a sub-entry under the parent capability
5. When reviewing the plan, focus on PROPERTIES (not implementation hints) —
   these are the primary quality gate. Ask yourself:
   - Are the properties complete? Could someone implement this WRONG
     and still pass all properties?
   - Are properties from earlier stages preserved in later ones?
   - Do properties express domain rules, not implementation details?
6. After the plan is created and approved, STOP here.
   Do NOT start implementing stage 1.
   Say: "Plan ready. Run `/next` when you're ready to grow stage 1."
