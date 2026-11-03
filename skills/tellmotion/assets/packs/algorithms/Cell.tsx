import {Node, Rect, Txt} from '@motion-canvas/2d';
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
  public val = this.label;

  constructor(parent: Node, o: CellOpts) {
    const w = o.w ?? 100;
    const h = o.h ?? 100;
    const color = o.color ?? C.cat[0];
    super(o.x, o.y, w, h, color, [w - 16, h - 16]);
    const bp = boxProps(color);
    const hs = hiddenState(o.x, o.y);
    parent.add(
      <Node ref={this.root} position={hs.position} opacity={hs.opacity} scale={hs.scale}>
        <Rect ref={this.box} width={w} height={h} {...bp} />
        <Txt ref={this.label} text={String(o.value)} fontFamily={FONT} fontWeight={700} fontSize={fs(40)} fill={textOn()} />
        {o.index !== undefined ? <Txt text={String(o.index)} fontFamily={FONT} fontSize={fs(28)} fill={C.muted} y={h / 2 + 30} /> : null}
      </Node>,
    );
  }

  *setValue(v: string | number, d = 0.3) {
    yield* this.val().text(String(v), t(d));
  }
}
