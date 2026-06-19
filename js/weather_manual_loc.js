// ========== 手动地址覆盖（weather_manual_loc.js）==========
// 用户点天气标签 → 弹浮层 → 输入"马池" → 实时调高德 /api/geocode/tips 联想 →
// 选中 → 写入 localStorage(cet_manual_location) → renderWeather 立即生效（前缀📌）
// 浮层里也有"恢复自动定位"按钮，清掉手动覆盖。
(function() {
  'use strict';
  const C = window._C;
  const MANUAL_LOC_KEY = 'cet_manual_location';

  let panel = null;
  let debounceTimer = null;

  function open() {
    if (panel) { close(); return; }
    panel = document.createElement('div');
    panel.className = 'manual-loc-panel';
    panel.innerHTML = `
      <div class="manual-loc-card">
        <div class="manual-loc-head">
          <span class="manual-loc-title">设定显示地址</span>
          <button class="manual-loc-close" type="button" aria-label="关闭">✕</button>
        </div>
        <div class="manual-loc-sub">输入地址关键字，从下拉中选择。覆盖后天气小组件将持续显示你选的地址。</div>
        <div class="manual-loc-input-row">
          <input type="text" class="manual-loc-input" placeholder="例：马池中路、东西湖区..." autocomplete="off" />
        </div>
        <div class="manual-loc-tips" role="listbox"></div>
        <div class="manual-loc-actions">
          <button class="manual-loc-reset" type="button">恢复自动定位</button>
          <span class="manual-loc-current"></span>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    // 当前已设置的显示
    refreshCurrent();

    // 事件
    panel.querySelector('.manual-loc-close').addEventListener('click', close);
    panel.querySelector('.manual-loc-reset').addEventListener('click', resetManual);
    const input = panel.querySelector('.manual-loc-input');
    input.addEventListener('input', onInput);
    input.addEventListener('keydown', onKey);
    setTimeout(() => input.focus(), 50);

    // 点击浮层外关闭
    setTimeout(() => document.addEventListener('mousedown', onOutside), 0);
  }

  function close() {
    if (!panel) return;
    document.removeEventListener('mousedown', onOutside);
    panel.remove();
    panel = null;
    if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
  }

  function onOutside(e) {
    if (!panel) return;
    if (panel.contains(e.target)) return;
    // 点击的是天气标签本身（再次点会关）—— 由 toggle 逻辑处理
    if (e.target.closest && e.target.closest('#dash-weather')) return;
    close();
  }

  function onKey(e) {
    if (e.key === 'Escape') close();
    if (e.key === 'Enter') {
      const first = panel.querySelector('.manual-loc-tip');
      if (first) first.click();
    }
  }

  function onInput(e) {
    const q = e.target.value.trim();
    const tipsEl = panel.querySelector('.manual-loc-tips');
    if (debounceTimer) clearTimeout(debounceTimer);
    if (!q) { tipsEl.innerHTML = ''; return; }
    // 300ms 防抖，省高德 quota
    debounceTimer = setTimeout(() => fetchTips(q, tipsEl), 300);
  }

  function fetchTips(q, tipsEl) {
    tipsEl.innerHTML = '<div class="manual-loc-loading">联想中...</div>';
    // 优先用最近一次 GPS 坐标作为 location，让高德按距离排序——
    // 同样输入"马池"，本地候选自动排到最前，不会混进北京/广州的同名地点
    let extra = '';
    try {
      const c = JSON.parse(localStorage.getItem('cet_last_coords') || 'null');
      if (c && c.lat && c.lon) {
        extra += `&location=${encodeURIComponent(c.lon + ',' + c.lat)}`;
      }
    } catch (_) {}
    // 兜底：从已显示的城市名抽个"市"加上
    const detectedCity = inferCity(window._C && window._C.weatherLocationLabel || '');
    if (detectedCity) extra += `&city=${encodeURIComponent(detectedCity)}`;
    fetch(`/api/geocode/tips?q=${encodeURIComponent(q)}${extra}`)
      .then(r => {
        if (r.status === 503) throw new Error('未配置高德 key');
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(data => {
        const tips = data.tips || [];
        if (!tips.length) {
          tipsEl.innerHTML = '<div class="manual-loc-empty">无匹配地址</div>';
          return;
        }
        tipsEl.innerHTML = tips.map(t => {
          const subtitle = [t.district, t.address].filter(Boolean).join(' · ');
          return `<button type="button" class="manual-loc-tip" data-name="${escapeHtml(t.name)}" data-district="${escapeHtml(t.district || '')}" data-location="${escapeHtml(t.location || '')}">
            <span class="manual-loc-tip-name">${escapeHtml(t.name)}</span>
            ${subtitle ? `<span class="manual-loc-tip-sub">${escapeHtml(subtitle)}</span>` : ''}
          </button>`;
        }).join('');
        tipsEl.querySelectorAll('.manual-loc-tip').forEach(btn => {
          btn.addEventListener('click', () => {
            const name = btn.dataset.name;
            const district = btn.dataset.district;
            const location = btn.dataset.location;  // 高德 inputtips 返回的 "lon,lat" 字符串
            // 拼接策略：district 去掉"省/市"层级，只保留"区/县"，再拼 name
            // 例：district="湖北省武汉市东西湖区" → 取"东西湖区" → 拼 "东西湖区 马池西路"
            const districtShort = (district || '').replace(/^.*?([^省市自治区]+?(?:区|县|新区|开发区))$/, '$1');
            let label;
            if (districtShort && !name.includes(districtShort)) {
              label = `${districtShort} ${name}`;
            } else {
              label = name;
            }
            applyManual(label, location);
          });
        });
      })
      .catch(err => {
        tipsEl.innerHTML = `<div class="manual-loc-empty">联想失败：${escapeHtml(err.message)}</div>`;
      });
  }

  function applyManual(label, location) {
    // 解析高德返回的 "lon,lat" 字符串，存对象格式 → weather.js 会按这个坐标重跑完整流程
    // （温度/天气描述/粒子特效/背景图都跟着切，而不是只换地名文字）
    const payload = { label };
    if (location && /^-?[\d.]+,-?[\d.]+$/.test(location)) {
      const parts = location.split(',').map(s => parseFloat(s.trim()));
      if (parts.length === 2 && isFinite(parts[0]) && isFinite(parts[1])) {
        payload.lon = parts[0].toFixed(5);
        payload.lat = parts[1].toFixed(5);
      }
    }
    try { localStorage.setItem(MANUAL_LOC_KEY, JSON.stringify(payload)); } catch (_) {}
    // 触发完整重查：清缓存 → 用 manual 坐标走 fetchWeatherByCoords → renderWeather 用 manual.label
    if (payload.lat && payload.lon && C.refreshWeatherFromManual) {
      C.refreshWeatherFromManual();
    } else if (C.weatherCache && C.renderWeather) {
      // 兜底（拿不到坐标时，至少把地名文字换上）
      C.renderWeather(C.weatherCache);
    }
    if (C.toast) C.toast('已设定显示地址：' + label, 'success');
    close();
  }

  function resetManual() {
    try { localStorage.removeItem(MANUAL_LOC_KEY); } catch (_) {}
    // 清掉手动锁后，重新走自动定位（GPS → IP 兜底），让温度/特效/背景全部回到真实位置
    if (C.refreshWeatherAuto) {
      C.refreshWeatherAuto();
    } else if (C.weatherCache && C.renderWeather) {
      C.renderWeather(C.weatherCache);
    }
    if (C.toast) C.toast('已恢复自动定位', 'success');
    close();
  }

  function refreshCurrent() {
    if (!panel) return;
    // 新格式 {label, lat, lon}；老格式裸字符串 → 两种都得能读出 label
    const cur = (() => {
      try {
        const raw = localStorage.getItem(MANUAL_LOC_KEY) || '';
        if (!raw) return '';
        if (raw.charAt(0) === '{') {
          try { return (JSON.parse(raw).label) || ''; } catch (_) { return ''; }
        }
        return raw;
      } catch (_) { return ''; }
    })();
    const el = panel.querySelector('.manual-loc-current');
    if (cur) {
      el.textContent = '当前手动设定：' + cur;
      el.style.display = '';
    } else {
      el.textContent = '';
      el.style.display = 'none';
    }
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }

  // 从已有反查标签里粗解出城市名（去"省"、留"市"），用于 inputtips 的 city 参数
  // 例："东西湖区 东山街道" → 没有市信息 → 走 _C.weatherCache 兜底
  // 例："湖北省武汉市东西湖区 马池西路" → "武汉市"
  function inferCity(label) {
    if (!label) return '';
    const m = label.match(/([^省市\s]+市)/);
    return m ? m[1] : '';
  }

  // 绑定到天气标签点击：等 DOM 就绪后注入
  function bindTrigger() {
    const el = document.getElementById('dash-weather');
    if (!el || el.dataset.manualLocBound === '1') return;
    el.dataset.manualLocBound = '1';
    el.style.cursor = 'pointer';
    el.title = '点击手动设定地址';
    el.addEventListener('click', open);
  }
  // 因为 dash-weather 内容会被 renderWeather 重写，但 #dash-weather 自身节点不变，
  // 所以一次绑定即可
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindTrigger);
  } else {
    bindTrigger();
  }
  // 兜底：dashboard 渲染后再试一次
  setTimeout(bindTrigger, 500);
  setTimeout(bindTrigger, 2000);

  // 暴露给设置面板用
  C.openManualLocation = open;
})();
