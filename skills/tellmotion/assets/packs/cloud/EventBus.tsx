import {Node, Rect, Txt} from '@motion-canvas/2d';
import {all} from '@motion-canvas/core';
import {Arrow} from './Arrow';
import {C, FONT, P, fs} from '../config';
import {PacketOpts, send} from './Packet';
import {Piece, boxProps, hiddenState, textOn} from './Piece';

export interface EventBusOpts {
  x: number;
  y: number;
  label: string;
  color?: string;
  w?: number;
  h?: number;
}

/** Distance from the edge of the bus to the lane events travel along, clear of its label. */
const LANE = 10;

/**
 * Cloud pack · long bar that producers publish to and consumers read from.
 * Arrows are vertical, at the x of each piece: `from(piece)` and `to(piece)`. `publish()` plays the whole event.
 */
export class EventBus extends Piece {
  private parent: Node;

  constructor(parent: Node, o: EventBusOpts) {
    const w = o.w ?? 1100;
    const h = o.h ?? 90;
    const color = o.color ?? C.cat[3];
    super(o.x, o.y, w, h, color);
    this.parent = parent;
    const hs = hiddenState(o.x, o.y);
    parent.add(
      <Node ref={this.root} position={hs.position} opacity={hs.opacity} scale={hs.scale}>
        <Rect ref={this.box} width={w} height={h} {...boxProps(color)} />
        <Txt ref={this.label} text={o.label} fontFamily={FONT} fontWeight={700} fontSize={fs(32)} fill={textOn()} textAlign={'center'} {...this.wrapped(o.label)} />
      </Node>,
    );
  }

  /** The side of the piece that faces the bus, and the point of the bus right in front of it. */
  private ends(piece: Piece): [P, P] {
    const below = piece.y > this.y;
    return [below ? piece.top : piece.bottom, [piece.x, this.y + ((below ? 1 : -1) * this.h) / 2]];
  }

  /** Arrow from a producer to the bus. */
  from(piece: Piece) {
    const [start, end] = this.ends(piece);
    return new Arrow(this.parent, [start, end], {async: true});
  }

  /** Arrow from the bus to a consumer. */
  to(piece: Piece) {
    const [end, start] = this.ends(piece);
    return new Arrow(this.parent, [start, end], {async: true});
  }

  /** An event goes from the producer to the bus and then along it to every consumer, which get it at the same time. */
  *publish(producer: Piece, consumers: Piece[], o: PacketOpts & {d?: number} = {}) {
    const [start, entry] = this.ends(producer);
    yield* send(this.parent, [start, entry], {shape: 'diamond', below: producer.y < this.y, ...o, to: this});
    yield* all(
      ...consumers.map((consumer, i) => {
        const [end, exit] = this.ends(consumer);
        const lane = exit[1] + (consumer.y > this.y ? -LANE : LANE);
        return send(this.parent, [[producer.x, lane], [consumer.x, lane], end], {shape: 'diamond', below: consumer.y > this.y, ...o, name: i === 0 ? o.name : undefined, d: o.d ?? 1, to: consumer});
      }),
    );
  }
}
