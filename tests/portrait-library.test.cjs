const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

test('persona handbook opens all 16 long readings without creating assessment data', () => {
  const html = fs.readFileSync('portraits.html', 'utf8');
  const dom = new JSDOM(html, { url: 'https://example.test/atlas/portraits.html#P16', runScripts: 'outside-only' });
  dom.window.HTMLElement.prototype.scrollIntoView = function () {};
  for (const match of html.matchAll(/<script src="([^"]+)"/g)) {
    vm.runInContext(fs.readFileSync(match[1], 'utf8'), dom.getInternalVMContext());
  }
  assert.equal(dom.window.document.querySelector('#libraryName').textContent, '理论抽象者');
  assert.equal(dom.window.document.querySelectorAll('#personaPicker option').length, 16);
  assert.equal(dom.window.document.querySelectorAll('#libraryGallery a').length, 16);
  for (let position = 1; position <= 16; position++) {
    dom.window.history.replaceState(null, '', '#P' + String(position).padStart(2, '0'));
    dom.window.dispatchEvent(new dom.window.HashChangeEvent('hashchange'));
    assert.equal(dom.window.document.querySelectorAll('.portrait-chapter').length, 5);
    assert.equal(dom.window.document.querySelector('#personaPicker').value, String(position - 1));
    assert.equal(dom.window.document.querySelector('#libraryGallery [aria-current="true"]').getAttribute('data-persona'), String(position - 1));
    assert(dom.window.document.querySelector('#libraryPortrait').textContent.length > 850);
  }
  assert.equal(dom.window.localStorage.length, 0);
  dom.window.close();
});
