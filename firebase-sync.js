/* ══════════════════════════════════════════════════════════════
   英雄成长计划 · Firebase 同步与父母审核逻辑
══════════════════════════════════════════════════════════════ */

// ── Firebase 工具函数 ─────────────────────────────────────────
function getDB() { return window._firebaseDB; }
function fbRef(path) { return window._firebaseRef(getDB(), path); }

// ── PIN码管理（存本地，各设备独立设置） ────────────────────────
const PIN_KEY = 'heroplan_pins';

function getPins() {
  try {
    const s = localStorage.getItem(PIN_KEY);
    return s ? JSON.parse(s) : { mom: null, dad: null };
  } catch(e) { return { mom: null, dad: null }; }
}

function savePins(pins) {
  localStorage.setItem(PIN_KEY, JSON.stringify(pins));
}

// ── 当前登录父母身份 ───────────────────────────────────────────
let currentParent = null; // 'mom' | 'dad'
let selectedWho = 'mom';
let setupWho = 'mom';

function selectWho(who) {
  selectedWho = who;
  document.getElementById('btnWhoMom').classList.toggle('active', who === 'mom');
  document.getElementById('btnWhoDad').classList.toggle('active', who === 'dad');
}

function selectSetupWho(who) {
  setupWho = who;
  document.getElementById('setupWhoMom').classList.toggle('active', who === 'mom');
  document.getElementById('setupWhoDad').classList.toggle('active', who === 'dad');
}

function showPinSetup() {
  document.getElementById('parentLogin').style.display = 'none';
  document.getElementById('pinSetupArea').style.display = 'block';
  document.getElementById('pinSetupHint').textContent = '';
}

function hidePinSetup() {
  document.getElementById('pinSetupArea').style.display = 'none';
  document.getElementById('parentLogin').style.display = 'block';
}

function savePinSetup() {
  const newPin = document.getElementById('newPinInput').value.trim();
  const confirmPin = document.getElementById('confirmPinInput').value.trim();
  const hint = document.getElementById('pinSetupHint');

  if (!/^\d{4}$/.test(newPin)) {
    hint.textContent = '❌ PIN码必须是4位数字';
    hint.style.color = '#e74c3c';
    return;
  }
  if (newPin !== confirmPin) {
    hint.textContent = '❌ 两次输入不一致';
    hint.style.color = '#e74c3c';
    return;
  }

  const pins = getPins();
  pins[setupWho] = newPin;
  savePins(pins);

  hint.textContent = `✅ ${setupWho === 'mom' ? '妈妈' : '爸爸'}的PIN码设置成功！`;
  hint.style.color = '#27ae60';
  document.getElementById('newPinInput').value = '';
  document.getElementById('confirmPinInput').value = '';
  setTimeout(hidePinSetup, 1500);
}

function parentLogin() {
  const pin = document.getElementById('parentPinInput').value.trim();
  const hint = document.getElementById('parentLoginHint');
  const pins = getPins();

  if (!pins[selectedWho]) {
    hint.textContent = '❌ 还没设置PIN码，请先设置';
    hint.style.color = '#e74c3c';
    return;
  }
  if (pin !== pins[selectedWho]) {
    hint.textContent = '❌ PIN码错误，请重试';
    hint.style.color = '#e74c3c';
    document.getElementById('parentPinInput').value = '';
    return;
  }

  currentParent = selectedWho;
  document.getElementById('parentLogin').style.display = 'none';
  document.getElementById('parentPanel').style.display = 'block';
  const label = selectedWho === 'mom' ? '👩 妈妈审核中心' : '👨 爸爸审核中心';
  document.getElementById('parentWhoLabel').textContent = label;
  document.getElementById('parentPinInput').value = '';
  hint.textContent = '';
  loadPendingList();
  loadReviewedList();
  // 渲染品格考核选项
  if (typeof renderCharacterChecklist === 'function') renderCharacterChecklist();
}

function parentLogout() {
  currentParent = null;
  document.getElementById('parentPanel').style.display = 'none';
  document.getElementById('parentLogin').style.display = 'block';
}

// ── 提交待审申请（孩子打卡时调用） ────────────────────────────
function submitPending(type, id, name, score, extra, isSelf) {
  if (!window._firebaseReady) return null;
  const record = {
    type,       // 'daily' | 'card' | 'rope' | 'homework' | 'focus' | 'pack'
    taskId: id,
    name,
    score,
    extra: extra || '',
    isSelf: isSelf !== undefined ? isSelf : null,  // null 表示待父母审核确认
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toLocaleTimeString('zh-CN', {hour:'2-digit', minute:'2-digit'}),
    status: 'pending',
    submittedAt: Date.now()
  };
  // 返回 push() 的 ThenableReference，从中获取 key
  return window._firebasePush(fbRef('pending'), record).then(ref => ref.key);
}

// 更新待审记录的 isSelf（用于自律弹窗确定后更新 Firebase 中的记录）
function updatePendingSelf(type, taskId, date, isSelf) {
  if (!window._firebaseReady) return;
  // 在 pending 中找到对应记录并更新 isSelf
  window._firebaseGet(fbRef('pending')).then(snap => {
    const data = snap.val();
    if (!data) return;
    const entry = Object.entries(data).find(([k, v]) =>
      v.type === type && v.taskId === taskId && v.date === date
    );
    if (entry) {
      window._firebaseSet(fbRef('pending/' + entry[0]), { ...entry[1], isSelf });
    }
  });
}

