/* ══════════════════════════════════════════════════════════════
   英雄成长计划 · 主逻辑
══════════════════════════════════════════════════════════════ */

// ── Service Worker 更新检测 ──────────────────────────────────
if ('serviceWorker' in navigator) {
  // 监听 SW 消息：新版本激活时自动刷新
  navigator.serviceWorker.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'SW_VERSION' && event.data.action === 'reload') {
      console.log('🔄 检测到新版本 [' + event.data.cacheName + ']，2秒后自动刷新…');
      setTimeout(function() { window.location.reload(); }, 2000);
    }
  });

  // 监听 SW 更新完成（controllerchange = 新 SW 接管页面）
  var refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    if (refreshing) return;
    refreshing = true;
    console.log('🔄 SW 已更新，刷新页面…');
    window.location.reload();
  });
}

// ── 诊断工具（在页面顶部显示 debug 信息条）────────────────────
window._showDebugBar = function(msg) {
  var bar = document.getElementById('debug-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'debug-bar';
    bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#1a1a2e;color:#ffd700;font-size:11px;padding:6px 12px;text-align:center;font-family:monospace;';
    document.body.prepend(bar);
  }
  bar.textContent = '🔧 ' + msg;
};

// 启动时输出诊断信息（含版本号和 SW 状态，10秒后自动消失）
(function() {
  var standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone || false;
  var hasState = !!localStorage.getItem('hero_plan_state_v2');
  var hasPins = !!localStorage.getItem('heroplan_pins');
  var score = 0;
  try {
    var raw = localStorage.getItem('hero_plan_state_v2');
    if (raw) score = JSON.parse(raw).totalScore || 0;
  } catch(e) {}
  var tcbStatus = window._tcbReady ? '✅云同步' : '📦纯本地';

  // SW 状态检测
  var swStatus = '⏳检测中';
  if (!('serviceWorker' in navigator)) {
    swStatus = '❌不支持';
  } else if (!navigator.serviceWorker.controller) {
    swStatus = '⚠️暂无SW';
  } else {
    swStatus = '✅SW运行中';
  }
  // 尝试读取 SW 缓存版本（从注册信息中推断）
  try {
    navigator.serviceWorker.getRegistration().then(function(reg) {
      if (reg && reg.active) {
        var swURL = reg.active.scriptURL;
        var ver = BUILD_VERSION;
        window._swVer = ver;
        window._showDebugBar('🦸 ' + BUILD_VERSION + '-自律激励版 | SW:' + ver + ' | ' + tcbStatus + ' | 数据:' + (hasState ? score+'分' : '无') + ' | 独立窗口:' + standalone);
      } else {
        window._swVer = '?';
        window._showDebugBar('🦸 ' + BUILD_VERSION + '-自律激励版 | SW:未激活 | ' + tcbStatus + ' | 数据:' + (hasState ? score+'分' : '无'));
      }
    });
  } catch(e) { window._swVer = '?'; }

  // 同时更新页面顶部 header subtitle 显示版本号
  var subtitleEl = document.getElementById('headerMotto');
  if (subtitleEl) {
    subtitleEl.innerHTML = subtitleEl.innerHTML.replace(/<span[^>]*>.*?<\/span>$/, '') + ' <span style="font-size:0.65rem;color:#aaa;font-weight:normal;">' + BUILD_VERSION + '</span>';
  }

  console.log('🦸 启动诊断 ' + BUILD_VERSION + ' | 独立窗口:' + standalone + ' | 有数据:' + hasState + ' | 积分:' + score + ' | ' + tcbStatus);
  if (!hasState || score === 0) {
    window._showDebugBar('🦸 ' + BUILD_VERSION + '-自律激励版 | SW:' + swStatus + ' | 数据:' + (hasState ? score+'分' : '无') + ' | ' + tcbStatus + ' | 如数据丢失请点「📥导入」恢复');
  }
  setTimeout(function() {
    var bar = document.getElementById('debug-bar');
    if (bar) { bar.style.opacity = '0'; }
    setTimeout(function() { if (bar) { try { bar.remove(); } catch(e){} } }, 500);
  }, 10000);
})();

// ── Firebase Auth Guard ────────────────────────────────────────
// 数据库连接 且 匿名用户已登录（auth token 会自动附在所有请求上）
function isFirebaseReady() {
  return !!(window._firebaseReady && window._firebaseCurrentUser);
}

// ── 专注计时辅助 ───────────────────────────────────────────────
// 根据开始时间戳精确计算已过秒数（刷新后恢复也准确）
function getElapsedFocusSeconds() {
  if (!state.focusStartTimestamp) return state.focusSeconds;
  return Math.floor((Date.now() - state.focusStartTimestamp) / 1000);
}

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
  utter.rate = 0.95;   // 稍快，更活泼
  utter.pitch = 1.2;   // 更高音调，稚气可爱
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
  utter.rate = 1.0;     // 轻快活泼
  utter.pitch = 1.1;   // 音调升高，活泼不机械
  utter.volume = 1.0;
  if (_zhCNMaleVoice) utter.voice = _zhCNMaleVoice;
  window.speechSynthesis.speak(utter);
}

// ── 卡通音效播放 ─────────────────────────────────────────────
const _soundCache = {};
function playCartoonSound(soundName) {
  const src = 'sounds/' + soundName + '.mp3';
  if (_soundCache[soundName]) {
    _soundCache[soundName].currentTime = 0;
    _soundCache[soundName].play().catch(() => {});
    return;
  }
  const audio = new Audio(src);
  audio.volume = 0.7;
  _soundCache[soundName] = audio;
  audio.play().catch(() => {});
}
function playSuccess() { playCartoonSound('success'); }
function playBonus()   { playCartoonSound('bonus'); }
function playCeleb()   { playCartoonSound('celebration'); }

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


// ═══════════════════════════════════════════════════════════════
// 状态层已迁移至 hero-state.js
// ═══════════════════════════════════════════════════════════════
// state, defaultState(), loadState(), saveState(), calcTodayScore(),
// updateTodayScore(), onParentApprove(), onParentReject(),
// loadTotalScoreFromFirebase(), loadSelfReportFromFirebase(), migrateWeeklyCardClaims(),
// checkWeekUnlock(), checkDayReset() 均从 hero-state.js 加载
// ═══════════════════════════════════════════════════════════════

