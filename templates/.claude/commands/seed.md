---
description: Plant the seed for a project — from DNA document or interview
---

Plant the seed for a project.

0. **Detect existing project.**
   Scan project root for existing code (`src/`, `lib/`, `app/`, `package.json`, `build.gradle`, `Cargo.toml`, `go.mod`, `pyproject.toml`, `pom.xml`, `README.md`, etc.).

   - If code or build files already exist → **EXISTING = true**
   - If the project root is empty or contains only config files → **EXISTING = false**

   When EXISTING = true, scan these files and extract the noted information:

   **Auto-discovery checklist:**
   - `package.json` → scripts (build, test, lint, start), engines, dependencies and devDependencies for stack detection (e.g., react, express, typescript)
   - `build.gradle` / `build.gradle.kts` → plugins (java, kotlin, spring-boot), tasks (test, check, ktlintCheck), dependencies for framework detection
   - `pyproject.toml` → build-system, project.scripts, dependencies, optional-dependencies, tool sections (pytest, ruff, mypy, black)
   - `Cargo.toml` → edition, dependencies, dev-dependencies, workspace members, features
   - `go.mod` → go version, module path, require directives for framework detection (gin, echo, fiber)
   - `pom.xml` → plugins, parent (spring-boot-starter-parent), dependencies, build configuration
   - `Makefile` → target names (build, test, lint, check, fmt, run) and the commands they execute
   - `README.md` → project description, setup/install instructions, usage examples for product context
   - `.github/workflows/*.yml` → build/test/lint commands used in CI steps, language versions in matrix
   - `.gitlab-ci.yml` → build/test/lint commands used in CI stages, image versions

   From the discovered files, populate the **Quality Tools** section of CLAUDE.md with the exact commands for:
   - **Build:** (e.g., `npm run build`, `./gradlew build`, `cargo build`)
   - **Lint:** (e.g., `npm run lint`, `./gradlew ktlintCheck`, `cargo clippy`)
   - **Type check:** (e.g., `tsc --noEmit`, or N/A)
   - **Test:** (e.g., `npm test`, `./gradlew test`, `cargo test`)
   - **Smoke:** (e.g., `npm start`, `./gradlew bootRun`, or a health endpoint)

   Present the discovered tech stack and quality tools to the user for confirmation before writing them.

   Also:
   - Adjust interview: skip "what tech stack?" and "what are you building?"
   - Ask instead: "what change do you want to make?" and "any constraints?"
   - Check recent git commits and ask whether to follow existing commit convention

1. Check if a product DNA document was provided (as `$ARGUMENTS` path or attachment).
   Also check if `.organic-growth/product-dna.md` already exists.

   **Path A — DNA exists:**
   - Read the document
   - Distill it into CLAUDE.md Product section (~10 lines: what, for whom,
     core problem, key domain concepts, current state)
   - Map content into the structured DNA format and store in
     `.organic-growth/product-dna.md`
   - If Business Rules are missing, ask: "Any rules that must ALWAYS hold?"
   - Confirm with the user: "Here's what I extracted. Anything to adjust?"

   **Path B1 — Existing project, no DNA (EXISTING = true):**
   - Present what you discovered in Step 0 to the user:
     "Here's what I discovered about your project:" followed by a summary of
     the tech stack, quality tools, and any product context from README.md.
   - Ask the user to confirm or adjust what was discovered.
   - Then ask only gap-filling questions ONE AT A TIME (skip any already
     answered by the discoveries):
     - What core problem does this project solve?
     - What business rules must ALWAYS be true?
     - What are the current priorities? (e.g., new feature, refactor, stabilize)
     - Any hard constraints? (performance, compliance, deployment, backwards compatibility)
   - Generate `.organic-growth/product-dna.md` using the structured template.
     Leave missing sections as `<!-- to be filled -->`.
   - Fill in CLAUDE.md Product section from discoveries + answers.

   **Path B2 — Greenfield, no DNA (EXISTING = false):**
   - Before the interview, briefly consider what this project could be:
     what kind of system, likely domain risks, and which questions matter most.
     Do not create separate brainstorming artifacts.
   - Interview the user. Ask these questions ONE AT A TIME:
     - What are you building? (one sentence)
     - Who is it for? What's their context?
     - What core problem does it solve?
     - What tech stack do you want? (or: should I suggest one?)
     - Any hard constraints? (hosting, budget, compliance, language)
     - What's the priority: speed to MVP, production quality, or learning?
     - What are the main user roles? What can each do?
     - What business rules must ALWAYS be true?
     - What's the main process flow? (e.g. browse -> cart -> order -> approval -> invoice)
   - Generate `.organic-growth/product-dna.md` using the structured template.
     Leave missing sections as `<!-- to be filled -->`.
   - Fill in CLAUDE.md Product section from answers.

2. In both paths, also fill in:
   - Tech Stack (THE SOIL): from DNA/interview + scan of existing project files
   - Priorities (LIGHT & WATER): from DNA/interview

3. Check if CLAUDE.md already has a filled Product section.
   If yes, ask: "Product context already exists. Overwrite or update?"

4. Generate `.organic-growth/growth/project-bootstrap.md` — the first growth plan:
   - Stage 1: Initialize project (build tool, dependencies, empty build passes)
   - Stage 2: Hello World endpoint/page (proves stack works end-to-end)
   - Stage 3: First domain concept with hardcoded data
   - Stage 4: Persistence (database, migration, first real data)
   - Stage 5: First real behavior with real data
   - Include `Capabilities:` tags in the plan header

5. If the project has 4+ distinct capabilities (from DNA/interview),
   generate `.organic-growth/growth-map.md` draft:
   - Organize sequence into Walking Skeleton and what follows
   - Add short "Why This Order"
   - Mark `project-bootstrap` as 🌱
   - Present as aspirational, not a commitment

6. Present a summary of what was created:
   - Product DNA (`.organic-growth/product-dna.md`)
   - CLAUDE.md Product/Tech Stack/Priorities sections
   - Growth plan (`.organic-growth/growth/project-bootstrap.md`)
   - Growth map (`.organic-growth/growth-map.md`, if generated)

7. **MANDATORY STOP — THIS IS NON-NEGOTIABLE.**
   Your job ends here. You have planted the seed. You do NOT grow it.

   - Do NOT implement any stage.
   - Do NOT write source code, tests, or application files.
   - Do NOT run build/lint/test commands.
   - Do NOT create src/, lib/, app/, or any implementation directories.
   - Do NOT commit anything beyond the seed files created above.

   The ONLY files you create are:
   - `.organic-growth/product-dna.md`
   - `.organic-growth/growth/project-bootstrap.md`
   - `.organic-growth/growth-map.md` (if applicable)
   - `CLAUDE.md` (fill in Product/Tech Stack/Priorities sections)

   Say exactly:
   "Seed planted. Review the files above, then run `/next` when you're ready to grow stage 1."

   Then STOP. Do not continue. Do not offer to implement. Wait for the user.

Input: $ARGUMENTS
