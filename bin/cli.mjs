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
const TEMPLATES_CODEX_DIR = join(__dirname, '..', 'templates-codex');
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

const TARGETS = {
  claude: {
    label: 'Claude Code',
    templatesDir: TEMPLATES_DIR,
    contextFile: 'CLAUDE.md',
    userFiles: ['CLAUDE.md', '.mcp.json'],
  },
  opencode: {
    label: 'opencode',
    templatesDir: TEMPLATES_OPENCODE_DIR,
    contextFile: 'AGENTS.md',
    userFiles: ['AGENTS.md', 'opencode.json'],
  },
  codex: {
    label: 'Codex',
    templatesDir: TEMPLATES_CODEX_DIR,
    contextFile: 'AGENTS.md',
    userFiles: ['AGENTS.md'],
  }
};

function detectInstalledTarget(targetDir) {
  const installedTargets = [];

  if (existsSync(join(targetDir, '.claude'))) installedTargets.push('claude');
  if (existsSync(join(targetDir, '.opencode'))) installedTargets.push('opencode');
  if (existsSync(join(targetDir, '.codex'))) installedTargets.push('codex');

  if (installedTargets.length > 1) {
    console.error(`Error: multiple managed target directories found (${installedTargets.join(', ')}). Re-run with --target, --opencode, or --codex.`);
    process.exit(1);
  }

  return installedTargets[0] || null;
}

function parseTarget(args, targetDir, upgrade) {
  const explicitTargetIndex = args.findIndex(arg => arg === '--target');
  const explicitTarget = explicitTargetIndex >= 0 ? args[explicitTargetIndex + 1] : null;
  const isOpencode = args.includes('--opencode');
  const isCodex = args.includes('--codex');

  if (explicitTargetIndex >= 0 && !explicitTarget) {
    console.error(`Error: missing value for --target. Expected one of: ${Object.keys(TARGETS).join(', ')}.`);
    process.exit(1);
  }

  if (explicitTarget && !TARGETS[explicitTarget]) {
    console.error(`Error: unknown target "${explicitTarget}". Expected one of: ${Object.keys(TARGETS).join(', ')}.`);
    process.exit(1);
  }

  const selected = [explicitTarget, isOpencode ? 'opencode' : null, isCodex ? 'codex' : null].filter(Boolean);
  if (selected.length > 1) {
    console.error('Error: choose only one install target. Use either --target, --opencode, or --codex.');
    process.exit(1);
  }

  if (selected.length === 0 && upgrade) {
    return detectInstalledTarget(targetDir) || 'claude';
  }

  return selected[0] || 'claude';
}

