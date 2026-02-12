# Contributing to organic-growth

Thanks for your interest in contributing!

## Development Setup

```bash
# Clone the repo
git clone https://github.com/lab71tech/organic-growth.git
cd organic-growth

# Install dependencies (there are none, but this validates package.json)
bun install  # or npm install

# Run tests
node --test

# Smoke test the CLI
node bin/cli.mjs --force
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes — keep them focused on a single concern
3. Ensure all tests pass: `node --test`
4. Submit a PR — squash merge is preferred
5. One review is required before merging

## Code Style

- Plain JavaScript (no TypeScript, no build step)
- Zero runtime dependencies — this is a hard constraint
- Keep the package under 50KB
- Test with both Node.js and Bun

## Development Philosophy

This project follows the **Organic Growth** methodology: features are grown in stages from seed to maturity. Each stage produces a complete, working system. See `.claude/CLAUDE.md` for the full development philosophy.

## Reporting Issues

Use [GitHub Issues](https://github.com/lab71tech/organic-growth/issues) for bugs and feature requests. For security vulnerabilities, see [SECURITY.md](SECURITY.md).
