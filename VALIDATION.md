# v0.3.2 validation

## Automated checks

- JavaScript syntax and generated Divi/standalone editions match canonical source.
- All 36 puzzles have legal solutions, matching givens and exactly one solution.
- Event motion respects reduced-motion preferences and does not restart on idle renders.
- Fresh music-volume default is 30%; saved zero/nonzero preferences remain intact.
- 57 assertions cover atomic marble movement, notes, undo snapshots, invalid destinations, cancellation, multi-pointer interruption, click suppression and responsive button placement.

## Local browser checks

- Phone-width layout places the original Undo and Erase buttons directly beneath the board, without duplicates or horizontal overflow.
- Desktop layout returns those same buttons to the tool dock.
- Simulated touch pointer events exercise the hold timer, lifted ghost, destination outline, committed move, cleanup and single-step undo against the actual browser DOM.

## Limits

Simulated pointer events do not establish physical-device touch behavior. Finger dragging, operating-system interruptions and browser-specific fullscreen behavior need testing on the target phone. Local checks do not prove deployment to any website. No public leaderboard scores are needed for these tests.
