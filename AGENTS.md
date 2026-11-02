# AGENTS.md

Guidance for AI agents working **on this repository** (not for agents *using* the skill — that is `skills/tellmotion/SKILL.md`).

## What this repo is
TellMotion turns an idea into a 2D explainer animation: a skill (instructions + tools + templates), a theme catalog and a website. All text in the repo is **English**.

## Map
```
skills/tellmotion/       the distributable skill
  SKILL.md               agent instructions (the flow)
  themes/*.json          one file per visual theme (source of truth)
  tools/                 zero-dependency Node tools (validate, build-catalog, apply-theme, list-themes, doctor, serve)
  assets/base/           Motion Canvas project template
  assets/packs/<pack>/   optional component packs (*.tsx, pack.json, demo/)
  references/            guides loaded on demand by the skill
  scripts/new-project.sh scaffolds a project from the template
site/                    Astro website, generated from the themes (see site/README.md)
scripts/                 repo maintenance (readme-assets.mjs, smoke.mjs)
test/                    node:test suites
llms.txt                 agent-readable install instructions
```

## Commands
```bash
npm test                 # unit tests: themes, skill structure, versions
npm run validate         # validate every theme
npm run doctor           # check the skill is complete
npm run catalog          # rebuild site/public/themes.json + previews
npm run test:smoke       # scaffold + install + typecheck with all packs (slow, needs network)
npm run assets           # regenerate README images (needs Chrome + ffmpeg)
cd site && npm run build # build the website
```

## Rules
- **Themes are data.** To add or change a look, edit/create `skills/tellmotion/themes/<id>.json` (id = file name, kebab-case) and run `npm run validate` and `npm test`. Format: `skills/tellmotion/references/theme-format.md`. Fonts must be open-licensed and available as `@fontsource/<slug>`.
- **Never hand-edit generated files:** `site/public/themes.json`, `site/public/previews/`, `site/src/lib/render-preview.mjs`, anything `apply-theme.mjs` writes into a project (`src/theme.ts`, `src/fonts.ts`).
- **Tools stay dependency-free** (Node built-ins only).
- **Template and packs read the theme** through `src/config.ts` (`C`, `S`, `FONT`, `fs()`, `t()`); never hard-code colors or fonts in components.
- **Text >= 28 px** at 1920x1080 in template/pack demos; captions <= 85 characters.
- After touching `assets/`, scaffold a project and type-check it (`npm run test:smoke`).
- Bump the version in `package.json`, `llms.txt` and `CHANGELOG.md` together (a test checks they match).
- Licensing: code MIT, themes/site content CC BY 4.0. Do not add assets or fonts without a compatible license.

## Known pitfalls
- In JSX `.map()` rendering several siblings that need refs/signals, wrap them in one `<Node>`, not a fragment.
- `figma.createVector` does not render; use `createNodeFromSvg`. The Figma helper is not tested end to end.
- Old ffmpeg builds lack `xfade`; `readme-assets.mjs` blends frames manually.
