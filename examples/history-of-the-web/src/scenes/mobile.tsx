import {makeScene2D} from '@motion-canvas/2d';
import {all, waitFor} from '@motion-canvas/core';
import {prepareScene} from '../components/Scene';
import {DIM, webTimeline} from '../components/WebTimeline';
import {C, t} from '../config';
import {holdUntil} from '../recipes/shared';

// ---------- EDITABLE TEXT ----------
const TITLE = 'In every pocket';
const CAPTIONS = ['2007: the iPhone puts the full web in a pocket.', '2016: worldwide, phones and tablets overtake computers for browsing.'];
// -----------------------------------

export default makeScene2D(function* (view) {
  const {root, sub, enter, leave} = prepareScene(view, TITLE, {legend: false});
  const timeline = webTimeline(root, 4);

  yield* enter();
  yield* sub.say(CAPTIONS[0]);
  yield* timeline.reveal(4);
  yield* waitFor(t(2.6));
  yield* sub.say(CAPTIONS[1]);
  yield* all(timeline.groups[4].opacity(DIM, t(0.3)), timeline.reveal(5));
  yield* waitFor(t(1.6));
  yield* all(timeline.clearFocus(0.6), timeline.axis().stroke(C.cat[0], t(0.6)));
  yield* holdUntil(13, 1);
  yield* all(sub.hide(), leave());
});
