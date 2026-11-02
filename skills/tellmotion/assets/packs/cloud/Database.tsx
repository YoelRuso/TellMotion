import {Node, Rect, Txt} from '@motion-canvas/2d';
import {C, FONT, fs} from '../config';
import {Piece, boxProps, hiddenState, textOn} from './Piece';

export interface DatabaseOpts {
  x: number;
  y: number;
  label: string;
  color?: string;
  w?: number;
  h?: number;
}

/** Cloud pack · data store (data lake layers, warehouses): cylinder with a label. */
export class Database extends Piece {
  constructor(parent: Node, o: DatabaseOpts) {
    const w = o.w ?? 190;
    const h = o.h ?? 100;
    const color = o.color ?? C.cat[4];
    super(o.x, o.y, w, h, color);
    const bp = boxProps(color);
    const hs = hiddenState(o.x, o.y);
    parent.add(
      <Node ref={this.root} position={hs.position} opacity={hs.opacity} scale={hs.scale}>
        <Rect ref={this.box} width={w} height={h} {...bp} radius={Math.max(bp.radius, 14)} />
        <Rect width={w} height={28} radius={14} fill={bp.fill} stroke={bp.stroke} lineWidth={bp.lineWidth} y={-h / 2 + 14} />
        <Txt text={o.label} fontFamily={FONT} fontWeight={700} fontSize={fs(28)} fill={textOn()} y={14} />
      </Node>,
    );
  }
}
