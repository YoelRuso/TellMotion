// Loading and validation of TellMotion themes (zero dependencies).
import {readFileSync, readdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

export const THEMES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'themes');

export const FAMILIES = ['technical', 'editorial', 'playful', 'neon', 'retro', 'academic', 'futuristic', 'nature', 'corporate', 'dark', 'light'];
const BG_KINDS = ['solid', 'grid', 'dots', 'gradient'];
const FILLS = ['surface', 'accent', 'tint', 'none', 'glass'];
const STROKE_FROM = ['accent', 'line', 'stroke'];
const SHADOWS = ['none', 'soft', 'hard', 'glow', 'clay'];
const EASINGS = ['inOutCubic', 'inOutSine', 'inOutQuad', 'linear'];
const ENTRANCES = ['pop', 'fade', 'slide'];
export const DECOR = ['scanlines', 'hazard-stripes', 'corner-marks', 'title-block', 'step-numbers', 'dimension-line', 'stamp', 'dust', 'blobs', 'horizon', 'topbar', 'ruled-lines', 'waves', 'masthead', 'traces'];

const COLOR = /^(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|rgba?\([^)]*\))$/;

export function validateTheme(t, file = '') {
  const errs = [];
  const need = (cond, msg) => cond || errs.push(msg);
  const color = (v, name) => need(typeof v === 'string' && COLOR.test(v), `${name} must be #rrggbb, #rrggbbaa or rgb(a)(): ${v}`);

  need(typeof t.id === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(t.id), 'id must be kebab-case');
  if (file) need(file.replace(/\.json$/, '') === t.id, `id "${t.id}" must match file name`);
  need(typeof t.name === 'string' && t.name.length > 0, 'name required');
  need(FAMILIES.includes(t.family), `family must be one of ${FAMILIES.join(', ')}`);
  need(Array.isArray(t.moods) && t.moods.length >= 1, 'moods: at least one');
  need(typeof t.description === 'string' && t.description.length > 10, 'description required');
  need(typeof t.prompt === 'string' && t.prompt.length > 20, 'prompt required (natural-language style brief)');

  const f = t.fonts || {};
  need(typeof f.family === 'string', 'fonts.family required');
  need(typeof f.fontsource === 'string' && /^[a-z0-9-]+$/.test(f.fontsource), 'fonts.fontsource (npm slug of @fontsource/<slug>) required');
  need(typeof f.google === 'string', 'fonts.google (Google Fonts css2 family string) required');
  need(['monospace', 'sans-serif', 'serif', 'cursive'].includes(f.fallback), 'fonts.fallback must be a generic family');
  need(Array.isArray(f.weights) && f.weights.includes(400), 'fonts.weights must include 400 (add a bold weight >=600 when the font has one)');
  if (f.scale !== undefined) need(typeof f.scale === 'number' && f.scale >= 0.8 && f.scale <= 1.6, 'fonts.scale between 0.8 and 1.6');

  const c = t.colors || {};
  for (const k of ['background', 'surface', 'text', 'muted', 'line', 'onAccent', 'async', 'ok', 'error']) color(c[k], `colors.${k}`);
  if (c.stroke !== undefined) color(c.stroke, 'colors.stroke');
  need(Array.isArray(c.categories) && c.categories.length === 5, 'colors.categories must have exactly 5 colors');
  (c.categories || []).forEach((v, i) => color(v, `colors.categories[${i}]`));
  if (c.tints) {
    need(Array.isArray(c.tints) && c.tints.length === 5, 'colors.tints must have 5 colors');
    (c.tints || []).forEach((v, i) => color(v, `colors.tints[${i}]`));
  }

  const b = t.background || {};
  need(BG_KINDS.includes(b.kind), `background.kind must be one of ${BG_KINDS.join(', ')}`);
  if (b.kind === 'gradient') need(b.gradient && Array.isArray(b.gradient.stops) && b.gradient.stops.length >= 2, 'background.gradient.stops (>=2) required');
  if (b.kind === 'grid' || b.kind === 'dots') {
    color(b.color, 'background.color');
    need(typeof b.step === 'number' && b.step >= 16, 'background.step >= 16');
  }

  const s = t.shape || {};
  need(typeof s.radius === 'number' && s.radius >= 0, 'shape.radius number');
  need(typeof s.stroke === 'number' && s.stroke >= 0, 'shape.stroke number');
  need(FILLS.includes(s.fill), `shape.fill must be one of ${FILLS.join(', ')}`);
  if (s.fill === 'tint') need(c.tints, 'shape.fill "tint" requires colors.tints');
  need(STROKE_FROM.includes(s.strokeFrom), `shape.strokeFrom must be one of ${STROKE_FROM.join(', ')}`);
  if (s.strokeFrom === 'stroke') need(c.stroke, 'shape.strokeFrom "stroke" requires colors.stroke');
  need(SHADOWS.includes(s.shadow), `shape.shadow must be one of ${SHADOWS.join(', ')}`);
  need(s.dash === null || (Array.isArray(s.dash) && s.dash.length === 2), 'shape.dash must be null or [dash, gap]');
  need(typeof s.doubleBorder === 'boolean', 'shape.doubleBorder boolean');

  const m = t.motion || {};
  need(typeof m.pace === 'number' && m.pace >= 0.5 && m.pace <= 2, 'motion.pace between 0.5 and 2 (1 = normal, >1 slower)');
  need(EASINGS.includes(m.easing), `motion.easing must be one of ${EASINGS.join(', ')}`);
  need(ENTRANCES.includes(m.entrance), `motion.entrance must be one of ${ENTRANCES.join(', ')}`);

  if (t.decor !== undefined) {
    need(Array.isArray(t.decor) && t.decor.every(d => DECOR.includes(d)), `decor entries must be in: ${DECOR.join(', ')}`);
  }
  return errs;
}

export function loadTheme(idOrPath) {
  const path = idOrPath.endsWith('.json') ? idOrPath : join(THEMES_DIR, `${idOrPath}.json`);
  const t = JSON.parse(readFileSync(path, 'utf8'));
  return t;
}

export function loadAllThemes(dir = THEMES_DIR) {
  return readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .map(f => ({file: f, theme: loadTheme(join(dir, f))}));
}

export function fullPrompt(t) {
  const c = t.colors, s = t.shape;
  return (
    `Use the TellMotion theme "${t.name}" (id: ${t.id}). ${t.prompt} ` +
    `Palette: background ${c.background}, surfaces ${c.surface}, text ${c.text}, lines ${c.line}, ` +
    `category colors ${c.categories.join(', ')}. Font: ${t.fonts.family}. ` +
    `Shapes: ${s.radius}px corners, ${s.stroke}px strokes, shadow "${s.shadow}", fill "${s.fill}". ` +
    `Motion: ${t.motion.entrance} entrances, ${t.motion.easing} easing, pace x${t.motion.pace}.`
  );
}
