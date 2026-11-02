import {makeScene2D} from '@motion-canvas/2d';
import {all, waitFor} from '@motion-canvas/core';
import {Cloud, Rain, Sea, Sun, hill, landscape} from '../components/Nature';
import {prepareScene} from '../components/Scene';
import {C, t} from '../config';
import {holdUntil} from '../recipes/shared';

// ---------- EDITABLE TEXT ----------
const TITLE = '3. Precipitation';
const CAPTIONS = ['When droplets get too heavy, they fall as rain or snow.'];
const SECONDS = 9;
const CLOUD: [number, number] = [-120, -240];
// -----------------------------------

export default makeScene2D(function* (view) {
  const {root, sub, enter, leave} = prepareScene(view, TITLE, {legend: false});
  const scenery = landscape(root);
  const sun = new Sun(scenery);
  const rain = new Rain(scenery, CLOUD[0], -180, 620, 400);
  const sea = new Sea(scenery);
  hill(scenery);
  const cloud = new Cloud(scenery, ...CLOUD);

  yield sea.flow(SECONDS);
  yield sun.turn(SECONDS);
  yield rain.pour(SECONDS);
  yield* enter();
  yield* sub.say(CAPTIONS[0]);
  yield* all(cloud.setColor(C.muted), sun.root().opacity(0.35, t(0.8)));
  yield* rain.root().opacity(1, t(0.6));
  yield* waitFor(t(1));
  yield* holdUntil(SECONDS, 0.5);
  yield* all(sub.hide(), leave());
});
