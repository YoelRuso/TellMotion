import {View2D} from '@motion-canvas/2d';
import {all, waitFor} from '@motion-canvas/core';
import {Arrow} from '../components/Arrow';
import {prepareScene} from '../components/Scene';
import {C, t} from '../config';
import {FADED, Panel, panelHeight} from './shared';

export interface BeforeAfterSide {
  /** Heading of the panel; "Before" / "After" by default. */
  label?: string;
  points: string[];
}

export interface BeforeAfterProps {
  title: string;
  before: BeforeAfterSide;
  after: BeforeAfterSide;
  /** First caption with "before", second one with "after". */
  captions?: string[];
  /** Extra seconds on screen at the end. */
  hold?: number;
}

/** A change told in order: the old state fills in, an arrow draws, the old state fades and the new one lights up. */
export function* beforeAfter(view: View2D, p: BeforeAfterProps) {
  const {root, sub, enter, leave} = prepareScene(view, p.title, {legend: false});
  const h = panelHeight(760, [p.before.points, p.after.points], 720);
  const before = new Panel(root, {x: -510, y: -30, w: 760, h, color: C.cat[0], label: p.before.label ?? 'Before', points: p.before.points});
  const after = new Panel(root, {x: 510, y: -30, w: 760, h, color: C.cat[2], label: p.after.label ?? 'After', points: p.after.points});
  const arrow = new Arrow(root, [[-100, -30], [100, -30]]);
  arrow.ref().lineWidth(8).arrowSize(24);

  yield* enter();
  if (p.captions?.[0]) yield* sub.say(p.captions[0]);
  yield* before.appear();
  for (let i = 0; i < p.before.points.length; i++) {
    yield* before.showPoint(i);
    yield* waitFor(t(0.4));
  }
  yield* waitFor(t(0.5));
  if (p.captions?.[1]) yield* sub.say(p.captions[1]);
  yield* arrow.draw(0.6);
  yield* all(after.appear(), before.root().opacity(FADED, t(0.5)));
  for (let i = 0; i < p.after.points.length; i++) {
    yield* after.showPoint(i);
    yield* waitFor(t(0.4));
  }
  yield* after.glow(true);
  yield* waitFor(t(p.hold ?? 2));
  yield* all(sub.hide(), leave());
}
