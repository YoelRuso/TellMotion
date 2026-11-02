import {Circle, Layout, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, makeRef, sequence} from '@motion-canvas/core';
import {C, FONT, MOVE, fs, t} from '../config';
import {boxProps, textOn} from './Piece';

// ---------------------------------------------------------------- KineticTitle
export interface KineticTitleOpts {
  x: number;
  y: number;
  /** One string per line; words are revealed one by one. */
  lines: string[];
  size?: number;
  color?: string;
}

/** Typography pack · big title whose words pop in one after another. */
export class KineticTitle {
  public root = createRef<Node>();
  public words: Txt[] = [];

  constructor(parent: Node, o: KineticTitleOpts) {
    let k = 0;
    parent.add(
      <Layout ref={this.root as any} layout direction={'column'} alignItems={'center'} gap={16} position={[o.x, o.y]}>
        {o.lines.map(line => (
          <Layout layout direction={'row'} gap={fs((o.size ?? 110) * 0.3)}>
            {line.split(' ').map(word => (
              <Txt ref={makeRef(this.words, k++)} text={word} fontFamily={FONT} fontWeight={700} fontSize={fs(o.size ?? 110)} fill={o.color ?? C.text} opacity={0} scale={0.8} />
            ))}
          </Layout>
        ))}
      </Layout>,
    );
  }

  *reveal(stagger = 0.15) {
    yield* sequence(stagger, ...this.words.map(w => all(w.opacity(1, t(0.35)), w.scale(1, t(0.35), MOVE))));
  }

  /** Color one word (emphasis). */
  *emphasize(index: number, color = C.cat[1], d = 0.3) {
    yield* all(this.words[index].fill(color, t(d)), this.words[index].scale(1.12, t(d)));
  }
}

// ---------------------------------------------------------------- BulletList
export interface BulletListOpts {
  x: number;
  y: number;
  items: string[];
  size?: number;
  color?: string;
}

/** Typography pack · list whose items appear one by one; `focus(i)` dims the others. */
export class BulletList {
  public root = createRef<Node>();
  public rows: Node[] = [];

  constructor(parent: Node, o: BulletListOpts) {
    parent.add(
      <Layout ref={this.root as any} layout direction={'column'} alignItems={'start'} gap={36} position={[o.x, o.y]}>
        {o.items.map((it, i) => (
          <Layout ref={makeRef(this.rows, i)} layout direction={'row'} alignItems={'center'} gap={28} opacity={0}>
            <Circle size={24} fill={o.color ?? C.cat[i % 5]} />
            <Txt text={it} fontFamily={FONT} fontSize={fs(o.size ?? 44)} fill={C.text} />
          </Layout>
        ))}
      </Layout>,
    );
  }

  *show(i: number, d = 0.45) {
    yield* this.rows[i].opacity(1, t(d));
  }

  *showAll(stagger = 0.6) {
    yield* sequence(stagger, ...this.rows.map((_, i) => this.show(i)));
  }

  *focus(i: number, d = 0.3) {
    yield* all(...this.rows.map((r, k) => r.opacity(k === i ? 1 : 0.3, t(d))));
  }

  *clearFocus(d = 0.3) {
    yield* all(...this.rows.map(r => r.opacity(1, t(d))));
  }
}

// ---------------------------------------------------------------- Quote
export interface QuoteOpts {
  x: number;
  y: number;
  text: string;
  author?: string;
  w?: number;
  size?: number;
}

/** Typography pack · pull quote with a big quotation mark. */
export class Quote {
  public root = createRef<Node>();

  constructor(parent: Node, o: QuoteOpts) {
    const w = o.w ?? 1300;
    parent.add(
      <Node ref={this.root} position={[o.x, o.y]} opacity={0}>
        <Txt text={'“'} fontFamily={FONT} fontWeight={700} fontSize={fs(300)} fill={C.cat[1]} x={-w / 2 - 20} y={-90} />
        <Txt text={o.text} fontFamily={FONT} fontSize={fs(o.size ?? 56)} fill={C.text} textWrap width={w} textAlign={'left'} />
        {o.author ? <Txt text={'— ' + o.author} fontFamily={FONT} fontSize={fs(32)} fill={C.muted} x={w / 2 - 200} y={190} /> : null}
      </Node>,
    );
  }

  *reveal(d = 0.8) {
    yield* this.root().opacity(1, t(d));
  }
}

// ---------------------------------------------------------------- Compare
export interface CompareSide {
  title: string;
  items: string[];
  color?: string;
}

export interface CompareOpts {
  x: number;
  y: number;
  w?: number;
  h?: number;
  left: CompareSide;
  right: CompareSide;
}

/** Typography pack · A vs B comparison with two panels and a "VS" badge. */
export class Compare {
  public root = createRef<Node>();
  public left = createRef<Node>();
  public right = createRef<Node>();
  public vs = createRef<Node>();

  constructor(parent: Node, o: CompareOpts) {
    const w = o.w ?? 1500, h = o.h ?? 560;
    const pw = (w - 120) / 2;
    const panel = (side: CompareSide, ref: ReturnType<typeof createRef<Node>>, x: number, fallback: string) => {
      const color = side.color ?? fallback;
      return (
        <Node ref={ref} position={[x, 0]} opacity={0}>
          <Rect width={pw} height={h} {...boxProps(color)} />
          <Txt text={side.title} fontFamily={FONT} fontWeight={700} fontSize={fs(44)} fill={S_text(color)} y={-h / 2 + 70} />
          <Txt text={side.items.map(i => '• ' + i).join('\n')} fontFamily={FONT} fontSize={fs(36)} fill={S_text(color)} lineHeight={fs(36) * 1.6} textAlign={'left'} y={30} x={0} />
        </Node>
      );
    };
    parent.add(
      <Node ref={this.root} position={[o.x, o.y]}>
        {panel(o.left, this.left, -w / 4 - 30, C.cat[0])}
        {panel(o.right, this.right, w / 4 + 30, C.cat[1])}
        <Node ref={this.vs} opacity={0}>
          <Circle size={96} fill={C.surface} stroke={C.line} lineWidth={4} />
          <Txt text={'VS'} fontFamily={FONT} fontWeight={700} fontSize={fs(36)} fill={C.text} />
        </Node>
      </Node>,
    );
  }

  *showLeft(d = 0.6) {
    yield* this.left().opacity(1, t(d));
  }

  *showRight(d = 0.6) {
    yield* this.right().opacity(1, t(d));
  }

  *showVs(d = 0.4) {
    yield* this.vs().opacity(1, t(d));
  }

  /** Emphasize one side. */
  *emphasize(side: 'left' | 'right', d = 0.4) {
    const on = side === 'left' ? this.left() : this.right();
    const off = side === 'left' ? this.right() : this.left();
    yield* all(on.scale(1.04, t(d)), off.opacity(0.35, t(d)));
  }
}

function S_text(color: string) {
  // text color readable on a box of this theme (accent-filled themes use onAccent)
  return boxProps(color).fill === color ? C.onAccent : textOn();
}
