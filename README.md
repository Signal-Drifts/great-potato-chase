# Tibo × Poteto — The Fry Maze

Tibo hides a fry. Poteto has 45 seconds to reach it.

- Five garden mazes grow from 15×15 to 31×31 cells.
- Level 1 has exactly three distinct routes to the fry. Later levels have four, five, six, and seven routes, plus increasing dead ends.
- The fry is always visible. Poteto has no colored marker beneath her feet.
- Finding a fry makes Tibo reset the board and hide the next fry automatically.
- Finishing all five levels makes Tibo surrender.
- Each level starts with 45 seconds. The timer waits for the first successful move.
- Three tries are shared across the game. A timeout costs one; retrying preserves completed levels.

Arrow keys or WASD to move. Enter to start or retry. P or Escape to pause. Touch controls work on phones.
Sound can be muted with the speaker icon. Switching tabs pauses play.

The UI uses icon controls. Labels and instructions for assistive technology are not visible on the board.
Garden artwork is drawn directly in canvas. The character assets use the supplied reference pictures.

Run `node --test tests/maze.test.cjs` for route counts, connectivity, always-visible fry rendering, timers, retries, and the full five-level surrender flow.

Open index.html locally or serve with any static HTTP server. GitHub Pages serves the root of main. All paths are relative.
