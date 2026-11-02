# TellMotion website

Static site built with [Astro](https://astro.build). The theme gallery, the live hero demo and the counters are **generated from `skills/tellmotion/themes/*.json`** — adding a theme there adds it to the site on the next build.

```bash
cd site
npm install
npm run dev        # syncs the catalog, then starts http://localhost:4321
npm run build      # outputs dist/
```

`npm run sync` (run automatically by dev/build) does two things:
1. `skills/tellmotion/tools/build-catalog.mjs` → writes `public/themes.json` and `public/previews/*.svg`.
2. Copies `tools/lib/render-preview.mjs` to `src/lib/` so the browser can render live previews with the same code.

Those generated files are git-ignored.

## Configure
- Repository URL, name and texts: `src/config.ts` (replace `YOUR-USER` in `GITHUB_URL`).
- Sections: `src/components/` (Hero, HowItWorks, Packs, Gallery, Examples, Install, Faq).
- Look and feel: `src/styles/global.css` (design tokens at the top).

## Deploy to GitHub Pages
The workflow in `.github/workflows/deploy-site.yml` builds and publishes on every push to `main`. In the repository settings enable **Pages → Source: GitHub Actions**. For a project page the base path is set automatically (`/<repo>`); for a custom domain set `BASE_PATH=/` and `SITE_URL`.

## Examples section
The three example cards are placeholders ("Coming soon"). When `examples/` has rendered videos, replace the thumbnail with a `<video>` in `src/components/Examples.astro`.
