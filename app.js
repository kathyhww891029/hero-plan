/* ══════════════════════════════════════════════════════════════
   英雄成长计划 · 主逻辑
══════════════════════════════════════════════════════════════ */

// ── 语音朗读引擎 ───────────────────────────────────────────────
let _currentUtterance = null;
let _speakingBtn = null;
let _zhCNVoice = null;      // 缓存选好的普通话声音（女声/默认）
let _zhCNMaleVoice = null;  // 缓存骑士男声

// 预选普通话声音（女声/默认 + 男声）
function pickZhCNVoice() {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return;
  // 女声（任务卡朗读等）
  _zhCNVoice =
    voices.find(v => v.lang === 'zh-CN' && (v.name.includes('Female') || v.name.includes('female') ||
      v.name.includes('Tingting') || v.name.includes('Meijia') || v.name.includes('女'))) ||
    voices.find(v => v.lang === 'zh-CN') ||
    voices.find(v => v.lang.startsWith('zh-CN')) ||
    voices.find(v => v.name.includes('Tingting') || v.name.includes('Meijia') || v.name.includes('普通话')) ||
    null;
  // 男声（骑士引导语音）：优先选 Male/male/Yunyang/男 关键字
  _zhCNMaleVoice =
    voices.find(v => v.lang === 'zh-CN' && (v.name.includes('Male') || v.name.includes('male') ||
      v.name.includes('Yunyang') || v.name.includes('男') || v.name.includes('Yunjian') ||
      v.name.includes('Kangkang') || v.name.includes('Daniel'))) ||
    voices.find(v => v.lang === 'zh-CN' && v !== _zhCNVoice) ||
    _zhCNVoice ||  // 兜底用普通话女声
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

// ── 骑士专用男声语音播报（不绑定按钮，直接播放） ──────────────
function speakKnightVoice(text) {
  if (!window.speechSynthesis) return;
  if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
  if (!_zhCNMaleVoice) pickZhCNVoice();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'zh-CN';
  utter.rate = 0.88;
  utter.pitch = 0.85;   // 偏低音调，更像男性声音
  utter.volume = 1.0;
  if (_zhCNMaleVoice) utter.voice = _zhCNMaleVoice;
  window.speechSynthesis.speak(utter);
}

// ── 骑士气泡说话：更新气泡内容 + 播报男声 ─────────────────────
function knightSpeak(msg) {
  const el = document.getElementById('mazeGuidance');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  el.classList.add('knight-speaking');
  setTimeout(() => el.classList.remove('knight-speaking'), 600);
  speakKnightVoice(msg);
  positionGuidanceBubble();
}

// ── 点击骑士：随机说一句鼓励话并播放男声 ─────────────────────
const KNIGHT_SPEECHES = [
  '勇敢的英雄，点击发光的宝箱开始挑战吧！',
  '每完成一个任务，你就变得更强大！',
  '英雄不是天生的，是每天练出来的！',
  '加油！你今天的努力，就是明天的超能力！',
  '嘿，勇士！今天完成挑战了吗？快去试试吧！',
  '宝箱里藏着积分，等你来解锁！',
  '继续前进，英雄的路就在你脚下！',
];
function showKnightHelp() {
  const idx = Math.floor(Math.random() * KNIGHT_SPEECHES.length);
  knightSpeak(KNIGHT_SPEECHES[idx]);
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
    const greeting = hour < 12 ? '早上好，小英雄子渊！🌅' : hour < 18 ? '下午好，小英雄子渊！☀️' : '晚上好，小英雄子渊！🌙';
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
    totalScore: 25,   // 子渊在正式上线前已积累 25 分（2026-04-06 起始分）
    mazeKnightNode: 'n_knight_spawn',  // 骑士当前位置节点（独立于迷宫节点）
    pendingAdditions: [],    // [{type, taskId, name, score, date, isSelf}] 待审加分，审核通过后才正式入账
    reviewedSelfLog: {},    // { "2026-04": { "2026-04-05": true, ... } } 记录每月自律（自主完成且审核通过）的日期
    todayChecked: {},         // { taskId: true }

    cardClaims: {},           // { cardId: count }
    shopHistory: [],          // [{ id, name, cost, date }]
    ropeRecords: [],          // [{ date, count }]
    ropeMax: 0,
    ropeMilestonesAchieved: [],
    weekStart: getWeekStart(),
    weeklyScore: 25,  // 本周起始分（含 2026-04-06 积累的 25 分）
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
    weeklyCardClaims: {},     // 本周每张卡领取次数 {cardId: count}
    weeklyAchievement: null,  // 本周成就等级
    // 当前培养阶段（爸妈设置）
    currentPhase: 1,
    phaseStartDate: null,
    // 阅读挑战联动
    readCount: 0,             // 累计完成阅读卡总次数（每领取一张+1）
    // 今日自选挑战卡
    selfPickCard: null,       // 今日选择的挑战卡 id（每天可换）
    selfPickClaimed: false,   // 今日自选卡是否已领分
    // 勋章系统
    medalClaims: {},          // { medalId: timestamp } 已获得的勋章
    categoryPoints: {         // 分类积分（用于解锁）
      focus: 0, habit: 0, plan: 0, challenge: 0,
      reflect: 0, creative: 0, read: 0, sport: 0
    },
    ropeStreak: { count: 0, lastDate: '' }, // 跳绳连续天数
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
function yesterdayStr() {
  // 获取昨天的日期字符串
  const d = new Date();
  d.setDate(d.getDate() - 1);
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

// ── 数据格式迁移（v66：weeklyCardClaims[id] 从数字改为日期数组）──
function migrateWeeklyCardClaims() {
  if (!state.weeklyCardClaims) return;
  let changed = false;
  for (const id in state.weeklyCardClaims) {
    const val = state.weeklyCardClaims[id];
    // 旧格式：数字（领取次数）→ 新格式：日期数组
    if (typeof val === 'number') {
      const today = todayStr();
      const weekStart = getWeekStart();
      // 如果是本周内，且领取次数>0，则假设领取在今天（粗略迁移）
      state.weeklyCardClaims[id] = val > 0 ? [today] : [];
      changed = true;
    } else if (!Array.isArray(val)) {
      // 未知格式 → 空数组
      state.weeklyCardClaims[id] = [];
      changed = true;
    }
  }
  if (changed) saveState();
}

// ── 初始化 ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  migrateWeeklyCardClaims(); // 先迁移旧数据格式
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
  renderDisciplineBar();
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
    
    // 只有过去的日期可以补卡（昨天及以前），可重复点击补多张卡
    var canBackfill = !isFuture && !isToday;
    if (canBackfill) className += ' can-backfill';
    
    html += `<div class="${className}" onclick="onCalendarDayClick('${dateStr}')">${d}</div>`;
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

// ── 日历补卡 ───────────────────────────────────────────────────

// 点击日历日期格子
function onCalendarDayClick(dateStr) {
  const today = todayStr();
  
  // 不能补今天的卡（今天在主页打卡）
  if (dateStr === today) return;
  // 不能补未来的卡
  if (dateStr > today) return;
  
  // 显示补卡弹窗（具体哪项由用户在弹窗中选择；同一日期可多次点击补多张卡）
  showHistoricalCheckinModal(dateStr);
}

// 历史补卡弹窗
function showHistoricalCheckinModal(dateStr) {
  // dateStr 格式：'2026-04-05'
  const date = new Date(dateStr);
  const monthDay = `${date.getMonth()+1}月${date.getDate()}日`;
  const weekDay = ['周日','周一','周二','周三','周四','周五','周六'][date.getDay()];
  
  // 判断是"昨天"还是更早
  const yesterday = yesterdayStr();
  const isYesterday = dateStr === yesterday;
  const dateLabel = isYesterday ? '昨晚' : monthDay;
  
  // 移除已有弹窗
  const existing = document.getElementById('historicalCheckinModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'historicalCheckinModal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;
    display:flex;align-items:center;justify-content:center;padding:20px;
  `;
  
  modal.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:28px 24px;max-width:340px;width:100%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.18);">
      <div style="font-size:1.8rem;margin-bottom:8px;">📅</div>
      <div style="font-size:1.1rem;font-weight:700;color:#1a1a2e;margin-bottom:4px;">${monthDay} ${weekDay}</div>
      <div style="font-size:0.9rem;color:#888;margin-bottom:20px;">选择完成的任务来补卡</div>
      
      <div style="text-align:left;">
        <div style="font-size:0.85rem;color:#888;margin-bottom:8px;">🌅 早晨英雄包</div>
        ${MORNING_PACK.map(item => {
          const taskId = `morning_${item.id}_${dateStr}`;
          const alreadySubmitted = (state.pendingAdditions||[]).some(p => p.taskId === taskId);
          const disabled = alreadySubmitted ? 'disabled style="opacity:0.45;cursor:not-allowed;"' : '';
          return `
          <button class="backfill-task-btn" data-type="morning" data-id="${item.id}" data-name="${item.name}" data-icon="${item.icon}" data-score="${item.score}" ${disabled}
            style="width:100%;padding:14px 16px;margin-bottom:8px;border-radius:12px;border:2px solid ${alreadySubmitted?'#ccc':'#E8F4FD'};background:${alreadySubmitted?'#f5f5f5':'#F0F8FF'};text-align:left;cursor:pointer;display:flex;align-items:center;gap:10px;">
            <span style="font-size:1.4rem;">${item.icon}</span>
            <span style="flex:1;">
              <span style="font-weight:600;color:${alreadySubmitted?'#aaa':'#1a1a2e'};">${item.name}</span>
              <span style="font-size:0.8rem;color:#888;margin-left:6px;">+${item.score}分${alreadySubmitted?' ✓':''}</span>
            </span>
          </button>`;
        }).join('')}
        
        <div style="font-size:0.85rem;color:#888;margin:16px 0 8px;">🌙 睡前英雄包</div>
        ${NIGHT_PACK.map(item => {
          const taskId = `night_${item.id}_${dateStr}`;
          const alreadySubmitted = (state.pendingAdditions||[]).some(p => p.taskId === taskId);
          const disabled = alreadySubmitted ? 'disabled style="opacity:0.45;cursor:not-allowed;"' : '';
          return `
          <button class="backfill-task-btn" data-type="night" data-id="${item.id}" data-name="${item.name}" data-icon="${item.icon}" data-score="${item.score}" ${disabled}
            style="width:100%;padding:14px 16px;margin-bottom:8px;border-radius:12px;border:2px solid ${alreadySubmitted?'#ccc':'#FFF3E0'};background:${alreadySubmitted?'#f5f5f5':'#FFF8F0'};text-align:left;cursor:pointer;display:flex;align-items:center;gap:10px;">
            <span style="font-size:1.4rem;">${item.icon}</span>
            <span style="flex:1;">
              <span style="font-weight:600;color:${alreadySubmitted?'#aaa':'#1a1a2e'};">${item.name}</span>
              <span style="font-size:0.8rem;color:#888;margin-left:6px;">+${item.score}分${alreadySubmitted?' ✓':''}</span>
            </span>
          </button>`;
        }).join('')}

        <div style="font-size:0.85rem;color:#888;margin:16px 0 8px;">📚 写作业</div>
        ${[1,2,3].map(n => {
          const taskId = `homework_block_${n}_${dateStr}`;
          const alreadySubmitted = (state.pendingAdditions||[]).some(p => p.taskId === taskId);
          const disabled = alreadySubmitted ? 'disabled style="opacity:0.45;cursor:not-allowed;"' : '';
          return `
          <button class="backfill-task-btn" data-pack="homework" data-hw-blocks="${n}" data-name="🍅专注块×${n}" data-icon="📚" data-score="${n}" ${disabled}
            style="width:100%;padding:14px 16px;margin-bottom:8px;border-radius:12px;border:2px solid ${alreadySubmitted?'#ccc':'#E8F8F0'};background:${alreadySubmitted?'#f5f5f5':'#F0FFFB'};text-align:left;cursor:pointer;display:flex;align-items:center;gap:10px;">
            <span style="font-size:1.4rem;">🍅</span>
            <span style="flex:1;">
              <span style="font-weight:600;color:${alreadySubmitted?'#aaa':'#1a1a2e'};">专注块×${n}（每块10分钟）</span>
              <span style="font-size:0.8rem;color:#888;margin-left:6px;">+${n}分${alreadySubmitted?' ✓':''}</span>
            </span>
          </button>`;
        }).join('')}
        ${(() => {
          const taskId = `homework_complete_${dateStr}`;
          const alreadySubmitted = (state.pendingAdditions||[]).some(p => p.taskId === taskId);
          const disabled = alreadySubmitted ? 'disabled style="opacity:0.45;cursor:not-allowed;"' : '';
          return `
          <button class="backfill-task-btn" data-pack="homework" data-hw-complete="1" data-name="📖写完作业" data-icon="📚" data-score="2" ${disabled}
            style="width:100%;padding:14px 16px;margin-bottom:8px;border-radius:12px;border:2px solid ${alreadySubmitted?'#ccc':'#FFF9C4'};background:${alreadySubmitted?'#f5f5f5':'#FFFFF0'};text-align:left;cursor:pointer;display:flex;align-items:center;gap:10px;">
            <span style="font-size:1.4rem;">📖</span>
            <span style="flex:1;">
              <span style="font-weight:600;color:${alreadySubmitted?'#aaa':'#1a1a2e'};">写完作业</span>
              <span style="font-size:0.8rem;color:#888;margin-left:6px;">+2分${alreadySubmitted?' ✓':''}</span>
            </span>
          </button>`;
        })()}
      </div>
      
      <button id="_hcCloseBtn" style="margin-top:16px;padding:12px 24px;border-radius:12px;border:none;background:#f0f0f0;color:#666;font-size:0.95rem;cursor:pointer;">关闭</button>
    </div>
  `;
  document.body.appendChild(modal);
  
  // 关闭按钮
  document.getElementById('_hcCloseBtn').onclick = () => modal.remove();
  // 点击背景关闭
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  
  // 任务按钮点击 → 弹出自律确认
  modal.querySelectorAll('.backfill-task-btn').forEach(btn => {
    btn.onclick = () => {
      // 区分早包/晚包 与 写作业
      const isHomework = btn.dataset.pack === 'homework';
      const packType = btn.dataset.type;  // 'morning' | 'night'
      const itemId = btn.dataset.id;
      const itemName = btn.dataset.name;
      const itemIcon = btn.dataset.icon;
      const itemScore = parseInt(btn.dataset.score);
      
      if (isHomework) {
        // ── 写作业补卡 ─────────────────────────────────
        const blocks = parseInt(btn.dataset.hwBlocks || '0');
        const isComplete = !!btn.dataset.hwComplete;
        const taskId = blocks > 0 ? `homework_block_${blocks}_${dateStr}` : `homework_complete_${dateStr}`;

        if ((state.pendingAdditions||[]).some(p => p.taskId === taskId)) return;

        if (blocks > 0) {
          // 专注块直接提交
          submitHomeworkBackfill(blocks, false, dateStr, true);
          modal.remove();
          showHistoricalCheckinModal(dateStr);
        } else if (isComplete) {
          // 写完作业需要自律确认
          showSelfReportUnified(
            `backfill_${taskId}`,
            '📚 📖写完作业',
            2,
            '📚',
            (isSelf) => {
              submitHomeworkBackfill(0, true, dateStr, isSelf);
              modal.remove();
              showHistoricalCheckinModal(dateStr);
            }
          );
        }
                  return;
        }

      // ── 早包/晚包补卡 ────────────────────────────────
      // 防止重复提交（disabled 的按钮理论上不会触发，但多加一层保险）
      const taskId = `${packType}_${itemId}_${dateStr}`;
      if ((state.pendingAdditions||[]).some(p => p.taskId === taskId)) return;
      
      // 弹出自律确认
      showSelfReportUnified(
        `backfill_${packType}_${itemId}_${dateStr}`,
        `${itemIcon} ${itemName}`,
        itemScore,
        packType === 'morning' ? '🌅' : '🌙',
        (isSelf) => {
          // 补卡提交
          submitBackfillTask(packType, itemId, itemName, itemIcon, itemScore, dateStr, isSelf);
          // 不关闭弹窗，重新渲染（刚提交项变灰），用户可继续补其他项
          modal.remove();
          showHistoricalCheckinModal(dateStr);
        }
      );
    };
  });
}

// 提交补卡任务
function submitBackfillTask(packType, itemId, itemName, itemIcon, score, dateStr, isSelf) {
  const today = todayStr();
  const packKey = packType === 'morning' ? 'morningPack' : 'nightPack';
  const pack = packType === 'morning' ? MORNING_PACK : NIGHT_PACK;
  const fullScore = packType === 'morning' ? MORNING_PACK_FULL : NIGHT_PACK_FULL;
  const label = (packType === 'morning' ? '早晨' : '睡前') + '英雄包·' + itemName;
  const fullTaskId = `${packType}_${itemId}_${dateStr}`;
  
  // 加入待审加分池（区分补卡标记）
  // taskId 包含实际日期，保证唯一性
  state.pendingAdditions.push({
    type: 'pack',
    taskId: fullTaskId,
    name: label,
    icon: itemIcon,
    score: score,
    date: today,           // 提交日期（审核用）
    actualDate: dateStr,   // 实际完成日期（补卡日期）
    isSelf: isSelf,
    isBackfill: true      // 标记为补卡
  });
  
  // 添加到 todayChecked，让 calcTodayScore 能统计
  state.todayChecked[fullTaskId] = 'pending';
  
  // 先加积分（审核驳回时再扣）
  state.totalScore += score;

  // ── 全套奖励差额计算 ─────────────────────────────────
  // 统计该日期该包已补卡件数（不含今日正常打卡，因为那是不同日期）
  const doneForDate = state.pendingAdditions.filter(p =>
    p.type === 'pack' && p.actualDate === dateStr && p.taskId.startsWith(packType + '_')
  ).length;
  const totalDone = doneForDate; // 当前已含刚 push 的一条
  const isFull = totalDone >= pack.length;
  const isFirstFull = isFull && totalDone === pack.length; // 刚达成的全套

  let bonusGain = 0;
  if (isFirstFull) {
    // 全套首次达成：补发全套与已发单件之和的差额
    const prevPts = Math.max(0, totalDone - 1);
    bonusGain = fullScore - prevPts;
    state.totalScore += bonusGain;
    // 更新连续天数（基于实际完成日期）
    updateStreakWithDate(packType === 'morning' ? 'morning' : 'night', dateStr);
  }

  saveState();
  
  // 同步到 Firebase（taskId 带日期后缀，让爸妈能看到是补卡）
  const totalGain = score + bonusGain;
  if (window._firebaseReady) {
    submitPending('pack', fullTaskId, label, score, dateStr, isSelf);
    if (bonusGain > 0) {
      const fullBonusTaskId = `${packType}_full_${dateStr}`;
      submitPending('pack', fullBonusTaskId, (packType === 'morning' ? '早晨' : '睡前') + '英雄包全套奖励', bonusGain, dateStr, isSelf);
      state.todayChecked[fullBonusTaskId] = 'pending';
    }
    window._firebaseGet(window._firebaseRef(window._firebaseDB, 'syncScore')).then(snap => {
      window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore'), (snap.val() || 0) + totalGain);
    });
  }
  
  renderAll();
  const bonusHint = bonusGain > 0 ? `（全套奖励+${bonusGain}分）` : '';
  showCelebration('📅', `📅补卡成功！${itemIcon}${itemName}`, `+${totalGain}分${bonusHint}，等爸妈审核！`);
}

// 提交写作业补卡
// blocks: 0-3（专注块数），isComplete: 是否写完作业，dateStr: 实际日期，isSelf: 是否自主完成
function submitHomeworkBackfill(blocks, isComplete, dateStr, isSelf) {
  const today = todayStr();
  const entries = [];   // 本次要加入 pendingAdditions 的条目

  if (blocks > 0) {
    entries.push({
      type: 'homework',
      taskId: `homework_block_${blocks}_${dateStr}`,
      name: `📚写作业·🍅专注块×${blocks}`,
      icon: '📚',
      score: blocks,   // 每块1分
      date: today,
      actualDate: dateStr,
      isSelf: isSelf,
      isBackfill: true
    });
  }

  if (isComplete) {
    entries.push({
      type: 'homework',
      taskId: `homework_complete_${dateStr}`,
      name: '📚写作业·写完作业',
      icon: '📚',
      score: 2,         // 写完+2分
      date: today,
      actualDate: dateStr,
      isSelf: isSelf,
      isBackfill: true
    });
  }

  if (entries.length === 0) return;

  // 一次性加入待审池
  entries.forEach(e => {
    state.pendingAdditions.push(e);
    // 添加到 todayChecked，让 calcTodayScore 能统计
    state.todayChecked[e.taskId] = 'pending';
  });

  // 计算本次总积分
  const totalGain = entries.reduce((sum, e) => sum + e.score, 0);
  state.totalScore += totalGain;

  // 更新连续天数（只要提交了作业任何一项就更新 streak）
  updateStreakWithDate('homework', dateStr);

  saveState();

  // Firebase 同步
  if (window._firebaseReady) {
    entries.forEach(e => {
      submitPending('homework', e.taskId, e.name, e.score, dateStr, isSelf);
    });
    window._firebaseGet(window._firebaseRef(window._firebaseDB, 'syncScore')).then(snap => {
      window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore'), (snap.val() || 0) + totalGain);
    });
  }

  renderAll();
  showCelebration('📚', `📅补卡成功！写作业`, `+${totalGain}分，等爸妈审核！`);
}

// ── 渲染每日任务 ───────────────────────────────────────────────

// 连续天数更新：key = 'morning' | 'night' | 'homework' | 'focus'
function updateStreak(key) {
  updateStreakWithDate(key, todayStr());
}

// 基于实际完成日期的 streak 更新（支持补卡）
function updateStreakWithDate(key, actualDate) {
  if (!state.streaks) {
    state.streaks = { morning:{count:0,lastDate:''}, night:{count:0,lastDate:''}, homework:{count:0,lastDate:''}, focus:{count:0,lastDate:''} };
  }
  const s = state.streaks[key] || { count: 0, lastDate: '' };
  if (s.lastDate === actualDate) return; // 这个日期已经算过，不重复

  // 计算 actualDate 的前一天
  const d = new Date(actualDate);
  d.setDate(d.getDate() - 1);
  const dayBefore = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  if (s.lastDate === dayBefore) {
    s.count += 1; // 前一天完成了，连续 +1
  } else {
    s.count = 1;  // 断开了，从1重新开始
  }
  s.lastDate = actualDate;
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
  renderTempTasks();
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
        <div class="blocks-label">🍅 专注块（每10分钟不分心 = +1分，点击可撤销）</div>
        <div class="blocks-row">
          ${[1,2,3].map(i => `
            <div class="block-btn ${blocks>=i?'done':''}" onclick="toggleFocusBlock(${i})">
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
// 渲染临时任务
function renderTempTasks() {
  const el = document.getElementById('dailyTempTasks');
  if (!el) return;
  el.innerHTML = DAILY_TEMP_TASKS.map(t => {
    const status = state.todayChecked[t.id];
    const isPending = status === 'pending';
    const isApproved = status === 'approved';
    const pendingHtml = isPending ? '<div class="task-pending-label">⏳ 等待爸妈审核</div>' : '';
    const itemClass = 'daily-item' + (isPending ? ' pending' : '') + (isApproved ? ' done' : '');
    const onclickAttr = "toggleDaily('" + t.id + "'," + t.score + ")";
    return '<div class="' + itemClass + '" onclick="' + onclickAttr + '">' +
      '<div class="task-icon">' + t.icon + '</div>' +
      '<div class="task-info">' +
        '<div class="task-name">' + t.name + speakBtn(t.speech) + '</div>' +
        '<div class="task-sub">' + t.sub + '</div>' +
        pendingHtml +
      '</div>' +
      '<div class="task-score">+' + t.score + '</div>' +
      '<div class="task-check">' + (isApproved ? '✓' : isPending ? '⏳' : '') + '</div>' +
    '</div>';
  }).join('');
}


// ── 推荐引擎：系统按权重自动选「今日英雄使命」──────────────────
function getTodayRecommendCard() {
  const today = todayStr();
  const historyKey = 'heroPlan_recentRecommendHistory';
  const history = JSON.parse(localStorage.getItem(historyKey) || '{}');

  // 清理7天前的历史
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const recentIds = Object.entries(history)
    .filter(([date]) => new Date(date) >= cutoff)
    .flatMap(([, ids]) => ids);

  // ── 按当前阶段动态筛选推荐池 ──────────────────────────────
  // Phase1：只推 phase=1 的主线卡 + 兴趣扩展卡（无phase字段）
  // Phase2：phase<=2 的主线卡 + 兴趣扩展卡
  // Phase3：所有主线卡 + 兴趣扩展卡
  const currentPhase = state.currentPhase || 1;
  const pool = TASK_CARDS.filter(c => {
    if (!isCardUnlocked(c)) return false;
    if (c.phase) {
      // 主线卡：只推当前阶段及以下
      return c.phase <= currentPhase;
    }
    // 兴趣扩展卡（无phase字段）：全阶段可见
    return true;
  });

  if (pool.length === 0) return null;

  // 计算加权分数：基础权重 - 最近推荐折扣（同id已推过则降权）
  const scored = pool.map(c => {
    let weight = c.recommendWeight || 10;
    const recencyCount = recentIds.filter(id => id === c.id).length;
    weight -= recencyCount * 15; // 同一张卡每出现一次，权重-15
    // 专注/成就类有70%比例加成（数值越高越容易被选中）
    if (c.recommendType === 'focus') weight = Math.round(weight * 1.4);
    return { card: c, weight: Math.max(weight, 1) };
  });

  // 权重随机抽签
  const totalWeight = scored.reduce((s, item) => s + item.weight, 0);
  let random = Math.random() * totalWeight;
  let selected = scored[0].card;
  for (const item of scored) {
    random -= item.weight;
    if (random <= 0) { selected = item.card; break; }
  }

  // 记录今日推荐历史
  history[today] = [...(history[today] || []), selected.id];
  localStorage.setItem(historyKey, JSON.stringify(history));

  return selected;
}

// ── 今日自选挑战卡（Phase1：单卡推荐模式）───────────────────────
function renderSelfPick() {
  const el = document.getElementById('dailySelfPick');
  if (!el) return;

  const today = todayStr();
  const claimed = !!state.selfPickClaimed;
  const card   = state.selfPickCard ? TASK_CARDS.find(c => c.id === state.selfPickCard) : null;

  // ── 已完成态 ───────────────────────────────────────────────
  if (claimed && card) {
    el.innerHTML = `
      <div class="focus-time-card ft-complete">
        <div class="ft-header">
          <span class="ft-icon">${card.icon || card.stars}</span>
          <div class="ft-title-area">
            <div class="ft-title">🎯 今日英雄使命 ${speakBtn(card.speech||'')}</div>
            <div class="ft-sub">✅ 「${card.name}」已完成！</div>
          </div>
          <div class="ft-score">+${card.score}分</div>
        </div>
        <div class="ft-done-summary">
          <div class="ft-done-activity">${card.series} · ${card.name} 挑战完成 🎉</div>
        </div>
      </div>`;
    return;
  }

  // ── 已选待完成态（展示单卡） ─────────────────────────────────
  if (card) {
    const tipHtml = card.tip
      ? `<div style="margin:10px 0 6px;background:#fffbe6;border-radius:8px;padding:8px 12px;font-size:0.83rem;color:#7a5c00;white-space:pre-line">${card.tip}</div>`
      : '';
    el.innerHTML = `
      <div class="focus-time-card ft-active">
        <div class="ft-header">
          <span class="ft-icon">${card.stars}</span>
          <div class="ft-title-area">
            <div class="ft-title">🎯 今日英雄使命 ${speakBtn(card.speech||'')}</div>
            <div class="ft-sub">⭐ 系统推荐任务</div>
          </div>
          <div class="ft-score">+${card.score}分</div>
        </div>
        <div style="padding:0 4px">
          <div style="font-size:0.95rem;color:#333;margin-bottom:4px;font-weight:500">🎯 ${card.name}</div>
          <div style="font-size:0.88rem;color:#555;margin-bottom:4px">${card.sub}</div>
          <div style="font-size:0.88rem;color:#666;margin-bottom:4px">${card.desc}</div>
          ${tipHtml}
        </div>
        <div class="ft-actions">
          <button class="btn-ft-done" onclick="claimSelfPick()">
            ✅ 我完成了！领取 +${card.score}分
          </button>
          <button onclick="showCardPicker()" style="margin-top:6px;background:none;border:none;color:#aaa;font-size:0.82rem;cursor:pointer">
            ↩ 换一张任务
          </button>
        </div>
      </div>`;
    return;
  }

  // ── 未选态：系统自动推荐一张 ─────────────────────────────────
  const recommended = getTodayRecommendCard();
  if (!recommended) {
    el.innerHTML = `
      <div class="focus-time-card">
        <div style="text-align:center;color:#aaa;padding:20px">🎉 所有挑战卡都完成啦！太厉害了！</div>
      </div>`;
    return;
  }

  // 自动写入 state（不触发 saveState 持久化，次日会重新推荐）
  state.selfPickCard    = recommended.id;
  state.selfPickClaimed = false;

  const tipHtml = recommended.tip
    ? `<div style="margin:10px 0 6px;background:#fffbe6;border-radius:8px;padding:8px 12px;font-size:0.83rem;color:#7a5c00;white-space:pre-line">${recommended.tip}</div>`
    : '';
  el.innerHTML = `
    <div class="focus-time-card ft-active">
      <div class="ft-header">
        <span class="ft-icon">${recommended.stars}</span>
        <div class="ft-title-area">
          <div class="ft-title">🎯 今日英雄使命 ${speakBtn(recommended.speech||'')}</div>
          <div class="ft-sub">⭐ 系统推荐任务</div>
        </div>
        <div class="ft-score">+${recommended.score}分</div>
      </div>
      <div style="padding:0 4px">
        <div style="font-size:0.95rem;color:#333;margin-bottom:4px;font-weight:500">🎯 ${recommended.name}</div>
        <div style="font-size:0.88rem;color:#555;margin-bottom:4px">${recommended.sub}</div>
        <div style="font-size:0.88rem;color:#666;margin-bottom:4px">${recommended.desc}</div>
        ${tipHtml}
      </div>
      <div class="ft-actions">
        <button class="btn-ft-done" onclick="claimSelfPick()">
          ✅ 我完成了！领取 +${recommended.score}分
        </button>
        <button onclick="showCardPicker()" style="margin-top:6px;background:none;border:none;color:#aaa;font-size:0.82rem;cursor:pointer">
          ↩ 换一张任务
        </button>
      </div>
    </div>`;
}

// ── 换卡选择器（展示当前阶段已解锁卡）────────────────────────
function showCardPicker() {
  const currentPhase = state.currentPhase || 1;
  const pool = TASK_CARDS.filter(c => {
    if (!isCardUnlocked(c)) return false;
    if (c.phase) return c.phase <= currentPhase;
    return true; // 兴趣扩展卡全阶段可见
  });
  if (pool.length === 0) return;

  const groups = {};
  pool.forEach(c => {
    const s = c.series || '其他';
    if (!groups[s]) groups[s] = [];
    groups[s].push(c);
  });

  const modal = document.createElement('div');
  modal.id = 'cardPickerModal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;
    display:flex;align-items:center;justify-content:center;padding:20px;
  `;
  modal.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:24px 20px;max-width:340px;width:100%;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,0.18);">
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-size:1.1rem;font-weight:700;color:#1a1a2e">📋 今日英雄使命</div>
        <div style="font-size:0.82rem;color:#888;margin-top:4px">选择今天想挑战的任务</div>
      </div>
      <div style="flex:1;overflow-y:auto;">
        ${Object.entries(groups).map(([series, cards]) => `
          <div style="margin-bottom:12px">
            <div style="font-size:0.75rem;color:#aaa;font-weight:600;margin-bottom:6px;padding-left:2px">${series}</div>
            ${cards.map(c => `
              <div class="ft-menu-item" style="justify-content:space-between;padding:8px 10px;margin-bottom:4px;cursor:pointer;border-radius:10px"
                   onclick="selectSelfPick('${c.id}');document.getElementById('cardPickerModal').remove()">
                <span style="font-size:0.88rem;color:#333">${c.stars} ${c.name}</span>
                <span style="color:#F9A825;font-weight:700;font-size:0.88rem">+${c.score}分</span>
              </div>`).join('')}
          </div>`).join('')}
      </div>
      <button onclick="document.getElementById('cardPickerModal').remove()"
        style="margin-top:12px;width:100%;padding:10px;border-radius:10px;border:none;background:#f0f0f0;color:#888;font-size:0.9rem;cursor:pointer">
        取消
      </button>
    </div>`;
  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

// ── 选卡（选自换卡选择器） ─────────────────────────────────────
function selectSelfPick(id) {
  state.selfPickCard    = id;
  state.selfPickClaimed = false;
  saveState();
  renderSelfPick();
}

// ── 取消选卡（已提交后不可撤销；提交前退回推荐态）──────────────
function cancelSelfPick() {
  state.selfPickCard    = null;
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
// ── 打卡日期选择弹窗（支持补昨天）────────────────────────────
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
    renderDisciplineBar();
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

  // ── 取消打卡逻辑（不变）──────────────────────────────
  if (state[packKey][id]) {
    // 取消：从待审加分池移除，同时扣减已加的积分
    const label = (packType==='morning'?'早晨':'睡前')+'英雄包·'+id;
    const fullTaskId = `${packType}_${id}`;
    const idx = state.pendingAdditions.findIndex(p => p.type === 'pack' && p.taskId === fullTaskId && p.actualDate === undefined);
    let deductGain = 0;
    if (idx !== -1) {
      deductGain = state.pendingAdditions[idx].score || 0;
      state.pendingAdditions.splice(idx, 1);
    }
    // 从 todayChecked 中移除
    delete state.todayChecked[fullTaskId];
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
    // 扣减积分（因为在完成时已加）
    state.totalScore = Math.max(0, state.totalScore - deductGain);
    saveState();
    // 同步到 Firebase
    if (window._firebaseReady && deductGain > 0) {
      window._firebaseGet(window._firebaseRef(window._firebaseDB, 'syncScore')).then(snap => {
        window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore'), Math.max(0, (snap.val() || 0) - deductGain));
      });
    }
    renderAll();
    return;
  }

  // ── 新打卡逻辑 ─────────────────────────────────────
  // 睡前包和早晨包都直接用今天日期（补卡从日历入口做）
  doCheckIn(packType, id, score);
}

// 执行打卡
function doCheckIn(packType, id, score) {
  const packKey = packType === 'morning' ? 'morningPack' : 'nightPack';
  const pack = packType === 'morning' ? MORNING_PACK : NIGHT_PACK;
  const fullScore = packType === 'morning' ? MORNING_PACK_FULL : NIGHT_PACK_FULL;
  const today = todayStr();

  // 存入今日打卡
  state[packKey][id] = true;

  // 计算已完成的件数
  const todayDone = Object.keys(state[packKey]).length;
  const isFull = todayDone >= pack.length;
  const isJustFull = todayDone === pack.length; // 刚好达成全套（这一件是最后一件）

  // 计算本次新增分
  // 全套达成时：补发全套奖励与已发单件积分之差；否则本件+1分
  let gain = 1;
  if (isJustFull) {
    // 已发过 (pack.length - 1) 件，每件+1分；全套奖励 fullScore；差额 = fullScore - (pack.length - 1)
    const prevPts = pack.length - 1;
    gain = fullScore - prevPts;
    updateStreakWithDate(packType === 'morning' ? 'morning' : 'night', today);
    // 全套完成计入 habit 分类积分（英雄包是习惯养成）
    if (!state.categoryPoints) state.categoryPoints = {};
    state.categoryPoints.habit = (state.categoryPoints.habit || 0) + fullScore;
  }

  // 加入待审加分池
  const task = pack.find(t => t.id === id);
  const taskName = task ? task.name : id;
  const label = (packType === 'morning' ? '早晨' : '睡前') + '英雄包·' + taskName;
  const fullTaskId = `${packType}_${id}`;
  state.pendingAdditions.push({
    type: 'pack',
    taskId: fullTaskId,
    name: label,
    score: gain,
    date: today,
    actualDate: today,
    isSelf: null
  });
  // 添加到 todayChecked，让 calcTodayScore 能统计
  state.todayChecked[fullTaskId] = 'pending';

  // 立即加积分
  state.totalScore += gain;
  saveState();

  // 立即同步到 Firebase
  if (window._firebaseReady) {
    window._firebaseGet(window._firebaseRef(window._firebaseDB, 'syncScore')).then(snap => {
      window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore'), (snap.val() || 0) + gain);
    });
  }

  renderAll();

  const packIcon = packType === 'morning' ? '🌅' : '🌙';
  const packItemName = pack.find(t => t.id === id)?.name || id;

  // 弹自律确认
  showSelfReportUnified(`${packType}_${id}_${today}`, packItemName, gain, packIcon, (isSelf) => {
    if (window._firebaseReady) submitPending('pack', fullTaskId, label, gain, '', isSelf);
    const entry = state.pendingAdditions.find(p => p.type === 'pack' && p.taskId === fullTaskId && p.date === today && p.actualDate === today);
    if (entry) { entry.isSelf = isSelf; saveState(); }
    const toastMsg = `已完成${todayDone}/${pack.length}件，${isFull ? '全套达成！🎉' : '再完成' + (pack.length - todayDone) + '件有惊喜！'}`;
    showCelebration(isFull ? '🎉' : '✅', isFull ? '全套完成！' : '完成一件！', toastMsg);
  });
}

// ── 写作业（简化版）──────────────────────────────────────────
function undoHomework() {
  if (!state.hwCompleted) return;
  state.hwCompleted = false;
  // 从待审加分池移除，同时扣减已加的积分
  const idx = state.pendingAdditions.findIndex(p => p.type === 'homework' && p.taskId === 'hw_complete');
  if (idx !== -1) state.pendingAdditions.splice(idx, 1);
  // 从 todayChecked 中移除
  delete state.todayChecked['hw_complete'];
  // 扣减积分（因为在完成时已加）
  state.totalScore = Math.max(0, state.totalScore - HOMEWORK_TASK.scoreComplete);
  // 撤销streak：清空今天的记录
  if (state.streaks && state.streaks.homework && state.streaks.homework.lastDate === todayStr()) {
    state.streaks.homework.count = 0;
    state.streaks.homework.lastDate = '';
  }
  saveState();
  // 同步到 Firebase
  if (window._firebaseReady) {
    window._firebaseGet(window._firebaseRef(window._firebaseDB, 'syncScore')).then(snap => {
      window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore'), Math.max(0, (snap.val() || 0) - HOMEWORK_TASK.scoreComplete));
    });
    // 删除pending记录
    submitPending('homework', 'hw_complete', null, null);
  }
  renderAll();
  showCelebration('↩️', '已撤销', '作业打卡已撤销');
}

function completeHomework() {
  if (state.hwCompleted) {
    // 已完成，切换为撤销模式
    undoHomework();
    return;
  }
  state.hwCompleted = true;
  const today = todayStr();
  // 加入待审加分池，同时立即加积分（等父母审核后确认，驳回则扣回）
  state.pendingAdditions.push({
    type: 'homework',
    taskId: 'hw_complete',
    name: '作业完成',
    score: HOMEWORK_TASK.scoreComplete,
    date: today,
    isSelf: null  // 等自律弹窗确定
  });
  // 添加到 todayChecked，让 calcTodayScore 能统计
  state.todayChecked['hw_complete'] = 'pending';
  // 立即加积分
  state.totalScore += HOMEWORK_TASK.scoreComplete;
  // 作业完成计入 habit 分类积分（作业是习惯养成的核心）
  if (!state.categoryPoints) state.categoryPoints = {};
  state.categoryPoints.habit = (state.categoryPoints.habit || 0) + HOMEWORK_TASK.scoreComplete;
  updateStreak('homework');
  saveState();
  // 立即同步到 Firebase
  if (window._firebaseReady) {
    window._firebaseGet(window._firebaseRef(window._firebaseDB, 'syncScore')).then(snap => {
      window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore'), (snap.val() || 0) + HOMEWORK_TASK.scoreComplete);
    });
  }
  renderAll();
  // 先弹自律自报弹窗，等用户选择后再提交审核
  showSelfReportUnified('hw_complete', '今日作业完成', HOMEWORK_TASK.scoreComplete, '📚', (isSelf) => {
    // 提交到待审（带 isSelf）
    if (window._firebaseReady) {
      submitPending('homework', 'hw_complete', '作业完成', HOMEWORK_TASK.scoreComplete, '', isSelf);
    }
    // 更新 pendingAdditions 中的 isSelf
    const entry = state.pendingAdditions.find(p => p.type === 'homework' && p.taskId === 'hw_complete' && p.date === today);
    if (entry) entry.isSelf = isSelf;
    saveState();
    showCelebration('📚', '作业完成！', `写完作业了！+${HOMEWORK_TASK.scoreComplete}分！太棒了！`);
    setTimeout(() => tryShowShopBoost(HOMEWORK_TASK.scoreComplete, false), 1600);
  });
}

function toggleFocusBlock(idx) {
  const currentBlocks = state.hwBlocks || 0;
  const today = todayStr();
  
  if (currentBlocks >= idx) {
    // 撤销：从 idx 块开始全部撤销
    const blocksToRemove = currentBlocks - idx + 1;
    const deductPts = blocksToRemove * HOMEWORK_TASK.scorePerBlock;
    // 从 pendingAdditions 和 todayChecked 中移除要撤销的块
    for (let i = currentBlocks; i >= idx; i--) {
      const blockTaskId = 'hw_block_' + i;
      const addIdx = state.pendingAdditions.findIndex(p => p.type === 'homework' && p.taskId === blockTaskId);
      if (addIdx !== -1) state.pendingAdditions.splice(addIdx, 1);
      delete state.todayChecked[blockTaskId];
    }
    state.totalScore = Math.max(0, state.totalScore - deductPts);
    state.hwBlocks = idx - 1;
    saveState();
    if (window._firebaseReady) {
      window._firebaseGet(window._firebaseRef(window._firebaseDB, 'syncScore')).then(snap => {
        window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore'), Math.max(0, (snap.val() || 0) - deductPts));
      });
      submitPending('homework', 'hw_block_' + idx, null, null);
    }
    renderAll();
    showCelebration('↩️', '已撤销', `第${idx}块及之后的专注块已撤销`);
  } else {
    // 新增专注块
    if (currentBlocks >= HOMEWORK_TASK.maxBlocks) {
      showCelebration('🏆', '专注块已满！', `已完成${HOMEWORK_TASK.maxBlocks}个专注块，太棒了！`);
      return;
    }
    const newBlock = currentBlocks + 1;
    const blockTaskId = 'hw_block_' + newBlock;
    state.hwBlocks = newBlock;
    // 加入待审加分池和 todayChecked
    state.pendingAdditions.push({
      type: 'homework',
      taskId: blockTaskId,
      name: `专注块第${newBlock}块`,
      score: HOMEWORK_TASK.scorePerBlock,
      date: today,
      isSelf: null
    });
    state.todayChecked[blockTaskId] = 'pending';
    state.totalScore += HOMEWORK_TASK.scorePerBlock;
    saveState();
    if (window._firebaseReady) {
      window._firebaseGet(window._firebaseRef(window._firebaseDB, 'syncScore')).then(snap => {
        window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore'), (snap.val() || 0) + HOMEWORK_TASK.scorePerBlock);
      });
      submitPending('homework', blockTaskId, `专注块第${newBlock}块`, HOMEWORK_TASK.scorePerBlock);
    }
    renderAll();
    showCelebration('🍅', `专注块 ${newBlock}/${HOMEWORK_TASK.maxBlocks}！`, `专注${HOMEWORK_TASK.blockMinutes}分钟完成！+${HOMEWORK_TASK.scorePerBlock}分！`);
  }
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
          <button class="btn-ft-done ${_focusSeconds < ft.minutes * 60 ? 'disabled' : ''}" onclick="completeFocusTime(false)" ${_focusSeconds < ft.minutes * 60 ? 'disabled' : ''}>✅ 完成了！（${ft.minutes}分钟到了）</button>
          <button class="btn-ft-overtime ${_focusSeconds < ft.minutes * 60 ? 'disabled' : ''}" onclick="completeFocusTime(true)" ${_focusSeconds < ft.minutes * 60 ? 'disabled' : ''}>⚡ 停不下来！继续超时（+${ft.bonusScore}分）</button>
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
  // 计算要扣回的分数（和 completeFocusTime 中一致）
  const pts = FOCUS_TIME.score + (state.focusOvertime ? FOCUS_TIME.bonusScore : 0);
  state.focusCompleted = false;
  state.focusOvertime = false;
  state.focusSelected = null;
  state.focusStarted = null;
  _focusSeconds = 0;
  if (_focusTimer) { clearInterval(_focusTimer); _focusTimer = null; }
  _focusTimerRunning = false;
  // 从待审加分池移除，同时扣减已加的积分
  const idx = state.pendingAdditions.findIndex(p => p.type === 'focus' && p.taskId === 'focus_time');
  if (idx !== -1) state.pendingAdditions.splice(idx, 1);
  // 扣减积分
  state.totalScore = Math.max(0, state.totalScore - pts);
  // 撤销streak
  if (state.streaks && state.streaks.focus && state.streaks.focus.lastDate === todayStr()) {
    state.streaks.focus.count = 0;
    state.streaks.focus.lastDate = '';
  }
  saveState();
  if (window._firebaseReady) {
    window._firebaseGet(window._firebaseRef(window._firebaseDB, 'syncScore')).then(snap => {
      window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore'), Math.max(0, (snap.val() || 0) - pts));
    });
    submitPending('focus', 'focus_time', null, null);
  }
  renderAll();
  showCelebration('↩️', '已撤销', '专注力时光打卡已撤销');
}

function completeFocusTime(isOvertime) {
  // 时间未到时不允许提交，给出提示
  if (!state.focusCompleted && _focusSeconds < FOCUS_TIME.minutes * 60) {
    showCelebration('⏱️', '还没到时间哦', `再坚持一下，还差${FOCUS_TIME.minutes * 60 - _focusSeconds}秒！💪`);
    return;
  }
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
  // 加入待审加分池，同时立即加积分（等父母审核后确认，驳回则扣回）
  state.pendingAdditions.push({
    type: 'focus',
    taskId: 'focus_time',
    name: '专注力时光',
    score: pts,
    date: todayStr(),
    isSelf: null  // 等自律弹窗确定
  });
  // 立即加积分
  state.totalScore += pts;
  // 专注力时光计入 focus 分类积分（用于阶段勋章进度）
  if (!state.categoryPoints) state.categoryPoints = {};
  state.categoryPoints.focus = (state.categoryPoints.focus || 0) + pts;
  updateStreak('focus');
  saveState();
  // 立即同步到 Firebase
  if (window._firebaseReady) {
    window._firebaseGet(window._firebaseRef(window._firebaseDB, 'syncScore')).then(snap => {
      window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore'), (snap.val() || 0) + pts);
    });
  }
  renderAll();
  // 先弹自律自报弹窗，等用户选择后再提交审核
  showSelfReportUnified('focus_time', '专注力时光', pts, isOvertime ? '⚡' : '🧠', (isSelf) => {
    // 提交到待审（带 isSelf）
    if (window._firebaseReady) {
      submitPending('focus', 'focus_time', '专注力时光', pts, '', isSelf);
    }
    // 更新 pendingAdditions 中的 isSelf
    const today = todayStr();
    const entry = state.pendingAdditions.find(p => p.type === 'focus' && p.taskId === 'focus_time' && p.date === today);
    if (entry) entry.isSelf = isSelf;
    saveState();
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
    const allTasks = [...DAILY_FIXED, ...DAILY_OPTIONAL, ...DAILY_HOMEWORK, ...DAILY_TEMP_TASKS];
    const task = allTasks.find(t => t.id === id);
    // 先标记待审
    state.todayChecked[id] = 'pending';
    // 加入待审加分池（带 isSelf=null，等弹窗确定）
    state.pendingAdditions.push({
      type: 'daily',
      taskId: id,
      name: task ? task.name : id,
      score: score,
      date: todayStr(),
      isSelf: null
    });
    // 立即加积分
    state.totalScore += score;
    saveState();
    // 立即同步到 Firebase
    if (window._firebaseReady) {
      window._firebaseGet(window._firebaseRef(window._firebaseDB, 'syncScore')).then(snap => {
        window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore'), (snap.val() || 0) + score);
      });
    }
    renderAll();
    // 弹出自律自报弹窗，确定后再提交审核
    setTimeout(() => showSelfReportUnified(id, task ? task.name : id, score, '🦸', (isSelf) => {
      // 提交到待审（带 isSelf）
      if (task && window._firebaseReady) {
        submitPending('daily', id, task.name, score, '', isSelf);
      }
      // 更新 pendingAdditions 中的 isSelf
      const today = todayStr();
      const entry = state.pendingAdditions.find(p => p.type === 'daily' && p.taskId === id && p.date === today);
      if (entry) entry.isSelf = isSelf;
      saveState();
      const msg = isSelf ? '自律英雄！💪 自己主动完成，太棒了！' : '诚实是最好的品质 👋 加油继续！';
      showCelebration(isSelf ? '💪' : '👋', isSelf ? '自律打卡！' : '诚实打卡！', msg);
      setTimeout(() => tryShowShopBoost(score, true), 1600);
    }), 400);
    return;
  }

  // 可选/作业任务：先提交（isSelf=null），再弹自律弹窗，弹窗确定后更新 Firebase 中的 isSelf
  state.todayChecked[id] = 'pending';
const allTasks2 = [...DAILY_FIXED, ...DAILY_OPTIONAL, ...DAILY_HOMEWORK, ...DAILY_TEMP_TASKS];
  const task2 = allTasks2.find(t => t.id === id);
  // 加入待审加分池，同时立即加积分
  state.pendingAdditions.push({
    type: 'daily',
    taskId: id,
    name: task2 ? task2.name : id,
    score: score,
    date: todayStr(),
    isSelf: null
  });
  state.totalScore += score;
  saveState();
  // 立即同步到 Firebase
  if (window._firebaseReady) {
    window._firebaseGet(window._firebaseRef(window._firebaseDB, 'syncScore')).then(snap => {
      window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore'), (snap.val() || 0) + score);
    });
    submitPending('daily', id, task2 ? task2.name : id, score);
  }
  renderAll();
  setTimeout(() => showSelfReportUnified(id, task2 ? task2.name : id, score, '🎮', (isSelf) => {
    // 更新 pendingAdditions 中的 isSelf（本地）
    if (task2) {
      const today = todayStr();
      const entry = state.pendingAdditions.find(p => p.type === 'daily' && p.taskId === id && p.date === today);
      if (entry) {
        entry.isSelf = isSelf;
        saveState();
      }
      // 更新 Firebase pending 记录中的 isSelf
      if (window._firebaseReady) {
        updatePendingSelf('daily', id, todayStr(), isSelf);
      }
    }
    showCelebration('⏳', '已提交！等待确认', `「${task2 ? task2.name : id}」等爸爸妈妈审核后积分确认 💪`);
    setTimeout(() => tryShowShopBoost(score, true), 1600);
  }), 400);
}

// [showSelfReportModal/submitSelfReport 已合并入 showSelfReportUnified]

// ── 月度自律率计算 ─────────────────────────────────────────────
// 逻辑：一天中有任何待审或已审记录 → 计入 totalDays
//       自主完成（isSelf=true）且审核通过 → 计入 selfDays
//       父母提醒（isSelf=false）即使通过 → 不计入 selfDays

// ── B类奖励解锁判断 ───────────────────────────────────────────
function isBRewardUnlocked() {
  const now = new Date();
  const { rate } = calcMonthlyDisciplineRate(now.getFullYear(), now.getMonth() + 1);
  return rate >= 85;
}

// ── 自律能量条渲染 ────────────────────────────────────────────

function calcTodayScore() {
  const today = todayStr();
  const todayStart = new Date(today).setHours(0, 0, 0, 0);
  const todayEnd = new Date(today).setHours(23, 59, 59, 999);

  // 1. 固定任务 + 可选任务 + 作业（从 todayChecked）
  const taskScore = Object.keys(state.todayChecked).reduce((sum, id) => {
    const all = [...DAILY_FIXED, ...DAILY_OPTIONAL, ...DAILY_HOMEWORK, ...DAILY_TEMP_TASKS];
    const t = all.find(x => x.id === id);
    return sum + (t ? t.score : 0);
  }, 0);

  // 2. 待审加分池（挑战卡、早晨包、睡前包等）当天提交的
  const pendingScore = (state.pendingAdditions || [])
    .filter(p => p.date === today)
    .reduce((sum, p) => sum + (p.score || 0), 0);

  // 3. 勋章奖励（当天领取的）
  const medalScore = Object.entries(state.medalClaims || {})
    .filter(([id, ts]) => ts >= todayStart && ts <= todayEnd)
    .reduce((sum, [medalId, ts]) => {
      const medal = MEDALS.find(m => m.id === medalId);
      return sum + (medal ? medal.bonus : 0);
    }, 0);

  return taskScore + pendingScore + medalScore;
}

function updateTodayScore() {
  const today = calcTodayScore();
  document.getElementById('todayScore').textContent = today;
  // 同步顶部今日得分
  const el = document.getElementById('headerTodayScore');
  if (el) el.textContent = today > 0 ? `+${today}` : '+0';
}

// ── 父母审核回调：本地积分处理 ──────────────────────────────────
// 审核通过：积分在孩子完成时已入账，只需从 pendingAdditions 移除并更新自律统计
// isSelf: 是否自主完成（影响自律统计）
function onParentApprove(taskType, taskId, effectiveScore, isSelf) {
  const today = todayStr();
  // 找到对应的待审加分记录并移除（按 type + taskId 匹配，同一天通常只有一条）
  const idx = state.pendingAdditions.findIndex(p => p.type === taskType && p.taskId === taskId && p.date === today);
  if (idx !== -1) state.pendingAdditions.splice(idx, 1);
  // 将 pending 标记改为 approved（今日积分仍应计入该任务）
  if (taskId && state.todayChecked[taskId] === 'pending') {
    state.todayChecked[taskId] = 'approved';  // 而非 delete，保证今日积分仍含此分
  }
  // 自律统计：自主完成且审核通过，记录到月度自律日志
  if (isSelf === true) {
    const ym = today.slice(0, 7);  // e.g. "2026-04"
    if (!state.reviewedSelfLog[ym]) state.reviewedSelfLog[ym] = {};
    state.reviewedSelfLog[ym][today] = true;
  }
  saveState();
  renderAll();
}

// 审核驳回：从 pendingAdditions 移除，并扣减积分（孩子在完成时已得积分）
function onParentReject(taskType, taskId, isSelf, deductScore) {
  const today = todayStr();
  const idx = state.pendingAdditions.findIndex(p => p.type === taskType && p.taskId === taskId && p.date === today);
  if (idx !== -1) state.pendingAdditions.splice(idx, 1);
  // 清除 todayChecked 中的 pending 标记
  if (taskId && state.todayChecked[taskId] === 'pending') {
    delete state.todayChecked[taskId];
  }
  // 扣减积分（孩子在完成时已加）
  if (deductScore && deductScore > 0) {
    state.totalScore = Math.max(0, state.totalScore - deductScore);
    // 同步到 Firebase
    if (window._firebaseReady) {
      window._firebaseGet(window._firebaseRef(window._firebaseDB, 'syncScore')).then(snap => {
        window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore'), Math.max(0, (snap.val() || 0) - deductScore));
      });
    }
  }
  saveState();
  renderAll();
}

// ═══════════════════════════════════════════════════════════════
// 🗺️ 迷宫系统：子渊的奇幻城堡迷宫
// ═══════════════════════════════════════════════════════════════

// 迷宫地图数据结构
// phases: phaseId -> { name, unlockScore, bgColor, nodeColor, pathColor, fogColor, nodes[], paths[], fogPath }
// nodes: [{ id, x, y, cardId, label, isGate }]
// paths: [{ id, d, phase }]
// fogPath: SVG path data for fog area
const MAZE_MAP = {
  phases: {
    // ── Phase 1：英雄花园（绿色）────────────────────
    1: {
      name: '🌿 英雄花园',
      unlockScore: 0,         // 始终可见
      bgColor: '#E8F5E9',
      nodeColor: '#4CAF50',
      pathColor: '#A5D6A7',
      fogColor: 'rgba(200,230,201,0)',
      pathWidth: 14,
      nodes: [
        // 起点城堡大门
        { id: 'n_start', x: 400, y: 680, label: '城堡大门', isGate: true, connections: ['n_knight_spawn', 'n_center', 'n_p1_habit1', 'n_p1_focus1'] },
        // 骑士出生点（独立于大门）
        { id: 'n_knight_spawn', x: 400, y: 740, label: '', isSpawn: true, connections: ['n_start'] },
        // 左翼·习惯道
        { id: 'n_p1_habit1', x: 200, y: 590, cardId: 'p1_habit1',  label: '早晨英雄', connections: ['n_start', 'n_center', 'n_p1_habit2'] },
        { id: 'n_p1_habit2', x: 120, y: 490, cardId: 'p1_habit2',  label: '睡前小英雄', deadEnd: true, connections: ['n_p1_habit1'] },
        // 中央·创意道
        { id: 'n_center', x: 400, y: 540, label: '花园广场', connections: ['n_start', 'n_p1_habit1', 'n_p1_interest1', 'n_p1_interest3', 'n_p1_focus3'] },
        { id: 'n_p1_interest1', x: 300, y: 430, cardId: 'p1_interest1', label: '英雄图鉴', connections: ['n_center', 'n_p1_interest2'] },
        { id: 'n_p1_interest2', x: 180, y: 340, cardId: 'p1_interest2', label: '我的恐龙世界', deadEnd: true, connections: ['n_p1_interest1'] },
        { id: 'n_p1_interest3', x: 500, y: 430, cardId: 'p1_interest3', label: '音乐小侦探', connections: ['n_center', 'n_p1_habit3'] },
        // 右翼·专注道
        { id: 'n_p1_focus1', x: 600, y: 590, cardId: 'p1_focus1',  label: '专注小勇士', connections: ['n_start', 'n_p1_focus2'] },
        { id: 'n_p1_focus2', x: 700, y: 490, cardId: 'p1_focus2',  label: '专注升级版', deadEnd: true, connections: ['n_p1_focus1'] },
        { id: 'n_p1_habit3', x: 600, y: 340, cardId: 'p1_habit3',  label: '全天英雄包', connections: ['n_p1_interest3'] },
        // 终点·专注大师
        { id: 'n_p1_focus3', x: 400, y: 250, cardId: 'p1_focus3',  label: '专注大师', connections: ['n_center'] },
      ],
      // SVG路径定义（与节点id对应）
      paths: [
        { id: 'p1_1', d: 'M 400 680 L 400 590 L 200 590 L 200 540' },  // 入口→广场→左岔
        { id: 'p1_2', d: 'M 200 540 L 120 540 L 120 490' },             // →睡前小英雄(死路)
        { id: 'p1_3', d: 'M 400 590 L 600 590' },                        // 入口→右岔
        { id: 'p1_4', d: 'M 600 590 L 700 590 L 700 490' },             // →专注升级版(死路折返)
        { id: 'p1_5', d: 'M 400 540 L 400 480' },                        // 广场→中央干道
        { id: 'p1_6', d: 'M 400 480 L 300 480 L 300 430' },             // →英雄图鉴
        { id: 'p1_7', d: 'M 300 430 L 300 380 L 180 380 L 180 340' },  // →恐龙世界(死路)
        { id: 'p1_8', d: 'M 400 480 L 500 480 L 500 430' },             // →音乐小侦探
        { id: 'p1_9', d: 'M 500 430 L 600 430 L 600 340' },             // →全天英雄包
        { id: 'p1_10', d: 'M 400 430 L 400 250' },                       // 中央干道→专注大师
      ]
    },
    // ── Phase 2：神秘城堡（蓝色）────────────────────
    2: {
      name: '🏰 神秘城堡',
      unlockScore: 30,        // Phase1累计30分解锁
      bgColor: '#E3F2FD',
      nodeColor: '#1976D2',
      pathColor: '#90CAF9',
      fogColor: 'rgba(25,118,210,0.55)',
      pathWidth: 12,
      nodes: [
        // Phase1完成后进入的城堡大门
        { id: 'n_p2_gate', x: 400, y: 190, label: '城堡大门', isGate: true, connections: ['n_p2_junction'] },
        // 路径路点（不可点击，视觉小点）
        { id: 'n_p2_junction', x: 400, y: 140, isWaypoint: true, connections: ['n_p2_gate', 'n_p2_left_j', 'n_p2_right_j', 'n_p2_center'] },
        { id: 'n_p2_left_j', x: 200, y: 140, isWaypoint: true, connections: ['n_p2_junction', 'n_p2_creative1'] },
        { id: 'n_p2_right_j', x: 600, y: 140, isWaypoint: true, connections: ['n_p2_junction', 'n_p2_challenge1'] },
        // 左翼·创意道
        { id: 'n_p2_creative1', x: 200, y: 90, cardId: 'p2_creative1', label: '故事连环画', connections: ['n_p2_left_j', 'n_p2_creative2'] },
        { id: 'n_p2_creative2', x: 120, y: 30, cardId: 'p2_creative2', label: '我的发明', deadEnd: true, connections: ['n_p2_creative1'] },
        // 中央·计划道
        { id: 'n_p2_center', x: 400, y: 90, label: '城堡广场', connections: ['n_p2_junction', 'n_p2_plan1', 'n_p2_plan2', 'n_p2_top'] },
        { id: 'n_p2_plan1', x: 400, y: 10, cardId: 'p2_plan1',  label: '我来定时间', connections: ['n_p2_center'] },
        // 右翼·计划道
        { id: 'n_p2_plan2', x: 300, y: 30, cardId: 'p2_plan2',  label: '今日计划官', connections: ['n_p2_center'] },
        { id: 'n_p2_plan3', x: 200, y: 10, cardId: 'p2_plan3',  label: '一周计划师', deadEnd: true, connections: ['n_p2_center'] },
        // 右翼·挑战道
        { id: 'n_p2_challenge1', x: 600, y: 90, cardId: 'p2_challenge1', label: '专注12分钟', connections: ['n_p2_right_j', 'n_p2_challenge2', 'n_p2_challenge3'] },
        { id: 'n_p2_challenge2', x: 680, y: 30, cardId: 'p2_challenge2', label: '不被提醒的一天', connections: ['n_p2_challenge1'] },
        { id: 'n_p2_challenge3', x: 520, y: 50, cardId: 'p2_challenge3', label: '一周早晨英雄', deadEnd: true, connections: ['n_p2_challenge1'] },
        // 汇聚点
        { id: 'n_p2_top', x: 400, y: -50, label: '城堡塔楼', connections: ['n_p2_center', 'n_p3_gate'] },
      ],
      paths: [
        { id: 'p2_1', d: 'M 400 190 L 400 140' },                        // 入口→下层
        { id: 'p2_2', d: 'M 400 140 L 200 140 L 200 90' },              // →创意分叉
        { id: 'p2_3', d: 'M 200 90 L 200 50 L 120 50 L 120 30' },      // →我的发明(死路)
        { id: 'p2_4', d: 'M 400 140 L 400 90' },                        // →计划道
        { id: 'p2_5', d: 'M 400 90 L 400 10' },                         // →我来定时间
        { id: 'p2_6', d: 'M 400 90 L 300 90 L 300 30' },               // →今日计划官
        { id: 'p2_6b', d: 'M 400 90 L 200 90 L 200 10' },              // →一周计划师(死路)
        { id: 'p2_7', d: 'M 400 140 L 600 140 L 600 90' },             // →挑战分叉
        { id: 'p2_8', d: 'M 600 90 L 680 90 L 680 30' },               // →不被提醒
        { id: 'p2_8b', d: 'M 600 90 L 520 90 L 520 50' },             // →一周早晨英雄(死路)
        { id: 'p2_9', d: 'M 200 90 L 400 90 M 600 90 L 400 90' },     // 左右汇聚
        { id: 'p2_10', d: 'M 400 90 L 400 -10 L 400 -50' },            // →城堡塔楼
      ]
    },
    // ── Phase 3：宝藏殿堂（金色）────────────────────
    3: {
      name: '👑 宝藏殿堂',
      unlockScore: 90,        // Phase2累计90分解锁
      bgColor: '#FFF8E1',
      nodeColor: '#F57F17',
      pathColor: '#FFE082',
      fogColor: 'rgba(245,127,23,0.5)',
      pathWidth: 10,
      nodes: [
        // Phase2完成后进入的殿堂大门
        { id: 'n_p3_gate', x: 400, y: -150, label: '宝藏殿堂', isGate: true, connections: ['n_p3_center'] },
        // 左翼·复盘道
        { id: 'n_p3_reflect1', x: 200, y: -210, cardId: 'p3_reflect1', label: '今日最自豪', connections: ['n_p3_center', 'n_p3_reflect2', 'n_p3_milestone1'] },
        { id: 'n_p3_reflect2', x: 120, y: -270, cardId: 'p3_reflect2', label: '我想做得更好', deadEnd: true, connections: ['n_p3_reflect1'] },
        // 右翼·里程碑
        { id: 'n_p3_milestone1', x: 80, y: -150, cardId: 'p3_milestone1', label: '三个月英雄档案', connections: ['n_p3_reflect1'] },
        // 中央·自定义道
        { id: 'n_p3_center', x: 400, y: -210, label: '宝藏广场', connections: ['n_p3_gate', 'n_p3_reflect1', 'n_p3_reflect3', 'n_p3_custom1', 'n_p3_treasure'] },
        { id: 'n_p3_reflect3', x: 300, y: -300, cardId: 'p3_reflect3', label: '进步对比', connections: ['n_p3_center'] },
        // 右翼·挑战道
        { id: 'n_p3_custom1', x: 500, y: -270, cardId: 'p3_custom1', label: '我的本周挑战', connections: ['n_p3_center', 'n_p3_custom2'] },
        { id: 'n_p3_custom2', x: 600, y: -330, cardId: 'p3_custom2', label: '我设计任务卡', deadEnd: true, connections: ['n_p3_custom1'] },
        // 汇聚点·终极宝藏
        { id: 'n_p3_treasure', x: 400, y: -390, label: '终极宝藏', isTreasure: true, connections: ['n_p3_center'] },
      ],
      paths: [
        { id: 'p3_1', d: 'M 400 -150 L 400 -180' },                    // 入口→下层
        { id: 'p3_2', d: 'M 400 -180 L 200 -180 L 200 -210' },        // →复盘分叉
        { id: 'p3_3', d: 'M 200 -210 L 200 -250 L 120 -250 L 120 -270' }, // →我想做得更好(死路)
        { id: 'p3_3b', d: 'M 200 -210 L 80 -210 L 80 -150' },        // →三个月英雄档案(死路)
        { id: 'p3_4', d: 'M 400 -180 L 400 -210' },                   // →中央广场
        { id: 'p3_5', d: 'M 400 -210 L 300 -210 L 300 -300' },        // →进步对比
        { id: 'p3_6', d: 'M 400 -210 L 500 -210 L 500 -270' },        // →自定义分叉
        { id: 'p3_7', d: 'M 500 -270 L 600 -270 L 600 -330' },        // →我设计任务卡(死路)
        { id: 'p3_8', d: 'M 200 -210 L 400 -210 M 500 -210 L 400 -210' }, // 左右汇聚
        { id: 'p3_9', d: 'M 400 -210 L 400 -390' },                    // →终极宝藏
      ]
    }
  }
};

// ── 获取节点状态 ──────────────────────────────────────────────
function getMazeNodeState(node) {
  if (!node.cardId) return 'gateway';  // 普通路径节点（起点广场等）
  const card = TASK_CARDS.find(c => c.id === node.cardId);
  if (!card) return 'locked';
  const unlocked = isCardUnlocked(card);
  if (!unlocked) return 'locked';
  // 检查本周是否已完成
  const weekStart = getWeekStart();
  if (state.weekStart !== weekStart) return 'available';
  const claimed = state.weeklyCardClaims[node.cardId];
  const claimedArr = Array.isArray(claimed) ? claimed : (claimed > 0 ? ['legacy'] : []);
  // Phase1 英雄卡每天可领取：今天已领取才显示 done；其他卡本周领取过即 done
  if (card.phase === 1) {
    return claimedArr.includes(todayStr()) ? 'done' : 'available';
  }
  return claimedArr.length > 0 ? 'done' : 'available';
}

// ── 获取下一个关卡目标 ──────────────────────────────────────
function getNextGateInfo(score) {
  const gates = [
    { score: 30, label: '🏰 神秘城堡（还差', suffix: '分解锁）' },
    { score: 90, label: '👑 宝藏殿堂（还差', suffix: '分解锁）' },
    { score: Infinity, label: '👑 已达最高阶段！', suffix: '' },
  ];
  for (const g of gates) {
    if (score < g.score) return { target: g.score, label: g.label, suffix: g.suffix };
  }
  return gates[gates.length - 1];
}

// ── 更新钥匙徽章 ─────────────────────────────────────────────
function updateMazeKeyBadge() {
  const score = state.totalScore;
  const gate = getNextGateInfo(score);
  const el = document.getElementById('mazeKeyScore');
  if (el) el.textContent = score;
  const fill = document.getElementById('mazeKeyFill');
  if (fill) {
    if (gate.target === Infinity) {
      fill.style.width = '100%';
    } else {
      const pct = Math.min(100, (score / gate.target) * 100);
      fill.style.width = pct + '%';
    }
  }
  const nextGate = document.getElementById('mazeNextGate');
  if (nextGate && gate.target !== Infinity) {
    nextGate.textContent = gate.label + (gate.target - score) + gate.suffix;
  } else if (nextGate) {
    nextGate.textContent = gate.label;
  }
}

// ── 迷雾检测与散去 ──────────────────────────────────────────
function checkPhaseFogReveal() {
  Object.entries(MAZE_MAP.phases).forEach(([phaseId, phase]) => {
    const el = document.getElementById(`phaseFog${phaseId}`);
    if (!el) return;
    const revealed = state.totalScore >= phase.unlockScore;
    if (revealed) {
      el.classList.add('revealed');
    } else {
      el.classList.remove('revealed');
    }
  });
  // 检查是否需要弹出阶段升级提醒
  checkPhaseUpgrade();
}

// ── 阶段升级检测：积分达到阈值时弹窗提醒切换 currentPhase ──────
function checkPhaseUpgrade() {
  const score = state.totalScore;
  const cur = state.currentPhase || 1;

  // 确定目标阶段
  let targetPhase = cur;
  if (score >= 90 && cur < 3) targetPhase = 3;
  else if (score >= 30 && cur < 2) targetPhase = 2;

  if (targetPhase <= cur) return; // 无需升级

  // 防止重复弹（记录已提醒的阶段）
  const notifiedKey = `heroplan_phaseNotified_${targetPhase}`;
  if (localStorage.getItem(notifiedKey)) return;
  localStorage.setItem(notifiedKey, '1');

  // 阶段信息
  const phaseNames = { 2: '神秘城堡 🏰', 3: '宝藏殿堂 👑' };
  const phaseDescs = {
    2: '子渊已经积累了30分！可以开始Phase 2：孩子先选方向，从2~3张卡中选一张挑战！',
    3: '子渊已经积累了90分！可以开始Phase 3：孩子自设目标，爸爸妈妈审核！'
  };

  // 弹出提醒弹窗
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;
    display:flex;align-items:center;justify-content:center;padding:24px;
  `;
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:24px;padding:28px 24px;max-width:320px;width:100%;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,0.2);">
      <div style="font-size:2.2rem;margin-bottom:12px">🎉</div>
      <div style="font-size:1.2rem;font-weight:800;color:#7C3AED;margin-bottom:8px">阶段升级解锁！</div>
      <div style="font-size:1rem;font-weight:700;color:#1a1a2e;margin-bottom:12px">${phaseNames[targetPhase]}</div>
      <div style="font-size:0.88rem;color:#555;margin-bottom:20px;line-height:1.6">${phaseDescs[targetPhase]}</div>
      <div style="display:flex;gap:10px;justify-content:center;">
        <button onclick="this.closest('div[style*=fixed]').remove()" 
          style="flex:1;padding:10px;border-radius:12px;border:none;background:#f0f0f0;color:#888;font-size:0.9rem;cursor:pointer">
          稍后再说
        </button>
        <button onclick="upgradeToPhase(${targetPhase});this.closest('div[style*=fixed]').remove()"
          style="flex:1;padding:10px;border-radius:12px;border:none;background:linear-gradient(135deg,#7C3AED,#A855F7);color:#fff;font-size:0.9rem;font-weight:700;cursor:pointer">
          🚀 立即升级！
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
}

// ── 执行阶段升级 ─────────────────────────────────────────────
function upgradeToPhase(phase) {
  state.currentPhase = phase;
  saveState();
  renderAll();
  showCelebration('🚀', `已升级至 Phase ${phase}！`, '推荐任务已更新，继续冒险！');
}

// ── 迷宫语音引导气泡 ────────────────────────────────────────
let _lastGuidanceMsg = null;  // 防止重复播报相同内容
function updateMazeGuidance() {
  const el = document.getElementById('mazeGuidance');
  if (!el) return;
  const score = state.totalScore;
  // 统计 Phase1 中已解锁但未完成的任务卡数量
  const phase1Nodes = (MAZE_MAP.phases[1]?.nodes || []).filter(n => n.cardId);
  const availableCards = phase1Nodes.filter(n => {
    const card = TASK_CARDS.find(c => c.id === n.cardId);
    if (!card || !isCardUnlocked(card)) return false;
    const _d = Array.isArray(state.weeklyCardClaims[n.cardId]) ? state.weeklyCardClaims[n.cardId] : [];
    // Phase1 英雄卡：今天未领取算可领取；其他卡：本周未领取算可领取
    return card.phase === 1
      ? !_d.includes(todayStr())
      : _d.length === 0;
  });

  let msg = null;
  if (score === 0) {
    msg = '点击发光的宝箱开始冒险之旅！';
  } else if (availableCards.length > 0) {
    msg = `还有 ${availableCards.length} 张任务卡等你领取，快去看看吧！`;
  } else if (score > 0 && score < 30) {
    msg = '继续加油！再收集 ' + (30 - score) + ' 分就能解锁神秘城堡！';
  } else if (score >= 30 && score < 90) {
    msg = '城堡大门已开！继续探险，解锁终极宝藏殿堂！';
  } else if (score >= 90) {
    msg = '宝藏殿堂已开启！你已完成全部探险区域！';
  }

  if (msg) {
    el.textContent = msg;
    el.classList.add('show');
    // 不自动播报，等用户点击气泡才触发语音
  } else {
    el.classList.remove('show');
  }
}

// ── 气泡跟随骑士头顶 ───────────────────────────────────────
function positionGuidanceBubble() {
  const bubble = document.getElementById('mazeGuidance');
  const wrapper = document.getElementById('mazeWrapper');
  const container = document.getElementById('mazeContainer');
  const knightGroup = document.getElementById('mazeKnightGroup');
  const mazeSvg = container ? container.querySelector('svg') : null;
  if (!bubble || !wrapper || !container || !knightGroup || !mazeSvg) return;

  // 从 transform="translate(kx, ky)" 获取骑士在SVG坐标系中的位置
  const match = knightGroup.getAttribute('transform').match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
  if (!match) return;
  const kx = parseFloat(match[1]);
  const ky = parseFloat(match[2]);

  // 利用 SVGPoint 将SVG内坐标转为屏幕坐标
  const svgPoint = mazeSvg.createSVGPoint();
  svgPoint.x = kx;
  svgPoint.y = ky;
  const screenPt = svgPoint.matrixTransform(mazeSvg.getScreenCTM());

  // wrapper 在屏幕上的位置（气泡 absolute 相对 wrapper 定位）
  const wrapperRect = wrapper.getBoundingClientRect();

  // 骑士在 wrapper 内的相对坐标
  const knightInWrapperX = screenPt.x - wrapperRect.left;
  const knightInWrapperY = screenPt.y - wrapperRect.top;

  // 气泡宽度（渲染后读取，首次用估算值）
  const bubbleW = bubble.offsetWidth || 220;
  const bubbleH = bubble.offsetHeight || 60;

  // 气泡水平居中对准骑士，垂直位于头顶上方（骑士约50px高）
  let bubbleLeft = knightInWrapperX - bubbleW / 2;
  let bubbleTop  = knightInWrapperY - bubbleH - 55;

  // 防止气泡超出 wrapper 左右边界
  const maxLeft = wrapperRect.width - bubbleW - 8;
  bubbleLeft = Math.max(8, Math.min(bubbleLeft, maxLeft));
  // 防止超出顶部
  if (bubbleTop < 8) bubbleTop = 8;

  bubble.style.left = bubbleLeft + 'px';
  bubble.style.top  = bubbleTop  + 'px';
  bubble.style.right = 'auto';
}

// ── BFS寻路找迷宫路径 ───────────────────────────────────────
function findMazePath(fromNodeId, toNodeId) {
  if (fromNodeId === toNodeId) return [fromNodeId];
  const visited = new Set();
  const queue = [[fromNodeId]];
  visited.add(fromNodeId);
  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];
    const node = findMazeNode(current);
    if (!node || !node.connections) continue;
    for (const neighbor of node.connections) {
      if (neighbor === toNodeId) return [...path, neighbor];
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }
  return null; // 无路径
}

// ── 移动骑士（沿路径逐节点动画）────────────────────────────
function moveKnight(targetNodeId, callback) {
  const fromId = state.mazeKnightNode || 'n_knight_spawn';
  const path = findMazePath(fromId, targetNodeId);
  if (!path || path.length === 0) { if (callback) callback(); return; }

  const group = document.getElementById('mazeKnightGroup');
  if (!group) { if (callback) callback(); return; }

  // 每段动画持续时间（节点间距离决定）
  const SEGMENT_MS = 500; // 每段最多500ms

  let step = 0;
  function animateStep() {
    if (step >= path.length) {
      state.mazeKnightNode = targetNodeId;
      group.classList.remove('moving');
      group.style.transition = '';
      
      // 到达目标节点时触发宝箱开箱动画
      const targetNode = findMazeNode(targetNodeId);
      if (targetNode && targetNode.cardId) {
        const nodeEl = document.querySelector(`[data-node-id="${targetNodeId}"]`);
        if (nodeEl) {
          setTimeout(() => animateTreasureOpen(nodeEl), 300);
          // 在节点位置创建星星爆炸
          const rect = nodeEl.getBoundingClientRect();
          setTimeout(() => createStarBurst(rect.left + rect.width/2, rect.top + rect.height/2, 10), 500);
        }
      }
      
      if (callback) callback();
      return;
    }
    const nodeId = path[step];
    const node = findMazeNode(nodeId);
    if (!node) { step++; animateStep(); return; }

    // 计算距离决定动画时长
    const prevNode = step > 0 ? findMazeNode(path[step - 1]) : null;
    let duration = SEGMENT_MS;
    if (prevNode) {
      const dist = Math.hypot(node.x - prevNode.x, node.y - prevNode.y);
      duration = Math.min(Math.max(dist * 1.5, 200), 800); // 速度约1.5px/ms
    }

    group.classList.add('moving');
    group.style.transition = `transform ${duration}ms cubic-bezier(0.4,0,0.2,1)`;
    group.setAttribute('transform', `translate(${node.x - 22}, ${node.y})`);

    setTimeout(animateStep, duration + 80); // 80ms间隙
    step++;
  }

  animateStep();
}

// ── 查找迷宫节点 ─────────────────────────────────────────────
function findMazeNode(nodeId) {
  for (const phase of Object.values(MAZE_MAP.phases)) {
    const node = phase.nodes.find(n => n.id === nodeId);
    if (node) return node;
  }
  return null;
}

// ── 根据卡ID找迷宫节点 ──────────────────────────────────────
function findMazeNodeByCardId(cardId) {
  for (const phase of Object.values(MAZE_MAP.phases)) {
    const node = phase.nodes.find(n => n.cardId === cardId);
    if (node) return node.id;
  }
  return null;
}

// ── 打开迷宫节点 ─────────────────────────────────────────────
function openMazeNode(nodeId) {
  const node = findMazeNode(nodeId);
  if (!node || !node.cardId) return;
  openCardModal(node.cardId);
}

// ── 渲染完整迷宫 ─────────────────────────────────────────────
function renderMaze() {
  const container = document.getElementById('mazeContainer');
  if (!container) return;

  // 更新钥匙徽章
  updateMazeKeyBadge();

  // 构建SVG
  let svg = `<svg class="maze-svg" viewBox="0 0 800 900" xmlns="http://www.w3.org/2000/svg">`;

  // ── SVG 滤镜与渐变 ───────────────────────────────────
  svg += `<defs>
    <filter id="cartoonShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.25)"/>
    </filter>
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="fog">
      <feGaussianBlur stdDeviation="8"/>
    </filter>
    <!-- Phase1 草地渐变 -->
    <linearGradient id="gGarden" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#81C784"/>
      <stop offset="60%" stop-color="#66BB6A"/>
      <stop offset="100%" stop-color="#43A047"/>
    </linearGradient>
    <!-- Phase2 城堡渐变 -->
    <linearGradient id="gCastle" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1E88E5"/>
      <stop offset="100%" stop-color="#1565C0"/>
    </linearGradient>
    <!-- Phase3 金殿渐变 -->
    <linearGradient id="gTreasure" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFD700"/>
      <stop offset="100%" stop-color="#FF8F00"/>
    </linearGradient>
    <!-- 草地纹理图案 -->
    <pattern id="grassTex" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <rect width="40" height="40" fill="#4CAF50"/>
      <ellipse cx="10" cy="30" rx="4" ry="6" fill="#388E3C" opacity="0.4"/>
      <ellipse cx="30" cy="10" rx="3" ry="5" fill="#2E7D32" opacity="0.3"/>
    </pattern>
    <!-- 砖墙图案 -->
    <pattern id="brickTex" x="0" y="0" width="32" height="18" patternUnits="userSpaceOnUse">
      <rect width="32" height="18" fill="#C62828"/>
      <rect x="1" y="1" width="30" height="7" fill="#B71C1C" rx="1"/>
      <rect x="1" y="10" width="14" height="7" fill="#B71C1C" rx="1"/>
      <rect x="17" y="10" width="14" height="7" fill="#B71C1C" rx="1"/>
    </pattern>
  </defs>`;

  // ════════════════════════════════════════════════════════
  // PHASE 3：宝藏殿堂（y: -450 ~ 0）
  // ════════════════════════════════════════════════════════
  const p3y0 = 0, p3y1 = 200;

  // 天空背景
  svg += `<rect x="0" y="${p3y0}" width="800" height="${p3y1}" fill="#5C6BC0"/>`;
  // 金色渐变基底
  svg += `<rect x="0" y="${p3y0 + 80}" width="800" height="${p3y1 - 80}" fill="url(#gTreasure)"/>`;
  // 宫殿大理石地面
  svg += `<rect x="0" y="${p3y1 - 30}" width="800" height="30" fill="#FFF9C4"/>`;
  svg += `<rect x="0" y="${p3y1 - 30}" width="800" height="3" fill="#FFD700"/>`;

  // 背景宫殿剪影（左右两侧）
  svg += `<g opacity="0.15" fill="#FFD54F">`;
  svg += `<polygon points="30,${p3y0 + 60} 60,${p3y0 + 20} 90,${p3y0 + 60}"/>`;
  svg += `<rect x="30" y="${p3y0 + 60}" width="60" height="50"/>`;
  svg += `<rect x="650" y="${p3y0 + 50}" width="70" height="60"/>`;
  svg += `<polygon points="650,${p3y0 + 50} 685,${p3y0 + 10} 720,${p3y0 + 50}"/>`;
  svg += `</g>`;

  // 星星 sparkle
  const stars3 = [[50,30],[150,60],[300,20],[450,50],[600,30],[720,70],[250,90],[550,80]];
  stars3.forEach(([sx,sy]) => {
    svg += `<g transform="translate(${sx},${sy})" filter="url(#glow)">`;
    svg += `<polygon points="0,-6 1.5,-1.5 6,0 1.5,1.5 0,6 -1.5,1.5 -6,0 -1.5,-1.5" fill="#FFD700"/>`;
    svg += `</g>`;
  });

  // 宝藏箱（装饰）
  svg += `<g transform="translate(720, 165)">`;
  svg += `<rect x="-15" y="-10" width="30" height="22" fill="#8D6E63" rx="3"/>`;
  svg += `<rect x="-15" y="-10" width="30" height="8" fill="#A1887F" rx="3"/>`;
  svg += `<rect x="-4" y="-6" width="8" height="6" fill="#FFD700" rx="1"/>`;
  svg += `</g>`;

  // Phase 3 迷雾
  svg += `<rect id="phaseFog3" class="phase-fog" x="0" y="${p3y0}" width="800" height="${p3y1}" fill="rgba(30,30,80,0.7)" filter="url(#fog)" style="${state.totalScore >= 90 ? 'opacity:0' : 'opacity:1'}"/>`;

  // ════════════════════════════════════════════════════════
  // PHASE 2：神秘城堡（y: 200 ~ 540）
  // ════════════════════════════════════════════════════════
  const p2y0 = 200, p2y1 = 540;

  // 天空
  svg += `<rect x="0" y="${p2y0}" width="800" height="${p2y1 - 30}" fill="url(#gCastle)"/>`;
  // 远山剪影
  svg += `<g opacity="0.2" fill="#0D47A1">`;
  svg += `<polygon points="0,${p2y0 + 60} 100,${p2y0 + 20} 200,${p2y0 + 60}"/>`;
  svg += `<polygon points="150,${p2y0 + 50} 300,${p2y0} 450,${p2y0 + 50}"/>`;
  svg += `<polygon points="400,${p2y0 + 40} 550,${p2y0 + 10} 700,${p2y0 + 40}"/>`;
  svg += `<polygon points="600,${p2y0 + 50} 750,${p2y0 + 20} 800,${p2y0 + 30}"/>`;
  svg += `</g>`;

  // 城堡塔楼
  svg += `<g transform="translate(680, 240)" filter="url(#cartoonShadow)">`;
  svg += `<rect x="-20" y="0" width="40" height="80" fill="#5D4037" rx="2"/>`;
  svg += `<rect x="-25" y="-20" width="50" height="25" fill="#6D4C41" rx="2"/>`;
  // 窗户
  svg += `<rect x="-8" y="20" width="16" height="20" fill="#FFEB3B" rx="8" ry="8"/>`;
  svg += `<rect x="-8" y="50" width="16" height="20" fill="#FFEB3B" rx="8" ry="8"/>`;
  // 旗帜
  svg += `<line x1="0" y1="-20" x2="0" y2="-40" stroke="#5D4037" stroke-width="2"/>`;
  svg += `<polygon points="0,-40 18,-33 0,-26" fill="#E53935"/>`;
  svg += `</g>`;

  // 石板地面
  svg += `<rect x="0" y="${p2y1 - 40}" width="800" height="40" fill="#78909C"/>`;
  // 石板缝隙
  for (let i = 0; i < 800; i += 60) {
    svg += `<line x1="${i}" y1="${p2y1 - 40}" x2="${i}" y2="${p2y1 - 10}" stroke="#546E7A" stroke-width="1" opacity="0.5"/>`;
  }
  svg += `<rect x="0" y="${p2y1 - 5}" width="800" height="5" fill="#455A64"/>`;

  // Phase 2 迷雾
  svg += `<rect id="phaseFog2" class="phase-fog" x="0" y="${p2y0}" width="800" height="${p2y1 - p2y0}" fill="rgba(20,50,120,0.65)" filter="url(#fog)" style="${state.totalScore >= 30 ? 'opacity:0' : 'opacity:1'}"/>`;

  // ════════════════════════════════════════════════════════
  // PHASE 1：英雄花园（y: 540 ~ 900）
  // ════════════════════════════════════════════════════════
  const p1y0 = 540, p1y1 = 900;

  // 草地基底
  svg += `<rect x="0" y="${p1y0}" width="800" height="${p1y1 - p1y0}" fill="url(#grassTex)"/>`;
  // 草地渐变叠加
  svg += `<rect x="0" y="${p1y0}" width="800" height="${p1y1 - p1y0}" fill="url(#gGarden)"/>`;

  // 草地底部草叶纹理
  for (let i = 0; i < 800; i += 30) {
    svg += `<ellipse cx="${i + 10}" cy="${p1y1 - 5}" rx="8" ry="5" fill="#2E7D32" opacity="0.4"/>`;
    svg += `<ellipse cx="${i + 20}" cy="${p1y1 - 8}" rx="6" ry="4" fill="#388E3C" opacity="0.3"/>`;
  }

  // 太阳
  svg += `<g transform="translate(730, 580)" filter="url(#glow)">`;
  svg += `<circle cx="0" cy="0" r="28" fill="#FFEE58"/>`;
  svg += `<circle cx="0" cy="0" r="22" fill="#FFEB3B"/>`;
  for (let a = 0; a < 360; a += 45) {
    const rad = a * Math.PI / 180;
    svg += `<line x1="${Math.cos(rad)*28}" y1="${Math.sin(rad)*28}" x2="${Math.cos(rad)*36}" y2="${Math.sin(rad)*36}" stroke="#FFD54F" stroke-width="3" stroke-linecap="round"/>`;
  }
  svg += `</g>`;

  // 树木（卡通风格多层树）
  const drawTree = (tx, ty, sz) => {
    svg += `<g transform="translate(${tx},${ty})">`;
    // 树根（地面小草堆）
    svg += `<ellipse cx="0" cy="${30*sz}" rx="${12*sz}" ry="${5*sz}" fill="#33691E" opacity="0.6"/>`;
    // 树干（带纹理）
    svg += `<rect x="-${5*sz}" y="0" width="${10*sz}" height="${30*sz}" fill="#6D4C41" rx="${3*sz}"/>`;
    svg += `<rect x="-${4*sz}" y="${5*sz}" width="${2*sz}" height="${20*sz}" fill="#5D4037" rx="1" opacity="0.5"/>`;
    svg += `<rect x="${2*sz}" y="${10*sz}" width="${2*sz}" height="${15*sz}" fill="#5D4037" rx="1" opacity="0.4"/>`;
    // 树冠第一层（最大，深绿）
    svg += `<ellipse cx="0" cy="-${8*sz}" rx="${26*sz}" ry="${22*sz}" fill="#2E7D32"/>`;
    // 树冠第二层（中绿）
    svg += `<ellipse cx="-${8*sz}" cy="-${5*sz}" rx="${18*sz}" ry="${15*sz}" fill="#388E3C"/>`;
    svg += `<ellipse cx="${10*sz}" cy="-${10*sz}" rx="${16*sz}" ry="${14*sz}" fill="#43A047"/>`;
    // 树冠第三层（亮绿高光）
    svg += `<ellipse cx="${3*sz}" cy="-${15*sz}" rx="${10*sz}" ry="${8*sz}" fill="#66BB6A" opacity="0.8"/>`;
    svg += `<ellipse cx="-${5*sz}" cy="-${18*sz}" rx="${6*sz}" ry="${5*sz}" fill="#81C784" opacity="0.7"/>`;
    // 树上小果子或花朵
    svg += `<circle cx="${15*sz}" cy="-${20*sz}" r="${3*sz}" fill="#FF7043"/>`;
    svg += `<circle cx="${15*sz}" cy="-${20*sz}" r="${1.5*sz}" fill="#FFAB91"/>`;
    svg += `<circle cx="-${12*sz}" cy="-${15*sz}" r="${2.5*sz}" fill="#FFA726"/>`;
    svg += `<circle cx="-${12*sz}" cy="-${15*sz}" r="${1*sz}" fill="#FFCC80"/>`;
    svg += `</g>`;
  };
  drawTree(50, 700, 1.2); drawTree(750, 720, 1.0); drawTree(30, 850, 0.9); drawTree(770, 860, 1.1);

  // 小花丛
  const drawFlowers = (fx, fy, col) => {
    svg += `<g transform="translate(${fx},${fy})">`;
    svg += `<ellipse cx="0" cy="5" rx="6" ry="4" fill="#4CAF50"/>`;
    svg += `<circle cx="0" cy="0" r="5" fill="${col}"/>`;
    svg += `<circle cx="0" cy="0" r="2.5" fill="#FFEB3B"/>`;
    svg += `</g>`;
  };
  [[100,780,'#E91E63'],[110,790,'#FF5722'],[700,760,'#9C27B0'],[710,775,'#E91E63'],
   [60,880,'#FF9800'],[200,870,'#E91E63'],[650,880,'#9C27B0'],[740,870,'#FF5722']].forEach(([a,b,c])=>drawFlowers(a,b,c));

  // 蘑菇（卡通风格）
  const drawMushroom = (mx, my, col) => {
    svg += `<g transform="translate(${mx},${my})">`;
    // 蘑菇地面小草
    svg += `<ellipse cx="0" cy="12" rx="8" ry="3" fill="#388E3C" opacity="0.5"/>`;
    // 蘑菇茎（奶油色，带竖纹）
    svg += `<rect x="-5" y="0" width="10" height="12" fill="#FFF9C4" rx="3"/>`;
    svg += `<rect x="-2" y="1" width="2" height="10" fill="#FFF" opacity="0.4" rx="1"/>`;
    svg += `<ellipse cx="0" cy="12" rx="6" ry="3" fill="#F5F5DC" opacity="0.6"/>`;
    // 蘑菇帽（彩色圆顶）
    svg += `<ellipse cx="0" cy="0" rx="12" ry="9" fill="${col}"/>`;
    // 帽子边缘
    svg += `<ellipse cx="0" cy="1" rx="12" ry="8" fill="${col}" opacity="0.8"/>`;
    // 白色卡通斑点（大）
    svg += `<circle cx="-5" cy="-3" r="3" fill="#FFF" opacity="0.85"/>`;
    svg += `<circle cx="4" cy="-2" r="2.5" fill="#FFF" opacity="0.85"/>`;
    svg += `<circle cx="-1" cy="-6" r="2" fill="#FFF" opacity="0.85"/>`;
    svg += `<circle cx="7" cy="-5" r="1.5" fill="#FFF" opacity="0.85"/>`;
    svg += `<circle cx="-7" cy="0" r="1.5" fill="#FFF" opacity="0.7"/>`;
    // 帽子内部高光
    svg += `<ellipse cx="-3" cy="-5" rx="3" ry="2" fill="#FFF" opacity="0.4"/>`;
    // 可爱小表情
    svg += `<circle cx="-2" cy="1" r="1" fill="#5D4037" opacity="0.7"/>`;
    svg += `<circle cx="3" cy="1" r="1" fill="#5D4037" opacity="0.7"/>`;
    svg += `<path d="M -2 4 Q 0 6 2 4" stroke="#5D4037" stroke-width="1" fill="none" opacity="0.6"/>`;
    svg += `</g>`;
  };
  [[150,830,'#F44336'],[680,820,'#FF9800'],[300,860,'#F44336']].forEach(([a,b,c])=>drawMushroom(a,b,c));

  // 云朵
  const drawCloud = (cx, cy, sz) => {
    svg += `<g transform="translate(${cx},${cy})" opacity="0.85">`;
    svg += `<ellipse cx="0" cy="0" rx="${20*sz}" ry="${12*sz}" fill="white"/>`;
    svg += `<ellipse cx="${-15*sz}" cy="${3*sz}" rx="${14*sz}" ry="${9*sz}" fill="white"/>`;
    svg += `<ellipse cx="${15*sz}" cy="${2*sz}" rx="${16*sz}" ry="${10*sz}" fill="white"/>`;
    svg += `</g>`;
  };
  drawCloud(120, 570, 1.0); drawCloud(500, 580, 0.8); drawCloud(280, 560, 0.7);

  // 蝴蝶
  svg += `<g transform="translate(350, 600)">`;
  svg += `<ellipse cx="-5" cy="-3" rx="5" ry="3" fill="#E91E63" transform="rotate(-20)"/>`;
  svg += `<ellipse cx="5" cy="-3" rx="5" ry="3" fill="#E91E63" transform="rotate(20)"/>`;
  svg += `<ellipse cx="-4" cy="3" rx="4" ry="2.5" fill="#F48FB1" transform="rotate(-10)"/>`;
  svg += `<ellipse cx="4" cy="3" rx="4" ry="2.5" fill="#F48FB1" transform="rotate(10)"/>`;
  svg += `<ellipse cx="0" cy="0" rx="2" ry="4" fill="#5D4037"/>`;
  svg += `</g>`;

  // 阶段分隔线（装饰性）
  svg += `<rect x="0" y="${p2y0}" width="800" height="8" fill="#455A64"/>`;
  svg += `<rect x="0" y="${p2y0 + 3}" width="800" height="2" fill="#607D8B" opacity="0.6"/>`;
  svg += `<rect x="0" y="${p1y0}" width="800" height="6" fill="#2E7D32"/>`;
  svg += `<rect x="0" y="${p1y0 + 2}" width="800" height="2" fill="#4CAF50" opacity="0.5"/>`;

  // ── 绘制石头小路（Phase 1 花园）─────────────────────
  MAZE_MAP.phases[1].paths.forEach(path => {
    // 底层阴影
    svg += `<path d="${path.d}" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>`;
    // 主路面
    svg += `<path d="${path.d}" fill="none" stroke="#8D6E63" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>`;
    // 路面纹理（浅色石块）
    svg += `<path d="${path.d}" fill="none" stroke="#A1887F" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="6 12" opacity="0.5"/>`;
    // 高光边缘
    svg += `<path d="${path.d}" fill="none" stroke="#BCAAA4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/>`;
  });

  // ── 绘制石板路（Phase 2 城堡）────────────────────────
  MAZE_MAP.phases[2].paths.forEach(path => {
    svg += `<path d="${path.d}" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>`;
    svg += `<path d="${path.d}" fill="none" stroke="#78909C" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>`;
    svg += `<path d="${path.d}" fill="none" stroke="#90A4AE" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="4 10" opacity="0.4"/>`;
  });

  // ── 绘制黄金路（Phase 3 宝藏殿堂）────────────────────
  MAZE_MAP.phases[3].paths.forEach(path => {
    svg += `<path d="${path.d}" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>`;
    svg += `<path d="${path.d}" fill="none" stroke="#FFD700" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`;
    svg += `<path d="${path.d}" fill="none" stroke="#FFF176" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>`;
  });

  // ── 绘制所有节点 ─────────────────────────────────────
  Object.entries(MAZE_MAP.phases).forEach(([phaseId, phase]) => {
    const phaseRevealed = state.totalScore >= phase.unlockScore;
    phase.nodes.forEach(node => {
      const nodeState = getMazeNodeState(node);
      const revealed = phaseRevealed;
      const isClickable = node.cardId && revealed;
      const card = node.cardId ? TASK_CARDS.find(c => c.id === node.cardId) : null;

      // 节点颜色配置
      let platformFill, platformStroke, iconCol, labelBg;
      // 出生点/路点：使用阶段主色作为小圆点颜色
      if (node.isSpawn || node.isWaypoint) {
        platformFill = phase.nodeColor; platformStroke = phase.pathColor; iconCol = phase.nodeColor;
        labelBg = 'rgba(0,0,0,0)';
      } else if (node.isGate) {
        platformFill = '#6D4C41'; platformStroke = '#4E342E'; iconCol = '#FFF';
        labelBg = 'rgba(109,76,65,0.85)';
      } else if (node.isTreasure) {
        platformFill = '#FFD700'; platformStroke = '#FF8F00'; iconCol = '#E65100';
        labelBg = 'rgba(255,179,0,0.85)';
      } else if (!revealed) {
        platformFill = '#9E9E9E'; platformStroke = '#616161'; iconCol = '#757575';
        labelBg = 'rgba(158,158,158,0.8)';
      } else if (nodeState === 'done') {
        platformFill = '#43A047'; platformStroke = '#2E7D32'; iconCol = '#FFF';
        labelBg = 'rgba(67,160,71,0.85)';
      } else if (nodeState === 'available') {
        platformFill = '#FFCA28'; platformStroke = '#F9A825'; iconCol = '#5D4037';
        labelBg = 'rgba(255,202,40,0.85)';
      } else {
        platformFill = '#BDBDBD'; platformStroke = '#757575'; iconCol = '#9E9E9E';
        labelBg = 'rgba(189,189,189,0.8)';
      }

      const onclick = isClickable ? `openMazeNode('${node.id}')` : '';
      const r = node.isWaypoint ? 8 : node.isSpawn ? 8 : node.isGate ? 22 : node.isTreasure ? 26 : 18;

      svg += `<g class="maze-node" ${onclick ? 'style="cursor:pointer"' : ''}>
        ${isClickable ? `<rect x="${node.x - r - 4}" y="${node.y - r - 4}" width="${(r+4)*2}" height="${(r+4)*2}" fill="transparent" pointer-events="all" data-node-id="${node.id}" class="maze-node-hit"/>` : ''}
      `;

      // 任务节点 → 卡通宝箱造型
      if (node.cardId) {
        const bx = node.x, by = node.y;
        const bw = 44, bh = 34; // 宝箱宽高
        let chestFill, chestStroke, lidFill, claspFill, claspStroke;
        if (nodeState === 'done') {
          chestFill = '#43A047'; chestStroke = '#2E7D32'; lidFill = '#66BB6A';
          claspFill = '#FFD700'; claspStroke = '#F9A825';
        } else if (!revealed) {
          chestFill = '#757575'; chestStroke = '#424242'; lidFill = '#9E9E9E';
          claspFill = '#BDBDBD'; claspStroke = '#757575';
        } else {
          chestFill = '#FFA000'; chestStroke = '#E65100'; lidFill = '#FFB300';
          claspFill = '#FFD700'; claspStroke = '#F9A825';
        }
        // 宝箱全部元素都不拦截点击，点击穿透到下方透明 rect
        svg += `<g pointer-events="none">`;
        // 宝箱身（主体矩形）
        svg += `<rect x="${bx - bw/2}" y="${by - bh/2 + 6}" width="${bw}" height="${bh - 6}" fill="${chestFill}" stroke="${chestStroke}" stroke-width="2" rx="4"/>`;
        // 竖纹装饰
        svg += `<rect x="${bx - bw/2 + 4}" y="${by - bh/2 + 10}" width="3" height="${bh - 14}" fill="${chestStroke}" opacity="0.3" rx="1"/>`;
        svg += `<rect x="${bx + bw/2 - 7}" y="${by - bh/2 + 10}" width="3" height="${bh - 14}" fill="${chestStroke}" opacity="0.3" rx="1"/>`;
        // 宝箱盖（顶部圆角矩形，略宽于箱身）
        svg += `<rect x="${bx - bw/2 - 2}" y="${by - bh/2 - 4}" width="${bw + 4}" height="${bh/2 + 6}" fill="${lidFill}" stroke="${chestStroke}" stroke-width="2" rx="6"/>`;
        // 缝隙分割线
        svg += `<line x1="${bx - bw/2 - 2}" y1="${by - bh/2 + 6}" x2="${bx + bw/2 + 2}" y2="${by - bh/2 + 6}" stroke="${chestStroke}" stroke-width="2"/>`;
        // 横向金属锁扣条
        svg += `<rect x="${bx - bw/2 + 2}" y="${by - 2}" width="${bw - 4}" height="6" fill="${claspFill}" stroke="${claspStroke}" stroke-width="1.5" rx="2"/>`;
        // 锁扣图标
        if (nodeState === 'done') {
          svg += `<circle cx="${bx}" cy="${by + 1}" r="6" fill="#FFD700" stroke="#F9A825" stroke-width="1.5"/>`;
          svg += `<text x="${bx}" y="${by + 4}" text-anchor="middle" font-size="8" fill="#2E7D32" font-weight="bold">✓</text>`;
        } else if (!revealed) {
          svg += `<text x="${bx}" y="${by + 4}" text-anchor="middle" font-size="10">🔒</text>`;
        } else {
          svg += `<circle cx="${bx}" cy="${by + 1}" r="6" fill="#FFD700" stroke="#F9A825" stroke-width="1.5"/>`;
          svg += `<text x="${bx}" y="${by + 4}" text-anchor="middle" font-size="9" fill="#5D4037">⭐</text>`;
        }
        svg += `</g>`;
      } else {
        // 节点主体圆（非任务节点：门/宝藏/路点等）
        svg += `<circle cx="${node.x}" cy="${node.y}" r="${r + 3}" fill="${platformStroke}" opacity="0.3"/>`;
        svg += `<circle cx="${node.x}" cy="${node.y}" r="${r}" fill="${platformFill}" stroke="${platformStroke}" stroke-width="3"/>`;

        // 节点图标
        if (node.isGate) {
          // ── 卡通城堡大门 ────────────────────────────────
          const gx = node.x, gy = node.y, gr = r;
          // 石拱门底座（深色石头拱圈）
          svg += `<ellipse cx="${gx}" cy="${gy}" rx="${gr+2}" ry="${gr+2}" fill="#5D4037" opacity="0.6"/>`;
          // 石拱门主体（浅灰色大拱门）
          svg += `<ellipse cx="${gx}" cy="${gy}" rx="${gr}" ry="${gr}" fill="#90A4AE"/>`;
          svg += `<ellipse cx="${gx}" cy="${gy}" rx="${gr-4}" ry="${gr-4}" fill="#78909C"/>`;
          // 拱门内部深色（门洞）
          svg += `<ellipse cx="${gx}" cy="${gy+2}" rx="${gr-8}" ry="${gr-8}" fill="#37474F"/>`;
          // 两扇木门
          svg += `<rect x="${gx-16}" y="${gy-8}" width="14" height="20" fill="#6D4C41" rx="2"/>`;
          svg += `<rect x="${gx+2}" y="${gy-8}" width="14" height="20" fill="#795548" rx="2"/>`;
          // 木门竖纹
          svg += `<line x1="${gx-9}" y1="${gy-8}" x2="${gx-9}" y2="${gy+12}" stroke="#5D4037" stroke-width="1" opacity="0.5"/>`;
          svg += `<line x1="${gx+9}" y1="${gy-8}" x2="${gx+9}" y2="${gy+12}" stroke="#6D41" stroke-width="1" opacity="0.5"/>`;
          // 门环（左右各一个）
          svg += `<circle cx="${gx-5}" cy="${gy+2}" r="3" fill="#FFD54F" stroke="#F9A825" stroke-width="1"/>`;
          svg += `<circle cx="${gx+5}" cy="${gy+2}" r="3" fill="#FFD54F" stroke="#F9A825" stroke-width="1"/>`;
          // 铁门闩（横条）
          svg += `<rect x="${gx-15}" y="${gy-1}" width="30" height="3" fill="#455A64" rx="1"/>`;
          // 拱顶石（keystone）
          svg += `<ellipse cx="${gx}" cy="${gy-gr+4}" rx="6" ry="4" fill="#CFD8DC"/>`;
          svg += `<ellipse cx="${gx}" cy="${gy-gr+4}" rx="4" ry="2.5" fill="#B0BEC5"/>`;
          // 左火炬（带SMIL动画火焰）
          svg += `<rect x="${gx-20}" y="${gy-20}" width="3" height="10" fill="#795548" rx="1"/>`;
          svg += `<ellipse cx="${gx-18.5}" cy="${gy-23}" rx="4" ry="5" fill="#FF6D00">
            <animate attributeName="ry" values="5;6;4;5" dur="0.8s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.9;1;0.8;0.9" dur="0.8s" repeatCount="indefinite"/>
          </ellipse>`;
          svg += `<ellipse cx="${gx-18.5}" cy="${gy-25}" rx="2" ry="3" fill="#FFEB3B">
            <animate attributeName="ry" values="3;4;2;3" dur="0.8s" repeatCount="indefinite"/>
          </ellipse>`;
          // 右火炬
          svg += `<rect x="${gx+17}" y="${gy-20}" width="3" height="10" fill="#795548" rx="1"/>`;
          svg += `<ellipse cx="${gx+18.5}" cy="${gy-23}" rx="4" ry="5" fill="#FF6D00">
            <animate attributeName="ry" values="5;4;6;5" dur="0.9s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.9;0.8;1;0.9" dur="0.9s" repeatCount="indefinite"/>
          </ellipse>`;
          svg += `<ellipse cx="${gx+18.5}" cy="${gy-25}" rx="2" ry="3" fill="#FFEB3B">
            <animate attributeName="ry" values="3;2;4;3" dur="0.9s" repeatCount="indefinite"/>
          </ellipse>`;
        } else if (node.isTreasure) {
          svg += `<text x="${node.x}" y="${node.y + 5}" text-anchor="middle" font-size="18">👑</text>`;
        } else if (node.isSpawn || node.isWaypoint) {
          svg += `<circle cx="${node.x}" cy="${node.y}" r="5" fill="${platformFill}" stroke="${platformStroke}" stroke-width="2"/>`;
        }
      }

      // 节点名称标签
      if (node.label && (revealed || node.isGate || node.isTreasure)) {
        const lW = node.label.length * 11 + 16;
        const lX = node.x - lW / 2;
        const lY = node.y + r + 16;
        svg += `<rect x="${lX}" y="${lY}" width="${lW}" height="16" fill="${labelBg}" rx="8"/>`;
        svg += `<text x="${node.x}" y="${lY + 11.5}" text-anchor="middle" font-size="10" fill="white" font-weight="700">${node.label}</text>`;
      }

      // 死路支线标记（仅显示一个小绿点，表示路到这里是终点，不显示红叉）
      // deadEnd节点是支线尽头，属于正常可探索节点，不需要警示符号

      svg += `</g>`;
    });
  });

  // ── 骑士角色（卡通小骑士）────────────────────────────
  const knightNodeId = state.mazeKnightNode || 'n_knight_spawn';
  const knightNode = findMazeNode(knightNodeId) || findMazeNode('n_knight_spawn');
  // 骑士站在卡片节点的左边（x 偏移 -22），避免遮挡宝箱
  // 添加 onclick 使骑士可点击，点击后显示帮助对话框
  svg += `<g id="mazeKnightGroup" class="maze-knight" transform="translate(${knightNode.x - 22}, ${knightNode.y})" style="cursor:pointer" onclick="showKnightHelp()">`;

  // 阴影（随步伐微微弹跳）
  svg += `<ellipse cx="0" cy="22" rx="12" ry="5" fill="rgba(0,0,0,0.18)">
    <animate attributeName="ry" values="5;3;5" dur="0.5s" begin="0s" repeatCount="indefinite"/>
  </ellipse>`;

  // 左腿（含SMIL走路动画）
  svg += `<g id="knightLeftLeg">
    <rect x="-7" y="14" width="7" height="12" fill="#546E7A" rx="3"/>
    <rect x="-8" y="24" width="9" height="5" fill="#455A64" rx="2"/>
    <animateTransform attributeName="transform" type="rotate"
      values="0 0 14;-18 0 14;0 0 14;18 0 14;0 0 14"
      dur="0.6s" repeatCount="indefinite"/>
  </g>`;

  // 右腿（与左腿相位差）
  svg += `<g id="knightRightLeg">
    <rect x="0" y="14" width="7" height="12" fill="#546E7A" rx="3"/>
    <rect x="-1" y="24" width="9" height="5" fill="#455A64" rx="2"/>
    <animateTransform attributeName="transform" type="rotate"
      values="18 0 14;-18 0 14;0 0 14;-18 0 14;18 0 14"
      dur="0.6s" repeatCount="indefinite"/>
  </g>`;

  // 身体（上下弹跳）
  svg += `<g class="knight-body">
    <animateTransform attributeName="transform" type="translate"
      values="0,0;0,-2;0,0" dur="0.3s" repeatCount="indefinite"/>
    <!-- 盔甲身体 -->
    <rect x="-9" y="-4" width="18" height="20" fill="#78909C" rx="5"/>
    <rect x="-7" y="-2" width="14" height="16" fill="#90A4AE" rx="4"/>
    <!-- 盔甲光泽 -->
    <rect x="-5" y="0" width="4" height="8" fill="rgba(255,255,255,0.25)" rx="2"/>
    <!-- 披风 -->
    <path d="M -7,-2 Q -14,10 -6,16 L 0,13 L 6,16 Q 14,10 7,-2 Z" fill="#E53935"/>
    <path d="M -5,0 Q -10,8 -5,13 L 0,11 L 5,13 Q 10,8 5,0 Z" fill="#EF5350" opacity="0.5"/>
    <!-- 盾牌 -->
    <g transform="translate(-15, 2)">
      <ellipse cx="0" cy="0" rx="10" ry="13" fill="#1565C0" stroke="#0D47A1" stroke-width="2"/>
      <ellipse cx="0" cy="0" rx="6" ry="8" fill="#1E88E5"/>
      <text x="0" y="4" text-anchor="middle" font-size="10" fill="white">★</text>
    </g>
    <!-- 剑 -->
    <g transform="translate(15, 2)">
      <rect x="-2.5" y="-16" width="5" height="20" fill="#BDBDBD" rx="1.5"/>
      <rect x="-6" y="2" width="12" height="6" fill="#8D6E63" rx="2"/>
      <rect x="-2" y="-18" width="5" height="4" fill="#E0E0E0" rx="1"/>
      <!-- 剑身光泽 -->
      <rect x="-1" y="-15" width="2" height="16" fill="rgba(255,255,255,0.4)" rx="1"/>
    </g>
    <!-- 头盔 -->
    <circle cx="0" cy="-10" r="11" fill="#78909C" stroke="#546E7A" stroke-width="2"/>
    <!-- 头盔顶部 -->
    <rect x="-5" y="-22" width="10" height="6" fill="#78909C" rx="3"/>
    <!-- 红色呆毛/羽翎 -->
    <rect x="-2" y="-30" width="4" height="10" fill="#E53935" rx="2">
      <animate attributeName="height" values="10;12;10" dur="1s" repeatCount="indefinite"/>
    </rect>
    <!-- 面罩缝隙 -->
    <line x1="0" y1="-17" x2="0" y2="-3" stroke="#546E7A" stroke-width="1.5"/>
    <line x1="-9" y1="-10" x2="9" y2="-10" stroke="#546E7A" stroke-width="1.5"/>
    <!-- 眼睛（发光蓝） -->
    <circle cx="-4" cy="-10" r="2.5" fill="#29B6F6">
      <animate attributeName="r" values="2.5;2;2.5" dur="2s" repeatCount="indefinite"/>
    </circle>
    <circle cx="4" cy="-10" r="2.5" fill="#29B6F6">
      <animate attributeName="r" values="2.5;2;2.5" dur="2s" repeatCount="indefinite"/>
    </circle>
    <!-- 眼睛高光 -->
    <circle cx="-5" cy="-11" r="1" fill="white" opacity="0.8"/>
    <circle cx="3" cy="-11" r="1" fill="white" opacity="0.8"/>
  </g>`;

  svg += `</g>`;

  svg += `</svg>`;

  // 渲染到容器
  container.innerHTML = svg;

  // 事件委托：迷宫节点点击（替代inline onclick，解决iOS Safari兼容问题）
  container.querySelectorAll('.maze-node-hit').forEach(rect => {
    rect.addEventListener('click', () => {
      const nodeId = rect.getAttribute('data-node-id');
      if (nodeId) openMazeNode(nodeId);
    });
  });

  // 更新迷雾状态
  checkPhaseFogReveal();

  // 更新骑士位置（JS控制，支持动画）
  positionKnightImmediate(knightNodeId);

  // 显示全部卡牌入口
  const toggleEl = document.getElementById('mazeAllCardsToggle');
  if (toggleEl) toggleEl.style.display = 'flex';

  // 更新语音引导气泡（跟随骑士头顶）
  updateMazeGuidance();
  positionGuidanceBubble();

  // 监听骑士移动气泡跟随（全局唯一Observer，避免多次renderMaze叠加泄漏）
  if (_knightObserver) {
    _knightObserver.disconnect();
    _knightObserver = null;
  }
  const knightGroup = document.getElementById('mazeKnightGroup');
  if (knightGroup) {
    _knightObserver = new MutationObserver(() => positionGuidanceBubble());
    _knightObserver.observe(knightGroup, { attributes: true, attributeFilter: ['transform'] });
  }
}

// ── 骑士立即定位（不动画）──────────────────────────────────
function positionKnightImmediate(nodeId) {
  const node = findMazeNode(nodeId || state.mazeKnightNode || 'n_knight_spawn');
  if (!node) return;
  const group = document.getElementById('mazeKnightGroup');
  if (!group) return;
  group.style.transition = 'none';
  group.setAttribute('transform', `translate(${node.x}, ${node.y})`);
  group.getBoundingClientRect(); // force reflow
  group.style.transition = '';
  state.mazeKnightNode = node.id;
}

// ── 全部卡牌视图切换 ───────────────────────────────────────
let mazeShowAllCards = false;
let _knightObserver = null;  // 全局唯一骑士MutationObserver，防止多次renderMaze泄漏
function toggleAllCardsView() {
  mazeShowAllCards = !mazeShowAllCards;
  const grid = document.getElementById('cardsGrid');
  const wrapperEl = document.getElementById('mazeWrapper');
  const keyBadge = document.getElementById('mazeKeyBadge');
  const toggleEl = document.getElementById('mazeAllCardsToggle');
  const toggleBtn = toggleEl ? toggleEl.querySelector('button') : null;

  if (mazeShowAllCards) {
    // 隐藏迷宫区域
    if (wrapperEl) wrapperEl.style.display = 'none';
    if (keyBadge) keyBadge.style.display = 'none';
    if (toggleEl) toggleEl.style.display = 'none';
    // 重置视图模式为"成长主线"（默认进入主线，避免全部视图太杂乱）
    currentCardView = 'main';
    // 显示卡牌区域
    grid.style.display = 'block';
    // 构建顶部导航（若不存在则创建）
    let backBtn = document.getElementById('allCardsBackBtn');
    if (!backBtn) {
      backBtn = document.createElement('div');
      backBtn.id = 'allCardsBackBtn';
      backBtn.style.cssText = 'padding:12px 12px 8px;';
      backBtn.innerHTML = `
        <div style="text-align:center;margin-bottom:12px;">
          <button onclick="toggleAllCardsView()" style="background:linear-gradient(135deg,#42a5f5,#1976d2);color:white;border:none;border-radius:25px;padding:10px 28px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(25,118,210,0.3);">🗺️ 回到迷宫地图</button>
        </div>
        <div id="allCardsTabBar" style="display:flex;gap:10px;justify-content:center;padding:0 4px 12px;">
          <button class="ac-tab-btn ac-tab-active" data-view="main">🗺️ 成长主线</button>
          <button class="ac-tab-btn" data-view="interest">🌈 兴趣支线</button>
        </div>
      `;
      grid.insertBefore(backBtn, grid.firstChild);
      // 绑定顶部 tab 事件
      backBtn.querySelectorAll('.ac-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          backBtn.querySelectorAll('.ac-tab-btn').forEach(b => b.classList.remove('ac-tab-active'));
          btn.classList.add('ac-tab-active');
          currentCardView = btn.dataset.view;
          renderCards();
        });
      });
    }
    backBtn.style.display = 'block';
    // 重置 tab 高亮为"成长主线"
    const tabBar = document.getElementById('allCardsTabBar');
    if (tabBar) {
      tabBar.querySelectorAll('.ac-tab-btn').forEach(b => b.classList.remove('ac-tab-active'));
      const mainTab = tabBar.querySelector('[data-view="main"]');
      if (mainTab) mainTab.classList.add('ac-tab-active');
    }
    renderCards();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    // 恢复迷宫
    if (wrapperEl) wrapperEl.style.display = '';
    if (keyBadge) keyBadge.style.display = 'flex';
    grid.style.display = 'none';
    const backBtn = document.getElementById('allCardsBackBtn');
    if (backBtn) backBtn.style.display = 'none';
    const cardsContent = document.getElementById('allCardsContent');
    if (cardsContent) cardsContent.innerHTML = '';
    if (toggleEl) toggleEl.style.display = 'flex';
    if (toggleBtn) toggleBtn.textContent = '📜 查看全部挑战卡';
    renderMaze();
    positionGuidanceBubble();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ── 渲染任务卡（迷宫优先） ──────────────────────────────────
var currentCardView = 'main';  // 'main' | 'interest'（已移除'all'视图入口）
function renderCards() {
  const grid = document.getElementById('cardsGrid');
  const wrapperEl = document.getElementById('mazeWrapper');
  const keyBadge = document.getElementById('mazeKeyBadge');
  const toggleEl = document.getElementById('mazeAllCardsToggle');

  // ── 迷宫模式（默认） ─────────────────────────────────────
  if (!mazeShowAllCards) {
    renderMaze();
    return;
  }

  // ── 全部卡牌模式 ────────────────────────────────────────
  if (wrapperEl) wrapperEl.style.display = 'none';
  if (keyBadge) keyBadge.style.display = 'none';
  if (toggleEl) toggleEl.style.display = 'none';
  grid.style.display = 'block';

  // 检查周是否过期
  const weekStart = getWeekStart();
  if (state.weekStart !== weekStart) {
    state.weekStart = weekStart;
    state.weeklyCardClaims = {};
    state.weeklyCardCount = 0;
    state.weeklyAchievement = null;
    saveState();
  }

  const view = (typeof currentCardView !== 'undefined' && currentCardView) ? currentCardView : 'main';

  // ── 辅助：渲染单张卡片 HTML ──────────────────────────────
  function cardHTML(c) {
    const isUnlocked = isCardUnlocked(c);
    const _claimedDates = Array.isArray(state.weeklyCardClaims[c.id]) ? state.weeklyCardClaims[c.id] : [];
    const claimedThisWeek = c.phase === 1
      ? _claimedDates.includes(todayStr())
      : _claimedDates.length >= 1;
    const lockIcon = isUnlocked ? '' : '<div class="card-lock-badge">🔒</div>';
    const weekBadge = c.weekUnlock && !state.weekUnlocked
      ? `<div class="week-unlock-badge">第一周后解锁</div>` : '';
    const claimedBadge = claimedThisWeek && isUnlocked
      ? `<div class="claimed-badge">✅ 本周已完成</div>` : '';
    const unlockHint = !isUnlocked && !c.weekUnlock ? `<div class="card-unlock">${
      c.unlockRope !== undefined ? '🪢 跳绳达到'+c.unlockRope+'个解锁' :
      c.unlockMathCount !== undefined ? '⚡ 口算练习'+c.unlockMathCount+'次解锁' :
      c.unlockMathBest !== undefined ? '⚡ 口算单次答对'+c.unlockMathBest+'题解锁' :
      c.unlockMathLevel !== undefined ? '⚡ 口算升到第'+(c.unlockMathLevel+1)+'关解锁' :
      c.unlockReadCount !== undefined ? '📚 完成'+c.unlockReadCount+'次阅读挑战解锁' :
      '累计'+c.unlockAt+'分解锁'
    }</div>` : '';
    return `
      <div class="task-card ${isUnlocked?'':'locked'} ${claimedThisWeek?'claimed':''}"
           style="background:${c.lightColor}"
           onclick="openCardModal('${c.id}')">
        ${lockIcon}
        <div class="card-stars">${c.stars}</div>
        <div class="card-name">${c.name}</div>
        <div class="card-sub">${c.sub}</div>
        <div class="card-score">+${c.score}分</div>
        ${claimedBadge}${unlockHint}${weekBadge}
        ${isUnlocked ? speakBtn(c.speech) : ''}
      </div>`;
  }

  // ── 辅助：渲染一组卡片网格 ──────────────────────────────
  function cardsGridHTML(cards) {
    return `<div class="cards-grid">${cards.map(cardHTML).join('')}</div>`;
  }

  // ── 主线视图辅助：阶段配置 ──────────────────────────────
  const phaseConfig = {
    1: { label:'🌱 第一阶段', sublabel:'行为稳定 · 专注萌芽', color:'#2e7d32', lightColor:'#f1f8e9', unlockAt:0 },
    2: { label:'🚀 第二阶段', sublabel:'时间感知 · 主动选择', color:'#1565c0', lightColor:'#e3f2fd', unlockAt:30 },
    3: { label:'🏆 第三阶段', sublabel:'自我觉察 · 目标设定', color:'#6a1b9a', lightColor:'#f3e5f5', unlockAt:90 },
  };

  // ── 兴趣支线：不含phase的series分组配置 ──────────────────
  const interestIslandConfig = {
    '📚 阅读探索':  { color:'#00897b', lightBg:'#e0f2f1', emoji:'📚' },
    '🎵 音乐探索':  { color:'#6a1b9a', lightBg:'#f3e5f5', emoji:'🎵' },
    '🎨 创造挑战':  { color:'#e65100', lightBg:'#fff3e0', emoji:'🎨' },
    '🎨 绘画成长':  { color:'#ad1457', lightBg:'#fce4ec', emoji:'🖼️' },
    '🖌️ 绘画日记': { color:'#558b2f', lightBg:'#f9fbe7', emoji:'🖌️' },
    '⚡ 数学专项':  { color:'#f57f17', lightBg:'#fffde7', emoji:'⚡' },
    '🌍 英语专项':  { color:'#1565c0', lightBg:'#e3f2fd', emoji:'🌍' },
    '🌙 习惯养成':  { color:'#283593', lightBg:'#e8eaf6', emoji:'🌙' },
    '💃 舞蹈挑战':  { color:'#c62828', lightBg:'#ffebee', emoji:'💃' },
    '🧠 独立思考':  { color:'#4527a0', lightBg:'#ede7f6', emoji:'🧠' },
    '🪢 跳绳挑战':  { color:'#00695c', lightBg:'#e0f2f1', emoji:'🪢' },
    '🎤 演出里程碑':{ color:'#d84315', lightBg:'#fbe9e7', emoji:'🎤' },
    '🦕 特别自选':  { color:'#37474f', lightBg:'#eceff1', emoji:'🦕' },
  };

  let html = '';

  // ════════════════════════════════════════════════════════
  // 视图一：全部（主线岛 + 兴趣天地并列）
  // ════════════════════════════════════════════════════════
  // 视图：成长主线（Phase1/2/3）+ 末尾折叠兴趣支线
  // ════════════════════════════════════════════════════════
  if (view === 'all' || view === 'main') {
    html += `<div class="ac-island-wrap">
      <div class="ac-section-title">🗺️ 成长主线</div>`;
    [1,2,3].forEach(ph => {
      const cfg = phaseConfig[ph];
      const phCards = TASK_CARDS.filter(c => c.phase === ph);
      const doneCount = phCards.filter(c => {
        const d = Array.isArray(state.weeklyCardClaims[c.id]) ? state.weeklyCardClaims[c.id] : [];
        return d.length > 0;
      }).length;
      const isUnlocked = state.totalScore >= cfg.unlockAt;
      const progressPct = Math.round((doneCount / phCards.length) * 100);
      html += `
        <div class="ac-phase-block" style="border-left:4px solid ${cfg.color};background:${cfg.lightColor};">
          <div class="ac-phase-header">
            <div>
              <span class="ac-phase-label" style="color:${cfg.color}">${cfg.label}</span>
              <span class="ac-phase-sub">${cfg.sublabel}</span>
            </div>
            ${!isUnlocked
              ? `<div class="ac-lock-badge">🔒 ${cfg.unlockAt}分解锁</div>`
              : `<div class="ac-progress-bar"><div class="ac-progress-fill" style="width:${progressPct}%;background:${cfg.color}"></div></div>
                 <span class="ac-progress-label">${doneCount}/${phCards.length}</span>`
            }
          </div>
          ${isUnlocked
            ? cardsGridHTML(phCards)
            : `<div class="ac-fog-wrap">${cardsGridHTML(phCards)}<div class="ac-fog-mask"></div></div>`
          }
        </div>`;
    });
    html += `</div>`;

    // —— 末尾追加兴趣支线（折叠岛屿，默认折叠）——
    const interestCardsM = TASK_CARDS.filter(c => !c.phase);
    const interestGroupsM = {};
    interestCardsM.forEach(c => {
      if (!interestGroupsM[c.series]) interestGroupsM[c.series] = [];
      interestGroupsM[c.series].push(c);
    });
    html += `<div class="ac-island-wrap">
      <div class="ac-section-title" style="color:#666;font-size:13px;opacity:0.8;">🌈 兴趣支线天地</div>
      <div class="ac-islands-grid">`;
    Object.entries(interestGroupsM).forEach(([series, cards]) => {
      const cfg = interestIslandConfig[series] || { color:'#607d8b', lightBg:'#eceff1', emoji:'🎯' };
      const doneCount = cards.filter(c => {
        const d = Array.isArray(state.weeklyCardClaims[c.id]) ? state.weeklyCardClaims[c.id] : [];
        return d.length > 0;
      }).length;
      html += `
        <div class="ac-island" style="border-top:4px solid ${cfg.color};background:${cfg.lightBg};"
             onclick="toggleIsland(this)">
          <div class="ac-island-header">
            <span class="ac-island-emoji">${cfg.emoji}</span>
            <div class="ac-island-info">
              <span class="ac-island-name">${series}</span>
              <span class="ac-island-count">${cards.length}张 · 已完成${doneCount}张</span>
            </div>
            <span class="ac-island-arrow">▼</span>
          </div>
          <div class="ac-island-body" style="display:none;">
            ${cardsGridHTML(cards)}
          </div>
        </div>`;
    });
    html += `</div></div>`;
  }

  // ════════════════════════════════════════════════════════
  // 视图：兴趣支线（岛屿折叠）+ 末尾折叠成长主线
  // ════════════════════════════════════════════════════════
  else if (view === 'interest') {
    const interestCards = TASK_CARDS.filter(c => !c.phase);
    const interestGroups = {};
    interestCards.forEach(c => {
      if (!interestGroups[c.series]) interestGroups[c.series] = [];
      interestGroups[c.series].push(c);
    });
    html += `<div class="ac-island-wrap">
      <div class="ac-section-title">🌈 兴趣支线天地</div>
      <div class="ac-islands-grid">`;
    Object.entries(interestGroups).forEach(([series, cards]) => {
      const cfg = interestIslandConfig[series] || { color:'#607d8b', lightBg:'#eceff1', emoji:'🎯' };
      const doneCount = cards.filter(c => {
        const d = Array.isArray(state.weeklyCardClaims[c.id]) ? state.weeklyCardClaims[c.id] : [];
        return d.length > 0;
      }).length;
      html += `
        <div class="ac-island" style="border-top:4px solid ${cfg.color};background:${cfg.lightBg};"
             onclick="toggleIsland(this)">
          <div class="ac-island-header">
            <span class="ac-island-emoji">${cfg.emoji}</span>
            <div class="ac-island-info">
              <span class="ac-island-name">${series}</span>
              <span class="ac-island-count">${cards.length}张 · 已完成${doneCount}张</span>
            </div>
            <span class="ac-island-arrow">▼</span>
          </div>
          <div class="ac-island-body" style="display:none;">
            ${cardsGridHTML(cards)}
          </div>
        </div>`;
    });
    html += `</div></div>`;

    // —— 末尾追加成长主线（默认折叠）——
    html += `<div class="ac-island-wrap">
      <div class="ac-section-title" style="color:#666;font-size:13px;opacity:0.8;">🗺️ 成长主线</div>`;
    [1,2,3].forEach(ph => {
      const cfg = phaseConfig[ph];
      const phCards = TASK_CARDS.filter(c => c.phase === ph);
      const doneCount = phCards.filter(c => {
        const d = Array.isArray(state.weeklyCardClaims[c.id]) ? state.weeklyCardClaims[c.id] : [];
        return d.length > 0;
      }).length;
      const isUnlocked = state.totalScore >= cfg.unlockAt;
      const progressPct = Math.round((doneCount / phCards.length) * 100);
      html += `
        <div class="ac-phase-block" style="border-left:4px solid ${cfg.color};background:${cfg.lightColor};">
          <div class="ac-phase-header">
            <div>
              <span class="ac-phase-label" style="color:${cfg.color}">${cfg.label}</span>
              <span class="ac-phase-sub">${cfg.sublabel}</span>
            </div>
            ${!isUnlocked
              ? `<div class="ac-lock-badge">🔒 ${cfg.unlockAt}分解锁</div>`
              : `<div class="ac-progress-bar"><div class="ac-progress-fill" style="width:${progressPct}%;background:${cfg.color}"></div></div>
                 <span class="ac-progress-label">${doneCount}/${phCards.length}</span>`
            }
          </div>
          ${isUnlocked
            ? cardsGridHTML(phCards)
            : `<div class="ac-fog-wrap">${cardsGridHTML(phCards)}<div class="ac-fog-mask"></div></div>`
          }
        </div>`;
    });
    html += `</div>`;
  }

  // 写入内容区，保留 backBtn 不被清除
  const backBtn = document.getElementById('allCardsBackBtn');
  if (backBtn && grid.contains(backBtn)) {
    let cardsContent = document.getElementById('allCardsContent');
    if (!cardsContent) {
      cardsContent = document.createElement('div');
      cardsContent.id = 'allCardsContent';
      grid.appendChild(cardsContent);
    }
    cardsContent.innerHTML = html;
  } else {
    grid.innerHTML = html;
  }
}

// 兴趣岛屿折叠/展开
function toggleIsland(el) {
  const body = el.querySelector('.ac-island-body');
  const arrow = el.querySelector('.ac-island-arrow');
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  if (arrow) arrow.textContent = isOpen ? '▼' : '▲';
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

  // 检查本周是否已领取
  const weekStart = getWeekStart();
  if (state.weekStart !== weekStart) {
    state.weekStart = weekStart;
    state.weeklyCardClaims = {};
    state.weeklyCardCount = 0;
    state.weeklyAchievement = null;
    saveState();
  }
  // Phase1 英雄卡每天可领取一次，检查今天是否已领取；其他卡检查本周是否领取过
  const isHeroCardModal = card && card.phase === 1;
  const claimedDatesModal = Array.isArray(state.weeklyCardClaims[id]) ? state.weeklyCardClaims[id] : [];
  const claimedThisWeek = isHeroCardModal
    ? claimedDatesModal.includes(todayStr())   // Phase1：今天是否已领取
    : claimedDatesModal.length >= 1;            // 其他卡：本周是否领取过
  const alreadyPending = state.pendingAdditions.some(p => p.type === 'card' && p.taskId === id);
  const canClaim = unlocked && !claimedThisWeek && !alreadyPending;
  
  const btn = document.getElementById('btnCardClaim');
  btn.onclick = () => claimCardWithReport(id);
  btn.disabled = !canClaim;
  btn.style.opacity = canClaim ? '1' : '0.4';
  btn.textContent = claimedThisWeek ? (isHeroCardModal ? '✅ 今天已完成' : '✅ 本周已完成') : alreadyPending ? '⏳ 等待审核中' : unlocked ? '✅ 我完成了！领取积分' : '🔒 还没解锁';

  document.getElementById('cardModal').style.display = 'flex';
  window._currentCardId = id;
}

// 挑战卡领取入口：先弹自律弹窗，再执行 claimCard（带 isSelf）
function claimCardWithReport(id) {
  const card = TASK_CARDS.find(c => c.id === id);
  if (!card || !isCardUnlocked(card)) return;
  showSelfReportUnified(card.id, card.name, card.score, '🃏', (isSelf) => {
    claimCard(id, isSelf);
  });
}

function claimCard(id, isSelf) {
  const card = TASK_CARDS.find(c => c.id === id);
  if (!card || !isCardUnlocked(card)) return;
  
  // ── 防刷检查：每周英雄挑战卡可领取7次（每天1次），其他卡1次 ──
  const weekStart = getWeekStart();
  if (state.weekStart !== weekStart) {
    // 新的一周，重置周计数
    state.weekStart = weekStart;
    state.weeklyCardClaims = {};
    state.weeklyCardCount = 0;
    state.weeklyAchievement = null;
  }

  const isHeroCard = card.phase === 1;
  const maxClaims = isHeroCard ? 7 : 1;
  // weeklyCardClaims[id] 存的是已领取的日期数组
  const claimedDates = state.weeklyCardClaims[id] || [];
  if (claimedDates.length >= maxClaims) {
    if (isHeroCard) {
      showCelebration('🏆', '本周7次全完成！', `「${card.name}」这周每天都完成啦！下周继续加油！🎯`);
    } else {
      showCelebration('🚫', '本周已领取！', `「${card.name}」本周完成过了，下周再来挑战其他卡吧！🎯`);
    }
    return;
  }
  
  // 检查是否在待审核列表中已有该卡（防止重复提交）
  const alreadyPending = state.pendingAdditions.some(p => p.type === 'card' && p.taskId === id);
  if (alreadyPending) {
    showCelebration('⏳', '正在审核中！', `「${card.name}」已经在等爸爸妈妈审核了，耐心等待哦！`);
    return;
  }
  
  // ── 正常领取逻辑 ──
  const today = todayStr();
  // weeklyCardClaims[id] 存的是日期字符串数组，同一天不重复追加
  const existing = state.weeklyCardClaims[id] || [];
  if (!existing.includes(today)) {
    state.weeklyCardClaims[id] = [...existing, today];
  }
  state.cardClaims[id] = (state.cardClaims[id] || 0) + 1;
  state._weeklyCardOpen = null; // 清除本周战报展开状态
  // 周度成就计数（每张卡首次领取时+1，同一张卡多次领取不重复计数）
  if (existing.length === 0) {
    state.weeklyCardCount = (state.weeklyCardCount || 0) + 1;
  }
  // 阅读卡联动：每次领取阅读系列卡累计readCount
  if (card.series && card.series.includes('阅读')) {
    state.readCount = (state.readCount || 0) + 1;
  }
  // 走本地 pendingAdditions（与早晨包/睡前包一致）
  state.pendingAdditions.push({
    type: 'card',
    taskId: id,
    name: card.name,
    icon: card.stars ? '🃏' : '🎴',
    score: card.score,
    date: today,
    isSelf: isSelf
  });
  // 添加到 todayChecked，让 calcTodayScore 能统计（审核通过后改为 'approved'，驳回时删除）
  state.todayChecked[id] = 'pending';
  // 先加积分（审核驳回时再扣）
  state.totalScore += card.score;
  // 分类积分（用于阶段勋章进度条）
  if (card.recommendType) {
    if (!state.categoryPoints) state.categoryPoints = {};
    state.categoryPoints[card.recommendType] = (state.categoryPoints[card.recommendType] || 0) + card.score;
  }
  saveState();
  // 迷宫骑士移动到该节点
  const nodeForCard = findMazeNodeByCardId(id);
  if (nodeForCard) {
    // 延迟等模态框关闭后再动；mazeKnightNode 由 moveKnight 动画结束时更新
    setTimeout(() => {
      moveKnight(nodeForCard, () => {
        saveState();
        checkPhaseFogReveal();
        updateMazeGuidance();
      });
    }, 400);
  }
  // 同步到 Firebase（同时走 submitPending，让爸妈能在 Firebase 后台看到）
  if (window._firebaseReady) {
    submitPending('card', id, card.name, card.score, '', isSelf);
    window._firebaseGet(window._firebaseRef(window._firebaseDB, 'syncScore')).then(snap => {
      window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore'), (snap.val() || 0) + card.score);
    });
  }
  closeModal('cardModal');
  renderAll();
  // 检查周度成就升级
  const newAch = WEEKLY_ACHIEVEMENTS.slice().reverse().find(a => state.weeklyCardCount >= a.minCards);
  if (newAch && newAch.id !== state.weeklyAchievement) {
    state.weeklyAchievement = newAch.id;
    saveState();
    setTimeout(() => showCelebration(newAch.icon, `${newAch.level}成就！`, `本周完成${state.weeklyCardCount}张任务卡！周末结算+${newAch.bonusScore}分！`, newAch.bonusScore), 800);
  } else {
    showCelebration('⏳', `「${card.name}」已申请！`, `等爸爸妈妈审核后 +${card.score}分入账！`, card.score);
  }
}

// ── 渲染商店 ───────────────────────────────────────────────────
function renderShop() {
  document.getElementById('shopScore').textContent = state.totalScore;
  // 渲染像素勋章墙
  renderPixelMedalWall();
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

  // 里程碑入口提示（跳绳里程碑已并入英雄挑战卡）
  const mEl = document.getElementById('ropeMilestones');
  mEl.innerHTML = `
    <div class="rope-milestone-hint">
      <div style="font-size:1rem;font-weight:600;color:#E53935;margin-bottom:6px;">🏅 跳绳里程碑奖励在英雄挑战卡里！</div>
      <div style="font-size:0.85rem;color:#888;">去「英雄挑战卡」页面，领取对应跳绳挑战卡的奖励！</div>
    </div>
  `;

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
    // 里程碑奖励改为挑战卡领取（rope1-5），此处只刷新卡片解锁状态
    saveState();
    // 检查是否有新的里程碑卡片解锁，显示提示
    const newlyUnlocked = [];
    ROPE_MILESTONES.forEach(m => {
      if (val >= m.target && prev < m.target) {
        newlyUnlocked.push(m.target);
      }
    });
    if (newlyUnlocked.length > 0) {
      setTimeout(() => {
        showCelebration('🪢', `新里程碑解锁！`, `去英雄挑战卡领取对应奖励！`);
      }, 500);
    }
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
  renderDisciplineBar();
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

// ── 简单提示 Toast ─────────────────────────────────────────────
function showToast(msg, duration) {
  const existing = document.getElementById('toastMsg');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'toastMsg';
  toast.style.cssText = `
    position:fixed;top:80px;left:50%;transform:translateX(-50%);
    background:rgba(0,0,0,0.8);color:#fff;padding:12px 24px;border-radius:20px;
    font-size:14px;z-index:99999;opacity:0;transition:opacity 0.3s;
    pointer-events:none;white-space:nowrap;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.style.opacity = '1');
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration || 2000);
}

// ── 庆祝弹窗 ───────────────────────────────────────────────────
function showCelebration(emoji, title, desc, score = 0) {
  const modal = document.getElementById('celebModal');
  const emojiEl = document.getElementById('celebEmoji');
  const titleEl = document.getElementById('celebTitle');
  const descEl = document.getElementById('celebDesc');
  
  // 重置动画类
  const content = modal.querySelector('.modal-box');
  content.classList.remove('celeb-modal-content');
  emojiEl.classList.remove('celeb-emoji-anim');
  titleEl.classList.remove('celeb-title-anim');
  descEl.classList.remove('celeb-desc-anim');
  
  // 设置内容
  emojiEl.textContent = emoji;
  titleEl.textContent = title;
  descEl.textContent = desc;
  
  // 触发重绘以重置动画
  void modal.offsetWidth;
  
  // 添加动画类
  content.classList.add('celeb-modal-content');
  emojiEl.classList.add('celeb-emoji-anim');
  titleEl.classList.add('celeb-title-anim');
  descEl.classList.add('celeb-desc-anim');
  
  // 显示弹窗
  modal.style.display = 'flex';
  
  // 启动彩纸粒子效果
  createConfetti(30);
  
  // 分数飞入动画
  if (score > 0) {
    setTimeout(() => flyScore(score), 400);
  }
  
  // 3秒自动关闭
  setTimeout(() => closeModal('celebModal'), 3500);
}

// ── 彩纸粒子效果 ──────────────────────────────────────────────
function createConfetti(count = 30) {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  container.id = 'confettiContainer';
  document.body.appendChild(container);
  
  const colors = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFD700', '#FF69B4', '#9B59B6'];
  const shapes = ['confetti-circle', 'confetti-square', 'confetti-star'];
  
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      
      confetti.className = `confetti ${shape}`;
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.backgroundColor = color;
      confetti.style.width = (8 + Math.random() * 12) + 'px';
      confetti.style.height = confetti.style.width;
      confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
      confetti.style.animationDelay = Math.random() * 0.5 + 's';
      
      container.appendChild(confetti);
    }, i * 30);
  }
  
  // 清理粒子
  setTimeout(() => container.remove(), 4000);
}

// ── 星星爆炸效果 ───────────────────────────────────────────────
function createStarBurst(x, y, count = 8) {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  container.style.zIndex = '10002';
  document.body.appendChild(container);
  
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.className = 'star-burst';
    star.innerHTML = '⭐';
    star.style.left = x + 'px';
    star.style.top = y + 'px';
    star.style.fontSize = (16 + Math.random() * 12) + 'px';
    star.style.transform = `rotate(${i * (360 / count)}deg) translateX(${40 + Math.random() * 30}px)`;
    
    container.appendChild(star);
  }
  
  setTimeout(() => container.remove(), 1000);
}

// ── 分数飞入动画 ───────────────────────────────────────────────
function flyScore(score) {
  const scoreEl = document.createElement('div');
  scoreEl.className = 'score-fly';
  scoreEl.textContent = `+${score}分`;
  scoreEl.style.left = '50%';
  scoreEl.style.top = '40%';
  scoreEl.style.transform = 'translateX(-50%)';
  
  document.body.appendChild(scoreEl);
  
  // 添加分数到弹窗
  setTimeout(() => {
    const descEl = document.getElementById('celebDesc');
    if (descEl && !descEl.textContent.includes('+')) {
      descEl.innerHTML += `<span class="score-counter" style="color:#FFD700;font-weight:900;margin-left:8px">+${score}</span>`;
    }
  }, 600);
  
  setTimeout(() => scoreEl.remove(), 1500);
}

// ── 宝箱开箱动画 ───────────────────────────────────────────────
function animateTreasureOpen(nodeElement) {
  if (!nodeElement) return;
  
  // 添加开箱动画类
  nodeElement.classList.add('treasure-chest-opening');
  
  // 添加发光效果
  const glow = document.createElement('div');
  glow.className = 'chest-glow';
  glow.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,215,0,0.6) 0%, transparent 70%);
    pointer-events: none;
  `;
  nodeElement.style.position = 'relative';
  nodeElement.appendChild(glow);
  
  // 3秒后移除
  setTimeout(() => {
    nodeElement.classList.remove('treasure-chest-opening');
    glow.remove();
  }, 2000);
}

// ── 阶段升级大型庆祝 ───────────────────────────────────────────
function showPhaseUpgrade(phaseName, phaseEmoji) {
  // 创建全屏覆盖
  const overlay = document.createElement('div');
  overlay.className = 'phase-upgrade-overlay';
  overlay.id = 'phaseUpgradeOverlay';
  
  overlay.innerHTML = `
    <div class="phase-upgrade-content">
      <div class="phase-title rainbow-text">🎊 阶段升级！🎊</div>
      <div class="phase-subtitle">${phaseEmoji} ${phaseName}</div>
      <div style="font-size:48px;margin:20px 0">🏆</div>
      <button class="btn-primary celeb-btn-bounce" onclick="closePhaseUpgrade()" style="background:linear-gradient(135deg,#FFD700,#FFA500);font-size:18px;padding:15px 40px">
        继续探险！
      </button>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // 启动大量彩纸
  createConfetti(60);
  createConfetti(40);
  
  // 5秒后自动关闭
  setTimeout(() => closePhaseUpgrade(), 5000);
}

function closePhaseUpgrade() {
  const overlay = document.getElementById('phaseUpgradeOverlay');
  if (overlay) {
    overlay.style.animation = 'phase-fade-in 0.3s ease-out reverse';
    setTimeout(() => overlay.remove(), 300);
  }
}

// ── 脉冲光环效果 ───────────────────────────────────────────────
function createPulseRing(x, y, color = '#FFD700') {
  const ring = document.createElement('div');
  ring.className = 'pulse-ring';
  ring.style.left = x + 'px';
  ring.style.top = y + 'px';
  ring.style.borderColor = color;
  
  document.body.appendChild(ring);
  
  setTimeout(() => ring.remove(), 1000);
}

// ── 积分变化动画 ───────────────────────────────────────────────
function animateScoreChange(oldScore, newScore) {
  const scoreEl = document.getElementById('totalScoreDisplay');
  if (!scoreEl) return;
  
  const diff = newScore - oldScore;
  if (diff <= 0) return;
  
  // 添加弹跳效果
  scoreEl.classList.add('score-counter');
  
  // 数字动画
  let current = oldScore;
  const step = Math.ceil(diff / 10);
  const interval = setInterval(() => {
    current = Math.min(current + step, newScore);
    scoreEl.textContent = current;
    
    if (current >= newScore) {
      clearInterval(interval);
      setTimeout(() => scoreEl.classList.remove('score-counter'), 300);
    }
  }, 50);
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
    const all = [...DAILY_FIXED, ...DAILY_OPTIONAL, ...DAILY_HOMEWORK, ...DAILY_TEMP_TASKS];
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
      // 如果切换到父母审核 tab，且已登录，则刷新待审列表
      if (tab === 'parent' && typeof currentParent !== 'undefined' && currentParent) {
        if (typeof loadPendingList === 'function') loadPendingList();
        if (typeof loadReviewedList === 'function') loadReviewedList();
      }
    });
  });

  // 筛选按钮
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCardView = btn.dataset.filter;
      renderCards();
    });
  });

  // 重置今日
  document.getElementById('btnResetDay').addEventListener('click', () => {
    if (confirm('确定开始新的一天？今日打卡记录将重置。')) {
      const today = todayStr();

      // 计算今日已入账积分（需从 totalScore 中扣减）
      const taskScore = Object.keys(state.todayChecked).reduce((sum, id) => {
        const all = [...DAILY_FIXED, ...DAILY_OPTIONAL, ...DAILY_HOMEWORK];
        const t = all.find(x => x.id === id);
        return sum + (t ? t.score : 0);
      }, 0);
      const pendingScore = (state.pendingAdditions || [])
        .filter(p => p.date === today)
        .reduce((sum, p) => sum + (p.score || 0), 0);
      const deductToday = taskScore + pendingScore;

      // 扣减累计积分
      state.totalScore = Math.max(0, state.totalScore - deductToday);
      // 同步 Firebase syncScore
      if (window._firebaseReady) {
        window._firebaseGet(window._firebaseRef(window._firebaseDB, 'syncScore')).then(snap => {
          window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore'), Math.max(0, (snap.val() || 0) - deductToday));
        });
      }

      // 重置所有状态
      state.todayChecked = {};
      state.morningPack = {};
      state.nightPack = {};
      state.morningPackBonus = false;
      state.nightPackBonus = false;
      state.hwCompleted = false;
      state.hwBlocks = 0;
      state.pendingAdditions = [];
      state.selfReport = {};
      // 同步清除 Firebase 上当天的 pending 记录
      if (window._firebaseReady && typeof clearPendingByDate === 'function') {
        clearPendingByDate(today);
      }
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

// ── 本周战报：展开/收起英雄挑战卡 ─────────────────────────────
function toggleWeeklyCard(id) {
  if (state._weeklyCardOpen === id) {
    state._weeklyCardOpen = null; // 再次点击收起
  } else {
    state._weeklyCardOpen = id;   // 展开该卡，收起其他
  }
  // 仅重新渲染卡片区
  const cardsDiv = document.getElementById('weeklyCards');
  if (!cardsDiv) return;
  const p1Cards = TASK_CARDS.filter(c => c.phase === 1 && isCardUnlocked(c));
  if (p1Cards.length === 0) {
    cardsDiv.innerHTML = '<div style="text-align:center;color:#aaa;padding:16px;font-size:0.85rem;">🎉 今日挑战已完成！</div>';
    return;
  }
  cardsDiv.innerHTML = p1Cards.map(c => renderWeeklyCard(c)).join('');
}

// ── 本周打卡槽位辅助函数 ──────────────────────────────────────
// 返回本周7天（周一~周日）的日期字符串数组
function getWeekDays() {
  const now = new Date();
  const day = now.getDay(); // 0=周日
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d.toISOString().split('T')[0]); // YYYY-MM-DD
  }
  return days;
}

// 返回指定卡本周各天的领取状态
// status: 'done' | 'today' | 'future' | 'empty'（过去未完成=empty）
function getCardWeeklySlots(cardId) {
  const weekDays = getWeekDays(); // ['2026-04-06','2026-04-07',...]
  const today = todayStr();
  const claimed = state.weeklyCardClaims[cardId] || []; // 本周已领取的日期数组
  return weekDays.map(day => {
    if (claimed.includes(day)) return { day, status: 'done' };
    if (day === today)         return { day, status: 'today' };
    if (day > today)           return { day, status: 'future' };
    return { day, status: 'empty' }; // 过去的空白天（不应出现）
  });
}

// 渲染本周战报中单张英雄挑战卡（被 toggleWeeklyCard 和 renderWeekly 共用）
function renderWeeklyCard(c) {
  const card = c;
  const slots = getCardWeeklySlots(card.id);
  const doneCount = slots.filter(s => s.status === 'done').length;
  const allDone = doneCount >= 7;
  const todaySlot = slots.find(s => s.day === todayStr());
  const open = state._weeklyCardOpen === card.id && !allDone;
  const canClaimToday = todaySlot && todaySlot.status === 'today';
  const dayLabels = ['周一','周二','周三','周四','周五','周六','周日'];

  // ── 打卡槽位HTML ──
  const slotsHtml = allDone
    ? `<div style="text-align:center;padding:10px 0">
         <div style="font-size:1.5rem">🏆</div>
         <div style="font-size:0.8rem;color:#06D6A0;font-weight:700">本周7次全部完成！等下周刷新~</div>
       </div>`
    : `<div style="display:flex;gap:4px;flex-wrap:wrap;padding:6px 2px">
         ${slots.map((s, i) => {
           const lbl = dayLabels[i];
           if (s.status === 'done') {
             return `<div style="flex:1;min-width:36px;text-align:center;padding:5px 2px;border-radius:8px;background:#06D6A0;color:#fff;font-size:0.68rem;font-weight:700">${lbl}<br>✅</div>`;
           } else if (s.status === 'today') {
             return `<div onclick="event.stopPropagation();toggleWeeklyCard('${card.id}')" style="flex:1;min-width:36px;text-align:center;padding:5px 2px;border-radius:8px;background:#FFF3CD;border:2px solid #F9A825;color:#7a5c00;font-size:0.68rem;font-weight:700;cursor:pointer;animation:pulse 1.5s infinite">${lbl}<br>▶</div>`;
           } else {
             return `<div style="flex:1;min-width:36px;text-align:center;padding:5px 2px;border-radius:8px;background:#f0f0f0;color:#bbb;font-size:0.68rem;font-weight:700">${lbl}<br>🔒</div>`;
           }
         }).join('')}
       </div>`;

  const bg = allDone ? '#EDFFF9' : (open ? '#EEF6FF' : '#F8F9FF');
  const border = allDone ? '#06D6A0' : card.color;

  return `
  <div id="wcard-${card.id}" style="margin-bottom:12px;border-radius:14px;background:${bg};border-left:5px solid ${border};overflow:hidden;transition:all 0.2s">
    <div onclick="${allDone?'':`toggleWeeklyCard('${card.id}')`}" style="padding:12px;display:flex;align-items:center;gap:10px;cursor:${allDone?'default':'pointer'}">
      <span style="font-size:1.3rem">${card.stars}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:0.9rem;font-weight:600;color:${allDone?'#06D6A0':'#333'}">${card.name}</div>
        <div style="font-size:0.75rem;color:#999">${card.sub}</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:0.9rem;font-weight:700;color:#F9A825">+${card.score}分</div>
        ${!allDone ? `<div style="font-size:0.7rem;color:#aaa;margin-top:2px">${doneCount}/7天</div>` : ''}
      </div>
    </div>
    ${slotsHtml}
    ${open && canClaimToday ? `
    <div style="padding:0 12px 12px;border-top:1px dashed #e0e0e0">
      <div style="display:flex;align-items:flex-start;gap:6px;margin-top:10px">
        <div style="font-size:0.88rem;color:#555;line-height:1.6;flex:1">${card.desc}</div>
        <button class="speak-btn" title="点我听任务" onclick="event.stopPropagation();speakText('${card.desc.replace(/'/g,"\'")}',this)" style="background:none;border:none;font-size:1rem;cursor:pointer;flex-shrink:0;margin-top:2px">🔈</button>
      </div>
      ${card.tip ? `<div style="margin-top:8px;background:#fffbe6;border-radius:8px;padding:8px 12px;font-size:0.83rem;color:#7a5c00;white-space:pre-line">💡 ${card.tip}</div>` : ''}
      <button onclick="claimCardWithReport('${card.id}')" style="margin-top:10px;width:100%;padding:10px;border:none;border-radius:10px;background:linear-gradient(135deg,#06D6A0,#00C9A7);color:#fff;font-size:0.95rem;font-weight:600;cursor:pointer;box-shadow:0 2px 8px rgba(6,214,160,0.3)">
        ✅ 我完成了！点亮今天 +${card.score}分
      </button>
    </div>` : ''}
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

  // ── 分类积分进度条（阶段勋章进度）──────────────────────────
  const catBarsEl = document.getElementById('categoryProgressBars');
  if (catBarsEl) {
    const cp = state.categoryPoints || {};
    // 阶段勋章对应分类：focus≥30, plan≥30, reflect≥20
    const catMeta = [
      { key:'focus',   icon:'🎯', name:'专注力', target:30, color:'#E53935' },
      { key:'plan',    icon:'📅', name:'计划性', target:30, color:'#8E24AA' },
      { key:'reflect', icon:'🪞', name:'回顾小达人', target:20, color:'#00897B' },
    ];
    catBarsEl.innerHTML = `
      <div style="background:#F8F9FF;border-radius:14px;padding:12px 14px;margin-bottom:12px;">
        <div style="font-size:0.8rem;font-weight:700;color:#888;margin-bottom:8px;display:flex;align-items:center;gap:6px;">🏆 阶段勋章进度
          <button class="speak-btn" title="点我听说明" onclick="event.stopPropagation();speakText('这里是阶段勋章进度！你完成不同类型的任务会获得不同颜色的能量条。专注力任务获得红色能量，计划性任务获得紫色能量，回顾小达人任务获得青色能量。每个能量条攒满就能获得对应勋章！',this)" style="background:none;border:none;font-size:1rem;cursor:pointer;vertical-align:middle">🔈</button>
        </div>
        ${catMeta.map(cat => {
          const val = cp[cat.key] || 0;
          const pct = Math.min(100, Math.round(val / cat.target * 100));
          const done = val >= cat.target;
          return `<div style="margin-bottom:6px;">
            <div style="display:flex;justify-content:space-between;font-size:0.78rem;margin-bottom:3px;">
              <span>${cat.icon} ${cat.name}</span>
              <span style="color:${done?'#06D6A0':cat.color};font-weight:600;">${val}/${cat.target}${done?' ✅':''}</span>
            </div>
            <div style="background:#e0e0e0;border-radius:6px;height:6px;">
              <div style="background:${done?'#06D6A0':cat.color};border-radius:6px;height:6px;width:${pct}%;transition:width 0.4s;"></div>
            </div>
          </div>`;
        }).join('')}
      </div>
    `;
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
  const cardsDone = state.weeklyCardCount || 0;
  const wsEl = document.getElementById('weeklyTotalScore');
  if (wsEl) wsEl.textContent = score;
  const wdEl = document.getElementById('weeklyTaskDone');
  if (wdEl) wdEl.textContent = checkedToday;
  const wcEl = document.getElementById('weeklyCardDone');
  if (wcEl) wcEl.textContent = cardsDone;

  // ── 英雄挑战卡（仅Phase1，可展开）────────────────────────────
  // 在 section title 旁注入语音引导按钮（孩子不认识字，需要听）
  const weeklySectionTitle = document.querySelector('.weekly-section-title');
  if (weeklySectionTitle && !weeklySectionTitle.querySelector('.speak-btn')) {
    const safeText = '这里是本周英雄挑战！这些是你每天都会遇到的挑战卡，每天都能完成一次，这周最多可以完成七次哦！点击卡片展开，看看是什么任务，完成后就能领取分数！';
    const btn = document.createElement('button');
    btn.className = 'speak-btn';
    btn.title = '点我听任务说明';
    btn.style.cssText = 'margin-left:6px;background:none;border:none;font-size:1rem;cursor:pointer;vertical-align:middle';
    btn.onclick = function(e) { e.stopPropagation(); speakText(safeText, btn); };
    btn.textContent = '🔈';
    weeklySectionTitle.appendChild(btn);
  }

  const cardsDiv = document.getElementById('weeklyCards');
  if (cardsDiv) {
    const p1Cards = TASK_CARDS.filter(c => c.phase === 1 && isCardUnlocked(c));
    if (p1Cards.length === 0) {
      cardsDiv.innerHTML = '<div style="text-align:center;color:#aaa;padding:16px;font-size:0.85rem;">🎉 今日挑战已完成！</div>';
    } else {
      cardsDiv.innerHTML = p1Cards.map(c => renderWeeklyCard(c)).join('');
    }
  }

  // ── 积分兑换目标 ────────────────────────────────────────────
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
          <div class="wshop-row can-buy" style="cursor:pointer" onclick="redeemItem('${item.id}','${item.name}',${item.cost},${!!item.isEgg});renderWeekly();">
            <span class="wshop-icon">${item.icon}</span>
            <div class="wshop-info">
              <div class="wshop-name">${item.name}</div>
              <div class="wshop-type" style="color:${item.typeColor}">${item.type}</div>
            </div>
            <div class="wshop-right">
              <div class="wshop-cost">${item.cost}分</div>
              <div class="wshop-badge can">✅ 点击兑换</div>
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


// [showSelfReportModal/submitSelfReport 已合并入 showSelfReportUnified]

// ── 月度自律率计算 ─────────────────────────────────────────────
function calcMonthlyDisciplineRate(year, month) {
  if (!state.selfReport) return { rate: 0, selfDays: 0, totalDays: 0 };
  const prefix = `${year}-${String(month).padStart(2,'0')}`;

  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const isCurrentMonth = (today.getFullYear() === year && today.getMonth() + 1 === month);
  const lastDay = isCurrentMonth ? today.getDate() : daysInMonth;

  // 每天：固定任务≥65%且全部self
  const dayBy65 = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${prefix}-${String(d).padStart(2,'0')}`;
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
    const dateStr = `${prefix}-${String(d).padStart(2,'0')}`;
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
}

// ── B类奖励解锁判断 ───────────────────────────────────────────

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
      <div style="margin-top:6px;font-size:0.78rem;color:#aaa;">
        达成条件：固定任务≥65%全自主 或 连续7天每天自主完成任务
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


/* ══════════════════════════════════════════════════════════════
   🏆 勋章体系 v1.0（测试版）
   三层结构：阶段勋章 + 分类勋章 + 坚持勋章
══════════════════════════════════════════════════════════════ */

// ── 勋章数据定义 ──────────────────────────────────────────────
const MEDALS = [
  // 【阶段勋章】3个
  { id:'phase1', icon:'🥉', name:'专注小英雄', category:'phase',
    desc:'专注类积分达到30分', bonus:50,
    check: s => (s.categoryPoints?.focus||0) >= 30 },
  { id:'phase2', icon:'🥈', name:'计划小达人', category:'phase',
    desc:'计划类积分达到30分', bonus:50,
    check: s => (s.categoryPoints?.plan||0) >= 30 },
  { id:'phase3', icon:'🥇', name:'自我英雄', category:'phase',
    desc:'复盘类积分达到20分', bonus:50,
    check: s => (s.categoryPoints?.reflect||0) >= 20 },

  // 【分类勋章】8个
  { id:'cat_focus', icon:'🎯', name:'专注小苗', category:'cat',
    cat:'focus', desc:'完成第一张专注挑战卡', bonus:15,
    check: s => Object.keys(s.cardClaims||{}).some(id => {
      const c = TASK_CARDS.find(tc => tc.id === id);
      return c && c.recommendType === 'focus' && s.cardClaims[id] > 0;
    }) },
  { id:'cat_habit', icon:'🌟', name:'自律小标兵', category:'cat',
    cat:'habit', desc:'连续7天完成早晨英雄包', bonus:15,
    check: s => (s.streaks?.morning?.count||0) >= 7 },
  { id:'cat_plan', icon:'📅', name:'计划小能人', category:'cat',
    cat:'plan', desc:'完成第一张计划挑战卡', bonus:15,
    check: s => Object.keys(s.cardClaims||{}).some(id => {
      const c = TASK_CARDS.find(tc => tc.id === id);
      return c && c.recommendType === 'plan' && s.cardClaims[id] > 0;
    }) },
  { id:'cat_challenge', icon:'💪', name:'挑战小勇士', category:'cat',
    cat:'challenge', desc:'本周完成3张挑战卡', bonus:15,
    check: s => (s.weeklyCardCount||0) >= 3 },
  { id:'cat_reflect', icon:'🪞', name:'反思小智者', category:'cat',
    cat:'reflect', desc:'完成第一张复盘卡', bonus:15,
    check: s => Object.keys(s.cardClaims||{}).some(id => {
      const c = TASK_CARDS.find(tc => tc.id === id);
      return c && c.recommendType === 'reflect' && s.cardClaims[id] > 0;
    }) },
  { id:'cat_creative', icon:'🎨', name:'创意小艺术家', category:'cat',
    cat:'creative', desc:'完成第一张创意挑战卡', bonus:15,
    check: s => Object.keys(s.cardClaims||{}).some(id => {
      const c = TASK_CARDS.find(tc => tc.id === id);
      return c && c.recommendType === 'creative' && s.cardClaims[id] > 0;
    }) },
  { id:'cat_read', icon:'📚', name:'阅读小博士', category:'cat',
    cat:'read', desc:'累计完成10次阅读挑战', bonus:15,
    check: s => (s.readCount||0) >= 10 },
  { id:'cat_sport', icon:'🪢', name:'运动小健将', category:'cat',
    cat:'sport', desc:'跳绳连续7天打卡', bonus:15,
    check: s => (s.ropeStreak?.count||0) >= 7 },

  // 【坚持勋章】6个
  { id:'streak_3', icon:'🔥', name:'点火仪式', category:'streak',
    desc:'连续3天打卡', bonus:5,
    check: s => Object.values(s.streaks||{}).some(st => st.count >= 3) },
  { id:'streak_7', icon:'🔥', name:'小火苗', category:'streak',
    desc:'连续7天打卡', bonus:10,
    check: s => Object.values(s.streaks||{}).some(st => st.count >= 7) },
  { id:'streak_14', icon:'🔥', name:'熊熊火焰', category:'streak',
    desc:'连续14天打卡', bonus:20,
    check: s => Object.values(s.streaks||{}).some(st => st.count >= 14) },
  { id:'streak_30', icon:'🔥', name:'燎原之势', category:'streak',
    desc:'连续30天打卡', bonus:50,
    check: s => Object.values(s.streaks||{}).some(st => st.count >= 30) },
  { id:'morning_7', icon:'🌅', name:'早起鸟', category:'streak',
    desc:'连续7天完成早晨英雄包', bonus:15,
    check: s => (s.streaks?.morning?.count||0) >= 7 },
  { id:'night_7', icon:'🌙', name:'准时入睡', category:'streak',
    desc:'连续7天完成睡前英雄包', bonus:15,
    check: s => (s.streaks?.night?.count||0) >= 7 },
];

// ── 勋章弹窗 ──────────────────────────────────────────────────
// ── 像素勋章墙（嵌入宝藏屋 Tab）────────────────────────────────
function showMedalsModal() {
  // 兼容旧调用方式：直接渲染到宝藏屋内
  renderPixelMedalWall();
}

function renderPixelMedalWall() {
  const medalClaims = state.medalClaims || {};
  const totalMedals = MEDALS.length;
  const earnedCount = Object.keys(medalClaims).filter(id => medalClaims[id]).length;

  const phaseMedals  = MEDALS.filter(m => m.category === 'phase');
  const catMedals    = MEDALS.filter(m => m.category === 'cat');
  const streakMedals = MEDALS.filter(m => m.category === 'streak');

  // 更新计数徽章
  const badge = document.getElementById('medalCountBadge');
  if (badge) badge.textContent = `${earnedCount}/${totalMedals}`;

  const wall = document.getElementById('pixelMedalWall');
  if (!wall) return;

  wall.innerHTML = `
    <div class="medal-group-header medal-group-phase">🏆 成长阶段勋章</div>
    <div class="medal-grid">
      ${phaseMedals.map(m => renderPixelMedalCard(m, medalClaims)).join('')}
    </div>
    <div class="medal-group-header medal-group-cat">🎯 技能分类勋章</div>
    <div class="medal-grid">
      ${catMedals.map(m => renderPixelMedalCard(m, medalClaims)).join('')}
    </div>
    <div class="medal-group-header medal-group-streak">🔥 坚持连击勋章</div>
    <div class="medal-grid">
      ${streakMedals.map(m => renderPixelMedalCard(m, medalClaims)).join('')}
    </div>
  `;
}

function renderPixelMedalCard(medal, medalClaims) {
  const earned    = !!(medalClaims && medalClaims[medal.id]);
  const unlocked  = medal.check(state);
  const canClaim  = unlocked && !earned;

  let stateClass, badgeClass, badgeText, iconContent;
  if (earned) {
    stateClass  = 'mc-earned';
    badgeClass  = 'mc-badge-earned';
    badgeText   = '已获得';
    iconContent = medal.icon;
  } else if (canClaim) {
    stateClass  = 'mc-claimable';
    badgeClass  = 'mc-badge-claim';
    badgeText   = '可领取';
    iconContent = medal.icon;
  } else {
    stateClass  = 'mc-locked';
    badgeClass  = 'mc-badge-locked';
    badgeText   = '未解锁';
    iconContent = '🔒';
  }

  return `
    <div class="medal-card" onclick="showPixelMedalDetail('${medal.id}')">
      <div class="mc-inner ${stateClass}">
        <span class="mc-icon">${iconContent}</span>
        <span class="mc-name">${medal.name}</span>
        <span class="mc-badge ${badgeClass}">${badgeText}</span>
      </div>
    </div>`;
}

// 兼容旧函数名
function renderMedalItem(medal, medalClaims) {
  return renderPixelMedalCard(medal, medalClaims);
}

function showPixelMedalDetail(medalId) {
  const medal = MEDALS.find(m => m.id === medalId);
  if (!medal) return;
  const medalClaims = state.medalClaims || {};
  const earned   = !!(medalClaims[medal.id]);
  const unlocked = medal.check(state);
  const canClaim = unlocked && !earned;

  // 移除已有详情
  const old = document.getElementById('pixelDetailOverlay');
  if (old) old.remove();

  let statusText, statusClass;
  if (earned) {
    statusText  = '✅ 已获得';
    statusClass = 'mds-earned';
  } else if (canClaim) {
    statusText  = '✨ 可领取';
    statusClass = 'mds-claimable';
  } else {
    statusText  = '🔒 未解锁';
    statusClass = 'mds-locked';
  }

  const overlay = document.createElement('div');
  overlay.id = 'pixelDetailOverlay';
  overlay.className = 'medal-detail-overlay';
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  overlay.innerHTML = `
    <div class="medal-detail-card">
      <div class="medal-detail-handle"></div>
      <div class="medal-detail-icon">${unlocked ? medal.icon : '🔒'}</div>
      <div class="medal-detail-name">${medal.name}</div>
      <div class="medal-detail-desc">${medal.desc}</div>
      <div class="medal-detail-bonus">奖励 +${medal.bonus} 积分</div>
      <div class="medal-detail-status ${statusClass}">${statusText}</div>
      ${canClaim ? `
        <button class="medal-btn-claim" onclick="claimMedal('${medal.id}');document.getElementById('pixelDetailOverlay').remove();">
          🏆 领取勋章
        </button>
      ` : ''}
      <button class="medal-btn-close" onclick="document.getElementById('pixelDetailOverlay').remove()">
        ${earned ? '收好啦 ✓' : '知道了'}
      </button>
    </div>`;

  document.body.appendChild(overlay);
}

// 兼容旧函数名
function showMedalDetail(medalId) {
  showPixelMedalDetail(medalId);
}

function closeMedalDetail() {
  const el = document.getElementById('pixelDetailOverlay');
  if (el) el.remove();
}

function claimMedal(medalId) {
  const medal = MEDALS.find(m => m.id === medalId);
  if (!medal) return;
  if (!state.medalClaims) state.medalClaims = {};
  if (state.medalClaims[medalId]) return; // 已领取
  if (!medal.check(state)) return; // 未解锁

  // 领取勋章
  state.medalClaims[medalId] = Date.now();
  state.totalScore += medal.bonus;
  saveState();

  // 显示领取成功
  showToast(`🏆 获得「${medal.name}」！+${medal.bonus}分`, 'success');

  // 刷新像素勋章墙
  renderPixelMedalWall();
}

function closeMedalsModal() {
  // 勋章已嵌入宝藏屋，无需关闭弹窗；保留函数以向前兼容
  const modal = document.getElementById('medalsModal');
  if (modal) document.body.removeChild(modal);
}

// ── 渲染任务卡 ─────────────────────────────────────────────────