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

  it('has an active cron schedule for daily releases', () => {
    assert.ok(content.includes('schedule:'), 'should have a schedule trigger');
    assert.ok(content.includes("cron: '0 12 * * *'"), 'should run daily at noon UTC');
    assert.ok(!content.includes('# schedule:'), 'schedule should not be commented out');
  });

  it('supports manual trigger via workflow_dispatch', () => {
    assert.ok(content.includes('workflow_dispatch'), 'should have workflow_dispatch trigger');
  });

  it('has contents write permission for tagging and releases', () => {
    assert.ok(content.includes('contents: write'), 'should have contents write permission');
  });

  it('checks for changes since the last tag', () => {
    assert.ok(content.includes('git describe --tags'), 'should find the last tag');
    assert.ok(content.includes('git log'), 'should use git log to inspect commits since last tag');
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

  it('filters out version-bump commits to prevent release loops', () => {
    assert.ok(content.includes('--invert-grep'), 'should use --invert-grep to exclude version-bump commits');
    assert.ok(content.includes('chore: bump version'), 'should match the version-bump commit message pattern');
    assert.ok(content.includes('git log'), 'should use git log for filtered commit counting');
  });

  it('has concurrency control to prevent parallel release races', () => {
    assert.ok(content.includes('concurrency:'), 'should have a concurrency block');
    assert.ok(content.includes('group: release'), 'should use a release concurrency group');
    assert.ok(content.includes('cancel-in-progress: false'), 'should not cancel in-progress releases');
  });
});

describe('Release notes configuration', () => {
  const content = readFileSync(
    join(ROOT, '.github', 'release.yml'),
    'utf8'
  );

  it('config file exists and contains changelog categories', () => {
    assert.ok(content.includes('changelog:'), 'should have a changelog key');
    assert.ok(content.includes('categories:'), 'should have a categories key');
  });

  it('has a Features category for enhancements', () => {
    assert.ok(content.includes('title: Features'), 'should have a Features category');
    assert.ok(content.includes('enhancement'), 'should include the enhancement label');
  });

  it('has a Bug Fixes category', () => {
    assert.ok(content.includes('title: Bug Fixes'), 'should have a Bug Fixes category');
    assert.ok(content.includes('bug'), 'should include the bug label');
  });

  it('has a CI/CD category for automation changes', () => {
    assert.ok(content.includes('title: CI/CD'), 'should have a CI/CD category');
    assert.ok(content.includes('ci'), 'should include the ci label');
    assert.ok(content.includes('github_actions'), 'should include the github_actions label');
    assert.ok(content.includes('dependencies'), 'should include the dependencies label');
  });

  it('has a Documentation category', () => {
    assert.ok(content.includes('title: Documentation'), 'should have a Documentation category');
    assert.ok(content.includes('documentation'), 'should include the documentation label');
  });

  it('has a catch-all category with wildcard label', () => {
    assert.ok(content.includes('title: Other Changes'), 'should have an Other Changes category');
    assert.ok(content.includes('"*"'), 'should include the wildcard label for unlabeled PRs');
  });
});

describe('README badge and repo URL', () => {
  const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

  it('README has CI status badge', () => {
    assert.ok(readme.includes('actions/workflows/test.yml/badge.svg'), 'should have test workflow badge image');
    assert.ok(readme.includes('actions/workflows/test.yml'), 'should link badge to workflow');
  });

  it('README has GitHub Release badge', () => {
    assert.ok(
      readme.includes('https://img.shields.io/github/v/release/lab71tech/organic-growth'),
      'should have shields.io release badge image URL'
    );
    assert.ok(
      readme.includes('https://github.com/lab71tech/organic-growth/releases'),
      'should link release badge to GitHub Releases page'
    );
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
