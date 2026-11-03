import {Circle, Line, Node, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutBack, makeRef, sequence} from '@motion-canvas/core';
import {Arrow, ArrowOpts} from './Arrow';
import {C, FONT, P, fs, t} from '../config';
import {PacketOpts, send} from './Packet';
import {Group} from './Piece';

/** Longitude and latitude. Land drawn by hand with a few points: a stylized world for explainers, not for measuring. No borders. */
type Coast = [number, number][];

export const CONTINENTS = {
  northAmerica: [
    [[-166, 65], [-157, 71], [-140, 70], [-125, 70], [-110, 68], [-95, 69], [-85, 69], [-82, 66], [-93, 60], [-85, 55], [-79, 52], [-78, 60], [-70, 62], [-64, 59], [-56, 52], [-65, 48], [-60, 46], [-70, 43], [-75, 38], [-81, 31], [-80, 25], [-84, 30], [-90, 29], [-97, 26], [-97, 20], [-91, 18], [-87, 21], [-88, 16], [-83, 14], [-78, 8], [-83, 8], [-90, 13], [-96, 16], [-105, 20], [-110, 24], [-112, 30], [-117, 33], [-124, 40], [-124, 48], [-132, 55], [-146, 60], [-153, 58], [-165, 54], [-160, 59], [-166, 62]],
    [[-73, 78], [-60, 80], [-30, 80], [-18, 78], [-22, 70], [-40, 65], [-44, 60], [-52, 65], [-55, 70], [-68, 76]],
    [[-120, 74], [-100, 76], [-85, 76], [-75, 72], [-90, 71], [-110, 72]],
  ],
  southAmerica: [[[-78, 8], [-72, 12], [-62, 10], [-52, 5], [-50, 0], [-35, -6], [-39, -15], [-41, -22], [-48, -26], [-53, -33], [-58, -38], [-65, -42], [-68, -52], [-74, -52], [-73, -40], [-71, -30], [-70, -18], [-76, -14], [-81, -5], [-80, 2], [-77, 5]]],
  europe: [
    [[-9, 38], [-9, 43], [-1, 44], [-4, 48], [2, 51], [8, 54], [9, 57], [12, 55], [20, 55], [24, 59], [30, 60], [22, 61], [24, 65], [18, 62], [18, 59], [12, 56], [6, 58], [5, 62], [14, 68], [26, 71], [40, 67], [44, 68], [58, 68], [58, 50], [48, 45], [40, 47], [34, 45], [28, 41], [26, 40], [23, 37], [20, 40], [18, 40], [16, 38], [12, 44], [8, 44], [3, 42], [0, 38], [-5, 36]],
    [[-5, 50], [1, 51], [0, 54], [-3, 58], [-6, 56], [-3, 53]],
    [[-24, 65], [-14, 66], [-15, 63], [-22, 63]],
  ],
  africa: [
    [[-6, 35], [10, 37], [11, 33], [20, 31], [32, 31], [35, 24], [37, 18], [43, 11], [51, 12], [41, -2], [39, -10], [35, -20], [33, -26], [27, -34], [18, -34], [12, -17], [13, -8], [9, 0], [9, 4], [-4, 5], [-8, 4], [-17, 12], [-16, 20], [-10, 30]],
    [[44, -25], [50, -15], [49, -12], [44, -17]],
  ],
  asia: [
    [[58, 68], [68, 69], [73, 72], [100, 77], [112, 74], [130, 71], [160, 70], [180, 68], [178, 64], [164, 60], [162, 56], [156, 51], [155, 58], [142, 59], [135, 54], [140, 48], [130, 42], [128, 35], [122, 39], [122, 30], [118, 24], [108, 21], [109, 13], [105, 9], [100, 13], [103, 2], [98, 8], [97, 16], [90, 22], [80, 15], [78, 8], [73, 18], [67, 25], [57, 25], [50, 30], [48, 30], [51, 25], [56, 25], [59, 22], [52, 16], [44, 12], [42, 16], [35, 28], [34, 31], [36, 36], [28, 36], [28, 41], [34, 45], [40, 47], [48, 45], [58, 50]],
    [[131, 32], [136, 34], [141, 36], [142, 43], [140, 41], [136, 37], [131, 34]],
    [[95, 5], [104, -3], [106, -6], [100, -2]],
    [[109, 1], [117, 7], [118, 0], [114, -4], [110, -2]],
    [[120, 18], [122, 18], [126, 7], [122, 8]],
  ],
  oceania: [
    [[114, -22], [122, -18], [130, -12], [136, -12], [140, -17], [145, -14], [153, -26], [150, -37], [143, -39], [135, -33], [124, -33], [115, -34]],
    [[131, -1], [141, -3], [150, -10], [140, -8], [134, -4]],
    [[173, -41], [178, -38], [170, -46], [167, -45]],
  ],
} satisfies Record<string, Coast[]>;

