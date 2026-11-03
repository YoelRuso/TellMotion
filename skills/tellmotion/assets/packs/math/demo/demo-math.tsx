import {makeScene2D} from '@motion-canvas/2d';
import {all, waitFor} from '@motion-canvas/core';
import {Formula} from '../components/Formula';
import {Graph} from '../components/Graph';
import {NumberLine} from '../components/NumberLine';
import {prepareScene} from '../components/Scene';
import {C, t} from '../config';

// ---------- EDITABLE TEXT ----------
const TITLE = 'Math pack';
const S = ['An equation changes step by step, and its parts travel to their place.', 'Any function can be plotted; a point follows the curve with its tangent.', 'A number line shows values and intervals.'];
// -----------------------------------

export default makeScene2D(function* (view) {
  const {root, sub, enter, leave} = prepareScene(view, TITLE);

  const formula = new Formula(root, {x: 0, y: -40, size: 96, tex: '{{2x}} + {{3}} = {{7}}'});
  const graph = new Graph(root, {x: -60, y: -30, w: 1100, h: 640, xRange: [-4, 4], yRange: [-2, 6], xStep: 1, yStep: 2});
  const parabola = graph.plot(x => (x * x) / 2 - 1, {label: 'y = x²/2 − 1'});
  const wave = graph.plot(x => Math.sin(x) + 3, {color: C.cat[3]});
  const line = new NumberLine(root, {x: 0, y: 20, min: -5, max: 5});

  yield* enter();
  yield* sub.say(S[0]);
  yield* formula.appear();
  yield* waitFor(t(0.6));
  yield* formula.to('{{2x}} = {{7}} - {{3}}');
  yield* waitFor(t(0.6));
  yield* formula.to('{{x}} = {{2}}');
  yield* formula.ping();
  yield* waitFor(t(0.6));
  yield* formula.hide();

  yield* sub.say(S[1]);
  yield* graph.appear();
  yield* all(parabola.draw(), wave.draw());
  yield* graph.trace(parabola, -3, 2.5, {tangent: true, d: 2.4});
  yield* waitFor(t(0.8));
  yield* graph.hide();

  yield* sub.say(S[2]);
  yield* line.appear();
  yield* line.showMarker(-3);
  yield* line.moveTo(2);
  yield* line.shade(-3, 2);
  yield* waitFor(t(1.2));
  yield* all(sub.hide(), leave());
});
