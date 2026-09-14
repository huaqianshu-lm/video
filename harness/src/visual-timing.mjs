export function validateVisualBindings(bindings) {
  const issues = [];
  const byId = new Map();

  for (const binding of bindings ?? []) {
    if (!binding || typeof binding.id !== "string" || !binding.id.trim()) {
      issues.push({ code: "visual-binding-id-invalid", message: "视觉事件缺少有效 ID。" });
      continue;
    }
    if (byId.has(binding.id)) {
      issues.push({ code: "visual-binding-id-duplicate", message: `视觉事件 ID 重复：${binding.id}。` });
      continue;
    }
    byId.set(binding.id, binding);
    if (!binding.source && (!Array.isArray(binding.dependsOn) || binding.dependsOn.length === 0)) {
      issues.push({ code: "visual-binding-source-missing", message: `视觉事件 ${binding.id} 缺少来源或依赖项。` });
    }
    if (binding.source && (!Number.isInteger(binding.atFrame) || binding.atFrame < 0)) {
      issues.push({ code: "visual-binding-frame-invalid", message: `视觉事件 ${binding.id} 缺少有效开始帧。` });
    }
  }

  const visiting = new Set();
  const visited = new Set();
  const resolve = (id) => {
    if (visited.has(id)) return byId.get(id)?.atFrame ?? null;
    if (visiting.has(id)) {
      issues.push({ code: "visual-binding-cycle", message: `视觉事件存在循环依赖：${id}。` });
      return null;
    }
    const binding = byId.get(id);
    if (!binding) return null;
    visiting.add(id);
    let latest = binding.source ? binding.atFrame : null;
    for (const dependencyId of binding.dependsOn ?? []) {
      if (!byId.has(dependencyId)) {
        issues.push({ code: "visual-binding-dependency-missing", message: `视觉事件 ${id} 依赖不存在：${dependencyId}。` });
        continue;
      }
      const dependencyFrame = resolve(dependencyId);
      if (typeof dependencyFrame === "number") latest = Math.max(latest ?? 0, dependencyFrame);
    }
    visiting.delete(id);
    visited.add(id);
    if (typeof binding.atFrame !== "number" || !Number.isInteger(binding.atFrame) || binding.atFrame < 0) return latest;
    if (typeof latest === "number" && binding.atFrame < latest) {
      issues.push({ code: "visual-binding-early", message: `视觉事件 ${id} 早于依赖项开始：${binding.atFrame} < ${latest}。` });
    }
    return binding.atFrame;
  };

  for (const binding of byId.values()) resolve(binding.id);
  return issues;
}
