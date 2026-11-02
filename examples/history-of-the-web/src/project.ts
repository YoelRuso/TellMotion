import {makeProject} from '@motion-canvas/core';

import openingScene from './scenes/opening?scene';
import beginningsScene from './scenes/beginnings?scene';
import growthScene from './scenes/growth?scene';
import mobileScene from './scenes/mobile?scene';
import thenAndNowScene from './scenes/then-and-now?scene';
import closingScene from './scenes/closing?scene';

// Playback order of the scenes. Generated from storyboard.json
export default makeProject({
  scenes: [openingScene, beginningsScene, growthScene, mobileScene, thenAndNowScene, closingScene],
});
