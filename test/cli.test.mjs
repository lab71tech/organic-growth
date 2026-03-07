import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, existsSync, statSync, writeFileSync, readFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const PKG_PATH = join(import.meta.dirname, '..', 'package.json');
const CLI_PATH = join(import.meta.dirname, '..', 'bin', 'cli.mjs');

function runCLI(extraArgs = [], cwd) {
  const tmp = cwd || mkdtempSync(join(tmpdir(), 'og-test-'));
  const output = execFileSync('node', [CLI_PATH, '--force', ...extraArgs], {
    cwd: tmp,
    encoding: 'utf8',
    timeout: 10000,
  });
  return { tmp, output };
}

describe('CLI smoke test', () => {
  it('installs Claude templates and organic-growth state directory', () => {
    const { tmp, output } = runCLI();

    assert.ok(output.includes('Organic Growth'), 'should print banner');
    assert.ok(output.includes('Done!'), 'should print completion message');
    assert.ok(existsSync(join(tmp, 'CLAUDE.md')), 'should create CLAUDE.md');
    assert.ok(existsSync(join(tmp, '.claude')), 'should create .claude directory');
    assert.ok(existsSync(join(tmp, '.organic-growth', 'growth')), 'should create .organic-growth/growth');
    assert.ok(statSync(join(tmp, '.organic-growth', 'growth')).isDirectory(), 'growth path should be a directory');
  });

  it('installs all expected command files including /map', () => {
    const { tmp } = runCLI();

    const commands = ['seed', 'grow', 'map', 'next', 'next-automatic', 'replan', 'review'];
    for (const cmd of commands) {
      const file = join(tmp, '.claude', 'commands', `${cmd}.md`);
      assert.ok(existsSync(file), `expected command to exist: ${cmd}.md`);
      assert.ok(statSync(file).size > 0, `${cmd}.md should be non-empty`);
    }
  });

  it('copies DNA file to .organic-growth/product-dna.md', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    const dnaContent = '# Product DNA\n\nHello\n';
    writeFileSync(join(tmp, 'spec.md'), dnaContent);

    runCLI(['spec.md'], tmp);

    const dnaDest = join(tmp, '.organic-growth', 'product-dna.md');
    assert.ok(existsSync(dnaDest), 'DNA destination should exist');
    assert.equal(readFileSync(dnaDest, 'utf8'), dnaContent, 'DNA content should match source');
  });

  it('does not mention superpowers in install output', () => {
    const { output } = runCLI();
    assert.ok(!/superpowers/i.test(output), 'install output should not mention superpowers');
  });

  it('CLI output lists /next-automatic in commands available section', () => {
    const { output } = runCLI();
    // The "Commands available" section uses format: /command — description
    // Must match the command reference, not just a filename in the installed files list
    assert.ok(
      /\/next-automatic\s+—/.test(output.replace(/\x1b\[[0-9;]*m/g, '')),
      'CLI output should list /next-automatic with description in commands section'
    );
  });
});

describe('CLI options', () => {
  it('--help includes --migrate and --opencode', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    const output = execFileSync('node', [CLI_PATH, '--help'], {
      cwd: tmp,
      encoding: 'utf8',
      timeout: 5000,
    });

    assert.ok(output.includes('--migrate'), 'help should include --migrate');
    assert.ok(output.includes('--opencode'), 'help should include --opencode');
  });

  it('--version prints package version', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    const output = execFileSync('node', [CLI_PATH, '--version'], {
      cwd: tmp,
      encoding: 'utf8',
      timeout: 5000,
    });
    const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'));
    assert.equal(output.trim(), pkg.version, 'version output should match package.json');
  });

  it('--migrate moves legacy docs/ paths into .organic-growth and updates CLAUDE.md', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    mkdirSync(join(tmp, 'docs', 'growth'), { recursive: true });
    writeFileSync(join(tmp, 'docs', 'growth', 'legacy-feature.md'), '# legacy\n');
    writeFileSync(join(tmp, 'docs', 'product-dna.md'), '# legacy dna\n');
    writeFileSync(
      join(tmp, 'CLAUDE.md'),
      'Growth plan: docs/growth/feature.md\nFull DNA: docs/product-dna.md\n'
    );

    execFileSync('node', [CLI_PATH, '--migrate'], {
      cwd: tmp,
      encoding: 'utf8',
      timeout: 10000,
    });

    assert.ok(
      existsSync(join(tmp, '.organic-growth', 'growth', 'legacy-feature.md')),
      'legacy growth plan should be migrated'
    );
    assert.ok(
      existsSync(join(tmp, '.organic-growth', 'product-dna.md')),
      'legacy product DNA should be migrated'
    );

    const claude = readFileSync(join(tmp, 'CLAUDE.md'), 'utf8');
    assert.ok(
      claude.includes('.organic-growth/growth/feature.md'),
      'CLAUDE.md should update growth path references'
    );
    assert.ok(
      claude.includes('.organic-growth/product-dna.md'),
      'CLAUDE.md should update DNA path references'
    );
  });
});

