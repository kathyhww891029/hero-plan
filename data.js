// ══════════════════════════════════════════════════════════════
// 英雄成长计划 · 数据配置
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// 英雄包 · 套餐式固定任务（阶梯积分：1件+1, 2件+2, 全套×2）
// ══════════════════════════════════════════════════════════════

// 早晨英雄包（3件，全套+6分）
const MORNING_PACK = [
  { id:'mp1', icon:'👕', name:'自己穿好衣服', sub:'英雄出征，先穿战甲！⚔️', score:1,
    speech:'自己穿好衣服！英雄出征要先穿战甲，自己搞定得1分。三件全部完成分数还会翻倍变成6分，加油！' },
  { id:'mp2', icon:'🦷', name:'洗脸刷牙', sub:'英雄的笑容最闪亮 ✨', score:1,
    speech:'洗脸刷牙！英雄的笑容最闪亮，快去洗干净，得1分。早晨三件全部自己搞定，分数翻倍变6分！' },
  { id:'mp3', icon:'🍳', name:'好好吃早饭', sub:'能量充满，准备出发！⚡', score:1,
    speech:'好好吃早饭！英雄需要能量才能战斗，把早饭吃完得1分。穿衣服、刷牙、吃饭三件全做完，分数翻倍变6分，今天出发！' },
];
// 早晨英雄包全套奖励分值（3件×1分×2倍=6分）
const MORNING_PACK_FULL = 6;

// 睡前英雄包（3件，全套+6分）
const NIGHT_PACK = [
  { id:'np1', icon:'🛁', name:'洗澡+洗脸+刷牙', sub:'三合一清洁，英雄归营！🌙', score:1,
    speech:'洗澡洗脸刷牙三合一！英雄归营要清洁干净，三合一搞定得1分。睡前三件全部完成分数翻倍变6分，快去冲澡！' },
  { id:'np2', icon:'🎒', name:'收拾书包+课本', sub:'明天出征准备好 ✅', score:1,
    speech:'收拾书包和课本！明天出征的装备要提前准备好，得1分。睡前三件全部自己完成，分数翻倍变6分！' },
  { id:'np3', icon:'🌛', name:'按时上床', sub:'9点半前自己上床，不用催 💤', score:1,
    tip:'9点半前主动上床=得分！连续3天=额外+3分奖励！',
    speech:'按时上床！9点半之前自己主动上床，不用大人催，得1分。睡前三件全部完成分数翻倍变6分！而且连续3天按时上床还会额外多得3分，英雄要好好充电，加油！' },
];
const NIGHT_PACK_FULL = 6;

// ── 写作业（简化为单步打卡，专注块保留）─────────────────────
const HOMEWORK_TASK = {
  id:'hw_main', icon:'📚', name:'今日作业', sub:'写完作业，今天的任务就完成了！✅',
  scorePerBlock: 1,  // 每个专注块得分
  maxBlocks: 3,      // 最多几块
  scoreComplete: 2,  // 写完额外得分
  blockMinutes: 10,  // 每块多少分钟
  speech:'今日作业！每专注10分钟得1分，最多3块，写完全部作业再加2分，最高5分！'
};

// ── 专注力时光（独立模块）──────────────────────────────────────
const FOCUS_TIME = {
  id: 'focus_time',
  icon: '🧠',
  name: '专注力时光',
  sub: '选一件你喜欢的事，专心做15分钟！',
  score: 3,          // 完成15分钟基础分
  bonusScore: 2,     // 超时继续→超级专注徽章额外奖励
  minutes: 15,       // 基础时长（分钟）
  speech: '专注力时光！选一件你喜欢的事，专心做15分钟，中途不分心就得3分！停不下来？那是最棒的状态，还能解锁超级专注徽章！',
  menuItems: [
    { id:'ft_lego',    icon:'🧱', name:'乐高/积木' },
    { id:'ft_puzzle',  icon:'🧩', name:'拼图' },
    { id:'ft_book',    icon:'📖', name:'安静阅读' },
    { id:'ft_origami', icon:'📦', name:'折纸手工' },
    { id:'ft_chess',   icon:'♟️', name:'棋类游戏' },
  ]
};

// ══════════════════════════════════════════════════════════════
// 🏆 周度成就系统（每周任务卡完成数量对应等级）
// ══════════════════════════════════════════════════════════════
const WEEKLY_ACHIEVEMENTS = [
  {
    id:'w1', level:'小英雄', icon:'🥉', minCards:1,
    bonusScore:10, badge:'小英雄徽章',
    desc:'本周完成1张任务卡',
    speech:'小英雄成就！本周完成了1张任务卡，获得小英雄徽章和10分奖励！'
  },
  {
    id:'w2', level:'真英雄', icon:'🥈', minCards:3,
    bonusScore:20, badge:'真英雄专属徽章',
    desc:'本周完成3张任务卡',
    speech:'真英雄成就！本周完成了三张任务卡，获得真英雄专属徽章和20分！'
  },
  {
    id:'w3', level:'超级英雄', icon:'🥇', minCards:5,
    bonusScore:35, badge:'本周最强英雄称号',
    unlockNextPhase:true,
    desc:'本周完成5张任务卡',
    speech:'超级英雄成就！本周完成了五张任务卡！获得35分加上本周最强英雄称号，还能解锁下周新卡！'
  },
];

// ── 阶段配置（爸妈手动切换）───────────────────────────────────
const PHASE_CONFIG = {
  1: {
    name:'第一阶段·行为稳定+专注萌芽',
    duration:'0~3个月',
    focusDesc:'建立节奏感，让每天有可预期的结构',
    recommendRatio:{ focus:70, interest:30 },
    recommendTypes:['focus', 'interest'],
    primaryType:'focus',
    blockMinutes:10,  // 专注块时长
  },
  2: {
    name:'第二阶段·时间感知+主动选择',
    duration:'3~6个月',
    focusDesc:'把执行权交给孩子，让他感受到选择的力量',
    recommendRatio:{ plan:40, challenge:40, creative:20 },
    recommendTypes:['plan', 'challenge', 'creative'],
    primaryType:'plan',
    blockMinutes:12,
  },
  3: {
    name:'第三阶段·自我觉察+目标设定',
    duration:'6个月后',
    focusDesc:'开始向内看，培养元认知和主动设定目标的能力',
    recommendRatio:{ reflect:30, custom:30, challenge:40 },
    recommendTypes:['reflect', 'custom', 'challenge'],
    primaryType:'reflect',
    blockMinutes:15,
  },
};

// ── 今日推荐任务卡（按阶段返回推荐卡）────────────────────────
function getTodayRecommended(phase, claimedIds, totalScore) {
  const config = PHASE_CONFIG[phase] || PHASE_CONFIG[1];
  const types = config.recommendTypes;

  // 过滤：已解锁、未完成、是当前阶段推荐类型
  const candidates = TASK_CARDS.filter(c => {
    const unlocked = c.unlockAt === 0 || totalScore >= c.unlockAt;
    const notClaimed = !(claimedIds || []).includes(c.id);
    const isRecommendType = types.includes(c.recommendType);
    const isCurrentPhase = !c.phase || c.phase <= phase;
    return unlocked && notClaimed && isRecommendType && isCurrentPhase;
  });

  // 主推类型优先取1张，其他类型取1张，共推荐2张
  const primary = candidates.filter(c => c.recommendType === config.primaryType);
  const others = candidates.filter(c => c.recommendType !== config.primaryType);

  const result = [];
  if (primary.length > 0) result.push(primary[Math.floor(Math.random() * primary.length)]);
  if (others.length > 0) result.push(others[Math.floor(Math.random() * others.length)]);
  return result.slice(0, 2);
}

// ── 每日固定任务（保留兼容旧逻辑，供审核Tab使用）─────────────
const DAILY_FIXED = [
  { id:'mp1', icon:'👕', name:'自己穿好衣服', sub:'英雄出征，先穿战甲！⚔️', score:1, type:'fixed', pack:'morning',
    speech:'自己穿好衣服！英雄出征要先穿战甲，自己搞定得1分。三件全部完成分数还会翻倍变成6分，加油！' },
  { id:'mp2', icon:'🦷', name:'洗脸刷牙', sub:'英雄的笑容最闪亮 ✨', score:1, type:'fixed', pack:'morning',
    speech:'洗脸刷牙！英雄的笑容最闪亮，快去洗干净，得1分。早晨三件全部自己搞定，分数翻倍变6分！' },
  { id:'mp3', icon:'🍳', name:'好好吃早饭', sub:'能量充满，准备出发！⚡', score:1, type:'fixed', pack:'morning',
    speech:'好好吃早饭！英雄需要能量才能战斗，把早饭吃完得1分。穿衣服、刷牙、吃饭三件全做完，分数翻倍变6分，今天出发！' },
  { id:'np1', icon:'🛁', name:'洗澡+洗脸+刷牙', sub:'三合一清洁，英雄归营！🌙', score:1, type:'fixed', pack:'night',
    speech:'洗澡洗脸刷牙三合一！英雄归营要清洁干净，三合一搞定得1分。睡前三件全部完成分数翻倍变6分，快去冲澡！' },
  { id:'np2', icon:'🎒', name:'收拾书包+课本', sub:'明天出征准备好 ✅', score:1, type:'fixed', pack:'night',
    speech:'收拾书包和课本！明天出征的装备要提前准备好，得1分。睡前三件全部自己完成，分数翻倍变6分！' },
  { id:'np3', icon:'🌛', name:'按时上床', sub:'9点半前自己上床，不用催 💤', score:1, type:'fixed', pack:'night',
    tip:'9点半前主动上床=得分！连续3天=额外+3分奖励！',
    speech:'按时上床！9点半之前自己主动上床，不用大人催，英雄要好好充电，得1分！' },
  { id:'hw_main', icon:'📚', name:'今日作业', sub:'写作业，解锁精彩的一天 🔑', score:5, type:'fixed', pack:'homework',
    tip:'每专注10分钟+1分（最多3块），写完+2分，最高5分',
    speech:'今日作业！专注写作业，最高5分！' },
];

