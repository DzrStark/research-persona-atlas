const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({ setTimeout, clearTimeout });
for (const file of ['data.js', 'scoring.js', 'portraits.js', 'portrait-chapters.js', 'presentation.js', 'share-illustrations.js', 'share.js']) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), context);
}
const run = source => vm.runInContext(source, context);

function render(url, result = run('assess(questions.map(()=>({a:3,i:5})))'), social = false) {
  const drawn = [];
  const pictures = [];
  const drawing = {
    font: '',
    measureText(text) {
      const size = Number(this.font.match(/([\d.]+)px/)?.[1]) || 24;
      return { width: [...text].length * size };
    },
    fillText(text, horizontal, vertical) { drawn.push({ text, horizontal, vertical, width: this.measureText(text).width }); },
    drawImage(image, horizontal, vertical, width, height) { pictures.push({ image, horizontal, vertical, width, height }); },
    fillRect() {},
    beginPath() {},
    roundRect() {},
    fill() {},
  };
  const canvas = { width: 0, height: 0, getContext() { return drawing; } };
  context.canvas = canvas;
  context.result = result;
  context.url = url;
  context.illustrations = Object.fromEntries([result.actualRanking[0].id, result.idealRanking[0].id].map(id => [id, { id }]));
  run((social ? 'drawSocialCard' : 'drawShareCard') + '(canvas,result,url,illustrations)');
  return { canvas, drawn, pictures, result };
}

test('share card includes the corresponding characters, stories and uncertainty', () => {
  const { drawn, pictures, result } = render('https://example.test/atlas/');
  const text = drawn.map(item => item.text).join('');
  assert.match(text, /实际画像/);
  assert.match(text, /副型/);
  assert.match(text, /理想中的我，还在探索/);
  assert.match(text, /候选：/);
  assert.match(text, /不是能力评价/);
  assert.doesNotMatch(text, /研究阶段|算力或数据不足/);
  assert.equal(pictures.length, 2);
  assert.equal(pictures[0].image.id, result.actualRanking[0].id);
  assert.equal(pictures[1].image.id, result.idealRanking[0].id);
  assert(text.includes(run('personaPortraits[result.actualRanking[0].id].story')));
  assert(text.includes(run('personaPortraits[result.idealRanking[0].id].motto')));
  assert(text.includes(run('portraitChapters[result.actualRanking[0].id][4][1]')));
});

test('compact option omits chapters while keeping the character introduction', () => {
  render('https://example.test/');
  run('drawShareCard(canvas,result,url,illustrations,false)');
  const compactHeight = context.canvas.height;
  run('drawShareCard(canvas,result,url,illustrations,true)');
  assert(context.canvas.height > compactHeight + 1000);
});

test('long URL and all 16 narrative variants stay inside the dynamic canvas', () => {
  const url = 'https://example.test/' + 'long-repository-path/'.repeat(30);
  for (let id = 0; id < 16; id++) {
    const result = run('assess(questions.map(question=>({a:vectors[' + id + '][question.d],i:vectors[' + ((id + 1) % 16) + '][question.d]})))');
    const { canvas, drawn, pictures } = render(url, result);
    assert(canvas.height > 2400);
    assert(drawn.every(item => item.vertical < canvas.height - 30));
    assert(pictures.every(item => item.vertical + item.height < canvas.height));
    const rendered = drawn.map(item => item.text).join('');
    assert(rendered.endsWith(url));
    assert(!drawn.some(item => pictures.some(picture => item.vertical >= picture.vertical && item.vertical <= picture.vertical + picture.height)), 'Text overlaps an illustration');
  }
});

test('embedded share illustrations match current assets and load without file requests', () => {
  for (let id = 0; id < 16; id++) {
    const code = 'P' + String(id + 1).padStart(2, '0');
    const uri = run('shareImageSource(' + id + ')');
    assert(uri.startsWith('data:image/svg+xml;charset=utf-8,'));
    assert.equal(decodeURIComponent(uri.split(',').slice(1).join(',')), fs.readFileSync('assets/personas/' + code + '.svg', 'utf8'));
  }
  assert.throws(() => run('shareImageSource(99)'), /未找到/);
});

test('social card keeps all 16 types and uncertainty legible within a fixed 4:5 canvas', () => {
  const cases = [run('assess(questions.map(()=>({a:3,i:5})))')];
  for (let id = 0; id < 16; id++) cases.push(run('assess(questions.map(question=>({a:vectors[' + id + '][question.d],i:vectors[' + ((id + 1) % 16) + '][question.d]})))'));
  for (const result of cases) {
    const { canvas, drawn, pictures } = render('https://dzrstark.github.io/research-persona-atlas/', result, true);
    assert.equal(canvas.width, 1080);
    assert.equal(canvas.height, 1350);
    assert.equal(pictures.length, 2);
    assert(drawn.every(item => item.horizontal >= 0 && item.horizontal + item.width <= 1020 && item.vertical < 1340));
    assert(!drawn.some(item => pictures.some(picture => item.vertical > picture.vertical && item.vertical < picture.vertical + picture.height && item.horizontal < picture.horizontal + picture.width && item.horizontal + item.width > picture.horizontal)), 'Text overlaps illustration');
    const text = drawn.map(item => item.text).join('');
    assert.match(text, /副型|候选/);
    if (result.flatIdeal || result.highIdeal) assert.match(text, /仅作探索候选，理想区分度不足/);
    assert.doesNotMatch(text, /研究阶段|算力或数据不足/);
  }
});

test('same-persona illustrations load once; image failure rejects instead of exporting an incomplete card', async () => {
  let requested = 0;
  context.Image = class {
    set src(value) { requested++; queueMicrotask(() => this.onload()); }
  };
  await run('loadShareImages(assess(questions.map(()=>({a:3,i:3}))))');
  assert.equal(requested, 1);
  context.Image = class {
    set src(value) { queueMicrotask(() => this.onerror()); }
  };
  await assert.rejects(run('loadShareImage(0)'), /插画加载失败/);
});
