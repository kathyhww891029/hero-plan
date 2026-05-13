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
// ── 辅助：检查 selfReport 复合键中是否包含某固定任务 ID ──────
// selfReport 存储格式：state.selfReport['2026-05-12']['morning_mp1_2026-05-12'] = 'self'
// 但 calcMonthlyDisciplineRate 用简单 ID（如 'mp1'）查找 → 永远找不到
// 此函数做边界匹配避免 mp1 误匹配 mp10
function _hasFixedTask(tasks, fixedId) {
  if (tasks[fixedId]) return true; // 兼容简单键（未来可能修复存储侧）
  if (fixedId === 'hw_main') return Object.keys(tasks).some(k => k.startsWith('hw_') || k.includes('homework'));
  const escaped = fixedId.replace(new RegExp('[.*+?^${}()|[\]\]', 'g'), '\$&');
  const re = new RegExp(`(^|_)${escaped}(_|$)`);
  return Object.keys(tasks).some(k => re.test(k));
}
function _getFixedTaskValue(tasks, fixedId) {
  if (tasks[fixedId]) return tasks[fixedId];
  if (fixedId === 'hw_main') {
    const key = Object.keys(tasks).find(k => k.startsWith('hw_') || k.includes('homework'));
    return key ? tasks[key] : undefined;
  }
  const escaped = fixedId.replace(new RegExp('[.*+?^${}()|[\]\]', 'g'), '\$&');
  const re = new RegExp(`(^|_)${escaped}(_|$)`);
  const key = Object.keys(tasks).find(k => re.test(k));
  return key ? tasks[key] : undefined;
}

