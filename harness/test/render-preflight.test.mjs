import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {checkRenderPreparation} from '../src/render-preflight.mjs';

function fixture(t, {stale = false} = {}) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'render-preflight-'));
  t.after(() => fs.rmSync(workspace, {recursive: true, force: true}));
  const git = args => execFileSync('git', ['-C', workspace, ...args], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trim();
  git(['init', '-b', 'main']);
  git(['config', 'user.email', 'fixture@example.test']);
  git(['config', 'user.name', 'Fixture']);
  fs.writeFileSync(path.join(workspace, 'baseline.txt'), 'old code');
  git(['add', 'baseline.txt']); git(['commit', '-m', 'initial']);
  const oldSha = git(['rev-parse', 'HEAD']);
  fs.writeFileSync(path.join(workspace, 'baseline.txt'), 'verified rendering fix');
  git(['add', 'baseline.txt']); git(['commit', '-m', 'render fix']);
  const successfulSha = git(['rev-parse', 'HEAD']);
  if (stale) git(['checkout', '-b', 'stale-development', oldSha]);
  const calls = [];
  const options = {
    workspace, repository: 'owner/video', inputRepository: 'owner/inputs', ref: 'main', baselineRun: '123',
    environment: {...process.env, GITHUB_TOKEN: 'stale-env-secret', GH_TOKEN: 'other-stale-secret'},
    execFileSyncImpl(command, args, execution) {
      assert.equal(execution.env.GITHUB_TOKEN, undefined);
      assert.equal(execution.env.GH_TOKEN, undefined);
      if (command === 'gh') return 'keyring-secret\n';
      const gitArgs = args.slice(2);
      if (gitArgs[0] === 'remote') return 'https://github.com/owner/video.git';
      if (gitArgs[0] === 'fetch') { calls.push('fetch'); return ''; }
      if (gitArgs[0] === 'rev-parse' && gitArgs[1] === 'FETCH_HEAD') return successfulSha;
      return execFileSync(command, args, execution);
    },
    async fetchImpl(url, request) {
      assert.equal(request.headers.Authorization, 'Bearer keyring-secret');
      const resource = new URL(url).pathname;
      calls.push(resource);
      const payload = resource.endsWith('/actions/runs/123')
        ? {conclusion: 'success', workflow_id: 7, head_sha: successfulSha}
        : resource.endsWith('/workflows/render-video.yml') ? {id: 7, state: 'active'}
        : resource.includes('/git/ref/') ? {object: {sha: successfulSha}}
        : resource === '/user' ? {login: 'owner'} : {permissions: {push: true}};
      return {ok: true, status: 200, json: async () => payload};
    },
  };
  return {options, calls, successfulSha, oldSha};
}

test('verified environment and successful code baseline pass without leaking credentials', async t => {
  const {options, calls, successfulSha} = fixture(t);
  const report = await checkRenderPreparation(options);
  assert.equal(report.ok, true);
  assert.equal(report.scope, 'render-preparation');
  assert.equal(report.baseline.localCommit, successfulSha);
  assert.ok(calls.includes('/repos/owner/inputs'));
  assert.ok(calls.includes('fetch'));
  assert.doesNotMatch(JSON.stringify(report), /keyring-secret|stale-env-secret|other-stale-secret/);
});

test('local code missing a published successful fix blocks preparation despite valid authentication', async t => {
  const {options, oldSha} = fixture(t, {stale: true});
  const report = await checkRenderPreparation(options);
  assert.equal(report.ok, false);
  assert.equal(report.baseline.localCommit, oldSha);
  assert.equal(report.checks.find(x => x.name === 'remote-code-baseline').ok, true);
  assert.equal(report.checks.find(x => x.name === 'local-code-baseline').code, 'render-code-baseline-missing');
});

test('inaccessible keyring is not interpreted as a rejected login and no API request is made', async t => {
  const {options, calls} = fixture(t);
  const original = options.execFileSyncImpl;
  options.execFileSyncImpl = (command, ...args) => {
    if (command === 'gh') throw new Error('keyring-secret');
    return original(command, ...args);
  };
  const report = await checkRenderPreparation(options);
  assert.equal(report.checks.at(-1).code, 'github-auth-unavailable');
  assert.match(report.checks.at(-1).message, /尚不能判断账号是否失效/);
  assert.equal(calls.length, 0);
  assert.doesNotMatch(JSON.stringify(report), /keyring-secret/);
});

test('network failure and actual HTTP 401 remain different blockers', async t => {
  const {options} = fixture(t);
  const network = await checkRenderPreparation({...options, fetchImpl: async () => {throw new Error('keyring-secret');}});
  const rejected = await checkRenderPreparation({...options, fetchImpl: async () => ({ok: false, status: 401})});
  assert.equal(network.checks.at(-1).code, 'github-network-unavailable');
  assert.equal(rejected.checks.at(-1).code, 'github-auth-rejected');
  assert.doesNotMatch(JSON.stringify(network), /keyring-secret/);
});

test('input repository write permission must be verified before fetching the dispatch branch', async t => {
  const {options, calls} = fixture(t);
  const original = options.fetchImpl;
  options.fetchImpl = (url, request) => url.endsWith('/repos/owner/inputs')
    ? Promise.resolve({ok: true, json: async () => ({permissions: {push: false}})}) : original(url, request);
  const report = await checkRenderPreparation(options);
  assert.equal(report.checks.at(-1).code, 'github-write-permission-unverified');
  assert.ok(!calls.includes('fetch'));
});

test('a successful Run from another workflow cannot serve as the render baseline', async t => {
  const {options, calls, successfulSha} = fixture(t);
  const original = options.fetchImpl;
  options.fetchImpl = (url, request) => url.includes('/actions/runs/')
    ? Promise.resolve({ok: true, json: async () => ({conclusion: 'success', workflow_id: 99, head_sha: successfulSha})})
    : original(url, request);
  const report = await checkRenderPreparation(options);
  assert.equal(report.checks.at(-1).code, 'render-baseline-run-invalid');
  assert.ok(!calls.includes('fetch'));
});

test('changing remote ref between API lookup and fetch invalidates the snapshot', async t => {
  const {options, oldSha} = fixture(t);
  const original = options.execFileSyncImpl;
  options.execFileSyncImpl = (command, args, execution) => command === 'git' && args.at(-1) === 'FETCH_HEAD'
    ? oldSha : original(command, args, execution);
  const report = await checkRenderPreparation(options);
  assert.equal(report.checks.at(-1).code, 'render-ref-changed');
  assert.equal(report.ok, false);
});

test('origin mismatch cannot silently fetch a different repository', async t => {
  const {options, calls} = fixture(t);
  const original = options.execFileSyncImpl;
  options.execFileSyncImpl = (command, args, execution) => command === 'git' && args.includes('get-url')
    ? 'https://github.com/someone/other.git' : original(command, args, execution);
  const report = await checkRenderPreparation(options);
  assert.equal(report.checks.at(-1).code, 'render-preflight-origin-mismatch');
  assert.equal(calls.length, 0);
});
