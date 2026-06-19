// ========== CET 词汇大师 — 仪表盘模块 (dashboard.js) ==========
// renderDashboard, renderStreakCalendar, renderDailyGoal, renderMemoryCurve
(function() {
  'use strict';
  const C = window._C;

  function renderDashboard() {
    const total = C.words.length;
    const mastered = C.words.filter(w => C.status(w.word) === 'mastered').length;
    const learning = C.words.filter(w => C.status(w.word) === 'learning').length;
    const newW = total - mastered - learning;
    const today = C.streakData.dates?.[C.todayStr]?.learned || 0;

    C.text('stat-total', total);
    C.text('stat-mastered', mastered);
    C.text('stat-learning', learning);
    C.text('stat-new', newW);
    C.text('stat-today', today);

    // 进度条
    const pct = total > 0 ? Math.round(mastered / total * 100) : 0;
    C.text('progress-label', mastered + ' / ' + total + ' 已掌握');
    C.text('progress-pct', pct + '%');
    const bar = C.$('progress-bar');
    if (bar) bar.style.width = Math.max(3, pct) + '%';

    // 问候语：按天气×时段双维，每格 20 句随机（详见 dashboard_greetings.js）
    // 没拿到天气时退化为只看时段。
    const h = new Date().getHours();
    let g, timeIcon;
    if (C.pickGreeting) {
      const weatherCode = C.weatherCache ? C.weatherCache.weather_code : null;
      const picked = C.pickGreeting(h, weatherCode);
      g = picked.text;
      timeIcon = picked.icon;
    } else {
      // 兜底（dashboard_greetings.js 还没加载完时）
      g = '继续加油';
      timeIcon = h < 6 ? '🌙' : h < 9 ? '🌅' : h < 12 ? '☀️' : h < 14 ? '🌞' : h < 18 ? '🌤️' : h < 21 ? '🌆' : '🌙';
    }
    C.text('dash-greeting', g);
    C.text('dash-time-icon', timeIcon);

    // 随机颜色描边效果
    C.applyTextStroke(C.$('dash-greeting'));
    C.applyTextStroke(C.$('dash-sub'));

    // 获取天气（获取失败时应用时间段效果）
    // 注意：fetchWeather 是异步的，第一行返回时 weatherCache 几乎肯定还是 null。
    // 如果这里立即 `if (!weatherCache) applyTimeEffect()`，就会把粒子盖掉，导致用户
    // 在异步回填前几百 ms 一片空白——以为粒子坏了。所以：
    //   - 有缓存：fetchWeather 内部命中分支会立刻 applyWeatherEffect，这里啥都不干
    //   - 无缓存：先用时段兜底显示星空/晨光等，等 fetchWeather 拉到天气会自然替换
    if (C.fetchWeather) {
      const hadCache = !!C.weatherCache;
      C.fetchWeather();
      if (!hadCache && C.applyTimeEffect) C.applyTimeEffect();
    } else if (C.applyTimeEffect) {
      C.applyTimeEffect();
    }

    const streak = C.streakData.currentStreak || 0;
    C.text('dash-sub', streak > 0
      ? '已连续学习 ' + streak + ' 天，继续保持！'
      : '开始你的第一天打卡吧');

    // 待复习提醒（升级为 CTA 按钮，直接跳复习页）
    const dueCount = C.getDueWords().length;
    const rp = C.$('dash-review-prompt');
    if (rp) {
      if (dueCount > 0) {
        rp.innerHTML =
          '<button class="dash-cta-review" onclick="App.goToPage(\'review\')" aria-label="去复习 ' + dueCount + ' 个待复习单词">' +
            '<span class="dash-cta-icon">📖</span>' +
            '<span class="dash-cta-text">' +
              '<strong>' + dueCount + ' 个单词</strong> 等你复习' +
              '<span class="dash-cta-sub">按记忆曲线安排，今天复习能多记 30%</span>' +
            '</span>' +
            '<span class="dash-cta-arrow">→</span>' +
          '</button>';
        rp.style.display = 'block';
      } else {
        // 没复习任务时改为引导今日学习
        const todayLearned = C.getTodayLearnedCount ? C.getTodayLearnedCount() : 0;
        const dailyGoal = (C.settings && C.settings.dailyGoal) || 30;
        if (todayLearned < dailyGoal) {
          rp.innerHTML =
            '<button class="dash-cta-review dash-cta-secondary" onclick="App.goToPage(\'flashcard\')" aria-label="继续今日学习">' +
              '<span class="dash-cta-icon">🎯</span>' +
              '<span class="dash-cta-text">' +
                '<strong>今日还差 ' + (dailyGoal - todayLearned) + ' 词</strong> 完成目标' +
                '<span class="dash-cta-sub">点击进入闪卡继续学习</span>' +
              '</span>' +
              '<span class="dash-cta-arrow">→</span>' +
            '</button>';
          rp.style.display = 'block';
        } else {
          rp.innerHTML = '<div class="dash-cta-done">🎉 今日目标已完成，明天见！</div>';
          rp.style.display = 'block';
        }
      }
    }

    C.text('quick-review-count', dueCount > 0
      ? dueCount + ' 个单词待复习'
      : '暂无待复习单词');

    const streakEl = C.$('streak-info');
    if (streakEl) {
      const fireSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>';
      const sleepSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4h4l1-2h1l1 2h4"/><path d="M6 12h4l1-2h1l1 2h4"/><path d="M10 20h4l1-2h1l1 2h4"/></svg>';
      streakEl.innerHTML = (streak > 0 ? fireSvg : sleepSvg) + ' 连续 ' + streak + ' 天';
    }
    renderStreakCalendar();
    C.renderDailyGoal();
    if (C.renderModuleSummary) C.renderModuleSummary('dashboard-module-summary');
  }

  // ========== 农历算法（简化版） ==========
  // 农历数据表 1900-2100，每年用十六进制存储闰月和大小月信息
  const LUNAR_INFO = [
    0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
    0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
    0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
    0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
    0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
    0x06ca0,0x0b550,0x15355,0x04da0,0x0a5d0,0x14573,0x052d0,0x0a9a8,0x0e950,0x06aa0,
    0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
    0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
    0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
    0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0,
    0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
    0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
    0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
    0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
    0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
    0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,
    0x092e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,
    0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,
    0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,
    0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a4d0,0x0d150,0x0f252,
    0x0d520
  ];
  const LUNAR_MONTH = ['正','二','三','四','五','六','七','八','九','十','冬','腊'];
  const LUNAR_DAY_PRE = ['初','初','初','初','初','初','初','初','初','初','十','十','十','十','十','十','十','十','十','十','廿','廿','廿','廿','廿','廿','廿','廿','廿','三'];
  const LUNAR_DAY_NUM = ['','一','二','三','四','五','六','七','八','九','十','一','二','三','四','五','六','七','八','九','十','一','二','三','四','五','六','七','八','九','十'];

  function lunarYearDays(y) {
    let sum = 348;
    for (let i = 0x8000; i > 0x8; i >>= 1) sum += (LUNAR_INFO[y - 1900] & i) ? 1 : 0;
    return sum + leapDays(y);
  }
  function leapMonth(y) { return LUNAR_INFO[y - 1900] & 0xf; }
  function leapDays(y) { return leapMonth(y) ? ((LUNAR_INFO[y - 1900] & 0x10000) ? 30 : 29) : 0; }
  function monthDaysLunar(y, m) { return (LUNAR_INFO[y - 1900] & (0x10000 >> m)) ? 30 : 29; }

  function solarToLunar(yy, mm, dd) {
    let offset = Math.floor((Date.UTC(yy, mm - 1, dd) - Date.UTC(1900, 0, 31)) / 86400000);
    let lunarY = 1900;
    for (; lunarY < 2101 && offset > 0; lunarY++) offset -= lunarYearDays(lunarY);
    if (offset < 0) { offset += lunarYearDays(--lunarY); }

    const leap = leapMonth(lunarY);
    let isLeap = false;
    let lunarM = 1;
    for (; lunarM < 13 && offset > 0; lunarM++) {
      if (leap > 0 && lunarM === (leap + 1) && !isLeap) {
        --lunarM; isLeap = true;
        const ld = leapDays(lunarY);
        if (offset < ld) break;
        offset -= ld; isLeap = false;
      } else {
        const md = monthDaysLunar(lunarY, lunarM);
        if (offset < md) break;
        offset -= md;
      }
    }
    if (leap > 0 && lunarM === (leap + 1) && !isLeap) { --lunarM; isLeap = true; }
    const lunarD = offset + 1;

    const mStr = (isLeap ? '闰' : '') + LUNAR_MONTH[lunarM - 1] + '月';
    const dStr = lunarD === 10 ? '初十' : lunarD === 20 ? '二十' : lunarD === 30 ? '三十' : LUNAR_DAY_PRE[lunarD - 1] + LUNAR_DAY_NUM[lunarD];
    return mStr + dStr;
  }

  // 悬浮卡片随机色板
  const POPUP_COLORS = [
    { bg: 'rgba(240,165,0,0.15)', border: 'rgba(240,165,0,0.35)', accent: '#f0a500' },
    { bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.35)', accent: '#34d399' },
    { bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.35)', accent: '#60a5fa' },
    { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.35)', accent: '#a78bfa' },
    { bg: 'rgba(251,113,133,0.15)', border: 'rgba(251,113,133,0.35)', accent: '#fb7185' },
    { bg: 'rgba(45,212,191,0.15)', border: 'rgba(45,212,191,0.35)', accent: '#2dd4bf' },
    { bg: 'rgba(250,204,21,0.15)', border: 'rgba(250,204,21,0.35)', accent: '#facc15' },
    { bg: 'rgba(244,114,182,0.15)', border: 'rgba(244,114,182,0.35)', accent: '#f472b6' }
  ];

  // ========== 月度日历打卡 ==========
  let calendarYear = new Date().getFullYear();
  let calendarMonth = new Date().getMonth(); // 0-based

  function renderStreakCalendar(year, month) {
    if (year !== undefined) calendarYear = year;
    if (month !== undefined) calendarMonth = month;

    const c = C.$('streak-calendar');
    if (!c) return;
    c.innerHTML = '';
    const goal = C.settings.dailyGoal || 30;
    const today = new Date();
    const todayStr = C.todayStr;

    // 移除旧浮窗
    document.querySelectorAll('.streak-popup').forEach(el => el.remove());

    // 更新月份标签
    const label = C.$('streak-month-label');
    if (label) label.textContent = calendarYear + '年' + (calendarMonth + 1) + '月';

    // 导航按钮禁用判断（不能超过当月）
    const nextBtn = C.$('streak-next-month');
    if (nextBtn) {
      nextBtn.disabled = (calendarYear === today.getFullYear() && calendarMonth >= today.getMonth());
    }

    // 获取该月第1天和最后一天
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    // 该月第1天是周几（周一=0, 周日=6）
    let startWeekday = firstDay.getDay() - 1;
    if (startWeekday < 0) startWeekday = 6; // 周日

    // 统计
    let monthLearned = 0, monthDays = 0;

    // 填充前置空白
    for (let i = 0; i < startWeekday; i++) {
      const empty = document.createElement('div');
      empty.className = 'streak-dot empty';
      c.appendChild(empty);
    }

    // 每一天
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(calendarYear, calendarMonth, day);
      const ds = C.fmt(d);
      const info = C.streakData.dates?.[ds];
      const learned = info?.learned || 0;
      const isFuture = d > today;
      const isToday = ds === todayStr;

      monthLearned += learned;
      if (learned > 0) monthDays++;

      const dot = document.createElement('div');
      dot.className = 'streak-dot';
      // 公历数字
      const daySpan = document.createElement('span');
      daySpan.className = 'streak-dot-day';
      daySpan.textContent = day;
      dot.appendChild(daySpan);
      // 农历小字
      var lunarFull = solarToLunar(calendarYear, calendarMonth + 1, day);
      // 只取日（如 "初五"），月初显示月名（如 "二月"）
      var lunarDay = lunarFull.replace(/^闰?.*月/, '');
      var lunarLabel = (lunarDay === '初一') ? lunarFull.replace(lunarDay, '').replace('闰', '闰') : lunarDay;
      var lunarSpan = document.createElement('span');
      lunarSpan.className = 'streak-dot-lunar';
      lunarSpan.textContent = lunarLabel;
      dot.appendChild(lunarSpan);

      if (isFuture) {
        dot.classList.add('future');
      } else if (info) {
        if (learned === 0) {
          dot.style.background = 'var(--coral)';
          dot.style.boxShadow = '0 0 4px var(--coral-glow)';
          dot.style.color = '#fff';
        } else if (learned >= goal * 1.5) {
          dot.style.background = 'linear-gradient(135deg, var(--amber), var(--amber-light))';
          dot.style.boxShadow = '0 0 8px rgba(240,165,0,0.4)';
          dot.style.color = 'var(--bg-deep)';
          dot.style.fontWeight = '700';
        } else if (learned >= goal) {
          dot.style.background = 'var(--emerald)';
          dot.style.boxShadow = '0 0 6px var(--emerald-glow)';
          dot.style.color = 'var(--bg-deep)';
          dot.style.fontWeight = '700';
        } else {
          dot.style.background = 'var(--amber)';
          dot.style.boxShadow = '0 0 4px var(--amber-glow)';
          dot.style.opacity = String(0.5 + (learned / goal) * 0.5);
          dot.style.color = 'var(--bg-deep)';
        }
      }

      if (isToday) dot.classList.add('today');

      // 悬停数据
      if (!isFuture) {
        const dateLabel = (d.getMonth() + 1) + '/' + d.getDate();
        const weekDay = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
        dot.dataset.date = dateLabel;
        dot.dataset.weekDay = weekDay;
        dot.dataset.learned = learned;
        dot.dataset.goal = goal;
        dot.dataset.hasInfo = info ? '1' : '0';
        dot.dataset.lunar = lunarFull;
        dot.dataset.studyMs = String(info?.studyMs || 0);

        const dayWords = info?.words || [];
        let correctCount = 0, totalAttempts = 0;
        dayWords.forEach(w => {
          totalAttempts++;
          if (!C.notebook[w]) correctCount++;
        });
        dot.dataset.accuracy = totalAttempts > 0 ? Math.round(correctCount / totalAttempts * 100) : (learned > 0 ? 100 : 0);

        dot.addEventListener('mouseenter', function(e) { showStreakPopup(this, e); });
        dot.addEventListener('mouseleave', function() { hideStreakPopup(); });
      }

      c.appendChild(dot);
    }

    // 统计行（该月数据）
    // 同时算本周数据
    let weekLearned = 0, weekDays = 0;
    const dayOfWeek = today.getDay() || 7;
    for (let i = 0; i < dayOfWeek; i++) {
      const wd = new Date(today);
      wd.setDate(wd.getDate() - i);
      const ws = C.fmt(wd);
      const wl = C.streakData.dates?.[ws]?.learned || 0;
      weekLearned += wl;
      if (wl > 0) weekDays++;
    }

    const statsRow = C.$('streak-stats-row');
    if (statsRow) {
      statsRow.innerHTML =
        '<div class="streak-stat-item">' +
          '<div class="streak-stat-num">' + weekLearned + '</div>' +
          '<div class="streak-stat-label">本周学词</div>' +
        '</div>' +
        '<div class="streak-stat-item">' +
          '<div class="streak-stat-num">' + weekDays + '</div>' +
          '<div class="streak-stat-label">本周打卡天</div>' +
        '</div>' +
        '<div class="streak-stat-item">' +
          '<div class="streak-stat-num">' + monthLearned + '</div>' +
          '<div class="streak-stat-label">本月学词</div>' +
        '</div>' +
        '<div class="streak-stat-item">' +
          '<div class="streak-stat-num">' + monthDays + '</div>' +
          '<div class="streak-stat-label">本月打卡</div>' +
        '</div>';
    }

    // 图例
    let legend = c.parentElement?.querySelector('.streak-legend');
    if (!legend) {
      legend = document.createElement('div');
      legend.className = 'streak-legend';
      legend.innerHTML =
        '<span class="streak-legend-item"><span class="streak-legend-dot" style="background:rgba(255,255,255,0.04)"></span>未打卡</span>' +
        '<span class="streak-legend-item"><span class="streak-legend-dot" style="background:var(--coral)"></span>仅签到</span>' +
        '<span class="streak-legend-item"><span class="streak-legend-dot" style="background:var(--amber)"></span>部分完成</span>' +
        '<span class="streak-legend-item"><span class="streak-legend-dot" style="background:var(--emerald)"></span>达标</span>' +
        '<span class="streak-legend-item"><span class="streak-legend-dot" style="background:linear-gradient(135deg,var(--amber),var(--amber-light))"></span>超额</span>';
      c.parentElement?.appendChild(legend);
    }

    // 绑定月份导航（仅绑定一次）
    bindCalendarNav();
  }

  let calNavBound = false;
  function bindCalendarNav() {
    if (calNavBound) return;
    calNavBound = true;
    const prevBtn = C.$('streak-prev-month');
    const nextBtn = C.$('streak-next-month');
    if (prevBtn) prevBtn.addEventListener('click', function() {
      calendarMonth--;
      if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
      renderStreakCalendar();
    });
    if (nextBtn) nextBtn.addEventListener('click', function() {
      const now = new Date();
      if (calendarYear === now.getFullYear() && calendarMonth >= now.getMonth()) return;
      calendarMonth++;
      if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
      renderStreakCalendar();
    });
  }

  // ========== 打卡悬浮卡片 ==========

  // 格式化毫秒为可读时长
  function fmtStudyMs(ms) {
    if (ms <= 0) return '—';
    var mins = Math.round(ms / 60000);
    if (mins < 1) return '<1分钟';
    if (mins < 60) return mins + '分钟';
    var hrs = Math.floor(mins / 60);
    var rm = mins % 60;
    return hrs + '小时' + (rm > 0 ? rm + '分' : '');
  }

  let streakPopupEl = null;
  let streakPopupTimer = null;

  function showStreakPopup(dot, event) {
    hideStreakPopup();

    const data = dot.dataset;
    const learned = parseInt(data.learned) || 0;
    const goal = parseInt(data.goal) || 30;
    const hasInfo = data.hasInfo === '1';
    const accuracy = parseInt(data.accuracy) || 0;
    const lunar = data.lunar || '';
    const studyMs = parseInt(data.studyMs) || 0;

    // 随机选一个颜色
    const color = POPUP_COLORS[Math.floor(Math.random() * POPUP_COLORS.length)];

    // 状态判断
    let statusText, statusIcon;
    if (!hasInfo) {
      statusText = '未打卡'; statusIcon = '💤';
    } else if (learned === 0) {
      statusText = '已签到'; statusIcon = '📋';
    } else if (learned >= goal * 1.5) {
      statusText = '超额完成！'; statusIcon = '🌟';
    } else if (learned >= goal) {
      statusText = '目标达成'; statusIcon = '✅';
    } else {
      statusText = '部分完成'; statusIcon = '📝';
    }

    // 进度百分比
    const pct = goal > 0 ? Math.min(100, Math.round(learned / goal * 100)) : 0;

    const popup = document.createElement('div');
    popup.className = 'streak-popup';
    popup.style.setProperty('--popup-bg', color.bg);
    popup.style.setProperty('--popup-border', color.border);
    popup.style.setProperty('--popup-accent', color.accent);

    popup.innerHTML =
      '<div class="streak-popup-header">' +
        '<span class="streak-popup-date">' + data.date + ' 周' + data.weekDay + (lunar ? ' · ' + lunar : '') + '</span>' +
        '<span class="streak-popup-status">' + statusIcon + ' ' + statusText + '</span>' +
      '</div>' +
      (hasInfo && learned > 0 ?
        '<div class="streak-popup-stats">' +
          '<div class="streak-popup-stat-item">' +
            '<div class="streak-popup-stat-num" style="color:var(--popup-accent)">' + learned + '</div>' +
            '<div class="streak-popup-stat-label">学习单词</div>' +
          '</div>' +
          '<div class="streak-popup-stat-item">' +
            '<div class="streak-popup-stat-num" style="color:var(--popup-accent)">' + accuracy + '%</div>' +
            '<div class="streak-popup-stat-label">准确率</div>' +
          '</div>' +
          '<div class="streak-popup-stat-item">' +
            '<div class="streak-popup-stat-num" style="color:var(--popup-accent)">' + fmtStudyMs(studyMs) + '</div>' +
            '<div class="streak-popup-stat-label">学习时长</div>' +
          '</div>' +
        '</div>' +
        '<div class="streak-popup-progress">' +
          '<div class="streak-popup-progress-track">' +
            '<div class="streak-popup-progress-fill" style="width:' + pct + '%;background:var(--popup-accent)"></div>' +
          '</div>' +
          '<span class="streak-popup-progress-text">' + pct + '% 目标(' + goal + '词)</span>' +
        '</div>'
      : hasInfo ?
        '<div class="streak-popup-empty">仅签到，未学习单词</div>'
      :
        '<div class="streak-popup-empty">这天没有学习记录</div>'
      );

    document.body.appendChild(popup);
    streakPopupEl = popup;

    // 定位：在 dot 上方居中
    const rect = dot.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - popupRect.width / 2;
    let top = rect.top - popupRect.height - 10;

    // 边界修正
    if (left < 8) left = 8;
    if (left + popupRect.width > window.innerWidth - 8) left = window.innerWidth - popupRect.width - 8;
    if (top < 8) top = rect.bottom + 10;

    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
    popup.style.opacity = '1';
    popup.style.transform = 'translateY(0) scale(1)';
  }

  function hideStreakPopup() {
    if (streakPopupEl) {
      streakPopupEl.style.opacity = '0';
      streakPopupEl.style.transform = 'translateY(4px) scale(0.95)';
      const el = streakPopupEl;
      setTimeout(() => el.remove(), 200);
      streakPopupEl = null;
    }
  }

  function renderDailyGoal() {
    const current = C.getTodayLearned();
    const target = C.settings.dailyGoal || 30;
    const pct = Math.min(100, Math.round(current / target * 100));
    C.text('daily-goal-current', current);
    C.text('daily-goal-target', target);
    C.text('daily-goal-pct', pct + '%');
    const fill = C.$('daily-goal-fill');
    if (fill) fill.style.width = Math.max(2, pct) + '%';
    const sel = C.$('setting-dailygoal');
    if (sel) sel.value = target;
  }

  function renderMemoryCurve() {
    const chart = C.$('memory-curve-chart');
    if (!chart) return;

    const days = [];
    const d = new Date();
    for (let i = 29; i >= 0; i--) {
      const dd = new Date(d);
      dd.setDate(dd.getDate() - i);
      const ds = C.fmt(dd);
      const learned = C.streakData.dates?.[ds]?.learned || 0;
      days.push({ date: ds, learned, label: (dd.getMonth() + 1) + '/' + dd.getDate() });
    }

    const maxVal = Math.max(...days.map(d => d.learned), 1);
    const chartH = 160;
    const chartW = chart.clientWidth || 500;
    const barW = Math.max(Math.floor((chartW - 40) / 30) - 2, 6);
    const gap = Math.max(Math.floor((chartW - 40) / 30) - barW, 2);

    const points = days.map((d, i) => {
      const x = 30 + i * (barW + gap) + barW / 2;
      const y = chartH - 20 - (d.learned / maxVal) * (chartH - 40);
      return { x, y, ...d };
    });

    let pathD = '';
    let areaD = '';
    points.forEach((p, i) => {
      if (i === 0) {
        pathD += 'M ' + p.x + ' ' + p.y;
        areaD += 'M ' + p.x + ' ' + (chartH - 20) + ' L ' + p.x + ' ' + p.y;
      } else {
        const prev = points[i - 1];
        const cpx = (prev.x + p.x) / 2;
        pathD += ' C ' + cpx + ' ' + prev.y + ' ' + cpx + ' ' + p.y + ' ' + p.x + ' ' + p.y;
        areaD += ' C ' + cpx + ' ' + prev.y + ' ' + cpx + ' ' + p.y + ' ' + p.x + ' ' + p.y;
      }
    });
    const lastPt = points[points.length - 1];
    areaD += ' L ' + lastPt.x + ' ' + (chartH - 20) + ' Z';

    const svgW = Math.max(30 + 30 * (barW + gap), chartW);

    let html = '<svg width="100%" height="' + chartH + '" viewBox="0 0 ' + svgW + ' ' + chartH + '" preserveAspectRatio="none" style="overflow:visible">';

    for (let i = 0; i <= 4; i++) {
      const y = chartH - 20 - (i / 4) * (chartH - 40);
      const val = Math.round(maxVal * i / 4);
      html += '<line x1="28" y1="' + y + '" x2="' + svgW + '" y2="' + y + '" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>';
      html += '<text x="24" y="' + (y + 4) + '" fill="rgba(255,255,255,0.25)" font-size="10" text-anchor="end">' + val + '</text>';
    }

    html += '<defs><linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="rgba(240,165,0,0.3)"/>' +
      '<stop offset="100%" stop-color="rgba(240,165,0,0.02)"/>' +
      '</linearGradient></defs>';
    html += '<path d="' + areaD + '" fill="url(#curveGrad)"/>';
    html += '<path d="' + pathD + '" fill="none" stroke="var(--amber)" stroke-width="2" stroke-linecap="round"/>';

    points.forEach((p, i) => {
      html += '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + (p.date === C.todayStr ? 5 : 3) + '" fill="' + (p.date === C.todayStr ? 'var(--amber)' : p.learned > 0 ? 'var(--emerald)' : 'var(--text-dim)') + '" stroke="var(--bg-card-solid)" stroke-width="1.5"/>';
      if (i % 5 === 0 || i === 29) {
        html += '<text x="' + p.x + '" y="' + (chartH - 4) + '" fill="rgba(255,255,255,0.3)" font-size="9" text-anchor="middle">' + p.label + '</text>';
      }
      html += '<rect x="' + (p.x - barW / 2) + '" y="0" width="' + barW + '" height="' + chartH + '" fill="transparent">' +
        '<title>' + p.label + ': 学习 ' + p.learned + ' 词</title></rect>';
    });

    html += '</svg>';
    html += '<div style="display:flex;gap:16px;margin-top:8px;font-size:0.75rem;color:var(--text-muted);justify-content:center">' +
      '<span>🟡 今天</span><span>🟢 有学习</span><span>⚫ 未学习</span>' +
      '<span style="margin-left:8px">每日目标: ' + C.settings.dailyGoal + '词</span></div>';

    chart.innerHTML = html;
  }

  // 注册到共享对象
  C.renderDashboard = renderDashboard;
  C.renderStreakCalendar = renderStreakCalendar;
  C.renderDailyGoal = renderDailyGoal;
  C.renderMemoryCurve = renderMemoryCurve;
})();
