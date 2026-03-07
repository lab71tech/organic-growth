# Feature: upgrade
Created: 2026-03-07
Status: Growing
Capabilities: upgrade, version-tracking, cli, managed-files, user-files, templates

## Seed (what & why)
An `--upgrade` flag for the organic-growth CLI that distinguishes between managed template files (which should be overwritten to match the latest version) and user-customized files (which should be preserved). This enables users to update to new versions of organic-growth without losing their project-specific configuration in CLAUDE.md, AGENTS.md, .mcp.json, or opencode.json. A version file (`.organic-growth/.version`) tracks what was installed.

## Growth Stages

### Concrete (next 3-5 stages, detailed)

- 🌳 Stage 1: Version file written on every install
  - Intent: Make the CLI write `.organic-growth/.version` containing the package version on every fresh install, so future upgrades can detect what version is installed.
  - Properties:
    - P1: After a fresh install (no --upgrade), `.organic-growth/.version` exists and contains exactly the string from package.json `version` field with no trailing newline or whitespace [invariant]
      Captures: version file missing after install, version file containing wrong format (JSON, extra text, etc.)
    - P2: After a fresh install with --force, `.organic-growth/.version` exists and contains the current package version [invariant]
      Captures: version file not written when --force is used
    - P3: After a fresh install with --opencode, `.organic-growth/.version` exists and contains the current package version [invariant]
      Captures: opencode mode forgetting to write version file
    - P4: The version file is written AFTER all template files are copied, not before [transition]
      Captures: version file existing but templates not fully installed (interrupted install)
    - P5: `.organic-growth/.version` contains only the semver string (e.g., "3.1.0"), parseable by simple string comparison [boundary]
      Captures: version file containing metadata, JSON wrapping, or other formats that complicate reading
  - Depends on: none (first stage)
  - Touches: `bin/cli.mjs`, `test/cli.test.mjs`
  - Implementation hint: At the end of the `install()` function, after all files are copied and DNA is handled, write `readVersion()` result to `.organic-growth/.version` using `writeFileSync`. Add tests that check the version file exists and has the right content for all install modes.

- Stage 2: --upgrade flag with managed vs user file classification
  - Intent: Add the `--upgrade` flag that overwrites managed template files while skipping user-customized files, with clear output showing what was updated vs skipped.
  - Properties:
    - P6: When --upgrade is passed, files under `.claude/` and `.opencode/` directories are overwritten from templates without prompting [invariant]
      Captures: upgrade prompting for managed files like a fresh install would
    - P7: When --upgrade is passed, `CLAUDE.md`, `AGENTS.md`, `.mcp.json`, and `opencode.json` are never overwritten, even if they exist [invariant]
      Captures: upgrade destroying user customizations in these files
    - P8: When --upgrade is passed and a user-customized file does NOT exist, it is NOT created [invariant]
      Captures: upgrade creating CLAUDE.md in an opencode project or AGENTS.md in a Claude project
    - P9: When --upgrade is passed, the output distinguishes between "updated" (managed files overwritten), "skipped" (user files preserved), and the from/to version (or "unknown" if no prior .version file) [invariant]
      Captures: user not knowing what happened during upgrade
    - P10: When --upgrade is passed, `.organic-growth/.version` is written with the new version after all managed files are updated [transition]
      Captures: version file not updated after upgrade, or updated before files are written
    - P11: --upgrade and --force are mutually exclusive; passing both prints an error and exits without modifying any files [boundary]
      Captures: ambiguous behavior when both flags are present — --force implies "overwrite everything" which contradicts --upgrade's "skip user files" semantics
    - P12: --upgrade works when no `.organic-growth/.version` exists (treats installed version as "unknown") and still overwrites managed files and skips user files [boundary]
      Captures: upgrade refusing to work on projects installed before version tracking existed
  - Depends on: P1, P5 (Stage 1 — version file format)
  - Touches: `bin/cli.mjs`, `test/cli.test.mjs`
  - Implementation hint: Add `--upgrade` to arg parsing. When upgrade mode: iterate template files, classify each as managed or user-customized based on filename (CLAUDE.md, AGENTS.md, .mcp.json, opencode.json are user files — everything else is managed). For managed files that exist: overwrite. For user files that exist: skip. For files that don't exist: only create if managed. Read existing `.version` for display. Write new `.version` at end. Error if both --upgrade and --force.

