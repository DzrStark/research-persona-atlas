const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({});
for (const file of ['data.js', 'scoring.js', 'presentation.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), context);
const run = source => vm.runInContext(source, context);

test('summary distinguishes same profiles, uncertainty and signed differences without altering results', () => {
  assert.match(run('resultSummary(assess(questions.map(question=>({a:vectors[5][question.d],i:vectors[5][question.d]}))))'), /实际习惯与理想投入一致/);
  assert.match(run('resultSummary(assess(questions.map(()=>({a:3,i:5}))))'), /不足以确定/);
  assert.match(run('resultSummary(assess(questions.map(question=>({a:vectors[2][question.d],i:vectors[5][question.d]}))))'), /竞争驱动.*减少/);
  assert.match(run('resultSummary(assess(questions.map(question=>({a:vectors[5][question.d],i:vectors[2][question.d]}))))'), /竞争驱动.*增加/);
  for (let actual = 0; actual < 16; actual++) {
    for (let ideal = 0; ideal < 16; ideal++) {
      run('globalThis.result = assess(questions.map(question=>({a:vectors[' + actual + '][question.d],i:vectors[' + ideal + '][question.d]})))');
      const before = run('JSON.stringify(result)');
      assert(run('resultSummary(result).length') <= 150);
      assert.equal(run('JSON.stringify(result)'), before);
    }
  }
});
