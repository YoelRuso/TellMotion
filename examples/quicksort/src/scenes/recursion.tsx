import {makeScene2D} from '@motion-canvas/2d';
import {all, waitFor} from '@motion-canvas/core';
import {prepareScene} from '../components/Scene';
import {COLOR, Sorter} from '../components/Sorter';
import {MOVE, t} from '../config';
import {holdUntil} from '../recipes/shared';

// ---------- EDITABLE TEXT ----------
const TITLE = 'Step 3: repeat on each side';
const CAPTIONS = ['Each side is now a smaller version of the same problem.', 'Keep splitting until every bar is in its place.'];
/** The order the partition scene ends with. */
const VALUES = [3, 2, 1, 6, 8, 7, 9];
const SPREAD = 45;
// -----------------------------------

export default makeScene2D(function* (view) {
  const {root, sub, enter, leave} = prepareScene(view, TITLE);
  const row = new Sorter(root, VALUES, VALUES.map((_, i) => (i < 3 ? COLOR.smaller : i === 3 ? COLOR.done : COLOR.bigger)));
  row.bars.forEach(b => b.root().opacity(1));
  const shift = (dir: number) => all(...row.bars.map((b, i) => (i === 3 ? waitFor(0) : b.root().x(b.root().x() + dir * (i < 3 ? -SPREAD : SPREAD), t(0.5), MOVE))));

  yield* enter();
  yield* sub.say(CAPTIONS[0]);
  yield* shift(1);
  yield* waitFor(t(0.8));
  yield* row.sort(0, 2);
  yield* sub.say(CAPTIONS[1]);
  yield* row.sort(4, 6);
  yield* shift(-1);
  yield* holdUntil(14, 1.2);
  yield* all(sub.hide(), leave());
});