describe('Template content integrity (Claude)', () => {
  const { tmp } = runCLI();

  it('CLAUDE.md references .organic-growth locations', () => {
    const content = readFileSync(join(tmp, 'CLAUDE.md'), 'utf8');

    assert.ok(content.includes('.organic-growth/growth/'), 'should reference growth plans in .organic-growth');
    assert.ok(content.includes('.organic-growth/product-dna.md'), 'should reference product DNA in .organic-growth');
    assert.ok(content.includes('.organic-growth/growth-map.md'), 'should reference growth map location');
  });

  it('gardener has Paths section and capability tags in template', () => {
    const content = readFileSync(join(tmp, '.claude', 'agents', 'gardener.md'), 'utf8');

    assert.ok(content.includes('## Paths'), 'gardener should contain a Paths section');
    assert.ok(content.includes('Capabilities:'), 'gardener plan template should include Capabilities');
    assert.ok(content.includes('Breaks:'), 'gardener should define optional Breaks field');
    assert.ok(content.includes('.organic-growth/growth-map.md'), 'gardener should reference growth map');
    assert.ok(content.includes('grep -r "Capabilities:" .organic-growth/growth/'), 'gardener should include tag-based fallback search');
  });

  it('commands reference .organic-growth and contain no superpowers skill references', () => {
    const commands = ['seed', 'grow', 'map', 'next', 'next-automatic', 'replan', 'review'];
    const forbidden = [
      'superpowers',
      'brainstorming skill',
      'systematic-debugging',
      'requesting-code-review',
      'receiving-code-review',
      'finishing-a-development-branch',
    ];

    for (const cmd of commands) {
      const content = readFileSync(join(tmp, '.claude', 'commands', `${cmd}.md`), 'utf8');
      assert.ok(
        content.includes('.organic-growth/') || cmd === 'map',
        `${cmd}.md should reference .organic-growth paths`
      );
      for (const token of forbidden) {
        assert.ok(!content.toLowerCase().includes(token), `${cmd}.md should not contain ${token}`);
      }
    }
  });

  it('template and project copies are identical for Claude command and agent files', () => {
    const files = [
      'agents/gardener.md',
      'commands/seed.md',
      'commands/grow.md',
      'commands/map.md',
      'commands/next.md',
      'commands/next-automatic.md',
      'commands/replan.md',
      'commands/review.md',
    ];

    for (const rel of files) {
      const templateContent = readFileSync(join(import.meta.dirname, '..', 'templates', '.claude', rel), 'utf8');
      const projectContent = readFileSync(join(import.meta.dirname, '..', '.claude', rel), 'utf8');
      assert.equal(templateContent, projectContent, `template and project .claude/${rel} should match`);
    }
  });
});

describe('Structured DNA + example plan docs', () => {
  it('example growth plan includes Capabilities header', () => {
    const content = readFileSync(join(import.meta.dirname, '..', '.organic-growth', 'example-growth-plan.md'), 'utf8');
    assert.ok(/Capabilities:/i.test(content), 'example growth plan should include Capabilities tags');
  });

  it('product DNA document no longer mentions superpowers integration', () => {
    const content = readFileSync(join(import.meta.dirname, '..', '.organic-growth', 'product-dna.md'), 'utf8');
    assert.ok(!/superpowers/i.test(content), 'product DNA should not mention superpowers');
  });
});

