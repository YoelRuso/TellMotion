import {Node} from '@motion-canvas/2d';
import {all, createRef, waitFor} from '@motion-canvas/core';
import {Arrow} from './Arrow';
import {C, t} from '../config';
import {Group} from './Piece';
import {TreeNode, link} from './TreeNode';

export interface TreeData {
  value: string | number;
  /** Use `null` for a missing child, so that a lone right child stays on the right (binary trees). */
  children?: (TreeData | null)[];
  color?: string;
}

export interface TreeOpts {
  /** Center of the tree horizontally; top of it vertically (center of the root node). */
  x: number;
  y: number;
  data: TreeData;
  /** Horizontal distance between neighbouring leaves. */
  gap?: number;
  /** Vertical distance between levels. */
  levelH?: number;
  /** Size of the nodes. */
  size?: number;
}

/** Algorithms pack · tree laid out from its data: leaves side by side, each parent centered over its children. */
export class Tree extends Group {
  /** Every node, parents before their children. */
  public nodes: TreeNode[] = [];
  public edges: Arrow[] = [];
  private levels: number[] = [];
  /** For each edge, the level of the node it leads to. */
  private edgeLevels: number[] = [];
  private edgeLayer = createRef<Node>();

  constructor(parent: Node, o: TreeOpts) {
    super();
    const gap = o.gap ?? 150, levelH = o.levelH ?? 150, size = o.size ?? 90;
    parent.add(
      <Node ref={this.root} position={[o.x, o.y]}>
        <Node ref={this.edgeLayer} />
      </Node>,
    );

    // First the x of each node, in leaf slots, then the nodes: the width of the tree is only known at the end.
    type Placed = {data: TreeData; x: number; level: number; children: Placed[]};
    let slots = 0;
    const place = (data: TreeData | null, level: number): {x: number; placed: Placed | null} => {
      if (!data) return {x: slots++, placed: null};
      const kids = (data.children ?? []).map(child => place(child, level + 1));
      const x = kids.length ? (kids[0].x + kids[kids.length - 1].x) / 2 : slots++;
      return {x, placed: {data, x, level, children: kids.flatMap(k => (k.placed ? [k.placed] : []))}};
    };
    const top = place(o.data, 0).placed!;
    const center = (slots - 1) / 2;
    const build = (p: Placed, from: TreeNode | null) => {
      const node = new TreeNode(this.root(), {x: (p.x - center) * gap, y: p.level * levelH, value: p.data.value, size, color: p.data.color});
      this.nodes.push(node);
      this.levels.push(p.level);
      if (from) {
        this.edges.push(link(this.edgeLayer(), from, node));
        this.edgeLevels.push(p.level);
      }
      p.children.forEach(child => build(child, node));
    };
    build(top, null);
  }

  /** The tree grows level by level. */
  *appear(d = 0.4) {
    yield* this.root().opacity(1, 0);
    for (let level = 0; level <= Math.max(...this.levels); level++) {
      yield* all(...this.nodes.filter((_, i) => this.levels[i] === level).map(n => n.appear(d)), ...this.edges.filter((_, i) => this.edgeLevels[i] === level).map(e => e.draw(d)));
    }
  }

  /** The first node with this value. */
  node(value: string | number) {
    return this.nodes.find(n => n.label().text() === String(value));
  }

  /** Mark nodes one after another, in the order of a traversal or a search. */
  *visit(values: (string | number)[], color = C.cat[1], d = 0.4) {
    for (const value of values) {
      const node = this.node(value);
      if (!node) continue;
      yield* node.mark(color, true, t(d * 0.5));
      yield* waitFor(t(d * 0.5));
    }
  }

  *clearMarks(d = 0.3) {
    yield* all(...this.nodes.map(n => n.unmark(d)));
  }
}
