export function resolveRenderBackend({ backend, session, batchId, remoteOptions = false } = {}) {
  if (backend !== undefined && !['local', 'github'].includes(backend)) {
    throw Object.assign(new Error('渲染方式只支持 local 或 github。'), { code: 'render-backend-invalid' });
  }
  const saved = session ? session.backend ?? 'github' : null;
  const selected = backend ?? saved ?? (batchId || remoteOptions ? 'github' : 'local');
  if (!['local', 'github'].includes(selected)) throw Object.assign(new Error('已保存的渲染方式无效，停止执行。'), {code: 'render-backend-invalid'});
  if (batchId && selected !== 'github') {
    throw Object.assign(new Error('批量渲染只允许 GitHub，不能使用本地渲染。'), { code: 'batch-local-render-disabled' });
  }
  return selected;
}
