#!/usr/bin/env zx

import { Octokit } from '@octokit/rest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ora from 'ora';

$.verbose = false;

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
cd(ROOT);

// ---------------------------------------------------------------------------
// Argument validation
// ---------------------------------------------------------------------------

const version = argv._[0];
if (!version || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error('Usage: pnpm release <version>   (e.g. pnpm release 1.0.5)');
  process.exit(1);
}

const tag = `v${version}`;

// ---------------------------------------------------------------------------
// Rollback state
//   commitLocal           — release commit exists locally but has not been pushed
//   commitPushed          — release commit has been pushed to origin/main
//   tagPushed             — tag has been pushed and should be deleted on failure
//   releaseWorkflowDone   — GitHub release workflow succeeded for the tag
//   npmPublishDone        — npm publish succeeded; release is fully complete
// ---------------------------------------------------------------------------

let commitLocal = false;
let commitPushed = false;
let tagPushed = false;
let releaseWorkflowDone = false;
let npmPublishDone = false;
let gitCmd = 'git';
let tempNpmConfigDir = '';

/**
 * @param {string[]} args
 * @param {import('node:child_process').SpawnSyncOptions & { cwd?: string, encoding?: BufferEncoding }} [options]
 */
function runGit(args, options = {}) {
  const result = spawnSync(gitCmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: false,
    ...options,
  });

  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    const stdout = (result.stdout || '').trim();
    const details = stderr || stdout || `git ${args.join(' ')} failed with exit code ${result.status}`;
    throw new Error(details);
  }

  return result;
}

/**
 * Run a subprocess attached to the caller's terminal so interactive auth flows
 * like npm OTP or browser-based login handoffs can complete successfully.
 *
 * @param {string} command
 * @param {string[]} args
 * @param {import('node:child_process').SpawnSyncOptions} [options]
 */
function runInteractive(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: false,
    env: process.env,
    ...options,
  });

  if (result.error) {
    throw new Error(`${command} ${args.join(' ')} failed to spawn: ${result.error.message}`);
  }

  if (result.signal) {
    throw new Error(`${command} ${args.join(' ')} was terminated by signal ${result.signal}`);
  }

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
  }
}

function cleanupTempNpmConfig() {
  if (!tempNpmConfigDir) {
    return;
  }

  rmSync(tempNpmConfigDir, { recursive: true, force: true });
  tempNpmConfigDir = '';
}

process.on('exit', () => {
  try {
    cleanupTempNpmConfig();
  } catch {
    // Best-effort cleanup; ignore errors on process exit.
  }
});

/**
 * @param {string} registry
 */