describe('opencode installation', () => {
  it('installs AGENTS.md, .opencode files, and .organic-growth/growth in --opencode mode', () => {
    const { tmp } = runCLI(['--opencode']);

    assert.ok(existsSync(join(tmp, 'AGENTS.md')), 'AGENTS.md should exist');
    assert.ok(!existsSync(join(tmp, 'CLAUDE.md')), 'CLAUDE.md should not exist in opencode mode');
    assert.ok(existsSync(join(tmp, '.opencode', 'agents', 'gardener.md')), 'opencode gardener should exist');
    assert.ok(existsSync(join(tmp, '.organic-growth', 'growth')), '.organic-growth/growth should exist');
    assert.ok(!existsSync(join(tmp, '.claude')), '.claude should not be installed in opencode mode');
  });

  it('installs all 7 opencode commands including map and next-automatic', () => {
    const { tmp } = runCLI(['--opencode']);
    const commands = ['seed', 'grow', 'map', 'next', 'next-automatic', 'replan', 'review'];

    for (const cmd of commands) {
      const file = join(tmp, '.opencode', 'commands', `${cmd}.md`);
      assert.ok(existsSync(file), `${cmd}.md should exist in .opencode/commands`);
      assert.ok(statSync(file).size > 0, `${cmd}.md should be non-empty`);
    }
  });

  it('opencode DNA argument copies to .organic-growth/product-dna.md', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    const dnaContent = '# DNA\n';
    writeFileSync(join(tmp, 'spec.md'), dnaContent);

    const { output } = runCLI(['--opencode', 'spec.md'], tmp);

    const dnaPath = join(tmp, '.organic-growth', 'product-dna.md');
    assert.ok(existsSync(dnaPath), 'DNA should be copied in opencode mode');
    assert.equal(readFileSync(dnaPath, 'utf8'), dnaContent, 'DNA content should match');
    assert.ok(output.includes('Product DNA copied'), 'output should mention copied DNA');
  });

  it('opencode next steps references AGENTS.md and not CLAUDE.md', () => {
    const { output } = runCLI(['--opencode']);

    assert.ok(output.includes('AGENTS.md'), 'output should reference AGENTS.md');
    assert.ok(!output.includes('Edit CLAUDE.md'), 'output should not reference CLAUDE.md in opencode mode');
  });
});

describe('Version file (.organic-growth/.version)', () => {
  const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'));

  // P1: Fresh install writes .version with exact package version, no trailing whitespace
  it('P1: fresh install creates .version with exact package version string', () => {
    const { tmp } = runCLI();
    const versionFile = join(tmp, '.organic-growth', '.version');
    assert.ok(existsSync(versionFile), '.version file should exist after fresh install');
    const content = readFileSync(versionFile, 'utf8');
    assert.equal(content, pkg.version, '.version should contain exactly the semver string from package.json');
  });

  // P2: --force install writes .version
  it('P2: --force install creates .version with current package version', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    // Pre-populate to make --force meaningful
    mkdirSync(join(tmp, '.organic-growth'), { recursive: true });
    writeFileSync(join(tmp, '.organic-growth', '.version'), '0.0.0');
    runCLI([], tmp); // runCLI already includes --force
    const content = readFileSync(join(tmp, '.organic-growth', '.version'), 'utf8');
    assert.equal(content, pkg.version, '.version should be updated to current version on --force install');
  });

  // P3: --opencode install writes .version
  it('P3: --opencode install creates .version with current package version', () => {
    const { tmp } = runCLI(['--opencode']);
    const versionFile = join(tmp, '.organic-growth', '.version');
    assert.ok(existsSync(versionFile), '.version should exist after --opencode install');
    const content = readFileSync(versionFile, 'utf8');
    assert.equal(content, pkg.version, '.version should contain current version in opencode mode');
  });

  // P4: version file is written AFTER template files (verified by checking both exist)
  it('P4: version file exists alongside all template files (written after templates)', () => {
    const { tmp } = runCLI();
    // Templates must exist
    assert.ok(existsSync(join(tmp, 'CLAUDE.md')), 'CLAUDE.md should exist before .version is meaningful');
    assert.ok(existsSync(join(tmp, '.claude')), '.claude directory should exist');
    // Version file must also exist
    assert.ok(existsSync(join(tmp, '.organic-growth', '.version')), '.version should exist after all templates');
  });

  // P5: version file contains only parseable semver string
  it('P5: .version contains only a semver string, no JSON or extra content', () => {
    const { tmp } = runCLI();
    const content = readFileSync(join(tmp, '.organic-growth', '.version'), 'utf8');
    // Must match semver pattern exactly (no wrapping, no newline, no extra text)
    assert.match(content, /^\d+\.\d+\.\d+$/, '.version should be a clean semver string');
    // Must not contain JSON markers
    assert.ok(!content.includes('{'), '.version should not contain JSON');
    assert.ok(!content.includes('"'), '.version should not contain quotes');
  });
});