- Stage 3: Help text, CLI output, and documentation
  - Intent: Update --help output to document --upgrade, update post-install output to mention upgrade path, and ensure the upgrade workflow is discoverable.
  - Properties:
    - P13: `--help` output includes `--upgrade` with a description that mentions updating managed files while preserving user customizations [invariant]
      Captures: users not discovering the upgrade flag
    - P14: After a fresh install, the "Done! Next steps" output includes a note about future upgrades mentioning `--upgrade` [invariant]
      Captures: users not knowing how to upgrade later
    - P15: After an --upgrade, the "Done!" output does NOT show the "/seed" and "edit CLAUDE.md" first-time setup instructions [invariant]
      Captures: upgrade output being confusing by showing first-install instructions
    - P16: `--upgrade` output shows a summary line with count of files updated and files skipped [invariant]
      Captures: user having no idea how many files were touched
  - Depends on: P6, P7, P8, P9, P10, P11, P12 (Stage 2 — upgrade behavior)
  - Touches: `bin/cli.mjs`, `test/cli.test.mjs`
  - Implementation hint: Add `--upgrade` line to `printHelp()`. Modify post-install output to show "To upgrade later: npx organic-growth --upgrade". When in upgrade mode, show a different completion message with summary counts instead of first-time setup instructions.

- Stage 4: .organic-growth/growth/ directory preserved on upgrade and new managed files added
  - Intent: Ensure upgrade handles edge cases: the `.organic-growth/growth/` directory and its contents are never touched, new template files that didn't exist in the previous version are created, and the DNA file is not affected.
  - Properties:
    - P17: When --upgrade is passed, files inside `.organic-growth/growth/` are never modified, deleted, or overwritten [invariant]
      Captures: upgrade destroying growth plans
    - P18: When --upgrade is passed, `.organic-growth/product-dna.md` is never modified or overwritten [invariant]
      Captures: upgrade destroying product DNA
    - P19: When --upgrade is passed and the templates contain a new managed file that doesn't exist in the target (e.g., a new command added in a later version), that file IS created [transition]
      Captures: upgrade failing to deliver new managed files that were added in newer versions
    - P20: When --upgrade is passed, the `.organic-growth/growth/` directory is not re-created if it already exists (no duplicate "created" message) [boundary]
      Captures: misleading output suggesting growth directory was modified
  - Depends on: P6, P7, P8 (Stage 2 — file classification), P10 (version written)
  - Touches: `bin/cli.mjs`, `test/cli.test.mjs`
  - Implementation hint: The `.organic-growth/` directory is not part of the template copy loop (it's created separately). Verify the existing logic already handles this correctly. The DNA file path `.organic-growth/product-dna.md` should be added to the user-file skip list for upgrade mode. Add tests that pre-populate growth plans and DNA, run upgrade, and verify they're untouched. Test that a "new" managed file (simulated) gets created during upgrade.

### Horizon (rough outline of what comes after)
- Dry-run mode (`--upgrade --dry-run`): show what would be updated/skipped without writing anything
- Diff display: show a summary of what changed in managed files (e.g., "3 files updated, 2 unchanged")
- Changelog awareness: after upgrade, show relevant changelog entries between old and new version

## Growth Log
<!-- Auto-updated after each stage -->
- **2026-03-07 — Stage 1 complete:** Added `.organic-growth/.version` file written at end of every install (fresh, --force, --opencode). Contains exact semver string from package.json. 5 property tests added (P1-P5), all passing. 61/63 tests pass (2 pre-existing failures from docs/ migration unrelated to this stage).
