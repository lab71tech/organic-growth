import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, existsSync, statSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const PKG_PATH = join(import.meta.dirname, '..', 'package.json');

const CLI_PATH = join(import.meta.dirname, '..', 'bin', 'cli.mjs');

/** Run the CLI in a fresh temp directory and return { tmp, output }. */
function runCLI(extraArgs = []) {
  const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
  const output = execFileSync('node', [CLI_PATH, '--force', ...extraArgs], {
    cwd: tmp,
    encoding: 'utf8',
    timeout: 5000,
  });
  return { tmp, output };
}

describe('CLI smoke test', () => {
  it('runs without error and copies templates into target directory', () => {
    const { tmp, output } = runCLI();

    assert.ok(output.includes('Organic Growth'), 'should print banner');
    assert.ok(output.includes('Done!'), 'should print completion message');
    assert.ok(existsSync(join(tmp, 'CLAUDE.md')), 'should create CLAUDE.md at project root');
  });
});

describe('CLI template completeness', () => {
  it('installs all 15 template files', () => {
    const { tmp } = runCLI();

    const expectedFiles = [
      'CLAUDE.md',
      '.claude/agents/gardener.md',
      '.claude/commands/seed.md',
      '.claude/commands/grow.md',
      '.claude/commands/next.md',
      '.claude/commands/replan.md',
      '.claude/commands/review.md',
      '.claude/hooks/commit-format-check.sh',
      '.claude/hooks/post-stage-review.sh',
      '.claude/hooks/post-stage-test.sh',
      '.claude/settings.json',
      '.claude/skills/property-planning.md',
      '.claude/skills/stage-writing.md',
      '.claude/skills/quality-gates.md',
      '.mcp.json',
    ];

    for (const file of expectedFiles) {
      const fullPath = join(tmp, file);
      assert.ok(
        existsSync(fullPath),
        `expected template file to exist: ${file}`
      );
      // Verify file is not empty
      const stat = statSync(fullPath);
      assert.ok(
        stat.size > 0,
        `expected template file to be non-empty: ${file}`
      );
    }
  });

  it('creates the docs/growth/ directory', () => {
    const { tmp } = runCLI();

    const growthDir = join(tmp, 'docs', 'growth');
    assert.ok(
      existsSync(growthDir),
      'expected docs/growth/ directory to exist'
    );
    assert.ok(
      statSync(growthDir).isDirectory(),
      'expected docs/growth/ to be a directory'
    );
  });
});

describe('CLI --help flag', () => {
  it('prints usage information and does not install templates', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    const output = execFileSync('node', [CLI_PATH, '--help'], {
      cwd: tmp,
      encoding: 'utf8',
      timeout: 5000,
    });

    assert.ok(output.includes('Usage:'), 'should print usage section');
    assert.ok(output.includes('--force'), 'should document --force flag');
    assert.ok(output.includes('--help'), 'should document --help flag');
    assert.ok(output.includes('--version'), 'should document --version flag');
    assert.ok(!existsSync(join(tmp, '.claude')), 'should not install templates');
  });

  it('works with short flag -h', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    const output = execFileSync('node', [CLI_PATH, '-h'], {
      cwd: tmp,
      encoding: 'utf8',
      timeout: 5000,
    });

    assert.ok(output.includes('Usage:'), 'should print usage with -h');
  });
});

describe('CLI --version flag', () => {
  it('prints the version from package.json', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    const output = execFileSync('node', [CLI_PATH, '--version'], {
      cwd: tmp,
      encoding: 'utf8',
      timeout: 5000,
    });

    const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'));
    assert.ok(
      output.trim().includes(pkg.version),
      `should print version ${pkg.version}, got: ${output.trim()}`
    );
    assert.ok(!existsSync(join(tmp, '.claude')), 'should not install templates');
  });

  it('works with short flag -v', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    const output = execFileSync('node', [CLI_PATH, '-v'], {
      cwd: tmp,
      encoding: 'utf8',
      timeout: 5000,
    });

    const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'));
    assert.ok(
      output.trim().includes(pkg.version),
      `should print version with -v`
    );
  });
});

describe('Template content integrity', () => {
  const { tmp } = runCLI();

  it('CLAUDE.md contains key section markers', () => {
    const content = readFileSync(join(tmp, 'CLAUDE.md'), 'utf8');

    const markers = [
      'THE SEED',
      'THE SOIL',
      'LIGHT & WATER',
      'Organic Growth',
      'Growth Rules',
    ];
    for (const marker of markers) {
      assert.ok(
        content.includes(marker),
        `CLAUDE.md should contain "${marker}"`
      );
    }
  });

  it('gardener agent contains all three modes and quality gate', () => {
    const content = readFileSync(join(tmp, '.claude', 'agents', 'gardener.md'), 'utf8');

    const markers = [
      'Mode: PLAN',
      'Mode: GROW',
      'Mode: REPLAN',
      'Quality gate',
    ];
    for (const marker of markers) {
      assert.ok(
        content.includes(marker),
        `gardener.md should contain "${marker}"`
      );
    }
  });

  it('gardener agent contains property-based planning structure', () => {
    const content = readFileSync(join(tmp, '.claude', 'agents', 'gardener.md'), 'utf8');

    // P15: property-related markers are present
    const propertyMarkers = [
      'Properties:',
      'Depends on:',
      'Captures:',
      'Property-Based Planning',
      'Plan Self-Check',
    ];
    for (const marker of propertyMarkers) {
      assert.ok(
        content.includes(marker),
        `gardener.md should contain property marker "${marker}"`
      );
    }

    // P16: all four property categories are present
    const categories = [
      'INVARIANTS',
      'STATE TRANSITIONS',
      'ROUNDTRIPS',
      'BOUNDARIES',
    ];
    for (const category of categories) {
      assert.ok(
        content.includes(category),
        `gardener.md should contain property category "${category}"`
      );
    }
  });

  it('CLAUDE.md Growth Rules reference properties as stage definition mechanism', () => {
    const content = readFileSync(join(tmp, 'CLAUDE.md'), 'utf8');

    // P17: Growth Rules mention properties as the planning mechanism
    assert.ok(
      content.includes('properties'),
      'CLAUDE.md Growth Rules should mention properties'
    );

    // P18: no contradiction — should NOT say "one test" as the sole stage definition
    assert.ok(
      !content.includes('one intent = one test = one commit'),
      'CLAUDE.md should not use old "one test" formulation that contradicts property-based workflow'
    );

    // P18: should not mention "Verify:" as the stage check mechanism
    assert.ok(
      !content.includes('Verify:'),
      'CLAUDE.md should not reference "Verify:" which contradicts property-based gardener'
    );
  });

  it('all commands have a description in frontmatter', () => {
    const commands = ['seed', 'grow', 'next', 'replan', 'review'];

    for (const cmd of commands) {
      const content = readFileSync(join(tmp, '.claude', 'commands', `${cmd}.md`), 'utf8');
      assert.match(
        content,
        /^---\s*\ndescription:/m,
        `${cmd}.md should have a description in frontmatter`
      );
    }
  });
});

describe('Package publish readiness', () => {
  it('includes only expected files in the tarball', () => {
    const output = execFileSync('npm', ['pack', '--dry-run', '--json'], {
      cwd: join(import.meta.dirname, '..'),
      encoding: 'utf8',
      timeout: 10000,
    });
    const [info] = JSON.parse(output);
    const filePaths = info.files.map(f => f.path);

    // Must include these
    const required = [
      'bin/cli.mjs',
      'package.json',
      'templates/CLAUDE.md',
      'templates/.claude/agents/gardener.md',
    ];
    for (const file of required) {
      assert.ok(
        filePaths.includes(file),
        `tarball should include ${file}`
      );
    }

    // Must NOT include test files, docs, or dotfiles
    for (const file of filePaths) {
      assert.ok(!file.startsWith('test/'), `tarball should not include test files: ${file}`);
      assert.ok(!file.startsWith('docs/'), `tarball should not include docs: ${file}`);
      assert.ok(!file.startsWith('.claude/'), `tarball should not include project .claude/: ${file}`);
    }
  });

  it('package size is under 200KB (two template sets: Claude Code + opencode)', () => {
    const output = execFileSync('npm', ['pack', '--dry-run', '--json'], {
      cwd: join(import.meta.dirname, '..'),
      encoding: 'utf8',
      timeout: 10000,
    });
    const [info] = JSON.parse(output);
    const unpackedSize = info.unpackedSize;

    assert.ok(
      unpackedSize < 200 * 1024,
      `unpacked size ${unpackedSize} bytes should be under 200KB (${200 * 1024} bytes)`
    );
  });

  it('package.json has correct bin entry', () => {
    const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'));

    assert.ok(pkg.bin, 'package.json should have a bin field');
    assert.equal(
      pkg.bin['organic-growth'],
      'bin/cli.mjs',
      'bin should point to bin/cli.mjs'
    );
  });

  it('package.json has required publish fields', () => {
    const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'));

    assert.ok(pkg.name, 'should have a name');
    assert.ok(pkg.version, 'should have a version');
    assert.ok(pkg.description, 'should have a description');
    assert.ok(pkg.license, 'should have a license');
    assert.ok(pkg.files, 'should have a files field');
    assert.ok(Array.isArray(pkg.files), 'files should be an array');
  });
});

describe('Example growth plan documentation', () => {
  const EXAMPLE_PATH = join(import.meta.dirname, '..', 'docs', 'example-growth-plan.md');

  it('example growth plan exists and contains at least 3 stages with Properties sections', () => {
    // P19: example exists with 3+ stages having Properties sections
    assert.ok(existsSync(EXAMPLE_PATH), 'docs/example-growth-plan.md should exist');
    const content = readFileSync(EXAMPLE_PATH, 'utf8');

    // Count stages that have a Properties section (Stage N: ... followed by Properties:)
    const stageHeaders = content.match(/^[-*] .* Stage \d+:/gm);
    assert.ok(
      stageHeaders && stageHeaders.length >= 3,
      `should have at least 3 stages, found ${stageHeaders ? stageHeaders.length : 0}`
    );

    const propertiesSections = content.match(/Properties:/g);
    assert.ok(
      propertiesSections && propertiesSections.length >= 3,
      `should have at least 3 Properties: sections, found ${propertiesSections ? propertiesSections.length : 0}`
    );
  });

  it('example demonstrates all four property categories', () => {
    // P20: all four categories appear across stages
    const content = readFileSync(EXAMPLE_PATH, 'utf8');

    const categories = ['invariant', 'transition', 'roundtrip', 'boundary'];
    for (const category of categories) {
      assert.ok(
        content.includes(`[${category}]`),
        `example should demonstrate [${category}] property category`
      );
    }
  });

  it('example shows property accumulation via Depends on references', () => {
    // P21: later stages reference earlier properties
    const content = readFileSync(EXAMPLE_PATH, 'utf8');

    const dependsOnLines = content.match(/Depends on:/g);
    assert.ok(
      dependsOnLines && dependsOnLines.length >= 1,
      'example should have at least one "Depends on:" line'
    );

    // At least one Depends on should reference a property from an earlier stage
    assert.ok(
      /Depends on:.*P\d/m.test(content),
      'at least one "Depends on:" should reference a property like P1, P2, etc.'
    );
  });

  it('example shows completed and pending stages', () => {
    // P22: mix of completed (Done:) and pending stages
    const content = readFileSync(EXAMPLE_PATH, 'utf8');

    assert.ok(
      content.includes('Done:'),
      'example should have at least one completed stage with a Done: line'
    );
    // Pending stages use the unchecked marker (⬜) or have no Done: line
    // Check for ⬜ (U+2B1C white large square)
    assert.ok(
      content.includes('\u2b1c'),
      'example should have at least one pending stage (marked with \u2b1c)'
    );
  });

  it('README references the example growth plan', () => {
    // P23: README contains a link to the example
    const readme = readFileSync(join(import.meta.dirname, '..', 'README.md'), 'utf8');

    assert.ok(
      readme.includes('example-growth-plan'),
      'README should reference the example growth plan'
    );
  });
});

