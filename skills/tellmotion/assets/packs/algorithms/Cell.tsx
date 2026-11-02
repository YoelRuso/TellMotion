import {Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef} from '@motion-canvas/core';
import {C, FONT, fs, t} from '../config';
import {Piece, boxProps, hiddenState, textOn} from './Piece';

export interface CellOpts {
  x: number;
  y: number;
  value: string | number;
  /** Index shown under the cell (arrays). */
  index?: number;
  w?: number;
  h?: number;
  color?: string;
}

/** Algorithms pack · array cell / stack slot / list item with a value. */
export class Cell extends Piece {
  public val = createRef<Txt>();
  private baseStroke: string;
  private baseFill: string;

  constructor(parent: Node, o: CellOpts) {
    const w = o.w ?? 100;
    const h = o.h ?? 100;
    const color = o.color ?? C.cat[0];
    super(o.x, o.y, w, h, color);
    const bp = boxProps(color);
    this.baseStroke = bp.stroke;
    this.baseFill = bp.fill;
    const hs = hiddenState(o.x, o.y);
    parent.add(
      <Node ref={this.root} position={hs.position} opacity={hs.opacity} scale={hs.scale}>
        <Rect ref={this.box} width={w} height={h} {...bp} />
        <Txt ref={this.val} text={String(o.value)} fontFamily={FONT} fontWeight={700} fontSize={fs(40)} fill={textOn()} />
        {o.index !== undefined ? <Txt text={String(o.index)} fontFamily={FONT} fontSize={fs(28)} fill={C.muted} y={h / 2 + 30} /> : null}
      </Node>,
    );
  }

  *setValue(v: string | number, d = 0.3) {
    yield* this.val().text(String(v), t(d));
  }

  /** Mark the cell with a color (compare, found, sorted...). `solid` also fills it. */
  *mark(color: string, solid = false, d = 0.3) {
    yield* all(
      this.box().stroke(color, t(d)),
      solid ? this.box().fill(color, t(d)) : this.box().fill(this.baseFill, 0),
      this.val().fill(solid ? C.onAccent : textOn(), t(d)),
    );
  }

  *unmark(d = 0.3) {
    yield* all(this.box().stroke(this.baseStroke, t(d)), this.box().fill(this.baseFill, t(d)), this.val().fill(textOn(), t(d)));
  }
}
