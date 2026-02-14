# Skills-First Expansion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add curated skills, MCP config, commit format hook, and superpowers detection to organic-growth.

**Architecture:** Template files in `templates/` are auto-copied by the CLI's `getAllFiles()` recursive walk. No CLI changes needed for file copying — just add files to `templates/`. CLI changes only for superpowers detection. Settings.json updated for new hook registration.

**Tech Stack:** Node.js (>=20), node:test, bash hooks, JSON config

**Key constraint:** Package size must stay under 50KB. Skills must be concise.

---

### Task 1: Skills Templates

**Files:**
- Create: `templates/.claude/skills/property-planning.md`
- Create: `templates/.claude/skills/stage-writing.md`
- Create: `templates/.claude/skills/quality-gates.md`
- Modify: `test/cli.test.mjs` (template completeness + content tests)

**Step 1: Write the failing tests**

Add to `test/cli.test.mjs`:

```javascript
describe('Skills templates', () => {
  const { tmp } = runCLI();

  it('installs three skill files into .claude/skills/', () => {
    const skills = [
      '.claude/skills/property-planning.md',
      '.claude/skills/stage-writing.md',
      '.claude/skills/quality-gates.md',
    ];
    for (const skill of skills) {
      const fullPath = join(tmp, skill);
      assert.ok(existsSync(fullPath), `expected skill file to exist: ${skill}`);
      const stat = statSync(fullPath);
      assert.ok(stat.size > 0, `expected skill file to be non-empty: ${skill}`);
    }
  });

  it('property-planning skill contains property category guidance', () => {
    const content = readFileSync(join(tmp, '.claude', 'skills', 'property-planning.md'), 'utf8');
    const categories = ['invariant', 'state transition', 'boundary'];
    for (const cat of categories) {
      assert.ok(
        content.toLowerCase().includes(cat),
        `property-planning.md should mention "${cat}"`
      );
    }
  });

  it('stage-writing skill contains vertical slicing guidance', () => {
    const content = readFileSync(join(tmp, '.claude', 'skills', 'stage-writing.md'), 'utf8');
    assert.ok(
      /vertical/i.test(content),
      'stage-writing.md should mention vertical slicing'
    );
    assert.ok(
      /one intent/i.test(content) || /single purpose/i.test(content),
      'stage-writing.md should mention one intent or single purpose'
    );
  });

  it('quality-gates skill contains fix-it-now guidance', () => {
    const content = readFileSync(join(tmp, '.claude', 'skills', 'quality-gates.md'), 'utf8');
    assert.ok(
      /CLAUDE\.md/i.test(content),
      'quality-gates.md should reference CLAUDE.md configuration'
    );
    assert.ok(
      /debt/i.test(content) || /carry forward/i.test(content),
      'quality-gates.md should mention not carrying debt forward'
    );
  });

  it('all skills have description in frontmatter', () => {
    const skills = ['property-planning', 'stage-writing', 'quality-gates'];
    for (const skill of skills) {
      const content = readFileSync(join(tmp, '.claude', 'skills', `${skill}.md`), 'utf8');
      assert.match(
        content,
        /^---\s*\n/m,
        `${skill}.md should have YAML frontmatter`
      );
    }
  });
});
```

Also update the existing `'installs all 10 template files'` test — change count from 10 to 14 and add the 4 new files (3 skills + .mcp.json from Task 2, but for now just add the 3 skills and update count to 13):

```javascript
it('installs all 13 template files', () => {
    const { tmp } = runCLI();

    const expectedFiles = [
      'CLAUDE.md',
      '.claude/agents/gardener.md',
      '.claude/commands/seed.md',
      '.claude/commands/grow.md',
      '.claude/commands/next.md',
      '.claude/commands/replan.md',
      '.claude/commands/review.md',
      '.claude/hooks/post-stage-review.sh',
      '.claude/hooks/post-stage-test.sh',
      '.claude/settings.json',
      '.claude/skills/property-planning.md',
      '.claude/skills/stage-writing.md',
      '.claude/skills/quality-gates.md',
    ];
    // ... rest unchanged
```

