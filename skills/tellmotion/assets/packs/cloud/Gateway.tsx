import {Line, Node, Txt} from '@motion-canvas/2d';
import {C, FONT, fs} from '../config';
import {Piece, boxProps, hiddenState, textOn} from './Piece';

export interface GatewayOpts {
  x: number;
  y: number;
  label: string;
  color?: string;
  w?: number;
  h?: number;
}

const POINT = 30;

/** Cloud pack · entry point of the system (API gateway, load balancer): a hexagon, so it stands apart from the services behind it. */
export class Gateway extends Piece {
  constructor(parent: Node, o: GatewayOpts) {
    const w = o.w ?? 260;
    const h = o.h ?? 110;
    const color = o.color ?? C.cat[1];
    super(o.x, o.y, w, h, color, [w - POINT * 2 - 16, h - 16]);
    const bp = boxProps(color);
    const hs = hiddenState(o.x, o.y);
    parent.add(
      <Node ref={this.root} position={hs.position} opacity={hs.opacity} scale={hs.scale}>
        <Line
          ref={this.box}
          points={[[-w / 2 + POINT, -h / 2], [w / 2 - POINT, -h / 2], [w / 2, 0], [w / 2 - POINT, h / 2], [-w / 2 + POINT, h / 2], [-w / 2, 0]]}
          closed
          fill={bp.fill}
          stroke={bp.stroke}
          lineWidth={bp.lineWidth}
          lineDash={bp.lineDash}
          lineJoin={'round'}
          shadowColor={bp.shadowColor}
          shadowBlur={bp.shadowBlur}
          shadowOffset={bp.shadowOffset}
        />
        <Txt ref={this.label} text={o.label} fontFamily={FONT} fontWeight={700} fontSize={fs(28)} fill={textOn()} textAlign={'center'} {...this.wrapped(o.label)} />
      </Node>,
    );
  }
}
