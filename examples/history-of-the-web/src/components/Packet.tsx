import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutBack} from '@motion-canvas/core';
import {C, FONT, MOVE, P, fs, t} from '../config';

export interface PacketOpts {
  color?: string;
  /** Floating text next to the packet (e.g. an event name). */
  name?: string;
  /** Put the text below the packet instead of above. */
  below?: boolean;
}

/** A small envelope that travels along arrows: events, requests, data. */
export class Packet {
  public root = createRef<Node>();
  public lbl = createRef<Txt>();

  constructor(parent: Node, o: PacketOpts = {}) {
    const color = o.color ?? C.async;
    parent.add(
      <Node ref={this.root} opacity={0} scale={0}>
        <Rect width={64} height={44} radius={6} fill={color} stroke={C.bg} lineWidth={3} />
        <Line points={[[-32, -22], [0, 4], [32, -22]]} stroke={C.bg} lineWidth={3} lineJoin={'round'} />
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

  /** Visit the points in order; `d` is the total travel time. */
  *travel(pts: P[], d = 0.9) {
    const each = d / Math.max(pts.length, 1);
    for (const p of pts) yield* this.root().position(p, t(each), MOVE);
  }

  *vanish(d = 0.3) {
    yield* all(this.root().opacity(0, t(d)), this.root().scale(0, t(d)));
  }

  text(s: string) {
    this.lbl().text(s);
  }
}

/** Create a packet, send it along `pts` and remove it. */
export function* send(parent: Node, pts: P[], o: PacketOpts & {d?: number} = {}) {
  const p = new Packet(parent, o);
  yield* p.appear(pts[0]);
  yield* p.travel(pts.slice(1), o.d ?? 0.9);
  yield* p.vanish();
}
