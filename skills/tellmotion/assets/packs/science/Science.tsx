import {Circle, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal, linear, makeRef, sequence, tween, easeInOutSine} from '@motion-canvas/core';
import {Box} from './Box';
import {Packet} from './Packet';
import {C, FONT, MOVE, P, fs, t} from '../config';

// ---------------------------------------------------------------- Cycle
export interface CycleOpts {
  x: number;
  y: number;
  /** Horizontal / vertical radius of the ring (ellipse suits widescreen). */
  rx?: number;
  ry?: number;
  steps: {label: string; color?: string}[];
  boxW?: number;
  boxH?: number;
}

/** Science pack · circular process (water cycle, life cycle, loops): nodes on an ellipse + an orbiting packet. */
export class Cycle {
  public root = createRef<Node>();
  public ring = createRef<Circle>();
  public nodes: Box[] = [];
  private rx: number;
  private ry: number;
  private packet?: Packet;

  constructor(parent: Node, o: CycleOpts) {
    this.rx = o.rx ?? 560;
    this.ry = o.ry ?? 290;
    parent.add(
      <Node ref={this.root} position={[o.x, o.y]}>
        <Circle ref={this.ring} size={[this.rx * 2, this.ry * 2]} stroke={C.line} lineWidth={3} lineDash={[14, 12]} opacity={0} />
      </Node>,
    );
    o.steps.forEach((s, i) => {
      const a = -Math.PI / 2 + (i / o.steps.length) * Math.PI * 2;
      this.nodes.push(new Box(this.root(), {x: Math.cos(a) * this.rx, y: Math.sin(a) * this.ry, label: s.label, color: s.color ?? C.cat[i % 5], w: o.boxW ?? 280, h: o.boxH ?? 90}));
    });
  }

  *show(stagger = 0.4) {
    yield* all(this.ring().opacity(0.6, t(0.6)), sequence(stagger, ...this.nodes.map(n => n.appear())));
  }

  /** Highlight step i (others return to normal). */
  *go(i: number, d = 0.3) {
    yield* all(...this.nodes.map((n, k) => n.glow(k === i, d)));
  }

  /** A packet runs once around the ring. */
  *orbit(d = 5, name = '') {
    if (!this.packet) this.packet = new Packet(this.root(), {name});
    const pk = this.packet;
    yield* pk.appear([0, -this.ry]);
    yield* tween(t(d), v => {
      const a = -Math.PI / 2 + easeInOutSine(v) * Math.PI * 2;
      pk.root().position([Math.cos(a) * this.rx, Math.sin(a) * this.ry]);
    });
    yield* pk.vanish();
  }
}

// ---------------------------------------------------------------- Layers
export interface LayersOpts {
  x: number;
  y: number;
  w?: number;
  layerH?: number;
  layers: {label: string; color?: string}[];
}

/** Science pack · stacked strata (atmosphere, soil, OSI layers, org charts): reveal top to bottom. */
export class Layers {
  public root = createRef<Node>();
  public rows: Node[] = [];

  constructor(parent: Node, o: LayersOpts) {
    const w = o.w ?? 1100, h = o.layerH ?? 110;
    const total = o.layers.length * h;
    parent.add(
      <Node ref={this.root} position={[o.x, o.y]}>
        {o.layers.map((l, i) => (
          <Node ref={makeRef(this.rows, i)} y={-total / 2 + h * (i + 0.5)} opacity={0}>
            <Rect width={w} height={h - 8} radius={8} fill={l.color ?? C.cat[i % 5]} opacity={0.85} />
            <Txt text={l.label} fontFamily={FONT} fontWeight={700} fontSize={fs(36)} fill={C.onAccent} />
          </Node>
        ))}
      </Node>,
    );
  }

  *reveal(stagger = 0.4) {
    yield* sequence(stagger, ...this.rows.map(r => r.opacity(1, t(0.5))));
  }

  *focus(i: number, d = 0.3) {
    yield* all(...this.rows.map((r, k) => r.opacity(k === i ? 1 : 0.3, t(d))));
  }
}

// ---------------------------------------------------------------- Wave
export interface WaveOpts {
  x: number;
  y: number;
  w?: number;
  amp?: number;
  wavelength?: number;
  color?: string;
}

/** Science pack · sine wave (sound, light, signals) that can travel. */
export class Wave {
  public root = createRef<Node>();
  public phase = createSignal(0);

  constructor(parent: Node, o: WaveOpts) {
    const w = o.w ?? 1400, amp = o.amp ?? 120, wl = o.wavelength ?? 360;
    parent.add(
      <Node ref={this.root} position={[o.x, o.y]} opacity={0}>
        <Line
          stroke={o.color ?? C.cat[0]}
          lineWidth={8}
          lineCap={'round'}
          lineJoin={'round'}
          points={() => Array.from({length: 121}, (_, i): P => [-w / 2 + (i / 120) * w, Math.sin(((i / 120) * w) / wl * Math.PI * 2 - this.phase()) * amp])}
        />
      </Node>,
    );
  }

  *appear(d = 0.5) {
    yield* this.root().opacity(1, t(d));
  }

  /** The wave travels to the right for `cycles` wavelengths. */
  *travel(d = 3, cycles = 2) {
    yield* this.phase(this.phase() + cycles * Math.PI * 2, t(d), linear);
  }
}

// ---------------------------------------------------------------- Particles
export interface ParticlesOpts {
  x: number;
  y: number;
  w?: number;
  h?: number;
  n?: number;
  color?: string;
  size?: number;
  seed?: number;
}

/** Science pack · cloud of dots (molecules, rain, electrons) with a gentle drift. */
export class Particles {
  public root = createRef<Node>();
  public dots: Circle[] = [];
  private rnd: () => number;

  constructor(parent: Node, o: ParticlesOpts) {
    const w = o.w ?? 600, h = o.h ?? 400, n = o.n ?? 40;
    let seed = o.seed ?? 7;
    this.rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    parent.add(
      <Node ref={this.root} position={[o.x, o.y]} opacity={0}>
        {Array.from({length: n}, (_, i) => (
          <Circle ref={makeRef(this.dots, i)} size={o.size ?? 18} fill={o.color ?? C.cat[0]} x={(this.rnd() - 0.5) * w} y={(this.rnd() - 0.5) * h} />
        ))}
      </Node>,
    );
  }

  *appear(d = 0.5) {
    yield* this.root().opacity(1, t(d));
  }

  /** Every dot moves by (dx, dy) with a little variation: rise, fall, spread. */
  *drift(dx: number, dy: number, d = 2) {
    yield* all(
      ...this.dots.map(dot => {
        const j = 0.6 + this.rnd() * 0.8;
        return dot.position([dot.x() + dx * j, dot.y() + dy * j], t(d), MOVE);
      }),
    );
  }
}

