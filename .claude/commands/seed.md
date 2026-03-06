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
   - Invoke the brainstorming skill to explore what this project could be, before narrowing down through the interview.
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
   - Quality tools: auto-detect and fill in the Quality tools subsection based on
     the detected stack. Scan for build files (package.json, build.gradle,
     pom.xml, Cargo.toml, pyproject.toml, etc.) and infer the correct commands.
     Common stacks:
     - **Node/TS:** Build: `npm run build`, Lint: `npm run lint`, Type check: `tsc --noEmit`, Test: `npm test`, Smoke: `npm run dev` + check
     - **Gradle/Kotlin:** Build: `./gradlew build`, Lint: `./gradlew ktlintCheck`, Type check: N/A (compiled), Test: `./gradlew test`, Smoke: `./gradlew bootRun` + health check
     - **Gradle/Java:** Build: `./gradlew build`, Lint: `./gradlew checkstyleMain`, Type check: N/A (compiled), Test: `./gradlew test`, Smoke: `./gradlew bootRun` + health check
     - **Python:** Build: N/A or `pip install -e .`, Lint: `ruff check .`, Type check: `mypy .`, Test: `pytest`, Smoke: run entrypoint + check
     - **Rust:** Build: `cargo build`, Lint: `cargo clippy`, Type check: N/A (compiled), Test: `cargo test`, Smoke: `cargo run` + check
     If the stack doesn't match these, infer the best commands from the detected
     tooling and fill them in. Never leave Quality tools as placeholders.
   - Priorities (LIGHT & WATER): from DNA or interview

3. Check if CLAUDE.md already has a filled Product section.
   If yes, ask: "Product context already exists. Overwrite or update?"

4. Generate `docs/growth/project-bootstrap.md` — the first growth plan.
   Use the EXACT plan format from the gardener agent template (see the gardener's
   PLAN mode for the full template). Each stage MUST include:
   - P-numbered properties with `[invariant|transition|roundtrip|boundary]` tags
   - `Captures:` for each property (what bug it prevents)
   - `Depends on:` (properties from earlier stages)
   - `Touches:` (files/modules affected)
   - `Implementation hint:` (brief guidance)

   **Property guidelines by stage:**
   - **Stage 1 (skeleton):** Properties can be build-level (e.g., "project compiles",
     "empty test suite passes", "build tool runs without errors").
   - **Stages 2+:** Properties MUST be domain-level, following the property-planning
     skill. Express observable behavior, invariants, roundtrips, and boundaries — not
     implementation steps or specific function/class names.

   Plan content for a greenfield project:
   - Stage 1: Initialize project (build tool, dependencies, empty build passes)
   - Stage 2: Hello World endpoint/page (proves stack works end-to-end)
   - Stage 3: First domain concept with hardcoded data
   - Stage 4: Persistence (database, migration, first real data)
   - Stage 5: First real behavior with real data
   Adjust these based on the specific stack and domain from DNA/interview.

5. Create a minimal `README.md` at the project root with these sections:
   - **Project name** as heading (from the Product section)
   - **One-line description** (the "What" from Product)
   - **Installation** — commands to install dependencies based on the detected stack
   - **Usage** — how to run the project (dev server, CLI command, etc.)
   - **Development** — how to build, test, and lint (referencing the Quality tools)
   If a README.md already exists, ask the user before overwriting.

6. Confirm: "Seed planted. Run /next when you're ready to start growing stage 1."

Input: $ARGUMENTS
