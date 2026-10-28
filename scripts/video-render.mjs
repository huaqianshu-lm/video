import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync, spawn} from 'node:child_process';
import {ROOT, assertMutable, cliOptions, fail, fileHash, inside, main, read, write} from './lib/files.mjs';
import {installInput, validateInput} from './lib/input.mjs';
import {localRenderEnvironment} from './lib/render-environment.mjs';

export function renderEnvironment(root, environment = process.env) {
  const env = {...environment};
  for (const key of ['FFMPEG', 'FFPROBE', 'BROWSER']) env[`VIDEO_LOCAL_${key}`] ??= env[`HARNESS_LOCAL_${key}`];
  return localRenderEnvironment(root, env);
}
export async function decodeOutput(output, runtime, composition) {
  const probe = JSON.parse(execFileSync(runtime.ffprobe, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', output], {encoding: 'utf8', timeout: 30000}));
  const video = probe.streams.find(x => x.codec_type === 'video'), audio = probe.streams.find(x => x.codec_type === 'audio');
  if (video?.codec_name !== 'h264' || video.width !== 1920 || video.height !== 1080 || video.r_frame_rate !== '30/1'
    || Number(video.nb_frames) !== composition.durationInFrames || audio?.codec_name !== 'aac' || !Number.isFinite(Number(audio.duration))
    || Math.abs(Number(audio.duration) - composition.durationInFrames / 30) > 0.1) fail('输出规格、帧数或音轨与 Composition 不一致');
  await new Promise((resolve, reject) => {
    const child = spawn(runtime.ffmpeg, ['-hide_banner', '-v', 'error', '-xerror', '-threads', '1', '-i', output, '-f', 'null', '-'], {stdio: ['ignore', 'ignore', 'inherit']});
    child.once('error', reject); child.once('exit', code => code === 0 ? resolve() : reject(new Error('整片解码失败')));
  });
  return {path: output, size: fs.statSync(output).size, sha256: fileHash(output), frames: composition.durationInFrames,
    width: 1920, height: 1080, fps: 30, videoCodec: 'h264', audioCodec: 'aac', verified: true, probe};
}
export async function renderVideo(root, directory, {environment = process.env} = {}) {
  const manifest = validateInput(directory), id = manifest.videoSlug;
  assertMutable(root, id);
  if (!fs.existsSync(path.join(directory, 'src/lib/timing.ts'))) fail('正式渲染需先准备含共享能力快照的新输入包；不修改旧包');
  const runtime = renderEnvironment(root, environment);
  const stamp = `${Date.now()}-${process.pid}`, runDirectory = inside(root, `local/direct-render/${id}/${stamp}`);
  const workspace = path.join(runDirectory, 'workspace'), output = inside(root, `out/direct-render/${id}/${stamp}/${id}.mp4`);
  fs.mkdirSync(runDirectory, {recursive: true}); fs.mkdirSync(path.dirname(output), {recursive: true});
  const log = path.join(runDirectory, 'render.log'), started = Date.now();
  const record = {videoSlug: id, inputDirectory: directory, inputFingerprint: manifest.packageFingerprint,
    compositionId: manifest.compositionId, pid: process.pid, startedAt: new Date().toISOString(), output, log, runtime};
  write(path.join(runDirectory, 'run.json'), record);
  try {
    installInput(directory, workspace);
    fs.symlinkSync(path.join(root, 'node_modules'), path.join(workspace, 'node_modules'), 'dir');
    const binaries = path.join(runDirectory, 'bin'); fs.mkdirSync(binaries);
    const shim = fs.readFileSync(new URL('./lib/local-ffmpeg.mjs', import.meta.url), 'utf8')
      .replace(/^#!\/usr\/bin\/env node/, `#!${runtime.node}`)
      .replace('Number(process.env.VIDEO_LOCAL_FFMPEG_MAJOR)', String(runtime.ffmpegMajor))
      .replace("if (!process.env.VIDEO_LOCAL_FFMPEG) throw new Error('Missing prepared system FFmpeg');", `const systemFfmpeg = ${JSON.stringify(runtime.ffmpeg)};`)
      .replace('process.env.VIDEO_LOCAL_FFMPEG,', 'systemFfmpeg,');
    if (shim.includes('process.env.VIDEO_LOCAL_FFMPEG')) fail('FFmpeg 包装器未绑定执行环境');
    fs.writeFileSync(path.join(binaries, 'ffmpeg'), shim, {mode: 0o755});
    fs.symlinkSync(runtime.ffprobe, path.join(binaries, 'ffprobe')); fs.symlinkSync(runtime.compositor, path.join(binaries, 'remotion'));
    const require = createRequire(path.join(root, 'package.json'));
    const {bundle} = require('@remotion/bundler'), {selectComposition, renderMedia, openBrowser} = require('@remotion/renderer');
    const serveUrl = await bundle({entryPoint: path.join(workspace, 'src/RenderInputRoot.tsx'), publicDir: path.join(workspace, 'public')});
    let browser;
    try {
      assertMutable(root, id);
      browser = await openBrowser('chrome', {browserExecutable: runtime.browserExecutable, chromeMode: 'headless-shell'});
      const composition = await selectComposition({serveUrl, id: manifest.compositionId, puppeteerInstance: browser, binariesDirectory: binaries});
      if (composition.width !== 1920 || composition.height !== 1080 || composition.fps !== 30) fail('Composition 必须为 1920×1080／30fps');
      write(path.join(runDirectory, 'composition.json'), composition);
      let lastProgress = 0;
      await renderMedia({serveUrl, composition, puppeteerInstance: browser, outputLocation: output, binariesDirectory: binaries,
        codec: 'h264', pixelFormat: 'yuv420p', concurrency: 1, overwrite: false, enforceAudioTrack: true, imageFormat: 'jpeg', onProgress: progress => {
          if (Date.now() - lastProgress < 5000) return;
          lastProgress = Date.now();
          const line = JSON.stringify({at: new Date().toISOString(), progress: progress.progress, renderedFrames: progress.renderedFrames});
          fs.appendFileSync(log, line + '\n'); process.stdout.write(line + '\n');
        }});
      const result = {ok: true, ...await decodeOutput(output, runtime, composition), elapsedSeconds: (Date.now() - started) / 1000};
      assertMutable(root, id); write(path.join(runDirectory, 'result.json'), result); return {...result, runDirectory};
    } finally { await browser?.close({silent: true}); }
  } catch (error) {
    fs.appendFileSync(log, error.message + '\n');
    assertMutable(root, id); write(path.join(runDirectory, 'result.json'), {ok: false, error: error.message, output}); throw error;
  }
}
await main(import.meta.url, async args => {
  const {positional: [action, input], options} = cliOptions(args);
  if (!action || options.help) return {usage: 'node scripts/video-render.mjs check <input-directory> | render <input-directory> | inspect <run-directory>；render 仅在用户明确授权后执行'};
  if (action === 'check') return {videoSlug: validateInput(path.resolve(input)).videoSlug, runtime: renderEnvironment(ROOT)};
  if (action === 'render') return renderVideo(ROOT, path.resolve(input));
  if (action === 'inspect') {
    const directory = path.resolve(input); inside(ROOT, path.relative(ROOT, directory).split(path.sep).join('/'));
    const run = read(path.join(directory, 'run.json'));
    const resultFile = path.join(directory, 'result.json');
    if (fs.existsSync(resultFile)) {
      const result = read(resultFile);
      if (result.ok && (!fs.existsSync(result.path) || fileHash(result.path) !== result.sha256)) fail('原渲染结果丢失或已改变');
      return {run, result};
    }
    let processExists = true;
    try { process.kill(run.pid, 0); } catch (error) { if (error.code === 'ESRCH') processExists = false; else if (error.code !== 'EPERM') throw error; }
    return {run, processExists, result: null, message: '只查询原进程和文件，不自动重渲染；PID 存在不证明渲染仍正常'};
  }
  fail('不支持的渲染操作');
});
