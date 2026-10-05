import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {loadProject, assertProjectMutable} from './storage.mjs';
import {checkRenderPreparation} from './render-preflight.mjs';
import {resolveGitHubToken} from './github-auth.mjs';
import {prepareRemoteRenderInputs, assertRenderStageReady, assertRemoteRenderDeliveryInputs} from './remote-executor.mjs';
import {assertRenderInputDelivery, bindRenderInputDelivery} from './render-input.mjs';
import {buildGitRenderCommitPlan, commitAndPushRenderDelivery} from './git-delivery.mjs';
import {listJobs} from './jobs.mjs';
import {createRemoteJobMonitor} from './remote-jobs.mjs';
import {createGitHubActionsAdapterFromEnv} from './adapters.mjs';
import {retryStage} from './runner.mjs';

const read = file => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
const save = (file, value) => {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(temporary, file);
};
const fail = (code, message) => { throw Object.assign(new Error(message), {code}); };

export function renderMethodEnvironment(method, environment = process.env) {
  const result = {...environment, GITHUB_REPOSITORY: method.repository,
    HARNESS_GITHUB_REF: method.ref, HARNESS_GITHUB_AUTH_SOURCE: 'gh-cli'};
  for (const key of ['GITHUB_TOKEN', 'GH_TOKEN', 'HARNESS_RENDER_INPUT_TOKEN', 'HARNESS_RENDER_INPUT_URL', 'HARNESS_RENDER_INPUT_SHA256', 'HARNESS_RENDER_INPUT_DIR']) delete result[key];
  return result;
}

// GET/POST only against the fixed input repository; never overwrite an asset.
export async function publishRenderInput({method, archivePath, archiveSha256, slug, environment,
  fetchImpl = globalThis.fetch, execFileSyncImpl = execFileSync}) {
  const auth = resolveGitHubToken({environment, authSource: 'gh-cli', execFileSyncImpl});
  if (auth.issue) fail(auth.issue.code, auth.issue.message);
  const request = async (url, {allowMissing = false, ...options} = {}) => {
    let response;
    try {
      response = await fetchImpl(url, {...options, signal: AbortSignal.timeout(60000), headers: {
        Accept: 'application/vnd.github+json', Authorization: `Bearer ${auth.token}`,
        'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'video-production-harness', ...options.headers,
      }});
    } catch { fail('render-publication-network', '输入包发布网络请求未完成；保留当前包，再执行 prepare 恢复。'); }
    if (allowMissing && response.status === 404) return null;
    if (!response.ok) fail('render-publication-api', `输入包发布返回 HTTP ${response.status}；未覆盖任何已有资产。`);
    return response;
  };
  const base = `https://api.github.com/repos/${method.inputRepository}/releases`;
  const tag = `${slug}-input-${archiveSha256.slice(0, 16)}`;
  let release = await request(`${base}/tags/${tag}`, {allowMissing: true});
  release = release ? await release.json() : await (await request(base, {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({tag_name: tag, name: tag, body: 'Render input package'}),
  })).json();
  const name = path.basename(archivePath);
  // Re-read assets on every resume: upload may have succeeded before the client disconnected.
  const assets = await (await request(`${base}/${release.id}/assets?per_page=100`)).json();
  let asset = assets.find(item => item.name === name);
  if (!asset) {
    const upload = `https://uploads.github.com/repos/${method.inputRepository}/releases/${release.id}/assets?name=${encodeURIComponent(name)}`;
    asset = await (await request(upload, {method: 'POST', headers: {'Content-Type': 'application/zip'},
      body: fs.readFileSync(archivePath)})).json();
  }
  if (!Number.isSafeInteger(asset.id) || asset.size <= 0) fail('render-publication-asset-invalid', '发布资产无有效 ID 或内容为空。');
  if (asset.digest && asset.digest !== `sha256:${archiveSha256}`) fail('render-publication-hash-mismatch', '已有资产与当前包不同，停止并保留资产，请检查输入包。');
  return {url: `${base}/assets/${asset.id}`, sha256: archiveSha256,
    assetDigest: typeof asset.digest === 'string' && asset.digest ? asset.digest : null, tag, assetId: asset.id};
}

