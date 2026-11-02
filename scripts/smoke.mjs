#!/usr/bin/env node
// End-to-end smoke test: scaffold a project with ALL packs and demos for a few themes, install and type-check it.
// Usage: node scripts/smoke.mjs [themeId ...]     (needs bash, npm and network access for npm install)
import {existsSync, mkdtempSync, rmSync, statSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {findBrowser} from '../skills/tellmotion/tools/render.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(root, 'skills', 'tellmotion', 'scripts', 'new-project.sh');
const themes = process.argv.slice(2).length ? process.argv.slice(2) : ['blueprint', 'neo-brutal', 'retro-terminal'];
const work = mkdtempSync(join(tmpdir(), 'tm-smoke-'));
let failed = 0;

for (const theme of themes) {
  const name = `smoke-${theme}`;
  console.log(`\n▶ ${theme}: scaffold + install + typecheck`);
  const a = spawnSync('bash', [script, name, '--theme', theme, '--pack', 'all', '--demos'], {cwd: work, stdio: 'inherit'});
  const b = a.status === 0 ? spawnSync('npm', ['run', 'typecheck'], {cwd: join(work, name), stdio: 'inherit', shell: true}) : a;
  if (b.status !== 0) {
    failed++;
    console.error(`✗ ${theme} failed`);
  } else console.log(`✓ ${theme}`);
}

// Real render of the minimal template. Guards against Motion Canvas updates breaking the private Renderer API used by render.mjs.
if (findBrowser()) {
  console.log('\n▶ render: scaffold + npm run render');
  const name = 'smoke-render';
  const a = spawnSync('bash', [script, name, '--theme', 'blueprint'], {cwd: work, stdio: 'inherit'});
  const b = a.status === 0 ? spawnSync('npm', ['run', 'render', '--', '--fps', '10', '--scale', '0.25'], {cwd: join(work, name), stdio: 'inherit', shell: true}) : a;
  const mp4 = join(work, name, 'output', name, `${name}.mp4`);
  if (b.status !== 0 || !existsSync(mp4) || statSync(mp4).size === 0) {
    failed++;
    console.error('✗ render failed');
  } else console.log('✓ render');

  // The whole storyboard flow on that project: generated scenes must type-check and run
  console.log('\n▶ storyboard: generate + typecheck + duration');
  const tool = join(root, 'skills', 'tellmotion', 'tools', 'storyboard.mjs');
  const fixture = join(root, 'test', 'fixtures', 'storyboard.json');
  const c = spawnSync(process.execPath, [tool, 'generate', fixture, name], {cwd: work, stdio: 'inherit'});
  const d = c.status === 0 ? spawnSync('npm', ['run', 'typecheck'], {cwd: join(work, name), stdio: 'inherit', shell: true}) : c;
  const e = d.status === 0 ? spawnSync(process.execPath, [tool, 'duration', name], {cwd: work, stdio: 'inherit'}) : d;
  if (e.status !== 0) {
    failed++;
    console.error('✗ storyboard failed');
  } else console.log('✓ storyboard');
} else console.log('\n! render skipped: no browser found');

// On Windows a child process can hold the folder for a moment; a leftover temp folder must not fail the test
try {
  rmSync(work, {recursive: true, force: true, maxRetries: 10, retryDelay: 300});
} catch {
  console.log(`! could not remove ${work}`);
}
process.exit(failed ? 1 : 0);
