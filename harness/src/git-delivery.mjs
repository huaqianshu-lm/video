import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readGitHubActionsConfig, validateRenderInputUrl } from "./github-config.mjs";
import { validateRenderInputDelivery } from "./render-input.mjs";

const RENDER_RELEVANT_PREFIXES = [
  "src/",
  "harness/src/",
  "styles/",
  ".github/workflows/",
];
const RENDER_RELEVANT_FILES = new Set([
  "package.json",
  "package-lock.json",
  "remotion.config.ts",
]);
const RENDER_ALLOWED_FILES = new Set([
  "src/TemplateVideo.tsx",
  "src/HelloIntro.tsx",
  "src/index.ts",
  "harness/src/cli.mjs",
  "harness/src/render-input.mjs",
  "harness/src/remote-executor.mjs",
  "harness/src/diagnostics.mjs",
  "harness/src/github-auth.mjs",
  "harness/src/github-config.mjs",
  "harness/src/remote-jobs.mjs",
  "harness/src/adapters.mjs",
  "harness/src/adoption.mjs",
  "harness/src/agent-jobs.mjs",
  "harness/src/artifacts.mjs",
  "harness/src/asset-bundler.mjs",
  "harness/src/batches.mjs",
  "harness/src/context.mjs",
  "harness/src/fingerprints.mjs",
  "harness/src/git-delivery.mjs",
  "harness/src/plans.mjs",
  "harness/src/project-files.mjs",
  "harness/src/project-view.mjs",
  "harness/src/remotion-alignment.mjs",
  "harness/src/remotion-executor.mjs",
  "harness/src/reports.mjs",
  "harness/src/runner.mjs",
  "harness/src/source-import.mjs",
  "harness/src/storage.mjs",
  "harness/src/validation.mjs",
  "harness/src/web/legacy-server.mjs",
  "harness/src/web/routes/projects.mjs",
  "harness/src/web/services/project-actions.mjs",
  "harness/src/workflows/registry.mjs",
  "harness/src/workflows/narrated-tutorial-v1.mjs",
  "harness/src/workflows/product-promo-v1.mjs",
  "harness/src/workflows/product-promo-validation.mjs",
  "src/components/promo/index.ts",
  "src/components/promo/PromoComposition.tsx",
  "src/components/promo/PromoPrimitives.tsx",
  "src/lib/promoTiming.ts",
  "src/lib/promoTypes.ts",
  ".github/workflows/smoke-test-video.yml",
  ".github/workflows/render-video.yml",
  "package.json",
  "package-lock.json",
  "remotion.config.ts",
]);

