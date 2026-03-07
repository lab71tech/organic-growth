# Feature: next-automatic
Created: 2026-03-07
Status: Growing
Capabilities: multi-stage-execution, orchestration, commands, templates, cli-output

## Seed (what & why)
A `/next-automatic` command that runs multiple growth stages in sequence, each in a fresh gardener agent invocation, with file-based success detection (stage marker change from seedling to tree in the growth plan file). This eliminates the manual `/next` loop for developers who want to run several stages unattended, while preserving the one-stage-one-context principle that prevents context degradation.

## Growth Stages

### Concrete (next 3-5 stages, detailed)

- 🌳 Stage 1: Core command file with orchestration loop and file-based detection (created `.claude/commands/next-automatic.md` with full orchestration prompt)
  - Intent: Create the `next-automatic.md` command that orchestrates multiple gardener invocations, detects success by reading the growth plan file after each stage, stops on failure, and accepts an optional max-stages argument.
  - Properties:
    - P1: The command file exists at `.claude/commands/next-automatic.md` and has valid frontmatter with a description field [invariant]
      Captures: command not recognized by Claude Code due to missing/malformed frontmatter
    - P2: The command instructs the orchestrator to count seedling-marked stages in the active growth plan BEFORE starting, and use that count as the default max when no argument is given [invariant]
      Captures: running forever when no argument provided, or failing to determine when to stop
    - P3: After each gardener agent invocation returns, the orchestrator reads the growth plan file and checks whether the stage that was seedling-marked is now tree-marked. If yes, it succeeded. If not, it failed. [invariant]
      Captures: relying on natural-language parsing of agent output instead of deterministic file-based detection
    - P4: When a stage fails (marker did not change), the orchestrator stops immediately and reports which stage failed and how many stages completed [transition]
      Captures: continuing after a failed stage, cascading failures
    - P5: The `$ARGUMENTS` variable is parsed as an optional integer for max-stages. `/next-automatic 3` runs at most 3 stages. `/next-automatic` with no argument runs all remaining concrete seedling stages. [boundary]
      Captures: argument parsing failure, running wrong number of stages
    - P6: Each stage runs in a fresh gardener agent invocation (subagent), not in the main session's context [invariant]
      Captures: context degradation from running all stages in one context window
    - P7: Progress is logged concisely after each stage: stage number, pass/fail status, and a one-line summary [invariant]
      Captures: context bloat in the main orchestrating session from verbose stage output
  - Depends on: none (first stage)
  - Touches: `.claude/commands/next-automatic.md`
  - Implementation hint: This is a markdown command file like `next.md`. It contains instructions for the orchestrating Claude session. The key mechanics are: (1) read the growth plan to find the active feature and count remaining seedling stages, (2) loop up to max-stages times, (3) each iteration invokes the gardener agent in GROW mode as a subagent, (4) after agent returns, re-read the growth plan file and check if the target stage marker changed, (5) log progress, (6) stop if marker unchanged. The command should reference `$ARGUMENTS` for the optional max-stages parameter.

- 🌳 Stage 2: Template files for both platforms (added templates for both Claude and opencode, updated all test assertions)
  - Intent: Ship the command as installable templates so `npx organic-growth` and `npx organic-growth --opencode` include it. Update tests to verify the new template is installed.
  - Properties:
    - P1-carried: `.claude/commands/next-automatic.md` exists with valid frontmatter [from Stage 1]
    - P8: `templates/.claude/commands/next-automatic.md` exists and its content is identical to `.claude/commands/next-automatic.md` [invariant]
      Captures: template and project copy diverging, users getting a different version than what we use
    - P9: `templates-opencode/.opencode/commands/next-automatic.md` exists, has valid frontmatter, and references `@gardener` (opencode agent syntax) [invariant]
      Captures: opencode users getting a broken command that references the wrong agent syntax
    - P10: The CLI installs `next-automatic.md` to the target directory for both Claude and opencode modes [roundtrip]
      Captures: command file missing after install because it was not included in templates directory
    - P11: The existing test that checks "installs all expected command files" includes `next-automatic` in its command list and passes [invariant]
      Captures: shipping without test coverage, regression in command list verification
    - P12: The "template and project copies are identical" test includes `next-automatic.md` and passes [invariant]
      Captures: template/project copy divergence going undetected
  - Depends on: P1 (Stage 1)
  - Touches: `templates/.claude/commands/next-automatic.md`, `templates-opencode/.opencode/commands/next-automatic.md`, `test/cli.test.mjs`
  - Implementation hint: Copy `.claude/commands/next-automatic.md` to `templates/.claude/commands/next-automatic.md`. Create the opencode variant in `templates-opencode/.opencode/commands/next-automatic.md` (same content but use `@gardener` instead of `gardener` for agent reference, matching how other opencode commands differ from Claude commands). Add `next-automatic` to the command arrays in test assertions. Add it to the template-project identity check.

- Stage 3: CLI output and documentation updates
  - Intent: Update CLI post-install output to mention the new command, update README with the new command in the file tree and workflow sections, and update product DNA.
  - Properties:
    - P13: CLI post-install output includes a line for `/next-automatic` in the "Commands available" section [invariant]
      Captures: users not discovering the command exists
    - P14: README.md "What You Get" file tree includes `next-automatic.md` with a description comment [invariant]
      Captures: documentation not reflecting actual shipped files
    - P15: README.md workflow section shows `/next-automatic` as an alternative to repeated `/next` calls [invariant]
      Captures: users not knowing when/how to use the automatic mode
    - P16: `docs/product-dna.md` Key Commands section includes `/next-automatic` [invariant]
      Captures: product DNA falling out of sync with actual capabilities
    - P17: The CLI output test (if one exists that checks for command names) passes with the new command included [invariant]
      Captures: test regression from output change
  - Depends on: P1, P8, P9, P10, P11, P12 (Stages 1-2)
  - Touches: `bin/cli.mjs`, `README.md`, `docs/product-dna.md`
  - Implementation hint: In `cli.mjs`, add a line after the `/next` line in the "Commands available" section: `/next-automatic` with a brief description like "run multiple stages automatically". In README, add the file to the tree, add a workflow example showing `/next-automatic 5`. In product DNA, add to Key Commands list.

### Horizon (rough outline of what comes after)
- Completion summary: after all stages finish (or on failure), print a summary showing total stages run, all properties verified, time elapsed, and suggest `/review` if 3+ stages completed
- Re-evaluation awareness: if the completed stage count crosses a multiple of 3, note in the progress log that the gardener will re-evaluate the plan at the next stage (this happens naturally inside the gardener, but the orchestrator should mention it)

## Growth Log
- **2026-03-07 -- Stage 1 complete:** Created `.claude/commands/next-automatic.md` with orchestration loop, file-based detection, optional max-stages argument, fresh subagent invocations, and concise progress logging. All 7 properties verified by file inspection. 57 existing tests pass unchanged.
- **2026-03-07 -- Stage 2 complete:** Added `templates/.claude/commands/next-automatic.md` (identical to project copy), `templates-opencode/.opencode/commands/next-automatic.md` (with @gardener syntax), and updated all test command lists and template identity checks. 57 tests pass.
