import {makeScene2D} from '@motion-canvas/2d';
import {all, waitFor} from '@motion-canvas/core';
import {CodeView} from '../components/CodeView';
import {prepareScene} from '../components/Scene';
import {Terminal} from '../components/Terminal';
import {t} from '../config';

// ---------- EDITABLE TEXT ----------
const TITLE = 'Code pack';
const S = ['Syntax colors come from the theme.', 'Focus the lines that matter.', 'Edits are animated as a diff.', 'A terminal types commands and prints output.'];
const CODE = `// add two numbers
function add(a, b) {
  return a + b;
}

console.log(add(2, 3));`;
const CODE2 = `// add any amount of numbers
function add(...xs) {
  return xs.reduce((a, b) => a + b, 0);
}

console.log(add(2, 3, 4));`;
// -----------------------------------

export default makeScene2D(function* (view) {
  const {root, sub, enter, leave} = prepareScene(view, TITLE);

  const code = new CodeView(root, {x: 0, y: -20, w: 1400, h: 520, code: CODE});
  const term = new Terminal(root, {x: 0, y: -20, w: 1400, h: 520, title: 'bash'});

  yield* enter();
  yield* sub.say(S[0]);
  yield* code.appear();
  yield* waitFor(t(1));
  yield* sub.say(S[1]);
  yield* code.focus(1, 3);
  yield* waitFor(t(1));
  yield* code.unfocus();
  yield* sub.say(S[2]);
  yield* code.change(CODE2, 1.4);
  yield* waitFor(t(1));
  yield* sub.say(S[3]);
  yield* all(code.root().opacity(0, t(0.4)));
  yield* term.appear();
  yield* term.run('node add.js', ['9']);
  yield* term.run('npm test', ['PASS  add.test.js', '1 passed']);
  yield* waitFor(t(1.5));
  yield* all(sub.hide(), leave());
});