function gitCommand(workspaceRoot, args, { trim = true } = {}) {
  const output = execFileSync("git", ["-C", workspaceRoot, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return trim ? output.trim() : output;
}

export function isGitWorkspace(workspaceRoot) {
  if (typeof workspaceRoot !== "string" || !workspaceRoot.trim()) return false;
  try {
    return Boolean(gitCommand(workspaceRoot, ["rev-parse", "--show-toplevel"]));
  } catch {
    return false;
  }
}

export function localGitCommit(workspaceRoot, ref = "HEAD") {
  try {
    return gitCommand(workspaceRoot, ["rev-parse", "--verify", `${ref}^{commit}`]);
  } catch {
    return null;
  }
}

function parseStatusEntry(line) {
  const status = line.slice(0, 2);
  const value = line.slice(3);
  const renameSeparator = value.indexOf(" -> ");
  if (renameSeparator >= 0) {
    return {
      status,
      indexStatus: status[0] ?? " ",
      worktreeStatus: status[1] ?? " ",
      originalPath: value.slice(0, renameSeparator),
      path: value.slice(renameSeparator + 4),
    };
  }
  return {
    status,
    indexStatus: status[0] ?? " ",
    worktreeStatus: status[1] ?? " ",
    originalPath: null,
    path: value,
  };
}

function isRenderRelevantPath(relativePath) {
  return RENDER_RELEVANT_FILES.has(relativePath)
    || RENDER_RELEVANT_PREFIXES.some((prefix) => relativePath === prefix.slice(0, -1) || relativePath.startsWith(prefix));
}

export function renderRequiredPaths(project) {
  return [
    "src/TemplateVideo.tsx",
    "src/lib/timing.ts",
    "harness/src/cli.mjs",
    "harness/src/render-input.mjs",
    "harness/src/remote-executor.mjs",
    "harness/src/diagnostics.mjs",
    "harness/src/github-auth.mjs",
    "harness/src/github-config.mjs",
    "package.json",
    "package-lock.json",
    ".github/workflows/smoke-test-video.yml",
    ".github/workflows/render-video.yml",
  ];
}

function isAutoCommitPath(relativePath, requiredPaths) {
  return requiredPaths.includes(relativePath)
    || RENDER_ALLOWED_FILES.has(relativePath);
}

function sha256File(workspaceRoot, relativePath) {
  const filePath = path.join(workspaceRoot, relativePath);
  try {
    if (!fs.lstatSync(filePath).isFile()) return null;
    return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
  } catch {
    return null;
  }
}

function sha256AbsoluteFile(filePath) {
  try {
    if (!fs.lstatSync(filePath).isFile()) return null;
    return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
  } catch {
    return null;
  }
}

function planIdFor(plan) {
  return createHash("sha256").update(JSON.stringify({
    version: 1,
    branch: plan.branch,
    ref: plan.ref,
    headCommit: plan.headCommit,
    requiredPaths: plan.requiredPaths,
    commitPaths: plan.commitPaths,
    outOfScopePaths: plan.outOfScopePaths,
    fileHashes: plan.fileHashes,
    fileStatuses: plan.fileStatuses,
    inputBinding: plan.inputBinding,
  })).digest("hex");
}

function currentBranchFor(workspaceRoot) {
  try {
    return gitCommand(workspaceRoot, ["symbolic-ref", "--quiet", "--short", "HEAD"]);
  } catch {
    return "";
  }
}

function statusEntriesFor(workspaceRoot) {
  return gitCommand(workspaceRoot, ["status", "--porcelain=v1", "--untracked-files=all"], { trim: false })
    .split(/\r?\n/)
    .filter(Boolean)
    .map(parseStatusEntry);
}

function pathsForStatusEntry(entry) {
  return [entry.path, entry.originalPath].filter(Boolean);
}

function statusDetailsForPath(statusEntries, relativePath) {
  return statusEntries
    .filter((entry) => pathsForStatusEntry(entry).includes(relativePath))
    .map((entry) => ({
      status: entry.status,
      path: entry.path,
      originalPath: entry.originalPath,
    }))
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}

function requiredPathProblems(workspaceRoot, requiredPaths, statusEntries) {
  const problems = [];
  for (const relativePath of requiredPaths) {
    let tracked = true;
    try {
      gitCommand(workspaceRoot, ["ls-files", "--error-unmatch", "--", relativePath]);
    } catch {
      tracked = false;
      problems.push({
        code: "git-render-commit-required-path-missing",
        message: `渲染所需文件未被 Git 跟踪：${relativePath}`,
      });
    }

    const status = statusDetailsForPath(statusEntries, relativePath);
    if (status.some((entry) => [...entry.status].some((value) => ["D", "R", "C", "T", "U"].includes(value)))) {
      problems.push({
        code: "git-render-commit-deletion-forbidden",
        message: `渲染所需文件存在删除、重命名或类型变化：${relativePath}`,
      });
    }

    const absolutePath = path.join(workspaceRoot, relativePath);
    let isRegularFile = false;
    try {
      isRegularFile = fs.lstatSync(absolutePath).isFile();
    } catch {
      isRegularFile = false;
    }
    if (!isRegularFile) {
      problems.push({
        code: "git-render-commit-required-path-missing",
        message: `渲染所需文件缺失或不是普通文件：${relativePath}`,
      });
    }
    if (tracked && sha256File(workspaceRoot, relativePath) === null) {
      problems.push({
        code: "git-render-commit-path-status-invalid",
        message: `渲染所需文件无法读取有效哈希：${relativePath}`,
      });
    }
  }
  return problems;
}

function throwRequiredPathProblems(problems) {
  if (problems.length === 0) return;
  const errorCode = problems.some((problem) => problem.code === "git-render-commit-deletion-forbidden")
    ? "git-render-commit-deletion-forbidden"
    : problems.some((problem) => problem.code === "git-render-commit-path-status-invalid")
      ? "git-render-commit-path-status-invalid"
      : "git-render-commit-required-path-missing";
  const error = commitError([...new Set(problems.map((problem) => problem.message))].join("；"), errorCode);
  error.issues = [...new Set(problems.map((problem) => problem.message))];
  throw error;
}

function readInputBinding(workspaceRoot, slug, environment) {
  const inputRoot = path.resolve(environment.HARNESS_RENDER_INPUT_DIR ?? path.join(workspaceRoot, "local", "render-input"));
  const bindingPath = path.join(inputRoot, `${slug}.delivery.json`);
  let binding = null;
  try {
    if (fs.lstatSync(bindingPath).isFile()) binding = JSON.parse(fs.readFileSync(bindingPath, "utf8"));
  } catch {
    binding = null;
  }
  return {
    videoSlug: slug,
    compositionId: typeof binding?.compositionId === "string" ? binding.compositionId : null,
    renderInputUrl: typeof binding?.url === "string" ? binding.url : null,
    renderInputSha256: typeof binding?.archiveSha256 === "string" ? binding.archiveSha256 : null,
    packageFingerprint: typeof binding?.packageFingerprint === "string" ? binding.packageFingerprint : null,
    deliveryBindingSha256: sha256AbsoluteFile(bindingPath),
    binding,
    inputRoot,
  };
}

function inputBindingIssues(project, environment) {
  const workspaceRoot = path.resolve(project.config.workspaceRoot);
  const slug = project.config.slug;
  const inputBinding = readInputBinding(workspaceRoot, slug, environment);
  const issues = [];
  if (!inputBinding.binding) {
    return { inputBinding, issues: [`缺少 local/render-input/${slug}.delivery.json，请先绑定当前输入包`] };
  }
  const urlIssue = validateRenderInputUrl(inputBinding.renderInputUrl);
  if (urlIssue) issues.push(urlIssue.message);
  const deliveryIssues = validateRenderInputDelivery(project, { inputRoot: inputBinding.inputRoot });
  issues.push(...deliveryIssues);
  return { inputBinding, issues: [...new Set(issues)] };
}

export function buildGitRenderCommitPlan(project, { environment = process.env } = {}) {
  if (typeof project?.config?.workspaceRoot !== "string" || !project.config.workspaceRoot.trim()) {
    const error = new Error("缺少视频工作区路径，无法准备 Git 渲染交付");
    error.code = "git-render-commit-workspace-invalid";
    throw error;
  }
  const workspaceRoot = path.resolve(project.config.workspaceRoot);
  if (!isGitWorkspace(workspaceRoot)) {
    const error = new Error("渲染工作区不是 Git 仓库，无法准备 Git 渲染交付");
    error.code = "git-render-commit-repository-invalid";
    throw error;
  }
  const branch = currentBranchFor(workspaceRoot);
  if (!branch) {
    const error = new Error("当前工作区处于 detached HEAD，无法自动提交和推送");
    error.code = "git-render-commit-detached-head";
    throw error;
  }
  const config = readGitHubActionsConfig(environment, { currentGitRef: branch, cwd: workspaceRoot });
  const requiredPaths = renderRequiredPaths(project);
  const statusEntries = statusEntriesFor(workspaceRoot);
  throwRequiredPathProblems(requiredPathProblems(workspaceRoot, requiredPaths, statusEntries));
  const relevantEntries = statusEntries.filter((entry) => pathsForStatusEntry(entry).some(isRenderRelevantPath));
  const relevantPaths = [...new Set(relevantEntries.flatMap(pathsForStatusEntry))].sort();
  const commitPaths = [...new Set(relevantEntries
    .map((entry) => entry.path)
    .filter((relativePath) => isAutoCommitPath(relativePath, requiredPaths)))].sort();
  const outOfScopePaths = [...new Set(relevantPaths.filter((relativePath) => !isAutoCommitPath(relativePath, requiredPaths)))].sort();
  const snapshotPaths = [...new Set([...requiredPaths, ...relevantPaths])].sort();
  const inputBinding = readInputBinding(workspaceRoot, project.config.slug, environment);
  const plan = {
    version: 1,
    videoSlug: project.config.slug,
    branch,
    ref: config.ref,
    headCommit: localGitCommit(workspaceRoot),
    requiredPaths,
    commitPaths: [...new Set(commitPaths)],
    outOfScopePaths: [...new Set(outOfScopePaths)],
    fileHashes: Object.fromEntries(snapshotPaths.map((relativePath) => [relativePath, sha256File(workspaceRoot, relativePath)])),
    fileStatuses: Object.fromEntries(snapshotPaths.map((relativePath) => [relativePath, statusDetailsForPath(statusEntries, relativePath)])),
    inputBinding: {
      videoSlug: inputBinding.videoSlug,
      compositionId: inputBinding.compositionId,
      renderInputUrl: inputBinding.renderInputUrl,
      renderInputSha256: inputBinding.renderInputSha256,
      packageFingerprint: inputBinding.packageFingerprint,
      deliveryBindingSha256: inputBinding.deliveryBindingSha256,
    },
  };
  plan.selectedPaths = [...plan.commitPaths];
  plan.compositionId = inputBinding.compositionId;
  plan.renderInputUrl = inputBinding.renderInputUrl;
  plan.renderInputSha256 = inputBinding.renderInputSha256;
  plan.packageFingerprint = inputBinding.packageFingerprint;
  plan.deliveryBindingSha256 = inputBinding.deliveryBindingSha256;
  plan.planId = planIdFor(plan);
  return plan;
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function batchPlanIdFor(plan) {
  return createHash("sha256").update(JSON.stringify({
    version: 1,
    kind: plan.kind,
    workspaceRoot: plan.workspaceRoot,
    branch: plan.branch,
    ref: plan.ref,
    headCommit: plan.headCommit,
    requiredPaths: plan.requiredPaths,
    commitPaths: plan.commitPaths,
    outOfScopePaths: plan.outOfScopePaths,
    fileHashes: plan.fileHashes,
    fileStatuses: plan.fileStatuses,
    videoPlans: plan.videoPlans,
  })).digest("hex");
}

export function buildBatchGitRenderCommitPlan(projects, { environment = process.env } = {}) {
  if (!Array.isArray(projects) || projects.length === 0) {
    throw commitError("批量渲染至少需要一个视频项目", "git-render-batch-projects-required");
  }
  const plans = projects.map((project) => buildGitRenderCommitPlan(project, { environment }));
  const workspaceRoots = uniqueSorted(plans.map((plan) => path.resolve(projects[plans.indexOf(plan)].config.workspaceRoot)));
  if (workspaceRoots.length !== 1) {
    throw commitError("批量渲染交付必须使用同一个 Git 工作区", "git-render-batch-workspace-mismatch");
  }
  const branches = uniqueSorted(plans.map((plan) => plan.branch));
  const refs = uniqueSorted(plans.map((plan) => plan.ref));
  const headCommits = uniqueSorted(plans.map((plan) => plan.headCommit ?? ""));
  if (branches.length !== 1 || refs.length !== 1 || headCommits.length !== 1) {
    throw commitError("批量渲染交付的分支、dispatch ref 或当前提交不一致", "git-render-batch-ref-mismatch");
  }

  const fileHashes = {};
  const fileStatuses = {};
  for (const plan of plans) {
    for (const [relativePath, hash] of Object.entries(plan.fileHashes)) {
      if (Object.hasOwn(fileHashes, relativePath) && fileHashes[relativePath] !== hash) {
        throw commitError(`批量渲染文件快照不一致：${relativePath}`, "git-render-batch-file-snapshot-mismatch");
      }
      fileHashes[relativePath] = hash;
      fileStatuses[relativePath] = plan.fileStatuses[relativePath] ?? [];
    }
  }

  const plan = {
    version: 1,
    kind: "batch-git-render-commit",
    workspaceRoot: workspaceRoots[0],
    branch: branches[0],
    ref: refs[0],
    headCommit: headCommits[0] || null,
    requiredPaths: uniqueSorted(plans.flatMap((item) => item.requiredPaths)),
    commitPaths: uniqueSorted(plans.flatMap((item) => item.commitPaths)),
    selectedPaths: uniqueSorted(plans.flatMap((item) => item.selectedPaths)),
    outOfScopePaths: uniqueSorted(plans.flatMap((item) => item.outOfScopePaths)),
    fileHashes,
    fileStatuses,
    videoPlans: plans.map((item) => ({
      videoSlug: item.videoSlug,
      planId: item.planId,
      compositionId: item.compositionId,
      renderInputUrl: item.renderInputUrl,
      renderInputSha256: item.renderInputSha256,
      packageFingerprint: item.packageFingerprint,
      deliveryBindingSha256: item.deliveryBindingSha256,
    })),
  };
  plan.planId = batchPlanIdFor(plan);
  return plan;
}

function commitError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export function commitAndPushRenderDelivery(
  project,
  {
    environment = process.env,
    commitMessage = `chore: prepare ${project.config.slug} complete render delivery`,
    deliveryPlanId = null,
    selectedPaths = null,
  } = {},
) {
  const workspaceRoot = path.resolve(project.config.workspaceRoot);
  const plan = buildGitRenderCommitPlan(project, { environment });
  if (!deliveryPlanId) {
    throw commitError("缺少交付计划标识，请先展示并确认当前精确文件清单", "git-render-commit-plan-required");
  }
  if (deliveryPlanId !== plan.planId) {
    throw commitError("渲染交付计划已变化，请重新执行预检并确认新的文件清单", "git-render-commit-plan-stale");
  }
  const requestedPaths = Array.isArray(selectedPaths) ? [...new Set(selectedPaths)] : null;
  if (!requestedPaths || JSON.stringify(requestedPaths) !== JSON.stringify(plan.commitPaths)) {
    throw commitError("确认的渲染文件清单与当前交付计划不一致，请重新确认", "git-render-commit-plan-selection-mismatch");
  }
  if (plan.ref !== plan.branch) {
    throw commitError(`dispatch 分支 ${plan.ref} 与当前工作区分支 ${plan.branch} 不一致，无法自动推送`, "git-render-commit-branch-mismatch");
  }
  if (plan.outOfScopePaths.length > 0) {
    throw commitError(`发现未纳入当前视频提交范围的渲染改动：${plan.outOfScopePaths.join("、")}`, "git-render-commit-out-of-scope");
  }
  const currentPlan = buildGitRenderCommitPlan(project, { environment });
  if (currentPlan.planId !== plan.planId) {
    throw commitError("渲染交付计划已变化，请重新执行预检并确认新的文件清单", "git-render-commit-plan-stale");
  }
  const inputBindingResult = inputBindingIssues(project, environment);
  if (inputBindingResult.issues.length > 0) {
    const error = commitError(`当前视频输入包交付绑定已失效：${inputBindingResult.issues.join("；")}`, "git-render-commit-input-binding-invalid");
    error.issues = inputBindingResult.issues;
    throw error;
  }
  if (plan.commitPaths.length === 0) {
    const commit = localGitCommit(workspaceRoot);
    return { status: "unchanged", commit, ...plan };
  }

  try {
    execFileSync("git", ["-C", workspaceRoot, "add", "--", ...plan.commitPaths], { stdio: ["ignore", "pipe", "pipe"] });
    execFileSync("git", ["-C", workspaceRoot, "commit", "--only", "-m", commitMessage, "--", ...plan.commitPaths], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    const commit = localGitCommit(workspaceRoot);
    if (!commit) throw commitError("定向提交完成后无法解析本地提交", "git-render-commit-missing");
    execFileSync("git", ["-C", workspaceRoot, "push", "origin", `HEAD:${plan.branch}`], { stdio: ["ignore", "pipe", "pipe"] });
    const remote = gitCommand(workspaceRoot, ["ls-remote", "--heads", "origin", plan.branch]).split(/\s+/)[0] ?? "";
    if (remote !== commit) {
      throw commitError(`推送完成后远程分支 ${plan.branch} 未指向本次提交`, "git-render-commit-remote-mismatch");
    }
    return { status: "committed", commit, ...plan };
  } catch (cause) {
    if (cause?.code?.startsWith("git-render-commit-")) throw cause;
    throw commitError(`渲染交付 commit/push 失败：${cause instanceof Error ? cause.message : String(cause)}`, "git-render-commit-push-failed");
  }
}

export function commitAndPushBatchRenderDelivery(
  projects,
  {
    environment = process.env,
    commitMessage = "chore: prepare batch complete render delivery",
    deliveryPlanId = null,
    selectedPaths = null,
  } = {},
) {
  const plan = buildBatchGitRenderCommitPlan(projects, { environment });
  if (!deliveryPlanId) {
    throw commitError("缺少批量交付计划标识，请先展示并确认当前精确文件清单", "git-render-batch-plan-required");
  }
  if (deliveryPlanId !== plan.planId) {
    throw commitError("批量渲染交付计划已变化，请重新执行预检并确认新的文件清单", "git-render-batch-plan-stale");
  }
  const requestedPaths = Array.isArray(selectedPaths) ? uniqueSorted(selectedPaths) : null;
  if (!requestedPaths || JSON.stringify(requestedPaths) !== JSON.stringify(plan.selectedPaths)) {
    throw commitError("确认的批量渲染文件清单与当前交付计划不一致，请重新确认", "git-render-batch-plan-selection-mismatch");
  }
  if (plan.ref !== plan.branch) {
    throw commitError(`dispatch 分支 ${plan.ref} 与当前工作区分支 ${plan.branch} 不一致，无法自动推送`, "git-render-batch-branch-mismatch");
  }
  if (plan.outOfScopePaths.length > 0) {
    throw commitError(`发现未纳入批量渲染提交范围的改动：${plan.outOfScopePaths.join("、")}`, "git-render-batch-out-of-scope");
  }
  const currentPlan = buildBatchGitRenderCommitPlan(projects, { environment });
  if (currentPlan.planId !== plan.planId) {
    throw commitError("批量渲染交付计划已变化，请重新执行预检并确认新的文件清单", "git-render-batch-plan-stale");
  }
  if (plan.commitPaths.length === 0) {
    return { status: "unchanged", commit: localGitCommit(plan.workspaceRoot), ...plan };
  }

  try {
    execFileSync("git", ["-C", plan.workspaceRoot, "add", "--", ...plan.commitPaths], { stdio: ["ignore", "pipe", "pipe"] });
    execFileSync("git", ["-C", plan.workspaceRoot, "commit", "--only", "-m", commitMessage, "--", ...plan.commitPaths], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    const commit = localGitCommit(plan.workspaceRoot);
    if (!commit) throw commitError("批量定向提交完成后无法解析本地提交", "git-render-batch-commit-missing");
    execFileSync("git", ["-C", plan.workspaceRoot, "push", "origin", `HEAD:${plan.branch}`], { stdio: ["ignore", "pipe", "pipe"] });
    const remote = gitCommand(plan.workspaceRoot, ["ls-remote", "--heads", "origin", plan.branch]).split(/\s+/)[0] ?? "";
    if (remote !== commit) {
      throw commitError(`推送完成后远程分支 ${plan.branch} 未指向本次批量提交`, "git-render-batch-remote-mismatch");
    }
    return { status: "committed", commit, ...plan };
  } catch (cause) {
    if (cause?.code?.startsWith("git-render-batch-")) throw cause;
    throw commitError(`批量渲染交付 commit/push 失败：${cause instanceof Error ? cause.message : String(cause)}`, "git-render-batch-commit-push-failed");
  }
}

function addIssue(issues, message) {
  if (!issues.includes(message)) issues.push(message);
}

export function validateGitRenderDelivery(project, { environment = process.env, requireRepository = true } = {}) {
  if (typeof project?.config?.workspaceRoot !== "string" || !project.config.workspaceRoot.trim()) {
    return requireRepository ? ["缺少视频工作区路径，无法确认远程分支交付状态"] : [];
  }
  const workspaceRoot = path.resolve(project.config.workspaceRoot);
  if (!isGitWorkspace(workspaceRoot)) {
    if (requireRepository) return ["渲染工作区不是 Git 仓库，无法确认远程分支交付状态"];
    return [];
  }

  const issues = [];
  const requiredPaths = renderRequiredPaths(project);
  let currentBranch = "";
  try {
    currentBranch = gitCommand(workspaceRoot, ["symbolic-ref", "--quiet", "--short", "HEAD"]);
  } catch {
    addIssue(issues, "当前工作区处于 detached HEAD，无法确认 dispatch 分支");
  }

  let statusLines = [];
  try {
    statusLines = gitCommand(workspaceRoot, ["status", "--porcelain=v1", "--untracked-files=all"], { trim: false })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    addIssue(issues, "无法读取 Git 工作区状态");
  }
  const statusEntries = statusLines.map(parseStatusEntry);
  for (const entry of statusEntries) {
    for (const relativePath of pathsForStatusEntry(entry)) {
      if (isRenderRelevantPath(relativePath)) {
        addIssue(issues, `渲染相关文件存在未提交修改：${relativePath}`);
      }
    }
  }

  for (const problem of requiredPathProblems(workspaceRoot, requiredPaths, statusEntries)) {
    addIssue(issues, problem.message);
  }

  const config = readGitHubActionsConfig(environment, { currentGitRef: currentBranch, cwd: workspaceRoot });
  if (!config.ref.trim()) {
    addIssue(issues, "没有可用的 GitHub Actions dispatch 分支");
    return issues;
  }
  if (!currentBranch && !environment.HARNESS_GITHUB_REF) {
    addIssue(issues, `dispatch 分支 ${config.ref} 无法对应当前工作区分支`);
  }

  if (!localGitCommit(workspaceRoot, config.ref)) {
    addIssue(issues, `无法在本地解析 dispatch 分支：${config.ref}`);
    return issues;
  }

  for (const relativePath of requiredPaths) {
    try {
      gitCommand(workspaceRoot, ["ls-files", "--error-unmatch", "--", relativePath]);
    } catch {
      addIssue(issues, `渲染所需文件未被 Git 跟踪：${relativePath}`);
      continue;
    }

    let targetBlob;
    try {
      targetBlob = gitCommand(workspaceRoot, ["rev-parse", `${config.ref}:${relativePath}`]);
    } catch {
      addIssue(issues, `dispatch 分支 ${config.ref} 不包含文件：${relativePath}`);
      continue;
    }
    let headBlob;
    try {
      headBlob = gitCommand(workspaceRoot, ["rev-parse", `HEAD:${relativePath}`]);
    } catch {
      addIssue(issues, `当前提交不包含渲染文件：${relativePath}`);
      continue;
    }
    if (targetBlob !== headBlob) {
      addIssue(issues, `dispatch 分支 ${config.ref} 与当前提交的文件不一致：${relativePath}`);
    }
  }

  return issues;
}
