import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fullPrompt, loadAllThemes, validateTheme} from '../skills/tellmotion/tools/lib/theme.mjs';
import {renderPreview} from '../skills/tellmotion/tools/lib/render-preview.mjs';

const themes = loadAllThemes();

test('there is at least one theme', () => {
  assert.ok(themes.length > 0);
});

test('theme ids are unique', () => {
  const ids = themes.map(t => t.theme.id);
  assert.equal(new Set(ids).size, ids.length);
});

for (const {file, theme} of themes) {
  test(`theme ${theme.id} is valid`, () => {
    assert.deepEqual(validateTheme(theme, file), []);
  });

  test(`theme ${theme.id} renders a preview and a prompt`, () => {
    const svg = renderPreview(theme);
    assert.match(svg, /^<svg /);
    assert.ok(svg.includes(theme.name.replace(/&/g, '&amp;')), 'the SVG should carry the (XML-escaped) theme name');
    assert.ok(fullPrompt(theme).includes(theme.id));
  });

  test(`theme ${theme.id} has readable text on its background`, () => {
    // WCAG-style contrast between main text and background/surface (alpha colors are skipped)
    const lum = hex => {
      const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
    const c = theme.colors;
    const solid = v => /^#[0-9a-f]{6}$/i.test(v);
    if (solid(c.text) && solid(c.background) && theme.background.kind !== 'gradient') {
      assert.ok(ratio(c.text, c.background) >= 4.5, `text/background contrast ${ratio(c.text, c.background).toFixed(2)} < 4.5`);
    }
  });
}

test('an invalid theme is rejected', () => {
  assert.ok(validateTheme({id: 'Bad Id'}).length > 0);
});

test('inline previews of different themes never share ids', () => {
  const ids = new Map();
  for (const {theme} of themes) {
    for (const m of renderPreview(theme).matchAll(/ id="([^"]+)"/g)) {
      assert.ok(!ids.has(m[1]) || ids.get(m[1]) === theme.id, `id "${m[1]}" is used by ${ids.get(m[1])} and ${theme.id}`);
      ids.set(m[1], theme.id);
    }
  }
});
