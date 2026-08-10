// ========== CET 词汇大师 — 天气模块 (weather.js) ==========
// 天气获取、渲染、视觉效果
(function() {
  'use strict';
  const C = window._C;

  const LOCATION_PERM_KEY = 'cet_location_permission';

  function fetchWeather() {
    const weatherEl = C.$('dash-weather');
    if (!weatherEl) return;

    // 离线时：显示缓存或隐藏天气
    if (C.isOffline) {
      if (C.weatherCache) {
        renderWeather(C.weatherCache);
        applyWeatherEffect(C.weatherCache.weather_code);
      } else {
        weatherEl.innerHTML = '<span style="color:var(--text-muted);font-size:0.82rem">离线模式</span>';
      }
      return;
    }

    // 30分钟缓存
    if (C.weatherCache && Date.now() - C.weatherCacheTime < 30 * 60 * 1000) {
      renderWeather(C.weatherCache);
      applyWeatherEffect(C.weatherCache.weather_code);
      return;
    }

    // 手动地址锁：用户选过带坐标的地址，直接用手动坐标拉天气，不走 GPS/IP。
    // 这样温度/天气描述/背景图/粒子特效都按用户选的位置同步刷新，避免"地名改了，其他还停在旧位置"。
    const manualForFetch = getManualLocation();
    if (manualForFetch && manualForFetch.lat && manualForFetch.lon) {
      fetchWeatherByCoords(weatherEl, manualForFetch.lat, manualForFetch.lon, 'MANUAL').then(ok => {
        if (!ok) applyTimeEffect();
      });
      return;
    }

    // 直接拉天气：先用浏览器 geolocation（精确，浏览器原生弹授权），
    // 失败/拒绝 → 用 IP 地理定位兜底（不精确但够用）→ 最终失败走时段效果
    doFetchWeather(weatherEl);
  }

  function showLocationPermissionDialog(weatherEl) {
    // 保留函数仅作兼容，未使用。原 中文询问弹窗已下线（容易让用户错过粒子）。
    void weatherEl;
  }

  // 反查行政区+街道。三层兜底，目标显示到 "区 + 道路" 粒度：
  //   1) OpenStreetMap Nominatim（中文 zh-CN，国内偶有抖动；用 AbortController 5s 超时）
  //   2) BigDataCloud free reverse-geocode（国内稳，从 administrative 数组深层往浅层兜）
  //   3) Open-Meteo 自带 reverse 备用（粒度粗，但至少能拿到城市）
  // 任一拿到带"区/县/街道/路"的结果即返回；都失败返回空字符串。
  function fetchWithTimeout(url, opts, ms) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, Object.assign({ signal: ctrl.signal }, opts || {}))
      .finally(() => clearTimeout(t));
  }

  function reverseGeocode(lat, lon) {
    const tryNominatim = () => fetchWithTimeout(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&zoom=18&accept-language=zh-CN&format=jsonv2&addressdetails=1`,
      { headers: { 'Accept': 'application/json' } },
      5000
    )
      .then(r => r.ok ? r.json() : Promise.reject('Nominatim HTTP ' + r.status))
      .then(data => {
        const a = data.address || {};
        // 字段宽松匹配：国内 OSM 区一般用 city_district / suburb / district / county
        const district = a.city_district || a.suburb || a.district || a.county || a.borough || '';
        // 道路/街道：OSM 国内常把"X街道"放在 town（如"柏泉街道"），所以也纳入候选。
        // 同时 road > pedestrian > footway > residential > neighbourhood > town(街道) > hamlet
        const road = a.road || a.pedestrian || a.footway || a.residential || a.neighbourhood
                  || (a.town && /街道|镇|乡/.test(a.town) ? a.town : '')
                  || a.hamlet || '';
        // 城市：剔除已被当街道用的 town，避免重复
        const cityCandidate = (a.town && !/街道|镇|乡/.test(a.town)) ? a.town : '';
        const city = a.city || cityCandidate || a.municipality || a.county || '';
        let label = '';
        if (district && road) label = `${district} ${road}`;
        else if (district) label = district;
        else if (road) label = road;
        else if (city) label = city;
        console.info('[weather] Nominatim 原始 address:', a, '→ 拼接:', label);
        return label;
      })
      .catch(err => {
        console.warn('[weather] Nominatim 反查失败:', err.message || err);
        return '';
      });

    const tryBDC = () => fetchWithTimeout(
      `https://api-bdc.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`,
      null,
      5000
    )
      .then(r => r.ok ? r.json() : Promise.reject('BDC HTTP ' + r.status))
      .then(data => {
        const admin = (data.localityInfo && data.localityInfo.administrative) || [];
        // 关键修复：不只看固定 adminLevel，而是把 4 级以上深层全部当候选。
        // 国内 BDC 实际返回：4=省 5=地级市 6=城区 7=区/县 8=街道 9=社区/路。
        // 找深层（道路级）和中层（区/县级）各一个。
        const deep = admin.filter(x => x.adminLevel >= 8).map(x => x.name).filter(Boolean);
        const mid = admin.filter(x => x.adminLevel >= 6 && x.adminLevel <= 7).map(x => x.name).filter(Boolean);
        const district = mid[mid.length - 1] || '';   // 取最细的一个
        const road = deep[deep.length - 1] || '';
        const city = data.city || data.locality || '';
        let label = '';
        if (district && road) label = `${district} ${road}`;
        else if (district) label = district;
        else if (road) label = road;
        else if (city) label = city;
        console.info('[weather] BDC 原始 admin:', admin, '→ 拼接:', label);
        return label;
      })
      .catch(err => {
        console.warn('[weather] BigDataCloud 反查失败:', err.message || err);
        return '';
      });

    // 第三源：Photon by Komoot（基于 OSM，免 key，明确支持 CORS）
    // 字段：features[0].properties.{district, city, name, street, ...}
    const tryPhoton = () => fetchWithTimeout(
      `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}&lang=default`,
      null,
      5000
    )
      .then(r => r.ok ? r.json() : Promise.reject('Photon HTTP ' + r.status))
      .then(data => {
        const p = (data && data.features && data.features[0] && data.features[0].properties) || null;
        if (!p) return '';
        const district = p.district || p.county || p.locality || '';
        const road = p.street || p.name || '';
        const city = p.city || p.state || '';
        let label = '';
        if (district && road) label = `${district} ${road}`;
        else if (district) label = district;
        else if (road) label = road;
        else if (city) label = city;
        console.info('[weather] Photon 原始:', p, '→ 拼接:', label);
        return label;
      })
      .catch(err => {
        console.warn('[weather] Photon 反查失败:', err.message || err);
        return '';
      });

    // 第四源（已下线）：Geocode.maps.co 自 2025 起改为强制 API key，
    // 无 key 直接返回 401。这里保留入口但默认禁用，避免每次反查浪费一次请求 + 一次报错。
    // 若拿到 key，把 GEOCODE_MAPS_KEY 设上即可启用。
    const GEOCODE_MAPS_KEY = '';
    const tryGeocodeMaps = () => {
      if (!GEOCODE_MAPS_KEY) return Promise.resolve('');
      return fetchWithTimeout(
        `https://geocode.maps.co/reverse?lat=${lat}&lon=${lon}&format=jsonv2&accept-language=zh-CN&api_key=${GEOCODE_MAPS_KEY}`,
        null,
        5000
      )
        .then(r => r.ok ? r.json() : Promise.reject('GeocodeMaps HTTP ' + r.status))
        .then(data => {
          const a = (data && data.address) || {};
          const district = a.city_district || a.suburb || a.district || a.county || a.borough || '';
          const road = a.road || a.pedestrian || a.footway || a.residential || a.neighbourhood
                    || (a.town && /街道|镇|乡/.test(a.town) ? a.town : '')
                    || a.hamlet || '';
          const cityCandidate = (a.town && !/街道|镇|乡/.test(a.town)) ? a.town : '';
          const city = a.city || cityCandidate || a.municipality || a.county || '';
          let label = '';
          if (district && road) label = `${district} ${road}`;
          else if (district) label = district;
          else if (road) label = road;
          else if (city) label = city;
          console.info('[weather] GeocodeMaps 原始 address:', a, '→ 拼接:', label);
          return label;
        })
        .catch(err => {
          console.warn('[weather] GeocodeMaps 反查失败:', err.message || err);
          return '';
        });
    };

    // 第五源（最优先，若可用）：自家后端代理的高德 API
    // 走 /api/geocode/reverse，key 留在后端，前端永远拿不到 key
    // 高德对国内地址粒度最准（能到"区+街道+门牌号"）
    // 返回里带 adcode，方便后续顺手拉高德实况天气
    const tryAmap = () => fetchWithTimeout(
      `/api/geocode/reverse?lat=${lat}&lon=${lon}`,
      null,
      5000
    )
      .then(r => {
        if (r.status === 503) {
          return Promise.reject('amap_unconfigured');
        }
        return r.ok ? r.json() : Promise.reject('Amap HTTP ' + r.status);
      })
      .then(data => {
        const label = data.label || '';
        if (label) {
          console.info('[weather] Amap 拼接:', label,
            '(district:', data.district, 'street:', data.street, 'number:', data.number,
            'adcode:', data.adcode, ')');
        }
        // 保存 adcode 供天气模块用
        if (data.adcode) C.weatherAmapAdcode = data.adcode;
        return label;
      })
      .catch(err => {
        if (err !== 'amap_unconfigured') {
          console.warn('[weather] Amap 反查失败:', err.message || err);
        }
        return '';
      });

    // 多源并发拉，按区/街道字段做"投票/合并"。五源任意拿到，互补合成最完整标签。
    // 优先级顺序：amap > nominatim > photon > bdc > geocodemaps
    // 但 amap 拼接已是"区+街道+门牌"完整粒度，命中即用，无需走合并逻辑
    return Promise.all([
      tryAmap().then(s => parseToParts(s)),
      tryNominatim().then(s => parseToParts(s)),
      tryBDC().then(s => parseToParts(s)),
      tryPhoton().then(s => parseToParts(s)),
      tryGeocodeMaps().then(s => parseToParts(s))
    ]).then(([a, n, b, p, g]) => {
      // amap 命中（带"区+路"）直接返回，跳过其他源合并
      const districtRe = /(区|县|新区|开发区)$/;
      const roadRe = /(街道|路|街|镇|乡|村|大道)$/;
      if (a.raw && districtRe.test(a.district) && roadRe.test(a.road)) {
        console.info('[weather] 多源反查合并(amap 命中):', { Amap: a.raw, 最终: a.raw });
        return a.raw;
      }
      const cands = [a, n, b, p, g];
      const pickDistrict =
        cands.map(c => c.district).find(s => s && districtRe.test(s))
        || cands.map(c => c.raw).find(s => s && districtRe.test(s))
        || a.district || n.district || b.district || p.district || g.district || '';
      const pickRoad =
        cands.map(c => c.road).find(s => s && roadRe.test(s))
        || cands.map(c => c.raw).find(s => s && roadRe.test(s))
        || a.road || n.road || b.road || p.road || g.road || '';
      let label = '';
      if (pickDistrict && pickRoad && pickDistrict !== pickRoad) label = `${pickDistrict} ${pickRoad}`;
      else label = pickDistrict || pickRoad || a.raw || n.raw || b.raw || p.raw || g.raw || '';
      console.info('[weather] 多源反查合并:', {
        Amap: a.raw, Nominatim: n.raw, BDC: b.raw, Photon: p.raw, GeocodeMaps: g.raw, 最终: label
      });
      return label;
    });
  }

  // 从一个文本标签里粗解出 district / road，方便合并
  function parseToParts(label) {
    if (!label) return { raw: '', district: '', road: '' };
    const parts = label.split(/\s+/).filter(Boolean);
    const districtRe = /(区|县|新区|开发区)$/;
    const roadRe = /(街道|路|街|镇|乡|村|大道)$/;
    let district = '', road = '';
    parts.forEach(p => {
      if (districtRe.test(p) && !district) district = p;
      else if (roadRe.test(p) && !road) road = p;
    });
    if (!district && parts.length) district = parts[0];
    return { raw: label, district, road };
  }

  // ========== 高德实况天气覆盖 ==========
  // 高德 weather API 返回中文（多云/晴/小雨/雷阵雨等），比 Open-Meteo 在国内准。
  // 调用时机：在反查拿到 adcode 后，覆盖 Open-Meteo 的 weather_code，重渲染并重做粒子。
  // 映射表：把高德文字反向映射回 WMO weather_code，保留现有粒子分支逻辑不动。
  const AMAP_WEATHER_TO_CODE = {
    '晴': 0,
    '少云': 1, '晴间多云': 2, '多云': 2, '阴': 3,
    '有风': 3, '平静': 1, '微风': 1, '和风': 2,
    '清风': 2, '强风/劲风': 3, '疾风': 3, '大风': 3, '烈风': 3, '风暴': 95,
    '雾': 45, '浓雾': 48, '强浓雾': 48, '轻雾': 45, '大雾': 48, '特强浓雾': 48,
    '霾': 45, '中度霾': 45, '重度霾': 45, '严重霾': 48,
    '阵雨': 80, '雷阵雨': 95, '雷阵雨并伴有冰雹': 96,
    // 雨 5 档（毛毛/小/中/暴/雷暴），高德文字到 WMO code 拆开后 getWeatherIntensity 才能拉档
    // 注：67 在 WMO 标准是 freezing-rain-heavy，我们国内罕用，借它当"暴雨"档使
    '小雨': 61, '中雨': 63, '大雨': 65, '暴雨': 67, '大暴雨': 67, '特大暴雨': 67,
    '强阵雨': 82, '强雷阵雨': 99, '极端降雨': 67,
    '毛毛雨/细雨': 51, '雨': 63, '小雨-中雨': 62, '中雨-大雨': 64, '大雨-暴雨': 66,
    '暴雨-大暴雨': 67, '大暴雨-特大暴雨': 67,
    '雨雪天气': 68, '雨夹雪': 68, '阵雨夹雪': 68, '冻雨': 67,
    '雪': 71, '阵雪': 85, '小雪': 71, '中雪': 73, '大雪': 75, '暴雪': 75,
    '小雪-中雪': 71, '中雪-大雪': 73, '大雪-暴雪': 75,
    '浮尘': 45, '扬沙': 45, '沙尘暴': 45, '强沙尘暴': 45,
    '热': 0, '冷': 0
  };

  function fetchAmapLiveWeather(adcode) {
    if (!adcode) return Promise.resolve(false);
    return fetchWithTimeout(`/api/geocode/weather?adcode=${encodeURIComponent(adcode)}`, null, 5000)
      .then(r => {
        if (r.status === 503) return Promise.reject('amap_unconfigured');
        return r.ok ? r.json() : Promise.reject('AmapWeather HTTP ' + r.status);
      })
      .then(data => {
        if (!data.weather) return false;
        const code = AMAP_WEATHER_TO_CODE[data.weather];
        if (code == null) {
          console.warn(`[weather] Amap 实况 "${data.weather}" 未在映射表，保留 Open-Meteo 判定`);
          return false;
        }
        // 覆盖 weatherCache：保留 amap 的中文描述 + 温度
        C.weatherCache = {
          temperature_2m: data.temperature,
          weather_code: code,
          amap_weather: data.weather   // 留个中文原文，renderWeather 优先用
        };
        C.weatherCacheTime = Date.now();
        console.info(`[weather] Amap 实况覆盖: ${data.weather} ${data.temperature}°C → code=${code} (reporttime=${data.reporttime})`);
        renderWeather(C.weatherCache);
        applyWeatherEffect(code);
        // Open-Meteo 先报"毛毛雨"切到 rain 背景，高德覆盖成"阴"时也要把背景切回 cloudy，
        // 否则会出现"文字写阴 21°C、背景却是大雨"的割裂感
        if (C.switchBgToWeather) C.switchBgToWeather();
        return true;
      })
      .catch(err => {
        if (err !== 'amap_unconfigured') {
          console.warn('[weather] Amap 实况天气失败:', err.message || err);
        }
        return false;
      });
  }

  // 用坐标拉天气 + 渲染 + 应用粒子。返回 Promise<bool>，true 表示成功。
  function fetchWeatherByCoords(weatherEl, lat, lon, source) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
    return fetch(url)
      .then(r => r.json())
      .then(data => {
        if (!data.current) throw new Error('no current data');
        C.weatherCache = data.current;
        C.weatherCacheTime = Date.now();
        const code = data.current.weather_code;
        const type = getWeatherType(code);
        const desc = getWeatherDesc(code);
        console.info(`[weather] 拉到天气 (来源: ${source}) code=${code} type=${type} desc=${desc} 坐标=(${lat}, ${lon})`);
        // 先用简版渲染（无地址），随后异步补地址
        renderWeather(data.current);
        applyWeatherEffect(code);
        if (C.switchBgToWeather) C.switchBgToWeather();
        // 异步反查地名，拿到后追加到天气小组件。
        // 注意：IP 定位坐标只到城市中心，反查永远拿不到区/街道——这是用户原始诉求的常见死角，
        // 所以 IP 来源时给地名追加 (估) 标记，让用户知道粒度限制。
        reverseGeocode(lat, lon).then(label => {
          if (label) {
            const isIP = source === 'IP';
            C.weatherLocationLabel = isIP ? (label + ' (估)') : label;
            renderWeather(data.current);
            console.info(`[weather] 反查地址 (${source}): ${C.weatherLocationLabel}`);
          } else {
            console.warn('[weather] 反查全部失败，仅显示天气不显示地名');
          }
          // 反查命中并拿到 adcode 后，再调高德实况天气覆盖 Open-Meteo 的判定
          // —— Open-Meteo 在国内对"多云/晴"经常判错，高德是中央气象局源最准
          if (C.weatherAmapAdcode) {
            fetchAmapLiveWeather(C.weatherAmapAdcode);
          }
        });
        return true;
      })
      .catch(err => {
        console.warn(`[weather] ${source} 拉天气失败:`, err.message || err);
        return false;
      });
  }

  // 用 IP 估算位置（不精确但不需要任何授权，作为 geolocation 失败的兜底）
  // 双 IP 源：ipapi.co + ip-api.com，谁先返回有效坐标用谁
  function fetchByIP(weatherEl) {
    const tryIpapi = () => fetchWithTimeout('https://ipapi.co/json/', null, 4000)
      .then(r => r.json())
      .then(data => {
        if (data && data.latitude && data.longitude) {
          return { lat: +data.latitude, lon: +data.longitude, city: data.city, country: data.country_name, src: 'ipapi.co' };
        }
        return null;
      })
      .catch(() => null);
    const tryIpapiCom = () => fetchWithTimeout('https://ip-api.com/json/?lang=zh-CN', null, 4000)
      .then(r => r.json())
      .then(data => {
        if (data && data.lat && data.lon) {
          return { lat: +data.lat, lon: +data.lon, city: data.city, country: data.country, src: 'ip-api.com' };
        }
        return null;
      })
      .catch(() => null);

    return Promise.any([tryIpapi(), tryIpapiCom()].map(p => p.then(v => v || Promise.reject('empty'))))
      .then(data => {
        const lat = data.lat.toFixed(5);
        const lon = data.lon.toFixed(5);
        localStorage.setItem('cet_last_coords', JSON.stringify({ lat, lon }));
        console.info(`[weather] IP 定位 (${data.src}) 到 ${data.city || '?'}, ${data.country || '?'} (${lat}, ${lon})`);
        return fetchWeatherByCoords(weatherEl, lat, lon, 'IP');
      })
      .catch(err => {
        console.warn('[weather] IP 定位全部失败:', err);
        return false;
      });
  }

  function doFetchWeather(weatherEl) {
    // 优先：浏览器 geolocation（精确，但需要用户在原生弹框允许）
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // 5 位小数 ≈ 1.1 米精度，足够支撑街道级反查；之前 toFixed(2) 砍到约 1.1km 是定位飘大的关键
          const lat = pos.coords.latitude.toFixed(5);
          const lon = pos.coords.longitude.toFixed(5);
          const acc = pos.coords.accuracy;
          console.info(`[weather] GPS 原始精度: ${acc ? acc.toFixed(0) + 'm' : '?'}, 保留 5 位坐标=(${lat}, ${lon})`);
          localStorage.setItem('cet_last_coords', JSON.stringify({ lat, lon }));
          localStorage.setItem(LOCATION_PERM_KEY, 'granted');
          fetchWeatherByCoords(weatherEl, lat, lon, 'GPS').then(ok => {
            if (!ok) fetchByIP(weatherEl).then(ipOk => { if (!ipOk) applyTimeEffect(); });
          });
        },
        () => {
          // 用户拒绝 / 超时 / 失败：用上次坐标缓存，否则走 IP 兜底
          localStorage.setItem(LOCATION_PERM_KEY, 'denied');
          const cached = localStorage.getItem('cet_last_coords');
          if (cached) {
            try {
              const { lat, lon } = JSON.parse(cached);
              fetchWeatherByCoords(weatherEl, lat, lon, '坐标缓存').then(ok => {
                if (!ok) fetchByIP(weatherEl).then(ipOk => { if (!ipOk) applyTimeEffect(); });
              });
              return;
            } catch (_) {}
          }
          fetchByIP(weatherEl).then(ipOk => { if (!ipOk) applyTimeEffect(); });
        },
        { timeout: 8000, maximumAge: 30 * 60 * 1000, enableHighAccuracy: true }
      );
    } else {
      // 浏览器不支持 geolocation，直接 IP 兜底
      fetchByIP(weatherEl).then(ipOk => { if (!ipOk) applyTimeEffect(); });
    }
  }

  // 手动地名覆盖：用户手动选的地址 > 后台投票反查。一旦用户改过，整套天气流程（温度/描述/特效/背景）
  // 都按用户手动坐标重跑，且不被自动定位覆盖。直到用户点"恢复自动定位"才放开锁。
  // 存储格式升级：旧版只存裸字符串 label，新版存 JSON {label, lat, lon}。getManualLocation 双向兼容。
  const MANUAL_LOC_KEY = 'cet_manual_location';
  function getManualLocation() {
    try {
      const raw = localStorage.getItem(MANUAL_LOC_KEY) || '';
      if (!raw) return null;
      if (raw.charAt(0) === '{') {
        try {
          const obj = JSON.parse(raw);
          if (obj && obj.label) return obj;
        } catch (_) {}
      }
      // 老格式：纯字符串只覆盖地名，不带坐标 → 不能驱动天气重查
      return { label: raw };
    } catch (_) { return null; }
  }

  function renderWeather(current) {
    const weatherEl = C.$('dash-weather');
    if (!weatherEl) return;
    const temp = Math.round(current.temperature_2m);
    const code = current.weather_code;
    const icon = getWeatherIcon(code);
    // 优先用 amap 的中文原文（"多云"/"晴间多云"/"雷阵雨" 等更准），fallback 走 WMO code 映射
    const desc = current.amap_weather || getWeatherDesc(code);
    // 优先级：手动覆盖 > 反查结果
    const manual = getManualLocation();
    const manualLabel = manual ? manual.label : '';
    const loc = manualLabel || C.weatherLocationLabel || '';
    // 手动地名带"📌"图钉标记，让用户一眼能看出"这是我自己选的"
    const locDisplay = manualLabel ? `📌 ${manualLabel}` : loc;
    weatherEl.innerHTML =
      `<span class="dash-weather-icon">${icon}</span>` +
      `<span>${desc} ${temp}°C</span>` +
      (loc ? `<span class="dash-weather-loc" title="${manualLabel ? '手动设定（点击天气模块可修改）' : loc}"> · ${locDisplay}</span>` : '');
  }

  function getWeatherIcon(code) {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 49) return '🌫️';
    // 51-67 全部归为雨（毛毛/小/中/大/暴/冻雨），之前把 60-69 错配成雪图标，导致"小雨却显示雪"
    if (code <= 67) return '🌧️';
    if (code <= 69) return '🌨️';   // 68-69 雨雪混合/重冻雨
    if (code <= 75) return '🌨️';   // 71-75 雪
    if (code <= 79) return '🌨️';   // 76-79 冰粒/雪粒
    if (code <= 82) return '🌧️';   // 80-82 阵雨
    if (code <= 86) return '🌨️';   // 85-86 阵雪
    if (code <= 99) return '⛈️';   // 95-99 雷暴
    return '🌡️';
  }

  function getWeatherDesc(code) {
    if (code === 0) return '晴';
    if (code === 1) return '少云';
    if (code === 2) return '晴间多云';
    if (code === 3) return '阴';
    if (code <= 49) return '雾';
    if (code <= 55) return '毛毛雨';
    if (code <= 62) return '小雨';
    if (code <= 65) return '中雨';
    if (code <= 67) return '暴雨';
    if (code <= 69) return '冻雨';
    if (code <= 75) return '雪';
    if (code <= 79) return '冰粒';
    if (code <= 82) return '阵雨';
    if (code <= 86) return '阵雪';
    if (code <= 99) return '雷暴';
    return '未知';
  }

  function getWeatherType(code) {
    if (code === 0) return 'sunny';
    if (code <= 3) return 'cloudy';
    if (code <= 49) return 'foggy';
    if (code <= 69) return 'rainy';
    if (code <= 79) return 'snowy';
    if (code <= 82) return 'rainy';
    if (code <= 86) return 'snowy';
    if (code <= 99) return 'stormy';
    return 'cloudy';
  }

  // ========== 天气强度参数（根据天气代码返回粒子数量/速度/透明度） ==========
  // 2026-05-21 v4 雨分 5 档（毛毛/小/中/暴/雷暴），数值随强度阶梯式拉开
  // 新增 clings 字段：屏幕上滞留→滑落的水珠数量（米家天气那种贴屏感）
  // dropWidth：雨滴粗细（暴雨明显更粗）；clingSlide：水珠静止 + 滑落 + 拖痕的总时长
  // 2026-05-27 v5：用户反馈"频率慢一些，视觉疲劳"——drops × 0.75 减少密度、speedMin × 1.4 拉慢下降
  function getWeatherIntensity(code) {
    // ===== 雨 5 档 =====
    if (code >= 95) return {     // 雷暴
      type: 'rain', grade: 'storm',
      drops: 168, dropWidth: 2.6, splashes: 18,
      speedMin: 0.42, speedRange: 0.25,
      opacityMin: 0.55, opacityRange: 0.40,
      heightMin: 60, heightRange: 35,
      tilt: 13, lightning: true,
      clings: 28, clingHoldMin: 0.8, clingHoldRange: 1.4, clingSlideMin: 1.4, clingSlideRange: 1.2,
    };
    if (code >= 80 && code <= 82) return {  // 阵雨（按高德"阵雨/强阵雨"），强度居中
      type: 'rain', grade: 'shower',
      drops: 98, dropWidth: 2.0, splashes: 13,
      speedMin: 0.55, speedRange: 0.30,
      opacityMin: 0.45, opacityRange: 0.35,
      heightMin: 48, heightRange: 28,
      tilt: 10, lightning: false,
      clings: 18, clingHoldMin: 1.0, clingHoldRange: 1.5, clingSlideMin: 1.8, clingSlideRange: 1.4,
    };
    if (code >= 66 && code <= 67) return {  // 暴雨（我们借 66-67 段当"暴雨"档）
      type: 'rain', grade: 'heavy',
      drops: 133, dropWidth: 2.4, splashes: 16,
      speedMin: 0.48, speedRange: 0.28,
      opacityMin: 0.50, opacityRange: 0.38,
      heightMin: 55, heightRange: 32,
      tilt: 12, lightning: false,
      clings: 24, clingHoldMin: 0.9, clingHoldRange: 1.3, clingSlideMin: 1.5, clingSlideRange: 1.2,
    };
    if (code === 68 || code === 69) return { // 冻雨保留旧档（中等偏弱）
      type: 'rain', grade: 'freezing',
      drops: 49, dropWidth: 1.8, splashes: 7,
      speedMin: 0.65, speedRange: 0.35,
      opacityMin: 0.38, opacityRange: 0.30,
      heightMin: 38, heightRange: 25,
      tilt: 7, lightning: false,
      clings: 10, clingHoldMin: 1.4, clingHoldRange: 1.8, clingSlideMin: 2.2, clingSlideRange: 1.6,
    };
    if (code >= 63 && code <= 65) return {  // 中雨（63=中雨，64=中-大过渡，65=大雨当作"中雨"区间上限）
      type: 'rain', grade: 'moderate',
      drops: 82, dropWidth: 1.8, splashes: 11,
      speedMin: 0.55, speedRange: 0.32,
      opacityMin: 0.42, opacityRange: 0.32,
      heightMin: 44, heightRange: 26,
      tilt: 9, lightning: false,
      clings: 15, clingHoldMin: 1.1, clingHoldRange: 1.6, clingSlideMin: 1.9, clingSlideRange: 1.5,
    };
    if (code >= 60 && code <= 62) return {  // 小雨（61=小雨，60/62=过渡）
      type: 'rain', grade: 'light',
      drops: 48, dropWidth: 1.5, splashes: 7,
      speedMin: 0.65, speedRange: 0.35,
      opacityMin: 0.36, opacityRange: 0.28,
      heightMin: 36, heightRange: 22,
      tilt: 7, lightning: false,
      clings: 9, clingHoldMin: 1.4, clingHoldRange: 1.8, clingSlideMin: 2.2, clingSlideRange: 1.6,
    };
    if (code >= 51 && code <= 59) return {  // 毛毛雨/细雨（51-55 毛毛 + 56-59 冻毛毛归到一档）
      type: 'rain', grade: 'drizzle',
      drops: 24, dropWidth: 1.2, splashes: 4,
      speedMin: 0.95, speedRange: 0.50,
      opacityMin: 0.28, opacityRange: 0.24,
      heightMin: 22, heightRange: 16,
      tilt: 4, lightning: false,
      clings: 5, clingHoldMin: 1.8, clingHoldRange: 2.2, clingSlideMin: 2.8, clingSlideRange: 2.0,
    };
    // ===== 雪类（保留，雪粒子开销低）=====
    if (code >= 83 && code <= 86) return { type: 'snow', flakes: 50, speedMin: 3.5, speedRange: 5, sizeMin: 3, sizeRange: 6, opacityMin: 0.35, opacityRange: 0.5 }; // 阵雪
    if (code === 75) return { type: 'snow', flakes: 65, speedMin: 3, speedRange: 5, sizeMin: 4, sizeRange: 7, opacityMin: 0.4, opacityRange: 0.5 };  // 大雪
    if (code === 74 || code === 73) return { type: 'snow', flakes: 42, speedMin: 4, speedRange: 5, sizeMin: 3, sizeRange: 6, opacityMin: 0.35, opacityRange: 0.45 }; // 中雪
    if (code >= 71 && code <= 72) return { type: 'snow', flakes: 22, speedMin: 5, speedRange: 6, sizeMin: 2, sizeRange: 5, opacityMin: 0.25, opacityRange: 0.35 };  // 小雪
    if (code >= 76 && code <= 79) return { type: 'snow', flakes: 32, speedMin: 3, speedRange: 4, sizeMin: 2, sizeRange: 4, opacityMin: 0.3, opacityRange: 0.4 }; // 冰粒
    return null;
  }

  // 允许显示天气动效的页面（已废弃白名单，默认所有页面显示）

  // ========== 屏幕水珠反馈（雨打到屏幕玻璃上的视觉反馈） ==========
  // 静态散布在 viewport 上的"水珠"——配合 backdrop-filter 让背后内容微扭曲，
  // 加上轻微呼吸抖动，模仿系统天气 app 那种"贴在屏幕上的水珠"沉浸感。
  function createRainSplashes(container, count) {
    if (!count) return;
    for (let i = 0; i < count; i++) {
      const splash = document.createElement('div');
      const size = 6 + Math.random() * 18;           // 6-24px
      const x = Math.random() * 95;
      const y = Math.random() * 75;                  // 多集中在上中部
      const delay = Math.random() * 5;
      const dur = 2.5 + Math.random() * 3;
      splash.className = 'rain-splash';
      splash.style.cssText = `position:absolute;width:${size}px;height:${size}px;left:${x}%;top:${y}%;animation-delay:${delay}s;animation-duration:${dur}s;`;
      container.appendChild(splash);
    }
  }

  // ========== 卡片溅射反馈（雨滴打在卡片上的水花动画） ==========
  // 2026-05-19 改造：不再单点轮询溅射，而是让 **每张可见卡片** 都持续维持 2-3 处溅射，
  // 频率随雨量增减；切页/换主题/停止天气都会清理。
  // 卡片选择器：landing/dashboard/工具落地页都覆盖
  const CARD_SELECTOR = [
    '#page-dashboard.active .dash-hero',
    '#page-dashboard.active .stat-card',
    '#page-dashboard.active .quick-card',
    '#landing-page .level-card',
  ].join(', ');

  let cardImpactTimer = null;
  let cardSnowTimer = null;
  let cardSnowFirstTickTimer = null;
  let cardSnowHoleTimer = null;
  let cardFogObserver = null;
  let cardSunObserver = null;
  let windowClingTimer = null;

  // 返回 [{el, rect}, ...]：单次 rect 量算，避免后续重复 getBoundingClientRect 触发 layout thrash。
  // 用 offsetParent 过滤 display:none（比 selector 假设 .hidden 类更稳）。
  function listVisibleCards() {
    const out = [];
    document.querySelectorAll(CARD_SELECTOR).forEach(el => {
      if (el.offsetParent === null) return;   // display:none / 隐藏祖先
      const rect = el.getBoundingClientRect();
      if (rect.width <= 30) return;
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;
      out.push({ el, rect });
    });
    return out;
  }

  // 跟 listVisibleCards 区别：不剔除"当前视口外"的卡，只剔除 display:none / 0 尺寸的。
  // 用途：雪盖/雾边/阳光/云阴这类"持久卡片反馈"——用户滚到下面也要看到效果，
  // 而雨溅射（rain-impact）仍走 listVisibleCards，避免视口外持续 spawn 浪费性能。
  function listAllCards() {
    const out = [];
    document.querySelectorAll(CARD_SELECTOR).forEach(el => {
      if (el.offsetParent === null) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 30) return;
      out.push({ el, rect });
    });
    return out;
  }

  function startCardImpacts(intensity) {
    stopCardImpacts();
    const drops = intensity.drops || 0;
    // tickRate：所有卡片一起 tick 一次的间隔（ms）。雨越大 tick 越快。
    const tickRate = drops >= 100 ? 320 : drops >= 70 ? 480 : drops >= 50 ? 680 : 980;
    // 每张卡片每次 tick 的"出花概率"——保证每卡平均 2-3 处水花长期挂着
    const perCardProb = drops >= 100 ? 0.85 : drops >= 70 ? 0.65 : drops >= 50 ? 0.5 : 0.35;
    cardImpactTimer = setInterval(() => {
      const cards = listVisibleCards();
      if (cards.length === 0) return;
      const cap = cards.length * 3;
      const live = document.querySelectorAll('.rain-impact').length;
      if (live >= cap) return;
      cards.forEach(({ rect }) => {
        if (Math.random() > perCardProb) return;
        const burst = Math.random() < 0.35 ? 2 : 1;
        for (let i = 0; i < burst; i++) {
          const x = rect.left + 8 + Math.random() * Math.max(20, rect.width - 16);
          createImpactSplash(x, rect.top);
        }
      });
    }, tickRate);
  }

  function stopCardImpacts() {
    if (cardImpactTimer) {
      clearInterval(cardImpactTimer);
      cardImpactTimer = null;
    }
    document.querySelectorAll('.rain-impact').forEach(el => el.remove());
  }

  // ========== 米家风格"贴屏水珠"：物理感的"凝结→缓动→加速滑落" ==========
  // v2 2026-05-21 重写：
  //   - 不再用 hold + slide 两段动画串联（v1 70% 时间静止，被吐槽"卡在屏幕上"）
  //   - 改为单段 cubic-bezier(.86,.02,.10,.99)，模拟"表面张力→加速滑落"全程不停
  //   - 小水珠（size < 8px）位移很小（10-25px），近似纹丝不动模拟表面张力赢
  //   - 大水珠位移正常（100-200px），模拟水珠重力突破张力快速滑下
  // 与 createRainSplashes（一次性散布的静态水珠）区别：cling 是循环生成的，每颗有完整生命
  function startWindowClings(container, intensity) {
    stopWindowClings();
    const total = intensity.clings || 0;
    if (!total) return;
    // 单段动画总时长（替代 v1 的 hold + slide），雨越大水珠生命越短（更快冲过来又冲走）
    const durMin = intensity.clingHoldMin || 1.2;
    const durRange = (intensity.clingHoldRange || 1.5) + (intensity.clingSlideMin || 1.8);
    // 初始 burst：先撒一半，让进入场景立刻有"贴屏"感
    for (let i = 0; i < Math.ceil(total / 2); i++) {
      spawnCling(container, durMin, durRange, Math.random() * 1.2);
    }
    // 循环补充：每 X ms 看一下当前活水珠数，没到 total 就补 1-2 颗
    const spawnRate = Math.max(200, Math.round(1100 - (intensity.drops || 0) * 3));
    windowClingTimer = setInterval(() => {
      const live = container.querySelectorAll('.rain-cling').length;
      if (live >= total) return;
      const burst = Math.min(total - live, Math.random() < 0.4 ? 2 : 1);
      for (let i = 0; i < burst; i++) {
        spawnCling(container, durMin, durRange, 0);
      }
    }, spawnRate);
  }

  function spawnCling(container, durMin, durRange, delay) {
    const cling = document.createElement('div');
    cling.className = 'rain-cling';
    // 大小：6-16px 主流，偶尔来颗 18-22px 的大水珠
    const isLarge = Math.random() < 0.18;
    const size = isLarge ? (18 + Math.random() * 5) : (5 + Math.random() * 9);
    // 起点 X 全屏随机，Y 集中在视口上 2/3
    const x = Math.random() * 96;
    const y = Math.random() * 65;
    const dur = durMin + Math.random() * durRange;
    // 物理感：size < 8 表面张力足够、位移极小；size 8-14 中等滑落；size > 14 大水珠快速滑下
    let dist;
    if (size < 8) {
      dist = 8 + Math.random() * 18;            // 8-26px 几乎不动
    } else if (size < 14) {
      dist = 50 + Math.random() * 80;           // 50-130px 缓滑
    } else {
      dist = 130 + Math.random() * 100;         // 130-230px 大水珠下坠
    }
    // 拖痕长度跟随位移（小水珠没有拖痕，大水珠拖痕明显）
    const trailLen = size < 8 ? 0 : Math.round(dist * 0.55);
    cling.style.cssText = [
      `position:absolute`,
      `left:${x}%`,
      `top:${y}%`,
      `width:${size.toFixed(1)}px`,
      `height:${size.toFixed(1)}px`,
      `--cling-dist:${dist.toFixed(0)}px`,
      `--cling-duration:${dur.toFixed(2)}s`,
      `--cling-trail-len:${trailLen}px`,
      `animation-delay:${delay.toFixed(2)}s`,
    ].join(';');
    container.appendChild(cling);
    // 总寿命 = delay + dur，自删；额外 + 200ms 兜底
    setTimeout(() => cling.remove(), (delay + dur) * 1000 + 200);
  }

  function stopWindowClings() {
    if (windowClingTimer) {
      clearInterval(windowClingTimer);
      windowClingTimer = null;
    }
    document.querySelectorAll('.rain-cling').forEach(el => el.remove());
  }

  function createImpactSplash(x, y) {
    const splash = document.createElement('div');
    splash.className = 'rain-impact';
    splash.style.cssText = `left:${x}px;top:${y}px;`;
    // 5 条水花线条 + 1 个圆环（::before 由 CSS 出）
    for (let i = 0; i < 5; i++) {
      const droplet = document.createElement('span');
      // 角度集中在向上扇形（-50° ~ 50° 偏离正上）
      const angle = -50 + i * 25 + (Math.random() - 0.5) * 8;
      const dist = 8 + Math.random() * 10;
      droplet.style.setProperty('--angle', `${angle}deg`);
      droplet.style.setProperty('--dist', `${dist}px`);
      splash.appendChild(droplet);
    }
    document.body.appendChild(splash);
    setTimeout(() => splash.remove(), 700);
  }

  // ========== 积水涟漪效果 ==========
  let rippleTimer = null;
  let puddleGrowTimer = null;
  let waterAnimalsSpawned = false;
  // 彩蛋兜底 timer：原设计只在积水/积雪涨到阈值才召唤，毛毛雨要等 6 分钟以上，
  // 绝大多数用户根本等不到，13 个 Lottie 素材形同摆设。改为"下满 90 秒无论多高必召唤"。
  const ANIMAL_FALLBACK_MS = 90000;
  let animalFallbackTimer = null;
  let snowmenFallbackTimer = null;

  // 池塘小动物（13 种基础 × hue/scale/flip 变体 → 100+ 不重样）。
  // 用 emoji 而非 OpenMoji/Twemoji SVG：零依赖、首屏不加载几百 KB；
  // 风格统一靠 CSS filter（hue-rotate + saturate + drop-shadow）整齐化。
  // 池塘小动物：手写 SVG 模板（取代 emoji，自带摆尾/眨眼/划鳍内部动画，矢量缩放无损）
  // 三种基础 × 颜色变体 (调色板) × 翻转 × 速度 → 100+ 不重样
  // 颜色方案：每只在 spawn 时随机选一组 (--c-mid / --c-dark / --c-shadow / --c-belly)
  const SVG_WATER_CREATURES = {
    // 写实金鱼：双层尾鳍 + 鳞片纹路 + 腹白背深 + 侧线 + 眼神光
    fish: `<svg viewBox="0 0 120 60" class="svg-fish"><path class="fish-tail" d="M 86 30 Q 100 14, 116 8 Q 112 18, 116 30 Q 112 42, 116 52 Q 100 46, 86 30 Z" fill="var(--c-dark)"/><path class="fish-tail" d="M 86 30 Q 96 20, 108 14 Q 105 22, 108 30 Q 105 38, 108 46 Q 96 40, 86 30 Z" fill="var(--c-shadow)" opacity="0.55"/><ellipse class="fish-body" cx="55" cy="30" rx="36" ry="18" fill="var(--c-mid)"/><path d="M 22 36 Q 55 50, 88 36 Q 80 46, 55 46 Q 30 46, 22 36 Z" fill="#ffffff" opacity="0.35"/><path d="M 22 26 Q 55 14, 88 26 Q 80 18, 55 16 Q 30 18, 22 26 Z" fill="var(--c-shadow)" opacity="0.45"/><path d="M 22 30 Q 55 30, 86 30" stroke="var(--c-shadow)" stroke-width="0.8" fill="none" opacity="0.5"/><path d="M 42 14 Q 55 4, 70 12 Q 62 16, 50 17 Q 45 17, 42 14 Z" fill="var(--c-dark)" opacity="0.9"/><path d="M 42 14 Q 55 6, 70 12 Q 62 14, 50 15 Z" fill="var(--c-shadow)" opacity="0.4"/><path d="M 50 46 Q 58 56, 70 48 Q 60 45, 50 46 Z" fill="var(--c-dark)" opacity="0.85"/><path d="M 36 22 Q 30 30, 36 38" stroke="var(--c-shadow)" stroke-width="1.2" fill="none"/><path d="M 38 24 Q 33 30, 38 36" stroke="var(--c-shadow)" stroke-width="0.6" fill="none" opacity="0.6"/><g stroke="#ffffff" stroke-width="0.5" fill="none" opacity="0.45"><path d="M 45 24 Q 50 28, 45 32"/><path d="M 53 22 Q 58 28, 53 34"/><path d="M 61 20 Q 67 28, 61 36"/><path d="M 69 22 Q 75 28, 69 34"/><path d="M 77 24 Q 82 28, 77 32"/><path d="M 49 26 Q 53 30, 49 34"/><path d="M 57 28 Q 62 30, 57 32"/><path d="M 65 26 Q 70 30, 65 34"/><path d="M 73 26 Q 78 30, 73 34"/></g><circle cx="28" cy="27" r="4.5" fill="#fff"/><circle cx="28" cy="27" r="2.5" fill="#1a1a1a"/><circle cx="29.3" cy="25.7" r="1" fill="#fff"/><circle cx="27" cy="28.5" r="0.5" fill="#fff" opacity="0.6"/><path d="M 17 32 Q 22 33, 20 36" stroke="var(--c-shadow)" stroke-width="1" fill="none" stroke-linecap="round"/></svg>`,
    // 写实青蛙：水下阴影 + 后腿露蹼 + 不规则斑点（7 颗）+ 鼓腮喉袋 + 大凸眼带眼神光 + 嘴线 + 鼻孔
    frog: `<svg viewBox="0 0 120 60" class="svg-frog"><ellipse cx="60" cy="52" rx="38" ry="6" fill="var(--c-shadow)" opacity="0.45"/><path d="M 12 46 Q 5 42, 3 47 Q 8 50, 14 49 Z" fill="var(--c-dark)" opacity="0.65"/><path d="M 108 46 Q 115 42, 117 47 Q 112 50, 106 49 Z" fill="var(--c-dark)" opacity="0.65"/><path d="M 23 38 Q 18 22, 32 14 Q 44 8, 60 8 Q 76 8, 88 14 Q 102 22, 97 38 Q 94 46, 76 48 Q 60 49, 44 48 Q 26 46, 23 38 Z" fill="var(--c-mid)"/><path d="M 32 18 Q 60 11, 88 18 Q 75 21, 60 22 Q 45 21, 32 18 Z" fill="#ffffff" opacity="0.28"/><ellipse cx="36" cy="30" rx="4" ry="3" fill="var(--c-dark)" opacity="0.55" transform="rotate(-15 36 30)"/><ellipse cx="52" cy="36" rx="3" ry="2.2" fill="var(--c-dark)" opacity="0.5"/><ellipse cx="72" cy="32" rx="3.5" ry="2.5" fill="var(--c-dark)" opacity="0.55" transform="rotate(10 72 32)"/><ellipse cx="84" cy="28" rx="2.5" ry="1.8" fill="var(--c-dark)" opacity="0.5"/><ellipse cx="44" cy="38" rx="2.2" ry="1.5" fill="var(--c-dark)" opacity="0.45"/><ellipse cx="62" cy="42" rx="3" ry="2" fill="var(--c-dark)" opacity="0.5"/><ellipse cx="78" cy="40" rx="2.8" ry="1.8" fill="var(--c-dark)" opacity="0.5"/><ellipse class="frog-throat" cx="60" cy="44" rx="16" ry="3.5" fill="var(--c-mid)"/><ellipse class="frog-throat" cx="60" cy="44" rx="14" ry="2.5" fill="#ffffff" opacity="0.18"/><g class="frog-eye"><ellipse cx="36" cy="11" rx="10.5" ry="10.5" fill="var(--c-mid)"/><ellipse cx="34" cy="9" rx="3" ry="3.5" fill="#ffffff" opacity="0.4"/><circle cx="36" cy="11" r="6.2" fill="#fff5d4"/><ellipse class="frog-pupil" cx="36" cy="12" rx="2.5" ry="3.8" fill="#1a1a1a"/><circle cx="37.5" cy="9.5" r="1.4" fill="#fff"/><circle cx="34.5" cy="13" r="0.6" fill="#fff" opacity="0.7"/></g><g class="frog-eye"><ellipse cx="84" cy="11" rx="10.5" ry="10.5" fill="var(--c-mid)"/><ellipse cx="82" cy="9" rx="3" ry="3.5" fill="#ffffff" opacity="0.4"/><circle cx="84" cy="11" r="6.2" fill="#fff5d4"/><ellipse class="frog-pupil" cx="84" cy="12" rx="2.5" ry="3.8" fill="#1a1a1a"/><circle cx="85.5" cy="9.5" r="1.4" fill="#fff"/><circle cx="82.5" cy="13" r="0.6" fill="#fff" opacity="0.7"/></g><path d="M 36 30 Q 60 40, 84 30" stroke="var(--c-dark)" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M 36 31 Q 60 39, 84 31" stroke="#000" stroke-width="0.5" fill="none" opacity="0.45"/><ellipse cx="54" cy="20" rx="0.9" ry="0.6" fill="#2a2a2a"/><ellipse cx="66" cy="20" rx="0.9" ry="0.6" fill="#2a2a2a"/></svg>`,
    // 写实龟：水下阴影 + 双层鳍 + 六边形龟甲 6 块 + 颈部褶皱 + 头部高光
    turtle: `<svg viewBox="0 0 120 60" class="svg-turtle"><ellipse cx="60" cy="52" rx="30" ry="4" fill="var(--c-shadow)" opacity="0.45"/><ellipse class="turtle-fin turtle-fin-back" cx="92" cy="40" rx="9" ry="5" fill="var(--c-dark)"/><ellipse class="turtle-fin turtle-fin-back" cx="92" cy="40" rx="6" ry="3" fill="var(--c-shadow)" opacity="0.5"/><ellipse class="turtle-fin turtle-fin-front" cx="28" cy="40" rx="10" ry="5" fill="var(--c-dark)"/><ellipse class="turtle-fin turtle-fin-front" cx="28" cy="40" rx="7" ry="3.2" fill="var(--c-shadow)" opacity="0.5"/><ellipse cx="60" cy="32" rx="33" ry="20" fill="var(--c-mid)"/><ellipse cx="60" cy="32" rx="33" ry="20" stroke="var(--c-shadow)" stroke-width="1.2" fill="none" opacity="0.7"/><ellipse cx="55" cy="22" rx="22" ry="5" fill="#ffffff" opacity="0.3"/><g stroke="var(--c-shadow)" stroke-width="1" fill="var(--c-dark)" fill-opacity="0.35"><polygon points="60,18 70,21 72,30 65,36 55,36 48,30 50,21"/><polygon points="42,22 50,21 48,30 42,36 35,32 35,24"/><polygon points="78,22 70,21 72,30 78,36 85,32 85,24"/><polygon points="55,38 65,38 63,46 57,46"/><polygon points="35,26 30,32 30,40 38,42 40,36"/><polygon points="85,26 90,32 90,40 82,42 80,36"/></g><g fill="var(--c-shadow)" opacity="0.55"><circle cx="60" cy="27" r="0.8"/><circle cx="42" cy="28" r="0.7"/><circle cx="78" cy="28" r="0.7"/></g><ellipse cx="22" cy="32" rx="9.5" ry="7" fill="var(--c-mid)"/><path d="M 16 28 Q 14 32, 16 36" stroke="var(--c-shadow)" stroke-width="0.6" fill="none" opacity="0.6"/><path d="M 18 27 Q 16 32, 18 37" stroke="var(--c-shadow)" stroke-width="0.5" fill="none" opacity="0.5"/><ellipse cx="20" cy="29" rx="4" ry="2" fill="#ffffff" opacity="0.22"/><circle cx="19" cy="30" r="1.8" fill="#fff"/><circle cx="19" cy="30" r="1.1" fill="#1a1a1a"/><circle cx="19.5" cy="29.5" r="0.4" fill="#fff"/><path d="M 12 33 Q 16 34, 19 33" stroke="var(--c-shadow)" stroke-width="0.9" fill="none" stroke-linecap="round"/></svg>`,
  };

  // 12 套预设配色，覆盖橘鱼/锦鲤红/蓝海王鱼/紫罗兰章鱼色/翡翠绿青蛙/深咖龟壳/粉色鱼/金黄/青绿/灰白...
  const ANIMAL_PALETTES = [
    { mid: '#FF9A4E', dark: '#D86826', shadow: '#7A3A12' }, // 经典金鱼橘
    { mid: '#E94B5C', dark: '#A82334', shadow: '#5A0F18' }, // 锦鲤红
    { mid: '#4FA8E2', dark: '#1F6FA8', shadow: '#0F3F60' }, // 蓝海鱼
    { mid: '#A75CE2', dark: '#6B2DA0', shadow: '#3A1255' }, // 紫
    { mid: '#56AB2F', dark: '#2F6B1B', shadow: '#15330A' }, // 青蛙绿
    { mid: '#3F7A4E', dark: '#1F4530', shadow: '#0F2418' }, // 龟壳深绿
    { mid: '#F5C76A', dark: '#C8923A', shadow: '#7A5520' }, // 金黄
    { mid: '#E0789C', dark: '#A8425D', shadow: '#5A1A2E' }, // 粉
    { mid: '#48C9B0', dark: '#1A8773', shadow: '#0A453A' }, // 翡翠青
    { mid: '#7C8FA8', dark: '#475669', shadow: '#22293A' }, // 灰白银鱼
    { mid: '#FF7043', dark: '#C04018', shadow: '#5C1A08' }, // 橘红
    { mid: '#9CCC65', dark: '#558B2F', shadow: '#2A4A12' }, // 黄绿
  ];

  // ========== Lottie 升级：本地化加载 Google Noto Animated Emoji 水生动物 ==========
  // 库本地引入（HTML <script src="js/lib/lottie_light.min.js">），素材在 assets/lottie/*.json。
  // 加载失败 / 库未就绪 → 自动回退到上面的 SVG_WATER_CREATURES，特效绝不裸奔。
  // 要切回纯 SVG：把 USE_LOTTIE 改成 false 即可。
  const USE_LOTTIE = true;
  const LOTTIE_BASE = 'assets/lottie/';
  // motion：swim 侧面横向游 / crawl 贴底慢爬 / float 原地小幅浮沉
  const LOTTIE_ANIMALS = [
    { file: 'fish',      motion: 'swim'  },
    { file: 'blowfish',  motion: 'swim'  },
    { file: 'dolphin',   motion: 'swim'  },
    { file: 'whale',     motion: 'swim'  },
    { file: 'crocodile', motion: 'swim'  },
    { file: 'turtle',    motion: 'swim'  },
    { file: 'crab',      motion: 'crawl' },
    { file: 'lobster',   motion: 'crawl' },
    { file: 'frog',      motion: 'float' },
    { file: 'octopus',   motion: 'float' },
    { file: 'penguin',   motion: 'swim'  },
    { file: 'otter',     motion: 'swim'  },
    { file: 'seal',      motion: 'swim'  },
  ];
  // 晴天陆地动物：同源 Google Noto Animated Emoji（assets/lottie/*.json），
  // 走地面带 .sunny-ground 而非积水层；蝴蝶/鸟用 float 飘浮，其余贴地慢走。
  const LOTTIE_LAND_ANIMALS = [
    { file: 'cat',       motion: 'crawl' },
    { file: 'dog',       motion: 'crawl' },
    { file: 'poodle',    motion: 'crawl' },
    { file: 'rabbit',    motion: 'crawl' },
    { file: 'fox',       motion: 'crawl' },
    { file: 'bear',      motion: 'crawl' },
    { file: 'panda',     motion: 'crawl' },
    { file: 'chipmunk',  motion: 'crawl' },
    { file: 'butterfly', motion: 'float' },
    { file: 'bird',      motion: 'float' },
    { file: 'hedgehog',  motion: 'crawl' },
    { file: 'raccoon',   motion: 'crawl' },
    { file: 'lizard',    motion: 'crawl' },
    { file: 'snail',     motion: 'crawl' },
    { file: 'ladybug',   motion: 'crawl' },
    { file: 'goat',      motion: 'crawl' },
    { file: 'pig',       motion: 'crawl' },
    { file: 'peacock',   motion: 'crawl' },
    { file: 'owl',       motion: 'float' },
    { file: 'eagle',     motion: 'float' },
    { file: 'bat',       motion: 'float' },
  ];
  const SUNNY_ANIMAL_DELAY_MS = 12000;   // 晴天没有蓄积过程，进入后 12 秒放出动物
  let sunnyAnimalTimer = null;
  let lottieInstances = [];   // 存活的 lottie 实例；stopWaterAnimals 时统一 destroy 防内存泄漏
  let roamTimers = [];        // 二维随机游走的 setTimeout 句柄；stopWaterAnimals 时清空
  const clampNum = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  function createRainPuddle(container, intensity) {
    // 底部积水层 — 从 4px 起涨到 viewport 12%；触顶后生成动物彩蛋。
    // 阈值原为 25%，实测毛毛雨要 6.7 分钟、雷暴 1.5 分钟才触发，改 12% 后减半。(2026-08-10)
    const puddle = document.createElement('div');
    puddle.className = 'rain-puddle';
    let curH = 4;
    const targetH = Math.round(window.innerHeight * 0.12);
    puddle.style.height = curH + 'px';
    puddle.dataset.targetH = targetH;
    container.appendChild(puddle);
    waterAnimalsSpawned = false;

    // 兜底：下满 90 秒不管积水涨到哪都召唤，保证彩蛋一定能被看到
    if (animalFallbackTimer) clearTimeout(animalFallbackTimer);
    animalFallbackTimer = setTimeout(() => {
      animalFallbackTimer = null;
      const p = document.querySelector('.rain-puddle');
      if (p && !waterAnimalsSpawned) {
        waterAnimalsSpawned = true;
        spawnWaterAnimals(p, intensity);
        console.info('[weather] 下满 90s 兜底触发，召唤小动物 🐟🐸');
      }
    }, ANIMAL_FALLBACK_MS);

    // 增长 timer：雨越大涨得越快（雷暴 ~1s 一次 1.5-3 px；毛毛雨 ~3s 一次 1.3 px）
    const growStep = 1.2 + intensity.drops * 0.012;
    const growInterval = Math.max(900, 3200 - intensity.drops * 10);
    if (puddleGrowTimer) clearInterval(puddleGrowTimer);
    puddleGrowTimer = setInterval(() => {
      const p = document.querySelector('.rain-puddle');
      if (!p) { clearInterval(puddleGrowTimer); puddleGrowTimer = null; return; }
      if (curH < targetH) {
        curH = Math.min(targetH, curH + growStep);
        p.style.height = curH + 'px';
      } else if (!waterAnimalsSpawned) {
        // 触达 25% 阈值：生成 2-3 只小动物
        waterAnimalsSpawned = true;
        spawnWaterAnimals(p, intensity);
        console.info('[weather] 积水达 25%，召唤小动物 🐟🐸');
      }
    }, growInterval);

    // 定时生成涟漪（沿积水水面线，模拟雨滴打水面）
    if (rippleTimer) clearInterval(rippleTimer);
    const rippleRate = Math.max(180, 700 - intensity.drops * 5);
    rippleTimer = setInterval(() => {
      if (!document.querySelector('.rain-puddle')) {
        clearInterval(rippleTimer);
        rippleTimer = null;
        return;
      }
      // 同时来 1-2 个涟漪，模拟多滴打水
      const burst = Math.random() < 0.4 ? 2 : 1;
      for (let i = 0; i < burst; i++) {
        const ripple = document.createElement('div');
        ripple.className = 'rain-ripple';
        const x = 3 + Math.random() * 94;
        const size = 10 + Math.random() * 24;
        ripple.style.left = x + '%';
        ripple.style.width = size + 'px';
        ripple.style.height = (size * 0.32) + 'px';
        puddle.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
      }
    }, rippleRate);
  }

  // ========== 雨彩蛋：积水触顶后召唤的小动物 ==========
  // 三层 DOM，各管一个 transform 互不覆盖：
  //   .water-animal       位移 —— JS 二维随机游走（startRoam/roamStep），在积水矩形内随机选点 + transition 平滑游过去
  //   .water-animal-body  朝向 —— JS 按水平移动方向写 scaleX(±1)
  //   .water-animal-inner 跳跃 —— 点击时播 CSS animalHop / animalDart（装载 SVG/Lottie）
  // 渲染双路：USE_LOTTIE 且库就绪 → 本地 Lottie（Noto 动物）；否则回退手写 SVG。
  function spawnWaterAnimals(puddle, intensity, pool) {
    const count = 3 + Math.floor(Math.random() * 2);   // 3-4 只
    const ANIMALS = pool || LOTTIE_ANIMALS;            // 晴天传入陆地动物池，其余默认水生
    const useLottie = USE_LOTTIE && window.lottie && ANIMALS.length > 0;
    const svgTypes = Object.keys(SVG_WATER_CREATURES);
    // 同一批不出现重复种类：洗牌后按序取，避免两只一模一样的并排出现
    const bag = ANIMALS.slice();
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }

    for (let i = 0; i < count; i++) {
      const wrap = document.createElement('div');
      wrap.className = 'water-animal';
      const body = document.createElement('div');
      body.className = 'water-animal-body';
      const inner = document.createElement('div');
      inner.className = 'water-animal-inner';

      // —— 选素材 + 运动形态 ——
      let lottiePick = null, motion = 'swim', palette = null;
      const svgFallbackType = svgTypes[Math.floor(Math.random() * svgTypes.length)];
      if (useLottie) {
        lottiePick = bag[i % bag.length];
        motion = lottiePick.motion;
      } else {
        inner.innerHTML = SVG_WATER_CREATURES[svgFallbackType];
        palette = ANIMAL_PALETTES[Math.floor(Math.random() * ANIMAL_PALETTES.length)];
      }

      // —— 尺寸：Lottie 用方形（emoji 1:1）；SVG 用 2:1 横向 ——
      const sizeBase = useLottie ? 34 : (svgFallbackType === 'turtle' ? 38 : svgFallbackType === 'frog' ? 24 : 28);
      const size = sizeBase + Math.floor(Math.random() * 22);
      const wrapW = useLottie ? size : size * 2;

      // —— 颜色 / 滤镜变体 ——
      const extraHue = useLottie ? 0 : Math.floor(Math.random() * 60 - 30);
      const sat = useLottie ? '1' : (0.85 + Math.random() * 0.4).toFixed(2);
      const bright = (0.95 + Math.random() * 0.15).toFixed(2);
      const filter = useLottie
        ? `saturate(${sat}) brightness(${bright}) drop-shadow(0 2px 3px rgba(0,0,0,0.3))`
        : `hue-rotate(${extraHue}deg) saturate(${sat}) brightness(${bright}) drop-shadow(0 1px 3px rgba(0,0,0,0.35))`;

      const styleParts = [
        `position:absolute`,
        `left:0`,
        `top:0`,
        `width:${wrapW}px`,
        `height:${size}px`,
        `filter:${filter}`,
        `pointer-events:auto`,
        `cursor:pointer`,
        `z-index:3`,
        `user-select:none`,
      ];
      if (!useLottie && palette) {
        styleParts.push(`--c-mid:${palette.mid}`, `--c-dark:${palette.dark}`, `--c-shadow:${palette.shadow}`);
      }
      wrap.style.cssText = styleParts.join(';');

      wrap.title = '戳一下试试';
      wrap.addEventListener('click', (e) => handleAnimalPoke(e, wrap, body, inner, puddle, size, motion));

      body.appendChild(inner);
      wrap.appendChild(body);
      puddle.appendChild(wrap);

      // —— Lottie：append 进 DOM 后再 load（容器在文档内更稳）；失败回退 SVG ——
      if (useLottie) {
        try {
          const anim = window.lottie.loadAnimation({
            container: inner,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: LOTTIE_BASE + lottiePick.file + '.json',
          });
          anim.addEventListener('data_failed', () => { inner.innerHTML = SVG_WATER_CREATURES[svgFallbackType]; });
          lottieInstances.push(anim);
        } catch (e) {
          inner.innerHTML = SVG_WATER_CREATURES[svgFallbackType];
        }
      }

      // —— 启动二维随机游走 ——
      startRoam(wrap, body, puddle, size, motion);
    }
  }

  // 随机选积水矩形内一点，transition 平滑游过去，到达后停顿再选下一点（自我递归）。
  // swim 全范围二维随机 / float 小范围慢漂 / crawl 贴底左右为主。朝向随水平方向翻转。
  function roamStep(wrap, body, puddle, size, motion) {
    if (!wrap.isConnected || !puddle.isConnected) return;
    const pw = puddle.clientWidth, ph = puddle.clientHeight;
    const maxX = Math.max(0, pw - size), maxY = Math.max(0, ph - size);
    const cur = wrap._pos || { x: 0, y: 0 };

    let tx, ty;
    if (motion === 'crawl') {
      tx = Math.random() * maxX;
      ty = maxY - Math.random() * Math.min(18, maxY);
    } else if (motion === 'float') {
      tx = clampNum(cur.x + (Math.random() - 0.5) * pw * 0.3, 0, maxX);
      ty = clampNum(cur.y + (Math.random() - 0.5) * ph * 0.5, 0, maxY);
    } else {
      tx = Math.random() * maxX;
      ty = Math.random() * maxY;
    }

    const dx = tx - cur.x, dy = ty - cur.y;
    const dist = Math.hypot(dx, dy);
    const speed = motion === 'crawl' ? 26 : motion === 'float' ? 18 : 42;   // px/s
    const dur = Math.max(1.8, dist / speed);

    wrap.style.transition = `transform ${dur.toFixed(1)}s ease-in-out`;
    wrap.style.transform = `translate(${Math.round(tx)}px, ${Math.round(ty)}px)`;
    wrap._pos = { x: tx, y: ty };
    if (Math.abs(dx) > 5) body.style.transform = `scaleX(${dx < 0 ? -1 : 1})`;

    const pause = 150 + Math.random() * 1100;
    wrap._roamTimer = setTimeout(() => roamStep(wrap, body, puddle, size, motion), dur * 1000 + pause);
    roamTimers.push(wrap._roamTimer);
  }

  function startRoam(wrap, body, puddle, size, motion) {
    const pw = puddle.clientWidth, ph = puddle.clientHeight;
    const x0 = Math.random() * Math.max(0, pw - size);
    const y0 = (motion === 'crawl')
      ? Math.max(0, ph - size) - Math.random() * 16
      : Math.random() * Math.max(0, ph - size);
    wrap._pos = { x: x0, y: y0 };
    wrap.style.transition = 'none';
    wrap.style.transform = `translate(${Math.round(x0)}px, ${Math.round(y0)}px)`;
    // 错峰启动，避免所有动物同时变向
    wrap._roamTimer = setTimeout(() => roamStep(wrap, body, puddle, size, motion), 200 + Math.random() * 1500);
    roamTimers.push(wrap._roamTimer);
  }

  // 戳一下：~45% 原地跳(hop)，~55% 受惊朝远离点击方向窜逃(dash)。
  function handleAnimalPoke(e, wrap, body, inner, puddle, size, motion) {
    if (Math.random() < 0.45) {
      if (!inner.classList.contains('hopping')) {
        inner.classList.add('hopping');
        setTimeout(() => inner.classList.remove('hopping'), 700);
      }
      return;
    }
    // 躲开：清掉当前游走计划，朝远离点击点方向快速窜一段，再恢复游走
    if (wrap._roamTimer) clearTimeout(wrap._roamTimer);
    const pw = puddle.clientWidth, ph = puddle.clientHeight;
    const maxX = Math.max(0, pw - size), maxY = Math.max(0, ph - size);
    const rect = puddle.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const cur = wrap._pos || { x: 0, y: 0 };
    const fleeDir = (cur.x + size / 2) < clickX ? -1 : 1;
    const nx = clampNum(cur.x + fleeDir * (90 + Math.random() * 130), 0, maxX);
    const ny = clampNum(cur.y - 30 + Math.random() * 60, 0, maxY);
    wrap.style.transition = 'transform 0.45s cubic-bezier(.2,.9,.25,1)';
    wrap.style.transform = `translate(${Math.round(nx)}px, ${Math.round(ny)}px)`;
    wrap._pos = { x: nx, y: ny };
    body.style.transform = `scaleX(${fleeDir < 0 ? -1 : 1})`;
    inner.classList.add('darting');
    setTimeout(() => inner.classList.remove('darting'), 450);
    wrap._roamTimer = setTimeout(() => roamStep(wrap, body, puddle, size, motion), 550 + Math.random() * 400);
    roamTimers.push(wrap._roamTimer);
  }

  // 晴天彩蛋：没有积水/积雪那样的蓄积过程，改在页面底部铺一条透明地面带，
  // 延迟一小段时间后放出猫狗等陆地动物散步。DOM 与清理均复用水生动物那一套（class 同为 .water-animal）。
  function createSunnyGround(container, intensity) {
    const ground = document.createElement('div');
    ground.className = 'sunny-ground';
    ground.style.cssText = 'position:absolute;left:0;right:0;bottom:0;height:16vh;pointer-events:none;';
    container.appendChild(ground);
    waterAnimalsSpawned = false;
    if (sunnyAnimalTimer) clearTimeout(sunnyAnimalTimer);
    sunnyAnimalTimer = setTimeout(() => {
      sunnyAnimalTimer = null;
      const g = document.querySelector('.sunny-ground');
      if (!g || waterAnimalsSpawned) return;
      waterAnimalsSpawned = true;
      spawnWaterAnimals(g, intensity || { drops: 60 }, LOTTIE_LAND_ANIMALS);
      console.info('[weather] 晴天彩蛋：陆地小动物出没 🐱🐶');
    }, SUNNY_ANIMAL_DELAY_MS);
  }

  function stopWaterAnimals() {
    if (puddleGrowTimer) { clearInterval(puddleGrowTimer); puddleGrowTimer = null; }
    roamTimers.forEach(t => clearTimeout(t));
    roamTimers = [];
    lottieInstances.forEach(a => { try { a.destroy(); } catch (e) {} });
    lottieInstances = [];
    document.querySelectorAll('.water-animal').forEach(el => el.remove());
    document.querySelectorAll('.sunny-ground').forEach(el => el.remove());
    waterAnimalsSpawned = false;
    if (animalFallbackTimer) { clearTimeout(animalFallbackTimer); animalFallbackTimer = null; }
    if (sunnyAnimalTimer) { clearTimeout(sunnyAnimalTimer); sunnyAnimalTimer = null; }
  }

  // ========== 积雪效果 ==========
  let snowGrowTimer = null;
  let snowHeight = 0;
  // 卡片顶边积雪：每张卡贴一条 .card-snow-cap，按时间逐渐增高

  function ensureCardOverlay(card, cls) {
    let existing = card.querySelector(':scope > .' + cls);
    if (existing) return existing;
    // 确保卡片是 positioned 容器（用 data 标记记录原状态，stop 时还原避免污染 inline style）
    const cs = getComputedStyle(card);
    if (cs.position === 'static' && !card.dataset.cetPosPatched) {
      card.dataset.cetPosPatched = '1';
      card.style.position = 'relative';
    }
    const el = document.createElement('div');
    el.className = cls;
    card.appendChild(el);
    return el;
  }

  // 还原 ensureCardOverlay 打过补丁的卡片 inline style.position
  function unpatchCardPositions() {
    document.querySelectorAll('[data-cet-pos-patched="1"]').forEach(card => {
      card.style.position = '';
      delete card.dataset.cetPosPatched;
    });
  }

  function startCardSnowCaps(intensity) {
    stopCardSnowCaps();
    const flakes = intensity.flakes || 0;
    // 雪量越大，长得越快
    const tickRate = flakes >= 60 ? 1800 : flakes >= 40 ? 2600 : 3800;
    const maxCap = Math.min(4 + flakes * 0.18, 14);   // 卡顶积雪最高 px
    cardSnowTimer = setInterval(() => {
      const cards = listAllCards();
      cards.forEach(({ el }) => {
        const cap = ensureCardOverlay(el, 'card-snow-cap');
        const cur = parseFloat(cap.dataset.h || '2');
        if (cur >= maxCap) return;
        const grew = cur + 0.4 + Math.random() * 0.6;
        cap.dataset.h = grew.toString();
        // 用 scaleY 走合成层（origin: top），比直接改 height 触发 layout 便宜很多
        cap.style.setProperty('--snow-h', Math.min(grew, maxCap).toFixed(2) + 'px');
      });
    }, tickRate);
    // 首次立刻 tick 一下，让用户马上看到雪盖；句柄要存，stop 时一起清
    cardSnowFirstTickTimer = setTimeout(() => {
      cardSnowFirstTickTimer = null;
      listAllCards().forEach(({ el }) => {
        const cap = ensureCardOverlay(el, 'card-snow-cap');
        cap.dataset.h = '2';
        cap.style.setProperty('--snow-h', '2px');
      });
    }, 200);

    // 小坑融入：每 ~3-5 秒在随机一张卡的雪盖上 spawn 一个 .card-snow-hole，
    // 模拟"雪片落地形成坑→融化消失"——洞自删，零内存泄漏
    const holeInterval = Math.max(1200, 4500 - flakes * 30);
    cardSnowHoleTimer = setInterval(() => {
      const cards = listAllCards();
      if (!cards.length) return;
      // 每 tick 在 1-2 张卡上 spawn 洞
      const targets = cards.sort(() => Math.random() - 0.5).slice(0, 1 + (Math.random() < 0.4 ? 1 : 0));
      targets.forEach(({ el }) => {
        const cap = el.querySelector(':scope > .card-snow-cap');
        if (!cap) return;
        const hole = document.createElement('div');
        hole.className = 'card-snow-hole';
        const x = 6 + Math.random() * 88;
        const size = 5 + Math.random() * 7;
        hole.style.cssText = `left:${x.toFixed(1)}%;width:${size.toFixed(1)}px;height:${(size*0.55).toFixed(1)}px;`;
        cap.appendChild(hole);
        setTimeout(() => hole.remove(), 1500);
      });
    }, holeInterval);
  }

  function stopCardSnowCaps() {
    if (cardSnowTimer) { clearInterval(cardSnowTimer); cardSnowTimer = null; }
    if (cardSnowFirstTickTimer) { clearTimeout(cardSnowFirstTickTimer); cardSnowFirstTickTimer = null; }
    if (cardSnowHoleTimer) { clearInterval(cardSnowHoleTimer); cardSnowHoleTimer = null; }
    document.querySelectorAll('.card-snow-cap').forEach(el => el.remove());
    document.querySelectorAll('.card-snow-hole').forEach(el => el.remove());
  }

  // ========== 卡片雾气晕染（雾天，每张卡片边缘羽化白雾） ==========
  function startCardFogEdges() {
    stopCardFogEdges();
    const apply = () => {
      listAllCards().forEach(({ el }) => ensureCardOverlay(el, 'card-fog-edge'));
    };
    apply();
    cardFogObserver = setInterval(apply, 1500);
  }

  function stopCardFogEdges() {
    if (cardFogObserver) { clearInterval(cardFogObserver); cardFogObserver = null; }
    document.querySelectorAll('.card-fog-edge').forEach(el => el.remove());
  }

  // ========== 卡片阳光（晴天/清晨/黄昏，每张卡片顶部暖光斑） ==========
  function startCardSunGlows(variant) {
    stopCardSunGlows();
    const apply = () => {
      listAllCards().forEach(({ el }) => {
        const glow = ensureCardOverlay(el, 'card-sun-glow');
        glow.dataset.variant = variant;
      });
    };
    apply();
    cardSunObserver = setInterval(apply, 1500);
  }
  function stopCardSunGlows() {
    if (cardSunObserver) { clearInterval(cardSunObserver); cardSunObserver = null; }
    document.querySelectorAll('.card-sun-glow').forEach(el => el.remove());
  }

  // ========== 卡片云阴（多云天，每张卡片顶部冷色淡灰薄云遮影） ==========
  // 与 card-sun-glow 互斥：晴天暖色、多云冷灰。复用 ensureCardOverlay + 定时巡检（同 fog/sun）
  let cardCloudObserver = null;
  function startCardCloudShades() {
    stopCardCloudShades();
    const apply = () => {
      listAllCards().forEach(({ el }) => ensureCardOverlay(el, 'card-cloud-shade'));
    };
    apply();
    cardCloudObserver = setInterval(apply, 1500);
  }
  function stopCardCloudShades() {
    if (cardCloudObserver) { clearInterval(cardCloudObserver); cardCloudObserver = null; }
    document.querySelectorAll('.card-cloud-shade').forEach(el => el.remove());
  }

  function createSnowAccumulation(container, intensity) {
    // 底部积雪层
    const snowPile = document.createElement('div');
    snowPile.className = 'snow-accumulation';
    snowHeight = 4;
    snowPile.style.height = snowHeight + 'px';
    container.appendChild(snowPile);
    snowmenSpawned = false;

    // 积雪逐渐增长
    if (snowGrowTimer) clearInterval(snowGrowTimer);
    const maxHeight = Math.min(10 + intensity.flakes * 0.3, 30);
    const threshold = maxHeight * 0.7;   // 触达 70% 上限召唤雪人彩蛋
    const growRate = Math.max(3000, 10000 - intensity.flakes * 80);
    snowGrowTimer = setInterval(() => {
      const pile = document.querySelector('.snow-accumulation');
      if (!pile) {
        clearInterval(snowGrowTimer);
        snowGrowTimer = null;
        return;
      }
      if (snowHeight < maxHeight) {
        snowHeight += 0.5 + Math.random() * 0.5;
        pile.style.height = Math.min(snowHeight, maxHeight) + 'px';
      }
      if (!snowmenSpawned && snowHeight >= threshold) {
        snowmenSpawned = true;
        spawnSnowmen(pile, intensity);
        console.info(`[weather] 积雪达 70% (${threshold.toFixed(1)}px)，召唤雪人 ⛄`);
      }
    }, growRate);

    // 兜底：下满 90 秒不管积雪多高都召唤雪人，与雨天彩蛋保持一致
    if (snowmenFallbackTimer) clearTimeout(snowmenFallbackTimer);
    snowmenFallbackTimer = setTimeout(() => {
      snowmenFallbackTimer = null;
      const pile = document.querySelector('.snow-accumulation');
      if (pile && !snowmenSpawned) {
        snowmenSpawned = true;
        spawnSnowmen(pile, intensity);
        console.info('[weather] 下满 90s 兜底触发，召唤雪人 ⛄');
      }
    }, ANIMAL_FALLBACK_MS);
  }

  // ========== 雪彩蛋：积雪到 70% 上限召唤的雪人 ==========
  // 雪人变体：⛄/☃ 两种 emoji × scale/scaleX/hue/saturate/brightness/rotate/translateY-jitter 7 维 → 100+ 不重样
  // 可点击有反馈：摇晃 + 头部光环（笑容）；4s 内同一雪人防 spam
  let snowmenSpawned = false;
  const SNOWMAN_EMOJIS = ['⛄','☃️'];
  function spawnSnowmen(pile, intensity) {
    const count = 2 + Math.floor(Math.random() * 2);   // 2-3 个
    const vw = window.innerWidth;
    for (let i = 0; i < count; i++) {
      const wrap = document.createElement('div');
      wrap.className = 'snowman';
      const body = document.createElement('div');
      body.className = 'snowman-body';
      body.textContent = SNOWMAN_EMOJIS[Math.floor(Math.random() * SNOWMAN_EMOJIS.length)];
      wrap.title = '戳一下雪人';

      const size = 34 + Math.floor(Math.random() * 30);          // 34-64px
      const hue = Math.floor(Math.random() * 360);
      const sat = (0.75 + Math.random() * 0.55).toFixed(2);
      const bright = (0.92 + Math.random() * 0.18).toFixed(2);
      const flipX = Math.random() < 0.5 ? -1 : 1;
      const rot = (Math.random() * 14 - 7).toFixed(1);            // 微倾 -7° ~ +7°
      // 横向位置：避开屏幕两边 6%，2-3 个不挤到一起（按 i 分段）
      const xRatio = 0.1 + (i + Math.random() * 0.6) / count * 0.8;
      const xPx = Math.round(vw * xRatio);

      wrap.style.cssText = [
        `position:absolute`,
        `bottom:0px`,
        `left:${xPx}px`,
        `font-size:${size}px`,
        `line-height:1`,
        `transform:translateX(-50%)`,
        `filter:hue-rotate(${hue}deg) saturate(${sat}) brightness(${bright}) drop-shadow(0 2px 4px rgba(0,0,0,0.35))`,
        `--snowman-flip:${flipX}`,
        `--snowman-rot:${rot}deg`,
        `pointer-events:auto`,
        `cursor:pointer`,
        `z-index:4`,
        `user-select:none`,
        `animation:snowmanSway ${(3 + Math.random() * 2).toFixed(1)}s ease-in-out infinite`,
        `animation-delay:${(-Math.random() * 2).toFixed(1)}s`,
      ].join(';');

      wrap.addEventListener('click', () => {
        if (body.classList.contains('shaking')) return;
        body.classList.add('shaking');
        setTimeout(() => body.classList.remove('shaking'), 4000);
      });
      wrap.appendChild(body);
      pile.appendChild(wrap);
    }
  }

  function stopSnowmen() {
    document.querySelectorAll('.snowman').forEach(el => el.remove());
    snowmenSpawned = false;
    if (snowmenFallbackTimer) { clearTimeout(snowmenFallbackTimer); snowmenFallbackTimer = null; }
  }

  // ========== 清理按钮（排水/铲雪） ==========
  function createCleanupButton(type) {
    // 移除已有的清理按钮
    document.querySelectorAll('.weather-cleanup-btn').forEach(el => el.remove());

    const btn = document.createElement('button');
    btn.className = 'weather-cleanup-btn';
    if (type === 'rain') {
      btn.innerHTML = '🚰 排水';
      btn.title = '排掉积水';
    } else {
      btn.innerHTML = '🧹 铲雪';
      btn.title = '清除积雪';
    }
    btn.onclick = () => {
      if (type === 'rain') {
        drainWater();
      } else {
        shovelSnow();
      }
    };
    document.body.appendChild(btn);
  }

  function drainWater() {
    const puddle = document.querySelector('.rain-puddle');
    if (!puddle) return;
    const btn = document.querySelector('.weather-cleanup-btn');
    // 停止涟漪 + 积水增长 timer
    if (rippleTimer) { clearInterval(rippleTimer); rippleTimer = null; }
    if (puddleGrowTimer) { clearInterval(puddleGrowTimer); puddleGrowTimer = null; }

    // 没拿到按钮坐标就走旧逻辑（兜底）
    if (!btn) {
      puddle.classList.add('draining');
      setTimeout(() => { if (puddle.parentElement) puddle.remove(); C.toast('积水已排干 💧', 'success'); }, 1200);
      return;
    }

    // 计算按钮中心点（viewport 坐标系）
    const r = btn.getBoundingClientRect();
    const targetX = r.left + r.width / 2;
    const targetY = r.top + r.height / 2;

    // 把所有"水相关"元素吸向按钮（雨贴屏水珠、涟漪、动物）
    const all = [
      ...document.querySelectorAll('.rain-cling'),
      ...document.querySelectorAll('.rain-splash'),
      ...document.querySelectorAll('.water-animal'),
      ...document.querySelectorAll('.rain-ripple'),
    ];
    all.forEach((el, idx) => {
      const er = el.getBoundingClientRect();
      const cx = er.left + er.width / 2;
      const cy = er.top + er.height / 2;
      const dx = targetX - cx;
      const dy = targetY - cy;
      // 错峰延迟：越早的元素先动，营造"卷入漩涡"层次感
      const delay = Math.min(280, idx * 22);
      setTimeout(() => {
        el.style.setProperty('--vortex-dx', dx.toFixed(0) + 'px');
        el.style.setProperty('--vortex-dy', dy.toFixed(0) + 'px');
        // 小动物多游一下：靠路径上轻微弧线（CSS 里 hop 配合 vortex）
        el.classList.add('vortex-drain');
      }, delay);
    });

    // 积水本体延后 320ms 缩瘪（让漩涡先卷一会儿）
    setTimeout(() => { puddle.classList.add('draining'); }, 320);
    setTimeout(() => {
      if (puddle.parentElement) puddle.remove();
      document.querySelectorAll('.vortex-drain').forEach(el => el.remove());
      waterAnimalsSpawned = false;
      C.toast('积水已排干，小动物也游走啦 💧', 'success');
    }, 1500);
  }

  function shovelSnow() {
    const pile = document.querySelector('.snow-accumulation');
    if (!pile) return;
    // 停止积雪增长 + 卡顶雪盖增长
    if (snowGrowTimer) { clearInterval(snowGrowTimer); snowGrowTimer = null; }
    snowHeight = 0;

    // 创建铲雪小人：从左屏外走到右屏外，期间用 clip-path 同步从左到右"擦掉" snow
    const shoveler = document.createElement('div');
    shoveler.className = 'snow-shoveler';
    // 三层 emoji 拼出"小人 + 铲"形象：用 👷 (建筑工)，挥铲用 CSS keyframe
    shoveler.textContent = '👷';
    shoveler.style.cssText = 'position:absolute;bottom:0;left:0;font-size:48px;line-height:1;z-index:5;pointer-events:none;animation:shovelerWalk 3.5s linear forwards;';
    pile.parentElement.appendChild(shoveler);

    // pile 用 clip-path 同步收缩：左 0% → 100%（小人走过部分消失）
    pile.classList.add('shoveling');

    // 雪人在被走到时依次淡出（按它们的 left 位置错峰）
    document.querySelectorAll('.snowman').forEach(sm => {
      const left = parseFloat(sm.style.left);
      const vw = window.innerWidth;
      const ratio = Math.max(0, Math.min(1, left / vw));
      // 雪人位置占整个走程的 ratio，小人走到那里的时刻 ≈ 3.5s * ratio
      const fadeDelay = Math.max(0, 3.5 * ratio * 1000 - 100);
      setTimeout(() => sm.classList.add('snowman-fade'), fadeDelay);
    });

    setTimeout(() => {
      if (pile.parentElement) pile.remove();
      document.querySelectorAll('.snow-shoveler').forEach(el => el.remove());
      document.querySelectorAll('.snowman').forEach(el => el.remove());
      snowmenSpawned = false;
      C.toast('积雪已清除，小人下班咯 ❄️', 'success');
    }, 3600);
  }

  // 取粒子挂载点：之前挂 #bg-layer（z-index:-1），创建了独立层叠上下文，
  // 导致所有 stat-card / quick-card 把全屏粒子层挡得死死的——用户只能看到卡片之外的小角落。
  // 现在改挂 document.body 末尾，配合 effectEl 的 position:fixed + z-index:2，
  // 让粒子像米家/Apple 天气那样浮在卡片之上（pointer-events:none 不挡交互）。
  function getMountContainer(_context) {
    return document.body;
  }

  // 仅设置叠加层颜色（不创建粒子），供禁用动效时使用
  function _applyOverlayColor(code) {
    const h = new Date().getHours();
    const isNight = h < 5 || h >= 21;
    const isDusk = h >= 17 && h < 21;
    const isMorning = h >= 5 && h < 8;
    const type = getWeatherType(code);
    const overlay = C.$('bg-overlay');
    if (!overlay) return;
    if (isNight) overlay.style.background = 'linear-gradient(180deg, rgba(5,5,20,0.88) 0%, rgba(10,10,30,0.82) 100%)';
    else if (isDusk) overlay.style.background = 'linear-gradient(180deg, rgba(60,30,10,0.55) 0%, rgba(20,15,40,0.68) 100%)';
    else if (isMorning) overlay.style.background = 'linear-gradient(180deg, rgba(40,30,15,0.45) 0%, rgba(8,12,24,0.60) 100%)';
    else if (type === 'sunny') overlay.style.background = 'rgba(8, 12, 24, 0.55)';
    else if (type === 'rainy' || type === 'stormy') overlay.style.background = 'rgba(8, 12, 24, 0.78)';
    else if (type === 'snowy') overlay.style.background = 'rgba(8, 15, 30, 0.72)';
    else overlay.style.background = 'rgba(8, 12, 24, 0.72)';
  }

  function applyWeatherEffect(code) {
    // 问候语跟着真实天气重选：renderDashboard 首帧跑在 fetchWeather 之前，
    // 那时 weatherCache 还是 null，标语会退化到 cloudy 档；这里拿到真实 code 后回刷一次，
    // 否则出现"雨天图标 + 多云标语"的错配。(2026-08-10)
    if (C.renderGreeting) C.renderGreeting(code);

    document.querySelectorAll('.weather-effect').forEach(el => el.remove());
    document.querySelectorAll('.weather-cleanup-btn').forEach(el => el.remove());
    if (rippleTimer) { clearInterval(rippleTimer); rippleTimer = null; }
    if (snowGrowTimer) { clearInterval(snowGrowTimer); snowGrowTimer = null; }
    stopCardImpacts();   // 切场景前先清掉卡片溅射 timer
    stopWindowClings();  // 清掉米家风格贴屏水珠 timer + DOM
    stopCardSnowCaps();  // 清掉每卡顶边积雪
    stopCardFogEdges();  // 清掉每卡雾气晕染
    stopCardSunGlows();  // 清掉每卡阳光斑
    stopCardCloudShades(); // 清掉每卡云阴
    stopWaterAnimals();  // 清掉雨彩蛋小动物 + 停积水增长 timer
    stopSnowmen();       // 清掉雪彩蛋雪人 + reset snowmenSpawned
    unpatchCardPositions();   // 还原 inline style.position 避免污染层叠上下文

    // 检查是否禁用了天气动效
    const effectOff = localStorage.getItem('cet_weather_effect_limit') === 'disabled';
    if (effectOff) {
      console.info('[weather] 粒子动效已被禁用 (localStorage: cet_weather_effect_limit=disabled)。要恢复请到设置 → 天气动效 → 开启。');
      _applyOverlayColor(code);
      return;
    }

    const h = new Date().getHours();
    const isNight = h < 5 || h >= 21;
    const isDusk = h >= 17 && h < 21;
    const isMorning = h >= 5 && h < 8;
    const type = getWeatherType(code);
    const overlay = C.$('bg-overlay');
    const intensity = getWeatherIntensity(code);

    // 叠加层颜色
    if (isNight) {
      if (overlay) overlay.style.background = 'linear-gradient(180deg, rgba(5,5,20,0.88) 0%, rgba(10,10,30,0.82) 100%)';
    } else if (isDusk) {
      if (overlay) overlay.style.background = 'linear-gradient(180deg, rgba(60,30,10,0.55) 0%, rgba(20,15,40,0.68) 100%)';
    } else if (isMorning) {
      if (overlay) overlay.style.background = 'linear-gradient(180deg, rgba(40,30,15,0.45) 0%, rgba(8,12,24,0.60) 100%)';
    } else if (type === 'sunny') {
      if (overlay) overlay.style.background = 'rgba(8, 12, 24, 0.55)';
    } else if (type === 'rainy' || type === 'stormy') {
      if (overlay) overlay.style.background = 'rgba(8, 12, 24, 0.78)';
    } else if (type === 'snowy') {
      if (overlay) overlay.style.background = 'rgba(8, 15, 30, 0.72)';
    } else {
      if (overlay) overlay.style.background = 'rgba(8, 12, 24, 0.72)';
    }

    // 全屏粒子效果（挂到 body 末尾，position:fixed 浮在卡片之上）
    const mount = getMountContainer('applyWeatherEffect');

    const effectEl = document.createElement('div');
    effectEl.className = 'weather-effect';
    effectEl.style.cssText = 'position:fixed;inset:0;z-index:2;pointer-events:none;overflow:hidden;';

    if (intensity && intensity.type === 'rain') {
      console.info(`[weather] 启动雨效果: grade=${intensity.grade} drops=${intensity.drops} splashes=${intensity.splashes||0} clings=${intensity.clings||0} tilt=${intensity.tilt||0}° code=${code}`);
      // ===== 雨滴效果（根据强度调整） =====
      const rc = document.createElement('div');
      // 整层倾斜：雨更逼真（米家天气那种斜雨感）。translateX 补偿避免左右露白边
      const tilt = intensity.tilt || 0;
      rc.style.cssText = `position:absolute;inset:-5% -10%;transform:rotate(${tilt}deg);transform-origin:center center;`;
      const dropWidth = intensity.dropWidth || 1.8;
      for (let i = 0; i < intensity.drops; i++) {
        const drop = document.createElement('div');
        const dh = intensity.heightMin + Math.random() * intensity.heightRange;
        const speed = intensity.speedMin + Math.random() * intensity.speedRange;
        const delay = Math.random() * 3;
        const x = Math.random() * 100;
        const opacity = intensity.opacityMin + Math.random() * intensity.opacityRange;
        // dropWidth 随档位变化：毛毛雨 1.2px → 暴雨 2.4px → 雷暴 2.6px；亮度靠下端更亮（模拟运动模糊尾迹）
        drop.style.cssText = `position:absolute;width:${dropWidth}px;height:${dh}px;background:linear-gradient(transparent 0%,rgba(174,194,224,${opacity*0.4}) 30%,rgba(220,230,245,${opacity}) 100%);border-radius:0 0 2px 2px;left:${x}%;top:-3%;animation:rainfall ${speed}s linear infinite;animation-delay:${delay}s;will-change:transform;`;
        rc.appendChild(drop);
      }
      // 雷暴闪电效果
      if (intensity.lightning) {
        const flash = document.createElement('div');
        flash.style.cssText = 'position:absolute;inset:0;background:rgba(255,255,255,0);animation:lightning 8s ease-in-out infinite;animation-delay:3s;';
        rc.appendChild(flash);
      }
      effectEl.appendChild(rc);

      // ===== 屏幕水珠反馈（雨打到玻璃的视觉反馈，像米家天气那种）=====
      createRainSplashes(effectEl, intensity.splashes || 0);

      // ===== 米家风格滞留水珠（贴屏 → 静止 → 滑落 + 拖痕，自循环）=====
      startWindowClings(effectEl, intensity);

      // ===== 积水 + 涟漪效果 =====
      createRainPuddle(effectEl, intensity);
      mount.appendChild(effectEl);

      // ===== 卡片溅射反馈（雨滴打在卡片顶边的水花动画）=====
      startCardImpacts(intensity);

      // 排水按钮
      createCleanupButton('rain');

    } else if (intensity && intensity.type === 'snow') {
      console.info(`[weather] 启动雪效果: flakes=${intensity.flakes} code=${code}`);
      // ===== 雪花效果：Unicode ❄ 字符 + 10 种变体（不再是小白圆点）=====
      // 字符池 10 种：❄ ❅ ❆ ✻ ✼ ✽ ❉ ❊ ❋ ✺  + 旋转/尺寸/opacity/速度组合 → 1000+ 不重样
      const SNOW_CHARS = ['❄','❅','❆','✻','✼','✽','❉','❊','❋','✺'];
      const sc = document.createElement('div');
      sc.style.cssText = 'position:absolute;inset:0;';
      for (let i = 0; i < intensity.flakes; i++) {
        const flake = document.createElement('div');
        flake.className = 'snowflake';
        flake.textContent = SNOW_CHARS[Math.floor(Math.random() * SNOW_CHARS.length)];
        const size = (intensity.sizeMin + Math.random() * intensity.sizeRange) * 2.2;   // 字符比圆点视觉小，放大补偿
        const speed = intensity.speedMin + Math.random() * intensity.speedRange;
        const delay = Math.random() * 8;
        const x = Math.random() * 100;
        const drift = -20 + Math.random() * 40;
        const opacity = intensity.opacityMin + Math.random() * intensity.opacityRange;
        const blur = Math.random() > 0.6 ? 1 : 0;
        const rot = Math.floor(Math.random() * 360);
        const spinDur = (10 + Math.random() * 14).toFixed(1);
        flake.style.cssText = [
          `position:absolute`,
          `font-size:${size.toFixed(1)}px`,
          `line-height:1`,
          `color:rgba(255,255,255,${opacity.toFixed(2)})`,
          `text-shadow:0 0 4px rgba(220,230,245,${(opacity*0.5).toFixed(2)})`,
          `left:${x.toFixed(1)}%`,
          `top:-3%`,
          `animation:snowfall ${speed}s linear infinite, snowflakeSpin ${spinDur}s linear infinite`,
          `animation-delay:${delay}s,${(-Math.random()*spinDur).toFixed(1)}s`,
          `filter:blur(${blur}px)`,
          `--drift:${drift}px`,
          `--init-rot:${rot}deg`,
          `pointer-events:none`,
          `user-select:none`,
        ].join(';');
        sc.appendChild(flake);
      }
      effectEl.appendChild(sc);

      // ===== 积雪效果（全屏底部 + 每卡片顶边）=====
      createSnowAccumulation(effectEl, intensity);
      mount.appendChild(effectEl);
      startCardSnowCaps(intensity);

      // 铲雪按钮
      createCleanupButton('snow');

    } else if (isDusk || (isMorning && type === 'sunny')) {
      // ===== 黄昏光晕 / 清晨光照（根据天气晴朗度调整光照强度） =====
      const clearness = (code === 0) ? 1.0 : (code <= 3) ? 0.6 : 0.3;
      const glow = document.createElement('div');
      if (isDusk) {
        const glowOpacity = (0.12 * clearness).toFixed(3);
        const glowOpacity2 = (0.06 * clearness).toFixed(3);
        const sunOpacity = (0.15 * clearness).toFixed(3);
        const sunOpacity2 = (0.06 * clearness).toFixed(3);
        glow.style.cssText = `position:absolute;bottom:0;left:0;right:0;height:60%;background:linear-gradient(0deg,rgba(255,140,50,${glowOpacity}) 0%,rgba(255,100,50,${glowOpacity2}) 30%,transparent 100%);animation:duskPulse 6s ease-in-out infinite;`;
        const sun = document.createElement('div');
        sun.style.cssText = `position:absolute;bottom:10%;left:50%;transform:translateX(-50%);width:300px;height:300px;background:radial-gradient(circle,rgba(255,180,80,${sunOpacity}) 0%,rgba(255,120,50,${sunOpacity2}) 40%,transparent 70%);border-radius:50%;animation:sunPulse 5s ease-in-out infinite;`;
        glow.appendChild(sun);
      } else {
        // 清晨光照
        const mornOpacity = (0.12 * clearness).toFixed(3);
        const mornOpacity2 = (0.05 * clearness).toFixed(3);
        const rayOpacity = (0.2 * clearness).toFixed(3);
        const rayOpacity2 = (0.05 * clearness).toFixed(3);
        glow.style.cssText = `position:absolute;top:0;right:0;width:60%;height:70%;background:radial-gradient(ellipse at top right,rgba(255,220,150,${mornOpacity}) 0%,rgba(255,180,100,${mornOpacity2}) 40%,transparent 70%);animation:morningGlow 8s ease-in-out infinite;`;
        const rays = document.createElement('div');
        rays.style.cssText = `position:absolute;top:-20px;right:-20px;width:250px;height:250px;background:radial-gradient(circle,rgba(255,240,200,${rayOpacity}) 0%,rgba(255,200,100,${rayOpacity2}) 50%,transparent 70%);border-radius:50%;animation:sunPulse 4s ease-in-out infinite;`;
        glow.appendChild(rays);
      }
      effectEl.appendChild(glow);
      mount.appendChild(effectEl);
      startCardSunGlows(isDusk ? 'dusk' : 'morning');

    } else if (type === 'foggy') {
      console.info(`[weather] 启动雾效果: code=${code}`);
      // ===== 雾天：横向飘动的低对比度雾带（6 条错峰）=====
      const fogLayer = document.createElement('div');
      fogLayer.style.cssText = 'position:absolute;inset:0;';
      for (let i = 0; i < 6; i++) {
        const band = document.createElement('div');
        band.className = 'fog-band';
        band.style.top = (i * 16 + Math.random() * 6) + '%';
        band.style.animationDelay = (-i * 4) + 's';
        band.style.animationDuration = (22 + Math.random() * 10) + 's';
        fogLayer.appendChild(band);
      }
      effectEl.appendChild(fogLayer);
      mount.appendChild(effectEl);
      startCardFogEdges();

    } else if (type === 'cloudy') {
      // ===== 阴/多云：几条缓慢横移的浅云带（比雾稀疏、颜色更白、不遮挡内容）=====
      // 修这个分支之前：cloudy 不命中任何 if，effectEl 没 append，结果是 0 粒子，
      // 用户感觉"天气加载不出来"——实际是 fetchWeather 拿到 code=3 后没视觉反馈
      console.info(`[weather] 启动多云效果: code=${code}`);
      const cloudLayer = document.createElement('div');
      cloudLayer.style.cssText = 'position:absolute;inset:0;';
      // 复用 fog-band 的飘动动画，4 条云带，错峰 + 颜色偏白 + opacity 略提（云比雾"实"一点）
      for (let i = 0; i < 4; i++) {
        const band = document.createElement('div');
        band.className = 'fog-band';
        band.style.top = (8 + i * 22 + Math.random() * 6) + '%';
        band.style.height = (70 + Math.random() * 30) + 'px';   // 云团比雾带稍厚
        band.style.background = 'linear-gradient(90deg, transparent 0%, rgba(235,240,250,0.14) 30%, rgba(235,240,250,0.22) 50%, rgba(235,240,250,0.14) 70%, transparent 100%)';
        band.style.filter = 'blur(14px)';                        // 比雾更糊，更像云
        band.style.animationDuration = (38 + Math.random() * 14) + 's';   // 飘得比雾慢
        band.style.animationDelay = (-i * 8) + 's';
        cloudLayer.appendChild(band);
      }
      effectEl.appendChild(cloudLayer);
      mount.appendChild(effectEl);
      startCardCloudShades();

    } else if (isNight) {
      // ===== 夜间星闪效果（晴朗夜空更多星星） =====
      const starCount = (code === 0) ? 30 : (code <= 3) ? 15 : 8;
      const starField = document.createElement('div');
      starField.style.cssText = 'position:absolute;inset:0;';
      for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        const size = 1 + Math.random() * 2;
        const x = Math.random() * 100;
        const y = Math.random() * 60;
        const delay = Math.random() * 5;
        const dur = 2 + Math.random() * 3;
        star.style.cssText = `position:absolute;width:${size}px;height:${size}px;background:rgba(255,255,255,0.7);border-radius:50%;left:${x}%;top:${y}%;animation:starTwinkle ${dur}s ease-in-out infinite;animation-delay:${delay}s;`;
        starField.appendChild(star);
      }
      effectEl.appendChild(starField);
      mount.appendChild(effectEl);

    } else if (type === 'sunny') {
      console.info(`[weather] 启动晴天效果: hour=${h} code=${code}`);
      // ===== 晴天光斑 + 镜头光晕（正午更强烈） =====
      const noonFactor = (h >= 10 && h <= 14) ? 1.2 : 0.8;
      const sunOpacity = (0.12 * noonFactor).toFixed(3);
      const sunOpacity2 = (0.04 * noonFactor).toFixed(3);
      const sunSize = Math.round(300 * noonFactor);
      const sunGlow = document.createElement('div');
      sunGlow.style.cssText = `position:absolute;top:-60px;right:-60px;width:${sunSize}px;height:${sunSize}px;background:radial-gradient(circle,rgba(255,220,100,${sunOpacity}) 0%,rgba(255,180,50,${sunOpacity2}) 50%,transparent 70%);border-radius:50%;animation:sunPulse 5s ease-in-out infinite;`;
      effectEl.appendChild(sunGlow);
      // 4 颗镜头光晕，错峰呼吸（点缀点）
      for (let i = 0; i < 4; i++) {
        const flare = document.createElement('div');
        flare.className = 'sun-flare';
        flare.style.left = (55 + Math.random() * 35) + '%';
        flare.style.top = (4 + Math.random() * 28) + '%';
        flare.style.animationDelay = (i * 1.3) + 's';
        effectEl.appendChild(flare);
      }
      mount.appendChild(effectEl);
      startCardSunGlows('noon');
    }

    // 晴天彩蛋统一挂载：清晨/黄昏的晴天走的是上面 isDusk 那条分支、晴朗夜晚走 isNight 分支，
    // 只挂在 type==='sunny' 分支里会漏掉这几个时段，因此放到 if-else 链之外统一判断。
    if (type === 'sunny' && effectEl && effectEl.isConnected) {
      createSunnyGround(effectEl, intensity);
    }
  }

  // 无天气数据时，根据时段应用效果（由 app.js 调用）
  function applyTimeEffect() {
    document.querySelectorAll('.weather-effect').forEach(el => el.remove());
    const h = new Date().getHours();
    const overlay = C.$('bg-overlay');
    const mount = getMountContainer('applyTimeEffect');

    const effectEl = document.createElement('div');
    effectEl.className = 'weather-effect';
    effectEl.style.cssText = 'position:fixed;inset:0;z-index:2;pointer-events:none;overflow:hidden;';

    if (h >= 21 || h < 5) {
      // 夜间
      if (overlay) overlay.style.background = 'linear-gradient(180deg, rgba(5,5,20,0.88) 0%, rgba(10,10,30,0.82) 100%)';
      const starField = document.createElement('div');
      starField.style.cssText = 'position:absolute;inset:0;';
      for (let i = 0; i < 20; i++) {
        const star = document.createElement('div');
        const size = 1 + Math.random() * 2;
        star.style.cssText = `position:absolute;width:${size}px;height:${size}px;background:rgba(255,255,255,0.7);border-radius:50%;left:${Math.random()*100}%;top:${Math.random()*60}%;animation:starTwinkle ${2+Math.random()*3}s ease-in-out infinite;animation-delay:${Math.random()*5}s;`;
        starField.appendChild(star);
      }
      effectEl.appendChild(starField);
    } else if (h >= 17 && h < 21) {
      // 黄昏
      if (overlay) overlay.style.background = 'linear-gradient(180deg, rgba(60,30,10,0.55) 0%, rgba(20,15,40,0.68) 100%)';
      const glow = document.createElement('div');
      glow.style.cssText = 'position:absolute;bottom:0;left:0;right:0;height:60%;background:linear-gradient(0deg,rgba(255,140,50,0.12) 0%,rgba(255,100,50,0.06) 30%,transparent 100%);animation:duskPulse 6s ease-in-out infinite;';
      const sun = document.createElement('div');
      sun.style.cssText = 'position:absolute;bottom:10%;left:50%;transform:translateX(-50%);width:300px;height:300px;background:radial-gradient(circle,rgba(255,180,80,0.15) 0%,rgba(255,120,50,0.06) 40%,transparent 70%);border-radius:50%;animation:sunPulse 5s ease-in-out infinite;';
      glow.appendChild(sun);
      effectEl.appendChild(glow);
    } else if (h >= 5 && h < 8) {
      // 清晨
      if (overlay) overlay.style.background = 'linear-gradient(180deg, rgba(40,30,15,0.45) 0%, rgba(8,12,24,0.60) 100%)';
      const glow = document.createElement('div');
      glow.style.cssText = 'position:absolute;top:0;right:0;width:60%;height:70%;background:radial-gradient(ellipse at top right,rgba(255,220,150,0.12) 0%,rgba(255,180,100,0.05) 40%,transparent 70%);animation:morningGlow 8s ease-in-out infinite;';
      const rays = document.createElement('div');
      rays.style.cssText = 'position:absolute;top:-20px;right:-20px;width:250px;height:250px;background:radial-gradient(circle,rgba(255,240,200,0.2) 0%,rgba(255,200,100,0.05) 50%,transparent 70%);border-radius:50%;animation:sunPulse 4s ease-in-out infinite;';
      glow.appendChild(rays);
      effectEl.appendChild(glow);
    } else {
      // 白天默认
      if (overlay) overlay.style.background = 'rgba(8, 12, 24, 0.58)';
      return;
    }
    mount.appendChild(effectEl);
  }

  // ========== 诊断入口：在 console 输入 weatherDebug() 看现在卡在哪 ==========
  // 用于排查"我开启了动效为什么没粒子"——一次性把所有相关状态打出来
  function weatherDebug() {
    const out = {
      '设置-天气授权 (cet_location_permission)': localStorage.getItem('cet_location_permission') || '(空)',
      '设置-动效开关 (cet_weather_effect_limit)': localStorage.getItem('cet_weather_effect_limit') || '(未禁用，应显示)',
      '上次坐标缓存 (cet_last_coords)': localStorage.getItem('cet_last_coords') || '(无)',
      '天气数据缓存': C.weatherCache ? `code=${C.weatherCache.weather_code} temp=${C.weatherCache.temperature_2m}` : '(无)',
      '当前页面 .weather-effect 元素数': document.querySelectorAll('.weather-effect').length,
      '当前 DOM 雨滴数': document.querySelectorAll('.weather-effect div[style*="rainfall"]').length,
      '当前 DOM 卡片溅射': document.querySelectorAll('.rain-impact').length,
      '当前 DOM 雪盖': document.querySelectorAll('.card-snow-cap').length,
      '挂载容器 #bg-layer 存在': !!C.$('bg-layer'),
      '浏览器支持 geolocation': !!navigator.geolocation,
    };
    console.table(out);
    console.info('—— 排查指南 ——');
    console.info('1. 如果 "动效开关" 显示 disabled，去 设置→天气动效 点"开启"');
    console.info('2. 如果 "天气数据缓存" 是 (无)，说明定位/网络拉天气失败：');
    console.info('   - 浏览器地址栏左侧锁/感叹号图标 → 网站设置 → 位置 → 允许');
    console.info('   - 或者就走 IP 兜底（在国内可能精度只到市/区）');
    console.info('3. 想立即看粒子可用 testWeather("rain") / testWeather("snow") 强制触发');
    console.info('4. 如果上面都 OK 但 "雨滴数" 是 0，说明粒子被生成后立刻被清掉了——多半是切页 race');
    return out;
  }

  // ========== 调试入口：手动触发任意天气效果 ==========
  // 浏览器 console 中调用：testWeather('rain')、'snow'、'storm'、'fog'、'clear'、'night'
  // 用于不下雨/不下雪时也能验证粒子效果是否正常
  function testWeather(scene) {
    const codeMap = {
      clear: 0, sunny: 0, cloudy: 2, fog: 45, foggy: 45,
      drizzle: 53, lightrain: 53,
      rain: 63, heavyrain: 66,
      snow: 73, heavysnow: 75, lightsnow: 71,
      storm: 95, thunder: 95,
      night: 0
    };
    if (scene === 'night') {
      // 仅调试用：临时改 Date.prototype.getHours 模拟夜间。
      // 由 try/finally 保证异常时也能恢复，正常路径不要走这里。
      const orig = Date.prototype.getHours;
      Date.prototype.getHours = () => 23;
      try { applyWeatherEffect(0); } finally { Date.prototype.getHours = orig; }
      console.info('[weather] 测试夜间星空 (模拟 23:00)');
      return;
    }
    const code = codeMap[scene];
    if (code === undefined) {
      console.warn('[weather] 未知场景。可选: clear, cloudy, fog, rain, heavyrain, snow, heavysnow, storm, night');
      return;
    }
    applyWeatherEffect(code);
    console.info(`[weather] 已触发场景 "${scene}" (code=${code})`);
  }

  // 调试入口：把当前积水瞬间填满到 targetH 并触发动物彩蛋。
  // 浏览器 console: debugFillPuddle()。仅用于回归验证，不会出现在 UI 里。
  window.debugFillPuddle = function() {
    const puddle = document.querySelector('.rain-puddle');
    if (!puddle) { console.warn('[weather] 当前没有积水，请先 testWeather("rain")'); return; }
    const target = parseInt(puddle.dataset.targetH || '0', 10);
    if (!target) return;
    if (puddleGrowTimer) { clearInterval(puddleGrowTimer); puddleGrowTimer = null; }
    puddle.style.height = target + 'px';
    if (!waterAnimalsSpawned) {
      waterAnimalsSpawned = true;
      const code = (C.weatherCache && C.weatherCache.weather_code) ?? 63;
      const intensity = getWeatherIntensity(code) || { drops: 80 };
      spawnWaterAnimals(puddle, intensity);
      console.info('[weather] debugFillPuddle: 积水已填满 + 小动物已召唤');
    }
  };

  // 调试入口：把积雪一键涨到上限 + 触发雪人彩蛋。
  window.debugFillSnow = function() {
    const pile = document.querySelector('.snow-accumulation');
    if (!pile) { console.warn('[weather] 当前没有积雪，请先 testWeather("snow")'); return; }
    const code = (C.weatherCache && C.weatherCache.weather_code) ?? 73;
    const intensity = getWeatherIntensity(code) || { flakes: 50 };
    const maxHeight = Math.min(10 + intensity.flakes * 0.3, 30);
    if (snowGrowTimer) { clearInterval(snowGrowTimer); snowGrowTimer = null; }
    snowHeight = maxHeight;
    pile.style.height = maxHeight + 'px';
    if (!snowmenSpawned) {
      snowmenSpawned = true;
      spawnSnowmen(pile, intensity);
      console.info('[weather] debugFillSnow: 积雪填满 + 雪人已召唤');
    }
  };

  // 调试入口：跳过 12 秒等待，立刻放出晴天陆地动物。
  window.debugSunnyAnimals = function() {
    const g = document.querySelector('.sunny-ground');
    if (!g) { console.warn('[weather] 当前没有地面带，请先 testWeather("sunny")'); return; }
    if (sunnyAnimalTimer) { clearTimeout(sunnyAnimalTimer); sunnyAnimalTimer = null; }
    if (waterAnimalsSpawned) { console.info('[weather] 陆地动物已在场'); return; }
    waterAnimalsSpawned = true;
    const code = (C.weatherCache && C.weatherCache.weather_code) ?? 0;
    spawnWaterAnimals(g, getWeatherIntensity(code) || { drops: 60 }, LOTTIE_LAND_ANIMALS);
    console.info('[weather] debugSunnyAnimals: 陆地小动物已召唤 🐱🐶');
  };

  // 强制按手动地址重跑整套天气流程：清缓存 + 用 manual 坐标走完整 fetchWeatherByCoords。
  // 由 weather_manual_loc.js 在用户选完 tip 时调用，让温度/特效/背景立即跟着手动地址变。
  C.refreshWeatherFromManual = function() {
    const m = getManualLocation();
    if (!m || !m.lat || !m.lon) return;
    const weatherEl = C.$('dash-weather');
    if (!weatherEl) return;
    C.weatherCache = null;
    C.weatherCacheTime = 0;
    C.weatherLocationLabel = '';
    C.weatherAmapAdcode = '';
    fetchWeatherByCoords(weatherEl, m.lat, m.lon, 'MANUAL').then(ok => {
      if (!ok) applyTimeEffect();
    });
  };

  // 强制走自动定位重跑：用户点"恢复自动定位"后清缓存 + 重新走 GPS/IP 链路。
  C.refreshWeatherAuto = function() {
    const weatherEl = C.$('dash-weather');
    if (!weatherEl) return;
    C.weatherCache = null;
    C.weatherCacheTime = 0;
    C.weatherLocationLabel = '';
    C.weatherAmapAdcode = '';
    doFetchWeather(weatherEl);
  };

  // 注册到共享对象
  C.fetchWeather = fetchWeather;
  C.getWeatherType = getWeatherType;
  C.applyWeatherEffect = applyWeatherEffect;
  C.applyTimeEffect = applyTimeEffect;
  C.renderWeather = renderWeather;
  C.getWeatherIcon = getWeatherIcon;
  C.getWeatherDesc = getWeatherDesc;
  // 暴露调试入口到 window，方便控制台直接测试
  window.testWeather = testWeather;
  window.weatherDebug = weatherDebug;
})();