// ── 月度自律率计算 ───────────────────────────────────────────
function calcMonthlyDisciplineRate(year, month) {
  if (!state.selfReport) return { rate: 0, selfDays: 0, totalDays: 0 };
  const prefix = `${year}-${String(month).padStart(2,'0')}`;

  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const isCurrentMonth = (today.getFullYear() === year && today.getMonth() + 1 === month);
  const lastDay = isCurrentMonth ? today.getDate() : daysInMonth;

  let selfDays = 0;
  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${prefix}-${String(d).padStart(2,'0')}`;
    const tasks = state.selfReport[dateStr];
    if (tasks && Object.values(tasks).some(v => v === 'self')) selfDays++;
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
  const needDays = Math.max(0, Math.ceil(totalDays * 0.85) - selfDays);
  const monthName = (now.getMonth() + 1) + '月';
  const barPct = Math.min(100, rate);
  const barColor = rate >= 85 ? '#06D6A0' : rate >= 50 ? '#F9A825' : '#FF7043';

  // ── 超级诊断（家长专用）──────────────────────────────
  const prefix = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const fixedIds = DAILY_FIXED.map(t => t.id);
  const todayDs = `${prefix}-${String(now.getDate()).padStart(2,'0')}`;

  const allDates = state.selfReport ? Object.keys(state.selfReport) : [];
  let totalTaskEntries = 0, totalSelfEntries = 0;
  allDates.forEach(d => {
    const t = state.selfReport[d];
    if (t) {
      totalTaskEntries += Object.keys(t).length;
      totalSelfEntries += Object.values(t).filter(v => v === 'self').length;
    }
  });

  const datesByMonth = {};
  allDates.sort().forEach(d => {
    const m = d.slice(0, 7);
    if (!datesByMonth[m]) datesByMonth[m] = [];
    datesByMonth[m].push(d);
  });

  const dayRows = [];
  for (let d = 1; d <= now.getDate(); d++) {
    const ds = `${prefix}-${String(d).padStart(2,'0')}`;
    const tasks = state.selfReport?.[ds];
    const hasData = tasks && Object.keys(tasks).length > 0;
    const hits = hasData ? fixedIds.filter(id => _hasFixedTask(tasks, id)) : [];
    const allSelf = hits.length > 0 && hits.every(id => _getFixedTaskValue(tasks, id) === 'self');
    const by65 = hasData && hits.length / fixedIds.length >= 0.65 && allSelf;
    const hasSelfTask = hasData && Object.values(tasks).some(v => v === 'self');
    const dailyMark = by65 ? '🟢' : (hasSelfTask ? '🟡' : (hasData ? '🔴' : '⚫'));
    dayRows.push(`${dailyMark}${String(d).padStart(2,'0')}:${by65?'65%✓':'  '} hasSelf:${hasSelfTask?'✓':'✗'} hits:${hits.length}/${fixedIds.length}`);
  }

  const todayTasks = state.selfReport?.[todayDs];
  const todayKeys = todayTasks ? Object.keys(todayTasks) : [];
  const rawDump = todayKeys.length > 0
    ? todayKeys.map(k => `${k.slice(-25)}=${todayTasks[k]}`).join(', ')
    : '（空）';

  let lsSize = '?';
  try {
    const raw = localStorage.getItem(STATE_KEY);
    lsSize = raw ? (raw.length / 1024).toFixed(1) + 'KB' : '不存在';
  } catch(e) { lsSize = 'err'; }

  const monthSummary = datesByMonth[prefix] ? `${datesByMonth[prefix].length}天有数据` : '本月无数据';
  const diagHTML = allDates.length > 0
    ? `<details style="margin-top:10px;font-size:0.65rem;color:#555;font-family:monospace;background:#fafafa;border-radius:8px;padding:8px;max-height:300px;overflow-y:auto;">
      <summary style="cursor:pointer;font-weight:600;opacity:0.5;">🔍 家长诊断 | ${monthSummary} | LS:${lsSize}</summary>
      <div style="margin-top:4px;line-height:1.5;">
        <b>📦 selfReport：</b>${allDates.length}日期 ${totalTaskEntries}条/${totalSelfEntries}自主<br>
        <b>📅 分布：</b>${Object.keys(datesByMonth).map(m => m+':'+datesByMonth[m].length+'天').join(' ')}<br>
        <b>本月（${prefix}）：</b><br>${dayRows.join('<br>')}<br>
        <b>今天 keys:</b> ${rawDump}<br>
        <span style="color:#888;">🟢=65%全自主 🟡=有自主不足 🔴=无自主 ⚫=无数据</span>
      </div>
      </details>`
    : `<details style="margin-top:10px;font-size:0.65rem;color:#e57373;font-family:monospace;background:#fff5f5;border-radius:8px;padding:8px;">
      <summary style="cursor:pointer;font-weight:700;color:#c62828;opacity:0.5;">⚠️ 无数据 | LS:${lsSize}</summary>
      <div style="margin-top:4px;line-height:1.5;">
        没有任何自律数据。<br>
        <button onclick="(function(){var t=state.selfReport||{};t['${todayDs}']={'test_'+Date.now().toString(36):'self'};state.selfReport=t;saveState();renderDisciplineBar();alert('测试写入完成')})()" style="margin-top:4px;padding:4px 10px;font-size:0.7rem;border:1px solid #c62828;border-radius:4px;background:#fff;color:#c62828;">🩺 测试写入</button>
      </div>
      </details>`;

  el.innerHTML = `
    <div class="discipline-bar-wrap" style="background:${unlocked?'linear-gradient(135deg,#e8fff5,#d4fceb)':'linear-gradient(135deg,#fff8e1,#fff3cd)'};border-radius:18px;padding:16px;margin:10px 0;border:2px solid ${unlocked?'#06D6A0':'#FFD54F'};box-shadow:0 2px 8px rgba(0,0,0,0.05);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <span style="font-size:1.1rem;">⚡</span>
        <span style="font-weight:800;font-size:1.05rem;color:#1a1a2e;">${monthName} 能量条</span>
        <span style="font-size:1.3rem;font-weight:800;color:${barColor};">${rate}%</span>
      </div>

      <div style="background:#eee;border-radius:14px;height:22px;overflow:hidden;position:relative;box-shadow:inset 0 1px 3px rgba(0,0,0,0.1);">
        <div style="background:linear-gradient(90deg,#FF7043,#F9A825 40%,#66BB6A 70%,#06D6A0);height:100%;border-radius:14px;width:${barPct}%;transition:width 0.5s ease;box-shadow:0 0 10px ${barColor}55;"></div>
        ${barPct > 0 && barPct < 100 ? `<div style="position:absolute;top:-2px;left:calc(${barPct}% - 10px);font-size:0.9rem;line-height:1;">🚀</div>` : ''}
        ${barPct >= 100 ? `<div style="position:absolute;top:0;right:0;width:100%;text-align:center;line-height:22px;font-size:0.78rem;font-weight:700;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.2);">🎉 满格！</div>` : ''}
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;font-size:0.9rem;">
        <span style="font-weight:700;color:#1a1a2e;">
          ⭐ <span style="color:#F9A825;font-size:1.2rem;">${selfDays}</span> 天自己完成
        </span>
        <span style="color:#aaa;font-size:0.75rem;">本月已过 ${totalDays} 天</span>
      </div>

      <div style="margin-top:10px;font-size:0.82rem;text-align:center;line-height:1.6;">
        ${unlocked
          ? '<span style="display:inline-block;background:#e8fff5;border-radius:10px;padding:8px 16px;font-weight:700;color:#06D6A0;">🎁 宝藏屋大奖已解锁！你太棒了！🎉</span>'
          : selfDays > 0
            ? `<span style="display:inline-block;background:#fff8e1;border-radius:10px;padding:8px 16px;color:#E65100;font-weight:600;">🎁 再靠自己完成 <span style="font-size:1rem;color:#FF7043;">${needDays}</span> 天，宝藏屋就打开了！💪</span>`
            : '<span style="color:#aaa;">每天自己完成任务，能量条就会慢慢涨起来！加油！⭐</span>'
        }
      </div>

      ${diagHTML}
    </div>
  `;
}

// ── 每周自律报告 ────────────────────────────────────────────
function showWeeklyReport() {
  const modal = document.getElementById('weeklyReportModal');
  if (!modal) return;
  renderWeeklyReportContent();
  modal.style.display = 'flex';
}
function closeWeeklyReport() {
  const modal = document.getElementById('weeklyReportModal');
  if (modal) modal.style.display = 'none';
}
function renderWeeklyReportContent() {
  const el = document.getElementById('weeklyReportContent');
  if (!el) return;
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=周日
  // 本周一
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  // 上周一
  const lastMonday = new Date(monday);
  lastMonday.setDate(monday.getDate() - 7);

  const fixedIds = DAILY_FIXED.map(t => t.id);
  function dayStats(d) {
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const tasks = state.selfReport?.[ds] || {};
    const hits = fixedIds.filter(id => _hasFixedTask(tasks, id));
    const selfCount = hits.filter(id => _getFixedTaskValue(tasks, id) === 'self').length;
    return { total: fixedIds.length, done: hits.length, self: selfCount, allSelf: hits.length > 0 && selfCount === hits.length };
  }

  // 本周统计
  let thisWeekSelfDays = 0, thisWeekBestDay = null, thisWeekBestSelf = 0;
  const thisWeekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    if (d > now) break;
    const s = dayStats(d);
    thisWeekDays.push({ date: d, ...s });
    if (s.allSelf) thisWeekSelfDays++;
    if (s.self > thisWeekBestSelf) { thisWeekBestSelf = s.self; thisWeekBestDay = d; }
  }
  const totalDays = thisWeekDays.length;

  // 上周统计
  let lastWeekSelfDays = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(lastMonday);
    d.setDate(lastMonday.getDate() + i);
    const s = dayStats(d);
    if (s.allSelf) lastWeekSelfDays++;
  }

  const diff = thisWeekSelfDays - lastWeekSelfDays;
  const trendEmoji = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
  const trendText = diff > 0 ? `比上周多 ${diff} 天` : diff < 0 ? `比上周少 ${Math.abs(diff)} 天` : '和上周一样';

  const dayLabels = ['日','一','二','三','四','五','六'];
  const daysHTML = thisWeekDays.map(s => {
    const isToday = s.date.toDateString() === now.toDateString();
    const bg = s.allSelf ? '#e8fff5' : s.self > 0 ? '#fff8e1' : '#f5f5f5';
    const edge = s.allSelf ? '#06D6A0' : s.self > 0 ? '#F9A825' : '#ddd';
    return `<div style="background:${bg};border:1.5px solid ${edge};border-radius:10px;padding:8px;text-align:center;${isToday?'font-weight:700;':''}">
      <div style="font-size:0.7rem;color:#888;">${dayLabels[s.date.getDay()]}${isToday?'⭐':''}</div>
      <div style="font-size:1.1rem;">${s.allSelf ? '🔥' : s.self > 0 ? '💪' : '—'}</div>
      <div style="font-size:0.7rem;color:#888;">${s.self}/${s.total}</div>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div style="text-align:center;padding:4px 0 12px;">
      <div style="font-size:1.5rem;margin-bottom:4px;">📊</div>
      <div style="font-weight:700;font-size:1.05rem;color:#1a1a2e;">本周自律报告</div>
      <div style="font-size:0.78rem;color:#aaa;">${monday.getMonth()+1}/${monday.getDate()} - ${now.getMonth()+1}/${now.getDate()}</div>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:14px;">${daysHTML}</div>
    <div style="background:#f8f4ff;border-radius:12px;padding:12px 14px;margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:0.85rem;color:#555;">🏅 本周全自主天数</span>
        <span style="font-size:1.3rem;font-weight:700;color:#7C3AED;">${thisWeekSelfDays}<span style="font-size:0.8rem;color:#aaa;">/${totalDays}天</span></span>
      </div>
      <div style="margin-top:4px;font-size:0.78rem;color:#999;">${trendEmoji} ${trendText}</div>
    </div>
    ${thisWeekBestDay ? `
    <div style="background:#e8fff5;border-radius:12px;padding:12px 14px;margin-bottom:10px;">
      <span style="font-size:0.85rem;color:#555;">⭐ 本周最佳</span>
      <div style="font-size:0.95rem;font-weight:600;color:#06D6A0;">${thisWeekBestDay.getMonth()+1}/${thisWeekBestDay.getDate()} · ${thisWeekBestSelf}/${fixedIds.length} 项全自主</div>
    </div>` : ''}
    <div style="font-size:0.78rem;color:#aaa;text-align:center;margin-bottom:8px;">每天自己想起来完成任务，自律能量就会增长！</div>
    <button onclick="closeWeeklyReport()" style="width:100%;padding:12px;background:#7C3AED;color:#fff;border:none;border-radius:10px;font-size:0.95rem;font-weight:600;">知道了，继续加油！💪</button>
  `;
}
function checkWeeklyReport() {
  const now = new Date();
  if (now.getDay() !== 0) return; // 仅周日自动弹出
  if (state._lastWeeklyReportDate === `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`) return;
  state._lastWeeklyReportDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  saveState();
  setTimeout(() => showWeeklyReport(), 1200);
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

  // 刷新页面分数显示
  document.getElementById('totalScore').textContent = state.totalScore;
  document.getElementById('shopScore').textContent = state.totalScore;

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
