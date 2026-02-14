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
    assert.ok(existsSync(join(tmp, '.claude', 'CLAUDE.md')), 'should create CLAUDE.md');
  });
});

describe('CLI template completeness', () => {
  it('installs all 7 template files', () => {
    const { tmp } = runCLI();

    const expectedFiles = [
      '.claude/CLAUDE.md',
      '.claude/agents/gardener.md',
      '.claude/commands/seed.md',
      '.claude/commands/grow.md',
      '.claude/commands/next.md',
      '.claude/commands/replan.md',
      '.claude/commands/review.md',
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
  it('CLAUDE.md contains key section markers', () => {
    const { tmp } = runCLI();
    const content = readFileSync(join(tmp, '.claude', 'CLAUDE.md'), 'utf8');

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
    const { tmp } = runCLI();
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
    const { tmp } = runCLI();
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
    const { tmp } = runCLI();
    const content = readFileSync(join(tmp, '.claude', 'CLAUDE.md'), 'utf8');

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
    const { tmp } = runCLI();
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
      'templates/.claude/CLAUDE.md',
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
