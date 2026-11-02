import {Node, Shape} from '@motion-canvas/2d';
import {all, createRef, easeOutBack} from '@motion-canvas/core';
import {C, MOVE, P, S, t} from '../config';
import {THEME} from '../theme';

/** Shadow tokens for a theme shadow kind and an accent color. */
export function shadowOf(color: string) {
  switch (S.shadow) {
    case 'soft':
      return {shadowColor: 'rgba(0,0,0,0.18)', shadowBlur: 24, shadowOffset: [0, 8] as [number, number]};
    case 'hard':
      return {shadowColor: C.line, shadowBlur: 0, shadowOffset: [8, 8] as [number, number]};
    case 'glow':
      return {shadowColor: color, shadowBlur: 18, shadowOffset: [0, 0] as [number, number]};
    case 'clay':
      return {shadowColor: /^#[0-9a-f]{6}$/i.test(color) ? color + '66' : color, shadowBlur: 28, shadowOffset: [0, 14] as [number, number]};
    default:
      return {shadowColor: 'rgba(0,0,0,0)', shadowBlur: 0, shadowOffset: [0, 0] as [number, number]};
  }
}

/** Rect props (fill, stroke, radius, shadow...) for a box of the given category color, following the theme. */
export function boxProps(color: string) {
  const i = C.cat.indexOf(color);
  const fill =
    S.fill === 'accent' ? color : S.fill === 'tint' ? C.tints?.[i] ?? C.surface : S.fill === 'none' ? 'rgba(0,0,0,0)' : S.fill === 'glass' ? 'rgba(255,255,255,0.16)' : C.surface;
  const stroke = S.strokeFrom === 'accent' ? color : S.strokeFrom === 'line' ? C.line : C.stroke;
  return {fill, stroke, lineWidth: S.stroke, lineDash: S.dash ? [...S.dash] : [], radius: S.radius, ...shadowOf(color)};
}

/** Text color that is readable on a box of this theme. */
export const textOn = () => (S.fill === 'accent' ? C.onAccent : C.text);
export const mutedOn = () => (S.fill === 'accent' ? C.onAccent : C.muted);

/** Initial (hidden) state for an entrance, following the theme's entrance style. */
export function hiddenState(x: number, y: number) {
  const e = THEME.motion.entrance;
  return {opacity: 0, scale: e === 'pop' ? 0.85 : 1, position: [x, e === 'slide' ? y + 30 : y] as P};
}

/** Base of every boxed component: position, connection points and shared animations. */
export class Piece {
  public root = createRef<Node>();
  /** The outline shape (Rect, Line polygon, Circle...). Glow and state changes act on it. */
  public box = createRef<Shape>();
  private base: ReturnType<typeof shadowOf>;

  constructor(
    public x: number,
    public y: number,
    public w: number,
    public h: number,
    public color: string,
  ) {
    this.base = shadowOf(color);
  }

  // Connection points for arrows
  get left(): P {
    return [this.x - this.w / 2, this.y];
  }
  get right(): P {
    return [this.x + this.w / 2, this.y];
  }
  get top(): P {
    return [this.x, this.y - this.h / 2];
  }
  get bottom(): P {
    return [this.x, this.y + this.h / 2];
  }

  /** Entrance animation (style comes from the theme). */
  *appear(d = 0.5) {
    const e = THEME.motion.entrance;
    yield* all(
      this.root().opacity(1, t(d)),
      e === 'pop' ? this.root().scale(1, t(d), easeOutBack) : e === 'slide' ? this.root().position([this.x, this.y], t(d), MOVE) : this.root().scale(1, 0),
    );
  }

  /** Highlight (glow + scale) or return to normal. */
  *glow(on = true, d = 0.3) {
    const hard = S.shadow === 'hard';
    yield* all(
      this.root().scale(on ? 1.07 : 1, t(d)),
      this.box().lineWidth(on ? S.stroke + 3 : S.stroke, t(d)),
      hard ? this.box().shadowBlur(0, 0) : this.box().shadowBlur(on ? 40 : this.base.shadowBlur, t(d)),
      hard ? this.box().shadowBlur(0, 0) : this.box().shadowColor(on ? this.color : this.base.shadowColor, t(d)),
    );
  }

  private *blink(d: number) {
    yield* this.glow(true, d * 0.3);
    yield* this.glow(false, d * 0.7);
  }

  /** Brief reaction when something reaches this piece: a flash and a ring that fades out. Leaves it unhighlighted. */
  *ping(d = 0.6) {
    const ring = this.box().clone({fill: 'rgba(0,0,0,0)', stroke: this.color, lineWidth: S.stroke + 3, lineDash: [], shadowBlur: 0, opacity: 0.8});
    this.root().add(ring);
    yield* all(ring.opacity(0, t(d)), ring.scale([1 + 48 / this.w, 1 + 48 / this.h], t(d)), this.blink(d));
    ring.remove();
  }

  /** Dim (true) or restore (false). */
  *dim(on = true, d = 0.3) {
    yield* this.root().opacity(on ? 0.2 : 1, t(d));
  }

  *hide(d = 0.4) {
    yield* this.root().opacity(0, t(d));
  }
}
