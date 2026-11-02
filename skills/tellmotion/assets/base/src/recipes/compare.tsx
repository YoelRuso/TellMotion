import {Circle, Node, Txt, View2D} from '@motion-canvas/2d';
import {all, createRef, waitFor} from '@motion-canvas/core';
import {captionFill, prepareScene} from '../components/Scene';
import {C, FONT, fs, t} from '../config';
import {FADED, Panel, holdUntil, panelHeight} from './shared';

export interface CompareSide {
  label: string;
  points: string[];
}

export interface CompareProps {
  title: string;
  left: CompareSide;
  right: CompareSide;
  /** First caption during the comparison, second one at the end. */
  captions?: string[];
  /** Side to highlight at the end. */
  winner?: 'left' | 'right';
  /** Least seconds on screen at the end. */
  hold?: number;
  /** Total length of the scene; the final pause grows to reach it. */
  seconds?: number;
}

/** A vs B: two panels whose points appear in turns, and optionally a winner. */
export function* compare(view: View2D, p: CompareProps) {
  const {root, sub, enter, leave} = prepareScene(view, p.title, {legend: false});
  const h = panelHeight(830, [p.left.points, p.right.points], 720);
  const left = new Panel(root, {x: -470, y: -30, w: 830, h, color: C.cat[0], ...p.left});
  const right = new Panel(root, {x: 470, y: -30, w: 830, h, color: C.cat[1], ...p.right});
  const vs = createRef<Node>();
  root.add(
    <Node ref={vs} y={-30} opacity={0}>
      <Circle size={100} fill={captionFill} stroke={C.line} lineWidth={4} />
      <Txt text={'VS'} fontFamily={FONT} fontWeight={700} fontSize={fs(32)} fill={C.text} />
    </Node>,
  );

  yield* enter();
  if (p.captions?.[0]) yield* sub.say(p.captions[0]);
  yield* all(left.appear(), right.appear());
  yield* vs().opacity(1, t(0.3));
  for (let i = 0; i < Math.max(p.left.points.length, p.right.points.length); i++) {
    yield* left.showPoint(i);
    yield* right.showPoint(i);
    yield* waitFor(t(0.5));
  }
  if (p.captions?.[1]) yield* sub.say(p.captions[1]);
  if (p.winner) {
    const [on, off] = p.winner === 'left' ? [left, right] : [right, left];
    yield* all(on.glow(true), off.root().opacity(FADED, t(0.4)));
  }
  yield* holdUntil(p.seconds, p.hold ?? 2);
  yield* all(sub.hide(), leave());
}
