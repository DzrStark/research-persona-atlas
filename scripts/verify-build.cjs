const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('dist/index.html', 'utf8');
const dom = new JSDOM(html, { url: 'https://example.test/research-atlas/#atlas', runScripts: 'outside-only' });
dom.window.HTMLElement.prototype.scrollIntoView = function () {};
const assets = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(match => match[1]).filter(value => !value.includes('://'));
for (const asset of assets) {
  const address = new URL(asset, dom.window.location.href);
  assert(address.pathname.startsWith('/research-atlas/'), 'Asset escaped project subpath: ' + asset);
  assert(fs.existsSync(path.join('dist', asset)), 'Missing production asset: ' + asset);
}
for (const script of [...html.matchAll(/<script src="([^"]+)"/g)].map(match => match[1])) {
  vm.runInContext(fs.readFileSync(path.join('dist', script), 'utf8'), dom.getInternalVMContext(), { filename: script });
}
assert.equal(dom.window.document.querySelectorAll('.node').length, 16);
assert(dom.window.document.querySelector('.methodology'));
assert(fs.existsSync('dist/.nojekyll'));
const handbook = fs.readFileSync('dist/portraits.html', 'utf8');
for (const source of [html, handbook]) {
  assert(source.includes('property="og:image"'), 'Missing social preview metadata');
  assert(source.includes('name="twitter:card"'), 'Missing Twitter card metadata');
}
const cover = fs.readFileSync('dist/assets/social-cover.png');
assert.equal(cover.readUInt32BE(16), 1200);
assert.equal(cover.readUInt32BE(20), 630);
for (const match of handbook.matchAll(/<script src="([^"]+)"/g)) {
  assert(fs.existsSync(path.join('dist', match[1])), 'Missing handbook script: ' + match[1]);
}
for (let position = 1; position <= 16; position++) {
  assert(fs.existsSync('dist/assets/personas/P' + String(position).padStart(2, '0') + '.svg'));
}
dom.window.close();
console.log('Production scripts initialize at a project subpath with 16 nodes and all local assets.');
