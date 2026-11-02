#!/usr/bin/env node
// Renders every recipe with its short and long fixtures in contrasting themes and writes one contact sheet per theme.
// Usage: node scripts/recipe-sheets.mjs <outDir> [themeId ...]     (needs bash, npm, network access and a browser)
import {copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadRecipes, validateProps} from '../skills/tellmotion/tools/lib/recipes.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skill = join(root, 'skills', 'tellmotion');
const [outArg, ...themeArgs] = process.argv.slice(2);
if (!outArg) throw new Error('Usage: node scripts/recipe-sheets.mjs <outDir> [themeId ...]');
const out = resolve(outArg);
const themes = themeArgs.length ? themeArgs : ['blueprint', 'clean-editorial', 'aurora-glass', 'neo-brutal', 'chalkboard', 'retro-terminal', 'obsidian-gold'];
mkdirSync(out, {recursive: true});
const work = mkdtempSync(join(tmpdir(), 'tm-sheets-'));
const recipes = loadRecipes();
const id = s => s.replace(/-(\w)/g, (_, c) => c.toUpperCase());

function writeScenes(project) {
  const names = [];
  recipes.forEach((r, i) => {
    for (const [fixture, props] of Object.entries(r.fixtures)) {
      const errors = validateProps(r, props);
      if (errors.length) throw new Error(`${r.id}/${fixture}: ${errors.join('; ')}`);
      const name = `${r.id}-${fixture}`;
      names.push(name);
      writeFileSync(join(project, 'src/scenes', `${name}.tsx`), `import {makeScene2D} from '@motion-canvas/2d';\nimport {${r.function}} from '../recipes/${r.id}';\n\nexport default makeScene2D(function* (view) {\n  yield* ${r.function}(view, ${JSON.stringify(props)});\n});\n`);
      writeFileSync(join(project, 'src/scenes', `${name}.meta`), JSON.stringify({version: 0, timeEvents: [], seed: 1000 + i}));
    }
  });
  const imports = names.map(n => `import ${id(n)} from './scenes/${n}?scene';`).join('\n');
  writeFileSync(join(project, 'src/project.ts'), `import {makeProject} from '@motion-canvas/core';\n\n${imports}\n\nexport default makeProject({\n  scenes: [${names.map(id).join(', ')}],\n});\n`);
  rmSync(join(project, 'src/scenes/example.tsx'), {force: true});
  rmSync(join(project, 'src/scenes/example.meta'), {force: true});
}

const run = (cmd, args, cwd, shell = false) => {
  const r = spawnSync(cmd, args, {cwd, stdio: 'inherit', shell});
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed in ${cwd}`);
};

let failed = 0;
for (const theme of themes) {
  console.log(`\n▶ ${theme}`);
  try {
    const name = `sheet-${theme}`;
    const project = join(work, name);
    run('bash', [join(skill, 'scripts/new-project.sh'), name, '--theme', theme], work);
    writeScenes(project);
    run('npm', ['run', 'typecheck'], project, true);
    run('npm', ['run', 'render', '--', '--fps', '10', '--scale', '0.5'], project, true);

    // One frame near the end of each scene, once everything is on screen and before it fades out
    const report = JSON.parse(readFileSync(join(project, 'output', name, 'render.json'), 'utf8'));
    const pace = JSON.parse(readFileSync(join(skill, 'themes', `${theme}.json`), 'utf8')).motion.pace;
    const require = createRequire(join(project, 'package.json'));
    const ffmpeg = createRequire(require.resolve('@motion-canvas/ffmpeg/package.json'))('@ffmpeg-installer/ffmpeg').path;
    const video = join(project, 'output', name, `${name}.mp4`);
    let end = 0;
    report.scenes.forEach((s, i) => {
      end += s.seconds;
      const at = Math.max(end - 1.4 * pace, 0);
      run(ffmpeg, ['-v', 'error', '-y', '-ss', at.toFixed(2), '-i', video, '-frames:v', '1', join(out, `${theme}-${String(i).padStart(2, '0')}.png`)], work);
    });
    run(ffmpeg, ['-v', 'error', '-y', '-framerate', '1', '-i', join(out, `${theme}-%02d.png`), '-vf', 'scale=640:-1,tile=4x3:padding=6', '-frames:v', '1', join(out, `sheet-${theme}.png`)], work);
    console.log(`✓ ${join(out, `sheet-${theme}.png`)}`);
  } catch (e) {
    failed++;
    console.error(`✗ ${theme}: ${e.message}`);
  }
}
try {
  rmSync(work, {recursive: true, force: true, maxRetries: 10, retryDelay: 300});
} catch {
  console.log(`! could not remove ${work}`);
}
process.exit(failed ? 1 : 0);
