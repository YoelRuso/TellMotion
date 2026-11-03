import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {SimpleSignal, all, createSignal, makeRef, sequence} from '@motion-canvas/core';
import {C, FONT, MOVE, fs, t} from '../config';
import {Group} from './Piece';

export interface BarChartOpts {
  /** Center-bottom of the plot area (the baseline). */
  x: number;
  y: number;
  w?: number;
  h?: number;
  data: {label: string; value: number; color?: string}[];
  /** Value at the top of the plot (default: max of data). `update()` raises it if new values go beyond it. */
  max?: number;
  /** Format of the value labels ("$12.5k"). */
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

/** Charts pack · animated bar chart with axes, category labels and live value counters. */
export class BarChart extends Group {
  public bars: Rect[] = [];
  private values: SimpleSignal<number>[];
  private targets: number[];
  private baseMax: number;
  private max: SimpleSignal<number>;

  constructor(parent: Node, o: BarChartOpts) {
    super();
    const w = o.w ?? 1000, h = o.h ?? 420;
    this.targets = o.data.map(d => d.value);
    this.baseMax = o.max ?? (Math.max(...this.targets) || 1);
    this.max = createSignal(this.baseMax);
    this.values = o.data.map(() => createSignal(0));
    const dec = o.decimals ?? 0;
    const label = (v: number) => (o.prefix ?? '') + v.toLocaleString('en-US', {minimumFractionDigits: dec, maximumFractionDigits: dec}) + (o.suffix ?? '');
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
              height={() => (this.values[i]() / this.max()) * h}
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
              text={() => label(this.values[i]())}
            />
          </Node>
        ))}
      </Node>,
    );
  }

  /** Bars grow from the baseline (values count up live). */
  *grow(d = 1, stagger = 0.12) {
    yield* sequence(stagger, ...this.values.map((v, i) => v(this.targets[i], t(d), MOVE)));
  }

  /** Animate to new values; the scale adapts if they go beyond the top of the plot. */
  *update(values: number[], d = 0.8) {
    this.targets = values;
    yield* all(this.max(Math.max(this.baseMax, ...values), t(d), MOVE), ...this.values.map((v, i) => v(values[i], t(d), MOVE)));
  }

  /** Emphasize one bar and dim the rest. */
  *highlight(i: number, d = 0.3) {
    yield* all(...this.bars.map((b, k) => b.opacity(k === i ? 1 : 0.3, t(d))));
  }

  *clearHighlight(d = 0.3) {
    yield* all(...this.bars.map(b => b.opacity(1, t(d))));
  }
}
