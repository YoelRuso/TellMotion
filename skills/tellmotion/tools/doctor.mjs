#!/usr/bin/env node
// Verifies that an installed copy of the TellMotion skill is complete and usable.
// Usage: node tools/doctor.mjs      (exit code 0 = ready)
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadRecipes, validateProps} from './lib/recipes.mjs';
import {loadAllThemes, validateTheme} from './lib/theme.mjs';
import {renderPreview} from './lib/render-preview.mjs';
import {findBrowser} from './render.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;
const ok = msg => console.log(`  ✓ ${msg}`);
const bad = msg => {
  failed++;
  console.log(`  ✗ ${msg}`);
};
const check = (cond, good, fail) => (cond ? ok(good) : bad(fail));

console.log('TellMotion doctor');

const major = Number(process.versions.node.split('.')[0]);
check(major >= 18, `Node ${process.versions.node}`, `Node ${process.versions.node} is too old (need 18+)`);

// SKILL.md
const skillMd = join(root, 'SKILL.md');
if (existsSync(skillMd)) {
  const text = readFileSync(skillMd, 'utf8');
  check(/^---\nname: tellmotion\n/.test(text) && /\ndescription: .+/.test(text), 'SKILL.md has a valid header', 'SKILL.md header is missing name/description');
} else bad('SKILL.md not found');

// references and scripts
for (const f of ['references/theme-format.md', 'references/motion-guide.md', 'references/packs.md', 'references/recipes.md', 'references/storyboard.md', 'tools/storyboard.mjs', 'scripts/new-project.sh', 'tools/apply-theme.mjs', 'tools/validate.mjs', 'tools/build-catalog.mjs', 'tools/list-themes.mjs', 'tools/render.mjs']) {
  check(existsSync(join(root, f)), f, `missing ${f}`);
}

// template
for (const f of ['package.json', 'tsconfig.json', 'vite.config.ts', 'src/config.ts', 'src/project.ts', 'src/components/Scene.tsx', 'src/components/Piece.tsx', 'src/components/Box.tsx', 'src/components/Arrow.tsx', 'src/components/Packet.tsx']) {
  check(existsSync(join(root, 'assets/base', f)), `template: ${f}`, `template is missing ${f}`);
}

// packs
const packsDir = join(root, 'assets/packs');
if (existsSync(packsDir)) {
  const packs = readdirSync(packsDir, {withFileTypes: true}).filter(d => d.isDirectory());
  check(packs.length > 0, `${packs.length} component pack(s)`, 'no component packs found');
  for (const p of packs) {
    const meta = join(packsDir, p.name, 'pack.json');
    if (!existsSync(meta)) bad(`pack ${p.name}: pack.json missing`);
    else {
      const comps = JSON.parse(readFileSync(meta, 'utf8')).components || [];
      const src = readdirSync(join(packsDir, p.name)).filter(f => f.endsWith('.tsx')).map(f => readFileSync(join(packsDir, p.name, f), 'utf8')).join('\n');
      const missing = comps.filter(c => !new RegExp(`(class|function\\*?)\\s+${c}\\b`).test(src));
      check(missing.length === 0, `pack ${p.name}`, `pack ${p.name}: components not found in sources: ${missing.join(', ')}`);
    }
  }
} else bad('assets/packs not found');

// recipes
const recipes = loadRecipes();
check(recipes.length > 0, `${recipes.length} scene recipe(s)`, 'no scene recipes found');
for (const r of recipes) {
  const hasCode = existsSync(join(root, 'assets/base/src/recipes', `${r.id}.tsx`));
  const errors = Object.values(r.fixtures).flatMap(f => validateProps(r, f));
  if (!hasCode) bad(`recipe ${r.id}: src/recipes/${r.id}.tsx missing`);
  else if (errors.length) bad(`recipe ${r.id}: ${errors[0]}`);
}

// themes
const themes = loadAllThemes();
check(themes.length > 0, `${themes.length} theme(s) found`, 'no themes found');
let invalid = 0;
for (const {file, theme} of themes) {
  const errs = validateTheme(theme, file);
  if (errs.length) {
    invalid++;
    bad(`${file}: ${errs[0]}`);
  } else if (!renderPreview(theme).startsWith('<svg')) {
    invalid++;
    bad(`${file}: preview could not be rendered`);
  }
}
if (!invalid) ok('all themes valid and renderable');

// optional: only rendering to video needs a browser
const browser = findBrowser();
console.log(browser ? `  ✓ browser for rendering: ${browser}` : '  ! no Chrome, Edge or Chromium found: "npm run render" will not work (set CHROME to its path)');

console.log(failed ? `\nNot ready: ${failed} problem(s).` : '\nTellMotion is ready.');
process.exit(failed ? 1 : 0);
