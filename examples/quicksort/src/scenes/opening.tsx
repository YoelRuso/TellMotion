// GENERATED from storyboard.json (91b7cb47e47e). If you edit this file, "storyboard.mjs generate" keeps your version.
import {makeScene2D} from '@motion-canvas/2d';
import {intro} from '../recipes/intro';

export default makeScene2D(function* (view) {
  yield* intro(view, {
    "title": "Quicksort, visualized",
    "subtitle": "Sort a list by splitting it around one number",
    "tag": "Algorithms",
    "seconds": 6
  });
});
