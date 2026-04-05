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
}

function parentLogout() {
  currentParent = null;
  document.getElementById('parentPanel').style.display = 'none';
  document.getElementById('parentLogin').style.display = 'block';
}

// ── 提交待审申请（孩子打卡时调用） ────────────────────────────
function submitPending(type, id, name, score, extra) {
  if (!window._firebaseReady) return;
  const record = {
    type,       // 'daily' | 'card' | 'rope'
    taskId: id,
    name,
    score,
    extra: extra || '',
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toLocaleTimeString('zh-CN', {hour:'2-digit', minute:'2-digit'}),
    status: 'pending',
    submittedAt: Date.now()
  };
  window._firebasePush(fbRef('pending'), record);
}

// ── 加载待审列表 ──────────────────────────────────────────────
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

    el.innerHTML = items.map(item => `
      <div class="pending-item" id="pi-${item.key}">
        <div class="pending-info">
          <div class="pending-name">${item.name}</div>
          <div class="pending-meta">${item.date} ${item.time} · ${typeLabel(item.type)}</div>
          ${item.extra ? `<div class="pending-extra">${item.extra}</div>` : ''}
        </div>
        <div class="pending-score">+${item.score}分</div>
        <div class="pending-actions">
          <button class="btn-approve" onclick="approveOne('${item.key}',${item.score},'${item.name}')">✅</button>
          <button class="btn-reject" onclick="rejectOne('${item.key}','${item.name}')">❌</button>
        </div>
      </div>`).join('');
    batchBtns.style.display = 'flex';
  });
}

function typeLabel(type) {
  const map = { daily:'每日任务', card:'任务卡', rope:'跳绳', manual:'手动奖励' };
  return map[type] || type;
}

// ── 审核通过单条 ──────────────────────────────────────────────
function approveOne(key, score, name) {
  if (!window._firebaseReady) return;
  // 加入已审记录
  window._firebasePush(fbRef('reviewed'), {
    name, score, result: 'approved',
    reviewer: currentParent === 'mom' ? '妈妈' : '爸爸',
    reviewedAt: Date.now(),
    date: new Date().toISOString().slice(0, 10)
  });
  // 更新总分（Firebase 中存一个 totalScore 供同步）
  window._firebaseGet(fbRef('syncScore')).then(snap => {
    const cur = snap.val() || 0;
    window._firebaseSet(fbRef('syncScore'), cur + score);
  });
  // 删除 pending
  window._firebaseRemove(fbRef('pending/' + key));
  showParentToast(`✅ 已通过「${name}」，+${score}分！`);
}

// ── 驳回单条 ──────────────────────────────────────────────────
function rejectOne(key, name) {
  if (!window._firebaseReady) return;
  window._firebasePush(fbRef('reviewed'), {
    name, score: 0, result: 'rejected',
    reviewer: currentParent === 'mom' ? '妈妈' : '爸爸',
    reviewedAt: Date.now(),
    date: new Date().toISOString().slice(0, 10)
  });
  window._firebaseRemove(fbRef('pending/' + key));
  showParentToast(`❌ 已驳回「${name}」`);
}

// ── 全部通过 ──────────────────────────────────────────────────
function approveAll() {
  if (!window._firebaseReady) return;
  window._firebaseGet(fbRef('pending')).then(snap => {
    const data = snap.val();
    if (!data) return;
    let totalAdd = 0;
    Object.entries(data).forEach(([key, val]) => {
      totalAdd += val.score;
      window._firebasePush(fbRef('reviewed'), {
        name: val.name, score: val.score, result: 'approved',
        reviewer: currentParent === 'mom' ? '妈妈' : '爸爸',
        reviewedAt: Date.now(),
        date: new Date().toISOString().slice(0, 10)
      });
      window._firebaseRemove(fbRef('pending/' + key));
    });
    window._firebaseGet(fbRef('syncScore')).then(s2 => {
      window._firebaseSet(fbRef('syncScore'), (s2.val() || 0) + totalAdd);
    });
    showParentToast(`✅ 全部通过！共 +${totalAdd}分！`);
  });
}

// ── 全部驳回 ──────────────────────────────────────────────────
function rejectAll() {
  if (!window._firebaseReady) return;
  window._firebaseGet(fbRef('pending')).then(snap => {
    const data = snap.val();
    if (!data) return;
    Object.entries(data).forEach(([key, val]) => {
      window._firebasePush(fbRef('reviewed'), {
        name: val.name, score: 0, result: 'rejected',
        reviewer: currentParent === 'mom' ? '妈妈' : '爸爸',
        reviewedAt: Date.now(),
        date: new Date().toISOString().slice(0, 10)
      });
      window._firebaseRemove(fbRef('pending/' + key));
    });
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

// ── Firebase 就绪后启动监听 ───────────────────────────────────
window.addEventListener('firebaseReady', () => {
  listenSyncScore();
});
// 如果已经就绪（脚本加载顺序问题）
if (window._firebaseReady) listenSyncScore();
