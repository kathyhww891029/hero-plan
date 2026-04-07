import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const s = readFileSync('app.js', 'utf8');
const lines = s.split('\n');

// ─────────────────────────────────────────────────────────────
// STEP 1: 重写第二个 calcMonthlyDisciplineRate（实际生效版本）
// 行号 4984 开始
// ─────────────────────────────────────────────────────────────
const rewriteStart = 4983; // 0-indexed, line 4984
const rewriteEnd   = 5006; // 0-indexed, line 5007

const newCalc = `function calcMonthlyDisciplineRate(year, month) {
  if (!state.selfReport) return { rate: 0, selfDays: 0, totalDays: 0 };
  const prefix = \`\${year}-\${String(month).padStart(2,'0')}\`;

  // 当月所有日期
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const isCurrentMonth = (today.getFullYear() === year && today.getMonth() + 1 === month);
  const lastDay = isCurrentMonth ? today.getDate() : daysInMonth;

  // 每天是否满足"固定任务≥65%且全部self"的条件
  const day65 = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = \`\${prefix}-\${String(d).padStart(2,'0')}\`;
    const tasks = state.selfReport[dateStr];
    if (!tasks) { day65[d] = false; continue; }
    const fixedIds = DAILY_FIXED.map(t => t.id);
    const completedFixed = fixedIds.filter(id => tasks[id]);
    const allSelf = completedFixed.length > 0 && completedFixed.every(id => tasks[id] === 'self');
    day65[d] = (completedFixed.length / fixedIds.length >= 0.65) && allSelf;
  }

  // 连续7天"每天至少1个自主任务"的条件
  const dayStreak = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = \`\${prefix}-\${String(d).padStart(2,'0')}\`;
    const tasks = state.selfReport[dateStr];
    const hasSelf = tasks && Object.values(tasks).some(v => v === 'self');
    dayStreak[d] = hasSelf;
  }

  // 统计自律天数（去重：65%条件 or 连续7天 streak 均可计入一天）
  let selfDays = 0;
  for (let d = 1; d <= lastDay; d++) {
    if (day65[d]) { selfDays++; continue; }
    // 检查以 d 为结尾的连续7天 streak
    let streakOk = true;
    for (let k = d - 6; k <= d; k++) {
      if (k < 1 || !dayStreak[k]) { streakOk = false; break; }
    }
    if (streakOk) {
      // streak 内的7天都计入（已计过的会因 continue 跳过）
      for (let k = d - 6; k <= d; k++) day65[k] = true; // 标记为已计
      selfDays += 7;
    }
  }

  const totalDays = lastDay;
  const rate = totalDays > 0 ? Math.round(selfDays / totalDays * 100) : 0;
  return { rate, selfDays, totalDays };
}`;

// Rebuild
lines.splice(rewriteStart, rewriteEnd - rewriteStart + 1, newCalc);

// ─────────────────────────────────────────────────────────────
// STEP 2: 找到并删除第一个 calcMonthlyDisciplineRate（死代码）
// 行号 1801 开始，在新的 lines 数组中需要重新定位
// ─────────────────────────────────────────────────────────────
// 先找到它在新的数组中的位置（搜索第一个 calcMonthlyDisciplineRate）
let firstCalcIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function calcMonthlyDisciplineRate(year, month)')) {
    if (firstCalcIdx === -1) {
      firstCalcIdx = i;
    } else {
      // 第二个找到时停止
      break;
    }
  }
}

// 删除从 firstCalcIdx 到下一个空行或函数之前的所有行（1801 附近的版本）
// 先确认这个函数的结束位置（找下一个空行或 function 关键字）
let deleteEnd = firstCalcIdx;
for (let i = firstCalcIdx + 1; i < lines.length; i++) {
  if (lines[i].trim() === '' || lines[i].match(/^function\s+\w+\(/)) {
    deleteEnd = i - 1;
    break;
  }
}

console.log(`First calcMonthlyDisciplineRate at lines ${firstCalcIdx + 1}-${deleteEnd + 1}`);
console.log(`First few lines: ${lines.slice(firstCalcIdx, firstCalcIdx + 3).map(l => l.trim())}`);

// 删除这段死代码
lines.splice(firstCalcIdx, deleteEnd - firstCalcIdx + 1);
console.log(`Deleted first calcMonthlyDisciplineRate (dead code)`);

// ─────────────────────────────────────────────────────────────
// STEP 3: 找到并删除第一个 renderDisciplineBar（死代码）
// ─────────────────────────────────────────────────────────────
let firstBarIdx = -1, firstBarEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function renderDisciplineBar()')) {
    if (firstBarIdx === -1) {
      firstBarIdx = i;
      // 找结束
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() === '' || lines[j].match(/^function\s+\w+\(/)) {
          firstBarEnd = j - 1;
          break;
        }
      }
    }
  }
}
if (firstBarIdx !== -1) {
  console.log(`First renderDisciplineBar at lines ${firstBarIdx + 1}-${firstBarEnd + 1}`);
  lines.splice(firstBarIdx, firstBarEnd - firstBarIdx + 1);
  console.log('Deleted first renderDisciplineBar (dead code)');
}

// ─────────────────────────────────────────────────────────────
// STEP 4: 更新 renderDisciplineBar 的自律天数显示（UI 微调）
// 找第二个 renderDisciplineBar，把"自律天数：X/Y天"里的 Y 改为 totalDays
// 实际上 totalDays 就是当月总天数，UI 显示已有 totalDays 就不改了
// 只要自律能量条的文案适配新逻辑即可（已经在 rate/selfDays 中）
// ─────────────────────────────────────────────────────────────

// 写入
const newContent = lines.join('\n');
writeFileSync('app.js', newContent);
console.log(`Written. New length: ${newContent.length}`);

// 语法检查
try {
  execSync('node --check app.js', { stdio: 'inherit' });
  console.log('✅ Syntax OK');
} catch {
  console.log('❌ Syntax error');
}
