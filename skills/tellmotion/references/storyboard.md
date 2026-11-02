# Storyboard format

`storyboard.json` lists the scenes of a video. The user approves it before anything is animated, and `generate` turns it into code. It stays in the project as the record of what was agreed.

```json
{
  "title": "How Git branches work",
  "targetSeconds": 75,
  "scenes": [
    {
      "id": "opening",
      "recipe": "intro",
      "shows": "Title and what the viewer will learn",
      "seconds": 7,
      "props": {"title": "How Git branches work", "subtitle": "They are much cheaper than you think"}
    },
    {
      "id": "pointer",
      "recipe": "custom",
      "shows": "A branch is a label that moves along a chain of commits",
      "seconds": 14,
      "props": {"title": "A branch is a pointer", "captions": ["Commits form a chain.", "A branch is only a label on one of them."]}
    }
  ]
}
```

| Field | Rules |
|---|---|
| `title` | Required. Name of the video |
| `targetSeconds` | Optional. `validate` warns when the scenes add up to more than 20% away from it |
| `scenes[].id` | Required, unique, kebab-case, starts with a letter. It is the scene's file name |
| `scenes[].recipe` | Required. A recipe id from `references/recipes.md`, or `custom` |
| `scenes[].shows` | Required. What the viewer sees, in plain words |
| `scenes[].seconds` | Required. Length of the scene |
| `scenes[].props` | The real text. For a recipe, its props. For `custom`: `title` (70 characters) and `captions` (85 each) |

Write the real text, not placeholders: it is what the user is approving, and `validate` checks it against the limits.

## Choosing scenes
- Open with `intro` and close with `outro` unless the video is part of something bigger. Add `chapter` only over about 2 minutes.
- Use `custom` for what really explains the topic: a recipe cannot draw your commit graph.
- One idea per scene.

## Commands
```bash
node tools/storyboard.mjs validate storyboard.json
node tools/storyboard.mjs preview storyboard.json --theme blueprint --out <dir>   # <dir>/storyboard.html, to show the user
node tools/storyboard.mjs generate storyboard.json <project>                      # scenes + src/project.ts
node tools/storyboard.mjs duration <project>                                      # planned vs real seconds (needs npm install and a browser)
```

`generate` can be re-run after changing the storyboard. It updates generated scenes, keeps the ones edited by hand and says which (`--force` overwrites them), and rewrites `src/project.ts`. It does not delete scene files that left the storyboard. If `src/project.ts` lists scenes the storyboard does not know about, it stops: add them to the storyboard, or use `--force` to drop them from the video.

## Timing
Give the viewer time to read: `validate` warns when a scene has more than about 3 words per second. Lengthen the scene or cut text; do not ignore the warning. Recipe scenes stretch their pauses to reach `seconds`, but never cut their animation short. Scenes planned shorter than their animation run long, and `duration` flags them. See the minimums in `references/recipes.md`.
