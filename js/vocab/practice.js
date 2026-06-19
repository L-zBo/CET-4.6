// ========== CET 词汇大师 — 题型强化练习模块 (practice.js) ==========
// 首字母填空、选词填空
(function() {
  'use strict';
  const C = window._C;

  // ========== 生成首字母填空题 ==========
  function generateBlankFilling(word) {
    const sentence = word.example || (word.realExamSentence?.sentences?.[0]?.sContent) || null;
    if (!sentence) return null;

    const wordLower = word.word.toLowerCase();
    const re = new RegExp('\\b' + wordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\w*\\b', 'i');
    const match = sentence.match(re);
    if (!match) return null;

    const target = match[0];
    const blank = target[0] + '_'.repeat(target.length - 1);
    const question = sentence.replace(re, blank);

    return {
      type: 'blank',
      question,
      answer: target,
      hint: word.word,
      sentence
    };
  }

  // ========== 生成选词填空题（4选1）==========
  function generateMultipleChoice(word) {
    const sentence = word.example || (word.realExamSentence?.sentences?.[0]?.sContent) || null;
    if (!sentence) return null;

    const wordLower = word.word.toLowerCase();
    const re = new RegExp('\\b' + wordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\w*\\b', 'i');
    const match = sentence.match(re);
    if (!match) return null;

    const target = match[0];
    const question = sentence.replace(re, '______');

    // 生成3个干扰项
    const distractors = generateDistractors(word, 3);
    const options = [word.word, ...distractors].sort(() => Math.random() - 0.5);

    return {
      type: 'choice',
      question,
      options,
      answer: word.word,
      sentence
    };
  }

  // ========== 生成干扰项 ==========
  function generateDistractors(word, count) {
    const result = [];
    const wordLower = word.word.toLowerCase();
    const pos = getPrimaryPos(word);

    // 策略1：形近词
    if (C.findSimilarSpellings) {
      const similar = C.findSimilarSpellings(word.word, C.words, count * 2);
      similar.forEach(s => {
        if (result.length >= count) return;
        if (s.word.toLowerCase() !== wordLower) result.push(s.word);
      });
    }

    // 策略2：同词性词（随机）
    if (result.length < count) {
      const samePos = C.words.filter(w => {
        if (w.word.toLowerCase() === wordLower) return false;
        if (result.find(r => r.toLowerCase() === w.word.toLowerCase())) return false;
        return getPrimaryPos(w) === pos;
      });
      const shuffled = samePos.sort(() => Math.random() - 0.5);
      shuffled.slice(0, count - result.length).forEach(w => result.push(w.word));
    }

    // 策略3：随机词兜底
    if (result.length < count) {
      const random = C.words.filter(w => {
        if (w.word.toLowerCase() === wordLower) return false;
        return !result.find(r => r.toLowerCase() === w.word.toLowerCase());
      }).sort(() => Math.random() - 0.5);
      random.slice(0, count - result.length).forEach(w => result.push(w.word));
    }

    return result.slice(0, count);
  }

  function getPrimaryPos(w) {
    const defs = C.getDefs ? C.getDefs(w) : (w.defs || []);
    if (defs.length > 0 && defs[0].pos) return defs[0].pos;
    const m = String(w.meaning || '').match(/^([a-z]+\.?)/i);
    return m ? m[1] : '';
  }

  // ========== 练习模式UI ==========
  function showPracticeModal(word, mode) {
    const exercise = mode === 'blank' ? generateBlankFilling(word) : generateMultipleChoice(word);
    if (!exercise) {
      alert('该单词没有可用的例句，无法生成练习题');
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'practice-overlay';

    let questionHTML = '';
    if (exercise.type === 'blank') {
      questionHTML = '<div class="practice-question-text">' + C.esc(exercise.question) + '</div>' +
        '<div class="practice-hint">提示：单词首字母为 <strong>' + exercise.hint[0] + '</strong></div>' +
        '<input type="text" class="practice-input" placeholder="请输入完整单词" autocomplete="off" />' +
        '<button class="practice-submit-btn" data-action="submit-blank">提交答案</button>';
    } else {
      questionHTML = '<div class="practice-question-text">' + C.esc(exercise.question) + '</div>' +
        '<div class="practice-options">' +
          exercise.options.map((opt, i) =>
            '<button class="practice-option-btn" data-option="' + C.esc(opt) + '">' +
              '<span class="option-label">' + String.fromCharCode(65 + i) + '</span>' +
              '<span class="option-word">' + C.esc(opt) + '</span>' +
            '</button>'
          ).join('') +
        '</div>';
    }

    overlay.innerHTML =
      '<div class="practice-modal">' +
        '<div class="practice-header">' +
          '<h3 class="practice-title">' + (exercise.type === 'blank' ? '首字母填空' : '选词填空') + '</h3>' +
          '<button class="practice-close" data-action="close">✕</button>' +
        '</div>' +
        '<div class="practice-body">' +
          questionHTML +
        '</div>' +
        '<div class="practice-result" style="display:none"></div>' +
      '</div>';

    document.body.appendChild(overlay);

    let answered = false;

    overlay.addEventListener('click', function(e) {
      if (e.target.closest('[data-action="close"]')) {
        overlay.remove();
        return;
      }

      if (e.target === overlay) {
        overlay.remove();
        return;
      }

      // 首字母填空提交
      const submitBtn = e.target.closest('[data-action="submit-blank"]');
      if (submitBtn && !answered) {
        const input = overlay.querySelector('.practice-input');
        const userAnswer = (input.value || '').trim().toLowerCase();
        const correct = userAnswer === exercise.answer.toLowerCase();
        showResult(overlay, correct, exercise.answer);
        answered = true;
        return;
      }

      // 选词填空选项
      const optionBtn = e.target.closest('.practice-option-btn');
      if (optionBtn && !answered) {
        const selected = optionBtn.dataset.option;
        const correct = selected.toLowerCase() === exercise.answer.toLowerCase();

        // 标记选项
        overlay.querySelectorAll('.practice-option-btn').forEach(btn => {
          btn.disabled = true;
          if (btn.dataset.option.toLowerCase() === exercise.answer.toLowerCase()) {
            btn.classList.add('correct');
          } else if (btn === optionBtn && !correct) {
            btn.classList.add('wrong');
          }
        });

        showResult(overlay, correct, exercise.answer);
        answered = true;
        return;
      }
    });

    // 首字母填空：Enter键提交
    const input = overlay.querySelector('.practice-input');
    if (input) {
      input.focus();
      input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !answered) {
          const submitBtn = overlay.querySelector('[data-action="submit-blank"]');
          if (submitBtn) submitBtn.click();
        }
      });
    }
  }

  function showResult(overlay, correct, answer) {
    const resultDiv = overlay.querySelector('.practice-result');
    resultDiv.style.display = 'block';
    resultDiv.className = 'practice-result ' + (correct ? 'correct' : 'wrong');
    resultDiv.innerHTML = correct
      ? '<div class="result-icon">✓</div><div class="result-text">回答正确！</div>'
      : '<div class="result-icon">✗</div><div class="result-text">回答错误，正确答案是：<strong>' + C.esc(answer) + '</strong></div>';
  }

  // ========== 在单词详情页添加练习按钮 ==========
  function addPracticeButtons(wordDetailBody, word) {
    const hasSentence = word.example || (word.realExamSentence?.sentences?.length > 0);
    if (!hasSentence) return;

    const section = document.createElement('div');
    section.className = 'word-detail-section';
    section.innerHTML =
      '<div class="word-detail-section-title">📝 题型强化</div>' +
      '<div class="practice-buttons">' +
        '<button class="practice-trigger-btn" data-mode="blank" data-word="' + C.esc(word.word) + '">' +
          '<span class="practice-btn-icon">A_____</span>' +
          '<span class="practice-btn-text">首字母填空</span>' +
        '</button>' +
        '<button class="practice-trigger-btn" data-mode="choice" data-word="' + C.esc(word.word) + '">' +
          '<span class="practice-btn-icon">A B C D</span>' +
          '<span class="practice-btn-text">选词填空</span>' +
        '</button>' +
      '</div>';

    section.addEventListener('click', function(e) {
      const btn = e.target.closest('.practice-trigger-btn');
      if (btn) {
        const mode = btn.dataset.mode;
        showPracticeModal(word, mode);
      }
    });

    // 插入到助记之后、学习状态之前
    const statusSection = wordDetailBody.querySelector('.word-detail-status')?.parentElement;
    if (statusSection) {
      wordDetailBody.insertBefore(section, statusSection);
    } else {
      wordDetailBody.appendChild(section);
    }
  }

  // 注册到全局
  C.generateBlankFilling = generateBlankFilling;
  C.generateMultipleChoice = generateMultipleChoice;
  C.showPracticeModal = showPracticeModal;
  C.addPracticeButtons = addPracticeButtons;
})();
