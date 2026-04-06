/* ══════════════════════════════════════════════════════════════
   英雄成长计划 · 主逻辑
══════════════════════════════════════════════════════════════ */

// ── 语音朗读引擎 ───────────────────────────────────────────────
let _currentUtterance = null;
let _speakingBtn = null;
let _zhCNVoice = null;  // 缓存选好的普通话声音

// 预选普通话声音（明确排除 zh-HK 粤语）
function pickZhCNVoice() {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return;
  _zhCNVoice =
    voices.find(v => v.lang === 'zh-CN' && (v.name.includes('Female') || v.name.includes('female') ||
      v.name.includes('Tingting') || v.name.includes('Meijia') || v.name.includes('女'))) ||
    voices.find(v => v.lang === 'zh-CN') ||
    voices.find(v => v.lang.startsWith('zh-CN')) ||
    voices.find(v => v.name.includes('Tingting') || v.name.includes('Meijia') || v.name.includes('普通话')) ||
    null;
}
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = pickZhCNVoice;
  pickZhCNVoice(); // 部分浏览器同步可用
}

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

  // 使用预选的普通话声音（已排除 zh-HK 粤语），缺省时靠 lang='zh-CN' 兜底
  if (!_zhCNVoice) pickZhCNVoice();
  if (_zhCNVoice) utter.voice = _zhCNVoice;

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

// ── 温情化：欢迎语 + 每日励志语 ──────────────────────────────
const WELCOME_MESSAGES = [
  '你好啊，小英雄！今天也是充满可能的一天！',
  '英雄回来了！今天准备好出发了吗？',
  '嘿，大英雄！昨天的你已经很棒了，今天继续加油！',
  '小英雄报到！每一个今天，都是你变强的机会！',
  '哇，英雄出现了！今天要去完成什么冒险呢？',
];
const MOTTOS = [
  '每天进步一点点，今天的你比昨天更厉害 💪',
  '不需要完美，只需要比昨天好一点点 ⭐',
  '英雄不是天生的，是每天练出来的 🔥',
  '今天完成的每一件事，都是明天的超能力 ✨',
  '你已经做得很好了，继续往前走 👊',
];

function speakWelcome() {
  const hour = new Date().getHours();
  let greeting = hour < 12 ? '早上好！' : hour < 18 ? '下午好！' : '晚上好！';
  const msg = WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
  speakText(greeting + msg, document.querySelector('.welcome-speak-btn'));
}

function updateWelcomeArea() {
  const nameEl = document.querySelector('.welcome-name');
  const motto = document.getElementById('headerMotto');
  if (nameEl) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? '早上好，小英雄！🌅' : hour < 18 ? '下午好，小英雄！☀️' : '晚上好，小英雄！🌙';
    nameEl.textContent = greeting;
  }
  if (motto) {
    const score = state.totalScore || 0;
    // 根据积分给出专属激励
    let personalMotto = MOTTOS[new Date().getDay() % MOTTOS.length];
    if (score >= 200) personalMotto = '你是宇宙英雄！每天的坚持都被记录在星空里 👑';
    else if (score >= 100) personalMotto = '超级英雄诞生了！继续保持，传说就在眼前 💫';
    else if (score >= 50) personalMotto = '战士的光芒越来越强！你做到了很多事 🔥';
    else if (score >= 20) personalMotto = '初级英雄正在成长中，每一步都算数 ⚡';
    motto.textContent = personalMotto;
  }
}


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
    consecutiveDays: {},      // 连续打卡追踪（旧字段保留）
    consecutive930: 0,        // 连续9点半上床天数（旧字段保留）
    // 连续天数（新版，跨天累积不被重置）
    streaks: {
      morning:  { count: 0, lastDate: '' },
      night:    { count: 0, lastDate: '' },
      homework: { count: 0, lastDate: '' },
      focus:    { count: 0, lastDate: '' },
    },
    weekUnlocked: false,      // 第一周是否已解锁专项卡
    weekStartDate: todayStr(),
    // 英雄包状态
    morningPack: {},          // { mp1:true, mp2:true, mp3:true }
    nightPack: {},            // { np1:true, np2:true, np3:true }
    morningPackBonus: false,  // 今日早晨英雄包全套奖励已发
    nightPackBonus: false,    // 今日睡前英雄包全套奖励已发
    // 写作业（简化单步）
    hwCompleted: false,       // 已写完作业
    hwBlocks: 0,              // 今日已完成专注块数
    // 专注力时光
    focusSelected: null,      // 今日选择的活动 id
    focusStarted: false,      // 已开始计时
    focusCompleted: false,    // 已完成15分钟
    focusOvertime: false,     // 超时继续（超级专注徽章）
    // 周度成就
    weeklyCardCount: 0,       // 本周已完成任务卡数
    weeklyAchievement: null,  // 本周成就等级
    // 当前培养阶段（爸妈设置）
    currentPhase: 1,
    phaseStartDate: null,
    // 阅读挑战联动
    readCount: 0,             // 累计完成阅读卡总次数（每领取一张+1）
    // 今日自选挑战卡
    selfPickCard: null,       // 今日选择的挑战卡 id（每天可换）
    selfPickClaimed: false,   // 今日自选卡是否已领分
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
  renderWeeklyAchievement();
  renderCards();
  renderShop();
  renderRope();
  renderKidPage();
  renderDadPage();
  renderWeekly();
  renderAchievements();
  // 英雄行为历史（子渊Tab）
  if (typeof renderKidHeroHistory === 'function') renderKidHeroHistory();
}

// ── 渲染头部 ──────────────────────────────────────────────────
function renderHeader() {
  document.getElementById('totalScore').textContent = state.totalScore;
  document.getElementById('shopScore').textContent = state.totalScore;
  const todayPts = calcTodayScore();
  const el = document.getElementById('headerTodayScore');
  if (el) el.textContent = todayPts > 0 ? `+${todayPts}` : '+0';
  const d = new Date();
  const days = ['周日','周一','周二','周三','周四','周五','周六'];
  const dateEl = document.getElementById('todayDate');
  if (dateEl) {
    var h = String(d.getHours()).padStart(2,'0');
    var m = String(d.getMinutes()).padStart(2,'0');
    var s = String(d.getSeconds()).padStart(2,'0');
    dateEl.textContent = `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 ${days[d.getDay()]}  ${h}:${m}:${s}`;
  }
  updateWelcomeArea();
  renderMonthlyCalendar();
}

// ── 月历打卡记录 ───────────────────────────────────────────────
var _calendarYear = new Date().getFullYear();
var _calendarMonth = new Date().getMonth();

function renderMonthlyCalendar() {
  const container = document.getElementById('monthlyCalendar');
  if (!container) return;
  
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const year = _calendarYear;
  const month = _calendarMonth;
  
  // 获取当月第一天和最后一天
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const totalDays = lastDay.getDate();
  
  // 获取今天的日期字符串
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  
  // 获取所有有打卡记录的日期（从streaks数据中提取）
  var recordDates = new Set();
  if (state.streaks) {
    var keys = ['morning', 'night', 'homework', 'focus'];
    for (var k = 0; k < keys.length; k++) {
      var s = state.streaks[keys[k]];
      if (s && s.lastDate) {
        recordDates.add(s.lastDate);
      }
    }
  }
  
  // 构建HTML
  var html = '<div class="calendar-header">';
  html += `<span class="calendar-title">📅 ${year}年${month+1}月</span>`;
  html += '<div class="calendar-nav">';
  html += `<button onclick="changeCalendarMonth(-1)">◀</button>`;
  html += `<button onclick="changeCalendarMonth(1)">▶</button>`;
  html += '</div></div>';
  
  // 星期标题
  html += '<div class="calendar-weekdays">';
  for (var i = 0; i < 7; i++) {
    html += `<div class="calendar-weekday">${weekdays[i]}</div>`;
  }
  html += '</div>';
  
  // 日期
  html += '<div class="calendar-days">';
  
  // 空格子
  for (var j = 0; j < startWeekday; j++) {
    html += '<div class="calendar-day empty"></div>';
  }
  
  // 日期格子
  for (var d = 1; d <= totalDays; d++) {
    var dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    var isToday = (dateStr === todayStr);
    var hasRecord = recordDates.has(dateStr);
    var isFuture = dateStr > todayStr;
    
    var className = 'calendar-day';
    if (isToday) className += ' today';
    if (hasRecord) className += ' has-record';
    if (isFuture) className += ' future';
    
    html += `<div class="${className}">${d}</div>`;
  }
  
  html += '</div>';
  container.innerHTML = html;
}

function changeCalendarMonth(delta) {
  _calendarMonth += delta;
  if (_calendarMonth > 11) {
    _calendarMonth = 0;
    _calendarYear++;
  } else if (_calendarMonth < 0) {
    _calendarMonth = 11;
    _calendarYear--;
  }
  renderMonthlyCalendar();
}

// ── 渲染每日任务 ───────────────────────────────────────────────

// 连续天数更新：key = 'morning' | 'night' | 'homework' | 'focus'
function updateStreak(key) {
  const today = todayStr();
  if (!state.streaks) {
    state.streaks = { morning:{count:0,lastDate:''}, night:{count:0,lastDate:''}, homework:{count:0,lastDate:''}, focus:{count:0,lastDate:''} };
  }
  const s = state.streaks[key] || { count: 0, lastDate: '' };
  if (s.lastDate === today) return; // 今天已经算过，不重复

  // 计算昨天的日期字符串
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterday = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  if (s.lastDate === yesterday) {
    s.count += 1; // 昨天完成了，连续 +1
  } else {
    s.count = 1;  // 断开了，从1重新开始
  }
  s.lastDate = today;
  state.streaks[key] = s;
  saveState();
}

// 获取连续天数标签 HTML
function streakBadge(key) {
  if (!state.streaks || !state.streaks[key]) return '';
  const count = state.streaks[key].count || 0;
  if (count < 2) return ''; // 不足2天不显示
  let color = '#FF6B35';
  if (count >= 7)  color = '#EF476F';
  if (count >= 14) color = '#7B2FBE';
  return `<span style="display:inline-flex;align-items:center;gap:2px;background:${color};color:#fff;font-size:0.72rem;font-weight:700;padding:1px 7px;border-radius:20px;margin-left:6px;vertical-align:middle">🔥 连续${count}天</span>`;
}

function renderDaily() {
  renderMorningPack();
  renderNightPack();
  renderHomeworkTask();
  renderFocusTime();
  renderSelfPick();
  renderOptionalTasks();
  updateTodayScore();
}

// 渲染早晨英雄包
function renderMorningPack() {
  const el = document.getElementById('dailyFixed');
  if (!el) return;
  const done = MORNING_PACK.filter(t => state.morningPack[t.id]).length;
  const isFull = done === MORNING_PACK.length;
  const pts = isFull ? MORNING_PACK_FULL : done;

  el.innerHTML = `
    <div class="hero-pack morning-pack ${isFull?'pack-complete':''}">
      <div class="pack-header">
        <span class="pack-icon">🌅</span>
        <div class="pack-title-area">
          <div class="pack-title">早晨英雄包${streakBadge('morning')}</div>
          <div class="pack-subtitle">${isFull?'✨ 全套完成！':'还差'+(MORNING_PACK.length-done)+'件全套奖励'}</div>
        </div>
        <div class="pack-score-badge ${isFull?'full':'partial'}">
          ${isFull?`+${MORNING_PACK_FULL}分 🎉`:`+${pts}分`}
        </div>
      </div>
      <div class="pack-items">
        ${MORNING_PACK.map(t => {
          const checked = !!state.morningPack[t.id];
          return `<div class="pack-item ${checked?'done':''}" onclick="togglePackItem('morning','${t.id}',${t.score})">
            <span class="pack-item-icon">${t.icon}</span>
            <span class="pack-item-name">${t.name}${speakBtn(t.speech)}</span>
            <span class="pack-item-check">${checked?'✅':'⬜'}</span>
          </div>`;
        }).join('')}
      </div>
      ${!isFull && done > 0 ? `<div class="pack-boost-tip">🎯 再完成${MORNING_PACK.length-done}件→全套+${MORNING_PACK_FULL}分（是现在的${Math.round(MORNING_PACK_FULL/Math.max(done,1))}倍！）</div>` : ''}
    </div>`;
}

