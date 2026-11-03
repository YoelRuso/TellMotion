#!/usr/bin/env node
// Generates the README visuals from the theme files: docs/assets/banner.png, themes-grid.png and live-preview.gif.
// Usage: node scripts/readme-assets.mjs        (needs Google Chrome/Chromium and ffmpeg; set CHROME / FFMPEG to override)
import {copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {loadAllThemes} from '../skills/tellmotion/tools/lib/theme.mjs';
import {renderPreview} from '../skills/tellmotion/tools/lib/render-preview.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'docs', 'assets');
mkdirSync(out, {recursive: true});
const work = mkdtempSync(join(tmpdir(), 'tm-readme-'));

function find(cands) {
  return cands.find(p => p && existsSync(p));
}
const CHROME = find([process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']);
function findFfmpeg() {
  const hit = [];
  const walk = (d, depth) => {
    if (depth > 6 || hit.length) return;
    try {
      for (const e of readdirSync(d, {withFileTypes: true})) {
        if (e.isFile() && /^ffmpeg(\.exe)?$/.test(e.name)) hit.push(join(d, e.name));
        else if (e.isDirectory() && (e.name === 'node_modules' || depth < 5)) walk(join(d, e.name), depth + 1);
      }
    } catch {}
  };
  if (process.env.FFMPEG) return process.env.FFMPEG;
  walk(resolve(root, '..'), 0);
  return hit[0] || 'ffmpeg';
}
const FFMPEG = findFfmpeg();
if (!CHROME) throw new Error('Chrome not found: set the CHROME environment variable');

const all = loadAllThemes().map(x => x.theme);
// pick up to 16 themes spread across families
function pickSpread(n) {
  const byFam = new Map();
  all.forEach(t => (byFam.get(t.family) || byFam.set(t.family, []).get(t.family)).push(t));
  const res = [];
  for (let i = 0; res.length < Math.min(n, all.length); i++) for (const list of byFam.values()) if (list[i] && res.length < n) res.push(list[i]);
  return res;
}
const byId = id => all.find(t => t.id === id) || all[0];
const svg = t => renderPreview(t, {fonts: false}).replace('width="1920" height="1080"', 'width="100%" height="100%"');
const fontLinks = themes => [...new Set(themes.map(t => t.fonts.google))].map(g => `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${g}&display=swap">`).join('') +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap">';

function shot(html, file, w, h) {
  const page = join(work, file.replace(/\W+/g, '_') + '.html');
  writeFileSync(page, html);
  const r = spawnSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', `--window-size=${w},${h}`, '--virtual-time-budget=9000', `--screenshot=${file}`, pathToFileURL(page).href], {stdio: 'ignore'});
  if (r.status !== 0 || !existsSync(file)) throw new Error('Chrome screenshot failed for ' + file);
  console.log('✓', file);
}

const BG = `body{margin:0;background:#06060b;color:#f1f2f8;font-family:Inter,sans-serif;overflow:hidden}
.amb{position:absolute;inset:0;background:radial-gradient(900px 520px at 8% -10%,rgba(124,92,255,.42),transparent 60%),radial-gradient(800px 520px at 96% 0%,rgba(34,211,238,.26),transparent 60%),radial-gradient(700px 600px at 50% 112%,rgba(255,106,169,.2),transparent 60%)}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:56px 56px;mask-image:radial-gradient(ellipse at 40% 20%,#000,transparent 75%)}
.grad{background:linear-gradient(100deg,#7c5cff,#22d3ee 45%,#fbbf24 75%,#ff6aa9);-webkit-background-clip:text;background-clip:text;color:transparent}`;

// ---------------- banner ----------------
const bt = [byId('blueprint'), byId('neo-brutal'), byId('aurora-glass')];
shot(
  `<!doctype html><meta charset="utf-8">${fontLinks(bt)}<style>${BG}
.logo{display:flex;align-items:center;gap:18px;font:800 38px 'Bricolage Grotesque';letter-spacing:-.03em}
.logo i{width:56px;height:56px;border-radius:15px;background:linear-gradient(135deg,#7c5cff,#22d3ee);display:grid;place-items:center}
.logo i:after{content:'';border-left:20px solid #06060b;border-top:12px solid transparent;border-bottom:12px solid transparent;margin-left:5px}
.txt{position:absolute;left:84px;top:96px;width:700px}
h1{font:800 78px/1 'Bricolage Grotesque';letter-spacing:-.04em;margin:34px 0 22px}
p{font-size:23px;line-height:1.5;color:#a1a6bd;margin:0}
.pills{display:flex;gap:12px;margin-top:34px}.pills span{padding:9px 18px;border-radius:99px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.05);font:600 17px 'JetBrains Mono';color:#cfd3ea}
.card{position:absolute;width:560px;height:315px;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,.2);box-shadow:0 40px 90px rgba(0,0,0,.65)}
.c1{right:10px;top:40px;transform:rotate(7deg);z-index:1}.c2{right:150px;top:190px;transform:rotate(-5deg);z-index:2}.c3{right:-20px;top:300px;transform:rotate(3deg);z-index:3}
</style><div class="amb"></div><div class="grid"></div>
<div class="txt"><div class="logo"><i></i>TellMotion</div>
<h1>Turn any idea into a <span class="grad">motion story</span></h1>
<p>An open-source skill for AI coding agents. Pick a look, describe your idea, get a ready-to-render animation.</p>
<div class="pills"><span>${all.length}+ themes</span><span>${readdirSync(join(root, 'skills', 'tellmotion', 'assets', 'packs')).length} packs</span><span>Motion Canvas</span></div></div>
<div class="card c1">${svg(bt[0])}</div><div class="card c2">${svg(bt[1])}</div><div class="card c3">${svg(bt[2])}</div>`,
  join(out, 'banner.png'), 1600, 700,
);

// ---------------- themes grid ----------------
const g = pickSpread(16);
const cols = 4, cw = 372, ch = Math.round((cw * 9) / 16), gap = 20, pad = 40;
const rows = Math.ceil(g.length / cols);
const gh = pad * 2 + rows * (ch + 56) + (rows - 1) * gap + 70;
shot(
  `<!doctype html><meta charset="utf-8">${fontLinks(g)}<style>${BG}
h2{position:absolute;left:${pad}px;top:26px;margin:0;font:800 30px 'Bricolage Grotesque';letter-spacing:-.02em}
.g{position:absolute;left:${pad}px;top:${pad + 40}px;display:grid;grid-template-columns:repeat(${cols},${cw}px);gap:${gap}px}
.c .p{width:${cw}px;height:${ch}px;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.14);box-shadow:0 14px 40px rgba(0,0,0,.5)}
.c b{display:block;font:700 19px 'Bricolage Grotesque';margin-top:10px}.c span{font-size:13.5px;color:#a1a6bd}
</style><div class="amb"></div><h2>${all.length}+ themes — <span class="grad">same diagram, completely different looks</span></h2>
<div class="g">${g.map(t => `<div class="c"><div class="p">${svg(t)}</div><b>${t.name}</b><span>${t.family} · ${t.moods.filter(m => m !== t.family).slice(0, 2).join(', ')}</span></div>`).join('')}</div>`,
  join(out, 'themes-grid.png'), pad * 2 + cols * cw + (cols - 1) * gap, gh,
);

// ---------------- live preview gif ----------------
const slides = pickSpread(10);
const frames = [];
slides.forEach((t, i) => {
  const f = join(work, `frame${String(i).padStart(2, '0')}.png`);
  shot(
    `<!doctype html><meta charset="utf-8">${fontLinks([t])}<style>${BG}
.w{position:absolute;left:60px;top:48px;right:60px;bottom:96px;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.18);box-shadow:0 30px 80px rgba(0,0,0,.6)}
.bar{position:absolute;left:60px;right:60px;bottom:30px;font:600 20px 'JetBrains Mono';color:#a1a6bd;text-align:center}.bar b{color:#22d3ee}
</style><div class="amb"></div><div class="w">${svg(t)}</div><div class="bar">&gt; Make a video about Git branches · theme: <b>${t.id}</b></div>`,
    f, 1280, 720,
  );
  frames.push(f);
});
// Crossfades are blended frame by frame (works with old ffmpeg builds that lack the xfade filter)
const W = 880, H = 495, HOLD = 17, MIX = [0.2, 0.4, 0.6, 0.8];
const run = a => {
  const r = spawnSync(FFMPEG, a, {encoding: 'utf8'});
  if (r.status !== 0) throw new Error('ffmpeg failed (set FFMPEG to its path): ' + (r.stderr || r.error || '').toString().split('\n').slice(-6).join('\n'));
};
const seqDir = join(work, 'seq');
mkdirSync(seqDir);
let n = 0;
const put = src => copyFileSync(src, join(seqDir, `f${String(n++).padStart(4, '0')}.png`));
frames.forEach((f, i) => {
  for (let k = 0; k < HOLD; k++) put(f);
  const next = frames[(i + 1) % frames.length];
  MIX.forEach((m, k) => {
    const mixed = join(work, `mix${i}_${k}.png`);
    run(['-y', '-i', f, '-i', next, '-filter_complex', `blend=all_expr='A*(1-${m})+B*${m}'`, '-frames:v', '1', mixed]);
    put(mixed);
  });
});
const gif = join(out, 'live-preview.gif');
run(['-y', '-framerate', '10', '-i', join(seqDir, 'f%04d.png'), '-filter_complex', `scale=${W}:${H},split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`, '-loop', '0', gif]);
console.log('✓', gif);