// ── 可选任务（均直接可见，无锁定）────────────────────────────
const DAILY_OPTIONAL_INTEREST = [
  { id:'oi3', icon:'🎵', name:'音乐欣赏时光', sub:'认真听一首曲子，说说感受！🎧', score:2, type:'optional', category:'interest',
    tip:'闭上眼睛听一首曲子，听完说出你的感受，说了就得分',
    speech:'音乐欣赏时光！闭上眼睛认真听一首曲子，听完说说你的感受，开心还是难过？说出来就得2分！' },
];

// ── 可选任务 · 学习/娱乐类（均直接可见）────────────────────
const DAILY_OPTIONAL_FUN = [
  { id:'of1', icon:'⚡', name:'闪电侠速算训练', sub:'口算做完了，来领分！⚡', score:3, type:'optional', category:'fun',
    tip:'做完口算主动来领分，不做不扣分',
    speech:'闪电侠速算训练！口算做完了吗？做完主动来领分，得3分！不做也不扣分，做了就是赚到！' },
  { id:'of2', icon:'🌍', name:'蜘蛛侠秘密武器', sub:'叽里呱啦学完，来领2分！🌍', score:2, type:'optional', category:'fun',
    tip:'学完叽里呱啦来领2分；再用出来一句话额外+3分！',
    speech:'蜘蛛侠秘密武器！叽里呱啦学完了吗？学完得2分！今天学的内容能说出一句话来，再加3分！' },
  { id:'oi5', icon:'🎵🎨', name:'音画故事创作', sub:'听音乐画感受，二合一！✨', score:3, type:'optional', category:'fun',
    tip:'听爸爸演奏或播放的曲子，把感受画出来，画完讲给大家听',
    speech:'音画故事创作！听爸爸演奏一段曲子，把感受画出来，颜色形状故事都行，完成得3分！' },
];

// 合并供旧逻辑使用
const DAILY_OPTIONAL = [...DAILY_OPTIONAL_INTEREST, ...DAILY_OPTIONAL_FUN];
const DAILY_HOMEWORK = []; // 作业已整合进DAILY_FIXED

