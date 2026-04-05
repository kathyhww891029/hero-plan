// ══════════════════════════════════════════════════════════════
// 英雄成长计划 · 数据配置
// ══════════════════════════════════════════════════════════════

// ── 每日固定任务 ──────────────────────────────────────────────
const DAILY_FIXED = [
  { id:'df1', icon:'💃', name:'奥特曼舞蹈训练', sub:'跟着音乐跳，身体是最强的武器 💪', score:3, type:'fixed',
    tip:'每天跟着音乐跳一段舞，哪怕只有5分钟！\n连续7天：额外+5分🔥\n连续30天：解锁「舞蹈小达人」彩虹徽章⭐\n连续100天：和爸爸一起登台演出🎤',
    speech:'奥特曼舞蹈训练！跟着音乐跳起来，身体是你最强的武器！连续坚持7天还能额外加5分！完成就能得3分！' },
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
  { id:'do3', icon:'🎵', name:'音乐欣赏时光', sub:'认真听一首曲子，说说感受！🎧', score:2, type:'optional', category:'music',
    tip:'闭上眼睛听一首曲子，听完说出你的感受（开心/难过/想跑步……），说了就得分',
    speech:'音乐欣赏时光！闭上眼睛认真听一首曲子，听完说说你的感受，开心还是难过？想跑步还是想睡觉？说出来就得2分！' },
  { id:'do4', icon:'🎨', name:'英雄画册打卡', sub:'今天画了一幅画，来领分！🖌️', score:2, type:'optional', category:'drawing',
    tip:'今天画了任何一幅画（不限内容，不评判好坏），来打卡就得分',
    speech:'英雄画册打卡！今天画了画吗？不管画什么，画了就是小画家，来打卡得2分！你的每幅画都是世界上独一无二的！' },
  { id:'do5', icon:'🎵🎨', name:'音画故事创作', sub:'听音乐画感受，音乐家+画家二合一！✨', score:3, type:'optional', category:'music_art',
    tip:'听一首爸爸演奏或播放的曲子，把听到的感受画出来（颜色/形状/故事都行），画完讲给大家听',
    speech:'音画故事创作！听爸爸演奏一段曲子，把你听到的感受画出来，颜色形状故事都行，完成得3分！音乐家加画家二合一！' },
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
    tip:'🎯 不磨蹭的标准：\n①早上大人叫一次就起床，不赖床\n②吃饭专心吃，不超过20分钟\n③出门前书包自己整理好，一次提醒内完成\n④做作业中间不乱跑、不玩玩具\n⑤9点半前自己主动上床\n全天5件事都做到 = 不磨蹭✅',
    score:5, unlockAt:0, unlocked:true,
    speech:'敖丙の定力训练！今天一整天不磨蹭，所有事情按时完成，就像敖丙一样冷静有力量，完成得5分！'
  },
  {
    id:'c2', series:'🌙 习惯养成', theme:'敖丙', color:'#118AB2', lightColor:'#E8F4FD',
    level:2, stars:'⭐⭐',
    name:'冰莲盾修炼中',
    sub:'连续(xù)三天，盾牌变强！🛡️',
    desc:'连续3天不磨蹭',
    tip:'🎯 不磨蹭的标准（同上，连续3天都做到）：\n①叫一次就起床 ②吃饭不超20分钟\n③书包一提醒就整理 ④作业专心做\n⑤9点半主动上床\n连续3天全做到，冰莲盾变强！🛡️',
    score:8, unlockAt:30, unlocked:false,
    speech:'冰莲盾修炼！连续3天都不磨蹭，坚持下来盾牌就变强了，得8分！需要累计30分才能解锁！'
  },
  {
    id:'c3', series:'🌙 习惯养成', theme:'敖丙', color:'#118AB2', lightColor:'#E8F4FD',
    level:3, stars:'⭐⭐⭐',
    name:'乾坤圈觉醒',
    sub:'一周不磨蹭，乾坤圈出现！✨',
    desc:'一周都不磨蹭',
    tip:'🎯 不磨蹭的标准（连续7天全做到）：\n①叫一次就起床 ②吃饭不超20分钟\n③书包一提醒就整理 ④作业专心做\n⑤9点半主动上床\n整整一周都做到，传说乾坤圈就会觉醒！✨',
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
