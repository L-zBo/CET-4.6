// ========== CET 词汇大师 — 写作模板模块 (writing.js) ==========
(function() {
  'use strict';
  const C = window._C;

  let currentTab = 'templates'; // templates | sentences | proverbs
  let currentSentenceCat = 'all';  // 万能句型分类筛选
  let currentTemplateCat = 'all';  // 写作模板分类筛选

  // ===== 模板分类映射 =====
  var TEMPLATE_CATS = [
    { id: 'all', label: '全部' },
    { id: 'solution', label: '解决方法', match: ['t1'] },
    { id: 'proscons', label: '利弊分析', match: ['t2'] },
    { id: 'theme', label: '阐述主题', match: ['t3'] },
    { id: 'compare', label: '对比观点', match: ['t4'] },
    { id: 'social', label: '社会问题', match: ['t5'] },
    { id: 'chart', label: '图表作文', match: ['t6'] },
    { id: 'picture', label: '图画作文', match: ['t7'] }
  ];

  // ===== 句型语法分析数据 =====
  function analyzeSentenceGrammar(en) {
    var parts = [];
    // 检测常见句型结构
    if (/^(Reading|Given|What is|It is|The cartoon)/i.test(en)) {
      parts.push({ type: '主语从句/分词', color: 'var(--sky)' });
    }
    if (/\bthat\s+/i.test(en)) {
      parts.push({ type: '从句', color: 'var(--emerald)' });
    }
    if (/\b(should|must|can|may|could|would)\b/i.test(en)) {
      parts.push({ type: '情态动词', color: 'var(--amber)' });
    }
    if (/\b(if|when|while|although|because|since)\b/i.test(en)) {
      parts.push({ type: '状语从句', color: 'var(--violet, #a78bfa)' });
    }
    if (/\b(not only|both|either|neither)\b/i.test(en)) {
      parts.push({ type: '并列结构', color: 'var(--coral, #f87171)' });
    }
    if (/\b(more|most|better|best|less|least)\b/i.test(en)) {
      parts.push({ type: '比较级/最高级', color: 'var(--sky)' });
    }
    if (parts.length === 0) {
      parts.push({ type: '基础句型', color: 'var(--muted)' });
    }
    return parts;
  }

  // 高亮英文句型中的关键语法词
  function highlightGrammar(en) {
    return C.esc(en)
      .replace(/\b(that|which|who|whom|whose|where|when)\b/gi, '<span class="grammar-clause">$1</span>')
      .replace(/\b(should|must|can|may|could|would|shall)\b/gi, '<span class="grammar-modal">$1</span>')
      .replace(/\b(if|when|while|although|because|since|unless)\b/gi, '<span class="grammar-adv">$1</span>')
      .replace(/\b(not only|but also|either|or|neither|nor|both|and)\b/gi, '<span class="grammar-parallel">$1</span>');
  }

  // 获取句型使用场景
  function getSentenceUsage(groupTitle) {
    var usageMap = {
      '名言警句类破题句': '适用于引用名言开头的议论文第一段',
      '漫画类描述图画句': '适用于看图作文第一段描述画面',
      '表达不同观点万能句': '适用于议论文中展示多方观点',
      '提出建议万能句': '适用于文章结尾提出解决方案',
      '采取措施万能句': '适用于论述具体行动方案的段落'
    };
    return usageMap[groupTitle] || '适用于四六级写作';
  }

  // ===== 句子/短语类型推断（与翻译模块一致的分析逻辑） =====
  function inferSentenceType(en) {
    var lower = en.toLowerCase().trim();
    var wordCount = lower.split(/\s+/).length;
    if (wordCount >= 8) return { tag: 'S', label: '完整句型' };
    if (/^to\s/.test(lower)) return { tag: 'VP', label: '动词短语' };
    if (/^(is|are|was|were|be)\s/.test(lower)) return { tag: 'VP', label: '动词短语' };
    if (/\b(do|make|take|get|put|give|have|keep|set|go|come|run|bring|hold|carry)\b/.test(lower) && wordCount <= 5) return { tag: 'VP', label: '动词短语' };
    if (/^(the|a|an)\s/.test(lower) || /^[a-z]+(tion|ment|ness|ity|ism|ance|ence|ing|ure)\b/.test(lower)) return { tag: 'NP', label: '名词短语' };
    if (/^(very|quite|rather|highly|extremely)\s/.test(lower) || /^[a-z]+(ous|ive|ful|less|able|ible|al|ial|ic|ent|ant)\b/.test(lower)) return { tag: 'AdjP', label: '形容词短语' };
    if (wordCount <= 3) return { tag: 'PHR', label: '短语' };
    return { tag: 'S', label: '句型' };
  }

  // 词汇难度分析
  function analyzeWordDifficulty(en) {
    var words = en.replace(/[.,!?;:'"()]/g, '').split(/\s+/);
    var longWords = words.filter(function(w) { return w.replace(/[^a-zA-Z]/g, '').length >= 7; });
    var label = longWords.length >= 4 ? '较高' : longWords.length >= 2 ? '中等' : '基础';
    var color = longWords.length >= 4 ? 'var(--coral)' : longWords.length >= 2 ? 'var(--amber)' : 'var(--emerald)';
    return { label: label, color: color, words: words, wordCount: words.length };
  }

  // 获取写作场景备考提示
  function getWritingTip(groupTitle) {
    var tips = {
      '名言警句类破题句': '建议背诵后用于议论文开头段，增强说服力',
      '漫画类描述图画句': '看图作文首段必用句型，描述画面内容时直接套用',
      '表达不同观点万能句': '适合展示正反观点，体现辩证思维能力',
      '提出建议万能句': '放在结尾段提出解决方案，逻辑清晰加分',
      '采取措施万能句': '适合论述具体措施，搭配并列结构效果更佳'
    };
    return tips[groupTitle] || '四六级写作高频句型，建议反复朗读并在写作中主动运用';
  }
  function analyzeProverbGrammar(en) {
    var structure = [];
    var words = en.replace(/[.,!?;:'"]/g, '').split(/\s+/);
    // 简单的主谓宾分析
    var verbs = ['speak', 'speaks', 'lead', 'leads', 'is', 'are', 'has', 'have', 'done', 'glitters', 'sets', 'learn'];
    var subjects = [];
    var predicates = [];
    var verbIdx = -1;

    for (var i = 0; i < words.length; i++) {
      if (verbs.indexOf(words[i].toLowerCase()) !== -1 && verbIdx === -1) {
        verbIdx = i;
        predicates.push(words[i]);
      } else if (verbIdx === -1) {
        subjects.push(words[i]);
      }
    }

    if (subjects.length > 0) structure.push({ label: '主语', text: subjects.join(' '), color: 'var(--sky)' });
    if (predicates.length > 0) structure.push({ label: '谓语', text: predicates.join(' '), color: 'var(--emerald)' });
    if (verbIdx !== -1 && verbIdx < words.length - 1) {
      structure.push({ label: '宾语/表语', text: words.slice(verbIdx + 1).join(' '), color: 'var(--amber)' });
    }
    return structure;
  }

  // 谚语使用场景
  var proverbUsages = {
    0: '用于强调实际行动比空谈重要',
    1: '用于告诫不要被表象所迷惑',
    2: '用于表达达成目标有多种途径',
    3: '用于强调好的开始的重要性',
    4: '用于辩证分析事物的两面性',
    5: '用于强调细节决定成败',
    6: '用于鼓励面对挫折不放弃',
    7: '用于强调终身学习的重要性',
    8: '用于论述知识/教育的价值',
    9: '用于强调毅力和决心的力量'
  };

  function renderWriting() {
    const container = C.$('writing-content');
    if (!container) return;
    if (typeof WRITING_DATA === 'undefined') {
      container.innerHTML = '<p style="color:var(--muted)">写作数据加载失败</p>';
      return;
    }

    renderWritingTabs();

    switch (currentTab) {
      case 'templates': renderTemplates(); break;
      case 'sentences': renderSentences(); break;
      case 'proverbs': renderProverbs(); break;
    }
  }

  function renderWritingTabs() {
    const tabs = C.$('writing-tabs');
    if (!tabs) return;
    tabs.innerHTML = '';

    const tabData = [
      { id: 'templates', label: '写作模板', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>' },
      { id: 'sentences', label: '万能句型', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' },
      { id: 'proverbs', label: '常用谚语', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>' }
    ];

    const bar = document.createElement('div');
    bar.className = 'writing-tab-bar';
    tabData.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'writing-tab-btn' + (currentTab === t.id ? ' active' : '');
      btn.innerHTML = t.icon + ' ' + t.label;
      btn.onclick = () => { currentTab = t.id; renderWriting(); };
      bar.appendChild(btn);
    });
    tabs.appendChild(bar);
  }

  function renderTemplates() {
    const container = C.$('writing-content');
    if (!container) return;

    // 分类筛选栏
    let html = '<div class="writing-tpl-cat-bar">';
    TEMPLATE_CATS.forEach(cat => {
      html += '<button class="trans-cat-btn' + (currentTemplateCat === cat.id ? ' active' : '') + '" data-cat="' + cat.id + '">' + C.esc(cat.label) + '</button>';
    });
    html += '</div>';

    // 过滤模板
    var templates = WRITING_DATA.templates;
    if (currentTemplateCat !== 'all') {
      var catObj = TEMPLATE_CATS.find(function(c) { return c.id === currentTemplateCat; });
      if (catObj && catObj.match) {
        templates = templates.filter(function(tpl) { return catObj.match.indexOf(tpl.id) !== -1; });
      }
    }

    html += '<div class="writing-templates">';

    templates.forEach((tpl, idx) => {
      const theme = C.CARD_THEMES[idx % C.CARD_THEMES.length];
      const structureHtml = tpl.structure.map((s, i) =>
        '<span class="tpl-step">' + (i + 1) + '. ' + C.esc(s) + '</span>'
      ).join('');

      // 高亮模板中的空白占位符
      const contentHtml = C.esc(tpl.content)
        .replace(/_{3,}\s*\([^)]+\)/g, match => '<span class="tpl-blank">' + match + '</span>')
        .replace(/\n/g, '<br>');

      html +=
        '<div class="writing-tpl-card ' + theme + '">' +
          '<div class="writing-tpl-header" onclick="this.parentElement.classList.toggle(\'expanded\')">' +
            '<div class="writing-tpl-title">' +
              '<span class="writing-tpl-num">' + tpl.id.replace('t', '') + '</span>' +
              '<h3>' + C.esc(tpl.title) + '</h3>' +
            '</div>' +
            '<div class="writing-tpl-desc">' + C.esc(tpl.desc) + '</div>' +
            '<div class="writing-tpl-structure">' + structureHtml + '</div>' +
            '<svg class="writing-tpl-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>' +
          '</div>' +
          '<div class="writing-tpl-body">' +
            '<div class="writing-tpl-content">' + contentHtml + '</div>' +
            '<button class="btn btn-sm btn-ghost writing-copy-btn" onclick="window._C.copyTemplate(\'' + tpl.id + '\')">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
              ' 复制模板' +
            '</button>' +
          '</div>' +
        '</div>';
    });

    html += '</div>';
    container.innerHTML = html;

    // 绑定分类按钮
    container.querySelectorAll('.writing-tpl-cat-bar .trans-cat-btn').forEach(btn => {
      btn.onclick = () => {
        currentTemplateCat = btn.dataset.cat;
        renderTemplates();
      };
    });
  }

  // 存储扁平化的句型数据供弹窗使用
  var flatSentences = [];

  function renderSentences() {
    const container = C.$('writing-content');
    if (!container) return;

    // 分类筛选栏
    let html = '<div class="writing-sentence-cat-bar">';
    html += '<button class="trans-cat-btn' + (currentSentenceCat === 'all' ? ' active' : '') + '" data-cat="all">全部</button>';
    WRITING_DATA.sentences.forEach(group => {
      html += '<button class="trans-cat-btn' + (currentSentenceCat === group.id ? ' active' : '') + '" data-cat="' + group.id + '">' + C.esc(group.title) + '</button>';
    });
    html += '</div>';

    html += '<div class="writing-sent-grid">';

    const groups = currentSentenceCat === 'all'
      ? WRITING_DATA.sentences
      : WRITING_DATA.sentences.filter(g => g.id === currentSentenceCat);

    // 扁平化数据
    flatSentences = [];
    groups.forEach(function(group) {
      group.items.forEach(function(item) {
        flatSentences.push({ zh: item.zh, en: item.en, groupTitle: group.title });
      });
    });

    // 每日推送
    if (C.renderDailyPush) {
      html += C.renderDailyPush(flatSentences, 'writing');
    }

    flatSentences.forEach(function(item, idx) {
      html +=
        '<div class="writing-sent-card" data-sidx="' + idx + '">' +
          '<div class="writing-sent-card-accent"></div>' +
          '<div class="writing-sent-card-preview">' +
            '<div class="writing-sent-card-header">' +
              '<span class="writing-sent-card-idx">' + (idx + 1) + '</span>' +
              '<span class="writing-sent-card-cat">' + C.esc(item.groupTitle) + '</span>' +
            '</div>' +
            '<div class="writing-sent-card-zh">' + C.esc(item.zh) + '</div>' +
            '<div class="writing-sent-card-divider"></div>' +
            '<div class="writing-sent-card-en">' + C.esc(item.en) + '</div>' +
          '</div>' +
        '</div>';
    });

    html += '</div>';
    container.innerHTML = html;

    // 绑定卡片点击 → 弹窗
    container.querySelectorAll('.writing-sent-card').forEach(function(card) {
      card.onclick = function() {
        var idx = parseInt(card.dataset.sidx);
        showSentenceDetail(idx);
      };
    });

    // 绑定分类按钮点击
    container.querySelectorAll('.writing-sentence-cat-bar .trans-cat-btn').forEach(btn => {
      btn.onclick = () => {
        currentSentenceCat = btn.dataset.cat;
        renderSentences();
      };
    });
  }

  function showSentenceDetail(idx) {
    var item = flatSentences[idx];
    if (!item) return;

    // 移除已有弹窗
    var existing = document.querySelector('.writing-detail-overlay');
    if (existing) existing.remove();

    var grammarParts = analyzeSentenceGrammar(item.en);
    var highlightedEn = highlightGrammar(item.en);
    var usage = getSentenceUsage(item.groupTitle);
    var escapedEn = item.en.replace(/'/g, "\\'");

    // 短语/句型类型推断
    var ptype = inferSentenceType(item.en);
    // 词汇难度分析
    var diff = analyzeWordDifficulty(item.en);
    // 备考提示
    var writingTip = getWritingTip(item.groupTitle);

    // 语法标签
    var grammarTagsHtml = '';
    grammarParts.forEach(function(p) {
      grammarTagsHtml += '<span class="sent-grammar-tag" style="color:' + p.color + ';border-color:' + p.color + '">' + C.esc(p.type) + '</span>';
    });

    // 词汇拆解 chips
    var wordChipsHtml = '';
    if (diff.wordCount > 1) {
      diff.words.forEach(function(w) {
        if (w.length > 0) wordChipsHtml += '<span class="trans-detail-word-chip">' + C.esc(w) + '</span>';
      });
    }

    var overlay = document.createElement('div');
    overlay.className = 'writing-detail-overlay';
    overlay.innerHTML =
      '<div class="writing-detail-modal">' +
        '<button class="writing-detail-close" onclick="this.closest(\'.writing-detail-overlay\').remove()">&times;</button>' +
        '<div class="writing-detail-header">' +
          '<div class="writing-detail-badge">' +
            '<span class="writing-sent-card-idx">' + (idx + 1) + '</span>' +
            '<span class="writing-sent-card-cat">' + C.esc(item.groupTitle) + '</span>' +
            '<span class="writing-sent-card-type">' + C.esc(ptype.tag) + '</span>' +
          '</div>' +
          '<div class="writing-detail-zh">' + C.esc(item.zh) + '</div>' +
          '<div class="writing-detail-divider"></div>' +
          '<div class="writing-detail-en">' + highlightedEn + '</div>' +
          '<div class="writing-detail-speak-row">' +
            '<button class="word-detail-speak-btn" onclick="event.stopPropagation();window._C.speak(\'' + escapedEn + '\',\'us\')" title="美式发音">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>' +
              ' 美式' +
            '</button>' +
            '<button class="word-detail-speak-btn" onclick="event.stopPropagation();window._C.speak(\'' + escapedEn + '\',\'uk\')" title="英式发音">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>' +
              ' 英式' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="writing-detail-body">' +
          // 语法分析
          '<div class="writing-detail-section">' +
            '<div class="writing-detail-section-title">语法分析</div>' +
            '<div class="sent-grammar-tags">' + grammarTagsHtml + '</div>' +
          '</div>' +
          // 短语分析（与翻译热词一致）
          '<div class="writing-detail-section">' +
            '<div class="writing-detail-section-title">短语分析</div>' +
            '<div class="trans-detail-analysis">' +
              '<div class="trans-detail-analysis-item">' +
                '<span class="analysis-label">类型</span>' +
                '<span class="analysis-value">' + C.esc(ptype.label) + ' (' + C.esc(ptype.tag) + ')</span>' +
              '</div>' +
              '<div class="trans-detail-analysis-item">' +
                '<span class="analysis-label">词数</span>' +
                '<span class="analysis-value">' + diff.wordCount + ' 个单词</span>' +
              '</div>' +
              '<div class="trans-detail-analysis-item">' +
                '<span class="analysis-label">难度</span>' +
                '<span class="analysis-value" style="color:' + diff.color + '">' + diff.label + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          // 词汇拆解
          (diff.wordCount > 1 ?
          '<div class="writing-detail-section">' +
            '<div class="writing-detail-section-title">词汇拆解</div>' +
            '<div class="trans-detail-words">' + wordChipsHtml + '</div>' +
          '</div>' : '') +
          // 使用场景
          '<div class="writing-detail-section">' +
            '<div class="writing-detail-section-title">使用场景</div>' +
            '<div class="sent-usage-tip">' +
              '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>' +
              ' ' + C.esc(usage) +
            '</div>' +
          '</div>' +
          // 备考提示（与翻译热词一致）
          '<div class="writing-detail-section">' +
            '<div class="writing-detail-section-title">备考提示</div>' +
            '<div class="trans-detail-tip-box">' +
              '<p>这是四六级写作高频句型，建议背诵后灵活运用到作文中。</p>' +
              '<p>' + C.esc(writingTip) + '</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    requestAnimationFrame(function() { overlay.classList.add('visible'); });

    // 点击遮罩关闭
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        overlay.classList.remove('visible');
        setTimeout(function() { overlay.remove(); }, 250);
      }
    });
    // ESC 关闭
    function onEsc(e) {
      if (e.key === 'Escape') {
        overlay.classList.remove('visible');
        setTimeout(function() { overlay.remove(); }, 250);
        document.removeEventListener('keydown', onEsc);
      }
    }
    document.addEventListener('keydown', onEsc);
  }

  // 谚语主题标签
  var proverbTags = [
    '行动', '辩证', '方法', '态度', '辩证', '细节', '毅力', '学习', '力量', '毅力'
  ];

  function renderProverbs() {
    const container = C.$('writing-content');
    if (!container) return;

    let html = '<div class="writing-proverbs">';

    WRITING_DATA.proverbs.forEach(function(item, idx) {
      var tag = proverbTags[idx] || '哲理';

      html +=
        '<div class="writing-proverb-card" data-pidx="' + idx + '">' +
          '<div class="writing-proverb-accent"></div>' +
          '<div class="writing-proverb-preview">' +
            '<div class="writing-proverb-header">' +
              '<div class="writing-proverb-header-left">' +
                '<span class="writing-proverb-idx">' + (idx + 1) + '</span>' +
                '<span class="writing-proverb-tag">' + tag + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="writing-proverb-zh">' + C.esc(item.zh) + '</div>' +
            '<div class="writing-proverb-divider"></div>' +
            '<div class="writing-proverb-en">' + C.esc(item.en) + '</div>' +
          '</div>' +
        '</div>';
    });

    html += '</div>';
    container.innerHTML = html;

    // 绑定卡片点击 → 弹窗
    container.querySelectorAll('.writing-proverb-card').forEach(function(card) {
      card.onclick = function() {
        var idx = parseInt(card.dataset.pidx);
        showProverbDetail(idx);
      };
    });
  }

  function showProverbDetail(idx) {
    var item = WRITING_DATA.proverbs[idx];
    if (!item) return;

    // 移除已有弹窗
    var existing = document.querySelector('.writing-detail-overlay');
    if (existing) existing.remove();

    var tag = proverbTags[idx] || '哲理';
    var usage = proverbUsages[idx] || '适用于写作议论段落';
    var grammarStructure = analyzeProverbGrammar(item.en);
    var escapedEn = item.en.replace(/'/g, "\\'");

    // 短语/句型类型推断
    var ptype = inferSentenceType(item.en);
    // 词汇难度分析
    var diff = analyzeWordDifficulty(item.en);

    // 语法结构分析 HTML
    var structureHtml = '';
    grammarStructure.forEach(function(s) {
      structureHtml +=
        '<div class="proverb-grammar-item">' +
          '<span class="proverb-grammar-label" style="color:' + s.color + '">' + C.esc(s.label) + '</span>' +
          '<span class="proverb-grammar-text">' + C.esc(s.text) + '</span>' +
        '</div>';
    });

    // 关键词拆解
    var keywords = item.en.replace(/[.,!?;:'"]/g, '').split(/\s+/).filter(function(w) { return w.length >= 4; });
    var keywordHtml = '';
    keywords.forEach(function(w) {
      keywordHtml += '<span class="proverb-keyword">' + C.esc(w) + '</span>';
    });

    // 词汇拆解 chips
    var wordChipsHtml = '';
    if (diff.wordCount > 1) {
      diff.words.forEach(function(w) {
        if (w.length > 0) wordChipsHtml += '<span class="trans-detail-word-chip">' + C.esc(w) + '</span>';
      });
    }

    var overlay = document.createElement('div');
    overlay.className = 'writing-detail-overlay';
    overlay.innerHTML =
      '<div class="writing-detail-modal">' +
        '<button class="writing-detail-close" onclick="this.closest(\'.writing-detail-overlay\').remove()">&times;</button>' +
        '<div class="writing-detail-header writing-detail-header--proverb">' +
          '<div class="writing-detail-badge">' +
            '<span class="writing-proverb-idx">' + (idx + 1) + '</span>' +
            '<span class="writing-proverb-tag">' + tag + '</span>' +
          '</div>' +
          '<div class="writing-detail-zh writing-detail-zh--proverb">' + C.esc(item.zh) + '</div>' +
          '<div class="writing-detail-divider writing-detail-divider--proverb"></div>' +
          '<div class="writing-detail-en writing-detail-en--proverb">' + C.esc(item.en) + '</div>' +
          '<div class="writing-detail-speak-row">' +
            '<button class="word-detail-speak-btn" onclick="event.stopPropagation();window._C.speak(\'' + escapedEn + '\',\'us\')" title="美式发音">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>' +
              ' 美式' +
            '</button>' +
            '<button class="word-detail-speak-btn" onclick="event.stopPropagation();window._C.speak(\'' + escapedEn + '\',\'uk\')" title="英式发音">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>' +
              ' 英式' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="writing-detail-body">' +
          // 语法结构
          '<div class="writing-detail-section">' +
            '<div class="writing-detail-section-title">语法结构</div>' +
            '<div class="proverb-grammar-section">' +
              structureHtml +
            '</div>' +
          '</div>' +
          // 短语分析（与翻译热词一致）
          '<div class="writing-detail-section">' +
            '<div class="writing-detail-section-title">短语分析</div>' +
            '<div class="trans-detail-analysis">' +
              '<div class="trans-detail-analysis-item">' +
                '<span class="analysis-label">类型</span>' +
                '<span class="analysis-value">' + C.esc(ptype.label) + ' (' + C.esc(ptype.tag) + ')</span>' +
              '</div>' +
              '<div class="trans-detail-analysis-item">' +
                '<span class="analysis-label">词数</span>' +
                '<span class="analysis-value">' + diff.wordCount + ' 个单词</span>' +
              '</div>' +
              '<div class="trans-detail-analysis-item">' +
                '<span class="analysis-label">难度</span>' +
                '<span class="analysis-value" style="color:' + diff.color + '">' + diff.label + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          // 词汇拆解
          (diff.wordCount > 1 ?
          '<div class="writing-detail-section">' +
            '<div class="writing-detail-section-title">词汇拆解</div>' +
            '<div class="trans-detail-words">' + wordChipsHtml + '</div>' +
          '</div>' : '') +
          // 关键词
          (keywords.length > 0 ?
            '<div class="writing-detail-section">' +
              '<div class="writing-detail-section-title">关键词</div>' +
              '<div class="proverb-keywords-row">' + keywordHtml + '</div>' +
            '</div>' : '') +
          // 使用场景
          '<div class="writing-detail-section">' +
            '<div class="writing-detail-section-title">使用场景</div>' +
            '<div class="proverb-usage-tip">' +
              '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>' +
              ' ' + C.esc(usage) +
            '</div>' +
          '</div>' +
          // 备考提示（与翻译热词一致）
          '<div class="writing-detail-section">' +
            '<div class="writing-detail-section-title">备考提示</div>' +
            '<div class="trans-detail-tip-box">' +
              '<p>四六级写作中常用的经典谚语，建议整句背诵。</p>' +
              '<p>' + C.esc(usage) + '，在作文中引用可增强文章说服力。</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    requestAnimationFrame(function() { overlay.classList.add('visible'); });

    // 点击遮罩关闭
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        overlay.classList.remove('visible');
        setTimeout(function() { overlay.remove(); }, 250);
      }
    });
    // ESC 关闭
    function onEsc(e) {
      if (e.key === 'Escape') {
        overlay.classList.remove('visible');
        setTimeout(function() { overlay.remove(); }, 250);
        document.removeEventListener('keydown', onEsc);
      }
    }
    document.addEventListener('keydown', onEsc);
  }

  function copyTemplate(tplId) {
    const tpl = WRITING_DATA.templates.find(t => t.id === tplId);
    if (!tpl) return;
    var text = tpl.content;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() {
        C.toast('模板已复制到剪贴板', 'success');
      }).catch(function() {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      C.toast('模板已复制到剪贴板', 'success');
    } catch { C.toast('复制失败，请手动复制', 'error'); }
    ta.remove();
  }

  // 注册
  C.renderWriting = renderWriting;
  C.copyTemplate = copyTemplate;
})();