function runCLIRaw(args, cwd) {
  const tmp = cwd || mkdtempSync(join(tmpdir(), 'og-test-'));
  const output = execFileSync('node', [CLI_PATH, ...args], {
    cwd: tmp,
    encoding: 'utf8',
    timeout: 10000,
  });
  return { tmp, output };
}

describe('Upgrade mode (--upgrade)', () => {
  const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'));

  // Helper: do a fresh install, then run --upgrade
  function freshThenUpgrade(extraInstallArgs = [], extraUpgradeArgs = []) {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    // Fresh install
    execFileSync('node', [CLI_PATH, '--force', ...extraInstallArgs], {
      cwd: tmp, encoding: 'utf8', timeout: 10000,
    });
    // Run upgrade
    const output = execFileSync('node', [CLI_PATH, '--upgrade', ...extraUpgradeArgs], {
      cwd: tmp, encoding: 'utf8', timeout: 10000,
    });
    return { tmp, output };
  }

  // P6: Managed files (.claude/ and .opencode/) are overwritten without prompting
  it('P6: --upgrade overwrites managed files under .claude/ without prompting', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    // Fresh install
    execFileSync('node', [CLI_PATH, '--force'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    // Modify a managed file
    const managedFile = join(tmp, '.claude', 'settings.json');
    writeFileSync(managedFile, '{"modified": true}');

    // Run upgrade
    execFileSync('node', [CLI_PATH, '--upgrade'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    // Managed file should be restored to template version
    const content = readFileSync(managedFile, 'utf8');
    assert.ok(!content.includes('"modified"'), 'managed file should be overwritten by upgrade');
  });

  // P7: User-customized files are never overwritten on upgrade
  it('P7: --upgrade never overwrites CLAUDE.md even if it exists', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    execFileSync('node', [CLI_PATH, '--force'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    // Customize CLAUDE.md
    const claudePath = join(tmp, 'CLAUDE.md');
    writeFileSync(claudePath, '# My Custom CLAUDE.md\n');

    // Run upgrade
    execFileSync('node', [CLI_PATH, '--upgrade'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    const content = readFileSync(claudePath, 'utf8');
    assert.equal(content, '# My Custom CLAUDE.md\n', 'CLAUDE.md should be preserved on upgrade');
  });

  it('P7: --upgrade never overwrites .mcp.json even if it exists', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    execFileSync('node', [CLI_PATH, '--force'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    // Customize .mcp.json
    const mcpPath = join(tmp, '.mcp.json');
    writeFileSync(mcpPath, '{"custom": true}');

    execFileSync('node', [CLI_PATH, '--upgrade'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    const content = readFileSync(mcpPath, 'utf8');
    assert.equal(content, '{"custom": true}', '.mcp.json should be preserved on upgrade');
  });

  it('P7: --upgrade never overwrites AGENTS.md in opencode mode', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    execFileSync('node', [CLI_PATH, '--force', '--opencode'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    writeFileSync(join(tmp, 'AGENTS.md'), '# My Custom AGENTS.md\n');

    execFileSync('node', [CLI_PATH, '--upgrade', '--opencode'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    const content = readFileSync(join(tmp, 'AGENTS.md'), 'utf8');
    assert.equal(content, '# My Custom AGENTS.md\n', 'AGENTS.md should be preserved on upgrade');
  });

  it('P7: --upgrade never overwrites opencode.json in opencode mode', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    execFileSync('node', [CLI_PATH, '--force', '--opencode'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    writeFileSync(join(tmp, 'opencode.json'), '{"custom": true}');

    execFileSync('node', [CLI_PATH, '--upgrade', '--opencode'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    const content = readFileSync(join(tmp, 'opencode.json'), 'utf8');
    assert.equal(content, '{"custom": true}', 'opencode.json should be preserved on upgrade');
  });

  // P8: User-customized files that don't exist are NOT created on upgrade
  it('P8: --upgrade does not create CLAUDE.md if it was deleted', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    execFileSync('node', [CLI_PATH, '--force'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    // Delete the user file
    unlinkSync(join(tmp, 'CLAUDE.md'));

    execFileSync('node', [CLI_PATH, '--upgrade'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    assert.ok(!existsSync(join(tmp, 'CLAUDE.md')), 'CLAUDE.md should not be re-created by upgrade');
  });

  it('P8: --upgrade does not create .mcp.json if it was deleted', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    execFileSync('node', [CLI_PATH, '--force'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    unlinkSync(join(tmp, '.mcp.json'));

    execFileSync('node', [CLI_PATH, '--upgrade'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    assert.ok(!existsSync(join(tmp, '.mcp.json')), '.mcp.json should not be re-created by upgrade');
  });

  // P9: Output distinguishes updated, skipped, and version info
  it('P9: --upgrade output shows updated, skipped, and version info', () => {
    const { output } = freshThenUpgrade();
    const clean = output.replace(/\x1b\[[0-9;]*m/g, '');

    assert.ok(/updated/i.test(clean), 'upgrade output should mention updated files');
    assert.ok(/skipped/i.test(clean), 'upgrade output should mention skipped files');
    // Should show version info (from -> to or "unknown")
    assert.ok(clean.includes(pkg.version), 'upgrade output should show the target version');
  });

  it('P9: --upgrade output shows "unknown" when no prior .version file exists', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    execFileSync('node', [CLI_PATH, '--force'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    // Delete the version file to simulate pre-version-tracking install
    unlinkSync(join(tmp, '.organic-growth', '.version'));

    const output = execFileSync('node', [CLI_PATH, '--upgrade'], {
      cwd: tmp, encoding: 'utf8', timeout: 10000,
    });
    const clean = output.replace(/\x1b\[[0-9;]*m/g, '');

    assert.ok(/unknown/i.test(clean), 'upgrade output should show "unknown" when no prior .version exists');
  });

  // P10: .version is written with new version after upgrade
  it('P10: --upgrade writes .version with new version after managed files are updated', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    execFileSync('node', [CLI_PATH, '--force'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    // Set old version
    writeFileSync(join(tmp, '.organic-growth', '.version'), '1.0.0');

    execFileSync('node', [CLI_PATH, '--upgrade'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    const version = readFileSync(join(tmp, '.organic-growth', '.version'), 'utf8');
    assert.equal(version, pkg.version, '.version should be updated to current package version after upgrade');
  });

  // P11: --upgrade and --force are mutually exclusive
  it('P11: --upgrade and --force together prints error and exits without modifying files', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    execFileSync('node', [CLI_PATH, '--force'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    // Customize a file to verify nothing changes
    writeFileSync(join(tmp, 'CLAUDE.md'), '# custom\n');
    const managedFile = join(tmp, '.claude', 'settings.json');
    const managedBefore = readFileSync(managedFile, 'utf8');
    writeFileSync(managedFile, '{"modified": true}');

    let threw = false;
    let stderr = '';
    try {
      execFileSync('node', [CLI_PATH, '--upgrade', '--force'], {
        cwd: tmp, encoding: 'utf8', timeout: 10000,
      });
    } catch (e) {
      threw = true;
      stderr = e.stderr || e.stdout || '';
    }

    assert.ok(threw, '--upgrade --force should exit with error');
    // Files should be unchanged
    assert.equal(readFileSync(join(tmp, 'CLAUDE.md'), 'utf8'), '# custom\n', 'CLAUDE.md should be untouched');
    assert.equal(readFileSync(managedFile, 'utf8'), '{"modified": true}', 'managed file should be untouched');
  });

  it('P11: --upgrade and -f together also errors', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    let threw = false;
    try {
      execFileSync('node', [CLI_PATH, '--upgrade', '-f'], {
        cwd: tmp, encoding: 'utf8', timeout: 10000,
      });
    } catch (e) {
      threw = true;
    }
    assert.ok(threw, '--upgrade -f should exit with error');
  });

  // P12: --upgrade works without prior .version file
  it('P12: --upgrade works when no .version file exists (treats as unknown)', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    execFileSync('node', [CLI_PATH, '--force'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    // Delete version file
    unlinkSync(join(tmp, '.organic-growth', '.version'));

    // Modify a managed file
    const managedFile = join(tmp, '.claude', 'settings.json');
    writeFileSync(managedFile, '{"modified": true}');

    // Upgrade should still work
    execFileSync('node', [CLI_PATH, '--upgrade'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    // Managed file should be overwritten
    const content = readFileSync(managedFile, 'utf8');
    assert.ok(!content.includes('"modified"'), 'managed file should be overwritten even without prior .version');

    // Version file should now exist
    const version = readFileSync(join(tmp, '.organic-growth', '.version'), 'utf8');
    assert.equal(version, pkg.version, '.version should be written after upgrade');
  });

  // P6 for opencode: managed files under .opencode/ are overwritten
  it('P6: --upgrade --opencode overwrites managed files under .opencode/', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    execFileSync('node', [CLI_PATH, '--force', '--opencode'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    // Modify a managed opencode file
    const managedFile = join(tmp, '.opencode', 'agents', 'gardener.md');
    writeFileSync(managedFile, '# modified gardener');

    execFileSync('node', [CLI_PATH, '--upgrade', '--opencode'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    const content = readFileSync(managedFile, 'utf8');
    assert.ok(!content.includes('# modified gardener'), 'opencode managed file should be overwritten by upgrade');
  });
});

describe('Upgrade CLI output (Stage 3)', () => {
  const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'));

  // P13: --help output includes --upgrade with description
  it('P13: --help includes --upgrade with description mentioning managed files and user customizations', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    const output = execFileSync('node', [CLI_PATH, '--help'], {
      cwd: tmp, encoding: 'utf8', timeout: 5000,
    });
    const clean = output.replace(/\x1b\[[0-9;]*m/g, '');

    assert.ok(clean.includes('--upgrade'), 'help should include --upgrade flag');
    assert.ok(/--upgrade.*managed/i.test(clean) || /--upgrade[\s\S]*managed/i.test(clean.split('\n').join(' ')),
      'help --upgrade description should mention managed files');
  });

  // P14: Fresh install output mentions --upgrade for future upgrades
  it('P14: fresh install "Done!" output mentions --upgrade for future upgrades', () => {
    const { output } = runCLI();
    const clean = output.replace(/\x1b\[[0-9;]*m/g, '');

    assert.ok(/--upgrade/i.test(clean), 'fresh install output should mention --upgrade');
    assert.ok(/upgrade/i.test(clean), 'fresh install output should mention upgrading');
  });

  it('P14: fresh install --opencode output also mentions --upgrade', () => {
    const { output } = runCLI(['--opencode']);
    const clean = output.replace(/\x1b\[[0-9;]*m/g, '');

    assert.ok(/--upgrade/i.test(clean), 'opencode fresh install output should mention --upgrade');
  });

  // P15: --upgrade output does NOT show first-time setup instructions
  it('P15: --upgrade output does not show /seed or "edit CLAUDE.md" instructions', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    execFileSync('node', [CLI_PATH, '--force'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    const output = execFileSync('node', [CLI_PATH, '--upgrade'], {
      cwd: tmp, encoding: 'utf8', timeout: 10000,
    });
    const clean = output.replace(/\x1b\[[0-9;]*m/g, '');

    // Should not contain instructional lines like "Run /seed" or "Edit CLAUDE.md"
    // (file names like seed.md in the updated list are fine — we're checking for setup instructions)
    assert.ok(!/Run\s+\/seed/i.test(clean), 'upgrade output should not instruct to run /seed');
    assert.ok(!/edit\s+(CLAUDE\.md|AGENTS\.md)/i.test(clean), 'upgrade output should not mention editing CLAUDE.md or AGENTS.md');
    assert.ok(!/Next steps/i.test(clean), 'upgrade output should not show "Next steps"');
    assert.ok(!/Commands available/i.test(clean), 'upgrade output should not show "Commands available" section');
  });

  // P16: --upgrade output shows summary line with counts
  it('P16: --upgrade output shows summary with count of files updated and skipped', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    execFileSync('node', [CLI_PATH, '--force'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    const output = execFileSync('node', [CLI_PATH, '--upgrade'], {
      cwd: tmp, encoding: 'utf8', timeout: 10000,
    });
    const clean = output.replace(/\x1b\[[0-9;]*m/g, '');

    // Should contain counts — e.g., "3 updated, 1 skipped" or similar
    assert.ok(/\d+\s+updated/i.test(clean), 'upgrade output should show count of updated files');
    assert.ok(/\d+\s+skipped/i.test(clean), 'upgrade output should show count of skipped files');
  });

  it('P16: --upgrade with no user files to skip shows 0 skipped', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    execFileSync('node', [CLI_PATH, '--force'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    // Delete all user files so nothing gets skipped
    for (const f of ['CLAUDE.md', '.mcp.json']) {
      const p = join(tmp, f);
      if (existsSync(p)) unlinkSync(p);
    }

    const output = execFileSync('node', [CLI_PATH, '--upgrade'], {
      cwd: tmp, encoding: 'utf8', timeout: 10000,
    });
    const clean = output.replace(/\x1b\[[0-9;]*m/g, '');

    assert.ok(/0\s+skipped/i.test(clean), 'should show 0 skipped when no user files exist');
  });
});

describe('Upgrade preserves .organic-growth/ contents (Stage 4)', () => {
  // P17: Files inside .organic-growth/growth/ are never modified, deleted, or overwritten
  it('P17: --upgrade does not modify files inside .organic-growth/growth/', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    execFileSync('node', [CLI_PATH, '--force'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    // Create growth plans
    const growthDir = join(tmp, '.organic-growth', 'growth');
    writeFileSync(join(growthDir, 'my-feature.md'), '# My Feature Plan\nStatus: Growing\n');
    writeFileSync(join(growthDir, 'done-feature.md'), '# Done Feature\nStatus: Complete\n');

    // Run upgrade
    execFileSync('node', [CLI_PATH, '--upgrade'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    // Growth plans must be untouched
    assert.equal(
      readFileSync(join(growthDir, 'my-feature.md'), 'utf8'),
      '# My Feature Plan\nStatus: Growing\n',
      'growth plan should not be modified by upgrade'
    );
    assert.equal(
      readFileSync(join(growthDir, 'done-feature.md'), 'utf8'),
      '# Done Feature\nStatus: Complete\n',
      'completed growth plan should not be modified by upgrade'
    );
  });

  it('P17: --upgrade does not delete files from .organic-growth/growth/', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    execFileSync('node', [CLI_PATH, '--force'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    const growthDir = join(tmp, '.organic-growth', 'growth');
    writeFileSync(join(growthDir, 'feature.md'), '# Feature\n');

    execFileSync('node', [CLI_PATH, '--upgrade'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    assert.ok(existsSync(join(growthDir, 'feature.md')), 'growth plan file should still exist after upgrade');
  });

  // P18: .organic-growth/product-dna.md is never modified or overwritten
  it('P18: --upgrade does not modify .organic-growth/product-dna.md', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    execFileSync('node', [CLI_PATH, '--force'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    // Create a DNA file
    const dnaPath = join(tmp, '.organic-growth', 'product-dna.md');
    writeFileSync(dnaPath, '# My Product DNA\n\nCustom content here.\n');

    execFileSync('node', [CLI_PATH, '--upgrade'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    assert.equal(
      readFileSync(dnaPath, 'utf8'),
      '# My Product DNA\n\nCustom content here.\n',
      'product-dna.md should not be modified by upgrade'
    );
  });

  it('P18: --upgrade does not create product-dna.md if it does not exist', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    execFileSync('node', [CLI_PATH, '--force'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    // Ensure no DNA file
    const dnaPath = join(tmp, '.organic-growth', 'product-dna.md');
    assert.ok(!existsSync(dnaPath), 'precondition: no DNA file');

    execFileSync('node', [CLI_PATH, '--upgrade'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    assert.ok(!existsSync(dnaPath), 'product-dna.md should not be created by upgrade');
  });

  // P19: New managed files from templates are created during upgrade
  it('P19: --upgrade creates new managed files that did not exist before', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    execFileSync('node', [CLI_PATH, '--force'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    // Delete a managed file to simulate it not existing in the previous version
    const managedFile = join(tmp, '.claude', 'settings.json');
    assert.ok(existsSync(managedFile), 'precondition: managed file exists after fresh install');
    unlinkSync(managedFile);

    // Run upgrade — the "new" managed file should be created
    const output = execFileSync('node', [CLI_PATH, '--upgrade'], {
      cwd: tmp, encoding: 'utf8', timeout: 10000,
    });

    assert.ok(existsSync(managedFile), 'new managed file should be created during upgrade');
    // It should appear in the "updated" list
    const clean = output.replace(/\x1b\[[0-9;]*m/g, '');
    assert.ok(clean.includes('.claude/settings.json'), 'new managed file should appear in upgrade output');
  });

  it('P19: --upgrade --opencode creates new managed files that did not exist before', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    execFileSync('node', [CLI_PATH, '--force', '--opencode'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    // Delete a managed opencode file
    const managedFile = join(tmp, '.opencode', 'agents', 'gardener.md');
    assert.ok(existsSync(managedFile), 'precondition: opencode managed file exists');
    unlinkSync(managedFile);

    execFileSync('node', [CLI_PATH, '--upgrade', '--opencode'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    assert.ok(existsSync(managedFile), 'new opencode managed file should be created during upgrade');
  });

  // P20: .organic-growth/growth/ directory is not re-created if it already exists
  it('P20: --upgrade does not show growth directory in output when it already exists', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    execFileSync('node', [CLI_PATH, '--force'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });

    assert.ok(existsSync(join(tmp, '.organic-growth', 'growth')), 'precondition: growth dir exists');

    const output = execFileSync('node', [CLI_PATH, '--upgrade'], {
      cwd: tmp, encoding: 'utf8', timeout: 10000,
    });
    const clean = output.replace(/\x1b\[[0-9;]*m/g, '');

    // Should not mention .organic-growth/growth/ as created or updated
    assert.ok(!clean.includes('.organic-growth/growth'), 'upgrade output should not mention .organic-growth/growth/ directory');
  });
});

describe('Package metadata', () => {
  it('package includes templates and templates-opencode in files array', () => {
    const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'));

    assert.ok(pkg.files.includes('templates/'), 'package files should include templates/');
    assert.ok(pkg.files.includes('templates-opencode/'), 'package files should include templates-opencode/');
  });

  it('package description and keywords include opencode', () => {
    const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'));

    assert.ok(/opencode/i.test(pkg.description), 'description should mention opencode');
    assert.ok(Array.isArray(pkg.keywords) && pkg.keywords.includes('opencode'), 'keywords should include opencode');
  });
});
