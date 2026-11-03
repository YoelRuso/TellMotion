import {Node, Shape, Txt} from '@motion-canvas/2d';
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

/** Base of every element: the animations they all share, so that any of them can be shown, hidden or emphasized the same way. */
export class Group {
  public root = createRef<Node>();

  /** Show the element. Those built from several parts show them all. */
  *appear(d = 0.4) {
    yield* this.root().opacity(1, t(d));
  }

  /** Highlight or return to normal. */
  *glow(on = true, d = 0.3) {
    yield* this.root().scale(on ? 1.05 : 1, t(d));
  }

  /** Brief reaction when something reaches this element. */
  *ping(d = 0.6) {
    yield* this.root().scale(1.08, t(d * 0.3));
    yield* this.root().scale(1, t(d * 0.7));
  }

  /** Dim (true) or restore (false). */
  *dim(on = true, d = 0.3) {
    yield* this.root().opacity(on ? 0.2 : 1, t(d));
  }

  *hide(d = 0.4) {
    yield* this.root().opacity(0, t(d));
  }
}

/** Base of every boxed component: position, connection points, label and shared animations. */
export class Piece extends Group {
  /** The outline shape (Rect, Line polygon, Circle...). Glow and state changes act on it. */
  public box = createRef<Shape>();
  /** The main text of the piece. */
  public label = createRef<Txt>();
  private base: ReturnType<typeof shadowOf>;

  constructor(
    public x: number,
    public y: number,
    public w: number,
    public h: number,
    public color: string,
    /** Space the label can use inside the piece: width and height. */
    protected room: P = [w - 32, h - 16],
  ) {
    super();
    this.base = shadowOf(color);
  }

  /** Txt props that wrap a label inside the piece. Text with its own line breaks keeps them. */
  protected wrapped(text: string) {
    return text.includes('\n') ? {} : {width: this.room[0], textWrap: true};
  }

  /** Last resort for a label that does not fit even wrapped: scale it down. Measured here because the fonts have loaded by now. */
  private shrinkLabel() {
    const label = this.label();
    if (!label) return;
    const ctx = document.createElement('canvas').getContext('2d')!;
    ctx.font = `${label.fontWeight()} ${label.fontSize()}px ${label.fontFamily()}`;
    const wraps = label.textWrap() === true;
    const parts = wraps ? label.text().split(/\s+/) : label.text().split('\n');
    const widest = Math.max(...parts.map(part => ctx.measureText(part).width));
    // A word wider than the wrapping width would stick out on one side, so the text box must hold it.
    if (wraps && widest > this.room[0]) label.width(widest);
    const scale = () => Math.min(1, this.room[0] / Math.max(widest, wraps ? label.width() : 0), this.room[1] / label.height());
    // Once it has to shrink, the wider lines that fit let it shrink less.
    if (wraps && scale() < 1) label.width(this.room[0] / scale());
    label.scale(scale());
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
    this.shrinkLabel();
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

  /** Mark the piece with a color (compare, found, sorted...). `solid` also fills it. */
  *mark(color: string, solid = false, d = 0.3) {
    const label = this.label();
    yield* all(
      this.box().stroke(color, t(d)),
      this.box().fill(solid ? color : boxProps(this.color).fill, t(d)),
      ...(label ? [label.fill(solid ? C.onAccent : textOn(), t(d))] : []),
    );
  }

  *unmark(d = 0.3) {
    const label = this.label();
    const base = boxProps(this.color);
    yield* all(this.box().stroke(base.stroke, t(d)), this.box().fill(base.fill, t(d)), ...(label ? [label.fill(textOn(), t(d))] : []));
  }
}
