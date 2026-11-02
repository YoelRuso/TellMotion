#!/usr/bin/env node
// Compact catalog listing (token-cheap): id | name | family | moods | font. Usage: node tools/list-themes.mjs [family]
import {loadAllThemes} from './lib/theme.mjs';

const family = process.argv[2];
const rows = loadAllThemes().map(({theme: t}) => t).filter(t => !family || t.family === family);
for (const t of rows) console.log(`${t.id.padEnd(18)} ${t.name.padEnd(18)} ${t.family.padEnd(11)} ${t.moods.join(',').padEnd(34)} ${t.fonts.family}`);
console.log(`\n${rows.length} theme(s)`);
