import {makeScene2D} from '@motion-canvas/2d';
import {all, waitFor} from '@motion-canvas/core';
import {prepareScene} from '../components/Scene';
import {WorldMap} from '../components/WorldMap';
import {C, t} from '../config';

// ---------- EDITABLE TEXT ----------
const TITLE = 'Maps pack';
const S = ['Places go where their latitude and longitude say.', 'Routes arc between them, and something can travel along.', 'A continent can take the focus.'];
// -----------------------------------

export default makeScene2D(function* (view) {
  const {root, sub, enter, leave} = prepareScene(view, TITLE);

  const map = new WorldMap(root, {x: 0, y: -20, w: 1700});
  const madrid = map.pin(40.4, -3.7, {label: 'Madrid', side: 'left'});
  const newYork = map.pin(40.7, -74, {label: 'New York', side: 'left', color: C.cat[0]});
  const tokyo = map.pin(35.7, 139.7, {label: 'Tokyo', side: 'bottom', color: C.cat[2]});
  const lima = map.pin(-12, -77, {label: 'Lima', side: 'right', color: C.cat[3]});
  const atlantic = map.route(madrid, newYork);
  const pacific = map.route(madrid, tokyo, {async: true});

  yield* enter();
  yield* sub.say(S[0]);
  yield* map.appear();
  yield* map.showPins([madrid, newYork, tokyo, lima]);
  yield* waitFor(t(0.6));

  yield* sub.say(S[1]);
  yield* all(atlantic.draw(0.8), pacific.draw(0.8));
  yield* map.send(atlantic, newYork);
  yield* map.send(pacific, tokyo, {shape: 'diamond'});

  yield* sub.say(S[2]);
  yield* map.focus(['southAmerica']);
  yield* lima.ping();
  yield* waitFor(t(1.2));
  yield* all(sub.hide(), leave());
});
