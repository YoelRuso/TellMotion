# Contributing

## Add a theme
1. Copy a similar theme in `skills/tellmotion/themes/` and rename it (`<id>.json`, kebab-case; the file name must equal `id`).
2. Edit the tokens (see `skills/tellmotion/references/theme-format.md`). Use only open-licensed fonts available on Google Fonts and as `@fontsource/<slug>`.
3. `npm run validate` and `npm test` — must pass (tests also check contrast and that every theme renders).
4. `node skills/tellmotion/tools/build-catalog.mjs site/public` and check your preview in `gallery.html`.
5. Open a pull request. Themes are shared under CC BY 4.0.

A good theme is *distinct* (not just a recolor): vary shape, background, shadow, fonts and motion (`pace`, `easing`, `entrance`).

## Code
Code contributions are under the MIT license. Keep tools dependency-free (Node built-ins only) and run `npm run typecheck` in a scaffolded project when touching `assets/`.

## Before opening a PR
`npm test` must pass. If you touched `skills/tellmotion/assets/`, also run `npm run test:smoke` (scaffolds a project with every pack and type-checks it). See [AGENTS.md](AGENTS.md) for the repo map and rules.
