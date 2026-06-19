// ========== CET 词汇大师 — 核心模块 (core.js) ==========
// 共享状态、工具函数、数据持久化、日期工具、学习记录
// 所有模块通过 window._C 共享

window._C = (() => {
  'use strict';

  // ========== 高频词汇表 ==========
  const _HF4 = (typeof HIGH_FREQ_CET4 !== 'undefined') ? HIGH_FREQ_CET4 : new Set();
  const _HF6 = (typeof HIGH_FREQ_CET6 !== 'undefined') ? HIGH_FREQ_CET6 : new Set();

  // ========== 背景风景图（本地，按天气/时段分组） ==========
  const BG_IMAGES = {
    sunny: [
      'bg_png/sunny/sunny_01.jpg','bg_png/sunny/sunny_02.jpg','bg_png/sunny/sunny_03.jpg','bg_png/sunny/sunny_04.jpg','bg_png/sunny/sunny_05.jpg',
      'bg_png/sunny/sunny_06.jpg','bg_png/sunny/sunny_07.jpg','bg_png/sunny/sunny_08.jpg','bg_png/sunny/sunny_09.jpg','bg_png/sunny/sunny_10.jpg',
      'bg_png/sunny/sunny_11.jpg','bg_png/sunny/sunny_12.jpg','bg_png/sunny/sunny_13.jpg','bg_png/sunny/sunny_14.jpg','bg_png/sunny/sunny_15.jpg',
      'bg_png/sunny/sunny_16.jpg','bg_png/sunny/sunny_17.jpg','bg_png/sunny/sunny_18.jpg','bg_png/sunny/sunny_19.jpg','bg_png/sunny/sunny_20.jpg',
      'bg_png/sunny/sunny_21.jpg','bg_png/sunny/sunny_22.jpg','bg_png/sunny/sunny_23.jpg','bg_png/sunny/sunny_24.jpg','bg_png/sunny/sunny_25.jpg',
      'bg_png/sunny/sunny_26.jpg'
    ],
    rainy: [
      'bg_png/rain/rain_01.jpg','bg_png/rain/rain_02.jpg','bg_png/rain/rain_03.jpg','bg_png/rain/rain_04.jpg','bg_png/rain/rain_05.jpg',
      'bg_png/rain/rain_06.jpg','bg_png/rain/rain_07.jpg','bg_png/rain/rain_08.jpg','bg_png/rain/rain_09.jpg','bg_png/rain/rain_10.jpg',
      'bg_png/rain/rain_11.jpg','bg_png/rain/rain_12.jpg','bg_png/rain/rain_13.jpg','bg_png/rain/rain_14.jpg','bg_png/rain/rain_15.jpg',
      'bg_png/rain/rain_16.jpg','bg_png/rain/rain_17.jpg','bg_png/rain/rain_18.jpg','bg_png/rain/rain_19.jpg','bg_png/rain/rain_20.jpg',
      'bg_png/rain/rain_21.jpg','bg_png/rain/rain_22.jpg'
    ],
    snowy: [
      'bg_png/snow/snow_01.jpg','bg_png/snow/snow_02.jpg','bg_png/snow/snow_03.jpg','bg_png/snow/snow_04.jpg','bg_png/snow/snow_05.jpg',
      'bg_png/snow/snow_06.jpg','bg_png/snow/snow_07.jpg','bg_png/snow/snow_08.jpg','bg_png/snow/snow_09.jpg','bg_png/snow/snow_10.jpg',
      'bg_png/snow/snow_11.jpg','bg_png/snow/snow_12.jpg','bg_png/snow/snow_13.jpg','bg_png/snow/snow_14.jpg','bg_png/snow/snow_15.jpg',
      'bg_png/snow/snow_16.jpg','bg_png/snow/snow_17.jpg','bg_png/snow/snow_18.jpg','bg_png/snow/snow_19.jpg','bg_png/snow/snow_20.jpg',
      'bg_png/snow/snow_21.jpg','bg_png/snow/snow_22.jpg','bg_png/snow/snow_23.jpg','bg_png/snow/snow_24.jpg','bg_png/snow/snow_25.jpg',
      'bg_png/snow/snow_26.jpg','bg_png/snow/snow_27.jpg','bg_png/snow/snow_28.jpg','bg_png/snow/snow_29.jpg','bg_png/snow/snow_30.jpg'
    ],
    cloudy: [
      'bg_png/cloudy/cloudy_01.jpg','bg_png/cloudy/cloudy_02.jpg','bg_png/cloudy/cloudy_03.jpg','bg_png/cloudy/cloudy_04.jpg','bg_png/cloudy/cloudy_05.jpg',
      'bg_png/cloudy/cloudy_06.jpg','bg_png/cloudy/cloudy_07.jpg','bg_png/cloudy/cloudy_08.jpg','bg_png/cloudy/cloudy_09.jpg','bg_png/cloudy/cloudy_10.jpg',
      'bg_png/cloudy/cloudy_11.jpg','bg_png/cloudy/cloudy_12.jpg','bg_png/cloudy/cloudy_13.jpg','bg_png/cloudy/cloudy_14.jpg','bg_png/cloudy/cloudy_15.jpg',
      'bg_png/cloudy/cloudy_16.jpg','bg_png/cloudy/cloudy_17.jpg','bg_png/cloudy/cloudy_18.jpg','bg_png/cloudy/cloudy_19.jpg','bg_png/cloudy/cloudy_20.jpg',
      'bg_png/cloudy/cloudy_21.jpg','bg_png/cloudy/cloudy_22.jpg','bg_png/cloudy/cloudy_23.jpg','bg_png/cloudy/cloudy_24.jpg','bg_png/cloudy/cloudy_25.jpg'
    ],
    dusk: [
      'bg_png/dusk/dusk_01.jpg','bg_png/dusk/dusk_02.jpg','bg_png/dusk/dusk_03.jpg','bg_png/dusk/dusk_04.jpg','bg_png/dusk/dusk_05.jpg',
      'bg_png/dusk/dusk_06.jpg','bg_png/dusk/dusk_07.jpg','bg_png/dusk/dusk_08.jpg','bg_png/dusk/dusk_09.jpg','bg_png/dusk/dusk_10.jpg',
      'bg_png/dusk/dusk_11.jpg','bg_png/dusk/dusk_12.jpg','bg_png/dusk/dusk_13.jpg','bg_png/dusk/dusk_14.jpg','bg_png/dusk/dusk_15.jpg',
      'bg_png/dusk/dusk_16.jpg','bg_png/dusk/dusk_17.jpg','bg_png/dusk/dusk_18.jpg','bg_png/dusk/dusk_19.jpg','bg_png/dusk/dusk_20.jpg'
    ],
    night: [
      'bg_png/night/night_01.jpg','bg_png/night/night_02.jpg','bg_png/night/night_03.jpg','bg_png/night/night_04.jpg','bg_png/night/night_05.jpg',
      'bg_png/night/night_06.jpg','bg_png/night/night_07.jpg','bg_png/night/night_08.jpg','bg_png/night/night_09.jpg','bg_png/night/night_10.jpg',
      'bg_png/night/night_11.jpg','bg_png/night/night_12.jpg','bg_png/night/night_13.jpg','bg_png/night/night_14.jpg','bg_png/night/night_15.jpg',
      'bg_png/night/night_16.jpg','bg_png/night/night_17.jpg','bg_png/night/night_18.jpg','bg_png/night/night_19.jpg','bg_png/night/night_20.jpg'
    ],
    foggy: [
      'bg_png/fog/fog_01.jpg','bg_png/fog/fog_02.jpg','bg_png/fog/fog_03.jpg','bg_png/fog/fog_04.jpg','bg_png/fog/fog_05.jpg',
      'bg_png/fog/fog_06.jpg','bg_png/fog/fog_07.jpg','bg_png/fog/fog_08.jpg','bg_png/fog/fog_09.jpg','bg_png/fog/fog_10.jpg',
      'bg_png/fog/fog_11.jpg','bg_png/fog/fog_12.jpg','bg_png/fog/fog_13.jpg','bg_png/fog/fog_14.jpg','bg_png/fog/fog_15.jpg',
      'bg_png/fog/fog_16.jpg','bg_png/fog/fog_17.jpg','bg_png/fog/fog_18.jpg','bg_png/fog/fog_19.jpg','bg_png/fog/fog_20.jpg',
      'bg_png/fog/fog_21.jpg','bg_png/fog/fog_22.jpg','bg_png/fog/fog_23.jpg','bg_png/fog/fog_24.jpg','bg_png/fog/fog_25.jpg',
      'bg_png/fog/fog_26.jpg','bg_png/fog/fog_27.jpg','bg_png/fog/fog_28.jpg','bg_png/fog/fog_29.jpg','bg_png/fog/fog_30.jpg',
      'bg_png/fog/fog_31.jpg','bg_png/fog/fog_32.jpg','bg_png/fog/fog_33.jpg','bg_png/fog/fog_34.jpg','bg_png/fog/fog_35.jpg',
      'bg_png/fog/fog_36.jpg','bg_png/fog/fog_37.jpg','bg_png/fog/fog_38.jpg','bg_png/fog/fog_39.jpg','bg_png/fog/fog_40.jpg',
      'bg_png/fog/fog_41.jpg','bg_png/fog/fog_42.jpg','bg_png/fog/fog_43.jpg','bg_png/fog/fog_44.jpg','bg_png/fog/fog_45.jpg',
      'bg_png/fog/fog_46.jpg','bg_png/fog/fog_47.jpg'
    ],
    stormy: [
      'bg_png/storm/storm_01.jpg','bg_png/storm/storm_02.jpg','bg_png/storm/storm_03.jpg','bg_png/storm/storm_04.jpg','bg_png/storm/storm_05.jpg',
      'bg_png/storm/storm_06.jpg','bg_png/storm/storm_07.jpg','bg_png/storm/storm_08.jpg','bg_png/storm/storm_09.jpg','bg_png/storm/storm_10.jpg',
      'bg_png/storm/storm_11.jpg','bg_png/storm/storm_12.jpg','bg_png/storm/storm_13.jpg','bg_png/storm/storm_14.jpg','bg_png/storm/storm_15.jpg',
      'bg_png/storm/storm_16.jpg','bg_png/storm/storm_17.jpg','bg_png/storm/storm_18.jpg','bg_png/storm/storm_19.jpg','bg_png/storm/storm_20.jpg',
      'bg_png/storm/storm_21.jpg','bg_png/storm/storm_22.jpg','bg_png/storm/storm_23.jpg','bg_png/storm/storm_24.jpg','bg_png/storm/storm_25.jpg',
      'bg_png/storm/storm_26.jpg','bg_png/storm/storm_27.jpg','bg_png/storm/storm_28.jpg','bg_png/storm/storm_29.jpg','bg_png/storm/storm_30.jpg',
      'bg_png/storm/storm_31.jpg','bg_png/storm/storm_32.jpg','bg_png/storm/storm_33.jpg','bg_png/storm/storm_34.jpg','bg_png/storm/storm_35.jpg',
      'bg_png/storm/storm_36.jpg','bg_png/storm/storm_37.jpg','bg_png/storm/storm_38.jpg','bg_png/storm/storm_39.jpg','bg_png/storm/storm_40.jpg',
      'bg_png/storm/storm_41.jpg','bg_png/storm/storm_42.jpg','bg_png/storm/storm_43.jpg','bg_png/storm/storm_44.jpg','bg_png/storm/storm_45.jpg',
      'bg_png/storm/storm_46.jpg','bg_png/storm/storm_47.jpg','bg_png/storm/storm_48.jpg'
    ]
  };

  // ========== 常量 ==========
  const LEVEL_KEY = 'cet_vocab_level';
  const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30];

  // ========== 应用状态 ==========
  let currentLevel = '';
  let words = [];
  let progress = {};
  let notebook = {};

  // ========== 服务端同步状态 ==========
  const API_BASE = '/api';
  let isServerMode = false;
  let authToken = localStorage.getItem('cet_auth_token') || '';
  let currentUser = null;
  let streakData = {};
  let settings = { pageSize: 50, dailyGoal: 30 };
  let todayStr = '';
  let bgTimer = null;
  let bgIdx = 0;
  let bgSlot = 1;

  // 页面状态
  let currentPage = 'dashboard';
  let browsePage = 1;
  let browseTodayOnly = false;

  // 闪卡状态
  let flashcardList = [];
  let flashcardIdx = 0;
  let flashcardFlipped = false;

  // 测验状态
  let quizQuestions = [];
  let quizIdx = 0;
  let quizCorrect = 0;
  let quizWrong = 0;
  let quizAnswered = false;

  // 复习状态
  let reviewList = [];
  let reviewIdx = 0;
  let reviewFlipped = false;

  // 拼写模式状态
  let spellList = [];
  let spellIdx = 0;
  let spellCorrectCount = 0;
  let spellWrongCount = 0;
  let spellWrongList = [];
  let spellWordAnswered = false;
  let spellHintCount = 0;

  // 发音模式
  let accentMode = localStorage.getItem('cet_accent') || 'us';
  let speechToken = 0;

  // 语音列表缓存（Safari/移动端首次 getVoices() 返回空数组，需监听 voiceschanged）
  let cachedVoices = [];
  if ('speechSynthesis' in window) {
    cachedVoices = speechSynthesis.getVoices();
    if (!cachedVoices.length) {
      speechSynthesis.addEventListener('voiceschanged', function() {
        cachedVoices = speechSynthesis.getVoices();
      }, { once: true });
    }
  }

  // 每日计划缓存
  let dailyPlanWords = [];

  // ========== 工具函数 ==========

  function $(id) { return document.getElementById(id); }
  function status(word) { return progress[word]?.status || 'new'; }
  function text(id, t) { const el = $(id); if (el) el.textContent = t; }
  function show(id) { const el = $(id); if (el) el.style.display = ''; }
  function hide(id) { const el = $(id); if (el) el.style.display = 'none'; }

  // 随机颜色描边：每次返回一个鲜亮的颜色值
  const STROKE_COLORS = [
    '#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#38d9a9',
    '#4dabf7', '#748ffc', '#da77f2', '#f783ac', '#e599f7',
    '#66d9e8', '#a9e34b', '#ff8787', '#74c0fc', '#b197fc',
    '#63e6be', '#ffc078', '#ff6b6b', '#20c997', '#845ef7'
  ];
  function randomStrokeColor() {
    return STROKE_COLORS[Math.floor(Math.random() * STROKE_COLORS.length)];
  }
  // 给元素添加随机颜色描边效果
  function applyTextStroke(el) {
    if (!el) return;
    const color = randomStrokeColor();
    el.style.webkitTextStroke = '0.6px ' + color;
    el.style.textShadow = '0 0 8px ' + color + '40, 0 0 2px ' + color + '60';
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // ========== 多词性 defs 兼容层 ==========

  /**
   * 获取单词的 defs 数组（兼容旧数据）
   * @returns {Array<{pos: string, meanings: string[]}>}
   */
  function getDefs(w) {
    if (w.defs && w.defs.length > 0) return w.defs;
    // 回退：从 meaning 字段解析
    const m = w.meaning || '';
    const posMatch = m.match(/^((?:vi|vt|aux|adj|adv|prep|conj|pron|num|art|int|v|n)\.)\.?\s*/);
    if (posMatch) {
      return [{ pos: posMatch[1], meanings: [m.slice(posMatch[0].length)] }];
    }
    return [{ pos: '', meanings: [m] }];
  }

  /**
   * 合并相同词性的释义，返回 [{pos, meanings}] 且同词性只出现一行
   */
  function mergeDefs(defs) {
    const map = {};
    const order = [];
    defs.forEach(d => {
      const key = d.pos || '';
      if (!map[key]) { map[key] = []; order.push(key); }
      d.meanings.forEach(m => { if (!map[key].includes(m)) map[key].push(m); });
    });
    return order.map(pos => ({ pos, meanings: map[pos] }));
  }

  /**
   * 将 defs 渲染为带词性标签的 HTML（用于闪卡、复习卡等展示）
   * 相同词性合并到一行：v. 放弃，抛弃
   */
  function getDefsHTML(w) {
    const defs = mergeDefs(getDefs(w));
    return defs.map(d => {
      const posTag = d.pos ? '<span class="pos-tag">' + esc(d.pos) + '</span> ' : '';
      return posTag + esc(d.meanings.join('，'));
    }).join('<br>');
  }

  /**
   * 纯文本版（用于拼写等不需要 HTML 的场景）
   * 相同词性合并到一行
   */
  function getDefsText(w) {
    const defs = mergeDefs(getDefs(w));
    return defs.map(d => {
      return (d.pos ? d.pos + ' ' : '') + d.meanings.join('，');
    }).join(' | ');
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ========== 日期工具 ==========

  function getTodayStr() {
    return fmt(new Date());
  }

  const _dateFmt = new Intl.DateTimeFormat('sv-SE');
  function fmt(d) {
    return _dateFmt.format(d);
  }

  function daysBetween(a, b) {
    return Math.floor((new Date(b) - new Date(a)) / 86400000);
  }

  function addDays(dateStr, days) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return fmt(d);
  }

  // ========== 初始化单词 ==========

  function initWords() {
    let vocab = VOCABULARY;
    if (currentLevel === 'cet4' && typeof CET6_ONLY !== 'undefined' && CET6_ONLY.size > 0) {
      vocab = vocab.filter(w => !CET6_ONLY.has(w.word));
    }
    const highFreq = currentLevel === 'cet4' ? _HF4 : _HF6;
    words = vocab.map(w => ({
      ...w,
      freq: highFreq.has(w.word) ? 'high' : 'mid'
    }));
    const mids = words.filter(w => w.freq === 'mid');
    const lowTarget = Math.floor(mids.length * 0.42);
    let count = 0;
    for (let i = words.length - 1; i >= 0 && count < lowTarget; i--) {
      if (words[i].freq === 'mid') {
        words[i].freq = 'low';
        count++;
      }
    }
  }

  // ========== 数据持久化 ==========

  function getStorageKey() {
    return 'cet_master_' + currentLevel;
  }

  // 检测后端是否可用
  async function detectServer() {
    try {
      const res = await fetch(API_BASE + '/health', { method: 'GET' });
      isServerMode = res.ok;
    } catch { isServerMode = false; }
    // 服务端模式下启动心跳监听
    if (isServerMode) startHeartbeat();
    return isServerMode;
  }

  // SSE 心跳监听：服务器关闭时显示提示遮罩
  function startHeartbeat() {
    try {
      const es = new EventSource(API_BASE + '/heartbeat');
      es.onerror = function() {
        es.close();
        showServerStopped();
      };
    } catch { /* 不支持 SSE 则忽略 */ }
  }

  function showServerStopped() {
    if (document.getElementById('server-stopped-overlay')) return;
    var overlay = document.createElement('div');
    overlay.id = 'server-stopped-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px)';
    overlay.innerHTML =
      '<div style="text-align:center;color:#e0e6ed;max-width:400px;padding:40px">' +
        '<div style="font-size:3rem;margin-bottom:16px">&#x1f6d1;</div>' +
        '<h2 style="font-size:1.5rem;margin-bottom:12px;color:#f59e0b">服务已停止</h2>' +
        '<p style="color:#a0a8b8;line-height:1.6;margin-bottom:24px">检测到服务器已关闭。<br>你的学习数据已自动保存在本地。<br>双击 start.bat 可重新启动。</p>' +
        '<button onclick="location.reload()" style="padding:10px 28px;border-radius:8px;border:none;background:linear-gradient(135deg,#f59e0b,#d97706);color:#0f1724;font-size:1rem;font-weight:600;cursor:pointer">重新连接</button>' +
      '</div>';
    document.body.appendChild(overlay);
  }

  function loadData() {
    // 1. 先从 localStorage 同步加载（保证即时可用 + 离线兼容）
    try {
      let raw = localStorage.getItem(getStorageKey());
      if (!raw && currentLevel === 'cet6') {
        raw = localStorage.getItem('cet6_master_data');
        if (raw) localStorage.setItem(getStorageKey(), raw);
      }
      if (raw) {
        const d = JSON.parse(raw);
        progress = d.progress || {};
        notebook = d.notebook || {};
        streakData = d.streak || { dates: {}, currentStreak: 0 };
        settings = { ...settings, ...(d.settings || {}) };
      }
    } catch (e) {
      console.warn('本地数据加载失败:', e);
    }

    // 2. 如果有后端且已登录，异步从服务端拉最新数据
    if (isServerMode && authToken) {
      fetchServerData();
    }

    // UI 同步
    const sel = $('setting-pagesize');
    if (sel) sel.value = String(settings.pageSize);
    const goalSel = $('setting-dailygoal');
    if (goalSel) goalSel.value = String(settings.dailyGoal);
  }

  // 异步从服务端拉数据（智能合并：谁新用谁）
  async function fetchServerData() {
    if (!currentLevel) return;
    // 在请求开始时捕获当前 level，响应回来时校验是否仍是同一 level，
    // 防止用户切换等级后用旧 level 的服务端数据覆盖新 level
    const reqLevel = currentLevel;
    try {
      const res = await fetch(API_BASE + '/data/' + reqLevel, {
        headers: { 'Authorization': 'Bearer ' + authToken }
      });
      if (!res.ok) return;
      const d = await res.json();
      if (reqLevel !== currentLevel) return; // 期间用户已切换等级，丢弃
      if (d.saved_at) {
        // 获取本地最后保存时间
        const localRaw = localStorage.getItem(getStorageKey());
        const localTime = localRaw ? (JSON.parse(localRaw).savedAt || '') : '';
        const serverTime = d.saved_at;

        if (serverTime > localTime) {
          // 服务端更新 → 拉取覆盖本地
          progress = d.progress || progress;
          notebook = d.notebook || notebook;
          streakData = d.streak || streakData;
          settings = { ...settings, ...(d.settings || {}) };
          saveToLocal();
          localStorage.setItem(getStorageKey() + '_serverSavedAt', serverTime);
          if (_C.renderDashboard && currentPage === 'dashboard') _C.renderDashboard();
        } else if (localTime > serverTime) {
          // 本地更新（离线期间积攒的数据）→ 推送到服务端
          pushToServer();
        }
      }
    } catch (e) {
      console.warn('服务端数据拉取失败:', e);
    }
  }

  function saveData() {
    // 1. 始终写 localStorage
    saveToLocal();
    // 2. 如果有后端且已登录，异步推到服务端（防抖）
    if (isServerMode && authToken) {
      pushToServer();
    }
  }

  function saveToLocal() {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify({
        progress, notebook, streak: streakData, settings,
        level: currentLevel,
        version: 2, savedAt: new Date().toISOString()
      }));
    } catch (e) {
      console.warn('本地数据保存失败:', e);
    }
  }

  // 防抖推送到服务端（按 level 隔离，避免切换等级时旧 level 的待推送被丢）
  const pushTimers = {};
  const pendingPushes = {};
  function pushToServer() {
    if (!currentLevel) return;
    const lvl = currentLevel;
    pendingPushes[lvl] = {
      progress: { ...progress },
      notebook: { ...notebook },
      streak: { ...streakData },
      settings: { ...settings }
    };
    clearTimeout(pushTimers[lvl]);
    pushTimers[lvl] = setTimeout(async () => {
      const payload = pendingPushes[lvl];
      delete pendingPushes[lvl];
      delete pushTimers[lvl];
      if (!payload) return;
      try {
        const res = await fetch(API_BASE + '/data/' + lvl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const r = await res.json();
          localStorage.setItem('cet_master_' + lvl + '_serverSavedAt', r.savedAt);
        }
      } catch (e) {
        console.warn('服务端数据推送失败:', e);
      }
    }, 2000);
  }

  // ========== 打卡 / 签到系统 ==========

  function recordCheckIn() {
    if (!streakData.dates) streakData.dates = {};
    if (!streakData.dates[todayStr]) {
      streakData.dates[todayStr] = { learned: 0 };
    }
    let streak = 0;
    const d = new Date();
    while (true) {
      const ds = fmt(d);
      if (streakData.dates[ds]) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    streakData.currentStreak = streak;
    if (!streakData.longestStreak || streak > streakData.longestStreak) {
      streakData.longestStreak = streak;
    }
    saveData();
  }

  function recordLearn(word) {
    markLearnedToday(word);
  }

  // ========== 每日学习记录 ==========

  function markLearnedToday(word) {
    if (!streakData.dates) streakData.dates = {};
    if (!streakData.dates[todayStr]) streakData.dates[todayStr] = { learned: 0, words: [] };
    const day = streakData.dates[todayStr];
    if (!day.words) day.words = [];
    if (!day.words.includes(word)) {
      day.words.push(word);
      day.learned = day.words.length;
    }
  }

  function getTodayLearned() {
    return streakData.dates?.[todayStr]?.learned || 0;
  }

  // ========== 模块练习计数（项目 9）==========
  // 在 streakData.dates[today].modules 下记录各模块今日完成次数：
  // { flashcard: 35, quiz: 2, spelling: 1, review: 1, browse: 12 }
  // flashcard/browse 按卡片/词数计；quiz/spelling/review 按完整会话计。
  const MODULE_LABELS = {
    flashcard: '闪卡',
    quiz: '测验',
    spelling: '拼写',
    review: '复习',
    browse: '词库'
  };
  function incModuleCount(name, by) {
    if (!streakData.dates) streakData.dates = {};
    if (!streakData.dates[todayStr]) streakData.dates[todayStr] = { learned: 0 };
    const day = streakData.dates[todayStr];
    if (!day.modules) day.modules = {};
    day.modules[name] = (day.modules[name] || 0) + (by || 1);
    // 不每次都触发 saveData（避免频繁推送），调用方自己决定何时 save
  }
  function getModuleCount(name) {
    return streakData.dates?.[todayStr]?.modules?.[name] || 0;
  }
  function getAllModuleCounts() {
    return streakData.dates?.[todayStr]?.modules || {};
  }

  // 渲染单模块底部计数条
  function renderModuleFooter(module, containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const n = getModuleCount(module);
    const label = MODULE_LABELS[module] || module;
    el.innerHTML = '<div class="module-today-counter">' +
      '今日已完成 <strong>' + n + '</strong> 次「' + label + '」练习' +
    '</div>';
  }

  // 渲染首页"今日各模块练习次数"小卡
  function renderModuleSummary(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const counts = getAllModuleCounts();
    const keys = ['flashcard', 'quiz', 'spelling', 'review', 'browse'];
    const total = keys.reduce((s, k) => s + (counts[k] || 0), 0);
    el.innerHTML = '<div class="module-summary">' +
      '<div class="module-summary-title">今日模块练习 · 共 <strong>' + total + '</strong> 次</div>' +
      '<div class="module-summary-grid">' +
        keys.map(k => {
          const v = counts[k] || 0;
          return '<div class="module-summary-item' + (v > 0 ? ' active' : '') + '">' +
            '<div class="module-summary-num">' + v + '</div>' +
            '<div class="module-summary-label">' + MODULE_LABELS[k] + '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  // ========== 错题本操作 ==========

  function addToNotebook(word, context) {
    if (!notebook[word]) {
      notebook[word] = { count: 0, lastWrong: todayStr, contexts: [] };
    }
    notebook[word].count++;
    notebook[word].lastWrong = todayStr;
    if (context && notebook[word].contexts.length < 5) {
      notebook[word].contexts.push(context);
    }
    saveData();
  }

  // ========== 复习到期词汇 ==========

  function getDueWords() {
    return words.filter(w => {
      const p = progress[w.word];
      return p && p.nextReview && p.nextReview <= todayStr && p.status !== 'new';
    });
  }

  // ========== 每日学习计划 ==========

  function getDailyPlanWords() {
    if (dailyPlanWords.length === 0) {
      _buildDailyPlan();
    }
    // 返回副本，防止模块 shuffle 破坏缓存
    return dailyPlanWords.slice();
  }

  function _buildDailyPlan() {
    const goal = settings.dailyGoal || 30;
    const plan = [];
    const todayLearned = new Set(streakData.dates?.[todayStr]?.words || []);

    // 优先级1: 今日到期复习词
    const dueWords = getDueWords();
    dueWords.forEach(w => {
      if (plan.length < goal && !todayLearned.has(w.word)) plan.push(w);
    });

    // 优先级2: 错题本中的词
    const wrongWords = words.filter(w => notebook[w.word] && !todayLearned.has(w.word) && !plan.find(p => p.word === w.word));
    wrongWords.sort((a, b) => (notebook[b.word]?.count || 0) - (notebook[a.word]?.count || 0));
    wrongWords.forEach(w => { if (plan.length < goal) plan.push(w); });

    // 优先级3: 高频新词
    const highNew = words.filter(w => w.freq === 'high' && status(w.word) === 'new' && !todayLearned.has(w.word) && !plan.find(p => p.word === w.word));
    shuffle(highNew);
    highNew.forEach(w => { if (plan.length < goal) plan.push(w); });

    // 优先级4: 其他新词
    const otherNew = words.filter(w => status(w.word) === 'new' && !todayLearned.has(w.word) && !plan.find(p => p.word === w.word));
    shuffle(otherNew);
    otherNew.forEach(w => { if (plan.length < goal) plan.push(w); });

    // 优先级5: 学习中的词
    const learningWords = words.filter(w => status(w.word) === 'learning' && !todayLearned.has(w.word) && !plan.find(p => p.word === w.word));
    shuffle(learningWords);
    learningWords.forEach(w => { if (plan.length < goal) plan.push(w); });

    dailyPlanWords = plan;
  }

  function clearDailyPlanCache() {
    dailyPlanWords = [];
  }

  // ========== 背景图轮换 ==========

  let bgPool = null; // 缓存当前背景图池

  function rebuildBgPool() {
    bgPool = getWeatherBgImages();
    shuffle(bgPool);
    bgIdx = 0;
    return bgPool;
  }

  function initBgRotation() {
    const imgs = rebuildBgPool();
    if (!imgs || imgs.length === 0) return;
    // 首张图加载，带重试
    loadBgImage($('bg-img-1'), imgs[0], imgs, 0);
    bgTimer = setInterval(() => {
      if (!bgPool || bgPool.length === 0) return;
      bgIdx = (bgIdx + 1) % bgPool.length;
      const next = bgSlot === 1 ? $('bg-img-2') : $('bg-img-1');
      const curr = bgSlot === 1 ? $('bg-img-1') : $('bg-img-2');
      if (!next || !curr) return;
      const imgUrl = bgPool[bgIdx];
      // 仅远程 URL 设置 crossOrigin
      if (imgUrl && imgUrl.startsWith('http')) {
        next.crossOrigin = 'anonymous';
      } else {
        next.removeAttribute('crossOrigin');
      }
      next.onload = function() {
        next.style.display = '';
        next.classList.add('active');
        curr.classList.remove('active');
        bgSlot = bgSlot === 1 ? 2 : 1;
        adaptTextColor(next);
      };
      next.onerror = function() {
        if (bgPool && bgPool.length > 0) bgIdx = (bgIdx + 1) % bgPool.length;
      };
      next.src = imgUrl;
    }, 5 * 60 * 1000);
  }

  // 天气数据到达后，立即切换到对应天气组的背景图
  function switchBgToWeather() {
    const pool = rebuildBgPool();
    if (!pool || pool.length === 0) return;
    const next = bgSlot === 1 ? $('bg-img-2') : $('bg-img-1');
    const curr = bgSlot === 1 ? $('bg-img-1') : $('bg-img-2');
    if (!next || !curr) return;
    const imgUrl = pool[0];
    if (imgUrl && imgUrl.startsWith('http')) {
      next.crossOrigin = 'anonymous';
    } else {
      next.removeAttribute('crossOrigin');
    }
    next.onload = function() {
      next.style.display = '';
      next.classList.add('active');
      curr.classList.remove('active');
      bgSlot = bgSlot === 1 ? 2 : 1;
      adaptTextColor(next);
    };
    next.onerror = function() {
      // 切换失败就算了，不影响体验
    };
    next.src = imgUrl;
  }

  function loadBgImage(img, url, pool, retries) {
    if (!img) return;
    // 仅远程 URL 设置 crossOrigin（file:// 协议下设置会导致加载失败）
    if (url && url.startsWith('http')) {
      img.crossOrigin = 'anonymous';
    } else {
      img.removeAttribute('crossOrigin');
    }
    img.onerror = function() {
      // 加载失败时尝试下一张（最多重试3次）
      if (pool && retries < 3) {
        bgIdx = (bgIdx + 1) % pool.length;
        loadBgImage(img, pool[bgIdx], pool, retries + 1);
      } else {
        img.style.display = 'none';
      }
    };
    img.onload = function() {
      img.style.display = '';
      img.classList.add('active');
      adaptTextColor(img);
    };
    img.src = url;
  }

  // 背景图亮度采样 → 自适应文字颜色
  function adaptTextColor(img) {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 64;
      canvas.height = 36;
      ctx.drawImage(img, 0, 0, 64, 36);
      const data = ctx.getImageData(0, 0, 64, 36).data;

      let totalBrightness = 0;
      let samples = 0;
      for (let i = 0; i < data.length; i += 16) {
        const r = data[i], g = data[i+1], b = data[i+2];
        totalBrightness += (r * 0.299 + g * 0.587 + b * 0.114);
        samples++;
      }

      const avgBrightness = totalBrightness / samples;
      const root = document.documentElement;

      if (avgBrightness > 160) {
        root.style.setProperty('--bg-overlay-alpha', '0.78');
        root.style.setProperty('--text-shadow-hero', '0 2px 8px rgba(0,0,0,0.6)');
        root.classList.add('bg-bright');
        root.classList.remove('bg-dark');
      } else if (avgBrightness > 100) {
        root.style.setProperty('--bg-overlay-alpha', '0.72');
        root.style.setProperty('--text-shadow-hero', '0 1px 4px rgba(0,0,0,0.4)');
        root.classList.remove('bg-bright', 'bg-dark');
      } else {
        root.style.setProperty('--bg-overlay-alpha', '0.62');
        root.style.setProperty('--text-shadow-hero', '0 1px 3px rgba(0,0,0,0.3)');
        root.classList.remove('bg-bright');
        root.classList.add('bg-dark');
      }
    } catch (e) {
      // Canvas 跨域限制时静默失败
    }
  }

  function getWeatherBgImages() {
    // 时间+天气联合匹配
    const h = new Date().getHours();
    const isNight = h >= 21 || h < 5;
    const isDusk = h >= 17 && h < 21;
    const isMorning = h >= 5 && h < 8;

    let base;
    // 夜间优先用夜景
    if (isNight) base = BG_IMAGES.night;
    // 黄昏时段优先用黄昏
    else if (isDusk) base = BG_IMAGES.dusk;
    // 有天气数据时按天气匹配
    else if (_C.weatherCache) {
      const type = _C.getWeatherType ? _C.getWeatherType(_C.weatherCache.weather_code) : null;
      if (type === 'stormy' && BG_IMAGES.stormy) base = BG_IMAGES.stormy;
      else if (type === 'rainy' && BG_IMAGES.rainy) base = BG_IMAGES.rainy;
      else if (type === 'snowy' && BG_IMAGES.snowy) base = BG_IMAGES.snowy;
      else if (type === 'foggy' && BG_IMAGES.foggy) base = BG_IMAGES.foggy;
      else if (type === 'cloudy' && BG_IMAGES.cloudy) base = BG_IMAGES.cloudy;
      else base = BG_IMAGES.sunny;
    }
    // 清晨用晴天组、其余默认用晴天
    else base = BG_IMAGES.sunny;

    // 雪景混入：非雪天时从雪景池随机抽 ~25% 混入轮播
    if (base !== BG_IMAGES.snowy && BG_IMAGES.snowy.length > 0) {
      const snowPool = BG_IMAGES.snowy.slice();
      shuffle(snowPool);
      const mixCount = Math.max(2, Math.round(base.length * 0.25));
      const snowPicks = snowPool.slice(0, Math.min(mixCount, snowPool.length));
      return base.slice().concat(snowPicks);
    }
    return base.slice();
  }

  // ========== 语音发音 ==========

  function speak(word, forceAccent) {
    if (!word || !('speechSynthesis' in window)) return;
    const token = ++speechToken;
    speechSynthesis.cancel();
    const accent = forceAccent || accentMode;
    const voices = cachedVoices.length ? cachedVoices : speechSynthesis.getVoices();

    // 多音色支持：随机选择不同的英语音色
    let voiceOptions = [];
    if (accent === 'uk') {
      voiceOptions = voices.filter(v =>
        v.lang.startsWith('en-GB') ||
        (v.lang === 'en' && (v.name.includes('UK') || v.name.includes('British')))
      );
    } else {
      voiceOptions = voices.filter(v =>
        v.lang.startsWith('en-US') ||
        (v.lang === 'en' && (v.name.includes('US') || v.name.includes('United States')))
      );
    }

    // 随机选择一个音色（避免总是同一个声音）
    const selectedVoice = voiceOptions.length > 0
      ? voiceOptions[Math.floor(Math.random() * voiceOptions.length)]
      : voices.find(v => v.lang.startsWith('en'));

    const u = new SpeechSynthesisUtterance(word);
    u.lang = accent === 'uk' ? 'en-GB' : 'en-US';
    u.rate = 0.85;
    u.pitch = 1;
    if (selectedVoice) u.voice = selectedVoice;

    // 拼读功能已删除（只保留整词朗读）

    speechSynthesis.speak(u);
  }

  function speakSentence(text, forceAccent) {
    if (!text || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const accent = forceAccent || accentMode;
    u.lang = accent === 'uk' ? 'en-GB' : 'en-US';
    u.rate = 0.75;
    u.pitch = 1;
    const voices = cachedVoices.length ? cachedVoices : speechSynthesis.getVoices();
    const target = accent === 'uk' ? 'en-GB' : 'en-US';
    const v = voices.find(v => v.lang === target) || voices.find(v => v.lang.startsWith('en'));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  }

  function setAccent(mode) {
    accentMode = mode;
    localStorage.setItem('cet_accent', mode);
    _C.toast('已切换为' + (mode === 'uk' ? '英式' : '美式') + '发音', 'success');
  }

  // ========== 自动发音 ==========
  // 每个模块各自一个开关（key: 'cet_autospeak_<module>'），默认值见 _AUTOSPEAK_DEFAULTS
  const _AUTOSPEAK_DEFAULTS = {
    flashcard: true,   // 闪卡：默认开
    review: true,      // 复习：默认开
    quiz: false,       // 测验：默认关（避免干扰思考）
    spelling: false,   // 拼写：默认关（输入时被打断不好）
    detail: false      // 单词详情：默认关
  };
  function autoSpeakKey(module) { return 'cet_autospeak_' + module; }
  function isAutoSpeakOn(module) {
    const v = localStorage.getItem(autoSpeakKey(module));
    if (v === '1') return true;
    if (v === '0') return false;
    return !!_AUTOSPEAK_DEFAULTS[module];
  }
  function setAutoSpeak(module, on) {
    localStorage.setItem(autoSpeakKey(module), on ? '1' : '0');
  }
  // 模块在渲染新单词时调用：开则发音、关则跳过
  function autoSpeak(module, word) {
    if (!word) return;
    if (!isAutoSpeakOn(module)) return;
    // 略微延迟避免与翻转动画/页面切换抢资源
    setTimeout(() => speak(word), 120);
  }
  // 一键创建开关 UI（返回 HTML 字符串；模块自己挂上去即可）
  function autoSpeakToggleHTML(module) {
    const on = isAutoSpeakOn(module);
    return '<label class="autospeak-toggle" data-module="' + module + '" title="自动播放当前单词的发音">' +
      '<input type="checkbox" ' + (on ? 'checked' : '') + '>' +
      '<span class="autospeak-toggle-track"></span>' +
      '<span class="autospeak-toggle-label">🔊 自动发音</span>' +
    '</label>';
  }
  // 绑定开关：监听 change 事件
  function bindAutoSpeakToggle(rootEl) {
    if (!rootEl) return;
    rootEl.querySelectorAll('.autospeak-toggle').forEach(label => {
      const cb = label.querySelector('input[type="checkbox"]');
      const mod = label.dataset.module;
      if (!cb || !mod) return;
      cb.addEventListener('change', () => setAutoSpeak(mod, cb.checked));
    });
  }

  // ========== Toast ==========

  // 卡片彩色主题列表
  const CARD_THEMES = [
    'card-theme-amber', 'card-theme-emerald', 'card-theme-sky',
    'card-theme-coral', 'card-theme-violet', 'card-theme-rose',
    'card-theme-teal', 'card-theme-orange'
  ];
  let lastThemeIdx = -1;

  // 获取随机卡片主题 class（保证不连续重复）
  function randomCardTheme() {
    let idx;
    do {
      idx = Math.floor(Math.random() * CARD_THEMES.length);
    } while (idx === lastThemeIdx && CARD_THEMES.length > 1);
    lastThemeIdx = idx;
    return CARD_THEMES[idx];
  }

  // 为元素应用随机彩色主题（移除旧主题，添加新主题）
  function applyCardTheme(el) {
    if (!el) return;
    CARD_THEMES.forEach(cls => el.classList.remove(cls));
    el.classList.add(randomCardTheme());
  }

  // ========== 随机色调半透明 ==========
  // 每次刷新为各模块生成不同的随机色调
  function initRandomTint() {
    const baseHue = Math.floor(Math.random() * 360);
    const root = document.documentElement;
    root.style.setProperty('--tint-h', baseHue);
    // 各模块偏移色调（黄金角 ~137.5°确保色差明显）
    const offsets = [0, 137.5, 275, 52.5, 190, 327.5, 105, 242.5];
    offsets.forEach((off, i) => {
      const h = (baseHue + off) % 360;
      root.style.setProperty('--tint-h-' + i, h);
    });
  }

  function toast(msg, type) {
    const c = $('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast toast-' + (type || 'info');
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => {
      t.classList.add('toast-fade');
      setTimeout(() => t.remove(), 400);
    }, 2500);
  }

  // ========== 离线检测 ==========

  let isOffline = !navigator.onLine;

  function initOfflineDetection() {
    // 初始状态
    updateOfflineUI(isOffline);

    window.addEventListener('offline', () => {
      isOffline = true;
      updateOfflineUI(true);
      toast('网络已断开，进入离线模式', 'error');
    });

    window.addEventListener('online', () => {
      isOffline = false;
      updateOfflineUI(false);
      toast('网络已恢复', 'success');
      // 恢复在线后尝试同步学习数据
      if (isServerMode && authToken && currentLevel) {
        fetchServerData();
      }
      // 恢复在线后尝试刷新天气
      if (_C.fetchWeather) {
        _C.weatherCache = null;
        _C.weatherCacheTime = 0;
        _C.fetchWeather();
      }
    });
  }

  function updateOfflineUI(offline) {
    const banner = $('offline-banner');
    if (banner) {
      if (offline) {
        banner.style.display = '';
        document.body.classList.add('is-offline');
      } else {
        banner.style.animation = 'offlineSlideUp 0.3s ease-in forwards';
        setTimeout(() => {
          banner.style.display = 'none';
          banner.style.animation = '';
          document.body.classList.remove('is-offline');
        }, 300);
      }
    }
  }

  // ========== 公开共享接口 ==========

  const _C = {
    // 常量
    BG_IMAGES,
    LEVEL_KEY,
    REVIEW_INTERVALS,

    // 状态访问器（通过 getter/setter 代理）
    get currentLevel() { return currentLevel; },
    set currentLevel(v) { currentLevel = v; },
    get words() { return words; },
    set words(v) { words = v; },
    get progress() { return progress; },
    set progress(v) { progress = v; },
    get notebook() { return notebook; },
    set notebook(v) { notebook = v; },
    get streakData() { return streakData; },
    set streakData(v) { streakData = v; },
    get settings() { return settings; },
    set settings(v) { settings = v; },
    get todayStr() { return todayStr; },
    set todayStr(v) { todayStr = v; },
    get currentPage() { return currentPage; },
    set currentPage(v) { currentPage = v; },
    get browsePage() { return browsePage; },
    set browsePage(v) { browsePage = v; },
    get browseTodayOnly() { return browseTodayOnly; },
    set browseTodayOnly(v) { browseTodayOnly = v; },

    // 闪卡状态
    get flashcardList() { return flashcardList; },
    set flashcardList(v) { flashcardList = v; },
    get flashcardIdx() { return flashcardIdx; },
    set flashcardIdx(v) { flashcardIdx = v; },
    get flashcardFlipped() { return flashcardFlipped; },
    set flashcardFlipped(v) { flashcardFlipped = v; },

    // 测验状态
    get quizQuestions() { return quizQuestions; },
    set quizQuestions(v) { quizQuestions = v; },
    get quizIdx() { return quizIdx; },
    set quizIdx(v) { quizIdx = v; },
    get quizCorrect() { return quizCorrect; },
    set quizCorrect(v) { quizCorrect = v; },
    get quizWrong() { return quizWrong; },
    set quizWrong(v) { quizWrong = v; },
    get quizAnswered() { return quizAnswered; },
    set quizAnswered(v) { quizAnswered = v; },

    // 复习状态
    get reviewList() { return reviewList; },
    set reviewList(v) { reviewList = v; },
    get reviewIdx() { return reviewIdx; },
    set reviewIdx(v) { reviewIdx = v; },
    get reviewFlipped() { return reviewFlipped; },
    set reviewFlipped(v) { reviewFlipped = v; },

    // 拼写状态
    get spellList() { return spellList; },
    set spellList(v) { spellList = v; },
    get spellIdx() { return spellIdx; },
    set spellIdx(v) { spellIdx = v; },
    get spellCorrectCount() { return spellCorrectCount; },
    set spellCorrectCount(v) { spellCorrectCount = v; },
    get spellWrongCount() { return spellWrongCount; },
    set spellWrongCount(v) { spellWrongCount = v; },
    get spellWrongList() { return spellWrongList; },
    set spellWrongList(v) { spellWrongList = v; },
    get spellWordAnswered() { return spellWordAnswered; },
    set spellWordAnswered(v) { spellWordAnswered = v; },
    get spellHintCount() { return spellHintCount; },
    set spellHintCount(v) { spellHintCount = v; },

    // 发音
    get accentMode() { return accentMode; },
    set accentMode(v) { accentMode = v; },

    // 天气缓存（由 weather.js 写入）
    weatherCache: null,
    weatherCacheTime: 0,

    // 工具函数
    $, status, text, show, hide, esc, shuffle,
    getDefs, getDefsHTML, getDefsText,

    // 日期工具
    getTodayStr, fmt, daysBetween, addDays,

    // 数据管理
    API_BASE,
    getStorageKey, initWords, loadData, saveData, detectServer, fetchServerData,
    recordCheckIn, recordLearn,
    markLearnedToday, getTodayLearned,
    addToNotebook,
    getDueWords,
    getDailyPlanWords,
    clearDailyPlanCache,

    // 模块练习计数
    MODULE_LABELS, incModuleCount, getModuleCount, getAllModuleCounts,
    renderModuleFooter, renderModuleSummary,

    // 服务端同步状态
    get isServerMode() { return isServerMode; },
    set isServerMode(v) { isServerMode = v; },
    get authToken() { return authToken; },
    set authToken(v) { authToken = v; },
    get currentUser() { return currentUser; },
    set currentUser(v) { currentUser = v; },

    // 背景图
    initBgRotation, getWeatherBgImages, switchBgToWeather,

    // 语音
    speak, speakSentence, setAccent,

    // 自动发音
    isAutoSpeakOn, setAutoSpeak, autoSpeak, autoSpeakToggleHTML, bindAutoSpeakToggle,

    // Toast
    toast,

    // 文字描边
    randomStrokeColor, applyTextStroke,

    // 卡片彩色主题
    CARD_THEMES, randomCardTheme, applyCardTheme,

    // 随机色调
    initRandomTint,

    // 离线检测
    initOfflineDetection,
    get isOffline() { return isOffline; },

    // 占位：各模块注册的函数（由各模块设置）
    // weather.js → fetchWeather, getWeatherType, applyWeatherEffect, ...
    // dashboard.js → renderDashboard, renderStreakCalendar, renderDailyGoal, renderMemoryCurve
    // browse.js → getFiltered, renderBrowse, renderPagination, browseTo, initLetterFilter
    // flashcard.js → initFlashcards, modeFilter, renderFlashcard, flipCard, nextCard, prevCard, markWord
    // quiz.js → startQuiz, quickStartQuiz, renderQuestion, selectAnswer, nextQuestion, showQuizResult, ...
    // spelling.js → startSpelling, renderSpellWord, ...
    // review.js → renderReview, startReviewSession, ...
    // word-detail.js → showWordDetail, generateMnemonic
  };

  return _C;
})();