// ── 按日期清除 pending 记录（重置今日打卡时调用） ──────────────
function clearPendingByDate(date) {
  if (!window._firebaseReady) return;
  window._firebaseGet(fbRef('pending')).then(snap => {
    const data = snap.val();
    if (!data) return;
    Object.entries(data).forEach(([key, record]) => {
      if (record.date === date) {
        window._firebaseRemove(fbRef('pending/' + key));
      }
    });
  });
}

// ── 加载待审列表 ──────────────────────────────────────────────
// 辅助函数：根据 taskId 和 type 获取任务图标
function getTaskIcon(taskId, type) {
  if (!taskId) return '📋';
  
  // 从 taskId 解析任务ID（去掉日期后缀）
  // 格式：morning_mp1_2026-04-05 或 morning_mp1 或 night_np2
  const parts = taskId.split('_');
  const baseId = parts.length >= 3 && /^\d{4}-\d{2}-\d{2}$/.test(parts[parts.length - 1])
    ? parts.slice(0, -1).join('_')  // 去掉末尾日期
    : taskId;
  
  // 任务图标映射
  const iconMap = {
    // 早晨包
    'morning_mp1': '👕', 'morning_mp2': '🦷', 'morning_mp3': '🍳',
    // 睡前包
    'night_np1': '🛁', 'night_np2': '🎒', 'night_np3': '🌛',
    // 挑战卡（根据 taskId 前缀判断）
  };
  
  if (iconMap[baseId]) return iconMap[baseId];
  
  // 挑战卡：taskId 包含卡片ID
  if (type === 'card') return '🃏';
  // 作业
  if (baseId.includes('hw')) return '📚';
  // 专注力
  if (baseId.includes('focus')) return '⏱️';
  // 每日任务
  if (type === 'daily') return '🦸';
  
  return '📋';
}

// 辅助函数：根据 taskId 和 type 获取任务详情（sub、desc、tip）
function getTaskDetails(taskId, type) {
  if (!taskId) return {};
  
  // 提取基础ID（去掉日期后缀）
  const parts = taskId.split('_');
  const baseId = parts.length >= 3 && /^\d{4}-\d{2}-\d{2}$/.test(parts[parts.length - 1])
    ? parts.slice(0, -1).join('_')
    : taskId;
  
  // 英雄包任务 (morning_mp1, night_np1)
  if (baseId.startsWith('morning_') || baseId.startsWith('night_')) {
    const packType = baseId.startsWith('morning_') ? 'morning' : 'night';
    const taskIdShort = baseId.split('_')[1]; // 'mp1' 或 'np1'
    const pack = packType === 'morning' ? MORNING_PACK : NIGHT_PACK;
    const task = pack.find(t => t.id === taskIdShort);
    if (task) return { sub: task.sub || '', desc: task.desc || '', tip: task.tip || '' };
  }
  
  // 全套奖励 (morning_full, night_full)
  if (baseId === 'morning_full') {
    return { sub: '早晨三件事全部完成！🌟', desc: '穿衣服+洗脸刷牙+吃早饭全套自主完成', tip: '' };
  }
  if (baseId === 'night_full') {
    return { sub: '睡前全套完成！🌙', desc: '洗澡+收拾书包+按时上床全套自主完成', tip: '' };
  }
  
  // 每日固定任务 (mp1, mp2, mp3, np1, np2, np3)
  const dailyTask = DAILY_FIXED.find(t => t.id === baseId || t.id === taskId);
  if (dailyTask) return { sub: dailyTask.sub || '', desc: dailyTask.desc || '', tip: dailyTask.tip || '' };
  
  // 作业任务
  if (type === 'homework' || taskId.includes('homework')) {
    return { sub: HOMEWORK_TASK.sub || '', desc: HOMEWORK_TASK.speech || '', tip: '' };
  }
  
  // 专注力任务
  if (type === 'focus' || taskId.includes('focus')) {
    return { sub: FOCUS_TIME.sub || '', desc: FOCUS_TIME.speech || '', tip: '' };
  }
  
  // 任务卡 - 直接匹配ID
  const card = TASK_CARDS.find(t => t.id === taskId || t.id === baseId);
  if (card) return { sub: card.sub || '', desc: card.desc || '', tip: card.tip || '' };
  
  // 任务卡 - 尝试从baseId匹配
  const cardByBase = TASK_CARDS.find(t => t.id === baseId);
  if (cardByBase) return { sub: cardByBase.sub || '', desc: cardByBase.desc || '', tip: cardByBase.tip || '' };
  
  return {};
}

// 辅助函数：判断是否是补卡记录
function isBackfillItem(item) {
  // 补卡记录的 extra 是日期格式（YYYY-MM-DD）
  return item.extra && /^\d{4}-\d{2}-\d{2}$/.test(item.extra);
}

// 辅助函数：格式化补卡日期显示
function formatBackfillDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  return `${parseInt(parts[1])}月${parseInt(parts[2])}日`;
}