// ── 任务卡体系（三阶段） ───────────────────────────────────────
// phase: 1=行为稳定+专注萌芽(0~3月) / 2=时间感知+主动选择(3~6月) / 3=自我觉察+目标设定(6月后)
// recommendType: focus=专注习惯 / interest=兴趣探索 / plan=计划主动 / challenge=挑战 / creative=创意 / reflect=反思 / custom=自定义
const TASK_CARDS = [

  // ════════════════════════════════════════════════
  // 🥉 第一阶段：行为稳定 + 专注力萌芽（0~3个月）
  // 推荐比例：70%专注/习惯类 + 30%兴趣探索类
  // ════════════════════════════════════════════════

  // 🎯 专注挑战卡（主推）
  {
    id:'p1_focus1', series:'🎯 专注挑战', phase:1, recommendType:'focus',
    color:'#118AB2', lightColor:'#E8F4FD', stars:'⭐',
    name:'专注小勇士', sub:'10分钟，只做一件事！⏱️',
    desc:'选一件事（画画/积木/看书），定时10分钟，中途不分心做完',
    tip:'📌 规则：\n①自己选一件喜欢的事\n②让爸妈帮你定时10分钟\n③铃声响之前不能停下来\n④做到了来领分！',
    score:4, unlockAt:0, unlocked:true,
    speech:'专注小勇士！选一件事，定时10分钟，中途不分心，铃响前不停下来，做到得4分！'
  },
  {
    id:'p1_focus2', series:'🎯 专注挑战', phase:1, recommendType:'focus',
    color:'#118AB2', lightColor:'#E8F4FD', stars:'⭐⭐',
    name:'专注升级版', sub:'10分钟×2，两轮都坚持！💪',
    desc:'连续完成两个10分钟专注块（中间可以休息5分钟）',
    tip:'📌 规则：\n①第一个10分钟专注完成\n②休息5分钟（喝水、伸展）\n③第二个10分钟再来一次\n④两轮都完成才得分！',
    score:6, unlockAt:20, unlocked:false,
    speech:'专注升级版！连续两个10分钟，中间可以休息5分钟，两轮都完成得6分！需要20分解锁！'
  },
  {
    id:'p1_focus3', series:'🎯 专注挑战', phase:1, recommendType:'focus',
    color:'#118AB2', lightColor:'#E8F4FD', stars:'⭐⭐⭐',
    name:'专注大师', sub:'今天作业一口气写完！🏆',
    desc:'写作业期间完成3个专注块，中间没有被别的事打断',
    tip:'📌 标准：\n①专注块=10分钟不分心\n②完成3个专注块\n③中间只能喝水/上厕所\n④作业全部写完额外加分！',
    score:8, unlockAt:50, unlocked:false,
    speech:'专注大师！写作业完成三个专注块，中间不被打断，得8分！需要50分解锁！'
  },

  // 🌟 小小成就卡（辅推）
  {
    id:'p1_habit1', series:'🌟 小小成就', phase:1, recommendType:'focus',
    color:'#06D6A0', lightColor:'#EDFFF9', stars:'⭐',
    name:'早晨英雄', sub:'早晨三件事，自己全搞定！🌅',
    desc:'今天早晨英雄包三件事全部自己完成，不用提醒',
    tip:'📌 三件事：\n①自己穿好衣服\n②洗脸刷牙\n③好好吃早饭\n全部自己做到，来领这张卡！',
    score:5, unlockAt:0, unlocked:true,
    speech:'早晨英雄！早晨三件事全部自己完成，穿衣洗脸吃饭都搞定，得5分！'
  },
  {
    id:'p1_habit2', series:'🌟 小小成就', phase:1, recommendType:'focus',
    color:'#06D6A0', lightColor:'#EDFFF9', stars:'⭐⭐',
    name:'睡前小英雄', sub:'睡前三件事，不等大人说！🌙',
    desc:'今天睡前英雄包三件事全部自己做到，没等大人催',
    score:5, unlockAt:15, unlocked:false,
    speech:'睡前小英雄！洗澡收拾书包按时上床三件事全做到，不用催，得5分！需要15分解锁！'
  },
  {
    id:'p1_habit3', series:'🌟 小小成就', phase:1, recommendType:'focus',
    color:'#06D6A0', lightColor:'#EDFFF9', stars:'⭐⭐⭐',
    name:'全天英雄包', sub:'早晨+睡前全套，一天都赢了！👑',
    desc:'今天早晨英雄包和睡前英雄包全部完成',
    score:8, unlockAt:40, unlocked:false,
    speech:'全天英雄包！早晨和睡前两套全部完成，今天全赢了，得8分！需要40分解锁！'
  },

  // 🎨 兴趣探索卡（少量，锚定内驱力）
  {
    id:'p1_interest1', series:'🎨 兴趣探索', phase:1, recommendType:'interest',
    color:'#9C27B0', lightColor:'#F3E5F5', stars:'🎨',
    name:'英雄图鉴', sub:'画出你心目中最厉害的英雄！🦸',
    desc:'画出你心目中最厉害的英雄，画完讲给爸爸或妈妈听',
    tip:'📌 怎么画：\n①想一想你最喜欢的英雄\n②用画笔画出他的样子\n③画完讲给爸爸妈妈：他叫什么？有什么能力？\n每幅画都是世界上独一无二的🌟',
    score:5, unlockAt:0, unlocked:true,
    speech:'英雄图鉴！画出你心目中最厉害的英雄，画完讲给爸爸妈妈听，得5分！'
  },
  {
    id:'p1_interest2', series:'🎨 兴趣探索', phase:1, recommendType:'interest',
    color:'#9C27B0', lightColor:'#F3E5F5', stars:'🎨🎨',
    name:'我的恐龙世界', sub:'画一幅恐龙世界，越大越好！🦕',
    desc:'画一幅恐龙世界的画，至少有3只不同的恐龙',
    score:6, unlockAt:20, unlocked:false,
    speech:'我的恐龙世界！画一幅有三只不同恐龙的世界，得6分！需要20分解锁！'
  },
  {
    id:'p1_interest3', series:'🎨 兴趣探索', phase:1, recommendType:'interest',
    color:'#FF6B9D', lightColor:'#FFF0F7', stars:'🎵',
    name:'音乐小侦探', sub:'听完说出你的感受！🎧',
    desc:'闭上眼睛听一首曲子，说出至少3个感受词',
    tip:'📌 怎么玩：\n①爸爸播放一首曲子\n②闭上眼睛认真听\n③说出你的感受，越具体越好！\n比如：这首曲子让我想到了恐龙在奔跑！',
    score:4, unlockAt:0, unlocked:true,
    speech:'音乐小侦探！闭上眼睛听一首曲子，说出三个感受，越具体越好，得4分！'
  },

  // ════════════════════════════════════════════════
  // 🥈 第二阶段：时间感知 + 主动选择（3~6个月）
  // 推荐比例：40%计划类 + 40%挑战类 + 20%创意类
  // ════════════════════════════════════════════════

  // 📅 小小计划卡（主推）
  {
    id:'p2_plan1', series:'📅 小小计划', phase:2, recommendType:'plan',
    color:'#F9A825', lightColor:'#FFFDE7', stars:'📅',
    name:'我来定时间', sub:'自己报告计划时间，然后做到！⏰',
    desc:'今天选一件事，告诉爸妈你打算几点做，然后在那个时间自己做到',
    tip:'📌 怎么做：\n①选一件今天要做的事（可以是作业/洗澡/收拾书包）\n②告诉爸爸或妈妈你打算几点做\n③在你说的时间自己去做，不等大人提醒\n④做到了来领分！',
    score:5, unlockAt:60, unlocked:false,
    speech:'我来定时间！选一件事告诉爸妈你打算几点做，然后自己在那个时间做到，得5分！需要60分解锁！'
  },
  {
    id:'p2_plan2', series:'📅 小小计划', phase:2, recommendType:'plan',
    color:'#F9A825', lightColor:'#FFFDE7', stars:'📅📅',
    name:'今日计划官', sub:'早上说出今天的三件事，晚上看完成了几件！',
    desc:'早上说出今天打算完成的三件事，睡前对照看完成了几件',
    tip:'📌 怎么做：\n①早上告诉爸妈今天打算做哪三件事\n②晚上睡前对照，说出完成了哪些\n③完成2件以上来领分！',
    score:7, unlockAt:90, unlocked:false,
    speech:'今日计划官！早上说出三件计划，睡前对照完成情况，完成两件以上得7分！需要90分解锁！'
  },
  {
    id:'p2_plan3', series:'📅 小小计划', phase:2, recommendType:'plan',
    color:'#F9A825', lightColor:'#FFFDE7', stars:'📅📅📅',
    name:'一周计划师', sub:'今天定好这周想做的一件挑战！',
    desc:'说出这周想挑战的一件事，到周末汇报结果',
    score:10, unlockAt:120, unlocked:false,
    speech:'一周计划师！说出这周想挑战的一件事，周末汇报结果，得10分！需要120分解锁！'
  },

  // 💪 升级挑战卡（主推）
  {
    id:'p2_challenge1', series:'💪 升级挑战', phase:2, recommendType:'challenge',
    color:'#FF6B35', lightColor:'#FFF0E6', stars:'💪',
    name:'专注升级12分钟', sub:'比上次多2分钟，你做到了！⏱️',
    desc:'完成一个12分钟专注块，中途不分心',
    score:5, unlockAt:70, unlocked:false,
    speech:'专注升级12分钟！比上次多2分钟，坚持下来得5分！需要70分解锁！'
  },
  {
    id:'p2_challenge2', series:'💪 升级挑战', phase:2, recommendType:'challenge',
    color:'#FF6B35', lightColor:'#FFF0E6', stars:'💪💪',
    name:'不被提醒的一天', sub:'今天有多少件事自己想起来做的？',
    desc:'今天有至少3件固定任务是自己想起来做的（不需要提醒）',
    tip:'📌 怎么算：\n①早晨英雄包/睡前英雄包/作业\n②今天有3件以上自己主动想起来\n③睡前告诉爸妈是哪几件\n诚实说，不管几件都不扣分',
    score:8, unlockAt:100, unlocked:false,
    speech:'不被提醒的一天！今天有三件以上自己主动想起来做，睡前告诉爸妈是哪些，得8分！需要100分解锁！'
  },
  {
    id:'p2_challenge3', series:'💪 升级挑战', phase:2, recommendType:'challenge',
    color:'#FF6B35', lightColor:'#FFF0E6', stars:'💪💪💪',
    name:'一周早晨英雄', sub:'这周每天早晨三件事全做到！🌅',
    desc:'连续5天早晨英雄包全套完成',
    score:12, unlockAt:130, unlocked:false,
    speech:'一周早晨英雄！连续五天早晨三件事全做到，得12分！需要130分解锁！'
  },

  // 🎨 创意表达卡（辅推）
  {
    id:'p2_creative1', series:'🎨 创意表达', phase:2, recommendType:'creative',
    color:'#9C27B0', lightColor:'#F3E5F5', stars:'🎨',
    name:'故事连环画', sub:'画3格漫画，讲一个完整故事！📖',
    desc:'画3格漫画，讲一个有开始有结尾的故事',
    tip:'📖 规则：\n①第1格：故事的开始\n②第2格：故事的经过\n③第3格：故事的结尾\n④画完讲给大家听\n画面越简单越好，故事越奇妙越好！',
    score:8, unlockAt:80, unlocked:false,
    speech:'故事连环画！画三格漫画，讲一个有开始有结尾的故事，画完讲给大家听，得8分！需要80分解锁！'
  },
  {
    id:'p2_creative2', series:'🎨 创意表达', phase:2, recommendType:'creative',
    color:'#9C27B0', lightColor:'#F3E5F5', stars:'🎨🎨',
    name:'我的发明', sub:'发明一个新的玩法，教爸爸来玩！',
    desc:'发明一个游戏或玩法，写下规则，教爸爸妈妈玩',
    score:8, unlockAt:100, unlocked:false,
    speech:'我的发明！发明一个新玩法，写下规则教爸妈来玩，你是规则制定者，得8分！需要100分解锁！'
  },

  // ════════════════════════════════════════════════
  // 🥇 第三阶段：自我觉察 + 目标设定（6个月后）
  // 推荐比例：30%反思类 + 30%自定义类 + 40%挑战类
  // ════════════════════════════════════════════════

  // 🪞 英雄复盘卡（主推）
  {
    id:'p3_reflect1', series:'🪞 英雄复盘', phase:3, recommendType:'reflect',
    color:'#00897B', lightColor:'#EDFFF9', stars:'🪞',
    name:'今日最自豪', sub:'说出今天你最满意的一件事！✨',
    desc:'睡前说出今天你最满意的一件事，并说出为什么',
    tip:'📌 怎么说：\n①今天有什么事你做得很好？\n②为什么你觉得做得好？\n③说出来就得分，不评判对错',
    score:4, unlockAt:150, unlocked:false,
    speech:'今日最自豪！睡前说出今天最满意的一件事，说出为什么，得4分！需要150分解锁！'
  },
  {
    id:'p3_reflect2', series:'🪞 英雄复盘', phase:3, recommendType:'reflect',
    color:'#00897B', lightColor:'#EDFFF9', stars:'🪞🪞',
    name:'我想做得更好', sub:'说出明天想改进的一件事！',
    desc:'说出明天有一件事想做得更好，说出具体怎么改进',
    score:5, unlockAt:180, unlocked:false,
    speech:'我想做得更好！说出明天想改进的一件事，说出怎么改进，得5分！需要180分解锁！'
  },
  {
    id:'p3_reflect3', series:'🪞 英雄复盘', phase:3, recommendType:'reflect',
    color:'#00897B', lightColor:'#EDFFF9', stars:'🪞🪞🪞',
    name:'进步对比', sub:'和三个月前的自己比，你变了什么？',
    desc:'和爸爸妈妈一起说出你现在会做的事，以前不会做的是哪几件',
    score:8, unlockAt:200, unlocked:false,
    speech:'进步对比！说出你现在会做的事，哪些是三个月前不会的，看到自己的成长，得8分！需要200分解锁！'
  },

  // 🎯 自定义挑战卡（主推）
  {
    id:'p3_custom1', series:'🎯 我的挑战', phase:3, recommendType:'custom',
    color:'#EF476F', lightColor:'#FEE8EE', stars:'⭐',
    name:'我的本周挑战', sub:'自己提出一个本周挑战！👊',
    desc:'自己说出一个本周想挑战的事，爸妈审核通过后执行',
    tip:'📌 怎么做：\n①想一件这周想挑战的事（可以是任何事）\n②告诉爸爸妈妈\n③爸妈觉得合理就通过\n④周末汇报结果，完成得双倍积分！',
    score:10, unlockAt:160, unlocked:false,
    speech:'我的本周挑战！自己提出一个想挑战的事，爸妈通过后执行，周末汇报结果，得10分！需要160分解锁！'
  },
  {
    id:'p3_custom2', series:'🎯 我的挑战', phase:3, recommendType:'custom',
    color:'#EF476F', lightColor:'#FEE8EE', stars:'⭐⭐',
    name:'我设计一张任务卡', sub:'自己设计任务卡，爸妈来审核！🃏',
    desc:'自己设计一张任务卡（名字+要做什么+得多少分），爸妈审核通过后加入系统',
    score:12, unlockAt:200, unlocked:false,
    speech:'我设计一张任务卡！自己设计名字和要做什么，爸妈审核通过加入系统，得12分！需要200分解锁！'
  },

  // 🏆 里程碑回顾卡（辅推）
  {
    id:'p3_milestone1', series:'🏆 里程碑回顾', phase:3, recommendType:'reflect',
    color:'#7B2FBE', lightColor:'#F3E8FF', stars:'🏆',
    name:'三个月英雄档案', sub:'三个月的成长，写成你的英雄故事！',
    desc:'和爸爸妈妈一起回顾三个月来做到的所有成就，说出最骄傲的三件事',
    score:15, unlockAt:250, unlocked:false,
    speech:'三个月英雄档案！回顾三个月所有成就，说出最骄傲的三件事，得15分！需要250分解锁！'
  },

  // ════════════════════════════════════════════════
  // 🎯 原有精华卡（保留，三阶段通用）
  // ════════════════════════════════════════════════

  // 阅读探索系列·恐龙主题
  {
    id:'c5', series:'📚 阅读探索', theme:'恐龙', color:'#06D6A0', lightColor:'#EDFFF9',
    level:1, stars:'⭐',
    name:'恐龙侦探出动',
    sub:'翻开书，发现新世界！🦕',
    desc:'翻一本书，找到最酷的图',
    score:4, unlockAt:0, unlocked:true,
    speech:'恐龙侦探出动！翻开任何一本书，找到你觉得最酷的那张图，带来给大家看！完成得4分！'
  },
  {
    id:'c6', series:'📚 阅读探索', theme:'恐龙', color:'#06D6A0', lightColor:'#EDFFF9',
    level:2, stars:'⭐⭐',
    name:'小老师登场了',
    sub:'我来教妈妈！👨‍🏫',
    desc:'给妈妈讲书里一个有趣知识',
    score:6, unlockAt:30, unlocked:false,
    speech:'小老师登场！给妈妈讲书里一个你觉得有趣的知识，你讲妈妈听，完成得6分！需要30分解锁！'
  },
  {
    id:'c7', series:'📚 阅读探索', theme:'恐龙', color:'#06D6A0', lightColor:'#EDFFF9',
    level:3, stars:'⭐⭐⭐',
    name:'知识能量充能',
    sub:'自己看书10分钟 ⚡',
    desc:'自己安静看书10分钟',
    score:8, unlockAt:60, unlocked:false,
    speech:'知识能量充能！自己安静看书10分钟，不用大人陪，专注就是超能力，得8分！需要60分解锁！'
  },
  {
    id:'c8', series:'📚 阅读探索', theme:'恐龙', color:'#06D6A0', lightColor:'#EDFFF9',
    level:4, stars:'⭐⭐⭐⭐',
    name:'恐龙博士认证',
    sub:'妈妈陪读，我来讲！🏆',
    desc:'妈妈陪读30分钟，由他来讲',
    score:15, unlockAt:100, unlocked:false,
    speech:'恐龙博士认证！妈妈陪你读30分钟书，这次换你来讲，当妈妈的老师，完成得15分！需要100分解锁！'
  },
  // 创造挑战系列·乐高/蜘蛛侠主题
  {
    id:'c9', series:'🎨 创造挑战', theme:'乐高', color:'#7B2FBE', lightColor:'#F3E8FF',
    level:1, stars:'⭐',
    name:'乐高工程师·初级',
    sub:'积木变成新东西！🧱',
    desc:'用积木做一个新东西',
    score:4, unlockAt:0, unlocked:true,
    speech:'乐高工程师初级！用积木创造一个全新的东西，什么都行，创意最重要，完成得4分！'
  },
  {
    id:'c10', series:'🎨 创造挑战', theme:'蜘蛛侠', color:'#7B2FBE', lightColor:'#F3E8FF',
    level:2, stars:'⭐⭐',
    name:'蜘蛛侠·发明家',
    sub:'我的发明，我做主！🕷️',
    desc:'画一幅画或发明一个玩具玩法',
    score:6, unlockAt:30, unlocked:false,
    speech:'蜘蛛侠发明家！画一幅画，或者发明一种新的玩具玩法，你的发明你做主，得6分！需要30分解锁！'
  },
  {
    id:'c11', series:'🎨 创造挑战', theme:'乐高', color:'#7B2FBE', lightColor:'#F3E8FF',
    level:3, stars:'⭐⭐⭐',
    name:'乐高大师在线',
    sub:'从来没做过的作品！🌟',
    desc:'创造一个从来没做过的作品',
    score:10, unlockAt:60, unlocked:false,
    speech:'乐高大师在线！创造一个从来没做过的全新作品，独一无二的才算，得10分！需要60分解锁！'
  },
  {
    id:'c12', series:'🎨 创造挑战', theme:'蜘蛛侠', color:'#7B2FBE', lightColor:'#F3E8FF',
    level:4, stars:'⭐⭐⭐⭐',
    name:'超级英雄基地',
    sub:'教爸爸妈妈玩我的游戏！🏰',
    desc:'发明一个游戏，教爸爸妈妈玩',
    score:15, unlockAt:100, unlocked:false,
    speech:'超级英雄基地！自己发明一个游戏，然后教爸爸妈妈怎么玩，你是规则制定者，得15分！需要100分解锁！'
  },
  // 舞蹈挑战系列·敖丙主题
  {
    id:'c13', series:'💃 舞蹈挑战', theme:'敖丙', color:'#7B2FF7', lightColor:'#F3E8FF',
    level:1, stars:'⭐',
    name:'敖丙·初次亮相',
    sub:'跟着音乐动起来！🎵',
    desc:'跟爸爸一起跳舞，随便怎么跳都行',
    score:3, unlockAt:0, unlocked:true,
    speech:'敖丙初次亮相！今天跟爸爸一起跳舞，随便怎么跳都行，动起来就得3分！'
  },
  {
    id:'c14', series:'💃 舞蹈挑战', theme:'敖丙', color:'#7B2FF7', lightColor:'#F3E8FF',
    level:2, stars:'⭐⭐',
    name:'敖丙·学一个新动作',
    sub:'跟爸爸学一个新舞步！💫',
    desc:'请爸爸教一个新舞步，练习到能独立做出来',
    score:8, unlockAt:30, unlocked:false,
    speech:'敖丙学一个新动作！请爸爸教你一个新舞步，练习到能独立做出来就得8分！需要30分解锁！'
  },
  {
    id:'c15', series:'💃 舞蹈挑战', theme:'敖丙', color:'#7B2FF7', lightColor:'#F3E8FF',
    level:3, stars:'⭐⭐⭐',
    name:'敖丙·即兴表演',
    sub:'听到音乐就起舞！🔥',
    desc:'爸爸随机播放一首歌，子渊即兴跳至少30秒',
    score:12, unlockAt:60, unlocked:false,
    speech:'敖丙即兴表演！爸爸随机播放一首歌，你即兴跳至少30秒，充分表现自己，得12分！需要60分解锁！'
  },
  {
    id:'c16', series:'💃 舞蹈挑战', theme:'敖丙', color:'#7B2FF7', lightColor:'#F3E8FF',
    level:4, stars:'⭐⭐⭐⭐',
    name:'敖丙·父子演出',
    sub:'和爸爸一起完整表演一支舞！🏆',
    desc:'和爸爸一起排练并完整表演一支舞（至少1分钟）',
    score:20, unlockAt:100, unlocked:false,
    speech:'敖丙父子演出！和爸爸一起排练并完整表演一支舞，至少一分钟，这是最高舞蹈挑战，得20分！需要100分解锁！'
  },
  // 习惯养成系列·子渊日常主题
  {
    id:'h1', series:'🌙 习惯养成', theme:'小英雄日常', color:'#118AB2', lightColor:'#E8F4FD',
    level:1, stars:'⭐',
    name:'晨间英雄包·自主版',
    sub:'早晨三件事，不等提醒自己做！🌅',
    desc:'今天早晨穿衣、洗脸刷牙、吃早饭全部自己完成，没等大人提醒',
    tip:'📌 三件事：\n①自己穿好衣服\n②洗脸刷牙\n③好好吃早饭\n全部自己做到，来领这张卡！',
    score:5, unlockAt:0, unlocked:true,
    speech:'晨间英雄包自主版！早晨三件事全部自己完成，穿衣洗脸吃饭都搞定，不用提醒，得5分！'
  },
  {
    id:'h2', series:'🌙 习惯养成', theme:'小英雄日常', color:'#118AB2', lightColor:'#E8F4FD',
    level:2, stars:'⭐⭐',
    name:'睡前自律达人',
    sub:'睡前四件事，自己全搞定！🌙',
    desc:'今天睡前：洗澡/洗脸刷牙/收拾书包/按时上床，全部自己做，没等催',
    tip:'📌 四件事：\n①洗澡或洗脸刷牙\n②整理好明天的书包\n③衣服放好\n④按时躺床上\n四件全做到来领分！',
    score:6, unlockAt:15, unlocked:false,
    speech:'睡前自律达人！洗澡整理书包按时上床四件事全做到，不用催，得6分！需要15分解锁！'
  },
  {
    id:'h3', series:'🌙 习惯养成', theme:'小英雄日常', color:'#118AB2', lightColor:'#E8F4FD',
    level:2, stars:'⭐⭐',
    name:'东西放回原位',
    sub:'用完的东西，自己放回去！📦',
    desc:'今天所有用过的东西（玩具/书/文具），用完后自己放回原来的地方',
    tip:'📌 规则：\n①玩完的玩具放回玩具箱\n②看完的书放回书架\n③文具放回文具盒\n④一整天都做到，来领分！',
    score:5, unlockAt:10, unlocked:false,
    speech:'东西放回原位！今天所有用过的东西用完后自己放回去，玩具书文具都整整齐齐，得5分！需要10分解锁！'
  },
  {
    id:'h4', series:'🌙 习惯养成', theme:'小英雄日常', color:'#118AB2', lightColor:'#E8F4FD',
    level:3, stars:'⭐⭐⭐',
    name:'一整天不催人',
    sub:'所有该做的事，都是自己想起来的！👑',
    desc:'今天一整天，所有该做的事（吃饭、洗漱、写作业、收拾）都是自己主动做的，没等大人催',
    score:10, unlockAt:40, unlocked:false,
    speech:'一整天不催人！今天所有该做的事都自己主动做，没等大人催一次，这就是真正的自律，得10分！需要40分解锁！'
  },
  {
    id:'h5', series:'🌙 习惯养成', theme:'小英雄日常', color:'#118AB2', lightColor:'#E8F4FD',
    level:4, stars:'⭐⭐⭐⭐',
    name:'连续三天全自律',
    sub:'三天都做到「一整天不催人」！🏆',
    desc:'连续三天，所有该做的事都是自己主动做的',
    score:18, unlockAt:80, unlocked:false,
    speech:'连续三天全自律！三天都做到所有事自己主动做，这是最高习惯养成成就，得18分！需要80分解锁！'
  },
    // 独立思考系列·太乙真人主题
  {
    id:'c17', series:'🧠 独立思考', theme:'太乙真人', color:'#00897B', lightColor:'#EDFFF9',
    level:1, stars:'⭐',
    name:'太乙真人·灵感时刻',
    sub:'先想一分钟，再找大人 💡',
    desc:'遇到困难，先自己想1分钟',
    score:4, unlockAt:0, unlocked:true,
    speech:'太乙真人灵感时刻！遇到困难先自己想1分钟，不要马上找大人，想完再说，完成得4分！'
  },
  {
    id:'c18', series:'🧠 独立思考', theme:'太乙真人', color:'#00897B', lightColor:'#EDFFF9',
    level:2, stars:'⭐⭐',
    name:'太乙真人·神来之笔',
    sub:'没人要求，我自己做！✨',
    desc:'做一件没人要求的正确事',
    score:7, unlockAt:50, unlocked:false,
    speech:'太乙真人神来之笔！没有人要求你，但你自己主动做了一件正确的事，这就是真正的智慧，得7分！需要50分解锁！'
  },
  {
    id:'c19', series:'🧠 独立思考', theme:'太乙真人', color:'#00897B', lightColor:'#EDFFF9',
    level:3, stars:'⭐⭐⭐',
    name:'太乙真人·开天眼',
    sub:'大人答不上来的问题！🎯',
    desc:'问了一个大人答不上来的问题',
    score:10, unlockAt:80, unlocked:false,
    speech:'太乙真人开天眼！问一个大人答不上来的问题，越奇怪越好，好奇心是最厉害的超能力，得10分！需要80分解锁！'
  },
  // 独立思考补充卡（填补20~50分空档期，联动创造力）
  {
    id:'c20', series:'🧠 独立思考', theme:'太乙真人', color:'#00897B', lightColor:'#EDFFF9',
    level:2, stars:'⭐⭐',
    name:'我有一个主意',
    sub:'先自己想，再告诉大人！💡',
    desc:'遇到一个问题，先自己想出一个方法，再去告诉爸爸或妈妈',
    score:5, unlockAt:20, unlocked:false,
    tip:'💡 任务规则：\n①今天遇到任何一个小问题（找不到东西/想做一件事/想去哪里玩……）\n②先在心里想1~2分钟，想出至少一个方法\n③再去告诉爸爸妈妈你的想法\n④说出来就得分！不管想法好不好\n→ 完成后可解锁「把你的主意做成作品」创造挑战🎨',
    speech:'我有一个主意！遇到问题先自己想出方法，再告诉大人，说出来就得分，越大胆越好，得5分！完成后还能解锁创造挑战！需要20分解锁！',
    unlockNext:'c_create_idea'
  },
  {
    id:'c21', series:'🧠 独立思考', theme:'太乙真人', color:'#00897B', lightColor:'#EDFFF9',
    level:2, stars:'⭐⭐',
    name:'我不同意',
    sub:'说出你觉得不对的地方！🙋',
    desc:'读一本书或看一段视频后，说出一个你觉得"不对"或"可以更好"的地方',
    score:6, unlockAt:35, unlocked:false,
    tip:'🙋 怎么做：\n①读完一本书或看完一段视频\n②认真想一想：有没有哪里你觉得说得不对？或者可以更好？\n③大胆说出来，哪怕说错了也不扣分\n④说完爸妈会认真听你的理由\n→ 不急着寻找"唯一正确答案"的孩子，最有创造力💡',
    speech:'我不同意！读书或看视频后，说出一个你觉得不对或可以更好的地方，大胆说出来就得分，得6分！需要35分解锁！'
  },
  // 数学专项卡·闪电侠（第一周后解锁）
  {
    id:'m1', series:'⚡ 数学专项', theme:'闪电侠', color:'#118AB2', lightColor:'#E8F4FD',
    level:1, stars:'⚡',
    name:'闪电侠·热身赛',
    sub:'完成口算，记录时间 ⏱️',
    desc:'完成口算，记录完成时间',
    score:4, unlockAt:0, unlocked:false, weekUnlock:true,
    speech:'闪电侠热身赛！完成口算练习，记录下你用了多少时间，开始计时！完成得4分！第一周结束后解锁！'
  },
  {
    id:'m2', series:'⚡ 数学专项', theme:'闪电侠', color:'#118AB2', lightColor:'#E8F4FD',
    level:2, stars:'⚡⚡',
    name:'闪电侠·速度挑战',
    sub:'今天比昨天快，哪怕(pà)快1秒！⚡',
    desc:'今天比昨天完成口算更快',
    score:6, unlockAt:0, unlocked:false, weekUnlock:true,
    speech:'闪电侠速度挑战！今天做口算要比昨天快，哪怕只快了1秒也算赢，进步就是胜利，得6分！'
  },
  {
    id:'m3', series:'⚡ 数学专项', theme:'恐龙', color:'#118AB2', lightColor:'#E8F4FD',
    level:1, stars:'🦕',
    name:'恐龙数学家',
    sub:'恐龙题目，我来算！🦕',
    desc:'算爸爸出的恐龙数学题',
    score:5, unlockAt:0, unlocked:false, weekUnlock:true,
    speech:'恐龙数学家！让爸爸出一道关于恐龙的数学题，你来算出答案，完成得5分！'
  },
  {
    id:'m4', series:'⚡ 数学专项', theme:'闪电侠', color:'#118AB2', lightColor:'#E8F4FD',
    level:3, stars:'⚡⚡⚡',
    name:'我来出题考爸爸',
    sub:'爸爸答错了更好！😄',
    desc:'自己出题考爸爸',
    score:8, unlockAt:0, unlocked:false, weekUnlock:true,
    speech:'我来出题考爸爸！自己想一道数学题，然后考爸爸，爸爸答错了算你赢，得8分！'
  },
  {
    id:'m5', series:'⚡ 数学专项', theme:'生活', color:'#118AB2', lightColor:'#E8F4FD',
    level:1, stars:'🔢',
    name:'生活里的数字',
    sub:'买东西算钱，量身(shēn)高，数台阶',
    desc:'买东西算钱/量身高/数台阶',
    score:5, unlockAt:0, unlocked:false, weekUnlock:true,
    speech:'生活里的数字！买东西的时候帮忙算钱，或者量一量自己的身高，或者数数台阶有多少级，数学就在生活里，得5分！'
  },
  // 英语专项卡·蜘蛛侠（第一周后解锁）
  {
    id:'e1', series:'🌍 英语专项', theme:'蜘蛛侠', color:'#06D6A0', lightColor:'#EDFFF9',
    level:1, stars:'🌍',
    name:'蜘蛛侠·解锁秘技',
    sub:'恐龙的英文名，超酷！🦖',
    desc:'学会一个恐龙的英文名',
    score:4, unlockAt:0, unlocked:false, weekUnlock:true,
    speech:'蜘蛛侠解锁秘技！学会一个恐龙的英文名字，说出来给大家听，超酷的，得4分！'
  },
  {
    id:'e2', series:'🌍 英语专项', theme:'蜘蛛侠', color:'#06D6A0', lightColor:'#EDFFF9',
    level:2, stars:'🌍🌍',
    name:'蜘蛛侠·开口时刻',
    sub:'说出来就得分，不管对不对！🎤',
    desc:'用英语说一句今天发生的事',
    score:5, unlockAt:0, unlocked:false, weekUnlock:true,
    speech:'蜘蛛侠开口时刻！用英语说一句今天发生的事，说出来就得分，不管说得对不对，勇敢开口才是英雄，得5分！'
  },
  {
    id:'e3', series:'🌍 英语专项', theme:'蜘蛛侠', color:'#06D6A0', lightColor:'#EDFFF9',
    level:1, stars:'🕷️',
    name:'蜘蛛侠·暗语系统',
    sub:'给玩具起英文名字！🕷️',
    desc:'给自己的玩具起一个英文名',
    score:4, unlockAt:0, unlocked:false, weekUnlock:true,
    speech:'蜘蛛侠暗语系统！给你最喜欢的玩具起一个英文名字，只有你知道的秘密暗语，得4分！'
  },
  {
    id:'e4', series:'🌍 英语专项', theme:'英雄联盟', color:'#06D6A0', lightColor:'#EDFFF9',
    level:1, stars:'🎵',
    name:'英雄联盟·全球频道',
    sub:'跟着英文歌唱一句 🎵',
    desc:'跟着英文歌唱一句',
    score:3, unlockAt:0, unlocked:false, weekUnlock:true,
    speech:'英雄联盟全球频道！跟着一首英文歌唱出一句，哼也算，声音大的话加分！完成得3分！'
  },
  {
    id:'e5', series:'🌍 英语专项', theme:'蜘蛛侠', color:'#06D6A0', lightColor:'#EDFFF9',
    level:3, stars:'🌍🌍🌍',
    name:'蜘蛛侠·情报播报',
    sub:'用英语介绍动物，爸爸来听！📢',
    desc:'用英语给爸爸介绍一个动物',
    score:8, unlockAt:0, unlocked:false, weekUnlock:true,
    speech:'蜘蛛侠情报播报！用英语给爸爸介绍一个动物，说说它的名字、样子或者特点，爸爸认真听，得8分！'
  },
  {
    id:'e6', series:'🌍 英语专项', theme:'恐龙', color:'#06D6A0', lightColor:'#EDFFF9',
    level:2, stars:'📖',
    name:'恐龙英语百科官',
    sub:'书里找到英文单词！📖',
    desc:'在书里找到一个英文单词',
    score:4, unlockAt:0, unlocked:false, weekUnlock:true,
    speech:'恐龙英语百科官！在任何一本书里找到一个英文单词，念出来，知道什么意思更好，得4分！'
  },
  // 特别自选卡
  {
    id:'sp1', series:'🦕 特别自选', theme:'恐龙勇士', color:'#EF476F', lightColor:'#FEE8EE',
    level:1, stars:'🦕',
    name:'恐龙勇士·味觉挑战',
    sub:'尝一口没吃过的食物，勇士！🦕',
    desc:'尝一口不喜欢的食物（哪怕只是一小口）',
    score:4, unlockAt:0, unlocked:true,
    speech:'恐龙勇士味觉挑战！尝一口你不喜欢的食物，哪怕只是一小小口，勇敢的恐龙勇士才能完成这个挑战，得4分！'
  },

  // 🖌️ 绘画日记系列（独立系列，精准追踪绘画兴趣）
  {
    id:'art1', series:'🖌️ 绘画日记', theme:'小画家', color:'#9C27B0', lightColor:'#F3E5F5',
    level:1, stars:'🎨',
    name:'英雄图鉴',
    sub:'画出你心目中最厉害的英雄！🦸',
    desc:'画出你心目中最厉害的英雄，画完讲给爸爸或妈妈听',
    score:5, unlockAt:0, unlocked:true,
    tip:'🎨 怎么画：\n①想一想你最喜欢的英雄（可以是奥特曼/恐龙/超级英雄/你自己创造的）\n②用画笔画出他的样子，不要求画得好看，画出感觉就行\n③画完讲给爸爸或妈妈听：他叫什么？有什么能力？\n④讲完就得分！每幅画都是世界上独一无二的🌟',
    speech:'英雄图鉴！画出你心目中最厉害的英雄，画完讲给爸爸妈妈听，每幅画都是世界上独一无二的，得5分！'
  },
  {
    id:'art2', series:'🖌️ 绘画日记', theme:'小画家', color:'#9C27B0', lightColor:'#F3E5F5',
    level:2, stars:'🎨🎨',
    name:'故事连环画',
    sub:'画3格漫画，讲一个完整故事！📖',
    desc:'画3格漫画，每格画面讲一个故事的开始、中间、结尾',
    score:8, unlockAt:20, unlocked:false,
    tip:'📖 故事连环画规则：\n①第1格：故事的开始（发生了什么？）\n②第2格：故事的经过（然后呢？）\n③第3格：故事的结尾（最后怎样了？）\n④画完讲给大家听\n画面越简单越好，故事越奇妙越好！\n→ 完成后可解锁「把你的主意做成作品」创造挑战🎨',
    speech:'故事连环画！画3格漫画，讲一个有开始有结尾的故事，画完讲给大家听，得8分！需要20分解锁！',
    unlockNext:'c_create_idea'
  },
  {
    id:'art3', series:'🖌️ 绘画日记', theme:'音画联动', color:'#9C27B0', lightColor:'#F3E5F5',
    level:3, stars:'🎨🎨🎨',
    name:'音画故事',
    sub:'听爸爸演奏，画出你听到的颜色！🎵🎨',
    desc:'爸爸演奏一段曲子，你把听到的感受画成画面（颜色/形状/故事都行）',
    score:10, unlockAt:40, unlocked:false,
    tip:'🎵🎨 音画联动：\n①爸爸演奏一段曲子（钢琴/吉他都可以）\n②你一边听一边画，不限主题\n③可以画颜色的感觉、可以画故事、可以画抽象形状\n④画完告诉大家：这段音乐让你想到了什么\n这是音乐家爸爸和小画家的联合创作！🌟',
    speech:'音画故事！爸爸演奏一段曲子，你把听到的感受画出来，颜色形状故事都行，这是音乐和绘画的联合创作，得10分！需要40分解锁！'
  },

  // 🎵 音乐探索系列（新增）
  {
    id:'mu1', series:'🎵 音乐探索', theme:'小音乐家', color:'#FF6B9D', lightColor:'#FFF0F7',
    level:1, stars:'🎵',
    name:'音乐小侦探',
    sub:'这首曲子在哪听过？🎧',
    desc:'闭上眼睛听一首曲子，说出你的感受（开心/难过/想跑步/想睡觉……）',
    score:3, unlockAt:0, unlocked:true,
    tip:'🎵 怎么玩：\n①爸爸或妈妈播放一首曲子（可以是钢琴/吉他/古典/流行）\n②你闭上眼睛认真听\n③听完说出你的感受，不管是什么感受都算赢！\n感受说得越具体越加分 🌟',
    speech:'音乐小侦探！闭上眼睛听一首曲子，告诉大家你听到了什么感觉，开心还是难过，想跑步还是想睡觉，完成得3分！'
  },
  {
    id:'mu2', series:'🎵 音乐探索', theme:'小音乐家', color:'#FF6B9D', lightColor:'#FFF0F7',
    level:2, stars:'🎵🎵',
    name:'哼哼哈哈小作曲家',
    sub:'自己哼一段旋律！🎶',
    desc:'自己哼出或打出一段节奏，哪怕只有4个音，然后录下来',
    score:5, unlockAt:0, unlocked:true,
    tip:'🎶 规则：\n①自己想一段旋律，随便哼、打节奏都算\n②让爸爸帮你用手机录下来\n③保存就算完成！不评价对不对，只看你有没有"创造"了东西\n你哼出来的就是世界上独一无二的！🌟',
    speech:'哼哼哈哈小作曲家！自己哼出一段旋律，哪怕只有四个音，让爸爸帮你录下来，你就是小作曲家，得5分！'
  },
  {
    id:'mu3', series:'🎵 音乐探索', theme:'爸爸工作室', color:'#FF6B9D', lightColor:'#FFF0F7',
    level:2, stars:'🎸',
    name:'爸爸乐器探索课',
    sub:'爸爸教我摸一摸乐器！🎸',
    desc:'让爸爸介绍并演示他的一件乐器，你也动手试试',
    score:5, unlockAt:0, unlocked:true,
    tip:'🎸 任务说明：\n①让爸爸拿出一件乐器\n②爸爸介绍这件乐器叫什么名字、怎么发声\n③爸爸演示一小段\n④你也来试试摸一摸、弹一弹或者敲一敲\n动手了就算完成！',
    speech:'爸爸乐器探索课！让爸爸拿出他的乐器，给你介绍和演示，你也动手摸一摸试一试，完成得5分！'
  },
  {
    id:'mu4', series:'🎵 音乐探索', theme:'小音乐家', color:'#FF6B9D', lightColor:'#FFF0F7',
    level:3, stars:'🎵🎵🎵',
    name:'节奏大师挑战',
    sub:'用身体打出爸爸的节奏！🥁',
    desc:'爸爸打出一段节奏，你用拍手/跺脚/拍腿复制出来',
    score:6, unlockAt:30, unlocked:false,
    tip:'🥁 怎么玩：\n①爸爸打出一段节奏（4-8拍）\n②你用拍手、跺脚或者拍腿复制出来\n③三次内复制成功就算赢！\n节奏感就是音乐的骨架，爸爸最懂！',
    speech:'节奏大师挑战！爸爸打出一段节奏，你用拍手跺脚复制出来，三次内成功就算赢，得6分！需要30分解锁！'
  },
  {
    id:'mu5', series:'🎵 音乐探索', theme:'小音乐家', color:'#FF6B9D', lightColor:'#FFF0F7',
    level:3, stars:'🎵🎵🎵',
    name:'音乐故事讲述者',
    sub:'给这段音乐编一个故事 📖',
    desc:'听完爸爸演奏的一段曲子，给这段音乐配上一个故事',
    score:7, unlockAt:30, unlocked:false,
    tip:'📖 任务流程：\n①爸爸演奏一段曲子（1-2分钟）\n②你认真听，想象画面\n③告诉大家你脑子里出现了什么故事\n④故事说出来就得分，越天马行空越好！',
    speech:'音乐故事讲述者！爸爸演奏一段曲子，你听完给这段音乐编一个故事，说出来就得分，越奇妙越好，得7分！需要30分解锁！'
  },
  {
    id:'mu6', series:'🎵 音乐探索', theme:'爸爸工作室', color:'#FF6B9D', lightColor:'#FFF0F7',
    level:4, stars:'🎵🎵🎵🎵',
    name:'小音乐家·自由创作',
    sub:'我来配，爸爸演奏！🎤',
    desc:'爸爸演奏，你来配上舞蹈或歌词或节奏，完成一段合作表演',
    score:10, unlockAt:60, unlocked:false,
    tip:'🎤 合作创作：\n①爸爸演奏一段你喜欢的曲子\n②你自由发挥：可以跳舞配合、可以哼歌词、可以拍手打节奏\n③完成整段就是一次真正的合作表演！\n这就是最小版本的演出 🌟',
    speech:'小音乐家自由创作！爸爸演奏，你来配合跳舞或唱歌或打节奏，完成一段合作表演，得10分！需要60分解锁！'
  },

  // 🎤 演出里程碑系列（前置条件：需音乐探索积累 + 舞蹈打卡）
  {
    id:'show1', series:'🎤 演出里程碑', theme:'父子乐队', color:'#F9A825', lightColor:'#FFFDE7',
    level:1, stars:'🎤',
    name:'父子首演！小剧场版',
    sub:'家里的小舞台，你是主角！🌟',
    desc:'在家里举办一场小型演出，爸爸伴奏，你表演（舞蹈/唱歌/讲故事都算），邀请妈妈当观众',
    score:15, unlockAt:40, unlocked:false,
    prereq:'音乐探索系列完成2张 + 每日舞蹈打卡累计≥20天',
    tip:'🌟 演出清单：\n①确定表演内容（舞蹈/唱歌/朗诵/混合都行）\n②爸爸负责伴奏或音效\n③邀请妈妈坐在台下当观众\n④演出前喊"3-2-1，开始！"\n⑤完整表演一遍就算成功！\n🎵 前置条件：音乐探索完成2张 + 舞蹈打卡≥20天\n不要求完美，只要勇敢上台就是英雄🏆',
    speech:'父子首演家庭小剧场！在家里举办演出，爸爸伴奏你表演，邀请妈妈当观众，完整演完就是英雄，得15分！需要积累音乐探索和舞蹈打卡才能解锁！'
  },
  {
    id:'show2', series:'🎤 演出里程碑', theme:'父子乐队', color:'#F9A825', lightColor:'#FFFDE7',
    level:2, stars:'🎤🎤',
    name:'父子街头艺术家',
    sub:'出门表演，让陌生人鼓掌！👏',
    desc:'和爸爸一起在小区/公园/广场做一次公开表演，哪怕只有一个路人看到',
    score:25, unlockAt:80, unlocked:false,
    prereq:'音乐探索系列完成4张 + 每日舞蹈打卡累计≥40天',
    tip:'👏 演出计划：\n①和爸爸商量表演内容和地点\n②出门找一个小空地\n③爸爸演奏，你配合表演\n④有一个人停下来看，就算成功！\n🎵 前置条件：音乐探索完成4张 + 舞蹈打卡≥40天\n勇敢踏出家门就是最大的进步🌟',
    speech:'父子街头艺术家！和爸爸一起出门表演，找一个小空地，有一个路人停下来看就算成功，得25分！需要更多音乐和舞蹈积累才能解锁！'
  },
  {
    id:'show3', series:'🎤 演出里程碑', theme:'父子乐队', color:'#F9A825', lightColor:'#FFFDE7',
    level:3, stars:'🎤🎤🎤',
    name:'父子乐队·正式演出',
    sub:'爸爸的演出，我是特别嘉宾！✨',
    desc:'参与爸爸的一次正式演出场合，哪怕只是帮爸爸拿一样东西或者做最简单的配合',
    score:30, unlockAt:120, unlocked:false,
    prereq:'音乐探索系列全部完成 + 每日舞蹈打卡累计≥60天',
    tip:'✨ 这是最高荣誉：\n①爸爸安排你参与他的正式演出\n②可以是伴舞、可以是背景音效、可以是最简单的配合\n③只要你出现在演出现场并参与其中就算完成\n🎵 前置条件：音乐探索全系列完成 + 舞蹈打卡≥60天\n这将是你们父子之间最特别的记忆 💛',
    speech:'父子乐队正式演出！参与爸爸的正式演出，哪怕只是最简单的配合，得30分！这是最高荣誉，需要完成所有音乐探索和大量舞蹈积累！'
  },
];

