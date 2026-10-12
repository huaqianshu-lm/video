import {executeLocalRenderWorker} from './local-render.mjs';

executeLocalRenderWorker(process.argv[2], process.argv[3]).catch(error => {
  process.stderr.write(`${error.code ?? 'local-render-failed'}：${error.message}\n`);
  process.exitCode = 1;
});
