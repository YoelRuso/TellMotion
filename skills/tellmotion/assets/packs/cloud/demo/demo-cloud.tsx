import {makeScene2D} from '@motion-canvas/2d';
import {all, waitFor} from '@motion-canvas/core';
import {connect} from '../components/Arrow';
import {Database} from '../components/Database';
import {Lambda} from '../components/Lambda';
import {send} from '../components/Packet';
import {Queue} from '../components/Queue';
import {prepareScene} from '../components/Scene';
import {Service} from '../components/Service';
import {t} from '../config';

// ---------- EDITABLE TEXT ----------
const TITLE = 'Cloud pack';
const S = ['A service answers requests and owns its database.', 'Messages wait in a queue until a function takes them.', 'The function stores the result; failures go to a dead-letter queue.'];
// -----------------------------------

export default makeScene2D(function* (view) {
  const {root, sub, enter, leave} = prepareScene(view, TITLE);

  const api = new Service(root, {x: -600, y: -130, label: 'Orders API', db: true});
  const queue = new Queue(root, {x: -90, y: -130, label: 'Orders queue'});
  const worker = new Lambda(root, {x: 500, y: -130, label: 'Process order'});
  const store = new Database(root, {x: 500, y: 190, label: 'Warehouse', w: 260});
  const failed = new Queue(root, {x: -90, y: 190, label: 'Failed orders', dlq: true});

  const a1 = connect(root, api, queue);
  const a2 = connect(root, queue, worker, {async: true});
  const a3 = connect(root, worker, store);
  const a4 = connect(root, queue, failed, {async: true});

  yield* enter();
  yield* sub.say(S[0]);
  yield* api.appear();
  yield* waitFor(t(0.6));

  yield* sub.say(S[1]);
  yield* all(queue.appear(), a1.draw());
  yield* send(root, a1.points, {shape: 'dot', to: queue});
  yield* queue.push(3);
  yield* all(worker.appear(), a2.draw());
  yield* queue.pop();
  yield* send(root, a2.points, {shape: 'diamond', to: worker});

  yield* sub.say(S[2]);
  yield* all(store.appear(), a3.draw());
  yield* send(root, a3.points, {shape: 'dot', to: store});
  yield* all(failed.appear(), a4.draw());
  yield* queue.pop();
  yield* send(root, a4.points, {shape: 'diamond', to: failed});
  yield* failed.push();
  yield* waitFor(t(1.5));
  yield* all(sub.hide(), leave());
});
