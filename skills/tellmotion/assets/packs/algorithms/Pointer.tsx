import {Line, Node, Txt} from '@motion-canvas/2d';
import {all} from '@motion-canvas/core';
import {C, FONT, MOVE, fs, t} from '../config';
import {Group} from './Piece';

export interface PointerOpts {
  /** Position of the TIP of the arrow (the element it points at). */
  x: number;
  y: number;
  label: string;
  color?: string;
  /** "up": arrow below the element pointing up. "down": arrow above pointing down. */
  dir?: 'up' | 'down';
}

/** Algorithms pack · labelled pointer (i, j, pivot, head...). */
export class Pointer extends Group {
  constructor(parent: Node, o: PointerOpts) {
    super();
    const color = o.color ?? C.cat[1];
    const up = (o.dir ?? 'up') === 'up';
    const s = up ? 1 : -1; // label side
    parent.add(
      <Node ref={this.root} position={[o.x, o.y]} opacity={0}>
        <Line points={[[0, s * 64], [0, 0]]} stroke={color} lineWidth={5} lineCap={'round'} endArrow arrowSize={16} />
        <Txt text={o.label} fontFamily={FONT} fontWeight={700} fontSize={fs(32)} fill={color} y={s * 96} />
      </Node>,
    );
  }

  *moveTo(x: number, y?: number, d = 0.5) {
    yield* all(this.root().x(x, t(d), MOVE), y === undefined ? this.root().y(this.root().y(), 0) : this.root().y(y, t(d), MOVE));
  }
}
