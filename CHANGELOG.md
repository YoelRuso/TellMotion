# Changelog

All notable changes are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/) and the project uses [Semantic Versioning](https://semver.org/).

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
