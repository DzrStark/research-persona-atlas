const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({});
for (const file of ['data.js', 'personas.js', 'scoring.js', 'background.js']) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), context);
}
const run = source => vm.runInContext(source, context);

test('each persona has complete behavior, strengths, risks and keywords', () => {
  assert.equal(run('personaDetails.length'), 16);
  assert.equal(run('personaDetails.every(detail=>["behavior","strength","risk","keywords"].every(key=>typeof detail[key]==="string"&&detail[key].length>5))'), true);
});

test('application preference supplements interpretation even with low engineering scores', () => {
  const scores = run('assess(questions.map(question=>({a:question.d===8?1:3,i:3})))');
  assert.equal(scores.actual[8], 0);
  assert(scores.actualRanking.some(item => item.id === 12));
  assert.equal(run('backgroundExplanation(sanitizeBackground({outcomes:["现实应用"]}))[0].includes("不改变类型排名")'), true);
  assert.equal(run('sanitizeBackground({outcomes:["<script>","现实应用"]}).outcomes.length'), 1);
});

test('prototype dimensions are distinct finite values with no all-high prototype', () => {
  assert.equal(run('vectors.every(profile=>profile.every(value=>Number.isInteger(value)&&value>=1&&value<=5))'), true);
  assert.equal(run('new Set(vectors.map(profile=>profile.join(","))).size'), 16);
  assert.equal(run('vectors.every(profile=>Math.min(...profile)<3)'), true);
});
