// ========== CET 词汇大师 — 词库增强数据模块 (word-bank.js) ==========
// 数据来源：
//   ECDICT  https://github.com/skywind3000/ECDICT   词形变化 / 柯林斯星级 / 牛津核心 / BNC+当代词频 / 英文释义
//   Tatoeba https://tatoeba.org  CC-BY 2.0 FR       真实英中对照例句（保留原始 sentence id 可溯源）
// 数据由 scripts/build_wordbank.py 生成，按首字母切片放在 public/wordbank/，
// 后端挂载在 /wordbank。这里按需 fetch 单个分片并缓存 —— 全量 5.3MB，绝不能进首屏。
(function() {
  'use strict';
  const C = window._C;

  const SHARD_BASE = 'wordbank/';
  const shardCache = {};   // letter -> Promise<Object>

  function loadShard(letter) {
    const key = /^[a-z]$/.test(letter) ? letter : '_';
    if (!shardCache[key]) {
      shardCache[key] = fetch(SHARD_BASE + key + '.json')
        .then(r => (r.ok ? r.json() : {}))
        .catch(() => ({}));   // 拿不到就当没有，绝不阻断弹窗
    }
    return shardCache[key];
  }

  function getEntry(word) {
    if (!word) return Promise.resolve(null);
    return loadShard(word[0].toLowerCase()).then(shard => shard[word] || null);
  }

  // ECDICT 的 definition/translation 里换行是字面的反斜杠+n，不是真换行
  function splitLines(text) {
    return String(text || '').split('\\n').map(s => s.trim()).filter(Boolean);
  }

  function section(title, inner, extraClass) {
    return '<div class="word-detail-section ' + (extraClass || '') + '">' +
      '<div class="word-detail-section-title">' + title + '</div>' +
      inner +
    '</div>';
  }

  // ---------- A. 词形变化 ----------
  const FORM_ORDER = ['过去式', '过去分词', '现在分词', '第三人称单数', '复数', '比较级', '最高级'];

  function buildExchangeHTML(entry) {
    const ex = entry.exchange;
    if (!ex) return '';
    const keys = FORM_ORDER.filter(k => ex[k]);
    if (!keys.length) return '';
    const items = keys.map(k =>
      '<span class="wb-form"><span class="wb-form-label">' + C.esc(k) + '</span>' +
      '<span class="wb-form-value">' + C.esc(ex[k]) + '</span></span>'
    ).join('');
    return section('🔤 词形变化', '<div class="wb-forms">' + items + '</div>');
  }

  // ---------- B. 权威词频与重要度 ----------
  function buildRankHTML(entry) {
    const bits = [];
    if (entry.collins) {
      const star = Math.min(entry.collins, 5);
      const cls = star >= 4 ? 'freq-high' : star >= 2 ? 'freq-mid' : 'freq-low';
      bits.push('<span class="word-star-rating ' + cls + '">' + '⭐'.repeat(star) +
        ' <span class="freq-label-inline">柯林斯 ' + star + ' 星</span></span>');
    }
    if (entry.oxford) bits.push('<span class="wb-badge wb-badge-oxford">牛津核心 3000</span>');
    (entry.tag || []).forEach(t => {
      const label = { cet4: '四级', cet6: '六级', ky: '考研', toefl: '托福', ielts: '雅思', gre: 'GRE', zk: '中考', gk: '高考' }[t];
      if (label) bits.push('<span class="wb-badge wb-tag-' + C.esc(t) + '">' + label + '</span>');
    });
    if (entry.bnc) bits.push('<span class="wb-rank">BNC 词频 #' + entry.bnc + '</span>');
    if (entry.frq) bits.push('<span class="wb-rank">当代语料 #' + entry.frq + '</span>');
    if (!bits.length) return '';
    return section('📊 权威词频与考纲', '<div class="wb-ranks">' + bits.join('') + '</div>');
  }

  // ---------- C. Tatoeba 真实例句 ----------
  function highlight(text, word) {
    const safe = C.esc(text);
    const re = new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\w*\\b', 'gi');
    return safe.replace(re, m => '<mark>' + m + '</mark>');
  }

  function buildExamplesHTML(entry, w) {
    const list = entry.examples || [];
    if (!list.length) return '';
    const rows = list.map(ex => {
      const zh = ex.zh
        ? '<div class="wb-ex-zh">' + C.esc(ex.zh) + '</div>'
        : '<div class="wb-ex-zh wb-ex-notrans">（该句暂无中文对照，未作机器翻译）</div>';
      return '<div class="wb-example">' +
        '<div class="wb-ex-en">' + highlight(ex.en, w.word) + '</div>' + zh +
        '<div class="wb-ex-src">Tatoeba #' + C.esc(String(ex.id)) + '</div>' +
      '</div>';
    }).join('');
    return section('💬 真实语料例句',
      '<div class="wb-examples">' + rows + '</div>' +
      '<div class="wb-credit">例句来自 <a href="https://tatoeba.org" target="_blank" rel="noopener">Tatoeba</a>，' +
      '按 CC-BY 2.0 FR 使用，仅做检索筛选与繁简转换，未作任何改写</div>');
  }

  // ---------- D. 英文释义（默认折叠）----------
  function buildEnDefHTML(entry) {
    const lines = splitLines(entry.definition);
    if (!lines.length) return '';
    const items = lines.slice(0, 8).map(l => '<li>' + C.esc(l) + '</li>').join('');
    return '<div class="word-detail-section wb-endef">' +
      '<details><summary class="word-detail-section-title wb-summary">🔎 英文释义（' + lines.length + ' 条）</summary>' +
      '<ul class="wb-endef-list">' + items + '</ul>' +
      '<div class="wb-credit">释义来自 <a href="https://github.com/skywind3000/ECDICT" target="_blank" rel="noopener">ECDICT</a></div>' +
      '</details></div>';
  }

  // ---------- 注入到详情弹窗 ----------
  function addWordBankSections(bodyDiv, w) {
    if (!bodyDiv || !w || !w.word) return;
    getEntry(w.word).then(entry => {
      if (!entry || !bodyDiv.isConnected) return;

      // 前置区（词形变化 + 词频考纲）插到弹窗最前，紧跟音标
      const headHTML = buildExchangeHTML(entry) + buildRankHTML(entry);
      if (headHTML) {
        const head = document.createElement('div');
        head.className = 'wb-head-group';
        head.innerHTML = headHTML;
        bodyDiv.insertBefore(head, bodyDiv.firstChild);
      }

      // 后置区（例句 + 英文释义）追加到末尾
      const tailHTML = buildExamplesHTML(entry, w) + buildEnDefHTML(entry);
      if (tailHTML) {
        const tail = document.createElement('div');
        tail.className = 'wb-tail-group';
        tail.innerHTML = tailHTML;
        bodyDiv.appendChild(tail);
      }
    });
  }

  C.addWordBankSections = addWordBankSections;
  C.getWordBankEntry = getEntry;
})();
