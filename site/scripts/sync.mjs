// Regenerates the theme catalog from skills/tellmotion/themes and copies the preview renderer for the browser.
// Run automatically by `npm run dev` / `npm run build`.
import {copyFileSync, mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const skill = join(here, '..', '..', 'skills', 'tellmotion');
const r = spawnSync(process.execPath, [join(skill, 'tools', 'build-catalog.mjs'), join(here, '..', 'public'), '--no-gallery'], {stdio: 'inherit'});
if (r.status !== 0) process.exit(r.status ?? 1);
mkdirSync(join(here, '..', 'src', 'lib'), {recursive: true});
copyFileSync(join(skill, 'tools', 'lib', 'render-preview.mjs'), join(here, '..', 'src', 'lib', 'render-preview.mjs'));
console.log('✓ catalog + renderer synced');
