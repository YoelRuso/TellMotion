import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
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
    assert.ok(existsSync(join(dir, p.name, 'demo', `demo-${p.name}.tsx`)), `${p.name}: demo scene missing`);
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

test('render options and output plan', async () => {
  const {parseArgs, planOutputs, targetSize, encodeArgs, sizeRange} = await import(pathToFileURL(join(skill, 'tools', 'render.mjs')).href);
  assert.deepEqual(parseArgs([]).formats, ['mp4']);
  const draft = parseArgs(['--draft']);
  assert.equal(draft.fps, 30);
  assert.equal(draft.scale, 0.5);
  assert.equal(parseArgs(['--draft', '--fps', '60']).fps, 60);
  assert.equal(parseArgs(['--thumb-at', '0']).thumbAt, 0);
  for (const bad of [['--format', 'avi'], ['--aspect', '4:3'], ['--fps', 'x'], ['--nope'], ['--info', '--dry-run'], ['--pad-color', 'red']]) assert.throws(() => parseArgs(bad));

  const size = {x: 1920, y: 1080};
  assert.deepEqual(targetSize('16:9', size), size);
  assert.deepEqual(targetSize('9:16', size), {x: 1080, y: 1920});
  assert.deepEqual(targetSize('1:1', size), {x: 1080, y: 1080});

  const plan = planOutputs('v', ['mp4', 'gif'], ['16:9', '9:16'], true);
  assert.deepEqual(plan.map(p => p.file), ['v.mp4', 'v.gif', 'thumb.png', 'v-9x16.mp4', 'v-9x16.gif', 'thumb-9x16.png']);
  assert.deepEqual(plan.filter(p => p.master).map(p => p.file), ['v.mp4']);

  const args = encodeArgs(plan[3], {input: 'in.mp4', output: 'out.mp4', size, color: '#123456', thumbAt: 1});
  assert.ok(args.some(a => a.includes('pad=1080:1920') && a.includes('color=#123456')));
  assert.equal(sizeRange(1024 * 1024), '768 KB - 1.7 MB');
});

test('each recipe has code, an exported function and fixtures within its limits', async () => {
  const {loadRecipes, validateProps} = await import(pathToFileURL(join(skill, 'tools', 'lib', 'recipes.mjs')).href);
  const recipes = loadRecipes();
  assert.deepEqual(recipes.map(r => r.id), ['before-after', 'chapter', 'compare', 'intro', 'outro', 'steps']);
  const guide = readFileSync(join(skill, 'references', 'recipes.md'), 'utf8');
  for (const r of recipes) {
    const src = readFileSync(join(skill, 'assets', 'base', 'src', 'recipes', `${r.id}.tsx`), 'utf8');
    assert.match(src, new RegExp(`export function\\* ${r.function}\\(view: View2D`), `${r.id}: function ${r.function} not found`);
    assert.ok(guide.includes(`\`${r.function}\``), `references/recipes.md does not mention ${r.function}`);
    assert.ok(r.fixtures.short && r.fixtures.long, `${r.id}: needs short and long fixtures`);
    for (const [name, props] of Object.entries(r.fixtures)) assert.deepEqual(validateProps(r, props), [], `${r.id}/${name}`);
  }
});

test('recipe content validation reports what is wrong', async () => {
  const {loadRecipes, validateProps} = await import(pathToFileURL(join(skill, 'tools', 'lib', 'recipes.mjs')).href);
  const steps = loadRecipes().find(r => r.id === 'steps');
  assert.deepEqual(validateProps(steps, {title: 'Ok', steps: [{label: 'A'}, {label: 'B'}]}), []);
  const errors = validateProps(steps, {steps: [{label: 'x'.repeat(29)}], nope: 1});
  assert.ok(errors.some(e => e.includes('title is required')));
  assert.ok(errors.some(e => e.includes('at least 2')));
  assert.ok(errors.some(e => e.includes('steps[0].label has 29')));
  assert.ok(errors.some(e => e.includes('nope is not a known')));
});

const storyboardLib = () => import(pathToFileURL(join(skill, 'tools', 'lib', 'storyboard.mjs')).href);
const fixture = () => JSON.parse(read('test', 'fixtures', 'storyboard.json'));

