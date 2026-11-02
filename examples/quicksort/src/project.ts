import {makeProject} from '@motion-canvas/core';

import openingScene from './scenes/opening?scene';
import pivotScene from './scenes/pivot?scene';
import partitionScene from './scenes/partition?scene';
import recursionScene from './scenes/recursion?scene';
import costScene from './scenes/cost?scene';
import closingScene from './scenes/closing?scene';

// Playback order of the scenes. Generated from storyboard.json
export default makeProject({
  scenes: [openingScene, pivotScene, partitionScene, recursionScene, costScene, closingScene],
});
