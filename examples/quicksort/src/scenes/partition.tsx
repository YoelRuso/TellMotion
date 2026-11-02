import {Line, makeScene2D} from '@motion-canvas/2d';
import {all, createRef, waitFor} from '@motion-canvas/core';
import {Pointer} from '../components/Pointer';
import {prepareScene} from '../components/Scene';
import {BASE_Y, COLOR, Sorter, barX, heightOf} from '../components/Sorter';
import {C, t} from '../config';
import {holdUntil} from '../recipes/shared';

// ---------- EDITABLE TEXT ----------
const TITLE = 'Step 2: partition';
const CAPTIONS = [
  'Compare each bar with the pivot, from left to right.',
  'Smaller than the pivot? Swap it to the left side.',
  'Bigger? Leave it where it is and keep walking.',
  'Finally the pivot moves between both groups. It is now in its final place.',
];
const VALUES = [3, 8, 2, 9, 1, 7, 6];
// -----------------------------------

export default makeScene2D(function* (view) {
  const {root, sub, enter, leave} = prepareScene(view, TITLE);
  const row = new Sorter(root, VALUES, VALUES.map((_, i) => (i === 6 ? COLOR.pivot : COLOR.unsorted)));
  row.bars.forEach(b => b.root().opacity(1));
  const pivot = row.bars[6];
  const line = createRef<Line>();
  root.add(<Line ref={line} points={[[-780, heightOf(6)], [780, heightOf(6)]]} stroke={COLOR.pivot} lineWidth={4} lineDash={[14, 10]} />);
  const walker = new Pointer(root, {x: barX(0), y: BASE_Y + 15, label: 'j', color: C.text});

  yield* enter();
  yield* sub.say(CAPTIONS[0]);
  yield* walker.appear();
  yield* waitFor(t(1.4));

  let boundary = -1;
  for (let j = 0; j < 6; j++) {
    yield* walker.moveTo(barX(j), undefined, 0.45);
    const bar = row.bars[j];
    if (bar.value < pivot.value) {
      yield* all(sub.say(CAPTIONS[1]), bar.mark(COLOR.smaller));
      yield* waitFor(t(0.9));
      boundary++;
      yield* row.swapAt(boundary, j);
    } else {
      yield* all(sub.say(CAPTIONS[2]), bar.mark(COLOR.bigger));
      yield* waitFor(t(0.9));
    }
  }

  yield* all(sub.say(CAPTIONS[3]), walker.hide(), line().opacity(0, t(0.4)));
  yield* row.swapAt(boundary + 1, 6, 0.9);
  yield* pivot.mark(COLOR.done);
  yield* holdUntil(22, 1.5);
  yield* all(sub.hide(), leave());
});
