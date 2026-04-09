/**
 * ══════════════════════════════════════════════════════════════
 * 英雄成长计划 · 状态管理层
 * 状态定义、持久化、日期工具、积分计算、父母审核回调
 * ══════════════════════════════════════════════════════════════
 */

// ── 全局状态（由 loadState / saveState 管理）────────────────────
var state;

// ── localStorage 读写 ──────────────────────────────────────────
function loadState() {
  try {
    const s = localStorage.getItem(STATE_KEY);
    return s ? Object.assign(defaultState(), JSON.parse(s)) : defaultState();
  } catch(e) { return defaultState(); }
}
function saveState() {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
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

    // ── 自律统计 ───────────────────────────────────────────
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
  // 目前由按钮手动触发，不自动重置
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

  // 4. 待审加分（不含补卡，排除已通过 optionalTaskScore 计入的项目）
  const countedOptionalIds = optionalIds;
  const pendingScore = (state.pendingAdditions || [])
    .filter(p => p.date === today && !p.isBackfill && !countedOptionalIds.includes(p.taskId))
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
// Firebase 累计积分加载
// ══════════════════════════════════════════════════════════════

function loadTotalScoreFromFirebase() {
  if (!isFirebaseReady()) return;
  const db = window._firebaseDB;
  window._firebaseGet(window._firebaseRef(db, 'syncScore/score')).then(snap => {
    const val = snap.val();
    if (typeof val === 'number') {
      state.totalScore = val;
      const scoreEl = document.getElementById('totalScore');
      const shopEl = document.getElementById('shopScore');
      if (scoreEl) scoreEl.textContent = state.totalScore;
      if (shopEl) shopEl.textContent = state.totalScore;
    }
  }).catch(err => {
    console.error('加载累计积分失败:', err);
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
  if (idx !== -1) state.pendingAdditions.splice(idx, 1);

  if (taskId && state.todayChecked[taskId] === 'pending') {
    delete state.todayChecked[taskId];
  }
  if (deductScore && deductScore > 0) {
    state.totalScore = Math.max(0, state.totalScore - deductScore);
    if (isFirebaseReady()) {
      window._firebaseSet(
        window._firebaseRef(window._firebaseDB, 'syncScore/score'),
        window._firebaseIncrement(-deductScore)
      );
    }
  }
  saveState();
  renderAll();
}
