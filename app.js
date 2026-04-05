/* ══════════════════════════════════════════════════════════════
   英雄成长计划 · 主逻辑
══════════════════════════════════════════════════════════════ */

// ── 状态管理 ──────────────────────────────────────────────────
const STATE_KEY = 'heroplan_v4';
let state = loadState();

function defaultState() {
  return {
    totalScore: 0,
    todayChecked: {},         // { taskId: true }
    cardClaims: {},           // { cardId: count }
    shopHistory: [],          // [{ id, name, cost, date }]
    ropeRecords: [],          // [{ date, count }]
    ropeMax: 0,
    ropeMilestonesAchieved: [],
    weekStart: getWeekStart(),
    weeklyScore: 0,
    consecutiveDays: {},      // 连续打卡追踪
    consecutive930: 0,        // 连续9点半上床天数
    weekUnlocked: false,      // 第一周是否已解锁专项卡
    weekStartDate: todayStr(),
  };
}
function loadState() {
  try {
    const s = localStorage.getItem(STATE_KEY);
    return s ? Object.assign(defaultState(), JSON.parse(s)) : defaultState();
  } catch(e) { return defaultState(); }
}
function saveState() {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}
function todayStr() {
  // 使用本地时区，避免深夜 UTC 偏差导致日期错误
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function getWeekStart() {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// ── 初始化 ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkWeekUnlock();
  checkDayReset();
  renderAll();
  bindEvents();
});

function checkWeekUnlock() {
  // 第一周后自动解锁专项卡（距创建超7天）
  if (!state.weekStartDate) state.weekStartDate = todayStr();
  const start = new Date(state.weekStartDate);
  const now = new Date();
  const days = Math.floor((now - start) / 86400000);
  if (days >= 7 && !state.weekUnlocked) {
    state.weekUnlocked = true;
    saveState();
  }
}

function checkDayReset() {
  // 检查是否新的一天，不自动重置（由按钮手动触发）
}

function renderAll() {
  renderHeader();
  renderDaily();
  renderCards();
  renderShop();
  renderRope();
  renderDadGuide();
}

// ── 渲染头部 ──────────────────────────────────────────────────
function renderHeader() {
  document.getElementById('totalScore').textContent = state.totalScore;
  document.getElementById('shopScore').textContent = state.totalScore;
  // 日期
  const d = new Date();
  const days = ['周日','周一','周二','周三','周四','周五','周六'];
  document.getElementById('todayDate').textContent =
    `${d.getMonth()+1}月${d.getDate()}日 ${days[d.getDay()]}`;
}

// ── 渲染每日任务 ───────────────────────────────────────────────
function renderDaily() {
  renderDailySection('dailyFixed', DAILY_FIXED);
  renderDailySection('dailyOptional', DAILY_OPTIONAL);
  renderDailySection('dailyHomework', DAILY_HOMEWORK);
  updateTodayScore();
}

function renderDailySection(containerId, tasks) {
  const el = document.getElementById(containerId);
  el.innerHTML = tasks.map(t => {
    const status = state.todayChecked[t.id]; // undefined | 'pending' | 'approved'
    const done = !!status;
    const isPending = status === 'pending';
    const isApproved = status === 'approved';
    let checkIcon = '';
    let statusClass = '';
    if (isPending) { checkIcon = '⏳'; statusClass = 'pending'; }
    else if (isApproved) { checkIcon = '✓'; statusClass = 'done'; }
    return `
      <div class="daily-item ${statusClass}" data-id="${t.id}" data-score="${t.score}" onclick="toggleDaily('${t.id}',${t.score})">
        <div class="task-icon">${t.icon}</div>
        <div class="task-info">
          <div class="task-name">${t.name}</div>
          <div class="task-sub">${t.sub}</div>
          ${t.tip ? `<div class="task-tip">💡 ${t.tip}</div>` : ''}
          ${isPending ? '<div class="task-pending-label">⏳ 等待爸妈审核</div>' : ''}
        </div>
        <div class="task-score">+${t.score}</div>
        <div class="task-check">${checkIcon}</div>
      </div>`;
  }).join('');
}

