# Changes

## 0.3.2 — Moves within reach

- Original Undo and Erase buttons move directly beneath the board at phone widths or on coarse-pointer/touch layouts. Desktop controls retain their dock location; no duplicate action buttons.
- Mobile feedback text moves below the other controls.
- Hold a player-placed marble for 380ms to lift, then drag to an empty editable cell. Starting pieces and occupied destinations are protected; canceled/invalid drops leave the board untouched.
- Valid drops commit one atomic move, update peer notes, preserve hint eligibility, save, and run the existing completion check. One Undo restores both cells and notes.
- Handles quick taps, pre-hold drift, pointer cancellation/capture loss, second touches, Escape, page hiding and resizing without saving a partial move.
- Added 57 actual-code move/gesture/control assertions plus local browser DOM integration using simulated touch pointer events. Physical-device touch validation remains separate.

## 0.3.1 — Music update

- Fresh/default music volume is 30%; saved personal volume choices, including mute, are preserved.
- Optional music URL includes the plugin version, so the website can replace a track without continuing to use an older cached file.
- New site music was supplied privately by the project owner. No background track is included in this repository or public downloads.
- Added actual-code checks for the fresh default, saved zero/nonzero volumes and clamping.

## 0.3.0 — A brighter brain break

- Board-first layout with a 600px desktop board and adjacent 3 × 3 color dock; full-width phone board and 5 + 4 color palette.
- Afacad typography, monochrome surfaces, fine rules and restrained KiloBytes orange accents.
- Clear placed/9 counts, lock/notes status, selected coordinates, progress rule and 52px tool targets.
- Collapsible sound/display preferences and compact embedded branding; one fullscreen control retained.
- New puzzle entrance, placement/note bounce, hint reveal, undo fade, Check feedback and dialog entrance. Existing win confetti retained. All nonessential motion respects reduced-motion preferences.
- Event animations preserve elapsed time across board redraws and do not drive gameplay, timing or saves.
- Background music excluded from public distribution. Optional privately installed licensed tracks are detected by WordPress; placement SFX remains independent.
- Repeatable generated HTML build and dependency-free verification script.
- No changes to ranked REST routes, score eligibility rules, database schema, puzzle bank or storage keys.

## 0.2.7 — Recovered baseline

Music/SFX controls, fullscreen layout, placed-color counters and resilient leaderboard refresh. The original transfer and release remain outside this public repository because they include non-redistributable music and private engineering handoff context.