**Step 2: Run tests to verify they fail**

Run: `npm test 2>&1 | tail -20`
Expected: FAIL — skill files don't exist yet

**Step 3: Write the three skill files**

Create `templates/.claude/skills/property-planning.md`:
- YAML frontmatter with `name`, `description` (triggering conditions)
- Property categories: invariants, state transitions, roundtrips, boundaries
- Anti-patterns section: "test the implementation" vs "test the behavior"
- Mapping properties to test code examples
- Keep under 3KB for package size budget

Create `templates/.claude/skills/stage-writing.md`:
- YAML frontmatter
- One intent = one stage rule
- Vertical slicing: touch all layers needed
- Sizing guidance: when to split, when to combine
- Hardcoded-to-dynamic progression
- Keep under 2KB

Create `templates/.claude/skills/quality-gates.md`:
- YAML frontmatter
- How to configure quality tools in CLAUDE.md
- Common failure patterns and fixes
- "Fix it now" discipline — no debt carried forward
- When to adjust scope vs fix the failure
- Keep under 2KB

**Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: All tests pass (previous 105 + new skill tests)

**Step 5: Verify package size**

Run: `npm pack --dry-run --json 2>/dev/null | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8');const i=JSON.parse(d);console.log('Size:',i[0].unpackedSize,'bytes')"`
Expected: Under 51200 bytes (50KB)

**Step 6: Copy skills to project .claude/ (keep project in sync)**

