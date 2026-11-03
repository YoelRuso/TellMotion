import {Node, Rect, Txt} from '@motion-canvas/2d';
import {all} from '@motion-canvas/core';
import {C, FONT, fs, S, t} from '../config';
import {Piece, boxProps, hiddenState, textOn} from './Piece';

export interface BoxOpts {
  x: number;
  y: number;
  label: string;
  /** Category color, normally one of C.cat[0..4]. */
  color: string;
  w?: number;
  h?: number;
  /** Pill shape. */
  pill?: boolean;
  fs?: number;
  weight?: number;
}

/** The generic building block: a labelled box. Use C.cat[n] colors to group element types. */
export class Box extends Piece {
  public txt = this.label;

  constructor(parent: Node, o: BoxOpts) {
    const w = o.w ?? 260;
    const h = o.h ?? 90;
    super(o.x, o.y, w, h, o.color);
    const props = boxProps(o.color);
    const hs = hiddenState(o.x, o.y);
    parent.add(
      <Node ref={this.root} position={hs.position} opacity={hs.opacity} scale={hs.scale}>
        <Rect ref={this.box} width={w} height={h} {...props} radius={o.pill ? h / 2 : props.radius} />
        {S.doubleBorder ? (
          <Rect width={w - 14} height={h - 14} radius={Math.max(props.radius - 3, 0)} stroke={props.stroke} lineWidth={1} opacity={0.4} />
        ) : null}
        <Txt ref={this.label} text={o.label} fontFamily={FONT} fontWeight={o.weight ?? 700} fontSize={fs(o.fs ?? 28)} fill={textOn()} textAlign={'center'} {...this.wrapped(o.label)} />
      </Node>,
    );
  }

  /** Change the text and the border color (e.g. a status). */
  *setState(text: string, color: string, d = 0.4) {
    this.txt().text(text);
    yield* all(this.box().stroke(color, t(d)));
  }
}
