import {Line, Node} from '@motion-canvas/2d';
import {createRef} from '@motion-canvas/core';
import {C, P, t} from '../config';
import {Piece} from './Piece';

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

  constructor(
    parent: Node,
    /** The points of the arrow: pass them to `send()` so a packet follows it. */
    public points: P[],
    o: ArrowOpts = {},
  ) {
    parent.add(
      <Line
        ref={this.ref}
        points={points}
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

type Side = 'left' | 'right' | 'top' | 'bottom';

export interface ConnectOpts extends ArrowOpts {
  /** Side of each piece to connect. By default the facing sides, chosen from their positions. */
  from?: Side;
  to?: Side;
}

const OPPOSITE: Record<Side, Side> = {left: 'right', right: 'left', top: 'bottom', bottom: 'top'};
const isHorizontal = (side: Side) => side === 'left' || side === 'right';

/** Arrow between two pieces of the same parent, with the elbows it needs. Create both pieces first. */
export function connect(parent: Node, a: Piece, b: Piece, o: ConnectOpts = {}) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const from = o.from ?? (Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : dy >= 0 ? 'bottom' : 'top');
  const to = o.to ?? OPPOSITE[from];
  const s = a[from], e = b[to];
  let elbows: P[];
  if (s[0] === e[0] || s[1] === e[1]) elbows = [];
  else if (isHorizontal(from) && isHorizontal(to)) elbows = [[(s[0] + e[0]) / 2, s[1]], [(s[0] + e[0]) / 2, e[1]]];
  else if (!isHorizontal(from) && !isHorizontal(to)) elbows = [[s[0], (s[1] + e[1]) / 2], [e[0], (s[1] + e[1]) / 2]];
  else elbows = isHorizontal(from) ? [[e[0], s[1]]] : [[s[0], e[1]]];
  return new Arrow(parent, [s, ...elbows, e], o);
}
