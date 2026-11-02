import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {createRef} from '@motion-canvas/core';
import {C, FONT, fs, t} from '../config';
import {Piece, boxProps, hiddenState, textOn} from './Piece';

export interface FlowOpts {
  x: number;
  y: number;
  label: string;
  w?: number;
  h?: number;
  color?: string;
}

type Kind = 'terminator' | 'process' | 'decision' | 'io';

/** Shared implementation of the flowchart symbols. Use the exported classes below. */
class FlowShape extends Piece {
  constructor(parent: Node, o: FlowOpts, kind: Kind, defaults: {w: number; h: number; color: string}) {
    const w = o.w ?? defaults.w, h = o.h ?? defaults.h;
    const color = o.color ?? defaults.color;
    super(o.x, o.y, w, h, color);
    const bp = boxProps(color);
    const hs = hiddenState(o.x, o.y);
    const poly: [number, number][] | null =
      kind === 'decision' ? [[0, -h / 2], [w / 2, 0], [0, h / 2], [-w / 2, 0]] : kind === 'io' ? [[-w / 2 + 28, -h / 2], [w / 2, -h / 2], [w / 2 - 28, h / 2], [-w / 2, h / 2]] : null;
    parent.add(
      <Node ref={this.root} position={hs.position} opacity={hs.opacity} scale={hs.scale}>
        {poly ? (
          <Line ref={this.box} points={poly} closed fill={bp.fill} stroke={bp.stroke} lineWidth={bp.lineWidth} lineDash={bp.lineDash} lineJoin={'round'} shadowColor={bp.shadowColor} shadowBlur={bp.shadowBlur} shadowOffset={bp.shadowOffset} />
        ) : (
          <Rect ref={this.box} width={w} height={h} {...bp} radius={kind === 'terminator' ? h / 2 : bp.radius} />
        )}
        <Txt text={o.label} fontFamily={FONT} fontWeight={700} fontSize={fs(28)} fill={textOn()} textAlign={'center'} />
      </Node>,
    );
  }
}

/** Flowchart pack · start/end (pill). */
export class Terminator extends FlowShape {
  constructor(parent: Node, o: FlowOpts) {
    super(parent, o, 'terminator', {w: 240, h: 90, color: C.cat[0]});
  }
}

/** Flowchart pack · process step (rectangle). */
export class Process extends FlowShape {
  constructor(parent: Node, o: FlowOpts) {
    super(parent, o, 'process', {w: 300, h: 100, color: C.cat[2]});
  }
}

/** Flowchart pack · decision (diamond). Use a short question; add Yes/No with `Tag`. */
export class Decision extends FlowShape {
  constructor(parent: Node, o: FlowOpts) {
    super(parent, o, 'decision', {w: 320, h: 180, color: C.cat[1]});
  }
}

/** Flowchart pack · input/output (parallelogram). */
export class DataIO extends FlowShape {
  constructor(parent: Node, o: FlowOpts) {
    super(parent, o, 'io', {w: 320, h: 100, color: C.cat[4]});
  }
}

/** Small branch label next to an arrow ("Yes" / "No"). */
export class Tag {
  public root = createRef<Node>();

  constructor(parent: Node, o: {x: number; y: number; text: string; color?: string}) {
    parent.add(
      <Node ref={this.root} position={[o.x, o.y]} opacity={0}>
        <Txt text={o.text} fontFamily={FONT} fontWeight={700} fontSize={fs(32)} fill={o.color ?? C.text} stroke={C.bg} lineWidth={8} strokeFirst />
      </Node>,
    );
  }

  *show(d = 0.3) {
    yield* this.root().opacity(1, t(d));
  }
}
