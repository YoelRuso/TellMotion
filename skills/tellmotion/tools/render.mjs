#!/usr/bin/env node
// Renders a Motion Canvas project without opening the editor: starts the project's own Vite,
// serves a private page that runs Motion Canvas' Renderer and opens it in a headless browser.
// Usage: node render.mjs [projectDir] [options]
//   --format mp4,webm,gif   files to produce (default: mp4)
//   --aspect 16:9,9:16,1:1  16:9 is the project as designed; the others fit it inside, with bars (default: 16:9)
//   --thumb                 also write thumb.png, from the middle of the first scene
//   --thumb-at <seconds>    same, from that moment
//   --pad-color <#rrggbb>   color of the bars (default: the theme background)
//   --fps <n>, --scale <n>  override project.meta
//   --draft                 quick look: 30 fps at half size, in output/<name>-draft/
//   --info                  print the duration of each scene; renders nothing
//   --dry-run               estimate a size range per file from a few rendered samples; saves nothing
//   Writes output/<name>/ inside the project. Needs Chrome, Edge or Chromium (set CHROME to override the path).
//   ffmpeg comes with the project's dependencies (set FFMPEG to override the path).
// Single file on purpose: new-project.sh copies it into each project as scripts/render.mjs.
import {spawn, spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, rmdirSync, statSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {basename, dirname, join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const ROUTE = '/__tellmotion/render';
const VIRTUAL = 'virtual:tellmotion-render';
const CHANNEL = 'tellmotion:render';
const STALL_MS = 120_000; // no message from the page for this long = failure
const FORMATS = ['mp4', 'webm', 'gif'];
const ASPECTS = {'16:9': null, '9:16': [9, 16], '1:1': [1, 1]};
const GIF = {fps: 15, longSide: 960};
const SAMPLES = {count: 10, seconds: 1.5, lowFps: 10, lowScale: 0.25};
const ESTIMATE_RANGE = [0.75, 1.7]; // real files measured between 0.81x and 1.64x the estimate (3 projects)
const MIN_TEXT = 28; // smallest text allowed at 1920x1080, see SKILL.md

/** Path of the first installed browser, or undefined. CHROME wins when it is set. */
export function findBrowser(env = process.env) {
  const win = [env.PROGRAMFILES, env['PROGRAMFILES(X86)'], env.LOCALAPPDATA].filter(Boolean);
  return [
    env.CHROME,
    ...win.map(d => join(d, 'Google/Chrome/Application/chrome.exe')),
    ...win.map(d => join(d, 'Microsoft/Edge/Application/msedge.exe')),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/microsoft-edge',
    '/snap/bin/chromium',
  ].find(p => p && existsSync(p));
}

export function parseArgs(argv) {
  const opts = {project: '.', formats: ['mp4'], aspects: ['16:9'], thumb: false, thumbAt: undefined, padColor: undefined, fps: undefined, scale: undefined, draft: false, info: false, dryRun: false};
  const number = (flag, value, min = Number.MIN_VALUE) => {
    const n = Number(value);
    if (!(n >= min)) throw new Error(`${flag} needs a number${min === 0 ? '' : ' above 0'}`);
    return n;
  };
  const list = (flag, value, allowed) => {
    const items = String(value ?? '').split(',').filter(Boolean);
    const bad = items.filter(i => !allowed.includes(i));
    if (!items.length || bad.length) throw new Error(`${flag} accepts: ${allowed.join(', ')}`);
    return [...new Set(items)];
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--format') opts.formats = list(a, argv[++i], FORMATS);
    else if (a === '--aspect') opts.aspects = list(a, argv[++i], Object.keys(ASPECTS));
    else if (a === '--thumb') opts.thumb = true;
    else if (a === '--thumb-at') (opts.thumb = true), (opts.thumbAt = number(a, argv[++i], 0));
    else if (a === '--pad-color') {
      opts.padColor = argv[++i];
      if (!/^#[0-9a-fA-F]{6}$/.test(opts.padColor ?? '')) throw new Error('--pad-color needs a color like #0b3d91');
    } else if (a === '--fps') opts.fps = number(a, argv[++i]);
    else if (a === '--scale') opts.scale = number(a, argv[++i]);
    else if (a === '--draft') opts.draft = true;
    else if (a === '--info') opts.info = true;
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a.startsWith('--')) throw new Error(`Unknown option: ${a}`);
    else opts.project = a;
  }
  if (opts.info && opts.dryRun) throw new Error('Use either --info or --dry-run');
  if (opts.draft) {
    opts.fps ??= 30;
    opts.scale ??= 0.5;
  }
  return opts;
}

const even = n => Math.max(2, Math.round(n / 2) * 2);

/** Pixel size of the output for an aspect, given the size of the rendered video. */
export function targetSize(aspect, size) {
  const ratio = ASPECTS[aspect];
  if (!ratio) return size;
  return {x: even(size.y), y: even((size.y * ratio[1]) / ratio[0])};
}

const fit = ({x, y}, color) => `scale=${x}:${y}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${x}:${y}:(ow-iw)/2:(oh-ih)/2:color=${color}`;

/** The files one run produces. The native mp4 is the master that every other file is made from. */
export function planOutputs(base, formats, aspects, thumb) {
  const plan = [];
  for (const aspect of aspects) {
    const suffix = ASPECTS[aspect] ? `-${aspect.replace(':', 'x')}` : '';
    for (const format of formats) plan.push({kind: format, aspect, file: `${base}${suffix}.${format}`, master: format === 'mp4' && !ASPECTS[aspect]});
    if (thumb) plan.push({kind: 'thumb', aspect, file: `thumb${suffix}.png`, master: false});
  }
  return plan;
}

/** ffmpeg arguments that turn the master into one planned file. */
export function encodeArgs(item, {input, output, size, color, thumbAt}) {
  const target = targetSize(item.aspect, size);
  const framed = ASPECTS[item.aspect] ? ['-vf', fit(target, color)] : [];
  if (item.kind === 'mp4') return ['-i', input, ...framed, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', output];
  if (item.kind === 'webm') return ['-i', input, ...framed, '-c:v', 'libvpx-vp9', '-crf', '33', '-b:v', '0', '-row-mt', '1', '-cpu-used', '4', '-pix_fmt', 'yuv420p', output];
  if (item.kind === 'thumb') return ['-ss', String(thumbAt), '-i', input, ...framed, '-frames:v', '1', output];
  const k = GIF.longSide / Math.max(target.x, target.y);
  const small = {x: even(target.x * k), y: even(target.y * k)};
  return ['-i', input, '-filter_complex', `fps=${GIF.fps},${fit(small, color)},split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`, '-loop', '0', output];
}

export function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

/** The estimate is rough, and more often short than long, so it is shown as a range around it. */
export const sizeRange = bytes => `${formatBytes(Math.round(bytes * ESTIMATE_RANGE[0]))} - ${formatBytes(Math.round(bytes * ESTIMATE_RANGE[1]))}`;

export function formatTime(seconds) {
  const s = Math.round(seconds);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
}

/** Code of the page that does the rendering; it talks back to this process through Vite's WebSocket. */
const pageModule = options => `
import {PlaybackState, Renderer} from '@motion-canvas/core/lib/app';
import project from '/src/project.ts?project';

const options = ${JSON.stringify(options)};
const send = (type, data = {}) => import.meta.hot.send('${CHANNEL}', {type, ...data});
window.addEventListener('error', e => send('error', {message: e.message}));
window.addEventListener('unhandledrejection', e => send('error', {message: String(e.reason?.message ?? e.reason)}));
project.logger.onLogged.subscribe(p => {
  if (p.level === 'error') send('error', {message: p.message});
});

const base = project.meta.getFullRenderingSettings();
const settings = {
  ...base,
  name: options.name,
  fps: options.fps ?? base.fps,
  resolutionScale: options.scale ?? base.resolutionScale,
  exporter: {name: '@motion-canvas/ffmpeg', options: {fastStart: true, includeAudio: false}},
};
const size = {x: Math.round(settings.size.x * settings.resolutionScale), y: Math.round(settings.size.y * settings.resolutionScale)};

const renderer = new Renderer(project);
let label = '';
let finished = () => {};
renderer.onFrameChanged.subscribe(frame => send('progress', {frame, total: renderer.playback.duration, label}));
renderer.onFinished.subscribe(result => finished(result));
const renderOnce = s =>
  new Promise(res => {
    finished = res;
    renderer.render(s);
  });

// Runs every scene without drawing it, as the Renderer does before exporting
async function measure() {
  renderer.stage.configure(settings);
  renderer.playback.fps = settings.fps;
  renderer.playback.state = PlaybackState.Rendering;
  await renderer.reloadScenes(settings);
  await renderer.playback.recalculate();
}
const summary = () => ({
  frames: renderer.playback.duration + 1, // both the first and the last frame are exported
  fps: settings.fps,
  size,
  scenes: renderer.playback.onScenesRecalculated.current.map(s => ({name: s.name, seconds: (s.lastFrame - s.firstFrame) / settings.fps})),
});

// Evenly spread fragments, in the middle of equal slices of the video
function sampleRanges(seconds) {
  const {count, seconds: length} = options.samples;
  if (seconds <= count * length * 1.5) return [[0, Infinity]];
  const slice = seconds / count;
  return Array.from({length: count}, (_, i) => {
    const from = (i + 0.5) * slice - length / 2;
    return [from, from + length];
  });
}

async function run() {
  if (options.mode === 'info') {
    await measure();
    return send('done', {result: 0, ...summary()});
  }
  if (options.mode === 'render') {
    const result = await renderOnce(settings);
    return send('done', {result, ...summary()});
  }
  await measure();
  const info = summary();
  const ranges = sampleRanges(info.frames / info.fps);
  // The whole video, tiny: lets the tool measure how far the samples are from the real thing
  if (ranges.length > 1) {
    label = 'Measuring';
    const result = await renderOnce({...settings, fps: Math.min(options.samples.lowFps, settings.fps), resolutionScale: options.samples.lowScale, name: options.name + '/low'});
    if (result !== 0) return send('done', {result, ...info});
  }
  let sampleFrames = 0;
  for (let i = 0; i < ranges.length; i++) {
    label = 'Sampling ' + (i + 1) + '/' + ranges.length;
    const result = await renderOnce({...settings, range: ranges[i], name: options.name + '/sample-' + i});
    if (result !== 0) return send('done', {result, ...info});
    const [from, to] = ranges[i];
    sampleFrames += Math.round((Math.min(to, info.frames / info.fps) - from) * info.fps);
  }
  send('done', {result: 0, ...info, ranges, samples: ranges.length, sampleFrames});
}
run().catch(e => send('error', {message: String(e?.message ?? e)}));
`;

function renderPlugin(options, onMessage) {
  const resolved = '\0' + VIRTUAL;
  return {
    name: 'tellmotion:render',
    resolveId: id => (id === VIRTUAL ? resolved : undefined),
    load: id => (id === resolved ? pageModule(options) : undefined),
    configureServer(server) {
      server.ws.on(CHANNEL, onMessage);
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith(ROUTE)) return next();
        res.setHeader('Content-Type', 'text/html');
        res.end(`<!doctype html><meta charset="utf-8"><script type="module" src="/@id/__x00__${VIRTUAL}"></script>`);
      });
    },
  };
}

