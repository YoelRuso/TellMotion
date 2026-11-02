// GENERATED from storyboard.json (3440acc19e0c). If you edit this file, "storyboard.mjs generate" keeps your version.
import {makeScene2D} from '@motion-canvas/2d';
import {beforeAfter} from '../recipes/before-after';

export default makeScene2D(function* (view) {
  yield* beforeAfter(view, {
    "title": "Then and now",
    "before": {
      "label": "1993",
      "points": [
        "Hundreds of websites",
        "Mostly text and links",
        "Used from a desk"
      ]
    },
    "after": {
      "label": "Today",
      "points": [
        "Over a billion websites",
        "Video, apps and live data",
        "Used from anywhere"
      ]
    },
    "seconds": 13
  });
});
