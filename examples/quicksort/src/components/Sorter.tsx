import {Node} from '@motion-canvas/2d';
import {waitFor} from '@motion-canvas/core';
import {Bar} from './Bar';
import {swap} from './swap';
import {C, t} from '../config';

export const COLOR = {unsorted: C.muted, pivot: C.cat[1], smaller: C.cat[3], bigger: C.cat[0], done: C.ok};
export const BASE_Y = 270;
const GAP = 200;
const MAX = 10;
const MAX_H = 560;

export const barX = (i: number) => (i - 3) * GAP;
export const heightOf = (value: number) => BASE_Y - (value / MAX) * MAX_H;

/** A row of bars that remembers their order, so that the scenes can talk about positions. */
export class Sorter {
  public bars: Bar[];

  constructor(parent: Node, values: number[], colors: string[] = []) {
    this.bars = values.map((value, i) => new Bar(parent, {x: barX(i), baseY: BASE_Y, value, max: MAX, maxH: MAX_H, w: 130, color: colors[i] ?? COLOR.unsorted}));
  }

  *swapAt(a: number, b: number, d = 0.6) {
    if (a !== b) yield* swap(this.bars[a], this.bars[b], d, 40);
    [this.bars[a], this.bars[b]] = [this.bars[b], this.bars[a]];
  }

  /** Quicksort of positions lo..hi, at speed: the same steps the partition scene explains slowly. */
  *sort(lo: number, hi: number): Generator<any, void, any> {
    if (lo > hi) return;
    if (lo === hi) {
      yield* this.bars[lo].mark(COLOR.done);
      return;
    }
    const pivot = this.bars[hi];
    yield* pivot.mark(COLOR.pivot);
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      if (this.bars[j].value < pivot.value) {
        i++;
        yield* this.swapAt(i, j, 0.4);
      }
      yield* waitFor(t(0.15));
    }
    yield* this.swapAt(i + 1, hi, 0.4);
    yield* pivot.mark(COLOR.done);
    yield* this.sort(lo, i);
    yield* this.sort(i + 2, hi);
  }
}
