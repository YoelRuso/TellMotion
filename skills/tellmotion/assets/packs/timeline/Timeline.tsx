import {Circle, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, makeRef, sequence} from '@motion-canvas/core';
import {C, FONT, MOVE, fs, t} from '../config';
import {Group} from './Piece';

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

const STEM = 110;
const LEVEL_H = 100;
const MAX_LEVEL = 2;

/** For each milestone, the side and height of its label: it alternates sides, and changes side or rises when it would hit a neighbour. */
function labelLevels(milestones: Milestone[], w: number) {
  const placed: {x: number; half: number; level: number; side: number}[] = [];
  return milestones.map((m, i) => {
    const preferred = i % 2 === 0 ? -1 : 1;
    const x = m.at * w;
    // Estimated: the fonts are not ready yet, and an average of 0.6 em per character errs on the wide side.
    const half = Math.max(m.label.length * fs(32), (m.date ?? '').length * fs(28)) * 0.3 + 16;
    const clashes = (side: number, level: number) =>
      placed.some(p => {
        if (p.side !== side) return false;
        const dx = Math.abs(p.x - x);
        if (p.level === level) return dx < p.half + half;
        return p.level < level ? dx < p.half : dx < half; // the stem of the higher one would cross the label of the lower one
      });
    let side = preferred;
    let level = 0;
    while (level < MAX_LEVEL && clashes(side, level)) {
      if (!clashes(-side, level)) side = -side;
      else level++;
    }
    placed.push({x, half, level, side});
    return {level, side};
  });
}

/** Timeline pack · horizontal axis with milestones (alternating above/below, higher where they would collide) and optional phase bands. */
export class Timeline extends Group {
  public axis = createRef<Line>();
  public groups: Node[] = [];
  public bands: Node[] = [];
  private bandLabels: Txt[] = [];
  private w: number;

  constructor(parent: Node, o: TimelineOpts) {
    super();
    const w = (this.w = o.w ?? 1500);
    const labels = labelLevels(o.milestones, w);
    parent.add(
      <Node ref={this.root} position={[o.x, o.y]}>
        {(o.ranges ?? []).map((r, i) => (
          <Node ref={makeRef(this.bands, i)} opacity={0}>
            <Rect width={(r.to - r.from) * w} height={34} x={-w / 2 + ((r.from + r.to) / 2) * w} y={0} fill={r.color ?? C.cat[i % 5]} opacity={0.35} radius={6} />
          </Node>
        ))}
        <Line ref={this.axis} points={[[-w / 2, 0], [w / 2, 0]]} stroke={C.line} lineWidth={5} lineCap={'round'} end={0} />
        {o.milestones.map((m, i) => {
          const s = labels[i].side;
          const color = m.color ?? C.cat[i % 5];
          const mx = -w / 2 + m.at * w;
          const stem = STEM + labels[i].level * LEVEL_H;
          return (
            <Node ref={makeRef(this.groups, i)} position={[mx, 0]} opacity={0}>
              <Line points={[[0, 0], [0, s * stem]]} stroke={color} lineWidth={4} />
              <Circle size={34} fill={color} stroke={C.bg} lineWidth={5} />
              <Txt text={m.label} fontFamily={FONT} fontWeight={700} fontSize={fs(32)} fill={C.text} y={s * (stem + 40)} />
              {m.date ? <Txt text={m.date} fontFamily={FONT} fontSize={fs(28)} fill={C.muted} y={s * (stem + 80)} /> : null}
            </Node>
          );
        })}
        {/* Above the stems, with a halo: a stem may pass behind the name of a phase */}
        {(o.ranges ?? []).map((r, i) => (
          <Txt ref={makeRef(this.bandLabels, i)} text={r.label} fontFamily={FONT} fontSize={fs(28)} fill={C.text} stroke={C.bg} lineWidth={8} strokeFirst x={-w / 2 + ((r.from + r.to) / 2) * w} y={-44} opacity={0} />
        ))}
      </Node>,
    );
  }

  /** The axis, the bands and every milestone. */
  *appear(d = 1) {
    yield* this.root().opacity(1, 0);
    yield* all(this.drawAxis(d), this.showBands());
    yield* this.revealAll();
  }

  *drawAxis(d = 1) {
    yield* this.axis().end(1, t(d), MOVE);
  }

  *showBands(stagger = 0.3) {
    yield* sequence(stagger, ...this.bands.map((b, i) => all(b.opacity(1, t(0.4)), this.bandLabels[i].opacity(1, t(0.4)))));
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
