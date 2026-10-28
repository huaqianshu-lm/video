import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fail, inside, read} from './files.mjs';

export function validateScript(script, id) {
  if (script.videoId !== id || !Array.isArray(script.scenes) || !script.scenes.length) fail('TTS Script 缺少正确的 videoId／scenes');
  const scenes = new Set(), segments = new Set();
  for (const scene of script.scenes) {
    if (!/^\d{2}$/.test(scene.sceneId) || scenes.has(scene.sceneId) || !scene.segments?.length) fail('TTS Scene ID 重复或内容缺失');
    scenes.add(scene.sceneId);
    for (const segment of scene.segments) {
      if (!/^[a-zA-Z0-9_-]+$/.test(segment.id ?? '') || segments.has(segment.id) || typeof segment.text !== 'string' || !segment.text.trim()) fail('TTS Segment ID 重复或文本缺失');
      segments.add(segment.id);
    }
  }
  return script;
}
const equal = (a, b, label) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${label}不一致`); };
const near = (a, b, label) => { if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a - b) > 0.025) fail(`${label}时间不一致`); };
export function validateMedia(directory, script, {probe = true, ffprobe = 'ffprobe'} = {}) {
  validateScript(script, script.videoId);
  const audio = read(inside(directory, 'audio-manifest.json'));
  const subtitles = read(inside(directory, 'subtitle-manifest.json'));
  const timeline = read(inside(directory, 'timeline-manifest.json'));
  const sceneIds = script.scenes.map(s => s.sceneId);
  for (const m of [audio, subtitles, timeline]) {
    if (m.videoId !== script.videoId) fail('Manifest videoId 不一致');
    equal(m.scenes?.map(s => s.sceneId), sceneIds, 'Scene 映射');
  }
  let elapsed = 0, count = 0;
  const cueIds = new Set();
  for (let i = 0; i < script.scenes.length; i++) {
    const source = script.scenes[i], a = audio.scenes[i], s = subtitles.scenes[i], t = timeline.scenes[i];
    equal(a.segments.map(x => x.id), source.segments.map(x => x.id), 'Audio Segment');
    equal(s.segments.map(x => x.segmentId), source.segments.map(x => x.id), 'Subtitle Segment');
    equal(t.segments.map(x => x.segmentId), source.segments.map(x => x.id), 'Timeline Segment');
    if (s.file) equal(read(inside(directory, s.file)).segments, s.segments, 'Scene 字幕文件');
    near(t.offset, elapsed, 'Scene 起点');
    let sceneDuration = 0;
    for (let j = 0; j < source.segments.length; j++) {
      const segment = source.segments[j], audioSegment = a.segments[j], sub = s.segments[j], time = t.segments[j];
      if (audioSegment.text !== segment.text) fail(`音频原文不一致：${segment.id}`);
      const mediaFile = inside(directory, audioSegment.file);
      if (!fs.existsSync(mediaFile) || fs.statSync(mediaFile).size === 0) fail(`音频缺失或为空：${segment.id}`);
      if (!(audioSegment.duration > 0)) fail(`音频时长无效：${segment.id}`);
      if (probe) {
        const info = JSON.parse(execFileSync(ffprobe, ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', mediaFile], {encoding: 'utf8', timeout: 30000}));
        if (!info.streams.some(x => x.codec_type === 'audio')) fail(`文件没有音轨：${segment.id}`);
        near(Number(info.format.duration), audioSegment.duration, `真实音频 ${segment.id}`);
      }
      equal(time.audioFile, audioSegment.file, '音频路径');
      if (sub.audioFile) equal(sub.audioFile, audioSegment.file, '字幕音频路径');
      near(time.offset, sceneDuration, 'Segment 起点');
      near(time.duration, audioSegment.duration, 'Segment 时长');
      near(time.end, time.offset + time.duration, 'Segment 终点');
      let previousEnd = 0;
      if (!Array.isArray(sub.cues) || !sub.cues.length) fail(`缺少字幕：${segment.id}`);
      for (const cue of sub.cues) {
        if (!cue.id || cueIds.has(cue.id) || !cue.text?.trim() || !Number.isFinite(cue.start) || !Number.isFinite(cue.end)
          || cue.start < previousEnd - 0.001 || cue.start < 0 || cue.end <= cue.start || cue.end > audioSegment.duration + 0.025) fail(`字幕重复、越界或顺序错误：${cue.id}`);
        cueIds.add(cue.id); previousEnd = cue.end;
      }
      const spoken = text => text.replace(/[\p{P}\p{Z}\s]/gu, '');
      equal(spoken(sub.cues.map(c => c.text).join('')), spoken(segment.text), '字幕文本覆盖');
      sceneDuration += audioSegment.duration; count++;
    }
    near(t.narrationDuration, sceneDuration, 'Scene 口播');
    near(t.duration, sceneDuration + (t.buffer ?? 0), 'Scene 时长');
    near(t.end, t.offset + t.duration, 'Scene 终点');
    elapsed += t.duration;
  }
  near(timeline.duration, elapsed, '全片');
  for (const name of ['captions.vtt', 'captions.srt']) {
    const p = inside(directory, `subtitles/${name}`);
    if (!fs.existsSync(p) || !fs.statSync(p).size) fail(`缺少完整字幕：${name}`);
  }
  return {scenes: sceneIds.length, segments: count, cues: cueIds.size, duration: elapsed, probed: probe};
}
