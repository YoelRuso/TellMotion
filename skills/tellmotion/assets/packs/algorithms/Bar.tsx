import {Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal} from '@motion-canvas/core';
import {C, FONT, MOVE, fs, t} from '../config';
import {Group} from './Piece';

const decimalsOf = (v: number) => (String(v).split('.')[1] ?? '').length;

export interface BarOpts {
  x: number;
  /** y of the baseline (bottom of the bar). */
  baseY: number;
  value: number;
  /** Value that maps to maxH. */
  max: number;
  maxH?: number;
  w?: number;
  color?: string;
}

/** Algorithms pack · sortable bar (value label on top). Move with `moveTo`, color with `mark`. */
export class Bar extends Group {
  public rect = createRef<Rect>();
  public value: number;
  private color: string;
  private max: number;
  private maxH: number;
  private shown = createSignal(0);
  private decimals: number;

  constructor(parent: Node, o: BarOpts) {
    super();
    this.value = o.value;
    this.shown(o.value);
    this.decimals = decimalsOf(o.value);
    this.max = o.max;
    this.maxH = o.maxH ?? 360;
    this.color = o.color ?? C.cat[2];
    const w = o.w ?? 90;
    parent.add(
      <Node ref={this.root} position={[o.x, o.baseY]} opacity={0}>
        <Rect ref={this.rect} offset={[0, 1]} width={w} height={(o.value / o.max) * this.maxH} fill={this.color} stroke={C.line} lineWidth={2} radius={Math.min(8, w / 4)} />
        <Txt text={() => this.shown().toFixed(this.decimals)} fontFamily={FONT} fontWeight={700} fontSize={fs(28)} fill={C.text} y={() => -this.rect().height() - 30} />
      </Node>,
    );
  }

  *moveTo(x: number, d = 0.5) {
    yield* this.root().x(x, t(d), MOVE);
  }

  *setValue(v: number, d = 0.5) {
    this.value = v;
    this.decimals = Math.max(this.decimals, decimalsOf(v));
    yield* all(this.rect().height((v / this.max) * this.maxH, t(d), MOVE), this.shown(v, t(d), MOVE));
  }

  *mark(color: string, d = 0.25) {
    yield* this.rect().fill(color, t(d));
  }

  *unmark(d = 0.25) {
    yield* this.rect().fill(this.color, t(d));
  }
}

