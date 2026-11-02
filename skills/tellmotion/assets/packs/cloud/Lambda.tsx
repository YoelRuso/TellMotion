import {Circle, Node, Rect, Txt} from '@motion-canvas/2d';
import {C, FONT, fs} from '../config';
import {Piece, boxProps, hiddenState, textOn} from './Piece';

export interface LambdaOpts {
  x: number;
  y: number;
  label: string;
  w?: number;
  h?: number;
  color?: string;
}

/** Cloud pack · serverless function: box with a λ badge on the corner. */
export class Lambda extends Piece {
  constructor(parent: Node, o: LambdaOpts) {
    const w = o.w ?? 290;
    const h = o.h ?? 100;
    const color = o.color ?? C.cat[1];
    super(o.x, o.y, w, h, color);
    const hs = hiddenState(o.x, o.y);
    parent.add(
      <Node ref={this.root} position={hs.position} opacity={hs.opacity} scale={hs.scale}>
        <Rect ref={this.box} width={w} height={h} {...boxProps(color)} />
        <Txt text={o.label} fontFamily={FONT} fontWeight={700} fontSize={fs(28)} fill={textOn()} textAlign={'center'} />
        <Circle size={46} fill={color} position={[-w / 2 + 8, -h / 2 + 6]}>
          <Txt text={'λ'} fontFamily={FONT} fontWeight={700} fontSize={fs(32)} fill={C.onAccent} />
        </Circle>
      </Node>,
    );
  }
}
