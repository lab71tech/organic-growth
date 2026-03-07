---
description: Plant the seed for a project — from DNA document or interview
---

Plant the seed for a project.

0. Detect whether this is an existing project.
   Scan project root for existing code (`src/`, `lib/`, `app/`, `package.json`, `build.gradle`, `Cargo.toml`, `go.mod`, `pyproject.toml`, `pom.xml`, `README.md`, etc.).

   - If code or build files already exist -> `EXISTING = true`
   - If the project root is empty or contains only config files -> `EXISTING = false`

   When `EXISTING = true`, inspect the repo and extract:
   - build, lint, typecheck, test, and smoke commands
   - major frameworks and language/runtime versions
   - product context from `README.md`, docs, or recent commits

   Populate the Quality Tools section of `AGENTS.md` with exact commands.
   Present the discovered stack and tools to the user for confirmation before writing them.

1. Check for a product DNA document from `$ARGUMENTS` or `.organic-growth/product-dna.md`.

   Path A — DNA exists:
   - Read it.
   - Distill it into the Product section of `AGENTS.md`.
   - Normalize it into `.organic-growth/product-dna.md`.
   - Fill `AGENTS.md` Product, Tech Stack, and Priorities sections from the DNA plus the project scan from Step 0.
   - Populate the Quality Tools section with exact build, lint, typecheck, test, and smoke commands discovered from the repo.
   - If the DNA omits stack or priority details, ask only the minimum follow-up needed to avoid placeholders.
   - If business rules are missing, ask: "Any rules that must ALWAYS hold?"
   - Confirm the extracted summary with the user.

   Path B1 — existing project, no DNA:
   - Present discovered project context first.
   - Ask only gap-filling questions, one at a time:
     - What core problem does this project solve?
     - What business rules must ALWAYS be true?
     - What are the current priorities?
     - Any hard constraints?
   - Generate `.organic-growth/product-dna.md` using the structured template.
   - Fill `AGENTS.md` Product, Tech Stack, and Priorities sections from discoveries plus answers.

   Path B2 — greenfield, no DNA:
   - Ask one question at a time:
     - What are you building?
     - Who is it for?
     - What core problem does it solve?
     - What tech stack do you want?
     - Any hard constraints?
     - What matters most right now?
     - What user roles exist?
     - What business rules must ALWAYS be true?
     - What is the main process flow?
   - Generate `.organic-growth/product-dna.md`.
   - Fill `AGENTS.md` Product, Tech Stack, and Priorities sections.

2. In all paths, leave `AGENTS.md` with concrete Product, Tech Stack, Priorities, and Quality Tools entries, not placeholders.

3. If `AGENTS.md` already has real product context, ask whether to overwrite or update it.

4. For greenfield projects only, generate `.organic-growth/growth/project-bootstrap.md` with 3-5 concrete stages and a short horizon.
   Follow the greenfield pattern in `AGENTS.md`.

5. For greenfield projects only, generate `.organic-growth/growth-map.md` if the product has at least 4 distinct capabilities.

6. Present a summary of what was created.

7. Finish with exactly one of:
   - Existing project: `Seed planted. Run /grow when you're ready to plan your first feature.`
   - Greenfield project: `Seed planted. Review the files above, then run /next when you're ready to grow stage 1.`
