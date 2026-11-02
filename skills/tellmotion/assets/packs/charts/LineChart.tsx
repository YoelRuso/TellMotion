import {Circle, Line, Node, Txt} from '@motion-canvas/2d';
import {clamp, createRef, easeOutBack, makeRef} from '@motion-canvas/core';
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

/** Share of the line drawn when a dot pops in fully. */
const DOT_POP = 0.04;

/** Charts pack · line chart: axes, a line that draws itself and dots that pop in as it reaches them. */
export class LineChart {
  public root = createRef<Node>();
  public line = createRef<Line>();
  public dots: Circle[] = [];

  constructor(parent: Node, o: LineChartOpts) {
    const w = o.w ?? 1000, h = o.h ?? 420;
    const max = o.max ?? (Math.max(...o.data) || 1);
    const step = w / Math.max(o.data.length - 1, 1);
    const pts: P[] = o.data.map((v, i) => [-w / 2 + i * step, -(v / max) * h]);
    const color = o.color ?? C.cat[1];
    // How far along the line each dot sits (0..1), so that it appears when the line gets there.
    let travelled = 0;
    const lengths = pts.map((p, i) => (travelled += i ? Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0));
    const at = lengths.map(l => l / (travelled || 1));
    parent.add(
      <Node ref={this.root} position={[o.x, o.y]} opacity={0}>
        <Line points={[[-w / 2, -h - 20], [-w / 2, 0], [w / 2 + 20, 0]]} stroke={C.line} lineWidth={3} lineCap={'round'} lineJoin={'round'} />
        <Line ref={this.line} points={pts} stroke={color} lineWidth={6} lineCap={'round'} lineJoin={'round'} end={0} />
        {pts.map((p, i) => (
          <Circle
            ref={makeRef(this.dots, i)}
            size={22}
            position={p}
            fill={color}
            stroke={C.bg}
            lineWidth={4}
            scale={() => easeOutBack(clamp(0, 1, (this.line().end() - at[i] * (1 - DOT_POP)) / DOT_POP))}
          />
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

  /** The line draws itself and each dot pops in when the line reaches it. */
  *draw(d = 1.6) {
    yield* this.line().end(1, t(d), MOVE);
  }
}
