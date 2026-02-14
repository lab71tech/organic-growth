---
description: Create a git worktree for growing a feature in parallel
---

Create a git worktree for parallel feature growth.

If $ARGUMENTS is empty, ask: "What feature are you growing? (e.g., auth, search, onboarding)"

Once you have the feature name:

1. Derive the branch name and directory:
   - Branch: `feature/<name>` (e.g., `feature/auth`)
   - Directory: `../<repo>-<name>` (sibling to the current directory)
   - Growth plan will live at: `docs/growth/<name>.md`

2. Create the worktree:
   ```
   git worktree add -b feature/<name> ../<repo>-<name>
   ```

3. Confirm success and tell the user:
   - The worktree directory path
   - That the branch `feature/<name>` was created
   - To `cd` into the new directory
   - To run `/grow` there to start planning the feature
   - That the growth plan at `docs/growth/<name>.md` will travel with the branch

4. If the branch already exists (worktree add fails), suggest:
   ```
   git worktree add ../<repo>-<name> feature/<name>
   ```

Feature name: $ARGUMENTS
