import {Layout, Rect, Txt, View2D} from '@motion-canvas/2d';
import {createRef} from '@motion-canvas/core';
import {prepareScene} from '../components/Scene';
import {C, FONT, fs, t} from '../config';
import {accentText, headline, holdUntil, paragraph, revealWords} from './shared';

export interface ChapterProps {
  title: string;
  /** Shown big on the left, e.g. "02". */
  number?: string;
  subtitle?: string;
  /** Least seconds on screen at the end. */
  hold?: number;
  /** Total length of the scene; the final pause grows to reach it. */
  seconds?: number;
}

/** Section divider: a big number, a rule that grows and the title. */
export function* chapter(view: View2D, p: ChapterProps) {
  const {root, enter, leave} = prepareScene(view, null);
  const number = createRef<Txt>();
  const rule = createRef<Rect>();
  const subtitle = createRef<Txt>();
  const words: Txt[] = [];
  const width = p.number ? 1180 : 1500;

  root.add(
    <Layout layout direction={'row'} alignItems={'center'} gap={64} y={-20}>
      {p.number ? <Txt ref={number} text={p.number} fontFamily={FONT} fontWeight={700} fontSize={fs(220)} fill={accentText(C.cat[0])} opacity={0} /> : null}
      <Rect ref={rule} width={8} height={0} radius={4} fill={C.cat[1]} />
      <Layout layout direction={'column'} alignItems={'start'} gap={32} width={width}>
        {headline(p.title, width, 3, [96, 84, 72, 60], words, 'start')}
        {p.subtitle ? paragraph(subtitle, p.subtitle, width, 2, [40, 36, 32], C.muted, 'left') : null}
      </Layout>
    </Layout>,
  );

  yield* enter();
  if (p.number) yield* number().opacity(1, t(0.4));
  yield* rule().height(300, t(0.4));
  yield* revealWords(words);
  if (p.subtitle) yield* subtitle().opacity(1, t(0.4));
  yield* holdUntil(p.seconds, p.hold ?? 1.5);
  yield* leave();
}
