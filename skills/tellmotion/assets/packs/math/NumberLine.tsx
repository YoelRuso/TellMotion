import {Circle, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal} from '@motion-canvas/core';
import {C, FONT, MOVE, fs, t} from '../config';
import {Group} from './Piece';

export interface NumberLineOpts {
  /** Center of the line. */
  x: number;
  y: number;
  w?: number;
  min: number;
  max: number;
  /** Distance between ticks (default 1). */
  step?: number;
}

/** Math pack · number line with a marker that moves to a value and a band to shade an interval. */
export class NumberLine extends Group {
  private axis = createRef<Line>();
  private marker = createRef<Node>();
  private band = createRef<Rect>();
  private value: ReturnType<typeof createSignal<number>>;
  private min: number;
  private max: number;
  private w: number;

  constructor(parent: Node, o: NumberLineOpts) {
    super();
    this.w = o.w ?? 1300;
    this.min = o.min;
    this.max = o.max;
    this.value = createSignal(o.min);
    const step = o.step ?? 1;
    const count = Math.round((o.max - o.min) / step);
    parent.add(
      <Node ref={this.root} position={[o.x, o.y]} opacity={0}>
        <Rect ref={this.band} height={30} opacity={0} radius={6} fill={C.cat[1]} />
        <Line ref={this.axis} points={[[-this.w / 2 - 30, 0], [this.w / 2 + 30, 0]]} stroke={C.line} lineWidth={4} lineCap={'round'} startArrow endArrow arrowSize={14} />
        {Array.from({length: count + 1}, (_, i) => {
          const v = o.min + i * step;
          return (
            <Node x={this.xOf(v)}>
              <Line points={[[0, -14], [0, 14]]} stroke={C.line} lineWidth={3} />
              <Txt text={String(+v.toFixed(2))} fontFamily={FONT} fontSize={fs(32)} fill={C.text} y={48} />
            </Node>
          );
        })}
        <Node ref={this.marker} x={() => this.xOf(this.value())} opacity={0}>
          <Circle size={32} fill={C.cat[1]} stroke={C.bg} lineWidth={4} />
          <Txt text={() => String(+this.value().toFixed(2))} fontFamily={FONT} fontWeight={700} fontSize={fs(32)} fill={C.cat[1]} stroke={C.bg} lineWidth={8} strokeFirst y={-48} />
        </Node>
      </Node>,
    );
  }

  private xOf(v: number) {
    return -this.w / 2 + ((v - this.min) / (this.max - this.min)) * this.w;
  }

  /** The marker appears at a value. */
  *showMarker(v = this.min, d = 0.3) {
    this.value(v);
    yield* this.marker().opacity(1, t(d));
  }

  /** The marker travels to a value, and its number follows. */
  *moveTo(v: number, d = 0.8) {
    yield* this.value(v, t(d), MOVE);
  }

  /** Shade the interval between two values. */
  *shade(from: number, to: number, color = C.cat[1], d = 0.5) {
    const start = this.xOf(from), end = this.xOf(to);
    this.band().fill(color);
    this.band().x(start);
    this.band().width(0);
    this.band().opacity(0.45);
    yield* all(this.band().x((start + end) / 2, t(d), MOVE), this.band().width(end - start, t(d), MOVE));
  }
}
