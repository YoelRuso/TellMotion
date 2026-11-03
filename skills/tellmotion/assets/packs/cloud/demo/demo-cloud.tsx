import {makeScene2D} from '@motion-canvas/2d';
import {all, waitFor} from '@motion-canvas/core';
import {connect} from '../components/Arrow';
import {Cache} from '../components/Cache';
import {Client} from '../components/Client';
import {Database} from '../components/Database';
import {EventBus} from '../components/EventBus';
import {Gateway} from '../components/Gateway';
import {Lambda} from '../components/Lambda';
import {send} from '../components/Packet';
import {Queue} from '../components/Queue';
import {prepareScene} from '../components/Scene';
import {Service} from '../components/Service';
import {t} from '../config';

// ---------- EDITABLE TEXT ----------
const TITLE = 'Cloud pack';
const S = ['The gateway receives the request and checks the cache first.', 'The service saves the order and publishes an event.', 'Consumers get it at once; failures wait in a dead-letter queue.'];
// -----------------------------------

export default makeScene2D(function* (view) {
  const {root, sub, enter, leave} = prepareScene(view, TITLE);

  const client = new Client(root, {x: -770, y: -90, label: 'Web shop'});
  const gateway = new Gateway(root, {x: -430, y: -90, label: 'API gateway'});
  const cache = new Cache(root, {x: -430, y: 190, label: 'Product cache'});
  const orders = new Service(root, {x: -50, y: -90, label: 'Orders'});
  const store = new Database(root, {x: -50, y: 190, label: 'Orders DB', w: 240});
  const bus = new EventBus(root, {x: 330, y: -320, label: 'Event bus', w: 1060});
  const payments = new Lambda(root, {x: 410, y: -90, label: 'Take payment', w: 280});
  const alerts = new Service(root, {x: 720, y: -90, label: 'Alerts', w: 220});
  const failed = new Queue(root, {x: 410, y: 190, label: 'Failed payments', dlq: true});

  const toGateway = connect(root, client, gateway);
  const toCache = connect(root, gateway, cache, {from: 'bottom', to: 'top'});
  const toOrders = connect(root, gateway, orders);
  const toStore = connect(root, orders, store);
  const published = bus.from(orders);
  const toPayments = bus.to(payments);
  const toAlerts = bus.to(alerts);
  const toFailed = connect(root, payments, failed, {async: true});

  yield* enter();
  yield* sub.say(S[0]);
  yield* all(client.appear(), gateway.appear(), toGateway.draw());
  yield* send(root, toGateway.points, {shape: 'dot', to: gateway});
  yield* all(cache.appear(), toCache.draw());
  yield* send(root, toCache.points, {shape: 'dot', to: cache});
  yield* cache.miss();

  yield* sub.say(S[1]);
  yield* all(orders.appear(), toOrders.draw());
  yield* send(root, toOrders.points, {shape: 'dot', to: orders});
  yield* all(store.appear(), toStore.draw());
  yield* send(root, toStore.points, {shape: 'dot', to: store});

  yield* sub.say(S[2]);
  yield* all(bus.appear(), payments.appear(), alerts.appear(), published.draw(), toPayments.draw(), toAlerts.draw());
  yield* bus.publish(orders, [payments, alerts], {name: 'OrderPlaced'});
  yield* all(failed.appear(), toFailed.draw());
  yield* send(root, toFailed.points, {shape: 'diamond', to: failed});
  yield* failed.push();
  yield* waitFor(t(1.5));
  yield* all(sub.hide(), leave());
});
