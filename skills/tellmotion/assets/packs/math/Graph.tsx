import {Circle, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal} from '@motion-canvas/core';
import {C, FONT, MOVE, P, fs, t} from '../config';
import {Group} from './Piece';

export interface GraphOpts {
  /** Center of the plot. */
  x: number;
  y: number;
  w?: number;
  h?: number;
  xRange: [number, number];
  yRange: [number, number];
  /** Distance between ticks on each axis (default 1). */
  xStep?: number;
  yStep?: number;
}

export interface PlotOpts {
  color?: string;
  /** Shown next to the end of the curve. */
  label?: string;
  samples?: number;
}

export interface TraceOpts {
  d?: number;
  color?: string;
  /** Draw the tangent to the curve at the moving point. */
  tangent?: boolean;
}

/** A curve of a `Graph`, made by `graph.plot()`. */
export class Plot {
  public line = createRef<Line>();
  public end = createRef<Node>();

  constructor(
    public fn: (x: number) => number,
    public color: string,
  ) {}

  /** The curve draws itself from left to right. */
  *draw(d = 1.2) {
    yield* this.line().end(1, t(d), MOVE);
    yield* this.end().opacity(1, t(0.3));
  }
}

const number = (v: number) => String(+v.toFixed(2));

/** Math pack · axes with a grid, curves of any function, and a point that travels along them. Curves are cut at the edges of the plot. */
export class Graph extends Group {
  public w: number;
  public h: number;
  private o: GraphOpts;
  private curves = createRef<Rect>();

  constructor(parent: Node, o: GraphOpts) {
    super();
    this.o = o;
    const w = (this.w = o.w ?? 1000), h = (this.h = o.h ?? 620);
    const [xMin, xMax] = o.xRange, [yMin, yMax] = o.yRange;
    const xs = this.ticks(xMin, xMax, o.xStep ?? 1), ys = this.ticks(yMin, yMax, o.yStep ?? 1);
    // The axes cross at zero or, if it is out of range, at the nearest edge.
    const [ox, oy] = this.point(Math.min(xMax, Math.max(xMin, 0)), Math.min(yMax, Math.max(yMin, 0)));
    parent.add(
      <Node ref={this.root} position={[o.x, o.y]} opacity={0}>
        {xs.map(v => <Line points={[[this.point(v, 0)[0], -h / 2], [this.point(v, 0)[0], h / 2]]} stroke={C.line} lineWidth={2} opacity={0.15} />)}
        {ys.map(v => <Line points={[[-w / 2, this.point(0, v)[1]], [w / 2, this.point(0, v)[1]]]} stroke={C.line} lineWidth={2} opacity={0.15} />)}
        <Line points={[[-w / 2 - 20, oy], [w / 2 + 20, oy]]} stroke={C.line} lineWidth={3} lineCap={'round'} endArrow arrowSize={12} />
        <Line points={[[ox, h / 2 + 20], [ox, -h / 2 - 20]]} stroke={C.line} lineWidth={3} lineCap={'round'} endArrow arrowSize={12} />
        {xs.filter(v => v !== 0).map(v => <Txt text={number(v)} fontFamily={FONT} fontSize={fs(28)} fill={C.muted} x={this.point(v, 0)[0]} y={oy + 34} />)}
        {ys.filter(v => v !== 0).map(v => <Txt text={number(v)} fontFamily={FONT} fontSize={fs(28)} fill={C.muted} offset={[1, 0]} x={ox - 16} y={this.point(0, v)[1]} />)}
        <Rect ref={this.curves} clip width={w} height={h} />
      </Node>,
    );
  }

  private ticks(min: number, max: number, step: number) {
    const first = Math.ceil(min / step);
    return Array.from({length: Math.floor(max / step) - first + 1}, (_, i) => (first + i) * step);
  }

  /** Position in the graph of a point given in the units of its axes. */
  point(x: number, y: number): P {
    const [xMin, xMax] = this.o.xRange, [yMin, yMax] = this.o.yRange;
    return [((x - xMin) / (xMax - xMin) - 0.5) * this.w, (0.5 - (y - yMin) / (yMax - yMin)) * this.h];
  }

  /** Add the curve of a function, not drawn yet. */
  plot(fn: (x: number) => number, o: PlotOpts = {}) {
    const [xMin, xMax] = this.o.xRange;
    const samples = o.samples ?? 200;
    const color = o.color ?? C.cat[1];
    const plot = new Plot(fn, color);
    const points = Array.from({length: samples + 1}, (_, i): P => {
      const x = xMin + (i / samples) * (xMax - xMin);
      return this.point(x, fn(x));
    });
    this.curves().add(<Line ref={plot.line} points={points} stroke={color} lineWidth={6} lineCap={'round'} lineJoin={'round'} end={0} />);
    const [ex, ey] = points[samples];
    this.root().add(
      <Node ref={plot.end} position={[ex, Math.max(-this.h / 2 + 24, Math.min(this.h / 2 - 24, ey))]} opacity={0}>
        {o.label ? <Txt text={o.label} fontFamily={FONT} fontWeight={700} fontSize={fs(32)} fill={color} stroke={C.bg} lineWidth={8} strokeFirst offset={[-1, 0]} x={20} /> : null}
      </Node>,
    );
    return plot;
  }

  /** A point travels along a curve between two x, and stays where it ends. Returns it so that it can be hidden. */
  *trace(plot: Plot, from: number, to: number, o: TraceOpts = {}) {
    const x = createSignal(from);
    const color = o.color ?? C.text;
    const slope = () => (plot.fn(x() + 0.001) - plot.fn(x() - 0.001)) / 0.002;
    const pos = (at: number) => this.point(at, plot.fn(at));
    const reach = (this.o.xRange[1] - this.o.xRange[0]) * 0.15;
    const node = createRef<Node>();
    this.root().add(
      <Node ref={node} opacity={0}>
        {o.tangent ? (
          <Line
            points={() => [this.point(x() - reach, plot.fn(x()) - slope() * reach), this.point(x() + reach, plot.fn(x()) + slope() * reach)]}
            stroke={color}
            lineWidth={4}
            lineCap={'round'}
          />
        ) : null}
        <Circle position={() => pos(x())} size={30} fill={color} stroke={C.bg} lineWidth={4} />
      </Node>,
    );
    yield* node().opacity(1, t(0.25));
    yield* all(x(to, t(o.d ?? 1.6), MOVE));
    return node();
  }
}
