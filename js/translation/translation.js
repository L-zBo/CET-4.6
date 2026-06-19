// ========== Ace-The-CET — 翻译热词模块 (translation.js) ==========
(function() {
  'use strict';
  const C = window._C;

  let currentCat = 'all';
  let currentMode = 'browse'; // browse | quiz
  let quizItems = [];
  let quizIdx = 0;
  let quizScore = { correct: 0, total: 0 };
  let showingAnswer = false;

  // 短语类型自动推断
  function inferPhraseType(en) {
    const lower = en.toLowerCase().trim();
    if (/^to\s/.test(lower)) return { tag: 'VP', label: '动词短语' };
    if (/^(is|are|was|were|be)\s/.test(lower)) return { tag: 'VP', label: '动词短语' };
    if (/\b(do|make|take|get|put|give|have|keep|set|go|come|run|bring|hold|carry)\b/.test(lower) && lower.split(' ').length <= 5) return { tag: 'VP', label: '动词短语' };
    if (/^(the|a|an)\s/.test(lower) || /^[a-z]+(tion|ment|ness|ity|ism|ance|ence|ing|ure)\b/.test(lower)) return { tag: 'NP', label: '名词短语' };
    if (/^(very|quite|rather|highly|extremely)\s/.test(lower) || /^[a-z]+(ous|ive|ful|less|able|ible|al|ial|ic|ent|ant)\b/.test(lower)) return { tag: 'AdjP', label: '形容词短语' };
    if (lower.split(' ').length <= 3 && /^[a-z]+$/.test(lower.replace(/\s+/g, ''))) return { tag: 'NP', label: '名词短语' };
    if (lower.split(' ').length >= 6) return { tag: 'S', label: '句型' };
    return { tag: 'PHR', label: '短语' };
  }

  // 应用场景提示
  function getTip(category) {
    var tips = {
      '中国文化概述': '适用于文化类翻译段落',
      '中国历史': '适用于历史与传统题材',
      '中国经济': '适用于经济发展类话题',
      '中国社会': '适用于社会现象类翻译',
      '中国教育': '适用于教育改革类题材',
      '中国科技': '适用于科技创新类段落',
      '中国环境': '适用于生态环保类翻译',
      '中国饮食': '适用于饮食文化类话题',
      '中国旅游': '适用于旅游地理类翻译',
      '中国节日': '适用于传统节日类题材'
    };
    return tips[category] || '四六级翻译高频词汇';
  }

  function renderTranslation() {
    var container = C.$('translation-content');
    if (!container) return;
    renderCategoryTabs();
    if (currentMode === 'browse') {
      renderBrowseMode();
    } else {
      renderQuizMode();
    }
  }

  function renderCategoryTabs() {
    var tabs = C.$('translation-tabs');
    if (!tabs) return;
    tabs.innerHTML = '';

    // 模式切换
    var modeBar = document.createElement('div');
    modeBar.className = 'trans-mode-bar';
    modeBar.innerHTML =
      '<button class="trans-mode-btn' + (currentMode === 'browse' ? ' active' : '') + '" data-mode="browse">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>' +
        ' 浏览' +
      '</button>' +
      '<button class="trans-mode-btn' + (currentMode === 'quiz' ? ' active' : '') + '" data-mode="quiz">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' +
        ' 测验' +
      '</button>';
    tabs.appendChild(modeBar);

    modeBar.querySelectorAll('.trans-mode-btn').forEach(function(btn) {
      btn.onclick = function() {
        currentMode = btn.dataset.mode;
        if (currentMode === 'quiz') startQuiz();
        renderTranslation();
      };
    });

    // 分类选择
    var catBar = document.createElement('div');
    catBar.className = 'trans-cat-bar';

    var allBtn = document.createElement('button');
    allBtn.className = 'trans-cat-btn' + (currentCat === 'all' ? ' active' : '');
    allBtn.textContent = '全部';
    allBtn.onclick = function() { currentCat = 'all'; renderTranslation(); };
    catBar.appendChild(allBtn);

    if (typeof TRANSLATION_DATA !== 'undefined') {
      TRANSLATION_DATA.forEach(function(cat) {
        var btn = document.createElement('button');
        btn.className = 'trans-cat-btn' + (currentCat === cat.id ? ' active' : '');
        btn.textContent = cat.title;
        btn.onclick = function() { currentCat = cat.id; renderTranslation(); };
        catBar.appendChild(btn);
      });
    }
    tabs.appendChild(catBar);
  }

  function getItems() {
    if (typeof TRANSLATION_DATA === 'undefined') return [];
    if (currentCat === 'all') {
      var all = [];
      TRANSLATION_DATA.forEach(function(cat) {
        cat.items.forEach(function(item) { all.push({ zh: item.zh, en: item.en, category: cat.title }); });
      });
      return all;
    }
    var cat = TRANSLATION_DATA.find(function(c) { return c.id === currentCat; });
    return cat ? cat.items.map(function(item) { return { zh: item.zh, en: item.en, category: cat.title }; }) : [];
  }

  // 缓存当前浏览列表供详情面板使用
  var browseItems = [];

  function renderBrowseMode() {
    var container = C.$('translation-content');
    if (!container) return;

    var items = getItems();
    browseItems = items;

    // === 每日推送：用日期种子选 5 条精选 ===
    var dailyHtml = renderDailyPush(items, 'trans');

    var html = dailyHtml + '<div class="trans-browse-grid">';

    items.forEach(function(item, idx) {
      var ptype = inferPhraseType(item.en);
      var tip = getTip(item.category);

      html +=
        '<div class="trans-card" data-idx="' + idx + '">' +
          // 顶部彩色渐变条
          '<div class="trans-card-accent"></div>' +
          // 头部：序号 + 短语类型 + 分类
          '<div class="trans-card-header">' +
            '<div class="trans-card-header-left">' +
              '<span class="trans-card-idx">' + (idx + 1) + '</span>' +
              '<span class="trans-card-type">' + ptype.tag + '</span>' +
              '<span class="trans-card-cat">' + C.esc(item.category) + '</span>' +
            '</div>' +
          '</div>' +
          // 内容：中文释义
          '<div class="trans-card-body">' +
            '<div class="trans-zh">' + C.esc(item.zh) + '</div>' +
            '<div class="trans-card-divider"></div>' +
            // 英文 + 词性标注
            '<div class="trans-en-row">' +
              '<span class="trans-en">' + C.esc(item.en) + '</span>' +
              '<span class="trans-ptype-label">' + C.esc(ptype.label) + '</span>' +
            '</div>' +
            // 发音按钮行（用 data 属性 + 事件委托，避免内联 onclick 字符串拼接的转义陷阱）
            '<div class="trans-card-speak-row">' +
              '<button class="trans-card-speak-btn" data-action="speak" data-accent="us" data-idx="' + idx + '" title="美式发音">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>' +
                ' 美式' +
              '</button>' +
              '<button class="trans-card-speak-btn" data-action="speak" data-accent="uk" data-idx="' + idx + '" title="英式发音">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>' +
                ' 英式' +
              '</button>' +
            '</div>' +
          '</div>' +
          // 底部：使用提示
          '<div class="trans-card-footer">' +
            '<span class="trans-card-tip">' + tip + '</span>' +
            '<span class="trans-card-click-hint">点击查看详情 →</span>' +
          '</div>' +
        '</div>';
    });

    html += '</div>';
    container.innerHTML = html;

    // 绑定卡片点击事件（事件委托）
    container.querySelector('.trans-browse-grid').addEventListener('click', function(e) {
      // 优先处理朗读按钮
      var speakBtn = e.target.closest('[data-action="speak"]');
      if (speakBtn) {
        e.stopPropagation();
        var sIdx = parseInt(speakBtn.dataset.idx, 10);
        if (!isNaN(sIdx) && browseItems[sIdx]) {
          C.speak(browseItems[sIdx].en, speakBtn.dataset.accent);
        }
        return;
      }
      var card = e.target.closest('.trans-card');
      if (!card) return;
      var idx = parseInt(card.dataset.idx, 10);
      if (!isNaN(idx) && browseItems[idx]) {
        showTransDetail(browseItems[idx], idx);
      }
    });
  }

  // ========== 翻译热词详情弹窗 ==========
  function showTransDetail(item, idx) {
    // 移除已有弹窗
    document.querySelectorAll('.trans-detail-overlay').forEach(function(el) { el.remove(); });

    var ptype = inferPhraseType(item.en);
    var tip = getTip(item.category);
    var words = item.en.split(/\s+/);
    var wordCount = words.length;

    // 单词难度分析
    var longWords = words.filter(function(w) { return w.replace(/[^a-zA-Z]/g, '').length >= 7; });
    var difficultyLabel = longWords.length >= 3 ? '较高' : longWords.length >= 1 ? '中等' : '基础';
    var difficultyColor = longWords.length >= 3 ? 'var(--coral)' : longWords.length >= 1 ? 'var(--amber)' : 'var(--emerald)';

    var overlay = document.createElement('div');
    overlay.className = 'trans-detail-overlay';

    overlay.innerHTML =
      '<div class="trans-detail-modal">' +
        '<div class="trans-detail-header">' +
          '<button class="word-detail-close" data-action="close">\u2715</button>' +
          '<span class="trans-detail-badge">' + C.esc(ptype.tag) + ' \u00b7 ' + C.esc(ptype.label) + '</span>' +
          '<div class="trans-detail-zh">' + C.esc(item.zh) + '</div>' +
          '<div class="trans-detail-en">' + C.esc(item.en) + '</div>' +
          '<div class="trans-detail-speak-row">' +
            '<button class="word-detail-speak-btn" data-action="speak" data-accent="us">\ud83d\udd0a \u7f8e\u5f0f</button>' +
            '<button class="word-detail-speak-btn" data-action="speak" data-accent="uk">\ud83d\udd0a \u82f1\u5f0f</button>' +
          '</div>' +
        '</div>' +
        '<div class="trans-detail-body">' +
          // 分类与场景
          '<div class="word-detail-section">' +
            '<div class="word-detail-section-title">\ud83c\udff7\ufe0f \u5206\u7c7b\u4e0e\u573a\u666f</div>' +
            '<div class="trans-detail-tags">' +
              '<span class="trans-detail-tag cat">' + C.esc(item.category) + '</span>' +
              '<span class="trans-detail-tag tip">' + C.esc(tip) + '</span>' +
            '</div>' +
          '</div>' +
          // 短语分析
          '<div class="word-detail-section">' +
            '<div class="word-detail-section-title">\ud83d\udd0d \u77ed\u8bed\u5206\u6790</div>' +
            '<div class="trans-detail-analysis">' +
              '<div class="trans-detail-analysis-item">' +
                '<span class="analysis-label">\u7c7b\u578b</span>' +
                '<span class="analysis-value">' + C.esc(ptype.label) + ' (' + C.esc(ptype.tag) + ')</span>' +
              '</div>' +
              '<div class="trans-detail-analysis-item">' +
                '<span class="analysis-label">\u8bcd\u6570</span>' +
                '<span class="analysis-value">' + wordCount + ' \u4e2a\u5355\u8bcd</span>' +
              '</div>' +
              '<div class="trans-detail-analysis-item">' +
                '<span class="analysis-label">\u96be\u5ea6</span>' +
                '<span class="analysis-value" style="color:' + difficultyColor + '">' + difficultyLabel + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          // 单词拆分
          (wordCount > 1 ?
          '<div class="word-detail-section">' +
            '<div class="word-detail-section-title">\ud83d\udcdd \u5355\u8bcd\u62c6\u5206</div>' +
            '<div class="trans-detail-words">' +
              words.map(function(w, i) {
                return '<span class="trans-detail-word-chip">' + C.esc(w) + '</span>';
              }).join('') +
            '</div>' +
          '</div>' : '') +
          // 用法提示
          '<div class="word-detail-section">' +
            '<div class="word-detail-section-title">\ud83d\udca1 \u5907\u8003\u63d0\u793a</div>' +
            '<div class="trans-detail-tip-box">' +
              '<p>\u8fd9\u662f\u56db\u516d\u7ea7\u7ffb\u8bd1\u9ad8\u9891\u70ed\u8bcd\uff0c\u5efa\u8bae\u53cd\u590d\u6717\u8bfb\u5e76\u5728\u5199\u4f5c\u4e2d\u4e3b\u52a8\u4f7f\u7528\u3002</p>' +
              '<p>' + C.esc(tip) + '\uff0c\u7ec3\u4e60\u65f6\u53ef\u5c1d\u8bd5\u7528\u6b64\u77ed\u8bed\u9020\u53e5\u3002</p>' +
            '</div>' +
          '</div>' +
          // 导航
          '<div class="trans-detail-nav">' +
            (idx > 0 ? '<button class="btn btn-ghost trans-detail-nav-btn" data-action="prev">\u2190 \u4e0a\u4e00\u4e2a</button>' : '<span></span>') +
            '<span class="trans-detail-nav-num">' + (idx + 1) + ' / ' + browseItems.length + '</span>' +
            (idx < browseItems.length - 1 ? '<button class="btn btn-ghost trans-detail-nav-btn" data-action="next">\u4e0b\u4e00\u4e2a \u2192</button>' : '<span></span>') +
          '</div>' +
        '</div>' +
      '</div>';

    // 事件委托
    overlay.addEventListener('click', function(e) {
      var closeBtn = e.target.closest('[data-action="close"]');
      if (closeBtn) { overlay.remove(); return; }

      var speakBtn = e.target.closest('[data-action="speak"]');
      if (speakBtn) {
        C.speak(item.en, speakBtn.dataset.accent);
        return;
      }

      var prevBtn = e.target.closest('[data-action="prev"]');
      if (prevBtn && idx > 0) {
        overlay.remove();
        showTransDetail(browseItems[idx - 1], idx - 1);
        return;
      }

      var nextBtn = e.target.closest('[data-action="next"]');
      if (nextBtn && idx < browseItems.length - 1) {
        overlay.remove();
        showTransDetail(browseItems[idx + 1], idx + 1);
        return;
      }

      // 点击遮罩关闭
      if (e.target === overlay) { cleanup(); overlay.remove(); }
    });

    document.body.appendChild(overlay);

    // 主题色
    var modal = overlay.querySelector('.trans-detail-modal');
    if (modal && C.applyCardTheme) C.applyCardTheme(modal);

    // 统一清理函数
    function cleanup() {
      document.removeEventListener('keydown', escHandler);
      document.removeEventListener('keydown', arrowHandler);
    }

    // ESC 关闭
    var escHandler = function(e) {
      if (e.key === 'Escape') {
        cleanup();
        overlay.remove();
      }
    };
    document.addEventListener('keydown', escHandler);

    // 左右箭头切换
    var arrowHandler = function(e) {
      if (!document.body.contains(overlay)) {
        cleanup();
        return;
      }
      if (e.key === 'ArrowLeft' && idx > 0) {
        cleanup();
        overlay.remove();
        showTransDetail(browseItems[idx - 1], idx - 1);
      } else if (e.key === 'ArrowRight' && idx < browseItems.length - 1) {
        cleanup();
        overlay.remove();
        showTransDetail(browseItems[idx + 1], idx + 1);
      }
    };
    document.addEventListener('keydown', arrowHandler);
  }

  function startQuiz() {
    var items = getItems();
    var shuffled = items.slice();
    C.shuffle(shuffled);
    quizItems = shuffled.slice(0, Math.min(20, shuffled.length));
    quizIdx = 0;
    quizScore = { correct: 0, total: 0 };
    showingAnswer = false;
  }

  function renderQuizMode() {
    var container = C.$('translation-content');
    if (!container) return;

    if (quizItems.length === 0) {
      startQuiz();
    }

    if (quizIdx >= quizItems.length) {
      var pct = quizScore.total > 0 ? Math.round(quizScore.correct / quizScore.total * 100) : 0;
      container.innerHTML =
        '<div class="trans-quiz-result">' +
          '<div class="trans-quiz-result-icon">' + (pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '💪') + '</div>' +
          '<h3>测验完成！</h3>' +
          '<div class="trans-quiz-score">' +
            '<span class="score-num">' + quizScore.correct + '</span> / <span class="score-total">' + quizScore.total + '</span>' +
          '</div>' +
          '<div class="trans-quiz-pct">正确率 ' + pct + '%</div>' +
          '<button class="btn btn-primary" onclick="window._C.restartTransQuiz()">重新测验</button>' +
        '</div>';
      return;
    }

    var item = quizItems[quizIdx];
    var progress = (quizIdx + 1) + ' / ' + quizItems.length;

    var html =
      '<div class="trans-quiz-container">' +
        '<div class="trans-quiz-progress">' +
          '<div class="trans-quiz-progress-bar" style="width:' + ((quizIdx + 1) / quizItems.length * 100) + '%"></div>' +
        '</div>' +
        '<div class="trans-quiz-num">' + progress + '</div>' +
        '<div class="trans-quiz-card">' +
          '<div class="trans-quiz-question">' +
            '<div class="trans-quiz-label">请翻译：</div>' +
            '<div class="trans-quiz-zh">' + C.esc(item.zh) + '</div>' +
          '</div>';

    if (showingAnswer) {
      html +=
          '<div class="trans-quiz-answer">' +
            '<div class="trans-quiz-label">参考翻译：</div>' +
            '<div class="trans-quiz-en">' + C.esc(item.en) + '</div>' +
          '</div>' +
          '<div class="trans-quiz-buttons">' +
            '<button class="btn btn-outline trans-quiz-btn wrong" onclick="window._C.transQuizAnswer(false)">没答对</button>' +
            '<button class="btn btn-primary trans-quiz-btn right" onclick="window._C.transQuizAnswer(true)">答对了</button>' +
          '</div>';
    } else {
      html +=
          '<div class="trans-quiz-reveal">' +
            '<button class="btn btn-primary" onclick="window._C.transQuizReveal()">显示答案</button>' +
          '</div>';
    }

    html += '</div></div>';
    container.innerHTML = html;
  }

  function transQuizReveal() {
    showingAnswer = true;
    renderQuizMode();
  }

  function transQuizAnswer(correct) {
    quizScore.total++;
    if (correct) quizScore.correct++;
    quizIdx++;
    showingAnswer = false;
    renderQuizMode();
  }

  function restartTransQuiz() {
    startQuiz();
    renderQuizMode();
  }

  // ========== 每日推送 ==========
  // 用当天日期做种子从数据中选出每日精选项
  function dailySeed() {
    var d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  function seededShuffle(arr, seed) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      seed = (seed * 9301 + 49297) % 233280;
      var j = seed % (i + 1);
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function renderDailyPush(items, type) {
    if (!items || items.length === 0) return '';
    var count = Math.min(5, items.length);
    var picked = seededShuffle(items, dailySeed()).slice(0, count);
    var title = type === 'trans' ? '今日精选热词' : '今日精选句型';

    var html = '<div class="daily-push-section">';
    html += '<div class="daily-push-header">';
    html += '<span class="daily-push-icon">&#x1f4e2;</span>';
    html += '<span class="daily-push-title">' + title + '</span>';
    html += '<span class="daily-push-date">' + (new Date().getMonth() + 1) + '/' + new Date().getDate() + ' 每日推送</span>';
    html += '</div>';
    html += '<div class="daily-push-cards">';
    picked.forEach(function(item) {
      var escapedEn = item.en.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      html +=
        '<div class="daily-push-card">' +
          '<div class="daily-push-zh">' + C.esc(item.zh) + '</div>' +
          '<div class="daily-push-en">' + C.esc(item.en) + '</div>' +
          '<button class="daily-push-speak" onclick="event.stopPropagation();window._C.speak(\'' + escapedEn + '\',\'us\')" title="朗读">' +
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>' +
          '</button>' +
        '</div>';
    });
    html += '</div></div>';
    return html;
  }

  // 注册
  C.renderTranslation = renderTranslation;
  C.renderDailyPush = renderDailyPush;
  C.transQuizReveal = transQuizReveal;
  C.transQuizAnswer = transQuizAnswer;
  C.restartTransQuiz = restartTransQuiz;
})();
