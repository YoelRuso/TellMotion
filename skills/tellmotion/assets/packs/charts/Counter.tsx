import {Node, Txt} from '@motion-canvas/2d';
import {createRef, createSignal, all} from '@motion-canvas/core';
import {C, FONT, MOVE, fs, t} from '../config';

export interface CounterOpts {
  x: number;
  y: number;
  value?: number;
  prefix?: string;
  suffix?: string;
  /** Font size of the number (default 120). */
  size?: number;
  color?: string;
  /** Caption under the number. */
  label?: string;
  decimals?: number;
}

/** Charts pack · big animated number ("12,480 users") that counts up or down. */
export class Counter {
  public root = createRef<Node>();
  public value = createSignal(0);

  constructor(parent: Node, o: CounterOpts) {
    this.value(o.value ?? 0);
    const dec = o.decimals ?? 0;
    parent.add(
      <Node ref={this.root} position={[o.x, o.y]} opacity={0}>
        <Txt
          fontFamily={FONT}
          fontWeight={700}
          fontSize={fs(o.size ?? 120)}
          fill={o.color ?? C.cat[1]}
          text={() => (o.prefix ?? '') + this.value().toLocaleString('en-US', {minimumFractionDigits: dec, maximumFractionDigits: dec}) + (o.suffix ?? '')}
        />
        {o.label ? <Txt text={o.label} fontFamily={FONT} fontSize={fs(32)} fill={C.muted} y={(o.size ?? 120) * 0.8} /> : null}
      </Node>,
    );
  }

  *appear(d = 0.4) {
    yield* this.root().opacity(1, t(d));
  }

  *countTo(v: number, d = 1.5) {
    yield* this.value(v, t(d), MOVE);
  }

  *pulse(d = 0.4) {
    yield* all(this.root().scale(1.1, t(d / 2)));
    yield* this.root().scale(1, t(d / 2));
  }
}
