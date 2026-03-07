---
description: Run multiple growth stages automatically from the active plan
---

Run multiple growth stages in sequence. Stop on the first failure.

1. Find the active growth plan in `.organic-growth/growth/`.
   If no plan exists, tell the user to run `/grow` first and stop.

2. Count the remaining concrete stages marked with `🌱`.

3. Parse `$ARGUMENTS`.
   - If it is a positive integer, use it as the maximum number of stages to run.
   - If it is empty, run all remaining concrete stages.
   - Otherwise, tell the user the argument must be a positive integer and stop.

4. For each stage:
   - re-read `AGENTS.md` and the growth plan from disk
   - identify the first remaining `🌱` stage
   - execute the full `/next` workflow for exactly that stage
   - re-read the plan and verify the stage changed from `🌱` to `🌳`
   - if verification fails, stop immediately

5. After the loop, report:
   - stages attempted
   - stages completed
   - first failure, if any
   - whether all requested stages completed

6. If 3 or more stages completed, suggest running `/review` and starting a fresh Codex session.
