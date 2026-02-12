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

  it('tests across Node 20 and 22 via matrix', () => {
    assert.ok(content.includes('matrix'), 'should use a matrix strategy');
    assert.ok(content.includes('node-version:'), 'should define node-version in matrix');
    for (const version of [20, 22]) {
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

  it('includes a bun test job', () => {
    assert.ok(content.includes('test-bun'), 'should have a test-bun job');
    assert.ok(content.includes('oven-sh/setup-bun'), 'should use oven-sh/setup-bun action');
    assert.ok(content.includes('bun run test'), 'should run tests via bun');
  });
});

describe('Publish workflow', () => {
  const content = readFileSync(
    join(ROOT, '.github', 'workflows', 'publish.yml'),
    'utf8'
  );

  it('triggers on version tags only', () => {
    assert.ok(content.includes("tags:"), 'should trigger on tags');
    assert.ok(content.includes("'v*'"), 'should match v* tag pattern');
    assert.ok(!content.includes('pull_request'), 'should not trigger on pull requests');
  });

  it('publishes to npm with provenance', () => {
    assert.ok(content.includes('npm publish'), 'should run npm publish');
    assert.ok(content.includes('--provenance'), 'should use --provenance flag');
    assert.ok(content.includes('--access public'), 'should publish with public access');
    assert.ok(content.includes('registry-url'), 'should configure npm registry');
  });

  it('uses NPM_TOKEN secret for authentication', () => {
    assert.ok(content.includes('NPM_TOKEN'), 'should reference NPM_TOKEN secret');
    assert.ok(content.includes('NODE_AUTH_TOKEN'), 'should set NODE_AUTH_TOKEN env var');
  });
});

describe('Dependabot', () => {
  const content = readFileSync(
    join(ROOT, '.github', 'dependabot.yml'),
    'utf8'
  );

  it('config exists and uses version 2', () => {
    assert.ok(content.includes('version: 2'), 'should use Dependabot config version 2');
  });

  it('monitors github-actions ecosystem', () => {
    assert.ok(content.includes('github-actions'), 'should target github-actions ecosystem');
    assert.ok(content.includes('package-ecosystem'), 'should specify package-ecosystem');
  });

  it('has a weekly schedule', () => {
    assert.ok(content.includes('schedule'), 'should define a schedule');
    assert.ok(content.includes('weekly'), 'should use weekly interval');
  });
});

describe('Release workflow', () => {
  const content = readFileSync(
    join(ROOT, '.github', 'workflows', 'release.yml'),
    'utf8'
  );

  it('runs on a daily cron schedule', () => {
    assert.ok(content.includes('schedule'), 'should have a schedule trigger');
    assert.ok(content.includes('cron:'), 'should define a cron expression');
    assert.match(content, /cron:\s*'[\d *\/]+'/,  'cron expression should be properly formatted');
  });

  it('supports manual trigger via workflow_dispatch', () => {
    assert.ok(content.includes('workflow_dispatch'), 'should have workflow_dispatch trigger');
  });

  it('has contents write permission for tagging and releases', () => {
    assert.ok(content.includes('contents: write'), 'should have contents write permission');
  });

  it('checks for changes since the last tag', () => {
    assert.ok(content.includes('git describe --tags'), 'should find the last tag');
    assert.ok(content.includes('rev-list'), 'should count commits since last tag');
    assert.ok(content.includes('has_changes'), 'should output a has_changes flag');
  });

  it('bumps the patch version in package.json', () => {
    assert.ok(content.includes('npm version'), 'should use npm version to bump');
    assert.ok(content.includes('--no-git-tag-version'), 'should not auto-tag during npm version');
  });

  it('commits, tags, and pushes the version bump', () => {
    assert.ok(content.includes('git commit'), 'should commit the version bump');
    assert.ok(content.includes('git tag'), 'should create a git tag');
    assert.ok(content.includes('git push'), 'should push to remote');
    assert.ok(content.includes('--follow-tags'), 'should push tags along with commits');
  });

  it('creates a GitHub Release with auto-generated notes', () => {
    assert.ok(content.includes('gh release create'), 'should use gh release create');
    assert.ok(content.includes('--generate-notes'), 'should auto-generate release notes');
    assert.ok(content.includes('GH_TOKEN'), 'should authenticate with GH_TOKEN');
  });

  it('uses fetch-depth 0 for full git history', () => {
    assert.ok(content.includes('fetch-depth: 0'), 'should fetch full history for tag detection');
  });
});

describe('README badge and repo URL', () => {
  const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

  it('README has CI status badge', () => {
    assert.ok(readme.includes('actions/workflows/test.yml/badge.svg'), 'should have test workflow badge image');
    assert.ok(readme.includes('actions/workflows/test.yml'), 'should link badge to workflow');
  });

  it('package.json repository URL is not a placeholder', () => {
    assert.ok(pkg.repository, 'should have a repository field');
    assert.ok(!pkg.repository.url.includes('TODO'), 'repository URL should not contain TODO');
    assert.match(
      pkg.repository.url,
      /^https:\/\/github\.com\/[\w-]+\/[\w-]+$/,
      'repository URL should be a valid GitHub URL'
    );
  });
});