function printHelp() {
  log('');
  log(`${GREEN}🌱 Organic Growth${RESET} — Claude Code, opencode, and Codex setup for incremental development`);
  log('');
  log(`${CYAN}Usage:${RESET}`);
  log(`  npx organic-growth [options] [dna-file.md]`);
  log('');
  log(`${CYAN}Options:${RESET}`);
  log(`  -f, --force     Overwrite existing files without prompting`);
  log(`      --upgrade   Update managed files while preserving user customizations`);
  log(`      --migrate   Move legacy docs/growth and docs/product-dna.md to .organic-growth/`);
  log(`  -h, --help      Show this help message`);
  log(`  -v, --version   Show version number`);
  log(`      --target    Install templates for claude, opencode, or codex`);
  log(`      --opencode  Install opencode templates (AGENTS.md + .opencode/)`);
  log(`      --codex     Install Codex templates (AGENTS.md + .codex/)`);
  log('');
  log(`${CYAN}Arguments:${RESET}`);
  log(`  dna-file.md     Path to a product DNA document to copy into .organic-growth/`);
  log('');
  log(`${CYAN}Examples:${RESET}`);
  log(`  npx organic-growth                  Install Claude Code templates`);
  log(`  npx organic-growth --opencode       Install opencode templates`);
  log(`  npx organic-growth --codex          Install Codex templates`);
  log(`  npx organic-growth --target codex   Install Codex templates`);
  log(`  npx organic-growth --force          Install templates (overwrite existing)`);
  log(`  npx organic-growth --upgrade         Update managed files, keep user customizations`);
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
  const upgrade = args.includes('--upgrade');
  const migrate = args.includes('--migrate');
  const target = parseTarget(args, TARGET_DIR, upgrade);
  const targetConfig = TARGETS[target];
  const dna = args.find(a => !a.startsWith('-') && a.endsWith('.md'));

  // --upgrade and --force are mutually exclusive
  if (upgrade && force) {
    console.error('Error: --upgrade and --force are mutually exclusive. Use --upgrade to update managed files while preserving user customizations, or --force to overwrite everything.');
    process.exit(1);
  }

  // User-customized files that --upgrade should never overwrite or create
  const USER_FILES = new Set(targetConfig.userFiles);

  function isUserFile(filePath) {
    // Check if the file's basename (top-level name) is in the user files set
    return USER_FILES.has(filePath);
  }

  log('');
  if (upgrade) {
    log(`${GREEN}🌱 Organic Growth${RESET} — upgrading managed files`);
  } else {
    log(`${GREEN}🌱 Organic Growth${RESET} — ${targetConfig.label} setup for incremental development`);
  }
  log('');

  if (upgrade) {
    // Read existing version for display
    const versionFilePath = join(TARGET_DIR, '.organic-growth', '.version');
    const fromVersion = existsSync(versionFilePath)
      ? readFileSync(versionFilePath, 'utf8').trim()
      : 'unknown';
    const toVersion = readVersion();

    const templatesDir = targetConfig.templatesDir;
    const files = getAllFiles(templatesDir);
    const updated = [];
    const skippedUser = [];

    for (const file of files) {
      const src = join(templatesDir, file);
      const dest = join(TARGET_DIR, file);
      const destDir = dirname(dest);

      if (isUserFile(file)) {
        // User-customized files: skip if they exist, don't create if missing
        if (existsSync(dest)) {
          skippedUser.push(file);
        }
        // If it doesn't exist, we intentionally do NOT create it (P8)
        continue;
      }

      // Managed file: overwrite (or create if new)
      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }
      copyFileSync(src, dest);
      updated.push(file);
    }

    // Display upgrade results
    info(`Upgrading from ${CYAN}${fromVersion}${RESET} to ${CYAN}${toVersion}${RESET}`);
    log('');

    if (updated.length > 0) {
      log(`${GREEN}Updated:${RESET}`);
      for (const f of updated) {
        log(`  ${DIM}${f}${RESET}`);
      }
    }
    if (skippedUser.length > 0) {
      log(`${YELLOW}Skipped (user customized):${RESET}`);
      for (const f of skippedUser) {
        log(`  ${DIM}${f}${RESET}`);
      }
    }

    // Write version file after all managed files are updated
    const ogDir = join(TARGET_DIR, '.organic-growth');
    if (!existsSync(ogDir)) {
      mkdirSync(ogDir, { recursive: true });
    }
    writeFileSync(join(ogDir, '.version'), toVersion);

    log('');
    log(`${GREEN}Done!${RESET} ${updated.length} updated, ${skippedUser.length} skipped.`);
    log('');
  } else {
    // Normal install flow
    const templatesDir = targetConfig.templatesDir;
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

    // Write version file after all templates and DNA are handled
    const versionFilePath = join(TARGET_DIR, '.organic-growth', '.version');
    const ogDir = dirname(versionFilePath);
    if (!existsSync(ogDir)) {
      mkdirSync(ogDir, { recursive: true });
    }
    writeFileSync(versionFilePath, readVersion());

    log('');
    log(`${GREEN}Done!${RESET} Next steps:`);
    log('');
    if (dna) {
      info(`Run ${CYAN}/seed .organic-growth/product-dna.md${RESET} to bootstrap from your DNA document`);
    } else {
      info(`Run ${CYAN}/seed${RESET} to bootstrap a new project (interview mode)`);
      info(`Or: ${CYAN}/seed path/to/product-doc.md${RESET} if you have a product document`);
    }
    info(`Edit ${CYAN}${targetConfig.contextFile}${RESET} to fill in your tech stack and quality tools`);
    if (target === 'codex') {
      info(`Launch Codex with ${CYAN}CODEX_HOME=.codex codex${RESET} so the installed prompts are used for this repo`);
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
    const upgradeHint = target === 'claude'
      ? 'npx organic-growth --upgrade'
      : `npx organic-growth --upgrade --${target}`;
    log(`${DIM}To upgrade later: ${upgradeHint}${RESET}`);
    log('');
  }
}

install().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
