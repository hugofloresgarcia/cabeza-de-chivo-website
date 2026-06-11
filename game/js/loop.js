// Fixed-timestep loop: logic at 60 ticks/s, render once per rAF.

import { TICK_MS } from './constants.js';

const MAX_CATCHUP_TICKS = 5;

export function startLoop(update, render) {
  let last = performance.now();
  let acc = 0;

  function frame(now) {
    acc += now - last;
    last = now;

    // Don't spiral after a background-tab pause: cap catch-up work.
    if (acc > MAX_CATCHUP_TICKS * TICK_MS) acc = MAX_CATCHUP_TICKS * TICK_MS;

    while (acc >= TICK_MS) {
      update();
      acc -= TICK_MS;
    }
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
