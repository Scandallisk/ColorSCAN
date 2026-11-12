# ColorSCAN

Classic Sudoku, played in color. A browser puzzle game by **KiloBytes.dev**.

**v0.3.1** builds on the responsive, board-first interface and event animations introduced in v0.3.0. It sets the fresh music-volume default to **30%**, preserves existing volume preferences, and versions the optional music URL when the plugin changes. Play on the [ColorSCAN website](https://kilobytes.dev/colorscan/).

## Play

Use all nine colors once in every row, column and 3 × 3 box. Starting marbles have a small dot and cannot be changed. Select a space, then choose a color. Double-tap a color to lock it for repeated placements; tap the locked color to unlock. Counts mean **placed / 9**.

Use Notes to track candidates, Undo to reverse a move, and Check to compare placed colors with the solution. A Hint permanently excludes that run from the shared leaderboard, including after undo/reload. Keyboard: arrows move, 1–9 place, Delete/Backspace/0 erase. Optional numbers provide a consistent color key.

## Install on WordPress

Download **colorscan-plugin.zip** from the release. Upload it through Plugins → Add New → Upload Plugin, replacing the previous ColorSCAN plugin. Keep its existing data. Use exactly one `[colorscan]` shortcode on a page.

For an existing Divi inline installation, also replace the **entire** Code module with `source/ColorSCAN-Divi-Code.html`. Clear page/Divi caches and refresh. Do not use the shortcode and full inline game together.

The outer release archive and GitHub's automatic source ZIP are **not** directly installable plugins. Use the explicitly named plugin ZIP.

The standalone HTML needs the plugin's ranked REST API configured as `window.ColorSCANConfig.apiBase` before the game script. It is not an offline/practice edition. The API, database, timing, and stored-game keys are retained from v0.2.7; no database migration is required.

### Existing website iframe integration

The game detects embedding and hides duplicate branding while retaining difficulty and New puzzle controls. Keep the existing same-origin wrapper and its height observer. Long help/preferences/leaderboard content can exceed the website's existing 1,800px height ceiling on phones; a website-specific ceiling adjustment is required before production rollout. Do not remove origin/source validation or add padding to each height message. Test fullscreen and return inside the real iframe.

## Music and assets

**No background music is distributed in this repository or its release downloads.** Music controls are disabled when no track is installed. Site owners may privately install a properly licensed track as `source/colorscan/assets/audio/background.mp3` before packaging, or the same file in the deployed plugin. The plugin detects it and enables music. Do not commit or publish it. Existing music preferences are preserved; installed tracks still follow browser autoplay rules.

The short marble-placement sound is included; it was generated for this project with Runway. The Kilobytes logo is included with the project owner's permission. Afacad is requested from Google Fonts with a sans-serif fallback; font binaries are not bundled. The game contains its own puzzle bank, not a commercial game's puzzle-card collection.

## Develop and verify

Requires **Node.js 18+** for development tools; there are no npm dependencies or frontend compilation steps.

```sh
node tools/build.mjs
node tools/verify.mjs
```

Edit the canonical files in `source/colorscan/assets/`: `game.html`, `game.js`, `style.css`. Build regenerates both HTML editions deterministically. Verify checks JS syntax, generated consistency, all 36 puzzles and motion lifecycle/reduced-motion behavior. It does not run WordPress or PHP.

PHP requires 7.4+ per the plugin header. Use a current browser supporting modern JavaScript, CSS Grid, dialog, and Web Animations. Validate the intended WordPress/browser combination in staging; real-device audio and native fullscreen can vary.

See [CHANGELOG.md](CHANGELOG.md) and [VALIDATION.md](VALIDATION.md) for this release's scope and test limits. Source is published for visibility; no open-source license is granted by this release. Branding and assets remain their owners' property.