function toggleDaily(id, score) {
  if (state.todayChecked[id]) {
    // 取消打卡（只能取消待审状态，不能取消已通过的）
    if (state.todayChecked[id] === 'pending') {
      delete state.todayChecked[id];
      saveState();
      renderAll();
      showCelebration('↩️', '已取消申请', '打卡已撤销');
    } else {
      showCelebration('🔒', '已提交审核', '请等待爸爸妈妈确认哦！');
    }
    return;
  }
  // 标记为待审状态
  state.todayChecked[id] = 'pending';
  saveState();
  // 提交到 Firebase 待审队列
  const allTasks = [...DAILY_FIXED, ...DAILY_OPTIONAL, ...DAILY_HOMEWORK];
  const task = allTasks.find(t => t.id === id);
  if (task && window._firebaseReady) {
    submitPending('daily', id, task.name, score);
  }
  renderAll();
  showCelebration('⏳', '已提交！等待确认', `「${task ? task.name : id}」等爸爸妈妈审核后积分入账 💪`);
}

function updateTodayScore() {
  const today = Object.keys(state.todayChecked).reduce((sum, id) => {
    const all = [...DAILY_FIXED, ...DAILY_OPTIONAL, ...DAILY_HOMEWORK];
    const t = all.find(x => x.id === id);
    return sum + (t ? t.score : 0);
  }, 0);
  document.getElementById('todayScore').textContent = today;
}

// ── 渲染任务卡 ─────────────────────────────────────────────────
let currentFilter = 'all';
function renderCards() {
  const grid = document.getElementById('cardsGrid');
  let cards = TASK_CARDS.filter(c => {
    if (currentFilter !== 'all' && c.series !== currentFilter) return false;
    return true;
  });

  // 按系列分组
  const groups = {};
  cards.forEach(c => {
    if (!groups[c.series]) groups[c.series] = [];
    groups[c.series].push(c);
  });

  let html = '<div class="cards-grid">';
  Object.entries(groups).forEach(([series, cards]) => {
    html += `<div class="series-divider">${series}</div>`;
    cards.forEach(c => {
      const isUnlocked = isCardUnlocked(c);
      const lockIcon = isUnlocked ? '' : '<div class="card-lock-badge">🔒</div>';
      const weekBadge = c.weekUnlock && !state.weekUnlocked ?
        `<div class="week-unlock-badge">第一周后解锁</div>` : '';
      html += `
        <div class="task-card ${isUnlocked?'':'locked'}"
             style="background:${c.lightColor}"
             onclick="openCardModal('${c.id}')">
          ${lockIcon}
          <div class="card-stars">${c.stars}</div>
          <div class="card-name">${c.name}</div>
          <div class="card-sub">${c.sub}</div>
          <div class="card-score">+${c.score}分</div>
          ${!isUnlocked && !c.weekUnlock ? `<div class="card-unlock">累计${c.unlockAt}分解锁</div>` : ''}
          ${weekBadge}
        </div>`;
    });
  });
  html += '</div>';
  grid.innerHTML = html;
}

function isCardUnlocked(card) {
  if (card.weekUnlock) return state.weekUnlocked;
  if (card.unlockAt === 0) return true;
  return state.totalScore >= card.unlockAt;
}

function openCardModal(id) {
  const card = TASK_CARDS.find(c => c.id === id);
  if (!card) return;
  const unlocked = isCardUnlocked(card);

  document.getElementById('cardModalStars').textContent = card.stars;
  document.getElementById('cardModalName').textContent = card.name;
  document.getElementById('cardModalSub').textContent = card.sub;
  document.getElementById('cardModalDesc').textContent = '✅ ' + card.desc;
  document.getElementById('cardModalScore').textContent = `+${card.score}分`;

  const btn = document.getElementById('btnCardClaim');
  btn.onclick = () => claimCard(id);
  btn.disabled = !unlocked;
  btn.style.opacity = unlocked ? '1' : '0.4';
  btn.textContent = unlocked ? '✅ 我完成了！领取积分' : '🔒 还没解锁';

  document.getElementById('cardModal').style.display = 'flex';
  window._currentCardId = id;
}

