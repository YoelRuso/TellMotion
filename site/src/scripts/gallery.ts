// Gallery: filters + search, lazy upgrade of thumbnails to live inline SVG (real fonts), and a detail modal.
import {renderPreview} from '../lib/render-preview.mjs';

const base = document.documentElement.dataset.base || '/';
const GITHUB = document.getElementById('m-json')!.getAttribute('href')!;
const grid = document.getElementById('gallery')!;
const cards = [...grid.querySelectorAll<HTMLButtonElement>('.card')];
const modal = document.getElementById('modal') as HTMLDialogElement;
const q = document.getElementById('q') as HTMLInputElement;
const empty = document.getElementById('empty')!;
const fchips = [...document.querySelectorAll<HTMLButtonElement>('.fchip')];
let catalog: any[] = [];
let family = 'all';
let current = '';

const fonts = new Set<string>();
function ensureFont(google: string) {
  if (fonts.has(google)) return;
  fonts.add(google);
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = `https://fonts.googleapis.com/css2?family=${google}&display=swap`;
  document.head.appendChild(l);
}

const load = fetch(`${base}themes.json`).then(r => r.json()).then(d => (catalog = d));

// ---- upgrade thumbnails to inline SVG when they scroll into view ----
const io = new IntersectionObserver(
  entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      const card = e.target.closest<HTMLElement>('.card')!;
      load.then(() => {
        const t = catalog.find(x => x.id === card.dataset.id);
        if (!t) return;
        ensureFont(t.fonts.google);
        const thumb = card.querySelector('.thumb')!;
        thumb.innerHTML = renderPreview(t.tokens, {fonts: false}).replace('width="1920" height="1080"', 'width="100%" height="100%"');
      });
    }
  },
  {rootMargin: '200px'},
);
cards.forEach(c => io.observe(c.querySelector('.thumb')!));

// ---- filters ----
function apply() {
  const term = q.value.trim().toLowerCase();
  let n = 0;
  for (const c of cards) {
    const ok = (family === 'all' || c.dataset.family === family) && (!term || c.dataset.search!.includes(term));
    c.hidden = !ok;
    if (ok) n++;
  }
  empty.hidden = n > 0;
}
fchips.forEach(b =>
  b.addEventListener('click', () => {
    family = b.dataset.family!;
    fchips.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    apply();
  }),
);
q.addEventListener('input', apply);

// ---- modal ----
const $ = (id: string) => document.getElementById(id)!;
function open(id: string) {
  load.then(() => {
    const t = catalog.find(x => x.id === id);
    if (!t) return;
    current = id;
    ensureFont(t.fonts.google);
    $('m-prev').innerHTML = renderPreview(t.tokens, {fonts: false}).replace('width="1920" height="1080"', 'width="100%" height="100%"');
    $('m-name').textContent = t.name;
    $('m-tags').innerHTML = `<span class="fam">${t.family}</span>` + t.moods.map((m: string) => `<span>${m}</span>`).join('') + `<span>${t.fonts.family}</span>`;
    $('m-desc').textContent = t.description;
    const c = t.tokens.colors;
    const sw: [string, string][] = [['background', c.background], ['surface', c.surface], ['text', c.text], ['line', c.line], ...c.categories.map((x: string, i: number) => [`cat ${i + 1}`, x] as [string, string])];
    $('m-sw').innerHTML = sw.map(([n, v]) => `<span title="${n}"><i style="background:${v}"></i>${v}</span>`).join('');
    ($('m-prompt') as HTMLTextAreaElement).value = t.promptFull;
    ($('m-json') as HTMLAnchorElement).href = `${GITHUB}/blob/main/skills/tellmotion/themes/${t.id}.json`;
    if (!modal.open) modal.showModal();
  });
}
function step(d: number) {
  const visible = cards.filter(c => !c.hidden);
  const i = visible.findIndex(c => c.dataset.id === current);
  open(visible[(i + d + visible.length) % visible.length].dataset.id!);
}
cards.forEach(c => c.addEventListener('click', () => open(c.dataset.id!)));
$('m-close').addEventListener('click', () => modal.close());
modal.addEventListener('click', e => {
  if (e.target === modal) modal.close();
});
$('m-prevb').addEventListener('click', () => step(-1));
$('m-nextb').addEventListener('click', () => step(1));
modal.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') step(-1);
  if (e.key === 'ArrowRight') step(1);
});

function copy(btn: HTMLElement, text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => {
    btn.classList.add('copied');
    const old = btn.textContent;
    btn.textContent = 'Copied ✓';
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.textContent = old || label;
    }, 1600);
  });
}
$('m-copy-prompt').addEventListener('click', e => copy(e.currentTarget as HTMLElement, ($('m-prompt') as HTMLTextAreaElement).value, 'Copy prompt'));
$('m-copy-id').addEventListener('click', e => copy(e.currentTarget as HTMLElement, current, 'Copy theme id'));
