import {makeScene2D} from '@motion-canvas/2d';
import {all, waitFor} from '@motion-canvas/core';
import {prepareScene} from '../components/Scene';
import {DIM, webTimeline} from '../components/WebTimeline';
import {t} from '../config';
import {holdUntil} from '../recipes/shared';

// ---------- EDITABLE TEXT ----------
const TITLE = 'The beginnings';
const CAPTIONS = ['1989: Tim Berners-Lee proposes the web at CERN, to share research.', '1993: the Mosaic browser shows images next to text, and people notice.'];
// -----------------------------------

export default makeScene2D(function* (view) {
  const {root, sub, enter, leave} = prepareScene(view, TITLE, {legend: false});
  const timeline = webTimeline(root, 0);

  yield* enter();
  yield* timeline.drawAxis(1.2);
  yield* sub.say(CAPTIONS[0]);
  yield* timeline.reveal(0);
  yield* waitFor(t(3));
  yield* sub.say(CAPTIONS[1]);
  yield* all(timeline.groups[0].opacity(DIM, t(0.3)), timeline.reveal(1));
  yield* holdUntil(13, 1.5);
  yield* all(sub.hide(), leave());
});
