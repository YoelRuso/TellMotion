import {makeScene2D} from '@motion-canvas/2d';
import {all, waitFor} from '@motion-canvas/core';
import {Sea, Sun, landscape} from '../components/Nature';
import {Particles} from '../components/Science';
import {prepareScene} from '../components/Scene';
import {C, t} from '../config';
import {holdUntil} from '../recipes/shared';

// ---------- EDITABLE TEXT ----------
const TITLE = '1. Evaporation';
const CAPTIONS = ['The sun warms the sea, lakes and rivers.', 'Some water turns into vapour and rises into the air.'];
const SECONDS = 11;
// -----------------------------------

export default makeScene2D(function* (view) {
  const {root, sub, enter, leave} = prepareScene(view, TITLE, {legend: false});
  const scenery = landscape(root);
  const sea = new Sea(scenery);
  const sun = new Sun(scenery);
  const vapour = new Particles(scenery, {x: 0, y: 150, w: 1700, h: 50, n: 46, color: C.cat[0], size: 14});

  yield sea.flow(SECONDS);
  yield sun.turn(SECONDS);
  yield* enter();
  yield* sub.say(CAPTIONS[0]);
  yield* sun.root().scale(1.15, t(0.8));
  yield* sun.root().scale(1, t(0.8));
  yield* sub.say(CAPTIONS[1]);
  yield* vapour.appear(0.4);
  yield* all(vapour.drift(0, -520, 3.6), waitFor(t(2.4)));
  yield* holdUntil(SECONDS, 0.3);
  yield* all(sub.hide(), leave());
});
