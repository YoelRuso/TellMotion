import '../fonts';

import {Circle, Gradient, Line, Node, Rect, Txt, View2D, blur} from '@motion-canvas/2d';
import {createRef, range} from '@motion-canvas/core';
import {C, FONT, LEGEND, fs, t} from '../config';
import {THEME} from '../theme';

/** Waits for the theme font to be loaded before drawing. */
function loadFonts() {
  const {family, weights} = THEME.fonts;
  return Promise.all(weights.map(w => document.fonts.load(`${w} 28px "${family}"`, 'áéíóúñÁÉÍÓÚÑ')));
}

/** Background: solid / grid / dots / gradient, plus the theme's decor (scanlines, dust, blobs...). */
function background() {
  const b = THEME.background;
  const decor = THEME.decor ?? [];
  const nodes: Node[] = [];

  if (b.kind === 'gradient' && b.gradient) {
    const a = ((b.gradient.angle ?? 135) * Math.PI) / 180;
    const dx = Math.cos(a), dy = Math.sin(a);
    nodes.push(
      <Rect
        width={1920}
        height={1080}
        fill={new Gradient({type: 'linear', from: [-dx * 960, -dy * 540], to: [dx * 960, dy * 540], stops: b.gradient.stops.map(([color, offset]) => ({color, offset}))})}
      />,
    );
  }
  if (b.kind === 'grid' && b.step) {
    const o = b.opacity ?? 0.06;
    const cols = Math.floor(1920 / b.step) + 1, rows = Math.floor(1080 / b.step) + 1;
    nodes.push(
      <Node cache>
        {range(cols).map(i => <Rect width={1} height={1080} x={-960 + i * b.step!} fill={b.color} opacity={i % 4 === 0 ? o * 2.3 : o} />)}
        {range(rows).map(i => <Rect width={1920} height={1} y={-540 + i * b.step!} fill={b.color} opacity={i % 4 === 0 ? o * 2.3 : o} />)}
      </Node>,
    );
  }
  if (b.kind === 'dots' && b.step) {
    nodes.push(
      <Node cache>
        {range(Math.floor(1920 / b.step)).flatMap(i =>
          range(Math.floor(1080 / b.step!)).map(j => <Circle size={3} fill={b.color} opacity={b.opacity ?? 1} x={-920 + i * b.step!} y={-500 + j * b.step!} />),
        )}
      </Node>,
    );
  }
  if (decor.includes('blobs')) {
    for (const [color, x, y, size] of [['#22d3ee', -700, 300, 700], ['#fbbf24', 700, -400, 600], ['#34d399', 300, 420, 520]] as [string, number, number, number][])
      nodes.push(<Circle size={size} x={x} y={y} fill={color} opacity={0.45} filters={[blur(90)]} />);
  }
  if (decor.includes('dust')) {
    let seed = 42;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    nodes.push(
      <Node cache>
        {range(46).map(() => <Circle size={4 + rnd() * 26} fill={'#ffffff'} opacity={0.03 + rnd() * 0.04} x={rnd() * 1900 - 950} y={rnd() * 1060 - 530} />)}
      </Node>,
    );
  }
  if (decor.includes('scanlines')) {
    nodes.push(<Node cache>{range(180).map(i => <Rect width={1920} height={2} y={-540 + i * 6} fill={C.line} opacity={0.045} />)}</Node>);
  }
  if (decor.includes('hazard-stripes')) {
    for (const y of [-533, 533])
      nodes.push(
        <Node cache y={y}>
          <Rect width={1920} height={14} fill={C.bg} />
          {range(70).map(i => <Line closed fill={C.cat[1]} points={[[-974 + i * 28, 7], [-960 + i * 28, 7], [-946 + i * 28, -7], [-960 + i * 28, -7]]} />)}
        </Node>,
      );
  }
  if (decor.includes('corner-marks')) {
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]])
      nodes.push(<Line stroke={C.line} lineWidth={2} points={[[sx * 936 - sx * 40, sy * 516], [sx * 936, sy * 516], [sx * 936, sy * 516 - sy * 40]]} />);
  }
  return <Node>{nodes}</Node>;
}

/** Legend with one swatch per entry of LEGEND (top-right). */
function legend() {
  const width = (s: string) => 28 + 10 + s.length * 16.8 * (fs(28) / 28);
  const gap = 34;
  const total = LEGEND.reduce((a, [n]) => a + width(n), 0) + gap * (LEGEND.length - 1);
  let x = 910 - total;
  return (
    <Node y={-500}>
      {LEGEND.map(([name, color]) => {
        const px = x;
        x += width(name) + gap;
        return (
          <>
            <Rect width={26} height={26} radius={Math.min(4, THEME.shape.radius)} fill={color} position={[px + 13, 0]} />
            <Txt text={name} fontFamily={FONT} fontSize={fs(28)} fill={C.text} position={[px + 38, 0]} offset={[-1, 0]} />
          </>
        );
      })}
    </Node>
  );
}

// Caption bar fill that keeps text readable for every theme (glass themes use white text; chalk-style themes have no fill)
const captionFill = THEME.shape.fill === 'glass' ? 'rgba(20,10,60,0.35)' : THEME.shape.fill === 'none' ? C.bg : C.surface;

/** Short caption at the bottom of the scene. Keep texts under ~85 characters. */
export class Subtitle {
  private box = createRef<Node>();
  private txt = createRef<Txt>();

  constructor(parent: Node) {
    parent.add(
      <Node ref={this.box} y={455} opacity={0}>
        <Rect width={1780} height={86} radius={Math.min(THEME.shape.radius, 14)} fill={captionFill} stroke={C.line} lineWidth={2} opacity={0.95} />
        <Txt ref={this.txt} text={''} fontFamily={FONT} fontSize={fs(32)} fill={C.text} />
      </Node>,
    );
  }

  *say(text: string) {
    if (this.box().opacity() > 0.5) yield* this.box().opacity(0, t(0.2));
    this.txt().text(text);
    yield* this.box().opacity(1, t(0.35));
  }

  *hide() {
    yield* this.box().opacity(0, t(0.3));
  }
}

/**
 * Prepares a scene: background, title + legend and subtitle.
 * `title = null` omits the header (title cards). Use enter() first and leave() last.
 */
export function prepareScene(view: View2D, title: string | null) {
  view.fill(C.bg);
  const root = createRef<Node>();
  view.add(<Node ref={root} opacity={0} />);
  root().add(background());
  if (title !== null) {
    root().add(<Txt text={title} fontFamily={FONT} fontWeight={700} fontSize={fs(32)} fill={C.text} position={[-910, -500]} offset={[-1, 0]} />);
    root().add(legend());
  }
  const sub = new Subtitle(root());
  return {
    root: root(),
    sub,
    *enter() {
      yield loadFonts();
      yield* root().opacity(1, t(0.6));
    },
    *leave() {
      yield* root().opacity(0, t(0.6));
    },
  };
}
