// ========== CET 词汇大师 — 复习模块 (review.js) ==========
// 艾宾浩斯记忆曲线复习
(function() {
  'use strict';
  const C = window._C;

  function reviewKey() { return 'cet_review_' + C.currentLevel; }

  function makeWordLookup() {
    const map = new Map();
    C.words.forEach(w => map.set(String(w.word).toLowerCase(), w));
    return map;
  }

  function restoreReviewWords(wordList) {
    if (!Array.isArray(wordList) || wordList.length === 0) return [];
    const lookup = makeWordLookup();
    return wordList.map(word => lookup.get(String(word).toLowerCase())).filter(Boolean);
  }

  function saveReviewProgress() {
    if (!C.reviewList || C.reviewList.length === 0) return;
    const data = {
      words: C.reviewList.map(w => w.word),
      idx: C.reviewIdx,
      date: C.todayStr
    };
    localStorage.setItem(reviewKey(), JSON.stringify(data));
  }

  function loadReviewProgress() {
    try {
      const raw = localStorage.getItem(reviewKey());
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function clearReviewProgress() {
    localStorage.removeItem(reviewKey());
  }

  function normalizeReviewProgress(saved) {
    if (!saved || saved.date !== C.todayStr) return null;
    const list = restoreReviewWords(saved.words);
    if (list.length === 0) return null;
    const idx = Math.max(0, Math.min(parseInt(saved.idx || 0), list.length));
    if (idx >= list.length) return null;
    return { list, idx, total: list.length };
  }

  function updateReviewBadge() {
    const n = C.getDueWords().length;
    const badge = C.$('review-badge');
    if (badge) {
      if (n > 0) {
        badge.textContent = n;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  function renderReview() {
    const due = C.getDueWords();
    C.text('review-due-count', due.length);

    // 区分逾期词和今日到期词
    let overdueCount = 0;
    due.forEach(w => {
      const p = C.progress[w.word];
      if (p && p.nextReview && p.nextReview < C.todayStr) overdueCount++;
    });

    const btn = C.$('review-start-btn');
    const resumeBtn = C.$('review-resume-btn');
    const saved = normalizeReviewProgress(loadReviewProgress());
    if (btn) {
      btn.disabled = due.length === 0;
      if (due.length === 0) {
        btn.textContent = '暂无待复习';
      } else if (saved) {
        btn.textContent = '重新开始复习 (' + due.length + '个)';
      } else if (overdueCount > 0) {
        btn.textContent = '开始复习 (' + due.length + '个，含' + overdueCount + '个逾期)';
      } else {
        btn.textContent = '开始复习 (' + due.length + '个)';
      }
    }
    if (resumeBtn) {
      if (saved) {
        resumeBtn.style.display = '';
        resumeBtn.textContent = '继续上次复习（第 ' + (saved.idx + 1) + ' / ' + saved.total + ' 张）';
      } else {
        resumeBtn.style.display = 'none';
        clearReviewProgress();
      }
    }

    const ql = C.$('review-queue-list');
    if (ql) {
      let now = 0, overdue = 0, soon = 0, later = 0;
      C.words.forEach(w => {
        const p = C.progress[w.word];
        if (!p || !p.nextReview || p.status === 'new') return;
        const d = C.daysBetween(C.todayStr, p.nextReview);
        if (d < 0) overdue++;
        else if (d === 0) now++;
        else if (d <= 3) soon++;
        else if (d <= 7) later++;
      });

      ql.innerHTML =
        '<div class="review-queue-item">' +
          '<span class="due-tag due-now">今天' + (overdue > 0 ? '(含' + overdue + '个逾期)' : '') + '</span>' +
          '<span>' + (now + overdue) + ' 个单词</span>' +
        '</div>' +
        '<div class="review-queue-item">' +
          '<span class="due-tag due-soon">3天内</span>' +
          '<span>' + soon + ' 个单词</span>' +
        '</div>' +
        '<div class="review-queue-item">' +
          '<span class="due-tag due-later">7天内</span>' +
          '<span>' + later + ' 个单词</span>' +
        '</div>';
    }

    C.renderMemoryCurve();

    C.show('review-dashboard');
    C.hide('review-session');
  }

  function backToReviewDashboard() {
    saveReviewProgress();
    C.toast('复习进度已保存', 'info');
    C.show('review-dashboard');
    C.hide('review-session');
    renderReview();
  }

  function startReviewSession() {
    C.reviewList = C.getDueWords();
    if (C.reviewList.length === 0) {
      C.toast('暂无需要复习的单词', 'info');
      return;
    }

    clearReviewProgress();
    C.shuffle(C.reviewList);
    C.reviewIdx = 0;
    C.reviewFlipped = false;

    if (C.currentPage !== 'review') C.goToPage('review');

    C.hide('review-dashboard');
    C.show('review-session');
    C.text('review-total', C.reviewList.length);
    renderReviewCard();
  }

  function resumeReviewSession() {
    const saved = normalizeReviewProgress(loadReviewProgress());
    if (!saved) {
      C.toast('没有可恢复的复习进度', 'info');
      return;
    }

    C.reviewList = saved.list;
    C.reviewIdx = saved.idx;
    C.reviewFlipped = false;

    if (C.currentPage !== 'review') C.goToPage('review');

    C.hide('review-dashboard');
    C.show('review-session');
    C.text('review-total', C.reviewList.length);
    renderReviewCard();
    C.toast('已恢复复习进度', 'success');
  }

  function renderReviewCard() {
    if (C.reviewIdx >= C.reviewList.length) {
      C.show('review-dashboard');
      C.hide('review-session');
      clearReviewProgress();
      C.incModuleCount('review'); // 完成一轮复习 +1
      C.saveData();
      C.toast('复习完成！', 'success');
      renderReview();
      C.renderDashboard();
      updateReviewBadge();
      return;
    }

    const w = C.reviewList[C.reviewIdx];
    C.text('review-index', C.reviewIdx + 1);
    C.text('rv-word', w.word);
    C.text('rv-phonetic', w.phonetic);
    const rvMeanEl = C.$('rv-meaning');
    if (rvMeanEl) rvMeanEl.innerHTML = C.getDefsHTML(w);
    C.text('rv-example', w.example);

    // 复习卡片只展示一条精选助记，详细拆解留给单词详情页
    const extraEl = C.$('rv-extra');
    if (extraEl) {
      const bestTip = C.getBestMnemonic ? C.getBestMnemonic(w) : '';
      extraEl.innerHTML = bestTip
        ? '<div class="fc-memory"><span class="mini-tip-label">精选助记</span>' + C.esc(bestTip) + '</div>'
        : '';
    }

    const card = C.$('review-card');
    if (card) card.classList.remove('flipped');
    C.reviewFlipped = false;

    // 彩色卡片主题
    const faces = document.querySelectorAll('#review-card .flashcard-face');
    const theme = C.randomCardTheme();
    faces.forEach(face => {
      C.CARD_THEMES.forEach(cls => face.classList.remove(cls));
      face.classList.add(theme);
    });

    // 自动发音
    C.autoSpeak('review', w.word);

    // 底部今日计数
    if (C.renderModuleFooter) C.renderModuleFooter('review', 'review-footer-counter');
    saveReviewProgress();
  }

  function flipReviewCard() {
    const card = C.$('review-card');
    if (!card) return;
    C.reviewFlipped = !C.reviewFlipped;
    card.classList.toggle('flipped', C.reviewFlipped);
  }

  function reviewMark(result) {
    if (C.reviewIdx >= C.reviewList.length) return;
    const w = C.reviewList[C.reviewIdx];
    if (!C.progress[w.word]) C.progress[w.word] = {};
    const p = C.progress[w.word];

    if (result === 'easy') {
      p.reviewStage = Math.min((p.reviewStage || 0) + 1, C.REVIEW_INTERVALS.length - 1);
      if (p.reviewStage >= C.REVIEW_INTERVALS.length - 1) {
        p.status = 'mastered';
        // 已掌握的词仍然安排长周期复习（30天后再来一轮）
        p.nextReview = C.addDays(C.todayStr, 30);
      } else {
        p.nextReview = C.addDays(C.todayStr, C.REVIEW_INTERVALS[p.reviewStage] || 1);
      }
    } else if (result === 'hard') {
      // 模糊：不升级阶段，间隔缩短为当前阶段的一半（最少1天）
      const stage = p.reviewStage || 0;
      const interval = Math.max(1, Math.floor((C.REVIEW_INTERVALS[stage] || 1) / 2));
      p.nextReview = C.addDays(C.todayStr, interval);
    } else {
      // 忘记：重置到第一阶段
      p.reviewStage = 0;
      p.status = 'learning';
      C.addToNotebook(w.word, '复习忘记');
      p.nextReview = C.addDays(C.todayStr, C.REVIEW_INTERVALS[0] || 1);
    }

    p.lastSeen = C.todayStr;
    C.progress[w.word] = p;

    C.recordLearn(w.word);
    C.saveData();
    C.reviewIdx++;
    renderReviewCard();
  }

  // 注册到共享对象
  C.updateReviewBadge = updateReviewBadge;
  C.renderReview = renderReview;
  C.backToReviewDashboard = backToReviewDashboard;
  C.startReviewSession = startReviewSession;
  C.resumeReviewSession = resumeReviewSession;
  C.renderReviewCard = renderReviewCard;
  C.flipReviewCard = flipReviewCard;
  C.reviewMark = reviewMark;
})();
