# Can Tibo Capture Grok Bot?

Play as Tibo and approach the Grok Bot pictured in the supplied reference.
Grok is always visible and its eyes continuously look up, down, left, and right.

When Tibo is exactly three walkable blocks away, Poteto presses a physical red Reset button using her own attached index finger. The cap visibly compresses when she touches it.
Tibo cries during a five-second reaction scene, then the next level starts automatically.
After the fifth reset, Poteto wins; Tibo never captures Grok.

- Three distinct versions of each of the five levels, increasing in size and difficulty.
- Each page load or full new game cycles to the next version, remembered in browser storage. After the third version, the cycle repeats.
- Retries and Poteto’s automatic level resets keep the chosen version for that run.
- Five candidate routes each level: four cactus traps and one safe route.
- Cactus contact costs one of three shared lives and respawns Tibo at the entrance.
- Timed gates form bottlenecks. Wait until they open.
- Levels 1–3 allow 30 seconds each, Level 4 allows 50, and Level 5 allows 60. Timers start on the first successful move.
- Arrow keys or WASD move, Enter starts/retries, P or Escape pauses, R restarts, and M mutes. On phones, drag on the maze to move. The on-screen control strip has been removed.
- Footsteps, wall bumps, and trap sounds accompany an original background soundtrack only during active gameplay. Music is silent before movement, while paused or unfocused, during resets, and after a game ends. M mutes all audio.
- Minimal visible UI. Descriptive instructions are available to screen readers.

The three-block trigger uses shortest walking distance around walls and cactus traps,
not straight-line distance through walls. Temporarily closed gates do not change the distance.

Run `node --test tests/maze.test.cjs` for routes, hazards, gates, sounds, animated eye directions,
the exact reset distance, automatic progression, and final outcome.

Open index.html or serve this directory with a static HTTP server. GitHub Pages serves main.
Character assets are based on the project owner's supplied reference pictures.

Append `?level=3` to the game URL to start directly at Level 3. Levels 4 and 5 follow normally; R restarts at the linked level. Invalid level parameters fall back to Level 1.

The red button triggers a 4.3-second recorded child-crying effect. It plays once per reset and stops before the next level. Mute applies to it, and leaving the page stops it. See CREDITS.md for the CC0 source and edits.