// ── DOMContentLoaded 初始化（保持在此文件，因涉及 UI 渲染）──────
document.addEventListener('DOMContentLoaded', () => {
  state = loadState();
  // alert('数据: ' + JSON.stringify(localStorage).substring(0,500));
  // 诊断信息显示在页面左上角（仅供调试）
  const diag = document.createElement('div');
  diag.id = '_diag_bar';
  diag.style = 'position:fixed;top:4px;left:4px;z-index:9999;background:#000;color:#0f0;font-size:11px;padding:4px 8px;border-radius:4px;max-width:90vw;overflow:auto;font-family:monospace;line-height:1.4;';
  diag.innerHTML = '📦 SW缓存: ' + (typeof CACHE_DATE !== 'undefined' ? CACHE_DATE : '未定义') + '<br>STATE_KEY: ' + STATE_KEY + '<br>localStorage: ' + Object.keys(localStorage).map(k => k + ':' + (localStorage.getItem(k) ? '有' : '空')).join(' | ') + '<br>lastActiveDate: ' + (state.lastActiveDate || '无');
  document.body.appendChild(diag);
  setTimeout(() => { const d = document.getElementById('_diag_bar'); if(d) d.remove(); }, 5000); // 5秒后自动消失
  migrateWeeklyCardClaims();
  checkWeekUnlock();
  checkDayReset();

  // 调试诊断（可删除）
  const debug = window._debugLoad;
  console.log('[诊断] loadState 结果:', debug, '| localStorage:', window._localStorageDebug ? window._localStorageDebug() : 'N/A');

  // 数据保存在本地设备，同时异步同步至云端（腾讯云开发 TCB）
  renderAll();

  // Page Visibility：tab 从后台恢复时，精确计算计时器
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state.focusTimerRunning) {
      const elapsed = getElapsedFocusSeconds();
      state.focusSeconds = elapsed;
      const d1 = document.getElementById('focusTimerDisplay');
      const d2 = document.getElementById('focusTimerBig');
      const t = formatFocusSecs(elapsed);
      if (d1) d1.textContent = t;
      if (d2) d2.textContent = t;
    }
  });
  bindEvents();
});

// ── 完整渲染（供初始化时调用）──────────────────────────────────
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
  renderDisciplineBar();
  if (typeof renderKidHeroHistory === 'function') renderKidHeroHistory();
  checkWeeklyReport();
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

// ── 月历打卡记录（保持在此，UI 渲染函数）────────────────────────
var _calendarYear = new Date().getFullYear();
var _calendarMonth = new Date().getMonth();

function renderMonthlyCalendar(year, month) {
  // 如果未传参，使用全局日历状态
  if (year === undefined) year = _calendarYear;
  if (month === undefined) month = _calendarMonth;
  const weekdays = ['日','一','二','三','四','五','六'];
  const container = document.getElementById('monthlyCalendar');
  
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
// 补卡是否已提交（跨天持久化，用 backfillLog 判断）
// taskId 格式：morning_X_2026-04-01、homework_block_1_2026-04-01 等
function isBackfillDone(taskId, dateStr) {
  if (!state.backfillLog) return false;
  const dates = state.backfillLog[taskId];
  if (!dates) return false;
  // 只要该 taskId 在任意日期有记录即算已补卡（防止跨天重复）
  return dates.length > 0;
}

// 标记补卡为已完成（持久化到 backfillLog）
function markBackfillDone(taskId, dateStr) {
  if (!state.backfillLog) state.backfillLog = {};
  if (!state.backfillLog[taskId]) state.backfillLog[taskId] = [];
  if (!state.backfillLog[taskId].includes(dateStr)) {
    state.backfillLog[taskId].push(dateStr);
  }
  saveState();
}

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
          const alreadySubmitted = isBackfillDone(taskId, dateStr);
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
          const alreadySubmitted = isBackfillDone(taskId, dateStr);
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
          const alreadySubmitted = isBackfillDone(taskId, dateStr);
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
          const alreadySubmitted = isBackfillDone(taskId, dateStr);
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
    const prevPts = totalDone;
    bonusGain = fullScore - prevPts;
    state.totalScore += bonusGain;
    // 更新连续天数（基于实际完成日期）
    updateStreakWithDate(packType === 'morning' ? 'morning' : 'night', dateStr);
  }

  saveState();
  
  // 补卡完成记录（持久化，不受跨天重置影响）
  markBackfillDone(fullTaskId, dateStr);
  
  // 写入父母审核队列（纯本地，与 Firebase 无关）
  const totalGain = score + bonusGain;
  submitPending('pack', fullTaskId, label, score, dateStr, isSelf);
  if (bonusGain > 0) {
    const fullBonusTaskId = `${packType}_full_${dateStr}`;
    submitPending('pack', fullBonusTaskId, (packType === 'morning' ? '早晨' : '睡前') + '英雄包全套奖励', bonusGain, dateStr, isSelf);
    state.todayChecked[fullBonusTaskId] = 'pending';
  }
  // Firebase 同步（可选，仅在 Firebase 可用时）
  if (isFirebaseReady()) {
    window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore/score'), window._firebaseIncrement(totalGain));
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
    markBackfillDone(`homework_block_${blocks}_${dateStr}`, dateStr);
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
    markBackfillDone(`homework_complete_${dateStr}`, dateStr);
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

  // 写入父母审核队列（纯本地，与 Firebase 无关）
  entries.forEach(e => {
    submitPending('homework', e.taskId, e.name, e.score, dateStr, isSelf);
  });
  // Firebase 同步（可选，仅在 Firebase 可用时）
  if (isFirebaseReady()) {
    window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore/score'), window._firebaseIncrement(totalGain));
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
  renderDailyDisciplineStatus();
  renderMorningPack();
  renderNightPack();
  renderHomeworkTask();
  renderFocusTime();
  renderSelfPick();
  renderOptionalTasks();
  renderTempTasks();
  updateTodayScore();
}

// ── 今日自律状态行 ──────────────────────────────────────────
function renderDailyDisciplineStatus() {
  const el = document.getElementById('dailyDisciplineStatus');
  if (!el) return;
  const now = new Date();
  const todayDs = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const todayTasks = state.selfReport?.[todayDs] || {};

  // 统计今天固定任务完成情况
  const fixedIds = DAILY_FIXED.map(t => t.id);
  const completedFixed = fixedIds.filter(id => _hasFixedTask(todayTasks, id));
  const completedCount = completedFixed.length;
  const totalCount = fixedIds.length;
  const selfCount = completedFixed.filter(id => _getFixedTaskValue(todayTasks, id) === 'self').length;

  // 连续自主天数
  let streak = 0;
  const d = new Date(now);
  for (let i = 0; i < 30; i++) {
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const tasks = state.selfReport?.[ds];
    if (!tasks) break;
    const hits = fixedIds.filter(id => _hasFixedTask(tasks, id));
    const allSelf = hits.length > 0 && hits.every(id => _getFixedTaskValue(tasks, id) === 'self');
    if (!allSelf) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }

  let statusText, statusColor, statusBg, statusIcon;
  if (completedCount === 0) {
    statusText = '今天还没出击哦，完成一个任务开始记录自律吧！';
    statusColor = '#999';
    statusBg = '#f5f5f5';
    statusIcon = '🥱';
  } else if (selfCount < completedCount) {
    statusText = `今天完成 ${completedCount}/${totalCount} 项，其中 ${selfCount} 项是自己想起来的`;
    statusColor = '#F9A825';
    statusBg = '#fff8e1';
    statusIcon = '🌱';
  } else if (streak >= 3 && completedCount >= Math.ceil(totalCount * 0.65)) {
    statusText = `⚡ 连续 ${streak} 天全自主！你就是自己的英雄！🌟`;
    statusColor = '#FF6F00';
    statusBg = '#FFF3E0';
    statusIcon = '⚡';
  } else if (completedCount >= Math.ceil(totalCount * 0.65) && selfCount === completedCount) {
    statusText = `今天全自主！${completedCount}/${totalCount} 项全部自己想起来 🔥`;
    statusColor = '#06D6A0';
    statusBg = '#e8fff5';
    statusIcon = '🔥';
  } else {
    statusText = `今天完成 ${completedCount}/${totalCount} 项，其中 ${selfCount} 项是自己想起来的`;
    statusColor = '#F9A825';
    statusBg = '#fff8e1';
    statusIcon = '🌱';
  }

  el.innerHTML = `
    <div style="background:${statusBg};border-radius:12px;padding:10px 14px;margin-bottom:8px;border:1.5px solid ${statusColor};display:flex;align-items:center;gap:10px;">
      <span style="font-size:1.4rem;">${statusIcon}</span>
      <span style="font-size:0.85rem;font-weight:600;color:${statusColor};flex:1;">${statusText}</span>
      ${streak >= 3 ? `<span style="font-size:0.75rem;background:${statusColor};color:#fff;padding:2px 8px;border-radius:20px;">连续${streak}天</span>` : ''}
    </div>`;
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
    if (isFirebaseReady()) {
      window._firebaseSet(
        window._firebaseRef(window._firebaseDB, `selfReport/${today}/${taskId}`),
        isSelf ? 'self' : 'reminded'
      );
    }
    if (onConfirm) onConfirm(isSelf);
  }

  // 点击遮罩 = 取消（仅对挑战卡场景有意义：重置 selfPickCard）
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
      // 只对挑战卡场景重置 selfPickCard，其他任务类型无需此操作
      if (taskId.startsWith('card_')) {
        state.selfPickCard = null;
        state.selfPickClaimed = false;
        saveState();
      }
      renderAll();
    }
  });

  document.getElementById('_srSelfBtn').onclick = () => close(true);
  document.getElementById('_srRemindBtn').onclick = () => close(false);
}

