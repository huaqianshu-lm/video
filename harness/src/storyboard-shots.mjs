// Data-only Shot validation and time mapping. Never generates or constrains pictures.
const problem = (message, sceneId, shotId) => ({code: 'storyboard-shot-invalid', severity: 'error', stage: 'storyboard', message, sceneId, shotId});
const sameIds = (a, b) => Array.isArray(a) && new Set(a).size === a.length && JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
export function validateStoryboardShots(board) {
  if (board.schemaVersion !== 3 && !board.scenes.some(s => s.shots)) return [];
  const issues = [], seen = new Set(), elements = new Map(board.scenes.flatMap(s => s.elements.map(e => [e.id, e])));
  for (const [sceneIndex, scene] of board.scenes.entries()) {
    const fail = (message, id) => issues.push(problem(message, scene.id, id));
    if (!Array.isArray(scene.shots) || !scene.shots.length) { fail(`Scene ${scene.id} 缺少 Shot`); continue; }
    const local = new Map(scene.shots.map(s => [s.id, s]));
    let previousAt = -1;
    for (const [i, shot] of scene.shots.entries()) {
      if (seen.has(shot.id)) fail(`Shot ${shot.id} ID 重复`, shot.id);
      seen.add(shot.id);
      for (const field of ['id','purpose','framing','composition','viewpoint','focus','camera','entryState','exitState','implementation']) if (typeof shot[field] !== 'string' || !shot[field].trim()) fail(`Shot ${shot.id} 缺少 ${field}`, shot.id);
      const visible = shot.visibleElementIds ?? [];
      if (!visible.length || new Set(visible).size !== visible.length) fail(`Shot ${shot.id} 可见对象缺失或重复`, shot.id);
      for (const id of visible) {
        const element = elements.get(id);
        if (!element) fail(`Shot ${shot.id} 引用未知对象 ${id}`, shot.id);
        else if (element.parentId && !visible.includes(element.parentId)) fail(`Shot ${shot.id} 子对象 ${id} 缺少可见父容器`, shot.id);
        // A future declaration is never a usable identity; earlier retained objects are allowed.
        if (!board.scenes.slice(0, sceneIndex + 1).some(s => s.elements.some(e => e.id === id))) fail(`Shot ${shot.id} 引用了未来 Scene 的对象 ${id}`, shot.id);
      }
      if (i === 0) {
        if (JSON.stringify(shot.start) !== JSON.stringify({type:'scene-start'})) fail(`Shot ${shot.id} 首镜必须从 Scene 开始`, shot.id);
      } else {
        const ref = shot.start;
        const text = scene.narration ?? '';
        let at = -1, from = 0;
        if (ref?.type === 'cue' && ref.anchor?.trim() && Number.isInteger(ref.occurrence) && ref.occurrence > 0) {
          for (let n = 0; n < ref.occurrence; n++) {at = text.indexOf(ref.anchor, from); if (at < 0) break; from = at + ref.anchor.length;}
        }
        if (at < 0 || at <= previousAt) fail(`Shot ${shot.id} 起点锚点缺失、重复或无序`, shot.id);
        previousAt = at;
      }
      const next = scene.shots[i + 1];
      const target = next ? {type:'shot', id:next.id} : board.scenes[sceneIndex + 1] ? {type:'scene', id:board.scenes[sceneIndex + 1].id} : {type:'end', id:null};
      const end = next ? {type:'next-shot', shotId:next.id} : {type:'scene-end'};
      if (shot.end?.type !== end.type || shot.end?.shotId !== end.shotId) fail(`Shot ${shot.id} 终点必须衔接下一镜头或 Scene 结束`, shot.id);
      const transition = shot.transitionToNext;
      if (!transition || transition.target?.type !== target.type || transition.target?.id !== target.id || !transition.mechanism?.trim() || !transition.reason?.trim()) fail(`Shot ${shot.id} 衔接目标或依据无效`, shot.id);
      const nextVisible = (next ?? board.scenes[sceneIndex + 1]?.shots?.[0])?.visibleElementIds ?? [];
      const retained = visible.filter(id => nextVisible.includes(id));
      if (!sameIds(transition?.retainedElementIds, retained) || !sameIds(transition?.exitingElementIds, visible.filter(id => !retained.includes(id)))) fail(`Shot ${shot.id} 延续／退出对象未对应相邻镜头`, shot.id);
    }
    let previousShotIndex = -1;
    for (const event of scene.events) {
      const shot = local.get(event.shotId), index = scene.shots.indexOf(shot);
      if (!shot || index < previousShotIndex) fail(`Event ${event.id} Shot 归属缺失或顺序错误`, event.shotId);
      previousShotIndex = index;
      if (shot && event.execution.elements.some(id => !shot.visibleElementIds.includes(id))) fail(`Event ${event.id} 操作对象不在所属 Shot 可见清单`, shot.id);
    }
  }
  return issues;
}

export function resolveShotRanges(scene, timedScene, anchorFrame) {
  if (!scene.shots) return [];
  const starts = scene.shots.map((shot, i) => i === 0 ? timedScene.startFrame : anchorFrame(shot.start, `Shot ${shot.id}`, true));
  return scene.shots.map((shot, i) => {
    const startFrame = starts[i], endFrame = starts[i + 1] ?? timedScene.endFrame;
    if (!Number.isInteger(startFrame) || !Number.isInteger(endFrame) || startFrame < timedScene.startFrame || endFrame > timedScene.endFrame || endFrame <= startFrame) throw new Error(`Shot ${shot.id} 区间空、反向、重叠或越出 Scene`);
    return {id:shot.id, sceneId:scene.id, startFrame, endFrame, visibleElementIds:shot.visibleElementIds, transitionToNext:shot.transitionToNext};
  });
}

export function validateTimedShots(board, timingScenes, events, intervals = null) {
  const shots = [];
  for (const scene of board.scenes) {
    if (!scene.shots) continue;
    const timed = timingScenes.find(s => s.sceneId === scene.id);
    if (!timed || timed.shots?.length !== scene.shots.length) throw new Error(`Scene ${scene.id} 缺少真实 Shot 时间`);
    for (const [i, range] of timed.shots.entries()) {
      if (range.id !== scene.shots[i].id || !Number.isInteger(range.startFrame) || !Number.isInteger(range.endFrame) || range.endFrame <= range.startFrame || range.startFrame !== (i === 0 ? timed.startFrame : timed.shots[i - 1].endFrame) || (i === timed.shots.length - 1 && range.endFrame !== timed.endFrame)) throw new Error(`Shot ${range.id} 未连续完整覆盖 Scene`);
      shots.push(range);
      if (intervals) for (const id of scene.shots[i].visibleElementIds) {
        const life = intervals.get(id);
        if (!life || life.start >= range.endFrame || life.end <= range.startFrame) throw new Error(`Shot ${range.id} 对象 ${id} 生命周期与镜头无交集`);
      }
      for (const event of events.values()) if (event.sceneId === scene.id && event.shotId === range.id && (event.start < range.startFrame || event.complete >= range.endFrame)) throw new Error(`Event ${event.id} 动作越出所属 Shot ${range.id}`);
    }
  }
  return shots;
}
