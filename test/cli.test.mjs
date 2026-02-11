import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const CLI_PATH = join(import.meta.dirname, '..', 'bin', 'cli.mjs');

describe('CLI smoke test', () => {
  it('runs without error and copies templates into target directory', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-test-'));
    const result = execFileSync('node', [CLI_PATH, '--force'], {
      cwd: tmp,
      encoding: 'utf8',
      timeout: 5000,
    });

    assert.ok(result.includes('Organic Growth'), 'should print banner');
    assert.ok(result.includes('Done!'), 'should print completion message');
    assert.ok(existsSync(join(tmp, '.claude', 'CLAUDE.md')), 'should create CLAUDE.md');
  });
});