describe('README property-based planning section', () => {
  const README_PATH = join(import.meta.dirname, '..', 'README.md');

  it('contains a property-related heading between Philosophy and After Install', () => {
    // P8: section exists with correct heading
    const content = readFileSync(README_PATH, 'utf8');

    assert.ok(
      /## .*Propert/i.test(content),
      'README should have a heading containing "Propert" (Property/Properties)'
    );

    // Verify ordering: Philosophy -> Property section -> After Install
    const philosophyIdx = content.indexOf('## Philosophy');
    const propertyIdx = content.search(/## .*Propert/i);
    const afterInstallIdx = content.indexOf('## After Install');

    assert.ok(philosophyIdx < propertyIdx, 'Property section should come after Philosophy');
    assert.ok(propertyIdx < afterInstallIdx, 'Property section should come before After Install');
  });

  it('includes at least one good/bad property example pair', () => {
    // P9: concrete example showing the difference between scenario and property style
    const content = readFileSync(README_PATH, 'utf8');

    // Check for a bad example marker and a good example marker (❌/✅ are unambiguous)
    assert.ok(
      /❌/.test(content) && /✅/.test(content),
      'README should show a bad vs good property example (❌/✅ markers)'
    );
  });

  it('Philosophy section links to the property-based planning section', () => {
    // P11: reading path from overview to detail
    const content = readFileSync(README_PATH, 'utf8');

    assert.ok(
      content.includes('#property-based-planning'),
      'Philosophy section should link to #property-based-planning'
    );
  });

  it('explains property accumulation across stages', () => {
    // P10: the hardest concept for new users — properties are permanent
    const content = readFileSync(README_PATH, 'utf8');

    assert.ok(
      /properties.*accumulate|accumulate.*stages/is.test(content),
      'README should mention that properties accumulate across stages'
    );
  });
});

describe('Post-stage review hook (template)', () => {
  const { tmp } = runCLI();

  it('hook template exists and contains stage-commit detection logic (P8, P11)', () => {
    const hookPath = join(tmp, '.claude', 'hooks', 'post-stage-review.sh');
    assert.ok(existsSync(hookPath), 'template should install .claude/hooks/post-stage-review.sh');

    const content = readFileSync(hookPath, 'utf8');
    assert.ok(
      /git commit/.test(content),
      'hook template should check for "git commit" in the command'
    );
    assert.ok(
      /stage.*[0-9]|stage.*\\d/i.test(content),
      'hook template should check for stage number pattern'
    );
  });

  it('settings template exists with PostToolUse hook referencing the hook script (P9, P12)', () => {
    const settingsPath = join(tmp, '.claude', 'settings.json');
    assert.ok(existsSync(settingsPath), 'template should install .claude/settings.json');

    const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    assert.ok(settings.hooks, 'settings template should have a hooks key');
    assert.ok(settings.hooks.PostToolUse, 'settings template should have PostToolUse event');

    const bashHook = settings.hooks.PostToolUse.find(h => h.matcher === 'Bash');
    assert.ok(bashHook, 'settings template should have a Bash matcher');
    const reviewHook = bashHook.hooks.find(h => h.command.includes('post-stage-review'));
    assert.ok(
      reviewHook,
      'settings template should reference the review hook script'
    );
  });

  it('hook template outputs JSON with additionalContext (P13)', () => {
    const hookPath = join(tmp, '.claude', 'hooks', 'post-stage-review.sh');
    const content = readFileSync(hookPath, 'utf8');

    assert.ok(
      /additionalContext/.test(content),
      'hook template should output additionalContext in JSON'
    );
    assert.ok(
      /hookSpecificOutput/.test(content),
      'hook template should output hookSpecificOutput wrapper'
    );
  });
});

describe('Post-stage test hook (template)', () => {
  const { tmp } = runCLI();

  it('hook template exists and contains stage-commit detection logic', () => {
    const hookPath = join(tmp, '.claude', 'hooks', 'post-stage-test.sh');
    assert.ok(existsSync(hookPath), 'template should install .claude/hooks/post-stage-test.sh');

    const content = readFileSync(hookPath, 'utf8');
    assert.ok(
      /git commit/.test(content),
      'test hook template should check for "git commit" in the command'
    );
    assert.ok(
      /stage.*[0-9]|stage.*\\d/i.test(content),
      'test hook template should check for stage number pattern'
    );
  });

  it('template settings has test hook before review hook in hooks array', () => {
    const settingsPath = join(tmp, '.claude', 'settings.json');
    const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    const bashHook = settings.hooks.PostToolUse.find(h => h.matcher === 'Bash');

    const testIdx = bashHook.hooks.findIndex(h => h.command.includes('post-stage-test'));
    const reviewIdx = bashHook.hooks.findIndex(h => h.command.includes('post-stage-review'));
    assert.ok(testIdx >= 0, 'settings should have a test hook');
    assert.ok(reviewIdx >= 0, 'settings should have a review hook');
    assert.ok(
      testIdx < reviewIdx,
      `test hook (index ${testIdx}) should come before review hook (index ${reviewIdx})`
    );
  });

  it('template hook discovers test command from CLAUDE.md **Test:** field', () => {
    const hookPath = join(tmp, '.claude', 'hooks', 'post-stage-test.sh');
    const content = readFileSync(hookPath, 'utf8');

    assert.ok(
      /\*\*Test:\*\*/.test(content) || /Test:/.test(content),
      'test hook should parse the **Test:** field from CLAUDE.md'
    );
    assert.ok(
      /CLAUDE\.md/.test(content),
      'test hook should reference CLAUDE.md for test command discovery'
    );
  });

  it('template hook exits silently when no test command found (placeholder)', () => {
    const hookPath = join(tmp, '.claude', 'hooks', 'post-stage-test.sh');
    const content = readFileSync(hookPath, 'utf8');

    assert.ok(
      /\[e\.g/.test(content) || /placeholder/.test(content) || /\\\[/.test(content),
      'test hook should handle placeholder values like [e.g.: ...]'
    );
  });

  it('template hook outputs JSON with additionalContext', () => {
    const hookPath = join(tmp, '.claude', 'hooks', 'post-stage-test.sh');
    const content = readFileSync(hookPath, 'utf8');

    assert.ok(
      /additionalContext/.test(content),
      'test hook should output additionalContext in JSON'
    );
    assert.ok(
      /hookSpecificOutput/.test(content),
      'test hook should output hookSpecificOutput wrapper'
    );
  });

  it('template hook has eval safety comment', () => {
    const hookPath = join(tmp, '.claude', 'hooks', 'post-stage-test.sh');
    const content = readFileSync(hookPath, 'utf8');

    assert.ok(
      /eval.*acceptable|Safety:.*eval/i.test(content),
      'test hook should have a safety comment near eval'
    );
  });

  it('runs end-to-end: parses CLAUDE.md, runs test command, outputs JSON (P21)', () => {
    // Set up a fresh temp dir with installed templates
    const { tmp: hookTmp } = runCLI();

    // Write a CLAUDE.md with a real test command
    writeFileSync(join(hookTmp, 'CLAUDE.md'), '- **Test:** `echo test-passed`\n');

    // Create a git repo with a stage commit so the guards pass
    execFileSync('git', ['init'], { cwd: hookTmp, encoding: 'utf8' });
    execFileSync('git', ['config', 'user.email', 'test@test.com'], { cwd: hookTmp });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: hookTmp });
    writeFileSync(join(hookTmp, 'dummy.txt'), 'hello');
    execFileSync('git', ['add', '.'], { cwd: hookTmp, encoding: 'utf8' });
    execFileSync('git', ['commit', '-m', 'feat(test): stage 1 — initial'], {
      cwd: hookTmp,
      encoding: 'utf8',
    });

    // Run the hook with mock stdin simulating a git commit tool event
    const stdinJSON = JSON.stringify({ tool_input: { command: 'git commit -m "feat(test): stage 1"' } });
    const hookPath = join(hookTmp, '.claude', 'hooks', 'post-stage-test.sh');
    const hookOutput = execFileSync('bash', [hookPath], {
      cwd: hookTmp,
      encoding: 'utf8',
      input: stdinJSON,
      timeout: 10000,
    });

    // Parse the JSON output and verify additionalContext
    const parsed = JSON.parse(hookOutput);
    assert.ok(
      parsed.hookSpecificOutput,
      'output should have hookSpecificOutput'
    );
    assert.ok(
      parsed.hookSpecificOutput.additionalContext.includes('All tests passed'),
      `additionalContext should include "All tests passed", got: ${parsed.hookSpecificOutput.additionalContext}`
    );
  });
});

describe('Post-stage test hook (project)', () => {
  const HOOK_PATH = join(import.meta.dirname, '..', '.claude', 'hooks', 'post-stage-test.sh');
  const SETTINGS_PATH = join(import.meta.dirname, '..', '.claude', 'settings.json');

  it('hook script exists at .claude/hooks/post-stage-test.sh', () => {
    assert.ok(existsSync(HOOK_PATH), '.claude/hooks/post-stage-test.sh should exist');
    const stat = statSync(HOOK_PATH);
    assert.ok(stat.size > 0, 'hook script should not be empty');
  });

  it('settings.json has test hook before review hook', () => {
    const settings = JSON.parse(readFileSync(SETTINGS_PATH, 'utf8'));
    const bashHook = settings.hooks.PostToolUse.find(h => h.matcher === 'Bash');

    const testIdx = bashHook.hooks.findIndex(h => h.command.includes('post-stage-test'));
    const reviewIdx = bashHook.hooks.findIndex(h => h.command.includes('post-stage-review'));
    assert.ok(testIdx >= 0, 'settings should have a test hook');
    assert.ok(reviewIdx >= 0, 'settings should have a review hook');
    assert.ok(
      testIdx < reviewIdx,
      `test hook (index ${testIdx}) should come before review hook (index ${reviewIdx})`
    );
  });

  it('hook runs node --test for this project', () => {
    const content = readFileSync(HOOK_PATH, 'utf8');

    assert.ok(
      /node --test/.test(content),
      'project test hook should run node --test'
    );
  });

  it('hook outputs JSON with hookSpecificOutput.additionalContext', () => {
    const content = readFileSync(HOOK_PATH, 'utf8');

    assert.ok(
      /additionalContext/.test(content),
      'hook should output additionalContext in JSON'
    );
    assert.ok(
      /hookSpecificOutput/.test(content),
      'hook should output hookSpecificOutput wrapper'
    );
  });

  it('hook exits cleanly for non-commit commands', () => {
    const content = readFileSync(HOOK_PATH, 'utf8');

    const exitCount = (content.match(/exit 0/g) || []).length;
    assert.ok(
      exitCount >= 2,
      `hook should have at least 2 exit points (guard clause + final), found ${exitCount}`
    );
  });
});

describe('Post-stage review hook (project)', () => {
  const HOOK_PATH = join(import.meta.dirname, '..', '.claude', 'hooks', 'post-stage-review.sh');
  const SETTINGS_PATH = join(import.meta.dirname, '..', '.claude', 'settings.json');

  it('hook script exists at .claude/hooks/post-stage-review.sh (P1)', () => {
    assert.ok(existsSync(HOOK_PATH), '.claude/hooks/post-stage-review.sh should exist');
    const stat = statSync(HOOK_PATH);
    assert.ok(stat.size > 0, 'hook script should not be empty');
  });

  it('settings.json has PostToolUse hook for Bash referencing the hook script (P2)', () => {
    assert.ok(existsSync(SETTINGS_PATH), '.claude/settings.json should exist');
    const settings = JSON.parse(readFileSync(SETTINGS_PATH, 'utf8'));

    assert.ok(settings.hooks, 'settings should have a hooks key');
    assert.ok(settings.hooks.PostToolUse, 'hooks should have PostToolUse event');
    assert.ok(Array.isArray(settings.hooks.PostToolUse), 'PostToolUse should be an array');

    const bashHook = settings.hooks.PostToolUse.find(h => h.matcher === 'Bash');
    assert.ok(bashHook, 'should have a PostToolUse hook with matcher "Bash"');
    assert.ok(bashHook.hooks && bashHook.hooks.length > 0, 'Bash hook should have at least one hook entry');

    const reviewHook = bashHook.hooks.find(h => h.command.includes('post-stage-review'));
    assert.ok(
      reviewHook,
      `should have a hook referencing post-stage-review script`
    );
  });

  it('hook script detects git commit commands and checks for stage pattern (P3)', () => {
    const content = readFileSync(HOOK_PATH, 'utf8');

    assert.ok(
      /git commit/.test(content),
      'hook should check for "git commit" in the command'
    );
    assert.ok(
      /stage.*[0-9]|stage.*\\d/i.test(content),
      'hook should check for stage number pattern in commit message'
    );
  });

  it('hook outputs JSON with hookSpecificOutput.additionalContext when triggered (P4)', () => {
    const content = readFileSync(HOOK_PATH, 'utf8');

    assert.ok(
      /additionalContext/.test(content),
      'hook should output additionalContext in JSON'
    );
    assert.ok(
      /hookSpecificOutput/.test(content),
      'hook should output hookSpecificOutput wrapper'
    );
  });

  it('hook exits cleanly for non-commit commands with no stdout (P5)', () => {
    const content = readFileSync(HOOK_PATH, 'utf8');

    // Script should exit 0 early when command is not a git commit
    assert.ok(
      /exit 0/.test(content),
      'hook should have early exit 0 for non-matching commands'
    );
    // The git commit check should be a guard clause (exit before output)
    const exitCount = (content.match(/exit 0/g) || []).length;
    assert.ok(
      exitCount >= 2,
      `hook should have at least 2 exit points (guard clause + final), found ${exitCount}`
    );
  });

  it('settings.json uses bash to invoke all hook scripts — no executable bit needed (P6)', () => {
    const settings = JSON.parse(readFileSync(SETTINGS_PATH, 'utf8'));
    const bashHook = settings.hooks.PostToolUse.find(h => h.matcher === 'Bash');

    for (const hook of bashHook.hooks) {
      assert.ok(
        hook.command.startsWith('bash '),
        `hook command should start with "bash " to avoid needing executable bit, got: ${hook.command}`
      );
    }
  });
});

describe('Post-stage review hook documentation', () => {
  const README_PATH = join(import.meta.dirname, '..', 'README.md');
  const DNA_PATH = join(import.meta.dirname, '..', 'docs', 'product-dna.md');

  it('README mentions automatic post-stage review (P14)', () => {
    const content = readFileSync(README_PATH, 'utf8');

    assert.ok(
      /post-stage review/i.test(content),
      'README should mention "post-stage review"'
    );
  });

  it('README explains what triggers the hook and what it does (P15)', () => {
    const content = readFileSync(README_PATH, 'utf8');

    // Should explain the trigger: stage commits
    assert.ok(
      /stage.*commit/i.test(content) || /commit.*stage/i.test(content),
      'README should explain that the hook triggers on stage commits'
    );

    // Should explain the effect: diff for review
    assert.ok(
      /diff/i.test(content),
      'README should mention diff injection for review context'
    );
  });

  it('product DNA reflects automatic review capability (P16)', () => {
    const content = readFileSync(DNA_PATH, 'utf8');

    assert.ok(
      /automatic.*review|auto.*review|post-stage.*review/i.test(content),
      'product DNA should mention automatic/post-stage review capability'
    );
  });

  it('all existing README headings remain intact in order (P17)', () => {
    const content = readFileSync(README_PATH, 'utf8');

    const expectedHeadings = [
      '## Install',
      '## What You Get',
      '## Workflow',
      '## Philosophy',
      '## Property-Based Planning',
      '## After Install',
      '## Releases',
      '## License',
    ];

    let lastIdx = -1;
    for (const heading of expectedHeadings) {
      const idx = content.indexOf(heading);
      assert.ok(
        idx > lastIdx,
        `README heading "${heading}" should exist and appear after previous heading (found at ${idx}, previous at ${lastIdx})`
      );
      lastIdx = idx;
    }
  });
});

describe('CLI DNA document handling', () => {
  it('copies a DNA file to docs/product-dna.md', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    const dnaContent = '# My Product DNA\n\nThis is test DNA content.\n';
    writeFileSync(join(tmp, 'my-spec.md'), dnaContent);

    execFileSync('node', [CLI_PATH, '--force', 'my-spec.md'], {
      cwd: tmp,
      encoding: 'utf8',
      timeout: 5000,
    });

    const dnaDest = join(tmp, 'docs', 'product-dna.md');
    assert.ok(existsSync(dnaDest), 'should copy DNA to docs/product-dna.md');
    assert.equal(
      readFileSync(dnaDest, 'utf8'),
      dnaContent,
      'DNA content should match source'
    );
  });

  it('prints success message when DNA file is copied', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    writeFileSync(join(tmp, 'spec.md'), '# Spec\n');

    const output = execFileSync('node', [CLI_PATH, '--force', 'spec.md'], {
      cwd: tmp,
      encoding: 'utf8',
      timeout: 5000,
    });

    assert.ok(
      output.includes('Product DNA copied'),
      'should print DNA copied message'
    );
  });

  it('warns when DNA file does not exist', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));

    const output = execFileSync('node', [CLI_PATH, '--force', 'nonexistent.md'], {
      cwd: tmp,
      encoding: 'utf8',
      timeout: 5000,
    });

    assert.ok(
      output.includes('DNA file not found'),
      'should warn about missing DNA file'
    );
  });
});

