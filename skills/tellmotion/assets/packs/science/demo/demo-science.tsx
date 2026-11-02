import {makeScene2D} from '@motion-canvas/2d';
import {all, waitFor} from '@motion-canvas/core';
import {prepareScene} from '../components/Scene';
import {Cycle, Layers, Particles, Wave} from '../components/Science';
import {t} from '../config';

// ---------- EDITABLE TEXT ----------
const TITLE = 'Science pack';
const S = ['A cycle: nodes on a ring and a packet that orbits.', 'Layers stack from top to bottom.', 'Waves travel; particles drift.'];
// -----------------------------------

export default makeScene2D(function* (view) {
  const {root, sub, enter, leave} = prepareScene(view, TITLE);

  const cycle = new Cycle(root, {x: 0, y: -20, steps: [{label: 'Evaporation'}, {label: 'Condensation'}, {label: 'Precipitation'}, {label: 'Collection'}], boxW: 320});
  const layers = new Layers(root, {x: 0, y: -20, w: 1000, layers: [{label: 'Atmosphere'}, {label: 'Clouds'}, {label: 'Ground'}, {label: 'Groundwater'}]});
  const wave = new Wave(root, {x: -330, y: -20, w: 800});
  const dots = new Particles(root, {x: 450, y: -20, w: 700, h: 420, n: 36});

  yield* enter();
  yield* sub.say(S[0]);
  yield* cycle.show(0.3);
  yield* cycle.go(0);
  yield* cycle.orbit(4);
  yield* cycle.go(2);

  yield* sub.say(S[1]);
  yield* all(...cycle.nodes.map(n => n.hide()), cycle.ring().opacity(0, t(0.4)));
  yield* layers.reveal(0.4);
  yield* layers.focus(1);
  yield* waitFor(t(1));

  yield* sub.say(S[2]);
  yield* layers.root().opacity(0, t(0.4));
  yield* all(wave.appear(), dots.appear());
  yield* all(wave.travel(3, 2), dots.drift(120, -160, 3));
  yield* waitFor(t(1));
  yield* all(sub.hide(), leave());
});
