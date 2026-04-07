import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const s = readFileSync('app.js', 'utf8');
const lines = s.split('\n');

// ─────────────────────────────────────────────────────────────
// 工具函数：找函数结束行（匹配 {} 的大括号）
// ─────────────────────────────────────────────────────────────
function findFunctionEnd(startIdx) {
  // startIdx 指向 "function xxx() {" 这行
  let braceCount = 0;
  for (let i = startIdx; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') braceCount++;
      else if (ch === '}') braceCount--;
    }
    if (braceCount === 0 && i > startIdx) return i;
  }
  return -1;
}

// ─────────────────────────────────────────────────────────────
// 找到所有 calcMonthlyDisciplineRate 和 renderDisciplineBar 的位置
// ─────────────────────────────────────────────────────────────
const calcMonthlyFuncs = [];
const renderBarFuncs = [];

for (let i = 0; i < lines.length; i++) {
  if (lines[i].match(/^function calcMonthlyDisciplineRate\(/)) {
    const end = findFunctionEnd(i);
    calcMonthlyFuncs.push({ start: i, end, label: `calcMonthlyDisciplineRate #${calcMonthlyFuncs.length + 1}` });
  }
  if (lines[i].match(/^function renderDisciplineBar\(/)) {
    const end = findFunctionEnd(i);
    renderBarFuncs.push({ start: i, end, label: `renderDisciplineBar #${renderBarFuncs.length + 1}` });
  }
}

console.log('Found calcMonthlyDisciplineRate functions:');
calcMonthlyFuncs.forEach(f => console.log(`  ${f.label}: lines ${f.start + 1}-${f.end + 1}`));
console.log('Found renderDisciplineBar functions:');
renderBarFuncs.forEach(f => console.log(`  ${f.label}: lines ${f.start + 1}-${f.end + 1}`));

// ─────────────────────────────────────────────────────────────
// 新函数体
// ─────────────────────────────────────────────────────────────
const NEW_CALC = `function calcMonthlyDisciplineRate(year, month) {
  if (!state.selfReport) return { rate: 0, selfDays: 0, totalDays: 0 };
  const prefix = \`\${year}-\${String(month).padStart(2,'0')}\`;

  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const isCurrentMonth = (today.getFullYear() === year && today.getMonth() + 1 === month);
  const lastDay = isCurrentMonth ? today.getDate() : daysInMonth;

  // 每天：固定任务≥65%且全部self
  const dayBy65 = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = \`\${prefix}-\${String(d).padStart(2,'0')}\`;
    const tasks = state.selfReport[dateStr];
    if (!tasks) { dayBy65[d] = false; continue; }
    const fixedIds = DAILY_FIXED.map(t => t.id);
    const completedFixed = fixedIds.filter(id => tasks[id]);
    const allSelf = completedFixed.length > 0 && completedFixed.every(id => tasks[id] === 'self');
    dayBy65[d] = (completedFixed.length / fixedIds.length >= 0.65) && allSelf;
  }

  // 每天：有至少1个self任务（用于streak判断）
  const dayHasSelf = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = \`\${prefix}-\${String(d).padStart(2,'0')}\`;
    const tasks = state.selfReport[dateStr];
    dayHasSelf[d] = !!(tasks && Object.values(tasks).some(v => v === 'self'));
  }

  // 统计自律天数：65%条件 OR 连续7天每天有self
  const counted = {};
  let selfDays = 0;
  for (let d = 1; d <= lastDay; d++) {
    if (counted[d]) continue;
    if (dayBy65[d]) { selfDays++; counted[d] = true; continue; }
    let streakOk = d >= 7;
    for (let k = d - 6; k <= d; k++) {
      if (!dayHasSelf[k]) { streakOk = false; break; }
    }
    if (streakOk) {
      for (let k = d - 6; k <= d; k++) counted[k] = true;
      selfDays += 7;
    }
  }

  const totalDays = lastDay;
  const rate = totalDays > 0 ? Math.round(selfDays / totalDays * 100) : 0;
  return { rate, selfDays, totalDays };
}`;

const NEW_BAR = `function renderDisciplineBar() {
  const el = document.getElementById('disciplineBar');
  if (!el) return;
  const now = new Date();
  const { rate, selfDays, totalDays } = calcMonthlyDisciplineRate(now.getFullYear(), now.getMonth() + 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainDays = daysInMonth - now.getDate();
  const unlocked = rate >= 85;
  const filled = Math.round(rate / 10);
  const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
  el.innerHTML = \`
    <div class="discipline-bar-wrap" style="background:\${unlocked?'#e8fff5':'#fff8e1'};border-radius:14px;padding:14px 16px;margin:10px 0;border:1.5px solid \${unlocked?'#06D6A0':'#FFD54F'};">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <span style="font-weight:700;font-size:0.95rem;color:#1a1a2e;">🏅 本月自律能量条</span>
        <span style="font-size:1rem;font-weight:700;color:\${unlocked?'#06D6A0':'#F9A825'};">\${rate}%</span>
      </div>
      <div style="font-family:monospace;font-size:1.1rem;color:\${unlocked?'#00897B':'#F57F17'};letter-spacing:2px;">\${bar}</div>
      <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:0.82rem;color:#888;">
        <span>自律天数：\${selfDays}/\${totalDays}天</span>
        <span>剩余：\${remainDays}天</span>
      </div>
      <div style="margin-top:6px;font-size:0.78rem;color:#aaa;">
        达成条件：固定任务≥65%全自主 或 连续7天每天自主完成任务
      </div>
      \${unlocked
        ? '<div style="margin-top:8px;font-size:0.88rem;color:#06D6A0;font-weight:700;">✨ 本月自律达标！大奖已解锁！</div>'
        : rate > 0
          ? \`<div style="margin-top:8px;font-size:0.85rem;color:#F9A825;">还差\${85-rate}%解锁本月大奖，加油！💪</div>\`
          : '<div style="margin-top:8px;font-size:0.85rem;color:#aaa;">开始打卡，积累自律能量！</div>'
      }
    </div>
  \`;
}`;

// ─────────────────────────────────────────────────────────────
// 应用修改（从尾到头排序，这样前面的行号不受影响）
// ─────────────────────────────────────────────────────────────
const changes = [];

// 1. 重写第二个 calcMonthlyDisciplineRate
if (calcMonthlyFuncs.length >= 2) {
  changes.push({ type: 'replace', start: calcMonthlyFuncs[1].start, end: calcMonthlyFuncs[1].end, newContent: NEW_CALC, label: 'Replace 2nd calcMonthlyDisciplineRate' });
}

// 2. 删除第一个 calcMonthlyDisciplineRate
if (calcMonthlyFuncs.length >= 1) {
  changes.push({ type: 'delete', start: calcMonthlyFuncs[0].start, end: calcMonthlyFuncs[0].end, label: 'Delete 1st calcMonthlyDisciplineRate (dead code)' });
}

// 3. 重写第二个 renderDisciplineBar
if (renderBarFuncs.length >= 2) {
  changes.push({ type: 'replace', start: renderBarFuncs[1].start, end: renderBarFuncs[1].end, newContent: NEW_BAR, label: 'Replace 2nd renderDisciplineBar' });
}

// 4. 删除第一个 renderDisciplineBar
if (renderBarFuncs.length >= 1) {
  changes.push({ type: 'delete', start: renderBarFuncs[0].start, end: renderBarFuncs[0].end, label: 'Delete 1st renderDisciplineBar (dead code)' });
}

// 按 start 行号从大到小排序，确保从尾到头修改
changes.sort((a, b) => b.start - a.start);

console.log('\nApplying changes (bottom to top):');
changes.forEach(c => console.log(`  ${c.label}: lines ${c.start + 1}-${c.end + 1} (${c.type})`));

for (const change of changes) {
  const numLines = change.end - change.start + 1;
  if (change.type === 'replace') {
    lines.splice(change.start, numLines, change.newContent);
    console.log(`  → Replaced ${numLines} lines with ${change.newContent.split('\n').length} lines`);
  } else {
    lines.splice(change.start, numLines);
    console.log(`  → Deleted ${numLines} lines`);
  }
}

// ─────────────────────────────────────────────────────────────
// 5. 在 renderDadPage 末尾添加 renderDisciplineBar() 调用
// ─────────────────────────────────────────────────────────────
let dadPageEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function renderDadPage()')) {
    const fnEnd = findFunctionEnd(i);
    // 在倒数第2行插入（最后一行是 });
    dadPageEnd = fnEnd - 1;
    break;
  }
}
if (dadPageEnd !== -1) {
  console.log(`renderDadPage insert position: line ${dadPageEnd + 1}`);
  lines.splice(dadPageEnd, 0, '  renderDisciplineBar();');
  console.log('✅ Added renderDisciplineBar() in renderDadPage');
} else {
  console.log('⚠️ renderDadPage not found');
}

