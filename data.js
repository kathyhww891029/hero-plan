// ══════════════════════════════════════════════════════════════
// 英雄成长计划 · 数据配置
// ══════════════════════════════════════════════════════════════

// ── 每日固定任务 ──────────────────────────────────────────────
const DAILY_FIXED = [
  { id:'df1', icon:'💃', name:'奥特曼律动训练', sub:'身体是最强的武器 💪', score:3, type:'fixed',
    speech:'奥特曼律动训练！跟着音乐动起来，身体是你最强的武器，完成就能得3分！' },
  { id:'df2', icon:'🍽️', name:'补充英雄能量', sub:'好好吃饭，不挑食(shí) 🥦', score:2, type:'fixed',
    speech:'补充英雄能量！好好吃饭，不挑食，英雄需要燃料才能战斗！完成得2分！' },
  { id:'df3', icon:'🎒', name:'出征前的准备', sub:'书包我来搞定 ✅', score:2, type:'fixed',
    speech:'出征前的准备！自己整理书包，出发前的准备我来搞定，完成得2分！' },
  { id:'df4', icon:'💛', name:'今日侠义时刻', sub:'帮家人做一件事 🤝', score:3, type:'fixed',
    speech:'今日侠义时刻！今天帮家人做一件事，哪怕一件小事也算，真正的英雄心里装着别人，完成得3分！' },
  { id:'df5', icon:'🌙', name:'英雄9点半充能', sub:'9点半前主动上床，不用大人催！💤', score:3, type:'fixed',
    tip:'10点上床=0分，9点半上床=+3分，连续3天9点半上床额外+5分！',
    speech:'英雄9点半充能！9点半之前自己主动上床，不用大人催！连续3天还能额外加5分！完成得3分！' },
];

// ── 每日可领取任务 ─────────────────────────────────────────────
const DAILY_OPTIONAL = [
  { id:'do1', icon:'⚡', name:'闪电侠速算训练', sub:'口算做完了，来领分！⚡', score:3, type:'optional',
    tip:'做完口算主动来贴星星，不做不扣分',
    speech:'闪电侠速算训练！口算做完了吗？做完主动来领分，得3分！不做也不扣分，做了就是赚到！' },
  { id:'do2', icon:'🌍', name:'蜘蛛侠秘密武器', sub:'叽里呱啦学完，来领2分！🌍', score:2, type:'optional',
    tip:'学完叽里呱啦来领2分；再用出来一句话额外+3分！',
    speech:'蜘蛛侠秘密武器！叽里呱啦学完了吗？学完得2分！今天学的内容能说出一句话来，再加3分！' },
];

// ── 作业独立计分 ───────────────────────────────────────────────
const DAILY_HOMEWORK = [
  { id:'dh1', icon:'📝', name:'今日任务我搞定', sub:'作业当天完成来领分 📚', score:3, type:'homework',
    speech:'今日任务我搞定！今天的作业当天完成，自己搞定，来领3分！' },
  { id:'dh2', icon:'🏅', name:'英雄自律徽章', sub:'作业完成 + 9点半上床，两个都做到！🌟', score:2, type:'homework',
    tip:'作业+9点半睡觉都做到，才能领这个徽章，奖励自律的英雄！',
    speech:'英雄自律徽章！作业完成加上9点半上床，两个都做到才能领这个特别徽章，奖励最自律的英雄，得2分！' },
];

