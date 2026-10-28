import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {assertMutable, write as writeJson} from './files.mjs';

export const spokenText = text => String(text ?? '').replace(/[\p{P}\p{Z}\s]/gu, '');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const manifests = ['audio-manifest.json', 'subtitle-manifest.json', 'timeline-manifest.json'];

function bindings(root, slug) {
  const base = `src/videos/${slug}/generated`;
  const audio = read(path.join(root, base, 'audio-manifest.json'));
  const files = [`videos/${slug}/tts-script.json`, ...manifests.map(file => `${base}/${file}`),
    ...audio.scenes.flatMap(scene => scene.segments.map(segment => `${base}/${segment.file}`))];
  return files.map(file => ({path: file, sha256: digest(fs.readFileSync(path.join(root, file)))}));
}

// The original provider boundaries are retained; this never estimates within a word.
export function writeWordTiming({workspaceRoot, slug, timingRoot}) {
  assertMutable(workspaceRoot, slug);
  const script = read(path.join(workspaceRoot, `videos/${slug}/tts-script.json`));
  const segments = script.scenes.flatMap(scene => scene.segments.flatMap(segment => {
    const file = path.join(timingRoot, `scene-${scene.sceneId}`, `${segment.id}.json`);
    if (!fs.existsSync(file)) return [];
    const bytes = fs.readFileSync(file);
    const raw = JSON.parse(bytes.toString('utf8'));
    return raw.wordBoundaries?.length ? [{...raw, segmentId: segment.id, sourcePath: path.relative(workspaceRoot,file), sourceSha256: digest(bytes)}] : [];
  }));
  if (!segments.length) return null;
  const proof = {schemaVersion: 1, kind: 'provider-word-timing', bindings: bindings(workspaceRoot, slug), segments};
  const target = path.join(workspaceRoot, `src/videos/${slug}/generated/word-timing.json`);
  writeJson(target,proof);
  return target;
}

export function readWordTiming(workspaceRoot, slug) {
  const file = path.join(workspaceRoot, `src/videos/${slug}/generated/word-timing.json`);
  if (!fs.existsSync(file)) return null;
  const proof = read(file);
  if (proof.schemaVersion !== 1 || proof.kind !== 'provider-word-timing' ||
      JSON.stringify(proof.bindings) !== JSON.stringify(bindings(workspaceRoot, slug))) {
    throw new Error('词级时间证据过期或绑定无效');
  }
  if (!Array.isArray(proof.segments) || new Set(proof.segments.map(s => s.segmentId)).size !== proof.segments.length) throw new Error('词级时间段重复或无效');
  return proof;
}

export function segmentWords(proof, segmentId, text, duration, globalStart, fps) {
  const segment = proof?.segments.find(item => item.segmentId === segmentId);
  if (!segment) return null;
  const words = segment.wordBoundaries;
  if (!Array.isArray(words) || !words.length || words.map(w => spokenText(w.text)).join('') !== spokenText(text)) throw new Error(`Segment ${segmentId} 词级文本未完整对应口播`);
  let offset = 0, previousEnd = 0;
  return words.flatMap(word => {
    const length = spokenText(word.text).length;
    if (!Number.isFinite(word.start) || !Number.isFinite(word.duration) || word.duration <= 0 || word.start < previousEnd - 0.02 || word.start < 0 || word.start + word.duration > duration + 0.02) throw new Error(`Segment ${segmentId} 词级时间无效`);
    previousEnd = word.start + word.duration;
    if (!length) return [];
    const result = {text: word.text, textOffset: offset, startSeconds: globalStart + word.start, startFrame: Math.round((globalStart + word.start) * fps)};
    offset += length;
    return [result];
  });
}
