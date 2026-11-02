# theme.json format

A theme is one JSON file in `themes/<id>.json` (`id` = file name, kebab-case). Validate with `node tools/validate.mjs [file]`.

```jsonc
{
  "id": "blueprint", "name": "Blueprint",
  "family": "technical",            // technical|editorial|playful|neon|retro|academic|futuristic|nature|corporate|dark|light
  "moods": ["precise", "calm"],     // free tags, used for search/filters
  "description": "One sentence for the gallery.",
  "prompt": "Natural-language style brief a person (or an AI) can paste into a prompt.",
  "fonts": { "family": "IBM Plex Mono", "fontsource": "ibm-plex-mono",   // npm: @fontsource/<slug>
             "google": "IBM+Plex+Mono:wght@400;700", "fallback": "monospace",
             "weights": [400, 700], "scale": 1 },                       // scale 0.8-1.6 for fonts that render small
  "colors": { "background": "#0d3b73", "surface": "#0f4585", "text": "#e8f1ff", "muted": "#9ec1f2",
              "line": "#cfe3ff", "stroke": "#5ad1ff",                    // stroke optional
              "onAccent": "#0d3b73", "async": "#ffd86b", "ok": "#7dff9b", "error": "#ff6b6b",
              "categories": ["#..","#..","#..","#..","#.."],            // exactly 5
              "tints": ["#..","#..","#..","#..","#.."] },               // only if shape.fill = "tint"
  "background": { "kind": "grid", "color": "#ffffff", "opacity": 0.06, "step": 48 },   // solid|grid|dots|gradient
  "shape": { "radius": 4, "stroke": 2, "dash": null,                    // dash: null or [dash, gap]
             "fill": "surface",         // surface|accent|tint|none|glass
             "strokeFrom": "line",      // line|accent|stroke
             "shadow": "none",          // none|soft|hard|glow|clay
             "doubleBorder": false },
  "motion": { "pace": 1, "easing": "inOutCubic", "entrance": "pop" },    // pace 0.5-2 (>1 slower); easing inOutCubic|inOutSine|inOutQuad|linear; entrance pop|fade|slide
  "decor": ["title-block"]          // optional: scanlines|hazard-stripes|corner-marks|title-block|step-numbers|dimension-line|stamp|dust|blobs|horizon|topbar|ruled-lines|waves|masthead|traces
}
```

Rules of thumb
- Pick categories with good contrast against `background`; text must be readable on `surface` (or on the accent when `fill = accent`, using `onAccent`).
- Fonts must be open-licensed (OFL/Apache) and available on Google Fonts and as `@fontsource/<slug>`.
- Gradient: `"gradient": {"angle": 135, "stops": [["#hex", 0], ["#hex", 1]]}`.
- Make themes differ in motion too (`pace`, `easing`, `entrance`), not only in color.

Tools
- `node tools/list-themes.mjs [family]` — compact list.
- `node tools/build-catalog.mjs <out> [--themes <dir>]` — SVG previews + `themes.json` + `gallery.html`.
- `node tools/apply-theme.mjs <id|file> <projectDir>` — writes `src/theme.ts` and `src/fonts.ts`.
