import {Line, makeScene2D} from '@motion-canvas/2d';
import {all, createRef, sequence, waitFor} from '@motion-canvas/core';
import {Pointer} from '../components/Pointer';
import {prepareScene} from '../components/Scene';
import {BASE_Y, COLOR, Sorter, barX, heightOf} from '../components/Sorter';
import {t} from '../config';
import {holdUntil} from '../recipes/shared';

// ---------- EDITABLE TEXT ----------
const TITLE = 'Step 1: pick a pivot';
const CAPTIONS = ['Here are seven numbers in no particular order.', 'Pick one as the pivot. We will use the last one: 6.'];
const VALUES = [3, 8, 2, 9, 1, 7, 6];
// -----------------------------------

export default makeScene2D(function* (view) {
  const {root, sub, enter, leave} = prepareScene(view, TITLE);
  const row = new Sorter(root, VALUES);
  const pivot = row.bars[6];
  const line = createRef<Line>();
  root.add(<Line ref={line} points={[[-780, heightOf(6)], [780, heightOf(6)]]} stroke={COLOR.pivot} lineWidth={4} lineDash={[14, 10]} end={0} />);
  const pointer = new Pointer(root, {x: barX(6), y: BASE_Y + 15, label: 'pivot', color: COLOR.pivot});

  yield* enter();
  yield* sub.say(CAPTIONS[0]);
  yield* sequence(t(0.15), ...row.bars.map(b => b.appear()));
  yield* waitFor(t(1.2));
  yield* sub.say(CAPTIONS[1]);
  yield* all(pivot.mark(COLOR.pivot), pointer.appear());
  yield* line().end(1, t(0.8));
  yield* holdUntil(11, 1);
  yield* all(sub.hide(), leave());
});
