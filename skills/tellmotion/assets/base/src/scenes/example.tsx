import {makeScene2D} from '@motion-canvas/2d';
import {all, waitFor} from '@motion-canvas/core';
import {Arrow} from '../components/Arrow';
import {Box} from '../components/Box';
import {send} from '../components/Packet';
import {prepareScene} from '../components/Scene';
import {C, t} from '../config';

// ---------- EDITABLE TEXT ----------
const TITLE = 'Example scene';
const CAPTIONS = ['A client sends a request to the server.', 'The server answers.'];
// -----------------------------------

// Minimal scene: replace it with your real scenes and register them in src/project.ts
export default makeScene2D(function* (view) {
  const {root, sub, enter, leave} = prepareScene(view, TITLE);

  const client = new Box(root, {x: -300, y: 0, label: 'Client', color: C.cat[0]});
  const server = new Box(root, {x: 300, y: 0, label: 'Server', color: C.cat[2]});
  const arrow = new Arrow(root, [[-170, 0], [170, 0]]);

  yield* enter();
  yield* sub.say(CAPTIONS[0]);
  yield* all(client.appear(), server.appear(), arrow.draw(0.6));
  yield* send(root, [[-170, 0], [170, 0]], {name: 'request'});
  yield* server.glow(true);
  yield* sub.say(CAPTIONS[1]);
  yield* waitFor(t(2));
  yield* all(sub.hide(), leave());
});
