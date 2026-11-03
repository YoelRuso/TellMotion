import {makeScene2D} from '@motion-canvas/2d';
import {all, waitFor} from '@motion-canvas/core';
import {Bar} from '../components/Bar';
import {Cell} from '../components/Cell';
import {Pointer} from '../components/Pointer';
import {prepareScene} from '../components/Scene';
import {Tree} from '../components/Tree';
import {swap} from '../components/swap';
import {C, t} from '../config';

// ---------- EDITABLE TEXT ----------
const TITLE = 'Algorithms pack';
const S = ['Compare two neighbours, swap them if they are out of order.', 'Bars make progress easy to see.', 'Trees and graphs use nodes and links.'];
const VALUES = [5, 2, 8, 1, 9];
// -----------------------------------

export default makeScene2D(function* (view) {
  const {root, sub, enter, leave} = prepareScene(view, TITLE);

  // Array cells
  const cells = VALUES.map((v, i) => new Cell(root, {x: -280 + i * 140, y: -160, value: v, index: i}));
  const i = new Pointer(root, {x: -280, y: -90, label: 'i'});
  const j = new Pointer(root, {x: -140, y: -90, label: 'j', color: C.cat[3]});

  // Bars
  const bars = VALUES.map((v, k) => new Bar(root, {x: -280 + k * 140, baseY: 340, value: v, max: 10, maxH: 280, w: 100}));

  // Tree: the positions are worked out from the data
  const tree = new Tree(root, {x: 620, y: -180, gap: 110, levelH: 130, data: {value: 8, children: [{value: 3, children: [{value: 1}, {value: 5}]}, {value: 9, children: [null, {value: 12}]}]}});

  yield* enter();
  yield* sub.say(S[0]);
  yield* all(...cells.map(x => x.appear()), i.appear(), j.appear());
  yield* all(cells[0].mark(C.cat[1]), cells[1].mark(C.cat[1]));
  yield* swap(cells[0], cells[1]);
  yield* all(cells[0].unmark(), cells[1].unmark(), cells[1].mark(C.ok, true));
  yield* all(i.moveTo(0, -90), j.moveTo(140, -90));

  yield* sub.say(S[1]);
  yield* all(...bars.map(x => x.appear()));
  yield* swap(bars[0], bars[1]);
  yield* all(bars[2].mark(C.cat[1]), bars[3].mark(C.cat[1]));

  yield* sub.say(S[2]);
  yield* tree.appear();
  yield* tree.visit([8, 3, 5], C.cat[1]);
  yield* waitFor(t(1.5));
  yield* all(sub.hide(), leave());
});
