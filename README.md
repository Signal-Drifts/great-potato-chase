# Can Tibo Capture Grok Bot?

Play as Tibo and approach the Grok Bot pictured in the supplied reference.
Grok is always visible and its eyes continuously look up, down, left, and right.

When Tibo is exactly three walkable blocks away, Poteto presses her red Reset button.
Tibo cries during a three-second reaction scene, then the next level starts automatically.
After the fifth reset, Poteto wins; Tibo never captures Grok.

- Five distinct mazes and target locations, increasing in size and difficulty.
- Five candidate routes each level: four cactus traps and one safe route.
- Cactus contact costs one of three shared lives and respawns Tibo at the entrance.
- Timed gates form bottlenecks. Wait until they open.
- 45 seconds each level, starting on the first successful move.
- Arrow keys or WASD move, Enter starts/retries, P or Escape pauses.
- Touch controls, footsteps, wall bumps, trap sounds, and a mute icon.
- Minimal visible UI. Descriptive instructions are available to screen readers.

The three-block trigger uses shortest walking distance around walls and cactus traps,
not straight-line distance through walls. Temporarily closed gates do not change the distance.

Run `node --test tests/maze.test.cjs` for routes, hazards, gates, sounds, animated eye directions,
the exact reset distance, automatic progression, and final outcome.

Open index.html or serve this directory with a static HTTP server. GitHub Pages serves main.
Character assets are based on the project owner's supplied reference pictures.
