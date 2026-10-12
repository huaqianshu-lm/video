import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { validateStoryboardDesign, validateStoryboardDesignAudit, resolveStoryboardTiming, storyboardSchemaVersion, STORYBOARD_QUALITY_CHECKS } from "../src/storyboard-design.mjs";

const sample = JSON.parse(fs.readFileSync(new URL("../../templates/video-production/storyboard-v2.json", import.meta.url)));
const board = () => structuredClone(sample);
const code = value => validateStoryboardDesign(value).map(i => i.message).join("；");
const timed = () => [{ sceneId: "01", startFrame: 0, endFrame: 120, events: [{ id: "task-start", atFrame: 10 }, { id: "task-complete", atFrame: 70 }] }];

test("request exists before a distinct result, with half-open parent and child ranges", () => {
  assert.deepEqual(validateStoryboardDesign(board()), []);
  const result = resolveStoryboardTiming(board(), timed());
  assert.deepEqual(result.elements.map(e => [e.id, e.start, e.end]), [["task-root", 0, 120], ["task-request", 10, 82], ["task-result", 82, 120]]);
});

for (const [name, mutate, expected] of [
  ["unknown boundary", b => b.scenes[0].elements[1].exit.id = "missing", /不存在或无效/],
  ["reversed interval", b => b.scenes[0].elements[1].exit = b.scenes[0].elements[1].enter, /反向或为空/],
  ["child outside parent", b => b.scenes[0].elements[0].enter = {type:"event",id:"task-start",edge:"complete"}, /越出父对象/],
  ["parent cycle", b => b.scenes[0].elements[0].parentId = "task-root", /循环/],
  ["future result leaked", b => b.scenes[0].elements[2].enter = {type:"event",id:"task-start",edge:"start"}, /生命周期|重叠/],
  ["result identity confused", b => b.scenes[0].elements[2].role = "request", /身份不明确/],
  ["unknown action object", b => b.scenes[0].events[0].execution.elements = ["undeclared"], /不存在的元素/],
  ["show contradicts entry", b => b.scenes[0].elements[1].enter = {type:"scene",id:"01",edge:"start"}, /show.*进入边界/],
  ["path without geometry", b => b.scenes[0].elements[1].type = "path", /几何关系/],
  ["unscoped fixed title", b => {b.scenes[0].elements[0].role="context-title";}, /全片常驻/],
  ["cross-scene duplicate identity", b => {b.scenes[0].elements.push(structuredClone(b.scenes[0].elements[0]));}, /全片 ID 重复/],
  ["layout without actual bounds", b => {delete b.scenes[0].elements[1].layout.width;}, /有效 box/],
  ["group text hidden from output", b => {b.scenes[0].elements[0].text="未声明标签";}, /group 文字/],
  ["path reveal on a rectangle", b => {b.scenes[0].events[0].execution.capability="path-reveal";}, /不是 path/],
  ["invalid path geometry", b => {b.scenes[0].elements[1].type="path";b.scenes[0].elements[1].geometry="invalid";}, /几何关系无效/],
  ["discontinuous movement", b => {b.scenes[0].events[0].execution={capability:"move",elements:["task-root"],durationFrames:12,from:{x:20,y:0},to:{x:50,y:0}};}, /不连续/],
]) test(`rejects ${name}`, () => { const b = board(); mutate(b); assert.match(code(b), expected); });

test("real action overlap and scene overflow are rejected rather than compressed", () => {
  const t = timed(); t[0].events[1].atFrame = 15;
  assert.throws(() => resolveStoryboardTiming(board(), t), /区间重叠/);
  t[0].events[1].atFrame = 115;
  assert.throws(() => resolveStoryboardTiming(board(), t), /越出真实 Scene/);
});

test("all event checks must refer to the same design input and declared objects", () => {
  const b = board(), versions = { inputVersion: "a".repeat(64), storyboardFingerprint: "b".repeat(64), narrationFingerprint: "c".repeat(64) };
  const audit = { ruleVersion:"storyboard-execution-quality-v1",videoSlug:b.videoSlug,...versions, checks:b.scenes.flatMap(s => s.events.flatMap(e => STORYBOARD_QUALITY_CHECKS.map(checkId => ({sceneId:s.id,eventId:e.id,checkId,result:"pass",elementIds:[],note:"隔离测试方案检查；不表示实际观看"})))) };
  assert.deepEqual(validateStoryboardDesignAudit(b,audit,versions),[]);
  const stale=structuredClone(audit);stale.inputVersion="d".repeat(64);assert.ok(validateStoryboardDesignAudit(b,stale,versions).some(i=>i.code==="storyboard-audit-stale"));
  const missing=structuredClone(audit);missing.checks.pop();assert.ok(validateStoryboardDesignAudit(b,missing,versions).some(i=>i.code==="storyboard-audit-coverage"));
  const duplicate=structuredClone(audit);duplicate.checks.push(duplicate.checks[0]);assert.ok(validateStoryboardDesignAudit(b,duplicate,versions).some(i=>i.code==="storyboard-audit-coverage"));
  const failed=structuredClone(audit);failed.checks[0].result="pending";assert.ok(validateStoryboardDesignAudit(b,failed,versions).some(i=>i.code==="storyboard-audit-failed"));
  const unknown=structuredClone(audit);unknown.checks[0].elementIds=["undeclared"];assert.ok(validateStoryboardDesignAudit(b,unknown,versions).some(i=>i.code==="storyboard-audit-coverage"));
});

test("old projects remain version one and unknown versions do not fall back",()=>{
  assert.equal(storyboardSchemaVersion({config:{}}),1);
  assert.throws(()=>storyboardSchemaVersion({config:{storyboardSchemaVersion:99}}),/不支持/);
});

test('authored action names are accepted without a renderer capability whitelist', () => {
 const b=board(); b.scenes[0].events[0].execution.capability='code-edit';
 b.scenes[0].events[0].execution.elements=['task-root'];
 assert.deepEqual(validateStoryboardDesign(b),[]);
});
