import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {readWordTiming, writeWordTiming, segmentWords} from '../src/word-timing.mjs';

test('provider boundaries map actual word starts and reject unreliable evidence', () => {
  const proof = {segments:[{segmentId:'01-01',wordBoundaries:[
    {text:'则',start:0.1,duration:0.2}, {text:'连接',start:0.35,duration:0.4},
    {text:'_',start:0.8,duration:0.1}, {text:'服务',start:1,duration:0.3},
  ]}]};
  const words = segmentWords(proof,'01-01','则连接_服务。',2,5,30);
  assert.deepEqual(words.map(w => [w.textOffset,w.startFrame]),[[0,153],[1,161],[3,180]]);
  assert.throws(() => segmentWords(proof,'01-01','连接服务',2,5,30),/文本未完整/);
  assert.throws(() => segmentWords(proof,'01-01','则连接服务',0.5,5,30),/时间无效/);
  const overlap = structuredClone(proof); overlap.segments[0].wordBoundaries[1].start = 0.15;
  assert.throws(() => segmentWords(overlap,'01-01','则连接服务',2,5,30),/时间无效/);
  assert.equal(segmentWords(null,'01-01','则连接服务',2,5,30),null);
});

test('import preserves audio and binds words to script, manifests and audio bytes', () => {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(),'word-timing-'));
  const slug = 'words';
  const put = (file,value) => {const dest=path.join(workspaceRoot,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,JSON.stringify(value));};
  const base=`src/videos/${slug}/generated`;
  put(`videos/${slug}/tts-script.json`,{scenes:[{sceneId:'01',segments:[{id:'01-01',text:'测试'}]}]});
  put(`${base}/audio-manifest.json`,{scenes:[{segments:[{file:'audio/a.mp3'}]}]});
  put(`${base}/subtitle-manifest.json`,{});put(`${base}/timeline-manifest.json`,{});put(`${base}/audio/a.mp3`,'audio');
  put('timing/scene-01/01-01.json',{wordBoundaries:[{text:'测试',start:0.1,duration:0.2}]});
  assert.equal(readWordTiming(workspaceRoot,slug),null);
  writeWordTiming({workspaceRoot,slug,timingRoot:path.join(workspaceRoot,'timing')});
  assert.equal(readWordTiming(workspaceRoot,slug).segments.length,1);
  assert.equal(fs.readFileSync(path.join(workspaceRoot,base,'audio/a.mp3'),'utf8'),'"audio"');
  put(`${base}/audio/a.mp3`,'changed');
  assert.throws(() => readWordTiming(workspaceRoot,slug),/证据过期/);
});
