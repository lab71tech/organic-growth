import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
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
      '.claude/commands/worktree.md',
      '.claude/hooks/post-stage-review.sh',
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
    const commands = ['seed', 'grow', 'next', 'replan', 'review', 'worktree'];

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

describe('README worktree section', () => {
  const README_PATH = join(import.meta.dirname, '..', 'README.md');

  it('contains a worktree-related heading between After Install and Releases', () => {
    // P6: worktree heading exists in correct position
    const content = readFileSync(README_PATH, 'utf8');

    assert.ok(
      /## .*[Ww]orktree/.test(content),
      'README should have a heading containing "worktree" or "Worktree"'
    );

    // Verify ordering: After Install -> Worktree section -> Releases
    const afterInstallIdx = content.indexOf('## After Install');
    const worktreeIdx = content.search(/## .*[Ww]orktree/);
    const releasesIdx = content.indexOf('## Releases');

    assert.ok(afterInstallIdx < worktreeIdx, 'Worktree section should come after After Install');
    assert.ok(worktreeIdx < releasesIdx, 'Worktree section should come before Releases');
  });

  it('includes at least one git worktree command example', () => {
    // P7: concrete commands, not just conceptual text
    const content = readFileSync(README_PATH, 'utf8');

    assert.ok(
      /git worktree/.test(content),
      'README should contain a "git worktree" command example'
    );
  });

  it('connects worktrees to organic growth concepts', () => {
    // P8: not generic git docs — references methodology
    const content = readFileSync(README_PATH, 'utf8');

    // Extract the worktree section (from heading to next ## heading)
    const worktreeMatch = content.match(/## .*[Ww]orktree[\s\S]*?(?=\n## )/);
    assert.ok(worktreeMatch, 'should find worktree section');
    const section = worktreeMatch[0];

    // Must reference at least one organic growth concept
    const hasGrowthConcept =
      /growth plan|\/grow|\/next|\/review|\/clear|context hygiene|parallel.*feature|feature.*parallel/i.test(section);
    assert.ok(
      hasGrowthConcept,
      'Worktree section should reference organic growth concepts (growth plan, /grow, /next, /review, /clear, context hygiene, or parallel features)'
    );
  });

  it('mentions naming convention linking branches to growth plan files', () => {
    // P9: traceability between worktree branches and docs/growth/ plans
    const content = readFileSync(README_PATH, 'utf8');

    // Extract the worktree section
    const worktreeMatch = content.match(/## .*[Ww]orktree[\s\S]*?(?=\n## )/);
    assert.ok(worktreeMatch, 'should find worktree section');
    const section = worktreeMatch[0];

    // Must mention both branch naming and growth plan files
    assert.ok(
      /branch/i.test(section) && /docs\/growth|growth plan/i.test(section),
      'Worktree section should mention a naming convention linking branches to growth plan files'
    );
  });

  it('mentions /worktree as a command', () => {
    // P30: users discover the convenience command
    const content = readFileSync(README_PATH, 'utf8');

    // Extract the worktree section
    const worktreeMatch = content.match(/## .*[Ww]orktree[\s\S]*?(?=\n## )/);
    assert.ok(worktreeMatch, 'should find worktree section');
    const section = worktreeMatch[0];

    assert.ok(
      /\/worktree/.test(section),
      'Worktree section should mention /worktree command'
    );
  });
});

describe('Gardener and CLAUDE.md worktree awareness', () => {
  const { tmp } = runCLI();

  it('gardener template mentions worktrees in context of stage reporting or context hygiene', () => {
    // P17: worktree guidance in GROW mode reporting
    const content = readFileSync(join(tmp, '.claude', 'agents', 'gardener.md'), 'utf8');

    // Extract GROW mode section (from "Mode: GROW" to the next "Mode:" or "# Critical")
    const growMatch = content.match(/## Mode: GROW[\s\S]*?(?=\n## Mode:|\n# )/);
    assert.ok(growMatch, 'should find GROW mode section');
    const growSection = growMatch[0];

    assert.ok(
      /worktree/i.test(growSection),
      'GROW mode section should mention worktrees'
    );

    // Must be in context of reporting or context hygiene (parallel, /clear, session)
    assert.ok(
      /parallel|\/clear|session|report/i.test(growSection),
      'worktree mention should be near reporting or context hygiene concepts'
    );
  });

  it('gardener PLAN mode mentions worktrees in context of existing growth plans', () => {
    // P18: PLAN mode checks for in-progress plans and suggests worktrees
    const content = readFileSync(join(tmp, '.claude', 'agents', 'gardener.md'), 'utf8');

    // Extract PLAN mode section
    const planMatch = content.match(/## Mode: PLAN[\s\S]*?(?=\n## Mode:)/);
    assert.ok(planMatch, 'should find PLAN mode section');
    const planSection = planMatch[0];

    assert.ok(
      /worktree/i.test(planSection),
      'PLAN mode section should mention worktrees'
    );

    // Must be in context of existing plans or another feature growing
    assert.ok(
      /in-progress|another feature|other.*plan|existing/i.test(planSection),
      'worktree mention should be in context of existing growth plans or another feature'
    );
  });

  it('gardener template does not require worktrees — guidance is optional', () => {
    // P19: no "must" or "always" adjacent to "worktree" — keeps P12
    const content = readFileSync(join(tmp, '.claude', 'agents', 'gardener.md'), 'utf8');

    // Check that no line contains "must" or "always" on the same line as "worktree"
    const lines = content.split('\n');
    for (const line of lines) {
      if (/worktree/i.test(line)) {
        assert.ok(
          !/\b(must|always)\b/i.test(line),
          `worktree guidance should be optional, but found mandatory language: "${line.trim()}"`
        );
      }
    }
  });

  it('CLAUDE.md template mentions worktrees in context hygiene section', () => {
    // P20: context hygiene rule includes worktree mention
    const content = readFileSync(join(tmp, 'CLAUDE.md'), 'utf8');

    // Extract context hygiene section (numbered rule to next numbered rule)
    const hygieneMatch = content.match(/Context hygiene[\s\S]*?(?=\n\d+\.\s\*\*)/);
    assert.ok(hygieneMatch, 'should find context hygiene section');
    const hygieneSection = hygieneMatch[0];

    assert.ok(
      /worktree/i.test(hygieneSection),
      'Context hygiene section should mention worktrees'
    );
  });
});

describe('Worktree command content', () => {
  const { tmp } = runCLI();

  it('mentions git worktree as the underlying mechanism', () => {
    // P27: command contains actual worktree instruction, not generic branching
    const content = readFileSync(join(tmp, '.claude', 'commands', 'worktree.md'), 'utf8');

    assert.ok(
      /git worktree/.test(content),
      'worktree command should mention "git worktree"'
    );
  });

  it('mentions /grow as the next step after creating a worktree', () => {
    // P28: user knows to run /grow in the new worktree
    const content = readFileSync(join(tmp, '.claude', 'commands', 'worktree.md'), 'utf8');

    assert.ok(
      /\/grow/.test(content),
      'worktree command should mention /grow as the next step'
    );
  });

  it('references $ARGUMENTS for feature name input', () => {
    // P29: command accepts feature name via $ARGUMENTS, not hardcoded
    const content = readFileSync(join(tmp, '.claude', 'commands', 'worktree.md'), 'utf8');

    assert.ok(
      /\$ARGUMENTS/.test(content),
      'worktree command should reference $ARGUMENTS for feature name'
    );
  });
});

describe('Product DNA documentation', () => {
  const DNA_PATH = join(import.meta.dirname, '..', 'docs', 'product-dna.md');

  it('key commands list includes /worktree', () => {
    // P31: gardener agent knows about /worktree during planning
    const content = readFileSync(DNA_PATH, 'utf8');

    // Extract Key Commands section
    const commandsMatch = content.match(/## Key Commands[\s\S]*?(?=\n## )/);
    assert.ok(commandsMatch, 'should find Key Commands section');
    const section = commandsMatch[0];

    assert.ok(
      /\/worktree/.test(section),
      'Key Commands section should include /worktree'
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
    assert.ok(
      bashHook.hooks[0].command.includes('post-stage-review'),
      'settings template should reference the hook script'
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
      '## Parallel Growth with Worktrees',
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
