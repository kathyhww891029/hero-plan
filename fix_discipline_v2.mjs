import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const s = readFileSync('app.js', 'utf8');
const lines = s.split('\n');

// ─────────────────────────────────────────────────────────────
// 1. 重写第二个 calcMonthlyDisciplineRate（行 4984-5006，0-indexed: 4983-5005）
// ─────────────────────────────────────────────────────────────
const newCalc = `function calcMonthlyDisciplineRate(year, month) {
  if (!state.selfReport) return { rate: 0, selfDays: 0, totalDays: 0 };
  const prefix = \`\${year}-\${String(month).padStart(2,'0')}\`;

  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const isCurrentMonth = (today.getFullYear() === year && today.getMonth() + 1 === month);
  const lastDay = isCurrentMonth ? today.getDate() : daysInMonth;

  // 每天：固定任务≥65%且全部self → 计入自律
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

  // 每天：有至少1个self任务 → 用于streak判断
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
    // 检查以 d 为结尾的连续7天 streak
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

// Apply to lines 4983-5005 (0-indexed), replacing 23 lines
lines.splice(4983, 23, newCalc);
console.log('✅ Replaced second calcMonthlyDisciplineRate');

// ─────────────────────────────────────────────────────────────
// 2. 删除第一个 calcMonthlyDisciplineRate（行 1801-1823，0-indexed: 1800-1822）
// ─────────────────────────────────────────────────────────────
lines.splice(1800, 23);
console.log('✅ Deleted first calcMonthlyDisciplineRate (dead code)');

// ─────────────────────────────────────────────────────────────
// 3. 更新第二个 renderDisciplineBar（现在行号变了！）
//    原行 5018 → 新行号 = 5018 - 23 = 4995
//    新的行范围: 4995-5026（0-indexed: 4994-5025），32行
// ─────────────────────────────────────────────────────────────
const newBar = `function renderDisciplineBar() {
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

lines.splice(4994, 32, newBar);
console.log('✅ Replaced second renderDisciplineBar (now at ~line 4995)');

// ─────────────────────────────────────────────────────────────
// 4. 删除第一个 renderDisciplineBar（现在行号也变了！）
//    原行 1838 → 新行号 = 1838 - 23 = 1815
//    0-indexed: 1814-1843，30行
// ─────────────────────────────────────────────────────────────
lines.splice(1814, 30);
console.log('✅ Deleted first renderDisciplineBar (dead code)');

// ─────────────────────────────────────────────────────────────
// 5. 在 renderDadPage 函数末尾添加 renderDisciplineBar() 调用
//    找 renderDadPage 函数，在最后一个 </div>`; 之前注入
// ─────────────────────────────────────────────────────────────
let dadPageEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("function renderDadPage()")) {
    // 找到这个函数的结束：在 </div>\`; 后面找空行或下一个 function
    let j = i + 1;
    while (j < lines.length) {
      if (lines[j].trim() === '' || lines[j].match(/^function\s+\w+/)) {
        dadPageEnd = j - 1;
        break;
      }
      j++;
    }
    break;
  }
}
console.log(`renderDadPage ends at line ${dadPageEnd + 1}: ${lines[dadPageEnd].trim().substring(0, 50)}`);

// 在倒数第二行（最后一个 }); 之前插入 renderDisciplineBar();
lines.splice(dadPageEnd, 0, '  renderDisciplineBar();');
console.log('✅ Added renderDisciplineBar() call in renderDadPage');

// ─────────────────────────────────────────────────────────────
// 6. 在 renderAll 函数中添加 renderDisciplineBar() 调用
// ─────────────────────────────────────────────────────────────
let renderAllEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("function renderAll()")) {
    let j = i + 1;
    while (j < lines.length) {
      if (lines[j].trim() === '' || lines[j].match(/^function\s+\w+/)) {
        renderAllEnd = j - 1;
        break;
      }
      j++;
    }
    break;
  }
}
console.log(`renderAll ends at line ${renderAllEnd + 1}: ${lines[renderAllEnd].trim().substring(0, 50)}`);
lines.splice(renderAllEnd, 0, '  renderDisciplineBar();');
console.log('✅ Added renderDisciplineBar() call in renderAll');

// ─────────────────────────────────────────────────────────────
// 7. 在 submitSelfReportUnified 成功时调用 renderDisciplineBar
// ─────────────────────────────────────────────────────────────
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("showSelfReportUnifiedModal") && lines[i].includes("function ")) {
    console.log(`Found submit function around line ${i + 1}`);
  }
  // 在提交成功后调用 renderDisciplineBar（localStorage.setItem 之后）
  if (lines[i].includes('localStorage.setItem') && lines[i-1] && lines[i-1].includes('saveState')) {
    // Check if next non-empty line has renderDadPage or similar
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === '') j++;
    if (lines[j] && !lines[j].includes('renderDisciplineBar')) {
      lines.splice(j, 0, '    renderDisciplineBar();');
      console.log(`✅ Added renderDisciplineBar() after save at line ${j + 1}`);
      break;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Write
// ─────────────────────────────────────────────────────────────
const newContent = lines.join('\n');
writeFileSync('app.js', newContent);
console.log(`Written. New length: ${newContent.length}`);

// Syntax check
try {
  execSync('node --check app.js', { stdio: 'inherit' });
  console.log('✅ Syntax OK');
} catch (e) {
  console.log('❌ Syntax error');
  // Show context around error
  const errLines = e.message.match(/line (\d+)/);
  if (errLines) {
    const ln = parseInt(errLines[1]) - 1;
    console.log('Around error:', lines.slice(Math.max(0, ln-2), ln+3).map((l,i) => `${ln-2+i+1}: ${l}`).join('\n'));
  }
}
