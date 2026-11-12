# v0.3.1 validation

The v0.3.1 follow-up passed all checks below plus actual audio-preference code tests: fresh default 30%, saved 0% and 68% retained, out-of-range volume clamped. The supplied private 266.667-second stereo WAV was converted to a 192 kbps MP3 and fully decoded successfully. That file is excluded from public source and packages. Live deployment findings are recorded separately after rollout.

November 12, 2026. Tests used local synthetic API responses, saved games and scores. No production scores were submitted and this release has not been deployed to WordPress.

## Passed

- JavaScript parsed with the bundled modern Node runtime; generated Divi and standalone scripts/styles/markup match canonical files.
- All 36 puzzle-bank solutions are legal, givens match, clue counts are 42/34/28, and every puzzle has exactly one solution.
- Motion lifecycle test: unchanged board does not reanimate; changed cells animate; repeat renders resume elapsed timing; reduced-motion path creates no animations.
- Browser: 81 cells / 9 colors; desktop board width 600px. Keyboard placement, candidate notes, undo, hint reveal/status, palette double-click lock and locked-color placement, immutable starting pieces.
- Browser: synthetic near-win triggers dialog, finish verification, 3-letter score submission, save feedback and leaderboard refresh.
- Browser: fullscreen enter/exit restores root placement and body overflow, including inside same-origin iframe.
- Missing-music state disables Music and volume, explains why, and leaves SFX available. Private background track is absent from release source and ZIPs.
- Phone layout: 5+4 colors, 52px tool buttons, no horizontal content overflow in exact 320px and 390px iframe fixtures.

## Integration findings

The current website uses a same-origin shortcode iframe and clamps reported height to 1,800px. Local natural body measurements with two synthetic leaderboard rows:

| Iframe content width | Help/preferences closed | Both open |
| --- | ---: | ---: |
| 320px | about 1,855–1,878px | 3,184px |
| 390px | about 1,795px | 2,770px |

Exact heights vary with status text, font loading and number of score rows. The website owner should adjust the **ColorSCAN-only** fixed ceiling before rollout (4,200px proposed for normal layouts), retaining finite height validation, origin/source checks, the 400px floor and scroll access when content exceeds the ceiling. Apply reported height itself, not height plus repeated padding. Existing wrapper owns ResizeObserver messaging; no duplicate observer was added to the game.

## Not verified

- PHP syntax/runtime, WordPress activation or a real API/database instance.
- Actual production plugin version, deployment, page caches or the live upgraded iframe.
- Physical Samsung S23/iOS testing, native mobile fullscreen behavior, audible SFX listening, or optional privately installed music playback.
- 200% browser zoom/orientation acceptance matrix, all browsers, accessibility screen-reader announcement timing.
- This release does not establish human-proof leaderboard integrity; the existing client contains the solution for Check/hints.

The original transfer's historical test claims are not repeated as new evidence.
