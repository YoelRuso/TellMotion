import {Line, Node, Txt} from '@motion-canvas/2d';
import {C, FONT, fs} from '../config';

/** The smallest "round" number (1, 2, 2.5, 5 or 10 times a power of ten) that is not below `v`. */
export function roundUp(v: number) {
  if (v <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(v));
  const step = [1, 2, 2.5, 5, 10].find(s => s * power >= v - 1e-9) ?? 10;
  return step * power;
}

export interface YTicksOpts {
  /** Width and height of the plot. The labels sit to the left of it, so leave room there. */
  w: number;
  h: number;
  /** Number of divisions. */
  ticks: number;
  /** Value at the top of the plot. A function, so that the labels follow a scale that changes. */
  max: () => number;
  format: (value: number) => string;
}

/** Charts pack · value labels and grid lines of a vertical axis. Its origin is the center of the baseline. */
export function yTicks(o: YTicksOpts) {
  return (
    <Node>
      {Array.from({length: o.ticks + 1}, (_, i) => (
        <Node y={-(i / o.ticks) * o.h}>
          {i > 0 ? <Line points={[[-o.w / 2, 0], [o.w / 2, 0]]} stroke={C.line} lineWidth={2} opacity={0.2} /> : null}
          <Txt text={() => o.format((o.max() * i) / o.ticks)} fontFamily={FONT} fontSize={fs(28)} fill={C.muted} offset={[1, 0]} x={-o.w / 2 - 18} />
        </Node>
      ))}
    </Node>
  );
}
