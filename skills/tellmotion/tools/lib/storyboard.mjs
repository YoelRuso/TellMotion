// Storyboard: the list of scenes of a video, checked and shown before anything is animated, then turned into scene files.
import {createHash, randomInt} from 'node:crypto';
import {copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadRecipes, validateProps} from './recipes.mjs';

const base = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'assets', 'base');
const SCENE_ID = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const DURATION_MARGIN = 0.2; // how far the total may drift from targetSeconds before it is worth a warning
const READING_WORDS_PER_SECOND = 3; // on-screen text, read while things move: slower than plain reading
const HEADER = /^\/\/ GENERATED from storyboard\.json \(([0-9a-f]{12})\)/;

/** Content of a scene with no recipe. The animation itself is written by hand in the generated file. */
const CUSTOM = {
  id: 'custom',
  props: {
    title: {type: 'string', maxChars: 70},
    captions: {type: 'array', maxChars: 85},
  },
};

const clean = text => String(text).replace(/\s+/g, ' ').trim();
const camel = id => id.replace(/-(\w)/g, (_, c) => c.toUpperCase());
const hash = text => createHash('sha1').update(text).digest('hex').slice(0, 12);

export function loadStoryboard(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    throw new Error(`Cannot read ${file}: ${e.message}`);
  }
}

const wordsIn = props => textsOf(props ?? {}).reduce((a, [, text]) => a + text.split(/\s+/).filter(Boolean).length, 0);

export const totalSeconds = sb => (sb.scenes ?? []).reduce((a, s) => a + (s.seconds ?? 0), 0);

/** Problems that block the storyboard (`errors`) and things worth telling the user (`warnings`). */
export function validateStoryboard(sb) {
  const errors = [];
  const warnings = [];
  if (typeof sb !== 'object' || sb === null) return {errors: ['The storyboard must be a JSON object'], warnings};
  if (typeof sb.title !== 'string' || !sb.title.trim()) errors.push('title is required');
  if (sb.targetSeconds !== undefined && !(sb.targetSeconds > 0)) errors.push('targetSeconds must be a positive number');
  if (!Array.isArray(sb.scenes) || !sb.scenes.length) return {errors: [...errors, 'scenes must be a list with at least one scene'], warnings};

  const recipes = new Map(loadRecipes().map(r => [r.id, r]));
  const seen = new Set();
  sb.scenes.forEach((s, i) => {
    const name = `scene ${i + 1}${s.id ? ` (${s.id})` : ''}`;
    if (typeof s.id !== 'string' || !SCENE_ID.test(s.id)) errors.push(`${name}: id must be kebab-case and start with a letter`);
    else if (seen.has(s.id)) errors.push(`${name}: repeated id`);
    seen.add(s.id);
    if (typeof s.shows !== 'string' || !s.shows.trim()) errors.push(`${name}: shows is required (what the viewer sees)`);
    if (!(s.seconds > 0)) errors.push(`${name}: seconds must be a positive number`);
    const recipe = s.recipe === 'custom' ? CUSTOM : recipes.get(s.recipe);
    if (!recipe) errors.push(`${name}: unknown recipe "${s.recipe}" (available: ${[...recipes.keys(), 'custom'].join(', ')})`);
    else for (const e of validateProps(recipe, s.props ?? {})) errors.push(`${name}: ${e}`);
    const words = wordsIn(s.props);
    if (s.seconds > 0 && words / READING_WORDS_PER_SECOND > s.seconds) warnings.push(`${name}: ${words} words need about ${Math.ceil(words / READING_WORDS_PER_SECOND)}s to read, but it lasts ${s.seconds}s`);
  });

  const total = totalSeconds(sb);
  if (sb.targetSeconds > 0 && Math.abs(total - sb.targetSeconds) > sb.targetSeconds * DURATION_MARGIN) {
    warnings.push(`The scenes add up to ${Math.round(total)}s but the target is ${sb.targetSeconds}s`);
  }
  return {errors, warnings};
}

const escapeHtml = text => String(text).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c]);

/** Every text of a scene, as [where, text] pairs. */
function textsOf(value, path = '') {
  if (typeof value === 'string') return [[path, value]];
  if (Array.isArray(value)) return value.flatMap(v => textsOf(v, path));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => textsOf(v, path ? `${path} · ${k}` : k));
  return [];
}

const clock = seconds => `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`;

