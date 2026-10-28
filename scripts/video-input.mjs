import path from 'node:path';
import {ROOT, cliOptions, fail, main} from './lib/files.mjs';
import {prepareInput, validateInput, installInput} from './lib/input.mjs';

await main(import.meta.url, args => {
  const {positional: [action, input], options} = cliOptions(args);
  if (!action || options.help) return {usage: 'node scripts/video-input.mjs prepare <slug> [--component-path <path> --component-export <name> --duration-export <name>] | validate <directory> | install <directory> --workspace <empty-directory>'};
  if (action === 'prepare') return prepareInput(ROOT, input, {componentPath: options['component-path'], componentExport: options['component-export'], configPath: options['config-path'], configExport: options['config-export'], durationExport: options['duration-export'], compositionId: options['composition-id']});
  if (action === 'validate') return {ok: true, videoSlug: validateInput(path.resolve(input)).videoSlug};
  if (action === 'install' && typeof options.workspace === 'string') return installInput(path.resolve(input), path.resolve(options.workspace));
  fail('操作或参数无效，使用 --help 查看');
});
