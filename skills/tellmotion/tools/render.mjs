#!/usr/bin/env node
// Renders a Motion Canvas project to mp4 without opening the editor: starts the project's own Vite,
// serves a private page that runs Motion Canvas' Renderer and opens it in a headless browser.
// Usage: node render.mjs [projectDir] [--fps <n>] [--scale <n>]
//   Writes output/<name>/<name>.mp4 and output/<name>/render.json inside the project.
//   Needs Chrome, Edge or Chromium (set CHROME to override the path). ffmpeg comes with the project's dependencies.
// Single file on purpose: new-project.sh copies it into each project as scripts/render.mjs.
import {spawn, spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {basename, dirname, join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const ROUTE = '/__tellmotion/render';
const VIRTUAL = 'virtual:tellmotion-render';
const CHANNEL = 'tellmotion:render';
const STALL_MS = 120_000; // no message from the page for this long = failure

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

function parseArgs(argv) {
  const opts = {project: '.', fps: undefined, scale: undefined};
  const number = (flag, value) => {
    const n = Number(value);
    if (!(n > 0)) throw new Error(`${flag} needs a positive number`);
    return n;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--fps') opts.fps = number(a, argv[++i]);
    else if (a === '--scale') opts.scale = number(a, argv[++i]);
    else if (a.startsWith('--')) throw new Error(`Unknown option: ${a}`);
    else opts.project = a;
  }
  return opts;
}

/** Code of the page that does the rendering; it talks back to this process through Vite's WebSocket. */
const pageModule = options => `
import {Renderer} from '@motion-canvas/core/lib/app';
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

const renderer = new Renderer(project);
renderer.onFrameChanged.subscribe(frame => send('progress', {frame, total: renderer.playback.duration}));
renderer.onFinished.subscribe(result => {
  const scenes = renderer.playback.onScenesRecalculated.current.map(s => ({
    name: s.name,
    seconds: (s.lastFrame - s.firstFrame) / settings.fps,
  }));
  send('done', {
    result,
    frames: renderer.playback.duration + 1, // both the first and the last frame are exported
    fps: settings.fps,
    size: {x: Math.round(settings.size.x * settings.resolutionScale), y: Math.round(settings.size.y * settings.resolutionScale)},
    scenes,
  });
});
renderer.render(settings);
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

function showProgress(frame, total, startedAt) {
  if (!total) return;
  const done = Math.min(frame / total, 1);
  const elapsed = (Date.now() - startedAt) / 1000;
  const eta = done > 0 ? Math.round((elapsed / done) * (1 - done)) : 0;
  const line = `Rendering ${String(Math.round(done * 100)).padStart(3)}%  frame ${frame}/${total}  ~${eta}s left`;
  if (process.stdout.isTTY) process.stdout.write(`\r${line}   `);
}

async function render({project: dir, fps, scale}) {
  const project = resolve(dir);
  if (!existsSync(join(project, 'package.json')) || !existsSync(join(project, 'src/project.ts'))) throw new Error(`${project} is not a Motion Canvas project (package.json or src/project.ts not found)`);
  const require = createRequire(join(project, 'package.json'));
  let viteEntry;
  try {
    viteEntry = join(dirname(require.resolve('vite/package.json')), 'dist/node/index.js');
    require.resolve('@motion-canvas/ffmpeg/package.json');
  } catch {
    throw new Error('Dependencies not found: run "npm install" in the project first (it needs vite and @motion-canvas/ffmpeg)');
  }
  const browser = findBrowser();
  if (!browser) throw new Error('No browser found: install Chrome, Edge or Chromium, or set CHROME to its path');

  const pkgName = JSON.parse(readFileSync(join(project, 'package.json'), 'utf8')).name;
  const slug = String(pkgName || basename(project)).replace(/[^\w.-]+/g, '-');
  const outDir = join(project, 'output', slug);
  const mp4 = join(outDir, `${slug}.mp4`);
  mkdirSync(outDir, {recursive: true});
  process.chdir(project); // the Motion Canvas plugin resolves its paths from the working directory

  const startedAt = Date.now();
  let finish;
  const finished = new Promise((res, rej) => {
    finish = {res, rej};
  });
  const errors = [];
  let lastMessage = Date.now();
  const onMessage = msg => {
    lastMessage = Date.now();
    if (msg.type === 'progress') showProgress(msg.frame, msg.total, startedAt);
    else if (msg.type === 'error') errors.push(msg.message);
    else if (msg.type === 'done') finish.res(msg);
  };

  const {createServer} = await import(pathToFileURL(viteEntry).href);
  const server = await createServer({
    root: project,
    configFile: join(project, 'vite.config.ts'),
    plugins: [renderPlugin({name: `${slug}/${slug}`, fps, scale}, onMessage)],
    server: {host: '127.0.0.1', port: 9100, strictPort: false, open: false, watch: {ignored: ['**']}},
    logLevel: 'warn',
    clearScreen: false,
  });
  const profile = mkdtempSync(join(tmpdir(), 'tm-render-'));
  let chrome;
  let watchdog;
  const cleanup = async () => {
    clearInterval(watchdog);
    await stopBrowser(chrome);
    await server.close().catch(() => {});
    // Chrome can hold the profile for a moment after being killed; a leftover temp folder must not fail a good render
    try {
      rmSync(profile, {recursive: true, force: true, maxRetries: 10, retryDelay: 300});
    } catch {}
  };
  process.once('SIGINT', () => finish.rej(new Error('Interrupted')));

  try {
    await server.listen();
    const url = `http://127.0.0.1:${server.httpServer.address().port}${ROUTE}`;
    console.log(`Project: ${project}\nBrowser: ${browser}`);
    chrome = spawn(browser, browserArgs(url, profile), {stdio: 'ignore'});
    chrome.on('error', e => finish.rej(new Error(`Could not start the browser: ${e.message}`)));
    watchdog = setInterval(() => {
      if (Date.now() - lastMessage > STALL_MS) finish.rej(new Error(`No progress for ${STALL_MS / 1000}s`));
    }, 2000);

    const done = await finished;
    if (process.stdout.isTTY) process.stdout.write('\n');
    if (done.result !== 0) throw new Error(`The render did not finish (result ${done.result})`);
    if (!existsSync(mp4) || statSync(mp4).size === 0) throw new Error(`The render finished but ${mp4} is missing or empty`);

    const seconds = done.frames / done.fps;
    writeFileSync(
      join(outDir, 'render.json'),
      JSON.stringify({name: slug, seconds, frames: done.frames, fps: done.fps, size: done.size, scenes: done.scenes, files: [`${slug}.mp4`], renderedAt: new Date().toISOString()}, null, 2) + '\n',
    );
    console.log(`✓ ${mp4}\n  ${seconds.toFixed(1)}s of video, ${done.size.x}x${done.size.y} at ${done.fps} fps, rendered in ${Math.round((Date.now() - startedAt) / 1000)}s`);
  } catch (e) {
    if (errors.length) e.message += `\nPage errors:\n  ${[...new Set(errors)].join('\n  ')}`;
    rmSync(mp4, {force: true}); // a partial file must not look like a finished video
    throw e;
  } finally {
    await cleanup();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await render(parseArgs(process.argv.slice(2)));
    process.exit(0);
  } catch (e) {
    console.error(`✗ ${e.message}`);
    process.exit(1);
  }
}