function loadPendingList() {
  if (!window._firebaseReady) return;
  window._firebaseOnValue(fbRef('pending'), (snapshot) => {
    const el = document.getElementById('pendingList');
    const batchBtns = document.getElementById('batchBtns');
    if (!el) return;

    const data = snapshot.val();
    if (!data) {
      el.innerHTML = '<div class="empty-tip">暂无待审记录 🎉</div>';
      batchBtns.style.display = 'none';
      return;
    }

    const items = Object.entries(data).map(([key, val]) => ({ key, ...val }));
    items.sort((a, b) => a.submittedAt - b.submittedAt);

    el.innerHTML = items.map(item => {
      const icon = getTaskIcon(item.taskId, item.type);
      const isBackfill = isBackfillItem(item);
      const backfillDate = isBackfill ? formatBackfillDate(item.extra) : '';
      const backfillTag = isBackfill ? `<span class="backfill-tag">📅补卡：${backfillDate}</span>` : '';
      const taskDetails = getTaskDetails(item.taskId, item.type);
      
      return `
      <div class="pending-item" id="pi-${item.key}" data-step="1">
        <div class="pending-info">
          <div class="pending-name">${icon} ${item.name}</div>
          <div class="pending-meta">${item.date} ${item.time} · ${typeLabel(item.type)} ${backfillTag}</div>
          ${taskDetails.sub ? `<div class="pending-desc">📌 ${taskDetails.sub}</div>` : ''}
          ${taskDetails.tip ? `<div class="pending-tip">${taskDetails.tip.replace(/\n/g, '<br>')}</div>` : ''}
          ${item.extra && !isBackfill ? `<div class="pending-extra">${item.extra}</div>` : ''}
          ${item.isSelf === true ? `<div class="child-self-report child-self">💪 孩子自报：自己完成</div>` : ''}
          ${item.isSelf === false ? `<div class="child-self-report child-reminded">👋 孩子自报：爸妈提醒</div>` : ''}
          ${item.isSelf === null || item.isSelf === undefined ? `<div class="child-self-report child-unknown">❓ 等待父母审核</div>` : ''}
        </div>
        <div class="pending-score">+${item.score}分</div>
        <div class="pending-actions">
          <!-- Step 1: 确认孩子是否完成 -->
          <div class="step1-done">
            <button class="btn-done" onclick="step1Done('${item.key}')">✅ 完成了</button>
            <button class="btn-not-done" onclick="step1NotDone('${item.key}')">❌ 没完成</button>
          </div>
          <!-- Step 2: 确认是否自主完成（仅在点了"完成了"之后出现）-->
          <div class="step2-self" style="display:none">
            <div class="step2-label">父母审核：自己完成的？</div>
            <button class="btn-self" onclick="confirmDone('${item.key}', true)">💪 是</button>
            <button class="btn-reminded" onclick="confirmDone('${item.key}', false)">👋 爸妈提醒</button>
            <button class="btn-cancel" onclick="cancelStep2('${item.key}')">取消</button>
          </div>
          <!-- Step 2: 驳回确认（仅在点了"没完成"之后出现）-->
          <div class="step2-reject" style="display:none">
            <div class="step2-label">确定驳回？</div>
            <button class="btn-confirm-reject" onclick="rejectOneConfirm('${item.key}')">⚠️ 确认驳回</button>
            <button class="btn-cancel" onclick="cancelStep2('${item.key}')">取消</button>
          </div>
        </div>
      </div>`;
    }).join('');
    batchBtns.style.display = 'flex';
  });
}

function typeLabel(type) {
  const map = { daily:'每日任务', card:'任务卡', rope:'跳绳', manual:'手动奖励' };
  return map[type] || type;
}

// ── 父母审核两步操作辅助函数 ───────────────────────────────────
// Step1: 点"完成了" → 显示第二步选择是否自主完成
function step1Done(key) {
  const pi = document.getElementById('pi-' + key);
  if (!pi) return;
  pi.dataset.step = '2self';
  pi.querySelector('.step1-done').style.display = 'none';
  pi.querySelector('.step2-self').style.display = 'flex';
  pi.querySelector('.step2-reject').style.display = 'none';
}
// Step1: 点"没完成" → 显示驳回确认
function step1NotDone(key) {
  const pi = document.getElementById('pi-' + key);
  if (!pi) return;
  pi.dataset.step = '2reject';
  pi.querySelector('.step1-done').style.display = 'none';
  pi.querySelector('.step2-self').style.display = 'none';
  pi.querySelector('.step2-reject').style.display = 'flex';
}
// 取消第二步 → 回到第一步
function cancelStep2(key) {
  const pi = document.getElementById('pi-' + key);
  if (!pi) return;
  pi.dataset.step = '1';
  pi.querySelector('.step1-done').style.display = 'flex';
  pi.querySelector('.step2-self').style.display = 'none';
  pi.querySelector('.step2-reject').style.display = 'none';
}
// Step2: 确认"完成了"且选择了是否自主完成 → 执行通过
function confirmDone(key, isSelf) {
  window._firebaseGet(fbRef('pending/' + key)).then(snap => {
    const val = snap.val();
    if (!val) { showParentToast('记录不存在'); return; }
    doApproveOne(key, val.score, val.name, val.taskId || '', val.type || 'daily', isSelf);
  });
}
// Step2: 确认驳回
function rejectOneConfirm(key) {
  window._firebaseGet(fbRef('pending/' + key)).then(snap => {
    const val = snap.val();
    if (!val) { showParentToast('记录不存在'); return; }
    doRejectOne(key, val.name, val.taskId || '', val.type || 'daily', val.score);
  });
}

