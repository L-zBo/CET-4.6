// ========== 人工精修助记（Phase B） ==========
// 每个词 3 条不同角度：词根拆解 / 谐音联想 / 场景印象
// 出现在这里的词会**完全替代**算法自动生成的 generateMnemonicList 结果
// 没在这里的词仍走 word-detail.js 的 generateMnemonicList 算法兜底

window.WORD_MNEMONICS = {
  // === 第 1 批：100 个 CET4 最高频核心词 ===
  'abandon': [
    '🔬 a-（加强）+ bandon（控制/禁令）→ 完全失去控制 = 放弃、抛弃',
    '🎵 谐音"啊，邦顿"：一邦的人顿时全跑了 → 抛弃',
    '📖 沉船时船长喊 "Abandon ship!"（弃船！）'
  ],
  'ability': [
    '🔬 able（能够）+ -ity（名词性质后缀）= 能够之事 = 能力',
    '🎵 谐音"啊比利"：阿比利他啥都能干 → 才能',
    '📖 He has the ability to solve problems. 能力是名词形式'
  ],
  'absorb': [
    '🔬 ab-（向）+ sorb（吸取）= 全部吸进来 = 吸收',
    '🎵 谐音"爱不死哦不"：爱得停不下，全部吸进心里',
    '📖 海绵 absorb 水；好学生 absorb 知识'
  ],
  'abstract': [
    '🔬 abs-（脱离）+ tract（拉）= 从具体中抽出来 = 抽象的；摘要',
    '🎵 谐音"爱不死锤特"：太抽象了爱不死也锤不透',
    '📖 论文开头那段 abstract 就是从全文"抽离"出来的精华'
  ],
  'abuse': [
    '🔬 ab-（偏离）+ use（使用）= 用偏了 = 滥用、虐待',
    '🎵 谐音"啊不死"：被虐待得啊还不死 → 虐待',
    '📖 child abuse 虐童；drug abuse 滥用药物'
  ],
  'academic': [
    '🔬 academy（学院）+ -ic（…的）= 学院的、学术的',
    '🎵 谐音"啊咳呆秘客"：学术圈的人都是呆秘客',
    '📖 academic year = 学年；与"实用"对立的学术性词汇'
  ],
  'academy': [
    '🔬 源自希腊 Akademia（柏拉图办学的园林）= 学院',
    '🎵 谐音"啊咳呆秘"：学院里都是呆呆的秘书在咳嗽',
    '📖 奥斯卡 Academy Awards 颁奖典礼那个 Academy'
  ],
  'access': [
    '🔬 ac-（向）+ cess（走）= 走过去 = 进入、通路',
    '🎵 谐音"爱可赛事"：爱去任何赛事 → 入场权',
    '📖 have access to 有权使用；无障碍 accessibility'
  ],
  'accomplish': [
    '🔬 ac-（去）+ complish（完成 complete）= 圆满完成 = 完成、达成',
    '🎵 谐音"啊砍婆栗师"：砍完所有任务的婆栗师 → 达成',
    '📖 accomplishment 成就；与 finish 比强调"圆满+成果"'
  ],
  'account': [
    '🔬 ac-（向）+ count（数）= 一笔一笔数 = 账户、解释',
    '🎵 谐音"啊靠你他"：他靠账户他过日子',
    '📖 bank account 账户；account for 解释/占据；on account of 因为'
  ],
  'accurate': [
    '🔬 ac-（朝）+ cur(care 关心)+ -ate = 用心做的 = 精确的',
    '🎵 谐音"啊克瑞特"：精确克到了瑞士手表那种特等水准',
    '📖 反义 inaccurate；近义 precise、exact'
  ],
  'achieve': [
    '🔬 a-（去）+ chieve（头 chief）= 到达顶点 = 达成、获得',
    '🎵 谐音"啊吃伊呋"：吃到那个一份属于自己的成果',
    '📖 achievement 成就；achieve a goal 达成目标'
  ],
  'acquire': [
    '🔬 ac-（向）+ quire（寻求 quest）= 朝着想要的去要 = 获得',
    '🎵 谐音"啊快爱呃"：快得到自己想爱的 → 获得',
    '📖 acquire knowledge 获取知识；与 get 比更书面、强调主动'
  ],
  'adapt': [
    '🔬 ad-（朝）+ apt（适合）= 朝适合方向调整 = 适应、改编',
    '🎵 谐音"啊得了"：得了，我适应了',
    '📖 adapt to 适应；电影 is adapted from 改编自；勿与 adopt 混淆'
  ],
  'adopt': [
    '🔬 ad-（朝）+ opt（选择 option）= 主动选过来 = 采纳、收养',
    '🎵 谐音"啊到普特"：到普特家收养这孩子',
    '📖 adopt a child 收养；adopt a policy 采纳政策；区分于 adapt'
  ],
  'advance': [
    '🔬 ad-（朝前）+ vance（vant 前面）= 向前 = 前进、提前',
    '🎵 谐音"额万词"：背一万词的提前进步',
    '📖 in advance 提前；advanced 先进的'
  ],
  'advantage': [
    '🔬 advance（向前）+ -age = 走在前面的位置 = 优势、好处',
    '🎵 谐音"额万腾基"：万倍腾跃的基础 → 优势',
    '📖 take advantage of 利用；反义 disadvantage'
  ],
  'affect': [
    '🔬 af-（向）+ fect（做 fact）= 对…作用 = 影响（动词）',
    '🎵 谐音"啊负客特"：负面影响了客人 → 影响',
    '📖 与 effect 死敌：affect 是动词；effect 是名词'
  ],
  'afford': [
    '🔬 af-（去）+ ford（向前推进 forth）= 推进得起 = 负担得起',
    '🎵 谐音"啊负的"：负担得起的',
    '📖 常用 "can\'t afford" 买不起；afford to do 能承担做某事'
  ],
  'agent': [
    '🔬 ag（做 act）+ -ent（人）= 做事的人 = 代理人、特工',
    '🎵 谐音"诶真特"：诶这特工是真特别',
    '📖 secret agent 特工；travel agent 旅行社；agency 代理机构'
  ],
  'aggressive': [
    '🔬 ag-（朝）+ gress（走）+ -ive = 走过去攻击 = 好斗的、积极的',
    '🎵 谐音"啊哥锐谁服"：阿哥锐气逼人谁都得服',
    '📖 双义：贬义"挑衅"+褒义"进取"；aggressive marketing 强势营销'
  ],
  'analysis': [
    '🔬 ana-（分开）+ lysis（松解）= 拆开来看 = 分析',
    '🎵 谐音"啊那勒星思"：星象家把信息那样勒开思考',
    '📖 复数 analyses；动词 analyze；与 synthesis（综合）相对'
  ],
  'ancient': [
    '🔬 anc-（前）+ -ient = 在很久前的 = 古老的',
    '🎵 谐音"安神特"：安神特别古老的方子',
    '📖 ancient Greek 古希腊；与 old 比，强调"年代久远"'
  ],
  'anxious': [
    '🔬 angh-（窒息 angst）+ -ous = 心紧得喘不过气 = 焦虑的',
    '🎵 谐音"昂可谁死"：焦虑得昂头叫"可让谁死"',
    '📖 anxious about 担心；anxiety 名词；与 nervous 同义'
  ],
  'apparent': [
    '🔬 ap-（向）+ par（出现 appear）+ -ent = 显出来的 = 明显的',
    '🎵 谐音"啊怕认特"：明摆着的事还怕人认出 → 明显',
    '📖 apparently 显然；It is apparent that... 显而易见…'
  ],
  'appropriate': [
    '🔬 ap-（朝）+ propri（自己 proper）+ -ate = 恰到合适 = 适当的',
    '🎵 谐音"啊婆罗婆瑞特"：婆罗的瑞特特别合适',
    '📖 appropriate behavior 得体的行为；反义 inappropriate'
  ],
  'approve': [
    '🔬 ap-（朝）+ prove（证明）= 经证明而点头 = 赞成、批准',
    '🎵 谐音"啊婆乳服"：婆婆乳服都赞成了',
    '📖 approve of 赞成；approval 批准；反义 disapprove'
  ],
  'argue': [
    '🔬 拉丁 arguere（使清楚）= 把理由摆清楚 = 争论、主张',
    '🎵 谐音"啊乳"：吵架吵到啊乳都涨了',
    '📖 argue with sb 与人争吵；argue that 主张；argument 论点'
  ],
  'arise': [
    '🔬 a-（向上）+ rise（升）= 升起来 = 出现、产生（不及物）',
    '🎵 谐音"啊瑞日子"：好日子升起来了',
    '📖 三态 arise-arose-arisen；区别 rise/raise/arouse'
  ],
  'arrange': [
    '🔬 ar-（朝）+ range（排成行）= 排好 = 安排、布置',
    '🎵 谐音"啊润居"：润居家里安排得井井有条',
    '📖 arrange a meeting 安排会议；arrangement 名词'
  ],
  'aspect': [
    '🔬 a-（朝）+ spect（看）= 看的方向 = 方面、外观',
    '🎵 谐音"啊司派客特"：司机派给客人看的特别一面',
    '📖 from every aspect 从每个方面；与 angle、side 同义'
  ],
  'assume': [
    '🔬 as-（朝）+ sume（拿 sum）= 先拿在手里 = 假定、承担',
    '🎵 谐音"啊苏母"：苏母假定儿子已经吃过了',
    '📖 双义：assume 假定；assume responsibility 承担责任'
  ],
  'attain': [
    '🔬 at-（朝）+ tain（持 contain）= 拿到手 = 达到、获得',
    '🎵 谐音"啊探"：探到目标就拿到了 → 达到',
    '📖 attain goals；与 obtain 同义但 attain 多用于抽象目标'
  ],
  'attempt': [
    '🔬 at-（朝）+ tempt（试 tempt）= 朝目标试 = 尝试、企图',
    '🎵 谐音"啊腾普特"：腾起来普遍特别想试一下',
    '📖 attempt to do；既是动词也是名词；make an attempt'
  ],
  'attend': [
    '🔬 at-（朝）+ tend（伸展）= 把自己伸过去 = 出席、照料',
    '🎵 谐音"啊疼的"：心疼地出席每一场',
    '📖 attend a meeting；attend to 照料；attendance 出席率'
  ],
  'attract': [
    '🔬 at-（朝）+ tract（拉）= 拉过来 = 吸引',
    '🎵 谐音"啊乳吃客特"：乳茶店啊吸引特别多客',
    '📖 attractive 有吸引力的；attraction 吸引力/景点'
  ],
  'available': [
    '🔬 a-（朝）+ vail（价值 value）+ -able = 有用得着的价值 = 可获得的',
    '🎵 谐音"啊外了波"：外面有了波这玩意可用',
    '📖 available 有空/有货；常考与 accessible 区别'
  ],
  'average': [
    '🔬 来自阿拉伯语，原义"船货均摊损失" = 平均',
    '🎵 谐音"埃维瑞基"：每个基线都做平均',
    '📖 on average 平均；above/below average 高于/低于平均'
  ],
  'avoid': [
    '🔬 a-（脱离）+ void（空）= 让自己空出来 = 避免',
    '🎵 谐音"啊歪的"：歪一下就避开了',
    '📖 avoid doing（接动名词）；avoidance 名词'
  ],
  'aware': [
    '🔬 a-（朝）+ ware（小心 wary）= 留心察觉 = 意识到的',
    '🎵 谐音"啊外儿"：外面一动静我都意识到',
    '📖 aware of 意识到；awareness 名词；反义 unaware'
  ],
  'benefit': [
    '🔬 bene-（好）+ fit（做 fact）= 做好事 = 好处、利益',
    '🎵 谐音"班奶费特"：班里发奶免费特别有好处',
    '📖 benefit from 受益于；beneficial 有益的；福利 benefits'
  ],
  'capable': [
    '🔬 cap（拿 capture）+ -able = 能拿得动 = 有能力的',
    '🎵 谐音"开扒博"：能扒博能力强',
    '📖 be capable of 能够；与 able 同义；capability 名词'
  ],
  'capacity': [
    '🔬 cap（容纳）+ -acity = 容纳的能力 = 容量、能力',
    '🎵 谐音"客怕瑟踢"：客人怕瑟瑟发抖踢门 → 容量不够',
    '📖 容量 + 才能两个义；at full capacity 满负荷'
  ],
  'cause': [
    '🔬 拉丁 causa（原因）',
    '🎵 谐音"靠死"：靠死了就是原因和结果',
    '📖 cause and effect 因果；引发 cause sb to do'
  ],
  'character': [
    '🔬 希腊 charassein（刻印）= 刻在心里的标记 = 性格、字符',
    '🎵 谐音"卡瑞克特"：卡上瑞克特的字符标记',
    '📖 角色/性格/字符三义；characteristic 特点；in character 符合性格'
  ],
  'circumstance': [
    '🔬 circum-（围绕）+ stance（站）= 周围的情况 = 环境',
    '🎵 谐音"瑟康丝坦丝"：周围所有的事',
    '📖 under the circumstances 在这种情况下；常用复数'
  ],
  'claim': [
    '🔬 拉丁 clamare（喊）= 大声宣告 = 声称、索取',
    '🎵 谐音"克来们"：克扣的来 → 索赔',
    '📖 claim damages 索赔；声称 vt；no claim 无主张'
  ],
  'commit': [
    '🔬 com-（一起）+ mit（送 mission）= 投入 = 犯（罪）、承诺',
    '🎵 谐音"靠秘特"：靠秘密承诺了',
    '📖 commit a crime 犯罪；commit oneself to 致力于；commitment 承诺'
  ],
  'communicate': [
    '🔬 commun-（共同 common）+ -icate = 共有信息 = 交流',
    '🎵 谐音"康谬呢K特"：康师傅互相交流 K 特',
    '📖 communicate with sb；communication 通讯'
  ],
  'compare': [
    '🔬 com-（共同）+ pare（pair 配对）= 一起对照 = 比较',
    '🎵 谐音"康佩尔"：康师傅佩戴比较一下',
    '📖 compare A with B；compared to / with；comparison 比较'
  ],
  'compete': [
    '🔬 com-（一起）+ pete（追求 petition）= 一起追 = 竞争',
    '🎵 谐音"康闭"：一起去闭关竞争',
    '📖 compete with/against；competition 竞赛；competitive 有竞争力的'
  ],
  'complex': [
    '🔬 com-（一起）+ plex（折叠 ply）= 拧在一起 = 复杂的',
    '🎵 谐音"康普来克斯"：康普老来克斯（思路被绕乱）',
    '📖 名词义"综合大楼/情结"；反义 simple；complexity 复杂性'
  ],
  'concept': [
    '🔬 con-（一起）+ cept（拿 capture）= 心里抓住的东西 = 概念',
    '🎵 谐音"康赛普特"：康赛中的普遍特点',
    '📖 conceptual 概念性的；concept car 概念车'
  ],
  'conclude': [
    '🔬 con-（一起）+ clude（关闭 close）= 把话收尾 = 总结、得出结论',
    '🎵 谐音"康可路的"：康师傅可知道路终点',
    '📖 conclude that...；conclusion 结论；in conclusion 最后'
  ],
  'condition': [
    '🔬 con-（一起）+ dit(say)+ -ion = 一起说定的事 = 条件、状况',
    '🎵 谐音"康滴神"：康师傅滴下条件神才答应',
    '📖 on condition that 以…为条件；in good condition 状况良好'
  ],
  'conflict': [
    '🔬 con-（一起）+ flict（撞击）= 撞一起 = 冲突',
    '🎵 谐音"康夫力克特"：康夫和力客特别冲突',
    '📖 conflict with 与…冲突；armed conflict 武装冲突'
  ],
  'confront': [
    '🔬 con-（一起）+ front（前面）= 面对面 = 面对、对峙',
    '🎵 谐音"康疯特"：康师傅疯起来特别敢面对',
    '📖 confront sb with；confrontation 对峙'
  ],
  'consequence': [
    '🔬 con-（随）+ sequ（跟 sequence）+ -ence = 跟在后面的 = 后果',
    '🎵 谐音"康瑟昆斯"：康师傅瑟瑟昆斯（后果都来了）',
    '📖 face the consequences 承担后果；in consequence of 由于'
  ],
  'consider': [
    '🔬 con-（一起）+ sider（星 sidereal）= 像观星一样仔细看 = 考虑',
    '🎵 谐音"康司德"：康师道德考虑',
    '📖 consider doing；considering 考虑到；considerate 体贴的'
  ],
  'constant': [
    '🔬 con-（一起）+ stan（站 stand）+ -t = 一直站着 = 不变的',
    '🎵 谐音"康丝痰特"：康丝特别一致地咳痰',
    '📖 constantly 不断地；constant 物理常量'
  ],
  'construct': [
    '🔬 con-（一起）+ struct（建）= 一起建起来 = 建造',
    '🎵 谐音"康丝抓特"：康丝抓住特别会建',
    '📖 construction 建筑工程；constructive 建设性的'
  ],
  'consume': [
    '🔬 con-（彻底）+ sume（拿 sum）= 全拿走 = 消耗、消费',
    '🎵 谐音"康苏母"：康家苏家两位母亲一起消费',
    '📖 consumer 消费者；consumption 消费；time-consuming 耗时的'
  ],
  'contain': [
    '🔬 con-（一起）+ tain（持）= 装在里面 = 容纳、包含',
    '🎵 谐音"康疼"：康太疼容易容纳一切',
    '📖 container 集装箱；containment 抑制；contain 包含 vs 抑制'
  ],
  'context': [
    '🔬 con-（一起）+ text（编织 text）= 一起织起来的话 = 上下文',
    '🎵 谐音"康太死特"：康师傅太死扣特殊上下文',
    '📖 in context 结合上下文；out of context 断章取义'
  ],
  'contribute': [
    '🔬 con-（一起）+ trib（给 tribute）= 一起给出 = 贡献、捐助',
    '🎵 谐音"康崔毕由特"：康崔比尤特奉献',
    '📖 contribute to 有助于；contribution 贡献；contributor 贡献者'
  ],
  'convince': [
    '🔬 con-（彻底）+ vince（征服 victory）= 彻底征服 = 使信服',
    '🎵 谐音"康文斯"：康家文人就是会斯文地说服',
    '📖 convince sb of 使某人相信；convincing 有说服力的'
  ],
  'create': [
    '🔬 拉丁 creare（生出）',
    '🎵 谐音"克瑞特"：克隆出瑞特新东西',
    '📖 creative 有创造力的；creativity 创造力；creation 创造物'
  ],
  'critic': [
    '🔬 希腊 kritikos（判断）= 会评判的人 = 批评家',
    '🎵 谐音"克瑞踢克"：把作品克瑞踢一脚',
    '📖 critic 批评家；criticize 批评 v；critical 关键的/批判的'
  ],
  'decide': [
    '🔬 de-（去除）+ cide（切 scissor）= 切断犹豫 = 决定',
    '🎵 谐音"地塞的"：地里塞定的事 → 决定',
    '📖 decision 决定；decisive 决定性的；make a decision'
  ],
  'declare': [
    '🔬 de-（彻底）+ clare（清楚 clear）= 说清楚 = 宣告',
    '🎵 谐音"地可乐尔"：地上敲可乐器宣告',
    '📖 declare war 宣战；declaration 声明；declare 还指"申报海关"'
  ],
  'demand': [
    '🔬 de-（彻底）+ mand（命令 command）= 强烈要求 = 需求、要求',
    '🎵 谐音"低慢的"：低头慢慢要求',
    '📖 in demand 抢手；supply and demand 供需；demand to do'
  ],
  'depend': [
    '🔬 de-（向下）+ pend（挂）= 挂在下面 = 依赖、取决于',
    '🎵 谐音"地盆的"：地上盆里的水依赖于雨',
    '📖 depend on；dependence 依赖；independent 独立的'
  ],
  'describe': [
    '🔬 de-（向下）+ scribe（写）= 写下来 = 描述',
    '🎵 谐音"地丝爬"：地上的丝路爬来描述',
    '📖 describe sb as；description 描述；indescribable 难以形容的'
  ],
  'design': [
    '🔬 de-（出）+ sign（标记）= 画出标记 = 设计',
    '🎵 谐音"地散"：地上散布出来的标记 → 设计',
    '📖 designer 设计师；by design 故意；designate 指定'
  ],
  'desire': [
    '🔬 de-（远离）+ sider（星）= 离星辰这么远的渴望 = 强烈期望',
    '🎵 谐音"地砸尔"：地都被砸尔欲望太强',
    '📖 desire to do；desirable 称心的；leave much to be desired 还差很多'
  ],
  'destroy': [
    '🔬 de-（向下）+ stroy（建 struct）= 反向拆建 = 摧毁',
    '🎵 谐音"地丝拽"：地上的丝被拽烂',
    '📖 destruction 摧毁；destructive 破坏性的；与 construct 反义'
  ],
  'determine': [
    '🔬 de-（彻底）+ termin（边界 terminal）= 把边界划死 = 决定',
    '🎵 谐音"低疼疼"：心低头疼着决定',
    '📖 be determined to do 决心；determination 决心；determined 坚决的'
  ],
  'develop': [
    '🔬 de-（去）+ velop（包 envelope）= 解开包裹 = 发展',
    '🎵 谐音"地外了普"：地外的发展普及',
    '📖 development 发展；developing/developed countries；勿与 envelope 混'
  ],
  'discover': [
    '🔬 dis-（去除）+ cover（覆盖）= 揭开 = 发现',
    '🎵 谐音"地丝靠我"：地上的丝靠我才发现',
    '📖 discovery 发现；discoverer 发现者；与 invent 区别'
  ],
  'distance': [
    '🔬 dis-（分开）+ stance（站）= 站开 = 距离',
    '🎵 谐音"低丝疼丝"：低头丝丝隐疼跨过距离',
    '📖 in the distance 远方；keep distance；distant 远的'
  ],
  'effect': [
    '🔬 ef-（出）+ fect（做 fact）= 做出来的结果 = 效果（名词）',
    '🎵 谐音"伊负克特"：伊给负面效果',
    '📖 与 affect 区分：effect = 名词"效果"；effective 有效的；in effect 实际上'
  ],
  'effort': [
    '🔬 ef-（出）+ fort（力）= 出力 = 努力',
    '🎵 谐音"挨负图"：挨着负重图发展 → 努力',
    '📖 make an effort to 努力；effortless 不费力的；no effort spared 不遗余力'
  ],
  'employ': [
    '🔬 em-（在内）+ ploy（折 ply）= 折进自己组织 = 雇用',
    '🎵 谐音"嗯炮"：嗯，给你一炮工作（雇用）',
    '📖 employee 雇员；employer 雇主；employment 就业；unemployed 失业'
  ],
  'encourage': [
    '🔬 en-（使）+ courage（勇气）= 给勇气 = 鼓励',
    '🎵 谐音"嗯卡瑞之"：嗯，卡瑞之给你打气',
    '📖 encourage sb to do；encouragement 鼓励；反义 discourage'
  ],
  'enormous': [
    '🔬 e-（出）+ norm（标准）+ -ous = 超出标准 = 巨大的',
    '🎵 谐音"伊诺莫斯"：伊一诺一莫斯科那么大',
    '📖 enormous size 巨大尺寸；enormously 非常；与 huge 同义'
  ],
  'ensure': [
    '🔬 en-（使）+ sure（确定）= 使确定 = 确保',
    '🎵 谐音"嗯休尔"：嗯休息时确保',
    '📖 ensure that；区别 assure（向人保证）/insure（投保）'
  ],
  'environment': [
    '🔬 en-（在内）+ viron（圈 circle）+ -ment = 圈里的东西 = 环境',
    '🎵 谐音"嗯外人门特"：嗯外人门口的特殊环境',
    '📖 environmental 环境的；eco-environment 生态环境'
  ],
  'establish': [
    '🔬 e-（出）+ stab（站 stable）+ -lish = 站稳了 = 建立',
    '🎵 谐音"伊丝塔波利水"：伊丝塔波利地用水建立',
    '📖 established 既定的；establishment 机构；establish a company 创办公司'
  ],
  'estimate': [
    '🔬 e-（出）+ stim（值）+ -ate = 估出价值 = 估计',
    '🎵 谐音"挨死特么特"：挨着死了估计也得',
    '📖 underestimate 低估；overestimate 高估；rough estimate 粗估'
  ],
  'evidence': [
    '🔬 e-（出）+ vid（看 video）+ -ence = 显而易见的 = 证据',
    '🎵 谐音"挨我都死"：挨我证据都死定了',
    '📖 evident 明显的；evidently 显然；in evidence 显眼的'
  ],
  'examine': [
    '🔬 ex-（出）+ amine（拉拽）= 拉出来看 = 检查',
    '🎵 谐音"伊咳棉"：伊一咳棉袄就被检查',
    '📖 examination 检查/考试；examiner 检查员；medical examination 体检'
  ],
  'expand': [
    '🔬 ex-（向外）+ pand（伸展）= 向外撑 = 扩张',
    '🎵 谐音"伊克斯潘的"：伊克斯盘子扩大',
    '📖 expansion 扩张；与 expand/expend（花费）区分；expansive 广阔的'
  ],
  'experience': [
    '🔬 ex-（外）+ peri（尝试 try）+ -ence = 尝试过的事 = 经验、经历',
    '🎵 谐音"克斯皮瑞恩斯"：克斯皮瑞恩斯经历过',
    '📖 双义：经验 + 经历；experienced 有经验的；experience sth 体验'
  ],
  'explain': [
    '🔬 ex-（出）+ plain（平 plane）= 摊平给人看 = 解释',
    '🎵 谐音"伊克斯不来"：伊解释为什么不来',
    '📖 explanation 解释；self-explanatory 不言自明的'
  ],
  'explore': [
    '🔬 ex-（出）+ plore（哭 plore=cry）= 在外大声呼喊找路 = 探索',
    '🎵 谐音"伊克斯破"：伊克斯破开探索',
    '📖 explorer 探险家；exploration 探索；explore options 探索选择'
  ],
  'extend': [
    '🔬 ex-（向外）+ tend（伸 tense）= 向外伸 = 延伸、扩展',
    '🎵 谐音"伊克斯腾"：伊克斯腾出空间扩展',
    '📖 extension 延伸/分机；extensive 广泛的；extent 程度'
  ],
  'factor': [
    '🔬 fact（做）+ -or（者）= 起作用的事物 = 因素',
    '🎵 谐音"发可拓"：发挥作用可以拓展',
    '📖 key factor 关键因素；factor in 把…考虑进去；factorize 因式分解'
  ],
  'familiar': [
    '🔬 family（家庭）+ -iar = 家人般的 = 熟悉的',
    '🎵 谐音"福米利尔"：福米利尔像家人',
    '📖 be familiar with（人熟悉某物）；be familiar to（某物对某人熟悉）'
  ],
  'feature': [
    '🔬 拉丁 factura（制作）= 制造出的特征 = 特征、特色',
    '🎵 谐音"飞缺尔"：飞行特征是缺尔不可',
    '📖 feature 名词"特征"+ 动词"以…为特色"；feature film 长片'
  ],
  'figure': [
    '🔬 拉丁 figura（形状）',
    '🎵 谐音"夫衣哥儿"：衣服上的人形数字',
    '📖 多义：人物/数字/图形；figure out 弄明白；figure skating 花样滑冰'
  ],
  'finance': [
    '🔬 fin（结束 final）+ -ance = 把账目结清 = 金融、财务',
    '🎵 谐音"伐南死"：伐木南方死磕金融',
    '📖 financial 金融的；finances 财务状况；financier 金融家'
  ],
  'former': [
    '🔬 form（形成）+ -er = 先成形的 = 前者、之前的',
    '🎵 谐音"佛么儿"：佛么以前的事',
    '📖 the former...the latter... 前者…后者…；former president 前总统'
  ],
  'frequent': [
    '🔬 拉丁 frequens（拥挤的）= 频繁发生',
    '🎵 谐音"夫瑞坤特"：夫妻瑞坤特频繁见面',
    '📖 frequently 频繁地；frequency 频率；infrequent 罕见的'
  ]
};
