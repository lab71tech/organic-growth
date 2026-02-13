# 🌱 Organic Growth

[![Test](https://github.com/lab71tech/organic-growth/actions/workflows/test.yml/badge.svg)](https://github.com/lab71tech/organic-growth/actions/workflows/test.yml) [![GitHub Release](https://img.shields.io/github/v/release/lab71tech/organic-growth)](https://github.com/lab71tech/organic-growth/releases)

AI-assisted incremental software development. Supports Claude Code and GitHub Copilot.

Grow features in natural stages, where each stage delivers a complete, working system.

Inspired by Alistair Cockburn’s Elephant Carpaccio and the idea that projects grow like plants, rather than being sliced from a finished whole.

<p>
  <img src="assets/organic-growth.jpg" alt="Organic Growth — from seed to code">
</p>

## Install

```bash
# In your project directory:
bunx organic-growth

# Or with npx:
npx organic-growth

# With a product DNA document:
bunx organic-growth docs/my-product-spec.md

# Force overwrite existing files:
bunx organic-growth --force

# Install for Claude Code only:
bunx organic-growth --target claude

# Install for GitHub Copilot only:
bunx organic-growth --target copilot

# Install for all supported tools (default):
bunx organic-growth --target all
```

This copies configuration files into your project. No runtime dependencies.

## What You Get

```
docs/
└── project-context.md                # Shared project context (single source of truth)

.claude/                              # Claude Code configuration
├── CLAUDE.md                         # References project-context.md + growth philosophy
├── agents/
│   └── gardener.md                   # Plans, implements, and validates growth stages
└── commands/
    ├── seed.md                       # /seed  — bootstrap new project
    ├── grow.md                       # /grow  — plan a new feature
    ├── next.md                       # /next  — implement next stage
    ├── replan.md                     # /replan — adjust when things change
    └── review.md                     # /review — deep quality review

.github/                              # GitHub Copilot configuration
└── copilot-instructions.md           # Synced context + growth methodology for Copilot
```

Use `--target claude` or `--target copilot` to install only one tool's configuration.

## Workflow

```bash
# 1. Bootstrap (new project)
> /seed                          # interview mode
> /seed docs/product-dna.md      # from existing product document

# 2. Grow features
> /grow Add user authentication
> /next                          # stage 1
> /next                          # stage 2
> /next                          # stage 3
> /clear                         # fresh session every 3 stages
> /review 3                      # quality check
> /next                          # continue

# 3. When reality changes
> /replan We need to support SSO instead of basic auth
```

## Philosophy

- **One stage = one intent = one test = one commit**
- **Rolling plan:** 3-5 stages ahead, re-evaluate every 3
- **Two-layer quality:** deterministic tools after every stage, LLM review on demand
- **Context hygiene:** fresh session every 3 stages
- **Shared context:** one file (`docs/project-context.md`) feeds all AI tools

## After Install

**All tools:**
1. Edit `docs/project-context.md` — fill in Product, Tech Stack, Quality Tools, Priorities (or run `/seed` in Claude Code)

**Claude Code** reads `docs/project-context.md` directly. Start building with `/grow`.

**GitHub Copilot** uses synced context. After editing `docs/project-context.md`:
```bash
npx organic-growth sync
```

## Syncing Context

`docs/project-context.md` is the single source of truth for project context. Claude Code reads it directly. For tools that use static instruction files (like Copilot), run `sync` to inject the context:

```bash
npx organic-growth sync
```

This replaces the content between `<!-- BEGIN SHARED CONTEXT -->` and `<!-- END SHARED CONTEXT -->` markers in `.github/copilot-instructions.md`.

### Upgrading from v1.x

If you installed before shared context existed, your project context lives inline in `.claude/CLAUDE.md` and `.github/copilot-instructions.md`. To migrate:

1. Run `npx organic-growth --force` to get the new templates
2. Move your project context into `docs/project-context.md`
3. Run `npx organic-growth sync` to update Copilot instructions

## Releases

Releases are triggered manually via the [Release](.github/workflows/release.yml) workflow. When triggered, it:

1. Checks for meaningful commits since the last `v*` tag
2. Bumps the version in `package.json`
3. Commits the version bump and pushes a new `v*` tag
4. Creates a GitHub Release with auto-generated release notes

The [Publish to npm](.github/workflows/publish.yml) workflow triggers on any `v*` tag push and publishes to npm automatically. The full pipeline is: **manual trigger -> version bump -> tag -> GitHub Release -> npm publish**.

```bash
# Patch release (default — bug fixes, small changes)
gh workflow run Release

# Minor release (new features, backwards-compatible)
gh workflow run Release -f bump=minor

# Major release (breaking changes)
gh workflow run Release -f bump=major

# Dry run — preview what would be released without making changes
gh workflow run Release -f dry-run=true
```

Or use the "Run workflow" button on the Actions tab in GitHub.

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `bump` | choice: `patch`, `minor`, `major` | `patch` | Version bump type |
| `dry-run` | boolean | `false` | When `true`, calculates the version and shows a summary but skips the commit, tag, and release |

## License

MIT