function claimCard(id) {
  const card = TASK_CARDS.find(c => c.id === id);
  if (!card || !isCardUnlocked(card)) return;
  state.cardClaims[id] = (state.cardClaims[id] || 0) + 1;
  saveState();
  // 提交到待审队列
  if (window._firebaseReady) {
    submitPending('card', id, card.name, card.score);
  }
  closeModal('cardModal');
  renderAll();
  showCelebration('⏳', `「${card.name}」已申请！`, `等爸爸妈妈审核后 +${card.score}分入账！`);
}

// ── 渲染商店 ───────────────────────────────────────────────────
function renderShop() {
  document.getElementById('shopScore').textContent = state.totalScore;
  const el = document.getElementById('shopContent');
  el.innerHTML = SHOP.map(section => `
    <div class="shop-section">
      <div class="shop-section-header" style="background:${section.color}">${section.type}</div>
      ${section.items.map(item => {
        const canBuy = state.totalScore >= item.cost;
        const btnClass = item.isEgg ? 'egg' : (canBuy ? 'available' : 'unavailable');
        return `
          <div class="shop-item" style="background:${section.lightColor}">
            <div class="shop-icon">${item.icon}</div>
            <div class="shop-info">
              <div class="shop-name">${item.name}</div>
              <div class="shop-note">${item.note}</div>
              <button class="btn-redeem ${btnClass}"
                onclick="redeemItem('${item.id}','${item.name}',${item.cost},${!!item.isEgg})"
                ${canBuy?'':(!item.isEgg?'disabled':'')}>
                ${canBuy ? (item.isEgg ? '🎬 激活彩蛋！' : '兑换') : `差${item.cost-state.totalScore}分`}
              </button>
            </div>
            <div class="shop-cost">${item.cost}分</div>
          </div>`;
      }).join('')}
    </div>`).join('');
}

function redeemItem(id, name, cost, isEgg) {
  if (!isEgg && state.totalScore < cost) return;
  if (isEgg) {
    openEggModal();
    return;
  }
  state.totalScore -= cost;
  state.shopHistory.push({ id, name, cost, date: todayStr() });
  saveState();
  renderAll();
  showCelebration('🎁', `兑换成功！`, `「${name}」已兑换！\n剩余积分：${state.totalScore}分`);
}

// ── 渲染跳绳 ───────────────────────────────────────────────────
function renderRope() {
  document.getElementById('ropeCurrent').textContent = state.ropeMax || 0;

  // 里程碑
  const mEl = document.getElementById('ropeMilestones');
  mEl.innerHTML = ROPE_MILESTONES.map(m => {
    const achieved = state.ropeMax >= m.target;
    return `
      <div class="milestone-item ${achieved?'achieved':''}">
        <div class="milestone-icon">${achieved?'✅':'🎯'}</div>
        <div class="milestone-info">
          <div class="milestone-target">${m.target} 个</div>
          <div class="milestone-label">${m.label}</div>
        </div>
        <div class="milestone-bonus">+${m.bonus}分</div>
        <div class="milestone-check">${achieved?'🏆':''}</div>
      </div>`;
  }).join('');

  // 历史记录
  const hEl = document.getElementById('ropeHistory');
  const records = (state.ropeRecords || []).slice(-10).reverse();
  hEl.innerHTML = records.length ? records.map(r => `
    <div class="rope-record">
      <span>${r.date}</span>
      <span class="count">${r.count} 个</span>
      ${r.count === state.ropeMax ? '<span>🏆 最高</span>' : ''}
    </div>`).join('') : '<div style="text-align:center;color:#AAA;padding:20px">还没有记录，快去跳绳吧！🪢</div>';
}

// ── 跳绳提交 ───────────────────────────────────────────────────
document.getElementById('btnRopeSubmit').addEventListener('click', () => {
  const val = parseInt(document.getElementById('ropeInput').value);
  if (!val || val < 1) return;

  const prev = state.ropeMax || 0;
  if (!state.ropeRecords) state.ropeRecords = [];
  state.ropeRecords.push({ date: todayStr(), count: val });

  if (val > prev) {
    state.ropeMax = val;
    // 检查里程碑 → 提交待审
    ROPE_MILESTONES.forEach(m => {
      if (val >= m.target && prev < m.target &&
          !state.ropeMilestonesAchieved.includes(m.target)) {
        state.ropeMilestonesAchieved.push(m.target);
        saveState();
        if (window._firebaseReady) {
          submitPending('rope', 'rope_' + m.target, `跳绳里程碑 ${m.target}个`, m.bonus, m.label);
        }
        showCelebration('🪢', `里程碑解锁！${m.target}个！`, `${m.label}\n等爸妈审核后 +${m.bonus}分入账！`);
      }
    });
  }
  saveState();
  document.getElementById('ropeInput').value = '';
  renderAll();
  if (val > prev) {
    showCelebration('🪢', `新记录！${val}个！`, `比之前多了${val-prev}个！超厉害！⚡`);
  }
});

