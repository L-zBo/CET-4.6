// ========== CET 词汇大师 — 词库浏览模块 (browse.js) ==========
// getFiltered, renderBrowse, renderPagination, browseTo, initLetterFilter
(function() {
  'use strict';
  const C = window._C;

  function getFiltered() {
    const s = (C.$('search-input')?.value || '').toLowerCase().trim();
    const st = C.$('filter-status')?.value || 'all';
    const fr = C.$('filter-freq')?.value || 'all';
    const lt = C.$('filter-letter')?.value || 'all';

    const todayWords = (C.browseTodayOnly || st === 'today') ? (C.streakData.dates?.[C.todayStr]?.words || []) : null;

    return C.words.filter(w => {
      if (todayWords && !todayWords.includes(w.word)) return false;
      if (s && !w.word.toLowerCase().includes(s) && !w.meaning.includes(s)) return false;
      if (st !== 'all' && st !== 'today' && C.status(w.word) !== st) return false;
      if (fr !== 'all' && w.freq !== fr) return false;
      if (lt !== 'all' && w.word[0].toUpperCase() !== lt) return false;
      return true;
    });
  }

  function renderBrowse() {
    const filtered = getFiltered();
    // 渲染完毕后清除 today-only 标志，确保后续操作（翻页、筛选）恢复正常显示
    C.browseTodayOnly = false;
    const ps = C.settings.pageSize || 50;
    const tp = Math.ceil(filtered.length / ps) || 1;
    if (C.browsePage > tp) C.browsePage = tp;

    C.text('word-count', '共 ' + filtered.length + ' 个单词');

    const start = (C.browsePage - 1) * ps;
    const page = filtered.slice(start, start + ps);

    const list = C.$('word-list');
    if (!list) return;
    list.innerHTML = '';

    page.forEach((w, idx) => {
      const st = C.status(w.word);
      const wc = C.notebook[w.word]?.count || 0;
      const fl = w.freq === 'high' ? '高频' : w.freq === 'mid' ? '中频' : '低频';
      const theme = C.CARD_THEMES[idx % C.CARD_THEMES.length];

      const div = document.createElement('div');
      div.className = 'word-item ' + theme;
      div.onclick = () => {
        if (C.incModuleCount) { C.incModuleCount('browse'); C.saveData(); }
        C.showWordDetail(w);
      };
      div.innerHTML =
        '<div class="word-main">' +
          '<span class="word-text">' + C.esc(w.word) + '</span>' +
          '<span class="word-phonetic">' + C.esc(w.phonetic) + '</span>' +
          '<span class="freq-tag ' + w.freq + '">' + fl + '</span>' +
          '<span class="status-dot ' + st + '" title="' +
            (st === 'mastered' ? '已掌握' : st === 'learning' ? '学习中' : '未学习') +
          '"></span>' +
          (wc > 0 ? '<span class="wrong-badge" title="错了' + wc + '次">✗' + (wc > 1 ? wc : '') + '</span>' : '') +
        '</div>' +
        '<div class="word-meaning">' + C.getDefsHTML(w) + '</div>';
      list.appendChild(div);
    });

    renderPagination(tp);
  }

  function renderPagination(tp) {
    const c = C.$('pagination');
    if (!c) return;
    c.innerHTML = '';
    if (tp <= 1) return;

    const mkBtn = (txt, pg, act) => {
      const b = document.createElement('button');
      b.className = 'page-btn' + (act ? ' active' : '');
      b.textContent = txt;
      b.onclick = () => {
        C.browsePage = pg;
        renderBrowse();
        // 翻页后滚动到页面顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
      return b;
    };

    if (C.browsePage > 1) c.appendChild(mkBtn('‹', C.browsePage - 1, false));

    for (let i = 1; i <= tp; i++) {
      if (tp > 7) {
        if (i === 1 || i === tp || (i >= C.browsePage - 1 && i <= C.browsePage + 1)) {
          c.appendChild(mkBtn(i, i, i === C.browsePage));
        } else if (i === C.browsePage - 2 || i === C.browsePage + 2) {
          const sp = document.createElement('span');
          sp.className = 'page-ellipsis';
          sp.textContent = '…';
          c.appendChild(sp);
        }
      } else {
        c.appendChild(mkBtn(i, i, i === C.browsePage));
      }
    }

    if (C.browsePage < tp) c.appendChild(mkBtn('›', C.browsePage + 1, false));
  }

  function browseTo(filter) {
    // 先重置 today-only 标志
    C.browseTodayOnly = false;
    C.goToPage('browse');
    const statusSel = C.$('filter-status');
    const searchInput = C.$('search-input');
    const freqSel = C.$('filter-freq');
    const letterSel = C.$('filter-letter');
    // 重置所有筛选条件到默认状态
    if (searchInput) searchInput.value = '';
    if (freqSel) freqSel.value = 'all';
    if (letterSel) letterSel.value = 'all';

    if (filter === 'all') {
      if (statusSel) statusSel.value = 'all';
    } else if (filter === 'mastered' || filter === 'learning' || filter === 'new') {
      if (statusSel) statusSel.value = filter;
    } else if (filter === 'today') {
      if (statusSel) statusSel.value = 'today';
    }
    C.browsePage = 1;
    renderBrowse();
  }

  function initLetterFilter() {
    const sel = C.$('filter-letter');
    if (!sel) return;
    while (sel.options.length > 1) sel.remove(1);
    const letters = [...new Set(C.words.map(w => w.word[0].toUpperCase()))].sort();
    letters.forEach(l => {
      const o = document.createElement('option');
      o.value = l; o.textContent = l;
      sel.appendChild(o);
    });
  }

  // 注册到共享对象
  C.getFiltered = getFiltered;
  C.renderBrowse = renderBrowse;
  C.renderPagination = renderPagination;
  C.browseTo = browseTo;
  C.initLetterFilter = initLetterFilter;
})();
