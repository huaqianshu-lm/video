import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {hash} from './files.mjs';
const fail = (code, message) => {throw Object.assign(new Error(message), {code});};
function resolveBinary(name, environment) {
  const configured = environment[`VIDEO_LOCAL_${name.toUpperCase()}`];
  const locations = configured ? [configured] : (environment.PATH ?? '').split(path.delimiter).map(dir => path.join(dir, name));
  for (const file of locations) {
    try { fs.accessSync(file, fs.constants.X_OK); return fs.realpathSync(file); } catch {}
  }
  fail('local-render-binary-missing', `缺少可执行的系统 ${name}，请配置 VIDEO_LOCAL_${name.toUpperCase()} 或 PATH。`);
}
export function localRenderEnvironment(workspace, environment = process.env) {
  if (process.platform !== 'darwin' && process.platform !== 'linux') fail('local-render-platform-unsupported', '本地执行器目前支持 macOS／Linux。');
  const ffmpeg = resolveBinary('ffmpeg', environment);
  const ffprobe = resolveBinary('ffprobe', environment);
  const version = execFileSync(ffmpeg, ['-version'], {encoding: 'utf8', timeout: 10000}).split('\n')[0];
  const major = Number(version.match(/ffmpeg version (\d+)/)?.[1]);
  // Older macOS system FFmpeg lacked native amix normalize; never silently alter mixing.
  if (major !== 9) fail('local-render-ffmpeg-unsupported', '当前已验证本地执行器要求 FFmpeg 9；其他版本需单独验证兼容性。');
  execFileSync(ffprobe, ['-version'], {stdio: 'ignore', timeout: 10000});
  const encoders = execFileSync(ffmpeg, ['-hide_banner', '-encoders'], {encoding: 'utf8', timeout: 10000, stdio: ['ignore', 'pipe', 'ignore']});
  const filters = execFileSync(ffmpeg, ['-hide_banner', '-filters'], {encoding: 'utf8', timeout: 10000, stdio: ['ignore', 'pipe', 'ignore']});
  if (!/\blibx264\b/.test(encoders) || !/\baac\b/.test(encoders) || !/\bamix\b/.test(filters)) fail('local-render-codecs-missing', '本机 FFmpeg 必须支持 libx264、aac 和 amix。');
  const mixHelp = execFileSync(ffmpeg, ['-hide_banner', '-h', 'filter=amix'], {encoding: 'utf8', timeout: 10000, stdio: ['ignore', 'pipe', 'ignore']});
  if (!/\bnormalize\b/.test(mixHelp)) fail('local-render-mixing-unsupported', '本机 amix 缺少 normalize 支持。');
  const require = createRequire(path.join(workspace, 'package.json'));
  const rendererEntry = require.resolve('@remotion/renderer');
  const rendererPackage = JSON.parse(fs.readFileSync(path.join(path.dirname(rendererEntry), '../package.json'), 'utf8'));
  const executableModule = require(path.join(path.dirname(rendererEntry), 'compositor/get-executable-path.js'));
  const compositor = path.join(executableModule.getExecutableDir(false, 'error'), 'remotion');
  fs.accessSync(compositor, fs.constants.X_OK);
  const {getRevisionInfo, readVersionFile, TESTED_VERSION} = require(path.join(path.dirname(rendererEntry), 'browser/BrowserFetcher.js'));
  const revision = getRevisionInfo('headless-shell');
  if (!environment.VIDEO_LOCAL_BROWSER && (!revision.local || readVersionFile('headless-shell') !== TESTED_VERSION)) {
    fail('local-render-browser-missing', '缺少与当前 Remotion 匹配的已安装无头浏览器；先准备浏览器或指定 VIDEO_LOCAL_BROWSER。');
  }
  const browserExecutable = fs.realpathSync(environment.VIDEO_LOCAL_BROWSER ?? revision.executablePath);
  fs.accessSync(browserExecutable, fs.constants.X_OK);
  const space = fs.statfsSync(workspace);
  const freeBytes = Number(space.bavail) * Number(space.bsize);
  if (freeBytes < 2 * 1024 ** 3) fail('local-render-disk-space', '本地渲染至少需要 2 GiB 可用磁盘空间。');
  return {ffmpeg, ffprobe, ffmpegVersion: version, ffmpegMajor: major, ffmpegSHA256: hash(fs.readFileSync(ffmpeg)),
    ffprobeSHA256: hash(fs.readFileSync(ffprobe)), remotionVersion: rendererPackage.version,
    compositor, browserExecutable, browserSHA256: hash(fs.readFileSync(browserExecutable)),
    node: process.execPath, platform: process.platform, arch: process.arch};
}