describe('Plant-themed decorations in growth plan template (Stage 2)', () => {
  const { tmp } = runCLI();

  /**
   * Helper: extract the PLAN mode section 5 plan template from gardener.
   * The template is inside a markdown code block starting with "```markdown"
   * in step 5 of PLAN mode.
   */
  function getPlanTemplate(content) {
    const match = content.match(/5\. Create a growth plan[\s\S]*?```markdown\n([\s\S]*?)```/);
    assert.ok(match, 'should find plan template code block in PLAN mode step 5');
    return match[1];
  }

  it('P5: plan template contains at least one plant-themed section divider or ornament beyond status markers', () => {
    const content = readFileSync(join(tmp, '.claude', 'agents', 'gardener.md'), 'utf8');
    const template = getPlanTemplate(content);

    // Plant-themed Unicode characters beyond the status markers (🌱 Growing / 🌳 Complete)
    // Look for plant emojis used as dividers or ornaments: 🌿, 🌻, 🍃, 🌾, 🪴, etc.
    // or plant-themed ASCII art dividers
    const plantDividerPattern = /🌿|🍃|🌾|🪴|🌻|─.*🌱.*─|─.*🌿.*─|╌|leaf|vine/i;
    assert.ok(
      plantDividerPattern.test(template),
      'plan template should contain at least one plant-themed divider or ornament character'
    );
  });

  it('P6: stage markers use plant-themed symbols — completed = mature marker, pending = seed/sprout marker', () => {
    const content = readFileSync(join(tmp, '.claude', 'agents', 'gardener.md'), 'utf8');
    const template = getPlanTemplate(content);

    // Pending stages should use a seed/sprout marker (🌱) instead of ⬜
    assert.ok(
      /- 🌱 Stage \d+:/.test(template),
      'pending stages in template should use 🌱 (seed/sprout) marker'
    );

    // The template should NOT use generic ⬜ for pending stages
    assert.ok(
      !/- ⬜ Stage \d+:/.test(template),
      'pending stages should not use generic ⬜ checkbox marker'
    );
  });

  it('P7: plan template header includes a plant-themed visual element', () => {
    const content = readFileSync(join(tmp, '.claude', 'agents', 'gardener.md'), 'utf8');
    const template = getPlanTemplate(content);

    // The header line (first line, starting with #) should include a plant emoji
    const headerLine = template.split('\n').find(line => line.startsWith('#'));
    assert.ok(headerLine, 'template should have a header line starting with #');

    const plantEmoji = /🌱|🌿|🌳|🌻|🍃|🌾|🪴|🪻/;
    assert.ok(
      plantEmoji.test(headerLine),
      `template header should include a plant-themed emoji, got: "${headerLine}"`
    );
  });

  it('P8: all decorative markers are valid Unicode that render in standard markdown viewers', () => {
    const content = readFileSync(join(tmp, '.claude', 'agents', 'gardener.md'), 'utf8');
    const template = getPlanTemplate(content);

    // Extract all emoji/special characters from the template
    // Check that none are from Private Use Areas (U+E000-F8FF, U+F0000-FFFFD, U+100000-10FFFD)
    const codePoints = [...template].map(ch => ch.codePointAt(0));
    const privateUse = codePoints.filter(
      cp => (cp >= 0xE000 && cp <= 0xF8FF) ||
            (cp >= 0xF0000 && cp <= 0xFFFFD) ||
            (cp >= 0x100000 && cp <= 0x10FFFD)
    );
    assert.equal(
      privateUse.length,
      0,
      `template should not contain Private Use Area characters, found ${privateUse.length}`
    );

    // Verify plant emojis used are from standard Unicode blocks (Emoji, Misc Symbols)
    // All plant emojis we use (🌱🌿🌳🌻🍃🌾🪴) are in ranges U+1F300-1F9FF
    // This is a sanity check — they should all be valid
    const emojiPattern = /[\u{1F300}-\u{1F9FF}]/u;
    assert.ok(
      emojiPattern.test(template),
      'template should contain at least one standard Unicode emoji'
    );
  });

  it('P9: Status field still uses 🌱 Growing and 🌳 Complete — decorations do not replace semantic markers', () => {
    const content = readFileSync(join(tmp, '.claude', 'agents', 'gardener.md'), 'utf8');
    const template = getPlanTemplate(content);

    // Status line must still contain 🌱 Growing
    assert.ok(
      /Status: 🌱 Growing/.test(template),
      'template should still have "Status: 🌱 Growing"'
    );

    // Check that the gardener instructions still reference 🌳 Complete
    // (this is in PLAN mode step 6 / update section, not necessarily in the template itself)
    assert.ok(
      /🌳 Complete/.test(content),
      'gardener template should still reference 🌳 Complete for finished plans'
    );
  });
});

