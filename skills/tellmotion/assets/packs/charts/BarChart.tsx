import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, makeRef, sequence} from '@motion-canvas/core';
import {C, FONT, MOVE, fs, t} from '../config';

export interface BarChartOpts {
  /** Center-bottom of the plot area (the baseline). */
  x: number;
  y: number;
  w?: number;
  h?: number;
  data: {label: string; value: number; color?: string}[];
  /** Value at the top of the plot (default: max of data). */
  max?: number;
}

/** Charts pack · animated bar chart with axes, category labels and live value counters. */
export class BarChart {
  public root = createRef<Node>();
  public bars: Rect[] = [];
  private heights: number[];
  private max: number;
  private plotH: number;

  constructor(parent: Node, o: BarChartOpts) {
    const w = o.w ?? 1000, h = o.h ?? 420;
    this.plotH = h;
    this.max = o.max ?? Math.max(...o.data.map(d => d.value));
    this.heights = o.data.map(d => (d.value / this.max) * h);
    const slot = w / o.data.length, bw = Math.min(slot * 0.6, 160);
    parent.add(
      <Node ref={this.root} position={[o.x, o.y]} opacity={0}>
        <Line points={[[-w / 2, -h - 20], [-w / 2, 0], [w / 2, 0]]} stroke={C.line} lineWidth={3} lineCap={'round'} lineJoin={'round'} />
        {o.data.map((d, i) => (
          <Node x={-w / 2 + slot * (i + 0.5)}>
            <Rect
              ref={makeRef(this.bars, i)}
              offset={[0, 1]}
              width={bw}
              height={0}
              fill={d.color ?? C.cat[i % 5]}
              stroke={C.line}
              lineWidth={2}
              radius={Math.min(10, bw / 4)}
            />
            <Txt text={d.label} fontFamily={FONT} fontSize={fs(28)} fill={C.muted} y={36} />
            <Txt
              fontFamily={FONT}
              fontWeight={700}
              fontSize={fs(32)}
              fill={C.text}
              y={() => -this.bars[i].height() - 32}
              text={() => String(Math.round((this.bars[i].height() / h) * this.max))}
            />
          </Node>
        ))}
      </Node>,
    );
  }

  *appear(d = 0.4) {
    yield* this.root().opacity(1, t(d));
  }

  /** Bars grow from the baseline (values count up live). */
  *grow(d = 1, stagger = 0.12) {
    yield* sequence(stagger, ...this.bars.map((b, i) => b.height(this.heights[i], t(d), MOVE)));
  }

  /** Animate to new values. */
  *update(values: number[], d = 0.8) {
    this.heights = values.map(v => (v / this.max) * this.plotH);
    yield* all(...this.bars.map((b, i) => b.height(this.heights[i], t(d), MOVE)));
  }

  /** Emphasize one bar and dim the rest. */
  *highlight(i: number, d = 0.3) {
    yield* all(...this.bars.map((b, k) => b.opacity(k === i ? 1 : 0.3, t(d))));
  }

  *clearHighlight(d = 0.3) {
    yield* all(...this.bars.map(b => b.opacity(1, t(d))));
  }
}
