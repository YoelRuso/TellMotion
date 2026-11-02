// GENERATED from storyboard.json (348a9304cdfa). If you edit this file, "storyboard.mjs generate" keeps your version.
import {makeScene2D} from '@motion-canvas/2d';
import {outro} from '../recipes/outro';

export default makeScene2D(function* (view) {
  yield* outro(view, {
    "title": "Divide and conquer",
    "takeaways": [
      "Each pivot lands in its final place",
      "Then repeat on the two smaller sides"
    ],
    "seconds": 8
  });
});
