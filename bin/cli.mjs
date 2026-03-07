#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  copyFileSync,
  readFileSync,
  readdirSync,
  statSync,
  renameSync,
  writeFileSync
} from 'fs';
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

function migrateLegacyState(targetDir) {
  const actions = [];
  const ogRoot = join(targetDir, '.organic-growth');
  const legacyDocsDir = join(targetDir, 'docs');
  const legacyGrowthDir = join(legacyDocsDir, 'growth');
  const legacyDna = join(legacyDocsDir, 'product-dna.md');
  const newGrowthDir = join(ogRoot, 'growth');
  const newDna = join(ogRoot, 'product-dna.md');

  if (!existsSync(ogRoot)) {
    mkdirSync(ogRoot, { recursive: true });
  }

  if (existsSync(legacyGrowthDir)) {
    if (!existsSync(newGrowthDir)) {
      renameSync(legacyGrowthDir, newGrowthDir);
      actions.push('moved docs/growth/ -> .organic-growth/growth/');
    } else {
      const legacyFiles = getAllFiles(legacyGrowthDir);
      let copiedAny = false;
      for (const rel of legacyFiles) {
        const src = join(legacyGrowthDir, rel);
        const dest = join(newGrowthDir, rel);
        const destDir = dirname(dest);
        if (!existsSync(destDir)) {
          mkdirSync(destDir, { recursive: true });
        }
        if (!existsSync(dest)) {
          copyFileSync(src, dest);
          copiedAny = true;
        }
      }
      if (copiedAny) {
        actions.push('merged files from docs/growth/ into .organic-growth/growth/');
      }
    }
  }

  if (existsSync(legacyDna) && !existsSync(newDna)) {
    copyFileSync(legacyDna, newDna);
    actions.push('copied docs/product-dna.md -> .organic-growth/product-dna.md');
  }

  const contextFiles = ['CLAUDE.md', 'AGENTS.md'];
  for (const file of contextFiles) {
    const fullPath = join(targetDir, file);
    if (!existsSync(fullPath)) continue;
    const before = readFileSync(fullPath, 'utf8');
    const after = before
      .replaceAll('docs/growth/', '.organic-growth/growth/')
      .replaceAll('docs/product-dna.md', '.organic-growth/product-dna.md')
      .replaceAll('docs/growth-map.md', '.organic-growth/growth-map.md');
    if (after !== before) {
      writeFileSync(fullPath, after);
      actions.push(`updated paths in ${file}`);
    }
  }

  return actions;
}

function readVersion() {
  const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
  return pkg.version;
}

function printHelp() {
  log('');
  log(`${GREEN}🌱 Organic Growth${RESET} — Claude Code + opencode setup for incremental development`);
  log('');
  log(`${CYAN}Usage:${RESET}`);
  log(`  npx organic-growth [options] [dna-file.md]`);
  log('');
  log(`${CYAN}Options:${RESET}`);
  log(`  -f, --force     Overwrite existing files without prompting`);
  log(`      --migrate   Move legacy docs/growth and docs/product-dna.md to .organic-growth/`);
  log(`  -h, --help      Show this help message`);
  log(`  -v, --version   Show version number`);
  log(`      --opencode  Install opencode templates (AGENTS.md + .opencode/)`);
  log('');
  log(`${CYAN}Arguments:${RESET}`);
  log(`  dna-file.md     Path to a product DNA document to copy into .organic-growth/`);
  log('');
  log(`${CYAN}Examples:${RESET}`);
  log(`  npx organic-growth                  Install Claude Code templates`);
  log(`  npx organic-growth --opencode       Install opencode templates`);
  log(`  npx organic-growth --force          Install templates (overwrite existing)`);
  log(`  npx organic-growth --migrate        Migrate legacy docs/ state into .organic-growth/`);
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
  const migrate = args.includes('--migrate');
  const isOpencode = args.includes('--opencode');
  const dna = args.find(a => !a.startsWith('-') && a.endsWith('.md'));

  log('');
  if (isOpencode) {
    log(`${GREEN}🌱 Organic Growth${RESET} — opencode setup for incremental development`);
  } else {
    log(`${GREEN}🌱 Organic Growth${RESET} — Claude Code setup for incremental development`);
  }
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

  // Create .organic-growth/growth/ directory
  const growthDir = join(TARGET_DIR, '.organic-growth', 'growth');
  if (!existsSync(growthDir)) {
    mkdirSync(growthDir, { recursive: true });
    created.push('.organic-growth/growth/');
  }

  // Handle DNA document
  if (dna) {
    const dnaSource = resolve(TARGET_DIR, dna);
    if (existsSync(dnaSource)) {
      const dnaDest = join(TARGET_DIR, '.organic-growth', 'product-dna.md');
      mkdirSync(dirname(dnaDest), { recursive: true });
      copyFileSync(dnaSource, dnaDest);
      success(`Product DNA copied from ${dna}`);
    } else {
      warn(`DNA file not found: ${dna}`);
    }
  }

  if (migrate) {
    const migrated = migrateLegacyState(TARGET_DIR);
    if (migrated.length > 0) {
      log('');
      log(`${GREEN}Migrated:${RESET}`);
      for (const step of migrated) {
        log(`  ${DIM}${step}${RESET}`);
      }
    } else {
      info('No legacy docs/ state found to migrate');
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
  if (isOpencode) {
    if (dna) {
      info(`Run ${CYAN}/seed .organic-growth/product-dna.md${RESET} to bootstrap from your DNA document`);
    } else {
      info(`Run ${CYAN}/seed${RESET} to bootstrap a new project (interview mode)`);
      info(`Or: ${CYAN}/seed path/to/product-doc.md${RESET} if you have a product document`);
    }
    info(`Edit ${CYAN}AGENTS.md${RESET} to fill in your tech stack and quality tools`);
  } else {
    if (dna) {
      info(`Run ${CYAN}/seed .organic-growth/product-dna.md${RESET} to bootstrap from your DNA document`);
    } else {
      info(`Run ${CYAN}/seed${RESET} to bootstrap a new project (interview mode)`);
      info(`Or: ${CYAN}/seed path/to/product-doc.md${RESET} if you have a product document`);
    }
    info(`Edit ${CYAN}CLAUDE.md${RESET} to fill in your tech stack and quality tools`);
  }
  log('');
  log(`${DIM}Commands available after setup:${RESET}`);
  log(`  ${CYAN}/seed${RESET}    — bootstrap project (interview or DNA document)`);
  log(`  ${CYAN}/grow${RESET}    — plan and start a new feature`);
  log(`  ${CYAN}/map${RESET}     — view or adjust the system growth map`);
  log(`  ${CYAN}/next${RESET}    — implement the next growth stage`);
  log(`  ${CYAN}/next-automatic${RESET} — run multiple stages automatically`);
  log(`  ${CYAN}/replan${RESET}  — re-evaluate when things change`);
  log(`  ${CYAN}/review${RESET}  — deep quality review of recent stages`);

  log('');
}

install().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
