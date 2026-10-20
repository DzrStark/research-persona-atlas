const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('index.html', 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(match => match[1]);
const storageKey = 'research-persona-atlas-v1';

function openApp(state, unavailableStorage = false) {
  const dom = new JSDOM(html, { url: 'https://example.test/project/', runScripts: 'outside-only', pretendToBeVisual: true });
  dom.window.HTMLElement.prototype.scrollIntoView = function () {};
  if (state) dom.window.localStorage.setItem(storageKey, state);
  if (unavailableStorage) Object.defineProperty(dom.window, 'localStorage', { get() { throw new Error('Storage blocked'); } });
  for (const script of scripts) vm.runInContext(fs.readFileSync(script, 'utf8'), dom.getInternalVMContext(), { filename: script });
  const select = selector => dom.window.document.querySelector(selector);
  const click = selector => {
    const element = select(selector);
    assert(element, 'Missing control: ' + selector);
    if (typeof element.click === 'function') element.click();
    else element.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  };
  return { dom, select, click };
}

function answerAll(app) {
  app.click('#startBtn');
  for (let position = 0; position < 36; position++) {
    app.click('input[name="a"][value="' + (position % 5 + 1) + '"]');
    app.click('input[name="i"][value="' + ((position + 2) % 5 + 1) + '"]');
    app.click('#next');
  }
}

test('fresh app exposes all personas and full details without answering', () => {
  const app = openApp();
  assert.equal(app.dom.window.document.querySelectorAll('.node').length, 16);
  assert.equal(app.select('.atlas-layout').children.length, 2);
  app.click('.node[data-id="0"]');
  assert.match(app.select('#nodeDetail').textContent, /优势：.*风险：/s);
  assert.equal(app.select('#result').classList.contains('hidden'), true);
  app.click('[data-example="0"]');
  assert.match(app.select('#pathStages').textContent, /示例原型，不是个人测评/);
  app.select('#targetSelect').value = '0';
  app.select('#targetSelect').dispatchEvent(new app.dom.window.Event('change'));
  assert.match(app.select('#pathStages').textContent, /示例原型，不是个人测评/);
  app.click('#returnExamples');
  assert.equal(app.dom.window.document.querySelectorAll('[data-example]').length, 3);
  app.dom.window.close();
});

test('independent partial answers survive refresh; missing ideal cannot advance', () => {
  const app = openApp();
  app.click('#startBtn');
  app.click('input[name="a"][value="4"]');
  app.click('#next');
  assert.match(app.select('#answerError').textContent, /分别回答/);
  const state = app.dom.window.localStorage.getItem(storageKey);
  app.dom.window.close();
  const restored = openApp(state);
  restored.click('#startBtn');
  assert.equal(restored.select('input[name="a"]:checked').value, '4');
  assert.equal(restored.select('input[name="i"]:checked'), null);
  restored.click('input[name="i"][value="2"]');
  restored.click('#next');
  assert.match(restored.select('.question-meta').textContent, /Q2/);
  restored.click('#prev');
  restored.click('input[name="a"][value="1"]');
  assert.equal(restored.select('input[name="i"]:checked').value, '2');
  restored.dom.window.close();
});

test('full assessment enforces priorities, renders results and changes targets without changing ideal', () => {
  const app = openApp();
  answerAll(app);
  app.click('#finish');
  assert.match(app.select('#priorityError').textContent, /恰好/);
  for (const position of [0, 1, 2]) app.click('.priority-grid input[value="' + position + '"]');
  app.click('#finish');
  assert.equal(app.select('#result').classList.contains('hidden'), false);
  assert.equal(app.select('#allMatches'), null);
  assert.equal(app.dom.window.document.querySelectorAll('.portrait-art img').length, 2);
  assert.equal(app.dom.window.document.querySelectorAll('.portrait-story blockquote').length, 2);
  assert.equal(app.dom.window.document.querySelectorAll('.full-reading[open]').length, 0);
  assert.equal(app.dom.window.document.querySelectorAll('.full-reading .portrait-chapter').length, 10);
  assert(app.select('#shareSlot #shareCard'));
  assert.equal(app.select('[name="shareFormat"]:checked').value, 'social');
  assert(app.select('#resultRoute #pathStages'));
  assert.doesNotMatch(app.select('#actualMatch').textContent, /%/);
  assert.equal(app.dom.window.document.querySelectorAll('#bars details').length, 12);
  assert(app.select('#radarOverview svg'));
  const ideal = app.select('#idealName').textContent;
  app.select('#targetSelect').value = '15';
  app.select('#targetSelect').dispatchEvent(new app.dom.window.Event('change'));
  assert.equal(app.select('#idealName').textContent, ideal);
  assert.match(app.select('#pathStages').textContent, /理论抽象者/);
  const state = app.dom.window.localStorage.getItem(storageKey);
  app.dom.window.close();
  const restored = openApp(state);
  assert.equal(restored.select('#result').classList.contains('hidden'), false);
  restored.click('#editBtn');
  assert.equal(restored.select('#result').classList.contains('hidden'), true);
  assert.match(restored.select('.question-meta').textContent, /Q1/);
  restored.click('#restartBtn');
  assert.equal(restored.dom.window.localStorage.getItem(storageKey), null);
  assert.equal(restored.select('#progressText').textContent, '0 / 36');
  assert.equal(restored.select('#result').classList.contains('hidden'), true);
  restored.dom.window.close();
});

test('blocked storage remains usable and never falsely claims persistent deletion', () => {
  const app = openApp(null, true);
  app.click('#startBtn');
  app.click('input[name="a"][value="3"]');
  assert.match(app.select('[role="status"]').textContent, /无法保存/);
  app.click('#restartBtn');
  assert.match(app.select('[role="status"]').textContent, /无法删除浏览器存储/);
  app.dom.window.close();
});
