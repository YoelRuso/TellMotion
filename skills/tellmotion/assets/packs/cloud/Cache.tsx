import {Circle, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, chain, createRef, waitFor} from '@motion-canvas/core';
import {C, FONT, fs, t} from '../config';
import {Piece, boxProps, hiddenState, textOn} from './Piece';

export interface CacheOpts {
  x: number;
  y: number;
  label: string;
  color?: string;
  w?: number;
  h?: number;
}

/** Cloud pack · fast store in front of a slower one: lightning badge, and `hit()` / `miss()` show the result of a lookup. */
export class Cache extends Piece {
  constructor(parent: Node, o: CacheOpts) {
    const w = o.w ?? 240;
    const h = o.h ?? 100;
    const color = o.color ?? C.cat[4];
    super(o.x, o.y, w, h, color);
    const hs = hiddenState(o.x, o.y);
    parent.add(
      <Node ref={this.root} position={hs.position} opacity={hs.opacity} scale={hs.scale}>
        <Rect ref={this.box} width={w} height={h} {...boxProps(color)} />
        <Txt ref={this.label} text={o.label} fontFamily={FONT} fontWeight={700} fontSize={fs(28)} fill={textOn()} textAlign={'center'} {...this.wrapped(o.label)} />
        <Circle size={52} fill={color} stroke={C.bg} lineWidth={3} position={[-w / 2 + 8, -h / 2 + 6]}>
          <Line points={[[3, -14], [-8, 3], [0, 3], [-3, 14], [8, -3], [0, -3]]} closed fill={C.onAccent} />
        </Circle>
      </Node>,
    );
  }

  private *flash(text: string, color: string, d: number) {
    const tag = createRef<Txt>();
    this.root().add(<Txt ref={tag} text={text} fontFamily={FONT} fontWeight={700} fontSize={fs(28)} fill={color} stroke={C.bg} lineWidth={8} strokeFirst y={-this.h / 2 - 34} opacity={0} />);
    yield* all(this.mark(color, false, d * 0.2), chain(tag().opacity(1, t(d * 0.2)), waitFor(t(d * 0.6)), tag().opacity(0, t(d * 0.2))));
    yield* this.unmark(d * 0.2);
    tag().remove();
  }

  /** The data was there. */
  *hit(d = 1) {
    yield* this.flash('HIT', C.ok, d);
  }

  /** The data was not there. */
  *miss(d = 1) {
    yield* this.flash('MISS', C.error, d);
  }
}
