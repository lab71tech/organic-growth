---
description: Re-evaluate the growth plan when reality changes
---

Something changed. Re-evaluate the active growth plan from current state.

1. Find the active plan in `.organic-growth/growth/`.
   If no active plan exists, tell the user to run `/grow` first.

2. Read `AGENTS.md`, the active growth plan, related completed plans, and the current codebase.

3. Use `$ARGUMENTS` as the reason for replanning.
   If no reason is given, ask: `What changed?`

4. Preserve completed stages unless there is an explicit reason to invalidate them.
   If a previous property must be broken, record it in `Breaks:` with the reason.

5. Rewrite only the remaining stages and horizon so they reflect current reality.
   Keep properties first, implementation hints second.

6. Update `.organic-growth/growth-map.md` if the capability ordering or dependencies changed.

7. Present the updated plan and explain the delta from the previous one.
