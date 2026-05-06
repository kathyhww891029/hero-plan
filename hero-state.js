/**
 * ══════════════════════════════════════════════════════════════
 * 英雄成长计划 · 状态管理层
 * 状态定义、持久化、日期工具、积分计算、父母审核回调
 * ══════════════════════════════════════════════════════════════
 */

// ── 全局状态（由 loadState / saveState 管理）────────────────────
var state;

// ── localStorage 读写（兼容旧 key，自动迁移）────────────────────
const FALLBACK_STATE_KEYS = ['heroplan_state_v2', 'heroplan_state', 'hero_plan_state_v2'];

// 调试：把所有 localStorage key 记录到诊断信息
window._localStorageDebug = function() {
  const keys = ['hero_plan_state_v2', 'heroplan_state_v2', 'heroplan_state', 'heroplan_state_backup'];
  const info = {};
  keys.forEach(k => { info[k] = localStorage.getItem(k) ? '[有数据，长度' + localStorage.getItem(k).length + ']' : 'null'; });
  return info;
};

function loadState() {
  // 1. 优先用当前 STATE_KEY（本地缓存，同步加载，保证 UI 立即可用）
  let data = _loadStateFromKey(STATE_KEY);
  window._debugLoad = { step: 'new_key', found: !!data, totalScore: data ? data.totalScore : null, STATE_KEY, _rawTotalScore: (() => { try { const raw = localStorage.getItem('hero_plan_state_v2'); return raw ? JSON.parse(raw).totalScore : 'no_data'; } catch(e) { 'parse_error'; } })() };
  // 2. 若没有，依次尝试旧 key（并做迁移）
  if (!data) {
    for (const key of FALLBACK_STATE_KEYS) {
      if (key === STATE_KEY) continue;
      data = _loadStateFromKey(key);
      if (data) {
        window._debugLoad = { step: 'migrated_from_' + key, found: true, totalScore: data.totalScore, _rawTotalScore: (() => { try { const raw = localStorage.getItem(STATE_KEY); return raw ? JSON.parse(raw).totalScore : 'no_data'; } catch(e) { 'parse_error'; } })() };
        console.log(`从旧 key '${key}' 迁移数据到 '${STATE_KEY}'`);
        state = data;
        saveState();
        localStorage.removeItem(key);
        break;
      }
    }
  }
  if (!data) {
    window._debugLoad = { step: 'default', found: false, totalScore: 0 };
  } else {
    if (!data.lastActiveDate) data.lastActiveDate = todayStr();
  }

  const loaded = data || defaultState();

  // 3. 异步从 Firebase 云端拉取（如果有）并在后台对比时间戳恢复更新数据
  if (window._firebaseDB && window._firebaseGet) {
    window._firebaseGet(window._firebaseRef(window._firebaseDB, 'syncState/main')).then(snapshot => {
      const cloudState = snapshot.val();
      if (cloudState && cloudState.state) {
        const cloudTime = cloudState.savedAt || 0;
        const localTime = loaded.lastSaveTime || 0;
        if (cloudTime > localTime) {
          console.log('📡 云端数据更新（时间戳更新），恢复云端状态');
          state = cloudState.state;
          state.lastSaveTime = cloudTime; // 保持云端时间戳
          saveState();
          renderAll();
        }
      }
    }).catch(err => {
      console.warn('⚠️ Firebase 拉取失败，使用本地缓存:', err);
    });
  }

  return loaded;
}

function _loadStateFromKey(key) {
  try {
    const s = localStorage.getItem(key);
    return s ? Object.assign(defaultState(), JSON.parse(s)) : null;
  } catch(e) { return null; }
}

function saveState() {
  // 先更新时间戳，确保本地和云端都是一致的
  state.lastSaveTime = Date.now();
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
  // ── Firebase 云端同步（异步，不阻塞 UI）──────────────────
  if (window._firebaseDB && window._firebaseSet) {
    window._firebaseSet(window._firebaseRef(window._firebaseDB, 'syncState/main'), {
      state: state,
      savedAt: state.lastSaveTime
    }).catch(err => {
      console.warn('⚠️ Firebase 同步失败:', err);
    });
  }
}

