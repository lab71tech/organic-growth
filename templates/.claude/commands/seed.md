---
description: Bootstrap a new project — from DNA document or interview
---

Plant the seed for a new project.

1. Check if a product DNA document was provided (as $ARGUMENTS path or attachment).
   Also check if `docs/product-dna.md` already exists.

   **Path A — DNA exists:**
   - Read the document
   - Distill it into CLAUDE.md Product section (~10 lines: what, for whom,
     core problem, key domain concepts, current state)
   - Copy/move the full document to `docs/product-dna.md` if not already there
   - Confirm with the user: "Here's what I extracted. Anything to adjust?"

   **Path B — No DNA:**
   - Interview the user. Ask these questions ONE AT A TIME:
     - What are you building? (one sentence)
     - Who is it for? What's their context?
     - What core problem does it solve?
     - What tech stack do you want? (or: should I suggest one?)
     - Any hard constraints? (hosting, budget, compliance, language)
     - What's the priority: speed to MVP, production quality, or learning?
   - Fill in CLAUDE.md Product section from answers

2. In both paths, also fill in:
   - Tech Stack (THE SOIL): from DNA or interview + scan of existing project files
   - Priorities (LIGHT & WATER): from DNA or interview

3. Check if CLAUDE.md already has a filled Product section.
   If yes, ask: "Product context already exists. Overwrite or update?"

4. Generate `docs/growth/project-bootstrap.md` — the first growth plan:
   - Stage 1: Initialize project (build tool, dependencies, empty build passes)
   - Stage 2: Hello World endpoint/page (proves stack works end-to-end)
   - Stage 3: First domain concept with hardcoded data
   - Stage 4: Persistence (database, migration, first real data)
   - Stage 5: First real behavior with real data
   Adjust these based on the specific stack and domain from DNA/interview.

5. Ask: "Seed planted. Start growing stage 1?"

Input: $ARGUMENTS
