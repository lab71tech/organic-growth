# Feature: Task Completion
Created: 2026-01-15
Status: 🌱 Growing

## Seed (what & why)

Add the ability to mark tasks as complete in the todo CLI. Currently users can add and list tasks, but there's no way to mark them done. This is the core workflow gap — without completion, the task list only grows.

## Growth Stages

### Concrete (next 3-5 stages, detailed)

- ✅ Stage 1: Complete a task by index
  - Intent: Add a `done <index>` command that marks a task as completed in the JSON store
  - Properties:
    - P1: Completing a valid index sets that task's `completed` field to `true` [transition]
      Captures: Task marked done in memory but not persisted to disk
    - P2: Completing an already-completed task is a no-op (no error, no state change) [boundary]
      Captures: Double-completion corrupting state or crashing
    - P3: Completing an out-of-range index prints an error and exits non-zero [boundary]
      Captures: Silent failure on invalid input — user thinks task was completed
    - P4: The task list preserves insertion order after completion [invariant]
      Captures: Completion reordering tasks, breaking user's mental model
  - Depends on: none (first stage)
  - Touches: `src/commands/done.mjs`, `src/store.mjs`, `test/done.test.mjs`
  - Done: Added `done` command with index validation. Tasks persist to JSON. All 12 tests pass.

- ✅ Stage 2: Show completion status in task list
  - Intent: Update `list` command to display a checkmark next to completed tasks and show a summary count
  - Properties:
    - P5: Completed tasks display with a checkmark prefix, pending tasks with an empty box [invariant]
      Captures: No visual distinction — user can't tell what's done
    - P6: Summary line shows "N/M tasks completed" matching actual completed count [invariant]
      Captures: Summary count drifting from actual state — off-by-one or stale cache
    - P7: List with zero tasks prints "No tasks yet" instead of empty output [boundary]
      Captures: Blank terminal output — user unsure if command worked
  - Depends on: P1, P4
  - Touches: `src/commands/list.mjs`, `test/list.test.mjs`
  - Done: List shows checkmarks and summary. Handles empty state. All 18 tests pass.

- ⬜ Stage 3: Undo completion
  - Intent: Add an `undo <index>` command that marks a completed task as pending again
  - Properties:
    - P8: Undoing a completed task sets `completed` to `false` and persists [roundtrip]
      Captures: One-way state transitions — completion is irreversible, users can't fix mistakes
    - P9: Complete then undo returns task to its original state (roundtrip: add -> done -> undo = add) [roundtrip]
      Captures: Undo introducing side effects — timestamp changes, order shifts, field mutations
    - P10: Undoing an already-pending task is a no-op [boundary]
      Captures: Double-undo crashing or corrupting state, mirroring P2
  - Depends on: P1, P2, P4, P6

- ⬜ Stage 4: Filter list by completion status
  - Intent: Add `list --done` and `list --pending` flags to show only completed or pending tasks
  - Properties:
    - P11: `list --done` shows only tasks where `completed` is `true` [invariant]
      Captures: Filter showing wrong subset — logic inversion or off-by-one
    - P12: `list --done` count plus `list --pending` count equals `list` total count [invariant]
      Captures: Tasks lost or duplicated by filtering — partition doesn't sum to whole
    - P13: Flags are mutually exclusive — using both prints an error [boundary]
      Captures: Ambiguous behavior when both flags used — undefined output
  - Depends on: P1, P5, P6, P7

### Horizon (rough outline of what comes after)
- Bulk completion (`done --all`, `done 1,3,5`)
- Completion timestamps for tracking when tasks were finished
- Archive completed tasks to separate storage after N days

## Growth Log
- 2026-01-15: Stage 1 complete. `done <index>` command working with persistence, validation, and idempotency. 12 tests pass.
- 2026-01-15: Stage 2 complete. List shows checkmarks and "N/M completed" summary. Empty state handled. 18 tests pass.
