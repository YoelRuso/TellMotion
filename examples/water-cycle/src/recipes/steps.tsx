import {Circle, Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {all, createRef, waitFor} from '@motion-canvas/core';
import {Arrow} from '../components/Arrow';
import {Piece, boxProps, hiddenState, textOn} from '../components/Piece';
import {prepareScene} from '../components/Scene';
import {C, FONT, fs, t} from '../config';
import {accentOn, fitText, holdUntil} from './shared';

export interface Step {
  label: string;
  /** Sentence shown below the cards while this step is active. */
  detail?: string;
}

export interface StepsProps {
  title: string;
  /** Between 2 and 5. */
  steps: Step[];
  /** Shown from the start, under the cards. */
  caption?: string;
  /** Seconds on each step. */
  stepHold?: number;
  /** Least seconds on screen at the end. */
  hold?: number;
  /** Total length of the scene; the final pause grows to reach it. */
  seconds?: number;
}

class StepCard extends Piece {
  constructor(parent: Node, x: number, y: number, w: number, h: number, color: string, number: number, label: string) {
    super(x, y, w, h, color);
    const fit = fitText(label, w - 44, 3, [36, 32, 28]);
    const hs = hiddenState(x, y);
    parent.add(
      <Node ref={this.root} position={hs.position} opacity={hs.opacity} scale={hs.scale}>
        <Rect ref={this.box} width={w} height={h} {...boxProps(color)} />
        <Circle size={68} y={-h / 2 + 62} stroke={accentOn(color)} lineWidth={4} />
        <Txt text={String(number)} y={-h / 2 + 62} fontFamily={FONT} fontWeight={700} fontSize={fs(32)} fill={textOn()} />
        <Txt text={fit.lines.join('\n')} y={38} fontFamily={FONT} fontWeight={700} fontSize={fs(fit.size)} lineHeight={fs(fit.size) * 1.25} textAlign={'center'} fill={textOn()} />
      </Node>,
    );
  }
}

/** A process: numbered cards joined by arrows, lit one at a time, with a sentence for the active step. */
export function* steps(view: View2D, p: StepsProps) {
  const {root, sub, enter, leave} = prepareScene(view, p.title, {legend: false});
  const hasDetail = p.steps.some(s => s.detail);
  const n = p.steps.length;
  const gap = 64;
  const w = Math.min((1780 - gap * (n - 1)) / n, 460);
  const h = 300;
  const y = hasDetail ? -150 : -30;
  const x = (i: number) => (i - (n - 1) / 2) * (w + gap);

  const cards = p.steps.map((s, i) => new StepCard(root, x(i), y, w, h, C.cat[i % C.cat.length], i + 1, s.label));
  const arrows = cards.slice(1).map((card, i) => new Arrow(root, [[cards[i].right[0] + 8, y], [card.left[0] - 8, y]]));
  // With a target length, the extra time goes to the steps rather than to one long pause at the end
  const stepWait = Math.max(t(p.stepHold ?? 1.5), p.seconds ? (p.seconds - n * t(1.8) - t(2.2)) / n : 0);
  const detail = createRef<Txt>();
  root.add(<Txt ref={detail} y={190} width={1560} textWrap textAlign={'center'} fontFamily={FONT} fontSize={fs(40)} lineHeight={fs(40) * 1.3} fill={C.text} opacity={0} />);

  yield* enter();
  if (p.caption) yield* sub.say(p.caption);
  for (let i = 0; i < n; i++) {
    if (i > 0) yield* all(arrows[i - 1].draw(0.4), cards[i - 1].glow(false));
    yield* cards[i].appear();
    yield* cards[i].glow(true);
    if (p.steps[i].detail) {
      detail().text(p.steps[i].detail!);
      yield* detail().opacity(1, t(0.35));
    }
    yield* waitFor(stepWait);
    if (p.steps[i].detail && i < n - 1) yield* detail().opacity(0, t(0.25));
  }
  yield* cards[n - 1].glow(false);
  yield* holdUntil(p.seconds, p.hold ?? 2);
  yield* all(sub.hide(), leave());
}