/** Page that shows the storyboard in the colors and font of the theme, for the user to approve. */
export function previewHtml(sb, theme) {
  const {colors: c, fonts: f} = theme;
  const total = totalSeconds(sb);
  let at = 0;
  const cards = sb.scenes.map((s, i) => {
    const color = c.categories[i % c.categories.length];
    const start = at;
    at += s.seconds;
    const texts = textsOf(s.props ?? {}).map(([where, text]) => `<li><span>${escapeHtml(where)}</span>${escapeHtml(text)}</li>`).join('');
    return `<article style="border-left-color:${color}"><header><b>${i + 1}</b><h2>${escapeHtml(s.id)}</h2><em>${escapeHtml(s.recipe)}</em><time>${clock(start)} · ${s.seconds}s</time></header><p>${escapeHtml(s.shows)}</p>${texts ? `<ul>${texts}</ul>` : ''}</article>`;
  });
  const bar = sb.scenes.map((s, i) => `<i style="flex:${s.seconds};background:${c.categories[i % c.categories.length]}" title="${escapeHtml(s.id)}"></i>`).join('');
  const target = sb.targetSeconds ? ` of a ${clock(sb.targetSeconds)} target` : '';
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(sb.title)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${f.google}&display=swap">
<style>
*{box-sizing:border-box}body{margin:0;background:${c.background};color:${c.text};font:17px/1.5 "${f.family}",${f.fallback};padding:40px 16px}main{max-width:900px;margin:auto}
h1{font-size:40px;line-height:1.15;margin:0 0 8px}.sum{color:${c.muted};margin:0 0 20px}.bar{display:flex;gap:3px;height:14px;margin-bottom:28px}.bar i{min-width:4px;border-radius:2px}
article{background:${c.surface};border:1px solid ${c.line};border-left:8px solid;border-radius:${Math.min(theme.shape.radius, 12)}px;padding:18px 22px;margin-bottom:14px}
header{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 12px}h2{font-size:20px;margin:0}header em{font-style:normal;font-size:14px;border:1px solid ${c.line};border-radius:99px;padding:0 10px}time{margin-left:auto;color:${c.muted};font-size:15px}
p{margin:8px 0}ul{list-style:none;margin:10px 0 0;padding:10px 0 0;border-top:1px solid ${c.line}}li{margin-bottom:4px;overflow-wrap:anywhere}li span{color:${c.muted};font-size:14px;margin-right:10px}
</style><main><h1>${escapeHtml(sb.title)}</h1><p class="sum">${sb.scenes.length} scenes · ${clock(total)}${target} · ${escapeHtml(theme.name)}</p><div class="bar">${bar}</div>${cards.join('\n')}</main></html>\n`;
}

function recipeScene(scene, recipe) {
  const props = JSON.stringify({...scene.props, seconds: scene.seconds}, null, 2).replace(/\n/g, '\n  ');
  return `import {makeScene2D} from '@motion-canvas/2d';
import {${recipe.function}} from '../recipes/${recipe.id}';

export default makeScene2D(function* (view) {
  yield* ${recipe.function}(view, ${props});
});
`;
}

/** Scene that already runs, with its title, captions and duration, waiting for its animation. */
function customScene(scene) {
  const captions = scene.props?.captions ?? [];
  const title = scene.props?.title;
  const wait = Math.max(scene.seconds - 1.2, 0.5) / Math.max(captions.length, 1);
  return `import {makeScene2D} from '@motion-canvas/2d';
import {all, waitFor} from '@motion-canvas/core';
import {prepareScene} from '../components/Scene';
import {t} from '../config';

// ---------- EDITABLE TEXT ----------
const TITLE = ${JSON.stringify(title ?? null)};
const CAPTIONS: string[] = ${JSON.stringify(captions)};
// -----------------------------------

// TODO animate: ${clean(scene.shows)}
export default makeScene2D(function* (view) {
  // Remove {legend: false} and edit LEGEND in src/config.ts if this scene uses category colors
  const {sub, enter, leave} = prepareScene(view, TITLE, {legend: false});

  yield* enter();
  for (const caption of CAPTIONS) {
    yield* sub.say(caption);
    yield* waitFor(t(${+wait.toFixed(2)}));
  }
  if (!CAPTIONS.length) yield* waitFor(t(${+wait.toFixed(2)}));
  yield* all(sub.hide(), leave());
});
`;
}

/** True when the file still is what this tool generated, so that writing over it loses nothing. */
function isUntouched(file) {
  const text = readFileSync(file, 'utf8');
  const nl = text.indexOf('\n');
  const match = text.slice(0, nl).match(HEADER);
  return !!match && match[1] === hash(text.slice(nl + 1));
}

/**
 * Writes the scene files and src/project.ts of a storyboard into a project. Scenes edited by hand are kept
 * unless `force` is set. Returns what happened to each file.
 */
export function generateScenes(sb, project, {force = false} = {}) {
  const {errors} = validateStoryboard(sb);
  if (errors.length) throw new Error(`The storyboard is not valid:\n  ${errors.join('\n  ')}`);
  const scenesDir = join(project, 'src', 'scenes');
  if (!existsSync(scenesDir)) throw new Error(`${project} is not a TellMotion project (src/scenes not found)`);
  const usesRecipes = sb.scenes.some(s => s.recipe !== 'custom');
  if (usesRecipes && !existsSync(join(project, 'src', 'recipes', 'shared.tsx'))) throw new Error(`${project} was created before scene recipes existed: copy assets/base/src/recipes and assets/base/src/components/Scene.tsx into it first`);

  // A project.ts with scenes this storyboard does not know about was organized by hand
  const projectFile = join(project, 'src', 'project.ts');
  const ids = new Set(sb.scenes.map(s => s.id));
  const listed = [...readFileSync(projectFile, 'utf8').matchAll(/\.\/scenes\/([\w-]+)\?scene/g)].map(m => m[1]);
  const unknown = listed.filter(n => !ids.has(n) && n !== 'example');
  if (unknown.length && !force) throw new Error(`src/project.ts lists scenes that are not in the storyboard: ${unknown.join(', ')}. Add them to the storyboard, or use --force to drop them from the video`);

  const recipes = new Map(loadRecipes().map(r => [r.id, r]));
  const result = {written: [], kept: [], removed: []};
  for (const scene of sb.scenes) {
    const file = join(scenesDir, `${scene.id}.tsx`);
    if (existsSync(file) && !force && !isUntouched(file)) {
      result.kept.push(`${scene.id}.tsx`);
    } else {
      const body = scene.recipe === 'custom' ? customScene(scene) : recipeScene(scene, recipes.get(scene.recipe));
      writeFileSync(file, `// GENERATED from storyboard.json (${hash(body)}). If you edit this file, "storyboard.mjs generate" keeps your version.\n${body}`);
      result.written.push(`${scene.id}.tsx`);
    }
    const meta = join(scenesDir, `${scene.id}.meta`);
    if (!existsSync(meta)) writeFileSync(meta, JSON.stringify({version: 0, timeEvents: [], seed: randomInt(1, 2 ** 31)}, null, 2));
  }

  const names = sb.scenes.map(s => `${camel(s.id)}Scene`);
  const imports = sb.scenes.map((s, i) => `import ${names[i]} from './scenes/${s.id}?scene';`).join('\n');
  writeFileSync(projectFile, `import {makeProject} from '@motion-canvas/core';\n\n${imports}\n\n// Playback order of the scenes. Generated from storyboard.json\nexport default makeProject({\n  scenes: [${names.join(', ')}],\n});\n`);

  // The template's placeholder scene, only if nobody has changed it
  const example = join(scenesDir, 'example.tsx');
  if (!ids.has('example') && existsSync(example) && readFileSync(example, 'utf8') === readFileSync(join(base, 'src', 'scenes', 'example.tsx'), 'utf8')) {
    rmSync(example);
    rmSync(join(scenesDir, 'example.meta'), {force: true});
    result.removed.push('example.tsx');
  }
  return result;
}

/** Copies the storyboard into the project, where it stays next to the code it describes. */
export function installStoryboard(file, project) {
  const target = join(project, 'storyboard.json');
  mkdirSync(project, {recursive: true});
  if (resolve(file) !== resolve(target)) copyFileSync(file, target);
}

/** Planned against real seconds per scene, from a measured project. */
export function compareDurations(sb, measured, margin = 0.25, slack = 2) {
  const real = new Map(measured.map(s => [s.name, s.seconds]));
  return sb.scenes.map(s => {
    const seconds = real.get(s.id);
    const off = seconds !== undefined && Math.abs(seconds - s.seconds) > Math.max(s.seconds * margin, slack);
    return {id: s.id, planned: s.seconds, real: seconds, off};
  });
}