Copy the 3 skill files to `.claude/skills/` (the project's own working copy).

**Step 7: Commit**

```bash
git add templates/.claude/skills/ .claude/skills/ test/cli.test.mjs
git commit -m "feat(skills): stage 1 — add property-planning, stage-writing, quality-gates skills

Growth plan: docs/growth/skills-first.md"
```

---

### Task 2: MCP Configuration Template

**Files:**
- Create: `templates/.mcp.json`
- Modify: `test/cli.test.mjs` (new test block + update template count)

**Step 1: Write the failing tests**

Add to `test/cli.test.mjs`:

```javascript
describe('MCP configuration template', () => {
  const { tmp } = runCLI();

  it('installs .mcp.json at project root', () => {
    const mcpPath = join(tmp, '.mcp.json');
    assert.ok(existsSync(mcpPath), 'expected .mcp.json to exist at project root');
    const stat = statSync(mcpPath);
    assert.ok(stat.size > 0, 'expected .mcp.json to be non-empty');
  });

  it('.mcp.json is valid JSON with mcpServers key', () => {
    const content = readFileSync(join(tmp, '.mcp.json'), 'utf8');
    const parsed = JSON.parse(content);
    assert.ok(parsed.mcpServers, '.mcp.json should have mcpServers key');
  });

  it('.mcp.json includes Context7 MCP server', () => {
    const content = readFileSync(join(tmp, '.mcp.json'), 'utf8');
    const parsed = JSON.parse(content);
    const serverNames = Object.keys(parsed.mcpServers);
    assert.ok(
      serverNames.some(name => /context7/i.test(name)),
      `.mcp.json should include a Context7 server, found: ${serverNames.join(', ')}`
    );
  });

  it('Context7 server uses npx command (no auth required)', () => {
    const content = readFileSync(join(tmp, '.mcp.json'), 'utf8');
    const parsed = JSON.parse(content);
    const c7Key = Object.keys(parsed.mcpServers).find(k => /context7/i.test(k));
    const c7 = parsed.mcpServers[c7Key];
    assert.equal(c7.type, 'stdio', 'Context7 should use stdio type');
    assert.ok(
      c7.command.includes('npx') || c7.command === 'npx',
      'Context7 should use npx command'
    );
  });
});
```

Update template count from 13 to 14 and add `.mcp.json` to the expected files list.

**Step 2: Run tests to verify they fail**

Run: `npm test 2>&1 | tail -20`
Expected: FAIL — .mcp.json doesn't exist

**Step 3: Create the MCP config template**

Create `templates/.mcp.json`:

```json
{
  "mcpServers": {
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add templates/.mcp.json test/cli.test.mjs
git commit -m "feat(mcp): stage 2 — add Context7 MCP configuration template

Growth plan: docs/growth/skills-first.md"
```

---

### Task 3: Commit Format Check Hook

**Files:**
- Create: `templates/.claude/hooks/commit-format-check.sh`
- Modify: `templates/.claude/settings.json`
- Modify: `test/cli.test.mjs`

**Step 1: Write the failing tests**

Add to `test/cli.test.mjs`:

```javascript
describe('Commit format check hook (template)', () => {
  const { tmp } = runCLI();

  it('hook template exists at .claude/hooks/commit-format-check.sh', () => {
    const hookPath = join(tmp, '.claude', 'hooks', 'commit-format-check.sh');
    assert.ok(existsSync(hookPath), 'expected commit-format-check.sh to exist');
    const stat = statSync(hookPath);
    assert.ok(stat.size > 0, 'expected hook to be non-empty');
  });

  it('hook checks for feat(scope): stage N format', () => {
    const content = readFileSync(
      join(tmp, '.claude', 'hooks', 'commit-format-check.sh'), 'utf8'
    );
    assert.ok(
      /feat\(/.test(content) || /stage.*[0-9]|stage.*\\d/i.test(content),
      'hook should check for feat(scope): stage N pattern'
    );
  });

  it('hook outputs warning to stderr (advisory, not blocking)', () => {
    const content = readFileSync(
      join(tmp, '.claude', 'hooks', 'commit-format-check.sh'), 'utf8'
    );
    assert.ok(
      />&2/.test(content),
      'hook should output to stderr'
    );
  });

  it('hook outputs JSON with additionalContext', () => {
    const content = readFileSync(
      join(tmp, '.claude', 'hooks', 'commit-format-check.sh'), 'utf8'
    );
    assert.ok(
      /additionalContext/.test(content),
      'hook should output additionalContext in JSON'
    );
  });

  it('settings.json registers commit-format-check hook', () => {
    const settings = JSON.parse(
      readFileSync(join(tmp, '.claude', 'settings.json'), 'utf8')
    );
    const bashHook = settings.hooks.PostToolUse.find(h => h.matcher === 'Bash');
    const formatHook = bashHook.hooks.find(h =>
      h.command.includes('commit-format-check')
    );
    assert.ok(formatHook, 'settings should register commit-format-check hook');
  });

  it('commit-format-check runs after test and review hooks', () => {
    const settings = JSON.parse(
      readFileSync(join(tmp, '.claude', 'settings.json'), 'utf8')
    );
    const bashHook = settings.hooks.PostToolUse.find(h => h.matcher === 'Bash');
    const testIdx = bashHook.hooks.findIndex(h => h.command.includes('post-stage-test'));
    const reviewIdx = bashHook.hooks.findIndex(h => h.command.includes('post-stage-review'));
    const formatIdx = bashHook.hooks.findIndex(h => h.command.includes('commit-format-check'));
    assert.ok(
      formatIdx > reviewIdx && reviewIdx > testIdx,
      `hook order should be: test(${testIdx}) < review(${reviewIdx}) < format(${formatIdx})`
    );
  });
});

describe('Commit format check hook (end-to-end)', () => {
  it('exits silently for non-commit commands', () => {
    const { tmp } = runCLI();
    const stdinJSON = JSON.stringify({ tool_input: { command: 'ls -la' } });
    const hookPath = join(tmp, '.claude', 'hooks', 'commit-format-check.sh');
    const result = spawnSync('bash', [hookPath], {
      cwd: tmp,
      encoding: 'utf8',
      input: stdinJSON,
      timeout: 5000,
    });
    assert.equal(result.status, 0, 'should exit 0 for non-commit commands');
    assert.equal(result.stdout.trim(), '', 'should produce no stdout for non-commit commands');
  });

  it('outputs warning JSON for incorrectly formatted stage commit', () => {
    const { tmp } = runCLI();
    execFileSync('git', ['init'], { cwd: tmp, encoding: 'utf8' });
    execFileSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tmp });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tmp });
    writeFileSync(join(tmp, 'dummy.txt'), 'hello');
    execFileSync('git', ['add', '.'], { cwd: tmp, encoding: 'utf8' });
    // Bad format: missing scope parentheses
    execFileSync('git', ['commit', '-m', 'stage 1 — did something'], {
      cwd: tmp,
      encoding: 'utf8',
    });

    const stdinJSON = JSON.stringify({ tool_input: { command: 'git commit -m "stage 1"' } });
    const hookPath = join(tmp, '.claude', 'hooks', 'commit-format-check.sh');
    const result = spawnSync('bash', [hookPath], {
      cwd: tmp,
      encoding: 'utf8',
      input: stdinJSON,
      timeout: 5000,
    });

    assert.equal(result.status, 0, 'should exit 0 (advisory, not blocking)');
    const parsed = JSON.parse(result.stdout);
    assert.ok(
      parsed.hookSpecificOutput.additionalContext.toLowerCase().includes('format'),
      'should warn about commit format'
    );
  });

  it('produces no warning for correctly formatted stage commit', () => {
    const { tmp } = runCLI();
    execFileSync('git', ['init'], { cwd: tmp, encoding: 'utf8' });
    execFileSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tmp });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tmp });
    writeFileSync(join(tmp, 'dummy.txt'), 'hello');
    execFileSync('git', ['add', '.'], { cwd: tmp, encoding: 'utf8' });
    execFileSync('git', ['commit', '-m', 'feat(auth): stage 1 — add login'], {
      cwd: tmp,
      encoding: 'utf8',
    });

    const stdinJSON = JSON.stringify({ tool_input: { command: 'git commit -m "feat(auth): stage 1"' } });
    const hookPath = join(tmp, '.claude', 'hooks', 'commit-format-check.sh');
    const result = spawnSync('bash', [hookPath], {
      cwd: tmp,
      encoding: 'utf8',
      input: stdinJSON,
      timeout: 5000,
    });

    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), '', 'should produce no output for correct format');
  });
});
```

Update template count to 15 (added commit-format-check.sh).

**Step 2: Run tests to verify they fail**

Run: `npm test 2>&1 | tail -20`
Expected: FAIL — hook file doesn't exist

**Step 3: Create the commit format check hook**

Create `templates/.claude/hooks/commit-format-check.sh`:

```bash
#!/bin/bash
# Commit format check hook for Claude Code
# Triggers after Bash tool use — detects stage commits and checks
# that they follow the feat(scope): stage N — <what grew> convention.
#
# Advisory only — outputs a warning but does not block.
# Runs AFTER test and review hooks.
# Requires: jq (for JSON I/O). Silently exits if jq is missing.

# Bail out if jq is not available
command -v jq >/dev/null 2>&1 || exit 0

# Read hook input from stdin
INPUT=$(cat)

# Extract the bash command that was executed
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Guard: only proceed if this was a git commit
if ! echo "$COMMAND" | grep -q 'git commit'; then
  exit 0
fi

# Check if the last commit message matches the stage pattern
COMMIT_MSG=$(git log -1 --pretty=%s 2>/dev/null || true)
if ! echo "$COMMIT_MSG" | grep -qiE 'stage [0-9]+'; then
  exit 0
fi

# This was a stage commit — check format
# Expected: feat(scope): stage N — <description>
if echo "$COMMIT_MSG" | grep -qE '^feat\([^)]+\): stage [0-9]+ — .+'; then
  # Correct format — exit silently
  exit 0
fi

# Format doesn't match — output advisory warning
echo "⚠️ Stage commit format suggestion" >&2

jq -n --arg msg "$COMMIT_MSG" '{
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: ("Commit format suggestion: the stage commit message does not follow the expected convention.\n\nActual:   " + $msg + "\nExpected: feat(scope): stage N — <what grew>\n\nThis is advisory only — the commit has already been made. Consider amending if appropriate.")
  }
}'

exit 0
```

**Step 4: Update settings.json to register the new hook**

Modify `templates/.claude/settings.json` to add the commit-format-check hook after the review hook:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/post-stage-test.sh"
          },
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/post-stage-review.sh"
          },
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/commit-format-check.sh"
          }
        ]
      }
    ]
  }
}
```

**Step 5: Copy hook and settings to project .claude/ (keep in sync)**

Copy `templates/.claude/hooks/commit-format-check.sh` to `.claude/hooks/commit-format-check.sh`.
Copy `templates/.claude/settings.json` to `.claude/settings.json`.

**Step 6: Run tests to verify they pass**

Run: `npm test`
Expected: All tests pass

**Step 7: Commit**

```bash
git add templates/.claude/hooks/commit-format-check.sh templates/.claude/settings.json .claude/hooks/commit-format-check.sh .claude/settings.json test/cli.test.mjs
git commit -m "feat(hooks): stage 3 — add commit format check hook

