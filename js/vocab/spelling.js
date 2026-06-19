// ========== CET 词汇大师 — 拼写模块 (spelling.js) ==========
(function() {
  'use strict';
  const C = window._C;

  // 当前拼写方向: 'cn2en' = 看中文拼英文(默认), 'en2cn' = 看英文写中文
  let spellDirection = 'cn2en';

  // ====== 拼写进度保存/恢复 ======
  function spellKey() { return 'cet_spell_' + C.currentLevel; }

  function saveSpellProgress() {
    if (!C.spellList || C.spellList.length === 0) return;
    const data = {
      list: C.spellList,
      direction: spellDirection,
      idx: C.spellIdx,
      correct: C.spellCorrectCount,
      wrong: C.spellWrongCount,
      wrongList: C.spellWrongList,
      date: C.todayStr
    };
    localStorage.setItem(spellKey(), JSON.stringify(data));
  }

  function loadSpellProgress() {
    try {
      const raw = localStorage.getItem(spellKey());
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function clearSpellProgress() {
    localStorage.removeItem(spellKey());
  }

  function showSpellSetup() {
    C.show('spell-setup'); C.hide('spell-area'); C.hide('spell-result');
    // 同步每日目标到拼写题数
    if (C.syncSelectValue) C.syncSelectValue('spell-count', C.settings.dailyGoal);

    // 检查是否有未完成的拼写进度
    const saved = loadSpellProgress();
    const resumeBtn = C.$('spell-resume-btn');
    const startBtn = C.$('spell-start-btn');
    if (saved && saved.date === C.todayStr && saved.idx < saved.list.length) {
      if (startBtn) startBtn.textContent = '重新开始拼写';
      if (resumeBtn) {
        resumeBtn.style.display = '';
        resumeBtn.textContent = '继续上次拼写（第 ' + (saved.idx + 1) + ' / ' + saved.list.length + ' 题）';
        resumeBtn.onclick = resumeSpelling;
      }
    } else {
      if (startBtn) startBtn.textContent = '开始拼写';
      if (resumeBtn) resumeBtn.style.display = 'none';
      clearSpellProgress();
    }
  }

  function resumeSpelling() {
    const saved = loadSpellProgress();
    if (!saved) { C.toast('没有可恢复的进度', 'info'); return; }

    C.spellList = saved.list;
    spellDirection = saved.direction;
    C.spellIdx = saved.idx;
    C.spellCorrectCount = saved.correct;
    C.spellWrongCount = saved.wrong;
    C.spellWrongList = saved.wrongList || [];
    C.spellWordAnswered = false;
    C.spellHintCount = 0;

    C.hide('spell-setup'); C.show('spell-area'); C.hide('spell-result');
    C.text('spell-total-num', C.spellList.length);
    C.text('spell-correct', C.spellCorrectCount);
    C.text('spell-wrong', C.spellWrongCount);
    renderSpellWord();
    C.toast('已恢复拼写进度', 'success');
  }

  function backToSpellSetup() {
    saveSpellProgress();
    C.toast('拼写进度已保存', 'info');
    showSpellSetup();
  }

  function startSpelling() {
    const count = parseInt(C.$('spell-count')?.value || 20);
    const range = C.$('spell-range')?.value || 'all';
    spellDirection = C.$('spell-type')?.value || 'cn2en';

    let pool;
    if (range === 'daily') pool = C.getDailyPlanWords();
    else if (range === 'high') pool = C.words.filter(w => w.freq === 'high');
    else if (range === 'learning') pool = C.words.filter(w => C.status(w.word) === 'learning');
    else if (range === 'wrong') pool = C.words.filter(w => C.notebook[w.word]);
    else pool = C.words.slice();

    if (pool.length < 4) { C.toast('可用单词不足，请选择更大范围', 'error'); return; }

    clearSpellProgress();
    C.shuffle(pool);
    // 每日计划模式使用完整词表（与闪卡/测验保持一致），其他模式按题数截断
    const selected = range === 'daily' ? pool : pool.slice(0, count);
    C.spellList = selected.map(w => ({
      word: w.word,
      phonetic: w.phonetic,
      meaning: w.meaning,
      example: w.example,
      defs: w.defs
    }));
    C.spellIdx = 0;
    C.spellCorrectCount = 0;
    C.spellWrongCount = 0;
    C.spellWrongList = [];
    C.spellWordAnswered = false;
    C.spellHintCount = 0;

    C.hide('spell-setup'); C.show('spell-area'); C.hide('spell-result');
    C.text('spell-total-num', C.spellList.length);
    C.text('spell-correct', 0);
    C.text('spell-wrong', 0);
    renderSpellWord();
    saveSpellProgress();
  }

  function renderSpellWord() {
    if (C.spellIdx >= C.spellList.length) {
      showSpellResult();
      return;
    }

    C.spellWordAnswered = false;
    C.spellHintCount = 0;
    const item = C.spellList[C.spellIdx];
    C.text('spell-current-num', C.spellIdx + 1);
    renderSpellMemoryTip(null);

    const smEl = C.$('spell-meaning');
    const phoneticEl = C.$('spell-phonetic');
    const exEl = C.$('spell-example');

    // 彩色卡片主题
    C.applyCardTheme(C.$('spell-card'));

    if (spellDirection === 'en2cn') {
      // ===== 看英文写中文模式 =====
      // 显示英文单词和音标
      if (smEl) smEl.innerHTML = '<span style="font-size:2rem;font-weight:800">' + C.esc(item.word) + '</span>';
      if (phoneticEl) {
        phoneticEl.className = 'spell-card-phonetic revealed';
        phoneticEl.textContent = item.phonetic;
        phoneticEl.onclick = null;
      }
      // 例句正常显示（不模糊）
      if (exEl) exEl.textContent = item.example || '';
      renderCnInput(item);
    } else {
      // ===== 看中文拼英文模式（默认） =====
      if (smEl) smEl.innerHTML = C.getDefsHTML(item);
      if (phoneticEl) {
        phoneticEl.className = 'spell-card-phonetic blurred';
        phoneticEl.textContent = item.phonetic;
        phoneticEl.onclick = () => { phoneticEl.className = 'spell-card-phonetic revealed'; };
      }
      // 例句中目标单词模糊处理
      if (exEl && item.example) {
        const word = item.word;
        const re = new RegExp('\\b(' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\w*)\\b', 'gi');
        exEl.innerHTML = C.esc(item.example).replace(re, '<span class="spell-example-blur" onclick="this.classList.add(\'revealed\')">$1</span>');
      } else if (exEl) {
        exEl.textContent = item.example || '';
      }
      renderEnInput(item);
    }

    C.show('spell-hint-btn');
    C.show('spell-skip-btn');
    C.hide('spell-next-word-actions');
  }

  function renderSpellMemoryTip(item) {
    const tipEl = C.$('spell-memory-tip');
    if (!tipEl) return;
    if (!item || !C.getBestMnemonic) {
      tipEl.style.display = 'none';
      tipEl.innerHTML = '';
      return;
    }
    const tip = C.getBestMnemonic(item);
    if (!tip) {
      tipEl.style.display = 'none';
      tipEl.innerHTML = '';
      return;
    }
    tipEl.style.display = '';
    tipEl.innerHTML = '<span class="mini-tip-label">精选助记</span>' + C.esc(tip);
  }

  // ===== 看中文拼英文：逐字母输入框 =====
  function renderEnInput(item) {
    const container = C.$('spell-letter-boxes');
    if (!container) return;
    container.innerHTML = '';

    const letters = item.word.split('');
    letters.forEach((letter, i) => {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.className = 'spell-letter-box';
      input.dataset.index = i;
      input.dataset.letter = letter.toLowerCase();
      input.autocomplete = 'off';
      input.autocapitalize = 'off';
      input.spellcheck = false;

      input.addEventListener('input', (e) => {
        if (C.spellWordAnswered) return;
        const val = e.target.value.toLowerCase();
        if (!val) {
          input.classList.remove('correct', 'wrong');
          return;
        }

        const expected = input.dataset.letter;
        if (val === expected) {
          input.classList.remove('wrong');
          input.classList.add('correct');
          jumpToNextEmpty(i);
        } else {
          input.classList.remove('correct');
          input.classList.add('wrong');
          setTimeout(() => {
            if (!C.spellWordAnswered) {
              input.value = '';
              input.classList.remove('wrong');
              input.focus();
            }
          }, 500);
        }

        checkAllFilled();
      });

      input.addEventListener('keydown', (e) => {
        if (C.spellWordAnswered) { e.preventDefault(); return; }
        if (e.key === 'Backspace' && !input.value) {
          e.preventDefault();
          const prev = container.querySelectorAll('.spell-letter-box')[i - 1];
          if (prev) {
            prev.value = '';
            prev.classList.remove('correct', 'wrong');
            prev.focus();
          }
        } else if (e.key === 'Tab') {
          e.preventDefault();
          const boxes = container.querySelectorAll('.spell-letter-box');
          const next = boxes[i + 1];
          if (next) next.focus();
        }
      });

      container.appendChild(input);
    });

    const boxes = container.querySelectorAll('.spell-letter-box');
    if (boxes.length > 0) setTimeout(() => boxes[0].focus(), 100);
  }

  // ===== 看英文写中文：单行中文输入框 =====
  function renderCnInput(item) {
    const container = C.$('spell-letter-boxes');
    if (!container) return;
    container.innerHTML = '';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'spell-cn-input';
    input.placeholder = '请输入中文释义...';
    input.autocomplete = 'off';
    input.spellcheck = false;
    // 存储正确答案的关键词
    const defs = C.getDefs ? C.getDefs(item) : [];
    const answerKeywords = [];
    defs.forEach(d => d.meanings.forEach(m => {
      // 每个释义都是一个有效答案关键词
      if (m.length >= 2) answerKeywords.push(m.trim());
    }));
    input.dataset.keywords = JSON.stringify(answerKeywords);

    input.addEventListener('keydown', (e) => {
      if (C.spellWordAnswered) { e.preventDefault(); return; }
      if (e.key === 'Enter') {
        e.preventDefault();
        checkCnAnswer(input, item);
      }
    });

    // 添加确认按钮
    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn btn-amber';
    submitBtn.textContent = '确认';
    submitBtn.style.cssText = 'margin-top:12px;';
    submitBtn.onclick = () => checkCnAnswer(input, item);

    container.appendChild(input);
    container.appendChild(submitBtn);
    setTimeout(() => input.focus(), 100);
  }

  // 检查中文答案
  function checkCnAnswer(input, item) {
    if (C.spellWordAnswered) return;
    const userAns = input.value.trim();
    if (!userAns) { C.toast('请输入中文释义', 'info'); return; }

    const keywords = JSON.parse(input.dataset.keywords || '[]');
    // 检查是否匹配任一关键词：用户输入必须包含关键词，且长度至少达到关键词的一半
    const isCorrect = userAns.length >= 2 && keywords.some(kw =>
      userAns.includes(kw) || (kw.length >= 4 && userAns.length >= Math.ceil(kw.length * 0.6) && kw.includes(userAns))
    );

    C.spellWordAnswered = true;
    input.disabled = true;

    if (isCorrect) {
      C.spellCorrectCount++;
      C.text('spell-correct', C.spellCorrectCount);
      input.style.borderColor = 'var(--emerald)';
      input.style.color = 'var(--emerald)';

      C.markLearnedToday(item.word);
      if (C.status(item.word) === 'new') {
        C.progress[item.word] = C.progress[item.word] || {};
        C.progress[item.word].status = 'learning';
        C.progress[item.word].lastSeen = C.todayStr;
      }
      C.saveData();

      // 显示完整释义
      const resultDiv = document.createElement('div');
      resultDiv.className = 'spell-cn-result correct';
      resultDiv.innerHTML = '✓ ' + C.getDefsHTML(item);
      input.parentElement.appendChild(resultDiv);

      C.toast('✓ 正确！', 'success');

      C.hide('spell-hint-btn');
      C.hide('spell-skip-btn');
      C.show('spell-next-word-actions');
      renderSpellMemoryTip(item);

      if (C.spellIdx < C.spellList.length - 1) {
        setTimeout(() => { if (C.spellWordAnswered) nextSpellWord(); }, 2200);
      }
    } else {
      C.spellWrongCount++;
      C.text('spell-wrong', C.spellWrongCount);
      C.spellWrongList.push({ ...item, userAnswer: userAns });
      C.addToNotebook(item.word, '拼写(中文) - 写了"' + userAns + '"');
      C.saveData();

      input.style.borderColor = 'var(--coral)';
      input.style.color = 'var(--coral)';

      // 显示正确释义
      const resultDiv = document.createElement('div');
      resultDiv.className = 'spell-cn-result wrong';
      resultDiv.innerHTML = '✗ 正确答案：' + C.getDefsHTML(item);
      input.parentElement.appendChild(resultDiv);

      C.hide('spell-hint-btn');
      C.hide('spell-skip-btn');
      C.show('spell-next-word-actions');
      renderSpellMemoryTip(item);
    }
  }

  function jumpToNextEmpty(currentIdx) {
    const container = C.$('spell-letter-boxes');
    if (!container) return;
    const boxes = container.querySelectorAll('.spell-letter-box');
    for (let i = currentIdx + 1; i < boxes.length; i++) {
      if (!boxes[i].value) { boxes[i].focus(); return; }
    }
    for (let i = 0; i < currentIdx; i++) {
      if (!boxes[i].value) { boxes[i].focus(); return; }
    }
  }

  function checkAllFilled() {
    if (C.spellWordAnswered) return;
    const container = C.$('spell-letter-boxes');
    if (!container) return;
    const boxes = container.querySelectorAll('.spell-letter-box');
    let allFilled = true;
    let allCorrect = true;

    boxes.forEach(box => {
      if (!box.value) allFilled = false;
      if (box.value.toLowerCase() !== box.dataset.letter) allCorrect = false;
    });

    if (allFilled && allCorrect) {
      C.spellWordAnswered = true;
      C.spellCorrectCount++;
      C.text('spell-correct', C.spellCorrectCount);

      const item = C.spellList[C.spellIdx];
      C.markLearnedToday(item.word);
      if (C.status(item.word) === 'new') {
        C.progress[item.word] = C.progress[item.word] || {};
        C.progress[item.word].status = 'learning';
        C.progress[item.word].lastSeen = C.todayStr;
      }
      C.saveData();

      boxes.forEach(box => { box.disabled = true; });

      // 完成后显示完整单词和中文释义
      const resultDiv = document.createElement('div');
      resultDiv.className = 'spell-cn-result correct';
      resultDiv.innerHTML = '✓ <strong>' + C.esc(item.word) + '</strong> — ' + C.getDefsHTML(item);
      container.parentElement.insertBefore(resultDiv, container.nextSibling);

      C.toast('✓ ' + item.word + ' 正确！', 'success');

      // 拼写答对后发音（受 spelling 模块的自动发音开关控制）
      C.autoSpeak('spelling', item.word);

      C.hide('spell-hint-btn');
      C.hide('spell-skip-btn');
      C.show('spell-next-word-actions');
      renderSpellMemoryTip(item);

      if (C.spellIdx < C.spellList.length - 1) {
        setTimeout(() => {
          if (C.spellWordAnswered) nextSpellWord();
        }, 2200);
      }
    }
  }

  function showSpellLetterHint() {
    if (C.spellWordAnswered) return;

    if (spellDirection === 'en2cn') {
      // 看英文写中文模式：提示第一个关键词
      const container = C.$('spell-letter-boxes');
      if (!container) return;
      const input = container.querySelector('.spell-cn-input');
      if (!input) return;
      const keywords = JSON.parse(input.dataset.keywords || '[]');
      if (keywords.length > 0) {
        // 显示提示：第一个字
        const hint = keywords[0].substring(0, Math.ceil(keywords[0].length / 2));
        input.value = hint;
        input.focus();
        C.spellHintCount++;
        C.toast('提示：' + hint + '...', 'info');
      }
      return;
    }

    // 看中文拼英文模式（默认）
    const container = C.$('spell-letter-boxes');
    if (!container) return;
    const boxes = container.querySelectorAll('.spell-letter-box');

    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      if (!box.value || box.value.toLowerCase() !== box.dataset.letter) {
        box.value = box.dataset.letter;
        box.classList.remove('wrong');
        box.classList.add('hint');
        box.disabled = true;
        C.spellHintCount++;
        break;
      }
    }

    checkAllFilled();
  }

  function skipSpellWord() {
    if (C.spellWordAnswered) return;
    C.spellWordAnswered = true;

    const item = C.spellList[C.spellIdx];
    C.spellWrongCount++;
    C.text('spell-wrong', C.spellWrongCount);
    C.spellWrongList.push({ ...item, userAnswer: '(跳过)' });
    C.addToNotebook(item.word, '拼写跳过');
    C.saveData();

    const container = C.$('spell-letter-boxes');
    if (container) {
      if (spellDirection === 'en2cn') {
        // 中文模式：显示正确答案
        const input = container.querySelector('.spell-cn-input');
        if (input) input.disabled = true;
        const resultDiv = document.createElement('div');
        resultDiv.className = 'spell-cn-result wrong';
        resultDiv.innerHTML = '正确答案：' + C.getDefsHTML(item);
        container.appendChild(resultDiv);
      } else {
        // 英文模式：显示所有字母
        const boxes = container.querySelectorAll('.spell-letter-box');
        boxes.forEach(box => {
          if (box.value.toLowerCase() !== box.dataset.letter) {
            box.value = box.dataset.letter;
            box.classList.remove('correct', 'wrong');
            box.classList.add('wrong');
          }
          box.disabled = true;
        });

        // 显示完整单词和释义
        const resultDiv = document.createElement('div');
        resultDiv.className = 'spell-cn-result wrong';
        resultDiv.innerHTML = '<strong>' + C.esc(item.word) + '</strong> — ' + C.getDefsHTML(item);
        container.parentElement.insertBefore(resultDiv, container.nextSibling);
      }
    }

    C.hide('spell-hint-btn');
    C.hide('spell-skip-btn');
    C.show('spell-next-word-actions');
    renderSpellMemoryTip(item);
  }

  function speakCurrentSpell() {
    if (C.spellIdx < C.spellList.length) {
      C.speak(C.spellList[C.spellIdx].word);
    }
  }

  function nextSpellWord() {
    // 清理上一题的结果显示
    document.querySelectorAll('.spell-cn-result').forEach(el => el.remove());
    renderSpellMemoryTip(null);
    C.spellIdx++;
    saveSpellProgress();
    renderSpellWord();
  }

  function showSpellResult() {
    C.hide('spell-area');
    C.show('spell-result');
    clearSpellProgress(); // 拼写完成，清除保存的进度
    C.incModuleCount('spelling'); // 完成一轮拼写 +1
    C.saveData();
    const total = C.spellList.length;
    const pct = total > 0 ? Math.round(C.spellCorrectCount / total * 100) : 0;
    C.text('spell-score', pct + '%');
    C.text('spell-r-correct', C.spellCorrectCount);
    C.text('spell-r-wrong', C.spellWrongCount);
    C.text('spell-r-accuracy', pct + '%');
    C.text('spell-msg', pct >= 90 ? '拼写高手！' : pct >= 70 ? '表现不错！' : pct >= 50 ? '继续练习' : '加油！多练几遍');

    const details = C.$('spell-r-details');
    if (details) {
      if (C.spellWrongList.length === 0) {
        details.innerHTML = '<p style="text-align:center;color:var(--emerald)">全部正确！🎉</p>';
      } else {
        details.innerHTML = '<h4 style="margin-bottom:12px">错误列表</h4>' +
          C.spellWrongList.map(w => `
            <div class="wrong-review-item">
              <div><strong>${C.esc(w.word)}</strong> <span style="color:var(--text-muted)">${C.esc(w.phonetic)}</span></div>
              <div style="color:var(--text-secondary)">${C.getDefsHTML(w)}</div>
            </div>
          `).join('');
      }
    }
    if (C.renderModuleFooter) C.renderModuleFooter('spelling', 'spelling-footer-counter');
  }

  // 注册到共享对象
  C.showSpellSetup = showSpellSetup;
  C.backToSpellSetup = backToSpellSetup;
  C.resumeSpelling = resumeSpelling;
  C.startSpelling = startSpelling;
  C.renderSpellWord = renderSpellWord;
  C.showSpellLetterHint = showSpellLetterHint;
  C.skipSpellWord = skipSpellWord;
  C.speakCurrentSpell = speakCurrentSpell;
  C.nextSpellWord = nextSpellWord;
  C.showSpellResult = showSpellResult;
})();
