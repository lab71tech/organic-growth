/**
 * Organic Growth — opencode plugin
 *
 * Post-stage quality automation for the Organic Growth methodology.
 * Hooks into tool.execute.after to detect stage commits and:
 *   1. Run the project test suite (discovered from AGENTS.md **Test:** field)
 *   2. Gather a git diff for self-review context
 *   3. Check that the commit message follows the stage format convention
 *
 * Loaded automatically from .opencode/plugins/ by opencode.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export default function organicGrowth({ $, directory }) {
  return {
    'tool.execute.after': async (input) => {
      // Guard: only proceed for bash tool invocations
      // opencode passes tool name in input.tool or input.name (normalise to lowercase)
      const toolName = String(input?.tool ?? input?.name ?? '').toLowerCase();
      if (toolName !== 'bash') return;

      // Guard: only proceed if the command was a git commit
      const command = String(
        input?.input?.command ?? input?.params?.command ?? input?.command ?? ''
      );
      if (!command.includes('git commit')) return;

      // Guard: only proceed if the last commit is a stage commit
      let commitMsg = '';
      try {
        const r = await $`git -C ${directory} log -1 --pretty=%B`;
        commitMsg = r.stdout ?? '';
      } catch {
        return;
      }
      if (!/stage\s+\d+/i.test(commitMsg)) return;

      let subject = '';
      try {
        const r = await $`git -C ${directory} log -1 --pretty=%s`;
        subject = (r.stdout ?? '').trim();
      } catch {
        subject = 'unknown stage';
      }

      // 1. Post-stage test runner
      const testCmd = discoverTestCommand(directory);
      if (testCmd) {
        await runTests($, directory, testCmd, subject);
      }

      // 2. Post-stage review context
      await gatherReviewContext($, directory, subject);

      // 3. Commit format check (advisory)
      checkCommitFormat(subject);
    },
  };
}

/**
 * Read the test command from the **Test:** field in AGENTS.md.
 * Returns null if the field is absent or still contains a placeholder.
 */
function discoverTestCommand(directory) {
  const agentsMd = join(directory, 'AGENTS.md');
  if (!existsSync(agentsMd)) return null;

  const content = readFileSync(agentsMd, 'utf8');
  const match = content.match(/\*\*Test:\*\*[^`]*`([^`]+)`/);
  if (!match) return null;

  const cmd = match[1].trim();
  // Ignore placeholder values like [e.g.: ./gradlew test]
  if (cmd.startsWith('[')) return null;
  return cmd;
}

/**
 * Run the discovered test command and report pass/fail.
 */
async function runTests($, directory, testCmd, subject) {
  console.error('🧪 Running quality gate tests...');
  let output = '';
  try {
    const r = await $`sh -c ${testCmd}`.cwd(directory);
    output = (r.stdout ?? '') + (r.stderr ?? '');
  } catch (err) {
    output = (err.stdout ?? '') + (err.stderr ?? '');
  }

  // Cap to last 100 lines to avoid overwhelming context
  const capped = output.split('\n').slice(-100).join('\n');
  const failed = /# fail [1-9]|failing|not ok\b|FAIL\b|FAILED\b/.test(capped);

  if (failed) {
    console.error(`❌ Tests failed after: ${subject}`);
    console.error(
      `TESTS FAILED after stage commit: ${subject}\n\n` +
      `Fix these failures before continuing to the next stage.\n` +
      `The quality gate requires ALL tests to pass after every stage.\n\n` +
      `Test output (last 100 lines):\n${capped}`
    );
  } else {
    console.error(`✅ All tests passed after: ${subject}`);
  }
}

/**
 * Gather the git diff for the stage commit and emit review context.
 */
async function gatherReviewContext($, directory, subject) {
  console.error('🔍 Gathering review context...');
  let stat = '';
  let diff = '';
  try {
    stat = ((await $`git -C ${directory} diff HEAD~1 --stat`).stdout ?? '');
    const raw = ((await $`git -C ${directory} diff HEAD~1`).stdout ?? '');
    // Cap diff to first 300 lines
    diff = raw.split('\n').slice(0, 300).join('\n');
  } catch {
    return;
  }

  console.error(`📋 Review context ready for: ${subject}`);
  console.error(
    `Stage commit detected: ${subject}\n\n` +
    `Changes:\n${stat}\n` +
    `Please review this stage:\n` +
    `1. Does the code match the stage intent from the growth plan?\n` +
    `2. Are all stage properties properly tested?\n` +
    `3. Are properties from previous stages preserved?\n` +
    `4. Any over-engineering, security concerns, or missed edge cases?\n\n` +
    `Diff (first 300 lines):\n${diff}`
  );
}

/**
 * Check that the commit message follows the organic growth convention:
 *   feat(scope): stage N — <description>
 * Advisory only — the commit has already been made.
 */
function checkCommitFormat(subject) {
  if (/^feat\([^)]+\): stage \d+ — .+/.test(subject)) return;

  console.error(
    `⚠️  Commit format suggestion: the stage commit does not follow the expected convention.\n` +
    `  Actual:   ${subject}\n` +
    `  Expected: feat(scope): stage N — <what grew>\n` +
    `  (advisory only — the commit has already been made)`
  );
}