// 渲染睡前英雄包
function renderNightPack() {
  const el = document.getElementById('dailyHomework');
  if (!el) return;
  const done = NIGHT_PACK.filter(t => state.nightPack[t.id]).length;
  const isFull = done === NIGHT_PACK.length;
  const pts = isFull ? NIGHT_PACK_FULL : done;

  el.innerHTML = `
    <div class="hero-pack night-pack ${isFull?'pack-complete':''}">
      <div class="pack-header">
        <span class="pack-icon">🌙</span>
        <div class="pack-title-area">
          <div class="pack-title">睡前英雄包${streakBadge('night')}</div>
          <div class="pack-subtitle">${isFull?'✨ 全套完成！':'还差'+(NIGHT_PACK.length-done)+'件全套奖励'}</div>
        </div>
        <div class="pack-score-badge ${isFull?'full':'partial'}">
          ${isFull?`+${NIGHT_PACK_FULL}分 🎉`:`+${pts}分`}
        </div>
      </div>
      <div class="pack-items">
        ${NIGHT_PACK.map(t => {
          const checked = !!state.nightPack[t.id];
          return `<div class="pack-item ${checked?'done':''}" onclick="togglePackItem('night','${t.id}',${t.score})">
            <span class="pack-item-icon">${t.icon}</span>
            <span class="pack-item-name">${t.name}${t.tip?`<div class="task-tip">💡 ${t.tip}</div>`:''}${speakBtn(t.speech)}</span>
            <span class="pack-item-check">${checked?'✅':'⬜'}</span>
          </div>`;
        }).join('')}
      </div>
      ${!isFull && done > 0 ? `<div class="pack-boost-tip">🎯 再完成${NIGHT_PACK.length-done}件→全套+${NIGHT_PACK_FULL}分！</div>` : ''}
    </div>`;
}

// 渲染写作业（简化：完成打卡 + 专注块）
function renderHomeworkTask() {
  const el = document.getElementById('dailyOptional');
  if (!el) return;
  const hw = HOMEWORK_TASK;
  const blocks = state.hwBlocks || 0;
  const completed = !!state.hwCompleted;
  const blockScore = Math.min(blocks, hw.maxBlocks) * hw.scorePerBlock;
  const totalScore = blockScore + (completed ? hw.scoreComplete : 0);

  el.innerHTML = `
    <div class="homework-card ${completed ? 'hw-complete' : ''}">
      <div class="hw-header">
        <span class="hw-icon">${hw.icon}</span>
        <div class="hw-title-area">
          <div class="hw-title">${hw.name}${speakBtn(hw.speech)}${streakBadge('homework')}</div>
          <div class="hw-subtitle">
            ${completed ? '✅ 作业写完啦！太棒了！' : '⬜ 写完作业打卡，获得+2分！'}
          </div>
        </div>
        <div class="hw-score">+${totalScore}分</div>
      </div>

      <div class="hw-blocks">
        <div class="blocks-label">🍅 专注块（每10分钟不分心 = +1分）</div>
        <div class="blocks-row">
          ${[1,2,3].map(i => `
            <div class="block-btn ${blocks>=i?'done':''}" onclick="addFocusBlock()">
              ${blocks>=i?'✅':'⬜'} 第${i}块
            </div>`).join('')}
        </div>
        <div class="blocks-hint">最多3块，当前 +${blockScore}分</div>
      </div>

      <div class="hw-keys">
        <div class="key-item ${completed?'unlocked':''}" onclick="completeHomework()" style="cursor:pointer">
          📚 写完作业 (+2分) → ${completed ? '<span style="color:#FF6B35">↩️ 点击撤销</span>' : '点击打卡'}
        </div>
      </div>
    </div>`;
}

// 渲染可选任务列表（无锁定，全部直接可用）
function renderOptionalList() {
  return [...DAILY_OPTIONAL_INTEREST, ...DAILY_OPTIONAL_FUN].map(t => {
    const status = state.todayChecked[t.id];
    const isPending = status === 'pending';
    const isApproved = status === 'approved';
    const tipHtml = t.tip ? '<div class="task-tip">💡 ' + t.tip + '</div>' : '';
    const pendingHtml = isPending ? '<div class="task-pending-label">⏳ 等待爸妈审核</div>' : '';

    return '<div class="daily-item ' + (isPending?'pending':'') + ' ' + (isApproved?'done':'') + '"' +
      ' data-id="' + t.id + '"' +
      ' onclick="toggleDaily(\'' + t.id + '\',' + t.score + ')">' +
      '<div class="task-icon">' + t.icon + '</div>' +
      '<div class="task-info">' +
        '<div class="task-name">' + t.name + speakBtn(t.speech) + '</div>' +
        '<div class="task-sub">' + t.sub + '</div>' +
        tipHtml + pendingHtml +
      '</div>' +
      '<div class="task-score">+' + t.score + '</div>' +
      '<div class="task-check">' + (isApproved?'✓':isPending?'⏳':'') + '</div>' +
    '</div>';
  }).join('');
}

function renderOptionalTasks() {
  const el = document.getElementById('dailyOptionalList');
  if (!el) return;
  el.innerHTML = renderOptionalList();
}

// ── 今日自选挑战卡 ─────────────────────────────────────────────
function renderSelfPick() {
  const el = document.getElementById('dailySelfPick');
  if (!el) return;

  const pickedId = state.selfPickCard;
  const claimed  = !!state.selfPickClaimed;
  const card     = pickedId ? TASK_CARDS.find(c => c.id === pickedId) : null;

  // 获取今日可选卡列表：已解锁 + 未在本周完成过（或可重复）
  const claimedIds = Object.keys(state.cardClaims || {});
  const available = TASK_CARDS.filter(c => {
    if (!isCardUnlocked(c)) return false;
    // 可重复挑战的卡（如 m2 速度挑战）不过滤，其余过滤已完成
    if (c.repeatable) return true;
    return !claimedIds.includes(c.id);
  });

  if (claimed && card) {
    // 已领分态
    el.innerHTML = `
      <div class="focus-time-card ft-complete">
        <div class="ft-header">
          <span class="ft-icon">${card.icon || card.stars}</span>
          <div class="ft-title-area">
            <div class="ft-title">🎯 今日我的挑战 ${speakBtn(card.speech||'')}</div>
            <div class="ft-sub">✅ 「${card.name}」已完成！</div>
          </div>
          <div class="ft-score">+${card.score}分</div>
        </div>
        <div class="ft-done-summary">
          <div class="ft-done-activity">${card.series} · ${card.name} 挑战完成 🎉</div>
        </div>
        <button onclick="cancelSelfPick()" style="margin:10px 4px 0;padding:10px 16px;border-radius:10px;border:none;background:#f0f0f5;color:#666;font-size:0.9rem;font-weight:600;cursor:pointer;">
          ↩️ 点此撤销
        </button>
      </div>`;
    return;
  }

  if (card) {
    // 已选、未领分态
    const tipHtml = card.tip
      ? `<div style="margin:8px 0 4px;background:#fffbe6;border-radius:8px;padding:8px 12px;font-size:0.83rem;color:#7a5c00;white-space:pre-line">${card.tip}</div>`
      : '';
    el.innerHTML = `
      <div class="focus-time-card ft-active">
        <div class="ft-header">
          <span class="ft-icon">${card.stars}</span>
          <div class="ft-title-area">
            <div class="ft-title">🎯 今日我的挑战 ${speakBtn(card.speech||'')}</div>
            <div class="ft-sub">已选：「${card.name}」</div>
          </div>
          <div class="ft-score">+${card.score}分</div>
        </div>
        <div style="padding:0 4px">
          <div style="font-size:0.9rem;color:#333;margin-bottom:4px;">✅ ${card.desc}</div>
          ${tipHtml}
        </div>
        <div class="ft-actions">
          <button class="btn-ft-done" onclick="claimSelfPick()" style="margin-top:6px">
            ✅ 我完成了！领取 +${card.score}分
          </button>
          <button onclick="cancelSelfPick()" style="margin-top:6px;background:none;border:none;color:#aaa;font-size:0.82rem;cursor:pointer">
            ↩ 重新选一张
          </button>
        </div>
      </div>`;
    return;
  }

  // 未选态：展示可选卡片菜单（按系列分组，每组最多显示3张）
  const groups = {};
  available.forEach(c => {
    const s = c.series || '其他';
    if (!groups[s]) groups[s] = [];
    if (groups[s].length < 3) groups[s].push(c);
  });
  const seriesList = Object.keys(groups).slice(0, 8); // 最多显示8个系列

  el.innerHTML = `
    <div class="focus-time-card">
      <div class="ft-header">
        <span class="ft-icon">🎯</span>
        <div class="ft-title-area">
          <div class="ft-title">今日我的挑战</div>
          <div class="ft-sub">选一张你今天想挑战的任务卡，完成了来领分！</div>
        </div>
      </div>
      <div class="ft-menu-label">👇 选一张今天想做的：</div>
      <div style="max-height:260px;overflow-y:auto;padding:0 2px">
        ${seriesList.map(s => `
          <div style="margin-bottom:8px">
            <div style="font-size:0.78rem;color:#888;font-weight:600;margin-bottom:4px;padding-left:2px">${s}</div>
            ${groups[s].map(c => `
              <div class="ft-menu-item" style="justify-content:space-between;padding:7px 10px;margin-bottom:4px"
                   onclick="selectSelfPick('${c.id}')">
                <span style="font-size:0.9rem">${c.stars} ${c.name}</span>
                <span style="color:#F9A825;font-weight:700;font-size:0.9rem">+${c.score}分</span>
              </div>`).join('')}
          </div>`).join('')}
        ${available.length === 0 ? '<div style="text-align:center;color:#aaa;padding:16px">🎉 所有挑战卡都完成啦！太厉害了！</div>' : ''}
      </div>
    </div>`;
}

function selectSelfPick(id) {
  state.selfPickCard = id;
  state.selfPickClaimed = false;
  saveState();
  renderSelfPick();
}

function cancelSelfPick() {
  // 如果已经claim过，需要撤销积分
  if (state.selfPickClaimed && state.selfPickCard) {
    const card = TASK_CARDS.find(c => c.id === state.selfPickCard);
    if (card) {
      // 撤销cardClaims
      if (state.cardClaims && state.cardClaims[card.id]) {
        state.cardClaims[card.id]--;
        if (state.cardClaims[card.id] <= 0) {
          delete state.cardClaims[card.id];
          // 如果是该卡片第一次被claim，撤销周度计数
          state.weeklyCardCount = Math.max(0, (state.weeklyCardCount || 0) - 1);
        }
      }
      // 撤销阅读计数
      if (card.series && card.series.includes('阅读')) {
        state.readCount = Math.max(0, (state.readCount || 0) - 1);
      }
      showCelebration('↩️', '已撤销', `「${card.name}」挑战打卡已撤销`);
    }
  }
  state.selfPickCard = null;
  state.selfPickClaimed = false;
  saveState();
  renderSelfPick();
}