// ── 审核通过单条 ──────────────────────────────────────────────
// 固定任务地板机制：计算可选任务实际应得分数
function calcOptionalEffectiveScore(item, score) {
  if (item.type !== 'daily') return score; // 任务卡不受影响
  // 判断是否是可选任务（do开头）
  const isOptional = item.taskId && item.taskId.startsWith('do');
  if (!isOptional) return score;

  // 从 state 中读取今日固定任务完成情况
  const st = (typeof state !== 'undefined') ? state : null;
  if (!st) return score;

  const today = new Date().toISOString().slice(0, 10);
  const todayDate = item.date || today;

  // 统计固定任务完成数（从 reviewedList 中查当天固定任务通过数）
  // 简化版：通过检查 todayChecked 中固定任务通过数量
  const fixedIds = (typeof DAILY_FIXED !== 'undefined') ? DAILY_FIXED.map(t => t.id) : [];
  const totalFixed = fixedIds.length;
  if (totalFixed === 0) return score;

  // 统计当天固定任务通过数（approved状态）
  const approvedFixed = fixedIds.filter(id => {
    const s = st.todayChecked && st.todayChecked[id];
    return s === 'approved';
  }).length;

  const rate = approvedFixed / totalFixed;

  if (rate >= 0.8) {
    return score; // ✅ 全额
  } else if (rate >= 0.5) {
    return Math.floor(score / 2); // 🔶 减半
  } else {
    return 0; // ❌ 不计分
  }
}

// 内部实现：审核通过（isSelf 由父母在第二步明确选择）
function doApproveOne(key, score, name, taskId, taskType, isSelf) {
  if (!window._firebaseReady) return;
  // 固定任务地板机制：可选任务检查
  const fakeItem = { type: taskType || 'daily', taskId: taskId || '' };
  const effectiveScore = calcOptionalEffectiveScore(fakeItem, score);
  const scoreNote = effectiveScore < score
    ? `（固定任务未达标，实得${effectiveScore}分）`
    : '';

  // 加入已审记录（含 isSelf）
  window._firebasePush(fbRef('reviewed'), {
    name, score: effectiveScore, originalScore: score, result: 'approved',
    isSelf: isSelf,  // 父母明确选择的自律结果
    reviewer: currentParent === 'mom' ? '妈妈' : '爸爸',
    reviewedAt: Date.now(),
    date: new Date().toISOString().slice(0, 10),
    scoreNote
  });
  // 更新 Firebase 总分（积分在孩子完成时已入账，审核通过时不再重复加）
  // 更新月度自律统计
  if (typeof onParentApprove === 'function') {
    onParentApprove(taskType || 'daily', taskId || '', effectiveScore, isSelf);
  }
  // 删除 pending
  window._firebaseRemove(fbRef('pending/' + key));
  const msg = effectiveScore < score
    ? `✅ 已通过「${name}」，+${effectiveScore}分${scoreNote}`
    : `✅ 已通过「${name}」，+${score}分！`;
  showParentToast(msg);
}

// 内部实现：驳回单条
function doRejectOne(key, name, taskId, taskType, score) {
  if (!window._firebaseReady) return;
  window._firebasePush(fbRef('reviewed'), {
    name, score: 0, originalScore: score, result: 'rejected',
    reviewer: currentParent === 'mom' ? '妈妈' : '爸爸',
    reviewedAt: Date.now(),
    date: new Date().toISOString().slice(0, 10)
  });
  // 孩子完成时已加积分，驳回时需扣回
  window._firebaseGet(fbRef('syncScore')).then(snap => {
    const cur = snap.val() || 0;
    window._firebaseSet(fbRef('syncScore'), Math.max(0, cur - (score || 0)));
  });
  // 更新本地：审核驳回
  if (typeof onParentReject === 'function') {
    onParentReject(taskType || 'daily', taskId || '', null, score || 0);
  }
  window._firebaseRemove(fbRef('pending/' + key));
  showParentToast(`❌ 已驳回「${name}」`);
}

// ── 全部通过 ──────────────────────────────────────────────────
// 第一步：弹出自律选择 modal
function approveAll() {
  if (!window._firebaseReady) return;
  showBatchApproveModal();
}

// 批量通过自律选择 modal
function showBatchApproveModal() {
  closeBatchModal();
  const overlay = document.createElement('div');
  overlay.id = 'batchModal';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.45);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:28px 24px;max-width:360px;width:100%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.12);">
      <div style="font-size:22px;margin-bottom:8px;">✅ 全部完成确认</div>
      <div style="color:#666;font-size:15px;margin-bottom:22px;">这些任务，孩子都自己完成的吗？</div>
      <button onclick="doApproveAllWithSelf(true)" style="width:100%;padding:13px;border:none;border-radius:12px;background:#e8f5e9;color:#2e7d32;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:10px;">💪 是，都自己完成</button>
      <button onclick="doApproveAllWithSelf(false)" style="width:100%;padding:13px;border:none;border-radius:12px;background:#fff8e1;color:#f57f17;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:10px;">👋 不是，有爸妈提醒</button>
      <button onclick="closeBatchModal()" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:12px;background:#fff;color:#757575;font-size:14px;cursor:pointer;">取消</button>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeBatchModal(); });
}
function closeBatchModal() {
  const m = document.getElementById('batchModal');
  if (m) m.remove();
}
// 实际执行批量通过，isSelf 由父母在 modal 中选择
function doApproveAllWithSelf(isSelf) {
  closeBatchModal();
  window._firebaseGet(fbRef('pending')).then(snap => {
    const data = snap.val();
    if (!data) return;
    let totalAdd = 0;
    Object.entries(data).forEach(([key, val]) => {
      const fakeItem = { type: val.type || 'daily', taskId: val.taskId || '' };
      const effectiveScore = calcOptionalEffectiveScore(fakeItem, val.score);
      totalAdd += effectiveScore;
      window._firebasePush(fbRef('reviewed'), {
        name: val.name, score: effectiveScore, originalScore: val.score, result: 'approved',
        isSelf: isSelf,  // 父母明确选择的自律结果
        reviewer: currentParent === 'mom' ? '妈妈' : '爸爸',
        reviewedAt: Date.now(),
        date: new Date().toISOString().slice(0, 10)
      });
      if (typeof onParentApprove === 'function') {
        onParentApprove(val.type || 'daily', val.taskId || '', effectiveScore, isSelf);
      }
      window._firebaseRemove(fbRef('pending/' + key));
    });
    // 积分在孩子完成时已入账，批量通过时不再重复加（totalAdd 仅用于提示）
    showParentToast(`✅ 全部通过！共 +${totalAdd}分！`);
  });
}

