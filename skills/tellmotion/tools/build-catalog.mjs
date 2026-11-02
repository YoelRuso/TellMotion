#!/usr/bin/env node
// Usage: node tools/build-catalog.mjs <outDir>
// Writes <outDir>/previews/<id>.svg, <outDir>/themes.json (catalog) and <outDir>/gallery.html.
import {mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fullPrompt, loadAllThemes, validateTheme} from './lib/theme.mjs';
import {renderPreview} from './lib/render-preview.mjs';

const args = process.argv.slice(2);
const ti = args.indexOf('--themes');
const themesDir = ti >= 0 ? args.splice(ti, 2)[1] : undefined;
const noGallery = args.includes("--no-gallery");
const out = args.filter(a => a !== "--no-gallery")[0];
if (!out) {
  console.error('Usage: build-catalog.mjs <outDir> [--themes <dir>]');
  process.exit(1);
}
mkdirSync(join(out, 'previews'), {recursive: true});

const catalog = [];
for (const {file, theme} of loadAllThemes(themesDir)) {
  const errs = validateTheme(theme, file);
  if (errs.length) {
    console.error(`✗ ${file}: ${errs.join('; ')}`);
    process.exit(1);
  }
  writeFileSync(join(out, 'previews', `${theme.id}.svg`), renderPreview(theme));
  catalog.push({
    id: theme.id,
    name: theme.name,
    family: theme.family,
    moods: theme.moods,
    description: theme.description,
    fonts: {family: theme.fonts.family, google: theme.fonts.google},
    tokens: theme,
    palette: {background: theme.colors.background, surface: theme.colors.surface, text: theme.colors.text, line: theme.colors.line, categories: theme.colors.categories},
    motion: theme.motion,
    prompt: theme.prompt,
    promptFull: fullPrompt(theme),
    preview: `previews/${theme.id}.svg`,
  });
}
writeFileSync(join(out, 'themes.json'), JSON.stringify(catalog, null, 2));

const cards = catalog
  .map(
    t => `<figure><object type="image/svg+xml" data="${t.preview}" aria-label="${t.name}"></object><figcaption><b>${t.name}</b> <code>${t.id}</code><br><small>${t.family} · ${t.moods.join(', ')}</small></figcaption></figure>`,
  )
  .join('\n');
if (!noGallery) writeFileSync(
  join(out, 'gallery.html'),
  `<!doctype html><meta charset="utf-8"><title>TellMotion themes</title><style>body{font:16px system-ui;background:#111;color:#eee;margin:24px}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:20px}figure{margin:0}object{width:100%;aspect-ratio:16/9;border-radius:8px;display:block;pointer-events:none}code{color:#9ec1f2}</style>
<h1>TellMotion themes (${catalog.length})</h1><div class="g">${cards}</div>`,
);
console.log(`✓ ${catalog.length} themes → ${out}`);
