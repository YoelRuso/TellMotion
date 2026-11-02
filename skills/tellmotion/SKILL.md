---
name: tellmotion
description: Turn an idea into a polished 2D explainer animation (1920x1080) - pick a ready-made visual theme or design a custom one, then build the animation with Motion Canvas (TypeScript). Use when the user asks for an animated explainer, diagram/flow/process/architecture animation, "make a video about X", or wants to add scenes to an existing TellMotion project.
---

# TellMotion — idea → theme → animation

One repeatable flow, cheap in tokens. Works for any topic that fits 2D: diagrams, processes, architectures, algorithms, timelines, concepts. (Not for 3D or live-action video.)

Layout of this skill: `themes/` (theme.json catalog) · `tools/` (Node, zero deps) · `assets/base` (Motion Canvas template) · `assets/packs/` (optional component packs) · `scripts/new-project.sh` · `references/`.

## 1. Brief (one round, ask only what is missing)
If the user already gave content/structure, do not ask again. Use `AskUserQuestion` (max 4 questions) for what is missing:
1. **Topic and content** (if absent: propose an invented one and say so).
2. **Length / pace** (default: calm pace, scenes of 20-60 s) and fps (default 30 preview / 60 render).
3. **Design** — always offer these three options:
   - **Template**: use a theme from the catalog. Run `node tools/list-themes.mjs` (compact list) and ask for the id; to browse visually run `node tools/build-catalog.mjs <tmpdir>` and open `gallery.html` (serve with `node tools/serve.mjs <tmpdir>`).
   - **Custom design**: write 3 contrasting `theme.json` proposals (see `references/theme-format.md`), render previews and let the user choose (step 2).
   - **Bring your own**: user supplies brand colors/fonts or a Figma file → derive a `theme.json` from it.
4. **Packs**: infer from the topic, do not ask unless unclear: `cloud` (architectures), `algorithms` (sorting, trees), `charts` (data), `flowchart` (processes), `timeline` (history/roadmaps), `code` (programming, CLI), `typography` (intros, quotes, A vs B), `science` (cycles, layers, waves). Combine freely; `references/packs.md` lists every component.

After the brief, work autonomously until delivery.

## 2. Custom design (skip when a template was chosen)
1. Write 3 proposals as `theme.json` files in a temp folder (copy the closest catalog theme and change tokens; different families, e.g. technical / playful / editorial).
2. `node tools/validate.mjs <file>` for each, then `node tools/build-catalog.mjs <out> --themes <folder>`.
3. Show previews: open `<out>/gallery.html` in the browser pane (`serve.mjs`) or send the SVGs. Wait for the user's choice.
4. Optional high-fidelity route with Figma (only if the user wants it and the Figma connector exists): `references/figma.md`.
5. Save the chosen theme as `<project>/theme.custom.json` (and offer to contribute it to the catalog).

## 3. Project
```bash
bash <skill>/scripts/new-project.sh <name> --theme <id|path.json> [--pack a,b|all] [--demos]
```
(`--demos` copies each pack's demo scene: handy to learn an API, then delete the demos.)
Run it from the folder that should contain the project. One project per topic; add scenes to it for new videos. It copies the template, applies the theme (`src/theme.ts`, `src/fonts.ts`), installs dependencies and registers the project in `.claude/launch.json`. Change theme later: `node <skill>/tools/apply-theme.mjs <theme> <project>` then `npm install`.

## 4. Scenes
Read `references/motion-guide.md` (core API, layout recipe, pitfalls) and `references/packs.md` (pack components). Fixed rules:
- One scene per block in `src/scenes/`, registered in `src/project.ts` (+ a `.meta` file per scene).
- Use `prepareScene(view, title)`; call `enter()` first and `leave()` last; captions via `sub.say(text)`.
- Text ≥ 28 px at 1920x1080; captions ≤ 85 characters; one category color per element type + legend in `src/config.ts` (`LEGEND`).
- Show only what is needed per scene; `glow()` the active element and `dim()` the rest.
- Editable text, timings and colors as constants at the top of each scene (`EDITABLE TEXT` comment); global speed in `PACE`.
- Events/requests/data = `send(root, points, {name})`.
- Never hard-code colors or fonts in scenes: use `C`, `S`, `FONT`, `fs()` from `config.ts` so themes stay swappable.

## 5. Verify (cheap)
1. `npm run typecheck` in the project.
2. `preview_start` (project name from `.claude/launch.json`), `resize_window` 1700x950, then click the timeline and `zoom` on `[215,0,800,330]`; batch several clicks+zooms in one `browser_batch`. `scroll right` on the timeline to reach later scenes.
3. When done: `resize_window` preset `desktop`, `preview_stop`. Do not render mp4 unless asked.

## 6. Render (when asked)
`npm run render` in the project writes `output/<name>/<name>.mp4` and `render.json` (duration per scene), without opening the editor. Options: `--fps <n>`, `--scale <n>`; use `--fps 30` for a faster draft. Needs Chrome, Edge or Chromium (`CHROME` overrides the path). Projects created before this script existed: `node <skill>/tools/render.mjs <project>`. The source is `tools/render.mjs`.

## 7. Deliver
List scenes (name → what it shows), how to run (`npm start`), how to render (`npm run render`), how to change pace (`PACE`), texts (constants per scene), theme (`apply-theme.mjs`). State what was not verified. Update the workspace `CLAUDE.md` with the new project.

## Token savings
- Do not re-read files you just wrote; use `Edit`.
- Use `list-themes.mjs` instead of reading theme JSON files; read a single theme only when customizing.
- Batch screenshots/zooms; avoid full-page captures.
- Reuse `assets/` instead of regenerating components.
