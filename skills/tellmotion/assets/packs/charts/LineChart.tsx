import {Circle, Line, Node, Txt} from '@motion-canvas/2d';
import {all, clamp, easeOutBack, makeRef} from '@motion-canvas/core';
import {C, FONT, MOVE, P, fs, t} from '../config';
import {Group} from './Piece';
import {roundUp, yTicks} from './axis';

export interface LineSeries {
  /** Shown at the end of the line. */
  label?: string;
  data: number[];
  color?: string;
}

export interface LineChartOpts {
  x: number;
  y: number;
  w?: number;
  h?: number;
  /** One line. For several, use `series`. */
  data?: number[];
  series?: LineSeries[];
  /** Labels of the horizontal axis. */
  labels?: string[];
  /** Value at the top of the plot (default: max of data, rounded up when there are `ticks`). */
  max?: number;
  color?: string;
  /** Divisions of a value axis with grid lines. Its labels sit to the left of the plot. */
  ticks?: number;
  /** Format of the values ("$12.5k"). */
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

/** Share of the line drawn when a dot pops in fully. */
const DOT_POP = 0.04;
const DOT = 22;

/** Charts pack · line chart: axes, lines that draw themselves and dots that pop in as they reach them. */
export class LineChart extends Group {
  public lines: Line[] = [];
  /** Dots of each line. */
  public dots: Circle[][];
  private values: Txt[][];
  private ends: Node[] = [];

  constructor(parent: Node, o: LineChartOpts) {
    super();
    const w = o.w ?? 1000, h = o.h ?? 420;
    const series: LineSeries[] = o.series ?? [{data: o.data ?? [], color: o.color ?? C.cat[1]}];
    const highest = Math.max(...series.flatMap(s => s.data));
    const max = o.max ?? (o.ticks ? roundUp(highest) : highest || 1);
    const dec = o.decimals ?? 0;
    const format = (v: number) => (o.prefix ?? '') + v.toLocaleString('en-US', {minimumFractionDigits: dec, maximumFractionDigits: dec}) + (o.suffix ?? '');
    const longest = Math.max(...series.map(s => s.data.length));
    const step = w / Math.max(longest - 1, 1);
    this.dots = series.map((): Circle[] => []);
    this.values = series.map((): Txt[] => []);
    parent.add(
      <Node ref={this.root} position={[o.x, o.y]} opacity={0}>
        {o.ticks ? yTicks({w, h, ticks: o.ticks, max: () => max, format}) : null}
        <Line points={[[-w / 2, -h - 20], [-w / 2, 0], [w / 2 + 20, 0]]} stroke={C.line} lineWidth={3} lineCap={'round'} lineJoin={'round'} />
        {(o.labels ?? []).map((l, i) => (
          <Txt text={l} fontFamily={FONT} fontSize={fs(28)} fill={C.muted} x={-w / 2 + i * step} y={40} />
        ))}
        {series.map((s, k) => {
          const pts: P[] = s.data.map((v, i) => [-w / 2 + i * step, -(v / max) * h]);
          const color = s.color ?? C.cat[(k + 1) % 5];
          // How far along the line each dot sits (0..1), so that it appears when the line gets there.
          let travelled = 0;
          const lengths = pts.map((p, i) => (travelled += i ? Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0));
          const at = lengths.map(l => l / (travelled || 1));
          const last = pts[pts.length - 1];
          return (
            <Node>
              <Line ref={makeRef(this.lines, k)} points={pts} stroke={color} lineWidth={6} lineCap={'round'} lineJoin={'round'} end={0} />
              {pts.map((p, i) => (
                <Node position={p}>
                  <Circle
                    ref={makeRef(this.dots[k], i)}
                    size={DOT}
                    fill={color}
                    stroke={C.bg}
                    lineWidth={4}
                    scale={() => easeOutBack(clamp(0, 1, (this.lines[k].end() - at[i] * (1 - DOT_POP)) / DOT_POP))}
                  />
                  <Txt ref={makeRef(this.values[k], i)} text={format(s.data[i])} fontFamily={FONT} fontWeight={700} fontSize={fs(32)} fill={C.text} stroke={C.bg} lineWidth={8} strokeFirst y={-46} opacity={0} />
                </Node>
              ))}
              {s.label ? (
                <Node ref={makeRef(this.ends, k)} position={last} opacity={0}>
                  <Txt text={s.label} fontFamily={FONT} fontWeight={700} fontSize={fs(28)} fill={color} stroke={C.bg} lineWidth={8} strokeFirst offset={[-1, 0]} x={24} />
                </Node>
              ) : null}
            </Node>
          );
        })}
      </Node>,
    );
  }

  /** The lines draw themselves, each dot pops in when its line reaches it, and the labels of the lines appear at the end. */
  *draw(d = 1.6) {
    yield* all(...this.lines.map(line => line.end(1, t(d), MOVE)));
    const labels = this.ends.filter(Boolean);
    if (labels.length) yield* all(...labels.map(l => l.opacity(1, t(0.3))));
  }

  /** Emphasize point `i` of a line: its dot grows and its value appears, while the other dots of that line fade. */
  *highlight(i: number, line = 0, d = 0.3) {
    yield* all(
      ...this.dots[line].map((dot, k) => all(dot.size(k === i ? DOT * 1.8 : DOT, t(d)), dot.opacity(k === i ? 1 : 0.35, t(d)))),
      ...this.values[line].map((value, k) => value.opacity(k === i ? 1 : 0, t(d))),
    );
  }

  /** Emphasize one line and fade the others. */
  *highlightLine(line: number, d = 0.3) {
    yield* all(...this.lines.flatMap((l, k) => [l.opacity(k === line ? 1 : 0.2, t(d)), ...this.dots[k].map(dot => dot.opacity(k === line ? 1 : 0.2, t(d)))]));
  }

  *clearHighlight(d = 0.3) {
    yield* all(
      ...this.lines.map(l => l.opacity(1, t(d))),
      ...this.dots.flat().map(dot => all(dot.size(DOT, t(d)), dot.opacity(1, t(d)))),
      ...this.values.flat().map(value => value.opacity(0, t(d))),
    );
  }
}
