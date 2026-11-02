// Live hero demo: the reference diagram is re-rendered in each theme (same renderer the catalog uses)
// and a separate overlay plays one request through it, on a single timeline. The theme changes between
// passes, so the story is always seen whole. Autoplays; click a chip to choose.
import {renderPreview} from '../lib/render-preview.mjs';

const base = document.documentElement.dataset.base || '/';
const stage = document.getElementById('stage')!;
const shell = document.getElementById('demo-shell')!;
const chipsBox = document.getElementById('chips')!;
const title = document.getElementById('demo-title')!;
const typed = document.getElementById('typed')!;
const layers = [document.getElementById('layerA')!, document.getElementById('layerB')!];
const flow = document.getElementById('flow')!;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const loadedFonts = new Set<string>();
function ensureFont(google: string) {
  if (loadedFonts.has(google)) return;
  loadedFonts.add(google);
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = `https://fonts.googleapis.com/css2?family=${google}&display=swap`;
  document.head.appendChild(l);
}

function svgFor(t: any) {
  const s: string = renderPreview(t, {fonts: false});
  return s.replace('width="1920" height="1080"', 'width="100%" height="100%" preserveAspectRatio="xMidYMid slice"');
}

// ---------- request flow ----------
// Coordinates come from the reference diagram in render-preview.mjs. Times are seconds within one pass.
type Kind = 'sync' | 'event';
type Point = [number, number];
type Box = [number, number, number, number];

const LOOP = 6.6;
const THEME_CHANGE_AT = 5.9; // everything has faded out by now; the crossfade ends as the next pass starts
const TRAIL_FADE: Point = [5.2, 5.7];

const CLIENT: Box = [70, 440, 190, 120];
const GATEWAY: Box = [340, 440, 200, 120];
const BUS: Box = [685, 250, 1110, 80];
const ORDERS: Box = [1145, 450, 190, 120];
const ORDERS_DB: Box = [1145, 690, 190, 90];
const PAYMENTS: Box = [1375, 450, 190, 120];
const ALERTS: Box = [1605, 450, 190, 120];

// Each hop runs from the edge of one card to the edge of the next, so text is never covered.
const HOPS: {route: Point[]; kind: Kind; from: number; to: number}[] = [
  {route: [[260, 500], [340, 500]], kind: 'sync', from: 0.3, to: 0.7},
  {route: [[540, 500], [640, 500], [640, 390], [1125, 390], [1125, 510], [1145, 510]], kind: 'sync', from: 0.95, to: 2.3},
  {route: [[1240, 570], [1240, 690]], kind: 'sync', from: 2.55, to: 3.0},
  {route: [[1240, 450], [1240, 330]], kind: 'event', from: 3.35, to: 3.8},
  {route: [[1240, 322], [1470, 322], [1470, 450]], kind: 'event', from: 4.05, to: 4.8},
  {route: [[1240, 322], [1700, 322], [1700, 450]], kind: 'event', from: 4.05, to: 4.8},
];

const PULSES: {box: Box; kind: Kind; from: number; to: number}[] = [
  {box: CLIENT, kind: 'sync', from: 0.05, to: 0.55},
  {box: GATEWAY, kind: 'sync', from: 0.65, to: 1.2},
  {box: ORDERS, kind: 'sync', from: 2.25, to: 3.55},
  {box: ORDERS_DB, kind: 'sync', from: 2.95, to: 3.45},
  {box: BUS, kind: 'event', from: 3.75, to: 4.4},
  {box: PAYMENTS, kind: 'event', from: 4.75, to: 5.6},
  {box: ALERTS, kind: 'event', from: 4.75, to: 5.6},
];

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => (1 - Math.cos(Math.PI * x)) / 2;

