import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');

describe('CI workflow', () => {
  it('test workflow exists and runs node --test', () => {
    const content = readFileSync(
      join(ROOT, '.github', 'workflows', 'test.yml'),
      'utf8'
    );

    assert.ok(content.includes('node --test'), 'should run node --test');
    assert.ok(content.includes('push'), 'should trigger on push');
    assert.ok(content.includes('pull_request'), 'should trigger on pull_request');
    assert.ok(content.includes('actions/checkout'), 'should checkout code');
    assert.ok(content.includes('actions/setup-node'), 'should setup node');
  });
});
