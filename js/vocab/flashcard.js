// ========== CET 词汇大师 — 闪卡模块 (flashcard.js) ==========
// initFlashcards, modeFilter, renderFlashcard, flipCard, nextCard, prevCard, markWord
(function() {
  'use strict';
  const C = window._C;

  // 进度存储 key
  function fcKey() { return 'cet_fc_' + C.currentLevel; }

  function modeLabel(mode) {
    if (mode === 'high') return '高频词';
    if (mode === 'random') return '随机50个';
    if (mode === 'custom') return '自定义闪卡';
    return '每日计划';
  }

  function getCurrentMode() {
    return C.$('flashcard-mode')?.value || 'daily';
  }

  function makeWordLookup() {
    const map = new Map();
    C.words.forEach(w => map.set(String(w.word).toLowerCase(), w));
    return map;
  }

  function restoreWords(wordList) {
    if (!Array.isArray(wordList) || wordList.length === 0) return [];
    const lookup = makeWordLookup();
    return wordList.map(word => lookup.get(String(word).toLowerCase())).filter(Boolean);
  }

  function normalizeSavedProgress(saved) {
    if (!saved || saved.date !== C.todayStr) return null;
    const restored = restoreWords(saved.words);
    if (restored.length === 0) return null;
    const idx = Math.max(0, Math.min(parseInt(saved.idx || 0), restored.length - 1));
    return {
      kind: saved.kind || (saved.mode === 'custom' ? 'custom' : 'mode'),
      mode: saved.mode || 'daily',
      label: saved.label || modeLabel(saved.mode || 'daily'),
      idx,
      words: restored,
      total: restored.length
    };
  }

  function updateFlashcardResumePanel(saved, active) {
    const panel = C.$('flashcard-resume-panel');
    if (!panel) return;
    const normalized = normalizeSavedProgress(saved || loadFcProgress());
    if (!normalized || normalized.idx >= normalized.total) {
      panel.style.display = 'none';
      panel.innerHTML = '';
      return;
    }

    const progressText = '第 ' + (normalized.idx + 1) + ' / ' + normalized.total + ' 张';
    panel.style.display = '';
    panel.innerHTML =
      '<span><strong>' + (active ? '当前已恢复' : '上次进度') + '</strong>：' +
      C.esc(normalized.label) + '，' + progressText + '</span>' +
      '<span class="resume-actions">' +
        '<button class="btn btn-sm btn-amber" onclick="App.resumeFlashcards()">继续上次</button>' +
        '<button class="btn btn-sm btn-ghost" onclick="App.restartFlashcards()">重新开始</button>' +
      '</span>';
  }

  function hideFlashcardResumePanel() {
    const panel = C.$('flashcard-resume-panel');
    if (!panel) return;
    panel.style.display = 'none';
    panel.innerHTML = '';
  }

  function clearFcProgress() {
    localStorage.removeItem(fcKey());
  }

  // 保存闪卡进度（当前模式、索引、日期、当次单词顺序）
  function saveFcProgress() {
    if (!C.flashcardList || C.flashcardList.length === 0) return;
    const session = C.flashcardSession || {};
    const mode = session.mode || getCurrentMode();
    const data = {
      kind: session.kind || 'mode',
      mode,
      label: session.label || modeLabel(mode),
      idx: C.flashcardIdx,
      words: C.flashcardList.map(w => w.word),
      date: C.todayStr
    };
    localStorage.setItem(fcKey(), JSON.stringify(data));
  }

  // 读取闪卡进度
  function loadFcProgress() {
    try {
      const raw = localStorage.getItem(fcKey());
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function buildFreshList(mode) {
    let list = modeFilter(mode);
    if (mode === 'random') {
      C.shuffle(list);
      list = list.slice(0, 50);
    } else if (mode === 'high') {
      C.shuffle(list);
      list = list.slice(0, C.settings.dailyGoal || 30);
    }
    return list;
  }

  function startFreshFlashcards(mode, showToast) {
    const modeEl = C.$('flashcard-mode');
    if (modeEl && mode !== 'custom') modeEl.value = mode;
    C.flashcardSession = { kind: 'mode', mode, label: modeLabel(mode) };
    C.flashcardList = buildFreshList(mode);
    C.flashcardIdx = 0;
    C.flashcardFlipped = false;
    C.text('flashcard-total', C.flashcardList.length);
    renderFlashcard();
    hideFlashcardResumePanel();
    if (showToast) C.toast('已重新开始：' + modeLabel(mode), 'success');
  }

  function restoreFlashcardProgress(saved, showToast) {
    const normalized = normalizeSavedProgress(saved || loadFcProgress());
    if (!normalized) {
      C.toast('没有可恢复的闪卡进度', 'info');
      return false;
    }

    const modeEl = C.$('flashcard-mode');
    if (modeEl && normalized.kind !== 'custom' && normalized.mode !== 'custom') {
      modeEl.value = normalized.mode;
    }
    C.flashcardSession = {
      kind: normalized.kind,
      mode: normalized.mode,
      label: normalized.label
    };
    C.flashcardList = normalized.words;
    C.flashcardIdx = normalized.idx;
    C.flashcardFlipped = false;
    C.text('flashcard-total', C.flashcardList.length);
    renderFlashcard();
    updateFlashcardResumePanel(loadFcProgress(), true);
    if (showToast) C.toast('已恢复闪卡进度', 'success');
    return true;
  }

  function initFlashcards(evt) {
    const saved = loadFcProgress();
    const modeEl = C.$('flashcard-mode');
    let mode = getCurrentMode();
    const isUserChange = evt && evt.target === modeEl;

    if (!isUserChange && normalizeSavedProgress(saved)) {
      restoreFlashcardProgress(saved, false);
      return;
    }

    if (isUserChange) clearFcProgress();
    startFreshFlashcards(mode, false);
  }

  function modeFilter(mode) {
    switch (mode) {
      case 'high': return C.words.filter(w => w.freq === 'high');
      case 'daily': return C.getDailyPlanWords();
      case 'random': return [...C.words];
      default: return C.getDailyPlanWords();
    }
  }

  function resumeFlashcards() {
    restoreFlashcardProgress(loadFcProgress(), true);
  }

  function restartFlashcards() {
    const mode = getCurrentMode();
    clearFcProgress();
    startFreshFlashcards(mode, true);
  }

  function loadFlashcardCustomSession(list, label, shuffle) {
    const words = Array.isArray(list) ? list.filter(Boolean) : [];
    if (shuffle) C.shuffle(words);
    C.flashcardSession = { kind: 'custom', mode: 'custom', label: label || '自定义闪卡' };
    C.flashcardList = words;
    C.flashcardIdx = 0;
    C.flashcardFlipped = false;
    C.text('flashcard-total', C.flashcardList.length);
    renderFlashcard();
    updateFlashcardResumePanel(loadFcProgress(), true);
  }

  function renderFlashcard() {
    if (C.flashcardList.length === 0) {
      C.text('fc-word', '暂无单词');
      C.text('fc-phonetic', '');
      C.text('fc-meaning', '');
      C.text('fc-example', '');
      C.text('flashcard-index', '0');
      return;
    }

    // 索引边界防护
    if (C.flashcardIdx < 0) C.flashcardIdx = 0;
    if (C.flashcardIdx >= C.flashcardList.length) C.flashcardIdx = C.flashcardList.length - 1;

    const w = C.flashcardList[C.flashcardIdx];
    C.text('flashcard-index', C.flashcardIdx + 1);
    C.text('fc-word', w.word);
    C.text('fc-phonetic', w.phonetic);
    const meaningEl = C.$('fc-meaning');
    if (meaningEl) meaningEl.innerHTML = C.getDefsHTML(w);
    C.text('fc-example', w.example);

    // 练习卡片只展示一条精选助记，详细拆解留给单词详情页
    const extraEl = C.$('fc-extra');
    if (extraEl) {
      const bestTip = C.getBestMnemonic ? C.getBestMnemonic(w) : '';
      extraEl.innerHTML = bestTip
        ? '<div class="fc-memory"><span class="mini-tip-label">精选助记</span>' + C.esc(bestTip) + '</div>'
        : '';
    }

    const ft = C.$('fc-freq-tag');
    if (ft) {
      ft.textContent = w.freq === 'high' ? '高频' : w.freq === 'mid' ? '中频' : '低频';
      ft.className = 'fc-freq-tag ' + w.freq;
    }

    const card = C.$('flashcard');
    if (card) card.classList.remove('flipped');
    C.flashcardFlipped = false;

    // 彩色卡片主题
    const faces = document.querySelectorAll('#flashcard .flashcard-face');
    const theme = C.randomCardTheme();
    faces.forEach(face => {
      C.CARD_THEMES.forEach(cls => face.classList.remove(cls));
      face.classList.add(theme);
    });

    // 自动发音
    C.autoSpeak('flashcard', w.word);

    // 底部今日计数
    if (C.renderModuleFooter) C.renderModuleFooter('flashcard', 'flashcard-footer-counter');

    // 保存进度
    saveFcProgress();
  }

  function flipCard() {
    const card = C.$('flashcard');
    if (!card || C.flashcardList.length === 0) return;
    C.flashcardFlipped = !C.flashcardFlipped;
    card.classList.toggle('flipped', C.flashcardFlipped);
  }

  function nextCard() {
    if (C.flashcardList.length === 0) return;
    const wasLast = C.flashcardIdx >= C.flashcardList.length - 1;
    C.flashcardIdx = (C.flashcardIdx + 1) % C.flashcardList.length;
    if (wasLast) C.toast('已循环到第一个词', 'info');
    renderFlashcard();
  }

  function prevCard() {
    if (C.flashcardList.length === 0) return;
    C.flashcardIdx = (C.flashcardIdx - 1 + C.flashcardList.length) % C.flashcardList.length;
    renderFlashcard();
  }

  function markWord(type) {
    if (C.flashcardList.length === 0) return;
    const w = C.flashcardList[C.flashcardIdx];

    if (!C.progress[w.word]) C.progress[w.word] = {};
    const p = C.progress[w.word];

    if (type === 'familiar') {
      if (p.status === 'learning') {
        p.status = 'mastered';
        C.toast(w.word + ' 已掌握！', 'success');
      } else {
        p.status = 'learning';
      }
      p.lastSeen = C.todayStr;
      // 按记忆曲线推进阶段并安排下次复习
      if (p.reviewStage == null) {
        p.reviewStage = 0;
      } else {
        p.reviewStage = Math.min(p.reviewStage + 1, C.REVIEW_INTERVALS.length - 1);
      }
      p.nextReview = C.addDays(C.todayStr, C.REVIEW_INTERVALS[p.reviewStage] || 30);
    } else {
      p.status = 'learning';
      p.lastSeen = C.todayStr;
      C.addToNotebook(w.word, '闪卡练习');
    }

    C.recordLearn(w.word);
    C.incModuleCount('flashcard'); // 每张卡片操作记一次
    C.saveData();
    nextCard();
  }

  // 注册到共享对象
  C.initFlashcards = initFlashcards;
  C.modeFilter = modeFilter;
  C.resumeFlashcards = resumeFlashcards;
  C.restartFlashcards = restartFlashcards;
  C.loadFlashcardCustomSession = loadFlashcardCustomSession;
  C.renderFlashcard = renderFlashcard;
  C.flipCard = flipCard;
  C.nextCard = nextCard;
  C.prevCard = prevCard;
  C.markWord = markWord;
})();
