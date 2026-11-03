import {Circle, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, chain, createRef, easeOutBack} from '@motion-canvas/core';
import {C, FONT, MOVE, P, S, fs, t} from '../config';
import {Group, Piece, boxProps, hiddenState, textOn} from './Piece';
import {captionFill} from './Scene';

// ---------------------------------------------------------------- Browser
export interface BrowserOpts {
  x: number;
  y: number;
  w?: number;
  h?: number;
  url?: string;
}

const BAR = 76;

/** UI pack · browser window. Add pieces to `content()`: their positions are relative to the center of the page, and they are cut at its edges. */
export class Browser extends Group {
  public content = createRef<Node>();
  private url = createRef<Txt>();

  constructor(parent: Node, o: BrowserOpts) {
    super();
    const w = o.w ?? 1300, h = o.h ?? 720;
    const r = Math.min(S.radius, 20);
    parent.add(
      <Node ref={this.root} position={[o.x, o.y]} opacity={0}>
        <Rect width={w} height={h} radius={r} fill={C.bg} stroke={C.line} lineWidth={Math.max(S.stroke, 2)} />
        <Rect clip width={w} height={h - BAR} y={BAR / 2} radius={[0, 0, r, r]}>
          <Node ref={this.content} />
        </Rect>
        <Rect width={w} height={BAR} y={-h / 2 + BAR / 2} fill={captionFill} stroke={C.line} lineWidth={2} radius={[r, r, 0, 0]} />
        {[C.error, C.cat[1], C.ok].map((c, i) => <Circle size={20} fill={c} x={-w / 2 + 34 + i * 34} y={-h / 2 + BAR / 2} />)}
        <Rect width={w * 0.6} height={46} radius={23} y={-h / 2 + BAR / 2} fill={C.bg} stroke={C.line} lineWidth={2} />
        <Txt ref={this.url} text={o.url ?? ''} fontFamily={FONT} fontSize={fs(28)} fill={C.muted} y={-h / 2 + BAR / 2} />
      </Node>,
    );
  }

  /** The address changes, typed. */
  *navigate(url: string, d = 0.6) {
    this.url().text('');
    yield* this.url().text(url, t(d));
  }
}

// ---------------------------------------------------------------- Phone
export interface PhoneOpts {
  x: number;
  y: number;
  w?: number;
  h?: number;
}

/** UI pack · phone. Add pieces to `content()`: their positions are relative to the center of the screen, and they are cut at its edges. */
export class Phone extends Group {
  public content = createRef<Node>();

  constructor(parent: Node, o: PhoneOpts) {
    super();
    const w = o.w ?? 400, h = o.h ?? 780;
    parent.add(
      <Node ref={this.root} position={[o.x, o.y]} opacity={0}>
        <Rect width={w} height={h} radius={56} fill={C.bg} stroke={C.line} lineWidth={Math.max(S.stroke, 6)} />
        <Rect clip width={w - 24} height={h - 24} radius={46}>
          <Node ref={this.content} />
        </Rect>
        <Rect width={120} height={30} radius={15} y={-h / 2 + 34} fill={C.line} />
      </Node>,
    );
  }
}

// ---------------------------------------------------------------- Button
export interface ButtonOpts {
  x: number;
  y: number;
  label: string;
  w?: number;
  h?: number;
  color?: string;
}

/** UI pack · button that can be pressed. */
export class Button extends Piece {
  constructor(parent: Node, o: ButtonOpts) {
    const w = o.w ?? 280;
    const h = o.h ?? 84;
    const color = o.color ?? C.cat[1];
    super(o.x, o.y, w, h, color);
    const hs = hiddenState(o.x, o.y);
    parent.add(
      <Node ref={this.root} position={hs.position} opacity={hs.opacity} scale={hs.scale}>
        <Rect ref={this.box} width={w} height={h} {...boxProps(color)} fill={color} radius={Math.min(S.radius + 6, h / 2)} />
        <Txt ref={this.label} text={o.label} fontFamily={FONT} fontWeight={700} fontSize={fs(32)} fill={C.onAccent} textAlign={'center'} {...this.wrapped(o.label)} />
      </Node>,
    );
  }

  *press(d = 0.3) {
    yield* this.root().scale(0.93, t(d * 0.4));
    yield* this.root().scale(1, t(d * 0.6));
  }
}

// ---------------------------------------------------------------- TextField
export interface TextFieldOpts {
  x: number;
  y: number;
  /** Shown while it is empty. */
  placeholder?: string;
  w?: number;
  h?: number;
  color?: string;
}