// ── 全部驳回 ──────────────────────────────────────────────────
function rejectAll() {
  if (!window._firebaseReady) return;
  if (!confirm('确定要驳回所有待审记录吗？')) return;
  window._firebaseGet(fbRef('pending')).then(snap => {
    const data = snap.val();
    if (!data) return;
    let totalDeduct = 0;
    Object.entries(data).forEach(([key, val]) => {
      totalDeduct += val.score || 0;
      window._firebasePush(fbRef('reviewed'), {
        name: val.name, score: 0, originalScore: val.score, result: 'rejected',
        reviewer: currentParent === 'mom' ? '妈妈' : '爸爸',
        reviewedAt: Date.now(),
        date: new Date().toISOString().slice(0, 10)
      });
      // 孩子完成时已加积分，驳回时需扣回
      if (typeof onParentReject === 'function') {
        onParentReject(val.type || 'daily', val.taskId || '', null, val.score || 0);
      }
      window._firebaseRemove(fbRef('pending/' + key));
    });
    // 扣减 Firebase 总分
    if (totalDeduct > 0) {
      window._firebaseGet(fbRef('syncScore')).then(s2 => {
        window._firebaseSet(fbRef('syncScore'), Math.max(0, (s2.val() || 0) - totalDeduct));
      });
    }
    showParentToast('❌ 全部已驳回');
  });
}

// ── 加载已审历史 ──────────────────────────────────────────────
function loadReviewedList() {
  if (!window._firebaseReady) return;
  window._firebaseOnValue(fbRef('reviewed'), (snapshot) => {
    const el = document.getElementById('reviewedList');
    if (!el) return;
    const data = snapshot.val();
    if (!data) { el.innerHTML = '<div class="empty-tip">暂无记录</div>'; return; }
    const items = Object.values(data);
    items.sort((a, b) => b.reviewedAt - a.reviewedAt);
    const recent = items.slice(0, 20);
    el.innerHTML = recent.map(item => `
      <div class="reviewed-item ${item.result}">
        <span class="reviewed-icon">${item.result === 'approved' ? '✅' : '❌'}</span>
        <span class="reviewed-name">${item.name}</span>
        ${item.result === 'approved' && item.isSelf === true ? '<span class="reviewed-self-badge" title="自己完成">💪</span>' : ''}
        ${item.result === 'approved' && item.isSelf === false ? '<span class="reviewed-self-badge" title="爸妈提醒">👋</span>' : ''}
        <span class="reviewed-score">${item.result === 'approved' ? '+'+item.score+'分' : '驳回'}</span>
        <span class="reviewed-by">${item.reviewer}</span>
        <span class="reviewed-date">${item.date}</span>
      </div>`).join('');
  });
}

// ── 手动奖励积分 ──────────────────────────────────────────────
function addManualBonus() {
  const score = parseInt(document.getElementById('bonusInput').value);
  const reason = document.getElementById('bonusReason').value.trim() || '父母奖励';
  if (!score || score < 1) { showParentToast('❌ 请输入有效分数'); return; }
  window._firebasePush(fbRef('reviewed'), {
    name: reason, score, result: 'approved',
    reviewer: currentParent === 'mom' ? '妈妈' : '爸爸',
    reviewedAt: Date.now(),
    date: new Date().toISOString().slice(0, 10)
  });
  window._firebaseGet(fbRef('syncScore')).then(s => {
    window._firebaseSet(fbRef('syncScore'), (s.val() || 0) + score);
  });
  document.getElementById('bonusInput').value = '';
  document.getElementById('bonusReason').value = '';
  showParentToast(`🎁 已发放 +${score}分！`);
}

