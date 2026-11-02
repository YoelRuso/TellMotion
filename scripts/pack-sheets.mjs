#!/usr/bin/env node
// Renders every pack demo, plus a scene with the pieces at their limits, and writes one contact sheet per scene and theme.
// Usage: node scripts/pack-sheets.mjs <outDir> [themeId ...]     (needs bash, npm, network access and a browser)
import {copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skill = join(root, 'skills', 'tellmotion');
const [outArg, ...themeArgs] = process.argv.slice(2);
if (!outArg) throw new Error('Usage: node scripts/pack-sheets.mjs <outDir> [themeId ...]');
const out = resolve(outArg);
// A boxed theme, a light one, and the two whose boxes are filled with color
const themes = themeArgs.length ? themeArgs : ['blueprint', 'clean-editorial', 'neo-brutal', 'sticker-pop'];
mkdirSync(out, {recursive: true});
const work = mkdtempSync(join(tmpdir(), 'tm-pack-sheets-'));
const id = s => s.replace(/-(\w)/g, (_, c) => c.toUpperCase());
const FRAMES = [0.2, 0.35, 0.5, 0.65, 0.8, 0.93]; // moments of each scene, as a share of its length

const run = (cmd, args, cwd, shell = false) => {
  const r = spawnSync(cmd, args, {cwd, stdio: 'inherit', shell});
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed in ${cwd}`);
};

function addStressScene(project) {
  copyFileSync(join(root, 'scripts', 'pack-sheet-stress.tsx'), join(project, 'src/scenes/pack-limits.tsx'));
  writeFileSync(join(project, 'src/scenes/pack-limits.meta'), JSON.stringify({version: 0, timeEvents: [], seed: 4242}));
  const names = readdirSync(join(project, 'src/scenes'))
    .filter(f => f.endsWith('.tsx') && f !== 'example.tsx')
    .map(f => f.replace('.tsx', ''));
  const imports = names.map(n => `import ${id(n)} from './scenes/${n}?scene';`).join('\n');
  writeFileSync(join(project, 'src/project.ts'), `import {makeProject} from '@motion-canvas/core';\n\n${imports}\n\nexport default makeProject({\n  scenes: [${names.map(id).join(', ')}],\n});\n`);
  rmSync(join(project, 'src/scenes/example.tsx'), {force: true});
  rmSync(join(project, 'src/scenes/example.meta'), {force: true});
  return names;
}

let failed = 0;
for (const theme of themes) {
  console.log(`\n▶ ${theme}`);
  try {
    const name = `packs-${theme}`;
    const project = join(work, name);
    run('bash', [join(skill, 'scripts/new-project.sh'), name, '--theme', theme, '--pack', 'all', '--demos'], work);
    const scenes = addStressScene(project);
    run('npm', ['run', 'typecheck'], project, true);
    run('npm', ['run', 'render', '--', '--fps', '10', '--scale', '0.5'], project, true);

    const report = JSON.parse(readFileSync(join(project, 'output', name, 'render.json'), 'utf8'));
    const require = createRequire(join(project, 'package.json'));
    const ffmpeg = createRequire(require.resolve('@motion-canvas/ffmpeg/package.json'))('@ffmpeg-installer/ffmpeg').path;
    const video = join(project, 'output', name, `${name}.mp4`);
    let start = 0;
    report.scenes.forEach((s, i) => {
      const frames = join(work, `${theme}-${scenes[i]}`);
      mkdirSync(frames, {recursive: true});
      FRAMES.forEach((share, k) => run(ffmpeg, ['-v', 'error', '-y', '-ss', (start + s.seconds * share).toFixed(2), '-i', video, '-frames:v', '1', join(frames, `${k}.png`)], work));
      run(ffmpeg, ['-v', 'error', '-y', '-framerate', '1', '-i', join(frames, '%d.png'), '-vf', 'scale=640:-1,tile=3x2:padding=6', '-frames:v', '1', join(out, `${theme}-${scenes[i]}.png`)], work);
      start += s.seconds;
    });
    console.log(`✓ ${out} (${theme})`);
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
