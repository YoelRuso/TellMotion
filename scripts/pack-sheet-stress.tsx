// Scene for `npm run sheets:packs`: the pieces at their limits, which the demos do not reach. Not distributed with the skill.
import {makeScene2D} from '@motion-canvas/2d';
import {all, waitFor} from '@motion-canvas/core';
import {connect} from '../components/Arrow';
import {Bar} from '../components/Bar';
import {BarChart} from '../components/BarChart';
import {Box} from '../components/Box';
import {Cell} from '../components/Cell';
import {Database} from '../components/Database';
import {DataIO, Decision, Process, Terminator} from '../components/Flow';
import {Lambda} from '../components/Lambda';
import {LineChart} from '../components/LineChart';
import {send} from '../components/Packet';
import {Queue} from '../components/Queue';
import {prepareScene} from '../components/Scene';
import {Service} from '../components/Service';
import {Terminal} from '../components/Terminal';
import {TreeNode} from '../components/TreeNode';
import {C, t} from '../config';

export default makeScene2D(function* (view) {
  const {root, sub, enter, leave} = prepareScene(view, 'Packs at their limits');

  // Cell text after mark/unmark, Bar label after setValue
  const cells = [1, 2, 3].map((v, i) => new Cell(root, {x: -760 + i * 120, y: -280, value: v, index: i}));
  const bar = new Bar(root, {x: -240, baseY: 340, value: 2.5, max: 10, maxH: 200, w: 110});
  // A connection to a slanted side, elbows in every direction, and every packet shape
  const io = new DataIO(root, {x: -620, y: -40, label: 'Read data', w: 300});
  const step = new Process(root, {x: -620, y: 170, label: 'Check', w: 260});
  const a = new Box(root, {x: 40, y: -280, label: 'Client', color: C.cat[0], w: 220});
  const b = new Box(root, {x: 560, y: -130, label: 'Gateway', color: C.cat[1], w: 220});
  const c = new Box(root, {x: 40, y: 20, label: 'Event bus', color: C.cat[3], w: 220});
  const d = new Box(root, {x: 560, y: 170, label: 'Mail service', color: C.cat[2], w: 240});
  const ab = connect(root, a, b);
  const bc = connect(root, b, c, {from: 'bottom', to: 'right'});
  const cd = connect(root, c, d, {async: true});
  const down = connect(root, io, step);
  const inward = connect(root, a, io, {from: 'left', to: 'right'});

  yield* enter();

  // Labels too long for their piece: they wrap, and shrink only if that is not enough. Marks on any piece.
  yield* sub.say('Long labels wrap inside their piece, and shrink only if they still do not fit.');
  const longLabels = [
    new Box(root, {x: -620, y: -300, label: 'Customer notification and billing service', color: C.cat[0]}),
    new Process(root, {x: -200, y: -300, label: 'Validate the shipping address of the order', w: 260}),
    new Terminator(root, {x: 220, y: -300, label: 'End of the whole process', w: 240}),
    new DataIO(root, {x: 640, y: -300, label: 'Read the monthly sales report', w: 320}),
    new Decision(root, {x: -620, y: -90, label: 'Is the customer eligible for the discount?'}),
    new Service(root, {x: -200, y: -90, label: 'Internationalization and localization service', db: true}),
    new Lambda(root, {x: 220, y: -90, label: 'Resize every uploaded image'}),
    new Database(root, {x: 640, y: -90, label: 'Customer analytics warehouse', w: 260, h: 120}),
    new Queue(root, {x: -620, y: 120, label: 'Pending customer notifications queue'}),
    new Box(root, {x: -200, y: 120, label: 'Line one\nLine two', color: C.cat[1]}),
    new Box(root, {x: 220, y: 120, label: 'Supercalifragilisticexpialidocious', color: C.cat[2]}),
    new Cell(root, {x: 520, y: 120, value: 1000000}),
    new TreeNode(root, {x: 720, y: 120, value: 123456}),
  ];
  yield* all(...longLabels.map(p => p.appear()));
  yield* waitFor(t(1));
  yield* all(longLabels[0].mark(C.ok, true), longLabels[6].mark(C.error), longLabels[12].mark(C.ok, true));
  yield* waitFor(t(1));
  yield* all(...longLabels.map(p => p.unmark()));
  yield* all(...longLabels.map(p => p.hide()));

  yield* sub.say('Marked cells stay readable, bar labels follow their value, arrows touch the shapes.');
  yield* all(...cells.map(x => x.appear()), bar.appear(), io.appear(), step.appear(), a.appear(), b.appear(), c.appear(), d.appear());
  yield* all(ab.draw(), bc.draw(), cd.draw(), down.draw(), inward.draw());
  yield* all(cells[0].mark(C.cat[1], true), cells[1].mark(C.cat[1]), bar.setValue(8.75));
  yield* waitFor(t(0.6));
  yield* all(cells[0].unmark(), cells[1].unmark());
  yield* send(root, ab.points, {shape: 'dot', name: 'request', to: b});
  yield* send(root, bc.points, {shape: 'diamond', name: 'event', below: true, to: c});
  yield* send(root, cd.points, {name: 'email', to: d});
  yield* waitFor(t(0.8));
  yield* all(...[...cells, io, step, a, b, c, d].map(x => x.hide()), bar.root().opacity(0, t(0.4)), ab.hide(), bc.hide(), cd.hide(), down.hide(), inward.hide());

  // Chart labels with units, values beyond the plot, dots in step with the line
  yield* sub.say('Chart values keep their units, and the scale adapts to values beyond the top.');
  const chart = new BarChart(root, {x: -440, y: 300, w: 760, h: 480, prefix: '$', suffix: 'k', decimals: 1, data: [{label: 'Q1', value: 12.5}, {label: 'Q2', value: 48.25}, {label: 'Q3', value: 30}]});
  const line = new LineChart(root, {x: 500, y: 300, w: 720, h: 480, data: [10, 80, 20, 95, 60], labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']});
  yield* all(chart.appear(), line.appear());
  yield* all(chart.grow(1), line.draw(2));
  yield* chart.update([40, 120.5, 75]);
  yield* waitFor(t(0.8));
  // The animations every element shares
  yield* all(chart.glow(), line.dim());
  yield* waitFor(t(0.5));
  yield* all(chart.glow(false), line.dim(false));
  yield* chart.ping();
  yield* all(chart.hide(), line.hide());

  // More rows than the window holds, and lines wider than it
  yield* sub.say('The terminal wraps long lines and scrolls when it is full.');
  const term = new Terminal(root, {x: 0, y: -20, w: 1300, h: 560, title: 'bash'});
  yield* term.appear();
  yield* term.run('npm run build -- --mode production --outDir dist/public --emptyOutDir --sourcemap --minify esbuild', ['vite v5.4.0 building for production...'], 0.8);
  yield* term.run('npm test', Array.from({length: 11}, (_, i) => `PASS  src/module-${i + 1}.test.js`), 0.3);
  yield* term.run('ls', ['a-very-long-file-name-without-any-spaces-that-goes-well-beyond-the-width-of-the-terminal-window.txt'], 0.2);
  yield* waitFor(t(1));
  yield* all(sub.hide(), leave());
});
