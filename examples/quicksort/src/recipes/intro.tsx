import {Layout, Rect, Txt, View2D} from '@motion-canvas/2d';
import {createRef} from '@motion-canvas/core';
import {prepareScene} from '../components/Scene';
import {C, FONT, fs, t} from '../config';
import {accentText, headline, holdUntil, paragraph, revealWords} from './shared';

export interface IntroProps {
  title: string;
  subtitle?: string;
  /** Small line above the title: series, course, author... */
  tag?: string;
  /** Least seconds on screen at the end. */
  hold?: number;
  /** Total length of the scene; the final pause grows to reach it. */
  seconds?: number;
}

/** Opening card: tag, title revealed word by word, a rule and a subtitle. */
export function* intro(view: View2D, p: IntroProps) {
  const {root, enter, leave} = prepareScene(view, null);
  const tag = createRef<Txt>();
  const rule = createRef<Rect>();
  const subtitle = createRef<Txt>();
  const words: Txt[] = [];

  root.add(
    <Layout layout direction={'column'} alignItems={'center'} gap={44} y={-20}>
      {p.tag ? <Txt ref={tag} text={p.tag} fontFamily={FONT} fontWeight={700} fontSize={fs(32)} fill={accentText(C.cat[1])} opacity={0} /> : null}
      {headline(p.title, 1640, 3, [132, 112, 96, 80, 68, 60], words)}
      <Rect ref={rule} width={0} height={8} radius={4} fill={C.cat[0]} />
      {p.subtitle ? paragraph(subtitle, p.subtitle, 1400, 3, [44, 38, 32]) : null}
    </Layout>,
  );

  yield* enter();
  if (p.tag) yield* tag().opacity(1, t(0.4));
  yield* revealWords(words);
  yield* rule().width(260, t(0.5));
  if (p.subtitle) yield* subtitle().opacity(1, t(0.5));
  yield* holdUntil(p.seconds, p.hold ?? 2);
  yield* leave();
}
