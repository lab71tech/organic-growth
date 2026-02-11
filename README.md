# 🌱 Organic Growth

Claude Code setup for incremental software development. Grow features in natural stages — each stage produces a complete, working system.

Inspired by Elephant Carpaccio, but reframed: we're not slicing a finished animal — we're growing a living system from seed.

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
```

This copies the `.claude/` configuration into your project. No runtime dependencies.

## What You Get

```
.claude/
├── CLAUDE.md              # Project context template + growth philosophy
├── agents/
│   └── gardener.md        # Plans, implements, and validates growth stages
└── commands/
    ├── seed.md            # /seed  — bootstrap new project
    ├── grow.md            # /grow  — plan a new feature
    ├── next.md            # /next  — implement next stage
    ├── replan.md          # /replan — adjust when things change
    └── review.md          # /review — deep quality review
```

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
- **Product context required:** fill in CLAUDE.md or provide a DNA document

## After Install

1. Edit `.claude/CLAUDE.md` — fill in the Product section (or run `/seed`)
2. Fill in Quality Tools section with your project's lint/test commands
3. Start building with `/grow`

## License

MIT
