import {Node} from '@motion-canvas/2d';
import {Reference, all, chain} from '@motion-canvas/core';
import {MOVE, t} from '../config';

type Movable = {root: Reference<Node>};

/** Algorithms pack · swap two elements (cells or bars): they exchange x with a small arc. */
export function* swap(a: Movable, b: Movable, d = 0.7, lift = 60) {
  const ax = a.root().x(), bx = b.root().x();
  const ay = a.root().y(), by = b.root().y();
  yield* all(
    a.root().x(bx, t(d), MOVE),
    b.root().x(ax, t(d), MOVE),
    chain(a.root().y(ay - lift, t(d / 2)), a.root().y(ay, t(d / 2))),
    chain(b.root().y(by + lift, t(d / 2)), b.root().y(by, t(d / 2))),
  );
}
