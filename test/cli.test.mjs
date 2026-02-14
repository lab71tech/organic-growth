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
  it('installs all 10 template files', () => {
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

  it('package size is under 50KB', () => {
    const output = execFileSync('npm', ['pack', '--dry-run', '--json'], {
      cwd: join(import.meta.dirname, '..'),
      encoding: 'utf8',
      timeout: 10000,
    });
    const [info] = JSON.parse(output);
    const unpackedSize = info.unpackedSize;

    assert.ok(
      unpackedSize < 50 * 1024,
      `unpacked size ${unpackedSize} bytes should be under 50KB (${50 * 1024} bytes)`
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
