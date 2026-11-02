import {makeProject} from '@motion-canvas/core';

import example from './scenes/example?scene';

// Playback order of the scenes
export default makeProject({
  scenes: [example],
});
