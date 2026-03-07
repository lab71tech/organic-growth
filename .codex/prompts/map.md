---
description: View or update the growth map — your system's big picture
---

Show or adjust the growth map.

1. If `.organic-growth/growth-map.md` does not exist:
   - Check whether `AGENTS.md` or `.organic-growth/product-dna.md` has enough context to draft one.
   - If yes, generate a draft and present it for review.
   - If no, tell the user to run `/seed` first or describe the system.

2. If the map exists and `$ARGUMENTS` is empty:
   - show the current map
   - summarize statuses as `🌳 complete | 🌱 growing | ⬜ planned | 💡 candidates`
   - suggest the next capability based on sequence and dependencies

3. If `$ARGUMENTS` requests a change:
   - update the map
   - verify the new order still makes sense given completed plans and dependencies
   - explain the reasoning behind the change

Input: $ARGUMENTS