export async function runRenderDelivery(action, slug, options = {}, dependencies = {}) {
  const load = dependencies.loadProject ?? loadProject;
  const project = load(slug, {refresh: false});
  assertProjectMutable(project, 'Agent 单条视频渲染交付');
  const workspace = path.resolve(project.config.workspaceRoot);
  const sessionPath = path.join(workspace, 'local/render-input', `${slug}.agent-delivery.json`);
  const methodPath = path.join(workspace, 'local/render-method.json');
  let session = read(sessionPath);
  const savedMethod = read(methodPath);
  const method = action === 'prepare' ? {
    repository: options.repository ?? savedMethod?.repository,
    inputRepository: options.inputRepository ?? savedMethod?.inputRepository,
    ref: options.ref ?? savedMethod?.ref,
    baselineRun: options.baselineRun ?? savedMethod?.baselineRun,
  } : session?.method;
  if (!method?.repository || !method.inputRepository || !method.ref || !method.baselineRun) {
    fail('render-method-missing', '首次 prepare 必须指定 --repository、--input-repository、--ref 和 --baseline-run；后续复用 local/render-method.json。');
  }
  const environment = renderMethodEnvironment(method, dependencies.environment ?? process.env);
  const git = args => (dependencies.execFileSyncImpl ?? execFileSync)('git', ['-C', workspace, ...args], {
    env: environment, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000,
  }).trim();
  const check = dependencies.checkPreparation ?? checkRenderPreparation;
  const planFor = () => (dependencies.buildPlan ?? buildGitRenderCommitPlan)(project, {environment});
  const validate = dependencies.validateDelivery ?? assertRemoteRenderDeliveryInputs;
  const bindingFor = dependencies.assertBinding ?? assertRenderInputDelivery;
  const jobsFor = () => (dependencies.listJobs ?? listJobs)(slug).filter(job => job.stage === 'render');
  const monitor = dependencies.monitor ?? createRemoteJobMonitor({environment, adapterFactory: () =>
    createGitHubActionsAdapterFromEnv({environment, authSource: 'gh-cli'})});
  const checkpoint = patch => { assertProjectMutable(project, '记录 Agent 渲染交付断点'); session = {...session, ...patch}; save(sessionPath, session); };
  const preflight = async () => {
    const report = await check({workspace, ...method, environment});
    assertProjectMutable(project, '记录 Agent 渲染预检');
    save(path.join(workspace, 'local/render-input', `${slug}.preflight.json`), report);
    if (!report.ok) fail('render-method-preflight-failed', report.checks.filter(item => !item.ok).map(item => `${item.code}：${item.message}`).join('；'));
    return report;
  };
  const recoverJob = async job => {
    if (job.status !== 'succeeded') {
      await monitor.processJob(job.id, {reconcile: true});
      job = jobsFor().find(item => item.id === job.id);
    }
    checkpoint({jobId: job.id, phase: job.status === 'succeeded' ? 'gate-4' : 'rendering'});
    return {status: job.status, job, next: job.status === 'succeeded' ? '用户下载视频并进行 Gate 4 验收' : `render-delivery resume ${slug}`};
  };
  if (!['prepare', 'start', 'resume'].includes(action)) fail('render-delivery-action-invalid', 'render-delivery 仅支持 prepare、start、resume。');
  if (action === 'prepare') {
    const previousJob = jobsFor()[0];
    const retry = previousJob?.status === 'failed' && previousJob.error?.code === 'remote-run-failed' && options.retryJob === previousJob.id;
    if (previousJob && !retry) {
      fail('render-delivery-existing-job', '已有渲染记录，请先 resume 核实；仅远端已确认失败且用户要求重试时，使用 prepare --retry-job <jobId>。');
    }
    if (!(retry && project.state.currentStage === 'render' && project.state.stages.render.status === 'failed')) assertRenderStageReady(project, '准备 Agent 渲染交付');
    const report = await preflight();
    if (report.baseline.localCommit !== report.baseline.remoteCommit) fail('render-delivery-branch-diverged', '本地 HEAD 与实际远端不同，请先从核实的远端准备独立交付工作区，避免推送无关提交。');
    if (retry && project.state.stages.render.status === 'failed') retryStage(project, 'render');
    save(methodPath, method);
    const input = await (dependencies.prepareInputs ?? prepareRemoteRenderInputs)(project, {
      ...(options.componentFile ? {componentFile: options.componentFile} : {}),
      ...(options.componentExport ? {componentExport: options.componentExport} : {}),
    });
    const publication = await (dependencies.publishInput ?? publishRenderInput)({method, slug, environment, ...input});
    await (dependencies.bindInput ?? bindRenderInputDelivery)(project, {...publication, environment, authSource: 'gh-cli'});
    bindingFor(project);
    const plan = planFor();
    if (plan.branch !== method.ref || plan.outOfScopePaths.length) fail('render-delivery-plan-out-of-scope', '交付分支不一致或存在范围外的渲染改动，请先整理独立交付工作区。');
    checkpoint({schemaVersion: 1, slug, workspace, method, phase: 'awaiting-confirmation', plan,
      publication, preparedAt: new Date().toISOString(), confirmedPlan: null, commit: null, jobId: null});
    return {status: 'awaiting-confirmation', planId: plan.planId, files: plan.commitPaths,
      input: publication, next: `用户确认上述精确清单后：render-delivery start ${slug} --confirm-plan ${plan.planId}`};
  }
  if (!session || session.slug !== slug || session.workspace !== workspace) fail('render-delivery-session-missing', '缺少当前工作区的单条交付记录，请先 prepare。');
  const existing = session.jobId ? jobsFor().find(job => job.id === session.jobId)
    : jobsFor().find(job => Date.parse(job.createdAt) >= Date.parse(session.preparedAt));
  if (existing) return recoverJob(existing);
  if (!session.confirmedPlan) {
    if (action !== 'start' || options.confirmPlan !== session.plan.planId) fail('render-delivery-confirmation-required', '必须先获得用户对精确文件清单的确认，再使用 start --confirm-plan <planId>。');
    const report = await preflight();
    if (report.baseline.remoteCommit !== session.plan.headCommit) fail('render-delivery-remote-changed', '实际远端提交已变化，请重新 prepare 并确认清单。');
    if (planFor().planId !== session.plan.planId) fail('render-delivery-plan-stale', '文件或输入绑定已变化，请重新 prepare 并确认新的清单。');
    bindingFor(project);
    assertRenderStageReady(project);
    checkpoint({confirmedPlan: options.confirmPlan, phase: 'committing'});
  }
  // Commit is checkpointed before push, so a failed push can resume the exact approved commit.
  if (!session.commit) {
    const result = (dependencies.commitDelivery ?? commitAndPushRenderDelivery)(project, {
      environment, deliveryPlanId: session.plan.planId, selectedPaths: session.plan.commitPaths,
      commitMessage: `chore: 准备 ${slug} 完整渲染所需代码`, onCommit: commit => checkpoint({commit, phase: 'pushing'}),
    });
    checkpoint({commit: result.commit, phase: 'pushed'});
  } else if (session.phase !== 'pushed') {
    await preflight();
    if (git(['rev-parse', 'HEAD']) !== session.commit) fail('render-delivery-commit-changed', '工作区 HEAD 已变化，不能恢复推送已确认的提交。');
    const changed = git(['diff', '--name-only', session.plan.headCommit, session.commit]).split('\n').filter(Boolean).sort();
    if (JSON.stringify(changed) !== JSON.stringify([...session.plan.commitPaths].sort())) fail('render-delivery-commit-scope-changed', '断点提交包含清单之外的文件，停止推送。');
    for (const file of session.plan.commitPaths) {
      const hash = createHash('sha256').update(fs.readFileSync(path.join(workspace, file))).digest('hex');
      if (hash !== session.plan.fileHashes[file]) fail('render-delivery-files-changed', '已确认文件内容变化，停止恢复推送。');
    }
    git(['push', 'origin', `HEAD:${method.ref}`]);
    checkpoint({phase: 'pushed'});
  }
  const dispatchReport = await preflight();
  if (dispatchReport.baseline.localCommit !== session.commit || dispatchReport.baseline.remoteCommit !== session.commit) {
    fail('render-delivery-dispatch-commit-changed', '当前本地或远端已不是本次确认的交付提交，停止派发，请重新准备清单。');
  }
  bindingFor(project);
  await validate(project, {environment});
  const current = load(slug, {refresh: true});
  assertRenderStageReady(current);
  const job = monitor.submit({slug, stage: 'render', processImmediately: false});
  checkpoint({jobId: job.id, phase: 'rendering'});
  return recoverJob(job);
}

export async function renderDeliveryCli(args, dependencies = {}) {
  const [action, slug, ...rest] = args;
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) fail('render-delivery-slug-invalid', '需要有效视频 slug。');
  const names = {'--repository': 'repository', '--input-repository': 'inputRepository', '--ref': 'ref',
    '--baseline-run': 'baselineRun', '--component-file': 'componentFile', '--component-export': 'componentExport', '--confirm-plan': 'confirmPlan', '--retry-job': 'retryJob'};
  const options = {};
  for (let i = 0; i < rest.length; i += 1) {
    if (rest[i] === '--json') continue;
    if (!names[rest[i]] || !rest[i + 1] || rest[i + 1].startsWith('--')) fail('render-delivery-options-invalid', '渲染交付参数无效或缺少值。');
    options[names[rest[i]]] = rest[++i];
  }
  return runRenderDelivery(action, slug, options, dependencies);
}