// ── 分数调整（加减分）────────────────────────────────────────
function adjustScore() {
  const input = document.getElementById('adjustInput').value.trim();
  const reason = document.getElementById('adjustReason').value.trim();
  if (input === '' || isNaN(parseInt(input))) {
    showParentToast('❌ 请输入有效分数（正数加分，负数扣分）');
    return;
  }
  if (!reason) {
    showParentToast('❌ 请填写调整原因');
    return;
  }
  const score = parseInt(input);
  if (score === 0) {
    showParentToast('❌ 调整分数不能为0');
    return;
  }
  // 扣分时二次确认
  if (score < 0) {
    if (!confirm(`确定要扣除 ${Math.abs(score)} 分吗？`)) return;
  }
  // 写入 Firebase reviewed 记录（type=adjustment 区分于普通奖励）
  window._firebasePush(fbRef('reviewed'), {
    name: reason, score, result: 'adjustment',
    reviewer: currentParent === 'mom' ? '妈妈' : '爸爸',
    reviewedAt: Date.now(),
    date: new Date().toISOString().slice(0, 10)
  });
  // 更新 Firebase syncScore
  window._firebaseGet(fbRef('syncScore')).then(s => {
    const current = s.val() || 0;
    const newScore = current + score;
    if (newScore < 0) {
      showParentToast('❌ 分数不能为负数！');
      return;
    }
    window._firebaseSet(fbRef('syncScore'), newScore);
    // 同时更新本地 state
    state.totalScore = newScore;
    saveState();
    renderHeader();
    renderShop();
    const emoji = score > 0 ? '📈' : '📉';
    const label = score > 0 ? `+${score}` : `${score}`;
    showParentToast(`${emoji} 已调整 ${label}分：` + reason);
  });
  // 清空表单
  document.getElementById('adjustInput').value = '';
  document.getElementById('adjustReason').value = '';
}

// ── Toast提示 ─────────────────────────────────────────────────
function showParentToast(msg) {
  let toast = document.getElementById('parentToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'parentToast';
    toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 20px;border-radius:20px;font-size:14px;z-index:9999;max-width:80%;text-align:center';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 2500);
}

// ── 监听 Firebase syncScore → 同步到本地 state ───────────────
function listenSyncScore() {
  if (!window._firebaseReady) return;
  window._firebaseOnValue(fbRef('syncScore'), (snapshot) => {
    const serverScore = snapshot.val();
    if (serverScore !== null && serverScore !== undefined) {
      if (state.totalScore !== serverScore) {
        state.totalScore = serverScore;
        saveState();
        renderHeader();
        renderShop();
        // 显示积分更新提示
        showSyncBadge();
      }
    }
  });
}

function showSyncBadge() {
  let badge = document.getElementById('syncBadge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'syncBadge';
    badge.style.cssText = 'position:fixed;top:60px;right:12px;background:#27ae60;color:#fff;padding:6px 12px;border-radius:12px;font-size:12px;z-index:999';
    document.body.appendChild(badge);
  }
  badge.textContent = '☁️ 积分已同步';
  badge.style.display = 'block';
  setTimeout(() => { badge.style.display = 'none'; }, 2000);
  // 积分入账后，尝试触发补给站激励提示
  if (typeof tryShowShopBoost === 'function') {
    tryShowShopBoost(1); // score变化了就检查
  }
}


// ══════════════════════════════════════════════════════════════
//  🏅 英雄品格记录
// ══════════════════════════════════════════════════════════════

// 渲染品格考核选项列表（父母端）
function renderCharacterChecklist() {
  const el = document.getElementById('characterChecklist');
  if (!el) return;
  if (typeof CHARACTER_CHECKS === 'undefined') return;

  const todayStr = new Date().toISOString().slice(0, 10);

  el.innerHTML = CHARACTER_CHECKS.map(c => `
    <div style="background:#FFFBF5;border:1.5px solid #FFE0B2;border-radius:12px;padding:12px 14px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
        <div style="flex:1">
          <div style="font-size:0.92rem;font-weight:700;color:#1a1a2e;margin-bottom:3px">
            ${c.icon} ${c.name}
            <span style="font-size:0.78rem;color:#FF6B35;font-weight:600;margin-left:6px">+${c.score}分</span>
          </div>
          <div style="font-size:0.82rem;color:#888;line-height:1.5">${c.desc}</div>
          <div style="font-size:0.78rem;color:#aaa;margin-top:3px">${c.categoryName}</div>
        </div>
        <button
          style="flex-shrink:0;background:#FF6B35;color:#fff;border:none;border-radius:20px;padding:6px 14px;font-size:0.82rem;font-weight:700;cursor:pointer;white-space:nowrap"
          onclick="recordHeroAction('${c.id}', '${c.name}', ${c.score}, \`${c.praise.replace(/`/g, "'")}\`)">
          记录 ✓
        </button>
      </div>
    </div>`).join('');
}

// 父母点击「记录」某条品格行为
function recordHeroAction(checkId, name, score, praise) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const reviewer = currentParent === 'mom' ? '妈妈' : '爸爸';

  // 1. 存入 Firebase reviewed（走积分审核通道，直接 approved）
  window._firebasePush(fbRef('reviewed'), {
    name: `🏅 品格记录·${name}`,
    score,
    result: 'approved',
    reviewer,
    reviewedAt: Date.now(),
    date: todayStr,
    type: 'character',
    checkId,
    praise
  });

  // 2. 同步积分
  window._firebaseGet(fbRef('syncScore')).then(s => {
    window._firebaseSet(fbRef('syncScore'), (s.val() || 0) + score);
  });

  // 3. 存入英雄行为历史（供子渊Tab查看）
  window._firebasePush(fbRef('heroActions'), {
    checkId, name, score, praise, reviewer,
    date: todayStr,
    ts: Date.now()
  });

  showParentToast(`🏅 已记录「${name}」+${score}分！子渊可以看到这条记录 💛`);

  // 4. 刷新子渊端历史
  if (typeof renderKidHeroHistory === 'function') renderKidHeroHistory();
}