describe('Visual markers regression guard (Stage 3)', () => {
  const TEMPLATE_PATH = join(import.meta.dirname, '..', 'templates', '.claude', 'agents', 'gardener.md');
  const PROJECT_PATH = join(import.meta.dirname, '..', '.claude', 'agents', 'gardener.md');

  it('P10: GROW mode step 8 contains a multi-line progress display — not a single-line format', () => {
    const content = readFileSync(TEMPLATE_PATH, 'utf8');

    // Extract step 8
    const step8Match = content.match(/8\. Report:[\s\S]*?(?=\n## Mode: REPLAN|\n# Critical)/);
    assert.ok(step8Match, 'should find step 8 (Report) in GROW mode');
    const step8 = step8Match[0];

    // Must contain a multi-line stage listing — multiple "Stage N:" lines
    const stageLines = step8.match(/Stage \d+:/g);
    assert.ok(
      stageLines && stageLines.length >= 3,
      `step 8 should contain at least 3 "Stage N:" lines for a multi-line display, found ${stageLines ? stageLines.length : 0}`
    );

    // Must NOT contain the old single-line emoji progress format
    assert.ok(
      !/Stage \d+\/~\d+ — /.test(step8),
      'step 8 should not contain the old single-line "Stage N/~M — " progress format'
    );
  });

  it('P11: PLAN mode template uses plant-themed stage markers distinct from generic markers', () => {
    const content = readFileSync(TEMPLATE_PATH, 'utf8');

    // Extract the plan template code block from PLAN mode step 5
    const templateMatch = content.match(/5\. Create a growth plan[\s\S]*?```markdown\n([\s\S]*?)```/);
    assert.ok(templateMatch, 'should find plan template code block in PLAN mode step 5');
    const planTemplate = templateMatch[1];

    // Pending stages must use plant-themed marker (not generic checkbox)
    assert.ok(
      /- 🌱 Stage \d+:/.test(planTemplate),
      'pending stages in plan template should use plant-themed marker (🌱), not generic checkbox'
    );
    assert.ok(
      !/- ⬜ Stage \d+:/.test(planTemplate),
      'plan template should not use generic ⬜ for pending stage markers'
    );
    assert.ok(
      !/- ✅ Stage \d+:/.test(planTemplate),
      'plan template should not use generic ✅ for stage markers (use 🌳 for completed)'
    );

    // Horizon items must use a plant-themed marker
    assert.ok(
      /- 🌿/.test(planTemplate),
      'Horizon items in plan template should use plant-themed marker (🌿)'
    );
  });

  it('P12: templates/.claude/agents/gardener.md and .claude/agents/gardener.md are identical', () => {
    const templateContent = readFileSync(TEMPLATE_PATH, 'utf8');
    const projectContent = readFileSync(PROJECT_PATH, 'utf8');

    assert.equal(
      templateContent,
      projectContent,
      'template gardener.md and project gardener.md must be identical — they have drifted apart'
    );
  });
});

describe('Visual growth plan documentation (Stage 4)', () => {
  const README_PATH = join(import.meta.dirname, '..', 'README.md');

  it('P13: README mentions the visual/plant-themed format of growth plans', () => {
    const content = readFileSync(README_PATH, 'utf8');

    // The README should mention that growth plans use plant-themed visual markers
    // somewhere in the existing content — not necessarily a new section
    assert.ok(
      /plant.themed|plant.inspired|growth.themed|organic.*marker|plant.*marker|plant.*visual|visual.*marker.*growth/i.test(content),
      'README should mention the plant-themed visual format of growth plans'
    );
  });

  it('P14: all existing README headings remain intact and in order', () => {
    // This property is also checked by the existing test at "Post-stage review hook documentation"
    // but we verify it explicitly here for the Stage 4 contract
    const content = readFileSync(README_PATH, 'utf8');

    const expectedHeadings = [
      '## Install',
      '## What You Get',
      '## Workflow',
      '## Philosophy',
      '## Property-Based Planning',
      '## After Install',
      '## Releases',
      '## License',
    ];

    let lastIdx = -1;
    for (const heading of expectedHeadings) {
      const idx = content.indexOf(heading);
      assert.ok(
        idx > lastIdx,
        `README heading "${heading}" should exist and appear after previous heading (found at ${idx}, previous at ${lastIdx})`
      );
      lastIdx = idx;
    }
  });
});

describe('Hook visual feedback — test hook stderr messages (Stage 1)', () => {
  const PROJECT_HOOK = join(import.meta.dirname, '..', '.claude', 'hooks', 'post-stage-test.sh');
  const TEMPLATE_HOOK = join(import.meta.dirname, '..', 'templates', '.claude', 'hooks', 'post-stage-test.sh');

  it('P1: both hooks contain at least one >&2 echo with an emoji character', () => {
    const projectContent = readFileSync(PROJECT_HOOK, 'utf8');
    const templateContent = readFileSync(TEMPLATE_HOOK, 'utf8');

    // Match a line that contains both >&2 and a Unicode emoji (in either order)
    // Covers: U+1F300-1F9FF (misc symbols & pictographs), U+2705 (check), U+274C (cross)
    const stderrEmojiPattern = />&2.*[\u{1F300}-\u{1F9FF}\u{2705}\u{274C}]|[\u{1F300}-\u{1F9FF}\u{2705}\u{274C}].*>&2/u;

    assert.ok(
      stderrEmojiPattern.test(projectContent),
      'project test hook should have at least one stderr echo with an emoji'
    );
    assert.ok(
      stderrEmojiPattern.test(templateContent),
      'template test hook should have at least one stderr echo with an emoji'
    );
  });

  it('P2: hooks emit a stderr message BEFORE running the test suite', () => {
    const projectContent = readFileSync(PROJECT_HOOK, 'utf8');
    const templateContent = readFileSync(TEMPLATE_HOOK, 'utf8');

    // The "before tests" message must appear before the actual test execution line.
    // Pattern: a line containing both an emoji and >&2 (in either order, e.g. echo "emoji" >&2)
    // Project hook uses: node --test
    // Template hook uses: eval "$TEST_CMD"
    const emojiStderrLine = /^.*[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{2702}-\u{27B0}\u{2705}\u{274C}].*>&2|^.*>&2.*[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{2702}-\u{27B0}\u{2705}\u{274C}]/um;

    for (const [label, content, testLine] of [
      ['project', projectContent, 'node --test'],
      ['template', templateContent, 'eval "$TEST_CMD"'],
    ]) {
      const match = content.match(emojiStderrLine);
      const beforeIdx = match ? content.indexOf(match[0]) : -1;
      const testIdx = content.indexOf(testLine);
      assert.ok(
        beforeIdx >= 0 && testIdx >= 0 && beforeIdx < testIdx,
        `${label} hook should emit a stderr emoji message before running tests (beforeIdx=${beforeIdx}, testIdx=${testIdx})`
      );
    }
  });

  it('P3: hooks emit different emoji for pass vs fail after tests complete', () => {
    const projectContent = readFileSync(PROJECT_HOOK, 'utf8');
    const templateContent = readFileSync(TEMPLATE_HOOK, 'utf8');

    for (const [label, content] of [
      ['project', projectContent],
      ['template', templateContent],
    ]) {
      // Check that the hook has a pass-emoji line and a fail-emoji line on stderr
      const hasPassEmoji = content.includes('>&2') && content.includes('\u2705');
      const hasFailEmoji = content.includes('>&2') && content.includes('\u274C');

      assert.ok(
        hasPassEmoji,
        `${label} hook should emit a pass emoji (e.g. checkmark) to stderr after tests pass`
      );
      assert.ok(
        hasFailEmoji,
        `${label} hook should emit a fail emoji (e.g. cross mark) to stderr after tests fail`
      );
    }
  });

  it('P4: stderr messages do not interfere with JSON stdout — hook still produces valid JSON', () => {
    // Set up a temp dir with a git repo and stage commit
    const { tmp } = runCLI();
    writeFileSync(join(tmp, 'CLAUDE.md'), '- **Test:** `echo test-passed`\n');
    execFileSync('git', ['init'], { cwd: tmp, encoding: 'utf8' });
    execFileSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tmp });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tmp });
    writeFileSync(join(tmp, 'dummy.txt'), 'hello');
    execFileSync('git', ['add', '.'], { cwd: tmp, encoding: 'utf8' });
    execFileSync('git', ['commit', '-m', 'feat(test): stage 1 — initial'], {
      cwd: tmp,
      encoding: 'utf8',
    });

    const stdinJSON = JSON.stringify({ tool_input: { command: 'git commit -m "feat(test): stage 1"' } });
    const hookPath = join(tmp, '.claude', 'hooks', 'post-stage-test.sh');

    // Run hook capturing stdout and stderr separately
    const result = execFileSync('bash', [hookPath], {
      cwd: tmp,
      encoding: 'utf8',
      input: stdinJSON,
      timeout: 10000,
    });

    // stdout must be valid JSON
    const parsed = JSON.parse(result);
    assert.ok(
      parsed.hookSpecificOutput,
      'stdout should still contain valid hookSpecificOutput JSON'
    );
    assert.ok(
      parsed.hookSpecificOutput.additionalContext,
      'stdout JSON should have additionalContext'
    );
  });

  it('P5: project and template hooks have functionally equivalent stderr messages', () => {
    const projectContent = readFileSync(PROJECT_HOOK, 'utf8');
    const templateContent = readFileSync(TEMPLATE_HOOK, 'utf8');

    // Extract all stderr echo lines from both files
    const stderrLinePattern = /echo.*>&2|>&2.*echo/g;

    const projectStderrLines = projectContent.match(stderrLinePattern) || [];
    const templateStderrLines = templateContent.match(stderrLinePattern) || [];

    assert.ok(
      projectStderrLines.length > 0,
      'project hook should have stderr echo lines'
    );
    assert.equal(
      projectStderrLines.length,
      templateStderrLines.length,
      `project and template should have the same number of stderr echo lines (project: ${projectStderrLines.length}, template: ${templateStderrLines.length})`
    );

    // Extract just the message content (the part inside quotes) from each stderr line
    // and verify they contain the same emoji characters
    const emojiPattern = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{2700}-\u{27BF}\u{2702}-\u{27B0}\u{FE00}-\u{FE0F}\u{200D}\u{2705}\u{274C}]/gu;

    const projectEmoji = (projectContent.match(emojiPattern) || []).sort().join('');
    const templateEmoji = (templateContent.match(emojiPattern) || []).sort().join('');

    assert.equal(
      projectEmoji,
      templateEmoji,
      `project and template should use the same emoji characters (project: ${projectEmoji}, template: ${templateEmoji})`
    );
  });
});

describe('Hook visual feedback — review hook stderr messages (Stage 2)', () => {
  const PROJECT_HOOK = join(import.meta.dirname, '..', '.claude', 'hooks', 'post-stage-review.sh');
  const TEMPLATE_HOOK = join(import.meta.dirname, '..', 'templates', '.claude', 'hooks', 'post-stage-review.sh');

  it('P6: both hooks contain at least one >&2 echo with an emoji character', () => {
    const projectContent = readFileSync(PROJECT_HOOK, 'utf8');
    const templateContent = readFileSync(TEMPLATE_HOOK, 'utf8');

    // Match a line that contains both >&2 and a Unicode emoji
    const stderrEmojiPattern = />&2.*[\u{1F300}-\u{1F9FF}\u{2705}\u{274C}]|[\u{1F300}-\u{1F9FF}\u{2705}\u{274C}].*>&2/u;

    assert.ok(
      stderrEmojiPattern.test(projectContent),
      'project review hook should have at least one stderr echo with an emoji'
    );
    assert.ok(
      stderrEmojiPattern.test(templateContent),
      'template review hook should have at least one stderr echo with an emoji'
    );
  });

  it('P7: hooks emit a stderr message indicating gathering review context', () => {
    const projectContent = readFileSync(PROJECT_HOOK, 'utf8');
    const templateContent = readFileSync(TEMPLATE_HOOK, 'utf8');

    for (const [label, content] of [
      ['project', projectContent],
      ['template', templateContent],
    ]) {
      // Must have a stderr line mentioning gathering/collecting review context
      assert.ok(
        />&2/.test(content) && /[Gg]athering.*review|[Cc]ollecting.*review/i.test(content),
        `${label} review hook should emit a stderr message about gathering review context`
      );
    }
  });

  it('P8: hooks emit a stderr message when review context is ready', () => {
    const projectContent = readFileSync(PROJECT_HOOK, 'utf8');
    const templateContent = readFileSync(TEMPLATE_HOOK, 'utf8');

    for (const [label, content] of [
      ['project', projectContent],
      ['template', templateContent],
    ]) {
      // Must have a stderr line mentioning ready/prepared/complete
      assert.ok(
        />&2/.test(content) && /[Rr]eview context ready|[Rr]eady for review/i.test(content),
        `${label} review hook should emit a stderr message when review context is ready`
      );
    }
  });

  it('P9: stderr messages do not interfere with JSON stdout — hook still produces valid JSON', () => {
    // Set up a temp dir with a git repo and stage commit
    const { tmp } = runCLI();
    execFileSync('git', ['init'], { cwd: tmp, encoding: 'utf8' });
    execFileSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tmp });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tmp });
    writeFileSync(join(tmp, 'dummy.txt'), 'hello');
    execFileSync('git', ['add', '.'], { cwd: tmp, encoding: 'utf8' });
    execFileSync('git', ['commit', '-m', 'feat(review): stage 1 — initial'], {
      cwd: tmp,
      encoding: 'utf8',
    });

    const stdinJSON = JSON.stringify({ tool_input: { command: 'git commit -m "feat(review): stage 1"' } });
    const hookPath = join(tmp, '.claude', 'hooks', 'post-stage-review.sh');

    // Run hook — stdout must be valid JSON despite stderr emoji messages
    const result = execFileSync('bash', [hookPath], {
      cwd: tmp,
      encoding: 'utf8',
      input: stdinJSON,
      timeout: 10000,
    });

    const parsed = JSON.parse(result);
    assert.ok(
      parsed.hookSpecificOutput,
      'stdout should still contain valid hookSpecificOutput JSON'
    );
    assert.ok(
      parsed.hookSpecificOutput.additionalContext,
      'stdout JSON should have additionalContext'
    );
  });

  it('P10: project and template hooks have functionally equivalent stderr messages', () => {
    const projectContent = readFileSync(PROJECT_HOOK, 'utf8');
    const templateContent = readFileSync(TEMPLATE_HOOK, 'utf8');

    // Extract all stderr echo lines from both files
    const stderrLinePattern = /echo.*>&2|>&2.*echo/g;

    const projectStderrLines = projectContent.match(stderrLinePattern) || [];
    const templateStderrLines = templateContent.match(stderrLinePattern) || [];

    assert.ok(
      projectStderrLines.length > 0,
      'project review hook should have stderr echo lines'
    );
    assert.equal(
      projectStderrLines.length,
      templateStderrLines.length,
      `project and template should have the same number of stderr echo lines (project: ${projectStderrLines.length}, template: ${templateStderrLines.length})`
    );

    // Verify they use the same emoji characters
    const emojiPattern = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{2700}-\u{27BF}\u{2702}-\u{27B0}\u{FE00}-\u{FE0F}\u{200D}\u{2705}\u{274C}]/gu;

    const projectEmoji = (projectContent.match(emojiPattern) || []).sort().join('');
    const templateEmoji = (templateContent.match(emojiPattern) || []).sort().join('');

    assert.equal(
      projectEmoji,
      templateEmoji,
      `project and template should use the same emoji characters (project: ${projectEmoji}, template: ${templateEmoji})`
    );
  });
});

