# Changelog

All notable changes are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/) and the project uses [Semantic Versioning](https://semver.org/).

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
