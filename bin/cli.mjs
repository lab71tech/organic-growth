#!/usr/bin/env node

import { existsSync, mkdirSync, copyFileSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMPLATES_DIR = join(__dirname, '..', 'templates');
const TEMPLATES_OPENCODE_DIR = join(__dirname, '..', 'templates-opencode');
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
  log(`${GREEN}🌱 Organic Growth${RESET} — Claude Code setup for incremental development`);
  log('');
  log(`${CYAN}Usage:${RESET}`);
  log(`  npx organic-growth [options] [dna-file.md]`);
  log('');
  log(`${CYAN}Options:${RESET}`);
  log(`  -f, --force     Overwrite existing files without prompting`);
  log(`  -h, --help      Show this help message`);
  log(`  -v, --version   Show version number`);
  log('');
  log(`${CYAN}Arguments:${RESET}`);
  log(`  dna-file.md     Path to a product DNA document to copy into docs/`);
  log('');
  log(`${CYAN}Examples:${RESET}`);
  log(`  npx organic-growth                  Install templates (prompts on conflicts)`);
  log(`  npx organic-growth --force          Install templates (overwrite existing)`);
  log(`  npx organic-growth spec.md          Install templates + copy DNA document`);
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
  const isOpencode = args.includes('--opencode');
  const dna = args.find(a => !a.startsWith('-') && a.endsWith('.md'));

  log('');
  log(`${GREEN}🌱 Organic Growth${RESET} — Claude Code setup for incremental development`);
  log('');

  const templatesDir = isOpencode ? TEMPLATES_OPENCODE_DIR : TEMPLATES_DIR;
  const files = getAllFiles(templatesDir);
  const created = [];
  const skipped = [];

  for (const file of files) {
    const src = join(templatesDir, file);
    const dest = join(TARGET_DIR, file);
    const destDir = dirname(dest);

    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }

    if (existsSync(dest) && !force) {
      if (!process.stdin.isTTY) {
        skipped.push(file);
        continue;
      }
      const answer = await ask(`${YELLOW}!${RESET} ${file} already exists. Overwrite? [y/N] `);
      if (answer !== 'y' && answer !== 'yes') {
        skipped.push(file);
        continue;
      }
    }

    copyFileSync(src, dest);
    created.push(file);
  }

  // Create docs/growth/ directory
  const growthDir = join(TARGET_DIR, 'docs', 'growth');
  if (!existsSync(growthDir)) {
    mkdirSync(growthDir, { recursive: true });
    created.push('docs/growth/');
  }

  // Handle DNA document
  if (dna) {
    const dnaSource = resolve(TARGET_DIR, dna);
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
  if (dna) {
    info(`Run ${CYAN}/seed docs/product-dna.md${RESET} to bootstrap from your DNA document`);
  } else {
    info(`Run ${CYAN}/seed${RESET} to bootstrap a new project (interview mode)`);
    info(`Or: ${CYAN}/seed path/to/product-doc.md${RESET} if you have a product document`);
  }
  info(`Edit ${CYAN}CLAUDE.md${RESET} to fill in your tech stack and quality tools`);
  log('');
  log(`${DIM}Commands available after setup:${RESET}`);
  log(`  ${CYAN}/seed${RESET}    — bootstrap project (interview or DNA document)`);
  log(`  ${CYAN}/grow${RESET}    — plan and start a new feature`);
  log(`  ${CYAN}/next${RESET}    — implement the next growth stage`);
  log(`  ${CYAN}/replan${RESET}  — re-evaluate when things change`);
  log(`  ${CYAN}/review${RESET}  — deep quality review of recent stages`);

  // Detect superpowers plugin
  const homedir = process.env.HOME || process.env.USERPROFILE || '';
  const pluginsDir = join(homedir, '.claude', 'plugins');
  let hasSuperpowers = false;
  if (existsSync(pluginsDir)) {
    try {
      const entries = readdirSync(pluginsDir, { recursive: true });
      hasSuperpowers = entries.some(e => String(e).includes('superpowers'));
    } catch { /* ignore */ }
  }

  if (hasSuperpowers) {
    success(`Superpowers plugin detected — TDD, debugging, and brainstorming skills are integrated into commands and gardener`);
  } else {
    info(`Tip: Install the superpowers plugin for integrated TDD, debugging, and brainstorming process skills`);
  }

  log('');
}

install().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