function browserArgs(url, profile) {
  return [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--mute-audio',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    `--user-data-dir=${profile}`,
    ...(process.getuid?.() === 0 ? ['--no-sandbox'] : []), // Chrome refuses to run as root otherwise (containers)
    url,
  ];
}

/** Stops the browser and its child processes, and waits for it to exit. */
function stopBrowser(chrome) {
  if (!chrome || chrome.exitCode !== null || chrome.signalCode !== null) return Promise.resolve();
  return new Promise(res => {
    const timer = setTimeout(res, 5000);
    chrome.once('exit', () => {
      clearTimeout(timer);
      res();
    });
    if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(chrome.pid), '/T', '/F'], {stdio: 'ignore'});
    else chrome.kill();
  });
}

function showProgress({frame, total, label}, startedAt) {
  if (!total || !process.stdout.isTTY) return;
  if (label) return process.stdout.write(`\r${label}   `);
  const done = Math.min(frame / total, 1);
  const elapsed = (Date.now() - startedAt) / 1000;
  const eta = done > 0 ? (elapsed / done) * (1 - done) : 0;
  process.stdout.write(`\rRendering ${String(Math.round(done * 100)).padStart(3)}%  frame ${frame}/${total}  ~${formatTime(eta)} left   `);
}

/** Starts Vite and the browser, runs the page in the given mode and returns its final report. */
async function runPage(project, viteEntry, browser, pageOptions) {
  const startedAt = Date.now();
  let finish;
  const finished = new Promise((res, rej) => {
    finish = {res, rej};
  });
  const errors = [];
  let lastMessage = Date.now();
  const onMessage = msg => {
    lastMessage = Date.now();
    if (msg.type === 'progress') showProgress(msg, startedAt);
    else if (msg.type === 'error') {
      errors.push(msg.message);
      if (pageOptions.mode === 'info') finish.rej(new Error('The project could not be measured'));
    } else if (msg.type === 'done') finish.res(msg);
  };

  const {createServer} = await import(pathToFileURL(viteEntry).href);
  const server = await createServer({
    root: project,
    configFile: join(project, 'vite.config.ts'),
    plugins: [renderPlugin(pageOptions, onMessage)],
    server: {host: '127.0.0.1', port: 9100, strictPort: false, open: false, watch: {ignored: ['**']}},
    logLevel: 'warn',
    clearScreen: false,
  });
  const profile = mkdtempSync(join(tmpdir(), 'tm-render-'));
  let chrome;
  let watchdog;
  process.once('SIGINT', () => finish.rej(new Error('Interrupted')));
  try {
    await server.listen();
    const url = `http://127.0.0.1:${server.httpServer.address().port}${ROUTE}`;
    chrome = spawn(browser, browserArgs(url, profile), {stdio: 'ignore'});
    chrome.on('error', e => finish.rej(new Error(`Could not start the browser: ${e.message}`)));
    watchdog = setInterval(() => {
      if (Date.now() - lastMessage > STALL_MS) finish.rej(new Error(`No progress for ${STALL_MS / 1000}s`));
    }, 2000);
    const done = await finished;
    if (process.stdout.isTTY) process.stdout.write('\r' + ' '.repeat(70) + '\r');
    if (done.result !== 0) throw new Error(`The render did not finish (result ${done.result})`);
    return done;
  } catch (e) {
    if (errors.length) e.message += `\nPage errors:\n  ${[...new Set(errors)].join('\n  ')}`;
    throw e;
  } finally {
    clearInterval(watchdog);
    await stopBrowser(chrome);
    await server.close().catch(() => {});
    // Chrome can hold the profile for a moment after being killed; a leftover temp folder must not fail a good render
    try {
      rmSync(profile, {recursive: true, force: true, maxRetries: 10, retryDelay: 300});
    } catch {}
  }
}

