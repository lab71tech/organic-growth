---
description: Create a git worktree for growing a feature in parallel
---

Create a git worktree for parallel feature growth.

If $ARGUMENTS is empty, ask: "What feature are you growing? (e.g., auth, search, onboarding)"

Once you have the feature name:

1. Derive the branch name and directory:
   - Branch: `<name>` (matches `docs/growth/<name>.md` for traceability)
   - Directory: `../<current-dir-basename>-<name>` (sibling to the current directory, derived from `basename "$PWD"`)
   - Growth plan will live at: `docs/growth/<name>.md`

2. Create the worktree:
   ```
   git worktree add -b <name> ../<current-dir-basename>-<name>
   ```

3. Confirm success and tell the user:
   - The worktree directory path
   - That the branch `<name>` was created
   - To `cd` into the new directory
   - To run `/grow` there to start planning the feature
   - That the growth plan at `docs/growth/<name>.md` will travel with the branch

4. If the branch already exists (worktree add fails), suggest:
   ```
   git worktree add ../<current-dir-basename>-<name> <name>
   ```

Feature name: $ARGUMENTS
