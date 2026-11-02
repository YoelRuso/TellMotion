# Motion Canvas guide (TellMotion template)

Components live in `src/components/`. Everything reads the active theme through `src/config.ts` (`C` colors, `S` shape, `FONT`, `fs()`, `t()`).

## Core components
- `prepareScene(view, title|null)` → `{root, sub, enter(), leave()}`; `sub.say(text)`, `sub.hide()`.
- `Box(parent,{x,y,label,color,w?,h?,pill?,fs?,weight?})` — the generic block; `setState(text,color)`.
- `Arrow(parent, points, {async?, color?, plain?})` — `draw(d)`, `hide()`, `show()`; elbows via extra points; `arrow.points` holds its route.
- `connect(parent, a, b, {from?, to?, async?, color?, plain?})` — arrow between two pieces of the same parent, with the elbows it needs. Prefer it to writing coordinates.
- `Packet` / `send(parent, points, {shape?, name?, color?, d?, below?, to?})` — marker that follows the points without stopping at corners. `shape`: `dot` for requests, `diamond` for events, `envelope` (default) for real messages such as emails. `d` is optional: by default the time depends on the distance. Pass `to: piece` and it reacts on arrival: `send(root, arrow.points, {shape: 'dot', to: gateway})`.
- `Piece` base (all boxes): `appear(d)`, `glow(on)`, `ping()` (brief reaction), `dim(on)`, `hide()`, and `left/right/top/bottom` points.
- Theme helpers: `boxProps(color)`, `textOn()`, `shadowOf(color)`.

## Cloud pack (`--pack cloud`)
`Service` (with `db` icon), `Queue` (`push(n)`, `pop(n)`, `dlq`), `Lambda` (λ badge), `Database` (cylinder). Build your own pack by extending `Piece` (see `assets/packs/cloud`).

## Layout recipe (1920x1080, origin at the center)
- Header y≈-500 (title + legend). Content y -440…+400. Caption y=455.
- Monospace text width ≈ `0.6 × fontSize × characters` (28 px ≈ 16.8 px/char). Compute before fixing `w`.
- Group elements per layer/phase in `Node`s and pass them as `parent` so they can be dimmed/hidden in bulk.
- Keep positions consistent across scenes for continuity; fade out what is not needed.
- Many small items (15+) → unlabeled mosaic + group labels ≥ 28 px; detail only in later scenes.

## Pitfalls
- Fonts: the theme's `fonts.ts` imports `@fontsource/*`; `enter()` waits for `document.fonts.load`.
- Color tweens: `box().stroke(color, t(0.3))`; to clear a fill use `'rgba(0,0,0,0)'`.
- `Line` with `end={0}` then `.end(1,d)` draws; `lineDash` and `endArrow` work together.
- Multiline `Txt` with `\n` and `textAlign={'center'}`; left-aligned lists need `textAlign={'left'}` + `lineHeight`.
- Floating labels: `stroke` in the background color + `strokeFirst` for legibility.
- Subtitle changes before a fade make a scene look "ahead" when scrubbing: order `fade → say` when it matters.
- Each scene needs a `.meta` file (`{"version":0,"timeEvents":[],"seed":N}`, unique seed).
- Vite uses the next free port if 9000 is busy.
- Effects Motion Canvas cannot do natively (backdrop blur, inner shadows): approximate with translucent fills / extra layers.
