import {makeScene2D} from '@motion-canvas/2d';
import {all, waitFor} from '@motion-canvas/core';
import {connect} from '../components/Arrow';
import {DataIO, Decision, Process, Tag, Terminator} from '../components/Flow';
import {send} from '../components/Packet';
import {prepareScene} from '../components/Scene';
import {C, t} from '../config';

// ---------- EDITABLE TEXT ----------
const TITLE = 'Flowchart pack';
const S = ['Start, read the data, then decide.', 'If it is valid we save it.', 'Otherwise we show an error.'];
// -----------------------------------

export default makeScene2D(function* (view) {
  const {root, sub, enter, leave} = prepareScene(view, TITLE);

  const start = new Terminator(root, {x: -760, y: 0, label: 'Start', w: 200});
  const read = new DataIO(root, {x: -450, y: 0, label: 'Read data', w: 300});
  const valid = new Decision(root, {x: -30, y: 0, label: 'Valid?'});
  const save = new Process(root, {x: 430, y: -170, label: 'Save', w: 260});
  const error = new Process(root, {x: 430, y: 170, label: 'Show error', w: 260, color: C.error});
  const end = new Terminator(root, {x: 790, y: -170, label: 'End', w: 200});

  const a1 = connect(root, start, read);
  const a2 = connect(root, read, valid);
  const yes = connect(root, valid, save, {from: 'right', to: 'left'});
  const no = connect(root, valid, error, {from: 'right', to: 'left'});
  const a3 = connect(root, save, end);
  const tYes = new Tag(root, {x: 270, y: -90, text: 'Yes', color: C.ok});
  const tNo = new Tag(root, {x: 270, y: 90, text: 'No', color: C.error});

  yield* enter();
  yield* sub.say(S[0]);
  yield* all(start.appear(), read.appear(), valid.appear(), a1.draw(), a2.draw());
  yield* valid.glow(true);

  yield* sub.say(S[1]);
  yield* all(save.appear(), end.appear(), yes.draw(), a3.draw(), tYes.show());
  yield* send(root, yes.points, {shape: 'dot', name: 'ok', to: save});

  yield* sub.say(S[2]);
  yield* all(error.appear(), no.draw(), tNo.show());
  yield* waitFor(t(2));
  yield* all(sub.hide(), leave());
});