// ── 初始状态 ──────────────────────────────────────────────────
function defaultState() {
  return {
    totalScore: 0,

    // ── 英雄包状态 ──────────────────────────────────────────
    morningPack: {},          // { mp1:true, mp2:true, mp3:true }
    nightPack: {},            // { np1:true, np2:true, np3:true }
    morningPackBonus: false,  // 兼容旧字段（现由 MORNING_PACK_SELF_BONUS 动态计算）
    nightPackBonus: false,   // 兼容旧字段（现由 NIGHT_PACK_SELF_BONUS 动态计算）

    // ── 写作业 ──────────────────────────────────────────────
    hwCompleted: false,       // 今日作业已完成
    hwBlocks: 0,              // 今日已完成专注块数（0~3）

    // ── 专注力时光 ──────────────────────────────────────────
    focusSelected: null,      // 今日选择的活动 id
    focusStarted: false,      // 是否已开始计时
    focusCompleted: false,   // 是否已完成本次专注
    focusOvertime: false,   // 超时继续（超级专注）
    focusSeconds: 0,          // 专注计时秒数（持久化）
    focusTimerRunning: false, // 计时器是否运行
    focusStartTimestamp: null, // 计时开始时间戳

    // ── 今日打卡记录 ────────────────────────────────────────
    todayChecked: {},         // { taskId: true / 'pending' / 'approved' }

    // ── 待审加分池 ──────────────────────────────────────────
    pendingAdditions: [],     // [{type, taskId, name, score, date, actualDate, isSelf, isBackfill}]
    backfillLog: {},          // { taskId: [dateStr, ...] } 已补卡记录（跨天保留，清空后仍可查到）

    // ── 自律统计 ───────────────────────────────────────────
    selfReport: {},            // { "2026-04-10": { "hw_complete": "self" | "reminded" } }
    reviewedSelfLog: {},      // { "2026-04": { "2026-04-05": true } }

    // ── 连续打卡追踪 ────────────────────────────────────────
    streaks: {
      morning:  { count: 0, lastDate: '' },
      night:    { count: 0, lastDate: '' },
      homework: { count: 0, lastDate: '' },
      focus:    { count: 0, lastDate: '' },
    },

    // ── 任务卡 ──────────────────────────────────────────────
    cardClaims: {},           // { cardId: [dateStr, ...] }
    selfPickCard: null,      // 今日选择的挑战卡 id
    selfPickClaimed: false,  // 今日自选卡是否已领分
    weekUnlocked: false,     // 专项卡是否已解锁
    weekStartDate: null,     // 创建日期（用于计算weekUnlocked）
    weeklyCardCount: 0,      // 本周已完成任务卡数
    weeklyCardClaims: {},    // 本周每张卡领取日期 {cardId: [date]}
    weeklyAchievement: null, // 本周成就等级（兼容旧字段）

    // ── 阶段 ────────────────────────────────────────────────
    currentPhase: 1,
    phaseStartDate: null,
    lastSaveTime: 0,         // 上次保存时间戳（用于云端同步冲突判断）

    // ── 月度自律率（B类奖励解锁）────────────────────────────
    monthlyDisciplineLog: {}, // { "2026-04": { "2026-04-05": { morning:true, night:true, ... } } }

    // ── 迷宫 ────────────────────────────────────────────────
    mazeKnightNode: 'n_knight_spawn',
    mazePhasesCleared: [],   // [phaseId, ...] 已通关的阶段

    // ── 宝藏屋 ──────────────────────────────────────────────
    shopHistory: [],          // [{ id, name, cost, date }]

    // ── 跳绳 ───────────────────────────────────────────────
    ropeRecords: [],         // [{ date, count }]
    ropeMax: 0,
    ropeMilestonesAchieved: [],
    ropeStreak: { count: 0, lastDate: '' },

    // ── 阅读 ───────────────────────────────────────────────
    readCount: 0,             // 累计完成阅读卡次数

    // ── 勋章 ───────────────────────────────────────────────
    medalClaims: {},          // { medalId: timestamp }
    categoryPoints: {
      focus: 0, habit: 0, plan: 0, challenge: 0,
      reflect: 0, creative: 0, read: 0, sport: 0
    },

    // ── 历史兼容字段（保留但不再使用）───────────────────────
    weekStart: getWeekStart(),
    weeklyScore: 25,
    consecutiveDays: {},
    consecutive930: 0,
    weeklyAchievement: null,

    // ── 用户设置（可配置项）────────────────────────────────
    settings: {
      focusMinutes: DEFAULT_SETTINGS.focusMinutes,
    },

    // ── 上次活跃日期（用于自动检测新一天）──────────────────
    lastActiveDate: null,
  };
}

