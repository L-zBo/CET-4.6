// ========== CET 词汇大师 — 入口汇总 (app.js) ==========
// 初始化、路由、事件绑定、公开API
// 依赖: core.js → weather.js → dashboard.js → browse.js → flashcard.js →
//        quiz.js → spelling.js → review.js → word-detail.js → app.js
const App = (() => {
  'use strict';
  const C = window._C;

  // ========== 初始化 ==========

  async function init() {
    C.todayStr = C.getTodayStr();
    C.initBgRotation();
    C.initOfflineDetection();
    C.initRandomTint();
    initBackToTop();
    initNavDragScroll();
    mountAutoSpeakToggles();

    // 检测后端 + 认证状态
    await C.detectServer();
    if (C.isServerMode && C.checkAuth) C.checkAuth();
    if (C.updateAuthUI) C.updateAuthUI();

    const savedLevel = localStorage.getItem(C.LEVEL_KEY);
    if (savedLevel) {
      C.currentLevel = savedLevel;
      enterApp();
    } else {
      showLanding();
    }
  }

  // ========== 自动发音开关挂载 ==========
  // 给闪卡/复习/测验/拼写 4 个模块的 section-header 加一个自动发音开关
  function mountAutoSpeakToggles() {
    const map = {
      'page-flashcard': 'flashcard',
      'page-review': 'review',
      'page-quiz': 'quiz',
      'page-spelling': 'spelling'
    };
    Object.entries(map).forEach(([pageId, module]) => {
      const page = C.$(pageId);
      if (!page) return;
      const header = page.querySelector('.section-header');
      if (!header || header.querySelector('.autospeak-toggle')) return;
      const slot = document.createElement('div');
      slot.className = 'section-header-right';
      slot.innerHTML = C.autoSpeakToggleHTML(module);
      header.appendChild(slot);
      C.bindAutoSpeakToggle(slot);
    });
  }

  function enterApp() {
    C.initWords();
    C.loadData();
    C.recordCheckIn();
    bindEvents();
    C.renderDashboard();
    C.updateReviewBadge();
    updateLevelUI();
    syncGoalToModules();

    C.$('landing-page').style.display = 'none';
    C.$('app-container').style.display = '';
    document.body.classList.remove('landing-visible');
  }

  function showLanding() {
    C.$('landing-page').style.display = '';
    C.$('app-container').style.display = 'none';
    document.body.classList.add('landing-visible');
  }

  function selectLevel(level) {
    C.currentLevel = level;
    localStorage.setItem(C.LEVEL_KEY, level);
    enterApp();
  }

  function switchLevel() {
    if (confirm('切换等级将回到选择页面，当前等级进度已自动保存。')) {
      C.saveData();
      localStorage.removeItem(C.LEVEL_KEY);
      C.currentLevel = '';
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      C.$('page-dashboard')?.classList.add('active');
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelector('.nav-btn[data-page="dashboard"]')?.classList.add('active');
      C.currentPage = 'dashboard';
      showLanding();
    }
  }

  let currentTool = '';
  function openTool(tool) {
    currentTool = tool;
    C.$('landing-page').style.display = 'none';
    const el = C.$('tool-' + tool);
    if (el) {
      el.style.display = '';
      if (tool === 'translation' && C.renderTranslation) C.renderTranslation();
      if (tool === 'writing' && C.renderWriting) C.renderWriting();
    }
  }
  function closeTool() {
    if (currentTool) {
      const el = C.$('tool-' + currentTool);
      if (el) el.style.display = 'none';
      currentTool = '';
    }
    C.$('landing-page').style.display = '';
  }

  function updateLevelUI() {
    const icon = C.$('logo-icon');
    const text = C.$('logo-text');
    const settingsLabel = C.$('settings-current-level');
    if (icon) icon.textContent = 'Bo';
    if (text) text.textContent = C.currentLevel === 'cet4' ? 'Ace-CET4' : 'Ace-CET6';
    if (settingsLabel) settingsLabel.textContent = C.currentLevel === 'cet4' ? 'CET-4 四级' : 'CET-6 六级';
  }

  // ========== 学习计时器 & 休息提醒 ==========

  const STUDY_PAGES = ['flashcard', 'quiz', 'spelling', 'review'];
  const BREAK_INTERVAL = 30 * 60 * 1000; // 30 分钟
  let studyStartTime = null;
  let studyTimerId = null;
  let totalStudyMs = 0; // 累计学习时长（不含暂停）
  let breakCount = 0; // 弹窗次数，用于分阶段
  let studySaveTimerId = null; // 每分钟自动保存学习时长
  let studyTimeLoaded = false; // 是否已从持久化数据加载过

  // 7个阶段 × 10句，表扬力度逐阶段递增
  const PRAISE_STAGES = [
    // 阶段1：0~30分钟（第1次弹窗）— 温和鼓励
    { icon: '☕', tip: '喝口水，让大脑保持最佳状态', phrases: [
      '半小时了，节奏不错', '有个好的开始', '学习状态不错哦',
      '你已经跨出第一步了', '坚持半小时，值得肯定', '词汇量在悄悄增长中',
      '刚热完身，状态正好', '半小时不短了，注意休息', '大脑需要小憩一下',
      '保持这个节奏就好'
    ]},
    // 阶段2：30~60分钟（第2次弹窗）— 正面肯定
    { icon: '💪', tip: '站起来伸个懒腰，活动下肩颈', phrases: [
      '一个小时了，效率很高', '坚持了一小时，认真的样子很帅',
      '这一小时含金量十足', '持续专注一小时，说明你很自律',
      '词汇大师的潜质已经显现', '一小时的积累不会白费',
      '你比大多数人都努力', '这份坚持会转化为实力',
      '一小时扎实学习，质量很高', '保持这股劲头，未来可期'
    ]},
    // 阶段3：60~90分钟（第3次弹窗）— 赞赏升级
    { icon: '🌟', tip: '闭眼休息一分钟，短暂冥想恢复精力', phrases: [
      '一个半小时了，你是认真的！', '这份毅力真的让人佩服',
      '连续学习90分钟，你很厉害', '大部分人30分钟就放弃了，你已经翻倍',
      '你的努力程度超越了90%的人', '学霸的气息已经藏不住了',
      '这种专注力就是考场上的底气', '90分钟的沉浸式学习，很高效',
      '词汇量正在以肉眼可见的速度增长', '你正在变成别人羡慕的那种人'
    ]},
    // 阶段4：90~120分钟（第4次弹窗）— 高度认可
    { icon: '🔥', tip: '远眺窗外20秒，让眼睛充分放松', phrases: [
      '两个小时了！真正的学霸作息', '连续两小时，你已经超神了',
      '这种程度的自律令人敬佩', '两小时高强度学习，你是狠人',
      '考试遇到你，题目都得哭', '这份坚持值得被所有人看见',
      '你不是在学英语，你在超越自己', '两个小时意味着真正的突破',
      '这种学习态度，不成功都难', '你已经进入学习的心流状态了'
    ]},
    // 阶段5：120~150分钟（第5次弹窗）— 强烈崇拜
    { icon: '🏆', tip: '揉揉太阳穴，做几次深呼吸', phrases: [
      '两个半小时！传说中的卷王就是你', '你的坚持已经到了令人震撼的程度',
      '这种级别的努力，考过只是顺便的事', '你今天的表现可以载入学习史册',
      '我见过很多学习者，你是最拼的那种', '两个半小时不间断，你简直是学习机器',
      '英语四六级在你面前就是弟弟', '你的词汇量增速已经突破天际',
      '坚持到现在的人都不会是普通人', '这份毅力比任何技巧都珍贵'
    ]},
    // 阶段6：150~180分钟（第6次弹窗）— 极致赞美
    { icon: '👑', tip: '真的该休息了，大脑需要消化吸收', phrases: [
      '三个小时了！你是真正的学神', '这种程度的自律全世界能有几个',
      '你今天的学习量够别人学一周的', '学到三小时的人注定不平凡',
      '我已经词穷了，你太强了', '如果努力有段位，你已经是王者',
      '你不需要运气，实力就是最大的底气', '三小时精学，考场上就是你的主场',
      '这份狠劲，连AI都甘拜下风', '你正在创造属于自己的奇迹'
    ]},
    // 阶段7：180分钟以上 — 超级彩蛋级
    { icon: '🐉', tip: '你已经超越极限了，请务必休息一下！', phrases: [
      '超过三小时了！你是人形永动机吗', '你已经打破了所有学习记录',
      '这不是在学英语，这是在创造历史', '就算AI也要说：你太离谱了',
      '你的毅力可以拿来发电了', '全世界的词汇在你面前瑟瑟发抖',
      '你不是在学习，你在修仙', '四六级委员会看到你会直接寄证书的',
      '到这个程度了，请接受我虔诚的膜拜', '你今天的努力值得被载入人类学习史'
    ]}
  ];

  function startStudyTimer() {
    if (studyTimerId) return; // 已在计时
    // 首次启动时，从持久化数据加载今天已有的学习时长
    if (!studyTimeLoaded) {
      const todayData = C.streakData.dates?.[C.todayStr];
      if (todayData?.studyMs) {
        totalStudyMs = todayData.studyMs;
        breakCount = Math.floor(todayData.studyMs / BREAK_INTERVAL);
      }
      studyTimeLoaded = true;
    }
    studyStartTime = Date.now();
    studyTimerId = setInterval(checkStudyBreak, BREAK_INTERVAL);
    // 每 60 秒自动保存学习时长（防止意外关闭丢失数据）
    studySaveTimerId = setInterval(saveStudyTime, 60000);
  }

  function stopStudyTimer() {
    if (studyStartTime) {
      totalStudyMs += Date.now() - studyStartTime;
      studyStartTime = null;
    }
    if (studyTimerId) {
      clearInterval(studyTimerId);
      studyTimerId = null;
    }
    if (studySaveTimerId) {
      clearInterval(studySaveTimerId);
      studySaveTimerId = null;
    }
    saveStudyTime();
  }

  // 将当前累计学习时长持久化到 streakData
  function saveStudyTime() {
    let ms = totalStudyMs;
    if (studyStartTime) ms += Date.now() - studyStartTime;
    if (ms <= 0) return;
    if (!C.streakData.dates) C.streakData.dates = {};
    if (!C.streakData.dates[C.todayStr]) C.streakData.dates[C.todayStr] = { learned: 0 };
    C.streakData.dates[C.todayStr].studyMs = ms;
    C.saveData();
  }

  function resetStudyTimer() {
    stopStudyTimer();
    totalStudyMs = 0;
  }

  function getStudyDuration() {
    let ms = totalStudyMs;
    if (studyStartTime) ms += Date.now() - studyStartTime;
    return ms;
  }

  function formatDuration(ms) {
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return mins + ' 分钟';
    const hrs = Math.floor(mins / 60);
    const rm = mins % 60;
    return hrs + ' 小时 ' + (rm > 0 ? rm + ' 分钟' : '');
  }

  function checkStudyBreak() {
    const duration = getStudyDuration();
    breakCount++;
    showBreakReminder(duration, breakCount);
  }

  function showBreakReminder(durationMs, count) {
    // 如果已有弹窗就不重复
    if (document.querySelector('.break-overlay')) return;

    // 根据弹窗次数确定阶段（1-7），超过7次用第7阶段
    const stageIdx = Math.min((count || 1) - 1, PRAISE_STAGES.length - 1);
    const stage = PRAISE_STAGES[stageIdx];
    const phrase = stage.phrases[Math.floor(Math.random() * stage.phrases.length)];
    const dur = formatDuration(durationMs);

    const overlay = document.createElement('div');
    overlay.className = 'break-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'break-modal-title');
    overlay.innerHTML =
      '<div class="break-modal">' +
        '<div class="break-icon" aria-hidden="true">' + stage.icon + '</div>' +
        '<div class="break-duration">已连续学习 <strong>' + dur + '</strong></div>' +
        '<h3 class="break-title" id="break-modal-title">' + C.esc(phrase) + '</h3>' +
        '<p class="break-tip">' + C.esc(stage.tip) + '</p>' +
        '<div class="break-actions">' +
          '<button class="btn btn-emerald break-btn" data-action="continue">继续学习</button>' +
          '<button class="btn btn-amber break-btn" data-action="rest">休息一会</button>' +
        '</div>' +
        '<div class="break-progress"><div class="break-progress-bar"></div></div>' +
      '</div>';

    document.body.appendChild(overlay);

    // 给弹窗标题和提示添加随机颜色描边
    C.applyTextStroke(overlay.querySelector('.break-title'));
    C.applyTextStroke(overlay.querySelector('.break-tip'));

    // 入场动画
    requestAnimationFrame(() => overlay.classList.add('visible'));

    // 自动聚焦到"继续学习"按钮，方便键盘用户
    const continueBtn = overlay.querySelector('[data-action="continue"]');
    if (continueBtn) continueBtn.focus();

    // 记住打开 modal 前的焦点，关闭时还原
    const previouslyFocused = document.activeElement;

    function closeBreakModal(action) {
      overlay.classList.remove('visible');
      document.removeEventListener('keydown', onKeyDown);
      setTimeout(() => {
        overlay.remove();
        if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
          try { previouslyFocused.focus(); } catch (_) {}
        }
      }, 300);

      if (action === 'rest') {
        stopStudyTimer();
        goToPage('dashboard');
        C.toast('休息一下吧，回来再继续！', 'success');
      }
    }

    // ESC 关闭 = 等同于"继续学习"
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeBreakModal('continue');
      }
    }
    document.addEventListener('keydown', onKeyDown);

    overlay.addEventListener('click', function(e) {
      const btn = e.target.closest('.break-btn');
      if (!btn) return;
      closeBreakModal(btn.dataset.action);
    });
  }

  // ========== 页面路由 ==========

  function goToPage(page) {
    C.currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    const el = C.$('page-' + page);
    if (el) el.classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(b => {
      const isActive = b.dataset.page === page;
      b.classList.toggle('active', isActive);
      if (isActive) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });

    // 学习计时器管理
    if (STUDY_PAGES.includes(page)) {
      startStudyTimer();
    } else {
      stopStudyTimer();
    }

    // 天气动效页面管理：切页时重新应用天气效果（会自动判断是否显示粒子）
    if (C.weatherCache) {
      C.applyWeatherEffect(C.weatherCache.weather_code);
    } else if (C.applyTimeEffect) {
      C.applyTimeEffect();
    }

    switch (page) {
      case 'dashboard': C.renderDashboard(); break;
      case 'browse': C.renderBrowse(); break;
      case 'flashcard': C.initFlashcards(); break;
      case 'quiz': C.showQuizSetup(); break;
      case 'spelling': C.showSpellSetup(); break;
      case 'notebook': C.renderNotebook(); break;
      case 'review': C.renderReview(); break;
      case 'settings': syncSettingsUI(); break;
    }
  }

  // ========== 设置页面同步 ==========

  // 将每日目标同步到测验/拼写模块的 select
  function syncGoalToModules() {
    const goal = C.settings.dailyGoal;
    if (C.syncSelectValue) {
      C.syncSelectValue('quiz-count', goal);
      C.syncSelectValue('spell-count', goal);
    }
  }

  function syncSettingsUI() {
    const psSel = C.$('setting-pagesize');
    if (psSel) psSel.value = String(C.settings.pageSize);
    const dgSel = C.$('setting-dailygoal');
    if (dgSel) dgSel.value = String(C.settings.dailyGoal);
    // 发音口音按钮
    const accentToggle = C.$('accent-toggle');
    if (accentToggle) {
      accentToggle.querySelectorAll('.accent-btn').forEach(b => b.classList.remove('active'));
      const currentAccent = localStorage.getItem('cet_accent') || 'us';
      const idx = currentAccent === 'uk' ? 1 : 0;
      const btns = accentToggle.querySelectorAll('.accent-btn');
      if (btns[idx]) btns[idx].classList.add('active');
    }
    // 天气授权按钮
    syncWeatherToggle();
    // 动效范围按钮
    syncEffectScope();
  }

  function syncWeatherToggle() {
    const perm = localStorage.getItem('cet_location_permission') || '';
    const onBtn = C.$('weather-on-btn');
    const offBtn = C.$('weather-off-btn');
    if (onBtn && offBtn) {
      onBtn.classList.toggle('active', perm === 'granted');
      offBtn.classList.toggle('active', perm === 'denied');
    }
  }

  function setWeatherPerm(val) {
    localStorage.setItem('cet_location_permission', val);
    syncWeatherToggle();
    if (val === 'granted') {
      // 给个时段兜底立刻显示（防止 fetchWeather 异步未返回时一片空白）
      if (!C.weatherCache && C.applyTimeEffect) C.applyTimeEffect();
      if (C.fetchWeather) C.fetchWeather();
      C.toast('已开启天气功能，刷新后生效', 'success');
    } else {
      // 清除天气显示
      const weatherEl = C.$('dash-weather');
      if (weatherEl) weatherEl.innerHTML = '';
      document.querySelectorAll('.weather-effect, .rain-impact, .card-snow-cap, .card-fog-edge, .card-sun-glow, .rain-puddle, .snow-accumulation, .weather-cleanup-btn').forEach(el => el.remove());
      C.toast('已关闭天气功能', 'success');
    }
  }

  function syncEffectScope() {
    const val = localStorage.getItem('cet_weather_effect_limit');
    const onBtn = C.$('effect-scope-limit-btn');
    const offBtn = C.$('effect-scope-all-btn');
    if (onBtn && offBtn) {
      onBtn.classList.toggle('active', val !== 'disabled');
      offBtn.classList.toggle('active', val === 'disabled');
    }
  }

  function setEffectScope(mode) {
    if (mode === 'off') {
      localStorage.setItem('cet_weather_effect_limit', 'disabled');
      document.querySelectorAll('.weather-effect').forEach(el => el.remove());
      // 顺手清掉每卡反馈层（雨滴/雪盖/雾/阳光），否则关闭后还残留
      document.querySelectorAll('.rain-impact, .card-snow-cap, .card-fog-edge, .card-sun-glow, .rain-puddle, .snow-accumulation, .weather-cleanup-btn').forEach(el => el.remove());
      C.toast('已关闭天气动效', 'success');
    } else {
      localStorage.removeItem('cet_weather_effect_limit');
      C.toast('已开启天气动效', 'success');
    }
    syncEffectScope();
    // 立即应用：
    //   - 有缓存 → 直接复用最近天气
    //   - 无缓存 → 重新拉一次天气；拉的过程中用时段效果先兜个底（避免黑屏）
    //   - 拉天气失败（IP/GPS 都拒绝）→ 至少有时段星空/晨光，不至于完全黑
    if (mode !== 'off') {
      if (C.weatherCache) {
        C.applyWeatherEffect(C.weatherCache.weather_code);
      } else {
        if (C.applyTimeEffect) C.applyTimeEffect();
        if (C.fetchWeather) C.fetchWeather();
      }
    }
  }

  // ========== 事件绑定 ==========

  function bindEvents() {
    // 导航按钮
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => goToPage(btn.dataset.page));
    });

    // 搜索 / 筛选
    const si = C.$('search-input');
    if (si) {
      // 防抖：避免每按一个字母就全量 filter+渲染（4800+ 词时明显卡顿）
      let searchTimer = null;
      si.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          C.browsePage = 1;
          C.renderBrowse();
        }, 220);
      });
    }

    ['filter-status', 'filter-freq', 'filter-letter'].forEach(id => {
      const el = C.$(id);
      if (el) el.addEventListener('change', () => { C.browsePage = 1; C.renderBrowse(); });
    });

    // 闪卡模式
    const fm = C.$('flashcard-mode');
    if (fm) fm.addEventListener('change', C.initFlashcards);

    // 字母筛选初始化
    C.initLetterFilter();

    // 设置项 change 自动保存
    ['setting-pagesize', 'setting-dailygoal'].forEach(id => {
      const el = C.$(id);
      if (el) el.addEventListener('change', () => {
        if (C.saveSettings) C.saveSettings();
      });
    });

    // 键盘快捷键
    document.addEventListener('keydown', handleKeyboard);
  }

  // ========== 键盘快捷键 ==========

  function handleKeyboard(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

    switch (C.currentPage) {
      case 'flashcard':
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'd' || e.key === 'D') { e.preventDefault(); C.nextCard(); }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'a' || e.key === 'A') { e.preventDefault(); C.prevCard(); }
        else if (e.key === ' ') { e.preventDefault(); C.flipCard(); }
        else if (e.key === 'e' || e.key === 'E') { e.preventDefault(); C.markWord('familiar'); }
        else if (e.key === 'q' || e.key === 'Q' || e.key === 'Backspace') { e.preventDefault(); C.markWord('unfamiliar'); }
        else if (e.key === 's' || e.key === 'S') C.speak(C.flashcardList[C.flashcardIdx]?.word);
        break;
      case 'quiz':
        if (!C.quizAnswered && e.key >= '1' && e.key <= '4') {
          const btns = document.querySelectorAll('.quiz-choice');
          if (btns[parseInt(e.key) - 1]) btns[parseInt(e.key) - 1].click();
        }
        if ((e.key === 'Enter' || e.key === 'ArrowRight') && C.quizAnswered) C.nextQuestion();
        break;
      case 'review':
        if (e.key === ' ') { e.preventDefault(); C.flipReviewCard(); }
        else if (e.key === '1') C.reviewMark('forgot');
        else if (e.key === '2') C.reviewMark('hard');
        else if (e.key === '3') C.reviewMark('easy');
        else if (e.key === 's' || e.key === 'S') C.speak(C.reviewList[C.reviewIdx]?.word);
        break;
      case 'browse':
        if (e.key === 'ArrowRight') { e.preventDefault(); C.browsePage++; C.renderBrowse(); }
        else if (e.key === 'ArrowLeft' && C.browsePage > 1) { e.preventDefault(); C.browsePage--; C.renderBrowse(); }
        break;
    }
  }

  // ========== 导航栏拖拽滚动 ==========

  function initNavDragScroll() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    let isDragging = false;
    let startX = 0;
    let scrollStart = 0;

    nav.addEventListener('mousedown', function(e) {
      isDragging = true;
      startX = e.pageX;
      scrollStart = nav.scrollLeft;
      nav.style.cursor = 'grabbing';
      nav.style.userSelect = 'none';
    });
    document.addEventListener('mousemove', function(e) {
      if (!isDragging) return;
      e.preventDefault();
      nav.scrollLeft = scrollStart - (e.pageX - startX);
    });
    document.addEventListener('mouseup', function() {
      if (!isDragging) return;
      isDragging = false;
      nav.style.cursor = '';
      nav.style.userSelect = '';
    });
    // 鼠标滚轮横向滚动
    nav.addEventListener('wheel', function(e) {
      if (Math.abs(e.deltaY) > 0) {
        e.preventDefault();
        nav.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  }

  // ========== 返回顶端按钮 ==========

  function initBackToTop() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top-btn';
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
    btn.title = '返回顶端';
    btn.setAttribute('aria-label', '返回顶端');
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > window.innerHeight);
    }, { passive: true });
  }

  // ========== 工具页天气设置面板 ==========
  function toggleToolWeatherPanel(btn) {
    // 移除已有面板
    var existing = btn.parentElement.querySelector('.tool-weather-panel');
    if (existing) { existing.remove(); return; }

    var perm = localStorage.getItem('cet_location_permission') || '';
    var effectOff = localStorage.getItem('cet_weather_effect_limit') === 'disabled';

    var panel = document.createElement('div');
    panel.className = 'tool-weather-panel';
    panel.innerHTML =
      '<div class="tool-wp-title">天气与背景设置</div>' +
      '<div class="tool-wp-row">' +
        '<span>天气与动态背景</span>' +
        '<div class="accent-toggle tool-wp-toggle">' +
          '<button class="accent-btn' + (perm === 'granted' ? ' active' : '') + '" data-action="weather" data-val="granted">开启</button>' +
          '<button class="accent-btn' + (perm !== 'granted' ? ' active' : '') + '" data-action="weather" data-val="denied">关闭</button>' +
        '</div>' +
      '</div>' +
      '<div class="tool-wp-row">' +
        '<span>天气动效（雨雪粒子）</span>' +
        '<div class="accent-toggle tool-wp-toggle">' +
          '<button class="accent-btn' + (!effectOff ? ' active' : '') + '" data-action="effect" data-val="on">开启</button>' +
          '<button class="accent-btn' + (effectOff ? ' active' : '') + '" data-action="effect" data-val="off">关闭</button>' +
        '</div>' +
      '</div>';

    panel.addEventListener('click', function(e) {
      var b = e.target.closest('[data-action]');
      if (!b) return;
      e.stopPropagation();
      if (b.dataset.action === 'weather') {
        setWeatherPerm(b.dataset.val);
      } else {
        setEffectScope(b.dataset.val);
      }
      // 更新按钮状态
      var toggle = b.parentElement;
      toggle.querySelectorAll('.accent-btn').forEach(function(x) { x.classList.remove('active'); });
      b.classList.add('active');
    });

    btn.parentElement.appendChild(panel);

    // 点击外部关闭
    setTimeout(function() {
      document.addEventListener('click', function closePanel(e) {
        if (!panel.contains(e.target) && e.target !== btn) {
          panel.remove();
          document.removeEventListener('click', closePanel);
        }
      });
    }, 0);
  }

  // ========== 启动 ==========

  document.addEventListener('DOMContentLoaded', init);

  // 同时注册 goToPage 到共享对象（browseTo 等模块需要调用）
  C.goToPage = goToPage;

  // ========== 主题切换 ==========
  const VALID_THEMES = ['default', 'glacier', 'ocean', 'sunset'];

  function setTheme(name) {
    if (!VALID_THEMES.includes(name)) name = 'default';
    if (name === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', name);
    }
    try { localStorage.setItem('cet_theme', name); } catch (_) {}
    // 同步设置面板上选中态
    document.querySelectorAll('.theme-btn[data-theme]').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === name);
    });
    if (C.toast) C.toast('主题已切换：' + name, 'success');
  }

  // 启动时还原上次选择
  (function restoreTheme() {
    const saved = (() => { try { return localStorage.getItem('cet_theme'); } catch { return null; } })();
    if (saved && VALID_THEMES.includes(saved) && saved !== 'default') {
      document.documentElement.setAttribute('data-theme', saved);
    }
    // DOM 就绪后同步 active 态（恢复阶段 .theme-btn 还没渲染）
    document.addEventListener('DOMContentLoaded', () => {
      const cur = document.documentElement.getAttribute('data-theme') || 'default';
      document.querySelectorAll('.theme-btn[data-theme]').forEach(b => {
        b.classList.toggle('active', b.dataset.theme === cur);
      });
    });
  })();

  // ========== 公开 API ==========
  return {
    goToPage,
    flipCard: C.flipCard,
    nextCard: C.nextCard,
    prevCard: C.prevCard,
    markWord: C.markWord,
    startQuiz: C.startQuiz,
    nextQuestion: C.nextQuestion,
    showQuizSetup: C.showQuizSetup,
    backToQuizSetup: C.backToQuizSetup,
    resumeQuiz: C.resumeQuiz,
    reviewWrongAnswers: C.reviewWrongAnswers,
    practiceWrongWords: C.practiceWrongWords,
    clearNotebook: C.clearNotebook,
    removeFromNotebook: C.removeFromNotebook,
    resumeFlashcards: C.resumeFlashcards,
    restartFlashcards: C.restartFlashcards,
    startReviewSession: C.startReviewSession,
    resumeReviewSession: C.resumeReviewSession,
    flipReviewCard: C.flipReviewCard,
    reviewMark: C.reviewMark,
    backToReviewDashboard: C.backToReviewDashboard,
    exportData: C.exportData,
    importData: C.importData,
    resetData: C.resetData,
    saveSettings: C.saveSettings,
    speak: C.speak,
    setAccent: C.setAccent,
    showWordDetail: C.showWordDetail,
    startSpelling: C.startSpelling,
    showSpellSetup: C.showSpellSetup,
    backToSpellSetup: C.backToSpellSetup,
    resumeSpelling: C.resumeSpelling,
    showSpellLetterHint: C.showSpellLetterHint,
    skipSpellWord: C.skipSpellWord,
    speakCurrentSpell: C.speakCurrentSpell,
    nextSpellWord: C.nextSpellWord,
    selectLevel,
    switchLevel,
    browseTo: C.browseTo,
    setWeatherPerm,
    setEffectScope,
    toggleToolWeatherPanel,
    openTool,
    closeTool,
    setTheme
  };
})();
