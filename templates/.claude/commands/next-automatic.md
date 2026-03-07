---
description: Run multiple growth stages automatically, each in a fresh agent context
---

Run multiple growth stages in sequence, each in a fresh gardener agent invocation.
Stop on the first failure.

## Setup

1. Find the active growth plan in `.organic-growth/growth/`.
   If no plan exists, tell the user to run /grow first and stop.

2. Read the growth plan file. Count the number of stages currently
   marked with a seedling marker (the stages not yet completed).
   Store this count as `remaining_stages`.

3. Parse `$ARGUMENTS`:
   - If `$ARGUMENTS` is a positive integer, use it as `max_stages`.
   - If `$ARGUMENTS` is empty or blank, set `max_stages = remaining_stages`
     (run all remaining concrete seedling stages).
   - If `$ARGUMENTS` is not a valid positive integer, tell the user
     the argument must be a positive integer and stop.

4. If `remaining_stages` is 0, tell the user all concrete stages are
   already complete and suggest running /grow for the next feature.

## Orchestration Loop

For each iteration from 1 to `max_stages`:

### Before the stage

- Read the growth plan file.
- Identify the FIRST stage that still has a seedling marker.
  Record its stage number and title. This is the "target stage."
- If no seedling-marked stage exists, report that all stages are
  complete and exit the loop early.

### Run the stage

- Invoke the gardener agent as a subagent with the message:
  "You are in GROW mode. Implement the next stage from the active growth plan."
- Each invocation MUST be a fresh agent call (subagent), not inline
  execution in this session. This preserves the one-stage-one-context
  principle and prevents context degradation.

### After the stage

- Read the growth plan file AGAIN (it may have been modified by the gardener).
- Check whether the target stage's marker has changed from seedling to tree.
  - If YES: the stage succeeded. Log a progress line:
    `[N/max_stages] Stage <number>: <title> -- PASSED`
  - If NO: the stage failed. Log a failure line:
    `[N/max_stages] Stage <number>: <title> -- FAILED`
    Then STOP the loop immediately. Do not attempt further stages.

**Important:** Detection MUST be file-based. Read the actual growth plan
file and check the marker. Do NOT rely on parsing the agent's natural
language output to determine success or failure.

## After the loop

Report a summary:
- Total stages attempted: N
- Stages completed successfully: M
- If a failure occurred: which stage failed
- If all requested stages passed: "All stages complete."

If 3 or more stages were completed, suggest running `/review` for a
quality check and `/clear` for a fresh session.