// 提交每周综合评价
function submitWeeklyPraise() {
  const textarea = document.getElementById('weeklyPraiseInput');
  const text = textarea ? textarea.value.trim() : '';
  if (!text) { showParentToast('❌ 请写一句这周子渊最让你骄傲的事'); return; }

  const score = typeof WEEKLY_PRAISE_SCORE !== 'undefined' ? WEEKLY_PRAISE_SCORE : 5;
  const reviewer = currentParent === 'mom' ? '妈妈' : '爸爸';
  const weekStr = getWeekStartStr();

  // 存入 Firebase reviewed（积分通道）
  window._firebasePush(fbRef('reviewed'), {
    name: `📝 每周评价`,
    score,
    result: 'approved',
    reviewer,
    reviewedAt: Date.now(),
    date: new Date().toISOString().slice(0, 10),
    type: 'weeklyPraise',
    praiseText: text
  });

  // 同步积分
  window._firebaseGet(fbRef('syncScore')).then(s => {
    window._firebaseSet(fbRef('syncScore'), (s.val() || 0) + score);
  });

  // 存入每周评价历史（供子渊Tab查看）
  window._firebaseSet(fbRef(`weeklyPraise/${weekStr}`), {
    text, reviewer,
    score,
    ts: Date.now(),
    week: weekStr
  });

  if (textarea) textarea.value = '';
  showParentToast(`📝 本周评价已记录 +${score}分！子渊可以在自己的页面看到 💛`);

  if (typeof renderKidHeroHistory === 'function') renderKidHeroHistory();
}

// 获取本周开始日期字符串
function getWeekStartStr() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

// ── 子渊端：渲染英雄行为历史（每日记录 + 每周评价）──────────────
function renderKidHeroHistory() {
  const el = document.getElementById('kidHeroHistory');
  if (!el || !window._firebaseReady) return;

  el.innerHTML = '<div style="text-align:center;color:#ccc;font-size:13px;padding:12px">加载中…</div>';

  // 同时读取 heroActions 和 weeklyPraise
  Promise.all([
    window._firebaseGet(fbRef('heroActions')),
    window._firebaseGet(fbRef('weeklyPraise'))
  ]).then(([actSnap, praiseSnap]) => {
    const actions = actSnap.val() || {};
    const praises = praiseSnap.val() || {};

    const actionList = Object.values(actions)
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 30); // 最多显示30条

    const praiseList = Object.values(praises)
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 10); // 最多显示10周

    if (actionList.length === 0 && praiseList.length === 0) {
      el.innerHTML = `
        <div style="background:#FFF8E7;border-radius:14px;padding:16px;text-align:center;margin:0 4px">
          <div style="font-size:2rem;margin-bottom:8px">🌱</div>
          <div style="font-size:13px;color:#888">爸爸妈妈还没有记录英雄行为哦<br>继续加油，他们一直在观察你！</div>
        </div>`;
      return;
    }

    let html = `<div style="padding:4px 0 8px">
      <div style="font-size:15px;font-weight:700;color:#1a1a2e;padding:8px 4px 12px">🏅 爸妈眼中的你</div>`;

    // 每周评价板块
    if (praiseList.length > 0) {
      html += `<div style="background:linear-gradient(135deg,#E8F5E9,#F1F8E9);border-radius:14px;padding:14px;margin-bottom:14px;border:1.5px solid #A5D6A7">
        <div style="font-size:13px;font-weight:700;color:#2E7D32;margin-bottom:10px">📝 爸妈的每周评价</div>`;
      praiseList.forEach(p => {
        const d = new Date(p.ts);
        const dateStr = d.getMonth()+1 + '月' + d.getDate() + '日这一周';
        html += `<div style="background:#fff;border-radius:10px;padding:10px 12px;margin-bottom:8px;border-left:3px solid #4CAF50">
          <div style="font-size:12px;color:#4CAF50;font-weight:700;margin-bottom:4px">${dateStr} · ${p.reviewer}写的 · +${p.score}分</div>
          <div style="font-size:13px;color:#333;line-height:1.6">"${p.text}"</div>
        </div>`;
      });
      html += `</div>`;
    }

    // 每日英雄行为记录
    if (actionList.length > 0) {
      // 按日期分组
      const byDate = {};
      actionList.forEach(a => {
        if (!byDate[a.date]) byDate[a.date] = [];
        byDate[a.date].push(a);
      });

      html += `<div style="background:#FFF9F0;border-radius:14px;padding:14px;border:1.5px solid #FFCC80">
        <div style="font-size:13px;font-weight:700;color:#E65100;margin-bottom:10px">✨ 英雄行为记录</div>`;

      Object.keys(byDate).sort((a,b) => b.localeCompare(a)).forEach(date => {
        const items = byDate[date];
        const d = new Date(date + 'T00:00:00');
        const dateLabel = (d.getMonth()+1) + '月' + d.getDate() + '日';
        const dayTotal = items.reduce((s, i) => s + i.score, 0);
        html += `<div style="margin-bottom:10px">
          <div style="font-size:11px;color:#aaa;font-weight:700;margin-bottom:6px;letter-spacing:0.5px">${dateLabel} · 共+${dayTotal}分</div>`;
        items.forEach(a => {
          html += `<div style="background:#fff;border-radius:10px;padding:10px 12px;margin-bottom:6px;border-left:3px solid #FF6B35">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <span style="font-size:13px;font-weight:700;color:#1a1a2e">${a.name}</span>
              <span style="font-size:12px;color:#FF6B35;font-weight:700">+${a.score}分</span>
            </div>
            <div style="font-size:12px;color:#888;line-height:1.5">${a.praise}</div>
            <div style="font-size:11px;color:#ccc;margin-top:4px">${a.reviewer}记录</div>
          </div>`;
        });
        html += `</div>`;
      });
      html += `</div>`;
    }

    html += `</div>`;
    el.innerHTML = html;
  }).catch(err => {
    console.error('加载英雄行为历史失败', err);
    el.innerHTML = '<div style="text-align:center;color:#ccc;font-size:12px;padding:12px">加载失败，请刷新重试</div>';
  });
}


