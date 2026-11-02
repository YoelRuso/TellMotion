import {Circle, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutBack, tween} from '@motion-canvas/core';
import {C, FONT, MOVE, P, fs, t} from '../config';
import {Piece} from './Piece';

export type PacketShape = 'envelope' | 'dot' | 'diamond';

export interface PacketOpts {
  /** Default: the line color for `dot`, the async color for the others, so packets match the arrows they follow. */
  color?: string;
  /** `dot` for requests, `diamond` for events, `envelope` for actual messages such as emails. Default: `envelope`. */
  shape?: PacketShape;
  /** Floating text next to the packet (e.g. an event name). */
  name?: string;
  /** Put the text below the packet instead of above. */
  below?: boolean;
}

/** Travel speed in px/s when no duration is given; very short or long routes are clamped to these durations. */
const SPEED = 700;
const MIN_TRAVEL = 0.5;
const MAX_TRAVEL = 2.5;
const CORNER = 24;

const dist = (a: P, b: P) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** The route with rounded corners, sampled as short segments, so the packet turns instead of snapping. */
function smooth(pts: P[]): P[] {
  const out: P[] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const [a, b, c] = [pts[i - 1], pts[i], pts[i + 1]];
    const r = Math.min(CORNER, dist(a, b) / 2, dist(b, c) / 2);
    const towards = (q: P): P => {
      const k = r / (dist(b, q) || 1);
      return [b[0] + (q[0] - b[0]) * k, b[1] + (q[1] - b[1]) * k];
    };
    const from = towards(a), to = towards(c);
    for (let k = 0; k <= 8; k++) {
      const u = k / 8, v = 1 - u;
      out.push([v * v * from[0] + 2 * v * u * b[0] + u * u * to[0], v * v * from[1] + 2 * v * u * b[1] + u * u * to[1]]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** The point at `distance` along a route. */
function pointAt(route: P[], distance: number): P {
  let left = distance;
  for (let i = 1; i < route.length; i++) {
    const len = dist(route[i - 1], route[i]);
    if (left <= len && len > 0) {
      const k = left / len;
      return [route[i - 1][0] + (route[i][0] - route[i - 1][0]) * k, route[i - 1][1] + (route[i][1] - route[i - 1][1]) * k];
    }
    left -= len;
  }
  return route[route.length - 1];
}

/** A marker that travels along arrows: events, requests, data. */
export class Packet {
  public root = createRef<Node>();
  public lbl = createRef<Txt>();

  constructor(parent: Node, o: PacketOpts = {}) {
    const shape = o.shape ?? 'envelope';
    const color = o.color ?? (shape === 'dot' ? C.line : C.async);
    parent.add(
      <Node ref={this.root} opacity={0} scale={0}>
        {shape === 'dot' ? <Circle size={36} fill={color} stroke={C.bg} lineWidth={4} /> : null}
        {shape === 'diamond' ? <Rect size={30} radius={4} rotation={45} fill={color} stroke={C.bg} lineWidth={4} /> : null}
        {shape === 'envelope' ? <Rect width={64} height={44} radius={6} fill={color} stroke={C.bg} lineWidth={3} /> : null}
        {shape === 'envelope' ? <Line points={[[-32, -22], [0, 4], [32, -22]]} stroke={C.bg} lineWidth={3} lineJoin={'round'} /> : null}
        <Txt
          ref={this.lbl}
          text={o.name ?? ''}
          fontFamily={FONT}
          fontWeight={700}
          fontSize={fs(28)}
          fill={color}
          stroke={C.bg}
          lineWidth={8}
          strokeFirst
          y={o.below ? 54 : -54}
        />
      </Node>,
    );
  }

  *appear(p: P, d = 0.3) {
    this.root().position(p);
    yield* all(this.root().opacity(1, t(d)), this.root().scale(1, t(d), easeOutBack));
  }

  /** Follow the points without stopping at corners. `d` is the total time; by default it depends on the distance. */
  *travel(pts: P[], d?: number) {
    const {x, y} = this.root().position();
    const route = smooth([[x, y], ...pts]);
    const total = route.slice(1).reduce((sum, p, i) => sum + dist(route[i], p), 0);
    if (total === 0) return;
    const seconds = d ?? Math.min(MAX_TRAVEL, Math.max(MIN_TRAVEL, total / SPEED));
    yield* tween(t(seconds), v => this.root().position(pointAt(route, MOVE(v) * total)));
  }

  *vanish(d = 0.3) {
    yield* all(this.root().opacity(0, t(d)), this.root().scale(0, t(d)));
  }

  text(s: string) {
    this.lbl().text(s);
  }
}

/** Create a packet, send it along `pts` and remove it. Pass `to` and that piece reacts when the packet arrives. */
export function* send(parent: Node, pts: P[], o: PacketOpts & {d?: number; to?: Piece} = {}) {
  const p = new Packet(parent, o);
  yield* p.appear(pts[0]);
  yield* p.travel(pts.slice(1), o.d);
  yield* all(p.vanish(), ...(o.to ? [o.to.ping()] : []));
}
