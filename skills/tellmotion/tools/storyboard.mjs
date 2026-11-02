#!/usr/bin/env node
// Plan a video before animating it.
// Usage:
//   node tools/storyboard.mjs validate <storyboard.json>
//   node tools/storyboard.mjs preview <storyboard.json> --theme <id|theme.json> --out <dir>   writes <dir>/storyboard.html
//   node tools/storyboard.mjs generate <storyboard.json> <projectDir> [--force]               writes scenes and src/project.ts
//   node tools/storyboard.mjs duration <projectDir>                                           planned vs real seconds per scene
import {spawnSync} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {compareDurations, generateScenes, installStoryboard, loadStoryboard, previewHtml, totalSeconds, validateStoryboard} from './lib/storyboard.mjs';
import {loadTheme, validateTheme} from './lib/theme.mjs';

const USAGE = 'Usage: storyboard.mjs validate <file> | preview <file> --theme <id|file> --out <dir> | generate <file> <project> [--force] | duration <project>';

function option(args, name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

function check(file) {
  const sb = loadStoryboard(file);
  const {errors, warnings} = validateStoryboard(sb);
  for (const w of warnings) console.log(`! ${w}`);
  if (errors.length) throw new Error(`${errors.length} problem(s) in ${file}:\n  ${errors.join('\n  ')}`);
  return sb;
}

const commands = {
  validate([file]) {
    const sb = check(file);
    const width = Math.max(...sb.scenes.map(s => s.id.length));
    for (const s of sb.scenes) console.log(`${s.id.padEnd(width)}  ${String(s.recipe).padEnd(12)}  ${String(s.seconds).padStart(4)}s  ${s.shows}`);
    console.log(`✓ ${sb.scenes.length} scenes, ${Math.round(totalSeconds(sb))}s`);
  },
  preview([file, ...args]) {
    const themeArg = option(args, '--theme');
    const out = option(args, '--out');
    if (!themeArg || !out) throw new Error(USAGE);
    const sb = check(file);
    const theme = loadTheme(themeArg);
    const errs = validateTheme(theme);
    if (errs.length) throw new Error(`Invalid theme:\n  ${errs.join('\n  ')}`);
    mkdirSync(out, {recursive: true});
    const page = join(out, 'storyboard.html');
    writeFileSync(page, previewHtml(sb, theme));
    console.log(`✓ ${resolve(page)}`);
  },
  generate([file, project, ...args]) {
    if (!project) throw new Error(USAGE);
    const sb = check(file);
    const {written, kept, removed} = generateScenes(sb, project, {force: args.includes('--force')});
    installStoryboard(file, project);
    if (written.length) console.log(`✓ written: ${written.join(', ')}`);
    if (kept.length) console.log(`! kept because they were edited by hand (--force overwrites them): ${kept.join(', ')}`);
    if (removed.length) console.log(`  removed the template's placeholder: ${removed.join(', ')}`);
    console.log('  src/project.ts now follows the storyboard');
  },
  duration([project]) {
    if (!project) throw new Error(USAGE);
    const sb = check(join(project, 'storyboard.json'));
    const render = join(dirname(fileURLToPath(import.meta.url)), 'render.mjs');
    const r = spawnSync(process.execPath, [render, project, '--info', '--json'], {encoding: 'utf8', maxBuffer: 16 * 1024 * 1024});
    if (r.status !== 0) throw new Error(`Could not measure the project: ${r.stderr.trim()}`);
    const info = JSON.parse(r.stdout);
    const rows = compareDurations(sb, info.scenes);
    const width = Math.max(...rows.map(x => x.id.length), 5);
    console.log(`${'Scene'.padEnd(width)}  Planned  Real`);
    for (const x of rows) console.log(`${x.id.padEnd(width)}  ${`${x.planned}s`.padStart(7)}  ${x.real === undefined ? 'not in the project' : `${x.real.toFixed(1)}s`}${x.off ? '  <- off' : ''}`);
    console.log(`${'Total'.padEnd(width)}  ${`${Math.round(totalSeconds(sb))}s`.padStart(7)}  ${(info.frames / info.fps).toFixed(1)}s`);
    const off = rows.filter(x => x.off).length;
    console.log(off ? `! ${off} scene(s) far from the plan: change "hold" or the plan, and tell the user` : '✓ Close to the plan');
  },
};

const [command, ...args] = process.argv.slice(2);
try {
  if (!commands[command] || !args.length) throw new Error(USAGE);
  commands[command](args);
} catch (e) {
  console.error(`✗ ${e.message}`);
  process.exit(1);
}
