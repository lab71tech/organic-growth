import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, existsSync, statSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

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
