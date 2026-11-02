// Live hero demo: the reference diagram is re-rendered in each theme (same renderer the catalog uses)
// with an animated packet travelling along the arrows. Autoplays; click a chip to choose.
import {renderPreview} from '../lib/render-preview.mjs';

const base = document.documentElement.dataset.base || '/';
const stage = document.getElementById('stage')!;
const shell = document.getElementById('demo-shell')!;
const chipsBox = document.getElementById('chips')!;
const title = document.getElementById('demo-title')!;
const typed = document.getElementById('typed')!;
const layers = [document.getElementById('layerA')!, document.getElementById('layerB')!];
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

function packet(t: any, path: string, dur: number, begin = 0, color = t.colors.async) {
  return (
    `<g><rect x="-24" y="-16" width="48" height="32" rx="6" fill="${color}" stroke="${t.colors.background}" stroke-width="3"/>` +
    `<path d="M-24 -16 L0 2 L24 -16" fill="none" stroke="${t.colors.background}" stroke-width="3"/>` +
    `<animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" path="${path}" calcMode="linear"/></g>`
  );
}

function svgFor(t: any) {
  let s: string = renderPreview(t, {fonts: false});
  s = s.replace('width="1920" height="1080"', 'width="100%" height="100%" preserveAspectRatio="xMidYMid slice"');
  if (!reduced) {
    const sync = packet(t, 'M165 500 H440 H640 V390 H1240 V450 V570 V690', 9);
    const evt = packet(t, 'M1240 450 V332 H1700 V448', 6, 1.5, t.colors.categories[3] ?? t.colors.async);
    s = s.replace('</svg>', sync + evt + '</svg>');
  }
  return s;
}

let catalog: any[] = [];
let index = 0;
let active = 0;
let timer: number | undefined;
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

function play() {
  if (reduced) return;
  clearInterval(timer);
  timer = window.setInterval(() => show((index + 1) % catalog.length), 5200);
}

fetch(`${base}themes.json`)
  .then(r => r.json())
  .then(data => {
    catalog = data;
    const start = Math.max(0, catalog.findIndex(t => t.id === 'blueprint'));
    show(start, true);
    // preload the fonts of every theme in the background so crossfades are instant
    catalog.forEach(t => ensureFont(t.fonts.google));
    play();
    chipsBox.addEventListener('click', e => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.chip');
      if (!b) return;
      show(catalog.findIndex(t => t.id === b.dataset.id));
      play();
    });
    shell.addEventListener('mouseenter', () => clearInterval(timer));
    shell.addEventListener('mouseleave', play);
  });
