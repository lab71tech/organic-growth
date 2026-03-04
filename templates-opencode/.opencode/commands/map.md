---
description: View or update the growth map — your system's big picture
---

Show or adjust the growth map.

1. If `.organic-growth/growth-map.md` does not exist:
   - Check if product DNA or AGENTS.md has enough context to draft one
   - If yes: generate a draft and present it for review
   - If no: tell the user to run /seed first or describe the system

2. If map exists and no $ARGUMENTS:
   - Display current map with status summary:
     `🌳 X complete | 🌱 Y growing | ⬜ Z planned | 💡 W candidates`
   - Suggest next capability based on sequence

3. If $ARGUMENTS contains a change request
   (e.g., "move invoicing before approval"):
   - Apply the change
   - Verify whether the new order still makes sense
   - Present the updated map with explanation

Input: $ARGUMENTS
