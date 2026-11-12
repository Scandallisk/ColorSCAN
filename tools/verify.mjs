import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFile(resolve(root, file), 'utf8');
const js = await read('source/colorscan/assets/game.js');
new vm.Script(js);
const css = await read('source/colorscan/assets/style.css');
const html = await read('source/colorscan/assets/game.html');
for (const name of ['Divi-Code', 'Standalone']) {
  const copy = await read(`source/ColorSCAN-${name}.html`);
  assert.equal(copy.match(/<script>([\s\S]*?)<\/script>/)[1], js);
  assert.equal(copy.match(/<style>([\s\S]*?)<\/style>/)[1], css);
  assert.ok(copy.includes(html));
}
assert.equal((html.match(/data-action="fullscreen"/g) || []).length, 1);
assert.equal((html.match(/id="colorscan"/g) || []).length, 1);
const php = await read('source/colorscan/colorscan.php');
assert.ok(php.includes('Version: 0.3.1') && php.includes("const VERSION = '0.3.1'"));
console.log('PASS: JS syntax, both generated editions, unique root/fullscreen, version alignment');

const peers = (i, j) => (i / 9 | 0) === (j / 9 | 0) || i % 9 === j % 9 || ((i / 27 | 0) === (j / 27 | 0) && (i % 9 / 3 | 0) === (j % 9 / 3 | 0));
const neighbor = Array.from({ length: 81 }, (_, i) => Array.from({ length: 81 }, (_, j) => j).filter(j => j !== i && peers(i, j)));
function count(board, limit = 2) {
  let best = -1, choices;
  for (let i = 0; i < 81; i++) {
    if (board[i]) continue;
    const options = [1,2,3,4,5,6,7,8,9].filter(n => !neighbor[i].some(j => board[j] === n));
    if (!options.length) return 0;
    if (!choices || options.length < choices.length) { best = i; choices = options; }
    if (options.length === 1) break;
  }
  if (best < 0) return 1;
  let total = 0;
  for (const n of choices) { board[best] = n; total += count(board, limit - total); if (total >= limit) break; }
  board[best] = 0;
  return total;
}
const bank = JSON.parse(await read('source/colorscan/puzzles.json'));
for (const [level, puzzles] of Object.entries(bank)) {
  assert.equal(puzzles.length, 12);
  for (const { givens, solution } of puzzles) {
    assert.equal(givens.length, 81); assert.equal(solution.length, 81);
    assert.ok(solution.every((v, i) => Number.isInteger(v) && v >= 1 && v <= 9 && neighbor[i].every(j => solution[j] !== v)));
    assert.ok(givens.every((v, i) => v === 0 || v === solution[i]));
    assert.equal(givens.filter(Boolean).length, {easy:42,medium:34,hard:28}[level]);
    assert.equal(count([...givens]), 1);
  }
}
console.log('PASS: all 36 puzzles legal, correct clue counts, exactly one solution');

// Exercise the motion lifecycle independently of browser timing: repeated renders,
// changed cells, notes, reduced motion and expired events.
let now = 0, reduced = false;
const calls = [];
const target = { animate: (frames, options) => { const animation = {}; calls.push({ frames, options, animation }); return animation; }, querySelector() { return null; } };
const mode = { dataset: {} };
const context = vm.createContext({
  window: { matchMedia: () => ({ matches: reduced }) }, performance: { now: () => now },
  state: { run: { token: 'synthetic' }, board: Array(81).fill(0), notes: Array.from({length:81}, () => []) },
  root: { setAttribute() {} }, busy: false, noteMode: false, lockedColor: 0, selected: -1, colors: [['Red']],
  $: selector => selector === '.cs-mode' ? mode : selector === '.cs-meter-fill' ? { style: { setProperty() {} } } : target,
});
vm.runInContext(js.slice(js.indexOf('// Keep event timestamps'), js.indexOf('function render(){')), context);
vm.runInContext('animateFeedback()', context);
assert.equal(calls.length, 1);
now = 500;
vm.runInContext('animateFeedback()', context);
assert.equal(calls.length, 1, 'idle render must not reanimate the board');
context.state.board[1] = 1;
vm.runInContext('animateFeedback()', context);
assert.equal(calls.length, 2);
now = 600;
vm.runInContext('animateFeedback()', context);
assert.equal(calls.at(-1).animation.currentTime, 100, 'repeat render resumes elapsed motion');
now = 900; reduced = true; context.state.notes[2] = [1];
vm.runInContext('animateFeedback()', context);
assert.equal(calls.length, 3, 'reduced motion must create no animations');
console.log('PASS: event motion, repeat render timing, idle rendering and reduced motion');
const audioPreferences = js.slice(js.indexOf('const audioKey='), js.indexOf('const audioConfig='));
for (const [saved, expected] of [[null, .30], [{volume:0}, 0], [{volume:.68}, .68], [{volume:2}, 1]]) {
  const audioContext = vm.createContext({localStorage:{getItem:() => saved ? JSON.stringify(saved) : null}});
  vm.runInContext(audioPreferences, audioContext);
  assert.equal(vm.runInContext('audioPrefs.volume', audioContext), expected);
}
assert.ok(html.includes('>30%</output>'));
assert.ok(php.includes("add_query_arg('ver', self::VERSION"));
console.log('PASS: 30% fresh default, saved/zero volume retained, clamping and versioned music URL');
console.log('LIMIT: does not exercise WordPress/PHP runtime or real-device audio.');