Growth plan: docs/growth/skills-first.md"
```

---

### Task 4: Superpowers Plugin Detection

**Files:**
- Modify: `bin/cli.mjs`
- Modify: `test/cli.test.mjs`

**Step 1: Write the failing tests**

Add to `test/cli.test.mjs`:

```javascript
describe('Superpowers plugin detection', () => {
  it('CLI output includes a superpowers-related message', () => {
    const { output } = runCLI();
    // Should mention superpowers regardless of whether plugin is installed
    assert.ok(
      /superpowers/i.test(output),
      'CLI output should mention superpowers plugin'
    );
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test 2>&1 | tail -20`
Expected: FAIL — CLI doesn't mention superpowers yet

**Step 3: Add superpowers detection to CLI**

Add to `bin/cli.mjs`, after the "Next steps" section (around line 166), before the final empty line:

```javascript
  // Detect superpowers plugin
  const homedir = process.env.HOME || process.env.USERPROFILE || '';
  const pluginsDir = join(homedir, '.claude', 'plugins');
  let hasSuperpowers = false;
  if (existsSync(pluginsDir)) {
    try {
      const entries = readdirSync(pluginsDir, { recursive: true });
      hasSuperpowers = entries.some(e => String(e).includes('superpowers'));
    } catch { /* ignore */ }
  }

  if (hasSuperpowers) {
    success(`Superpowers plugin detected — great companion for organic-growth!`);
  } else {
    info(`Tip: Install the superpowers plugin for TDD, debugging, and brainstorming skills`);
  }
```

**Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add bin/cli.mjs test/cli.test.mjs
git commit -m "feat(cli): stage 4 — superpowers plugin detection

Growth plan: docs/growth/skills-first.md"
```

---

### Task 5: Documentation and Growth Plan

**Files:**
- Create: `docs/growth/skills-first.md`
- Modify: `docs/product-dna.md` (mention skills, MCP, commit format hook)

**Step 1: Create the growth plan**

Create `docs/growth/skills-first.md` with the standard format documenting all 5 stages (4 completed + this one).

**Step 2: Update product DNA**

Add skills, MCP configuration, and commit format hook to the product DNA's feature list.

**Step 3: Run tests to verify nothing broke**

Run: `npm test`
Expected: All tests pass (existing README/DNA tests should still pass)

**Step 4: Commit**

```bash
git add docs/growth/skills-first.md docs/product-dna.md
git commit -m "feat(docs): stage 5 — growth plan and product DNA updates

Growth plan: docs/growth/skills-first.md"
```
