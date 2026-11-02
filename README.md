# Tibo × Poteto — The Fry Maze

Tibo hides one visible fry in each of five different garden mazes.

- Each level has five candidate routes. Four contain cactus monsters, leaving exactly one safe route.
- Layouts grow from 23×23 to 39×39, rotate and change shape, and place the fry in a different position in every level.
- The safe path grows from 54 moves in Level 1 to 142 in Level 5. Later levels add more dead ends and timed gates.
- Gates alternate between open and closed. Poteto must wait for them to open.
- Touching a cactus costs one of three shared lives and returns Poteto to the entrance. Her remaining level time is preserved.
- Each level allows 45 seconds, starting on the first successful move. Pausing or switching tabs freezes the timer.
- Finding a fry makes Tibo automatically hide the next one. Completing all five levels makes Tibo surrender.
- The fry is always visible. There is no colored circle beneath Poteto.

Arrow keys or WASD move. Enter starts or retries. P or Escape pauses. Touch controls are supported.
Footsteps, wall bumps, gates, cactus contact, and collection have sound effects. Use the speaker icon to mute them.
The UI uses icons and essential counters only, with descriptive labels for assistive technology.

Run `node --test tests/maze.test.cjs` for connectivity, route counts, hazards, gates, sound events, timers, retries, and the complete five-level surrender flow.

Open index.html in a browser or serve this directory with a static HTTP server. GitHub Pages serves the root of main.
