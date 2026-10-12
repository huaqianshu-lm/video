import fs from 'node:fs';
import path from 'node:path';
import {createHash, randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync, spawn} from 'node:child_process';
import {assertProjectMutable, loadProject} from './storage.mjs';
import {acquireProductionTask, assertProductionTaskOwner, activeProductionTask, releaseProductionTask} from './production-lock.mjs';
import {createJobRecord, getJob, listJobs, updateJob} from './jobs.mjs';
import {assertRenderStageReady, prepareRemoteRenderInputs} from './remote-executor.mjs';
import {renderEntryPointSource, validateCurrentRenderInput, validateRenderInputDirectory} from './render-input.mjs';
import {beginExecutorStage, completeAdapterStage, markAdapterStageFailed, retryStage, runStage, validateStage} from './runner.mjs';
import {findActiveBatchForProject} from './batches.mjs';

const fail = (code, message) => { throw Object.assign(new Error(message), {code}); };
const hash = value => createHash('sha256').update(value).digest('hex');
const read = file => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
const timestamp = () => new Date().toISOString();
export function extractLocalAssets(archivePath, assetRoot) {
  // The frozen input package can contain a selected series cover that is also
  // present in the video's asset archive. Unzip's default prompt hangs in a
  // headless CLI, so let the validated asset archive supply the final copy.
  execFileSync('unzip', ['-o', '-q', archivePath, '-d', assetRoot], {timeout: 60000});
}
function save(file, value) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n');
  fs.renameSync(temporary, file);
}

function resolveBinary(name, environment) {
  const configured = environment[`HARNESS_LOCAL_${name.toUpperCase()}`];
  const locations = configured ? [configured] : (environment.PATH ?? '').split(path.delimiter).map(dir => path.join(dir, name));
  for (const file of locations) {
    try { fs.accessSync(file, fs.constants.X_OK); return fs.realpathSync(file); } catch {}
  }
  fail('local-render-binary-missing', `缺少可执行的系统 ${name}，请配置 HARNESS_LOCAL_${name.toUpperCase()} 或 PATH。`);
}

export function localRenderEnvironment(workspace, environment = process.env) {
  if (process.platform !== 'darwin' && process.platform !== 'linux') fail('local-render-platform-unsupported', '本地执行器目前支持 macOS／Linux。');
  const ffmpeg = resolveBinary('ffmpeg', environment);
  const ffprobe = resolveBinary('ffprobe', environment);
  const version = execFileSync(ffmpeg, ['-version'], {encoding: 'utf8', timeout: 10000}).split('\n')[0];
  const major = Number(version.match(/ffmpeg version (\d+)/)?.[1]);
  // Older macOS system FFmpeg lacked native amix normalize; never silently alter mixing.
  if (major !== 9) fail('local-render-ffmpeg-unsupported', '当前已验证本地执行器要求 FFmpeg 9；其他版本需单独验证兼容性。');
  execFileSync(ffprobe, ['-version'], {stdio: 'ignore', timeout: 10000});
  const encoders = execFileSync(ffmpeg, ['-hide_banner', '-encoders'], {encoding: 'utf8', timeout: 10000, stdio: ['ignore', 'pipe', 'ignore']});
  const filters = execFileSync(ffmpeg, ['-hide_banner', '-filters'], {encoding: 'utf8', timeout: 10000, stdio: ['ignore', 'pipe', 'ignore']});
  if (!/\blibx264\b/.test(encoders) || !/\baac\b/.test(encoders) || !/\bamix\b/.test(filters)) fail('local-render-codecs-missing', '本机 FFmpeg 必须支持 libx264、aac 和 amix。');
  const mixHelp = execFileSync(ffmpeg, ['-hide_banner', '-h', 'filter=amix'], {encoding: 'utf8', timeout: 10000, stdio: ['ignore', 'pipe', 'ignore']});
  if (!/\bnormalize\b/.test(mixHelp)) fail('local-render-mixing-unsupported', '本机 amix 缺少 normalize 支持。');
  const require = createRequire(path.join(workspace, 'package.json'));
  const rendererEntry = require.resolve('@remotion/renderer');
  const rendererPackage = JSON.parse(fs.readFileSync(path.join(path.dirname(rendererEntry), '../package.json'), 'utf8'));
  const executableModule = require(path.join(path.dirname(rendererEntry), 'compositor/get-executable-path.js'));
  const compositor = path.join(executableModule.getExecutableDir(false, 'error'), 'remotion');
  fs.accessSync(compositor, fs.constants.X_OK);
  const {getRevisionInfo, readVersionFile, TESTED_VERSION} = require(path.join(path.dirname(rendererEntry), 'browser/BrowserFetcher.js'));
  const revision = getRevisionInfo('headless-shell');
  if (!environment.HARNESS_LOCAL_BROWSER && (!revision.local || readVersionFile('headless-shell') !== TESTED_VERSION)) {
    fail('local-render-browser-missing', '缺少与当前 Remotion 匹配的已安装无头浏览器；先准备浏览器或指定 HARNESS_LOCAL_BROWSER。');
  }
  const browserExecutable = fs.realpathSync(environment.HARNESS_LOCAL_BROWSER ?? revision.executablePath);
  fs.accessSync(browserExecutable, fs.constants.X_OK);
  const space = fs.statfsSync(workspace);
  const freeBytes = Number(space.bavail) * Number(space.bsize);
  if (freeBytes < 2 * 1024 ** 3) fail('local-render-disk-space', '本地渲染至少需要 2 GiB 可用磁盘空间。');
  return {ffmpeg, ffprobe, ffmpegVersion: version, ffmpegMajor: major, ffmpegSHA256: hash(fs.readFileSync(ffmpeg)),
    ffprobeSHA256: hash(fs.readFileSync(ffprobe)), remotionVersion: rendererPackage.version,
    compositor, browserExecutable, browserSHA256: hash(fs.readFileSync(browserExecutable)),
    node: process.execPath, platform: process.platform, arch: process.arch};
}

