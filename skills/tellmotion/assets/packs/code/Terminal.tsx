import {Circle, Node, Rect, Txt} from '@motion-canvas/2d';
import {createRef, waitFor} from '@motion-canvas/core';
import {C, MONO, S, fs, t} from '../config';

export interface TerminalOpts {
  x: number;
  y: number;
  w?: number;
  h?: number;
  title?: string;
}

/** Code pack · terminal window. `run(cmd, output)` types the command and prints the output lines. */
export class Terminal {
  public root = createRef<Node>();
  private lines = createRef<Node>();
  private next = 0;
  private lh = 46;

  constructor(parent: Node, private o: TerminalOpts) {
    const w = o.w ?? 1300, h = o.h ?? 560;
    parent.add(
      <Node ref={this.root} position={[o.x, o.y]} opacity={0}>
        <Rect width={w} height={h} radius={Math.min(S.radius, 20)} fill={C.bg} stroke={C.line} lineWidth={Math.max(S.stroke, 2)} />
        <Rect width={w} height={64} y={-h / 2 + 32} fill={C.surface} stroke={C.line} lineWidth={2} radius={[Math.min(S.radius, 20), Math.min(S.radius, 20), 0, 0]} />
        {[C.error, C.cat[1], C.ok].map((c, i) => <Circle size={20} fill={c} x={-w / 2 + 34 + i * 34} y={-h / 2 + 32} />)}
        <Txt text={o.title ?? 'terminal'} fontFamily={MONO} fontSize={fs(28)} fill={C.muted} y={-h / 2 + 32} />
        <Node ref={this.lines} position={[-w / 2 + 44, -h / 2 + 110]} />
      </Node>,
    );
  }

  *appear(d = 0.5) {
    yield* this.root().opacity(1, t(d));
  }

  /** Types `cmd` after a prompt and then shows each output line. */
  *run(cmd: string, output: string[] = [], typing = 1.0) {
    const y = this.next * this.lh;
    const cmdTxt = createRef<Txt>();
    this.lines().add(
      <>
        <Txt text={'$'} fontFamily={MONO} fontWeight={700} fontSize={fs(32)} fill={C.cat[2]} offset={[-1, -1]} y={y} />
        <Txt ref={cmdTxt} text={''} fontFamily={MONO} fontSize={fs(32)} fill={C.text} offset={[-1, -1]} x={fs(32) * 0.62 * 2} y={y} />
      </>,
    );
    this.next++;
    yield* cmdTxt().text(cmd, t(typing));
    for (const line of output) {
      const ln = createRef<Txt>();
      this.lines().add(<Txt ref={ln} text={line} fontFamily={MONO} fontSize={fs(32)} fill={C.muted} offset={[-1, -1]} y={this.next * this.lh} opacity={0} />);
      this.next++;
      yield* ln().opacity(1, t(0.25));
    }
    yield* waitFor(t(0.2));
  }
}
