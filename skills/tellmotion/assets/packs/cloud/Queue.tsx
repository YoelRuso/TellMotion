import {Node, Rect, Txt} from '@motion-canvas/2d';
import {makeRef} from '@motion-canvas/core';
import {C, FONT, S, fs, t} from '../config';
import {Piece, boxProps, hiddenState, textOn} from './Piece';

export interface QueueOpts {
  x: number;
  y: number;
  label: string;
  w?: number;
  h?: number;
  /** Number of message slots drawn. */
  n?: number;
  /** Dead-letter queue: drawn in the error color. */
  dlq?: boolean;
}

/** Cloud pack · message queue (SQS-like): label + slots that fill with messages. */
export class Queue extends Piece {
  public slots: Rect[] = [];
  public filled = 0;
  private slotColor: string;

  constructor(parent: Node, o: QueueOpts) {
    const w = o.w ?? 320;
    const h = o.h ?? 100;
    const color = o.dlq ? C.error : C.cat[3];
    super(o.x, o.y, w, h, color, [w - 32, 40]);
    // On a box filled with its own color, slots in that color would be invisible.
    this.slotColor = S.fill === 'accent' ? C.onAccent : color;
    const n = o.n ?? 6;
    const hs = hiddenState(o.x, o.y);
    parent.add(
      <Node ref={this.root} position={hs.position} opacity={hs.opacity} scale={hs.scale}>
        <Rect ref={this.box} width={w} height={h} {...boxProps(color)} lineDash={o.dlq ? [12, 8] : boxProps(color).lineDash} />
        <Txt ref={this.label} text={o.label} fontFamily={FONT} fontWeight={700} fontSize={fs(28)} fill={textOn()} y={-h / 2 + 30} />
        {Array.from({length: n}, (_, i) => (
          <Rect ref={makeRef(this.slots, i)} width={26} height={26} radius={4} stroke={this.slotColor} lineWidth={2} fill={'rgba(0,0,0,0)'} x={(i - (n - 1) / 2) * 36} y={h / 2 - 24} />
        ))}
      </Node>,
    );
  }

  /** Add n messages. */
  *push(n = 1, d = 0.25) {
    for (let i = 0; i < n && this.filled < this.slots.length; i++) yield* this.slots[this.filled++].fill(this.slotColor, t(d));
  }

  /** Remove n messages. */
  *pop(n = 1, d = 0.25) {
    for (let i = 0; i < n && this.filled > 0; i++) yield* this.slots[--this.filled].fill('rgba(0,0,0,0)', t(d));
  }
}