// ══════════════════════════════════════════════════════════════
// 🔐 受 PIN 保护的清空数据（测试阶段用）
// ══════════════════════════════════════════════════════════════

function showSecureClearModal() {
  // 先检查是否设置了 PIN 码
  const pins = getPins();
  if (!pins.mom && !pins.dad) {
    alert('❌ 还未设置 PIN 码，请先在「🔐 审核」页面设置 PIN 码！');
    return;
  }

  // 创建弹窗
  let modal = document.getElementById('secureClearModal');
  if (modal) { modal.remove(); }

  modal = document.createElement('div');
  modal.id = 'secureClearModal';
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:24px;width:300px;text-align:center">
      <div style="font-size:20px;margin-bottom:8px">🔐</div>
      <div style="font-size:16px;font-weight:700;color:#1a1a2e;margin-bottom:4px">请验证父母身份</div>
      <div style="font-size:13px;color:#888;margin-bottom:16px">需要爸爸或妈妈的 PIN 码才能清空数据</div>
      <div style="display:flex;gap:8px;justify-content:center;margin-bottom:12px">
        <button id="secureClearMom" style="flex:1;padding:10px;border:2px solid #FF6B35;border-radius:10px;background:#fff;color:#FF6B35;font-weight:700;font-size:14px;cursor:pointer">👩 妈妈</button>
        <button id="secureClearDad" style="flex:1;padding:10px;border:2px solid #118AB2;border-radius:10px;background:#fff;color:#118AB2;font-weight:700;font-size:14px;cursor:pointer">👨 爸爸</button>
      </div>
      <div id="secureClearInputArea" style="display:none;margin-bottom:12px">
        <input type="password" id="secureClearPin" maxlength="4" placeholder="请输入 PIN 码" style="width:100%;padding:10px;border:2px solid #ddd;border-radius:10px;font-size:16px;text-align:center;letter-spacing:4px;box-sizing:border-box">
        <div id="secureClearHint" style="font-size:12px;color:#e74c3c;margin-top:6px;min-height:16px"></div>
      </div>
      <div style="display:flex;gap:8px;justify-content:center">
        <button id="secureClearCancel" style="flex:1;padding:10px;border:none;border-radius:10px;background:#f0f0f0;color:#666;font-size:14px;cursor:pointer">取消</button>
        <button id="secureClearConfirm" style="flex:1;padding:10px;border:none;border-radius:10px;background:#FF6B35;color:#fff;font-size:14px;font-weight:700;cursor:pointer;display:none">确认清空</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  let selectedRole = null;

  // 妈妈按钮
  document.getElementById('secureClearMom').addEventListener('click', () => {
    if (!pins.mom) {
      alert('妈妈还未设置 PIN 码，请使用爸爸的 PIN 码！');
      return;
    }
    selectedRole = 'mom';
    document.getElementById('secureClearInputArea').style.display = 'block';
    document.getElementById('secureClearConfirm').style.display = 'block';
    document.getElementById('secureClearPin').focus();
  });

  // 爸爸按钮
  document.getElementById('secureClearDad').addEventListener('click', () => {
    if (!pins.dad) {
      alert('爸爸还未设置 PIN 码，请使用妈妈的 PIN 码！');
      return;
    }
    selectedRole = 'dad';
    document.getElementById('secureClearInputArea').style.display = 'block';
    document.getElementById('secureClearConfirm').style.display = 'block';
    document.getElementById('secureClearPin').focus();
  });

  // 确认清空
  document.getElementById('secureClearConfirm').addEventListener('click', () => {
    const pin = document.getElementById('secureClearPin').value.trim();
    const hint = document.getElementById('secureClearHint');
    const storedPin = pins[selectedRole];

    if (pin !== storedPin) {
      hint.textContent = '❌ PIN 码错误，请重试';
      hint.style.color = '#e74c3c';
      document.getElementById('secureClearPin').value = '';
      return;
    }

    // PIN 验证通过，关闭弹窗并执行清空
    modal.remove();
    if (typeof clearAllData === 'function') {
      window._secureClearAuthorized = true; // 授权标志
      clearAllData();
    }
  });

  // 取消
  document.getElementById('secureClearCancel').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

// ── Firebase 就绪后启动监听 ───────────────────────────────────
window.addEventListener('firebaseReady', () => {
  listenSyncScore();
});
// 如果已经就绪（脚本加载顺序问题）
if (window._firebaseReady) listenSyncScore();