function capabilityFiles(root) {
  const result = [];
  const walk = relative => {
    const file = path.join(root, relative);
    if (!fs.existsSync(file)) return;
    const stat = fs.lstatSync(file);
    if (stat.isSymbolicLink()) fail('local-render-source-symlink', `渲染源不允许符号链接：${relative}`);
    if (stat.isDirectory()) for (const entry of fs.readdirSync(file).sort()) {
      const child = `${relative}/${entry}`;
      if (['src/videos', 'src/RenderInputRoot.tsx', 'public/local-assets'].includes(child)) continue;
      walk(child);
    }
    else if (stat.isFile()) result.push(relative);
  };
  for (const relative of ['src', 'public', 'styles', 'templates', 'docs', 'remotion.config.ts', 'tsconfig.json', 'package.json', 'package-lock.json', 'harness/src']) walk(relative);
  return result;
}

function currentPlan(project, prepared, runtime) {
  const issues = validateCurrentRenderInput(project);
  if (issues.length) fail('local-render-input-stale', issues.join('；'));
  const root = project.config.workspaceRoot;
  const manifest = read(path.join(prepared.directory, 'render-input.json'));
  const files = Object.fromEntries(capabilityFiles(root).map(relative => [relative, hash(fs.readFileSync(path.join(root, relative)))]));
  let codeCommit = null;
  try { codeCommit = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], {encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore']}).trim(); } catch {}
  const plan = {backend: 'local', slug: project.config.slug, workspace: path.resolve(root),
    packageFingerprint: manifest.packageFingerprint, sourceFingerprint: manifest.sourceFingerprint,
    compositionId: manifest.compositionId, runtime, files, codeCommit, concurrency: 1, codec: 'h264', pixelFormat: 'yuv420p'};
  return {...plan, planId: hash(JSON.stringify(plan))};
}

function sessionPath(project) { return path.join(project.config.workspaceRoot, 'local/render-input', `${project.config.slug}.agent-delivery.json`); }

export async function runLocalRenderDelivery(action, project, options = {}, dependencies = {}) {
  if (options.batchId) fail('batch-local-render-disabled', '批量只允许 GitHub。');
  if (!['prepare', 'start', 'resume'].includes(action)) fail('render-delivery-action-invalid', '仅支持 prepare、start、resume。');
  assertProjectMutable(project, '本地渲染交付');
  const slug = project.config.slug;
  let session = read(sessionPath(project));
  if (session && (session.slug !== slug || session.workspace !== path.resolve(project.config.workspaceRoot))) fail('render-delivery-session-mismatch', '交付记录不属于当前视频工作区。');
  const previous = listJobs(slug).find(job => job.stage === 'render');
  const claim = activeProductionTask(project);
  if (action === 'resume' && claim?.mode === 'local-render' && claim.processId && !getJob(slug, claim.id)) {
    let alive = true;
    try { process.kill(claim.processId, 0); }
    catch (error) { if (error.code === 'ESRCH') alive = false; }
    if (!alive) {
      releaseProductionTask(project, claim.id);
      return {backend: 'local', status: 'interrupted-before-job', next: `render-delivery prepare ${slug} --backend local`};
    }
    fail('local-render-preparing', '本地渲染正在创建 Job，请稍后恢复；不启动重复任务。');
  }
  if (action !== 'prepare') {
    if (!session || session.backend !== 'local') fail('render-delivery-session-missing', '缺少本地准备计划，请先 prepare。');
    // Recover the create-Job / checkpoint window only for this preparation.
    // An explicit retry may have the same plan hash as the old failed Job.
    const pending = previous?.backend === 'local' && previous.local?.planId === session.plan.planId
      && previous.id !== session.retryJob && Date.parse(previous.createdAt) >= Date.parse(session.preparedAt);
    const job = session.jobId ? getJob(slug, session.jobId) : pending ? previous : null;
    if (job) return {backend: 'local', job: await reconcileLocalJob(job), status: getJob(slug, job.id).status};
  }
  assertProductionTaskOwner(project);
  if (findActiveBatchForProject('to-render', slug)) fail('batch-local-render-disabled', '该视频属于当前批量渲染任务，只允许 GitHub。');
  if (action === 'prepare') {
    const review = project.state.stages['gate-4']?.review;
    const rejected = previous?.status === 'succeeded' && review?.decision === 'rejected'
      && Date.parse(review.reviewedAt) >= Date.parse(previous.completedAt);
    const retry = previous?.backend === 'local' && (previous.status === 'failed' || rejected) && options.retryJob === previous.id;
    if (previous && !retry) fail('render-delivery-existing-job', '已有渲染记录，请先 resume 核实；明确要求重试后使用 --retry-job <失败JobId>。');
    if (retry) {
      const pid = read(path.join(previous.local.directory, 'worker.json'))?.pid ?? previous.local.pid;
      if (pid) {
        let groups;
        try { groups = execFileSync('ps', ['-axo', 'pgid='], {encoding: 'utf8', timeout: 5000}); }
        catch { fail('local-render-process-check-failed', '不能核实旧进程组，停止重试。请在原执行环境检查。'); }
        if (groups.split(/\s+/).includes(String(pid))) fail('local-render-orphans-active', '旧 worker 进程组仍有进程，请先核实并结束残留渲染，再准备重试。');
      }
    }
    if (retry && project.state.currentStage === 'render' && project.state.stages.render.status === 'failed') retryStage(project, 'render');
    if (project.state.currentStage === 'gate-3' && project.state.stages.remotion.status === 'succeeded' && project.state.stages['gate-3'].status === 'waiting') {
      const issues = validateStage(project, 'gate-3').filter(item => item.severity !== 'warning');
      if (issues.length) fail('render-preview-invalid', issues.map(item => item.message).join('；'));
    } else assertRenderStageReady(project, '准备本地渲染');
    const runtime = localRenderEnvironment(project.config.workspaceRoot, dependencies.environment ?? process.env);
    const prepared = prepareRemoteRenderInputs(project, {
      ...(options.componentFile ? {componentFile: options.componentFile} : {}),
      ...(options.componentExport ? {componentExport: options.componentExport} : {}),
    });
    const plan = currentPlan(project, prepared, runtime);
    save(sessionPath(project), {schemaVersion: 2, backend: 'local', slug, workspace: plan.workspace, plan,
      inputDirectory: prepared.directory, phase: 'awaiting-confirmation', preparedAt: timestamp(),
      retryJob: retry ? previous.id : null, jobId: null, confirmedPlan: null});
    return {backend: 'local', status: 'awaiting-confirmation', planId: plan.planId, files: [],
      output: `out/local-render/${slug}/<jobId>/${slug}.mp4`, logs: `local/local-render/${slug}/<jobId>/render.log`,
      concurrency: 1, next: `确认本地渲染后：render-delivery start ${slug} --confirm-plan ${plan.planId}`};
  }
  if (action !== 'start' || options.confirmPlan !== session.plan.planId) fail('render-delivery-confirmation-required', '请确认当前本地计划后使用 start --confirm-plan <planId>。');
  assertRenderStageReady(project, '启动本地渲染');
  const runtime = localRenderEnvironment(project.config.workspaceRoot, dependencies.environment ?? process.env);
  if (currentPlan(project, {directory: session.inputDirectory}, runtime).planId !== session.plan.planId) fail('render-delivery-plan-stale', '代码、环境或输入已变化，请重新 prepare 并确认。');
  const id = randomUUID();
  acquireProductionTask(project, {id, stage: 'render', mode: 'local-render'});
  project.taskOwner = id;
  const directory = path.join(session.workspace, 'local/local-render', slug, id);
  const output = path.join(session.workspace, 'out/local-render', slug, id, `${slug}.mp4`);
  const workerWorkspace = path.join(directory, 'workspace');
  const binaries = path.join(directory, 'binaries');
  const local = {directory, output, workerWorkspace, binaries, planId: session.plan.planId,
    runtime, logPath: path.join(directory, 'render.log'), resultPath: path.join(directory, 'result.json'), pid: null, initializerPid: process.pid};
  try {
    createJobRecord({slug, stage: 'render', metadata: {id, backend: 'local', local}});
    save(sessionPath(project), {...session, jobId: id, confirmedPlan: options.confirmPlan, phase: 'rendering'});
    beginExecutorStage(project, 'render');
    fs.mkdirSync(directory, {recursive: true});
    fs.mkdirSync(path.dirname(output), {recursive: true});
    fs.mkdirSync(workerWorkspace);
    for (const relative of Object.keys(session.plan.files)) {
      const target = path.join(workerWorkspace, relative);
      fs.mkdirSync(path.dirname(target), {recursive: true});
      fs.copyFileSync(path.join(session.workspace, relative), target);
      if (hash(fs.readFileSync(target)) !== session.plan.files[relative]) fail('render-delivery-plan-stale', '复制期间代码发生变化。');
    }
    const frozenInput = path.join(directory, 'input');
    fs.cpSync(session.inputDirectory, frozenInput, {recursive: true, force: false});
    const copiedIssues = validateRenderInputDirectory(frozenInput, {expectedSlug: slug});
    if (copiedIssues.length) fail('local-render-input-stale', copiedIssues.join('；'));
    fs.cpSync(frozenInput, workerWorkspace, {recursive: true, force: false});
    const manifest = read(path.join(workerWorkspace, 'render-input.json'));
    if (manifest.packageFingerprint !== session.plan.packageFingerprint || manifest.sourceFingerprint !== session.plan.sourceFingerprint) fail('local-render-input-stale', '复制期间输入包发生变化。');
    // No mutable shared Studio entry: every render gets its own frozen entry and assets.
    fs.writeFileSync(path.join(workerWorkspace, 'src/RenderInputRoot.tsx'), renderEntryPointSource(manifest));
    const assetRoot = path.join(workerWorkspace, 'public/local-assets');
    fs.mkdirSync(assetRoot, {recursive: true});
    extractLocalAssets(path.join(workerWorkspace, `assets/${slug}-assets.zip`), assetRoot);
    fs.symlinkSync(path.join(session.workspace, 'node_modules'), path.join(workerWorkspace, 'node_modules'), 'dir');
    fs.mkdirSync(binaries);
    const ffmpegShim = fs.readFileSync(new URL('./local-ffmpeg.mjs', import.meta.url), 'utf8')
      .replace(/^#!\/usr\/bin\/env node/, `#!${runtime.node}`)
      .replace('Number(process.env.HARNESS_LOCAL_FFMPEG_MAJOR)', String(runtime.ffmpegMajor))
      .replace("if (!process.env.HARNESS_LOCAL_FFMPEG) throw new Error('Missing prepared system FFmpeg');", `const systemFfmpeg = ${JSON.stringify(runtime.ffmpeg)};`)
      .replace('process.env.HARNESS_LOCAL_FFMPEG,', 'systemFfmpeg,');
    if (!ffmpegShim.startsWith(`#!${runtime.node}\n`) || ffmpegShim.includes('process.env.HARNESS_LOCAL_FFMPEG')) {
      fail('local-render-node-invalid', '无法将本地 FFmpeg 启动器绑定到计划记录的 Node／FFmpeg 可执行文件。');
    }
    fs.writeFileSync(path.join(binaries, 'ffmpeg'), ffmpegShim, {mode: 0o755});
    fs.chmodSync(path.join(binaries, 'ffmpeg'), 0o755);
    fs.symlinkSync(runtime.ffprobe, path.join(binaries, 'ffprobe'));
    fs.symlinkSync(runtime.compositor, path.join(binaries, 'remotion'));
    save(path.join(directory, 'plan.json'), session.plan);
    const fd = fs.openSync(local.logPath, 'a');
    let child;
    try {
      child = spawn(process.execPath, [path.join(workerWorkspace, 'harness/src/local-render-worker.mjs'), slug, id], {
        cwd: session.workspace, detached: true, stdio: ['ignore', fd, fd],
        env: {...(dependencies.environment ?? process.env), PATH: `${path.dirname(process.execPath)}${path.delimiter}${(dependencies.environment ?? process.env).PATH ?? ''}`,
          HARNESS_PROJECTS_DIR: path.dirname(path.dirname(project.files.state)),
          HARNESS_SERIES_DIR: (dependencies.environment ?? process.env).HARNESS_SERIES_DIR ?? path.join(session.workspace, 'series'),
          HARNESS_LOCAL_FFMPEG: runtime.ffmpeg, HARNESS_LOCAL_FFMPEG_MAJOR: String(runtime.ffmpegMajor)},
      });
      await new Promise((resolve, reject) => { child.once('spawn', resolve); child.once('error', reject); });
    } finally { fs.closeSync(fd); }
    const updated = updateJob(slug, id, {local: {...local, pid: child.pid}});
    child.unref();
    return {backend: 'local', status: 'queued', job: updated, output, logs: local.logPath};
  } catch (error) {
    const job = getJob(slug, id);
    if (job) await failLocalJob(job, error);
    else releaseProductionTask(project, id);
    throw error;
  }
}

export async function failLocalJob(job, error) {
  const project = loadProject(job.slug, {refresh: false});
  assertProjectMutable(project, '记录本地渲染失败');
  project.taskOwner = job.id;
  assertProductionTaskOwner(project);
  if (project.state.currentStage === 'render' && project.state.stages.render.status === 'running') markAdapterStageFailed(project, 'render', error);
  const code = error.code ?? (/EPERM|EACCES|permission|Operation not permitted/i.test(error.message) ? 'local-render-permission-denied'
    : /browser|chrome/i.test(error.message) ? 'local-render-browser-failed' : 'local-render-failed');
  const result = updateJob(job.slug, job.id, {status: 'failed', error: {code, message: error.message}, completedAt: timestamp()});
  if (activeProductionTask(project)?.id === job.id) releaseProductionTask(project, job.id);
  return result;
}

export async function reconcileLocalJob(job) {
  if (job.backend !== 'local') return job;
  const project = loadProject(job.slug, {refresh: false});
  if (project.state.currentStage === 'completed') return job;
  assertProjectMutable(project, '恢复本地渲染');
  project.taskOwner = job.id;
  if (['succeeded', 'failed'].includes(job.status)) {
    if (activeProductionTask(project)?.id === job.id) releaseProductionTask(project, job.id);
    return job;
  }
  assertProductionTaskOwner(project);
  const report = read(job.local.resultPath);
  if (report?.ok && report.jobId === job.id) {
    const issues = validateCurrentRenderInput(project);
    if (issues.length) return failLocalJob(job, Object.assign(new Error(issues.join('；')), {code: 'local-render-input-stale'}));
    const output = report.output;
    if (!fs.existsSync(output.path) || hash(fs.readFileSync(output.path)) !== output.sha256) return failLocalJob(job, Object.assign(new Error('本地输出缺失或内容变化。'), {code: 'local-render-output-changed'}));
    if (project.state.currentStage === 'render' && project.state.stages.render.status === 'running') {
      completeAdapterStage(project, 'render', {outputs: [output]});
    } else if (project.state.currentStage !== 'gate-4' || !project.state.stages.render.outputs.some(item => item.jobId === job.id)) {
      return failLocalJob(job, Object.assign(new Error('生产状态已变化，不能推进原渲染任务。'), {code: 'local-render-state-changed'}));
    }
    if (project.state.stages['gate-4'].status === 'ready') runStage(project, 'gate-4');
    const updated = updateJob(job.slug, job.id, {status: 'succeeded', result: {outputs: [output], elapsedSeconds: report.elapsedSeconds}, error: null, completedAt: timestamp()});
    if (activeProductionTask(project)?.id === job.id) releaseProductionTask(project, job.id);
    return updated;
  }
  if (report?.ok === false) return failLocalJob(job, Object.assign(new Error(report.error.message), {code: report.error.code}));
  const pid = read(path.join(job.local.directory, 'worker.json'))?.pid ?? job.local.pid;
  if (!pid && job.local.initializerPid) {
    try { process.kill(job.local.initializerPid, 0); return getJob(job.slug, job.id); }
    catch (error) { if (error.code !== 'ESRCH') fail('local-render-process-check-failed', '无法核实渲染准备进程，请在原执行环境恢复。'); }
  }
  let alive = false;
  if (pid) {
    try { alive = execFileSync('ps', ['-p', String(pid), '-o', 'command='], {encoding: 'utf8', timeout: 5000}).includes(`local-render-worker.mjs ${job.slug} ${job.id}`); }
    catch (error) { if (error.status !== 1) fail('local-render-process-check-failed', '当前环境无法核实本地 worker，请在原执行环境恢复，不判定任务失败。'); }
  }
  if (!alive && Date.now() - Date.parse(job.createdAt) > 30000) return failLocalJob(job, Object.assign(new Error('本地 worker 已退出且没有有效完成结果；明确要求重试后重新准备。'), {code: 'local-render-interrupted'}));
  return getJob(job.slug, job.id);
}

export async function refreshLocalRenderJobs(slug) {
  const project = loadProject(slug, {refresh: false});
  if (project.state.currentStage === 'completed') return;
  try { assertProjectMutable(project, '刷新本地渲染任务'); }
  catch (error) { if (error.code === 'production-rework-required') return; throw error; }
  const locked = activeProductionTask(project)?.id;
  for (const job of listJobs(slug).filter(item => item.backend === 'local' && (['queued', 'running'].includes(item.status) || item.id === locked))) await reconcileLocalJob(job);
}

export async function executeLocalRenderWorker(slug, id) {
  let job = getJob(slug, id);
  if (job?.backend !== 'local' || !['queued', 'running'].includes(job.status)) fail('local-render-job-invalid', '无有效本地 Job。');
  const project = loadProject(slug, {refresh: false});
  assertProjectMutable(project, '执行本地 worker');
  project.taskOwner = id;
  assertProductionTaskOwner(project);
  const started = Date.now();
  save(path.join(job.local.directory, 'worker.json'), {pid: process.pid, startedAt: timestamp(), jobId: id});
  updateJob(slug, id, {status: 'running', startedAt: timestamp()});
  try {
    const require = createRequire(path.join(job.local.workerWorkspace, 'package.json'));
    const {bundle} = require('@remotion/bundler');
    const {selectComposition, renderMedia, openBrowser} = require('@remotion/renderer');
    const serveUrl = await bundle({entryPoint: path.join(job.local.workerWorkspace, 'src/RenderInputRoot.tsx'),
      publicDir: path.join(job.local.workerWorkspace, 'public')});
    let browser;
    try {
      browser = await openBrowser('chrome', {browserExecutable: job.local.runtime.browserExecutable, chromeMode: 'headless-shell'});
      const plan = read(path.join(job.local.directory, 'plan.json'));
      const composition = await selectComposition({serveUrl, id: plan.compositionId, puppeteerInstance: browser,
        binariesDirectory: job.local.binaries});
      if (composition.width !== 1920 || composition.height !== 1080 || composition.fps !== 30) fail('local-render-spec-invalid', '本地输出要求 1920×1080／30fps。');
      save(path.join(job.local.directory, 'composition.json'), composition);
      let lastProgress = 0;
      await renderMedia({serveUrl, composition, puppeteerInstance: browser, outputLocation: job.local.output,
        binariesDirectory: job.local.binaries, codec: 'h264', pixelFormat: 'yuv420p', concurrency: 1,
        overwrite: false, enforceAudioTrack: true, imageFormat: 'jpeg', onProgress: progress => {
          if (Date.now() - lastProgress < 5000) return;
          lastProgress = Date.now();
          updateJob(slug, id, {progress: {renderedFrames: progress.renderedFrames, encodedFrames: progress.encodedFrames,
            totalFrames: composition.durationInFrames, progress: progress.progress}, lastCheckedAt: timestamp()});
        }});
      const probe = JSON.parse(execFileSync(job.local.runtime.ffprobe, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', job.local.output], {encoding: 'utf8', timeout: 30000}));
      const video = probe.streams.find(item => item.codec_type === 'video');
      const audio = probe.streams.find(item => item.codec_type === 'audio');
      const expectedDuration = composition.durationInFrames / composition.fps;
      if (!video || video.codec_name !== 'h264' || video.width !== composition.width || video.height !== composition.height
        || video.r_frame_rate !== '30/1' || Number(video.nb_frames) !== composition.durationInFrames
        || !audio || audio.codec_name !== 'aac' || !Number.isFinite(Number(audio.duration))
        || Math.abs(Number(audio.duration) - expectedDuration) > 0.1) fail('local-render-output-invalid', '输出规格／帧数／音轨与 Composition 不一致。');
      await new Promise((resolve, reject) => {
        const child = spawn(job.local.runtime.ffmpeg, ['-hide_banner', '-v', 'error', '-xerror', '-threads', '1', '-i', job.local.output, '-f', 'null', '-'], {stdio: ['ignore', 'ignore', 'inherit']});
        child.once('error', reject);
        child.once('exit', code => code === 0 ? resolve() : reject(Object.assign(new Error('整片解码检查失败。'), {code: 'local-render-decode-failed'})));
      });
      const output = {kind: 'local-render', jobId: id, path: job.local.output, sizeInBytes: fs.statSync(job.local.output).size,
        sha256: hash(fs.readFileSync(job.local.output)), verified: true, frames: composition.durationInFrames,
        fps: composition.fps, width: composition.width, height: composition.height, audioCodec: 'aac', videoCodec: 'h264'};
      if (!output.sizeInBytes) fail('local-render-output-empty', '渲染输出为空。');
      save(job.local.resultPath, {ok: true, jobId: id, output, probe, elapsedSeconds: (Date.now() - started) / 1000});
    } finally { await browser?.close({silent: true}); }
    await reconcileLocalJob(getJob(slug, id));
  } catch (error) {
    if (!read(job.local.resultPath)?.ok) {
      save(job.local.resultPath, {ok: false, jobId: id, error: {code: error.code ?? 'local-render-failed', message: error.message}});
      await failLocalJob(getJob(slug, id), error);
    }
    throw error;
  }
}
