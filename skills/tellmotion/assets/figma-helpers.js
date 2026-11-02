// Paste at the top of a `use_figma` script. Builds Figma nodes from a TellMotion theme.json object.
// Usage:  const th = await resolveTheme(THEME_JSON);  card(parent, th, 0..4, x, y, w, h, 'TAG', 'Name', 'sub');  svgArrow(...)
// Traps: figma.createVector does not render -> arrows use createNodeFromSvg. Colors are 0-1. Await every Promise.

const P = (h, o = 1) => {
  if (h.startsWith('rgba')) { const m = h.match(/[\d.]+/g).map(Number); return {type:'SOLID', color:{r:m[0]/255,g:m[1]/255,b:m[2]/255}, opacity:m[3] ?? o}; }
  const v = n => parseInt(h.slice(n, n + 2), 16) / 255;
  return {type:'SOLID', color:{r:v(1), g:v(3), b:v(5)}, opacity: h.length === 9 ? parseInt(h.slice(7, 9), 16) / 255 : o};
};
const rgb = h => P(h).color;
const shadow = (h, a, x, y, b) => ({type:'DROP_SHADOW', color:{...rgb(h), a}, offset:{x, y}, radius:b, spread:0, visible:true, blendMode:'NORMAL'});

async function resolveTheme(theme) {
  const avail = await figma.listAvailableFontsAsync();
  const fam = {};
  for (const f of avail) (fam[f.fontName.family] ||= new Set()).add(f.fontName.style);
  const wanted = theme.fonts.family;
  const bold = ['Bold', 'Semi Bold'].find(s => fam[wanted]?.has(s));
  const th = {...theme, f: fam[wanted]?.has('Regular') ? wanted : 'Inter', fs: theme.fonts.scale || 1};
  th.bold = fam[th.f]?.has('Bold') ? 'Bold' : (fam[th.f]?.has('Semi Bold') ? 'Semi Bold' : 'Regular');
  await figma.loadFontAsync({family: th.f, style: 'Regular'});
  await figma.loadFontAsync({family: th.f, style: th.bold});
  return th;
}

function artboardFill(th) {
  const b = th.background;
  if (b.kind !== 'gradient') return [P(th.colors.background)];
  const a = ((b.gradient.angle ?? 135) * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return [{type:'GRADIENT_LINEAR', gradientTransform:[[c, s, 0.5 - c / 2 - s / 2 + 0.5 * 0], [-s, c, 0.5 + s / 2 - c / 2]],
    gradientStops: b.gradient.stops.map(([col, pos]) => ({position: pos, color: {...rgb(col), a: 1}}))}];
}

function T(parent, chars, th, bold, size, color, x, y, ls) {
  const t = figma.createText();
  t.fontName = {family: th.f, style: bold ? th.bold : 'Regular'}; t.fontSize = size; t.characters = chars; t.fills = [P(color)];
  if (ls) t.letterSpacing = {unit:'PIXELS', value: ls};
  parent.appendChild(t); if (x !== undefined) { t.x = x; t.y = y; } return t;
}

// Horizontal/vertical arrow with head (SVG -> editable vector). dash: '10 8' or null.
function svgArrow(x1, y1, x2, y2, color, w, dash, head = true) {
  const pad = 14, minX = Math.min(x1, x2) - pad, minY = Math.min(y1, y2) - pad, W = Math.abs(x2 - x1) + pad * 2, H = Math.abs(y2 - y1) + pad * 2;
  const a = [x1 - minX, y1 - minY], b = [x2 - minX, y2 - minY], dx = Math.sign(x2 - x1), dy = Math.sign(y2 - y1), L = 14;
  const bx = b[0] - dx * L, by = b[1] - dy * L, px = -dy * 8, py = dx * 8, end = head ? [bx, by] : b;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  s += `<line x1="${a[0]}" y1="${a[1]}" x2="${end[0]}" y2="${end[1]}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
  if (head) s += `<polygon points="${b[0]},${b[1]} ${bx + px},${by + py} ${bx - px},${by - py}" fill="${color}"/>`;
  const n = figma.createNodeFromSvg(s + '</svg>'); n.x = minX; n.y = minY; n.name = 'Arrow'; return n;
}

// Themed card. cat = category index 0-4 (colors.categories[cat]).
function card(parent, th, cat, x, y, w, h, tag, name, sub, nameSize = 24) {
  const c = th.colors, s = th.shape, acc = c.categories[cat];
  const f = figma.createAutoLayout('VERTICAL'); parent.appendChild(f); f.name = name;
  f.resize(w, h); f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'FIXED';
  f.primaryAxisAlignItems = 'CENTER'; f.counterAxisAlignItems = 'CENTER'; f.itemSpacing = 4; f.x = x; f.y = y; f.cornerRadius = s.radius;
  f.fills = s.fill === 'accent' ? [P(acc)] : s.fill === 'tint' ? [P(c.tints[cat])] : s.fill === 'none' ? [] : s.fill === 'glass' ? [P('#ffffff', 0.16)] : [P(c.surface)];
  const sc = s.strokeFrom === 'accent' ? acc : s.strokeFrom === 'line' ? c.line : c.stroke;
  f.strokes = s.stroke ? [P(sc)] : []; f.strokeWeight = s.stroke; f.strokeAlign = 'INSIDE'; if (s.dash) f.dashPattern = s.dash;
  f.effects = s.shadow === 'soft' ? [shadow('#000000', 0.16, 0, 8, 24)] : s.shadow === 'hard' ? [shadow(c.line, 1, 8, 8, 0)] :
              s.shadow === 'glow' ? [shadow(acc, 0.5, 0, 0, 18)] : s.shadow === 'clay' ? [shadow(acc, 0.35, 0, 14, 28)] : [];
  if (s.doubleBorder) { const i = figma.createRectangle(); f.appendChild(i); i.layoutPositioning = 'ABSOLUTE'; i.resize(w - 14, h - 14); i.x = 7; i.y = 7; i.fills = []; i.strokes = [P(sc, 0.4)]; i.strokeWeight = 1; i.name = 'Inner border'; }
  const on = s.fill === 'accent' ? c.onAccent : c.text, fs = th.fs;
  T(f, tag, th, true, 13, s.fill === 'accent' ? c.onAccent : acc, undefined, undefined, 1.5);
  T(f, name, th, true, Math.round(nameSize * fs), on);
  if (sub) T(f, sub, th, false, Math.round(15 * fs), s.fill === 'accent' ? c.onAccent : c.muted);
  return f;
}
