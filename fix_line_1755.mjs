import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

let s = readFileSync('app.js', 'utf8');
const lines = s.split('\n');

function patch(lineIdx, newContent) {
  lines[lineIdx] = newContent;
}

// Line 1755: first toggleDaily optional branch (allTasks2)
patch(1754, 'const allTasks2 = [...DAILY_FIXED, ...DAILY_OPTIONAL, ...DAILY_HOMEWORK, ...DAILY_TEMP_TASKS];');

// Line 4951: second toggleDaily fixed branch
patch(4950, 'const allTasks = [...DAILY_FIXED, ...DAILY_OPTIONAL, ...DAILY_HOMEWORK, ...DAILY_TEMP_TASKS];');

// Line 4969: second toggleDaily optional branch
patch(4968, 'const allTasks = [...DAILY_FIXED, ...DAILY_OPTIONAL, ...DAILY_HOMEWORK, ...DAILY_TEMP_TASKS];');

// Line 5056: second calcTodayScore
patch(5055, 'const all = [...DAILY_FIXED, ...DAILY_OPTIONAL, ...DAILY_HOMEWORK, ...DAILY_TEMP_TASKS];');

const newContent = lines.join('\n');
writeFileSync('app.js', newContent);
console.log('Patched. Length:', newContent.length);

// Verify
try {
  execSync('node --check app.js', { stdio: 'inherit' });
  console.log('✅ Syntax OK');
} catch {
  console.log('❌ Syntax error');
}