// ── 奖励商店 ───────────────────────────────────────────────────
// tier说明：A类=积分直接兑换；B类=需当月自律率≥目标才解锁
// selfDisciplineRequired: true 表示B类奖励，需月度自律达标才显示
const SHOP = [
  {
    type:'🌸 妈妈专区', color:'#EF476F', lightColor:'#FEE8EE',
    items:[
      // ── A类：日常小奖励（积分直接兑换，7天积极打卡可得）──
      { id:'mom2', icon:'🎮', name:'玩平板/手机游戏：周末多玩15分钟', note:'周末游戏+15分钟', cost:40, tier:'A', speech:'玩平板手机游戏多玩15分钟！花40分，周末游戏时间加15分钟，好好享受！' },
      { id:'mom1', icon:'🍭', name:'今晚我选零食', note:'今晚零食我说了算！', cost:50, tier:'A', speech:'今晚我选零食！花50分，今晚的零食你来选，想吃什么就吃什么！' },
      { id:'mom4', icon:'🎬', name:'周五电影我选片', note:'这周五选什么我决定！', cost:65, tier:'A', speech:'周五电影我选片！花65分，这周五看什么电影你说了算，想看什么就看什么！' },
      { id:'mom3', icon:'🎮🎮', name:'玩平板/手机游戏：周末多玩30分钟', note:'周末游戏+30分钟', cost:80, tier:'A', speech:'玩平板手机游戏多玩30分钟！花80分，周末游戏时间加30分钟，双倍快乐！' },
      { id:'mom6', icon:'🎁', name:'文具盲盒一个', note:'神秘文具盲盒，自己拆！', cost:100, tier:'A', speech:'文具盲盒一个！花100分，神秘文具盲盒由你自己拆，不知道里面是什么，超期待！' },
      { id:'mom5', icon:'🎂', name:'和妈妈一起吃蛋糕', note:'妈妈陪我一起吃个蛋糕 🍰', cost:120, tier:'A', speech:'和妈妈一起吃蛋糕！花120分，妈妈陪你一起吃一个蛋糕，甜蜜蜜！' },
      // ── B类：自律解锁奖励（月度自律率≥85%才显示）──
      { id:'mom7', icon:'🧸', name:'小玩具一个', note:'自己选一个喜欢的小玩具 🔒 自律解锁', cost:150, tier:'B', selfDisciplineRequired:true, speech:'小玩具一个！花150分，自己去挑一个喜欢的小玩具，你说了算！这是属于自律英雄的奖励！' },
      { id:'mom8', icon:'✨', name:'神秘惊喜（妈妈决定）', note:'妈妈准备的特别惊喜 🔒 自律解锁', cost:220, tier:'B', selfDisciplineRequired:true, speech:'神秘惊喜！花220分，妈妈会给你准备一个特别的惊喜，是什么只有妈妈知道，这是给最自律英雄的大奖！' },
      { id:'mom9', icon:'👑', name:'第一阶段终极大奖', note:'三个月坚持的最终奖励 🔒 阶段达成解锁', cost:500, tier:'B', selfDisciplineRequired:true, isPhaseReward:true, speech:'第一阶段终极大奖！三个月的坚持换来的最珍贵奖励，妈妈和你一起决定这份大礼是什么！你是真正的英雄！' },
    ]
  },
  {
    type:'💪 爸爸专区', color:'#118AB2', lightColor:'#E8F4FD',
    items:[
      // ── A类：日常小奖励（积分直接兑换）──
      { id:'dad2', icon:'🏆', name:'爸爸给我办运动颁奖典礼', note:'爸爸准备仪式，表彰运动成就', cost:35, tier:'A', speech:'爸爸给我办运动颁奖典礼！花35分，爸爸专门为你准备颁奖仪式，表彰你的运动成就！' },
      { id:'dad3', icon:'🤸', name:'爸爸陪我学一个新运动动作', note:'爸爸教新动作，学会才算完成', cost:35, tier:'A', speech:'爸爸陪我学新运动动作！花35分，爸爸教你一个新的运动动作，学会了才算完成！' },
      { id:'dad1', icon:'💃', name:'爸爸陪我跳舞30分钟', note:'爸爸专属时光！一起跳舞', cost:40, tier:'A', speech:'爸爸陪我跳舞30分钟！花40分，爸爸陪你跳舞整整30分钟，一起动起来！' },
      { id:'dad7', icon:'🎬😴', name:'爸爸看完整部电影不睡着', note:'【彩蛋】全程监督爸爸！撑住不睡！', cost:50, tier:'A', isEgg:true, speech:'彩蛋任务！爸爸看完整部电影不能睡着！你负责全程监督，爸爸如果撑住了你得5分！' },
      // ── B类：自律解锁奖励（非物质体验，月度自律率≥85%才显示）──
      { id:'dad5', icon:'🌄', name:'爸爸陪我看日出或日落', note:'一起的安静时光 🌅 🔒 自律解锁', cost:80, tier:'B', selfDisciplineRequired:true, speech:'爸爸陪我看日出或日落！花80分，爸爸陪你一起看日出或日落，最美的风景要一起看！这是自律英雄才能拥有的时光！' },
      { id:'dad4', icon:'🗺️', name:'爸爸带我去没去过的地方探索', note:'户外探索冒险 🔒 自律解锁', cost:130, tier:'B', selfDisciplineRequired:true, speech:'爸爸带我去没去过的地方探索！花130分，爸爸带你去一个从来没去过的地方大冒险！这是给坚持自律的探险家的奖励！' },
      { id:'dad6', icon:'🏔️', name:'爸爸带我去爬一座新山', note:'大型户外挑战 🔒 自律解锁', cost:200, tier:'B', selfDisciplineRequired:true, speech:'爸爸带我去爬新山！花200分，爸爸带你去爬一座没爬过的山，大型户外冒险！这是属于自律英雄的终极体验！' },
    ]
  },
];

