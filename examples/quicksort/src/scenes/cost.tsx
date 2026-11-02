// GENERATED from storyboard.json (b467730c0bc3). If you edit this file, "storyboard.mjs generate" keeps your version.
import {makeScene2D} from '@motion-canvas/2d';
import {compare} from '../recipes/compare';

export default makeScene2D(function* (view) {
  yield* compare(view, {
    "title": "How fast is it?",
    "left": {
      "label": "Usually",
      "points": [
        "Splits near the middle",
        "About n log n steps"
      ]
    },
    "right": {
      "label": "Worst case",
      "points": [
        "Splits very unevenly",
        "About n² steps"
      ]
    },
    "captions": [
      "A good pivot makes all the difference."
    ],
    "seconds": 11
  });
});
