# Scene recipes

Tested scenes that come with every project in `src/recipes/`. Prefer a recipe over writing a scene from scratch: fewer tokens, consistent results, and fixing a recipe improves every scene that uses it.

A scene that uses a recipe is only data:

```tsx
import {makeScene2D} from '@motion-canvas/2d';
import {compare} from '../recipes/compare';

export default makeScene2D(function* (view) {
  yield* compare(view, {
    title: 'Merge vs Rebase',
    left: {label: 'Merge', points: ['Keeps history', 'Adds a merge commit']},
    right: {label: 'Rebase', points: ['Linear history', 'Rewrites commits']},
    winner: 'left',
  });
});
```

Register it in `src/project.ts` and give it a `.meta` file, like any scene. Recipes read the theme, so they work with all of them. Headers carry no legend. Text labels such as "Before" and "After" can be replaced through props, so any language works.

## Catalog

The numbers are the limits the recipes were tested with, in characters unless they say otherwise. Exact rules: `assets/recipes/<id>.json`.

| Function (file) | Use it when | Props |
|---|---|---|
| `intro` (`recipes/intro`) | First scene of a video | `title` 60 · `subtitle?` 120 · `tag?` 40 · `hold?` |
| `chapter` (`recipes/chapter`) | Between parts of a video over about 2 minutes | `title` 60 · `number?` 3 · `subtitle?` 80 · `hold?` |
| `compare` (`recipes/compare`) | Two options exist at once and must be told apart | `title` 70 · `left`, `right`: {`label` 24, `points` up to 5 of 70} · `captions?` up to 2 of 85 · `winner?` `left`/`right` · `hold?` |
| `beforeAfter` (`recipes/before-after`) | One thing changes over time | `title` 70 · `before`, `after`: {`label?` 22, `points` up to 5 of 65} · `captions?` up to 2 of 85 · `hold?` |
| `steps` (`recipes/steps`) | Ordered process of 2 to 5 stages, no branches | `title` 70 · `steps`: 2 to 5 of {`label` 28, `detail?` 110} · `caption?` 85 · `stepHold?` · `hold?` |
| `outro` (`recipes/outro`) | Last scene of a video | `title` 50 · `takeaways?` up to 3 of 90 · `credits?` up to 4 of {`role` 24, `name` 40} · `cta?` 50 · `hold?` |

All of them also take `seconds`, the total length of the scene: the pauses grow to reach it, and `storyboard.mjs generate` fills it in. `hold` and `stepHold` are the least seconds to pause, and follow `PACE` like every other timing.

Approximate time the animation needs at normal pace, measured with short content. Plan at least this, and more when there is a lot to read: `intro` 5 s · `compare` 7 s with 2 points per side, about 2 s more per extra pair · `beforeAfter` 9 s with 2 points per side · `steps` 4 s per step · `outro` 6 s.

## What recipes do not cover

The scene that actually explains the topic (a commit graph, a sorting run, an architecture) is usually custom: build it from the core components and packs. Recipes are the frame around it. If a recipe almost fits, copy it into the scene and change it there rather than editing `src/recipes/` for one video.

Past the limits, text may shrink to the minimum size or overflow. Shorten the text instead of raising a limit.