/** UI pack · text input that the viewer sees being typed into. */
export class TextField extends Piece {
  private hint = createRef<Txt>();
  private caret = createRef<Rect>();

  constructor(parent: Node, o: TextFieldOpts) {
    const w = o.w ?? 520;
    const h = o.h ?? 84;
    const color = o.color ?? C.cat[0];
    super(o.x, o.y, w, h, color);
    const hs = hiddenState(o.x, o.y);
    const left = -w / 2 + 28;
    parent.add(
      <Node ref={this.root} position={hs.position} opacity={hs.opacity} scale={hs.scale}>
        <Rect ref={this.box} width={w} height={h} {...boxProps(color)} />
        <Txt ref={this.hint} text={o.placeholder ?? ''} fontFamily={FONT} fontSize={fs(32)} fill={textOn()} opacity={0.55} offset={[-1, 0]} x={left} />
        <Txt ref={this.label} text={''} fontFamily={FONT} fontSize={fs(32)} fill={textOn()} offset={[-1, 0]} x={left} />
        <Rect ref={this.caret} width={3} height={fs(32) + 6} fill={textOn()} opacity={0} x={() => left + this.label().width() + 4} />
      </Node>,
    );
  }

  /** The field takes the focus and the text is typed. */
  *type(text: string, d = 1) {
    yield* all(this.hint().opacity(0, t(0.15)), this.caret().opacity(1, t(0.15)), this.box().stroke(this.color, t(0.15)));
    yield* this.label().text(text, t(d));
    yield* this.caret().opacity(0, t(0.2));
  }
}

// ---------------------------------------------------------------- Cursor
export interface CursorOpts {
  x: number;
  y: number;
  color?: string;
}

type Pressable = Group & {press?: () => Generator<any, void, any>};

/** UI pack · mouse pointer. It moves to a point of its parent or to any element, also one inside a `Browser` or a `Phone`. */
export class Cursor extends Group {
  private ripple = createRef<Circle>();

  constructor(parent: Node, o: CursorOpts) {
    super();
    const color = o.color ?? C.text;
    parent.add(
      <Node ref={this.root} position={[o.x, o.y]} opacity={0}>
        <Circle ref={this.ripple} size={20} stroke={color} lineWidth={4} opacity={0} />
        <Line points={[[0, 0], [0, 44], [11, 34], [19, 52], [29, 48], [21, 30], [34, 30]]} closed fill={color} stroke={C.bg} lineWidth={3} lineJoin={'round'} />
      </Node>,
    );
  }

  private targetOf(target: P | Group): P {
    if (Array.isArray(target)) return target;
    const {x, y} = target.root().absolutePosition().transformAsPoint(this.root().parent()!.worldToLocal());
    return [x, y];
  }

  *moveTo(target: P | Group, d = 0.7) {
    yield* this.root().position(this.targetOf(target), t(d), MOVE);
  }

  *click(d = 0.4) {
    this.ripple().size(20);
    this.ripple().opacity(0.8);
    yield* all(this.ripple().size(90, t(d)), this.ripple().opacity(0, t(d)), chain(this.root().scale(0.85, t(d * 0.3)), this.root().scale(1, t(d * 0.7))));
  }

  /** Move to an element and click it; a button is pressed at the same time. */
  *clickOn(target: Pressable, d = 0.7) {
    yield* this.moveTo(target, d);
    yield* all(this.click(), target.press ? target.press() : target.ping());
  }
}

// ---------------------------------------------------------------- Toast
export interface ToastOpts {
  x: number;
  y: number;
  text: string;
  /** Color of the mark on its left. Default: `C.ok`. */
  color?: string;
  w?: number;
}

/** UI pack · short notification that slides in. */
export class Toast extends Group {
  private y: number;

  constructor(parent: Node, o: ToastOpts) {
    super();
    this.y = o.y;
    const w = o.w ?? 540, h = 90;
    const color = o.color ?? C.ok;
    parent.add(
      <Node ref={this.root} position={[o.x, o.y + 40]} opacity={0}>
        <Rect width={w} height={h} radius={Math.min(S.radius + 4, 24)} fill={captionFill} stroke={C.line} lineWidth={2} />
        <Circle size={26} fill={color} x={-w / 2 + 40} />
        <Txt text={o.text} fontFamily={FONT} fontSize={fs(30)} fill={C.text} offset={[-1, 0]} x={-w / 2 + 72} />
      </Node>,
    );
  }

  *appear(d = 0.4) {
    yield* all(this.root().opacity(1, t(d)), this.root().y(this.y, t(d), easeOutBack));
  }
}
