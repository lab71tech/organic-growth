---
description: Deep quality review of recent growth stages (fresh context, no implementation bias)
---

Review code quality of recent stages. Run this after several stages
or before merging — it provides a second opinion with zero bias from
the implementation session.

1. Determine scope:
   - If $ARGUMENTS contains a number (e.g., `/review 3`): review last N stages
   - If $ARGUMENTS contains a feature name: review that feature's stages
   - Default: review all stages since last review (or last 5, whichever is smaller)

2. Read the growth plan to understand intent of each reviewed stage.

3. For each stage in scope, examine the git diff and review for:

   **Correctness:**
   - Does the code actually do what the stage intended?
   - Are there logic errors, off-by-one, null cases?
   - Do the tests test the right thing? (not just "test exists")

   **Consistency:**
   - Does new code follow the same patterns as existing code?
   - Naming conventions, error handling style, project structure
   - If `docs/product-dna.md` exists: do domain terms match?

   **Simplicity:**
   - Is anything over-engineered for the current stage?
   - Code that belongs in future stages?
   - Unnecessary abstractions or premature optimization?

   **Security basics:**
   - SQL injection, XSS, hardcoded secrets
   - Auth/authz gaps if relevant
   - Input validation

   **Test quality:**
   - Do tests break if the feature is removed? (vs always-green tests)
   - Are edge cases covered?
   - Test readability — can someone understand intent from the test?

4. Output a review report (use the requesting-code-review skill to structure findings):

   ```
   ## Review: <feature> — stages N-M

   ### 🟢 Good
   - <what's well done — be specific>

   ### 🟡 Suggestions
   - <improvements, not blockers>
   - <file:line — what to consider>

   ### 🔴 Issues
   - <things that should be fixed before continuing>
   - <file:line — what's wrong and why>

   ### Verdict: ✅ Continue / ⚠️ Fix before next stage / 🔴 Stop and address
   ```

5. If there are 🔴 Issues, use the receiving-code-review skill to process findings with technical rigor, then offer to fix them now.

Scope: $ARGUMENTS
