import {Line, Node} from '@motion-canvas/2d';
import {createRef} from '@motion-canvas/core';
import {C, P, t} from '../config';

export interface ArrowOpts {
  color?: string;
  /** Dashed line with the theme's "async" color (events, reads, optional paths). */
  async?: boolean;
  /** No arrow head. */
  plain?: boolean;
}

/** Arrow (can have elbows) that draws itself progressively. */
export class Arrow {
  public ref = createRef<Line>();

  constructor(parent: Node, pts: P[], o: ArrowOpts = {}) {
    parent.add(
      <Line
        ref={this.ref}
        points={pts}
        stroke={o.color ?? (o.async ? C.async : C.line)}
        lineWidth={3}
        lineCap={'round'}
        lineJoin={'round'}
        endArrow={!o.plain}
        arrowSize={12}
        lineDash={o.async ? [10, 8] : []}
        end={0}
      />,
    );
  }

  *draw(d = 0.5) {
    yield* this.ref().end(1, t(d));
  }

  *hide(d = 0.3) {
    yield* this.ref().opacity(0, t(d));
  }

  *show(d = 0.3) {
    yield* this.ref().opacity(1, t(d));
  }
}
