import {Circle, Node, Rect, Txt} from '@motion-canvas/2d';
import {createRef, waitFor} from '@motion-canvas/core';
import {C, MONO, MOVE, S, fs, t} from '../config';
import {captionFill} from './Scene';

export interface TerminalOpts {
  x: number;
  y: number;
  w?: number;
  h?: number;
  title?: string;
}

const BAR = 64;
const PAD_TOP = 46;
const PAD_BOTTOM = 20;
const PAD_X = 44;

/** Split a line to fit `cols` characters, at a space when there is one. */
function wrap(text: string, cols: number) {
  const out: string[] = [];
  let rest = text;
  while (rest.length > cols) {
    const space = rest.lastIndexOf(' ', cols);
    const cut = space > 0 ? space : cols;
    out.push(rest.slice(0, cut));
    rest = rest.slice(cut).trimStart();
  }
  out.push(rest);
  return out;
}

/** Code pack · terminal window. `run(cmd, output)` types the command and prints the output lines; long lines wrap and old ones scroll away. */
export class Terminal {
  public root = createRef<Node>();
  private lines = createRef<Node>();
  private next = 0;
  private lh = 46;
  private charW = fs(32) * 0.62;
  private top: number;
  private rows: number;
  private cols: number;

  constructor(parent: Node, private o: TerminalOpts) {
    const w = o.w ?? 1300, h = o.h ?? 560;
    const bodyH = h - BAR;
    const r = Math.min(S.radius, 20);
    this.top = -bodyH / 2 + PAD_TOP;
    this.rows = Math.max(1, Math.floor((bodyH - PAD_TOP - PAD_BOTTOM) / this.lh));
    this.cols = Math.max(4, Math.floor((w - PAD_X * 2) / this.charW));
    parent.add(
      <Node ref={this.root} position={[o.x, o.y]} opacity={0}>
        <Rect width={w} height={h} radius={Math.min(S.radius, 20)} fill={C.bg} stroke={C.line} lineWidth={Math.max(S.stroke, 2)} />
        <Rect clip width={w} height={bodyH} y={BAR / 2} radius={[0, 0, r, r]}>
          <Node ref={this.lines} position={[-w / 2 + PAD_X, this.top]} />
        </Rect>
        <Rect width={w} height={BAR} y={-h / 2 + BAR / 2} fill={captionFill} stroke={C.line} lineWidth={2} radius={[r, r, 0, 0]} />
        {[C.error, C.cat[1], C.ok].map((c, i) => <Circle size={20} fill={c} x={-w / 2 + 34 + i * 34} y={-h / 2 + BAR / 2} />)}
        <Txt text={o.title ?? 'terminal'} fontFamily={MONO} fontSize={fs(28)} fill={C.muted} y={-h / 2 + BAR / 2} />
      </Node>,
    );
  }

  *appear(d = 0.5) {
    yield* this.root().opacity(1, t(d));
  }

  /** Take the next row, scrolling up if the window is full. */
  private *nextRow() {
    const y = this.next++ * this.lh;
    if (this.next > this.rows) yield* this.lines().y(this.top - (this.next - this.rows) * this.lh, t(0.2), MOVE);
    return y;
  }

  /** Types `cmd` after a prompt and then shows each output line. */
  *run(cmd: string, output: string[] = [], typing = 1.0) {
    const parts = wrap(cmd, this.cols - 2);
    for (let i = 0; i < parts.length; i++) {
      const y = yield* this.nextRow();
      const cmdTxt = createRef<Txt>();
      if (i === 0) this.lines().add(<Txt text={'$'} fontFamily={MONO} fontWeight={700} fontSize={fs(32)} fill={C.cat[2]} offset={[-1, -1]} y={y} />);
      this.lines().add(<Txt ref={cmdTxt} text={''} fontFamily={MONO} fontSize={fs(32)} fill={C.text} offset={[-1, -1]} x={this.charW * 2} y={y} />);
      yield* cmdTxt().text(parts[i], t((typing * parts[i].length) / (cmd.length || 1)));
    }
    for (const line of output.flatMap(l => wrap(l, this.cols))) {
      const y = yield* this.nextRow();
      const ln = createRef<Txt>();
      this.lines().add(<Txt ref={ln} text={line} fontFamily={MONO} fontSize={fs(32)} fill={C.muted} offset={[-1, -1]} y={y} opacity={0} />);
      yield* ln().opacity(1, t(0.25));
    }
    yield* waitFor(t(0.2));
  }
}
