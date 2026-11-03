import {Circle, Node, Rect, Txt} from '@motion-canvas/2d';
import {C, FONT, fs} from '../config';
import {Piece, boxProps, hiddenState, textOn} from './Piece';

export type Device = 'web' | 'mobile' | 'user';

export interface ClientOpts {
  x: number;
  y: number;
  label: string;
  /** Icon on the corner. Default: `web`. */
  device?: Device;
  color?: string;
  w?: number;
  h?: number;
}

/** Small icon drawn with the color that reads on the badge. */
function deviceIcon(device: Device) {
  const ink = C.onAccent;
  if (device === 'mobile') return <Rect width={16} height={26} radius={3} stroke={ink} lineWidth={3} />;
  if (device === 'user') {
    return (
      <Node>
        <Circle size={13} y={-7} fill={ink} />
        <Rect width={24} height={11} y={8} radius={[8, 8, 2, 2]} fill={ink} />
      </Node>
    );
  }
  return (
    <Node>
      <Rect width={28} height={18} y={-3} radius={2} stroke={ink} lineWidth={3} />
      <Rect width={14} height={3} y={11} fill={ink} />
    </Node>
  );
}

/** Cloud pack · who starts the request: a browser, a phone or a person. */
export class Client extends Piece {
  constructor(parent: Node, o: ClientOpts) {
    const w = o.w ?? 240;
    const h = o.h ?? 100;
    const color = o.color ?? C.cat[0];
    super(o.x, o.y, w, h, color);
    const hs = hiddenState(o.x, o.y);
    parent.add(
      <Node ref={this.root} position={hs.position} opacity={hs.opacity} scale={hs.scale}>
        <Rect ref={this.box} width={w} height={h} {...boxProps(color)} />
        <Txt ref={this.label} text={o.label} fontFamily={FONT} fontWeight={700} fontSize={fs(28)} fill={textOn()} textAlign={'center'} {...this.wrapped(o.label)} />
        <Circle size={52} fill={color} stroke={C.bg} lineWidth={3} position={[-w / 2 + 8, -h / 2 + 6]}>
          {deviceIcon(o.device ?? 'web')}
        </Circle>
      </Node>,
    );
  }
}
