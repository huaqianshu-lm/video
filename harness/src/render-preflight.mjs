#!/usr/bin/env node
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {resolveGitHubToken} from './github-auth.mjs';

const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const shaPattern = /^[a-f0-9]{40}$/;

// Preparation only: no video-state writes, commit, push, Gate approval or dispatch.
export async function checkRenderPreparation({
  workspace = process.cwd(), repository, inputRepository, ref = 'main', baselineRun,
  environment = process.env, fetchImpl = globalThis.fetch, execFileSyncImpl = execFileSync,
} = {}) {
  const report = {scope: 'render-preparation', ok: false, checkedAt: new Date().toISOString(),
    workspace: path.resolve(workspace), repository, inputRepository, ref,
    authSource: 'gh-cli', checks: [], baseline: null};
  const add = (name, ok, code, message) => report.checks.push({name, ok, code, message});
  if (!repositoryPattern.test(repository ?? '') || !repositoryPattern.test(inputRepository ?? '')
    || !/^\d+$/.test(String(baselineRun ?? '')) || repository === inputRepository) {
    add('arguments', false, 'render-preflight-arguments-invalid',
      '必须明确主仓库、独立输入仓库及上一条成功完整渲染的 Run ID。');
    return report;
  }
  const gitEnvironment = {...environment};
  delete gitEnvironment.GITHUB_TOKEN;
  delete gitEnvironment.GH_TOKEN;
  const git = args => execFileSyncImpl('git', ['-C', report.workspace, ...args], {
    encoding: 'utf8', env: gitEnvironment, stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000,
  }).trim();
  try {
    git(['check-ref-format', `refs/heads/${ref}`]);
    const origin = git(['remote', 'get-url', 'origin']);
    const https = origin.match(/^https:\/\/github\.com\/([^?#]+?)(?:\.git)?\/?$/i);
    const ssh = origin.match(/^git@github\.com:([^?#]+?)(?:\.git)?$/i);
    if ((https?.[1] ?? ssh?.[1])?.toLowerCase() !== repository.toLowerCase()) {
      add('origin', false, 'render-preflight-origin-mismatch', 'origin 与指定主代码仓库不一致，未更新引用。');
      return report;
    }
  } catch {
    add('origin', false, 'render-preflight-git-unavailable', '无法核实 Git 工作区、分支名称或 origin。');
    return report;
  }
  const auth = resolveGitHubToken({environment, authSource: 'gh-cli', execFileSyncImpl});
  if (auth.issue) {
    add('credential-read', false, auth.issue.code, auth.issue.message);
    return report;
  }
  const request = async (resource, name) => {
    try {
      const response = await fetchImpl(`https://api.github.com${resource}`, {
        headers: {Accept: 'application/vnd.github+json', Authorization: `Bearer ${auth.token}`,
          'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'video-production-harness'},
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) {
        const code = response.status === 401 ? 'github-auth-rejected'
          : response.status === 403 ? 'github-permission-denied' : 'github-resource-unavailable';
        add(name, false, code, `GitHub API 返回 HTTP ${response.status}。`);
        return null;
      }
      const payload = await response.json();
      add(name, true, null, '实际 API 检查通过。');
      return payload;
    } catch {
      add(name, false, 'github-network-unavailable',
        '当前进程无法完成 GitHub 网络请求；请在获准宿主环境复核，不据此重新登录。');
      return null;
    }
  };
  if (!await request('/user', 'authentication')) return report;
  for (const [repo, name] of [[repository, 'code-repository'], [inputRepository, 'input-repository']]) {
    const value = await request(`/repos/${repo}`, name);
    if (!value) return report;
    if (value.permissions?.push !== true) {
      add(`${name}-write`, false, 'github-write-permission-unverified', '仓库未确认当前账号具有写权限。');
      return report;
    }
    add(`${name}-write`, true, null, '仓库确认写权限。');
  }
  const workflow = await request(`/repos/${repository}/actions/workflows/render-video.yml`, 'render-workflow');
  if (!workflow) return report;
  if (workflow.state !== 'active') {
    add('render-workflow-active', false, 'render-workflow-inactive', '完整渲染 Workflow 未启用。');
    return report;
  }
  const run = await request(`/repos/${repository}/actions/runs/${baselineRun}`, 'baseline-run');
  if (!run) return report;
  if (run.conclusion !== 'success' || run.workflow_id !== workflow.id || !shaPattern.test(run.head_sha ?? '')) {
    add('baseline-run-valid', false, 'render-baseline-run-invalid', '基线必须是指定仓库完整渲染 Workflow 的成功 Run。');
    return report;
  }
  const remote = await request(`/repos/${repository}/git/ref/heads/${encodeURIComponent(ref)}`, 'dispatch-ref');
  if (!remote || !shaPattern.test(remote.object?.sha ?? '')) {
    if (remote) add('dispatch-ref-valid', false, 'render-ref-invalid', '远端分支没有有效提交 SHA。');
    return report;
  }
  try {
    git(['fetch', '--no-tags', 'origin', `refs/heads/${ref}`]);
    const fetchedSha = git(['rev-parse', 'FETCH_HEAD']);
    if (fetchedSha !== remote.object.sha) {
      add('fresh-ref', false, 'render-ref-changed', 'API 查询与 fetch 之间远端分支已变化，请重新预检。');
      return report;
    }
    report.baseline = {runId: String(baselineRun), successfulCommit: run.head_sha,
      remoteCommit: fetchedSha, localCommit: git(['rev-parse', 'HEAD'])};
  } catch {
    add('fresh-ref', false, 'render-ref-fetch-unavailable',
      '无法在当前进程更新远端引用；请核实宿主权限、网络及 Git 认证。');
    return report;
  }
  for (const [target, name] of [[report.baseline.remoteCommit, 'remote-code-baseline'], ['HEAD', 'local-code-baseline']]) {
    try {
      git(['merge-base', '--is-ancestor', run.head_sha, target]);
      add(name, true, null, '当前代码包含指定成功 Run 的提交。');
    } catch {
      add(name, false, 'render-code-baseline-missing',
        '当前代码未包含成功 Run 的修复，请先整合或从已验证远端基线准备独立交付。');
    }
  }
  report.ok = report.checks.every(item => item.ok);
  return report;
}

async function main(args) {
  const options = {};
  const names = {'--workspace': 'workspace', '--repository': 'repository',
    '--input-repository': 'inputRepository', '--ref': 'ref', '--baseline-run': 'baselineRun'};
  for (let index = 0; index < args.length; index += 2) {
    if (!names[args[index]] || !args[index + 1]) throw new Error('参数必须使用 --workspace、--repository、--input-repository、--ref、--baseline-run 及其值。');
    options[names[args[index]]] = args[index + 1];
  }
  const report = await checkRenderPreparation(options);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.ok ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(() => {
    console.error('渲染准备检查无法执行；请检查参数和执行环境。');
    process.exitCode = 1;
  });
}
