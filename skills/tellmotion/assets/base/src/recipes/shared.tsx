import {Circle, Layout, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, makeRef, sequence} from '@motion-canvas/core';
import {Piece, boxProps, hiddenState, textOn} from '../components/Piece';
import {C, FONT, MOVE, S, fs, t} from '../config';

/** Width of a character relative to the font size: exact for monospace, conservative for the rest. */
const CHAR = 0.6;
const LINE = 1.3;

export function wrapWords(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

const charsIn = (width: number, size: number) => Math.floor(width / (CHAR * fs(size)));

/** The biggest size at which the text fits in `maxLines` lines; if none does, the smallest one. */
export function fitText(text: string, width: number, maxLines: number, sizes: number[]) {
  for (const size of sizes) {
    const lines = wrapWords(text, charsIn(width, size));
    if (lines.length <= maxLines) return {size, lines};
  }
  const size = sizes[sizes.length - 1];
  return {size, lines: wrapWords(text, charsIn(width, size))};
}

/** The biggest size at which all the items, wrapped, fit in the given height. */
export function fitList(items: string[], width: number, height: number, gap: number, sizes: number[]) {
  for (const size of sizes) {
    const lines = items.reduce((a, i) => a + wrapWords(i, charsIn(width, size)).length, 0);
    if (lines * fs(size) * LINE + gap * (items.length - 1) <= height) return size;
  }
  return sizes[sizes.length - 1];
}

/** Color of details (bars, bullets) drawn on a box of this theme. */
export const accentOn = (color: string) => (S.fill === 'accent' ? C.onAccent : color);

/** Color of text drawn directly on the background: the palette of accent-filled themes is made for boxes and lacks contrast there. */
export const accentText = (color: string) => (S.fill === 'accent' ? C.text : color);

/** Big text revealed word by word. Put the returned node in a column Layout. */
export function headline(text: string, width: number, maxLines: number, sizes: number[], words: Txt[], align: 'center' | 'start' = 'center') {
  const {size, lines} = fitText(text, width, maxLines, sizes);
  let k = words.length;
  return (
    <Layout layout direction={'column'} alignItems={align} gap={fs(size) * 0.15}>
      {lines.map(line => (
        <Layout layout direction={'row'} gap={fs(size) * 0.3}>
          {line.split(' ').map(word => (
            <Txt ref={makeRef(words, k++)} text={word} fontFamily={FONT} fontWeight={700} fontSize={fs(size)} fill={C.text} opacity={0} scale={0.85} />
          ))}
        </Layout>
      ))}
    </Layout>
  );
}

export function* revealWords(words: Txt[], stagger = 0.12) {
  yield* sequence(t(stagger), ...words.map(w => all(w.opacity(1, t(0.35)), w.scale(1, t(0.35), MOVE))));
}

/** Wrapped paragraph with its own box, so that a Layout can stack it safely. */
export function paragraph(ref: ReturnType<typeof createRef<Txt>>, text: string, width: number, maxLines: number, sizes: number[], color = C.muted, align: 'center' | 'left' = 'center') {
  const {size} = fitText(text, width, maxLines, sizes);
  return <Txt ref={ref} text={text} width={width} textWrap textAlign={align} fontFamily={FONT} fontSize={fs(size)} lineHeight={fs(size) * LINE} fill={color} opacity={0} />;
}

/** Opacity of a panel that gives way to another one: faded, but its text stays readable. */
export const FADED = 0.6;

/** Height for panels shown side by side: as tall as the longest list needs at full size, so short lists do not float in an empty box. */
export function panelHeight(w: number, lists: string[][], max: number) {
  const size = 44;
  const lines = Math.max(...lists.map(points => points.reduce((a, p) => a + wrapWords(p, charsIn(w - 140, size)).length, 0) + (points.length - 1) * 0.5));
  return Math.min(Math.max(Math.round(lines * fs(size) * LINE) + 240, 380), max);
}

export interface PanelOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  label: string;
  points: string[];
}

/** Box with a heading and a list whose points appear one by one. */
export class Panel extends Piece {
  public rows: Layout[] = [];

  constructor(parent: Node, o: PanelOpts) {
    super(o.x, o.y, o.w, o.h, o.color);
    const pad = 48;
    const inner = o.w - pad * 2;
    const label = fitText(o.label, inner, 1, [52, 46, 40, 36]);
    const textWidth = inner - 44;
    const room = o.h - pad * 2 - fs(label.size) * LINE - 56;
    const size = fitList(o.points, textWidth, room, 26, [44, 40, 36, 32, 28]);
    // Fonts with a big theme scale may not fit even at the smallest size: tighten the spacing, never the text
    const lines = o.points.reduce((a, p) => a + wrapWords(p, charsIn(textWidth, size)).length, 0);
    const tight = lines * fs(size) * LINE + 26 * (o.points.length - 1) > room;
    const gap = tight ? 12 : 26;
    const line = fs(size) * (tight ? 1.15 : LINE);
    const hs = hiddenState(o.x, o.y);
    parent.add(
      <Node ref={this.root} position={hs.position} opacity={hs.opacity} scale={hs.scale}>
        <Rect ref={this.box} width={o.w} height={o.h} {...boxProps(o.color)} />
        <Layout layout direction={'column'} alignItems={'start'} width={inner} height={o.h - pad * 2} gap={gap}>
          <Txt text={o.label} fontFamily={FONT} fontWeight={700} fontSize={fs(label.size)} fill={textOn()} />
          <Rect width={120} height={6} radius={3} fill={accentOn(o.color)} marginBottom={14} />
          {o.points.map((point, i) => (
            <Layout ref={makeRef(this.rows, i)} layout direction={'row'} alignItems={'start'} gap={24} opacity={0}>
              <Circle size={20} marginTop={(line - 20) / 2} fill={accentOn(o.color)} />
              <Txt text={point} width={textWidth} textWrap fontFamily={FONT} fontSize={fs(size)} lineHeight={line} fill={textOn()} />
            </Layout>
          ))}
        </Layout>
      </Node>,
    );
  }

  *showPoint(i: number, d = 0.4) {
    if (this.rows[i]) yield* this.rows[i].opacity(1, t(d));
  }
}