// ── 跳绳里程碑 ─────────────────────────────────────────────────
const ROPE_MILESTONES = [
  { target:130, bonus:5, label:'⚡ 即将到达！', unlock:null, speech:'里程碑！跳绳达到130个！奥特曼的光线开始蓄力，加5分！继续加油！' },
  { target:150, bonus:8, label:'⭐ 解锁运动加强包', unlock:'运动加强包', speech:'里程碑！跳绳达到150个！运动加强包解锁，加8分！你越来越厉害了！' },
  { target:170, bonus:10, label:'🔥 奥特曼最终形态！', unlock:null, speech:'里程碑！跳绳达到170个！奥特曼最终形态出现，加10分！太厉害了！' },
  { target:200, bonus:20, label:'🏆 宇宙英雄！爸爸颁奖典礼自动触发', unlock:'颁奖典礼', autoTrigger:'dad2', speech:'终极里程碑！跳绳达到200个！你是宇宙英雄！加20分，爸爸的颁奖典礼自动触发！这是最高荣誉！' },
];

// ── 阅读书单 ───────────────────────────────────────────────────
const BOOK_LIST = [
  { stage:'第一阶段·解毒期', desc:'图多字少，随便翻都好玩', books:[
    '《DK儿童恐龙百科全书》',
    '《神奇校车》系列',
    '《DK儿童太空百科全书》',
    '《可怕的科学》系列',
  ]},
  { stage:'第二阶段·建立习惯', desc:'开始有故事线，读下去停不住', books:[
    '《我的第一本科学漫画书》系列',
    '《动物王国大探秘》',
    '《鸡皮疙瘩》系列',
  ]},
  { stage:'第三阶段·深度阅读', desc:'真正意义上的章节书', books:[
    '《西顿动物记》',
    '《万物运转的秘密》',
  ]},
];