describe('Visual progress map in GROW mode report (Stage 1)', () => {
  const { tmp } = runCLI();

  /**
   * Helper: extract GROW mode step 8 section from gardener template.
   * Step 8 starts at "8. Report:" and ends at the next top-level
   * section ("## Mode: REPLAN" or "# Critical").
   */
  function getStep8(content) {
    const match = content.match(/8\. Report:[\s\S]*?(?=\n## Mode: REPLAN|\n# Critical)/);
    assert.ok(match, 'should find step 8 (Report) in GROW mode');
    return match[0];
  }

  it('P1: step 8 includes a multi-line stage progress section listing each stage with status and title', () => {
    const content = readFileSync(join(tmp, '.claude', 'agents', 'gardener.md'), 'utf8');
    const step8 = getStep8(content);

    // Must contain multiple lines describing stages — look for a format
    // that lists stage numbers with titles on separate lines
    assert.ok(
      /Stage \d+.*:/.test(step8),
      'step 8 should contain stage listing with numbers and titles'
    );

    // The progress section must be multi-line — it should describe a
    // format where each stage gets its own line
    assert.ok(
      /each stage/i.test(step8) || /every stage/i.test(step8) || /all stages/i.test(step8),
      'step 8 should instruct listing each/every/all stage(s)'
    );
  });

  it('P2: progress section distinguishes at least three states — completed, current, and upcoming', () => {
    const content = readFileSync(join(tmp, '.claude', 'agents', 'gardener.md'), 'utf8');
    const step8 = getStep8(content);

    // Must mention or show three distinct state markers
    const hasCompleted = /completed|done|finished/i.test(step8);
    const hasCurrent = /current|active|in.progress/i.test(step8);
    const hasUpcoming = /upcoming|pending|next|remaining|future/i.test(step8);

    assert.ok(hasCompleted, 'step 8 should describe a completed state');
    assert.ok(hasCurrent, 'step 8 should describe a current/active state');
    assert.ok(hasUpcoming, 'step 8 should describe an upcoming/pending state');
  });

  it('P3: exactly one progress display specification in step 8 — no duplication', () => {
    const content = readFileSync(join(tmp, '.claude', 'agents', 'gardener.md'), 'utf8');
    const step8 = getStep8(content);

    // The old single-line format should NOT be present
    assert.ok(
      !step8.includes('\uD83C\uDF31\uD83C\uDF31\uD83C\uDF31\uD83C\uDF31\u2B1C\u2B1C\u2B1C\u2B1C'),
      'step 8 should not contain the old single-line progress format (emoji string)'
    );
  });

  it('P4: progress section is positioned after "What\'s next" in the report', () => {
    const content = readFileSync(join(tmp, '.claude', 'agents', 'gardener.md'), 'utf8');
    const step8 = getStep8(content);

    // Find position of "What's next" and the progress/stage map section
    const whatsNextIdx = step8.search(/what.*next/i);
    assert.ok(whatsNextIdx >= 0, 'step 8 should contain "What\'s next"');

    // The stage map / progress section should come after "What's next"
    const progressMapIdx = step8.search(/Stage map|Progress map|stage progress/i);
    assert.ok(progressMapIdx >= 0, 'step 8 should contain a stage/progress map section');
    assert.ok(
      progressMapIdx > whatsNextIdx,
      `progress/stage map (at ${progressMapIdx}) should come after "What's next" (at ${whatsNextIdx})`
    );
  });
});

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
    const categories = ['invariant', 'state transition', 'roundtrip', 'boundary'];
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
      assert.ok(
        /description:/m.test(content),
        `${skill}.md should contain a description field in frontmatter`
      );
    }
  });
});

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

describe('Hook visual feedback — end-to-end stderr verification (Stage 3)', () => {
  /**
   * Helper: set up a temp directory with installed templates, a git repo,
   * a stage commit, and a CLAUDE.md with a real test command.
   * Returns { tmp } ready for hook execution.
   */
  function setupHookEnv({ claudeMd } = {}) {
    const { tmp } = runCLI();

    // Write a CLAUDE.md with a real test command (or custom content)
    writeFileSync(
      join(tmp, 'CLAUDE.md'),
      claudeMd || '- **Test:** `echo test-passed`\n'
    );

    // Create a git repo with a stage commit so the guards pass
    execFileSync('git', ['init'], { cwd: tmp, encoding: 'utf8' });
    execFileSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tmp });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tmp });
    writeFileSync(join(tmp, 'dummy.txt'), 'hello');
    execFileSync('git', ['add', '.'], { cwd: tmp, encoding: 'utf8' });
    execFileSync('git', ['commit', '-m', 'feat(test): stage 1 — initial'], {
      cwd: tmp,
      encoding: 'utf8',
    });

    return { tmp };
  }

  it('P11: test hook end-to-end — stderr contains emoji feedback for a stage commit', () => {
    const { tmp } = setupHookEnv();

    const stdinJSON = JSON.stringify({
      tool_input: { command: 'git commit -m "feat(test): stage 1"' },
    });
    const hookPath = join(tmp, '.claude', 'hooks', 'post-stage-test.sh');

    const result = spawnSync('bash', [hookPath], {
      cwd: tmp,
      encoding: 'utf8',
      input: stdinJSON,
      timeout: 10000,
    });

    assert.equal(result.status, 0, `hook should exit 0, got ${result.status}`);

    const stderr = result.stderr;

    // Must contain the test-tube emoji (before tests)
    assert.ok(
      stderr.includes('\u{1F9EA}'),
      `stderr should contain test tube emoji (🧪), got: ${stderr}`
    );

    // Must contain the check-mark emoji (tests passed)
    assert.ok(
      stderr.includes('\u2705'),
      `stderr should contain check mark emoji (✅), got: ${stderr}`
    );
  });

  it('P12: review hook end-to-end — stderr contains emoji feedback for a stage commit', () => {
    const { tmp } = setupHookEnv();

    const stdinJSON = JSON.stringify({
      tool_input: { command: 'git commit -m "feat(review): stage 1"' },
    });
    const hookPath = join(tmp, '.claude', 'hooks', 'post-stage-review.sh');

    const result = spawnSync('bash', [hookPath], {
      cwd: tmp,
      encoding: 'utf8',
      input: stdinJSON,
      timeout: 10000,
    });

    assert.equal(result.status, 0, `hook should exit 0, got ${result.status}`);

    const stderr = result.stderr;

    // Must contain the magnifying glass emoji (gathering context)
    assert.ok(
      stderr.includes('\u{1F50D}'),
      `stderr should contain magnifying glass emoji (🔍), got: ${stderr}`
    );

    // Must contain the clipboard emoji (context ready)
    assert.ok(
      stderr.includes('\u{1F4CB}'),
      `stderr should contain clipboard emoji (📋), got: ${stderr}`
    );
  });

  it('P13: existing test hook e2e stdout JSON test still passes — regression guard', () => {
    // This is a lightweight regression check that the existing e2e test pattern
    // (P21 at line ~581) still works: stage commit + hook = valid JSON stdout.
    // The actual existing test is in the "Post-stage test hook (template)" describe
    // block — this just verifies the same thing with spawnSync to confirm
    // stdout is unaffected by the stderr additions.
    const { tmp } = setupHookEnv();

    const stdinJSON = JSON.stringify({
      tool_input: { command: 'git commit -m "feat(test): stage 1"' },
    });
    const hookPath = join(tmp, '.claude', 'hooks', 'post-stage-test.sh');

    const result = spawnSync('bash', [hookPath], {
      cwd: tmp,
      encoding: 'utf8',
      input: stdinJSON,
      timeout: 10000,
    });

    assert.equal(result.status, 0, `hook should exit 0, got ${result.status}`);

    // stdout must be valid JSON with hookSpecificOutput.additionalContext
    const parsed = JSON.parse(result.stdout);
    assert.ok(
      parsed.hookSpecificOutput,
      'stdout should have hookSpecificOutput'
    );
    assert.ok(
      parsed.hookSpecificOutput.additionalContext.includes('All tests passed'),
      `additionalContext should include "All tests passed", got: ${parsed.hookSpecificOutput.additionalContext}`
    );

    // stderr must NOT appear in stdout (no cross-contamination)
    assert.ok(
      !result.stdout.includes('\u{1F9EA}'),
      'stdout should not contain emoji — emoji belongs in stderr only'
    );
  });
});

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
    // Bad format: missing feat(scope): prefix
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

