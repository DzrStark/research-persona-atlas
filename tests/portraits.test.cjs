const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const context = vm.createContext({});
for (const file of ['data.js', 'portraits.js', 'portrait-chapters.js']) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), context);
}
const run = source => vm.runInContext(source, context);

test('all 16 personalities have unique narratives and valid local illustrations', () => {
  assert.equal(run('personaPortraits.length'), 16);
  assert.equal(run('new Set(personaPortraits.map(portrait=>portrait.motto)).size'), 16);
  const illustrations = new Set();
  for (let position = 0; position < 16; position++) {
    const markup = run('portraitMarkup(' + position + ')');
    const document = new JSDOM(markup).window.document;
    const path = document.querySelector('img').getAttribute('src');
    const svg = fs.readFileSync(path, 'utf8');
    const image = new JSDOM(svg, { contentType: 'image/svg+xml' });
    assert.equal(image.window.document.documentElement.tagName, 'svg');
    assert(document.querySelector('.portrait-story').textContent.length > 850);
    assert.equal(document.querySelectorAll('.portrait-chapter').length, 5);
    assert(document.querySelector('img').getAttribute('alt'));
    illustrations.add(svg);
    image.window.close();
    document.defaultView.close();
  }
  assert.equal(illustrations.size, 16);
});

test('aspirational story distinguishes wishes and uncertainty from actual habits', () => {
  assert.match(run('portraitMarkup(0, "ideal")'), /不代表你现在已经如此/);
  assert.match(run('portraitMarkup(0, "ideal", true)'), /不是确定的理想标签/);
  assert.doesNotMatch(run('portraitMarkup(0, "actual")'), /不代表你现在已经如此/);
});
