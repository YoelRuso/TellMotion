// ============================================================
// PROJECT CONFIG
// The visual style comes from src/theme.ts (generated: `node tools/apply-theme.mjs <theme> .`).
// Edit here: global pace and the legend of your project.
// ============================================================
import {easeInOutCubic, easeInOutQuad, easeInOutSine, linear} from '@motion-canvas/core';
import {THEME} from './theme';

/** Global speed knob for the whole video. 1 = normal, 1.3 = slower, 0.8 = faster. (Theme pace is applied on top.) */
export const PACE = 1;
export const t = (seconds: number) => seconds * PACE * THEME.motion.pace;

export type P = [number, number];

export const FONT = `"${THEME.fonts.family}", ${THEME.fonts.fallback}`;
const FONT_SCALE = THEME.fonts.scale ?? 1;
/** Font size helper: applies the theme's font scale (some fonts render small). Keep text >= 28 px at 1920x1080. */
export const fs = (px: number) => Math.round(px * FONT_SCALE);

/** Monospace font for code/terminal: the theme font when it is monospace, otherwise the system one. */
export const MONO = THEME.fonts.fallback === 'monospace' ? FONT : 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

export const C = {
  bg: THEME.colors.background,
  surface: THEME.colors.surface,
  text: THEME.colors.text,
  muted: THEME.colors.muted,
  line: THEME.colors.line,
  stroke: THEME.colors.stroke ?? THEME.colors.line,
  onAccent: THEME.colors.onAccent,
  async: THEME.colors.async,
  ok: THEME.colors.ok,
  error: THEME.colors.error,
  /** 5 category colors from the theme. Give each kind of element its own. */
  cat: THEME.colors.categories,
  tints: THEME.colors.tints,
};

export const S = THEME.shape;

/** Easing used for movements (from the theme). */
export const MOVE = {inOutCubic: easeInOutCubic, inOutSine: easeInOutSine, inOutQuad: easeInOutQuad, linear}[THEME.motion.easing];

/** Legend shown at the top-right of every scene. EDIT: one entry per category you use. */
export const LEGEND: [string, string][] = [
  ['Unsorted', C.muted],
  ['Pivot', C.cat[1]],
  ['Smaller', C.cat[3]],
  ['Bigger', C.cat[0]],
  ['In place', C.ok],
];
