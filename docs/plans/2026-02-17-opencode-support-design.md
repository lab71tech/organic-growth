# Design: opencode Support

**Date:** 2026-02-17
**Status:** Approved

## Problem

organic-growth is currently Claude Code-only. opencode (open-source AI coding agent) has a remarkably similar architecture — `.opencode/` with agents, commands, skills, plugins — but requires its own template set. Users who prefer opencode cannot use organic-growth today.

## Decision: Parallel Template Trees

Create `templates-opencode/` alongside `templates/`. The CLI gets `--opencode` flag to select which set to install. No shared template layer, no conditionals — clean separation.

**Why not shared templates with a translation layer?**
- Hooks are fundamentally different (shell scripts + settings.json vs JS plugin modules)
- MCP config lives in different files (.mcp.json vs opencode.json)
- Rules file has different name (CLAUDE.md vs AGENTS.md)
- Translation layer would be fragile for modest duplication savings

**Why not a single tree with conditionals?**
- Over-engineering for ~15 files
- Makes templates harder to read and maintain
- Only a few files actually differ in structure

## Template Mapping

| Claude Code (`templates/`) | opencode (`templates-opencode/`) | Notes |
|---|---|---|
| `CLAUDE.md` | `AGENTS.md` | Same methodology content |
| `.claude/agents/gardener.md` | `.opencode/agents/gardener.md` | Minor frontmatter adjustments |
| `.claude/commands/*.md` (5) | `.opencode/commands/*.md` (5) | Same content, no superpowers refs |
| `.claude/skills/*.md` (3) | `.opencode/skills/*.md` (3) | Identical content |
| `.claude/settings.json` | *(not needed)* | Hooks defined in plugin instead |
| `.claude/hooks/*.sh` (3) | `.opencode/plugins/organic-growth.js` | Shell hooks → single JS plugin |
| `.mcp.json` | `opencode.json` | Context7 MCP in opencode format |

## CLI Changes

```
npx organic-growth                    # Default: Claude Code (backward compatible)
npx organic-growth --opencode         # opencode templates
npx organic-growth --opencode spec.md # opencode + DNA document
```

Changes:
1. Parse `--opencode` flag
2. Select template source directory based on flag
3. Adjust banner ("opencode setup" vs "Claude Code setup")
4. Adjust next-steps messaging (reference AGENTS.md, skip superpowers detection)
5. Add `templates-opencode/` to package.json `files` array
6. Update description and keywords

Zero changes to existing Claude Code install path.

## Hooks → opencode Plugin

The 3 shell hooks merge into `.opencode/plugins/organic-growth.js`:

```javascript
export default function organicGrowth({ $, directory }) {
  return {
    "tool.execute.after": async (input, output) => {
      // Guard: only proceed for bash tool + git commit + stage pattern
      // a) Run test suite (discovered from AGENTS.md **Test:** field)
      // b) Gather git diff review context
      // c) Check commit format (advisory)
    }
  };
}
```

Key differences from shell hooks:
- Uses opencode's `$` shell API instead of raw bash
- Reads test command from `AGENTS.md` instead of `CLAUDE.md`
- Single file instead of 3 separate scripts
- No jq dependency — JS handles JSON natively

## Agent Translation Notes

opencode agent frontmatter supports similar fields:
- `description` → same
- `tools` → uses `{ "write": true, "bash": true }` object format instead of array
- `mode` → `"subagent"` (gardener is invoked by commands, not directly)
- `model` → optional, inherits default

The agent body (prompt) is identical — the organic growth methodology is tool-agnostic.

## What Does NOT Change

- The organic growth methodology itself (AGENTS.md content = CLAUDE.md content)
- Growth plan format (`docs/growth/*.md`)
- Commit convention
- Test approach and quality gates
- Product DNA document location

## Risks

- **opencode API stability**: opencode's plugin API may change. The plugin is simple enough to adapt.
- **Feature gaps**: opencode may lack some hook event details (e.g., which tool was called). May need to inspect command strings instead.
- **Testing**: Need to verify opencode actually loads `.opencode/plugins/*.js` as documented.

## Sources

- [opencode Agents docs](https://opencode.ai/docs/agents/)
- [opencode Rules docs](https://opencode.ai/docs/rules/)
- [opencode Config docs](https://opencode.ai/docs/config/)
- [opencode Commands docs](https://opencode.ai/docs/commands/)
- [opencode Plugins docs](https://opencode.ai/docs/plugins/)
