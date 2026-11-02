#!/usr/bin/env node
// Usage: node tools/validate.mjs            -> validates every theme in themes/
//        node tools/validate.mjs my.json    -> validates a single file
import {basename} from 'node:path';
import {loadAllThemes, loadTheme, validateTheme} from './lib/theme.mjs';

const arg = process.argv[2];
const list = arg ? [{file: basename(arg), theme: loadTheme(arg)}] : loadAllThemes();
let bad = 0;
for (const {file, theme} of list) {
  const errs = validateTheme(theme, file);
  if (errs.length) {
    bad++;
    console.error(`✗ ${file}`);
    errs.forEach(e => console.error(`    - ${e}`));
  }
}
console.log(bad ? `\n${bad} invalid theme(s)` : `✓ ${list.length} theme(s) valid`);
process.exit(bad ? 1 : 0);
