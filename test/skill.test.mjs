import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const repo = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const skill = join(repo, 'skills', 'tellmotion');
const read = (...p) => readFileSync(join(repo, ...p), 'utf8');

test('SKILL.md has the required header', () => {
  const t = readFileSync(join(skill, 'SKILL.md'), 'utf8');
  assert.match(t, /^---\nname: tellmotion\ndescription: .{40,}\n---/);
});

test('every file referenced by SKILL.md exists', () => {
  const t = readFileSync(join(skill, 'SKILL.md'), 'utf8');
  const refs = [...t.matchAll(/`((?:references|tools|scripts|assets)\/[\w./-]+\.(?:md|mjs|sh|js))`/g)].map(m => m[1]);
  assert.ok(refs.length > 3);
  for (const r of new Set(refs)) assert.ok(existsSync(join(skill, r)), `SKILL.md references missing file: ${r}`);
});

test('each pack has valid metadata and the components it declares', () => {
  const dir = join(skill, 'assets', 'packs');
  for (const p of readdirSync(dir, {withFileTypes: true}).filter(d => d.isDirectory())) {
    const meta = JSON.parse(readFileSync(join(dir, p.name, 'pack.json'), 'utf8'));
    assert.equal(meta.name, p.name);
    assert.ok(meta.description.length > 10);
    const src = readdirSync(join(dir, p.name))
      .filter(f => f.endsWith('.tsx'))
      .map(f => readFileSync(join(dir, p.name, f), 'utf8'))
      .join('\n');
    for (const c of meta.components) assert.match(src, new RegExp(`(class|function\\*?)\\s+${c}\\b`), `${p.name}: component ${c} not found`);
  }
});

test('new projects get the render script', () => {
  const pkg = JSON.parse(readFileSync(join(skill, 'assets', 'base', 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.render, 'node scripts/render.mjs');
  assert.ok(pkg.dependencies['@motion-canvas/ffmpeg'], 'the template needs the ffmpeg exporter');
  assert.match(readFileSync(join(skill, 'scripts', 'new-project.sh'), 'utf8'), /tools\/render\.mjs" "\$DEST\/scripts\/render\.mjs"/);
});

test('render.mjs stays dependency-free and honours CHROME', async () => {
  const src = readFileSync(join(skill, 'tools', 'render.mjs'), 'utf8');
  // Only the tool's own imports: the page code further down is served to the browser from the project
  const header = src.slice(0, src.indexOf('const ROUTE'));
  for (const [, mod] of header.matchAll(/^import .* from '([^']+)';$/gm)) assert.match(mod, /^node:/, `render.mjs imports ${mod}`);
  const {findBrowser} = await import(pathToFileURL(join(skill, 'tools', 'render.mjs')).href);
  const self = fileURLToPath(import.meta.url);
  assert.equal(findBrowser({CHROME: self}), self);
});

test('versions are consistent (package.json, llms.txt, CHANGELOG)', () => {
  const v = JSON.parse(read('package.json')).version;
  assert.match(read('llms.txt'), new RegExp(`^Version: ${v.replace(/\./g, '\\.')}$`, 'm'));
  assert.match(read('CHANGELOG.md'), new RegExp(`## \\[${v.replace(/\./g, '\\.')}\\]`));
});

test('llms.txt tells agents how to install and verify', () => {
  const t = read('llms.txt');
  for (const needle of ['skills@latest add', '--skill tellmotion', 'doctor.mjs']) assert.ok(t.includes(needle), `llms.txt is missing: ${needle}`);
});

test('README exists in English and Spanish and links each other', () => {
  assert.match(read('README.md'), /README_ES\.md/);
  assert.match(read('README_ES.md'), /README\.md/);
});
