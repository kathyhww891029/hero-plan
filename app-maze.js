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
  showCelebration('🚀', `已升级至 Phase ${phase}！`, '推荐任务已更新，继续冒险！', 0, 'bonus');
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
