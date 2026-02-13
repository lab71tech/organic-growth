import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, existsSync, statSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';

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
  it('installs all 9 template files', () => {
    const { tmp } = runCLI();

    const expectedFiles = [
      '.claude/CLAUDE.md',
      '.claude/agents/gardener.md',
      '.claude/commands/seed.md',
      '.claude/commands/grow.md',
      '.claude/commands/next.md',
      '.claude/commands/replan.md',
      '.claude/commands/review.md',
      '.github/copilot-instructions.md',
      'docs/project-context.md',
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
    assert.ok(output.includes('--target'), 'should document --target flag');
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
  it('CLAUDE.md references shared project context and contains methodology', () => {
    const { tmp } = runCLI();
    const content = readFileSync(join(tmp, '.claude', 'CLAUDE.md'), 'utf8');

    const markers = [
      'project-context.md',
      'Organic Growth',
      'Growth Rules',
    ];
    for (const marker of markers) {
      assert.ok(
        content.includes(marker),
        `CLAUDE.md should contain "${marker}"`
      );
    }

    // Should NOT contain fill-in placeholders (those live in project-context.md now)
    assert.ok(
      !content.includes('[One sentence'),
      'CLAUDE.md should not contain fill-in placeholders'
    );
  });

  it('gardener agent contains all three modes, quality gate, and reads project-context.md', () => {
    const { tmp } = runCLI();
    const content = readFileSync(join(tmp, '.claude', 'agents', 'gardener.md'), 'utf8');

    const markers = [
      'Mode: PLAN',
      'Mode: GROW',
      'Mode: REPLAN',
      'Quality gate',
      'project-context.md',
    ];
    for (const marker of markers) {
      assert.ok(
        content.includes(marker),
        `gardener.md should contain "${marker}"`
      );
    }
  });

  it('copilot-instructions.md contains key sections', () => {
    const { tmp } = runCLI();
    const content = readFileSync(join(tmp, '.github', 'copilot-instructions.md'), 'utf8');

    const markers = [
      'Product',
      'Tech Stack',
      'Organic Growth',
      'Quality gate',
      'Vertical, not horizontal',
    ];
    for (const marker of markers) {
      assert.ok(
        content.includes(marker),
        `copilot-instructions.md should contain "${marker}"`
      );
    }
  });

  it('copilot-instructions.md has fill-in placeholders for project context', () => {
    const { tmp } = runCLI();
    const content = readFileSync(join(tmp, '.github', 'copilot-instructions.md'), 'utf8');

    const placeholders = [
      '[One sentence',
      '[Who uses it',
      '[What pain does it solve',
      '[3-7 terms',
      '[Greenfield',
    ];
    for (const placeholder of placeholders) {
      assert.ok(
        content.includes(placeholder),
        `copilot-instructions.md should contain placeholder "${placeholder}"`
      );
    }
  });

  it('copilot-instructions.md uses Copilot-oriented framing (not Claude agent commands)', () => {
    const { tmp } = runCLI();
    const content = readFileSync(join(tmp, '.github', 'copilot-instructions.md'), 'utf8');

    // Should have chat-oriented guidance
    assert.ok(
      content.includes('How to Work With Me'),
      'should use "How to Work With Me" framing for Copilot'
    );

    // Should NOT contain Claude Code-specific concepts
    const claudeOnlyConcepts = [
      'Mode: PLAN',
      'Mode: GROW',
      'Mode: REPLAN',
      '/seed',
      '/next',
      '/replan',
      '/review',
      'gardener agent',
    ];
    for (const concept of claudeOnlyConcepts) {
      assert.ok(
        !content.includes(concept),
        `copilot-instructions.md should NOT contain Claude-specific concept "${concept}"`
      );
    }
  });

  it('copilot-instructions.md contains quality tools and growth plan sections', () => {
    const { tmp } = runCLI();
    const content = readFileSync(join(tmp, '.github', 'copilot-instructions.md'), 'utf8');

    const sections = [
      'Quality tools',
      'Priorities',
      'Growth Plans',
      'Commit Convention',
      'feat(scope)',
    ];
    for (const section of sections) {
      assert.ok(
        content.includes(section),
        `copilot-instructions.md should contain "${section}"`
      );
    }
  });

  it('copilot-instructions.md has sync markers for project context', () => {
    const { tmp } = runCLI();
    const content = readFileSync(join(tmp, '.github', 'copilot-instructions.md'), 'utf8');

    assert.ok(
      content.includes('<!-- BEGIN PROJECT CONTEXT'),
      'should have BEGIN PROJECT CONTEXT marker'
    );
    assert.ok(
      content.includes('<!-- END PROJECT CONTEXT -->'),
      'should have END PROJECT CONTEXT marker'
    );

    // BEGIN marker should come before END marker
    const beginIdx = content.indexOf('<!-- BEGIN PROJECT CONTEXT');
    const endIdx = content.indexOf('<!-- END PROJECT CONTEXT -->');
    assert.ok(
      beginIdx < endIdx,
      'BEGIN marker should come before END marker'
    );
  });

  it('copilot-instructions.md documents growth plan stage markers', () => {
    const { tmp } = runCLI();
    const content = readFileSync(join(tmp, '.github', 'copilot-instructions.md'), 'utf8');

    assert.ok(
      content.includes('not started'),
      'should explain the open stage marker'
    );
    assert.ok(
      content.includes('completed'),
      'should explain the completed stage marker'
    );
  });

  it('project-context.md contains key sections', () => {
    const { tmp } = runCLI();
    const content = readFileSync(join(tmp, 'docs', 'project-context.md'), 'utf8');

    const sections = [
      'Product',
      'Tech Stack',
      'Quality tools',
      'Priorities',
    ];
    for (const section of sections) {
      assert.ok(
        content.includes(section),
        `project-context.md should contain "${section}"`
      );
    }
  });

  it('project-context.md has fill-in placeholders', () => {
    const { tmp } = runCLI();
    const content = readFileSync(join(tmp, 'docs', 'project-context.md'), 'utf8');

    const placeholders = [
      '[One sentence',
      '[Who uses it',
      '[What pain does it solve',
    ];
    for (const placeholder of placeholders) {
      assert.ok(
        content.includes(placeholder),
        `project-context.md should contain placeholder "${placeholder}"`
      );
    }
  });

  it('project-context.md is installed regardless of --target flag', () => {
    const targets = ['claude', 'copilot', 'all'];
    for (const target of targets) {
      const { tmp } = runCLI(['--target', target]);
      assert.ok(
        existsSync(join(tmp, 'docs', 'project-context.md')),
        `project-context.md should be installed with --target ${target}`
      );
    }
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
      'templates/docs/project-context.md',
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

describe('CLI --target flag', () => {
  it('--target claude installs only .claude/ files', () => {
    const { tmp } = runCLI(['--target', 'claude']);

    assert.ok(existsSync(join(tmp, '.claude', 'CLAUDE.md')), 'should install .claude/CLAUDE.md');
    assert.ok(existsSync(join(tmp, '.claude', 'agents', 'gardener.md')), 'should install gardener agent');
    assert.ok(!existsSync(join(tmp, '.github', 'copilot-instructions.md')), 'should NOT install copilot-instructions.md');
  });

  it('--target copilot installs only .github/ files', () => {
    const { tmp } = runCLI(['--target', 'copilot']);

    assert.ok(existsSync(join(tmp, '.github', 'copilot-instructions.md')), 'should install copilot-instructions.md');
    assert.ok(!existsSync(join(tmp, '.claude')), 'should NOT install .claude/ directory');
  });

  it('--target all installs both', () => {
    const { tmp } = runCLI(['--target', 'all']);

    assert.ok(existsSync(join(tmp, '.claude', 'CLAUDE.md')), 'should install .claude/CLAUDE.md');
    assert.ok(existsSync(join(tmp, '.github', 'copilot-instructions.md')), 'should install copilot-instructions.md');
  });

  it('default (no --target) installs both', () => {
    const { tmp } = runCLI();

    assert.ok(existsSync(join(tmp, '.claude', 'CLAUDE.md')), 'should install .claude/CLAUDE.md');
    assert.ok(existsSync(join(tmp, '.github', 'copilot-instructions.md')), 'should install copilot-instructions.md');
  });

  it('--target copilot shows copilot-specific next steps', () => {
    const { output } = runCLI(['--target', 'copilot']);

    assert.ok(output.includes('project-context.md'), 'should mention project-context.md as the file to edit');
    assert.ok(output.includes('npx organic-growth sync'), 'should suggest running sync for copilot');
    assert.ok(!output.includes('/seed'), 'should NOT show Claude Code commands');
  });

  it('--target claude shows claude-specific next steps', () => {
    const { output } = runCLI(['--target', 'claude']);

    assert.ok(output.includes('project-context.md'), 'should mention project-context.md as the file to edit');
    assert.ok(output.includes('/seed'), 'should show Claude Code commands');
    assert.ok(!output.includes('npx organic-growth sync'), 'should NOT suggest sync when copilot not installed');
  });

  it('default install guides users to project-context.md as the single file to edit', () => {
    const { output } = runCLI();

    assert.ok(output.includes('project-context.md'), 'should mention project-context.md');
    assert.ok(
      output.includes('product, tech stack, and priorities'),
      'should describe what to fill in'
    );
  });

  it('default install suggests sync when copilot is installed', () => {
    const { output } = runCLI();

    assert.ok(output.includes('npx organic-growth sync'), 'should suggest running sync');
  });

  it('install output does not tell users to edit tool-specific config files directly', () => {
    const { output } = runCLI();

    // The "Next steps" section should not guide users to edit CLAUDE.md or copilot-instructions.md directly
    // (CLAUDE.md may still appear in the "Installed:" file listing, so check only the "Next steps" part)
    const nextStepsIdx = output.indexOf('Next steps:');
    assert.ok(nextStepsIdx !== -1, 'should have a Next steps section');
    const nextSteps = output.substring(nextStepsIdx);

    assert.ok(
      !nextSteps.includes('Edit') || !nextSteps.includes('CLAUDE.md'),
      'should NOT tell users to edit CLAUDE.md directly'
    );
    assert.ok(
      !nextSteps.includes('Edit') || !nextSteps.includes('copilot-instructions.md'),
      'should NOT tell users to edit copilot-instructions.md directly'
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

// --- Sync subcommand tests ---

/** Set up a temp directory with project-context.md and a target file containing markers. */
function setupSyncEnv({ contextContent, targetContent } = {}) {
  const tmp = mkdtempSync(join(tmpdir(), 'og-sync-'));

  // Create docs/project-context.md
  if (contextContent !== undefined) {
    mkdirSync(join(tmp, 'docs'), { recursive: true });
    writeFileSync(join(tmp, 'docs', 'project-context.md'), contextContent);
  }

  // Create .github/copilot-instructions.md with markers
  if (targetContent !== undefined) {
    mkdirSync(join(tmp, '.github'), { recursive: true });
    writeFileSync(join(tmp, '.github', 'copilot-instructions.md'), targetContent);
  }

  return tmp;
}

function runSync(cwd, extraArgs = []) {
  return execFileSync('node', [CLI_PATH, 'sync', ...extraArgs], {
    cwd,
    encoding: 'utf8',
    timeout: 5000,
  });
}

describe('CLI sync subcommand', () => {
  it('replaces content between markers in copilot-instructions.md', () => {
    const context = '# My Project\n\n**What:** A test project\n**For whom:** Developers';
    const target = [
      '<!-- BEGIN PROJECT CONTEXT — synced from docs/project-context.md -->',
      '',
      'Old placeholder content here',
      '',
      '<!-- END PROJECT CONTEXT -->',
      '',
      '# Methodology section (unchanged)',
    ].join('\n');

    const tmp = setupSyncEnv({ contextContent: context, targetContent: target });
    const output = runSync(tmp);

    assert.ok(output.includes('synced'), 'should report synced');

    const result = readFileSync(join(tmp, '.github', 'copilot-instructions.md'), 'utf8');
    assert.ok(result.includes('A test project'), 'should contain new project context');
    assert.ok(result.includes('Methodology section (unchanged)'), 'should preserve content after END marker');
    assert.ok(!result.includes('Old placeholder content'), 'should replace old content');
    assert.ok(result.includes('<!-- BEGIN PROJECT CONTEXT'), 'should preserve BEGIN marker');
    assert.ok(result.includes('<!-- END PROJECT CONTEXT -->'), 'should preserve END marker');
  });

  it('reports "already up to date" when content has not changed', () => {
    const context = '# My Project';
    // First sync to establish the format, then sync again to verify "unchanged"
    const target = [
      '<!-- BEGIN PROJECT CONTEXT — synced from docs/project-context.md -->',
      '',
      'Old content',
      '',
      '<!-- END PROJECT CONTEXT -->',
    ].join('\n');

    const tmp = setupSyncEnv({ contextContent: context, targetContent: target });
    // First sync replaces old content
    runSync(tmp);
    // Second sync should detect no changes
    const output = runSync(tmp);

    assert.ok(output.includes('already up to date'), 'should report unchanged on second sync');
  });

  it('handles missing docs/project-context.md gracefully', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-sync-'));
    // No project-context.md, no target files

    try {
      runSync(tmp);
      assert.fail('should have exited with error');
    } catch (err) {
      assert.ok(err.status !== 0, 'should exit with non-zero status');
      assert.ok(
        err.stdout.includes('project-context.md not found'),
        'should report missing file'
      );
    }
  });

  it('warns when target file does not exist', () => {
    const context = '# My Project';
    const tmp = setupSyncEnv({ contextContent: context });
    // No copilot-instructions.md file

    const output = runSync(tmp);
    assert.ok(output.includes('file not found'), 'should warn about missing target');
  });

  it('warns when target file has no sync markers', () => {
    const context = '# My Project';
    const tmp = setupSyncEnv({ contextContent: context });
    mkdirSync(join(tmp, '.github'), { recursive: true });
    writeFileSync(join(tmp, '.github', 'copilot-instructions.md'), '# No markers here\n');

    const output = runSync(tmp);
    assert.ok(output.includes('no sync markers'), 'should warn about missing markers');
  });

  it('--target copilot syncs only copilot config', () => {
    const context = '# My Project\n\n**What:** Filtered sync test';
    const target = [
      '<!-- BEGIN PROJECT CONTEXT — synced from docs/project-context.md -->',
      '',
      'Old content',
      '',
      '<!-- END PROJECT CONTEXT -->',
    ].join('\n');

    const tmp = setupSyncEnv({ contextContent: context, targetContent: target });
    const output = runSync(tmp, ['--target', 'copilot']);

    assert.ok(output.includes('synced'), 'should report synced');
    const result = readFileSync(join(tmp, '.github', 'copilot-instructions.md'), 'utf8');
    assert.ok(result.includes('Filtered sync test'), 'should contain updated content');
  });

  it('sync --help shows help text', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-sync-'));
    const output = execFileSync('node', [CLI_PATH, 'sync', '--help'], {
      cwd: tmp,
      encoding: 'utf8',
      timeout: 5000,
    });

    assert.ok(output.includes('Usage:'), 'should print usage section');
    assert.ok(output.includes('sync'), 'should mention sync command');
  });

  it('warns when project-context.md contains unfilled placeholder text', () => {
    // Use the default template content which has placeholders like "[One sentence..."
    const templateContent = readFileSync(
      join(import.meta.dirname, '..', 'templates', 'docs', 'project-context.md'),
      'utf8'
    );
    const target = [
      '<!-- BEGIN PROJECT CONTEXT — synced from docs/project-context.md -->',
      '',
      'Old content',
      '',
      '<!-- END PROJECT CONTEXT -->',
    ].join('\n');

    const tmp = setupSyncEnv({ contextContent: templateContent, targetContent: target });
    const output = runSync(tmp);

    assert.ok(
      output.includes('unfilled placeholder text'),
      'should warn about placeholder text'
    );
    assert.ok(
      output.includes('bracketed instructions'),
      'should hint to replace bracketed instructions'
    );
    // Sync should still proceed (non-blocking)
    assert.ok(output.includes('synced'), 'should still sync despite placeholders');
  });

  it('does not warn when project-context.md has been filled in', () => {
    const filledContent = [
      '# Project Context',
      '',
      '## Product',
      '',
      '**What:** A task management CLI for solo developers',
      '**For whom:** Individual developers who want lightweight project tracking',
      '**Core problem:** Existing tools are bloated for solo use',
      '**Key domain concepts:** task, project, sprint, backlog',
      '**Current state:** Greenfield',
      '',
      '## Tech Stack',
      '',
      '- Node.js 20+',
      '- SQLite for persistence',
      '',
      '### Quality tools',
      '',
      '- **Build:** npm run build',
      '- **Test:** npm test',
      '',
      '## Priorities',
      '',
      '- MVP speed over production polish',
    ].join('\n');
    const target = [
      '<!-- BEGIN PROJECT CONTEXT — synced from docs/project-context.md -->',
      '',
      'Old content',
      '',
      '<!-- END PROJECT CONTEXT -->',
    ].join('\n');

    const tmp = setupSyncEnv({ contextContent: filledContent, targetContent: target });
    const output = runSync(tmp);

    assert.ok(
      !output.includes('unfilled placeholder text'),
      'should NOT warn when context is filled in'
    );
    assert.ok(output.includes('synced'), 'should sync normally');
  });

  it('preserves the BEGIN marker comment text exactly', () => {
    const context = '# Updated Context';
    const beginLine = '<!-- BEGIN PROJECT CONTEXT — synced from docs/project-context.md -->';
    const target = [
      beginLine,
      '',
      'Old content',
      '',
      '<!-- END PROJECT CONTEXT -->',
      '',
      '# After',
    ].join('\n');

    const tmp = setupSyncEnv({ contextContent: context, targetContent: target });
    runSync(tmp);

    const result = readFileSync(join(tmp, '.github', 'copilot-instructions.md'), 'utf8');
    assert.ok(result.startsWith(beginLine), 'should preserve the exact BEGIN marker line');
  });
});

// --- Sync --watch tests ---

/**
 * Spawn the CLI in watch mode and collect stdout.
 * Returns { proc, output(), kill() }.
 */
function spawnWatch(cwd, extraArgs = []) {
  const proc = spawn('node', [CLI_PATH, 'sync', '--watch', ...extraArgs], {
    cwd,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '0' },
  });

  let stdout = '';
  let stderr = '';
  proc.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
  proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

  return {
    proc,
    output: () => stdout,
    errors: () => stderr,
    kill: () => {
      proc.kill('SIGINT');
      return new Promise((resolve) => {
        proc.on('close', resolve);
        // Safety timeout in case SIGINT doesn't work
        setTimeout(() => { proc.kill('SIGKILL'); resolve(); }, 2000);
      });
    },
  };
}

describe('CLI sync --watch', () => {
  it('performs initial sync and prints watch message, then stops on SIGINT', async () => {
    const context = '# Watch Test Project\n\n**What:** A watch test';
    const target = [
      '<!-- BEGIN PROJECT CONTEXT — synced from docs/project-context.md -->',
      '',
      'Old content',
      '',
      '<!-- END PROJECT CONTEXT -->',
    ].join('\n');

    const tmp = setupSyncEnv({ contextContent: context, targetContent: target });
    const w = spawnWatch(tmp);

    // Wait for initial sync and watch message to appear
    await delay(500);

    const out = w.output();
    assert.ok(out.includes('synced'), 'should perform initial sync');
    assert.ok(out.includes('Watching'), 'should print watching message');

    // Verify the file was actually synced
    const result = readFileSync(join(tmp, '.github', 'copilot-instructions.md'), 'utf8');
    assert.ok(result.includes('Watch Test Project'), 'target file should contain synced content');

    // Stop the watcher
    await w.kill();
  });

  it('detects file changes and re-syncs', async () => {
    const context = '# Initial Content';
    const target = [
      '<!-- BEGIN PROJECT CONTEXT — synced from docs/project-context.md -->',
      '',
      'Old content',
      '',
      '<!-- END PROJECT CONTEXT -->',
    ].join('\n');

    const tmp = setupSyncEnv({ contextContent: context, targetContent: target });
    const w = spawnWatch(tmp);

    // Wait for initial sync
    await delay(500);

    // Modify the project-context.md file
    writeFileSync(join(tmp, 'docs', 'project-context.md'), '# Updated Via Watch');

    // Wait for debounce (150ms) + processing time
    await delay(600);

    const out = w.output();
    assert.ok(out.includes('Change detected'), 'should detect the file change');

    // Verify the re-synced content in the target file
    const result = readFileSync(join(tmp, '.github', 'copilot-instructions.md'), 'utf8');
    assert.ok(result.includes('Updated Via Watch'), 'target should contain updated content after re-sync');

    await w.kill();
  });

  it('--watch works together with --target flag', async () => {
    const context = '# Target Watch Test';
    const target = [
      '<!-- BEGIN PROJECT CONTEXT — synced from docs/project-context.md -->',
      '',
      'Old content',
      '',
      '<!-- END PROJECT CONTEXT -->',
    ].join('\n');

    const tmp = setupSyncEnv({ contextContent: context, targetContent: target });
    const w = spawnWatch(tmp, ['--target', 'copilot']);

    // Wait for initial sync
    await delay(500);

    const out = w.output();
    assert.ok(out.includes('synced'), 'should sync with --target flag');
    assert.ok(out.includes('Watching'), 'should enter watch mode');

    await w.kill();
  });

  it('help text documents --watch flag', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'og-sync-'));
    const output = execFileSync('node', [CLI_PATH, '--help'], {
      cwd: tmp,
      encoding: 'utf8',
      timeout: 5000,
    });

    assert.ok(output.includes('--watch'), 'help should document --watch flag');
    assert.ok(output.includes('auto-sync'), 'help should describe auto-sync behavior');
  });
});
