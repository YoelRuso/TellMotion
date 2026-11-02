import {makeScene2D} from '@motion-canvas/2d';
import {all, waitFor} from '@motion-canvas/core';
import {prepareScene} from '../components/Scene';
import {DIM, webTimeline} from '../components/WebTimeline';
import {t} from '../config';
import {holdUntil} from '../recipes/shared';

// ---------- EDITABLE TEXT ----------
const TITLE = 'Finding and sharing';
const CAPTIONS = ['1998: Google is founded, and finding things gets much easier.', '2004: the idea of "Web 2.0" spreads, as readers become writers too.'];
// -----------------------------------

export default makeScene2D(function* (view) {
  const {root, sub, enter, leave} = prepareScene(view, TITLE, {legend: false});
  const timeline = webTimeline(root, 2);

  yield* enter();
  yield* sub.say(CAPTIONS[0]);
  yield* timeline.reveal(2);
  yield* waitFor(t(3.6));
  yield* sub.say(CAPTIONS[1]);
  yield* all(timeline.groups[2].opacity(DIM, t(0.3)), timeline.reveal(3));
  yield* holdUntil(13, 1.5);
  yield* all(sub.hide(), leave());
});
