const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="([^"]+)"/g)].map(match => match[1]);
for (const file of files) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  new vm.Script(source, { filename: file });
  assert(!/fetch\(|XMLHttpRequest|https:\/\/.*\.js/.test(source), 'Runtime must not require remote services');
}
assert(files.length === new Set(files).size, 'Scripts must not be loaded twice');
for (const source of [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(match => match[1])) {
  if (!source.includes('://')) assert(fs.existsSync(path.join(root, source)), 'Missing asset: ' + source);
}
console.log('Syntax, local asset references and absence of remote runtime services checked.');
