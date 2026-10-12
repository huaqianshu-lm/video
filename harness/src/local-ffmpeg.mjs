#!/usr/bin/env node
// This file is copied to an extensionless executable; dynamic import works in
// both Node's module and CommonJS modes, including Node 18.
import('node:child_process').then(({spawnSync}) => {

// Remotion's audio preprocessing also needs adaptation, not only final stitching.
const replacements = {
  libfdk_aac: 'aac',
  ...(Number(process.env.HARNESS_LOCAL_FFMPEG_MAJOR) >= 9 ? {
    '-filter_script:a': '-/filter:a', '-filter_complex_script': '-/filter_complex',
  } : {}),
};
if (!process.env.HARNESS_LOCAL_FFMPEG) throw new Error('Missing prepared system FFmpeg');
const result = spawnSync(process.env.HARNESS_LOCAL_FFMPEG,
  process.argv.slice(2).map(value => replacements[value] ?? value), {stdio: 'inherit'});
if (result.error) process.stderr.write(`${result.error.message}\n`);
process.exit(result.status ?? 1);
});
