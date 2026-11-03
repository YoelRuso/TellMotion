import {Circle, Node, Txt} from '@motion-canvas/2d';
import {all, chain, makeRef} from '@motion-canvas/core';
import {C, FONT, MOVE, fs, t} from '../config';
import {Group} from './Piece';

export interface PieChartOpts {
  x: number;
  y: number;
  radius?: number;
  data: {label: string; value: number; color?: string}[];
}

/** Charts pack · pie chart whose slices sweep in one after another, with percentage labels outside. */
export class PieChart extends Group {
  public slices: Circle[] = [];
  public labels: Txt[] = [];
  private ends: number[] = [];

  constructor(parent: Node, o: PieChartOpts) {
    super();
    const r = o.radius ?? 260;
    const total = o.data.reduce((a, d) => a + d.value, 0);
    let angle = -90; // start at 12 o'clock
    const starts: number[] = [];
    o.data.forEach(d => {
      starts.push(angle);
      angle += (d.value / total) * 360;
      this.ends.push(angle);
    });
    parent.add(
      <Node ref={this.root} position={[o.x, o.y]}>
        {o.data.map((d, i) => (
          <Circle
            ref={makeRef(this.slices, i)}
            size={r * 2}
            startAngle={starts[i]}
            endAngle={starts[i]}
            closed
            fill={d.color ?? C.cat[i % 5]}
            stroke={C.bg}
            lineWidth={() => (this.slices[i].endAngle() > starts[i] ? 5 : 0)}
          />
        ))}
        {o.data.map((d, i) => {
          const mid = ((starts[i] + this.ends[i]) / 2) * (Math.PI / 180);
          const pct = Math.round((d.value / total) * 100);
          return (
            <Txt
              ref={makeRef(this.labels, i)}
              text={`${d.label} ${pct}%`}
              fontFamily={FONT}
              fontWeight={700}
              fontSize={fs(28)}
              fill={C.text}
              stroke={C.bg}
              lineWidth={8}
              strokeFirst
              x={Math.cos(mid) * (r + 130)}
              y={Math.sin(mid) * (r + 60)}
              opacity={0}
            />
          );
        })}
      </Node>,
    );
  }

  *appear(d = 2) {
    yield* this.root().opacity(1, 0);
    yield* this.sweep(d);
  }

  /** Slices sweep in clockwise; labels fade in with each slice. */
  *sweep(d = 2) {
    const each = d / this.slices.length;
    for (let i = 0; i < this.slices.length; i++) {
      yield* chain(all(this.slices[i].endAngle(this.ends[i], t(each), MOVE), this.labels[i].opacity(1, t(each))));
    }
  }

  /** Pull one slice out and dim the others. */
  *highlight(i: number, d = 0.4) {
    yield* all(...this.slices.map((s, k) => s.opacity(k === i ? 1 : 0.3, t(d))), ...this.labels.map((l, k) => l.opacity(k === i ? 1 : 0.3, t(d))));
  }
}