// ── 渲染爸爸说明 ───────────────────────────────────────────────
function renderDadGuide() {
  const el = document.getElementById('dadGuide');
  const g = DAD_GUIDE;
  el.innerHTML = `
    <div class="dad-guide">
      <div class="dad-guide-header">${g.title}</div>
      <div class="dad-guide-body">
        <div class="dad-tip-box" style="background:#FFF0E6">
          <div class="dad-tip-title" style="color:#FF6B35">🎯 这套系统的核心理念</div>
          <div class="dad-tip-text">我们希望培养的不是「听话的孩子」，而是「有自驱力的孩子」。核心不是奖惩，而是让孩子体验「我能做到」的成就感。</div>
        </div>
        <div style="font-size:14px;font-weight:700;padding:12px 0 8px">✅ 三个重要原则</div>
        ${g.principles.map(p => `
          <div class="dad-principle">
            <div class="principle-icon">${p.icon}</div>
            <div>
              <div class="principle-title">${p.title}</div>
              <div class="principle-desc">${p.desc}</div>
            </div>
          </div>`).join('')}
        <div class="dad-tip-box">
          <div class="dad-tip-title">💪 爸爸专区说明</div>
          <div class="dad-tip-text">${g.dadZone}</div>
        </div>
        <div class="dad-tip-box" style="background:#EDFFF9">
          <div class="dad-tip-title" style="color:#00897B">📅 每周结算你要做的事</div>
          <div class="dad-tip-text">${g.weeklyTask}</div>
        </div>
        <div style="font-size:13px;font-weight:700;padding:8px 0 6px;color:#118AB2">💬 参考示例：</div>
        ${g.examples.map(e => `<div class="dad-example">${e}</div>`).join('')}
        <div style="text-align:center;padding:16px 0;font-size:13px;color:#666">
          谢谢你的参与，孩子需要你 💪
        </div>
      </div>
    </div>`;
}

// ── 彩蛋弹窗 ───────────────────────────────────────────────────
function openEggModal() {
  document.getElementById('eggModal').style.display = 'flex';
  document.getElementById('eggTimer').textContent = '🎬 开始看电影！';
}
document.getElementById('btnDadWin').addEventListener('click', () => {
  state.totalScore += 5;
  saveState();
  closeModal('eggModal');
  renderAll();
  showCelebration('🏆', '爸爸撑住了！', '孩子+5分奖励！爸爸真的很厉害！😄');
});
document.getElementById('btnDadSleep').addEventListener('click', () => {
  closeModal('eggModal');
  showCelebration('😴', '爸爸睡着了...', '哈哈！拍下来存证！下次再来挑战！📸');
});
document.getElementById('btnEggClose').addEventListener('click', () => closeModal('eggModal'));

// ── 庆祝弹窗 ───────────────────────────────────────────────────
function showCelebration(emoji, title, desc) {
  document.getElementById('celebEmoji').textContent = emoji;
  document.getElementById('celebTitle').textContent = title;
  document.getElementById('celebDesc').textContent = desc;
  document.getElementById('celebModal').style.display = 'flex';
  // 3秒自动关闭
  setTimeout(() => closeModal('celebModal'), 3000);
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

// ── 标签切换 ───────────────────────────────────────────────────
function bindEvents() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${tab}`).classList.add('active');
      renderAll();
    });
  });

  // 筛选按钮
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderCards();
    });
  });

  // 重置今日
  document.getElementById('btnResetDay').addEventListener('click', () => {
    if (confirm('确定开始新的一天？今日打卡记录将重置。')) {
      state.todayChecked = {};
      saveState();
      renderAll();
    }
  });

  // 点击弹窗背景关闭
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.style.display = 'none';
    });
  });
}
