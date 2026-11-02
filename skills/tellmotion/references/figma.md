# Optional: high-fidelity design in Figma

TellMotion does **not** require Figma: previews come from `tools/build-catalog.mjs`. Use Figma only when the user wants to refine a design visually and the Figma MCP connector is available.

1. `whoami` → `planKey` (ask which team if several). Figma cannot create folders via API: the file lands in drafts.
2. Load once with `get_figma_skill`: `skill://figma/figma-create-new-file/SKILL.md`, `figma-use`, `figma-generate-design`; pass `skillNames: "figma-use,figma-generate-design"` to `use_figma`.
3. `create_new_file` (design) → `create_session` → ONE `use_figma` call that builds every artboard (1920x1080, same content per theme). Paste `assets/figma-helpers.js` at the top; it converts a theme.json into Figma nodes.
4. Verify: `get_screenshot` (maxDimension 1200) in parallel → download with `curl` → `Read`. Fix with ONE patch call (edit existing nodes).
5. When the user picks one, export its tokens back into a `theme.json`.

Status: `figma-helpers.js` is a port of the helpers used in a working run, adapted to the theme.json schema but **not yet tested end to end** (the gradient transform especially). Verify with a screenshot.

Known traps: `createVector` does not render (use `createNodeFromSvg`); monospace strings overflow (≈0.6×fontSize/char); auto-layout children that need absolute placement require `layoutPositioning = 'ABSOLUTE'`; Inter styles are "Semi Bold"/"Bold" with a space.
