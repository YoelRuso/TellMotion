// Renders a reference diagram as SVG from a theme.json. No Figma needed.
// The same diagram is used for every theme so previews are comparable.

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function rgbaOf(color, opacity = 1) {
  // returns [cssColor, opacity] preserving alpha channels written in the theme
  return [color, opacity];
}

export function renderPreview(theme, opts = {}) {
  const {colors: c, shape: s, fonts: f, background: bg, motion} = theme;
  const decor = theme.decor || [];
  const fam = `'${f.family}', ${f.fallback}`;
  const fs = f.scale || 1;
  const W = 1920, H = 1080;
  const out = [];
  const defs = [];
  const strokeCol = s.strokeFrom === 'line' ? c.line : s.strokeFrom === 'stroke' ? c.stroke : null;

  // ---------- shadows / filters ----------
  c.categories.forEach((col, i) => {
    if (s.shadow === 'glow')
      defs.push(`<filter id="sh${i}" x="-20%" y="-30%" width="140%" height="160%"><feDropShadow dx="0" dy="0" stdDeviation="9" flood-color="${col}" flood-opacity="0.55"/></filter>`);
    if (s.shadow === 'clay')
      defs.push(`<filter id="sh${i}" x="-20%" y="-30%" width="140%" height="170%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="${col}" flood-opacity="0.35"/></filter>`);
  });
  if (s.shadow === 'soft')
    defs.push(`<filter id="sh" x="-20%" y="-30%" width="140%" height="170%"><feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.16"/></filter>`);
  if (s.shadow === 'hard')
    defs.push(`<filter id="sh" x="-5%" y="-5%" width="120%" height="125%"><feDropShadow dx="8" dy="8" stdDeviation="0" flood-color="${c.line}" flood-opacity="1"/></filter>`);
  defs.push(`<filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="90"/></filter>`);
  const shadowAttr = i => (s.shadow === 'none' ? '' : s.shadow === 'glow' || s.shadow === 'clay' ? ` filter="url(#sh${i})"` : ` filter="url(#sh)"`);

  // ---------- background ----------
  if (bg.kind === 'gradient') {
    const a = ((bg.gradient.angle ?? 135) * Math.PI) / 180;
    const x1 = 0.5 - Math.cos(a) / 2, y1 = 0.5 - Math.sin(a) / 2, x2 = 0.5 + Math.cos(a) / 2, y2 = 0.5 + Math.sin(a) / 2;
    defs.push(
      `<linearGradient id="bg" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${bg.gradient.stops
        .map(([col, pos]) => `<stop offset="${pos}" stop-color="${col}"/>`)
        .join('')}</linearGradient>`,
    );
    out.push(`<rect width="${W}" height="${H}" fill="url(#bg)"/>`);
  } else out.push(`<rect width="${W}" height="${H}" fill="${c.background}"/>`);

  if (bg.kind === 'grid') {
    const st = bg.step;
    for (let x = 0, i = 0; x <= W; x += st, i++) out.push(`<rect x="${x}" y="0" width="1" height="${H}" fill="${bg.color}" opacity="${i % 4 === 0 ? (bg.opacity ?? 0.06) * 2.3 : bg.opacity ?? 0.06}"/>`);
    for (let y = 0, i = 0; y <= H; y += st, i++) out.push(`<rect x="0" y="${y}" width="${W}" height="1" fill="${bg.color}" opacity="${i % 4 === 0 ? (bg.opacity ?? 0.06) * 2.3 : bg.opacity ?? 0.06}"/>`);
  }
  if (bg.kind === 'dots') {
    for (let x = 40; x < W; x += bg.step) for (let y = 40; y < H; y += bg.step) out.push(`<circle cx="${x}" cy="${y}" r="1.6" fill="${bg.color}" opacity="${bg.opacity ?? 1}"/>`);
  }
  if (decor.includes('blobs')) {
    [['#22d3ee', 200, 800, 350], ['#fbbf24', 1600, 100, 300], ['#34d399', 1260, 960, 260]].forEach(([col, x, y, r]) =>
      out.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" opacity="0.5" filter="url(#blur)"/>`),
    );
  }
  if (decor.includes('dust')) {
    let seed = 42;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 46; i++) out.push(`<circle cx="${(rnd() * 1900).toFixed(0)}" cy="${(rnd() * 1060).toFixed(0)}" r="${(2 + rnd() * 13).toFixed(1)}" fill="#fff" opacity="${(0.03 + rnd() * 0.04).toFixed(3)}"/>`);
  }

  // ---------- text ----------
  const text = (x, y, str, size, weight, fill, opts = {}) =>
    `<text x="${x}" y="${y}" font-family="${fam}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${opts.anchor || 'middle'}"${opts.ls ? ` letter-spacing="${opts.ls}"` : ''}>${esc(str)}</text>`;
  const tsz = n => Math.round(n * fs);

  out.push(text(70, 100, 'Architecture overview', tsz(46), 700, c.text, {anchor: 'start'}));
  out.push(text(72, 140, 'Reference diagram · theme preview', tsz(22), 400, c.muted, {anchor: 'start'}));

  // ---------- container ----------
  const dash = s.dash ? `${s.dash[0]} ${s.dash[1]}` : '12 10';
  out.push(`<rect x="620" y="170" width="1230" height="780" rx="${Math.max(s.radius, 6) + 10}" fill="${s.fill === 'accent' ? '#ffffff' : 'none'}" stroke="${c.line}" stroke-opacity="0.45" stroke-width="2" stroke-dasharray="${dash}"/>`);
  out.push(text(652, 205, 'SERVICES', 15, 700, c.muted, {anchor: 'start', ls: 3}));

  // ---------- cards ----------
  const tintOf = i => (c.tints ? c.tints[i] : c.surface);
  const fillOf = i =>
    s.fill === 'accent' ? c.categories[i] : s.fill === 'tint' ? tintOf(i) : s.fill === 'none' ? 'none' : s.fill === 'glass' ? '#ffffff' : c.surface;
  const fillOpacity = s.fill === 'glass' ? ' fill-opacity="0.16"' : '';
  const strokeOf = i => (s.strokeFrom === 'accent' ? c.categories[i] : strokeCol);
  const onFill = s.fill === 'accent' ? c.onAccent : c.text;

  function card(i, x, y, w, h, tag, name, sub, nameSize = 24) {
    const sc = strokeOf(i);
    const sw = s.stroke;
    const g = [];
    g.push(`<g${shadowAttr(i)}>`);
    g.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${s.radius}" fill="${fillOf(i)}"${fillOpacity}${sw ? ` stroke="${sc}" stroke-width="${sw}"` : ''}${s.dash ? ` stroke-dasharray="${s.dash[0]} ${s.dash[1]}"` : ''}/>`,
    );
    if (s.doubleBorder) g.push(`<rect x="${x + 7}" y="${y + 7}" width="${w - 14}" height="${h - 14}" rx="${Math.max(s.radius - 3, 0)}" fill="none" stroke="${sc}" stroke-width="1" stroke-opacity="0.4"/>`);
    g.push('</g>');
    const cy = y + h / 2;
    const tagCol = s.fill === 'accent' ? c.onAccent : c.categories[i];
    if (sub) {
      g.push(text(x + w / 2, cy - 24, tag, 13, 700, tagCol, {ls: 1.5}));
      g.push(text(x + w / 2, cy + 6, name, tsz(nameSize), 700, onFill));
      g.push(text(x + w / 2, cy + 32, sub, tsz(15), 400, s.fill === 'accent' ? c.onAccent : c.muted));
    } else {
      g.push(text(x + w / 2, cy - 8, tag, 13, 700, tagCol, {ls: 1.5}));
      g.push(text(x + w / 2, cy + 20, name, tsz(nameSize), 700, onFill));
    }
    out.push(g.join(''));
  }

  const svc = [['Users', 'Sign-up & login', 'PostgreSQL'], ['Catalog', 'Products', 'MongoDB'], ['Orders', 'Cart & checkout', 'PostgreSQL'], ['Payments', 'Billing', 'PostgreSQL'], ['Alerts', 'Email · Push', null]];

  // arrows first (behind cards)
  const arrow = (x1, y1, x2, y2, async) => {
    const col = async ? c.async : c.line;
    const dx = Math.sign(x2 - x1), dy = Math.sign(y2 - y1), L = 14;
    const bx = x2 - dx * L, by = y2 - dy * L, px = -dy * 8, py = dx * 8;
    return (
      `<line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke="${col}" stroke-width="${s.stroke >= 4 ? 4 : 3}" stroke-linecap="round"${async ? ' stroke-dasharray="10 8"' : ''}/>` +
      `<polygon points="${x2},${y2} ${bx + px},${by + py} ${bx - px},${by - py}" fill="${col}"/>`
    );
  };
  out.push(arrow(262, 500, 338, 500, false), arrow(542, 500, 618, 500, false));
  for (let i = 2; i < 5; i++) out.push(arrow(685 + i * 230 + 95, 332, 685 + i * 230 + 95, 448, true));
  for (let i = 0; i < 4; i++) out.push(arrow(685 + i * 230 + 95, 572, 685 + i * 230 + 95, 688, false));

  card(0, 70, 440, 190, 120, 'CLIENT', 'Client', 'Web · Mobile');
  card(1, 340, 440, 200, 120, 'ENTRY', 'API Gateway', 'Routes · Auth');
  card(3, 685, 250, 1110, 80, 'MESSAGING', 'Event Bus', null, 26);
  svc.forEach((v, i) => {
    const x = 685 + i * 230;
    card(2, x, 450, 190, 120, 'SERVICE', v[0], v[1], v[0].length > 9 ? 21 : 24);
    if (v[2]) card(4, x, 690, 190, 90, 'DATA', 'DB ' + v[0], v[2], 20);
  });

  // ---------- legend ----------
  out.push(`<line x1="70" y1="985" x2="130" y2="985" stroke="${c.line}" stroke-width="3" stroke-linecap="round"/>`);
  out.push(text(144, 992, 'Synchronous request', 18, 400, c.muted, {anchor: 'start'}));
  out.push(`<line x1="620" y1="985" x2="680" y2="985" stroke="${c.async}" stroke-width="3" stroke-linecap="round" stroke-dasharray="10 8"/>`);
  out.push(text(694, 992, 'Async event', 18, 400, c.muted, {anchor: 'start'}));

  // ---------- decor ----------
  if (decor.includes('scanlines')) {
    defs.push(`<pattern id="sl" width="${W}" height="6" patternUnits="userSpaceOnUse"><rect width="${W}" height="2" fill="${c.line}" opacity="0.05"/></pattern>`);
    out.push(`<rect width="${W}" height="${H}" fill="url(#sl)"/>`);
  }
  if (decor.includes('hazard-stripes')) {
    for (const y of [0, 1066]) {
      out.push(`<rect y="${y}" width="${W}" height="14" fill="${c.background}"/>`);
      for (let x = -14; x < W; x += 28) out.push(`<polygon points="${x},${y + 14} ${x + 14},${y + 14} ${x + 28},${y} ${x + 14},${y}" fill="${c.categories[1]}"/>`);
    }
  }
  if (decor.includes('corner-marks')) {
    for (const [cx, cy, sx, sy] of [[24, 24, 1, 1], [1896, 24, -1, 1], [24, 1056, 1, -1], [1896, 1056, -1, -1]])
      out.push(`<path d="M${cx + 40 * sx} ${cy} H${cx} V${cy + 40 * sy}" fill="none" stroke="${c.line}" stroke-width="2"/>`);
  }
  if (decor.includes('title-block')) {
    out.push(`<rect x="1350" y="985" width="500" height="70" fill="none" stroke="${c.line}" stroke-width="2"/><line x1="1700" y1="985" x2="1700" y2="1055" stroke="${c.line}" stroke-width="2"/>`);
    out.push(text(1362, 1012, 'SHEET 01 · ARCHITECTURE', 15, 700, c.text, {anchor: 'start'}));
    out.push(text(1362, 1040, 'REV A · SCALE 1:1', 13, 400, c.muted, {anchor: 'start'}));
    out.push(text(1716, 1012, 'PAGE 1/1', 15, 700, c.text, {anchor: 'start'}));
  }
  if (decor.includes('dimension-line')) {
    out.push(`<path d="M620 140 H1035 M1435 140 H1850 M620 128 V152 M1850 128 V152" stroke="${c.line}" stroke-width="1.5" fill="none"/>`);
    out.push(text(1235, 146, 'DECOUPLED SERVICES', 14, 400, c.muted, {ls: 1.5}));
  }
  if (decor.includes('step-numbers')) {
    [[70, 440, 1], [340, 440, 2], [685, 250, 5], [1145, 450, 3]].forEach(([x, y, n]) =>
      out.push(`<circle cx="${x - 14 + 16}" cy="${y - 14 + 16}" r="16" fill="${c.categories[1]}"/>` + text(x + 2, y + 8, n, 16, 700, c.background)),
    );
  }
  if (decor.includes('stamp')) {
    out.push(`<g transform="rotate(-6 1640 110)"><rect x="1500" y="60" width="280" height="100" rx="6" fill="none" stroke="${c.categories[1]}" stroke-width="4"/>` + text(1640, 112, 'APPROVED', 34, 700, c.categories[1], {ls: 4}) + text(1640, 138, 'ARCHITECTURE REV C', 13, 400, c.categories[1], {ls: 2}) + '</g>');
  }

  const font = opts.fonts === false ? '' : `<style>@import url('https://fonts.googleapis.com/css2?family=${f.google}&amp;display=swap');</style>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(theme.name)} theme preview">${font}<defs>${defs.join('')}</defs>${out.join('')}</svg>`;
}
