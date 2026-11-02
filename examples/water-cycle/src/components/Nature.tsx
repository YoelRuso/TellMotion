import {Circle, Line, Node, Rect} from '@motion-canvas/2d';
import {all, createRef, createSignal, linear, makeRef} from '@motion-canvas/core';
import {C, P, t} from '../config';

/** Node for the landscape: above the background, below the title and the captions. */
export function landscape(root: Node) {
  const layer = new Node({});
  root.add(layer);
  layer.moveToBottom();
  layer.moveUp();
  return layer;
}

const wavePoints = (top: number, phase: number, amp: number, length: number): P[] => [
  [-960, 540],
  ...Array.from({length: 49}, (_, i): P => {
    const x = -960 + i * 40;
    return [x, top + Math.sin(x / length + phase) * amp];
  }),
  [960, 540],
];

/** The sea at the bottom of the frame: two layers of waves moving at different speeds. */
export class Sea {
  public root = createRef<Node>();
  private phase = createSignal(0);

  constructor(parent: Node, top = 190) {
    parent.add(
      <Node ref={this.root}>
        <Line closed fill={C.cat[0]} opacity={0.18} points={() => wavePoints(top - 16, this.phase() * 0.7, 18, 130)} />
        <Line closed fill={C.cat[0]} opacity={0.28} points={() => wavePoints(top, -this.phase(), 14, 90)} />
      </Node>,
    );
  }

  /** Start with `yield sea.flow(seconds)`, so that it runs behind the rest of the scene. */
  *flow(seconds: number) {
    yield* this.phase(this.phase() + seconds * 0.8, seconds, linear);
  }
}

export class Sun {
  public root = createRef<Node>();
  private spin = createRef<Node>();

  constructor(parent: Node, x = 640, y = -280) {
    parent.add(
      <Node ref={this.root} position={[x, y]}>
        <Node ref={this.spin}>
          {Array.from({length: 12}, (_, i) => (
            <Rect width={14} height={44} radius={7} fill={C.cat[1]} rotation={i * 30} position={[Math.sin((i * Math.PI) / 6) * 125, -Math.cos((i * Math.PI) / 6) * 125]} />
          ))}
        </Node>
        <Circle size={170} fill={C.cat[1]} shadowColor={C.cat[1]} shadowBlur={60} />
      </Node>,
    );
  }

  *turn(seconds: number) {
    yield* this.spin().rotation(seconds * 8, seconds, linear);
  }
}

const PUFFS: [number, number, number][] = [
  [-170, 30, 150],
  [-80, -30, 200],
  [40, -50, 240],
  [150, -10, 190],
  [230, 40, 130],
  [20, 40, 220],
];

export class Cloud {
  public root = createRef<Node>();
  public puffs: Circle[] = [];

  constructor(parent: Node, x: number, y: number) {
    parent.add(
      <Node ref={this.root} position={[x, y]}>
        {PUFFS.map(([px, py, size], i) => (
          <Circle ref={makeRef(this.puffs, i)} position={[px, py]} size={size} fill={C.text} />
        ))}
      </Node>,
    );
  }

  *setColor(color: string, d = 0.8) {
    yield* all(...this.puffs.map(p => p.fill(color, t(d))));
  }
}

/** A hill on the left, where the rain lands and the river starts. */
export function hill(parent: Node) {
  parent.add(<Line closed fill={C.cat[2]} opacity={0.38} points={[[-960, 540], [-960, 60], [-760, -20], [-560, 70], [-300, 190], [-60, 250], [120, 540]]} />);
}

/** Falling drops, driven by one signal so that they loop for as long as needed. */
export class Rain {
  public root = createRef<Node>();
  private fall = createSignal(0);

  constructor(parent: Node, x: number, top: number, width: number, range: number) {
    let seed = 13;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    parent.add(
      <Node ref={this.root} opacity={0}>
        {Array.from({length: 70}, () => {
          const offset = rnd() * range;
          const speed = 0.8 + rnd() * 0.4;
          return <Rect width={7} height={30} radius={4} fill={C.cat[0]} x={x + (rnd() - 0.5) * width} y={() => top + (offset + this.fall() * speed) % range} />;
        })}
      </Node>,
    );
  }

  *pour(seconds: number) {
    yield* this.fall(this.fall() + seconds * 520, seconds, linear);
  }
}
