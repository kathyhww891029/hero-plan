import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const path = 'app.js';
let s = readFileSync(path, 'utf8');

// ── FIX 1: toggleDaily (second def at ~4931) - add DAILY_TEMP_TASKS to task lookup ──
// Find the second toggleDaily and fix its allTasks arrays
const secondToggleIdx = s.indexOf('function toggleDaily(id, score)', 3000);
console.log('Second toggleDaily at:', secondToggleIdx);

// Fix the first allTasks (fixed task branch)
s = s.slice(0, secondToggleIdx) +
    s.slice(secondToggleIdx).replace(
      'const allTasks = [...DAILY_FIXED, ...DAILY_OPTIONAL, ...DAILY_HOMEWORK];',
      'const allTasks = [...DAILY_FIXED, ...DAILY_OPTIONAL, ...DAILY_HOMEWORK, ...DAILY_TEMP_TASKS];'
    );

// Need to re-find after the replacement since we replaced in the slice
const secondToggleIdx2 = s.indexOf('function toggleDaily(id, score)', secondToggleIdx + 10);
console.log('After first fix, second toggleDaily still at:', secondToggleIdx2);

// Fix the second allTasks (optional branch) - it's allTasks2 in this function
s = s.slice(0, secondToggleIdx2) +
    s.slice(secondToggleIdx2).replace(
      'const allTasks2 = [...DAILY_FIXED, ...DAILY_OPTIONAL, ...DAILY_HOMEWORK];',
      'const allTasks2 = [...DAILY_FIXED, ...DAILY_OPTIONAL, ...DAILY_HOMEWORK, ...DAILY_TEMP_TASKS];'
    );

// ── FIX 2: calcTodayScore (second def at ~5049) - add DAILY_TEMP_TASKS ──
const secondCalcIdx = s.indexOf('function calcTodayScore()', 3000);
console.log('Second calcTodayScore at:', secondCalcIdx);

s = s.slice(0, secondCalcIdx) +
    s.slice(secondCalcIdx).replace(
      'const all = [...DAILY_FIXED, ...DAILY_OPTIONAL, ...DAILY_HOMEWORK];',
      'const all = [...DAILY_FIXED, ...DAILY_OPTIONAL, ...DAILY_HOMEWORK, ...DAILY_TEMP_TASKS];'
    );

writeFileSync(path, s);
console.log('Done. Length:', s.length);

// Verify syntax
try {
  execSync('node --check app.js', { stdio: 'inherit' });
  console.log('✅ Syntax OK');
} catch {
  console.log('❌ Syntax error');
}
