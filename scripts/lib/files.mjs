import fs from 'node:fs';
import path from 'node:path';
import {createHash, randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export function fail(message) { throw new Error(message); }
export function slug(value) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value ?? '')) fail('视频标识必须为小写字母、数字和连字符');
  return value;
}
export function inside(root, relative) {
  if (typeof relative !== 'string' || !relative || relative.includes('\\') || relative.includes('\0') || path.isAbsolute(relative)
    || relative.split('/').some(part => !part || part === '.' || part === '..')) fail(`不安全的相对路径：${relative}`);
  const target = path.resolve(root, relative);
  let cursor = root;
  for (const part of relative.split('/')) {
    cursor = path.join(cursor, part);
    if (fs.existsSync(cursor) && fs.lstatSync(cursor).isSymbolicLink()) fail(`不允许符号链接：${cursor}`);
  }
  return target;
}
export const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
export const optional = file => fs.existsSync(file) ? read(file) : null;
export const hash = value => createHash('sha256').update(value).digest('hex');
export const fileHash = file => hash(fs.readFileSync(file));
export function write(file, value) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  const temporary = `${file}.${randomUUID()}.tmp`;
  fs.writeFileSync(temporary, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n');
  fs.renameSync(temporary, file);
}
export function files(root, current = root) {
  if (!fs.existsSync(current)) return [];
  const result = [];
  for (const entry of fs.readdirSync(current, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
    const p = path.join(current, entry.name);
    if (entry.isSymbolicLink()) fail(`不允许符号链接：${p}`);
    if (entry.isDirectory()) result.push(...files(root, p));
    else if (entry.isFile()) result.push(path.relative(root, p).split(path.sep).join('/'));
  }
  return result;
}
export function isCompleted(root, id) {
  slug(id);
  // Historical records are read directly, never loaded through a state service.
  const old = optional(inside(root, `harness/projects/${id}/state.json`));
  const note = inside(root, `videos/${id}/production-record.md`);
  return old?.currentStage === 'completed' || (fs.existsSync(note)
    && /^状态[：:]\s*completed\s*$/m.test(fs.readFileSync(note, 'utf8')));
}
export function assertMutable(root, id) {
  if (isCompleted(root, id)) fail(`${id} 已完成，永久只读`);
  const config = optional(inside(root, `harness/projects/${id}/project.json`));
  if (config?.workflow === 'product-promo-v1') fail('宣传片工作流已退役，只允许已有输入包只读预览');
}
export function cliOptions(args) {
  const options = {}, positional = [];
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith('--')) positional.push(args[i]);
    else {
      const key = args[i].slice(2);
      if (options[key] !== undefined) fail(`重复参数：--${key}`);
      options[key] = ['help', 'studio'].includes(key) ? true : args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
    }
  }
  return {options, positional};
}
export async function main(importURL, action) {
  if (process.argv[1] && fileURLToPath(importURL) === path.resolve(process.argv[1])) {
    try { const result = await action(process.argv.slice(2)); if (result !== undefined) console.log(JSON.stringify(result, null, 2)); }
    catch (error) { console.error(error.message); process.exitCode = 1; }
  }
}
