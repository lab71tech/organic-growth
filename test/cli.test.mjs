import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, existsSync, statSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
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
    const content = readFileSync(join(import.meta.dirname, '..', 'docs', 'example-growth-plan.md'), 'utf8');
    assert.ok(/Capabilities:/i.test(content), 'example growth plan should include Capabilities tags');
  });

  it('product DNA document no longer mentions superpowers integration', () => {
    const content = readFileSync(join(import.meta.dirname, '..', 'docs', 'product-dna.md'), 'utf8');
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
    const { output } = runCLI([], tmp); // runCLI already includes --force
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