describe('Superpowers integration — grow.md brainstorming (Stage 1)', () => {
  const TEMPLATE_GROW = join(import.meta.dirname, '..', 'templates', '.claude', 'commands', 'grow.md');
  const PROJECT_GROW = join(import.meta.dirname, '..', '.claude', 'commands', 'grow.md');

  it('P1: grow.md contains a brainstorming invocation BEFORE the gardener PLAN mode instruction', () => {
    const content = readFileSync(TEMPLATE_GROW, 'utf8');

    // Brainstorming must appear before the PLAN mode instruction
    const brainstormIdx = content.search(/brainstorm/i);
    const planModeIdx = content.search(/gardener.*PLAN mode|PLAN mode/i);

    assert.ok(brainstormIdx >= 0, 'grow.md should contain a brainstorming reference');
    assert.ok(planModeIdx >= 0, 'grow.md should contain gardener PLAN mode instruction');
    assert.ok(
      brainstormIdx < planModeIdx,
      `brainstorming (at ${brainstormIdx}) should appear BEFORE PLAN mode instruction (at ${planModeIdx})`
    );
  });

  it('P3: grow.md brainstorming invocation uses the Skill tool explicitly', () => {
    const content = readFileSync(TEMPLATE_GROW, 'utf8');

    // Must use explicit Skill tool invocation wording, not vague "consider brainstorming"
    assert.ok(
      /[Ii]nvoke the brainstorming skill|[Uu]se the brainstorming skill/i.test(content),
      'grow.md should use explicit Skill tool invocation (e.g. "Invoke the brainstorming skill")'
    );

    // Must NOT be a vague reference
    assert.ok(
      !/consider brainstorming(?! skill)/i.test(content),
      'grow.md should not use vague "consider brainstorming" — must invoke the skill explicitly'
    );
  });

  it('P5: templates/.claude/commands/grow.md and .claude/commands/grow.md are identical', () => {
    const templateContent = readFileSync(TEMPLATE_GROW, 'utf8');
    const projectContent = readFileSync(PROJECT_GROW, 'utf8');

    assert.equal(
      templateContent,
      projectContent,
      'template grow.md and project grow.md must be identical'
    );
  });

  it('P7: grow.md still contains all existing instruction steps', () => {
    const content = readFileSync(TEMPLATE_GROW, 'utf8');

    // Must preserve: gardener PLAN mode, property review gate, "Plan ready" prompt
    assert.ok(
      /gardener.*PLAN mode|Use the gardener agent in PLAN mode/i.test(content),
      'grow.md should still contain gardener PLAN mode instruction'
    );
    assert.ok(
      /PROPERTIES/i.test(content),
      'grow.md should still contain property review gate'
    );
    assert.ok(
      /Plan ready/i.test(content),
      'grow.md should still contain "Plan ready" prompt'
    );
    assert.ok(
      /GROW mode/i.test(content),
      'grow.md should still contain GROW mode instruction for stage 1'
    );
    assert.ok(
      /\$ARGUMENTS/i.test(content),
      'grow.md should still reference $ARGUMENTS'
    );
  });
});

describe('Superpowers integration — seed.md brainstorming (Stage 1)', () => {
  const TEMPLATE_SEED = join(import.meta.dirname, '..', 'templates', '.claude', 'commands', 'seed.md');
  const PROJECT_SEED = join(import.meta.dirname, '..', '.claude', 'commands', 'seed.md');

  it('P2: seed.md contains a brainstorming invocation inside Path B only — not in Path A', () => {
    const content = readFileSync(TEMPLATE_SEED, 'utf8');

    // Split content at Path B marker to check location
    const pathAStart = content.indexOf('**Path A');
    const pathBStart = content.indexOf('**Path B');
    assert.ok(pathAStart >= 0, 'seed.md should contain Path A');
    assert.ok(pathBStart >= 0, 'seed.md should contain Path B');

    const pathASection = content.substring(pathAStart, pathBStart);
    const pathBSection = content.substring(pathBStart);

    // Brainstorming should be in Path B
    assert.ok(
      /brainstorm/i.test(pathBSection),
      'seed.md Path B should contain a brainstorming reference'
    );

    // Brainstorming should NOT be in Path A
    assert.ok(
      !/brainstorm/i.test(pathASection),
      'seed.md Path A should NOT contain a brainstorming reference'
    );
  });

  it('P4: seed.md brainstorming invocation uses the Skill tool explicitly', () => {
    const content = readFileSync(TEMPLATE_SEED, 'utf8');

    // Must use explicit Skill tool invocation wording
    assert.ok(
      /[Ii]nvoke the brainstorming skill|[Uu]se the brainstorming skill/i.test(content),
      'seed.md should use explicit Skill tool invocation (e.g. "Invoke the brainstorming skill")'
    );
  });

  it('P6: templates/.claude/commands/seed.md and .claude/commands/seed.md are identical', () => {
    const templateContent = readFileSync(TEMPLATE_SEED, 'utf8');
    const projectContent = readFileSync(PROJECT_SEED, 'utf8');

    assert.equal(
      templateContent,
      projectContent,
      'template seed.md and project seed.md must be identical'
    );
  });

  it('P8: seed.md still contains all existing paths and interview questions', () => {
    const content = readFileSync(TEMPLATE_SEED, 'utf8');

    // Must preserve both paths
    assert.ok(
      /Path A.*DNA exists/i.test(content),
      'seed.md should still contain Path A'
    );
    assert.ok(
      /Path B.*No DNA/i.test(content),
      'seed.md should still contain Path B'
    );

    // Must preserve all interview questions
    const interviewQuestions = [
      'What are you building',
      'Who is it for',
      'What core problem',
      'What tech stack',
      'Any hard constraints',
      'priority',
    ];
    for (const q of interviewQuestions) {
      assert.ok(
        content.includes(q),
        `seed.md should still contain interview question: "${q}"`
      );
    }

    // Must preserve other key elements
    assert.ok(
      /CLAUDE\.md Product section/i.test(content),
      'seed.md should still reference CLAUDE.md Product section'
    );
    assert.ok(
      /docs\/growth\/project-bootstrap\.md/i.test(content),
      'seed.md should still reference docs/growth/project-bootstrap.md'
    );
    assert.ok(
      /Seed planted/i.test(content),
      'seed.md should still contain "Seed planted" prompt'
    );
  });
});

describe('Superpowers integration — next.md debugging fallback (Stage 2)', () => {
  const TEMPLATE_NEXT = join(import.meta.dirname, '..', 'templates', '.claude', 'commands', 'next.md');
  const PROJECT_NEXT = join(import.meta.dirname, '..', '.claude', 'commands', 'next.md');

  it('P9: next.md contains a reference to systematic-debugging skill as a fallback when stuck', () => {
    const content = readFileSync(TEMPLATE_NEXT, 'utf8');

    assert.ok(
      /systematic.debugging/i.test(content),
      'next.md should contain a reference to systematic-debugging skill'
    );
  });

  it('P12: next.md debugging reference appears as a general tip visible when stuck', () => {
    const content = readFileSync(TEMPLATE_NEXT, 'utf8');

    // The debugging reference should appear AFTER the main numbered steps
    // (i.e., after step 4 — the "all done" case), as a general tip the user
    // sees when they look at the command for help while stuck
    const step4Idx = content.search(/4\.\s/);
    const debugIdx = content.search(/systematic.debugging/i);

    assert.ok(step4Idx >= 0, 'next.md should contain step 4');
    assert.ok(debugIdx >= 0, 'next.md should contain systematic-debugging reference');
    assert.ok(
      debugIdx > step4Idx,
      `debugging reference (at ${debugIdx}) should appear after step 4 (at ${step4Idx}) as a general tip`
    );
  });

  it('P13: templates/.claude/commands/next.md and .claude/commands/next.md are identical', () => {
    const templateContent = readFileSync(TEMPLATE_NEXT, 'utf8');
    const projectContent = readFileSync(PROJECT_NEXT, 'utf8');

    assert.equal(
      templateContent,
      projectContent,
      'template next.md and project next.md must be identical'
    );
  });

  it('P15: next.md still contains all existing steps', () => {
    const content = readFileSync(TEMPLATE_NEXT, 'utf8');

    // Must preserve all four steps
    assert.ok(
      /Find the active plan/i.test(content),
      'next.md should still contain "Find the active plan" step'
    );
    assert.ok(
      /gardener.*GROW mode|GROW mode/i.test(content),
      'next.md should still contain gardener GROW mode instruction'
    );
    assert.ok(
      /no plan exists/i.test(content),
      'next.md should still contain no-plan fallback'
    );
    assert.ok(
      /all stages are done/i.test(content),
      'next.md should still contain all-done case'
    );
    assert.ok(
      /\$ARGUMENTS/i.test(content),
      'next.md should still reference $ARGUMENTS'
    );
  });
});

describe('Superpowers integration — review.md code review skills (Stage 2)', () => {
  const TEMPLATE_REVIEW = join(import.meta.dirname, '..', 'templates', '.claude', 'commands', 'review.md');
  const PROJECT_REVIEW = join(import.meta.dirname, '..', '.claude', 'commands', 'review.md');

  it('P10: review.md contains a reference to requesting-code-review skill', () => {
    const content = readFileSync(TEMPLATE_REVIEW, 'utf8');

    assert.ok(
      /requesting.code.review/i.test(content),
      'review.md should contain a reference to requesting-code-review skill'
    );
  });

  it('P11: review.md contains a reference to receiving-code-review skill', () => {
    const content = readFileSync(TEMPLATE_REVIEW, 'utf8');

    assert.ok(
      /receiving.code.review/i.test(content),
      'review.md should contain a reference to receiving-code-review skill'
    );
  });

  it('P14: templates/.claude/commands/review.md and .claude/commands/review.md are identical', () => {
    const templateContent = readFileSync(TEMPLATE_REVIEW, 'utf8');
    const projectContent = readFileSync(PROJECT_REVIEW, 'utf8');

    assert.equal(
      templateContent,
      projectContent,
      'template review.md and project review.md must be identical'
    );
  });

  it('P16: review.md still contains all existing review dimensions and report format', () => {
    const content = readFileSync(TEMPLATE_REVIEW, 'utf8');

    // Must preserve all five review dimensions
    const dimensions = [
      'Correctness',
      'Consistency',
      'Simplicity',
      'Security',
      'Test quality',
    ];
    for (const dim of dimensions) {
      assert.ok(
        content.includes(`**${dim}`),
        `review.md should still contain review dimension "**${dim}"`
      );
    }

    // Must preserve report format
    assert.ok(
      content.includes('### 🟢 Good'),
      'review.md should still contain Good section in report format'
    );
    assert.ok(
      content.includes('### 🟡 Suggestions'),
      'review.md should still contain Suggestions section in report format'
    );
    assert.ok(
      content.includes('### 🔴 Issues'),
      'review.md should still contain Issues section in report format'
    );
    assert.ok(
      content.includes('### Verdict:'),
      'review.md should still contain Verdict section in report format'
    );

    // Must preserve scope and arguments
    assert.ok(
      /\$ARGUMENTS/i.test(content),
      'review.md should still reference $ARGUMENTS'
    );
  });
});

describe('Superpowers integration — replan.md unchanged (Stage 2)', () => {
  const TEMPLATE_REPLAN = join(import.meta.dirname, '..', 'templates', '.claude', 'commands', 'replan.md');
  const PROJECT_REPLAN = join(import.meta.dirname, '..', '.claude', 'commands', 'replan.md');

  it('P17: replan.md is unchanged — no superpowers integration added', () => {
    const templateContent = readFileSync(TEMPLATE_REPLAN, 'utf8');
    const projectContent = readFileSync(PROJECT_REPLAN, 'utf8');

    // replan.md should NOT contain any superpowers skill references
    assert.ok(
      !/brainstorm/i.test(templateContent),
      'replan.md should not contain brainstorming reference'
    );
    assert.ok(
      !/systematic.debugging/i.test(templateContent),
      'replan.md should not contain systematic-debugging reference'
    );
    assert.ok(
      !/requesting.code.review/i.test(templateContent),
      'replan.md should not contain requesting-code-review reference'
    );
    assert.ok(
      !/receiving.code.review/i.test(templateContent),
      'replan.md should not contain receiving-code-review reference'
    );

    // Template and project copies must remain identical
    assert.equal(
      templateContent,
      projectContent,
      'template replan.md and project replan.md must be identical'
    );
  });
});

