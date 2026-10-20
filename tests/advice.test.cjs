const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({});
for (const file of ['data.js', 'scoring.js', 'advice.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), context);
const run = source => vm.runInContext(source, context);
test('zero and negative gaps are not presented as deficits', () => {
  assert.equal(run('resultAdvice(assess(questions.map(()=>({a:3,i:3})))).rows.every(row=>row.meaning.includes("接近"))'), true);
  assert.equal(run('resultAdvice(assess(questions.map(()=>({a:5,i:1})))).rows.every(row=>row.meaning.includes("减少"))'), true);
});
test('all dimensions provide concrete distinct actions and interpretations', () => {
  assert.equal(run('dimensionAdvice.length'), 12);
  assert.equal(run('new Set(dimensionAdvice.map(row=>row[2])).size'), 12);
  assert.equal(run('dimensionAdvice.every(row=>row.length===3&&row.every(text=>text.length>10))'), true);
});
test('competing resource goals produce conditional advice', () => {
  assert.equal(run('resultAdvice(assess(questions.map(()=>({a:3,i:5})))).tensions.length'), 2);
});
