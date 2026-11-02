import {makeScene2D} from '@motion-canvas/2d';
import {all, waitFor} from '@motion-canvas/core';
import {Cloud, Sea, Sun, landscape} from '../components/Nature';
import {Particles} from '../components/Science';
import {prepareScene} from '../components/Scene';
import {C, MOVE, t} from '../config';
import {holdUntil} from '../recipes/shared';

// ---------- EDITABLE TEXT ----------
const TITLE = '2. Condensation';
const CAPTIONS = ['High up the air is cold, so the vapour turns into tiny droplets.', 'Millions of droplets together make a cloud.'];
const SECONDS = 10;
const CLOUD: [number, number] = [-120, -240];
// -----------------------------------

export default makeScene2D(function* (view) {
  const {root, sub, enter, leave} = prepareScene(view, TITLE, {legend: false});
  const scenery = landscape(root);
  const sea = new Sea(scenery);
  const sun = new Sun(scenery);
  const cloud = new Cloud(scenery, ...CLOUD);
  cloud.root().scale(0.2).opacity(0);
  const vapour = new Particles(scenery, {x: 0, y: -60, w: 1700, h: 260, n: 46, color: C.cat[0], size: 14});
  vapour.root().opacity(1);

  yield sea.flow(SECONDS);
  yield sun.turn(SECONDS);
  yield* enter();
  yield* sub.say(CAPTIONS[0]);
  yield* waitFor(t(1));
  // A sunflower spiral, so that the droplets gather evenly and without visible rows
  const gathered = (i: number): [number, number] => {
    const r = Math.sqrt(i / vapour.dots.length);
    return [CLOUD[0] + Math.cos(i * 2.4) * r * 220, CLOUD[1] + Math.sin(i * 2.4) * r * 90];
  };
  yield* all(...vapour.dots.map((dot, i) => dot.position(gathered(i), t(2), MOVE)));
  yield* sub.say(CAPTIONS[1]);
  yield* all(cloud.root().opacity(1, t(0.8)), cloud.root().scale(1, t(1.2), MOVE), vapour.root().opacity(0, t(1)));
  yield* holdUntil(SECONDS, 0.8);
  yield* all(sub.hide(), leave());
});
