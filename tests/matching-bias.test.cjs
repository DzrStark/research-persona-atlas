const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({});
for (const file of ['data.js', 'scoring.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), context);
const { vectors, matchPersonas } = vm.runInContext('({ vectors, matchPersonas })', context);

test('synthetic high-rating stress test reproduces old bias without concentration in V2', () => {
  let seed = 78123;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const oldCounts = Array(16).fill(0);
  const newCounts = Array(16).fill(0);
  for (let sample = 0; sample < 10000; sample++) {
    const values = Array.from({ length: 12 }, () => (Array.from({ length: 3 }, () => 3 + Math.floor(random() * 3)).reduce((sum, value) => sum + value, 0) / 3 - 1) * 25);
    const oldRanking = vectors.map((profile, id) => ({ id, distance: profile.reduce((sum, value, position) => sum + ((value - 1) * 25 - values[position]) ** 2, 0) })).sort((first, second) => first.distance - second.distance);
    oldCounts[oldRanking[0].id]++;
    newCounts[matchPersonas(values)[0].id]++;
  }
  assert(oldCounts[8] > 5500);
  assert(oldCounts[8] + oldCounts[0] > 9500);
  assert(Math.max(...newCounts) < 2000);
  assert(newCounts.every(count => count > 0));
  console.log('Synthetic stress test (not user statistics): old system integrator ' + oldCounts[8] + '/10000; V2 ' + newCounts[8] + '/10000.');
});
