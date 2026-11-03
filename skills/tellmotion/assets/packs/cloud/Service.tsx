import {Node, Rect, Txt} from '@motion-canvas/2d';
import {C, FONT, S, fs} from '../config';
import {Piece, boxProps, hiddenState, textOn} from './Piece';

/** Small database icon (cylinder) for the corner of a service. */
export function dbIcon(color: string, x: number, y: number) {
  return (
    <Node position={[x, y]}>
      <Rect width={40} height={36} radius={Math.min(6, S.radius)} fill={C.surface} stroke={color} lineWidth={3} />
      <Rect width={40} height={16} radius={8} fill={C.surface} stroke={color} lineWidth={3} y={-10} />
    </Node>
  );
}

export interface ServiceOpts {
  x: number;
  y: number;
  label: string;
  color?: string;
  w?: number;
  h?: number;
  /** Show the service's own database icon. */
  db?: boolean;
}

/** Cloud pack · microservice with an optional database. */
export class Service extends Piece {
  constructor(parent: Node, o: ServiceOpts) {
    const w = o.w ?? 300;
    const h = o.h ?? 100;
    const color = o.color ?? C.cat[2];
    super(o.x, o.y, w, h, color);
    const hs = hiddenState(o.x, o.y);
    parent.add(
      <Node ref={this.root} position={hs.position} opacity={hs.opacity} scale={hs.scale}>
        <Rect ref={this.box} width={w} height={h} {...boxProps(color)} />
        <Txt ref={this.label} text={o.label} fontFamily={FONT} fontWeight={700} fontSize={fs(28)} fill={textOn()} textAlign={'center'} {...this.wrapped(o.label)} />
        {o.db ? dbIcon(color, w / 2 - 8, h / 2 - 4) : null}
      </Node>,
    );
  }
}
