// ========== CET 词汇大师 — 考试信息模块 (exam-info.js) ==========
// 在翻译热词 / 写作模板页顶部展示：距下次考试倒计时、试卷结构、翻译主题分类。
//
// 数据全部来自 /api/exam/info：
//   有网  -> 后端校验官方站连通后返回随程序分发的基线数据，并给出校验时间
//   无网  -> 返回同一份基线数据，另附 offlineNotice，前端如实提示"当前无网络"
// 基线数据只收录官方已公布或依据官方安排整理的日程，不含任何推测日期；
// 因此这里**没有"押题预测"**——官方从不提前公布考题，任何"预测"都只能靠编，
// 与本项目"宁可留空也不编造"的原则冲突。展示的是可核查的历年主题分类。
(function() {
  'use strict';
  const C = window._C;

  let cache = null;        // 会话内缓存，避免每次进入工具页都打接口
  let inflight = null;

  function fetchExamInfo() {
    if (cache) return Promise.resolve(cache);
    if (inflight) return inflight;
    inflight = fetch('api/exam/info')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        inflight = null;
        if (d && d.ok) cache = d;
        return cache;
      })
      .catch(() => { inflight = null; return null; });
    return inflight;
  }

  // 供 app.js 在进入工具页前调用，做预加载
  C.preloadExamInfo = fetchExamInfo;

  function daysUntil(dateStr) {
    const target = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target - today) / 86400000);
  }

  function pickNextExam(exams) {
    const upcoming = (exams || [])
      .filter(e => e.written && daysUntil(e.written.date) >= 0)
      .sort((a, b) => (a.written.date < b.written.date ? -1 : 1));
    return upcoming[0] || null;
  }

  function buildHTML(payload) {
    const d = payload.data;
    const next = pickNextExam(d.exams);
    let html = '<div class="exam-banner">';

    // —— 倒计时 ——
    if (next) {
      const days = daysUntil(next.written.date);
      const w = next.written;
      html += '<div class="exam-countdown">' +
        '<div class="exam-cd-num">' + days + '</div>' +
        '<div class="exam-cd-unit">天后开考</div>' +
      '</div>' +
      '<div class="exam-main">' +
        '<div class="exam-title">' + C.esc(next.label) + '　笔试 ' + C.esc(w.date) + '</div>' +
        '<div class="exam-times">' +
          '<span class="exam-time-chip">四级 ' + C.esc(w.cet4) + '</span>' +
          '<span class="exam-time-chip">六级 ' + C.esc(w.cet6) + '</span>' +
          (w.note ? '<span class="exam-note">' + C.esc(w.note) + '</span>' : '') +
        '</div>' +
        (next.spoken && next.spoken.length
          ? '<div class="exam-times">' + next.spoken.map(s =>
              '<span class="exam-time-chip exam-chip-dim">' + C.esc(s.name) + ' ' + C.esc(s.date) + '</span>'
            ).join('') + '</div>'
          : '') +
        (next.confirmed
          ? ''
          : '<div class="exam-warn">⚠ ' + C.esc(next.confirmNote || '官方正式公告发布后将更新') + '</div>') +
      '</div>';
    } else {
      html += '<div class="exam-main"><div class="exam-title">暂无已公布的下次考试日程</div>' +
        '<div class="exam-warn">官方公布后本处会更新，不做任何日期推测</div></div>';
    }

    // —— 数据状态：更新时间 + 无网提示 ——
    html += '<div class="exam-meta">' +
      '<span class="exam-updated">数据更新于 ' + C.esc(payload.updatedAt) + '</span>' +
      (payload.online
        ? '<span class="exam-online">● 已联网校验</span>'
        : '<span class="exam-offline">● 当前无网络，使用本地数据</span>') +
    '</div>';

    if (payload.offlineNotice) {
      html += '<div class="exam-offline-tip">' + C.esc(payload.offlineNotice) + '</div>';
    }

    html += '</div>';

    // —— 折叠区：试卷结构 + 翻译主题分类 ——
    if (d.paper && d.paper.sections) {
      html += '<details class="exam-fold"><summary>📋 试卷结构与分值</summary><div class="exam-fold-body">' +
        d.paper.sections.map(s =>
          '<div class="exam-sec-row">' +
            '<span class="exam-sec-name">' + C.esc(s.name) + '</span>' +
            '<span class="exam-sec-weight">' + C.esc(s.weight) + '</span>' +
            '<span class="exam-sec-score">' + C.esc(String(s.score)) + ' 分</span>' +
            (s.minutes ? '<span class="exam-sec-min">' + s.minutes + ' 分钟</span>' : '') +
            '<span class="exam-sec-detail">' + C.esc(s.detail) + '</span>' +
          '</div>'
        ).join('') +
        '<div class="exam-credit">' + C.esc(d.paper.note) + '</div>' +
      '</div></details>';
    }

    const th = d.translationThemes;
    if (th && th.categories) {
      html += '<details class="exam-fold"><summary>🎯 翻译高频主题（历年真题分类）</summary><div class="exam-fold-body">' +
        th.categories.map(c =>
          '<div class="exam-theme-row">' +
            '<span class="exam-theme-name">' + C.esc(c.name) + '</span>' +
            '<span class="exam-theme-eg">' + c.examples.map(x =>
              '<span class="exam-theme-tag">' + C.esc(x) + '</span>').join('') + '</span>' +
          '</div>'
        ).join('') +
        '<div class="exam-credit">' + C.esc(th.note) + '</div>' +
      '</div></details>';
    }

    return html;
  }

  // 在指定工具页顶部渲染（幂等：重复调用只替换内容，不叠加）
  function renderExamBanner(toolId) {
    const page = C.$('tool-' + toolId);
    if (!page) return;
    const inner = page.querySelector('.tool-page-inner');
    if (!inner) return;

    let host = inner.querySelector('.exam-info-host');
    if (!host) {
      host = document.createElement('div');
      host.className = 'exam-info-host';
      const header = inner.querySelector('.tool-header');
      if (header && header.nextSibling) inner.insertBefore(host, header.nextSibling);
      else inner.insertBefore(host, inner.firstChild);
    }
    host.innerHTML = '<div class="exam-banner exam-loading">正在获取考试信息…</div>';

    fetchExamInfo().then(payload => {
      if (!payload) {
        host.innerHTML = '<div class="exam-banner exam-banner-fail">' +
          '暂时无法获取考试信息（接口不可用），不影响下方内容使用</div>';
        return;
      }
      host.innerHTML = buildHTML(payload);
    });
  }

  C.renderExamBanner = renderExamBanner;

  // 预加载：首屏空闲后先把考试信息取回来，用户点进工具页时即可瞬时渲染。
  // 放在空闲回调里，不与首屏资源抢带宽；失败静默，不影响任何现有功能。
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => fetchExamInfo(), { timeout: 8000 });
  } else {
    setTimeout(fetchExamInfo, 4000);
  }
})();
