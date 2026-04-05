/* ══════════════════════════════════════════════════════════════
   英雄成长计划 · 主逻辑
══════════════════════════════════════════════════════════════ */

// ── 语音朗读引擎 ───────────────────────────────────────────────
let _currentUtterance = null;
let _speakingBtn = null;

function speakText(text, btnEl) {
  if (!window.speechSynthesis) {
    alert('你的浏览器不支持语音朗读，请使用 Chrome 或 Safari！');
    return;
  }

  // 如果点的是同一个按钮且正在朗读，则停止
  if (_speakingBtn === btnEl && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    setBtn(btnEl, false);
    _speakingBtn = null;
    return;
  }

  // 停止之前的朗读
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    if (_speakingBtn) setBtn(_speakingBtn, false);
  }

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'zh-CN';
  utter.rate = 0.85;   // 稍慢一点，孩子更容易跟上
  utter.pitch = 1.1;   // 稍高音调，更活泼
  utter.volume = 1.0;

  // 尝试选择女声（更温和）
  const voices = window.speechSynthesis.getVoices();
  const zhVoice = voices.find(v =>
    v.lang.startsWith('zh') && (v.name.includes('Female') || v.name.includes('female') ||
    v.name.includes('Tingting') || v.name.includes('Meijia') || v.name.includes('女'))
  ) || voices.find(v => v.lang.startsWith('zh'));
  if (zhVoice) utter.voice = zhVoice;

  _currentUtterance = utter;
  _speakingBtn = btnEl;
  setBtn(btnEl, true);

  utter.onend = () => { setBtn(btnEl, false); _speakingBtn = null; };
  utter.onerror = () => { setBtn(btnEl, false); _speakingBtn = null; };

  window.speechSynthesis.speak(utter);
}

function setBtn(btnEl, speaking) {
  if (!btnEl) return;
  btnEl.classList.toggle('speaking', speaking);
  btnEl.textContent = speaking ? '🔊' : '🔈';
}

// 生成小喇叭按钮 HTML（阻止事件冒泡，不触发打卡）
function speakBtn(text) {
  if (!text) return '';
  const safe = text.replace(/'/g, "\'").replace(/"/g, '&quot;');
  return `<button class="speak-btn" title="点我听任务说明" onclick="event.stopPropagation();speakText('${safe}',this)">🔈</button>`;
}

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
  // 今日得分（含待审的分数，让孩子立刻看到进展）
  const todayPts = calcTodayScore();
  const el = document.getElementById('headerTodayScore');
  if (el) el.textContent = todayPts > 0 ? `+${todayPts}` : '+0';
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
          <div class="task-name">${t.name}${speakBtn(t.speech)}</div>
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
  // 打卡后立即用"预计积分"检查激励弹窗（无需等审核）
  setTimeout(() => tryShowShopBoost(score, true), 1600);
}

function calcTodayScore() {
  return Object.keys(state.todayChecked).reduce((sum, id) => {
    const all = [...DAILY_FIXED, ...DAILY_OPTIONAL, ...DAILY_HOMEWORK];
    const t = all.find(x => x.id === id);
    return sum + (t ? t.score : 0);
  }, 0);
}

