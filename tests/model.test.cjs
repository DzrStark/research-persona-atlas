const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({});
for (const file of ['data.js', 'scoring.js', 'storage.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), context);
const run = source => vm.runInContext(source, context);

test('36 questions cover each of 12 dimensions three times', () => {
  assert.equal(run('questions.length'), 36);
  assert.equal(run('dimensions.every((dimension, index) => questions.filter(question => question.d === index).length === 3)'), true);
  assert.equal(run('vectors.length === 16 && vectors.every(profile => profile.length === 12)'), true);
});
test('incomplete, sparse and invalid answers never produce results', () => {
  for (const source of ['[]', 'new Array(36)', 'Array.from({length:36},()=>({a:0,i:5}))', 'Array.from({length:36},()=>({a:3}))']) {
    assert.throws(() => run('assess(' + source + ')'));
  }
});
test('equal portraits have zero gap; endpoints map exactly', () => {
  assert.equal(run('assess(Array.from({length:36},()=>({a:3,i:3}))).gaps.every(gap=>gap===0)'), true);
  assert.equal(run('assess(Array.from({length:36},()=>({a:1,i:5}))).actual.every(value=>value===0)'), true);
  assert.equal(run('assess(Array.from({length:36},()=>({a:1,i:5}))).ideal.every(value=>value===100)'), true);
});
test('frontier, competition, autonomy, risk, criticism and abstraction remain separate', () => {
  for (const pair of [[1,7],[6,3],[10,11],[2,1]]) {
    const values = run('dimensionScores(questions.map(question=>({a:question.d===' + pair[0] + '?5:1,i:3})), "a")');
    assert.equal(values[pair[0]], 100);
    assert.equal(values[pair[1]], 0);
  }
});
test('all-high ideal is uncertain and all 16 matches remain available', () => {
  assert.equal(run('assess(Array.from({length:36},()=>({a:3,i:5}))).highIdeal'), true);
  assert.equal(run('assess(Array.from({length:36},()=>({a:3,i:5}))).idealRanking.length'), 16);
});
test('every prototype matches itself first', () => {
  assert.equal(run('vectors.every((profile,id)=>matchPersonas(profile.map(value=>(value-1)*25))[0].id===id)'), true);
});

test('relative matching is invariant to uniform shifts and positive scaling', () => {
  for (let id = 0; id < 16; id++) {
    for (const offset of [0, 10, 20]) {
      assert.equal(run('matchPersonas(vectors[' + id + '].map(value => 20 + value * 8 + ' + offset + '))[0].id'), id);
    }
  }
});

test('flat and nearly flat answers are not assigned a confident personality', () => {
  for (let rating = 1; rating <= 5; rating++) {
    assert(run('assess(questions.map(()=>({a:' + rating + ',i:' + rating + '}))).flatActual'));
    assert(run('assess(questions.map(()=>({a:' + rating + ',i:' + rating + '}))).flatIdeal'));
  }
  assert(run('lowDifferentiation([58.33,50,50,50,50,50,50,50,50,50,50,50])'));
});
test('storage rejects corrupt data and tolerates unavailable storage', () => {
  assert.equal(run('readProgress({getItem(){return "broken"}})'), null);
  assert.equal(run('writeProgress({setItem(){throw new Error()}},{})'), false);
  assert.equal(run('readProgress({getItem(){return JSON.stringify({version:1,answers:[{a:8}]})}})'), null);
});
test('storage restores partial answers without manufacturing completion', () => {
  const result = run('readProgress({getItem(){return JSON.stringify({version:1,answers:[{a:4}],index:0,finished:true,picks:[1,2,3]})}})');
  assert.equal(result.answers[0].a, 4);
  assert.equal(result.answers[0].i, undefined);
  assert.equal(result.finished, false);
});
test('restoration does not truncate invalid priorities into an apparently completed result', () => {
  assert.equal(run('readProgress({getItem(){return JSON.stringify({version:1,answers:questions.map(()=>({a:3,i:3})),index:36,picks:[0,1,2,3],finished:true})}}).finished'), false);
  assert.equal(run('readProgress({getItem(){return JSON.stringify({version:1,answers:[{a:3}],index:36,picks:[0,1,2],finished:true})}}).index'), 0);
  assert.equal(run('readProgress({getItem(){return JSON.stringify({version:1,answers:questions.map(()=>({a:3,i:3})),index:36,picks:[0,1,2],lowPriorities:[0],finished:true})}}).finished'), false);
});