// ─────────────────────────────────────────────────────────────
// 6. 在 renderAll 末尾添加 renderDisciplineBar() 调用
// ─────────────────────────────────────────────────────────────
let renderAllEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function renderAll()')) {
    const fnEnd = findFunctionEnd(i);
    renderAllEnd = fnEnd - 1;
    break;
  }
}
if (renderAllEnd !== -1) {
  console.log(`renderAll insert position: line ${renderAllEnd + 1}`);
  lines.splice(renderAllEnd, 0, '  renderDisciplineBar();');
  console.log('✅ Added renderDisciplineBar() in renderAll');
}

// ─────────────────────────────────────────────────────────────
// 7. 在 submitSelfReportUnified 成功保存后调用 renderDisciplineBar
// ─────────────────────────────────────────────────────────────
for (let i = 0; i < lines.length - 1; i++) {
  if (lines[i].includes('saveState()') && lines[i + 1].includes('renderDadPage()')) {
    // Check if renderDisciplineBar is already called nearby
    const nearby = lines.slice(Math.max(0, i - 2), i + 3).join('');
    if (!nearby.includes('renderDisciplineBar')) {
      lines.splice(i + 1, 0, '      renderDisciplineBar();');
      console.log(`✅ Added renderDisciplineBar() after saveState/renderDadPage at line ${i + 2}`);
    }
    break;
  }
}

// ─────────────────────────────────────────────────────────────
// 写入
// ─────────────────────────────────────────────────────────────
const newContent = lines.join('\n');
writeFileSync('app.js', newContent);
console.log(`\nWritten. New length: ${newContent.length} (was ${s.length})`);

// 语法检查
try {
  execSync('node --check app.js', { stdio: 'inherit' });
  console.log('✅ Syntax OK');
} catch (e) {
  console.log('❌ Syntax error');
  const m = e.message.match(/line (\d+)/);
  if (m) {
    const ln = parseInt(m[1]) - 1;
    for (let i = Math.max(0, ln - 3); i < Math.min(lines.length, ln + 4); i++) {
      console.log(`  ${i + 1}: ${lines[i]}`);
    }
  }
}
