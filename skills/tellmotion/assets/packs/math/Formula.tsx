import {Latex, Node} from '@motion-canvas/2d';
import {createRef} from '@motion-canvas/core';
import {C, MOVE, fs, t} from '../config';
import {Group} from './Piece';

export interface FormulaOpts {
  x: number;
  y: number;
  /** LaTeX. Wrap parts in {{double braces}} so that `to()` moves them instead of fading them. */
  tex: string;
  /** Font size (default 72). */
  size?: number;
  color?: string;
}

/** Math pack · equation in LaTeX that can turn into another one, step by step. */
export class Formula extends Group {
  public tex = createRef<Latex>();

  constructor(parent: Node, o: FormulaOpts) {
    super();
    parent.add(
      <Node ref={this.root} position={[o.x, o.y]} opacity={0}>
        <Latex ref={this.tex} tex={o.tex} fontSize={fs(o.size ?? 72)} fill={o.color ?? C.text} />
      </Node>,
    );
  }

  /** Turn into another equation: parts with the same {{name}} travel to their new place. */
  *to(tex: string, d = 1) {
    yield* this.tex().tex(tex, t(d), MOVE);
  }
}
