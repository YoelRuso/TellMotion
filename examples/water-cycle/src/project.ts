import {makeProject} from '@motion-canvas/core';

import openingScene from './scenes/opening?scene';
import evaporationScene from './scenes/evaporation?scene';
import condensationScene from './scenes/condensation?scene';
import precipitationScene from './scenes/precipitation?scene';
import collectionScene from './scenes/collection?scene';
import closingScene from './scenes/closing?scene';

// Playback order of the scenes. Generated from storyboard.json
export default makeProject({
  scenes: [openingScene, evaporationScene, condensationScene, precipitationScene, collectionScene, closingScene],
});
