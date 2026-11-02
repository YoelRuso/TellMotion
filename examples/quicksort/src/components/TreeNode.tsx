import {Node, Rect, Txt} from '@motion-canvas/2d';
import {createRef} from '@motion-canvas/core';
import {Arrow} from './Arrow';
import {C, FONT, fs, t} from '../config';
import {Piece, boxProps, hiddenState, textOn} from './Piece';

export interface TreeNodeOpts {
  x: number;
  y: number;
  value: string | number;
  size?: number;
  color?: string;
}

/** Algorithms pack · circular node for trees and graphs. Create edges with `link()` BEFORE the nodes so they sit behind. */
export class TreeNode extends Piece {
  public val = createRef<Txt>();

  constructor(parent: Node, o: TreeNodeOpts) {
    const size = o.size ?? 90;
    const color = o.color ?? C.cat[2];
    super(o.x, o.y, size, size, color);
    const hs = hiddenState(o.x, o.y);
    parent.add(
      <Node ref={this.root} position={hs.position} opacity={hs.opacity} scale={hs.scale}>
        <Rect ref={this.box} width={size} height={size} {...boxProps(color)} radius={size / 2} />
        <Txt ref={this.val} text={String(o.value)} fontFamily={FONT} fontWeight={700} fontSize={fs(32)} fill={textOn()} />
      </Node>,
    );
  }

  *setValue(v: string | number, d = 0.3) {
    yield* this.val().text(String(v), t(d));
  }
}

/** Edge between two nodes (line from rim to rim). Pass `directed` for graph edges. */
export function link(parent: Node, a: TreeNode, b: TreeNode, directed = false) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const ra = a.w / 2, rb = b.w / 2;
  return new Arrow(parent, [[a.x + ux * ra, a.y + uy * ra], [b.x - ux * rb, b.y - uy * rb]], {plain: !directed});
}
