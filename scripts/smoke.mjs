#!/usr/bin/env node
// End-to-end smoke test: scaffold a project with ALL packs and demos for a few themes, install and type-check it.
// Usage: node scripts/smoke.mjs [themeId ...]     (needs bash, npm and network access for npm install)
import {mkdtempSync, rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

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
rmSync(work, {recursive: true, force: true});
process.exit(failed ? 1 : 0);
