const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const illustrations = Object.fromEntries(Array.from({ length: 16 }, (value, position) => {
  const code = 'P' + String(position + 1).padStart(2, '0');
  return [code, fs.readFileSync(path.join(root, 'assets', 'personas', code + '.svg'), 'utf8')];
}));
fs.writeFileSync(path.join(root, 'share-illustrations.js'), 'const shareIllustrations = ' + JSON.stringify(illustrations) + ';\n');
console.log('Embedded the 16 current character illustrations for local HTML canvas export.');