function togglePackItem(packType, id, score) {
  const today = todayStr();
  const packKey = packType === 'morning' ? 'morningPack' : 'nightPack';
  const pack = packType === 'morning' ? MORNING_PACK : NIGHT_PACK;
  const fullScore = packType === 'morning' ? MORNING_PACK_FULL : NIGHT_PACK_FULL;
  const bonusKey = packType === 'morning' ? 'morningPackBonus' : 'nightPackBonus';

  // ── 取消打卡逻辑（不变）──────────────────────────────
  if (state[packKey][id]) {
    // 取消：从待审加分池移除，同时扣减已加的积分
    const label = (packType==='morning'?'早晨':'睡前')+'英雄包·'+id;
    const fullTaskId = `${packType}_${id}`;
    const idx = state.pendingAdditions.findIndex(p => p.type === 'pack' && p.taskId === fullTaskId && p.date === today && p.actualDate === today && !p.isBackfill);
    // 找不到对应记录则不处理（防止状态异常时乱删）
    if (idx === -1) {
      console.warn('[togglePackItem] 撤销失败：未找到 pending 记录', { fullTaskId, today, pendingAdditions: state.pendingAdditions });
      return;
    }
    const deductGain = state.pendingAdditions[idx].score || 0;
    state.pendingAdditions.splice(idx, 1);
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
    if (isFirebaseReady() && deductGain > 0) {
      window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore/score'), window._firebaseIncrement(-deductGain));
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
  if (isFirebaseReady()) {
    window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore/score'), window._firebaseIncrement(gain));
  }

  renderAll();

  const packIcon = packType === 'morning' ? '🌅' : '🌙';
  const packItemName = pack.find(t => t.id === id)?.name || id;

  // 弹自律确认
  showSelfReportUnified(`${packType}_${id}_${today}`, packItemName, gain, packIcon, (isSelf) => {
    submitPending('pack', fullTaskId, label, gain, '', isSelf);
    const entry = state.pendingAdditions.find(p => p.type === 'pack' && p.taskId === fullTaskId && p.date === today && p.actualDate === today);
    if (entry) { entry.isSelf = isSelf; saveState(); }
    const toastMsg = `已完成${todayDone}/${pack.length}件，${isFull ? '全套达成！🎉' : '再完成' + (pack.length - todayDone) + '件有惊喜！'}`;
    showCelebration(isFull ? '🎉' : '✅', isFull ? '全套完成！' : '完成一件！', toastMsg, 0, isFull ? 'celeb' : 'success');
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
  // 提取 fbKey（completeHomework 时已保存），用于精准删除 Firebase 记录
  const entry = state.pendingAdditions.find(p => p.type === 'homework' && p.taskId === 'hw_complete');
  const fbKey = entry ? entry.fbKey : null;
  state.pendingAdditions.splice(state.pendingAdditions.findIndex(p => p.type === 'homework' && p.taskId === 'hw_complete'), 1);
  saveState();
  // 同步到 Firebase
  if (isFirebaseReady()) {
    window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore/score'), window._firebaseIncrement(-HOMEWORK_TASK.scoreComplete));
    // 用已知 key 精准删除 pending 记录，而非新建垃圾记录
    if (fbKey) window._firebaseRemove(window._firebaseRef(window._firebaseDB, 'pending/' + fbKey));
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
  if (isFirebaseReady()) {
    window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore/score'), window._firebaseIncrement(HOMEWORK_TASK.scoreComplete));
  }
  renderAll();
  // 先弹自律自报弹窗，等用户选择后再提交审核
  showSelfReportUnified('hw_complete', '今日作业完成', HOMEWORK_TASK.scoreComplete, '📚', (isSelf) => {
    // 提交到待审（带 isSelf）
    if (isFirebaseReady()) {
      submitPending('homework', 'hw_complete', '作业完成', HOMEWORK_TASK.scoreComplete, '', isSelf)
      .then((key) => {
        // 保存 Firebase key，以便撤销时精准删除而非新建垃圾记录
        const entry = state.pendingAdditions.find(p => p.type === 'homework' && p.taskId === 'hw_complete' && p.date === today);
        if (entry) entry.fbKey = key;
        saveState();
      });
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
    if (isFirebaseReady()) {
      window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore/score'), window._firebaseIncrement(-deductPts));
    }
    renderAll();
    showCelebration('↩️', '已撤销', `第${idx}块及之后的专注块已撤销`);
  } else {
    // 新增专注块
    if (currentBlocks >= HOMEWORK_TASK.maxBlocks) {
      showCelebration('🏆', '专注块已满！', `已完成${HOMEWORK_TASK.maxBlocks}个专注块，太棒了！`, 0, 'celeb');
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
    if (isFirebaseReady()) {
      window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore/score'), window._firebaseIncrement(HOMEWORK_TASK.scorePerBlock));
      submitPending('homework', blockTaskId, `专注块第${newBlock}块`, HOMEWORK_TASK.scorePerBlock);
    }
    renderAll();
    showCelebration('🍅', `专注块 ${newBlock}/${HOMEWORK_TASK.maxBlocks}！`, `专注${HOMEWORK_TASK.blockMinutes}分钟完成！+${HOMEWORK_TASK.scorePerBlock}分！`);
  }
}

// ── 专注力时光（独立模块）────────────────────────────────────
let _focusTimer = null;

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
            started ? `⏱️ 专注中：<span id="focusTimerDisplay">${formatFocusSecs(state.focusSeconds)}</span>` :
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
          <div class="ft-timer-big" id="focusTimerBig">${formatFocusSecs(state.focusSeconds)}</div>
          <div class="ft-timer-hint">${ft.minutes}分钟 = 完成！停不下来就继续 🔥</div>
          <button class="btn-ft-done ${state.focusSeconds < ft.minutes * 60 ? 'disabled' : ''}" onclick="completeFocusTime(false)" ${state.focusSeconds < ft.minutes * 60 ? 'disabled' : ''}>✅ 完成了！（${ft.minutes}分钟到了）</button>
          <button class="btn-ft-overtime ${state.focusSeconds < ft.minutes * 60 ? 'disabled' : ''}" onclick="completeFocusTime(true)" ${state.focusSeconds < ft.minutes * 60 ? 'disabled' : ''}>⚡ 停不下来！继续超时（+${ft.bonusScore}分）</button>
          ${state.focusSeconds < ft.minutes * 60 ? '<div style="margin-top:8px;font-size:0.8rem;color:#f44336">⏱️ 专注满' + ft.minutes + '分钟才能打卡哦，再坚持一下！</div>' : ''}
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

  if (started && !completed && state.focusTimerRunning) {
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
  state.focusSeconds = 0;
  state.focusTimerRunning = true;
  state.focusStartTimestamp = Date.now(); // 记录开始时刻
  saveState();
  _startFocusTimer();  // 先启动计时器（renderFocusTime 里有条件判断，timer 启动后会阻止重复创建）
  renderFocusTime();
  showCelebration('🧠', '专注开始！', '找一个安静的地方，关掉干扰，专心做你选的事！');
}

function _startFocusTimer() {
  if (_focusTimer) clearInterval(_focusTimer);
  let _saveCounter = 0;
  _focusTimer = setInterval(() => {
    // 用时间戳计算已过秒数（刷新后恢复依然准确）
    const elapsed = getElapsedFocusSeconds();
    state.focusSeconds = elapsed;
    const d1 = document.getElementById('focusTimerDisplay');
    const d2 = document.getElementById('focusTimerBig');
    const t = formatFocusSecs(elapsed);
    if (d1) d1.textContent = t;
    if (d2) d2.textContent = t;
    // 每5秒持久化一次，避免刷新后计时归零
    _saveCounter++;
    if (_saveCounter >= 5) { _saveCounter = 0; saveState(); }
  }, 1000);
}

// 专注力计时更新（仅在 renderFocusTime 时调用，用于恢复显示）
// 加 !_focusTimer 守卫：避免 startFocusTime() 中 renderFocusTime() 触发时重复创建 timer
function _startFocusDisplayUpdate() {
  if (_focusTimer) return; // 已有计时器在跑，不再重复创建
  const d1 = document.getElementById('focusTimerDisplay');
  const d2 = document.getElementById('focusTimerBig');
  if ((d1 || d2) && state.focusTimerRunning) {
    _focusTimer = setInterval(() => {
      // 用时间戳计算已过秒数（刷新后恢复依然准确）
      const elapsed = getElapsedFocusSeconds();
      state.focusSeconds = elapsed;
      const t = formatFocusSecs(elapsed);
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
  state.focusStarted = false;
  state.focusSeconds = 0;
  if (_focusTimer) { clearInterval(_focusTimer); _focusTimer = null; }
  state.focusTimerRunning = false;
  state.focusStartTimestamp = null;
  // 提取 fbKey（completeFocusTime 时已保存），用于精准删除 Firebase 记录
  const entry = state.pendingAdditions.find(p => p.type === 'focus' && p.taskId === 'focus_time');
  const fbKey = entry ? entry.fbKey : null;
  state.pendingAdditions.splice(state.pendingAdditions.findIndex(p => p.type === 'focus' && p.taskId === 'focus_time'), 1);
  // 扣减积分
  state.totalScore = Math.max(0, state.totalScore - pts);
  // 撤销streak
  if (state.streaks && state.streaks.focus && state.streaks.focus.lastDate === todayStr()) {
    state.streaks.focus.count = 0;
    state.streaks.focus.lastDate = '';
  }
  saveState();
  if (isFirebaseReady()) {
    window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore/score'), window._firebaseIncrement(-pts));
    // 用已知 key 精准删除 pending 记录，而非新建垃圾记录
    if (fbKey) window._firebaseRemove(window._firebaseRef(window._firebaseDB, 'pending/' + fbKey));
  }
  renderAll();
  showCelebration('↩️', '已撤销', '专注力时光打卡已撤销');
}

function completeFocusTime(isOvertime) {
  // 时间未到时不允许提交，给出提示
  if (!state.focusCompleted && state.focusSeconds < FOCUS_TIME.minutes * 60) {
    showCelebration('⏱️', '还没到时间哦', `再坚持一下，还差${FOCUS_TIME.minutes * 60 - state.focusSeconds}秒！💪`);
    return;
  }
  if (state.focusCompleted) {
    // 已完成，切换为撤销模式
    undoFocusTime();
    return;
  }
  if (_focusTimer) { clearInterval(_focusTimer); _focusTimer = null; }
  state.focusTimerRunning = false;
  state.focusStartTimestamp = null;
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
  if (isFirebaseReady()) {
    window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore/score'), window._firebaseIncrement(pts));
  }
  renderAll();
  // 先弹自律自报弹窗，等用户选择后再提交审核
  showSelfReportUnified('focus_time', '专注力时光', pts, isOvertime ? '⚡' : '🧠', (isSelf) => {
    // 提交到待审（带 isSelf）
    if (isFirebaseReady()) {
      submitPending('focus', 'focus_time', '专注力时光', pts, '', isSelf)
      .then((key) => {
        const entry = state.pendingAdditions.find(p => p.type === 'focus' && p.taskId === 'focus_time' && p.date === todayStr());
        if (entry) entry.fbKey = key;
        saveState();
      });
    }
    // 更新 pendingAdditions 中的 isSelf
    const today = todayStr();
    const entry = state.pendingAdditions.find(p => p.type === 'focus' && p.taskId === 'focus_time' && p.date === today);
    if (entry) entry.isSelf = isSelf;
    saveState();
    if (isOvertime) {
      showCelebration('⚡', '超级专注徽章！', `停不下来是最棒的状态！+${pts}分！超级专注徽章已解锁！`, pts, 'bonus');
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
      const today = todayStr();
      const idx = state.pendingAdditions.findIndex(p => p.type === 'daily' && p.taskId === id && p.date === today);
      let deductGain = 0;
      if (idx !== -1) {
        deductGain = state.pendingAdditions[idx].score || 0;
        state.pendingAdditions.splice(idx, 1);
      }
      delete state.todayChecked[id];
      state.totalScore = Math.max(0, state.totalScore - deductGain);
      saveState();
      if (isFirebaseReady() && deductGain > 0) {
        window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore/score'), window._firebaseIncrement(-deductGain));
      }
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
    if (isFirebaseReady()) {
      window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore/score'), window._firebaseIncrement(score));
    }
    renderAll();
    // 弹出自律自报弹窗，确定后再提交审核
    setTimeout(() => showSelfReportUnified(id, task ? task.name : id, score, '🦸', (isSelf) => {
      // 提交到待审（带 isSelf）
      if (task && isFirebaseReady()) {
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

  // 可选/作业任务：先弹自律弹窗，确认后再提交审核（与固定任务时序统一）
  const allTasks2 = [...DAILY_FIXED, ...DAILY_OPTIONAL, ...DAILY_HOMEWORK, ...DAILY_TEMP_TASKS];
  const task2 = allTasks2.find(t => t.id === id);
  // 加入待审加分池（isSelf 待弹窗确定后更新），同时立即加积分
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
  // 立即同步到 Firebase（积分同步，无 pending 记录）
  if (isFirebaseReady()) {
    window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore/score'), window._firebaseIncrement(score));
  }
  renderAll();
  setTimeout(() => showSelfReportUnified(id, task2 ? task2.name : id, score, '🎮', (isSelf) => {
    // 弹窗确认后才写 pending，避免点遮罩时 isSelf 丢失
    state.todayChecked[id] = 'pending';
    // 立即同步自律标签到 Firebase（带真实 isSelf）
    if (isFirebaseReady()) {
      submitPending('daily', id, task2 ? task2.name : id, score, '', isSelf);
    }
    // 更新 pendingAdditions 中的 isSelf（本地）
    const today = todayStr();
    const entry = state.pendingAdditions.find(p => p.type === 'daily' && p.taskId === id && p.date === today);
    if (entry) {
      entry.isSelf = isSelf;
      saveState();
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
      showCelebration('🏆', '本周7次全完成！', `「${card.name}」这周每天都完成啦！下周继续加油！🎯`, 0, 'celeb');
    } else {
      showCelebration('🚫', '本周已领取！', `「${card.name}」本周完成过了，下周再来挑战其他卡吧！🎯`, 0, 'success');
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
  const isFirstThisWeek = existing.length === 0; // 是否本周首次领（决定 weeklyCardCount 是否+1）
  const isReadingCard = !!(card.series && card.series.includes('阅读'));
  state.pendingAdditions.push({
    type: 'card',
    taskId: id,
    name: card.name,
    icon: card.stars ? '🃏' : '🎴',
    score: card.score,
    date: today,
    isSelf: isSelf,
    // 驳回时需要回滚的标记
    incrementedWeeklyCount: isFirstThisWeek,
    isReadingCard: isReadingCard
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
  // 写入父母审核队列（纯本地，与 Firebase 无关）
  submitPending('card', id, card.name, card.score, '', isSelf);
  // Firebase 同步（可选，仅在 Firebase 可用时）
  if (isFirebaseReady()) {
    window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore/score'), window._firebaseIncrement(card.score));
  }
  closeModal('cardModal');
  renderAll();
  // 检查周度成就升级
  const newAch = WEEKLY_ACHIEVEMENTS.slice().reverse().find(a => state.weeklyCardCount >= a.minCards);
  if (newAch && newAch.id !== state.weeklyAchievement) {
    state.weeklyAchievement = newAch.id;
    saveState();
    setTimeout(() => showCelebration(newAch.icon, `${newAch.level}成就！`, `本周完成${state.weeklyCardCount}张任务卡！周末结算+${newAch.bonusScore}分！`, newAch.bonusScore, 'celeb'), 800);
  } else {
    showCelebration('⏳', `「${card.name}」已申请！`, `等爸爸妈妈审核后 +${card.score}分入账！`, card.score, 'success');
  }
}

// ── 渲染商店 ───────────────────────────────────────────────────
function renderShop() {
  document.getElementById('shopScore').textContent = state.totalScore;
  // 渲染像素勋章墙
  renderPixelMedalWall();
  const el = document.getElementById('shopContent');
  const bUnlocked = isBRewardUnlocked();

  // 🏅 自律能量条（孩子友好版）
  const now = new Date();
  const { rate, selfDays, totalDays } = calcMonthlyDisciplineRate(now.getFullYear(), now.getMonth() + 1);
  const unlocked = rate >= 85;
  const needDays = Math.max(0, Math.ceil(totalDays * 0.85) - selfDays);
  const monthName = (now.getMonth() + 1) + '月';
  const barPct = Math.min(100, rate);
  const barColor = rate >= 85 ? '#06D6A0' : rate >= 50 ? '#F9A825' : '#FF7043';
  const barHtml = `
    <div style="background:${unlocked?'linear-gradient(135deg,#e8fff5,#d4fceb)':'linear-gradient(135deg,#fff8e1,#fff3cd)'};border-radius:18px;padding:14px 16px;margin-bottom:16px;border:2px solid ${unlocked?'#06D6A0':'#FFD54F'};box-shadow:0 2px 8px rgba(0,0,0,0.05);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <span style="font-size:1.1rem;">⚡</span>
        <span style="font-weight:800;font-size:1.05rem;color:#1a1a2e;">${monthName} 能量条</span>
        <span style="font-size:1.3rem;font-weight:800;color:${barColor};">${rate}%</span>
      </div>
      <div style="background:#eee;border-radius:14px;height:22px;overflow:hidden;position:relative;box-shadow:inset 0 1px 3px rgba(0,0,0,0.1);">
        <div style="background:linear-gradient(90deg,#FF7043,#F9A825 40%,#66BB6A 70%,#06D6A0);height:100%;border-radius:14px;width:${barPct}%;transition:width 0.5s ease;box-shadow:0 0 10px ${barColor}55;"></div>
        ${barPct > 0 && barPct < 100 ? '<div style="position:absolute;top:-2px;left:calc(' + barPct + '% - 10px);font-size:0.9rem;line-height:1;">🚀</div>' : ''}
        ${barPct >= 100 ? '<div style="position:absolute;top:0;right:0;width:100%;text-align:center;line-height:22px;font-size:0.78rem;font-weight:700;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.2);">🎉 满格！</div>' : ''}
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;font-size:0.9rem;">
        <span style="font-weight:700;color:#1a1a2e;">⭐ <span style="color:#F9A825;font-size:1.2rem;">${selfDays}</span> 天自己完成</span>
      </div>
      <div style="margin-top:10px;font-size:0.82rem;text-align:center;line-height:1.6;">
        ${unlocked
          ? '<span style="display:inline-block;background:#e8fff5;border-radius:10px;padding:8px 16px;font-weight:700;color:#06D6A0;">🎁 宝藏屋大奖已解锁！你太棒了！🎉</span>'
          : selfDays > 0
            ? '<span style="display:inline-block;background:#fff8e1;border-radius:10px;padding:8px 16px;color:#E65100;font-weight:600;">🎁 再靠自己完成 <span style="font-size:1rem;color:#FF7043;">' + needDays + '</span> 天，宝藏屋就打开了！💪</span>'
            : '<span style="color:#aaa;">每天自己完成任务，能量条就会慢慢涨起来！加油！⭐</span>'
        }
      </div>
      <div style="margin-top:8px;text-align:right;font-size:0.75rem;"><a href="javascript:void(0)" onclick="showWeeklyReport()" style="color:#7C3AED;text-decoration:none;">📊 本周自律报告 →</a></div>
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
  showCelebration('🎁', `兑换成功！`, `「${name}」已兑换！\n剩余积分：${state.totalScore}分`, 0, 'bonus');
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
        showCelebration('🪢', `新里程碑解锁！`, `去英雄挑战卡领取对应奖励！`, 0, 'bonus');
      }, 500);
    }
  }
  saveState();
  document.getElementById('ropeInput').value = '';
  renderAll();
  if (val > prev) {
    showCelebration('🪢', `新记录！${val}个！`, `比之前多了${val-prev}个！超厉害！⚡`, 0, 'bonus');
  }
});

// ── 渲染爸爸说明 ───────────────────────────────────────────────
// ── 渲染「写给子渊的信」独立Tab ─────────────────────────────
function renderKidPage() {
  const el = document.getElementById('kidPage');
  if (!el) return;
  const g = DAD_GUIDE;
  const nl2br = s => s.replace(/\n/g, '<br>');
  const openingEsc = (g.kidOpening || '').replace(/'/g, "\'").replace(/\n/g, ' ');
  const closingEsc = (g.kidClosing || '').replace(/'/g, "\'").replace(/\n/g, ' ');
  el.innerHTML = `
    <div class="dad-guide">
      <div class="dad-guide-header">${g.kidTitle} <button onclick="event.stopPropagation();speakText('${openingEsc}',this)">🔈</button></div>
      <div class="dad-guide-body">
        <div class="dad-tip-box" style="background:#FFF8E7;border-left:4px solid #F9A825">
          <div class="dad-tip-text" style="line-height:2;font-size:14px">${nl2br(g.kidOpening)}</div>
        </div>
        <div class="dad-tip-box" style="background:#EDFFF9;border-left:4px solid #06D6A0;margin-top:16px;text-align:center">
          <div class="dad-tip-text" style="line-height:2;color:#00897B;font-size:14px">${nl2br(g.kidClosing)}</div>
          <button onclick="event.stopPropagation();speakText('${closingEsc}',this)" style="background:#06D6A0;border:none;color:#fff;border-radius:20px;padding:6px 16px;font-size:0.85rem;margin-top:10px;cursor:pointer;">🔈 读给我听</button>
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
        <!-- 数据备份与恢复 -->
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #eee;text-align:center">
          <div style="font-size:12px;color:#aaa;margin-bottom:8px">💾 数据备份与恢复</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
            <button onclick="exportData()" style="background:#06D6A0;border:none;color:#fff;border-radius:10px;padding:10px 16px;font-size:13px;font-weight:700;cursor:pointer;">
              📤 导出数据
            </button>
            <button onclick="document.getElementById('importFileInput').click()" style="background:#118AB2;border:none;color:#fff;border-radius:10px;padding:10px 16px;font-size:13px;font-weight:700;cursor:pointer;">
              📥 导入数据
            </button>
          </div>
          <input type="file" id="importFileInput" accept=".json" style="display:none" onchange="importData(this)">
        </div>
      </div>
    </div>`;
  renderDisciplineBar();
}

// dadSwitchTab 已移除（子渊页和爸妈页现为独立Tab）


// ── 安全清空数据弹窗（受 PIN 保护）────────────────────────────
// showSecureClearModal：先验证父母 PIN，验证通过才调用 clearAllData
function showSecureClearModal() {
  // 移除已有的安全清空弹窗
  const existing = document.getElementById('secureClearModal');
  if (existing) existing.remove();

  // ── 检查是否已登录父母身份 ──────────────────────────────
  // getPins() 和 currentParent 来自 firebase-sync.js
  let pins = { mom: null, dad: null };
  try { pins = JSON.parse(localStorage.getItem('heroplan_pins') || '{}'); } catch(e) {}

  const hasPin = pins.mom || pins.dad;

  const modal = document.createElement('div');
  modal.id = 'secureClearModal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;
    display:flex;align-items:center;justify-content:center;padding:20px;
  `;
  modal.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:28px 24px;max-width:340px;width:100%;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,0.25);">
      <div style="font-size:2.2rem;margin-bottom:10px;">🗑️</div>
      <div style="font-size:1.15rem;font-weight:700;color:#1a1a2e;margin-bottom:4px;">清空所有测试数据</div>
      <div id="clearWarnText" style="font-size:0.88rem;color:#e74c3c;margin-bottom:16px;line-height:1.6;">
        ⚠️ 此操作不可恢复！<br>所有积分、打卡记录、英雄成就将被清除。
      </div>
      ${!hasPin
        ? `<div style="background:#fff3cd;border-radius:12px;padding:14px;margin-bottom:16px;text-align:left;">
            <div style="font-size:0.9rem;font-weight:700;color:#856404;margin-bottom:8px;">⚠️ 尚未设置 PIN 码</div>
            <div style="font-size:0.82rem;color:#856404;line-height:1.5;">请先在「爸爸妈妈审核中心」设置 PIN 码，再执行清空操作。</div>
            <div style="font-size:0.78rem;color:#aaa;margin-top:6px;">路径：爸妈页 → 👩妈妈/👨爸爸 → 设置PIN</div>
           </div>`
        : `<div style="margin-bottom:16px;">
            <div style="font-size:0.88rem;color:#555;margin-bottom:10px;">请输入父母 PIN 码确认身份</div>
            <div style="display:flex;gap:10px;justify-content:center;margin-bottom:8px;">
              <button id="clearWhoMom" onclick="switchClearWho('mom')"
                style="flex:1;padding:8px;border-radius:10px;border:2px solid #e0e0e0;background:#f5f5f5;color:#555;font-size:0.88rem;font-weight:700;cursor:pointer;">
                👩 妈妈
              </button>
              <button id="clearWhoDad" onclick="switchClearWho('dad')"
                style="flex:1;padding:8px;border-radius:10px;border:2px solid #e0e0e0;background:#f5f5f5;color:#555;font-size:0.88rem;font-weight:700;cursor:pointer;">
                👨 爸爸
              </button>
            </div>
            <input id="clearPinInput" type="password" maxlength="4" placeholder="●●●●"
              style="width:100%;padding:12px;border-radius:12px;border:2px solid #e0e0e0;font-size:1.4rem;letter-spacing:8px;text-align:center;outline:none;box-sizing:border-box;">
            <div id="clearPinHint" style="font-size:0.8rem;color:#e74c3c;margin-top:6px;min-height:18px;"></div>
           </div>`
      }
      <div style="display:flex;gap:10px;justify-content:center;">
        <button id="clearCancelBtn"
          style="flex:1;padding:12px;border-radius:12px;border:none;background:#f0f0f0;color:#555;font-size:1rem;font-weight:700;cursor:pointer;">
          取消
        </button>
        ${hasPin
          ? `<button id="clearConfirmBtn"
              style="flex:1;padding:12px;border-radius:12px;border:none;background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;font-size:1rem;font-weight:700;cursor:pointer;">
              确认清空
            </button>`
          : ``
        }
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  let clearSelectedWho = 'mom';
  // 默认选中妈妈（如果妈妈有PIN）或爸爸
  if (pins.dad && !pins.mom) clearSelectedWho = 'dad';

  window._clearSelectedWho = clearSelectedWho;

  window.switchClearWho = function(who) {
    window._clearSelectedWho = who;
    document.getElementById('clearWhoMom').style.cssText =
      'flex:1;padding:8px;border-radius:10px;border:2px solid ' + (who==='mom'?'#FF6B35':'#e0e0e0') + ';background:' + (who==='mom'?'#FFF3EE':'#f5f5f5') + ';color:' + (who==='mom'?'#FF6B35':'#555') + ';font-size:0.88rem;font-weight:700;cursor:pointer;';
    document.getElementById('clearWhoDad').style.cssText =
      'flex:1;padding:8px;border-radius:10px;border:2px solid ' + (who==='dad'?'#FF6B35':'#e0e0e0') + ';background:' + (who==='dad'?'#FFF3EE':'#f5f5f5') + ';color:' + (who==='dad'?'#FF6B35':'#555') + ';font-size:0.88rem;font-weight:700;cursor:pointer;';
    document.getElementById('clearPinInput').value = '';
    document.getElementById('clearPinHint').textContent = '';
    document.getElementById('clearPinInput').focus();
  };

  // 初始化选中状态
  window.switchClearWho(window._clearSelectedWho);

  modal.querySelector('#clearCancelBtn').onclick = () => modal.remove();

  if (hasPin) {
    const confirmBtn = modal.querySelector('#clearConfirmBtn');
    const pinInput = document.getElementById('clearPinInput');
    const pinHint = document.getElementById('clearPinHint');

    confirmBtn.onclick = () => {
      const pin = pinInput.value.trim();
      if (!pin) { pinHint.textContent = '请输入 PIN 码'; return; }
      if (pin !== pins[window._clearSelectedWho]) {
        pinHint.textContent = '❌ PIN 码错误';
        pinInput.value = '';
        pinInput.focus();
        return;
      }
      // PIN 验证通过 → 授权清空
      window._secureClearAuthorized = true;
      modal.remove();
      clearAllData();
    };

    // 回车确认
    pinInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') confirmBtn.click();
    });
  } else {
    // 无 PIN：只显示关闭按钮
    modal.querySelector('#clearCancelBtn').textContent = '我知道了';
  }

  // 点击遮罩关闭
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.remove();
  });
}

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
  if (isFirebaseReady()) {
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

// ── 数据导出（下载 JSON 备份）─────────────────────────────────
function exportData() {
  const allData = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    allData[k] = localStorage.getItem(k);
  }
  const json = JSON.stringify(allData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'hero-plan-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

// ── 数据导入（从 JSON 文件恢复）───────────────────────────────
function importData(fileInput) {
  const file = fileInput.files[0];
  if (!file) return;
  if (!file.name.endsWith('.json')) {
    alert('⚠️ 请选择 .json 格式的备份文件');
    fileInput.value = '';
    return;
  }
  if (!confirm('📥 导入将覆盖当前所有数据！\n\n建议：导入前先点「导出数据」备份当前数据。\n\n继续吗？')) {
    fileInput.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const allData = JSON.parse(e.target.result);
      let imported = 0;
      const importedKeys = [];
      for (const k in allData) {
        if (allData[k] !== null && allData[k] !== undefined) {
          localStorage.setItem(k, allData[k]);
          imported++;
          importedKeys.push(k + '(' + (allData[k].length || 0) + 'b)');
        }
      }
      fileInput.value = '';

      // ── 不刷新页面！直接重新加载状态并渲染 ──────────────
      // 原因：iPad PWA 中 location.reload() 可能被 SW 缓存拦截，
      // 或 iOS PWA 独立窗口的 localStorage 在 reload 时被重置。
      console.log('📥 导入完成，共 ' + imported + ' 条: ' + importedKeys.slice(0,5).join(', ') + (importedKeys.length>5?'...':''));
      state = loadState();

      // 重新渲染整个页面
      renderAll();

      // 显示成功提示（带诊断信息）
      var debugInfo = '已导入 ' + imported + ' 条数据\n';
      debugInfo += '当前积分: ' + (state.totalScore || 0) + ' 分\n';
      debugInfo += '独立窗口: ' + (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone || false);
      alert('✅ 导入成功！' + debugInfo);

    } catch(err) {
      console.error('❌ 导入失败:', err);
      alert('❌ 导入失败：文件格式错误\n' + err.message);
      fileInput.value = '';
    }
  };
  reader.onerror = function(err) {
    console.error('❌ 文件读取失败:', err);
    alert('❌ 文件读取失败，请重试');
    fileInput.value = '';
  };
  reader.readAsText(file);
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
  showCelebration('🏆', '爸爸撑住了！', '孩子+5分奖励！爸爸真的很厉害！😄', 5, 'bonus');
  setTimeout(() => tryShowShopBoost(5), 1600);
});
document.getElementById('btnDadSleep').addEventListener('click', () => {
  closeModal('eggModal');
  showCelebration('😴', '爸爸睡着了...', '哈哈！拍下来存证！下次再来挑战！📸', 0, 'success');
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
function showCelebration(emoji, title, desc, score = 0, soundType = 'success') {
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
  
  // 播放卡通音效
  if (soundType === 'celeb') playCeleb();
  else if (soundType === 'bonus') playBonus();
  else playSuccess();
  
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

      // ── 今日我的挑战卡分数扣减 ────────────────────────────────
      // 如果今日挑战卡已领取，从累计积分中扣减（与 Firebase 同步）
      const cardWasClaimed = state.selfPickClaimed && state.selfPickCard;
      const claimedCard = cardWasClaimed ? TASK_CARDS.find(c => c.id === state.selfPickCard) : null;
      if (claimedCard) {
        state.totalScore = Math.max(0, state.totalScore - claimedCard.score);
        // 同步扣减到 Firebase（供父母端看到）
        if (isFirebaseReady()) {
          window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncScore/score'), state.totalScore);
        }
      }

      // 重置所有状态
      state.todayChecked = {};
      state.morningPack = {};
      state.nightPack = {};
      state.morningPackBonus = false;
      state.nightPackBonus = false;
      state.hwCompleted = false;
      state.hwBlocks = 0;
      // 今日我的挑战卡（自选挑战）重置
      state.selfPickCard = null;
      state.selfPickClaimed = false;
      // 只清非补卡的待审记录；补卡记录保留（等父母审核）
      state.pendingAdditions = state.pendingAdditions.filter(p => p.isBackfill);
      // 重置专注力时光状态
      state.focusSelected = null;
      state.focusStarted = false;
      state.focusCompleted = false;
      state.focusOvertime = false;
      state.focusSeconds = 0;
      state.focusTimerRunning = false;
      if (_focusTimer) { clearInterval(_focusTimer); _focusTimer = null; }
      state.selfReport = {};
      // 同步清除 Firebase 上当天的 pending 记录
      if (isFirebaseReady() && typeof clearPendingByDate === 'function') {
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


// ── Firebase 初始化（从 <head> 移入，确保 app.js 监听器先注册）────
function initFirebase() {
  app.auth().signInAnonymously().then(() => {
    console.log('🔐 腾讯云开发匿名登录成功');
    window._firebaseReady = true;
    window._firebaseCurrentUser = { uid: 'anonymous' };
    window._firebaseDB = window._tcbDB();
    window.dispatchEvent(new Event('firebaseAuthReady'));
    window.dispatchEvent(new Event('firebaseReady'));
  }).catch(err => {
    console.error('❌ 匿名登录失败:', err);
    window._firebaseReady = true;
    window._firebaseCurrentUser = { uid: 'anonymous' };
    window.dispatchEvent(new Event('firebaseReady'));
  });
}