function configureNpmAuth(registry) {
  const defaultUserConfig = resolve(homedir(), '.npmrc');
  const configuredUserConfig = process.env.NPM_CONFIG_USERCONFIG || defaultUserConfig;
  process.env.NPM_CONFIG_USERCONFIG = configuredUserConfig;

  const npmToken = process.env.NPM_TOKEN?.trim();
  if (!npmToken) {
    return;
  }

  let existingConfig = '';
  try {
    existingConfig = readFileSync(configuredUserConfig, 'utf8');
  } catch {
    existingConfig = '';
  }

  process.env.NODE_AUTH_TOKEN ||= npmToken;

  const normalizedRegistry = registry.replace(/\/+$/, '/');
  const registryKey = normalizedRegistry.replace(/^https?:/, '');

  if (existingConfig.includes(`${registryKey}:_authToken=`)) {
    return;
  }

  const authLine = `${registryKey}:_authToken=${npmToken}`;
  tempNpmConfigDir = mkdtempSync(resolve(tmpdir(), 'mcp-server-template-release-'));

  const tempUserConfig = resolve(tempNpmConfigDir, '.npmrc');
  const prefix = existingConfig.trimEnd();
  writeFileSync(tempUserConfig, `${prefix}${prefix ? '\n' : ''}${authLine}\nalways-auth=true\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  process.env.NPM_CONFIG_USERCONFIG = tempUserConfig;
}

function resolveGitExecutable() {
  const direct = spawnSync('git', ['--version'], { stdio: 'ignore', shell: false });
  if (direct.status === 0) {
    return 'git';
  }

  const locatorCommand = process.platform === 'win32' ? 'where' : 'which';
  const located = spawnSync(locatorCommand, ['git'], { encoding: 'utf8', shell: false });
  if (located.status === 0) {
    const candidate = located.stdout
      .split(/\r?\n/)
      .map(line => line.trim())
      .find(Boolean);
    if (candidate) {
      return candidate;
    }
  }

  return null;
}

async function rollback() {
  if (npmPublishDone) {
    cleanupTempNpmConfig();
    return;
  }
  $.verbose = false;
  try {
    if (tagPushed) {
      console.log(`\n⚠️  Release failed after tagging. Deleting tag ${tag} from origin and local repo...`);
      let remoteDeleted = false;
      let localDeleted = false;

      try {
        runGit(['push', 'origin', '--delete', tag]);
        remoteDeleted = true;
      } catch {
        console.error(`❌ Could not delete remote tag ${tag}. Manually run:`);
        console.error(`   git push origin --delete ${tag}`);
      }

      try {
        runGit(['tag', '-d', tag]);
        localDeleted = true;
      } catch {
        console.error(`❌ Could not delete local tag ${tag}. Manually run:`);
        console.error(`   git tag -d ${tag}`);
      }

      if (remoteDeleted || localDeleted) {
        console.log(
          `↩️  Tag ${tag} rollback complete${releaseWorkflowDone ? ' (GitHub release metadata may still need manual follow-up).' : '.'}`,
        );
      }
    }
    if (commitPushed) {
      console.log('\n⚠️  Reverting release commit on origin/main...');
      try {
        runGit(['revert', '--no-edit', 'HEAD']);
        runGit(['push', 'origin', 'main']);
        console.log('↩️  Release commit reverted and pushed. Working tree is clean.');
      } catch {
        console.error('❌ Automatic revert failed. Manually run:');
        console.error('   git revert HEAD && git push origin main');
      }
    } else if (commitLocal) {
      console.log('\n⚠️  Release aborted before push. Resetting local release commit...');
      try {
        runGit(['reset', '--hard', 'HEAD~1']);
        console.log('↩️  Local release commit removed. Working tree restored.');
      } catch {
        console.error('❌ Reset failed. Manually run: git reset --hard HEAD~1');
      }
    }
  } catch {
    /* best effort */
  } finally {
    cleanupTempNpmConfig();
  }
}

process.on('SIGINT', async () => {
  await rollback();
  process.exit(130);
});
process.on('SIGTERM', async () => {
  await rollback();
  process.exit(143);
});

// ---------------------------------------------------------------------------
// Main — wrapped so any unhandled error triggers rollback
// ---------------------------------------------------------------------------

async function main() {
  // --- Prerequisites -------------------------------------------------------

  const resolvedGit = resolveGitExecutable();
  if (!resolvedGit) {
    console.error("❌ 'git' is required but not found in PATH.");
    process.exit(1);
  }
  gitCmd = resolvedGit;

  // Ensure npm uses the user's ~/.npmrc (tokens) and the public npm registry.
  const NPM_REGISTRY = process.env.NPM_CONFIG_REGISTRY || 'https://registry.npmjs.org/';
  configureNpmAuth(NPM_REGISTRY);

  // Check npm credentials against the intended registry (non-interactive).
  try {
    await $`npm whoami --registry=${NPM_REGISTRY}`;
  } catch {
    console.error(`❌ Not logged in to npm (registry: ${NPM_REGISTRY}).`);
    console.error('   Tips:');
    console.error(`   - Ensure your token is in ${process.env.NPM_CONFIG_USERCONFIG}`);
    console.error('   - File should contain a line like: //registry.npmjs.org/:_authToken=<YOUR_TOKEN>');
    console.error('   - Or export NPM_TOKEN in your environment before running the release script');
    console.error('   - To log in interactively: npm login --registry=https://registry.npmjs.org/');
    process.exit(1);
  }

  // Resolve GitHub auth token: prefer env vars, then ask the gh CLI.
  let githubToken = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN ?? '';
  if (!githubToken) {
    try {
      githubToken = (await $`gh auth token`).stdout.trim();
    } catch {
      console.error('❌ No GitHub token found. Set GH_TOKEN/GITHUB_TOKEN or run: gh auth login');
      process.exit(1);
    }
  }

  const octokit = new Octokit({ auth: githubToken });

  // --- Precondition checks --------------------------------------------------

  const dirty = runGit(['status', '--porcelain']).stdout.trim();
  if (dirty) {
    console.error('❌ Working tree is not clean. Commit or stash changes first.');
    process.exit(1);
  }

  const branch = runGit(['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim();
  if (branch !== 'main') {
    console.error(`❌ Must run from 'main'. Current branch: ${branch}`);
    process.exit(1);
  }

  console.log('🔄 Fetching latest refs...');
  runGit(['fetch', 'origin', 'main']);
  runGit(['pull', '--ff-only', 'origin', 'main']);

  // Derive owner/repo from the git remote URL.
  const remoteUrl = runGit(['remote', 'get-url', 'origin']).stdout.trim();
  const repoMatch = remoteUrl.match(/[:/]([^/]+)\/([^/.]+?)(\.git)?$/);
  if (!repoMatch) {
    console.error(`❌ Cannot parse owner/repo from remote URL: ${remoteUrl}`);
    process.exit(1);
  }
  const [, owner, repo] = repoMatch;

  // Check for existing local tag.
  const localTag = runGit(['tag', '-l', tag]).stdout.trim();
  if (localTag) {
    console.error(`❌ Local tag ${tag} already exists.`);
    process.exit(1);
  }

  // Check for existing remote tag via the API.
  try {
    await octokit.git.getRef({ owner, repo, ref: `tags/${tag}` });
    console.error(`❌ Remote tag ${tag} already exists.`);
    process.exit(1);
  } catch (err) {
    if (err.status !== 404) {
      throw err;
    }
    // 404 = tag does not exist; that's what we want.
  }

  // --- Previous tag (for release notes diff) --------------------------------

  const tagsResp = await octokit.paginate(octokit.git.listMatchingRefs, {
    owner,
    repo,
    ref: 'tags/v',
    per_page: 100,
  });

  const previousTag =
    tagsResp
      .map(r => r.ref.replace('refs/tags/', ''))
      .filter(t => t !== tag)
      .sort((a, b) => {
        const parse = v => v.replace(/^v/, '').split('.').map(Number);
        const [aMaj, aMin, aPatch] = parse(a);
        const [bMaj, bMin, bPatch] = parse(b);
        return aMaj - bMaj || aMin - bMin || aPatch - bPatch;
      })
      .at(-1) ?? '';

  // --- Release notes --------------------------------------------------------

  console.log(`📝 Generating release notes for ${tag}...`);

  const notesResp = await octokit.repos.generateReleaseNotes({
    owner,
    repo,
    tag_name: tag,
    target_commitish: 'main',
    ...(previousTag ? { previous_tag_name: previousTag } : {}),
  });
  const releaseNotes = notesResp.data.body?.trim() || '- No notable changes.';

  // --- Update package.json --------------------------------------------------

  console.log(`🧩 Updating package.json to ${version}...`);
  const pkgPath = resolve(ROOT, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  pkg.version = version;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  // --- Update CHANGELOG.md --------------------------------------------------

  console.log('🧩 Updating CHANGELOG.md...');
  const changelogPath = resolve(ROOT, 'CHANGELOG.md');
  const date = new Date().toISOString().slice(0, 10);
  const heading = `## [${version}] - ${date}`;
  const sourceLine = previousTag ? `\n\n_Source: changes from ${previousTag} to ${tag}._` : '';
  const section = `\n${heading}\n\n${releaseNotes}${sourceLine}\n`;

  let original;
  try {
    original = readFileSync(changelogPath, 'utf8');
  } catch {
    original = '# Change Log\n\n## [Unreleased]\n';
  }

  if (!original.includes(heading)) {
    const marker = '## [Unreleased]';
    const idx = original.indexOf(marker);
    const updated =
      idx >= 0
        ? `${original.slice(0, idx + marker.length)}\n${section}${original.slice(idx + marker.length)}`
        : `${original}\n${section}`;
    writeFileSync(changelogPath, updated);
  } else {
    console.log('ℹ️  CHANGELOG already contains this release heading; skipping.');
  }

  // --- Commit + push --------------------------------------------------------

  const hasChanges = runGit(['diff', '--name-only', '--', 'package.json', 'CHANGELOG.md']).stdout.trim();
  if (hasChanges) {
    console.log('📦 Committing release metadata changes...');
    runGit(['add', 'package.json', 'CHANGELOG.md']);
    runGit(['commit', '-m', `chore(release): update version and changelog for ${tag}`]);
    commitLocal = true;
  } else {
    console.log('ℹ️  No version/changelog changes detected; nothing to commit.');
  }

  console.log('🚀 Pushing main...');
  runGit(['push', 'origin', 'main']);
  commitPushed = true;
  commitLocal = false;

  const headSha = runGit(['rev-parse', 'HEAD']).stdout.trim();

  // --- Wait for CI workflow -------------------------------------------------

  const shortSha = headSha.slice(0, 7);
  console.log(`🔎 Waiting for CI on ${shortSha}...`);
  // Give GitHub a moment to register the push before we start polling.
  await sleep(10_000);

  const spinner = ora({ text: 'CI: queued' }).start();
  await waitForWorkflow(octokit, 'CI', owner, repo, headSha, spinner);

  // --- Tag + publish --------------------------------------------------------

  console.log(`🏷️  Creating annotated tag ${tag} at ${headSha}...`);

  const tagMessage = [
    `Release ${tag}`,
    releaseNotes,
    previousTag ? `Source: changes from ${previousTag} to ${tag}.` : '',
    `Target commit: ${headSha}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  runGit(['tag', '-a', tag, headSha, '-m', tagMessage]);

  console.log(`🚀 Pushing tag ${tag}...`);
  runGit(['push', 'origin', tag]);
  tagPushed = true;

  // --- Watch the Release workflow ------------------------------------------

  spinner.text = 'Release: waiting for workflow to trigger...';
  spinner.start();
  await waitForWorkflow(octokit, 'Release', owner, repo, headSha, spinner, {
    autoDispatch: false,
    branch: null,
  });

  releaseWorkflowDone = true;
  console.log(`✅ GitHub release complete: ${tag} → ${headSha}`);

  // --- npm publish ----------------------------------------------------------

  console.log('📦 Building package...');
  $.verbose = true;
  await $`pnpm build`;
  $.verbose = false;

  const distTag = version.includes('-') ? 'next' : 'latest';
  console.log(`🚀 Publishing ${tag} to npm (dist-tag: ${distTag})...`);
  // For scoped public packages, --access public is required on first publish; harmless on subsequent publishes.
  const accessFlag = (JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8')).name || '').startsWith('@')
    ? ['--access', 'public']
    : [];
  runInteractive('npm', ['publish', './dist', '--tag', distTag, '--registry', NPM_REGISTRY, ...accessFlag]);
  npmPublishDone = true;
  cleanupTempNpmConfig();
  console.log(`✅ Published ${tag} to npm.`);
}

// ---------------------------------------------------------------------------
// Workflow polling
// ---------------------------------------------------------------------------

async function waitForWorkflow(
  octokit,
  name,
  owner,
  repo,
  headSha,
  spinner,
  { timeoutMs = 3_600_000, pollMs = 15_000, autoDispatch = true, branch = 'main' } = {},
) {
  // Resolve the workflow ID by name.
  const workflowsResp = await octokit.actions.listRepoWorkflows({ owner, repo, per_page: 100 });
  const workflow = workflowsResp.data.workflows.find(w => w.name === name);
  if (!workflow) {
    spinner.fail(`${name}: workflow not found in ${owner}/${repo}`);
    throw new Error(`[${name}] workflow not found in ${owner}/${repo}`);
  }

  const deadline = Date.now() + timeoutMs;
  let triggered = false;
  // Track cancelled run IDs so we skip them on subsequent polls.
  const cancelledRunIds = new Set();

  while (Date.now() < deadline) {
    const runsResp = await octokit.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: workflow.id,
      ...(branch ? { branch } : {}),
      head_sha: headSha,
      per_page: 10,
    });

    const run = runsResp.data.workflow_runs.find(r => !cancelledRunIds.has(r.id));

    if (!run) {
      if (autoDispatch && !triggered) {
        spinner.text = `${name}: no run found — triggering workflow_dispatch...`;
        await octokit.actions.createWorkflowDispatch({ owner, repo, workflow_id: workflow.id, ref: 'main' });
        triggered = true;
        spinner.text = `${name}: waiting for run to appear...`;
      } else {
        spinner.text = `${name}: waiting for run to appear...`;
      }
    } else if (run.status !== 'completed') {
      const elapsed = Math.round((Date.now() - new Date(run.created_at).getTime()) / 1000);
      spinner.text = `${name}: ${run.status} (${elapsed}s elapsed)`;
    } else if (run.conclusion === 'success') {
      spinner.succeed(`${name}: passed`);
      return;
    } else if (run.conclusion === 'cancelled') {
      cancelledRunIds.add(run.id);
      spinner.text = `${name}: run was cancelled — re-dispatching...`;
      triggered = false;
    } else {
      spinner.fail(`${name}: ${run.conclusion}`);
      throw new Error(`[${name}] conclusion=${run.conclusion}\n   Run: ${run.html_url}`);
    }

    await sleep(pollMs);
  }

  spinner.fail(`${name}: timed out`);
  throw new Error(`[${name}] timed out after ${timeoutMs / 1000}s`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

main().catch(async err => {
  const msg = err?.message ?? String(err);
  if (!(err instanceof ProcessOutput)) {
    console.error(`❌ ${msg}`);
  }
  await rollback();
  process.exit(err?.exitCode ?? 1);
});