function claimSelfPick() {
  const card = TASK_CARDS.find(c => c.id === state.selfPickCard);
  if (!card || state.selfPickClaimed) return;
  // 先弹出「是否自主完成」对话框，回调里再执行 claimCard
  showSelfReportUnified(card.id, card.name, card.score, '🎯', (isSelf) => {
    claimCard(state.selfPickCard);
    state.selfPickClaimed = true;
    saveState();
    renderSelfPick();
    const msg = isSelf ? '自律英雄！💪 自己主动完成，太棒了！' : '诚实是最好的品质 👋 加油继续！';
    showCelebration(isSelf ? '💪' : '👋', isSelf ? '自律打卡！' : '诚实打卡！', msg);
    setTimeout(() => tryShowShopBoost(card.score, false), 1600);
  });
}

// ── 通用自律自报弹窗（所有模块共用）─────────────────────────
// taskId: 唯一key用于统计 | taskName: 显示名 | score: 分值 | icon: emoji | onConfirm: 完成后回调
function showSelfReportUnified(taskId, taskName, score, icon, onConfirm) {
  const today = todayStr();
  // 移除已有弹窗，避免叠加
  const existing = document.getElementById('selfReportUnifiedModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'selfReportUnifiedModal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;
    display:flex;align-items:center;justify-content:center;padding:20px;
  `;
  modal.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:28px 24px;max-width:320px;width:100%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.18);">
      <div style="font-size:2rem;margin-bottom:8px;">${icon}</div>
      <div style="font-size:1.1rem;font-weight:700;color:#1a1a2e;margin-bottom:6px;">「${taskName}」完成啦！</div>
      <div style="font-size:0.95rem;color:#666;margin-bottom:20px;">今天是你自己想起来做的吗？</div>
      <div style="display:flex;gap:12px;justify-content:center;">
        <button id="_srSelfBtn"
          style="flex:1;padding:14px 8px;border-radius:14px;border:none;background:linear-gradient(135deg,#06D6A0,#00897B);color:#fff;font-size:1rem;font-weight:700;cursor:pointer;">
          💪 我自己<br>想起来的！
        </button>
        <button id="_srRemindBtn"
          style="flex:1;padding:14px 8px;border-radius:14px;border:none;background:#f0f0f0;color:#555;font-size:1rem;font-weight:700;cursor:pointer;">
          👋 爸爸/妈妈<br>提醒了我
        </button>
      </div>
      <div style="font-size:0.8rem;color:#aaa;margin-top:14px;">诚实回答，不管哪个都不扣分 ✨</div>
    </div>
  `;
  document.body.appendChild(modal);

  function close(isSelf) {
    modal.remove();
    if (!state.selfReport) state.selfReport = {};
    if (!state.selfReport[today]) state.selfReport[today] = {};
    state.selfReport[today][taskId] = isSelf ? 'self' : 'reminded';
    saveState();
    if (window._firebaseReady) {
      window._firebaseSet(
        window._firebaseRef(window._firebaseDB, `selfReport/${today}/${taskId}`),
        isSelf ? 'self' : 'reminded'
      );
    }
    if (onConfirm) onConfirm(isSelf);
  }

  document.getElementById('_srSelfBtn').onclick = () => close(true);
  document.getElementById('_srRemindBtn').onclick = () => close(false);
}

function togglePackItem(packType, id, score) {
  const packKey = packType === 'morning' ? 'morningPack' : 'nightPack';
  const pack = packType === 'morning' ? MORNING_PACK : NIGHT_PACK;
  const fullScore = packType === 'morning' ? MORNING_PACK_FULL : NIGHT_PACK_FULL;
  const bonusKey = packType === 'morning' ? 'morningPackBonus' : 'nightPackBonus';

  if (state[packKey][id]) {
    // 取消
    delete state[packKey][id];
    // 如果之前已发全套奖励，扣回差额
    if (state[bonusKey]) {
      const prevDone = Object.keys(state[packKey]).length + 1; // 取消前数量
      const prevScore = prevDone >= pack.length ? fullScore : prevDone;
      const newDone = Object.keys(state[packKey]).length;
      const newScore = newDone >= pack.length ? fullScore : newDone;
      state.totalScore = Math.max(0, state.totalScore - (prevScore - newScore));
      if (newDone < pack.length) state[bonusKey] = false;
    }
    saveState(); renderAll();
    return;
  }

  state[packKey][id] = true;
  const doneCnt = Object.keys(state[packKey]).length;
  const isFull = doneCnt >= pack.length;

  // 计算本次新增分：全套触发时发全套分，否则发1分
  let gain = 1;
  if (isFull && !state[bonusKey]) {
    // 全套触发：发全套分，减去之前单件已发的分
    const prevPts = doneCnt - 1; // 之前已得分
    gain = fullScore - prevPts;
    state[bonusKey] = true;
    updateStreak(packType === 'morning' ? 'morning' : 'night');
  }

  state.totalScore += gain;
  saveState();

  // Firebase 同步
  if (window._firebaseReady) {
    submitPending('pack', id, (packType==='morning'?'早晨':'睡前')+'英雄包·'+id, gain);
  }

  renderAll();
  const packIcon = packType === 'morning' ? '🌅' : '🌙';
  const packLabel = packType === 'morning' ? '早晨英雄包' : '睡前英雄包';
  const packItemName = pack.find(t => t.id === id)?.name || id;
  if (isFull && gain > 1) {
    // 全套完成：弹自律弹窗，回调里弹庆祝
    showSelfReportUnified(`${packType}_full_${todayStr()}`, `${packLabel}全套完成`, gain, packIcon, (isSelf) => {
      showCelebration('🎉', `${packLabel}全套！`, `太棒了！全套完成+${fullScore}分！`);
      setTimeout(() => tryShowShopBoost(gain, false), 1600);
    });
  } else {
    // 单件完成：弹自律弹窗，回调里弹小庆祝
    showSelfReportUnified(`${packType}_${id}`, packItemName, 1, packIcon, (isSelf) => {
      showCelebration('✅', '完成一件！', `已完成${doneCnt}/${pack.length}件，${isFull?'全套达成！':'再完成'+(pack.length-doneCnt)+'件有惊喜！'}`);
    });
  }
}

// ── 写作业（简化版）──────────────────────────────────────────
function undoHomework() {
  if (!state.hwCompleted) return;
  state.hwCompleted = false;
  state.totalScore -= HOMEWORK_TASK.scoreComplete;
  if (state.totalScore < 0) state.totalScore = 0;
  // 撤销streak：清空今天的记录
  if (state.streaks && state.streaks.homework && state.streaks.homework.lastDate === todayStr()) {
    state.streaks.homework.count = 0;
    state.streaks.homework.lastDate = '';
  }
  saveState();
  if (window._firebaseReady) {
    // 删除pending记录（设为null）
    submitPending('homework', 'hw_complete', null, null);
  }
  renderAll();
  showCelebration('↩️', '已撤销', '作业打卡已撤销，分数已扣回');
}

function completeHomework() {
  if (state.hwCompleted) {
    // 已完成，切换为撤销模式
    undoHomework();
    return;
  }
  state.hwCompleted = true;
  state.totalScore += HOMEWORK_TASK.scoreComplete;
  updateStreak('homework');
  saveState();
  if (window._firebaseReady) {
    submitPending('homework', 'hw_complete', '作业完成', HOMEWORK_TASK.scoreComplete);
  }
  renderAll();
  showSelfReportUnified('hw_complete', '今日作业完成', HOMEWORK_TASK.scoreComplete, '📚', (isSelf) => {
    showCelebration('📚', '作业完成！', `写完作业了！+${HOMEWORK_TASK.scoreComplete}分！太棒了！`);
    setTimeout(() => tryShowShopBoost(HOMEWORK_TASK.scoreComplete, false), 1600);
  });
}

function addFocusBlock() {
  if (state.hwBlocks >= HOMEWORK_TASK.maxBlocks) {
    showCelebration('🏆', '专注块已满！', `已完成${HOMEWORK_TASK.maxBlocks}个专注块，太棒了！`);
    return;
  }
  state.hwBlocks = (state.hwBlocks || 0) + 1;
  state.totalScore += HOMEWORK_TASK.scorePerBlock;
  saveState();
  if (window._firebaseReady) {
    submitPending('homework', 'hw_block_'+state.hwBlocks, `专注块第${state.hwBlocks}块`, HOMEWORK_TASK.scorePerBlock);
  }
  renderAll();
  showSelfReportUnified(`hw_block_${state.hwBlocks}`, `专注块第${state.hwBlocks}块`, HOMEWORK_TASK.scorePerBlock, '🍅', (isSelf) => {
    showCelebration('🍅', `专注块 ${state.hwBlocks}/${HOMEWORK_TASK.maxBlocks}！`, `专注${HOMEWORK_TASK.blockMinutes}分钟完成！+${HOMEWORK_TASK.scorePerBlock}分！`);
  });
}

// ── 专注力时光（独立模块）────────────────────────────────────
let _focusTimer = null;
let _focusSeconds = 0;
let _focusTimerRunning = false;

function renderFocusTime() {
  const el = document.getElementById('dailyFocusTime');
  if (!el) return;
  const ft = FOCUS_TIME;
  const selected = state.focusSelected;
  const started = !!state.focusStarted;
  const completed = !!state.focusCompleted;
  const overtime = !!state.focusOvertime;
  const menuItem = selected ? ft.menuItems.find(m => m.id === selected) : null;

  el.innerHTML = `
    <div class="focus-time-card ${completed ? 'ft-complete' : started ? 'ft-active' : ''}">
      <div class="ft-header">
        <span class="ft-icon">${ft.icon}</span>
        <div class="ft-title-area">
          <div class="ft-title">${ft.name} ${speakBtn(ft.speech)}${streakBadge('focus')}</div>
          <div class="ft-sub">${
            overtime ? '⚡ 超级专注模式！停不下来最棒了！' :
            completed ? '✅ 今日专注力时光完成！' :
            started ? `⏱️ 专注中：<span id="focusTimerDisplay">${formatFocusSecs(_focusSeconds)}</span>` :
            ft.sub
          }</div>
        </div>
        <div class="ft-score">+${completed ? (overtime ? ft.score + ft.bonusScore : ft.score) : ft.score}分</div>
      </div>

      ${!completed ? `
      <div class="ft-menu-label">🎯 今天想专注做什么？</div>
      <div class="ft-menu">
        ${ft.menuItems.map(m => `
          <div class="ft-menu-item ${selected===m.id?'selected':''}" onclick="selectFocusActivity('${m.id}')">
            <span>${m.icon}</span><span>${m.name}</span>
          </div>`).join('')}
      </div>
      <div class="ft-actions">
        ${!started ? `
          <button class="btn-ft-start ${!selected?'disabled':''}" onclick="startFocusTime()" ${!selected?'disabled':''}>
            ${selected ? `▶ 开始专注（${ft.minutes}分钟）` : '👆 先选一件事'}
          </button>` :
        `<div class="ft-timer-row">
          <div class="ft-timer-big" id="focusTimerBig">${formatFocusSecs(_focusSeconds)}</div>
          <div class="ft-timer-hint">${ft.minutes}分钟 = 完成！停不下来就继续 🔥</div>
          <button class="btn-ft-done ${_focusSeconds < ft.minutes * 60 ? 'disabled' : ''}" onclick="${_focusSeconds >= ft.minutes * 60 ? 'completeFocusTime(false)' : ''}" ${_focusSeconds < ft.minutes * 60 ? 'disabled' : ''}>✅ 完成了！（${ft.minutes}分钟到了）</button>
          <button class="btn-ft-overtime ${_focusSeconds < ft.minutes * 60 ? 'disabled' : ''}" onclick="${_focusSeconds >= ft.minutes * 60 ? 'completeFocusTime(true)' : ''}" ${_focusSeconds < ft.minutes * 60 ? 'disabled' : ''}>⚡ 停不下来！继续超时（+${ft.bonusScore}分）</button>
          ${_focusSeconds < ft.minutes * 60 ? '<div style="margin-top:8px;font-size:0.8rem;color:#f44336">⏱️ 专注满' + ft.minutes + '分钟才能打卡哦，再坚持一下！</div>' : ''}
        </div>`}
      </div>` :
      `<div class="ft-done-summary">
        <div class="ft-done-activity">${menuItem ? menuItem.icon + ' ' + menuItem.name : ''}专注完成 🎉</div>
        ${overtime ? '<div class="ft-overtime-badge">⚡ 超级专注徽章已解锁！</div>' : ''}
        <button class="btn-ft-undo" onclick="undoFocusTime()" style="margin-top:10px;padding:10px 16px;border-radius:10px;border:none;background:#f0f0f5;color:#666;font-size:0.9rem;font-weight:600;cursor:pointer;">
          ↩️ 点此撤销
        </button>
      </div>`}
    </div>`;

  if (started && !completed && _focusTimerRunning) {
    _startFocusDisplayUpdate();
  }
}

function selectFocusActivity(id) {
  if (state.focusStarted) return;
  state.focusSelected = id;
  saveState();
  renderFocusTime();
}

function startFocusTime() {
  if (!state.focusSelected || state.focusStarted) return;
  state.focusStarted = true;
  _focusSeconds = 0;
  _focusTimerRunning = true;
  saveState();
  renderFocusTime();
  _startFocusTimer();
  showCelebration('🧠', '专注开始！', '找一个安静的地方，关掉干扰，专心做你选的事！');
}

function _startFocusTimer() {
  if (_focusTimer) clearInterval(_focusTimer);
  _focusTimer = setInterval(() => {
    _focusSeconds++;
    const d1 = document.getElementById('focusTimerDisplay');
    const d2 = document.getElementById('focusTimerBig');
    const t = formatFocusSecs(_focusSeconds);
    if (d1) d1.textContent = t;
    if (d2) d2.textContent = t;
  }, 1000);
}

function _startFocusDisplayUpdate() {
  const d1 = document.getElementById('focusTimerDisplay');
  const d2 = document.getElementById('focusTimerBig');
  if ((d1 || d2) && _focusTimerRunning) {
    if (_focusTimer) clearInterval(_focusTimer);
    _focusTimer = setInterval(() => {
      _focusSeconds++;
      const t = formatFocusSecs(_focusSeconds);
      if (d1) d1.textContent = t;
      if (d2) d2.textContent = t;
    }, 1000);
  }
}

function formatFocusSecs(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
}

function undoFocusTime() {
  if (!state.focusCompleted) return;
  const wasOvertime = !!state.focusOvertime;
  const pts = FOCUS_TIME.score + (wasOvertime ? FOCUS_TIME.bonusScore : 0);
  state.focusCompleted = false;
  state.focusOvertime = false;
  state.focusSelected = null;
  state.focusStarted = null;
  _focusSeconds = 0;
  if (_focusTimer) { clearInterval(_focusTimer); _focusTimer = null; }
  _focusTimerRunning = false;
  state.totalScore -= pts;
  if (state.totalScore < 0) state.totalScore = 0;
  // 撤销streak
  if (state.streaks && state.streaks.focus && state.streaks.focus.lastDate === todayStr()) {
    state.streaks.focus.count = 0;
    state.streaks.focus.lastDate = '';
  }
  saveState();
  if (window._firebaseReady) {
    submitPending('focus', 'focus_time', null, null);
  }
  renderAll();
  showCelebration('↩️', '已撤销', '专注力时光打卡已撤销，分数已扣回');
}

function completeFocusTime(isOvertime) {
  if (state.focusCompleted) {
    // 已完成，切换为撤销模式
    undoFocusTime();
    return;
  }
  if (_focusTimer) { clearInterval(_focusTimer); _focusTimer = null; }
  _focusTimerRunning = false;
  state.focusCompleted = true;
  state.focusOvertime = isOvertime;
  const pts = FOCUS_TIME.score + (isOvertime ? FOCUS_TIME.bonusScore : 0);
  state.totalScore += pts;
  updateStreak('focus');
  saveState();
  if (window._firebaseReady) {
    submitPending('focus', 'focus_time', '专注力时光', pts);
  }
  renderAll();
  showSelfReportUnified('focus_time', '专注力时光', pts, isOvertime ? '⚡' : '🧠', (isSelf) => {
    if (isOvertime) {
      showCelebration('⚡', '超级专注徽章！', `停不下来是最棒的状态！+${pts}分！超级专注徽章已解锁！`);
    } else {
      showCelebration('🧠', '专注力时光完成！', `专注了${FOCUS_TIME.minutes}分钟！+${pts}分！你越来越厉害了！`);
    }
    setTimeout(() => tryShowShopBoost(pts, false), 1600);
  });
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

  // 固定任务：完成后弹出自律自报弹窗
  const fixedTask = DAILY_FIXED.find(t => t.id === id);
  if (fixedTask) {
    // 先标记待审，再弹自报
    state.todayChecked[id] = 'pending';
    saveState();
    const allTasks = [...DAILY_FIXED, ...DAILY_OPTIONAL, ...DAILY_HOMEWORK];
    const task = allTasks.find(t => t.id === id);
    if (task && window._firebaseReady) {
      submitPending('daily', id, task.name, score);
    }
    renderAll();
    // 弹出自律自报弹窗（通用版）
    setTimeout(() => showSelfReportUnified(id, task ? task.name : id, score, '🦸', (isSelf) => {
      const msg = isSelf ? '自律英雄！💪 自己主动完成，太棒了！' : '诚实是最好的品质 👋 加油继续！';
      showCelebration(isSelf ? '💪' : '👋', isSelf ? '自律打卡！' : '诚实打卡！', msg);
      setTimeout(() => tryShowShopBoost(score, true), 1600);
    }), 400);
    return;
  }

  // 可选/作业任务：先提交，再弹自律弹窗
  state.todayChecked[id] = 'pending';
  saveState();
  const allTasks = [...DAILY_FIXED, ...DAILY_OPTIONAL, ...DAILY_HOMEWORK];
  const task = allTasks.find(t => t.id === id);
  if (task && window._firebaseReady) {
    submitPending('daily', id, task.name, score);
  }
  renderAll();
  setTimeout(() => showSelfReportUnified(id, task ? task.name : id, score, '🎮', (isSelf) => {
    showCelebration('⏳', '已提交！等待确认', `「${task ? task.name : id}」等爸爸妈妈审核后积分入账 💪`);
    setTimeout(() => tryShowShopBoost(score, true), 1600);
  }), 400);
}

// [showSelfReportModal/submitSelfReport 已合并入 showSelfReportUnified]

// ── 月度自律率计算 ─────────────────────────────────────────────
function calcMonthlyDisciplineRate(year, month) {
  if (!state.selfReport) return { rate: 0, selfDays: 0, totalDays: 0 };
  const prefix = `${year}-${String(month).padStart(2,'0')}`;
  let selfDays = 0, totalDays = 0;

  Object.entries(state.selfReport).forEach(([date, tasks]) => {
    if (!date.startsWith(prefix)) return;
    // 判断当天固定任务完成率是否达到80%
    const fixedIds = DAILY_FIXED.map(t => t.id);
    const totalFixed = fixedIds.length;
    // 当天有自报记录的固定任务数（说明完成了）
    const reportedFixed = fixedIds.filter(id => tasks[id]).length;
    if (totalFixed === 0 || reportedFixed / totalFixed < 0.8) return; // 固定任务不达标，不计入

    // 自律判断：当天所有自报的固定任务都是'self'
    const reportedEntries = Object.values(tasks).filter(v => v === 'self' || v === 'reminded');
    if (reportedEntries.length === 0) return;
    totalDays++;
    const allSelf = reportedEntries.every(v => v === 'self');
    if (allSelf) selfDays++;
  });

  const rate = totalDays > 0 ? Math.round(selfDays / totalDays * 100) : 0;
  return { rate, selfDays, totalDays };
}

// ── B类奖励解锁判断 ───────────────────────────────────────────
function isBRewardUnlocked() {
  const now = new Date();
  const { rate } = calcMonthlyDisciplineRate(now.getFullYear(), now.getMonth() + 1);
  return rate >= 85;
}

// ── 自律能量条渲染 ────────────────────────────────────────────
function renderDisciplineBar() {
  const el = document.getElementById('disciplineBar');
  if (!el) return;
  const now = new Date();
  const { rate, selfDays, totalDays } = calcMonthlyDisciplineRate(now.getFullYear(), now.getMonth() + 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainDays = daysInMonth - now.getDate();
  const unlocked = rate >= 85;
  const filled = Math.round(rate / 10);
  const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
  el.innerHTML = `
    <div class="discipline-bar-wrap" style="background:${unlocked?'#e8fff5':'#fff8e1'};border-radius:14px;padding:14px 16px;margin:10px 0;border:1.5px solid ${unlocked?'#06D6A0':'#FFD54F'};">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <span style="font-weight:700;font-size:0.95rem;color:#1a1a2e;">🏅 本月自律能量条</span>
        <span style="font-size:1rem;font-weight:700;color:${unlocked?'#06D6A0':'#F9A825'};">${rate}%</span>
      </div>
      <div style="font-family:monospace;font-size:1.1rem;color:${unlocked?'#00897B':'#F57F17'};letter-spacing:2px;">${bar}</div>
      <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:0.82rem;color:#888;">
        <span>自律天数：${selfDays}/${totalDays}天</span>
        <span>剩余：${remainDays}天</span>
      </div>
      ${unlocked
        ? '<div style="margin-top:8px;font-size:0.88rem;color:#06D6A0;font-weight:700;">✨ 本月自律达标！大奖已解锁！</div>'
        : rate > 0
          ? `<div style="margin-top:8px;font-size:0.85rem;color:#F9A825;">还差${85-rate}%解锁本月大奖，加油！💪</div>`
          : '<div style="margin-top:8px;font-size:0.85rem;color:#aaa;">开始打卡，积累自律能量！</div>'
      }
    </div>
  `;
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
          ${!isUnlocked && !c.weekUnlock ? `<div class="card-unlock">${
            c.unlockRope !== undefined ? '🪢 跳绳达到'+c.unlockRope+'个解锁' :
            c.unlockMathCount !== undefined ? '⚡ 口算练习'+c.unlockMathCount+'次解锁' :
            c.unlockMathBest !== undefined ? '⚡ 口算单次答对'+c.unlockMathBest+'题解锁' :
            c.unlockMathLevel !== undefined ? '⚡ 口算升到第'+(c.unlockMathLevel+1)+'关解锁' :
            c.unlockReadCount !== undefined ? '📚 完成'+c.unlockReadCount+'次阅读挑战解锁' :
            '累计'+c.unlockAt+'分解锁'
          }</div>` : ''}
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
  // 跳绳成绩联动解锁（ropeMax）
  if (card.unlockRope !== undefined) return (state.ropeMax || 0) >= card.unlockRope;
  // 口算数据联动解锁（三种维度）
  if (card.unlockMathCount !== undefined) {
    try { const d = loadMathData(); return (d.history||[]).length >= card.unlockMathCount; } catch(e) { return false; }
  }
  if (card.unlockMathBest !== undefined) {
    try { const d = loadMathData(); const best = (d.history||[]).reduce((m,h) => Math.max(m, h.correct||0), 0); return best >= card.unlockMathBest; } catch(e) { return false; }
  }
  if (card.unlockMathLevel !== undefined) {
    try { const d = loadMathData(); return (d.levelId||0) >= card.unlockMathLevel; } catch(e) { return false; }
  }
  // 阅读次数联动解锁（readCount）
  if (card.unlockReadCount !== undefined) return (state.readCount || 0) >= card.unlockReadCount;
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
  btn.onclick = () => claimCardWithReport(id);
  btn.disabled = !unlocked;
  btn.style.opacity = unlocked ? '1' : '0.4';
  btn.textContent = unlocked ? '✅ 我完成了！领取积分' : '🔒 还没解锁';

  document.getElementById('cardModal').style.display = 'flex';
  window._currentCardId = id;
}

// 挑战卡领取入口：先弹自律弹窗，再执行 claimCard
function claimCardWithReport(id) {
  const card = TASK_CARDS.find(c => c.id === id);
  if (!card || !isCardUnlocked(card)) return;
  showSelfReportUnified(card.id, card.name, card.score, '🃏', (isSelf) => {
    claimCard(id);
  });
}

function claimCard(id) {
  const card = TASK_CARDS.find(c => c.id === id);
  if (!card || !isCardUnlocked(card)) return;
  state.cardClaims[id] = (state.cardClaims[id] || 0) + 1;
  // 周度成就计数（每张只计一次）
  if (state.cardClaims[id] === 1) {
    state.weeklyCardCount = (state.weeklyCardCount || 0) + 1;
  }
  // 阅读卡联动：每次领取阅读系列卡累计readCount
  if (card.series && card.series.includes('阅读')) {
    state.readCount = (state.readCount || 0) + 1;
  }
  saveState();
  if (window._firebaseReady) {
    submitPending('card', id, card.name, card.score);
  }
  closeModal('cardModal');
  renderAll();
  // 检查周度成就升级
  const newAch = WEEKLY_ACHIEVEMENTS.slice().reverse().find(a => state.weeklyCardCount >= a.minCards);
  if (newAch && newAch.id !== state.weeklyAchievement) {
    state.weeklyAchievement = newAch.id;
    saveState();
    setTimeout(() => showCelebration(newAch.icon, `${newAch.level}成就！`, `本周完成${state.weeklyCardCount}张任务卡！周末结算+${newAch.bonusScore}分！`), 800);
  } else {
    showCelebration('⏳', `「${card.name}」已申请！`, `等爸爸妈妈审核后 +${card.score}分入账！`);
  }
}

// ── 渲染商店 ───────────────────────────────────────────────────
function renderShop() {
  document.getElementById('shopScore').textContent = state.totalScore;
  const el = document.getElementById('shopContent');
  const bUnlocked = isBRewardUnlocked();

  // 自律能量条
  const now = new Date();
  const { rate, selfDays, totalDays } = calcMonthlyDisciplineRate(now.getFullYear(), now.getMonth() + 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainDays = daysInMonth - now.getDate();
  const filled = Math.min(10, Math.round(rate / 10));
  const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
  const barHtml = `
    <div style="background:${bUnlocked?'#e8fff5':'#fff8e1'};border-radius:14px;padding:14px 16px;margin-bottom:16px;border:1.5px solid ${bUnlocked?'#06D6A0':'#FFD54F'};">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <span style="font-weight:700;font-size:0.95rem;color:#1a1a2e;">🏅 本月自律能量条</span>
        <span style="font-size:1rem;font-weight:700;color:${bUnlocked?'#06D6A0':'#F9A825'};">${rate}%</span>
      </div>
      <div style="font-family:monospace;font-size:1.15rem;color:${bUnlocked?'#00897B':'#F57F17'};letter-spacing:2px;">${bar}</div>
      <div style="display:flex;justify-content:space-between;margin-top:5px;font-size:0.8rem;color:#888;">
        <span>自律天数 ${selfDays}/${totalDays}天</span>
        <span>剩余${remainDays}天</span>
      </div>
      ${bUnlocked
        ? '<div style="margin-top:6px;font-size:0.88rem;color:#06D6A0;font-weight:700;">✨ 本月自律达标！🔓 自律大奖已解锁！</div>'
        : rate >= 50
          ? `<div style="margin-top:6px;font-size:0.82rem;color:#F9A825;">还差${85-rate}%解锁本月自律大奖 💪</div>`
          : '<div style="margin-top:6px;font-size:0.82rem;color:#aaa;">每天自己主动完成任务，积累自律能量！</div>'
      }
    </div>
  `;

  el.innerHTML = barHtml + SHOP.map(section => {
    // v22：所有奖励全部可见，B类未达标时显示锁定态（而非隐藏）
    return `
    <div class="shop-section">
      <div class="shop-section-header" style="background:${section.color}">${section.type}</div>
      ${section.items.map(item => {
        const isLocked = item.selfDisciplineRequired && !bUnlocked;
        const canBuy = !isLocked && state.totalScore >= item.cost;
        const btnClass = item.isEgg ? 'egg' : (canBuy ? 'available' : 'unavailable');
        const tierBadge = item.tier === 'B'
          ? `<span style="font-size:0.7rem;background:${bUnlocked?'#06D6A0':'#aaa'};color:#fff;border-radius:6px;padding:1px 6px;margin-left:4px;">${bUnlocked?'✨自律奖励':'🔒自律解锁'}</span>`
          : '';
        // 锁定态：卡片灰显 + 显示解锁条件 + 仍有语音按钮
        if (isLocked) {
          const needRate = 85;
          const now = new Date();
          const { rate } = calcMonthlyDisciplineRate(now.getFullYear(), now.getMonth()+1);
          const gap = needRate - rate;
          return `
          <div class="shop-item" style="background:#f5f5f5;border:1.5px dashed #ccc;opacity:0.82;">
            <div class="shop-icon" style="filter:grayscale(0.5)">${item.icon}</div>
            <div class="shop-info">
              <div class="shop-name" style="color:#888">${item.name}${tierBadge}${speakBtn(item.speech)}</div>
              <div class="shop-note" style="color:#aaa">${item.note}</div>
              <div style="margin-top:6px;font-size:0.8rem;color:#F9A825;font-weight:600;">
                🔒 本月自律率达85%解锁 · 当前${rate}% · 还差${gap}%
              </div>
            </div>
            <div class="shop-cost" style="color:#bbb">${item.cost}分</div>
          </div>`;
        }
        // 正常态（A类或B类已解锁）
        return `
          <div class="shop-item" style="background:${section.lightColor}${item.tier==='B'?';border:1.5px solid #06D6A0':''}">
            <div class="shop-icon">${item.icon}</div>
            <div class="shop-info">
              <div class="shop-name">${item.name}${tierBadge}${speakBtn(item.speech)}</div>
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
    </div>`;
  }).join('');
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
// ── 渲染「写给子渊的信」独立Tab ─────────────────────────────
function renderKidPage() {
  const el = document.getElementById('kidPage');
  if (!el) return;
  const g = DAD_GUIDE;
  const nl2br = s => s.replace(/\n/g, '<br>');
  el.innerHTML = `
    <div class="dad-guide">
      <div class="dad-guide-header">${g.kidTitle}</div>
      <div class="dad-guide-body">
        <div class="dad-tip-box" style="background:#FFF8E7;border-left:4px solid #F9A825">
          <div class="dad-tip-text" style="line-height:2;font-size:14px">${nl2br(g.kidOpening)}</div>
        </div>
        <div style="font-size:14px;font-weight:700;padding:14px 0 8px;color:#1a1a2e">⚔️ 怎么玩？</div>
        <div style="font-size:13px;color:#666;margin-bottom:10px">每天，你有三种任务：</div>
        ${g.kidRules.map(r => `
          <div class="dad-principle" style="align-items:flex-start;background:#F8F9FF;border-radius:12px;padding:12px;margin-bottom:8px">
            <div class="principle-icon" style="font-size:1.4rem;background:none;padding:0;margin-right:12px">${r.icon}</div>
            <div>
              <div class="principle-title">${r.title}</div>
              <div class="principle-desc" style="line-height:1.8">${nl2br(r.desc)}</div>
            </div>
          </div>`).join('')}
        <div style="font-size:14px;font-weight:700;padding:14px 0 8px;color:#1a1a2e">🎁 积分能换什么？</div>
        ${g.kidShopIntro ? `<div class="dad-tip-box" style="background:#F3EFFF;border-left:4px solid #7C3AED;margin-bottom:12px"><div class="dad-tip-text" style="line-height:1.9;font-size:13px">${nl2br(g.kidShopIntro)}</div></div>` : ''}
        ${g.kidShop.map(s => `
          <div class="dad-example" style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:#F8F9FF;border-radius:8px;margin-bottom:6px">
            <span>${s.icon} <strong>${s.name}</strong></span>
            <span style="color:#7C3AED;font-weight:700">${s.cost}分${s.desc ? ` · <span style="color:#aaa;font-weight:400;font-size:0.85em">${s.desc}</span>` : ''}</span>
          </div>`).join('')}
        <div class="dad-tip-box" style="background:#EDFFF9;border-left:4px solid #06D6A0;margin-top:16px;text-align:center">
          <div class="dad-tip-text" style="line-height:2;color:#00897B;font-size:14px">${nl2br(g.kidClosing)}</div>
        </div>
      </div>
    </div>`;
}

// ── 渲染「爸爸妈妈要牢记」独立Tab ──────────────────────────
function renderDadPage() {
  const el = document.getElementById('dadPage');
  if (!el) return;
  const g = DAD_GUIDE;
  const nl2br = s => s.replace(/\n/g, '<br>');
  el.innerHTML = `
    <div class="dad-guide">
      <div class="dad-guide-header">${g.parentTitle}</div>
      <div class="dad-guide-body">
        <div class="dad-tip-box" style="background:#FFF0E6;border-left:4px solid #FF6B35">
          <div class="dad-tip-title" style="color:#FF6B35">🎯 这套系统的灵魂</div>
          <div class="dad-tip-text" style="line-height:1.8">${nl2br(g.parentSoul)}</div>
        </div>
        <div style="font-size:14px;font-weight:700;padding:14px 0 8px;color:#1a1a2e">你们的角色</div>
        ${g.parentRoles.map(r => `
          <div class="dad-principle" style="align-items:center">
            <div class="principle-icon">${r.icon}</div>
            <div>
              <span style="color:#aaa;text-decoration:line-through;font-size:13px">${r.role}</span>
              <span style="color:#06D6A0;font-weight:700;font-size:13px;margin-left:6px">${r.become}</span>
            </div>
          </div>`).join('')}
        <div style="font-size:14px;font-weight:700;padding:14px 0 8px;color:#1a1a2e">四个使用原则</div>
        ${g.parentPrinciples.map(p => `
          <div class="dad-principle" style="align-items:flex-start">
            <div class="principle-icon" style="background:#118AB2;color:#fff;min-width:28px;height:28px;font-size:13px">${p.icon}</div>
            <div>
              <div class="principle-title">${p.title}</div>
              <div class="principle-desc">${p.desc}</div>
            </div>
          </div>`).join('')}
        <div class="dad-tip-box" style="background:#EDFFF9;border-left:4px solid #06D6A0;margin-top:16px;text-align:center">
          <div class="dad-tip-text" style="line-height:2;color:#00897B;font-size:14px">${nl2br(g.parentClosing)}</div>
        </div>
        <!-- 清空测试数据（受 PIN 保护） -->
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #eee;text-align:center">
          <div style="font-size:12px;color:#aaa;margin-bottom:8px">⚠️ 测试阶段专用，正式使用前请清空数据</div>
          <button onclick="showSecureClearModal()" style="background:#fff;border:2px solid #FF6B35;color:#FF6B35;border-radius:10px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer;">
            🗑️ 清空所有测试数据
          </button>
        </div>
      </div>
    </div>`;
}

// dadSwitchTab 已移除（子渊页和爸妈页现为独立Tab）

function clearAllData() {
  // ── 安全检查：如果不是通过 showSecureClearModal 调用，直接拒绝 ──
  if (!window._secureClearAuthorized) {
    alert('❌ 请通过「爸爸妈妈要牢记」页面中的按钮来清空数据，需要父母 PIN 码验证！');
    return;
  }
  window._secureClearAuthorized = false; // 重置标志

  var now = new Date();
  var dateStr = now.getFullYear() + '年' + (now.getMonth()+1) + '月' + now.getDate() + '日  ' + 
                String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0') + ':' + String(now.getSeconds()).padStart(2,'0');
  if (!confirm('🗑️ 清空所有测试数据\n\n⏰ 时间：' + dateStr + '\n\n这会删除：\n• 所有积分（总积分 + 本周积分）\n• 所有打卡历史\n• 所有英雄包 / 今日作业记录\n• 英雄挑战 / 勋章进度\n• 本周英雄成就\n• 口算历史 / 最高分\n• 极速训练（跳绳）记录\n• 兑换记录\n• 品格英雄行为记录\n• Firebase 云端数据\n\n⚠️ PIN 码将保留，清空后无法恢复！')) return;

  // ── 1. 清空 localStorage（保留 PIN 码）────────────────────
  localStorage.removeItem('heroplan_v4');      // 主状态
  localStorage.removeItem('heroplan_math_v1'); // 口算数据
  // 兼容旧 key（如有残留）
  localStorage.removeItem('heroplan_state');

  // ── 2. 清空 Firebase 所有数据路径 ────────────────────────
  if (window._firebaseReady) {
    try {
      const db = window._firebaseDB;
      const ref = window._firebaseRef;
      const set = window._firebaseSet;
      // 逐路径清除，避免误删根节点结构
      set(ref(db, 'pending'),      null);
      set(ref(db, 'reviewed'),     null);
      set(ref(db, 'syncScore'),    null);
      set(ref(db, 'heroActions'),  null);
      set(ref(db, 'weeklyPraise'), null);
      set(ref(db, 'selfReport'),   null);
    } catch(e) {
      console.warn('Firebase 清空异常:', e);
    }
  }

  // ── 3. 重载页面 ───────────────────────────────────────────
  location.reload();
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
   📅 每周任务总览
══════════════════════════════════════════════════════════════ */

// ── 英雄等级定义 ──────────────────────────────────────────────
const HERO_LEVELS = [
  { min: 0,   max: 29,  name: '⭐ 小小探索者', avatar: '🌱', color: '#06D6A0',
    desc: '勇敢踏出第一步，英雄的旅程已经开始！' },
  { min: 30,  max: 59,  name: '⚡ 初级英雄',   avatar: '⚡', color: '#118AB2',
    desc: '积累了30分！你的能量正在蓄积！' },
  { min: 60,  max: 99,  name: '🔥 成长战士',   avatar: '🔥', color: '#F9A825',
    desc: '60分！战士的光芒开始显现！' },
  { min: 100, max: 149, name: '💫 超级英雄',    avatar: '💫', color: '#EF476F',
    desc: '100分突破！超级英雄正式诞生！' },
  { min: 150, max: 199, name: '🏆 传说英雄',    avatar: '🏆', color: '#7B2FBE',
    desc: '150分！传说级别的英雄出现了！' },
  { min: 200, max: Infinity, name: '👑 宇宙英雄', avatar: '👑', color: '#FF6B35',
    desc: '200分！你已经是宇宙级别的英雄！' },
];

// ── 徽章定义 ──────────────────────────────────────────────────
const BADGES = [
  // 积分里程碑徽章
  { id:'b_score30',  icon:'⭐', name:'初出茅庐',    desc:'累计积分达到30分',   unlockDesc:'再努力一下，累计积分到30分！', check: s => s.totalScore >= 30 },
  { id:'b_score60',  icon:'🔥', name:'烈焰战士',    desc:'累计积分达到60分',   unlockDesc:'累计积分到60分解锁', check: s => s.totalScore >= 60 },
  { id:'b_score100', icon:'💫', name:'超级英雄',    desc:'累计积分达到100分',  unlockDesc:'累计积分到100分解锁', check: s => s.totalScore >= 100 },
  { id:'b_score150', icon:'🏆', name:'传说英雄',    desc:'累计积分达到150分',  unlockDesc:'累计积分到150分解锁', check: s => s.totalScore >= 150 },
  { id:'b_score200', icon:'👑', name:'宇宙英雄',    desc:'累计积分达到200分',  unlockDesc:'累计积分到200分解锁', check: s => s.totalScore >= 200 },
  // 跳绳徽章
  { id:'b_rope130',  icon:'🪢', name:'跳绳初级',    desc:'跳绳达到130个',      unlockDesc:'跳绳超过130个解锁', check: s => s.ropeMax >= 130 },
  { id:'b_rope150',  icon:'💪', name:'跳绳勇士',    desc:'跳绳达到150个',      unlockDesc:'跳绳超过150个解锁', check: s => s.ropeMax >= 150 },
  { id:'b_rope200',  icon:'🏅', name:'跳绳宇宙英雄',desc:'跳绳达到200个',      unlockDesc:'跳绳达到200个解锁', check: s => s.ropeMax >= 200 },
  // 任务卡系列徽章
  { id:'b_habit3',   icon:'🛡️', name:'敖丙传人',   desc:'习惯养成系列完成3张', unlockDesc:'完成习惯养成系列任意3张任务卡', check: s => countSeriesDone(s,'🌙 习惯养成') >= 3 },
  { id:'b_read3',    icon:'📚', name:'小书虫',      desc:'阅读探索系列完成3张', unlockDesc:'完成阅读探索系列任意3张任务卡', check: s => countSeriesDone(s,'📚 阅读探索') >= 3 },
  { id:'b_music3',   icon:'🎵', name:'音乐小达人',  desc:'音乐探索系列完成3张', unlockDesc:'完成音乐探索系列任意3张任务卡', check: s => countSeriesDone(s,'🎵 音乐探索') >= 3 },
  { id:'b_show1',    icon:'🎤', name:'初登舞台',    desc:'完成第一次父子演出',  unlockDesc:'完成「父子首演·小剧场版」任务卡', check: s => (s.cardClaims||{})['show1'] > 0 },
  { id:'b_create3',  icon:'🧱', name:'创造大师',    desc:'创造挑战系列完成3张', unlockDesc:'完成创造挑战系列任意3张任务卡', check: s => countSeriesDone(s,'🎨 创造挑战') >= 3 },
  // 特殊行为徽章
  { id:'b_firstcard',icon:'🎴', name:'初次出手',   desc:'完成第一张任务卡',   unlockDesc:'完成任意一张任务卡后解锁', check: s => Object.values(s.cardClaims||{}).some(v=>v>0) },
  { id:'b_math5',    icon:'⚡', name:'闪电大脑',   desc:'口算练习完成5次',    unlockDesc:'进行5次口算练习后解锁', check: () => { try { const d=JSON.parse(localStorage.getItem('heroplan_math_v1')||'{}'); return (d.history||[]).length >= 5; } catch(e){ return false; } } },
];

function countSeriesDone(s, seriesName) {
  const claims = s.cardClaims || {};
  return TASK_CARDS.filter(c => c.series === seriesName && claims[c.id] > 0).length;
}

// ── 今日推荐任务卡渲染 ────────────────────────────────────────
// ── 周度成就系统 ──────────────────────────────────────────────
function renderWeeklyAchievement() {
  const el = document.getElementById('weeklyAchievementBanner');
  if (!el) return;
  const weekCardCount = state.weeklyCardCount || 0;
  const achieved = WEEKLY_ACHIEVEMENTS.slice().reverse().find(a => weekCardCount >= a.minCards);
  const next = WEEKLY_ACHIEVEMENTS.find(a => weekCardCount < a.minCards);
  el.innerHTML = `<div class="weekly-ach-wrap">
    <div class="weekly-ach-title">🏆 本周英雄成就</div>
    <div class="weekly-ach-progress">
      ${WEEKLY_ACHIEVEMENTS.map(a => {
        const done = weekCardCount >= a.minCards;
        return `<div class="ach-step ${done?'done':''}">
          <span class="ach-step-icon">${a.icon}</span>
          <span class="ach-step-label">${a.level}</span>
          <span class="ach-step-cards">${a.minCards}张</span>
        </div>`;
      }).join('<div class="ach-arrow">→</div>')}
    </div>
    <div class="weekly-ach-current">
      ${achieved
        ? `<span style="color:#06D6A0;font-weight:700">${achieved.icon} ${achieved.level}！本周+${achieved.bonusScore}分等待结算</span>`
        : '<span style="color:#aaa">完成任务卡，向英雄进发！</span>'}
    </div>
    ${next ? `<div class="weekly-ach-next">再完成${next.minCards-weekCardCount}张→「${next.level}」+${next.bonusScore}分！</div>` : ''}
    <div class="weekly-card-count">本周已完成：<b>${weekCardCount}</b> 张任务卡</div>
  </div>`;
}

// ── 渲染每周任务总览 ──────────────────────────────────────────
function renderWeekly() {
  // ── 阶段横幅 ─────────────────────────────────────────────────
  const phaseEl = document.getElementById('phaseBanner');
  if (phaseEl) {
    const startDate = state.phaseStartDate || todayStr();
    const start = new Date(startDate);
    const now2 = new Date();
    const elapsed = Math.floor((now2 - start) / (1000 * 60 * 60 * 24));
    const total = 90;
    const remain = Math.max(0, total - elapsed);
    const progress = Math.min(100, Math.round(elapsed / total * 100));
    const { rate } = calcMonthlyDisciplineRate(now2.getFullYear(), now2.getMonth() + 1);
    phaseEl.innerHTML = `
      <div style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:16px;padding:14px 16px;color:#fff;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-weight:700;font-size:1rem;">🏆 第一阶段·自律培养</span>
          <span style="font-size:0.85rem;opacity:0.85;">剩余 ${remain} 天</span>
        </div>
        <div style="background:rgba(255,255,255,0.2);border-radius:8px;height:8px;margin-bottom:8px;">
          <div style="background:#fff;border-radius:8px;height:8px;width:${progress}%;transition:width 0.5s;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.8rem;opacity:0.9;">
          <span>已坚持 ${elapsed} 天 / 共 ${total} 天</span>
          <span>本月自律率 ${rate}%${rate>=85?' ✨':''}</span>
        </div>
      </div>
    `;
    if (!state.phaseStartDate) { state.phaseStartDate = todayStr(); saveState(); }
  }

  // 日期范围
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = d => `${d.getMonth()+1}/${d.getDate()}`;
  const daysZh = ['周日','周一','周二','周三','周四','周五','周六'];

  const drEl = document.getElementById('weeklyDateRange');
  if (drEl) drEl.textContent = `${fmt(monday)}(周一) — ${fmt(sunday)}(周日)`;

  const todayEl = document.getElementById('weeklyTodayDate');
  if (todayEl) todayEl.textContent = `${now.getMonth()+1}月${now.getDate()}日 ${daysZh[now.getDay()]}`;

  // 统计数字（顶部三格）
  const score = state.totalScore || 0;
  const checkedToday = Object.keys(state.todayChecked || {}).length;
  const cardsDone = Object.values(state.cardClaims || {}).reduce((a,b)=>a+(b>0?1:0),0);
  const wsEl = document.getElementById('weeklyTotalScore');
  if (wsEl) wsEl.textContent = score;
  const wdEl = document.getElementById('weeklyTaskDone');
  if (wdEl) wdEl.textContent = checkedToday;
  const wcEl = document.getElementById('weeklyCardDone');
  if (wcEl) wcEl.textContent = cardsDone;

  // ── ① 今日完成情况（因果链第一环：今天做了什么）──────────────
  const todayStatusDiv = document.getElementById('weeklyTodayStatus');
  if (todayStatusDiv) {
    const allDailyTasks = [...DAILY_FIXED, ...DAILY_OPTIONAL, ...DAILY_HOMEWORK];
    const doneCount = allDailyTasks.filter(t => state.todayChecked[t.id]).length;
    const totalCount = allDailyTasks.length;
    const todayEarned = allDailyTasks.reduce((sum, t) => {
      return sum + (state.todayChecked[t.id] ? t.score : 0);
    }, 0);

    // 进度条颜色
    const pct = Math.round(doneCount / totalCount * 100);
    const barColor = pct >= 80 ? '#06D6A0' : pct >= 50 ? '#FFB703' : '#EF476F';

    const taskRows = allDailyTasks.map(t => {
      const st = state.todayChecked[t.id];
      let badge = '', cls = '';
      if (st === 'approved') { badge = '<span class="wtask-badge done">✅</span>'; cls = 'done'; }
      else if (st === 'pending') { badge = '<span class="wtask-badge pending">⏳</span>'; cls = 'pending'; }
      else { badge = '<span class="wtask-badge none">—</span>'; }
      return `<div class="wtask-row ${cls}">
        <span class="wtask-icon">${t.icon}</span>
        <span class="wtask-name">${t.name}</span>
        <span class="wtask-score">+${t.score}分</span>
        ${badge}
      </div>`;
    }).join('');

    todayStatusDiv.innerHTML = `
      <div style="background:#F8F9FF;border-radius:14px;padding:14px;margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-weight:700;font-size:0.95rem;color:#1a1a2e;">今日完成 ${doneCount}/${totalCount} 件</span>
          <span style="font-weight:800;font-size:1.1rem;color:#118AB2;">+${todayEarned}分</span>
        </div>
        <div style="background:#e0e0e0;border-radius:8px;height:8px;margin-bottom:12px;">
          <div style="background:${barColor};border-radius:8px;height:8px;width:${pct}%;transition:width 0.5s;"></div>
        </div>
        ${taskRows}
      </div>
      <div style="display:flex;align-items:center;gap:6px;padding:10px 12px;background:#FFF8E7;border-radius:10px;font-size:0.85rem;color:#888;border-left:3px solid #FFB703;">
        ⬇️ 做完任务 → 积分入账 → 攒够就能换奖励！
      </div>
    `;
  }

  // ── ② 每日任务清单（因果链第二环：每件任务得多少分）────────────
  const taskListDiv = document.getElementById('weeklyTaskList');
  if (taskListDiv) {
    const fixedSection = DAILY_FIXED.map(t => `
      <div class="weekly-task-card fixed">
        <div class="wtc-left">
          <span class="wtc-icon">${t.icon}</span>
          <div>
            <div class="wtc-name">${t.name} <span style="font-size:11px;color:#aaa;font-weight:400;">必做</span></div>
            <div class="wtc-sub">${t.sub}</div>
          </div>
        </div>
        <div class="wtc-score">+${t.score}<span class="wtc-unit">分</span></div>
      </div>`).join('');

    const optAll = [...DAILY_OPTIONAL, ...DAILY_HOMEWORK];
    const optSection = optAll.map(t => `
      <div class="weekly-task-card optional">
        <div class="wtc-left">
          <span class="wtc-icon">${t.icon}</span>
          <div>
            <div class="wtc-name">${t.name} <span style="font-size:11px;color:#06D6A0;font-weight:400;">自愿</span></div>
            <div class="wtc-sub">${t.sub}</div>
          </div>
        </div>
        <div class="wtc-score">+${t.score}<span class="wtc-unit">分</span></div>
      </div>`).join('');

    // 计算今日可得总分
    const maxDaily = [...DAILY_FIXED, ...DAILY_OPTIONAL, ...DAILY_HOMEWORK].reduce((s,t)=>s+t.score,0);

    taskListDiv.innerHTML = `
      <div style="padding:8px 4px;font-size:12px;color:#888;margin-bottom:4px;">
        ⭐ <strong>必做任务</strong>（每天都要完成，每天最多可得 ${DAILY_FIXED.reduce((s,t)=>s+t.score,0)} 分）
      </div>
      ${fixedSection}
      <div style="padding:8px 4px;font-size:12px;color:#888;margin:6px 0 4px;">
        🎯 <strong>选做任务</strong>（做了来领，不做不扣，每天还可得 ${optAll.reduce((s,t)=>s+t.score,0)}+ 分）
      </div>
      ${optSection}
      <div style="margin-top:10px;padding:10px 12px;background:#EDFFF9;border-radius:10px;font-size:12px;color:#00897B;text-align:center;font-weight:600;">
        今天全部完成可得 ${maxDaily}+ 分 ⚡
      </div>
    `;
  }

  // ── ③ 本周可做任务卡（因果链第三环：英雄挑战额外加分）────────────
  const cardsDiv = document.getElementById('weeklyCards');
  if (cardsDiv) {
    const unlocked = TASK_CARDS.filter(c => isCardUnlocked(c));
    const locked = TASK_CARDS.filter(c => !isCardUnlocked(c));
    const groups = {};
    unlocked.forEach(c => {
      if (!groups[c.series]) groups[c.series] = [];
      groups[c.series].push(c);
    });

    let html = '';
    if (unlocked.length > 0) {
      html += '<div class="wcard-subtitle">⚔️ 现在可以做的挑战（完成额外得分！）</div>';
      Object.entries(groups).forEach(([series, cards]) => {
        html += `<div class="wcard-series-label">${series}</div>`;
        html += cards.map(c => {
          const done = (state.cardClaims||{})[c.id] > 0;
          return `<div class="wcard-row ${done?'done':''}" onclick="switchToCardsTab('${c.id}')">
            <span class="wcard-stars">${c.stars}</span>
            <div class="wcard-info">
              <div class="wcard-name">${c.name}</div>
              <div class="wcard-desc">${c.desc}</div>
            </div>
            <div class="wcard-right">
              <div class="wcard-score">+${c.score}</div>
              ${done ? '<div class="wcard-done-badge">✅</div>' : '<div style="font-size:11px;color:#888;">点击完成</div>'}
            </div>
          </div>`;
        }).join('');
      });
    }

    if (locked.length > 0) {
      const nearLocked = locked
        .filter(c => !c.weekUnlock && c.unlockAt > 0)
        .sort((a,b) => a.unlockAt - b.unlockAt)
        .slice(0, 3);
      if (nearLocked.length > 0) {
        html += '<div class="wcard-subtitle locked-tip">🔒 再攒一点就能解锁</div>';
        html += nearLocked.map(c => {
          const gap = c.unlockAt - score;
          return `<div class="wcard-row locked">
            <span class="wcard-stars">🔒</span>
            <div class="wcard-info">
              <div class="wcard-name">${c.name}</div>
              <div class="wcard-desc">${c.desc}</div>
            </div>
            <div class="wcard-right">
              <div class="wcard-score" style="color:#aaa">+${c.score}</div>
              <div class="wcard-unlock-gap">还差${gap}分</div>
            </div>
          </div>`;
        }).join('');
      }
    }
    cardsDiv.innerHTML = html || '<div class="empty-tip">暂无可用任务卡</div>';
  }

  // ── ④ 本周兑换目标（因果链第四环：积分→奖励） ────────────────────
  const shopDiv = document.getElementById('weeklyShopGoal');
  if (shopDiv) {
    const allItems = SHOP.flatMap(g => g.items.map(i => ({ ...i, type: g.type, typeColor: g.color })));
    const reachable = allItems.filter(i => !i.isEgg && i.cost <= score + 100).sort((a,b) => a.cost - b.cost);

    if (reachable.length === 0) {
      shopDiv.innerHTML = '<div class="empty-tip">继续完成任务，奖励快来了！⚡</div>';
    } else {
      const canBuyItems = reachable.filter(i => score >= i.cost);
      const soonItems = reachable.filter(i => score < i.cost);

      let html = '';
      if (canBuyItems.length > 0) {
        html += `<div style="padding:8px 4px;font-size:12px;color:#06D6A0;font-weight:700;margin-bottom:4px;">🎉 现在就可以兑换！</div>`;
        html += canBuyItems.map(item => `
          <div class="wshop-row can-buy" onclick="document.querySelector('[data-tab=\'shop\']').click()">
            <span class="wshop-icon">${item.icon}</span>
            <div class="wshop-info">
              <div class="wshop-name">${item.name}</div>
              <div class="wshop-type" style="color:${item.typeColor}">${item.type}</div>
            </div>
            <div class="wshop-right">
              <div class="wshop-cost">${item.cost}分</div>
              <div class="wshop-badge can">✅ 点击去兑换</div>
            </div>
          </div>`).join('');
      }

      if (soonItems.length > 0) {
        html += `<div style="padding:8px 4px;font-size:12px;color:#888;margin:8px 0 4px;">⏳ 再努力一点就够了…</div>`;
        html += soonItems.map(item => {
          const gap = item.cost - score;
          return `<div class="wshop-row">
            <span class="wshop-icon">${item.icon}</span>
            <div class="wshop-info">
              <div class="wshop-name">${item.name}</div>
              <div class="wshop-type" style="color:${item.typeColor}">${item.type}</div>
            </div>
            <div class="wshop-right">
              <div class="wshop-cost">${item.cost}分</div>
              <div class="wshop-badge gap">还差${gap}分</div>
            </div>
          </div>`;
        }).join('');
      }
      shopDiv.innerHTML = html;
    }
  }
}

// 点击任务卡跳转到任务卡Tab
function switchToCardsTab(cardId) {
  const tabBtn = document.querySelector('[data-tab="cards"]');
  if (tabBtn) tabBtn.click();
  setTimeout(() => openCardModal(cardId), 200);
}

/* ══════════════════════════════════════════════════════════════
   🏆 成就中心
══════════════════════════════════════════════════════════════ */

function renderAchievements() {
  const score = state.totalScore || 0;

  // ── 英雄档案 ────────────────────────────────────────────────
  const lvObj = HERO_LEVELS.slice().reverse().find(l => score >= l.min) || HERO_LEVELS[0];
  const avatarEl = document.getElementById('achHeroAvatar');
  const levelEl = document.getElementById('achHeroLevel');
  const scoreEl = document.getElementById('achTotalScore');
  const heroCard = document.getElementById('achHeroCard');
  if (avatarEl) avatarEl.textContent = lvObj.avatar;
  if (levelEl) { levelEl.textContent = lvObj.name; levelEl.style.color = lvObj.color; }
  if (scoreEl) scoreEl.textContent = score;
  if (heroCard) heroCard.style.borderColor = lvObj.color;

  // ── 徽章区 ──────────────────────────────────────────────────
  const badgesGrid = document.getElementById('achBadges');
  if (badgesGrid) {
    badgesGrid.innerHTML = BADGES.map(b => {
      const unlocked = b.check(state);
      return `<div class="ach-badge-item ${unlocked?'unlocked':'locked'}">
        <div class="ach-badge-icon">${unlocked ? b.icon : '🔒'}</div>
        <div class="ach-badge-name">${b.name}</div>
        <div class="ach-badge-desc">${unlocked ? b.desc : b.unlockDesc}</div>
      </div>`;
    }).join('');
  }

  // ── 任务卡系列进度 ──────────────────────────────────────────
  const seriesList = document.getElementById('achSeriesList');
  if (seriesList) {
    // 统计各系列
    const seriesMap = {};
    TASK_CARDS.forEach(c => {
      if (c.series === '🎤 演出里程碑') return; // 单独展示
      if (!seriesMap[c.series]) seriesMap[c.series] = { total:0, done:0, color:c.color, cards:[] };
      seriesMap[c.series].total++;
      seriesMap[c.series].cards.push(c);
      if ((state.cardClaims||{})[c.id] > 0) seriesMap[c.series].done++;
    });

    seriesList.innerHTML = Object.entries(seriesMap).map(([series, info]) => {
      const pct = Math.round(info.done / info.total * 100);
      const cardDetails = info.cards.map(c => {
        const done = (state.cardClaims||{})[c.id] > 0;
        const locked = !isCardUnlocked(c);
        let statusIcon = done ? '✅' : locked ? '🔒' : '⬜';
        return `<div class="ach-card-item ${done?'done':locked?'locked':''}">
          <span class="ach-card-status">${statusIcon}</span>
          <span class="ach-card-stars">${c.stars}</span>
          <div class="ach-card-detail">
            <div class="ach-card-name">${c.name}</div>
            <div class="ach-card-how">${locked ? (
              c.unlockRope !== undefined ? `🔒 跳绳达到${c.unlockRope}个解锁` :
              c.unlockMathCount !== undefined ? `🔒 口算练习${c.unlockMathCount}次解锁` :
              c.unlockMathBest !== undefined ? `🔒 口算单次答对${c.unlockMathBest}题解锁` :
              c.unlockMathLevel !== undefined ? `🔒 口算升到第${c.unlockMathLevel+1}关解锁` :
              c.unlockReadCount !== undefined ? `🔒 完成${c.unlockReadCount}次阅读挑战解锁` :
              `🔒 累计${c.unlockAt}分解锁`
            ) : done ? '✅ 已完成' : `📌 ${c.desc}`}</div>
          </div>
          <span class="ach-card-pts">+${c.score}</span>
        </div>`;
      }).join('');

      return `<div class="ach-series-block">
        <div class="ach-series-header">
          <span class="ach-series-name">${series}</span>
          <span class="ach-series-count" style="color:${info.color}">${info.done}/${info.total}</span>
        </div>
        <div class="ach-series-progress">
          <div class="ach-series-bar" style="width:${pct}%;background:${info.color}"></div>
        </div>
        <div class="ach-cards-list">${cardDetails}</div>
      </div>`;
    }).join('');
  }

  // ── 父子演出里程碑 ──────────────────────────────────────────
  const showList = document.getElementById('achShowList');
  if (showList) {
    const showCards = TASK_CARDS.filter(c => c.series === '🎤 演出里程碑');
    showList.innerHTML = showCards.map((c, i) => {
      const done = (state.cardClaims||{})[c.id] > 0;
      const locked = !isCardUnlocked(c);
      return `<div class="ach-show-item ${done?'done':locked?'locked':'available'}">
        <div class="ach-show-num">${i+1}</div>
        <div class="ach-show-content">
          <div class="ach-show-name">${c.stars} ${c.name}</div>
          <div class="ach-show-desc">${c.desc}</div>
          <div class="ach-show-how">
            ${done ? '🎉 已完成！传奇时刻' : locked
              ? (c.unlockRope !== undefined ? `🔒 跳绳达到${c.unlockRope}个解锁 · 当前${state.ropeMax||0}个 · 还差${c.unlockRope - (state.ropeMax||0)}个` :
                c.unlockReadCount !== undefined ? `🔒 完成${c.unlockReadCount}次阅读挑战解锁 · 当前${state.readCount||0}次 · 还差${c.unlockReadCount - (state.readCount||0)}次` :
                `🔒 需要累计 ${c.unlockAt} 分解锁 · 当前 ${score} 分 · 还差 ${c.unlockAt - score} 分`)
              : `✨ 已解锁！+${c.score}分等你来拿`}
          </div>
        </div>
        <div class="ach-show-pts" style="color:${done?'#06D6A0':locked?'#aaa':'#F9A825'}">
          ${done ? '✅' : '+' + c.score}
        </div>
      </div>`;
    }).join('');
  }

  // ── 跳绳里程碑 ──────────────────────────────────────────────
  const ropeList = document.getElementById('achRopeList');
  if (ropeList) {
    const ropeMax = state.ropeMax || 0;
    ropeList.innerHTML = ROPE_MILESTONES.map(m => {
      const done = (state.ropeMilestonesAchieved||[]).includes(m.target);
      const gap = m.target - ropeMax;
      return `<div class="ach-rope-item ${done?'done':''}">
        <div class="ach-rope-target">${m.target}<span style="font-size:12px">个</span></div>
        <div class="ach-rope-content">
          <div class="ach-rope-label">${m.label}</div>
          <div class="ach-rope-how">
            ${done
              ? `🏆 已达成！+${m.bonus}分`
              : ropeMax > 0
                ? `当前最高 ${ropeMax} 个 · 还差 ${Math.max(0,gap)} 个`
                : `努力跳绳，达到 ${m.target} 个！`}
          </div>
        </div>
        <div class="ach-rope-bonus ${done?'done':''}">${done?'✅':'+'+m.bonus}</div>
      </div>`;
    }).join('');
  }
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
'+t.id+'

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

  // 固定任务：完成后弹出自律自报弹窗
  const fixedTask = DAILY_FIXED.find(t => t.id === id);
  if (fixedTask) {
    // 先标记待审，再弹自报
    state.todayChecked[id] = 'pending';
    saveState();
    const allTasks = [...DAILY_FIXED, ...DAILY_OPTIONAL, ...DAILY_HOMEWORK];
    const task = allTasks.find(t => t.id === id);
    if (task && window._firebaseReady) {
      submitPending('daily', id, task.name, score);
    }
    renderAll();
    // 弹出自律自报弹窗（通用版）
    setTimeout(() => showSelfReportUnified(id, task ? task.name : id, score, '🦸', (isSelf) => {
      const msg = isSelf ? '自律英雄！💪 自己主动完成，太棒了！' : '诚实是最好的品质 👋 加油继续！';
      showCelebration(isSelf ? '💪' : '👋', isSelf ? '自律打卡！' : '诚实打卡！', msg);
      setTimeout(() => tryShowShopBoost(score, true), 1600);
    }), 400);
    return;
  }

  // 可选/作业任务：先提交，再弹自律弹窗
  state.todayChecked[id] = 'pending';
  saveState();
  const allTasks = [...DAILY_FIXED, ...DAILY_OPTIONAL, ...DAILY_HOMEWORK];
  const task = allTasks.find(t => t.id === id);
  if (task && window._firebaseReady) {
    submitPending('daily', id, task.name, score);
  }
  renderAll();
  setTimeout(() => showSelfReportUnified(id, task ? task.name : id, score, '🎮', (isSelf) => {
    showCelebration('⏳', '已提交！等待确认', `「${task ? task.name : id}」等爸爸妈妈审核后积分入账 💪`);
    setTimeout(() => tryShowShopBoost(score, true), 1600);
  }), 400);
}

// [showSelfReportModal/submitSelfReport 已合并入 showSelfReportUnified]

// ── 月度自律率计算 ─────────────────────────────────────────────
function calcMonthlyDisciplineRate(year, month) {
  if (!state.selfReport) return { rate: 0, selfDays: 0, totalDays: 0 };
  const prefix = `${year}-${String(month).padStart(2,'0')}`;
  let selfDays = 0, totalDays = 0;

  Object.entries(state.selfReport).forEach(([date, tasks]) => {
    if (!date.startsWith(prefix)) return;
    // 判断当天固定任务完成率是否达到80%
    const fixedIds = DAILY_FIXED.map(t => t.id);
    const totalFixed = fixedIds.length;
    // 当天有自报记录的固定任务数（说明完成了）
    const reportedFixed = fixedIds.filter(id => tasks[id]).length;
    if (totalFixed === 0 || reportedFixed / totalFixed < 0.8) return; // 固定任务不达标，不计入

    // 自律判断：当天所有自报的固定任务都是'self'
    const reportedEntries = Object.values(tasks).filter(v => v === 'self' || v === 'reminded');
    if (reportedEntries.length === 0) return;
    totalDays++;
    const allSelf = reportedEntries.every(v => v === 'self');
    if (allSelf) selfDays++;
  });

  const rate = totalDays > 0 ? Math.round(selfDays / totalDays * 100) : 0;
  return { rate, selfDays, totalDays };
}

// ── B类奖励解锁判断 ───────────────────────────────────────────
function isBRewardUnlocked() {
  const now = new Date();
  const { rate } = calcMonthlyDisciplineRate(now.getFullYear(), now.getMonth() + 1);
  return rate >= 85;
}

// ── 自律能量条渲染 ────────────────────────────────────────────
function renderDisciplineBar() {
  const el = document.getElementById('disciplineBar');
  if (!el) return;
  const now = new Date();
  const { rate, selfDays, totalDays } = calcMonthlyDisciplineRate(now.getFullYear(), now.getMonth() + 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainDays = daysInMonth - now.getDate();
  const unlocked = rate >= 85;
  const filled = Math.round(rate / 10);
  const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
  el.innerHTML = `
    <div class="discipline-bar-wrap" style="background:${unlocked?'#e8fff5':'#fff8e1'};border-radius:14px;padding:14px 16px;margin:10px 0;border:1.5px solid ${unlocked?'#06D6A0':'#FFD54F'};">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <span style="font-weight:700;font-size:0.95rem;color:#1a1a2e;">🏅 本月自律能量条</span>
        <span style="font-size:1rem;font-weight:700;color:${unlocked?'#06D6A0':'#F9A825'};">${rate}%</span>
      </div>
      <div style="font-family:monospace;font-size:1.1rem;color:${unlocked?'#00897B':'#F57F17'};letter-spacing:2px;">${bar}</div>
      <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:0.82rem;color:#888;">
        <span>自律天数：${selfDays}/${totalDays}天</span>
        <span>剩余：${remainDays}天</span>
      </div>
      ${unlocked
        ? '<div style="margin-top:8px;font-size:0.88rem;color:#06D6A0;font-weight:700;">✨ 本月自律达标！大奖已解锁！</div>'
        : rate > 0
          ? `<div style="margin-top:8px;font-size:0.85rem;color:#F9A825;">还差${85-rate}%解锁本月大奖，加油！💪</div>`
          : '<div style="margin-top:8px;font-size:0.85rem;color:#aaa;">开始打卡，积累自律能量！</div>'
      }
    </div>
  `;
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