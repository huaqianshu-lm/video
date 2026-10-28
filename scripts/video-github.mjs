import fs from 'node:fs';
import path from 'node:path';
import {createHash, randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {ROOT, assertMutable, cliOptions, fail, fileHash, inside, main, read, write} from './lib/files.mjs';
import {validateInput} from './lib/input.mjs';
import {checkRenderPreparation} from './render-preflight.mjs';

const repository = value => { if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value ?? '')) fail('仓库必须为 owner/repository'); return value; };
export function gh(args, {binary = false} = {}) {
  const env = {...process.env}; delete env.GITHUB_TOKEN; delete env.GH_TOKEN;
  return execFileSync('gh', args, {cwd: ROOT, env, ...(binary ? {} : {encoding: 'utf8'}), stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000, maxBuffer: 256 * 1024 * 1024});
}
export function bindInput(root, directory, archive, url, {api = gh} = {}) {
  const manifest = validateInput(directory), id = manifest.videoSlug; assertMutable(root, id);
  execFileSync('python3', [path.join(ROOT, 'scripts/lib/archive.py'), 'verify', archive, directory], {stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000});
  const parsed = new URL(url);
  if (parsed.origin !== 'https://api.github.com' || parsed.search || parsed.hash || !/^\/repos\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/releases\/assets\/\d+$/.test(parsed.pathname)) fail('只接受独立输入仓库 GitHub Release Asset API URL');
  const sha256 = fileHash(archive);
  const remote = api(['api', parsed.pathname, '-H', 'Accept: application/octet-stream'], {binary: true});
  if (createHash('sha256').update(remote).digest('hex') !== sha256) fail('远端资产与本次输入包 ZIP 不一致');
  const result = {videoSlug: id, compositionId: manifest.compositionId, packageFingerprint: manifest.packageFingerprint,
    directory: path.resolve(directory), archive: path.resolve(archive), url: parsed.href, sha256};
  const file = inside(root, `local/render-input/${id}/github-${sha256.slice(0, 20)}.json`);
  assertMutable(root, id); write(file, result); return {file, ...result};
}
export async function dispatchInput(root, bindingFile, options, {api = gh, preflight = checkRenderPreparation, gitRun = execFileSync} = {}) {
  const binding = read(bindingFile), manifest = validateInput(binding.directory), id = manifest.videoSlug;
  assertMutable(root, id);
  if (options.confirm !== binding.sha256) fail('必须提供用户已确认的本次输入包 SHA：--confirm <sha256>');
  if (manifest.packageFingerprint !== binding.packageFingerprint || manifest.compositionId !== binding.compositionId || id !== binding.videoSlug || fileHash(binding.archive) !== binding.sha256) fail('输入绑定已过期');
  if (!manifest.files.some(f => f.path === 'src/lib/timing.ts')) fail('远程新入口需要含共享代码快照的新输入包，旧包保持只读');
  for (const file of manifest.files.filter(f => (f.path.startsWith('src/') && !f.path.startsWith('src/videos/')) || f.path.startsWith('styles/') || f.path.startsWith('templates/') || ['package.json', 'package-lock.json', 'tsconfig.json', 'remotion.config.ts'].includes(f.path))) {
    if (fileHash(inside(root, file.path)) !== file.sha256) fail(`输入包与当前能力代码不同，请重新准备并审核：${file.path}`);
  }
  execFileSync('python3', [path.join(ROOT, 'scripts/lib/archive.py'), 'verify', binding.archive, binding.directory], {stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000});
  const repo = repository(options.repository), inputRepo = repository(options['input-repository']);
  if (!binding.url.startsWith(`https://api.github.com/repos/${inputRepo}/releases/assets/`)) fail('独立输入仓库与绑定不一致');
  const ref = options.ref ?? 'main';
  const report = await preflight({workspace: root, repository: repo, inputRepository: inputRepo, ref, baselineRun: options['baseline-run']});
  const recordRoot = inside(root, `local/github-render/${id}/${binding.sha256}`);
  fs.mkdirSync(recordRoot, {recursive: true}); write(path.join(recordRoot, 'preflight.json'), report);
  if (!report.ok) fail('远程基线预检未通过，报告已保存');
  const git = args => gitRun('git', ['-C', root, ...args], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trim();
  const relevant = ['scripts', 'src/components', 'src/scenes', 'src/lib', 'styles', 'templates', 'package.json', 'package-lock.json', 'remotion.config.ts', '.github/workflows'];
  if (git(['status', '--porcelain', '--', ...relevant])) fail('渲染能力代码存在未提交内容；先审核精确文件清单，定向提交推送，不自动执行');
  git(['ls-files', '--error-unmatch', 'scripts/video-input.mjs', 'scripts/lib/input.mjs', '.github/workflows/render-video.yml']);
  const commit = git(['rev-parse', 'HEAD']);
  if (commit !== report.baseline.remoteCommit) fail('本地代码与实际派发分支不一致，先准备已确认的交付代码');
  const recordFile = path.join(recordRoot, 'dispatch.json');
  if (fs.existsSync(recordFile)) fail('已有派发意图或 Run，请按原 dispatchId 查询，禁止重复派发；明确失败后的重渲染另行授权');
  const dispatchId = randomUUID(), record = {videoSlug: id, repository: repo, ref, commit, dispatchId, inputSHA256: binding.sha256,
    at: new Date().toISOString(), runId: null, dispatch: 'intent'};
  assertMutable(root, id); write(recordFile, record);
  try {
    api(['workflow', 'run', 'render-video.yml', '--repo', repo, '--ref', ref,
      '-f', `video_slug=${id}`, '-f', `composition_id=${binding.compositionId}`, '-f', `dispatch_id=${dispatchId}`,
      '-f', `render_input_url=${binding.url}`, '-f', `render_input_sha256=${binding.sha256}`]);
    record.dispatch = 'accepted'; assertMutable(root, id); write(recordFile, record);
  } catch (error) {
    record.dispatch = 'uncertain'; assertMutable(root, id); write(recordFile, record);
    fail(`派发结果未确认；保留 ${recordFile}，按 dispatchId 查找，不重发`);
  }
  return {recordFile, ...record};
}
export function remoteStatus(repo, runId, {api = gh} = {}) {
  repository(repo);
  if (!/^\d+$/.test(String(runId))) fail('Run ID 必须为数字');
  const run = JSON.parse(api(['api', `/repos/${repo}/actions/runs/${runId}`]));
  const artifacts = JSON.parse(api(['api', `/repos/${repo}/actions/runs/${runId}/artifacts`]));
  return {runId: run.id, status: run.status, conclusion: run.conclusion, headSHA: run.head_sha, url: run.html_url,
    artifacts: artifacts.artifacts.map(x => ({id: x.id, name: x.name, size: x.size_in_bytes, expired: x.expired}))};
}
await main(import.meta.url, async args => {
  const {positional: [action, input], options} = cliOptions(args);
  if (!action || options.help) return {usage: 'node scripts/video-github.mjs bind <input-directory> --archive <zip> --url <Release-Asset-API-URL> | dispatch <binding.json> --repository <owner/repo> --input-repository <owner/repo> --baseline-run <id> --ref <branch> --confirm <sha256> | find <dispatch.json> | status <run-id> --repository <owner/repo>；发布、提交推送和派发须有各自授权'};
  if (action === 'bind') return bindInput(ROOT, path.resolve(input), path.resolve(options.archive), options.url);
  if (action === 'dispatch') return dispatchInput(ROOT, path.resolve(input), options);
  if (action === 'status') return remoteStatus(options.repository, input);
  if (action === 'find') {
    const record = read(path.resolve(input)); repository(record.repository);
    const runs = JSON.parse(gh(['api', `/repos/${record.repository}/actions/workflows/render-video.yml/runs?per_page=100&branch=${encodeURIComponent(record.ref)}`]));
    return runs.workflow_runs.filter(x => x.display_title === `${record.videoSlug} / ${record.dispatchId}`)
      .map(x => remoteStatus(record.repository, x.id));
  }
  fail('不支持的 GitHub 操作');
});
