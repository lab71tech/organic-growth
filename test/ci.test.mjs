import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');

describe('CI workflow', () => {
  const content = readFileSync(
    join(ROOT, '.github', 'workflows', 'test.yml'),
    'utf8'
  );

  it('test workflow exists and runs node --test', () => {
    assert.ok(content.includes('node --test'), 'should run node --test');
    assert.ok(content.includes('push'), 'should trigger on push');
    assert.ok(content.includes('pull_request'), 'should trigger on pull_request');
    assert.ok(content.includes('actions/checkout'), 'should checkout code');
    assert.ok(content.includes('actions/setup-node'), 'should setup node');
  });

  it('tests across Node 18, 20, and 22 via matrix', () => {
    assert.ok(content.includes('matrix'), 'should use a matrix strategy');
    assert.ok(content.includes('node-version:'), 'should define node-version in matrix');
    for (const version of [18, 20, 22]) {
      assert.ok(
        content.includes(String(version)),
        `matrix should include Node ${version}`
      );
    }
    assert.ok(
      content.includes('matrix.node-version'),
      'should reference matrix.node-version in setup-node'
    );
  });
});