function updateTodayScore() {
  const today = calcTodayScore();
  document.getElementById('todayScore').textContent = today;
  // 同步顶部今日得分
  const el = document.getElementById('headerTodayScore');
  if (el) el.textContent = today > 0 ? `+${today}` : '+0';
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
          ${isUnlocked ? speakBtn(c.speech) : ''}
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

  // 显示"不磨蹭"等任务的具体执行标准（tip字段）
  const tipEl = document.getElementById('cardModalTip');
  if (tipEl) {
    if (card.tip) {
      tipEl.textContent = card.tip;
      tipEl.style.display = 'block';
    } else {
      tipEl.style.display = 'none';
    }
  }

  // 注入喇叭按钮到弹窗标题区域
  const speakContainer = document.getElementById('cardModalSpeak');
  if (speakContainer) {
    speakContainer.innerHTML = card.speech ? speakBtn(card.speech) : '';
  }

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
              <div class="shop-name">${item.name}${speakBtn(item.speech)}</div>
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
          <div class="milestone-target">${m.target} 个${speakBtn(m.speech)}</div>
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
  setTimeout(() => tryShowShopBoost(5), 1600);
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

// ── 补给站激励弹窗 ─────────────────────────────────────────────
// scoreAdded: 本次新增分数
// usePending: true=用"当前积分+今日待审分"做预计（打卡后立即触发），false=用实际积分
let _shopBoostText = ''; // 供语音按钮使用
function tryShowShopBoost(scoreAdded, usePending) {
  if (!scoreAdded || scoreAdded <= 0) return;
  // 计算参考积分：实际已到账 + 今日待审（如果是打卡立即触发）
  const actual = state.totalScore;
  const pendingToday = calcTodayScore(); // 包含待审分
  const current = usePending ? Math.max(actual, pendingToday + actual - calcApprovedTodayScore()) : actual;

  // 收集所有商品（排除彩蛋），找出差距最近且还未到达门槛的
  const allItems = [];
  SHOP.forEach(section => {
    section.items.forEach(item => {
      if (!item.isEgg) {
        const gap = item.cost - current;
        if (gap > 0) allItems.push({ ...item, gap });
      }
    });
  });
  if (allItems.length === 0) return; // 所有东西都能兑换了

  // 找差距最小的
  allItems.sort((a, b) => a.gap - b.gap);
  const nearest = allItems[0];

  // 只在差距 ≤ 20分时弹出，避免太频繁打扰
  if (nearest.gap > 20) return;

  // 随机鼓励话术，增加趣味性
  const phrases = [
    `就差 ${nearest.gap}分 了！`,
    `只需再赚 ${nearest.gap}分！`,
    `加油，还差 ${nearest.gap}分！`,
    `差一点点，还差 ${nearest.gap}分！`,
  ];
  const phrasesHTML = [
    `就差 <b>${nearest.gap}分</b> 了！`,
    `只需再赚 <b>${nearest.gap}分</b>！`,
    `加油，还差 <b>${nearest.gap}分</b>！`,
    `差一点点，还差 <b>${nearest.gap}分</b>！`,
  ];
  const idx = Math.floor(Math.random() * phrases.length);
  const phrase = phrases[idx];
  const phraseHTML = phrasesHTML[idx];

  // 组合语音文本
  _shopBoostText = `距离「${nearest.name}」，${phrase}你再努力一下，需要${nearest.cost}分，你快到了！`;

  document.getElementById('shopBoostIcon').textContent = nearest.icon;
  document.getElementById('shopBoostTitle').textContent = `距离「${nearest.name}」`;
  document.getElementById('shopBoostDesc').innerHTML =
    `${phraseHTML}<br>再努力一下就能兑换啦！`;
  document.getElementById('shopBoostHint').textContent =
    `需要 ${nearest.cost}分 · 当前约 ${current}分`;

  // 重置语音按钮状态
  const speakBtnEl = document.getElementById('shopBoostSpeakBtn');
  if (speakBtnEl) { speakBtnEl.textContent = '🔈 听一听'; speakBtnEl.classList.remove('speaking'); }

  // 延迟1.5秒弹出，让庆祝弹窗先关闭
  setTimeout(() => {
    closeModal('celebModal');
    document.getElementById('shopBoostModal').style.display = 'flex';
    // 自动朗读！延迟0.3秒确保弹窗已显示
    setTimeout(() => {
      if (window.speechSynthesis) {
        speakText(_shopBoostText, document.getElementById('shopBoostSpeakBtn'));
      }
    }, 300);
  }, 1500);
}

// 计算今日已通过（approved）的分数（用于预计积分计算）
function calcApprovedTodayScore() {
  return Object.keys(state.todayChecked).reduce((sum, id) => {
    if (state.todayChecked[id] !== 'approved') return sum;
    const all = [...DAILY_FIXED, ...DAILY_OPTIONAL, ...DAILY_HOMEWORK];
    const t = all.find(x => x.id === id);
    return sum + (t ? t.score : 0);
  }, 0);
}

// 激励弹窗语音按钮点击
function shopBoostSpeak(btnEl) {
  speakText(_shopBoostText, btnEl);
}

// 激励弹窗关闭（同时停止语音）
function shopBoostClose() {
  if (window.speechSynthesis && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
  closeModal('shopBoostModal');
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

/* ══════════════════════════════════════════════════════════════
   🔢 口算练习引擎
══════════════════════════════════════════════════════════════ */

// ── 关卡定义（5个级别，按速度+难度自适应）────────────────────
const MATH_LEVELS = [
  {
    id: 0, name: '⭐ 新手探索者', color: '#06D6A0',
    desc: '10以内加减法，轻松热身',
    ops: ['+', '-'], maxA: 10, maxB: 10, noNeg: true,
    targetPerMin: 10  // 每分钟目标答题数
  },
  {
    id: 1, name: '⚡ 初级闪电', color: '#118AB2',
    desc: '20以内加减法，越来越快！',
    ops: ['+', '-'], maxA: 20, maxB: 20, noNeg: true,
    targetPerMin: 14
  },
  {
    id: 2, name: '🔥 中级烈焰', color: '#F9A825',
    desc: '100以内加减法，挑战中！',
    ops: ['+', '-'], maxA: 50, maxB: 50, noNeg: true,
    targetPerMin: 12
  },
  {
    id: 3, name: '💫 高级星爆', color: '#EF476F',
    desc: '乘法口诀+100以内加减混合',
    ops: ['+', '-', '×'], maxA: 9, maxB: 9, noNeg: false, mixAdd: true,
    targetPerMin: 10
  },
  {
    id: 4, name: '👑 宇宙大师', color: '#7B2FBE',
    desc: '混合四则，速度与准确并重！',
    ops: ['+', '-', '×', '÷'], maxA: 9, maxB: 9, noNeg: false, mixAll: true,
    targetPerMin: 10
  }
];

// ── 状态变量 ──────────────────────────────────────────────────
const MATH_STORAGE_KEY = 'heroplan_math_v1';
let _mathState = null;       // 当前练习状态
let _mathTimerInterval = null;
let _mathCurrentInput = '';
let _mathQuestion = null;    // { q, answer, op }
let _mathIsTest = false;     // 是否水平测试模式（无计时限制，自适应）
let _mathTestAnswers = [];   // 测试答案记录

// ── 读写本地存储 ──────────────────────────────────────────────
function loadMathData() {
  try {
    const raw = localStorage.getItem(MATH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { levelId: null, history: [], bestScores: {} };
  } catch(e) { return { levelId: null, history: [], bestScores: {} }; }
}
function saveMathData(d) {
  try { localStorage.setItem(MATH_STORAGE_KEY, JSON.stringify(d)); } catch(e) {}
}

// ── 出题引擎 ──────────────────────────────────────────────────
function mathGenQuestion(levelId) {
  const lv = MATH_LEVELS[levelId];
  let ops = lv.ops;
  let op = ops[Math.floor(Math.random() * ops.length)];

  let a, b, answer, q;

  if (op === '+') {
    a = Math.floor(Math.random() * lv.maxA) + 1;
    b = Math.floor(Math.random() * lv.maxB) + 1;
    // level 2 mixAdd: 偶尔用大数
    if (lv.mixAdd) { a = Math.floor(Math.random() * 50) + 1; b = Math.floor(Math.random() * 50) + 1; }
    answer = a + b;
    q = `${a} + ${b} = ?`;
  } else if (op === '-') {
    a = Math.floor(Math.random() * lv.maxA) + 1;
    b = Math.floor(Math.random() * a) + (lv.noNeg ? 0 : 0);
    if (lv.noNeg) b = Math.min(b, a);
    if (lv.mixAdd) { a = Math.floor(Math.random() * 50) + 1; b = Math.floor(Math.random() * a); }
    answer = a - b;
    q = `${a} - ${b} = ?`;
  } else if (op === '×') {
    a = Math.floor(Math.random() * 9) + 1;
    b = Math.floor(Math.random() * 9) + 1;
    answer = a * b;
    q = `${a} × ${b} = ?`;
  } else { // ÷
    b = Math.floor(Math.random() * 9) + 1;
    answer = Math.floor(Math.random() * 9) + 1;
    a = b * answer;
    q = `${a} ÷ ${b} = ?`;
  }

  return { q, answer };
}

// ── 首页渲染 ──────────────────────────────────────────────────
function mathRenderHome() {
  const data = loadMathData();
  const lv = data.levelId !== null ? MATH_LEVELS[data.levelId] : null;

  // 水平卡片
  const nameEl = document.getElementById('mathLevelName');
  const descEl = document.getElementById('mathLevelDesc');
  if (nameEl) nameEl.textContent = lv ? lv.name : '还没测过';
  if (descEl) descEl.textContent = lv ? lv.desc : '先做一次水平测试，我来给你定制专属题目！';

  // 统计行
  const statsRow = document.getElementById('mathStatsRow');
  if (statsRow) {
    if (data.history.length > 0) {
      statsRow.style.display = 'flex';
      const scores = data.history.map(h => h.correct);
      const best = Math.max(...scores);
      const acc = data.history.reduce((s, h) => s + (h.correct / Math.max(h.total,1)), 0) / data.history.length;
      const bestEl = document.getElementById('statBestScore');
      const roundsEl = document.getElementById('statTotalRounds');
      const accEl = document.getElementById('statAvgAccuracy');
      if (bestEl) bestEl.textContent = best + '题';
      if (roundsEl) roundsEl.textContent = data.history.length;
      if (accEl) accEl.textContent = Math.round(acc * 100) + '%';
    } else {
      statsRow.style.display = 'none';
    }
  }

  // 历史记录（最近5条）
  const histEl = document.getElementById('mathHistory');
  if (histEl) {
    const recent = [...data.history].reverse().slice(0, 5);
    if (recent.length === 0) {
      histEl.innerHTML = '<div class="empty-tip">还没有练习记录，快去挑战吧！⚡</div>';
    } else {
      histEl.innerHTML = '<div class="math-history-title">📊 最近练习记录</div>' +
        recent.map(h => {
          const acc = Math.round(h.correct / Math.max(h.total, 1) * 100);
          return `<div class="math-history-item">
            <div>
              <div class="math-history-left">${h.levelName || '练习'} &nbsp; 
                <span class="math-history-score">${h.correct}题</span>
              </div>
              <div class="math-history-right">正确率 ${acc}% · ${h.date}</div>
            </div>
          </div>`;
        }).join('')
    }
  }
}

// ── 水平测试（自适应，无计时） ────────────────────────────────
function mathStartTest() {
  _mathIsTest = true;
  _mathTestAnswers = [];
  // 从 level 0 开始，答10题，根据正确率决定级别
  _mathState = { levelId: 0, testPhase: 0, correct: 0, total: 0 };
  mathShowSection('mathPractice');
  // 测试模式：隐藏计时器，改标题
  const timerBox = document.querySelector('.math-timer-box');
  if (timerBox) timerBox.style.visibility = 'hidden';
  const topBar = document.querySelector('.math-top-bar');
  if (topBar) {
    const progBox = topBar.querySelector('.math-progress-box');
    if (progBox) progBox.textContent = '水平测试中';
  }
  // 清进度条
  const fill = document.getElementById('mathProgressFill');
  if (fill) fill.style.transition = 'none', fill.style.width = '100%';

  mathNextQuestion();
}

// ── 1分钟练习 ─────────────────────────────────────────────────
function mathStartPractice() {
  const data = loadMathData();
  const levelId = data.levelId !== null ? data.levelId : 0;
  _mathIsTest = false;
  _mathState = { levelId, correct: 0, wrong: 0, total: 0, timeLeft: 60 };

  mathShowSection('mathCountdown');
  mathRunCountdown(3, () => {
    mathShowSection('mathPractice');
    // 恢复顶栏可见
    const timerBox = document.querySelector('.math-timer-box');
    if (timerBox) timerBox.style.visibility = 'visible';
    // 设置进度条
    const fill = document.getElementById('mathProgressFill');
    if (fill) { fill.style.transition = 'none'; fill.style.width = '100%'; }

    mathNextQuestion();
    mathStartTimer();
  });
}

// ── 倒计时 ────────────────────────────────────────────────────
function mathRunCountdown(n, cb) {
  const el = document.getElementById('mathCountdownNum');
  if (!el) { cb(); return; }
  el.textContent = n;
  if (n <= 0) { cb(); return; }
  setTimeout(() => mathRunCountdown(n - 1, cb), 800);
}

// ── 计时器 ────────────────────────────────────────────────────
function mathStartTimer() {
  if (_mathTimerInterval) clearInterval(_mathTimerInterval);
  const timerEl = document.getElementById('mathTimer');
  const fillEl = document.getElementById('mathProgressFill');

  _mathTimerInterval = setInterval(() => {
    _mathState.timeLeft--;
    if (timerEl) {
      timerEl.textContent = _mathState.timeLeft;
      timerEl.classList.toggle('danger', _mathState.timeLeft <= 10);
    }
    if (fillEl) {
      fillEl.style.transition = 'width 1s linear';
      fillEl.style.width = (_mathState.timeLeft / 60 * 100) + '%';
    }
    if (_mathState.timeLeft <= 0) {
      clearInterval(_mathTimerInterval);
      mathEndPractice();
    }
  }, 1000);
}

// ── 出下一题 ──────────────────────────────────────────────────
function mathNextQuestion() {
  const levelId = _mathState.levelId;
  _mathQuestion = mathGenQuestion(levelId);
  _mathCurrentInput = '';
  mathUpdateDisplay();

  const qEl = document.getElementById('mathQuestion');
  if (qEl) {
    qEl.className = 'math-question';
    qEl.textContent = _mathQuestion.q;
  }
  const qNumEl = document.getElementById('mathQNum');
  if (qNumEl) qNumEl.textContent = (_mathState.total || 0) + 1;
}

// ── 键盘输入 ──────────────────────────────────────────────────
function mathKey(k) {
  if (!_mathQuestion) return;

  if (k === 'del') {
    _mathCurrentInput = _mathCurrentInput.slice(0, -1);
    mathUpdateDisplay();
  } else if (k === 'ok') {
    mathSubmitAnswer();
  } else {
    if (_mathCurrentInput.length >= 4) return; // 最多4位数
    _mathCurrentInput += k;
    mathUpdateDisplay();
    // 如果是个位数答案（0-9），自动提交
    const answer = parseInt(_mathCurrentInput);
    if (!isNaN(answer) && _mathCurrentInput.length >= 1) {
      // 自动检测：当前输入已经不可能更大时自动提交
      // 规则：如果答案已经 >= 10位 数字，等用户按ok
      // 对于1-9的答案：如果再追加一位不可能匹配正确答案，自动提交
      const correct = _mathQuestion.answer;
      if (correct >= 0 && correct <= 9 && _mathCurrentInput.length === 1) {
        mathSubmitAnswer(); // 个位数答案自动提交
      }
    }
  }
}

function mathUpdateDisplay() {
  const el = document.getElementById('mathAnswerDisplay');
  if (el) el.textContent = _mathCurrentInput || '_';
}

function mathSubmitAnswer() {
  if (!_mathQuestion || _mathCurrentInput === '') return;
  const userAns = parseInt(_mathCurrentInput);
  const correct = userAns === _mathQuestion.answer;

  _mathState.total = (_mathState.total || 0) + 1;
  _mathCurrentInput = '';

  // 反馈动画
  const qEl = document.getElementById('mathQuestion');
  if (qEl) {
    qEl.className = 'math-question ' + (correct ? 'correct-flash' : 'wrong-flash');
    setTimeout(() => { if(qEl) qEl.className = 'math-question'; }, 350);
  }

  if (correct) {
    _mathState.correct = (_mathState.correct || 0) + 1;
    if (_mathIsTest) _mathTestAnswers.push(true);
  } else {
    _mathState.wrong = (_mathState.wrong || 0) + 1;
    if (_mathIsTest) _mathTestAnswers.push(false);
  }

  // 更新计分
  const cEl = document.getElementById('mathCorrect');
  const wEl = document.getElementById('mathWrong');
  if (cEl) cEl.textContent = _mathState.correct || 0;
  if (wEl) wEl.textContent = _mathState.wrong || 0;

  // 测试模式逻辑
  if (_mathIsTest) {
    if (_mathTestAnswers.length >= 10) {
      mathEndTest();
    } else {
      mathNextQuestion();
    }
    return;
  }

  mathNextQuestion();
}

// ── 结束测试，评定级别 ────────────────────────────────────────
function mathEndTest() {
  if (_mathTimerInterval) clearInterval(_mathTimerInterval);
  const correctRate = _mathTestAnswers.filter(Boolean).length / _mathTestAnswers.length;
  let newLevelId = 0;
  // 90%+ 准确率 → 升一级，否则留当前
  const currentLevel = _mathState.levelId || 0;
  if (correctRate >= 0.9 && currentLevel < MATH_LEVELS.length - 1) {
    newLevelId = currentLevel + 1;
  } else if (correctRate < 0.6 && currentLevel > 0) {
    newLevelId = currentLevel - 1;
  } else {
    newLevelId = currentLevel;
  }

  const data = loadMathData();
  const oldLevel = data.levelId;
  data.levelId = newLevelId;
  saveMathData(data);

  const lv = MATH_LEVELS[newLevelId];
  const correct = _mathTestAnswers.filter(Boolean).length;
  const total = _mathTestAnswers.length;
  const acc = Math.round(correctRate * 100);

  mathShowSection('mathResult');
  const emojiEl = document.getElementById('mathResultEmoji');
  const titleEl = document.getElementById('mathResultTitle');
  const scoreEl = document.getElementById('mathResultScore');
  const detailEl = document.getElementById('mathResultDetail');
  const levelUpEl = document.getElementById('mathLevelUp');

  if (emojiEl) emojiEl.textContent = acc >= 90 ? '🏆' : acc >= 70 ? '⚡' : '💪';
  if (titleEl) titleEl.textContent = '水平测试完成！';
  if (scoreEl) scoreEl.textContent = `${correct} / ${total}`;
  if (detailEl) detailEl.innerHTML =
    `正确率 <strong>${acc}%</strong><br>` +
    `🎯 你的专属级别：<strong style="color:${lv.color}">${lv.name}</strong><br>` +
    `${lv.desc}`;
  if (levelUpEl) {
    if (oldLevel !== null && newLevelId > oldLevel) {
      levelUpEl.style.display = 'block';
      levelUpEl.textContent = `🎉 恭喜升级到 ${lv.name}！`;
    } else {
      levelUpEl.style.display = 'none';
    }
  }
}

// ── 结束练习（1分钟结束） ─────────────────────────────────────
function mathEndPractice() {
  const data = loadMathData();
  const levelId = _mathState.levelId;
  const lv = MATH_LEVELS[levelId];
  const correct = _mathState.correct || 0;
  const wrong = _mathState.wrong || 0;
  const total = _mathState.total || 0;
  const acc = total > 0 ? Math.round(correct / total * 100) : 0;

  // 记录历史
  const now = new Date();
  const dateStr = `${now.getMonth()+1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
  data.history = data.history || [];
  data.history.push({ levelId, levelName: lv.name, correct, wrong, total, acc, date: dateStr });
  if (data.history.length > 30) data.history = data.history.slice(-30);

  // 自适应：如果连续2次都达到目标，自动升级
  const recent2 = data.history.slice(-2);
  const shouldLevelUp = recent2.length >= 2
    && recent2.every(h => h.levelId === levelId && h.correct >= lv.targetPerMin && h.acc >= 85);
  const shouldLevelDown = recent2.length >= 2
    && recent2.every(h => h.levelId === levelId && h.acc < 50);

  let levelChanged = false;
  if (shouldLevelUp && levelId < MATH_LEVELS.length - 1) {
    data.levelId = levelId + 1;
    levelChanged = 'up';
  } else if (shouldLevelDown && levelId > 0) {
    data.levelId = levelId - 1;
    levelChanged = 'down';
  }
  saveMathData(data);

  // 结果页
  mathShowSection('mathResult');
  const newLv = MATH_LEVELS[data.levelId];
  const emojiEl = document.getElementById('mathResultEmoji');
  const titleEl = document.getElementById('mathResultTitle');
  const scoreEl = document.getElementById('mathResultScore');
  const detailEl = document.getElementById('mathResultDetail');
  const levelUpEl = document.getElementById('mathLevelUp');

  let emoji = '⚡', title = '继续努力！';
  if (acc >= 95 && correct >= lv.targetPerMin) { emoji = '🏆'; title = '宇宙级表现！'; }
  else if (acc >= 85 && correct >= lv.targetPerMin * 0.9) { emoji = '🔥'; title = '太厉害了！'; }
  else if (acc >= 70) { emoji = '⚡'; title = '很好，再快一点！'; }
  else { emoji = '💪'; title = '继续练，你能行！'; }

  if (emojiEl) emojiEl.textContent = emoji;
  if (titleEl) titleEl.textContent = title;
  if (scoreEl) scoreEl.textContent = `${correct} 题`;
  if (detailEl) detailEl.innerHTML =
    `1分钟内答了 <strong>${total}</strong> 道题<br>` +
    `✅ 正确 <strong>${correct}</strong> 题 &nbsp; ❌ 错误 <strong>${wrong}</strong> 题<br>` +
    `正确率 <strong>${acc}%</strong>`;

  if (levelUpEl) {
    if (levelChanged === 'up') {
      levelUpEl.style.display = 'block';
      levelUpEl.textContent = `🎉 连续两次达标！升级到 ${newLv.name}！`;
    } else if (levelChanged === 'down') {
      levelUpEl.style.display = 'block';
      levelUpEl.style.background = '#888';
      levelUpEl.textContent = `💪 调整到更合适的级别：${newLv.name}`;
    } else {
      levelUpEl.style.display = 'none';
    }
  }
}

// ── 返回首页 ──────────────────────────────────────────────────
function mathGoHome() {
  if (_mathTimerInterval) clearInterval(_mathTimerInterval);
  _mathQuestion = null;
  mathShowSection('mathHome');
  mathRenderHome();
}

// ── 显示某个子区域 ────────────────────────────────────────────
function mathShowSection(id) {
  ['mathHome','mathCountdown','mathPractice','mathResult'].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = s === id ? '' : 'none';
  });
}

// ── Tab 切换时初始化口算页 ────────────────────────────────────
// 注入到现有的 Tab 切换逻辑
(function patchTabMath() {
  document.addEventListener('DOMContentLoaded', () => {
    // 找到 Tab 按钮，监听 math tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.tab === 'math') {
          setTimeout(() => {
            mathGoHome();
          }, 50);
        } else {
          // 离开口算时停计时器
          if (_mathTimerInterval) { clearInterval(_mathTimerInterval); _mathTimerInterval = null; }
        }
      });
    });
    // 初始也检查一下
    mathRenderHome();
  });
})();
