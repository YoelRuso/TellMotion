#!/usr/bin/env node
// Renders a quick side-by-side PNG of some themes for review. Usage: node scripts/preview-batch.mjs <id> <id> ... [--out file.png]
// Output defaults to .batches/<ids>.png (git-ignored). Needs Google Chrome (set CHROME to override).
import {existsSync, mkdirSync, mkdtempSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {loadAllThemes} from '../skills/tellmotion/tools/lib/theme.mjs';
import {renderPreview} from '../skills/tellmotion/tools/lib/render-preview.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const oi = args.indexOf('--out');
const outArg = oi >= 0 ? args.splice(oi, 2)[1] : null;
const ids = args;
if (!ids.length) throw new Error('Usage: preview-batch.mjs <theme-id> ...');
const all = loadAllThemes().map(x => x.theme);
const themes = ids.map(id => all.find(t => t.id === id) || (() => { throw new Error('Unknown theme: ' + id); })());

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(p => p && existsSync(p));
if (!CHROME) throw new Error('Chrome not found: set CHROME');

const cw = 800, ch = 450, gap = 24, pad = 24;
const W = pad * 2 + themes.length * cw + (themes.length - 1) * gap, H = pad * 2 + ch + 70;
const fonts = [...new Set(themes.map(t => t.fonts.google))].map(g => `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${g}&display=swap">`).join('');
const html = `<!doctype html><meta charset="utf-8">${fonts}<style>body{margin:0;background:#0b0b12;color:#eee;font-family:system-ui;width:${W}px;height:${H}px}
.g{display:flex;gap:${gap}px;padding:${pad}px}.c{width:${cw}px}.p{width:${cw}px;height:${ch}px;border-radius:12px;overflow:hidden;border:1px solid #333}b{display:block;font-size:22px;margin-top:10px}small{color:#9aa}</style>
<div class="g">${themes.map(t => `<div class="c"><div class="p">${renderPreview(t, {fonts: false}).replace('width="1920" height="1080"', 'width="100%" height="100%"')}</div><b>${t.name}</b><small>${t.family} · ${t.moods.join(', ')} · ${t.fonts.family}</small></div>`).join('')}</div>`;

const dir = join(root, '.batches');
mkdirSync(dir, {recursive: true});
const out = outArg ? resolve(outArg) : join(dir, ids.join('+') + '.png');
const page = join(mkdtempSync(join(tmpdir(), 'tm-batch-')), 'page.html');
writeFileSync(page, html);
const r = spawnSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', `--window-size=${W},${H}`, '--virtual-time-budget=9000', `--screenshot=${out}`, pathToFileURL(page).href], {stdio: 'ignore'});
if (r.status !== 0 || !existsSync(out)) throw new Error('Chrome screenshot failed');
console.log(out);