// ── 爸爸使用说明 ───────────────────────────────────────────────
const DAD_GUIDE = {
  // ── 写给爸爸妈妈 ──
  parentTitle: '💌 写给爸爸妈妈',
  parentSoul: '我们希望培养的不是「听话的孩子」，而是「有自驱力的孩子」。\n核心不是奖惩，而是让孩子体验「我能做到」的成就感。',
  parentRoles: [
    { icon:'👀', role:'不是监督者', become:'而是见证者' },
    { icon:'🤐', role:'不是提醒机器', become:'而是等待他自己想起来的人' },
    { icon:'🎉', role:'不是奖励发放员', become:'而是他成就感的第一个观众' },
  ],
  parentPrinciples: [
    { icon:'①', title:'克制提醒的冲动', desc:'每一次他自己想起来，都比你提醒一百次更有价值。系统会记录「自主」和「被提醒」——数据会告诉你他在成长。' },
    { icon:'②', title:'看见过程，不只看结果', desc:'他今天超时专注了30分钟？比他做完口算更值得被看见。说出来：「我看到你今天停不下来，那种感觉很厉害。」' },
    { icon:'③', title:'奖励是承诺，不是筹码', desc:'说好的一定兑现，哪怕他表现不好的那周。奖励不是用来控制行为的，是用来建立信任的。' },
    { icon:'④', title:'允许他失败，允许他懈怠', desc:'连续三天没打卡？正常。不批评，不比较，只是陪他重新开始。坚持的能力，是在无数次重新开始里练出来的。' },
  ],
  parentClosing: '这套系统会记录他的每一步\n但真正让他进步的\n是你看见他的那一刻 💛',

  // ── 写给孩子 ──
  kidTitle: '💌 写给子渊的一封信',
  kidOpening: '亲爱的小英雄，\n\n这个app是爸爸妈妈专门为你做的。\n\n不是因为你做错了什么\n也不是要检查你、管着你\n\n是因为我们想陪你一起\n发现你自己有多厉害',
  kidRules: [
    { icon:'🌅', title:'🌅 早晨英雄包 · 每件+1分，全套完成×2＝6分！',
      desc:'每天早晨有3件事等着你：\n\n👕 自己穿好衣服 → +1分\n🦷 洗脸刷牙 → +1分\n🍳 好好吃早饭 → +1分\n\n✨ 三件全部自己完成 → 分数×2，变成6分！\n💪 不用爸妈提醒，自己想起来的那一分，是最厉害的！' },
    { icon:'🌙', title:'🌙 睡前英雄包 · 每件+1分，全套完成×2＝6分！',
      desc:'每天睡前也有3件事：\n\n🛁 洗澡+洗脸+刷牙 → +1分\n🎒 收拾书包和课本 → +1分\n🌛 9点半前自己上床 → +1分（连续3天额外+3分！）\n\n✨ 三件全部完成 → 分数×2，变成6分！' },
    { icon:'📚', title:'📚 今日作业 · 最高+5分',
      desc:'专心写作业，分数是这样算的：\n\n⏱ 每专注10分钟 → +1分（最多3块=+3分）\n✅ 把今天作业全部写完 → 再加+2分\n\n最高一共 5分！\n越专心，完成越快，分也越高 💡' },
    { icon:'🎯', title:'🎯 专注力时光 · +3分，超级专注再+2分',
      desc:'选一件你喜欢的事：\n积木、拼图、折纸、画画……都可以！\n\n专心做15分钟 → +3分\n停不下来继续做？→ 超级专注徽章 +2分！\n\n总共最高 5分 🏆\n停不下来是最棒的状态，那说明你真的很投入！' },
  ],
  kidOptional: '🎵 口算 · 英语 · 音乐\n\n每做一项 → +2分\n做了就来领分！\n\n不做也完全没关系\n等你某天突然很想做\n那就是最好的时机\n\n兴趣不是逼出来的，是等来的 ⭐',
  kidShopIntro: '每天认真完成任务，积分就会慢慢变多\n存够了就来这里兑换！\n\n🌟 大概怎么攒分？\n每天好好打卡 → 大约+15~20分\n存三天 → 差不多有40~60分\n存一周 → 差不多有100~120分\n\n去找爸爸或妈妈说：「我要兑换！」就可以了！',
  kidShop: [
    { icon:'🎮', name:'游戏+15分钟', cost:40, desc:'存3天左右就够啦！' },
    { icon:'🍭', name:'今晚零食你来选', cost:50, desc:'你说了算，今晚吃什么！' },
    { icon:'🎬', name:'周五电影你来定', cost:65, desc:'这周末看什么，你来定！' },
    { icon:'🎮', name:'游戏+30分钟', cost:80, desc:'双倍游戏时间！' },
    { icon:'✏️', name:'文具盲盒', cost:100, desc:'存一周，开盲盒！' },
    { icon:'🍰', name:'和妈妈吃蛋糕', cost:120, desc:'最大奖励，和妈妈单独约会！' },
  ],
  kidSelf: '每次你自己想起来做\n不用爸爸妈妈提醒\n\n那一分\n比其他任何一分都珍贵\n\n因为那是你自己的力量',
  kidClosing: '你知道吗——\n\n每次你自己想起来穿衣服\n每次你专心做完一件事停不下来\n每次你说「我来！」而不是等人叫你\n\n那一刻，你就已经赢了\n\n积分不是最重要的事\n最重要的是有一天你会发现：\n「原来我能做到。」\n\n那种感觉\n比任何奖励都厉害\n\n爸爸妈妈不是来监督你的\n我们是你的啦啦队\n\n你每往前走一步\n我们都看见了\n\n这一路上，我们一起走。\n\n爱你的爸爸妈妈 💛',
};


