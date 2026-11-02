// GENERATED from storyboard.json (980ee8ecd7ff). If you edit this file, "storyboard.mjs generate" keeps your version.
import {makeScene2D} from '@motion-canvas/2d';
import {intro} from '../recipes/intro';

export default makeScene2D(function* (view) {
  yield* intro(view, {
    "title": "The water cycle",
    "subtitle": "The same water, travelling around the planet",
    "tag": "Science for kids",
    "seconds": 6
  });
});
