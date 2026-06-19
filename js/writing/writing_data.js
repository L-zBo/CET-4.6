// 四六级写作高分模板数据库
// 包含：句型汇总（7类）+ 写作模板（7类）+ 常用谚语

const WRITING_DATA = {
  // =================== 一、万能句型 ===================
  sentences: [
    {
      id: "s1",
      title: "名言警句类破题句",
      items: [
        { zh: "读到这句名言，我们自然能领悟其内涵……", en: "Reading this famous saying, we can naturally perceive its connotation that + 名言警句的内涵" },
        { zh: "这句名言传达了一个普遍的事实/现象……", en: "This famous saying conveys a universal fact/phenomenon that + 名言警句的意义" }
      ]
    },
    {
      id: "s2",
      title: "漫画类描述图画句",
      items: [
        { zh: "图中生动/清楚地描绘了……", en: "It is vividly/clearly depicted in the picture that + 图画中的人物、话语或事件" },
        { zh: "这是一幅简单/讽刺但发人深省的图画，其中……", en: "Given is a simple/ironical but thought-provoking/enlightening picture/cartoon, in which + 图画中的人物、话语或事件" },
        { zh: "上面的图画清楚地描述了……", en: "What is clearly described in the drawing above is that + 图画中的人物、话语或事件" },
        { zh: "这幅漫画巧妙地描绘了一个发人深省的场景……", en: "The cartoon subtly and symbolically depicts a thought-provoking scenario in which + 图画中的人物、话语或事件" }
      ]
    },
    {
      id: "s3",
      title: "表达不同观点万能句",
      items: [
        { zh: "人们对……的观点因人而异", en: "People's views on… vary from person to person. Some hold that… However, others believe that…" },
        { zh: "人们对……可能会持有不同见解", en: "People may have different opinions on…" },
        { zh: "人们对待……的态度因人而异", en: "Attitudes towards… vary from person to person. // Different people hold different attitudes towards…" },
        { zh: "对于……人们的观点大不相同", en: "There are different opinions among people as to…" }
      ]
    },
    {
      id: "s4",
      title: "提出建议万能句",
      items: [
        { zh: "该是我们停止这一趋势的时候了", en: "It is high time that we put an end to the (trend)." },
        { zh: "毫无疑问，对……问题应予以足够重视", en: "There is no doubt that enough concern must be paid to the problem of…" },
        { zh: "显然，如果我们想要做某事，很重要的是……", en: "Obviously, if we want to do something… it is essential that…" },
        { zh: "只有这样，我们才能……", en: "Only in this way can we…" },
        { zh: "不遗余力地……", en: "Spare no effort to + V." }
      ]
    },
    {
      id: "s5",
      title: "采取措施万能句",
      items: [
        { zh: "我们应该采取有效措施", en: "We should take some effective measures." },
        { zh: "我们应该尽最大努力去克服困难", en: "We should try our best to overcome/conquer the difficulties." },
        { zh: "我们应该尽力去做……", en: "We should do our utmost in doing sth." },
        { zh: "我们应该解决我们面临的困难", en: "We should solve the problems that we are confronted/faced with." }
      ]
    }
  ],

  // =================== 二、常用谚语 ===================
  proverbs: [
    { zh: "事实胜于雄辩", en: "Actions speak louder than words." },
    { zh: "发光的未必都是金子", en: "All is not gold that glitters." },
    { zh: "条条大路通罗马", en: "All roads lead to Rome." },
    { zh: "良好的开端是成功的一半", en: "A good beginning is half done." },
    { zh: "有利必有弊", en: "Every advantage has its disadvantage." },
    { zh: "失之毫厘，差之千里", en: "A miss is as good as a mile." },
    { zh: "失败是成功之母", en: "Failure is the mother of success." },
    { zh: "活到老，学到老", en: "It is never too old to learn." },
    { zh: "知识就是力量", en: "Knowledge is power." },
    { zh: "世上无难事，只怕有心人", en: "Nothing in the world is difficult for one who sets his mind to it." }
  ],

  // =================== 三、写作模板 ===================
  templates: [
    {
      id: "t1",
      title: "解决方法型",
      desc: "列举出解决问题的多种途径",
      structure: ["问题现状", "怎样解决（解决方案的优缺点）"],
      content: `In recent days, we have to face the problem _____ (描述问题A), which is becoming more and more serious. First, _____ (说明A的现状). Second, _____ (举例进一步说明现状).

Confronted with A, we should take a series of effective measures to cope with the situation. For one thing, _____ (解决方法一). For another _____ (解决方法二). Finally, _____ (解决方法三).

Personally, I believe that _____ (我的解决方法). Consequently, I'm confident that a bright future is awaiting us because _____ (带来的好处).`
    },
    {
      id: "t2",
      title: "说明利弊型",
      desc: "先说明现状，再对比事物本身的利弊",
      structure: ["说明事物现状", "事物本身的优缺点", "你对现状的看法"],
      content: `Nowadays many people prefer A because it has a significant role in our daily life. Generally, its advantages can be seen as follows. First _____ (A的优点之一). Besides _____ (A的优点之二).

But every coin has two sides. The negative aspects are also apparent. One of the important disadvantages is that _____ (A的第一个缺点). To make matters worse, _____ (A的第二个缺点).

Through the above analysis, I believe that the positive aspects overweigh the negative ones. Therefore, I would like to _____ (我的看法).

From the comparison between these positive and negative effects of A, we should take it reasonably and do it according to the circumstances we are in. Only by this way, _____ (对前景的预测).`
    },
    {
      id: "t3",
      title: "阐述主题型",
      desc: "从一句话或一个主题出发，按照提纲的要求进行论述",
      structure: ["阐述名言或主题所蕴涵的意义", "分析并举例使其更充实"],
      content: `The good old proverb _____ (名言或谚语) reminds us that _____ (主题含义). Indeed, we can learn many things from it.

First of all, _____ (理由一). For example, _____ (举例说明). Secondly, _____ (理由二). Another case is that _____ (举例说明). Furthermore, _____ (理由三).

In my opinion, _____ (我的观点). In short, whatever you do, please remember the saying _____ (主题或名言). If you understand it and apply it to your study or work, you'll necessarily benefit a lot from it.`
    },
    {
      id: "t4",
      title: "对比观点型",
      desc: "论述两个对立的观点并给出自己的看法",
      structure: ["有一些人认为……", "另一些人认为……", "我的看法……"],
      content: `The topic of _____ (主题) is becoming more and more popular recently. There are two sides of opinions of it. Some people say A is their favorite. They hold their view for the reason of _____ (支持A的理由一). What is more, _____ (理由二). Moreover, _____ (理由三).

While others think that B is a better choice in the following three reasons. Firstly, _____ (支持B的理由一). Secondly (besides), _____ (理由二). Thirdly (Finally), _____ (理由三).

From my point of view, I think _____ (我的观点). The reason is that _____ (原因). As a matter of fact, there are some other reasons to explain my choice. For me, the former is surely a wise choice.`
    },
    {
      id: "t5",
      title: "社会问题型",
      desc: "探讨问题出现的原因以及解决方法",
      structure: ["一个社会问题或者现象", "产生的原因及影响", "提出解决办法及前景预测"],
      content: `Nowadays, there exists an increasingly serious social/economic/environmental problem. _____ (问题A) has increasingly become a common concern of the public.

There are a couple of reasons booming this problem/phenomenon. The main reason is _____, What is more, _____. Thirdly, _____. It has caused substantial impact on the society and our daily life. (阐释影响)

A dozen of measures are supposed to take to prevent A from bringing us more harm. For one thing ______. For another ______. Based on the above discussions, I can easily forecast that more and more people will … (展望未来).`
    },
    {
      id: "t6",
      title: "图表式作文",
      desc: "通过图表信息来描述一个现象或情况",
      structure: ["描述图表信息", "阐释变化产生的原因", "总结趋势"],
      content: `It is obvious in the graph/table that the rate/number/amount of Y has undergone dramatic changes. It has gone up/grown/fallen/dropped considerably in recent years (as X varies).

What is the reason for this change? Mainly there are three reasons behind the situation reflected in the graph/table. First of all, ______ (第一个原因). More importantly, _______ (第二个原因). Most important of all, _______ (第三个原因).

From the above discussions, we have enough reason to predict what will happen in the near future. The trend described in the graph/table will continue for quite a long time (if necessary measures are not taken).`
    },
    {
      id: "t7",
      title: "图画式作文",
      desc: "根据漫画来写作文，反映社会现象",
      structure: ["描述这幅图，解释含义", "联系现实，阐释原因或危害", "总结观点，提出建议"],
      content: `As we can see from the picture/drawing, … It is obvious that ...

The cartoon subtly and symbolically depicts a thought-provoking scenario in which + 图画中的人物、话语或事件. Simple as the picture is, the meaning behind it is as deep as ocean.

In my opinion, effective measures should be taken to address this issue. On the one hand, ______. On the other hand, ______. Only by doing so can we ______.`
    }
  ]
};