export type Continent = keyof typeof CONTINENTS;

/** Latitudes shown: there is no land to explain south of this, and the map fits a widescreen. */
const TOP = 82;
const BOTTOM = -58;

export interface WorldMapOpts {
  /** Center of the map. */
  x: number;
  y: number;
  /** Width; the height follows (about 0.39 of it). */
  w?: number;
}

export interface PinOpts {
  label?: string;
  color?: string;
  /** Where the label goes. Default: `top`. */
  side?: 'top' | 'bottom' | 'left' | 'right';
}

/** Maps pack · a place on a `WorldMap`, made by `map.pin()`. */
export class Pin extends Group {
  public position: P;

  constructor(parent: Node, position: P, o: PinOpts) {
    super();
    this.position = position;
    const color = o.color ?? C.cat[1];
    const side = o.side ?? 'top';
    const label = {top: {y: -44}, bottom: {y: 44}, left: {x: -28, offset: [1, 0] as P}, right: {x: 28, offset: [-1, 0] as P}}[side];
    parent.add(
      <Node ref={this.root} position={position} opacity={0} scale={0}>
        <Circle size={28} fill={color} stroke={C.bg} lineWidth={4} />
        {o.label ? <Txt text={o.label} fontFamily={FONT} fontWeight={700} fontSize={fs(28)} fill={C.text} stroke={C.bg} lineWidth={8} strokeFirst {...label} /> : null}
      </Node>,
    );
  }

  *appear(d = 0.4) {
    yield* all(this.root().opacity(1, t(d)), this.root().scale(1, t(d), easeOutBack));
  }
}

/** Maps pack · stylized world map with pins, routes that arc between them, and continents that can take the focus. */
export class WorldMap extends Group {
  private land: Record<string, Line[]> = {};
  private layer = createRef<Node>();
  private w: number;
  private h: number;

  constructor(parent: Node, o: WorldMapOpts) {
    super();
    this.w = o.w ?? 1600;
    this.h = this.w * ((TOP - BOTTOM) / 360);
    parent.add(
      <Node ref={this.root} position={[o.x, o.y]} opacity={0}>
        <Node ref={this.layer} />
      </Node>,
    );
    for (const name of Object.keys(CONTINENTS) as Continent[]) {
      this.land[name] = [];
      CONTINENTS[name].forEach((coast: Coast, i: number) => {
        this.layer().add(
          <Line ref={makeRef(this.land[name], i)} points={coast.map(([lon, lat]) => this.at(lat, lon))} closed radius={5} fill={C.line} opacity={0.3} />,
        );
      });
    }
  }

  /** Position in the map of a latitude and a longitude. */
  at(lat: number, lon: number): P {
    return [(lon / 360) * this.w, (((TOP + BOTTOM) / 2 - lat) / (TOP - BOTTOM)) * this.h];
  }

  /** Add a place, not shown yet. */
  pin(lat: number, lon: number, o: PinOpts = {}) {
    return new Pin(this.root(), this.at(lat, lon), o);
  }

  /** Arrow between two pins that arcs like a flight path, not drawn yet. `lift` is its height in px. */
  route(from: Pin, to: Pin, o: ArrowOpts & {lift?: number} = {}) {
    const [ax, ay] = from.position, [bx, by] = to.position;
    const lift = o.lift ?? Math.hypot(bx - ax, by - ay) * 0.25;
    const points = Array.from({length: 41}, (_, i): P => {
      const k = i / 40;
      return [ax + (bx - ax) * k, ay + (by - ay) * k - Math.sin(k * Math.PI) * lift];
    });
    return new Arrow(this.root(), points, o);
  }

  /** Something travels along a route, and the pin reacts when it arrives. */
  *send(route: Arrow, to: Pin, o: PacketOpts & {d?: number} = {}) {
    yield* send(this.root(), route.points, {shape: 'dot', ...o, to});
  }

  /** Show several pins one after another. */
  *showPins(pins: Pin[], stagger = 0.2) {
    yield* sequence(stagger, ...pins.map(pin => pin.appear()));
  }

  /** Color some continents and fade the rest. */
  *focus(names: Continent[], color = C.cat[1], d = 0.5) {
    yield* all(
      ...(Object.keys(this.land) as Continent[]).flatMap(name =>
        this.land[name].map(line => all(line.fill(names.includes(name) ? color : C.line, t(d)), line.opacity(names.includes(name) ? 0.85 : 0.15, t(d)))),
      ),
    );
  }

  *clearFocus(d = 0.5) {
    yield* all(...Object.values(this.land).flat().map(line => all(line.fill(C.line, t(d)), line.opacity(0.3, t(d)))));
  }
}
