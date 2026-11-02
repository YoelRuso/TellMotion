// GENERATED from storyboard.json (c3fd4965fb6f). If you edit this file, "storyboard.mjs generate" keeps your version.
import {makeScene2D} from '@motion-canvas/2d';
import {intro} from '../recipes/intro';

export default makeScene2D(function* (view) {
  yield* intro(view, {
    "title": "A short history of the web",
    "subtitle": "From one proposal to billions of pockets",
    "tag": "Timeline",
    "seconds": 6
  });
});