// ══════════════════════════════════════════════════════════════
// 英雄品格考核 · 父母发现即记录（非每日打卡，随机出现才有意义）
// ══════════════════════════════════════════════════════════════
const CHARACTER_CHECKS = [
  {
    id: 'cc_honest1',
    category: 'honest',
    categoryName: '🪞 诚实勇敢',
    icon: '🪞',
    name: '主动承认错误',
    desc: '做错了事，自己主动告诉爸妈，没有被追问',
    score: 3,
    praise: '今天子渊主动承认了错误！这需要很大的勇气，诚实是最厉害的品质 💛'
  },
  {
    id: 'cc_honest2',
    category: 'honest',
    categoryName: '🪞 诚实勇敢',
    icon: '💬',
    name: '说了实话',
    desc: '不想做某件事或者做不到，诚实地说出来，没有撒谎或逃避',
    score: 3,
    praise: '今天子渊说了实话！就算说的不是好消息，敢说实话就是英雄 🌟'
  },
  {
    id: 'cc_brave1',
    category: 'brave',
    categoryName: '🦁 勇敢挑战',
    icon: '🦁',
    name: '尝试了一件害怕的事',
    desc: '明明害怕，但还是试了一下（不管结果怎样）',
    score: 4,
    praise: '今天子渊挑战了自己害怕的事！勇气不是不害怕，是害怕了还是去做，了不起 🦁'
  },
  {
    id: 'cc_brave2',
    category: 'brave',
    categoryName: '🦁 勇敢挑战',
    icon: '🙋',
    name: '第一个举手/站出来',
    desc: '在需要人站出来的时候，主动举手或第一个行动',
    score: 3,
    praise: '今天子渊第一个站出来！勇于表达自己，这是真正的英雄气质 ✊'
  },
  {
    id: 'cc_help1',
    category: 'help',
    categoryName: '🤝 乐于助人',
    icon: '🤝',
    name: '主动帮家人做了一件事',
    desc: '没有被要求，自己主动帮爸爸/妈妈/家人做了一件事',
    score: 3,
    praise: '今天子渊主动帮了家人！没有被要求就动手，这就是最暖心的英雄行为 💛'
  },
  {
    id: 'cc_help2',
    category: 'help',
    categoryName: '🤝 乐于助人',
    icon: '🌱',
    name: '帮助了有困难的人',
    desc: '朋友/同学/陌生人遇到困难，主动去帮了他',
    score: 4,
    praise: '今天子渊帮助了需要帮助的人！看见别人的困难并伸出手，这是真正的善良 🌟'
  },
  {
    id: 'cc_help3',
    category: 'help',
    categoryName: '🤝 乐于助人',
    icon: '💪',
    name: '做了一件让别人开心的事',
    desc: '主动做了一件让爸妈/同学/朋友感到高兴的事',
    score: 3,
    praise: '今天子渊让别人开心了！让身边的人感受到温暖，是最珍贵的超能力 💛'
  },
];

// 每周综合评价（父母手写一句话 + 额外加分）
const WEEKLY_PRAISE_SCORE = 5; // 每周评价固定加分
