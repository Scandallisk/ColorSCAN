import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'source');
const assets = resolve(source, 'colorscan/assets');
const [css, html, js, php] = await Promise.all([
  readFile(resolve(assets, 'style.css'), 'utf8'),
  readFile(resolve(assets, 'game.html'), 'utf8'),
  readFile(resolve(assets, 'game.js'), 'utf8'),
  readFile(resolve(source, 'colorscan/colorscan.php'), 'utf8'),
]);
const version = php.match(/const VERSION = '([^']+)'/)[1];
const embed = `<style>${css}</style>\n${html}\n<script>${js}</script>\n`;
await writeFile(resolve(source, 'ColorSCAN-Divi-Code.html'), embed);
await writeFile(resolve(source, 'ColorSCAN-Standalone.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ColorSCAN v${version}</title></head><body style="margin:0">${embed}</body></html>\n`);
console.log(`Built ColorSCAN ${version}: Divi and standalone editions.`);