test('storyboard validation', async () => {
  const {validateStoryboard} = await storyboardLib();
  assert.deepEqual(validateStoryboard(fixture()), {errors: [], warnings: []});
  const scene = {id: 'a', recipe: 'custom', shows: 'x', seconds: 5};
  assert.match(validateStoryboard({title: 'T', scenes: [{...scene, recipe: 'nope'}]}).errors[0], /unknown recipe "nope"/);
  assert.match(validateStoryboard({title: 'T', scenes: [scene, scene]}).errors[0], /repeated id/);
  assert.match(validateStoryboard({title: 'T', scenes: [{...scene, id: '1-a'}]}).errors[0], /kebab-case/);
  assert.match(validateStoryboard({title: 'T', scenes: [{...scene, seconds: 0}]}).errors[0], /seconds/);
  assert.match(validateStoryboard({title: 'T', scenes: [{...scene, recipe: 'intro', props: {title: 'x'.repeat(61)}}]}).errors[0], /title has 61/);
  assert.match(validateStoryboard({title: 'T', scenes: [{...scene, props: {captions: ['x'.repeat(86)]}}]}).errors[0], /captions\[0\] has 86/);
  assert.match(validateStoryboard({title: 'T', targetSeconds: 100, scenes: [scene]}).warnings[0], /add up to 5s/);
  const crowded = {...scene, seconds: 3, props: {captions: ['one two three four five six seven eight nine ten', 'one two three four five six seven eight nine ten']}};
  assert.match(validateStoryboard({title: 'T', scenes: [crowded]}).warnings[0], /20 words need about 7s/);
});

test('storyboard preview escapes its content', async () => {
  const {previewHtml} = await storyboardLib();
  const theme = JSON.parse(readFileSync(join(skill, 'themes', 'blueprint.json'), 'utf8'));
  const html = previewHtml({title: '<script>x</script>', scenes: [{id: 'a', recipe: 'intro', shows: 'a & b', seconds: 5, props: {title: '<b>'}}]}, theme);
  assert.ok(!html.includes('<script>x') && !html.includes('<b></'));
  assert.ok(html.includes('&lt;script&gt;') && html.includes('a &amp; b'));
});

test('storyboard generate writes scenes and keeps the ones edited by hand', async () => {
  const {generateScenes, compareDurations} = await storyboardLib();
  const project = mkdtempSync(join(tmpdir(), 'tm-test-'));
  try {
    const scenes = join(project, 'src', 'scenes');
    mkdirSync(scenes, {recursive: true});
    mkdirSync(join(project, 'src', 'recipes'));
    writeFileSync(join(project, 'src', 'recipes', 'shared.tsx'), '');
    writeFileSync(join(project, 'src', 'project.ts'), read('skills', 'tellmotion', 'assets', 'base', 'src', 'project.ts'));
    writeFileSync(join(scenes, 'example.tsx'), read('skills', 'tellmotion', 'assets', 'base', 'src', 'scenes', 'example.tsx'));
    writeFileSync(join(scenes, 'example.meta'), '{}');

    const sb = fixture();
    const first = generateScenes(sb, project);
    assert.equal(first.written.length, sb.scenes.length);
    assert.deepEqual(first.removed, ['example.tsx']);
    assert.ok(!existsSync(join(scenes, 'example.meta')));
    assert.match(readFileSync(join(project, 'src', 'project.ts'), 'utf8'), /scenes: \[openingScene, pointerScene, workflowScene, mergeOrRebaseScene, habitScene, closingScene\]/);
    assert.match(readFileSync(join(scenes, 'opening.tsx'), 'utf8'), /yield\* intro\(view, [^]*"seconds": 7/);
    const seed = readFileSync(join(scenes, 'opening.meta'), 'utf8');

    const edited = join(scenes, 'pointer.tsx');
    writeFileSync(edited, readFileSync(edited, 'utf8') + '// mine\n');
    const second = generateScenes(sb, project);
    assert.deepEqual(second.kept, ['pointer.tsx']);
    assert.match(readFileSync(edited, 'utf8'), /\/\/ mine/);
    assert.equal(readFileSync(join(scenes, 'opening.meta'), 'utf8'), seed, 'meta files must not change');
    assert.ok(!readFileSync(generateScenes(sb, project, {force: true}) && edited, 'utf8').includes('// mine'));

    assert.throws(() => generateScenes({...sb, scenes: sb.scenes.slice(0, 1)}, project), /not in the storyboard/);
    assert.throws(() => generateScenes({title: 'T', scenes: []}, project), /not valid/);

    const [ok, off, missing] = compareDurations({scenes: [{id: 'a', seconds: 10}, {id: 'b', seconds: 10}, {id: 'c', seconds: 10}]}, [{name: 'a', seconds: 11}, {name: 'b', seconds: 20}]);
    assert.deepEqual([ok.off, off.off, missing.real], [false, true, undefined]);
  } finally {
    rmSync(project, {recursive: true, force: true});
  }
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
