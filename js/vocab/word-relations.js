// ========== CET 词汇大师 — 词汇泛化数据 (word-relations.js) ==========
// 词根数据库、形近词/易混词组、词族派生辅助
(function() {
  'use strict';
  const C = window._C;

  // ===================== 词根数据库（110+ 常用英语词根） =====================
  const ROOTS = [
    // ---- A ----
    { root: 'act/ag', meaning: '行动/做', examples: ['action', 'react', 'interact', 'active', 'agent', 'agenda'] },
    { root: 'alt', meaning: '高/其他', examples: ['altitude', 'alter', 'alternative', 'altogether'] },
    { root: 'anim', meaning: '生命/精神', examples: ['animal', 'animate', 'unanimous'] },
    { root: 'anthrop', meaning: '人类', examples: ['anthropology', 'philanthropy'] },
    { root: 'aqu', meaning: '水', examples: ['aquarium', 'aquatic', 'aqueduct'] },
    { root: 'arch', meaning: '统治/首/古', examples: ['monarch', 'architect', 'archive', 'archaic'] },
    { root: 'art', meaning: '技巧/艺术', examples: ['art', 'artist', 'artificial', 'artisan'] },
    { root: 'aud', meaning: '听', examples: ['audience', 'audio', 'auditorium', 'audit'] },
    { root: 'auto', meaning: '自身', examples: ['automatic', 'autonomy', 'autograph'] },
    // ---- B ----
    { root: 'bell', meaning: '战争', examples: ['rebel', 'rebellion', 'belligerent'] },
    { root: 'bene', meaning: '好/善', examples: ['benefit', 'benevolent', 'beneficial'] },
    { root: 'bio', meaning: '生命', examples: ['biology', 'biography', 'antibiotic'] },
    // ---- C ----
    { root: 'cap/capit', meaning: '头', examples: ['capital', 'captain', 'cap', 'decapitate'] },
    { root: 'cap/cept', meaning: '抓/拿/取', examples: ['capture', 'accept', 'capable', 'concept', 'exception'] },
    { root: 'card/cord', meaning: '心', examples: ['cardiac', 'accord', 'discord', 'record'] },
    { root: 'ced/cess', meaning: '走/让步', examples: ['access', 'process', 'succeed', 'precede', 'exceed'] },
    { root: 'chron', meaning: '时间', examples: ['chronic', 'chronology', 'synchronize'] },
    { root: 'cide/cis', meaning: '切/杀', examples: ['decide', 'precise', 'suicide', 'concise', 'scissors'] },
    { root: 'circ/circum', meaning: '圆/周围', examples: ['circle', 'circulate', 'circumstance'] },
    { root: 'clar', meaning: '清楚/明白', examples: ['clarify', 'declare', 'clarity'] },
    { root: 'claim/clam', meaning: '喊/呼', examples: ['claim', 'exclaim', 'proclaim', 'clamor'] },
    { root: 'clud/clos', meaning: '关闭', examples: ['include', 'exclude', 'conclude', 'close', 'disclose'] },
    { root: 'cogn/gnos', meaning: '知/识', examples: ['recognize', 'cognitive', 'diagnose', 'ignore'] },
    { root: 'corp', meaning: '身体', examples: ['corpse', 'corporation', 'incorporate'] },
    { root: 'cred', meaning: '相信', examples: ['credit', 'incredible', 'credential', 'credible'] },
    { root: 'crit', meaning: '判断/区分', examples: ['critic', 'critical', 'criterion'] },
    { root: 'cur/curs', meaning: '跑/发生', examples: ['occur', 'current', 'curriculum', 'excursion', 'cursor'] },
    // ---- D ----
    { root: 'dem', meaning: '人民', examples: ['democracy', 'demographic', 'epidemic'] },
    { root: 'dict', meaning: '说/宣称', examples: ['predict', 'dictionary', 'contradict', 'indicate', 'dedicate'] },
    { root: 'doc/dox', meaning: '教/想法', examples: ['doctrine', 'document', 'orthodox', 'paradox'] },
    { root: 'don/dot', meaning: '给', examples: ['donate', 'pardon', 'anecdote', 'antidote'] },
    { root: 'duct', meaning: '引导', examples: ['conduct', 'produce', 'reduce', 'introduce', 'deduce'] },
    // ---- E ----
    { root: 'equ', meaning: '相等', examples: ['equal', 'equation', 'equivalent', 'adequate'] },
    // ---- F ----
    { root: 'fac/fact/fect/fic', meaning: '做/制造', examples: ['factory', 'manufacture', 'factor', 'effect', 'efficient', 'fiction'] },
    { root: 'fer', meaning: '带来/承载', examples: ['transfer', 'offer', 'differ', 'prefer', 'reference'] },
    { root: 'fid', meaning: '信任', examples: ['confide', 'fidelity', 'confident'] },
    { root: 'fin', meaning: '结束/限制', examples: ['final', 'finish', 'define', 'infinite', 'confine'] },
    { root: 'flect/flex', meaning: '弯曲', examples: ['reflect', 'flexible', 'deflect', 'inflection'] },
    { root: 'flu', meaning: '流', examples: ['fluent', 'influence', 'fluid', 'fluctuate', 'affluent'] },
    { root: 'form', meaning: '形状/形成', examples: ['reform', 'inform', 'perform', 'transform', 'uniform'] },
    { root: 'fort', meaning: '强/力', examples: ['fort', 'fortify', 'effort', 'comfort'] },
    { root: 'frag/fract', meaning: '碎/折', examples: ['fragment', 'fraction', 'fragile', 'infraction'] },
    // ---- G ----
    { root: 'gen', meaning: '产生/种类', examples: ['generate', 'general', 'generous', 'generation', 'gender'] },
    { root: 'geo', meaning: '地球/土地', examples: ['geography', 'geology', 'geometry'] },
    { root: 'grad/gress', meaning: '步/走/级', examples: ['progress', 'graduate', 'aggressive', 'congress', 'gradual'] },
    { root: 'graph/gram', meaning: '写/画/记录', examples: ['photograph', 'program', 'grammar', 'diagram', 'telegraph'] },
    { root: 'grat', meaning: '感谢/愉悦', examples: ['gratitude', 'grateful', 'congratulate'] },
    // ---- H ----
    { root: 'habit', meaning: '居住/习惯', examples: ['habit', 'inhabit', 'habitat'] },
    { root: 'hum', meaning: '人/地面', examples: ['human', 'humble', 'humility'] },
    { root: 'hydr', meaning: '水', examples: ['hydrogen', 'dehydrate', 'hydraulic'] },
    // ---- J ----
    { root: 'ject', meaning: '投/扔', examples: ['project', 'reject', 'inject', 'object', 'subject'] },
    { root: 'jud/jur/jus', meaning: '法/判', examples: ['judge', 'jury', 'justice', 'prejudice'] },
    { root: 'junct', meaning: '连接', examples: ['junction', 'conjunction', 'disjunct'] },
    // ---- L ----
    { root: 'lab', meaning: '工作', examples: ['labor', 'laboratory', 'collaborate', 'elaborate'] },
    { root: 'lect/leg', meaning: '选/收/读', examples: ['select', 'collect', 'elect', 'legible', 'legend'] },
    { root: 'lev', meaning: '举起/轻', examples: ['level', 'relevant', 'elevate', 'relieve', 'leverage'] },
    { root: 'liber', meaning: '自由', examples: ['liberty', 'liberate', 'liberal'] },
    { root: 'log/logue', meaning: '语言/学说', examples: ['dialogue', 'catalog', 'apology', 'technology', 'psychology'] },
    { root: 'loqu/locu', meaning: '说', examples: ['eloquent', 'colloquial', 'locution'] },
    { root: 'luc/lum', meaning: '光', examples: ['illustrate', 'volume', 'luminous', 'illuminate', 'lucid'] },
    // ---- M ----
    { root: 'magn', meaning: '大', examples: ['magnify', 'magnificent', 'magnitude'] },
    { root: 'man/manu', meaning: '手', examples: ['manual', 'manage', 'manufacture', 'manipulate', 'manuscript'] },
    { root: 'mand/mend', meaning: '命令/委托', examples: ['command', 'demand', 'recommend'] },
    { root: 'mar/mari', meaning: '海', examples: ['marine', 'maritime', 'submarine'] },
    { root: 'matr/mater', meaning: '母亲', examples: ['maternal', 'matrimony', 'material'] },
    { root: 'mem', meaning: '记忆', examples: ['memory', 'remember', 'commemorate'] },
    { root: 'ment', meaning: '心/思考', examples: ['mental', 'comment', 'mention', 'moment'] },
    { root: 'merg/mers', meaning: '沉/浸', examples: ['emerge', 'merge', 'immerse', 'submerge'] },
    { root: 'meter/metr', meaning: '测量', examples: ['meter', 'thermometer', 'symmetry', 'diameter'] },
    { root: 'min', meaning: '小/突出', examples: ['minimum', 'diminish', 'minor', 'minute'] },
    { root: 'mit/miss', meaning: '送/发', examples: ['commit', 'submit', 'permit', 'mission', 'dismiss'] },
    { root: 'mod', meaning: '方式/限度', examples: ['mode', 'model', 'modify', 'moderate', 'modern'] },
    { root: 'mort', meaning: '死', examples: ['mortal', 'immortal', 'mortgage'] },
    { root: 'mov/mot', meaning: '移动', examples: ['remove', 'motion', 'promote', 'motivate', 'emotion'] },
    { root: 'mut', meaning: '改变', examples: ['mutate', 'commute', 'mutual'] },
    // ---- N ----
    { root: 'nat/nasc', meaning: '出生/天生', examples: ['nature', 'nation', 'native', 'natural', 'nascent'] },
    { root: 'neg', meaning: '否定/拒绝', examples: ['negative', 'neglect', 'negotiate'] },
    { root: 'norm', meaning: '规范/标准', examples: ['normal', 'enormous', 'abnormal', 'norm'] },
    { root: 'nov', meaning: '新', examples: ['novel', 'innovate', 'renovate', 'novelty'] },
    { root: 'numer', meaning: '数', examples: ['number', 'numerous', 'numeric', 'enumerate'] },
    // ---- O ----
    { root: 'omni', meaning: '全部', examples: ['omnipotent', 'omniscient'] },
    { root: 'oper', meaning: '工作', examples: ['operate', 'cooperate', 'opera'] },
    // ---- P ----
    { root: 'par', meaning: '相等/准备', examples: ['parity', 'compare', 'prepare', 'apparent'] },
    { root: 'part', meaning: '部分', examples: ['part', 'partial', 'participate', 'depart'] },
    { root: 'pass/path', meaning: '感情/痛苦', examples: ['passion', 'sympathy', 'pathetic', 'empathy', 'apathy', 'compassion'] },
    { root: 'patr/pater', meaning: '父亲', examples: ['patriot', 'paternal', 'patron'] },
    { root: 'ped/pod', meaning: '脚', examples: ['pedestrian', 'expedition', 'pedal'] },
    { root: 'pel/puls', meaning: '推/驱', examples: ['compel', 'expel', 'propel', 'impulse', 'repulse'] },
    { root: 'pend/pens', meaning: '悬挂/花费/称量', examples: ['depend', 'independent', 'suspend', 'expense', 'compensate'] },
    { root: 'phil', meaning: '爱', examples: ['philosophy', 'philharmonic'] },
    { root: 'phon', meaning: '声音', examples: ['phone', 'symphony', 'megaphone'] },
    { root: 'plic/plex/ply', meaning: '折叠/重叠', examples: ['apply', 'imply', 'complicate', 'explicit', 'reply', 'complex'] },
    { root: 'pop/publ', meaning: '人民', examples: ['popular', 'population', 'public', 'publish'] },
    { root: 'port', meaning: '携带/搬运', examples: ['transport', 'export', 'import', 'report', 'support'] },
    { root: 'pos/pon', meaning: '放置', examples: ['position', 'compose', 'oppose', 'postpone', 'propose'] },
    { root: 'press', meaning: '压', examples: ['express', 'impress', 'compress', 'depress', 'pressure'] },
    { root: 'prim/prin', meaning: '首/先', examples: ['primary', 'principal', 'primitive', 'principle'] },
    { root: 'priv', meaning: '个人/剥夺', examples: ['private', 'privilege', 'deprive'] },
    { root: 'prob/prov', meaning: '证明/试验', examples: ['prove', 'probable', 'approve', 'proof'] },
    { root: 'psych', meaning: '心理/精神', examples: ['psychology', 'psyche'] },
    { root: 'pur', meaning: '纯/净化', examples: ['pure', 'purify', 'purity'] },
    // ---- Q ----
    { root: 'quer/quir/quest', meaning: '寻求/询问', examples: ['inquire', 'request', 'question', 'inquiry', 'conquer'] },
    // ---- R ----
    { root: 'radi', meaning: '光线/辐射', examples: ['radio', 'radiation', 'radical', 'radius'] },
    { root: 'reg', meaning: '规则/统治', examples: ['region', 'regular', 'regulate', 'register'] },
    { root: 'rupt', meaning: '破裂', examples: ['interrupt', 'corrupt', 'bankrupt', 'erupt', 'disrupt'] },
    // ---- S ----
    { root: 'sci', meaning: '知道', examples: ['science', 'conscious', 'conscience'] },
    { root: 'scrib/script', meaning: '写', examples: ['describe', 'subscribe', 'prescribe', 'manuscript', 'script'] },
    { root: 'sens/sent', meaning: '感觉', examples: ['sense', 'sensitive', 'sentence', 'consent', 'sentiment'] },
    { root: 'sequ/secut', meaning: '跟随', examples: ['sequence', 'consequence', 'execute', 'subsequent', 'pursue'] },
    { root: 'serv', meaning: '保留/服务', examples: ['serve', 'service', 'preserve', 'reserve', 'observe'] },
    { root: 'sign', meaning: '标记/信号', examples: ['signal', 'design', 'significant', 'assign', 'resign'] },
    { root: 'simil/simul', meaning: '相似/相同', examples: ['similar', 'simulate', 'simultaneous', 'assimilate'] },
    { root: 'sist/sta/stat', meaning: '站立/稳定', examples: ['consist', 'resist', 'insist', 'persist', 'assist', 'stable', 'state', 'status'] },
    { root: 'soc', meaning: '同伴/社会', examples: ['social', 'society', 'associate'] },
    { root: 'sol', meaning: '单独/太阳', examples: ['solve', 'solution', 'solar', 'isolate', 'absolute'] },
    { root: 'son', meaning: '声音', examples: ['sonic', 'resonate', 'consonant'] },
    { root: 'soph', meaning: '智慧', examples: ['philosophy', 'sophisticated', 'sophomore'] },
    { root: 'spect/spec', meaning: '看', examples: ['inspect', 'respect', 'expect', 'suspect', 'prospect', 'spectacle'] },
    { root: 'spir', meaning: '呼吸/精神', examples: ['inspire', 'expire', 'respiration', 'spirit'] },
    { root: 'struct', meaning: '建造', examples: ['structure', 'construct', 'instruct', 'destroy', 'infrastructure'] },
    // ---- T ----
    { root: 'tact/tang', meaning: '接触', examples: ['contact', 'intact', 'tangible', 'tactile'] },
    { root: 'tain/ten/tin', meaning: '握/持', examples: ['contain', 'maintain', 'sustain', 'retain', 'continue', 'tenant'] },
    { root: 'tect', meaning: '覆盖/掩护', examples: ['protect', 'detect', 'architect'] },
    { root: 'temp', meaning: '时间/时期', examples: ['temporary', 'contemporary', 'temperature', 'tempo'] },
    { root: 'tend/tens', meaning: '伸展/趋向', examples: ['extend', 'attend', 'intend', 'intense', 'tendency'] },
    { root: 'terr', meaning: '地/土地', examples: ['territory', 'terrain', 'terrace', 'Mediterranean'] },
    { root: 'test', meaning: '证明/见证', examples: ['test', 'testify', 'testimony', 'contest', 'protest'] },
    { root: 'tract', meaning: '拉/拖', examples: ['attract', 'contract', 'extract', 'abstract', 'distract'] },
    { root: 'trib', meaning: '给予', examples: ['contribute', 'distribute', 'attribute', 'tribute'] },
    // ---- U ----
    { root: 'urb', meaning: '城市', examples: ['urban', 'suburb', 'urbane'] },
    { root: 'uti/util', meaning: '使用/有用', examples: ['utility', 'utilize', 'futile'] },
    // ---- V ----
    { root: 'vac/van', meaning: '空', examples: ['vacant', 'vacuum', 'vain', 'vanish', 'evacuate'] },
    { root: 'val/vail', meaning: '强/价值', examples: ['value', 'valid', 'evaluate', 'available', 'prevail'] },
    { root: 'vari', meaning: '变化', examples: ['various', 'vary', 'variety', 'variable', 'variation'] },
    { root: 'ven/vent', meaning: '来', examples: ['advent', 'event', 'invent', 'prevent', 'convene'] },
    { root: 'ver', meaning: '真实', examples: ['verify', 'verdict', 'aver', 'veracity'] },
    { root: 'vert/vers', meaning: '转', examples: ['convert', 'reverse', 'diverse', 'universe', 'advertise'] },
    { root: 'vid/vis', meaning: '看', examples: ['visible', 'vision', 'visual', 'evidence', 'provide'] },
    { root: 'vinc/vict', meaning: '征服', examples: ['victory', 'convince', 'evict'] },
    { root: 'viv/vit', meaning: '生命/活', examples: ['survive', 'vivid', 'vital', 'revive', 'vitamin'] },
    { root: 'voc/vok', meaning: '声音/叫', examples: ['vocabulary', 'advocate', 'provoke', 'invoke', 'vocal'] },
    { root: 'vol', meaning: '意愿', examples: ['volunteer', 'voluntary', 'malevolent'] },
    { root: 'volv/volut', meaning: '滚/转', examples: ['evolve', 'revolve', 'involve', 'revolution'] }
  ];

  // ===================== 形近词 / 易混词组（30+ 组） =====================
  const CONFUSABLES = [
    // ---- A ----
    { words: ['accept', 'except'], tip: 'accept(接受) vs except(除了)' },
    { words: ['access', 'assess'], tip: 'access(进入/获取) vs assess(评估)' },
    { words: ['adapt', 'adopt', 'adept'], tip: 'adapt(适应) vs adopt(收养/采纳) vs adept(熟练的)' },
    { words: ['advice', 'advise'], tip: 'advice(名词：建议) vs advise(动词：建议)' },
    { words: ['affect', 'effect'], tip: 'affect(动词：影响) vs effect(名词：效果；动词：实现)' },
    { words: ['assure', 'ensure', 'insure'], tip: 'assure(向某人保证) vs ensure(确保) vs insure(投保)' },
    // ---- B ----
    { words: ['beside', 'besides'], tip: 'beside(在…旁边) vs besides(此外/除…之外)' },
    // ---- C ----
    { words: ['complement', 'compliment'], tip: 'complement(补充/补足) vs compliment(赞美/恭维)' },
    { words: ['conscience', 'conscious'], tip: 'conscience(良心) vs conscious(有意识的)' },
    { words: ['considerable', 'considerate'], tip: 'considerable(相当大的) vs considerate(体贴的)' },
    { words: ['continual', 'continuous'], tip: 'continual(频繁的/反复的) vs continuous(连续不断的)' },
    { words: ['council', 'counsel'], tip: 'council(委员会) vs counsel(建议/法律顾问)' },
    // ---- D ----
    { words: ['desert', 'dessert'], tip: 'desert(沙漠/抛弃) vs dessert(甜点) — 甜点更甜所以多一个s' },
    // ---- E ----
    { words: ['economic', 'economical'], tip: 'economic(经济的/经济学的) vs economical(节约的/省钱的)' },
    { words: ['emigrate', 'immigrate'], tip: 'emigrate(移出/移居国外) vs immigrate(移入/移居到)' },
    { words: ['eminent', 'imminent'], tip: 'eminent(杰出的/显赫的) vs imminent(即将发生的/迫近的)' },
    { words: ['exhausting', 'exhaustive'], tip: 'exhausting(令人筋疲力尽的) vs exhaustive(详尽的/彻底的)' },
    // ---- F ----
    { words: ['farther', 'further'], tip: 'farther(更远-物理距离) vs further(更进一步-抽象程度)' },
    // ---- H ----
    { words: ['historic', 'historical'], tip: 'historic(历史性的/有重大意义的) vs historical(历史上的/与历史有关的)' },
    // ---- I ----
    { words: ['industrial', 'industrious'], tip: 'industrial(工业的) vs industrious(勤劳的)' },
    // ---- L ----
    { words: ['lay', 'lie'], tip: 'lay(放置，及物 lay-laid-laid) vs lie(躺/说谎，不及物 lie-lay-lain)' },
    { words: ['literal', 'literary', 'literate'], tip: 'literal(字面的) vs literary(文学的) vs literate(有读写能力的)' },
    { words: ['loose', 'lose'], tip: 'loose(松的/adj.) vs lose(丢失/v.) — loose念"路斯"，lose念"路兹"' },
    // ---- P ----
    { words: ['personal', 'personnel'], tip: 'personal(个人的) vs personnel(全体人员/人事部门)' },
    { words: ['precede', 'proceed'], tip: 'precede(在…之前) vs proceed(继续进行)' },
    { words: ['principal', 'principle'], tip: 'principal(主要的/校长) vs principle(原则/原理) — 校长是你的pal' },
    // ---- Q ----
    { words: ['quiet', 'quite', 'quit'], tip: 'quiet(安静的) vs quite(相当) vs quit(放弃/辞职)' },
    // ---- R ----
    { words: ['respectful', 'respective', 'respectable'], tip: 'respectful(恭敬的) vs respective(各自的) vs respectable(值得尊敬的)' },
    { words: ['rise', 'raise', 'arise'], tip: 'rise(升起-不及物) vs raise(举起/抚养-及物) vs arise(出现/产生-不及物)' },
    // ---- S ----
    { words: ['sensible', 'sensitive'], tip: 'sensible(明智的/合理的) vs sensitive(敏感的/灵敏的)' },
    { words: ['stationary', 'stationery'], tip: 'stationary(静止的) vs stationery(文具) — 文具里有pen所以是e' },
    // ---- T ----
    { words: ['through', 'thorough', 'though', 'thought'], tip: 'through(穿过) vs thorough(彻底的) vs though(虽然) vs thought(想法)' },
    // ---- W ----
    { words: ['weather', 'whether'], tip: 'weather(天气) vs whether(是否)' },
    { words: ['where', 'wear'], tip: 'where(哪里) vs wear(穿/磨损)' },
    // ---- 额外补充高频易混 ----
    { words: ['compile', 'comply'], tip: 'compile(编纂/汇编) vs comply(遵从/服从)' },
    { words: ['confirm', 'conform'], tip: 'confirm(确认/证实) vs conform(遵守/顺从)' },
    { words: ['contact', 'contract', 'contrast'], tip: 'contact(联系) vs contract(合同/收缩) vs contrast(对比/对照)' },
    { words: ['discover', 'recover', 'uncover'], tip: 'discover(发现) vs recover(恢复) vs uncover(揭露)' },
    { words: ['extent', 'extant', 'extinct'], tip: 'extent(程度/范围) vs extant(现存的) vs extinct(灭绝的)' },
    { words: ['imagine', 'image', 'imagery'], tip: 'imagine(想象v.) vs image(图像n.) vs imagery(意象/比喻)' },
    // ---- 又一批高频近形词 ----
    { words: ['little', 'litter', 'litre', 'letter'], tip: 'little(小的) vs litter(垃圾/一窝幼崽) vs litre(升) vs letter(信/字母)' },
    { words: ['quite', 'quiet', 'quit', 'quilt'], tip: 'quite(相当) vs quiet(安静的) vs quit(放弃) vs quilt(被子)' },
    { words: ['expand', 'expend', 'expense'], tip: 'expand(扩展) vs expend(花费) vs expense(费用)' },
    { words: ['adapt', 'adopt', 'adept', 'adept'], tip: 'adapt(适应) vs adopt(收养/采纳) vs adept(熟练的)' },
    { words: ['quarter', 'quart', 'quartz'], tip: 'quarter(四分之一) vs quart(夸脱) vs quartz(石英)' },
    { words: ['site', 'sight', 'cite'], tip: 'site(地点) vs sight(视力/景象) vs cite(引用)' },
    { words: ['pour', 'poor', 'pore', 'pour'], tip: 'pour(倾倒) vs poor(贫穷的) vs pore(毛孔/凝视)' },
    { words: ['stare', 'star', 'stair', 'stale'], tip: 'stare(凝视) vs star(星星) vs stair(楼梯) vs stale(陈腐的)' },
    { words: ['envelope', 'envelop', 'develop'], tip: 'envelope(信封 n.) vs envelop(包裹 v.) vs develop(发展)' },
    { words: ['device', 'devise', 'divide'], tip: 'device(设备 n.) vs devise(设计 v.) vs divide(分开)' },
    { words: ['raise', 'rise', 'arise', 'arouse'], tip: 'raise(举起 vt.) vs rise(升起 vi.) vs arise(产生 vi.) vs arouse(唤醒)' },
    { words: ['adjust', 'adopt', 'adjourn'], tip: 'adjust(调整) vs adopt(采纳) vs adjourn(休会)' },
    { words: ['allusion', 'illusion', 'elusion'], tip: 'allusion(暗指) vs illusion(幻觉) vs elusion(逃避)' },
    { words: ['flesh', 'fresh', 'flash'], tip: 'flesh(肉) vs fresh(新鲜的) vs flash(闪光)' },
    { words: ['through', 'thorough', 'tough', 'though', 'thought'], tip: 'through(穿过) vs thorough(彻底) vs tough(坚韧) vs though(虽然) vs thought(想法)' },
    { words: ['vacation', 'vocation', 'vacant', 'vacuum'], tip: 'vacation(假期) vs vocation(职业/天职) vs vacant(空闲的) vs vacuum(真空)' },
    { words: ['stationary', 'stationery', 'station'], tip: 'stationary(静止的-adj.) vs stationery(文具-n.) vs station(车站)' },
    { words: ['propose', 'purpose', 'suppose', 'oppose'], tip: 'propose(提议) vs purpose(目的) vs suppose(假设) vs oppose(反对)' },
    { words: ['steal', 'steel', 'still'], tip: 'steal(偷) vs steel(钢) vs still(仍然/静止的)' },
    { words: ['breath', 'breathe', 'breeze'], tip: 'breath(呼吸 n.) vs breathe(呼吸 v.) vs breeze(微风)' },
    { words: ['accept', 'except', 'expect', 'aspect'], tip: 'accept(接受) vs except(除了) vs expect(期待) vs aspect(方面)' },
    { words: ['attain', 'obtain', 'maintain', 'sustain'], tip: 'attain(达到) vs obtain(获得) vs maintain(维持) vs sustain(维持/支撑)' },
    { words: ['suspect', 'suspend', 'suspense'], tip: 'suspect(怀疑) vs suspend(暂停/悬挂) vs suspense(悬念)' },
    { words: ['immortal', 'immoral'], tip: 'immortal(不朽的) vs immoral(不道德的)' },
    { words: ['altar', 'alter'], tip: 'altar(祭坛) vs alter(改变)' },
    { words: ['contend', 'content', 'context'], tip: 'contend(竞争/主张) vs content(内容/满足的) vs context(上下文)' },
    { words: ['ingenious', 'ingenuous'], tip: 'ingenious(精巧的/天才的) vs ingenuous(纯真的/天真的)' },
    { words: ['decent', 'descent', 'dissent'], tip: 'decent(体面的) vs descent(下降/血统) vs dissent(异议)' },
    { words: ['averse', 'adverse'], tip: 'averse(反感的) vs adverse(不利的)' },
    { words: ['envelope', 'develop', 'envelop'], tip: 'envelope(信封) vs develop(发展) vs envelop(包围)' }
  ];

  // ===================== 算法补充：通过编辑距离寻找近形词（4-5 个）======================

  // 简易 Levenshtein 距离（限长，性能可控）
  function _edit(a, b) {
    if (a === b) return 0;
    const la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 3) return 999; // 长度差太大不算近形
    if (la === 0) return lb;
    if (lb === 0) return la;
    const dp = [];
    for (let i = 0; i <= la; i++) {
      dp[i] = [i];
      for (let j = 1; j <= lb; j++) {
        if (i === 0) { dp[0][j] = j; continue; }
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
    }
    return dp[la][lb];
  }

  // 从全词表中找出与给定单词拼写最相近的 n 个（默认 4 个），
  // 排除自身、过长/过短差距，并要求至少 2 个字符相同
  function findSimilarSpellings(word, allWords, n) {
    if (n == null) n = 4;
    const w = word.toLowerCase();
    if (!allWords || allWords.length === 0) return [];
    const candidates = [];
    for (const item of allWords) {
      const x = item.word ? item.word.toLowerCase() : '';
      if (!x || x === w) continue;
      // 长度差控制
      if (Math.abs(x.length - w.length) > 2) continue;
      const d = _edit(w, x);
      if (d > 2 || d === 0) continue;
      // 首字母最好一致或差一位（避免完全无关的）
      if (x[0] !== w[0] && w.length >= 4) continue;
      candidates.push({ word: item, dist: d });
    }
    candidates.sort((a, b) => a.dist - b.dist);
    // 取前 n，去重
    return candidates.slice(0, n).map(c => c.word);
  }

  // ===================== 词族派生辅助方法 =====================

  /**
   * 根据一个单词查找其所属词根
   * @param {string} word - 要查找的单词
   * @returns {Array} 匹配到的词根对象数组
   */
  function findRoots(word) {
    const w = word.toLowerCase();
    return ROOTS.filter(r => {
      const roots = r.root.split('/');
      return roots.some(rt => w.includes(rt));
    });
  }

  /**
   * 根据词根获取同族单词
   * @param {string} rootStr - 词根字符串（如 'duct' 或 'vis/vid'）
   * @returns {Object|null} 匹配到的词根对象，包含 examples
   */
  function getWordFamily(rootStr) {
    const target = rootStr.toLowerCase();
    return ROOTS.find(r => {
      const roots = r.root.split('/');
      return roots.some(rt => rt === target);
    }) || null;
  }

  /**
   * 查找某个单词的形近词/易混词
   * @param {string} word - 要查找的单词
   * @returns {Array} 包含该单词的易混词组数组
   */
  function findConfusables(word) {
    const w = word.toLowerCase();
    return CONFUSABLES.filter(g => g.words.some(cw => cw === w));
  }

  // ===================== 注册到共享对象 =====================
  C.ROOTS = ROOTS;
  C.CONFUSABLES = CONFUSABLES;
  C.findRoots = findRoots;
  C.getWordFamily = getWordFamily;
  C.findConfusables = findConfusables;
  C.findSimilarSpellings = findSimilarSpellings;
})();
