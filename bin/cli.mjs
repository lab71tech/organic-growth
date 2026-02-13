#!/usr/bin/env node

import { existsSync, mkdirSync, copyFileSync, readFileSync, readdirSync, statSync } from 'fs';
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
  log(`  npx organic-growth [options] [dna-file.md]`);
  log('');
  log(`${CYAN}Options:${RESET}`);
  log(`  -f, --force              Overwrite existing files without prompting`);
  log(`  --target <claude|copilot|all>  Which AI tool config to install (default: all)`);
  log(`  -h, --help               Show this help message`);
  log(`  -v, --version            Show version number`);
  log('');
  log(`${CYAN}Arguments:${RESET}`);
  log(`  dna-file.md     Path to a product DNA document to copy into docs/`);
  log('');
  log(`${CYAN}Examples:${RESET}`);
  log(`  npx organic-growth                        Install all templates (prompts on conflicts)`);
  log(`  npx organic-growth --target claude         Install only Claude Code config`);
  log(`  npx organic-growth --target copilot        Install only GitHub Copilot config`);
  log(`  npx organic-growth --force spec.md         Install all + copy DNA document`);
  log('');
}

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

  if (installedClaude) {
    if (dna) {
      info(`Run ${CYAN}/seed docs/product-dna.md${RESET} to bootstrap from your DNA document`);
    } else {
      info(`Run ${CYAN}/seed${RESET} to bootstrap a new project (interview mode)`);
    }
    info(`Edit ${CYAN}.claude/CLAUDE.md${RESET} to fill in your project context`);
  }
  if (installedCopilot) {
    info(`Edit ${CYAN}.github/copilot-instructions.md${RESET} to fill in your project context`);
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

install().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