// A polyline with rounded corners, so the marker turns instead of snapping.
function routePath(pts: Point[], radius = 16) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [[ax, ay], [bx, by], [cx, cy]] = [pts[i - 1], pts[i], pts[i + 1]];
    const r = Math.min(radius, Math.hypot(bx - ax, by - ay) / 2, Math.hypot(cx - bx, cy - by) / 2);
    const inX = bx - (Math.sign(bx - ax) * r), inY = by - (Math.sign(by - ay) * r);
    const outX = bx + (Math.sign(cx - bx) * r), outY = by + (Math.sign(cy - by) * r);
    d += ` L${inX} ${inY} Q${bx} ${by} ${outX} ${outY}`;
  }
  const [lx, ly] = pts[pts.length - 1];
  return `${d} L${lx} ${ly}`;
}

const svgNS = 'http://www.w3.org/2000/svg';
function svgEl<T extends SVGElement>(name: string, attrs: Record<string, string | number>) {
  const el = document.createElementNS(svgNS, name) as unknown as T;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  flow.appendChild(el);
  return el;
}

const colorVar = (kind: Kind) => `var(--flow-${kind})`;
const trails: (SVGPathElement | null)[] = [];
const guides: SVGPathElement[] = [];
const markers: SVGElement[] = [];
const rings: SVGRectElement[] = [];
const ripples: SVGRectElement[] = [];
let cardRadius = 0;

function buildFlow() {
  PULSES.forEach(({box: [x, y, w, h], kind}) => {
    const common = {x, y, width: w, height: h, fill: 'none', stroke: colorVar(kind), opacity: 0};
    ripples.push(svgEl<SVGRectElement>('rect', {...common, 'stroke-width': 3}));
    rings.push(svgEl<SVGRectElement>('rect', {...common, 'stroke-width': 6}));
  });
  HOPS.forEach(({route, kind}) => {
    const d = routePath(route);
    guides.push(svgEl<SVGPathElement>('path', {d, fill: 'none', stroke: 'none'}));
    // The legend draws events dashed and their arrows already exist, so only requests leave a trail.
    trails.push(kind === 'sync' ? svgEl<SVGPathElement>('path', {d, fill: 'none', stroke: colorVar(kind), 'stroke-width': 4, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '0 1', opacity: 0}) : null);
  });
  // Circle for requests, diamond for events: some themes use the same colour for both.
  HOPS.forEach(({kind}) => {
    const look = {fill: colorVar(kind), stroke: 'var(--flow-outline)', 'stroke-width': 4, opacity: 0};
    markers.push(kind === 'sync' ? svgEl('circle', {r: 14, ...look}) : svgEl('rect', {x: -11, y: -11, width: 22, height: 22, rx: 3, ...look}));
  });
}

function styleFlow(t: any) {
  flow.style.setProperty('--flow-sync', t.colors.line);
  flow.style.setProperty('--flow-event', t.colors.async);
  flow.style.setProperty('--flow-outline', t.colors.background);
  cardRadius = t.shape.radius;
  rings.forEach(r => r.setAttribute('rx', String(cardRadius)));
}

function drawFlow(time: number) {
  HOPS.forEach(({kind, from, to}, i) => {
    const running = time >= from && time <= to;
    const travelled = ease(clamp((time - from) / (to - from)));
    const marker = markers[i];
    marker.setAttribute('opacity', running ? '1' : '0');
    if (running) {
      const guide = guides[i];
      const {x, y} = guide.getPointAtLength(guide.getTotalLength() * travelled);
      const size = Math.min(1, (time - from) / 0.12, (to - time) / 0.12);
      marker.setAttribute('transform', `translate(${x} ${y}) ${kind === 'event' ? 'rotate(45) ' : ''}scale(${Math.max(0, size)})`);
    }
    const trail = trails[i];
    if (trail) {
      trail.setAttribute('stroke-dasharray', `${travelled} 1`);
      trail.setAttribute('opacity', time < from ? '0' : String(1 - clamp((time - TRAIL_FADE[0]) / (TRAIL_FADE[1] - TRAIL_FADE[0]))));
    }
  });
  PULSES.forEach(({box: [x, y, w, h], from, to}, i) => {
    rings[i].setAttribute('opacity', String(clamp((time - from) / 0.15) * clamp((to - time) / 0.25)));
    const spread = clamp((time - from) / 0.5);
    const outset = 3 + spread * 18;
    const ripple = ripples[i];
    ripple.setAttribute('x', String(x - outset));
    ripple.setAttribute('y', String(y - outset));
    ripple.setAttribute('width', String(w + outset * 2));
    ripple.setAttribute('height', String(h + outset * 2));
    ripple.setAttribute('rx', String(cardRadius + outset));
    ripple.setAttribute('opacity', time < from ? '0' : String((1 - spread) * 0.7));
  });
}

