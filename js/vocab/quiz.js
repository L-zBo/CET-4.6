// ========== CET 词汇大师 — 测验模块 (quiz.js) ==========
// 测验、错题本、数据导入导出
(function() {
  'use strict';
  const C = window._C;

  // ====== 测验进度保存/恢复 ======
  function quizKey() { return 'cet_quiz_' + C.currentLevel; }

  function saveQuizProgress() {
    if (!C.quizQuestions || C.quizQuestions.length === 0) return;
    const data = {
      questions: C.quizQuestions,
      idx: C.quizIdx,
      correct: C.quizCorrect,
      wrong: C.quizWrong,
      date: C.todayStr
    };
    localStorage.setItem(quizKey(), JSON.stringify(data));
  }

  function loadQuizProgress() {
    try {
      const raw = localStorage.getItem(quizKey());
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function clearQuizProgress() {
    localStorage.removeItem(quizKey());
  }

  function showQuizSetup() {
    C.show('quiz-setup'); C.hide('quiz-area'); C.hide('quiz-result');
    // 同步每日目标到测验题数
    const goal = C.settings.dailyGoal;
    syncSelectValue('quiz-count', goal);
    // 给自定义测验卡片加彩色主题
    const card = document.querySelector('.quiz-setup-card');
    if (card) C.applyCardTheme(card);

    // 检查是否有未完成的测验进度
    const saved = loadQuizProgress();
    const resumeBtn = C.$('quiz-resume-btn');
    const startBtn = C.$('quiz-start-btn');
    if (saved && saved.date === C.todayStr && saved.idx < saved.questions.length) {
      if (startBtn) startBtn.textContent = '重新开始测验';
      if (resumeBtn) {
        resumeBtn.style.display = '';
        resumeBtn.textContent = '继续上次测验（第 ' + (saved.idx + 1) + ' / ' + saved.questions.length + ' 题）';
        resumeBtn.onclick = resumeQuiz;
      }
    } else {
      if (startBtn) startBtn.textContent = '开始测验';
      if (resumeBtn) resumeBtn.style.display = 'none';
      clearQuizProgress();
    }
  }

  function resumeQuiz() {
    const saved = loadQuizProgress();
    if (!saved) { C.toast('没有可恢复的进度', 'info'); return; }

    C.quizQuestions = saved.questions;
    C.quizIdx = saved.idx;
    C.quizCorrect = saved.correct;
    C.quizWrong = saved.wrong;
    C.quizAnswered = false;

    C.hide('quiz-setup'); C.show('quiz-area'); C.hide('quiz-result');
    C.text('quiz-total', C.quizQuestions.length);
    renderQuestion();
    C.toast('已恢复测验进度', 'success');
  }

  function backToQuizSetup() {
    // 中途退出测验，保存进度
    saveQuizProgress();
    C.toast('测验进度已保存', 'info');
    showQuizSetup();
  }

  // ====== 干扰项智能生成算法 ======

  // 从 meaning 字段提取主词性（v./n./adj./adv./prep./conj./pron.）
  function extractPOS(meaning) {
    const m = meaning.match(/^((?:v|n|adj|adv|prep|conj|pron|num|art|int|vi|vt|aux)\.)/) ;
    return m ? m[1] : '';
  }

  // 提取中文释义关键词用于同义检测
  function extractMeaningKeywords(meaning) {
    const clean = meaning.replace(/^[a-z]+\.\s*/, '').replace(/[（(][^）)]*[）)]/g, '');
    // 按常见分隔符拆分
    return clean.split(/[；;，,、\s]+/).filter(s => s.length >= 2);
  }

  // 检测两个释义是否语义过于相似（共享关键词过多）
  function isMeaningSimilar(m1, m2) {
    const kw1 = extractMeaningKeywords(m1);
    const kw2 = extractMeaningKeywords(m2);
    if (kw1.length === 0 || kw2.length === 0) return false;
    let overlap = 0;
    for (const k of kw1) {
      if (kw2.some(k2 => k2.includes(k) || k.includes(k2))) overlap++;
    }
    // 如果超过一半的关键词重叠，认为太相似
    return overlap >= Math.max(1, Math.min(kw1.length, kw2.length) * 0.5);
  }

  // 简易编辑距离（Levenshtein），限制最大计算长度防止性能问题
  function editDist(a, b) {
    if (a === b) return 0;
    const la = a.length, lb = b.length;
    if (la === 0) return lb;
    if (lb === 0) return la;
    // 限制过长的单词，直接用长度差近似
    if (la > 20 || lb > 20) return Math.abs(la - lb);
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

  // 计算单词拼写相似度得分（0~1, 越高越相似）
  function spellSimilarity(a, b) {
    const al = a.toLowerCase(), bl = b.toLowerCase();
    const ed = editDist(al, bl);
    const maxLen = Math.max(al.length, bl.length);
    if (maxLen === 0) return 0;
    // 基础编辑距离得分
    let score = 1 - ed / maxLen;
    // 共享前缀奖励（如 affect/effect, think/thank）
    let prefix = 0;
    for (let i = 0; i < Math.min(al.length, bl.length); i++) {
      if (al[i] === bl[i]) prefix++; else break;
    }
    if (prefix >= 2) score += prefix * 0.05;
    // 共享后缀奖励（如 -tion, -ment, -able）
    let suffix = 0;
    for (let i = 1; i <= Math.min(al.length, bl.length); i++) {
      if (al[al.length - i] === bl[bl.length - i]) suffix++; else break;
    }
    if (suffix >= 3) score += suffix * 0.04;
    // 长度接近奖励
    const lenDiff = Math.abs(al.length - bl.length);
    if (lenDiff <= 1) score += 0.15;
    else if (lenDiff <= 2) score += 0.08;
    return score;
  }

  /**
   * 为给定单词挑选高质量干扰项
   * @param {object} w - 正确单词对象
   * @param {string} qt - 题型 'en2cn' | 'cn2en'
   * @param {number} n - 需要的干扰项数量
   */
  function pickDistractors(w, qt, n) {
    const wPOS = extractPOS(w.meaning);
    const wMeanClean = w.meaning.replace(/^[a-z]+\.\s*/, '');

    // 基础过滤：排除自身 + 释义过于相似（避免同义选项造成混淆）
    const candidates = C.words.filter(x => {
      if (x.word === w.word) return false;
      // 排除释义语义相似的（包括 en2cn 和 cn2en 模式）
      if (isMeaningSimilar(w.meaning, x.meaning)) return false;
      // en2cn 模式额外排除释义前缀完全一致的
      if (qt === 'en2cn') {
        const b = x.meaning.replace(/^[a-z]+\.\s*/, '');
        if (wMeanClean.substring(0, 4) === b.substring(0, 4) && wMeanClean.substring(0, 4).length >= 2) return false;
      }
      return true;
    });

    // 给每个候选项打分
    const scored = candidates.map(x => {
      let score = 0;
      const xPOS = extractPOS(x.meaning);

      // 词性一致大幅加分
      if (wPOS && xPOS && wPOS === xPOS) score += 50;
      // 词性都为空（多义词）也给小分
      else if (!wPOS && !xPOS) score += 10;

      if (qt === 'cn2en') {
        // 中译英模式：拼写相似度是关键（让选项混淆度高）
        const sim = spellSimilarity(w.word, x.word);
        score += sim * 100;
      } else {
        // 英译中模式：释义要有区分度但不能太离谱
        // 长度接近的释义加分
        const lenDiff = Math.abs(w.meaning.length - x.meaning.length);
        if (lenDiff <= 4) score += 15;
        else if (lenDiff <= 8) score += 8;
        // 单词拼写也给一定权重，选相近的词让用户容易混淆
        const sim = spellSimilarity(w.word, x.word);
        score += sim * 30;
      }

      return { word: x, score };
    });

    // 按分数降序排列
    scored.sort((a, b) => b.score - a.score);

    // 从 Top 候选中随机挑选（避免总是同一批干扰项）
    // 取前 max(n*4, 12) 个高分候选，从中随机选 n 个
    const topK = Math.max(n * 4, 12);
    const topCandidates = scored.slice(0, Math.min(topK, scored.length));
    C.shuffle(topCandidates);
    return topCandidates.slice(0, n).map(s => s.word);
  }

  function startQuiz() {
    const count = parseInt(C.$('quiz-count')?.value || '20');
    const type = C.$('quiz-type')?.value || 'en2cn';
    const range = C.$('quiz-range')?.value || 'all';

    let pool;
    switch (range) {
      case 'daily': pool = C.getDailyPlanWords(); break;
      case 'high': pool = C.words.filter(w => w.freq === 'high'); break;
      case 'new': pool = C.words.filter(w => C.status(w.word) === 'new'); break;
      case 'learning': pool = C.words.filter(w => C.status(w.word) === 'learning'); break;
      case 'wrong': pool = C.words.filter(w => C.notebook[w.word]); break;
      default: pool = [...C.words];
    }

    if (pool.length < 4) {
      C.toast('可选单词不足4个，请更换范围', 'error');
      return;
    }

    clearQuizProgress();
    C.shuffle(pool);
    // 每日计划模式使用完整词表（与闪卡/拼写保持一致），其他模式按题数截断
    const selected = range === 'daily' ? pool : pool.slice(0, Math.min(count, pool.length));

    C.quizQuestions = selected.map(w => {
      const qt = type === 'mixed' ? (Math.random() > 0.5 ? 'en2cn' : 'cn2en') : type;

      const dist = pickDistractors(w, qt, 3);

      let question, correct, choices;
      if (qt === 'en2cn') {
        question = w.word;
        correct = w.meaning;
        choices = [w, ...dist].map(x => ({ text: x.meaning, word: x.word }));
      } else {
        question = w.meaning;
        correct = w.word;
        choices = [w, ...dist].map(x => ({ text: x.word, word: x.word }));
      }
      C.shuffle(choices);

      return { word: w.word, type: qt, question, correct, choices, wasWrong: false };
    });

    C.quizIdx = 0;
    C.quizCorrect = 0;
    C.quizWrong = 0;
    C.quizAnswered = false;

    C.hide('quiz-setup'); C.show('quiz-area'); C.hide('quiz-result');
    C.text('quiz-total', C.quizQuestions.length);
    renderQuestion();
    saveQuizProgress();
  }

  // 生成随机半透明颜色
  function randomQuizColor() {
    const hue = Math.floor(Math.random() * 360);
    return {
      bg: `hsla(${hue}, 60%, 50%, 0.08)`,
      border: `hsla(${hue}, 60%, 50%, 0.2)`,
      hoverBg: `hsla(${hue}, 60%, 50%, 0.15)`,
      hoverBorder: `hsla(${hue}, 60%, 50%, 0.4)`
    };
  }

  function renderQuestion() {
    if (C.quizIdx >= C.quizQuestions.length) {
      showQuizResult();
      return;
    }

    const q = C.quizQuestions[C.quizIdx];
    C.quizAnswered = false;

    C.text('quiz-current', C.quizIdx + 1);
    C.text('quiz-correct', C.quizCorrect);
    C.text('quiz-wrong', C.quizWrong);
    C.text('quiz-type-label', q.type === 'en2cn' ? '英译中' : '中译英');
    C.text('quiz-question', q.question);
    renderQuizMemoryTip(null);

    // 随机颜色主题应用到题目卡片
    const qCard = document.querySelector('.quiz-question-card');
    if (qCard) {
      const qColor = randomQuizColor();
      qCard.style.background = qColor.bg;
      qCard.style.borderColor = qColor.border;
    }

    const cd = C.$('quiz-choices');
    if (!cd) return;
    cd.innerHTML = '';

    q.choices.forEach((c, i) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-choice';
      btn.dataset.word = c.word;
      // 英译中模式：用带词性标签的 HTML 展示；中译英模式：纯文本
      let choiceHTML;
      if (q.type === 'en2cn') {
        const wordObj = C.words.find(x => x.word === c.word);
        choiceHTML = wordObj ? C.getDefsHTML(wordObj) : C.esc(c.text);
      } else {
        choiceHTML = C.esc(c.text);
      }
      btn.innerHTML = '<span class="choice-label">' + String.fromCharCode(65 + i) + '.</span> <span class="choice-text">' + choiceHTML + '</span>';
      btn.onclick = () => selectAnswer(btn, c.text, q);
      cd.appendChild(btn);
    });

    C.hide('quiz-next-btn');

    // 自动发音：仅 en2cn 模式（中译英时题面已经是中文，发音没意义）
    if (q.type === 'en2cn') C.autoSpeak('quiz', q.word);
  }

  function renderQuizMemoryTip(wordObj) {
    const tipEl = C.$('quiz-memory-tip');
    if (!tipEl) return;
    if (!wordObj || !C.getBestMnemonic) {
      tipEl.style.display = 'none';
      tipEl.innerHTML = '';
      return;
    }
    const tip = C.getBestMnemonic(wordObj);
    if (!tip) {
      tipEl.style.display = 'none';
      tipEl.innerHTML = '';
      return;
    }
    tipEl.style.display = '';
    tipEl.innerHTML = '<span class="mini-tip-label">精选助记</span>' + C.esc(tip);
  }

  function selectAnswer(btn, selected, q) {
    if (C.quizAnswered) return;
    C.quizAnswered = true;

    const correct = btn.dataset.word === q.word;
    btn.classList.add(correct ? 'correct' : 'wrong');

    document.querySelectorAll('.quiz-choice').forEach(b => {
      // 用 data-word 匹配正确答案，避免 textContent 比对问题
      if (b.dataset.word === q.word) b.classList.add('correct');
      b.style.pointerEvents = 'none';

      // 在英译中模式下，所有选项都追加对应英文单词标签（包括正确选项）
      if (q.type === 'en2cn' && b.dataset.word) {
        const wordTag = document.createElement('span');
        wordTag.className = 'choice-word-tag';
        wordTag.textContent = b.dataset.word;
        wordTag.style.pointerEvents = 'auto';
        wordTag.onclick = function(e) {
          e.stopPropagation();
          const w = C.words.find(x => x.word === b.dataset.word);
          if (w) C.showWordDetail(w);
        };
        b.appendChild(wordTag);
      }
    });

    // 选完答案不再强制发音（由顶部"自动发音"开关在题目出现时控制）

    if (!C.progress[q.word]) C.progress[q.word] = {};
    const p = C.progress[q.word];

    if (correct) {
      C.quizCorrect++;
      if (!p.status || p.status === 'new') p.status = 'learning';
      p.lastSeen = C.todayStr;
      if (p.reviewStage == null) {
        p.reviewStage = 0;
        p.nextReview = C.addDays(C.todayStr, C.REVIEW_INTERVALS[0]);
      }
    } else {
      C.quizWrong++;
      q.wasWrong = true;
      C.addToNotebook(q.word, '测验 - 选了"' + selected + '"');
      p.status = 'learning';
      p.lastSeen = C.todayStr;
    }

    C.recordLearn(q.word);
    C.text('quiz-correct', C.quizCorrect);
    C.text('quiz-wrong', C.quizWrong);
    C.saveData();
    const answerWord = C.words.find(x => x.word === q.word);
    renderQuizMemoryTip(answerWord);
    C.show('quiz-next-btn');
  }

  function nextQuestion() {
    C.quizIdx++;
    saveQuizProgress();
    renderQuestion();
  }

  function showQuizResult() {
    C.hide('quiz-area');
    C.show('quiz-result');
    clearQuizProgress(); // 测验完成，清除保存的进度

    const total = C.quizQuestions.length;
    const acc = total > 0 ? Math.round(C.quizCorrect / total * 100) : 0;

    if (!C.streakData.dates) C.streakData.dates = {};
    if (!C.streakData.dates[C.todayStr]) C.streakData.dates[C.todayStr] = { learned: 0, words: [] };
    const td = C.streakData.dates[C.todayStr];
    td.quizCount = (td.quizCount || 0) + total;
    td.quizCorrect = (td.quizCorrect || 0) + C.quizCorrect;
    C.incModuleCount('quiz'); // 完成一轮测验 +1
    C.saveData();

    C.text('result-score', acc);
    C.text('result-correct', C.quizCorrect);
    C.text('result-wrong-count', C.quizWrong);
    C.text('result-accuracy', acc + '%');

    let msg = '继续加油！';
    if (acc >= 90) msg = '太棒了！掌握得很好！';
    else if (acc >= 70) msg = '不错！继续保持！';
    else if (acc >= 50) msg = '还需要多加练习';
    C.text('result-msg', msg);

    const det = C.$('result-details');
    if (det) {
      const wrongs = C.quizQuestions.filter(q => q.wasWrong);
      if (wrongs.length === 0) {
        det.innerHTML = '<div class="notebook-empty">全部答对，完美！</div>';
      } else {
        det.innerHTML = '<h3 style="margin-bottom:12px">错题回顾</h3>' +
          wrongs.map(q => {
            const w = C.words.find(x => x.word === q.word);
            return '<div class="wrong-review-item">' +
              '<strong>' + C.esc(q.word) + '</strong> ' +
              '<span style="color:var(--text-muted)">' + C.esc(w?.phonetic || '') + '</span>' +
              '<div style="margin-top:4px">' + (w ? C.getDefsHTML(w) : '') + '</div>' +
            '</div>';
          }).join('');
      }
    }
    if (C.renderModuleFooter) C.renderModuleFooter('quiz', 'quiz-footer-counter');
  }

  function reviewWrongAnswers() {
    const ww = C.quizQuestions.filter(q => q.wasWrong).map(q => q.word);
    if (ww.length === 0) {
      C.toast('没有错题可复习', 'info');
      return;
    }
    C.goToPage('flashcard');
    const list = C.words.filter(w => ww.includes(w.word));
    if (C.loadFlashcardCustomSession) {
      C.loadFlashcardCustomSession(list, '测验错题', false);
    } else {
      C.flashcardList = list;
      C.flashcardIdx = 0;
      C.text('flashcard-total', C.flashcardList.length);
      C.renderFlashcard();
    }
    C.toast('已加载 ' + C.flashcardList.length + ' 个错题', 'info');
  }

  // ========== 错题本 ==========

  function renderNotebook() {
    const c = C.$('notebook-content');
    if (!c) return;

    const entries = Object.keys(C.notebook).sort((a, b) => C.notebook[b].count - C.notebook[a].count);

    if (entries.length === 0) {
      c.innerHTML =
        '<div class="notebook-empty">' +
          '<div style="font-size:3rem;margin-bottom:12px">&#128221;</div>' +
          '<div>还没有错题记录</div>' +
          '<div style="color:var(--text-muted);font-size:0.85rem;margin-top:8px">' +
            '在测验或闪卡中答错的单词会自动添加到这里</div>' +
        '</div>';
      return;
    }

    const highErr = entries.filter(w => C.notebook[w].count >= 5);
    const midErr = entries.filter(w => C.notebook[w].count >= 2 && C.notebook[w].count < 5);
    const lowErr = entries.filter(w => C.notebook[w].count === 1);

    const renderGroup = (title, icon, color, wordList, highlight) => {
      if (wordList.length === 0) return '';
      return '<div style="margin-bottom:24px">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">' +
          '<span style="font-size:1.2rem">' + icon + '</span>' +
          '<span style="font-weight:700;color:var(--' + color + ');font-size:1rem">' + title + '</span>' +
          '<span style="font-size:0.78rem;color:var(--text-muted);margin-left:4px">(' + wordList.length + '词)</span>' +
        '</div>' +
        '<div class="notebook-list">' +
        wordList.map(word => {
          const w = C.words.find(x => x.word === word);
          const nb = C.notebook[word];
          if (!w) return '';
          const borderStyle = highlight ? 'border-left:3px solid var(--' + color + ');' : '';
          return '<div class="notebook-item" style="' + borderStyle + '" data-nb-word="' + C.esc(w.word) + '">' +
            '<div class="notebook-word-info">' +
              '<div class="word"><span style="cursor:pointer">' + C.esc(w.word) + '</span> ' +
                '<span style="color:var(--text-muted);font-size:0.85rem">' + C.esc(w.phonetic) + '</span>' +
              '</div>' +
              '<div class="meaning">' + C.getDefsHTML(w) + '</div>' +
            '</div>' +
            '<div class="notebook-meta">' +
              '<span class="wrong-times" style="font-size:0.9rem">✗ ' + nb.count + '</span>' +
            '</div>' +
            '<button class="btn btn-sm btn-ghost" data-nb-remove="' + C.esc(w.word) + '">移除</button>' +
          '</div>';
        }).join('') +
        '</div></div>';
    };

    c.innerHTML =
      renderGroup('高频错词 · 重点关注', '🔴', 'coral', highErr, true) +
      renderGroup('中频错词 · 需要加强', '🟡', 'amber', midErr, true) +
      renderGroup('偶尔出错', '🟢', 'emerald', lowErr, false);

    // 事件委托：点击单词显示详情，点击移除按钮删除
    c.onclick = function(e) {
      const removeBtn = e.target.closest('[data-nb-remove]');
      if (removeBtn) {
        e.stopPropagation();
        removeFromNotebook(removeBtn.dataset.nbRemove);
        return;
      }
      const item = e.target.closest('[data-nb-word]');
      if (item) {
        const w = C.words.find(x => x.word === item.dataset.nbWord);
        if (w) C.showWordDetail(w);
      }
    };
  }

  function removeFromNotebook(word) {
    delete C.notebook[word];
    C.saveData();
    renderNotebook();
    C.toast('已从错题本移除', 'success');
  }

  function clearNotebook() {
    if (!confirm('确定清空所有错题记录？')) return;
    C.notebook = {};
    C.saveData();
    renderNotebook();
    C.toast('错题本已清空', 'success');
  }

  function practiceWrongWords() {
    const ww = Object.keys(C.notebook);
    if (ww.length === 0) {
      C.toast('错题本是空的', 'info');
      return;
    }
    C.goToPage('flashcard');
    const list = C.words.filter(w => ww.includes(w.word));
    if (C.loadFlashcardCustomSession) {
      C.loadFlashcardCustomSession(list, '错题本闪卡', true);
    } else {
      C.flashcardList = list;
      C.shuffle(C.flashcardList);
      C.flashcardIdx = 0;
      C.text('flashcard-total', C.flashcardList.length);
      C.renderFlashcard();
    }
    C.toast('已加载 ' + C.flashcardList.length + ' 个错题', 'info');
  }

  // ========== 数据导入导出 ==========

  function exportData() {
    const data = {
      progress: C.progress, notebook: C.notebook, streak: C.streakData, settings: C.settings,
      version: 2,
      exportedAt: new Date().toISOString(),
      wordCount: C.words.length
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = C.currentLevel + '-progress-' + C.todayStr + '.json';
    a.click();
    URL.revokeObjectURL(url);
    C.toast('数据导出成功！', 'success');
  }

  function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const d = JSON.parse(e.target.result);

        if (d.progress) {
          Object.keys(d.progress).forEach(w => {
            const imp = d.progress[w];
            const cur = C.progress[w];
            if (!cur || (imp.status === 'mastered' && cur.status !== 'mastered')) {
              C.progress[w] = imp;
            }
          });
        }

        if (d.notebook) {
          Object.keys(d.notebook).forEach(w => {
            if (!C.notebook[w] || d.notebook[w].count > C.notebook[w].count) {
              C.notebook[w] = d.notebook[w];
            }
          });
        }

        if (d.streak?.dates) {
          if (!C.streakData.dates) C.streakData.dates = {};
          Object.keys(d.streak.dates).forEach(day => {
            if (!C.streakData.dates[day] ||
                d.streak.dates[day].learned > C.streakData.dates[day].learned) {
              C.streakData.dates[day] = d.streak.dates[day];
            }
          });
        }

        if (d.settings) C.settings = { ...C.settings, ...d.settings };

        C.saveData();
        C.recordCheckIn();
        C.renderDashboard();
        if (C.updateReviewBadge) C.updateReviewBadge();
        C.toast('数据导入并合并成功！', 'success');
      } catch (err) {
        C.toast('导入失败：文件格式错误', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function resetData() {
    if (!confirm('确定要清除所有学习数据吗？此操作不可撤销！')) return;
    if (!confirm('再次确认：这将删除所有进度、错题、打卡记录。')) return;
    C.progress = {};
    C.notebook = {};
    C.streakData = { dates: {}, currentStreak: 0 };
    C.saveData();
    C.renderDashboard();
    if (C.updateReviewBadge) C.updateReviewBadge();
    C.toast('数据已重置', 'success');
  }

  function saveSettings() {
    C.settings.pageSize = parseInt(C.$('setting-pagesize')?.value || '50');
    C.settings.dailyGoal = parseInt(C.$('setting-dailygoal')?.value || '30');
    C.saveData();
    C.renderDailyGoal();

    // 清空每日计划缓存，使新目标生效
    if (C.clearDailyPlanCache) C.clearDailyPlanCache();

    // 同步每日目标到测验/拼写模块的默认数量
    const goal = C.settings.dailyGoal;
    syncSelectValue('quiz-count', goal);
    syncSelectValue('spell-count', goal);

    C.toast('设置已保存', 'success');
  }

  // 将 select 元素选到最接近 target 的 option
  function syncSelectValue(id, target) {
    const sel = C.$(id);
    if (!sel) return;
    const opts = Array.from(sel.options).map(o => parseInt(o.value));
    let best = opts[0];
    for (const v of opts) {
      if (Math.abs(v - target) < Math.abs(best - target)) best = v;
    }
    sel.value = String(best);
  }

  // 注册到共享对象
  C.showQuizSetup = showQuizSetup;
  C.backToQuizSetup = backToQuizSetup;
  C.resumeQuiz = resumeQuiz;
  C.startQuiz = startQuiz;
  C.renderQuestion = renderQuestion;
  C.selectAnswer = selectAnswer;
  C.nextQuestion = nextQuestion;
  C.showQuizResult = showQuizResult;
  C.reviewWrongAnswers = reviewWrongAnswers;
  C.renderNotebook = renderNotebook;
  C.removeFromNotebook = removeFromNotebook;
  C.clearNotebook = clearNotebook;
  C.practiceWrongWords = practiceWrongWords;
  C.exportData = exportData;
  C.importData = importData;
  C.resetData = resetData;
  C.saveSettings = saveSettings;
  C.syncSelectValue = syncSelectValue;
})();
