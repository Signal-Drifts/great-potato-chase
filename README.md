# The Great Potato Maze

Tibo hides one fry in each maze. Help Poteto find it before her 45 seconds run out.

## Rules

- Five mazes grow from 9×9 to 21×21 cells, with more corridors, turns, and dead ends.
- Each level has exactly one hidden fry, revealed within two cells of Poteto.
- Finding the fry clears the level. Completing all five levels wins.
- The timer resets to 45 seconds each level and starts on the first successful move.
- Three tries are shared across the game. A timeout costs one try; retrying preserves completed levels.
- Gold dots mark explored tiles. A scent hint gets warmer near the hidden fry.
- Every maze has a reachable target. Retrying preserves its layout.

## Controls

Arrow keys or WASD to move. Enter to start or continue. P or Escape to pause.
Phone and tablet players can hold the on-screen direction buttons.
Walls block movement. There is no chasing or wall-jumping in the maze game.
Sound starts after interaction and can be muted. Switching tabs pauses the timer.

## Run and publish

Open index.html in a browser, or serve the folder with a static web server.
GitHub Pages serves the root of main. Asset paths are relative.
Run automated checks with `node --test tests/*.test.cjs`.
Character assets were created from the project owner's supplied reference pictures.
