import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT, assertMutable, cliOptions, fail, fileHash, hash, inside, main, optional, read, slug, write, files} from './lib/files.mjs';
import {validateScript, validateMedia} from './lib/media.mjs';
import {resolveTtsProvider, ttsProviderFingerprint} from './lib/tts-provider.mjs';
import {writeWordTiming} from './lib/word-timing.mjs';

export function ttsTools(root, env = process.env) {
  const scripts = env.VIDEO_TTS_SCRIPTS_DIR ?? env.HARNESS_TTS_SCRIPTS_DIR;
  const python = env.VIDEO_TTS_PYTHON ?? env.HARNESS_TTS_PYTHON;
  if (!scripts || !python) fail('请显式配置 VIDEO_TTS_PYTHON 和 VIDEO_TTS_SCRIPTS_DIR；不自动搜索其他项目');
  return {scripts: path.resolve(scripts), python: path.resolve(python)};
}
export function buildScript(root, id, {env = process.env, run = execFileSync} = {}) {
  slug(id); assertMutable(root, id);
  const tool = ttsTools(root, env), source = inside(root, `videos/${id}/narration-script.md`);
  const temporary = inside(root, `local/tts/${id}/script-${Date.now()}-${process.pid}`);
  fs.mkdirSync(temporary, {recursive: true});
  // Preserve the canonical builder's existing heading normalization.
  fs.writeFileSync(path.join(temporary, 'narration-script.md'), fs.readFileSync(source, 'utf8').replace(/^(##\s+Scene\s+\d+)\s*[：:]\s*/gm, '$1｜'));
  const output = path.join(temporary, 'tts-script.json');
  run(tool.python, [path.join(tool.scripts, 'build_tts_script.py'), '--project-dir', temporary,
    '--input', path.join(temporary, 'narration-script.md'), '--output', output, '--video-id', id], {cwd: root, stdio: 'inherit'});
  const script = validateScript(read(output), id);
  script.source = {generator: 'tts/scripts/build_tts_script.py', narrationFingerprint: fileHash(source)};
  assertMutable(root, id); write(inside(root, `videos/${id}/tts-script.json`), script);
  return {videoId: id, scenes: script.scenes.length};
}
export function generateTts(root, id, {tts, env = process.env, run = execFileSync, probe = true} = {}) {
  slug(id); assertMutable(root, id);
  const scriptPath = inside(root, `videos/${id}/tts-script.json`), script = validateScript(read(scriptPath), id);
  const narration = inside(root, `videos/${id}/narration-script.md`);
  if (!script.source?.narrationFingerprint || script.source.narrationFingerprint !== fileHash(narration)) fail('TTS Script 与当前口播不一致，先重新派生');
  const oldConfig = optional(inside(root, `harness/projects/${id}/project.json`));
  const provider = resolveTtsProvider({tts: tts ?? oldConfig?.tts});
  const cache = inside(root, `local/tts/${id}/${hash(fs.readFileSync(scriptPath)).slice(0, 24)}-${ttsProviderFingerprint(provider).slice(0, 16)}`);
  const assets = path.join(cache, 'video-assets');
  fs.mkdirSync(assets, {recursive: true});
  write(path.join(assets, 'tts-script.json'), script);
  // Successful non-empty files are reused only inside this script/provider cache.
  for (const relative of files(assets)) if (fs.statSync(inside(assets, relative)).size === 0) fs.unlinkSync(inside(assets, relative));
  const cachedAudioFilesBefore = fs.existsSync(path.join(assets, 'audio')) ? files(path.join(assets, 'audio')).length : 0;
  if (provider.provider === 'bailian') {
    const python = env.VIDEO_BAILIAN_PYTHON ?? env.HARNESS_BAILIAN_TTS_PYTHON;
    if (!python) fail('请配置 VIDEO_BAILIAN_PYTHON，保留已有虚拟环境即可');
    run(python, [path.join(root, 'scripts/tts/bailian-generate.py'), '--tts-script', path.join(assets, 'tts-script.json'),
      '--assets-root', assets, '--provider-json', JSON.stringify(provider)], {cwd: root, stdio: 'inherit', env});
  } else {
    const tool = ttsTools(root, env), common = ['--project-dir', cache];
    const invoke = (name, args) => run(tool.python, [path.join(tool.scripts, name), ...common, ...args], {cwd: root, stdio: 'inherit', env});
    invoke('generate_audio.py', ['--input', path.join(assets, 'tts-script.json'), '--voice', provider.voice, '--rate', provider.rate, '--pitch', '+0Hz', '--volume', '+0%']);
    invoke('generate_subtitles.py', ['--tts-script', path.join(assets, 'tts-script.json'), '--audio-manifest', path.join(assets, 'audio-manifest.json'), '--timing-root', path.join(assets, 'timing'), '--output-root', path.join(assets, 'subtitles'), '--manifest', path.join(assets, 'subtitle-manifest.json')]);
    invoke('generate_timeline.py', ['--tts-script', path.join(assets, 'tts-script.json'), '--audio-manifest', path.join(assets, 'audio-manifest.json'), '--subtitle-manifest', path.join(assets, 'subtitle-manifest.json'), '--timeline', path.join(assets, 'timeline-manifest.json'), '--srt', path.join(assets, 'subtitles/captions.srt'), '--vtt', path.join(assets, 'subtitles/captions.vtt'), '--scene-buffer', '0']);
  }
  const result = validateMedia(assets, script, {probe});
  assertMutable(root, id);
  if (fileHash(scriptPath) !== fileHash(path.join(assets, 'tts-script.json')) || script.source.narrationFingerprint !== fileHash(narration)) fail('生成期间口播已改变，缓存保留但不发布');
  const generated = inside(root, `src/videos/${id}/generated`);
  for (const name of ['audio', 'subtitles', 'audio-manifest.json', 'subtitle-manifest.json', 'timeline-manifest.json']) {
    fs.mkdirSync(generated, {recursive: true}); fs.cpSync(path.join(assets, name), path.join(generated, name), {recursive: true});
  }
  writeWordTiming({workspaceRoot: root, slug: id, timingRoot: path.join(assets, 'timing')});
  const record = {operation: 'audio-pipeline', videoId: id, provider, scriptSHA256: fileHash(scriptPath), cacheDirectory: path.relative(root, cache),
    cachedAudioFilesBefore, completedAt: new Date().toISOString(),
    outputs: files(generated).map(p => ({path: p, sha256: fileHash(inside(generated, p))})), ...result};
  write(path.join(cache, 'result.json'), record);
  return record;
}
await main(import.meta.url, args => {
  const {positional: [action, id], options} = cliOptions(args);
  if (options.help || !action) return {usage: 'node scripts/video-tts.mjs <build|generate|validate> <slug> [--provider-json <JSON>]'};
  if (action === 'build') return buildScript(ROOT, id);
  if (action === 'generate') return generateTts(ROOT, id, {tts: options['provider-json'] ? JSON.parse(options['provider-json']) : undefined});
  if (action === 'validate') return validateMedia(inside(ROOT, `src/videos/${slug(id)}/generated`), read(inside(ROOT, `videos/${id}/tts-script.json`)));
  fail('不支持的 TTS 操作');
});