describe('Superpowers integration — gardener agent reminders (Stage 3)', () => {
  const TEMPLATE_PATH = join(import.meta.dirname, '..', 'templates', '.claude', 'agents', 'gardener.md');
  const PROJECT_PATH = join(import.meta.dirname, '..', '.claude', 'agents', 'gardener.md');

  /**
   * Helper: extract GROW mode section from gardener template.
   * Starts at "## Mode: GROW" and ends at "## Mode: REPLAN".
   */
  function getGrowMode(content) {
    const match = content.match(/## Mode: GROW[\s\S]*?(?=\n## Mode: REPLAN)/);
    assert.ok(match, 'should find GROW mode section');
    return match[0];
  }

  /**
   * Helper: extract a specific step region from GROW mode.
   * Returns text from "N. " to the next numbered step or section end.
   */
  function getStep(growMode, stepNum) {
    const nextStep = stepNum + 1;
    const pattern = new RegExp(
      `${stepNum}\\. [\\s\\S]*?(?=\\n${nextStep}\\. |$)`
    );
    const match = growMode.match(pattern);
    assert.ok(match, `should find step ${stepNum} in GROW mode`);
    return match[0];
  }

  /**
   * Helper: extract a sub-step region (e.g., "b." or "d.") from a step.
   * Returns text from the sub-step letter to the next sub-step letter.
   */
  function getSubStep(stepContent, letter) {
    const nextLetter = String.fromCharCode(letter.charCodeAt(0) + 1);
    const pattern = new RegExp(
      `${letter}\\. [\\s\\S]*?(?=\\n\\s+${nextLetter}\\. |$)`
    );
    const match = stepContent.match(pattern);
    assert.ok(match, `should find sub-step ${letter} in step content`);
    return match[0];
  }

  it('P18: gardener contains a TDD reminder within or immediately adjacent to GROW step 4b', () => {
    const content = readFileSync(TEMPLATE_PATH, 'utf8');
    const growMode = getGrowMode(content);
    const step4 = getStep(growMode, 4);
    const subStepB = getSubStep(step4, 'b');

    // Must mention TDD or red/green/refactor or "failing test first"
    assert.ok(
      /TDD|red.green.refactor|failing test first/i.test(subStepB),
      `step 4b should contain a TDD reminder (red/green/refactor or failing test first), got:\n${subStepB}`
    );
  });

  it('P19: gardener contains a verification reminder within or immediately adjacent to GROW step 4d', () => {
    const content = readFileSync(TEMPLATE_PATH, 'utf8');
    const growMode = getGrowMode(content);
    const step4 = getStep(growMode, 4);
    const subStepD = getSubStep(step4, 'd');

    // Must mention verification or "verify before continuing" or "verification-before-completion"
    assert.ok(
      /verification.before.completion|verify.*before.*continu/i.test(subStepD),
      `step 4d should contain a verification reminder, got:\n${subStepD}`
    );
  });

  it('P20: gardener contains a debugging reminder within or immediately adjacent to GROW step 4e', () => {
    const content = readFileSync(TEMPLATE_PATH, 'utf8');
    const growMode = getGrowMode(content);
    const step4 = getStep(growMode, 4);
    const subStepE = getSubStep(step4, 'e');

    // Must mention systematic-debugging or "systematic debugging"
    assert.ok(
      /systematic.debugging/i.test(subStepE),
      `step 4e should contain a systematic-debugging reminder, got:\n${subStepE}`
    );
  });

  it('P21: gardener contains a finishing-branch reference within or adjacent to GROW step 6 or step 8', () => {
    const content = readFileSync(TEMPLATE_PATH, 'utf8');
    const growMode = getGrowMode(content);

    // Extract step 6 and step 8 regions
    const step6 = getStep(growMode, 6);
    const step8Match = growMode.match(/8\. [\s\S]*/);
    assert.ok(step8Match, 'should find step 8 in GROW mode');
    const step8 = step8Match[0];

    // Must mention finishing-a-development-branch or "finishing branch" in step 6 or step 8
    const inStep6 = /finishing.a.development.branch|finishing.branch/i.test(step6);
    const inStep8 = /finishing.a.development.branch|finishing.branch/i.test(step8);

    assert.ok(
      inStep6 || inStep8,
      `step 6 or step 8 should contain a finishing-branch reference.\nStep 6: ${step6}\nStep 8: ${step8}`
    );
  });

  it('P22: each superpowers reminder is one sentence or less — no multi-paragraph additions', () => {
    const content = readFileSync(TEMPLATE_PATH, 'utf8');
    const growMode = getGrowMode(content);

    // Find all lines that mention superpowers skill names
    const skillPatterns = [
      /TDD|red.green.refactor/i,
      /verification.before.completion/i,
      /systematic.debugging/i,
      /finishing.a.development.branch|finishing.branch/i,
    ];

    for (const pattern of skillPatterns) {
      // Find all lines matching this pattern
      const lines = growMode.split('\n').filter(line => pattern.test(line));
      assert.ok(
        lines.length >= 1,
        `should find at least one line matching ${pattern}`
      );

      for (const line of lines) {
        // Count sentences: split on ". " (period + space) or "." at end of line
        // A single sentence has at most one terminal period
        const trimmed = line.trim();
        // Count periods that end sentences (followed by space+capital or end of string)
        // Simple heuristic: count ". " occurrences (sentence boundaries within the line)
        const sentenceBoundaries = (trimmed.match(/\.\s+[A-Z]/g) || []).length;
        assert.ok(
          sentenceBoundaries <= 1,
          `reminder line should be one sentence or less (found ${sentenceBoundaries + 1} sentences): "${trimmed}"`
        );
      }
    }
  });

  it('P23: gardener still contains all three modes with all existing steps intact', () => {
    const content = readFileSync(TEMPLATE_PATH, 'utf8');

    // All three modes must be present
    assert.ok(/## Mode: PLAN/.test(content), 'should contain PLAN mode');
    assert.ok(/## Mode: GROW/.test(content), 'should contain GROW mode');
    assert.ok(/## Mode: REPLAN/.test(content), 'should contain REPLAN mode');

    // PLAN mode steps 0-5
    for (let i = 0; i <= 5; i++) {
      assert.ok(
        new RegExp(`^${i}\\. `, 'm').test(content),
        `PLAN mode should still contain step ${i}`
      );
    }

    // GROW mode steps 1-8
    const growMode = getGrowMode(content);
    for (let i = 1; i <= 8; i++) {
      assert.ok(
        new RegExp(`^${i}\\. `, 'm').test(growMode),
        `GROW mode should still contain step ${i}`
      );
    }

    // GROW mode sub-steps a-e in step 4
    const step4 = getStep(growMode, 4);
    for (const letter of ['a', 'b', 'c', 'd', 'e']) {
      assert.ok(
        new RegExp(`^\\s+${letter}\\. `, 'm').test(step4),
        `GROW step 4 should still contain sub-step ${letter}`
      );
    }

    // REPLAN mode steps 1-9
    const replanMatch = content.match(/## Mode: REPLAN[\s\S]*?(?=\n# Critical)/);
    assert.ok(replanMatch, 'should find REPLAN mode section');
    const replanMode = replanMatch[0];
    for (let i = 1; i <= 9; i++) {
      assert.ok(
        new RegExp(`^${i}\\. `, 'm').test(replanMode),
        `REPLAN mode should still contain step ${i}`
      );
    }
  });

  it('P24: gardener still contains all property-based planning content', () => {
    const content = readFileSync(TEMPLATE_PATH, 'utf8');

    // Property-Based Planning section markers
    const markers = [
      'Property-Based Planning',
      'INVARIANTS',
      'STATE TRANSITIONS',
      'ROUNDTRIPS',
      'BOUNDARIES',
      'Plan Self-Check',
      'COMPLETENESS',
      'INDEPENDENCE',
      'ACCUMULATION',
      'BOUNDARY COVERAGE',
    ];

    for (const marker of markers) {
      assert.ok(
        content.includes(marker),
        `gardener should still contain property-based planning marker "${marker}"`
      );
    }
  });

  it('P25: templates/.claude/agents/gardener.md and .claude/agents/gardener.md are identical', () => {
    const templateContent = readFileSync(TEMPLATE_PATH, 'utf8');
    const projectContent = readFileSync(PROJECT_PATH, 'utf8');

    assert.equal(
      templateContent,
      projectContent,
      'template gardener.md and project gardener.md must be identical after stage 3 changes'
    );
  });
});

describe('Superpowers integration — CLAUDE.md template + CLI + DNA (Stage 4)', () => {
  const TEMPLATE_CLAUDE = join(import.meta.dirname, '..', 'templates', 'CLAUDE.md');
  const DNA_PATH = join(import.meta.dirname, '..', 'docs', 'product-dna.md');

  it('P26: templates/CLAUDE.md Development Philosophy section mentions superpowers as companion for process skills', () => {
    const content = readFileSync(TEMPLATE_CLAUDE, 'utf8');

    // The superpowers mention must be within the Development Philosophy section
    // (between "# Development Philosophy" and the end of file or next top-level heading)
    const philStart = content.indexOf('# Development Philosophy');
    assert.ok(philStart >= 0, 'CLAUDE.md should contain Development Philosophy section');

    const philSection = content.substring(philStart);
    assert.ok(
      /superpowers/i.test(philSection),
      'Development Philosophy section should mention superpowers'
    );
    assert.ok(
      /process skills|TDD|debugging|brainstorming/i.test(philSection),
      'superpowers mention should reference process skills it provides'
    );
  });

  it('P27: templates/CLAUDE.md superpowers mention is one sentence within an existing section — not a new top-level section', () => {
    const content = readFileSync(TEMPLATE_CLAUDE, 'utf8');

    // Count top-level headings (# or ##) — should NOT have a new "## Superpowers" section
    assert.ok(
      !/^##?\s+[Ss]uperpowers/m.test(content),
      'CLAUDE.md should NOT have a top-level Superpowers section'
    );

    // Find all lines mentioning superpowers — should be just one or two lines, not a paragraph
    const superpowerLines = content.split('\n').filter(line => /superpowers/i.test(line));
    assert.ok(
      superpowerLines.length >= 1 && superpowerLines.length <= 2,
      `superpowers should be mentioned in 1-2 lines, found ${superpowerLines.length}`
    );
  });

  it('P28: templates/CLAUDE.md still contains all existing sections', () => {
    const content = readFileSync(TEMPLATE_CLAUDE, 'utf8');

    const requiredSections = [
      'THE SEED',
      'THE SOIL',
      'LIGHT & WATER',
      'Growth Rules',
      'Growth Stage Patterns',
      'Commit Convention',
      'Growth Plan Location',
    ];

    for (const section of requiredSections) {
      assert.ok(
        content.includes(section),
        `CLAUDE.md should still contain "${section}"`
      );
    }

    // All 6 growth rules must still be present
    for (let i = 1; i <= 6; i++) {
      assert.ok(
        new RegExp(`^${i}\\. \\*\\*`, 'm').test(content),
        `CLAUDE.md should still contain Growth Rule ${i}`
      );
    }
  });

  it('P29: CLI install summary mentions superpowers integration status', () => {
    const { output } = runCLI();

    // The CLI should mention what superpowers integration enables
    // — not just "detected" but what it does (e.g., TDD, debugging, brainstorming)
    assert.ok(
      /superpowers/i.test(output),
      'CLI output should mention superpowers'
    );
    assert.ok(
      /TDD|debugging|brainstorming|process skills|integrated/i.test(output),
      'CLI superpowers message should mention what the integration enables (TDD, debugging, brainstorming, etc.)'
    );
  });

  it('P30: docs/product-dna.md reflects superpowers integration as a capability', () => {
    const content = readFileSync(DNA_PATH, 'utf8');

    assert.ok(
      /superpowers.*integrat|integrat.*superpowers/i.test(content),
      'product DNA should mention superpowers integration as a capability'
    );
  });

  it('P31: CLAUDE.md key section markers still pass existing tests', () => {
    const content = readFileSync(TEMPLATE_CLAUDE, 'utf8');

    // These are the same markers checked by the existing Template content integrity test
    const markers = [
      'THE SEED',
      'THE SOIL',
      'LIGHT & WATER',
      'Organic Growth',
      'Growth Rules',
    ];
    for (const marker of markers) {
      assert.ok(
        content.includes(marker),
        `CLAUDE.md should still contain key marker "${marker}"`
      );
    }
  });
});

// ─── Stage 1: --opencode flag + AGENTS.md template ───────────────────────────

describe('opencode: --opencode flag (P1, P4)', () => {
  it('P1: CLI accepts --opencode flag without error', () => {
    // runCLI passes --force by default, so this exercises flag parsing
    const { output } = runCLI(['--opencode']);
    assert.ok(output.includes('Done!'), '--opencode flag should complete without error');
  });

  it('P4: without --opencode, behavior unchanged — CLAUDE.md installed, no AGENTS.md', () => {
    const { tmp } = runCLI();
    assert.ok(existsSync(join(tmp, 'CLAUDE.md')), 'default install should create CLAUDE.md');
    assert.ok(!existsSync(join(tmp, 'AGENTS.md')), 'default install should NOT create AGENTS.md');
  });
});

describe('opencode: AGENTS.md installation (P2, P3)', () => {
  const { tmp: ocTmp } = runCLI(['--opencode']);

  it('P2: AGENTS.md is installed at project root when --opencode is used', () => {
    assert.ok(
      existsSync(join(ocTmp, 'AGENTS.md')),
      '--opencode install should create AGENTS.md at project root'
    );
    const stat = statSync(join(ocTmp, 'AGENTS.md'));
    assert.ok(stat.size > 0, 'AGENTS.md should not be empty');
  });

  it('P3: CLAUDE.md is NOT installed when --opencode is used', () => {
    assert.ok(
      !existsSync(join(ocTmp, 'CLAUDE.md')),
      '--opencode install should NOT create CLAUDE.md'
    );
  });
});

describe('opencode: AGENTS.md methodology content (P5)', () => {
  const { tmp: ocTmp } = runCLI(['--opencode']);

  it('P5: AGENTS.md contains Organic Growth philosophy and Growth Rules', () => {
    const content = readFileSync(join(ocTmp, 'AGENTS.md'), 'utf8');

    const markers = [
      'Organic Growth',
      'Growth Rules',
      'Growth Stage Patterns',
      'Commit Convention',
    ];
    for (const marker of markers) {
      assert.ok(
        content.includes(marker),
        `AGENTS.md should contain methodology marker "${marker}"`
      );
    }
  });
});

describe('opencode: docs/growth/ directory (P6)', () => {
  it('P6: docs/growth/ directory is created in --opencode mode', () => {
    const { tmp } = runCLI(['--opencode']);
    const growthDir = join(tmp, 'docs', 'growth');
    assert.ok(existsSync(growthDir), '--opencode install should create docs/growth/');
    assert.ok(statSync(growthDir).isDirectory(), 'docs/growth/ should be a directory');
  });
});

// ─── Stage 2: .opencode/ agents, commands, and skills ────────────────────────

describe('opencode: agent installation (P7)', () => {
  const { tmp: ocTmp } = runCLI(['--opencode']);

  it('P7: .opencode/agents/gardener.md is installed in --opencode mode', () => {
    const f = join(ocTmp, '.opencode', 'agents', 'gardener.md');
    assert.ok(existsSync(f), '.opencode/agents/gardener.md should exist');
    assert.ok(statSync(f).size > 0, 'gardener.md should not be empty');
  });
});

describe('opencode: command installation (P8)', () => {
  const { tmp: ocTmp } = runCLI(['--opencode']);

  it('P8: all 5 commands are installed under .opencode/commands/', () => {
    const commands = ['seed', 'grow', 'next', 'replan', 'review'];
    for (const cmd of commands) {
      const f = join(ocTmp, '.opencode', 'commands', `${cmd}.md`);
      assert.ok(existsSync(f), `.opencode/commands/${cmd}.md should exist`);
      assert.ok(statSync(f).size > 0, `${cmd}.md should not be empty`);
    }
  });
});

describe('opencode: skill installation (P9)', () => {
  const { tmp: ocTmp } = runCLI(['--opencode']);

  it('P9: all 3 skills are installed under .opencode/skills/', () => {
    const skills = ['property-planning', 'stage-writing', 'quality-gates'];
    for (const skill of skills) {
      const f = join(ocTmp, '.opencode', 'skills', `${skill}.md`);
      assert.ok(existsSync(f), `.opencode/skills/${skill}.md should exist`);
      assert.ok(statSync(f).size > 0, `${skill}.md should not be empty`);
    }
  });
});

describe('opencode: no .claude/ directory in --opencode mode (P10)', () => {
  it('P10: .claude/ directory is NOT created in --opencode mode', () => {
    const { tmp } = runCLI(['--opencode']);
    assert.ok(
      !existsSync(join(tmp, '.claude')),
      '--opencode install should NOT create .claude/ directory'
    );
  });
});

describe('opencode: gardener references AGENTS.md (P11, P13)', () => {
  const { tmp: ocTmp } = runCLI(['--opencode']);

  it('P11: gardener agent references AGENTS.md (not CLAUDE.md) for product context', () => {
    const content = readFileSync(join(ocTmp, '.opencode', 'agents', 'gardener.md'), 'utf8');
    assert.ok(
      content.includes('AGENTS.md'),
      'opencode gardener should reference AGENTS.md'
    );
    assert.ok(
      !content.includes('CLAUDE.md'),
      'opencode gardener should NOT reference CLAUDE.md'
    );
  });

  it('P13: gardener contains all three modes and quality gate', () => {
    const content = readFileSync(join(ocTmp, '.opencode', 'agents', 'gardener.md'), 'utf8');
    const markers = ['Mode: PLAN', 'Mode: GROW', 'Mode: REPLAN', 'Quality gate'];
    for (const marker of markers) {
      assert.ok(content.includes(marker), `opencode gardener should contain "${marker}"`);
    }
  });
});

describe('opencode: commands use $ARGUMENTS placeholder (P12)', () => {
  const { tmp: ocTmp } = runCLI(['--opencode']);

  it('P12: each command file that accepts arguments uses the $ARGUMENTS placeholder', () => {
    // grow, next, replan, review all accept arguments; seed uses it for DNA path
    const commands = ['seed', 'grow', 'next', 'replan', 'review'];
    for (const cmd of commands) {
      const content = readFileSync(join(ocTmp, '.opencode', 'commands', `${cmd}.md`), 'utf8');
      assert.ok(
        content.includes('$ARGUMENTS'),
        `.opencode/commands/${cmd}.md should use $ARGUMENTS placeholder`
      );
    }
  });
});

describe('opencode: all files non-empty (P14)', () => {
  const { tmp: ocTmp } = runCLI(['--opencode']);

  it('P14: all installed .opencode/ files are non-empty', () => {
    const expectedFiles = [
      '.opencode/agents/gardener.md',
      '.opencode/commands/seed.md',
      '.opencode/commands/grow.md',
      '.opencode/commands/next.md',
      '.opencode/commands/replan.md',
      '.opencode/commands/review.md',
      '.opencode/skills/property-planning.md',
      '.opencode/skills/stage-writing.md',
      '.opencode/skills/quality-gates.md',
    ];
    for (const f of expectedFiles) {
      const fullPath = join(ocTmp, f);
      assert.ok(existsSync(fullPath), `${f} should exist`);
      assert.ok(statSync(fullPath).size > 0, `${f} should not be empty`);
    }
  });
});

// ─── Stage 3: Hooks → opencode JS plugin ─────────────────────────────────────

describe('opencode: plugin file installation (P15, P16)', () => {
  const { tmp: ocTmp } = runCLI(['--opencode']);

  it('P15: .opencode/plugins/organic-growth.js is installed in --opencode mode', () => {
    const f = join(ocTmp, '.opencode', 'plugins', 'organic-growth.js');
    assert.ok(existsSync(f), '.opencode/plugins/organic-growth.js should exist');
    assert.ok(statSync(f).size > 0, 'organic-growth.js should not be empty');
  });

  it('P16: no .claude/settings.json or .claude/hooks/ in --opencode mode', () => {
    assert.ok(
      !existsSync(join(ocTmp, '.claude', 'settings.json')),
      '.claude/settings.json should NOT exist in --opencode install'
    );
    assert.ok(
      !existsSync(join(ocTmp, '.claude', 'hooks')),
      '.claude/hooks/ should NOT exist in --opencode install'
    );
  });
});

describe('opencode: plugin structure (P17, P18)', () => {
  const { tmp: ocTmp } = runCLI(['--opencode']);

  it('P17: plugin exports a default function', () => {
    const content = readFileSync(
      join(ocTmp, '.opencode', 'plugins', 'organic-growth.js'), 'utf8'
    );
    assert.ok(
      /export default function/.test(content),
      'plugin should export a default function'
    );
  });

  it('P18: plugin registers a tool.execute.after event handler', () => {
    const content = readFileSync(
      join(ocTmp, '.opencode', 'plugins', 'organic-growth.js'), 'utf8'
    );
    assert.ok(
      /tool\.execute\.after/.test(content),
      'plugin should register tool.execute.after event handler'
    );
  });
});

describe('opencode: plugin hook logic (P19, P20, P21)', () => {
  const { tmp: ocTmp } = runCLI(['--opencode']);

  it('P19: plugin reads test command from AGENTS.md (not CLAUDE.md)', () => {
    const content = readFileSync(
      join(ocTmp, '.opencode', 'plugins', 'organic-growth.js'), 'utf8'
    );
    assert.ok(
      content.includes('AGENTS.md'),
      'plugin should reference AGENTS.md for test command discovery'
    );
    assert.ok(
      !content.includes('CLAUDE.md'),
      'plugin should NOT reference CLAUDE.md'
    );
  });

  it('P20: plugin contains git diff logic for review context', () => {
    const content = readFileSync(
      join(ocTmp, '.opencode', 'plugins', 'organic-growth.js'), 'utf8'
    );
    assert.ok(
      /git.*diff|diff.*HEAD/i.test(content),
      'plugin should contain git diff logic'
    );
  });

  it('P21: plugin contains commit-format checking logic', () => {
    const content = readFileSync(
      join(ocTmp, '.opencode', 'plugins', 'organic-growth.js'), 'utf8'
    );
    assert.ok(
      /feat\(/.test(content) || /stage\s*\\d/.test(content) || /commit.*format|format.*commit/i.test(content),
      'plugin should contain commit format checking logic'
    );
  });
});

// ─── Stage 4: opencode.json (MCP config) + package.json updates ──────────────

describe('opencode: opencode.json MCP config (P22, P23, P24)', () => {
  const { tmp: ocTmp } = runCLI(['--opencode']);

  it('P22: opencode.json is installed at project root in --opencode mode', () => {
    const f = join(ocTmp, 'opencode.json');
    assert.ok(existsSync(f), 'opencode.json should exist at project root');
    assert.ok(statSync(f).size > 0, 'opencode.json should not be empty');
  });

  it('P23: opencode.json contains Context7 MCP server configuration', () => {
    const content = JSON.parse(readFileSync(join(ocTmp, 'opencode.json'), 'utf8'));
    assert.ok(content.mcp, 'opencode.json should have an "mcp" key');
    assert.ok(content.mcp.context7, 'opencode.json mcp should have a "context7" entry');
    assert.equal(content.mcp.context7.type, 'stdio', 'context7 MCP entry should use type "stdio"');
    assert.ok(content.mcp.context7.command, 'context7 MCP entry should have a command');
  });

  it('P24: .mcp.json is NOT installed in --opencode mode', () => {
    assert.ok(
      !existsSync(join(ocTmp, '.mcp.json')),
      '.mcp.json should NOT exist in --opencode install'
    );
  });
});

describe('opencode: package.json metadata (P25, P26, P27)', () => {
  it('P25: package.json files array includes "templates-opencode/"', () => {
    const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'));
    assert.ok(
      pkg.files.includes('templates-opencode/'),
      'package.json files should include "templates-opencode/"'
    );
  });

  it('P26: package.json description mentions opencode', () => {
    const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'));
    assert.ok(
      /opencode/i.test(pkg.description),
      `package.json description should mention opencode, got: "${pkg.description}"`
    );
  });

  it('P27: package.json keywords includes "opencode"', () => {
    const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'));
    assert.ok(
      Array.isArray(pkg.keywords) && pkg.keywords.includes('opencode'),
      'package.json keywords should include "opencode"'
    );
  });
});