// ── 任务卡体系 ─────────────────────────────────────────────────
const TASK_CARDS = [
  // 习惯养成系列·敖丙主题
  {
    id:'c1', series:'🌙 习惯养成', theme:'敖丙', color:'#118AB2', lightColor:'#E8F4FD',
    level:1, stars:'⭐',
    name:'敖丙の定力训练',
    sub:'冷静就是力量 💪',
    desc:'一天不磨蹭，按时完成所有事',
    score:5, unlockAt:0, unlocked:true,
    speech:'敖丙の定力训练！今天一整天不磨蹭，所有事情按时完成，就像敖丙一样冷静有力量，完成得5分！'
  },
  {
    id:'c2', series:'🌙 习惯养成', theme:'敖丙', color:'#118AB2', lightColor:'#E8F4FD',
    level:2, stars:'⭐⭐',
    name:'冰莲盾修炼中',
    sub:'连续(xù)三天，盾牌变强！🛡️',
    desc:'连续3天不磨蹭',
    score:8, unlockAt:30, unlocked:false,
    speech:'冰莲盾修炼！连续3天都不磨蹭，坚持下来盾牌就变强了，得8分！需要累计30分才能解锁！'
  },
  {
    id:'c3', series:'🌙 习惯养成', theme:'敖丙', color:'#118AB2', lightColor:'#E8F4FD',
    level:3, stars:'⭐⭐⭐',
    name:'乾坤圈觉醒',
    sub:'一周不磨蹭，乾坤圈出现！✨',
    desc:'一周都不磨蹭',
    score:12, unlockAt:60, unlocked:false,
    speech:'乾坤圈觉醒！整整一周都不磨蹭，传说中的乾坤圈就会觉醒，得12分！需要累计60分解锁！'
  },
  {
    id:'c4', series:'🌙 习惯养成', theme:'敖丙', color:'#118AB2', lightColor:'#E8F4FD',
    level:4, stars:'⭐⭐⭐⭐',
    name:'敖丙·真身降临',
    sub:'自己提醒自己，真正的英雄 👑',
    desc:'自己提醒自己睡觉，不用大人催',
    score:15, unlockAt:100, unlocked:false,
    speech:'敖丙真身降临！自己提醒自己睡觉，不用大人催，这才是真正的英雄！得15分！需要累计100分解锁！'
  },
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
  // 运动挑战系列·奥特曼主题
  {
    id:'c13', series:'💪 运动挑战', theme:'奥特曼', color:'#FF6B35', lightColor:'#FFF0E6',
    level:1, stars:'⭐',
    name:'奥特曼体能训练',
    sub:'记录今天的数字！📊',
    desc:'跳绳打卡，记录今天的数字',
    score:3, unlockAt:0, unlocked:true,
    speech:'奥特曼体能训练！去跳绳，把今天跳了多少个记录下来，每次打卡都是进步，完成得3分！'
  },
  {
    id:'c14', series:'💪 运动挑战', theme:'奥特曼', color:'#FF6B35', lightColor:'#FFF0E6',
    level:2, stars:'⭐⭐',
    name:'奥特曼·光线蓄力',
    sub:'超过130个，光线蓄(xù)满！⚡',
    desc:'跳绳超过130个',
    score:8, unlockAt:30, unlocked:false,
    speech:'奥特曼光线蓄力！跳绳超过130个，光线就蓄满了，得8分！需要30分解锁！加油！'
  },
  {
    id:'c15', series:'💪 运动挑战', theme:'奥特曼', color:'#FF6B35', lightColor:'#FFF0E6',
    level:3, stars:'⭐⭐⭐',
    name:'奥特曼·最终形态',
    sub:'超过170个，进化了！🔥',
    desc:'跳绳超过170个',
    score:12, unlockAt:60, unlocked:false,
    speech:'奥特曼最终形态！跳绳超过170个就能进化，完成得12分！需要60分解锁！你可以的！'
  },
  {
    id:'c16', series:'💪 运动挑战', theme:'奥特曼', color:'#FF6B35', lightColor:'#FFF0E6',
    level:4, stars:'⭐⭐⭐⭐',
    name:'奥特曼·宇宙英雄',
    sub:'200个！宇宙级英雄！🏆',
    desc:'跳绳达到200个',
    score:20, unlockAt:100, unlocked:false,
    speech:'奥特曼宇宙英雄！跳绳达到200个，这是宇宙级别的英雄成就，得20分，还有爸爸的颁奖典礼！需要100分解锁！'
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
];

// ── 奖励商店 ───────────────────────────────────────────────────
const SHOP = [
  {
    type:'🌸 妈妈专区', color:'#EF476F', lightColor:'#FEE8EE',
    items:[
      { id:'mom1', icon:'🍭', name:'今晚我选零食', note:'今晚零食我说了算！', cost:30, speech:'今晚我选零食！花30分，今晚的零食你来选，想吃什么就吃什么！' },
      { id:'mom2', icon:'🎮', name:'和平精英：周末多玩15分钟', note:'周末游戏+15分钟', cost:25, speech:'和平精英周末多玩15分钟！花25分，周末游戏时间加15分钟，好好享受！' },
      { id:'mom3', icon:'🎮🎮', name:'和平精英：周末多玩30分钟', note:'周末游戏+30分钟', cost:45, speech:'和平精英周末多玩30分钟！花45分，周末游戏时间加30分钟，双倍快乐！' },
      { id:'mom4', icon:'🎬', name:'周五电影我选片', note:'这周五选什么我决定！', cost:35, speech:'周五电影我选片！花35分，这周五看什么电影你说了算，想看什么就看什么！' },
      { id:'mom5', icon:'🎂', name:'和妈妈一起吃蛋糕', note:'妈妈陪我一起吃个蛋糕 🍰', cost:80, speech:'和妈妈一起吃蛋糕！花80分，妈妈陪你一起吃一个蛋糕，甜蜜蜜！' },
      { id:'mom6', icon:'🎁', name:'文具盲盒一个', note:'神秘文具盲盒，自己拆！', cost:60, speech:'文具盲盒一个！花60分，神秘文具盲盒由你自己拆，不知道里面是什么，超期待！' },
      { id:'mom7', icon:'🧸', name:'小玩具一个', note:'自己选一个小玩具', cost:90, speech:'小玩具一个！花90分，自己去挑一个喜欢的小玩具，你说了算！' },
      { id:'mom8', icon:'✨', name:'神秘惊喜（妈妈决定）', note:'妈妈给你一个特别的惊喜！', cost:120, speech:'神秘惊喜！花120分，妈妈会给你准备一个特别的惊喜，是什么只有妈妈知道，超期待！' },
    ]
  },
  {
    type:'💪 爸爸专区', color:'#118AB2', lightColor:'#E8F4FD',
    items:[
      { id:'dad1', icon:'💃', name:'爸爸陪我跳舞30分钟', note:'爸爸专属时光！一起跳舞', cost:25, speech:'爸爸陪我跳舞30分钟！花25分，爸爸陪你跳舞整整30分钟，一起动起来！' },
      { id:'dad2', icon:'🏆', name:'爸爸给我办运动颁奖典礼', note:'爸爸准备仪式，表彰运动成就', cost:20, speech:'爸爸给我办运动颁奖典礼！花20分，爸爸专门为你准备颁奖仪式，表彰你的运动成就！' },
      { id:'dad3', icon:'🤸', name:'爸爸陪我学一个新运动动作', note:'爸爸教新动作，学会才算完成', cost:20, speech:'爸爸陪我学新运动动作！花20分，爸爸教你一个新的运动动作，学会了才算完成！' },
      { id:'dad4', icon:'🗺️', name:'爸爸带我去没去过的地方探索', note:'户外探索，爸爸主导！', cost:60, speech:'爸爸带我去没去过的地方探索！花60分，爸爸带你去一个从来没去过的地方大冒险！' },
      { id:'dad5', icon:'🌄', name:'爸爸陪我看日出或日落', note:'一起的安静时光 🌅', cost:45, speech:'爸爸陪我看日出或日落！花45分，爸爸陪你一起看日出或日落，最美的风景要一起看！' },
      { id:'dad6', icon:'🏔️', name:'爸爸带我去爬一座新山', note:'大型户外挑战！需提前计划', cost:80, speech:'爸爸带我去爬新山！花80分，爸爸带你去爬一座没爬过的山，大型户外冒险！' },
      { id:'dad7', icon:'🎬😴', name:'爸爸看完整部电影不睡着', note:'【彩蛋】全程监督爸爸！撑住不睡！', cost:30, isEgg:true, speech:'彩蛋任务！爸爸看完整部电影不能睡着！你负责全程监督，爸爸如果撑住了你得5分！' },
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
  title:'💌 爸爸使用说明',
  principles:[
    { icon:'✅', title:'做了就来领分，不做不扣分', desc:'减少对抗，增加主动性。孩子感受到的是「赚到了」而不是「又被逼了」。' },
    { icon:'✅', title:'和自己比，不和标准比', desc:'今天比昨天好一点就是赢。口算今天比昨天快了1秒，就值得被看见！' },
    { icon:'✅', title:'自主权给孩子', desc:'作业和睡觉的优先级让他自己决定。他学会权衡取舍，才是真正的成长。' },
  ],
  dadZone:'爸爸奖励区是孩子最期待的部分！运动/户外是你的主场，孩子在等你带他去冒险 🏔️',
  weeklyTask:'每周结算时，在任务单底部写一句「看见孩子」的话，不是评价，是陪伴。',
  examples:[
    '「这周你跳绳超过130个了，爸爸看到了！」',
    '「你给我出的那道数学题，爸爸真的答错了！」',
    '「今天你用英语介绍了恐龙，爸爸听懂了一点！」',
  ],
};
