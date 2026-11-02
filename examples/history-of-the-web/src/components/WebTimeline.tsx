import {Node} from '@motion-canvas/2d';
import {Timeline} from './Timeline';

const FIRST = 1989;
const LAST = 2016;
const at = (year: number) => (year - FIRST) / (LAST - FIRST);

const MILESTONES = [
  {label: 'The proposal', date: '1989', at: at(1989)},
  {label: 'Mosaic', date: '1993', at: at(1993)},
  {label: 'Google', date: '1998', at: at(1998)},
  {label: 'Web 2.0', date: '2004', at: at(2004)},
  {label: 'iPhone', date: '2007', at: at(2007)},
  {label: 'Mobile first', date: '2016', at: at(2016)},
];

/** The same timeline in every scene, with the milestones of the previous scenes already there and dimmed. */
export function webTimeline(parent: Node, alreadyShown: number) {
  const timeline = new Timeline(parent, {x: 0, y: -30, w: 1500, milestones: MILESTONES});
  if (alreadyShown > 0) timeline.axis().end(1);
  for (let i = 0; i < alreadyShown; i++) timeline.groups[i].opacity(DIM);
  return timeline;
}

export const DIM = 0.3;
