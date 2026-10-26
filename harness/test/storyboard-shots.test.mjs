import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {validateStoryboardDesign, resolveStoryboardTiming, storyboardDesignReviewHints} from '../src/storyboard-design.mjs';
import {resolveShotRanges} from '../src/storyboard-shots.mjs';
const sample = JSON.parse(fs.readFileSync(new URL('../../contracts/video-production/current/examples/storyboard.json', import.meta.url)));
function board() {
  const b=structuredClone(sample), s=b.scenes[0], first=s.shots[0], second=structuredClone(first);
  s.narration='任务从等待进入制作，校验通过后完成。';
  second.id='s01-shot02';second.start={type:'cue',anchor:'校验通过后完成',occurrence:1};
  first.visibleElementIds=['task-root','task-request'];first.end={type:'next-shot',shotId:second.id};
  first.transitionToNext={target:{type:'shot',id:second.id},mechanism:'cut',reason:'观察结果',retainedElementIds:['task-root','task-request'],exitingElementIds:[]};
  s.shots.push(second);s.events[1].shotId=second.id;return b;
}
function timing() {return [{sceneId:'01',startFrame:0,endFrame:120,shots:[{id:'s01-shot01',sceneId:'01',startFrame:0,endFrame:60},{id:'s01-shot02',sceneId:'01',startFrame:60,endFrame:120}],events:[{id:'task-start',atFrame:10},{id:'task-complete',atFrame:70}]}];}
test('one or several authored shots are valid without a shot menu or minimum cuts',()=>{
  assert.deepEqual(validateStoryboardDesign(sample),[]);assert.deepEqual(validateStoryboardDesign(board()),[]);
  assert.equal(resolveStoryboardTiming(board(),timing()).shots.length,2);
  const b=board();b.scenes[0].shots[0].camera='自定义平面观察路线';assert.deepEqual(validateStoryboardDesign(b),[]);
});
test('repeated wording prompts review without judging static shots or changing authored data',()=>{
  const b=board(), before=structuredClone(b);
  const audit={checks:[
    {sceneId:'01',eventId:'task-start',checkId:'SQ-1',evidence:'同一依据',note:'独立判断一'},
    {sceneId:'01',eventId:'task-complete',checkId:'SQ-1',evidence:' 同一依据 ',note:'独立判断二'},
    {sceneId:'01',eventId:'task-complete',checkId:'SQ-2',evidence:'同一依据',note:'其他检查'},
  ],shotChecks:[]};
  const hints=storyboardDesignReviewHints(b,audit);
  assert.equal(hints.filter(h=>h.code==='storyboard-shot-repetition').length,2);
  const repeated=hints.filter(h=>h.code==='storyboard-audit-repetition');
  assert.equal(repeated.length,1);
  assert.deepEqual(repeated[0].checkIds,['01/task-start/SQ-1','01/task-complete/SQ-1']);
  assert.deepEqual(b,before);
  assert.deepEqual(validateStoryboardDesign(b),[]);
  b.scenes[0].shots[1].framing='结果近景';
  b.scenes[0].shots[1].camera='推近结果供核对';
  assert.deepEqual(storyboardDesignReviewHints(b,null),[]);
  assert.deepEqual(storyboardDesignReviewHints(sample,null),[]);
  assert.deepEqual(storyboardDesignReviewHints(null,null),[]);
  assert.deepEqual(storyboardDesignReviewHints({scenes:[null,{shots:'invalid'}]},null),[]);
});
test('a single different shot does not hide repeated framing elsewhere in the film',()=>{
  const b=board(), third=structuredClone(b.scenes[0].shots[1]);
  third.id='s01-shot03';third.framing='控件特写';third.camera='跟随控件';
  b.scenes[0].shots.push(third);
  const hints=storyboardDesignReviewHints(b,null);
  assert.equal(hints.length,2);
  assert.deepEqual(hints[0].shotIds,['s01-shot01','s01-shot02']);
});
for (const [name, mutate, pattern] of [
  ['missing shots',b=>b.scenes[0].shots=[],/缺少 Shot/],
  ['duplicate id',b=>b.scenes[0].shots[1].id=b.scenes[0].shots[0].id,/ID 重复/],
  ['unknown event owner',b=>b.scenes[0].events[0].shotId='unknown',/归属缺失/],
  ['missing parent',b=>b.scenes[0].shots[0].visibleElementIds=['task-request'],/缺少可见父/],
  ['unknown visible object',b=>b.scenes[0].shots[0].visibleElementIds.push('unknown'),/未知对象/],
  ['silent identity reset',b=>b.scenes[0].shots[0].transitionToNext.retainedElementIds=[],/延续／退出/],
  ['wrong next shot',b=>b.scenes[0].shots[0].end.shotId='unknown',/终点必须/],
  ['missing anchor',b=>b.scenes[0].shots[1].start.anchor='不存在',/锚点缺失/],
]) test(`shot rejects ${name}`,()=>{const b=board();mutate(b);assert.match(validateStoryboardDesign(b).map(i=>i.message).join('；'),pattern);});
test('shot gaps, overlap, empty coverage and actions crossing a cut are rejected',()=>{
  for (const mutate of [t=>t[0].shots[1].startFrame=61,t=>t[0].shots[1].startFrame=59,t=>t[0].shots[1].endFrame=60,t=>t[0].shots[1].endFrame=119]) {const t=timing();mutate(t);assert.throws(()=>resolveStoryboardTiming(board(),t),/连续完整覆盖/);}
  const t=timing();t[0].events[0].atFrame=55;assert.throws(()=>resolveStoryboardTiming(board(),t),/所属 Shot/);
  const ranges=resolveShotRanges(board().scenes[0],{startFrame:0,endFrame:120},()=>60);assert.deepEqual(ranges.map(s=>[s.startFrame,s.endFrame]),[[0,60],[60,120]]);
  assert.throws(()=>resolveShotRanges(board().scenes[0],{startFrame:0,endFrame:120},()=>0),/区间空/);
});
