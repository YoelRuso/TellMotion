# Changelog

All notable changes are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- `connect(parent, a, b)`: an arrow between two pieces, with the elbows it needs.
- `Packet` shapes (`dot`, `diamond`, `envelope`) and `Piece.ping()`; `send(..., {to: piece})` makes the piece react on arrival.
- `BarChart` value labels accept `prefix`, `suffix` and `decimals`.
- Every piece now shares `appear()`, `glow()`, `ping()`, `dim()` and `hide()` through a `Group` base class; a test checks it.
- `mark()` and `unmark()` on every boxed piece, such as `TreeNode` and `Box`.
- Labels wrap inside their piece and shrink if they still do not fit.
- A demo for the `cloud` pack, and `npm run sheets:packs` to review the packs in contrasting themes.
- Website: five playable example videos: Git branches, DNS, quicksort, the water cycle and the history of the web.
- `examples/`: the projects behind quicksort, the water cycle and the history of the web.

### Fixed
- `Bar`: the label now follows `setValue()`.
- `Cell`: text stays readable after `mark()` and `unmark()` in themes with color-filled boxes.
- `BarChart`: `update()` adapts the scale to values beyond the top of the plot.
- `LineChart`: each dot appears when the line reaches it.
- `PieChart`: slices that had not swept in yet drew a stray line over whatever was behind them.
- `DataIO`: arrows reach its slanted sides.
- `Queue`: messages were invisible in themes with color-filled boxes.
- `Terminal`: long lines wrap and old rows scroll away instead of leaving the window.
- Website hero: the animated packets now tell one story in order (request, database, event, consumers), match the legend and no longer restart when the theme changes.
- Reference diagram: the arrow between Orders and the Event Bus now points to the bus, since Orders publishes to it.
- Captions and the `compare` badge were unreadable in themes whose surface is as light as their text.
- The `outro` list is centered under the title when its ideas are short.

### Changed
- `Packet` follows its route without stopping at corners, and by default takes a time that depends on the distance.
- `storyboard.mjs validate` warns when a scene has more text than can be read in its length.
- From a first test with a real agent: `SKILL.md` asks for only the packs the custom scenes use, to stop the preview server after approval, and to update `CLAUDE.md` only if the workspace has one.

## [0.2.0] - 2026-11-02

### Added
- `npm run render`: exports a project without opening the editor, in a headless browser. Options: `--format mp4,webm,gif`, `--aspect 9:16,1:1` (fits the video with bars, without re-laying out the scenes), `--thumb`, `--thumb-at`, `--pad-color`, `--draft`, `--fps`, `--scale`.
- `--info` prints the duration of each scene without rendering, and `--dry-run` prints a rough size range per file from rendered samples.
- Six scene recipes in every new project: `intro`, `chapter`, `compare`, `beforeAfter`, `steps`, `outro`, with text limits and test content.
- Storyboard step: `tools/storyboard.mjs` validates a `storyboard.json`, shows it as a themed page for the user to approve, generates the scenes (keeping those edited by hand) and compares planned and real durations.
- `npm run sheets`: renders every recipe in contrasting themes and writes contact sheets to review.
- `test:smoke` now runs a real render and the whole storyboard flow.

### Changed
- The skill asks the user to approve a storyboard before animating, and uses recipes instead of writing those scenes from scratch.
- `prepareScene` takes an optional `{legend: false}`, and `Scene.tsx` exports `captionFill`.
- `doctor` reports whether a browser for rendering is available. A missing browser does not make it fail.

### Notes
- Render has been tested on Windows with Chrome only. WebM depends on the ffmpeg build included for each platform; the command warns before rendering if it is missing.
- Rendering relies on Motion Canvas' `Renderer`, which is not a public API.

## [0.1.0] - 2026-11-02

First public version.

### Added
- The `tellmotion` skill: brief → design (template, custom or bring-your-own) → Motion Canvas animation → verification.
- Theme format (`theme.json`), validator, preview generator that needs no Figma, and `apply-theme`.
- 24 themes: Aurora Glass, Blueprint, Chalkboard, Circuit Board, Clean Editorial, Corporate Blue, Cyanotype, Desert Sand, Forest Canopy, HUD Cyan, Industrial Amber, Ink & Paper, Neo Brutal, Neon Night, Newsprint, Notebook, Obsidian Gold, Ocean Deep, Peach Sunrise, Retro Terminal, Soft Clay, Sticker Pop, Swiss Minimal, Synthwave.
- New theme decorations: horizon, topbar, ruled-lines, waves, masthead, traces (in the preview renderer and the Motion Canvas background).
- Generic Motion Canvas template and 8 component packs: cloud, algorithms, charts, flowchart, timeline, code, typography, science.
- Project scaffolder (`new-project.sh`) with `--theme`, `--pack` and `--demos`.
- Website (Astro) with a live theme demo, searchable gallery and install guide.
- `llms.txt` for agent-assisted install, `doctor` tool, tests and CI.