// ══════════════════════════════════════════════════════════════
// 日期工具
// ══════════════════════════════════════════════════════════════

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function yesterdayStr() {
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

// ══════════════════════════════════════════════════════════════
// 数据迁移
// ══════════════════════════════════════════════════════════════

function migrateWeeklyCardClaims() {
  if (!state.weeklyCardClaims) return;
  let changed = false;
  for (const id in state.weeklyCardClaims) {
    const val = state.weeklyCardClaims[id];
    if (typeof val === 'number') {
      const today = todayStr();
      state.weeklyCardClaims[id] = val > 0 ? [today] : [];
      changed = true;
    } else if (!Array.isArray(val)) {
      state.weeklyCardClaims[id] = [];
      changed = true;
    }
  }
  if (changed) saveState();
}

// ══════════════════════════════════════════════════════════════
// 初始化检查
// ══════════════════════════════════════════════════════════════

function checkWeekUnlock() {
  if (!state.weekStartDate) state.weekStartDate = todayStr();
  const start = new Date(state.weekStartDate);
  const now = new Date();
  const days = Math.floor((now - start) / 86400000);
  if (days >= WEEK_UNLOCK_DAYS && !state.weekUnlocked) {
    state.weekUnlocked = true;
    saveState();
  }
}

function checkDayReset() {
  const today = todayStr();
  if (state.lastActiveDate === today) return; // 同一天，不用重置

  // 跨天了！保存昨天连续打卡记录，然后重置每日状态
  const yesterday = yesterdayStr();
  const wasYesterday = state.lastActiveDate === yesterday;

  // ── 更新连续打卡（以昨晚为基准）────────────────────────────
  function updateStreak(key, packKey) {
    if (!state.streaks[key]) state.streaks[key] = { count: 0, lastDate: '' };
    const s = state.streaks[key];
    if (wasYesterday) {
      // 昨天也活跃 → 连续
      if (s.lastDate === yesterday) {
        s.count = (s.count || 0) + 1;
      } else {
        s.count = 1; // 断了重新计
      }
    } else {
      // 不是连续两天 → 重新计
      s.count = 1;
    }
    s.lastDate = yesterday;
  }

  // 早包/晚包/作业/专注 各自算一次"昨天完成"
  const morningDone = MORNING_PACK.length > 0 && MORNING_PACK.every(t => state.morningPack[t.id]);
  const nightDone = NIGHT_PACK.length > 0 && NIGHT_PACK.every(t => state.nightPack[t.id]);
  const hwDone = state.hwCompleted || (state.hwBlocks && state.hwBlocks > 0);
  const focusDone = state.focusCompleted;

  if (morningDone) updateStreak('morning', 'morningPack');
  if (nightDone) updateStreak('night', 'nightPack');
  if (hwDone) updateStreak('homework', 'hwCompleted');
  if (focusDone) updateStreak('focus', 'focusCompleted');

  // ── 重置每日状态（保留累计数据）────────────────────────────
  state.morningPack = {};
  state.nightPack = {};
  state.hwCompleted = false;
  state.hwBlocks = 0;
  state.focusSelected = null;
  state.focusStarted = false;
  state.focusCompleted = false;
  state.focusOvertime = false;
  state.focusSeconds = 0;
  state.focusTimerRunning = false;
  state.focusStartTimestamp = null;
  state.todayChecked = {};
  state.selfPickCard = null;
  state.selfPickClaimed = false;
  state.pendingAdditions = state.pendingAdditions.filter(p => p.date === today); // 只保留今天的

  // ── 更新活跃日期 ─────────────────────────────────────────
  state.lastActiveDate = today;
  saveState();
}

// ══════════════════════════════════════════════════════════════
// 今日积分计算
// 规则（经苇苇确认）：
//   早包：每件+1；全套自主完成额外+3（MORNING_PACK_SELF_BONUS）
//   晚包：每件+1；全套自主完成额外+3（NIGHT_PACK_SELF_BONUS）
//   作业：完成+2；专注块：第1块+1, 第2块+2, 第3块+3（calcHwBlockScore）
//   待审加分：当日提交的加分（补卡除外）按原分计入
//   勋章：当日获得的勋章 bonus 计入
// ══════════════════════════════════════════════════════════════

function calcTodayScore() {
  const today = todayStr();
  const todayStart = new Date(today).setHours(0, 0, 0, 0);
  const todayEnd = new Date(today).setHours(23, 59, 59, 999);

  // 1. 固定任务（早包 + 晚包）
  const morningDone = MORNING_PACK.filter(t => state.morningPack[t.id]).length;
  const nightDone = NIGHT_PACK.filter(t => state.nightPack[t.id]).length;
  const morningFull = morningDone === MORNING_PACK.length;
  const nightFull = nightDone === NIGHT_PACK.length;
  const fixedScore =
    morningDone + (morningFull ? MORNING_PACK_SELF_BONUS : 0) +
    nightDone   + (nightFull   ? NIGHT_PACK_SELF_BONUS   : 0);

  // 2. 作业（专注块 + 完成奖励）
  const hwBlockScore = calcHwBlockScore(state.hwBlocks || 0);
  const hwScore = hwBlockScore + (state.hwCompleted ? HW_COMPLETE_SCORE : 0);

  // 3. 其他任务（从 todayChecked 匹配 DAILY_OPTIONAL + DAILY_TEMP_TASKS）
  const optionalIds = [
    ...DAILY_OPTIONAL_INTEREST.map(t => t.id),
    ...DAILY_OPTIONAL_FUN.map(t => t.id),
    ...DAILY_TEMP_TASKS.map(t => t.id),
    // 专注力时光（独立打卡）
    'focus_time',
    // 作业打卡（hw_main id 在 DAILY_FIXED 里已单独处理，这里跳过避免重复）
  ];
  const alreadyCountedIds = new Set([
    ...MORNING_PACK.map(t => t.id),
    ...NIGHT_PACK.map(t => t.id),
    'hw_main',  // 作业已在上面单独计算
  ]);
  const optionalTaskScore = Object.keys(state.todayChecked).reduce((sum, id) => {
    if (alreadyCountedIds.has(id) || !optionalIds.includes(id)) return sum;
    const t = [...DAILY_OPTIONAL_INTEREST, ...DAILY_OPTIONAL_FUN, ...DAILY_TEMP_TASKS].find(x => x.id === id);
    return sum + (t ? t.score : 0);
  }, 0);

  // 4. 待审加分（不含补卡，排除已通过 optionalTaskScore 计入的项目，以及早/晚包项目）
  const countedOptionalIds = optionalIds;
  const pendingScore = (state.pendingAdditions || [])
    .filter(p => p.date === today && !p.isBackfill && !countedOptionalIds.includes(p.taskId) && !p.taskId.startsWith('morning_') && !p.taskId.startsWith('night_'))
    .reduce((sum, p) => sum + (p.score || 0), 0);

  // 5. 勋章奖励（当日获得）
  const medalScore = Object.entries(state.medalClaims || {})
    .filter(([id, ts]) => ts >= todayStart && ts <= todayEnd)
    .reduce((sum, [medalId]) => {
      const medal = MEDALS.find(m => m.id === medalId);
      return sum + (medal ? medal.bonus : 0);
    }, 0);

  return fixedScore + hwScore + optionalTaskScore + pendingScore + medalScore;
}

// 更新今日积分显示
function updateTodayScore() {
  const today = calcTodayScore();
  const el = document.getElementById('todayScore');
  if (el) el.textContent = today;
  const headerEl = document.getElementById('headerTodayScore');
  if (headerEl) headerEl.textContent = today > 0 ? `+${today}` : '+0';
}

// ══════════════════════════════════════════════════════════════
// Firebase 累计积分加载（离线时回退到本地存储）
// ══════════════════════════════════════════════════════════════
const LOCAL_TOTAL_SCORE_KEY = 'heroplan_total_score_v2';

function getLocalTotalScore() {
  try {
    return parseInt(localStorage.getItem(LOCAL_TOTAL_SCORE_KEY)) || 0;
  } catch(e) { return 0; }
}

function setLocalTotalScore(score) {
  localStorage.setItem(LOCAL_TOTAL_SCORE_KEY, String(score));
}

function loadTotalScoreFromFirebase() {
  // 先把 localStorage 里的值取出来备用（即使 Firebase 可用也先显示本地值）
  const localVal = getLocalTotalScore();
  // 如果 state.totalScore 为 0 但 localStorage 有值，用本地值
  if (state.totalScore === 0 && localVal > 0) {
    state.totalScore = localVal;
    _updateScoreDisplay();
  }

  if (!isFirebaseReady()) return; // Firebase 未就绪，保持本地值
  const db = window._firebaseDB;
  window._firebaseGet(window._firebaseRef(db, 'syncScore/score')).then(snap => {
    const val = snap.val();
    if (typeof val === 'number' && val > 0) {
      state.totalScore = val;
      setLocalTotalScore(val);
      _updateScoreDisplay();
    }
  }).catch(err => {
    console.error('Firebase 加载累计积分失败，使用本地值:', err);
  });
}

function _updateScoreDisplay() {
  const scoreEl = document.getElementById('totalScore');
  const shopEl = document.getElementById('shopScore');
  if (scoreEl) scoreEl.textContent = state.totalScore;
  if (shopEl) shopEl.textContent = state.totalScore;
}

// ── 积分变动时同步到本地专用存储 ─────────────────────────────
function syncTotalScoreToLocal() {
  setLocalTotalScore(state.totalScore);
  _updateScoreDisplay();
}

// ══════════════════════════════════════════════════════════════
// Firebase 自律数据加载（Bug 4 修复：读回 selfReport 和 reviewedSelfLog）
// ══════════════════════════════════════════════════════════════

function loadSelfReportFromFirebase() {
  if (!isFirebaseReady()) return;
  const db = window._firebaseDB;

  // 读取 selfReport
  window._firebaseGet(window._firebaseRef(db, 'selfReport')).then(snap => {
    const fb = snap.val();
    if (fb && typeof fb === 'object') {
      if (!state.selfReport) state.selfReport = {};
      // 合并：Firebase 数据优先（跨设备打卡以 Firebase 为准）
      for (const dateStr in fb) {
        if (!state.selfReport[dateStr]) state.selfReport[dateStr] = {};
        for (const taskId in fb[dateStr]) {
          state.selfReport[dateStr][taskId] = fb[dateStr][taskId];
        }
      }
      saveState();
      // 重新渲染自律进度条（若有的话）
      if (typeof renderDisciplineBar === 'function') renderDisciplineBar();
    }
  }).catch(err => {
    console.error('加载自律数据失败:', err);
  });

  // 读取 reviewedSelfLog
  window._firebaseGet(window._firebaseRef(db, 'reviewedSelfLog')).then(snap => {
    const fb = snap.val();
    if (fb && typeof fb === 'object') {
      if (!state.reviewedSelfLog) state.reviewedSelfLog = {};
      for (const ym in fb) {
        if (!state.reviewedSelfLog[ym]) state.reviewedSelfLog[ym] = {};
        for (const dateStr in fb[ym]) {
          state.reviewedSelfLog[ym][dateStr] = true;
        }
      }
      saveState();
    }
  }).catch(err => {
    console.error('加载审核自律记录失败:', err);
  });
}

// ══════════════════════════════════════════════════════════════
// 父母审核回调
// ══════════════════════════════════════════════════════════════

// 审核通过
function onParentApprove(taskType, taskId, effectiveScore, isSelf) {
  const today = todayStr();
  const idx = state.pendingAdditions.findIndex(p =>
    p.type === taskType && p.taskId === taskId && p.date === today
  );
  if (idx !== -1) state.pendingAdditions.splice(idx, 1);

  if (taskId && state.todayChecked[taskId] === 'pending') {
    state.todayChecked[taskId] = 'approved';
  }
  // ✅ 审核通过不加两次分：分数在孩子提交时已计入（pending），审核通过只改状态
  if (isSelf === true) {
    const ym = today.slice(0, 7);
    if (!state.reviewedSelfLog[ym]) state.reviewedSelfLog[ym] = {};
    state.reviewedSelfLog[ym][today] = true;
  }
  saveState();
  renderAll();
}

// 审核驳回
function onParentReject(taskType, taskId, isSelf, deductScore) {
  const today = todayStr();
  const idx = state.pendingAdditions.findIndex(p =>
    p.type === taskType && p.taskId === taskId && p.date === today
  );
  const record = idx !== -1 ? state.pendingAdditions[idx] : null;
  if (idx !== -1) state.pendingAdditions.splice(idx, 1);

  if (taskId && state.todayChecked[taskId] === 'pending') {
    delete state.todayChecked[taskId];
  }
  if (deductScore && deductScore > 0) {
    state.totalScore = Math.max(0, state.totalScore - deductScore);
  }

  // ── 挑战卡计数回滚 ──────────────────────────────────
  if (taskType === 'card' && taskId) {
    // 回滚 weeklyCardClaims：从数组中移除今天
    if (state.weeklyCardClaims[taskId]) {
      state.weeklyCardClaims[taskId] = state.weeklyCardClaims[taskId].filter(d => d !== today);
      if (state.weeklyCardClaims[taskId].length === 0) {
        delete state.weeklyCardClaims[taskId];
      }
    }
    // 回滚 cardClaims 计数
    if (state.cardClaims[taskId]) {
      state.cardClaims[taskId]--;
      if (state.cardClaims[taskId] <= 0) delete state.cardClaims[taskId];
    }
    // 回滚 weeklyCardCount（仅当本周首次领卡时才会+1）
    if (record && record.incrementedWeeklyCount) {
      state.weeklyCardCount = Math.max(0, (state.weeklyCardCount || 0) - 1);
    }
    // 回滚阅读计数
    if (record && record.isReadingCard) {
      state.readCount = Math.max(0, (state.readCount || 0) - 1);
    }
  }

  saveState();
  renderAll();
}
