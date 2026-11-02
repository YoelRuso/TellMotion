import {Circle, Line, Node, Txt} from '@motion-canvas/2d';
import {all, createRef, makeRef, sequence} from '@motion-canvas/core';
import {C, FONT, MOVE, P, fs, t} from '../config';

export interface LineChartOpts {
  x: number;
  y: number;
  w?: number;
  h?: number;
  data: number[];
  labels?: string[];
  max?: number;
  color?: string;
}

/** Charts pack · line chart: axes, a line that draws itself and dots that pop in. */
export class LineChart {
  public root = createRef<Node>();
  public line = createRef<Line>();
  public dots: Circle[] = [];

  constructor(parent: Node, o: LineChartOpts) {
    const w = o.w ?? 1000, h = o.h ?? 420;
    const max = o.max ?? Math.max(...o.data);
    const step = w / Math.max(o.data.length - 1, 1);
    const pts: P[] = o.data.map((v, i) => [-w / 2 + i * step, -(v / max) * h]);
    const color = o.color ?? C.cat[1];
    parent.add(
      <Node ref={this.root} position={[o.x, o.y]} opacity={0}>
        <Line points={[[-w / 2, -h - 20], [-w / 2, 0], [w / 2 + 20, 0]]} stroke={C.line} lineWidth={3} lineCap={'round'} lineJoin={'round'} />
        <Line ref={this.line} points={pts} stroke={color} lineWidth={6} lineCap={'round'} lineJoin={'round'} end={0} />
        {pts.map((p, i) => (
          <Circle ref={makeRef(this.dots, i)} size={22} position={p} fill={color} stroke={C.bg} lineWidth={4} opacity={0} />
        ))}
        {(o.labels ?? []).map((l, i) => (
          <Txt text={l} fontFamily={FONT} fontSize={fs(28)} fill={C.muted} x={-w / 2 + i * step} y={40} />
        ))}
      </Node>,
    );
  }

  *appear(d = 0.4) {
    yield* this.root().opacity(1, t(d));
  }

  /** The line draws itself, then the dots pop in. */
  *draw(d = 1.6) {
    yield* all(this.line().end(1, t(d), MOVE), sequence(d / this.dots.length, ...this.dots.map(dot => dot.opacity(1, t(0.25)))));
  }
}
