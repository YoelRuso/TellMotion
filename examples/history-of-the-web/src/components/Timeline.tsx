import {Circle, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, makeRef, sequence} from '@motion-canvas/core';
import {C, FONT, MOVE, fs, t} from '../config';

export interface Milestone {
  label: string;
  /** Small text under/over the label (a date, a phase). */
  date?: string;
  /** Position along the axis, 0 (start) to 1 (end). */
  at: number;
  color?: string;
}

export interface TimelineOpts {
  /** Center of the axis. */
  x: number;
  y: number;
  w?: number;
  milestones: Milestone[];
  /** Optional bands along the axis (phases): from/to in 0..1. */
  ranges?: {from: number; to: number; label: string; color?: string}[];
}

/** Timeline pack · horizontal axis with milestones (alternating above/below) and optional phase bands. */
export class Timeline {
  public root = createRef<Node>();
  public axis = createRef<Line>();
  public groups: Node[] = [];
  public bands: Node[] = [];
  private w: number;

  constructor(parent: Node, o: TimelineOpts) {
    const w = (this.w = o.w ?? 1500);
    parent.add(
      <Node ref={this.root} position={[o.x, o.y]}>
        {(o.ranges ?? []).map((r, i) => (
          <Node ref={makeRef(this.bands, i)} opacity={0}>
            <Rect width={(r.to - r.from) * w} height={34} x={-w / 2 + ((r.from + r.to) / 2) * w} y={0} fill={r.color ?? C.cat[i % 5]} opacity={0.35} radius={6} />
            <Txt text={r.label} fontFamily={FONT} fontSize={fs(28)} fill={C.text} x={-w / 2 + ((r.from + r.to) / 2) * w} y={-44} />
          </Node>
        ))}
        <Line ref={this.axis} points={[[-w / 2, 0], [w / 2, 0]]} stroke={C.line} lineWidth={5} lineCap={'round'} end={0} />
        {o.milestones.map((m, i) => {
          const up = i % 2 === 0;
          const s = up ? -1 : 1;
          const color = m.color ?? C.cat[i % 5];
          const mx = -w / 2 + m.at * w;
          return (
            <Node ref={makeRef(this.groups, i)} position={[mx, 0]} opacity={0}>
              <Line points={[[0, 0], [0, s * 110]]} stroke={color} lineWidth={4} />
              <Circle size={34} fill={color} stroke={C.bg} lineWidth={5} />
              <Txt text={m.label} fontFamily={FONT} fontWeight={700} fontSize={fs(32)} fill={C.text} y={s * 150} />
              {m.date ? <Txt text={m.date} fontFamily={FONT} fontSize={fs(28)} fill={C.muted} y={s * 190} /> : null}
            </Node>
          );
        })}
      </Node>,
    );
  }

  *drawAxis(d = 1) {
    yield* this.axis().end(1, t(d), MOVE);
  }

  *showBands(stagger = 0.3) {
    yield* sequence(stagger, ...this.bands.map(b => b.opacity(1, t(0.4))));
  }

  /** Reveal milestone i (marker, stem and text). */
  *reveal(i: number, d = 0.5) {
    yield* all(this.groups[i].opacity(1, t(d)), this.groups[i].scale(1.15, t(d / 2)));
    yield* this.groups[i].scale(1, t(d / 2));
  }

  *revealAll(stagger = 0.5) {
    yield* sequence(stagger, ...this.groups.map((_, i) => this.reveal(i)));
  }

  /** Focus one milestone and dim the rest. */
  *focus(i: number, d = 0.3) {
    yield* all(...this.groups.map((g, k) => g.opacity(k === i ? 1 : 0.25, t(d))));
  }

  *clearFocus(d = 0.3) {
    yield* all(...this.groups.map(g => g.opacity(1, t(d))));
  }
}
