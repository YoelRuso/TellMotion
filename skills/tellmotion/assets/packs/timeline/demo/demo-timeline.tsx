import {makeScene2D} from '@motion-canvas/2d';
import {all, waitFor} from '@motion-canvas/core';
import {prepareScene} from '../components/Scene';
import {Timeline} from '../components/Timeline';
import {t} from '../config';

// ---------- EDITABLE TEXT ----------
const TITLE = 'Timeline pack';
const S = ['The axis draws itself and phases appear.', 'Milestones are revealed one by one.', 'Focus on a single milestone.'];
// -----------------------------------

export default makeScene2D(function* (view) {
  const {root, sub, enter, leave} = prepareScene(view, TITLE);

  const tl = new Timeline(root, {
    x: 0,
    y: 20,
    w: 1500,
    ranges: [{from: 0, to: 0.45, label: 'Design'}, {from: 0.45, to: 1, label: 'Build'}],
    milestones: [
      {at: 0.02, label: 'Kickoff', date: 'Jan'},
      {at: 0.25, label: 'Prototype', date: 'Mar'},
      {at: 0.5, label: 'Beta', date: 'Jun'},
      {at: 0.75, label: 'Launch', date: 'Sep'},
      {at: 0.98, label: 'Scale', date: 'Dec'},
    ],
  });

  yield* enter();
  yield* sub.say(S[0]);
  yield* all(tl.drawAxis(1.2), tl.showBands(0.4));
  yield* sub.say(S[1]);
  yield* tl.revealAll(0.6);
  yield* sub.say(S[2]);
  yield* tl.focus(3);
  yield* waitFor(t(2));
  yield* all(sub.hide(), leave());
});