function runFfmpeg(ffmpeg, args) {
  const r = spawnSync(ffmpeg, ['-v', 'error', '-y', '-nostdin', ...args], {encoding: 'utf8', maxBuffer: 16 * 1024 * 1024});
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${(r.stderr || r.error || 'unknown error').toString().trim().split('\n').slice(-4).join('\n')}`);
}

function findFfmpeg(require, env = process.env) {
  if (env.FFMPEG) return env.FFMPEG;
  const exporter = createRequire(require.resolve('@motion-canvas/ffmpeg/package.json'));
  return exporter('@ffmpeg-installer/ffmpeg').path;
}

/** Stops early, with a clear message, when this platform's ffmpeg build lacks an encoder that is needed. */
function checkEncoders(ffmpeg, formats) {
  const needed = {webm: 'libvpx-vp9', gif: 'gif'};
  const out = spawnSync(ffmpeg, ['-hide_banner', '-encoders'], {encoding: 'utf8', maxBuffer: 16 * 1024 * 1024}).stdout ?? '';
  const missing = formats.filter(f => needed[f] && !new RegExp(`\\s${needed[f]}\\s`).test(out));
  if (missing.length) throw new Error(`This ffmpeg cannot produce: ${missing.join(', ')}. Set FFMPEG to the path of a full build (${ffmpeg})`);
}

function readPadColor(project) {
  try {
    return readFileSync(join(project, 'src/theme.ts'), 'utf8').match(/"background":\s*"(#[0-9a-fA-F]{6})/)?.[1] ?? '#000000';
  } catch {
    return '#000000';
  }
}

/** One line when the chosen aspects shrink the text below what is readable. */
function textWarning(aspects, size) {
  const scales = aspects.filter(a => ASPECTS[a]).map(a => targetSize(a, size).x / size.x);
  if (!scales.length) return;
  const px = Math.round(MIN_TEXT * Math.min(...scales));
  console.log(`! ${aspects.filter(a => ASPECTS[a]).join(', ')}: the video is fitted with bars, not re-laid out. ${MIN_TEXT} px text will look like ${px} px.`);
}

function printInfo(info) {
  const width = Math.max(...info.scenes.map(s => s.name.length), 5);
  console.log(`\n${'Scene'.padEnd(width)}  Duration`);
  for (const s of info.scenes) console.log(`${s.name.padEnd(width)}  ${s.seconds.toFixed(1)}s`);
  console.log(`${'Total'.padEnd(width)}  ${(info.frames / info.fps).toFixed(1)}s  (${info.frames} frames at ${info.fps} fps, ${info.size.x}x${info.size.y})`);
}

async function dryRun({ctx, opts, plan}) {
  const {project, slug, base, viteEntry, browser, ffmpeg, color} = ctx;
  const output = join(project, 'output');
  const workName = `.tm-dry-run-${slug}`;
  const work = join(output, workName);
  rmSync(work, {recursive: true, force: true});
  mkdirSync(work, {recursive: true});
  try {
    const done = await runPage(project, viteEntry, browser, {mode: 'dry-run', name: workName, fps: opts.fps, scale: opts.scale, samples: SAMPLES});
    const sampleSeconds = done.sampleFrames / done.fps;
    const seconds = done.frames / done.fps;
    const ratio = done.frames / done.sampleFrames;

    // Joined and encoded again, so the samples compress as one video does instead of as many short ones
    const list = join(work, 'list.txt');
    // Absolute paths with forward slashes: the bundled ffmpeg cannot resolve relative ones against a Windows path
    const entry = i => `file '${join(work, `sample-${i}.mp4`).replace(/\\/g, '/').replace(/'/g, `'\\''`)}'`;
    writeFileSync(list, Array.from({length: done.samples}, (_, i) => entry(i)).join('\n') + '\n');
    const sample = join(work, 'sample.mp4');
    runFfmpeg(ffmpeg, ['-f', 'concat', '-safe', '0', '-i', list, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', sample]);

    // Samples hold more motion than the pauses-heavy whole video. The same cut is made on the tiny full render,
    // where the true size is known, and the error found there corrects every estimate.
    let correction = 1;
    if (done.samples > 1) {
      const low = join(work, 'low.mp4');
      const lowCut = join(work, 'low-cut.mp4');
      const select = done.ranges.map(([from, to]) => `between(t,${from.toFixed(3)},${to.toFixed(3)})`).join('+');
      runFfmpeg(ffmpeg, ['-i', low, '-vf', `select='${select}',setpts=N/FRAME_RATE/TB`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', lowCut]);
      correction = statSync(low).size / (statSync(lowCut).size * ratio);
    }

    const rows = plan.map((item, i) => {
      let bytes;
      if (item.master) bytes = statSync(sample).size * ratio * correction;
      else {
        const file = join(work, `out-${i}.${item.kind === 'thumb' ? 'png' : item.kind}`);
        runFfmpeg(ffmpeg, encodeArgs(item, {input: sample, output: file, size: done.size, color, thumbAt: Math.min(1, sampleSeconds / 2)}));
        bytes = statSync(file).size * (item.kind === 'thumb' ? 1 : ratio * correction);
      }
      return {file: item.file, bytes};
    });

    const width = Math.max(...rows.map(r => r.file.length), 5);
    console.log(`\nDry run: nothing was saved. Video: ${seconds.toFixed(1)}s, ${done.size.x}x${done.size.y} at ${done.fps} fps, ${done.frames} frames.`);
    console.log(`Estimated from ${done.samples === 1 ? 'the whole video' : `${done.samples} samples (${sampleSeconds.toFixed(1)}s)`}.\n`);
    console.log(`${'File'.padEnd(width)}  Estimated size`);
    for (const r of rows) console.log(`${r.file.padEnd(width)}  ${sizeRange(r.bytes)}`);
    console.log(`${'Total'.padEnd(width)}  ${sizeRange(rows.reduce((a, r) => a + r.bytes, 0))}`);
    textWarning(opts.aspects, done.size);
  } finally {
    rmSync(work, {recursive: true, force: true, maxRetries: 5, retryDelay: 200});
    try {
      rmdirSync(output); // only succeeds when this run was the one that created it
    } catch {}
  }
}

async function fullRender({ctx, opts, plan}) {
  const {project, slug, base, viteEntry, browser, ffmpeg, color} = ctx;
  const outDir = join(project, 'output', base);
  const master = join(outDir, `${base}.mp4`);
  mkdirSync(outDir, {recursive: true});
  const startedAt = Date.now();

  let done;
  try {
    done = await runPage(project, viteEntry, browser, {mode: 'render', name: `${base}/${base}`, fps: opts.fps, scale: opts.scale});
    if (!existsSync(master) || statSync(master).size === 0) throw new Error(`The render finished but ${master} is missing or empty`);
  } catch (e) {
    rmSync(master, {force: true}); // a partial file must not look like a finished video
    throw e;
  }

  const seconds = done.frames / done.fps;
  const thumbAt = Math.min(opts.thumbAt ?? (done.scenes[0]?.seconds ?? 0) / 2, Math.max(seconds - 0.1, 0));
  for (const item of plan.filter(p => !p.master)) {
    const output = join(outDir, item.file);
    if (process.stdout.isTTY) process.stdout.write(`Encoding ${item.file}...\n`);
    try {
      runFfmpeg(ffmpeg, encodeArgs(item, {input: master, output, size: done.size, color, thumbAt}));
    } catch (e) {
      rmSync(output, {force: true});
      throw e;
    }
  }
  if (!plan.some(p => p.master)) rmSync(master, {force: true});

  const files = plan.map(p => ({file: p.file, bytes: statSync(join(outDir, p.file)).size}));
  writeFileSync(
    join(outDir, 'render.json'),
    JSON.stringify({name: slug, seconds: +seconds.toFixed(2), frames: done.frames, fps: done.fps, size: done.size, scenes: done.scenes.map(s => ({name: s.name, seconds: +s.seconds.toFixed(2)})), files, renderedAt: new Date().toISOString()}, null, 2) + '\n',
  );
  console.log(`✓ ${outDir}`);
  for (const f of files) console.log(`  ${f.file}  ${formatBytes(f.bytes)}`);
  console.log(`  ${seconds.toFixed(1)}s of video, ${done.size.x}x${done.size.y} at ${done.fps} fps, done in ${formatTime((Date.now() - startedAt) / 1000)}`);
  textWarning(opts.aspects, done.size);
}

async function main(opts) {
  const project = resolve(opts.project);
  if (!existsSync(join(project, 'package.json')) || !existsSync(join(project, 'src/project.ts'))) throw new Error(`${project} is not a Motion Canvas project (package.json or src/project.ts not found)`);
  const require = createRequire(join(project, 'package.json'));
  let viteEntry;
  let ffmpeg;
  try {
    viteEntry = join(dirname(require.resolve('vite/package.json')), 'dist/node/index.js');
    ffmpeg = findFfmpeg(require);
  } catch {
    throw new Error('Dependencies not found: run "npm install" in the project first (it needs vite and @motion-canvas/ffmpeg)');
  }
  const browser = findBrowser();
  if (!browser) throw new Error('No browser found: install Chrome, Edge or Chromium, or set CHROME to its path');
  process.chdir(project); // the Motion Canvas plugin resolves its paths from the working directory

  if (opts.info) {
    const info = await runPage(project, viteEntry, browser, {mode: 'info', name: 'info', fps: opts.fps, scale: opts.scale});
    return printInfo(info);
  }
  checkEncoders(ffmpeg, opts.formats);
  const pkgName = JSON.parse(readFileSync(join(project, 'package.json'), 'utf8')).name;
  const slug = String(pkgName || basename(project)).replace(/[^\w.-]+/g, '-');
  const base = opts.draft ? `${slug}-draft` : slug;
  const ctx = {project, slug, base, viteEntry, browser, ffmpeg, color: opts.padColor ?? readPadColor(project)};
  const plan = planOutputs(base, opts.formats, opts.aspects, opts.thumb);
  console.log(`Project: ${project}\nBrowser: ${browser}`);
  await (opts.dryRun ? dryRun : fullRender)({ctx, opts, plan});
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await main(parseArgs(process.argv.slice(2)));
    process.exit(0);
  } catch (e) {
    console.error(`✗ ${e.message}`);
    process.exit(1);
  }
}
