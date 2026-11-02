import {makeScene2D} from '@motion-canvas/2d';
import {all, waitFor} from '@motion-canvas/core';
import {prepareScene} from '../components/Scene';
import {BulletList, Compare, KineticTitle, Quote} from '../components/Typography';
import {t} from '../config';

// ---------- EDITABLE TEXT ----------
const TITLE = 'Typography pack';
const S = ['Kinetic titles reveal word by word.', 'Lists appear item by item.', 'Quotes get a big opening mark.', 'Comparisons put two sides head to head.'];
// -----------------------------------

export default makeScene2D(function* (view) {
  const {root, sub, enter, leave} = prepareScene(view, TITLE);

  const title = new KineticTitle(root, {x: 0, y: -20, lines: ['Ideas become', 'motion'], size: 130});
  const list = new BulletList(root, {x: -300, y: -20, items: ['Write a brief', 'Pick a theme', 'Animate the story']});
  const quote = new Quote(root, {x: 40, y: -20, text: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci'});
  const cmp = new Compare(root, {x: 0, y: -20, w: 1500, h: 520, left: {title: 'Template', items: ['Instant', 'Consistent']}, right: {title: 'Custom', items: ['Unique', 'More effort']}});

  yield* enter();
  yield* sub.say(S[0]);
  yield* title.reveal();
  yield* title.emphasize(2);
  yield* waitFor(t(1.2));

  yield* sub.say(S[1]);
  yield* title.root().opacity(0, t(0.4));
  yield* list.showAll(0.6);
  yield* list.focus(1);
  yield* waitFor(t(1));

  yield* sub.say(S[2]);
  yield* list.root().opacity(0, t(0.4));
  yield* quote.reveal();
  yield* waitFor(t(2));

  yield* sub.say(S[3]);
  yield* quote.root().opacity(0, t(0.4));
  yield* all(cmp.showLeft(), cmp.showRight());
  yield* cmp.showVs();
  yield* cmp.emphasize('left');
  yield* waitFor(t(1.5));
  yield* all(sub.hide(), leave());
});
