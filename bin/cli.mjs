#!/usr/bin/env node

import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMPLATES_DIR = join(__dirname, '..', 'templates');
const TARGET_DIR = process.cwd();

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';

function log(msg) { console.log(msg); }
function success(msg) { log(`${GREEN}✓${RESET} ${msg}`); }
function warn(msg) { log(`${YELLOW}!${RESET} ${msg}`); }
function info(msg) { log(`${CYAN}→${RESET} ${msg}`); }

async function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

function getAllFiles(dir, base = dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...getAllFiles(full, base));
    } else {
      files.push(relative(base, full));
    }
  }
  return files;
}

function readVersion() {
  const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
  return pkg.version;
}

function printHelp() {
  log('');
  log(`${GREEN}🌱 Organic Growth${RESET} — setup for incremental development`);
  log('');
  log(`${CYAN}Usage:${RESET}`);
  log(`  npx organic-growth [options] [dna-file.md]    Install templates`);
  log(`  npx organic-growth sync [--target <name>]     Sync project context to tool configs`);
  log('');
  log(`${CYAN}Options:${RESET}`);
  log(`  -f, --force              Overwrite existing files without prompting`);
  log(`  --target <claude|copilot|all>  Which AI tool config to install/sync (default: all)`);
  log(`  -h, --help               Show this help message`);
  log(`  -v, --version            Show version number`);
  log('');
  log(`${CYAN}Arguments:${RESET}`);
  log(`  dna-file.md     Path to a product DNA document to copy into docs/`);
  log('');
  log(`${CYAN}Commands:${RESET}`);
  log(`  sync            Sync docs/project-context.md into tool config files`);
  log(`                  Replaces content between sync markers in target files`);
  log('');
  log(`${CYAN}Examples:${RESET}`);
  log(`  npx organic-growth                        Install all templates (prompts on conflicts)`);
  log(`  npx organic-growth --target claude         Install only Claude Code config`);
  log(`  npx organic-growth --target copilot        Install only GitHub Copilot config`);
  log(`  npx organic-growth --force spec.md         Install all + copy DNA document`);
  log(`  npx organic-growth sync                    Sync project context to all tool configs`);
  log(`  npx organic-growth sync --target copilot   Sync only to Copilot config`);
  log('');
}

const BEGIN_MARKER = '<!-- BEGIN PROJECT CONTEXT';
const END_MARKER = '<!-- END PROJECT CONTEXT -->';

// Files that contain sync markers, keyed by target name
const SYNC_TARGETS = {
  copilot: '.github/copilot-instructions.md',
};

const VALID_TARGETS = ['claude', 'copilot', 'all'];
const TARGET_PREFIXES = {
  claude: ['.claude/'],
  copilot: ['.github/'],
  all: ['.claude/', '.github/'],
};

function parseTarget(args) {
  const idx = args.indexOf('--target');
  if (idx === -1) return 'all';
  const value = args[idx + 1];
  if (!value || !VALID_TARGETS.includes(value)) {
    console.error(`Error: --target must be one of: ${VALID_TARGETS.join(', ')}`);
    process.exit(1);
  }
  return value;
}

function syncFile(filePath, contextContent) {
  if (!existsSync(filePath)) {
    return { status: 'missing' };
  }

  const content = readFileSync(filePath, 'utf8');
  const beginIdx = content.indexOf(BEGIN_MARKER);
  const endIdx = content.indexOf(END_MARKER);

  if (beginIdx === -1 || endIdx === -1 || beginIdx >= endIdx) {
    return { status: 'no-markers' };
  }

  // Find the end of the BEGIN marker line
  const beginLineEnd = content.indexOf('\n', beginIdx);
  if (beginLineEnd === -1) {
    return { status: 'no-markers' };
  }

  // Build the replacement: keep the BEGIN marker line, inject content, then END marker
  const before = content.substring(0, beginLineEnd + 1);
  const after = content.substring(endIdx);
  const newContent = before + '\n' + contextContent + '\n' + after;

  if (newContent === content) {
    return { status: 'unchanged' };
  }

  writeFileSync(filePath, newContent, 'utf8');
  return { status: 'synced' };
}

function parseSyncTarget(args) {
  const idx = args.indexOf('--target');
  if (idx === -1) return 'all';
  const value = args[idx + 1];
  const validSyncTargets = [...Object.keys(SYNC_TARGETS), 'all'];
  if (!value || !validSyncTargets.includes(value)) {
    console.error(`Error: --target must be one of: ${validSyncTargets.join(', ')}`);
    process.exit(1);
  }
  return value;
}

