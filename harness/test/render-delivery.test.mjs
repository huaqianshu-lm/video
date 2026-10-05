import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {main} from '../src/cli.mjs';
import {publishRenderInput, renderMethodEnvironment, runRenderDelivery} from '../src/render-delivery.mjs';
import {renderRequiredPaths} from '../src/git-delivery.mjs';
import {bindRenderInputDelivery} from '../src/render-input.mjs';
import {initializeProject, loadProject, writeJson} from '../src/storage.mjs';
import {createRemoteJobMonitor} from '../src/remote-jobs.mjs';
import {createGitHubActionsAdapter} from '../src/adapters.mjs';
import {listJobs, updateJob} from '../src/jobs.mjs';
import {validateProjectStage} from '../src/validation.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-render-delivery-'));
  const workspace = path.join(root, 'workspace');
  const remote = path.join(root, 'remote.git');
  fs.mkdirSync(workspace);
  const previous = {projects: process.env.HARNESS_PROJECTS_DIR, workspace: process.env.HARNESS_WORKSPACE_ROOT};
  process.env.HARNESS_PROJECTS_DIR = path.join(root, 'projects');
  process.env.HARNESS_WORKSPACE_ROOT = workspace;
  t.after(() => {
    for (const [key, value] of [['HARNESS_PROJECTS_DIR', previous.projects], ['HARNESS_WORKSPACE_ROOT', previous.workspace]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
    fs.rmSync(root, {recursive: true, force: true});
  });
  const git = args => execFileSync('git', ['-C', workspace, ...args], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trim();
  const write = (relative, value) => { const file = path.join(workspace, relative); fs.mkdirSync(path.dirname(file), {recursive: true}); fs.writeFileSync(file, value); };
  write('fixture-bin/gh', '#!/bin/sh\nprintf "fixture-secret\\n"\n');
  fs.chmodSync(path.join(workspace, 'fixture-bin/gh'), 0o755);
  const slug = 'agent-render-fixture';
  const requiredPaths = renderRequiredPaths({config: {}});
  for (const file of requiredPaths) write(file, '// fixture\n');
  write('.gitignore', 'local/\nvideos/\nsrc/videos/\nassets/\narchive-source/\n');
  git(['init', '-b', 'main']); git(['config', 'user.name', 'Fixture']); git(['config', 'user.email', 'fixture@example.test']);
  git(['add', '--', ...requiredPaths, '.gitignore']); git(['commit', '-m', 'test: 基线']);
  execFileSync('git', ['init', '--bare', remote], {stdio: 'pipe'});
  git(['remote', 'add', 'origin', remote]); git(['push', 'origin', 'main']);
  const baseline = git(['rev-parse', 'HEAD']);
  write(`videos/${slug}/source.md`, '# Fixture\n');
  write(`src/videos/${slug}/FixtureVideo.tsx`, 'export const FixtureVideo = () => null;\n');
  write(`src/videos/${slug}/video.config.ts`, `import timeline from './generated/timeline-manifest.json';\nimport subtitles from './generated/subtitle-manifest.json';\nexport const videoConfig = {slug: '${slug}', fps: 30, width: 1920, height: 1080, scenes: [{id: '01'}], timeline, subtitles};\n`);
  for (const kind of ['audio', 'subtitle', 'timeline']) {
    write(`src/videos/${slug}/generated/${kind}-manifest.json`, JSON.stringify({videoId: slug, scenes: [{sceneId: '01', ...(kind === 'audio' ? {segments: [{id: '01-01', file: 'audio/scene-01/01-01.mp3'}]} : {})}]}));
  }
  write(`archive-source/${slug}/audio/scene-01/01-01.mp3`, 'audio');
  write(`archive-source/${slug}/subtitles/captions.vtt`, 'WEBVTT\n');
  write(`archive-source/${slug}/subtitles/captions.srt`, '1\n00:00:00,000 --> 00:00:01,000\nFixture\n');
  fs.mkdirSync(path.join(workspace, 'assets'));
  execFileSync('zip', ['-q', '-r', path.join(workspace, 'assets', `${slug}-assets.zip`), slug], {cwd: path.join(workspace, 'archive-source')});
  initializeProject(slug);
  const project = loadProject(slug, {refresh: false});
  for (const stage of Object.keys(project.state.stages)) project.state.stages[stage].status = 'succeeded';
  project.state.currentStage = 'render'; project.state.stages.render.status = 'ready'; project.state.stages['gate-4'].status = 'pending';
  writeJson(project.files.state, project.state);
  const calls = {creates: 0, uploads: 0, dispatches: 0, inspections: 0};
  let release = null, asset = null, bytes = null;
  const response = (payload, status = 200) => ({ok: status < 300, status, json: async () => payload, arrayBuffer: async () => bytes});
  const fetchImpl = async (url, request = {}) => {
    assert.equal(request.headers.Authorization, 'Bearer fixture-secret');
    if (url.includes('/tags/')) return response(release, release ? 200 : 404);
    if (url.endsWith('/releases') && request.method === 'POST') { calls.creates++; release = {id: 11}; return response(release, 201); }
    if (url.includes('uploads.github.com')) {
      calls.uploads++; bytes = request.body; asset = {id: 17, name: `${slug}.zip`, size: bytes.length, digest: `sha256:${createHash('sha256').update(bytes).digest('hex')}`}; return response(asset, 201);
    }
    if (url.endsWith('/assets?per_page=100')) return response(asset ? [asset] : []);
    if (url.endsWith('/assets/17')) return response(null);
    throw new Error(`unexpected request ${url}`);
  };
  const execute = (command, args, options) => command === 'gh' ? 'fixture-secret\n' : execFileSync(command, args, options);
  let inspectionStatus = 'running', expiredArtifact = false, interruptDispatch = false, runName = '';
  const adapter = createGitHubActionsAdapter({token: 'fixture-secret', repository: 'owner/video', ref: 'main', requireRenderInput: true,
    fetchImpl: async (url, request = {}) => {
      let payload;
      if (url.includes('/git/ref/')) payload = {object: {sha: git(['rev-parse', 'HEAD'])}};
      else if (url.endsWith('/dispatches')) {
        calls.dispatches++; const inputs = JSON.parse(request.body).inputs;
        assert.match(inputs.render_input_sha256, /^[a-f0-9]{64}$/);
        runName = `${slug} / ${inputs.dispatch_id}`;
        if (interruptDispatch) { interruptDispatch = false; throw Object.assign(new Error('fetch failed'), {code: 'ECONNRESET'}); }
        payload = {workflow_run_id: 100, run_url: 'https://api.github.com/repos/owner/video/actions/runs/100', html_url: 'https://github.com/owner/video/actions/runs/100'};
      } else if (url.includes('/artifacts?')) payload = {artifacts: [{id: 200, name: slug, size_in_bytes: 100, expired: expiredArtifact}]};
      else if (url.includes('/runs?')) payload = {workflow_runs: [{id: 100, head_branch: 'main', event: 'workflow_dispatch', display_title: runName, created_at: new Date().toISOString()}]};
      else if (url.endsWith('/runs/100')) { calls.inspections++; payload = {id: 100, status: inspectionStatus === 'running' ? 'in_progress' : 'completed', conclusion: inspectionStatus === 'running' ? null : inspectionStatus === 'succeeded' ? 'success' : 'failure'}; }
      else throw new Error(`unexpected render request ${url}`);
      return {ok: true, status: 200, text: async () => JSON.stringify(payload)};
    }});
  // The real adapter verifies Run and Artifact; preparation is already exercised by the controller.
  const monitor = createRemoteJobMonitor({adapterFactory: () => ({...adapter, requiresRenderPreflight: false})});
  const dependencies = {
    environment: {...process.env, PATH: `${path.join(workspace, 'fixture-bin')}:${process.env.PATH}`, GITHUB_TOKEN: 'wrong-env-secret'}, monitor,
    checkPreparation: async () => ({ok: true, checks: [], baseline: {localCommit: git(['rev-parse', 'HEAD']), remoteCommit: git(['ls-remote', 'origin', 'main']).split(/\s/)[0], successfulCommit: baseline}}),
    publishInput: input => publishRenderInput({...input, fetchImpl, execFileSyncImpl: execute}),
    bindInput: (current, options) => bindRenderInputDelivery(current, {...options, fetchImpl, execFileSyncImpl: execute}),
    // Credentials/network are mocked; ZIP, binding, Git validation, targeted push and monitor are real.
  };
  return {slug, workspace, git, write, calls, dependencies, succeed: () => {inspectionStatus = 'succeeded';},
    failRun: () => {inspectionStatus = 'failed';}, expire: () => {expiredArtifact = true;}, interruptDispatch: () => {interruptDispatch = true;}};
}

const firstOptions = ['--repository', 'owner/video', '--input-repository', 'owner/inputs', '--ref', 'main', '--baseline-run', '99'];
async function cli(args, dependencies) {
  const output = [];
  const original = console.log;
  console.log = value => output.push(value);
  try { const code = await main(args, {deliveryDependencies: dependencies}); return {code, result: JSON.parse(output.at(-1))}; }
  finally { console.log = original; }
}

test('actual CLI prepares, confirms, dispatches once and resumes the same Run to human Gate 4', async t => {
  const f = fixture(t);
  f.write('harness/src/remote-jobs.mjs', '// required correction\n');
  f.write('README.md', 'unrelated user change\n');
  const prepared = await cli(['render-delivery', 'prepare', f.slug, ...firstOptions], f.dependencies);
  assert.equal(prepared.code, 0);
  assert.deepEqual(prepared.result.files, ['harness/src/remote-jobs.mjs']);
  assert.equal(f.calls.dispatches, 0);
  await assert.rejects(() => cli(['render-delivery', 'start', f.slug], f.dependencies), {code: 'render-delivery-confirmation-required'});
  const started = await cli(['render-delivery', 'start', f.slug, '--confirm-plan', prepared.result.planId], f.dependencies);
  assert.equal(started.result.status, 'running');
  assert.equal(f.calls.dispatches, 1);
  assert.match(f.git(['status', '--porcelain']), /README.md/);
  assert.doesNotMatch(f.git(['show', '--format=', '--name-only', 'HEAD']), /README/);
  f.succeed();
  const resumed = await cli(['render-delivery', 'resume', f.slug], f.dependencies);
  assert.equal(resumed.result.status, 'succeeded', JSON.stringify({error: resumed.result.job.error, issues: validateProjectStage(loadProject(f.slug, {refresh: false}), 'gate-4')}));
  assert.equal(f.calls.dispatches, 1);
  assert.equal(f.calls.creates, 1); assert.equal(f.calls.uploads, 1);
  assert.equal(loadProject(f.slug, {refresh: false}).state.currentStage, 'gate-4');
  assert.equal(loadProject(f.slug, {refresh: false}).state.stages['gate-4'].review, null);
  assert.doesNotMatch(fs.readFileSync(path.join(f.workspace, 'local/render-method.json'), 'utf8'), /secret/);
});

test('repeated preparation reuses the published ZIP and method; changed plan blocks dispatch', async t => {
  const f = fixture(t);
  await cli(['render-delivery', 'prepare', f.slug, ...firstOptions], f.dependencies);
  const repeated = await cli(['render-delivery', 'prepare', f.slug], f.dependencies);
  assert.equal(f.calls.creates, 1); assert.equal(f.calls.uploads, 1);
  f.write('harness/src/remote-jobs.mjs', '// changed after confirmation\n');
  await assert.rejects(() => cli(['render-delivery', 'start', f.slug, '--confirm-plan', repeated.result.planId], f.dependencies), {code: 'render-delivery-plan-stale'});
  assert.equal(f.calls.dispatches, 0);
});

test('binding failure resumes publication without another release or upload', async t => {
  const f = fixture(t);
  const bind = f.dependencies.bindInput;
  f.dependencies.bindInput = async () => {throw new Error('interrupted binding');};
  await assert.rejects(() => cli(['render-delivery', 'prepare', f.slug, ...firstOptions], f.dependencies), /interrupted binding/);
  f.dependencies.bindInput = bind;
  await cli(['render-delivery', 'prepare', f.slug], f.dependencies);
  assert.equal(f.calls.creates, 1); assert.equal(f.calls.uploads, 1);
});

test('a commit followed by push failure resumes that approved commit without recommitting', async t => {
  const f = fixture(t);
  f.write('harness/src/remote-jobs.mjs', '// fix\n');
  const prepared = await cli(['render-delivery', 'prepare', f.slug, ...firstOptions], f.dependencies);
  f.dependencies.commitDelivery = (_project, options) => {
    f.git(['add', '--', 'harness/src/remote-jobs.mjs']); f.git(['commit', '-m', 'test: approved fix']);
    options.onCommit(f.git(['rev-parse', 'HEAD'])); throw new Error('push interrupted');
  };
  await assert.rejects(() => cli(['render-delivery', 'start', f.slug, '--confirm-plan', prepared.result.planId], f.dependencies), /push interrupted/);
  const commit = f.git(['rev-parse', 'HEAD']);
  await cli(['render-delivery', 'resume', f.slug], f.dependencies);
  assert.equal(f.git(['rev-parse', 'HEAD']), commit); assert.equal(f.calls.dispatches, 1);
});

test('changed input binding blocks start even when the code file list is unchanged', async t => {
  const f = fixture(t);
  const prepared = await cli(['render-delivery', 'prepare', f.slug, ...firstOptions], f.dependencies);
  const file = path.join(f.workspace, 'local/render-input', `${f.slug}.delivery.json`);
  const binding = JSON.parse(fs.readFileSync(file)); binding.url += '?changed'; fs.writeFileSync(file, JSON.stringify(binding));
  await assert.rejects(() => cli(['render-delivery', 'start', f.slug, '--confirm-plan', prepared.result.planId], f.dependencies), {code: 'render-delivery-plan-stale'});
  assert.equal(f.calls.dispatches, 0);
});

test('completed project is read only and legacy remote-run cannot bypass delivery', async t => {
  const f = fixture(t);
  const current = loadProject(f.slug, {refresh: false}); current.state.currentStage = 'completed'; writeJson(current.files.state, current.state);
  const before = fs.readFileSync(current.files.state, 'utf8');
  await assert.rejects(() => runRenderDelivery('prepare', f.slug, {}, f.dependencies), {code: 'completed-project-readonly'});
  assert.equal(fs.readFileSync(current.files.state, 'utf8'), before); assert.equal(f.calls.creates, 0);
  await assert.rejects(() => main(['remote-run', f.slug, 'render']), /已停用/);
});

test('timed out persisted Run can be refreshed to success without a new Job or dispatch', async t => {
  const f = fixture(t);
  const prepared = await cli(['render-delivery', 'prepare', f.slug, ...firstOptions], f.dependencies);
  await cli(['render-delivery', 'start', f.slug, '--confirm-plan', prepared.result.planId], f.dependencies);
  const job = listJobs(f.slug)[0]; updateJob(f.slug, job.id, {status: 'timeout', completedAt: new Date().toISOString()});
  const current = loadProject(f.slug, {refresh: false}); current.state.currentStage = 'render'; current.state.stages.render.status = 'failed'; writeJson(current.files.state, current.state);
  f.succeed();
  const result = await cli(['render-delivery', 'resume', f.slug], f.dependencies);
  assert.equal(result.result.status, 'succeeded', JSON.stringify(result.result.job.error)); assert.equal(listJobs(f.slug).length, 1); assert.equal(f.calls.dispatches, 1);
});

test('fixed method environment excludes stale credential and global input overrides', () => {
  const env = renderMethodEnvironment({repository: 'owner/video', ref: 'main'}, {GITHUB_TOKEN: 'secret', GH_TOKEN: 'secret', HARNESS_RENDER_INPUT_TOKEN: 'secret', HARNESS_RENDER_INPUT_URL: 'old'});
  assert.equal(env.HARNESS_GITHUB_AUTH_SOURCE, 'gh-cli'); assert.equal(env.GITHUB_REPOSITORY, 'owner/video');
  assert.doesNotMatch(JSON.stringify(env), /secret|old/);
});

test('network errors and asset mismatches never count as a missing release or overwrite it', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-input-publication-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const archivePath = path.join(root, 'fixture.zip'); fs.writeFileSync(archivePath, 'zip');
  const input = {method: {inputRepository: 'owner/inputs'}, archivePath, archiveSha256: 'a'.repeat(64), slug: 'fixture', environment: {}, execFileSyncImpl: () => 'secret'};
  let posts = 0;
  await assert.rejects(() => publishRenderInput({...input, fetchImpl: async (_url, options) => {
    if (options.method === 'POST') posts++; throw new Error('network secret');
  }}), {code: 'render-publication-network'});
  await assert.rejects(() => publishRenderInput({...input, fetchImpl: async url => ({ok: true, status: 200, json: async () => url.includes('/tags/') ? {id: 1} : [{id: 2, name: 'fixture.zip', size: 3, digest: `sha256:${'b'.repeat(64)}`} ]})}), {code: 'render-publication-hash-mismatch'});
  assert.equal(posts, 0);
});

test('elapsed local deadline cannot hide an already successful remote Run', async t => {
  const f = fixture(t);
  const prepared = await cli(['render-delivery', 'prepare', f.slug, ...firstOptions], f.dependencies);
  await cli(['render-delivery', 'start', f.slug, '--confirm-plan', prepared.result.planId], f.dependencies);
  const job = listJobs(f.slug)[0];
  updateJob(f.slug, job.id, {startedAt: '2020-01-01T00:00:00Z', remote: {...job.remote, dispatchConfirmedAt: '2020-01-01T00:00:00Z'}});
  f.succeed();
  const resumed = await cli(['render-delivery', 'resume', f.slug], f.dependencies);
  assert.equal(resumed.result.status, 'succeeded'); assert.equal(f.calls.dispatches, 1);
});

test('dispatch response interruption recovers by dispatch ID without a second POST', async t => {
  const f = fixture(t);
  const prepared = await cli(['render-delivery', 'prepare', f.slug, ...firstOptions], f.dependencies);
  f.interruptDispatch();
  await cli(['render-delivery', 'start', f.slug, '--confirm-plan', prepared.result.planId], f.dependencies);
  const dispatchId = listJobs(f.slug)[0].remote.dispatchId;
  f.succeed();
  const resumed = await cli(['render-delivery', 'resume', f.slug], f.dependencies);
  assert.equal(resumed.result.status, 'succeeded', JSON.stringify(resumed.result.job.error));
  assert.equal(resumed.result.job.remote.dispatchId, dispatchId); assert.equal(f.calls.dispatches, 1);
});

test('expired Artifact cannot advance Gate 4 even if the Run succeeded', async t => {
  const f = fixture(t);
  const prepared = await cli(['render-delivery', 'prepare', f.slug, ...firstOptions], f.dependencies);
  await cli(['render-delivery', 'start', f.slug, '--confirm-plan', prepared.result.planId], f.dependencies);
  f.succeed(); f.expire();
  const resumed = await cli(['render-delivery', 'resume', f.slug], f.dependencies);
  assert.equal(resumed.code, 1); assert.equal(resumed.result.status, 'failed');
  assert.equal(loadProject(f.slug, {refresh: false}).state.currentStage, 'render'); assert.equal(f.calls.dispatches, 1);
});

test('confirmed remote failure requires an explicit new retry plan', async t => {
  const f = fixture(t);
  const prepared = await cli(['render-delivery', 'prepare', f.slug, ...firstOptions], f.dependencies);
  await cli(['render-delivery', 'start', f.slug, '--confirm-plan', prepared.result.planId], f.dependencies);
  f.failRun(); await cli(['render-delivery', 'resume', f.slug], f.dependencies);
  const job = listJobs(f.slug)[0]; assert.equal(job.error.code, 'remote-run-failed');
  await assert.rejects(() => cli(['render-delivery', 'prepare', f.slug], f.dependencies), {code: 'render-delivery-existing-job'});
  const retry = await cli(['render-delivery', 'prepare', f.slug, '--retry-job', job.id], f.dependencies);
  assert.equal(retry.result.status, 'awaiting-confirmation'); assert.equal(f.calls.dispatches, 1);
});

test('failed method preflight cannot publish, commit or dispatch', async t => {
  const f = fixture(t);
  f.dependencies.checkPreparation = async () => ({ok: false, checks: [{ok: false, code: 'github-network-unavailable', message: 'Network unavailable'}]});
  await assert.rejects(() => cli(['render-delivery', 'prepare', f.slug, ...firstOptions], f.dependencies), {code: 'render-method-preflight-failed'});
  assert.equal(f.calls.creates, 0); assert.equal(f.calls.dispatches, 0);
  assert.equal(fs.existsSync(path.join(f.workspace, 'local/render-method.json')), false);
});