let catalog: any[] = [];
let index = 0;
let active = 0;
let hovering = false;
let holdTheme = false;
let typeTimer: number | undefined;

function typePrompt(t: any) {
  clearInterval(typeTimer);
  const full = `Make a video about Git branches · theme: `;
  const name = t.id;
  let i = 0;
  typed.innerHTML = '';
  if (reduced) {
    typed.innerHTML = `${full}<b>${name}</b>`;
    return;
  }
  typeTimer = window.setInterval(() => {
    i++;
    const all = full + name;
    const head = all.slice(0, Math.min(i, full.length));
    const tail = i > full.length ? all.slice(full.length, i) : '';
    typed.innerHTML = head + (tail ? `<b>${tail}</b>` : '');
    if (i >= all.length) clearInterval(typeTimer);
  }, 28);
}

function show(i: number, instant = false) {
  const t = catalog[i];
  if (!t) return;
  index = i;
  ensureFont(t.fonts.google);
  const next = 1 - active;
  const render = () => {
    layers[next].innerHTML = svgFor(t.tokens);
    layers[next].classList.add('on');
    layers[active].classList.remove('on');
    active = next;
    styleFlow(t.tokens);
  };
  // give the font a moment to arrive before the crossfade
  if (instant) render();
  else document.fonts.ready.then(() => setTimeout(render, 120));
  title.textContent = `tellmotion · ${t.name}`;
  shell.style.setProperty('--demo-accent', t.tokens.colors.categories[1] ?? t.tokens.colors.categories[0]);
  chipsBox.querySelectorAll<HTMLButtonElement>('.chip').forEach((c, k) => {
    const on = k === i;
    c.setAttribute('aria-pressed', String(on));
    if (on) chipsBox.scrollTo({left: c.offsetLeft - chipsBox.clientWidth / 2 + c.clientWidth / 2, behavior: 'smooth'});
  });
  typePrompt(t.tokens);
}

// One clock drives the flow and the theme rotation, so a theme only changes between passes.
function play() {
  if (reduced) return;
  const start = performance.now();
  let lastPass = -1;
  const tick = (now: number) => {
    const elapsed = Math.max(0, now - start) / 1000;
    const time = elapsed % LOOP;
    const pass = Math.floor(elapsed / LOOP);
    drawFlow(time);
    if (time >= THEME_CHANGE_AT && pass !== lastPass) {
      lastPass = pass;
      if (holdTheme) holdTheme = false;
      else if (!hovering) show((index + 1) % catalog.length);
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

fetch(`${base}themes.json`)
  .then(r => r.json())
  .then(data => {
    catalog = data;
    const start = Math.max(0, catalog.findIndex(t => t.id === 'blueprint'));
    if (!reduced) buildFlow();
    show(start, true);
    // preload the fonts of every theme in the background so crossfades are instant
    catalog.forEach(t => ensureFont(t.fonts.google));
    play();
    chipsBox.addEventListener('click', e => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.chip');
      if (!b) return;
      show(catalog.findIndex(t => t.id === b.dataset.id));
      holdTheme = true; // the chosen theme gets at least one full pass
    });
    shell.addEventListener('mouseenter', () => (hovering = true));
    shell.addEventListener('mouseleave', () => (hovering = false));
  });