function sync() {
  const args = process.argv.slice(3); // skip 'node', 'cli.mjs', 'sync'

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  const target = parseSyncTarget(args);

  log('');
  log(`${GREEN}🌱 Organic Growth${RESET} — sync project context`);
  log('');

  // Read project-context.md
  const contextPath = join(TARGET_DIR, 'docs', 'project-context.md');
  if (!existsSync(contextPath)) {
    warn('docs/project-context.md not found.');
    info(`Run ${CYAN}npx organic-growth${RESET} to install templates first.`);
    log('');
    process.exit(1);
  }

  const contextContent = readFileSync(contextPath, 'utf8').trimEnd();

  // Determine which files to sync
  const targets = target === 'all'
    ? Object.entries(SYNC_TARGETS)
    : [[target, SYNC_TARGETS[target]]];

  let syncedCount = 0;

  for (const [name, relPath] of targets) {
    const fullPath = join(TARGET_DIR, relPath);
    const result = syncFile(fullPath, contextContent);

    switch (result.status) {
      case 'synced':
        success(`${relPath} — synced`);
        syncedCount++;
        break;
      case 'unchanged':
        info(`${relPath} — already up to date`);
        break;
      case 'missing':
        warn(`${relPath} — file not found (run ${CYAN}npx organic-growth --target ${name}${RESET} to install)`);
        break;
      case 'no-markers':
        warn(`${relPath} — no sync markers found`);
        break;
    }
  }

  log('');
  if (syncedCount > 0) {
    log(`${GREEN}Done!${RESET} Synced ${syncedCount} file${syncedCount > 1 ? 's' : ''} from docs/project-context.md`);
  } else {
    log(`${DIM}Nothing to sync. All files are up to date.${RESET}`);
  }
  log('');
}

async function install() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  if (args.includes('--version') || args.includes('-v')) {
    log(readVersion());
    return;
  }

  const force = args.includes('--force') || args.includes('-f');
  const target = parseTarget(args);
  const dna = args.find(a => !a.startsWith('-') && a.endsWith('.md'));

  log('');
  log(`${GREEN}🌱 Organic Growth${RESET} — setup for incremental development`);
  log('');

  const prefixes = TARGET_PREFIXES[target];
  const files = getAllFiles(TEMPLATES_DIR).filter(
    f => prefixes.some(p => f.startsWith(p))
  );
  const created = [];
  const skipped = [];

  for (const file of files) {
    const src = join(TEMPLATES_DIR, file);
    const dest = join(TARGET_DIR, file);
    const destDir = dirname(dest);

    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }

    if (existsSync(dest) && !force) {
      const answer = await ask(`${YELLOW}!${RESET} ${file} already exists. Overwrite? [y/N] `);
      if (answer !== 'y' && answer !== 'yes') {
        skipped.push(file);
        continue;
      }
    }

    copyFileSync(src, dest);
    created.push(file);
  }

  // Install shared project context (always, regardless of --target)
  const contextSrc = join(TEMPLATES_DIR, 'docs', 'project-context.md');
  const contextDest = join(TARGET_DIR, 'docs', 'project-context.md');
  if (existsSync(contextSrc)) {
    const docsDir = dirname(contextDest);
    if (!existsSync(docsDir)) {
      mkdirSync(docsDir, { recursive: true });
    }
    if (!existsSync(contextDest) || force) {
      copyFileSync(contextSrc, contextDest);
      created.push('docs/project-context.md');
    } else {
      const answer = await ask(`${YELLOW}!${RESET} docs/project-context.md already exists. Overwrite? [y/N] `);
      if (answer === 'y' || answer === 'yes') {
        copyFileSync(contextSrc, contextDest);
        created.push('docs/project-context.md');
      } else {
        skipped.push('docs/project-context.md');
      }
    }
  }

  // Create docs/growth/ directory
  const growthDir = join(TARGET_DIR, 'docs', 'growth');
  if (!existsSync(growthDir)) {
    mkdirSync(growthDir, { recursive: true });
    created.push('docs/growth/');
  }

  // Handle DNA document
  if (dna) {
    const dnaSource = join(TARGET_DIR, dna);
    if (existsSync(dnaSource)) {
      const dnaDest = join(TARGET_DIR, 'docs', 'product-dna.md');
      copyFileSync(dnaSource, dnaDest);
      success(`Product DNA copied from ${dna}`);
    } else {
      warn(`DNA file not found: ${dna}`);
    }
  }

  log('');
  if (created.length > 0) {
    log(`${GREEN}Installed:${RESET}`);
    for (const f of created) {
      log(`  ${DIM}${f}${RESET}`);
    }
  }
  if (skipped.length > 0) {
    log(`${YELLOW}Skipped (already exist):${RESET}`);
    for (const f of skipped) {
      log(`  ${DIM}${f}${RESET}`);
    }
  }

  log('');
  log(`${GREEN}Done!${RESET} Next steps:`);
  log('');

  const installedClaude = target === 'claude' || target === 'all';
  const installedCopilot = target === 'copilot' || target === 'all';

  info(`Edit ${CYAN}docs/project-context.md${RESET} to fill in your product, tech stack, and priorities`);

  if (installedClaude) {
    if (dna) {
      info(`Run ${CYAN}/seed docs/product-dna.md${RESET} to bootstrap from your DNA document`);
    } else {
      info(`Run ${CYAN}/seed${RESET} in Claude Code to fill project-context.md via interview`);
    }
  }

  if (installedCopilot) {
    info(`Run ${CYAN}npx organic-growth sync${RESET} to push context to copilot config`);
  }

  if (installedClaude) {
    log('');
    log(`${DIM}Claude Code commands available after setup:${RESET}`);
    log(`  ${CYAN}/seed${RESET}    — bootstrap project (interview or DNA document)`);
    log(`  ${CYAN}/grow${RESET}    — plan and start a new feature`);
    log(`  ${CYAN}/next${RESET}    — implement the next growth stage`);
    log(`  ${CYAN}/replan${RESET}  — re-evaluate when things change`);
    log(`  ${CYAN}/review${RESET}  — deep quality review of recent stages`);
  }
  log('');
}

// Route subcommands
const subcommand = process.argv[2];

if (subcommand === 'sync') {
  try {
    sync();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
} else {
  install().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}
