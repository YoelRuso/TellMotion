import {Circle, Line, makeScene2D} from '@motion-canvas/2d';
import {all, createRef, tween, waitFor} from '@motion-canvas/core';
import {Cloud, Sea, Sun, hill, landscape} from '../components/Nature';
import {Cycle} from '../components/Science';
import {prepareScene} from '../components/Scene';
import {C, t} from '../config';
import {holdUntil} from '../recipes/shared';

// ---------- EDITABLE TEXT ----------
const TITLE = '4. Collection';
const CAPTIONS = ['Rivers carry the water back to the sea.', 'And then it all starts again: a cycle with no beginning or end.'];
const STAGES = ['Evaporation', 'Condensation', 'Precipitation', 'Collection'];
const SECONDS = 14;
const RX = 540;
const RY = 270;
const CENTER: [number, number] = [0, -40];
// -----------------------------------

export default makeScene2D(function* (view) {
  const {root, sub, enter, leave} = prepareScene(view, TITLE, {legend: false});
  const scenery = landscape(root);
  const sun = new Sun(scenery);
  const sea = new Sea(scenery);
  hill(scenery);
  const cloud = new Cloud(scenery, -120, -240);
  const river = createRef<Line>();
  scenery.add(<Line ref={river} points={[[-760, -5], [-620, 60], [-500, 90], [-380, 170], [-240, 190], [-100, 250], [40, 230]]} stroke={C.cat[0]} lineWidth={18} lineCap={'round'} lineJoin={'round'} radius={60} end={0} />);

  // Continues from the rain: the sun comes back out
  sun.root().opacity(0.35);
  cloud.puffs.forEach(p => p.fill(C.muted));

  // The drop goes first so that it passes behind the labels
  const drop = createRef<Circle>();
  root.add(<Circle ref={drop} size={34} fill={C.cat[0]} stroke={C.text} lineWidth={4} position={[CENTER[0], CENTER[1] - RY]} opacity={0} />);
  const cycle = new Cycle(root, {x: CENTER[0], y: CENTER[1], rx: RX, ry: RY, steps: STAGES.map(label => ({label})), boxW: 380, boxH: 96});
  const placeDrop = (turn: number) => {
    const a = -Math.PI / 2 + turn * Math.PI * 2;
    drop().position([CENTER[0] + Math.cos(a) * RX, CENTER[1] + Math.sin(a) * RY]);
  };

  yield sea.flow(SECONDS);
  yield sun.turn(SECONDS);
  yield* enter();
  yield* sub.say(CAPTIONS[0]);
  yield* all(cloud.root().opacity(0.5, t(0.5)), sun.root().opacity(1, t(0.5)));
  yield* river().end(1, t(1.6));
  yield* waitFor(t(0.8));

  yield* sub.say(CAPTIONS[1]);
  yield* scenery.opacity(0.18, t(0.6));
  yield* cycle.show(0.25);
  yield* drop().opacity(1, t(0.3));
  for (let i = 0; i < STAGES.length; i++) {
    const from = i / STAGES.length;
    yield* cycle.go(i, 0.2);
    yield* tween(t(0.8), v => placeDrop(from + v / STAGES.length));
  }
  yield* cycle.go(-1, 0.3);
  yield* holdUntil(SECONDS, 0.6);
  yield* all(sub.hide(), leave());
});
