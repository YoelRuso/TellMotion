import {makeScene2D} from '@motion-canvas/2d';
import {all, waitFor} from '@motion-canvas/core';
import {BarChart} from '../components/BarChart';
import {Counter} from '../components/Counter';
import {LineChart} from '../components/LineChart';
import {PieChart} from '../components/PieChart';
import {prepareScene} from '../components/Scene';
import {t} from '../config';

// ---------- EDITABLE TEXT ----------
const TITLE = 'Charts pack';
const S = ['Bars grow and their values count up live.', 'A line chart draws itself, dots pop in.', 'Pie slices sweep in clockwise.'];
// -----------------------------------

export default makeScene2D(function* (view) {
  const {root, sub, enter, leave} = prepareScene(view, TITLE);

  const bars = new BarChart(root, {x: -250, y: 330, w: 900, h: 460, data: [{label: 'Q1', value: 40}, {label: 'Q2', value: 65}, {label: 'Q3', value: 52}, {label: 'Q4', value: 90}]});
  const counter = new Counter(root, {x: 520, y: -20, prefix: '$', suffix: 'k', size: 150, label: 'revenue'});
  const line = new LineChart(root, {x: 0, y: 330, w: 1200, h: 440, data: [10, 25, 18, 40, 55, 48, 70], labels: ['Jan', '', 'Mar', '', 'May', '', 'Jul']});
  const pie = new PieChart(root, {x: 0, y: 20, radius: 240, data: [{label: 'Web', value: 45}, {label: 'Mobile', value: 35}, {label: 'API', value: 20}]});

  yield* enter();
  yield* sub.say(S[0]);
  yield* all(bars.appear(), counter.appear());
  yield* all(bars.grow(1.2), counter.countTo(247, 1.8));
  yield* bars.highlight(3);
  yield* waitFor(t(1));

  yield* sub.say(S[1]);
  yield* all(bars.root().opacity(0, t(0.4)), counter.root().opacity(0, t(0.4)));
  yield* line.appear();
  yield* line.draw(2);
  yield* waitFor(t(1));

  yield* sub.say(S[2]);
  yield* line.root().opacity(0, t(0.4));
  yield* pie.sweep(2.4);
  yield* pie.highlight(0);
  yield* waitFor(t(1.2));
  yield* all(sub.hide(), leave());
});
