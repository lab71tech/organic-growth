---
description: Grow the next stage from the current growth plan
---

Continue growing: implement the next stage from the active growth plan.

1. Read `AGENTS.md`, the active growth plan in `.organic-growth/growth/`, and any related completed plans.

2. Find the next `🌱` stage.
   - If no plan exists, tell the user to run `/grow` first.
   - If all stages are complete, say so and suggest what might grow next.

3. If this is stage 3, 6, 9, or later, re-evaluate the remaining stages before implementing.
   Update the plan if reality has changed.

4. Implement only this stage.
   - Treat the stage properties as acceptance criteria.
   - Write or update tests first so each property is encoded explicitly.
   - Then write the minimum code needed to pass the new and inherited properties.

5. Run the quality gate and fix failures within the same stage:
   - Build
   - Lint
   - Type check
   - Full test suite
   - Smoke check

6. Self-review before committing:
   - this stage only
   - no work smuggled in from future stages
   - earlier properties still hold
   - implementation still matches the properties

7. Update project state files.
   - Mark the stage as `🌳` in the growth plan.
   - Add a Growth Log entry for this stage.
   - Update `.organic-growth/growth-map.md` if it exists.
   - Add new domain concepts to `.organic-growth/product-dna.md` if introduced.
   - Update `README.md` to reflect the current working system.
   - Update `AGENTS.md` Current state when the milestone meaningfully changed.

8. Commit with:
   ```
   feat(scope): stage N — <what grew>

   Growth plan: .organic-growth/growth/<feature>.md
   ```

9. Report what grew, what properties were verified, what commands you ran, and what should happen next.
