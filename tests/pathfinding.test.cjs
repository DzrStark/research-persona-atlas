const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({});
for (const file of ['data.js', 'pathfinding.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), context);
const run = source => vm.runInContext(source, context);
test('all three required examples follow their directed stages', () => {
  for (const route of [[13,6,14,15], [5,1,2,4], [7,12,8,0]]) {
    const actual = route[0], target = route.at(-1);
    assert.equal(run('JSON.stringify(planPath(' + actual + ',' + target + ',vectors[' + actual + '].map(value=>(value-1)*25),vectors[' + target + '].map(value=>(value-1)*25)).nodes)'), JSON.stringify(route));
  }
});
test('same node has no artificial transition and missing route falls back', () => {
  assert.equal(run('planPath(2,2,Array(12).fill(50),Array(12).fill(50)).edges.length'), 0);
  assert.equal(run('planPath(15,7,Array(12).fill(50),Array(12).fill(50)).fallback'), true);
});
test('cost depends on user scores and target, not geometry', () => {
  assert.notEqual(run('edgeCost(personaRelations[0],Array(12).fill(0),Array(12).fill(50))'), run('edgeCost(personaRelations[0],Array(12).fill(100),Array(12).fill(50))'));
});
test('Dijkstra selects lower behavioral cost rather than first edge', () => {
  assert.equal(run('JSON.stringify(planPath(0,3,Array(12).fill(50),Array(12).fill(50),[],[{from:0,to:1,dimensions:[1]},{from:1,to:3,dimensions:[1]},{from:0,to:3,dimensions:[1]}]).nodes)'), '[0,3]');
});
