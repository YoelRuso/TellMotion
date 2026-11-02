import {Layout, Rect, Txt, View2D} from '@motion-canvas/2d';
import {all, createRef, makeRef, sequence, waitFor} from '@motion-canvas/core';
import {prepareScene} from '../components/Scene';
import {C, FONT, fs, t} from '../config';
import {accentOn, fitList, headline, revealWords} from './shared';
import {boxProps, textOn} from '../components/Piece';

export interface Credit {
  role: string;
  name: string;
}

export interface OutroProps {
  title: string;
  /** Up to 3 ideas to remember. */
  takeaways?: string[];
  /** Up to 4 lines. */
  credits?: Credit[];
  /** Final call to action in a pill: a link, "Thanks for watching"... */
  cta?: string;
  /** Extra seconds on screen at the end. */
  hold?: number;
}

/** Closing card: title, what to remember, credits and a call to action. */
export function* outro(view: View2D, p: OutroProps) {
  const {root, enter, leave} = prepareScene(view, null);
  const words: Txt[] = [];
  const takeaways: Layout[] = [];
  const credits: Layout[] = [];
  const cta = createRef<Layout>();
  const items = p.takeaways ?? [];
  const textWidth = 1320;
  const size = fitList(items, textWidth, 300, 20, [44, 40, 36, 32]);

  root.add(
    <Layout layout direction={'column'} alignItems={'center'} gap={48} y={-10}>
      {headline(p.title, 1600, 2, [96, 80, 68, 56], words)}
      {items.length ? (
        <Layout layout direction={'column'} alignItems={'start'} gap={20}>
          {items.map((item, i) => (
            <Layout ref={makeRef(takeaways, i)} layout direction={'row'} alignItems={'start'} gap={24} opacity={0}>
              <Rect width={28} height={8} radius={4} marginTop={(fs(size) * 1.3 - 8) / 2} fill={C.cat[i % C.cat.length]} />
              <Txt text={item} width={textWidth} textWrap fontFamily={FONT} fontSize={fs(size)} lineHeight={fs(size) * 1.3} fill={C.text} />
            </Layout>
          ))}
        </Layout>
      ) : null}
      {p.credits?.length ? (
        <Layout layout direction={'column'} alignItems={'center'} gap={10}>
          {p.credits.map((c, i) => (
            <Layout ref={makeRef(credits, i)} layout direction={'row'} gap={20} opacity={0}>
              <Txt text={c.role} fontFamily={FONT} fontSize={fs(28)} fill={C.muted} />
              <Txt text={c.name} fontFamily={FONT} fontWeight={700} fontSize={fs(28)} fill={C.text} />
            </Layout>
          ))}
        </Layout>
      ) : null}
      {p.cta ? (
        <Rect ref={cta as any} layout padding={[20, 48]} {...boxProps(C.cat[1])} radius={999} opacity={0}>
          <Txt text={p.cta} fontFamily={FONT} fontWeight={700} fontSize={fs(32)} fill={textOn()} />
        </Rect>
      ) : null}
    </Layout>,
  );

  yield* enter();
  yield* revealWords(words);
  if (items.length) yield* sequence(t(0.5), ...takeaways.map(r => r.opacity(1, t(0.4))));
  if (credits.length) yield* all(...credits.map(r => r.opacity(1, t(0.5))));
  if (p.cta) yield* cta().opacity(1, t(0.4));
  yield* waitFor(t(p.hold ?? 3));
  yield* leave();
}
