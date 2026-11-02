// GENERATED from storyboard.json (0c9ce7487642). If you edit this file, "storyboard.mjs generate" keeps your version.
import {makeScene2D} from '@motion-canvas/2d';
import {outro} from '../recipes/outro';

export default makeScene2D(function* (view) {
  yield* outro(view, {
    "title": "Nothing is lost",
    "takeaways": [
      "The sun powers the whole cycle",
      "The water you drink has been around for ages"
    ],
    "seconds": 9
  });
});
