---
name: quality-gates
description: >
  Guides quality gate discipline after every growth stage. Trigger when
  running quality checks, handling failures, or configuring quality tools.
---

# Quality Gates

Every stage must pass all quality gates before it is committed.
No debt is carried forward -- fix it now, in this stage.

## Configuring Quality Tools in AGENTS.md

Define your quality commands in the **Quality tools** section of
AGENTS.md so the gardener agent can run them automatically:

```markdown
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Type check:** `tsc --noEmit`
- **Test:** `npm test`
- **Smoke:** `npm run dev` + check
```

Replace placeholders like `[e.g.: ...]` with your actual commands.
Leave a tool as N/A if it doesn't apply (e.g., Type check for Python).

## Gate Sequence

Run gates in this order after every stage:

1. **Build** -- does the project compile/bundle without errors?
2. **Lint** -- zero new warnings, zero errors
3. **Type check** -- no type errors (if applicable)
4. **Test** -- ALL tests pass, not just the new ones
5. **Smoke** -- the app starts and responds to a basic request

## Common Failure Patterns

| Failure | Typical Fix |
|---------|-------------|
| New lint warnings | Fix them now, don't suppress |
| Broken existing test | Your change has a side effect -- fix it |
| Type error in unrelated file | Your change exposed it -- fix it |
| Build fails | Missing import, circular dependency |
| Smoke test hangs | Check for blocking startup, missing env |

## Fix It Now

When a gate fails:

1. **Don't skip the gate** -- the failure is real feedback
2. **Don't carry the debt forward** to a future stage
3. **Fix within the current stage** -- adjust scope if needed
4. If the fix is large, **shrink the stage** instead of growing it

## When to Adjust Stage Scope

If fixing a gate failure would make the stage too large:

- Remove the part causing the failure from this stage
- Commit the smaller, passing version
- Plan the removed part as the next stage

The rule is: every commit leaves the system in a working state.
