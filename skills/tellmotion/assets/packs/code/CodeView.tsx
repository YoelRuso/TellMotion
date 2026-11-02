import {Code, LezerHighlighter, Node, Rect, lines} from '@motion-canvas/2d';
import {HighlightStyle} from '@codemirror/language';
import {tags as T} from '@lezer/highlight';
import {parser as jsParser} from '@lezer/javascript';
import {parser as pyParser} from '@lezer/python';
import {DEFAULT, createRef} from '@motion-canvas/core';
import {C, MONO, S, fs, t} from '../config';
import {boxProps} from './Piece';

/** Syntax colors taken from the active theme. */
const style = HighlightStyle.define([
  {tag: T.keyword, color: C.cat[1]},
  {tag: [T.string, T.regexp], color: C.cat[2]},
  {tag: [T.number, T.bool, T.null], color: C.cat[4]},
  {tag: T.comment, color: C.muted},
  {tag: [T.function(T.variableName), T.function(T.propertyName)], color: C.cat[0]},
  {tag: [T.className, T.typeName], color: C.cat[3]},
  {tag: T.operator, color: C.line},
  {tag: [T.punctuation, T.bracket], color: C.muted},
]);

export interface CodeViewOpts {
  x: number;
  y: number;
  w?: number;
  h?: number;
  code: string;
  language?: 'js' | 'python';
  /** Font size (default 32). Keep >= 28 for legibility. */
  size?: number;
}

/**
 * Code pack · code panel with themed syntax highlighting.
 * `focus(from, to)` highlights lines (0-based, like `lines()` of Motion Canvas), `change()` animates edits.
 */
export class CodeView {
  public root = createRef<Node>();
  public code = createRef<Code>();

  constructor(parent: Node, o: CodeViewOpts) {
    const w = o.w ?? 1300, h = o.h ?? 560;
    const highlighter = new LezerHighlighter(o.language === 'python' ? pyParser : jsParser, style);
    const bp = boxProps(C.cat[0]);
    parent.add(
      <Node ref={this.root} position={[o.x, o.y]} opacity={0}>
        <Rect width={w} height={h} {...bp} lineDash={[]} radius={Math.min(S.radius, 24)} fill={S.fill === 'accent' || S.fill === 'glass' || S.fill === 'none' ? C.bg : C.surface} />
        <Code ref={this.code} code={o.code} highlighter={highlighter} fontFamily={MONO} fontSize={fs(o.size ?? 32)} fill={C.text} offset={[-1, -1]} position={[-w / 2 + 44, -h / 2 + 40]} />
      </Node>,
    );
  }

  *appear(d = 0.5) {
    yield* this.root().opacity(1, t(d));
  }

  /** Highlight lines `from`..`to` (0-based, inclusive); the rest is dimmed. */
  *focus(from: number, to = from, d = 0.5) {
    yield* this.code().selection(lines(from, to), t(d));
  }

  *unfocus(d = 0.5) {
    yield* this.code().selection(DEFAULT, t(d));
  }

  /** Replace the code with an animated diff. */
  *change(newCode: string, d = 1) {
    yield* this.code().code(newCode, t(d));
  }
}

