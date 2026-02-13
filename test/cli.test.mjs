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

    assert.ok(output.includes('copilot-instructions.md'), 'should mention copilot-instructions.md');
    assert.ok(!output.includes('/seed'), 'should NOT show Claude Code commands');
  });

  it('--target claude shows claude-specific next steps', () => {
    const { output } = runCLI(['--target', 'claude']);

    assert.ok(output.includes('CLAUDE.md'), 'should mention CLAUDE.md');
    assert.ok(output.includes('/seed'), 'should show Claude Code commands');
    assert.ok(!output.includes('copilot-instructions.md'), 'should NOT mention copilot');
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
