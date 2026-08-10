// ========== CET 词汇大师 — 单词详情模块 (word-detail.js) ==========
// showWordDetail, generateMnemonic (万词王风格：词根拆解+词族+柯林斯+词频+词组搭配)
(function() {
  'use strict';
  const C = window._C;

  // ========== 前缀/后缀库 ==========

  const PREFIXES = [
    { p: 'un', m: '不、非', cat: '否定' },
    { p: 're', m: '再、重新', cat: '重复' },
    { p: 'pre', m: '在…之前', cat: '时间' },
    { p: 'dis', m: '否定、相反', cat: '否定' },
    { p: 'mis', m: '错误地', cat: '否定' },
    { p: 'over', m: '过度、在上', cat: '程度' },
    { p: 'under', m: '不足、在下', cat: '程度' },
    { p: 'inter', m: '在…之间', cat: '位置' },
    { p: 'trans', m: '跨越', cat: '方向' },
    { p: 'super', m: '超级', cat: '程度' },
    { p: 'sub', m: '在下面', cat: '位置' },
    { p: 'com', m: '共同', cat: '关系' },
    { p: 'con', m: '共同', cat: '关系' },
    { p: 'col', m: '共同(l前)', cat: '关系' },
    { p: 'cor', m: '共同(r前)', cat: '关系' },
    { p: 'ex', m: '向外、前任', cat: '方向' },
    { p: 'in', m: '向内/否定', cat: '方向' },
    { p: 'im', m: '向内/否定', cat: '方向' },
    { p: 'il', m: '否定(l前)', cat: '否定' },
    { p: 'ir', m: '否定(r前)', cat: '否定' },
    { p: 'de', m: '向下、去除', cat: '方向' },
    { p: 'anti', m: '反对', cat: '否定' },
    { p: 'auto', m: '自身', cat: '关系' },
    { p: 'bi', m: '双、二', cat: '数量' },
    { p: 'counter', m: '相反', cat: '否定' },
    { p: 'en', m: '使…', cat: '使动' },
    { p: 'em', m: '使…', cat: '使动' },
    { p: 'fore', m: '在前、预先', cat: '时间' },
    { p: 'micro', m: '微小', cat: '程度' },
    { p: 'multi', m: '多', cat: '数量' },
    { p: 'non', m: '非、不', cat: '否定' },
    { p: 'out', m: '超过、向外', cat: '方向' },
    { p: 'post', m: '在…之后', cat: '时间' },
    { p: 'semi', m: '半', cat: '数量' },
    { p: 'tri', m: '三', cat: '数量' },
    { p: 'uni', m: '单一', cat: '数量' },
    { p: 'with', m: '向后、对抗', cat: '方向' }
  ];

  const SUFFIXES = [
    { s: 'tion', m: '动作/状态', pos: 'n.' },
    { s: 'sion', m: '动作/状态', pos: 'n.' },
    { s: 'ment', m: '行为/结果', pos: 'n.' },
    { s: 'ness', m: '性质', pos: 'n.' },
    { s: 'able', m: '可…的', pos: 'adj.' },
    { s: 'ible', m: '可…的', pos: 'adj.' },
    { s: 'ful', m: '充满…的', pos: 'adj.' },
    { s: 'less', m: '没有…的', pos: 'adj.' },
    { s: 'ous', m: '具有…的', pos: 'adj.' },
    { s: 'ious', m: '具有…的', pos: 'adj.' },
    { s: 'ive', m: '有…倾向的', pos: 'adj.' },
    { s: 'ly', m: '以…方式', pos: 'adv.' },
    { s: 'er', m: '做…的人/物', pos: 'n.' },
    { s: 'or', m: '做…的人/物', pos: 'n.' },
    { s: 'ist', m: '…的人', pos: 'n.' },
    { s: 'ize', m: '使…化', pos: 'v.' },
    { s: 'ise', m: '使…化', pos: 'v.' },
    { s: 'ify', m: '使…化', pos: 'v.' },
    { s: 'al', m: '与…有关的', pos: 'adj.' },
    { s: 'ial', m: '与…有关的', pos: 'adj.' },
    { s: 'ity', m: '性质', pos: 'n.' },
    { s: 'ance', m: '状态', pos: 'n.' },
    { s: 'ence', m: '状态', pos: 'n.' },
    { s: 'ant', m: '…的', pos: 'adj.' },
    { s: 'ent', m: '…的', pos: 'adj.' },
    { s: 'ure', m: '行为/结果', pos: 'n.' },
    { s: 'dom', m: '领域/状态', pos: 'n.' },
    { s: 'ship', m: '关系/身份', pos: 'n.' },
    { s: 'ward', m: '向…方向', pos: 'adv.' },
    { s: 'wards', m: '向…方向', pos: 'adv.' }
  ];

  // ========== 常见词组搭配数据 ==========
  const COLLOCATIONS = {
    // 高频动词搭配
    'make': ['make a decision', 'make progress', 'make sense', 'make an effort'],
    'take': ['take place', 'take advantage of', 'take into account', 'take part in'],
    'give': ['give rise to', 'give way to', 'give up', 'give in'],
    'have': ['have access to', 'have an effect on', 'have difficulty'],
    'pay': ['pay attention to', 'pay a visit', 'pay off'],
    'keep': ['keep pace with', 'keep track of', 'keep in mind'],
    'come': ['come across', 'come up with', 'come into being'],
    'put': ['put forward', 'put into practice', 'put up with'],
    'set': ['set up', 'set out', 'set about', 'set off'],
    'turn': ['turn out', 'turn to', 'turn down', 'turn up'],
    'break': ['break down', 'break through', 'break out', 'break up'],
    'bring': ['bring about', 'bring up', 'bring out', 'bring forward'],
    'carry': ['carry out', 'carry on', 'carry away'],
    'hold': ['hold on', 'hold up', 'hold back'],
    'look': ['look into', 'look forward to', 'look up to', 'look down on'],
    'run': ['run out of', 'run into', 'run over'],
    'stand': ['stand for', 'stand out', 'stand up for'],
    'work': ['work out', 'work on', 'work off'],
    'account': ['account for', 'on account of', 'take into account'],
    'effect': ['have an effect on', 'in effect', 'take effect', 'side effect'],
    'result': ['as a result', 'result in', 'result from'],
    'attention': ['pay attention to', 'draw attention to', 'attract attention'],
    'advantage': ['take advantage of', 'have an advantage over'],
    'place': ['take place', 'in place of', 'in the first place'],
    'point': ['to the point', 'point out', 'point of view'],
    'use': ['make use of', 'put to use', 'of no use'],
    'charge': ['in charge of', 'take charge of', 'free of charge'],
    'control': ['out of control', 'under control', 'in control of'],
    'demand': ['in demand', 'on demand', 'meet the demand'],
    'order': ['in order to', 'in order that', 'out of order'],
    'increase': ['on the increase', 'increase by', 'increase to'],
    'lack': ['lack of', 'for lack of'],
    'matter': ['no matter', 'as a matter of fact', 'a matter of'],
    'mind': ['keep in mind', 'make up one\'s mind', 'bear in mind'],
    'risk': ['at risk', 'take a risk', 'run the risk of'],
    'view': ['in view of', 'point of view', 'with a view to'],
    'basis': ['on the basis of', 'on a daily basis'],
    'conclusion': ['draw a conclusion', 'come to a conclusion', 'in conclusion'],
    'condition': ['on condition that', 'in good condition'],
    'contact': ['in contact with', 'make contact with', 'lose contact with'],
    'contrast': ['in contrast to', 'by contrast'],
    'contribute': ['contribute to', 'make a contribution to'],
    'deal': ['deal with', 'a great deal of'],
    'depend': ['depend on', 'depending on', 'it depends'],
    'doubt': ['no doubt', 'without doubt', 'beyond doubt'],
    'fact': ['in fact', 'as a matter of fact', 'the fact that'],
    'favor': ['in favor of', 'do sb a favor'],
    'focus': ['focus on', 'focus attention on'],
    'form': ['in the form of', 'form the basis of'],
    'general': ['in general', 'as a general rule'],
    'hand': ['on the other hand', 'on one hand', 'hand in'],
    'influence': ['have an influence on', 'under the influence of'],
    'instance': ['for instance', 'in the first instance'],
    'interest': ['in the interest of', 'take an interest in', 'of interest'],
    'need': ['in need of', 'there is no need to'],
    'opportunity': ['take the opportunity', 'have the opportunity to'],
    'particular': ['in particular', 'particularly important'],
    'practice': ['in practice', 'put into practice'],
    'process': ['in the process of', 'a process of'],
    'purpose': ['on purpose', 'for the purpose of'],
    'regard': ['with regard to', 'in this regard', 'regardless of'],
    'relation': ['in relation to', 'bear no relation to'],
    'respect': ['with respect to', 'in some respect'],
    'sense': ['make sense', 'in a sense', 'common sense'],
    'short': ['in short', 'short of', 'for short'],
    'spite': ['in spite of'],
    'step': ['take steps', 'step by step'],
    'success': ['make a success of', 'key to success'],
    'support': ['in support of', 'support for'],
    'term': ['in terms of', 'in the long term', 'come to terms with'],
    'time': ['from time to time', 'at the same time', 'in time'],
    'touch': ['keep in touch with', 'get in touch with', 'lose touch with'],
    'trouble': ['have trouble', 'get into trouble', 'take the trouble to'],
    'turn': ['in turn', 'take turns', 'turn out'],
    'way': ['by the way', 'in a way', 'in the way of', 'give way to']
  };

  // ========== 词根拆解可视化 ==========

  function buildWordBreakdown(w) {
    const word = w.word.toLowerCase();

    // ===== 优先使用预计算的 roots 数据 =====
    if (w.roots && w.roots.breakdown) {
      let segments = [];
      const r = w.roots;

      // 根据预计算数据构建分段
      let remaining = word;

      if (r.prefix && r.prefix_meaning) {
        segments.push({ text: r.prefix, type: 'prefix', label: r.prefix_meaning, cat: '' });
        remaining = remaining.slice(r.prefix.length);
      }

      if (r.root && r.root_meaning) {
        const rootIdx = remaining.indexOf(r.root);
        if (rootIdx >= 0) {
          if (rootIdx > 0) {
            segments.push({ text: remaining.slice(0, rootIdx), type: 'link', label: '连接', cat: '' });
          }
          segments.push({ text: r.root, type: 'root', label: r.root_meaning, cat: '' });
          remaining = remaining.slice(rootIdx + r.root.length);
        }
      }

      if (r.suffix && r.suffix_meaning) {
        if (remaining.endsWith(r.suffix)) {
          const beforeSuffix = remaining.slice(0, remaining.length - r.suffix.length);
          if (beforeSuffix && !r.root) {
            segments.push({ text: beforeSuffix, type: 'stem', label: '词干', cat: '' });
          } else if (beforeSuffix) {
            segments.push({ text: beforeSuffix, type: 'link', label: '连接', cat: '' });
          }
          segments.push({ text: r.suffix, type: 'suffix', label: r.suffix_meaning, cat: '' });
        }
      } else if (remaining && segments.length > 0) {
        segments.push({ text: remaining, type: 'stem', label: '词干', cat: '' });
      }

      if (segments.length >= 2) {
        let html = '<div class="word-detail-section">' +
          '<div class="word-detail-section-title">🔬 构词拆解</div>' +
          '<div class="word-breakdown">';

        html += '<div class="word-breakdown-blocks">';
        segments.forEach(seg => {
          html += '<div class="word-breakdown-block ' + seg.type + '">' +
            '<span class="word-breakdown-text">' + C.esc(seg.text) + '</span>' +
            '<span class="word-breakdown-label">' + C.esc(seg.label) + '</span>' +
          '</div>';
          html += '<span class="word-breakdown-plus">+</span>';
        });
        html = html.replace(/<span class="word-breakdown-plus">\+<\/span>$/, '');
        html += '</div>';

        // 拆解公式
        html += '<div class="word-breakdown-formula">';
        const formulaParts = segments.filter(s => s.type !== 'link').map(s => {
          return '<span class="formula-part ' + s.type + '">' + C.esc(s.label) + '</span>';
        });
        html += formulaParts.join(' <span class="formula-arrow">→</span> ') +
          ' <span class="formula-arrow">=</span> <span class="formula-result">' + C.esc(w.meaning.split(/[;；,，]/)[0]) + '</span>';
        html += '</div>';

        html += '</div></div>';
        return html;
      }
    }

    // ===== 回退：前端推算 =====
    let prefix = null, root = null, suffix = null;

    // 找前缀
    for (const pf of PREFIXES) {
      if (word.startsWith(pf.p) && word.length > pf.p.length + 2) {
        prefix = pf;
        break;
      }
    }

    // 找词根
    if (C.findRoots) {
      const roots = C.findRoots(word);
      if (roots && roots.length > 0) root = roots[0];
    }

    // 找后缀
    for (const sf of SUFFIXES) {
      if (word.endsWith(sf.s) && word.length > sf.s.length + 2) {
        suffix = sf;
        break;
      }
    }

    if (!prefix && !root && !suffix) return '';

    // 构建可视化拆分条
    let html = '<div class="word-detail-section">' +
      '<div class="word-detail-section-title">🔬 构词拆解</div>' +
      '<div class="word-breakdown">';

    // 高亮拆解
    let remaining = word;
    let segments = [];

    if (prefix) {
      segments.push({ text: prefix.p, type: 'prefix', label: prefix.m, cat: prefix.cat });
      remaining = remaining.slice(prefix.p.length);
    }

    if (root) {
      const rootIdx = remaining.indexOf(root.root);
      if (rootIdx >= 0) {
        if (rootIdx > 0) {
          segments.push({ text: remaining.slice(0, rootIdx), type: 'link', label: '连接', cat: '' });
        }
        segments.push({ text: root.root, type: 'root', label: root.meaning, cat: '' });
        remaining = remaining.slice(rootIdx + root.root.length);
      }
    }

    if (suffix && remaining.endsWith(suffix.s)) {
      const beforeSuffix = remaining.slice(0, remaining.length - suffix.s.length);
      if (beforeSuffix && !root) {
        segments.push({ text: beforeSuffix, type: 'stem', label: '词干', cat: '' });
      } else if (beforeSuffix) {
        segments.push({ text: beforeSuffix, type: 'link', label: '连接', cat: '' });
      }
      segments.push({ text: suffix.s, type: 'suffix', label: suffix.m, pos: suffix.pos, cat: '' });
    } else if (remaining) {
      if (segments.length > 0) {
        segments.push({ text: remaining, type: 'stem', label: '词干', cat: '' });
      }
    }

    // 如果拆分没意义（只有一段且没有标注），就不显示
    if (segments.length <= 1 && !root) return '';

    // 渲染拆分块
    html += '<div class="word-breakdown-blocks">';
    segments.forEach(seg => {
      html += '<div class="word-breakdown-block ' + seg.type + '">' +
        '<span class="word-breakdown-text">' + C.esc(seg.text) + '</span>' +
        '<span class="word-breakdown-label">' + C.esc(seg.label) + (seg.pos ? ' ' + seg.pos : '') + '</span>' +
      '</div>';
      html += '<span class="word-breakdown-plus">+</span>';
    });
    // 去掉最后一个 +
    html = html.replace(/<span class="word-breakdown-plus">\+<\/span>$/, '');
    html += '</div>';

    // 拆解公式
    html += '<div class="word-breakdown-formula">';
    const formulaParts = segments.filter(s => s.type !== 'link').map(s => {
      return '<span class="formula-part ' + s.type + '">' + C.esc(s.label) + '</span>';
    });
    html += formulaParts.join(' <span class="formula-arrow">→</span> ') +
      ' <span class="formula-arrow">=</span> <span class="formula-result">' + C.esc(w.meaning.split(/[;；,，]/)[0]) + '</span>';
    html += '</div>';

    html += '</div></div>';
    return html;
  }

  // ========== 升级版助记生成 ==========
  // 返回最多 3 条不同角度的助记（数组），过滤掉只是 "释义联想：xxx = yyy" 的占位符

  // 判断 memory 字段是否只是 "释义联想：word = meaning" 这种冗余占位符
  function isFallbackMemory(m, word) {
    if (!m) return true;
    return /^释义联想[:：]/.test(m);
  }

  function generateMnemonic(w) {
    const tips = generateMnemonicList(w);
    return tips.join('\n\n');
  }

  function pushMnemonicTip(tips, tip) {
    if (!tip) return;
    const normalized = tip.replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, '').trim();
    if (!normalized) return;
    if (tips.some(t => t.includes(normalized.slice(0, 16)) || normalized.includes(t.replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, '').trim().slice(0, 16)))) return;
    tips.push(tip);
  }

  function getReadableChunks(word) {
    const clean = String(word || '').toLowerCase().replace(/[^a-z]/g, '');
    if (!clean) return [];
    const chunks = clean.match(/[bcdfghjklmnpqrstvwxyz]*[aeiouy]+(?:[bcdfghjklmnpqrstvwxyz](?=[aeiouy])|[bcdfghjklmnpqrstvwxyz]*)?/g) || [clean];
    const merged = [];
    chunks.forEach(chunk => {
      if (!chunk) return;
      if (chunk.length === 1 && merged.length) merged[merged.length - 1] += chunk;
      else merged.push(chunk);
    });
    return merged.length ? merged : [clean];
  }

  function buildSpellingTip(w, firstMeaning) {
    const chunks = getReadableChunks(w.word);
    const chunkText = chunks.length > 1 ? chunks.join(' / ') : String(w.word).toLowerCase();
    // 只保留音节拆分，不再显示字母拼读（A-B-A-N-D-O-N）
    return '🔤 音节拆分：' + chunkText + '，按音节记忆"' + firstMeaning + '"更容易。';
  }

  function buildExtrasTip(w, firstMeaning) {
    const extras = (typeof WORD_EXTRAS !== 'undefined') ? WORD_EXTRAS[String(w.word).toLowerCase()] : null;
    if (!extras) return '';
    if (extras.phrase && extras.phrase.length > 0) {
      const p = extras.phrase[0];
      return '📎 搭配记忆：' + p.p + (p.cn ? ' = ' + p.cn : '') + '；先记固定搭配，再反推 ' + w.word + ' 的核心义"' + firstMeaning + '"。';
    }
    if (extras.relWord && extras.relWord.length > 0) {
      const rel = [];
      extras.relWord.forEach(group => {
        (group.words || []).forEach(item => {
          if (item.w && rel.length < 3) rel.push(item.w);
        });
      });
      if (rel.length > 0) return '🌿 词族记忆：' + w.word + ' ↔ ' + rel.join(' / ') + '，同一词族一起背，比单个硬啃稳。';
    }
    if (extras.syno && extras.syno.length > 0 && extras.syno[0].words && extras.syno[0].words.length > 0) {
      return '🔁 同近词联想：' + w.word + ' 可联想到 ' + extras.syno[0].words.slice(0, 3).join(' / ') + '，围绕"' + firstMeaning + '"一起记。';
    }
    return '';
  }

  function buildPosTip(word, firstMeaning) {
    for (const sf of SUFFIXES) {
      if (word.endsWith(sf.s) && word.length > sf.s.length + 2) {
        return '📌 词性提示：-' + sf.s + ' 常见为 ' + sf.pos + ' 后缀，看到词尾先预判词性，再落到"' + firstMeaning + '"。';
      }
    }
    return '';
  }

  function getPrimaryDef(w) {
    const defs = C.getDefs ? C.getDefs(w) : (w.defs || []);
    if (defs && defs.length > 0) {
      const d = defs[0];
      const m = (d.meanings && d.meanings[0]) || '';
      if (m) return (d.pos ? d.pos + ' ' : '') + m;
    }
    return (w.meaning || '').split(/[;；,，]/)[0].trim() || '该词';
  }

  function getPrimaryPos(w) {
    const defs = C.getDefs ? C.getDefs(w) : (w.defs || []);
    if (defs && defs.length > 0 && defs[0].pos) return defs[0].pos;
    const m = String(w.meaning || '').match(/^([a-z]+\.?)/i);
    return m ? m[1] : '';
  }

  function getFormHook(w, word, firstMeaning) {
    if (w.roots && w.roots.breakdown) {
      return '优先看构词：' + w.roots.breakdown + '，最后落到"' + firstMeaning + '"。';
    }

    const parts = [];
    for (const pf of PREFIXES) {
      if (word.startsWith(pf.p) && word.length > pf.p.length + 2) {
        parts.push(pf.p + '-（' + pf.m + '）');
        break;
      }
    }
    for (const sf of SUFFIXES) {
      if (word.endsWith(sf.s) && word.length > sf.s.length + 2) {
        parts.push('-' + sf.s + '（' + sf.pos + '，' + sf.m + '）');
        break;
      }
    }
    if (parts.length > 0) return '词形线索：' + parts.join(' + ') + '，先定词形再记义。';
    if (word.length <= 4) return '短词抓形：' + word.toUpperCase().split('').join('-') + '，少写一笔都容易串词，直接整词绑定释义。';
    return '拼写骨架：' + word.slice(0, 2) + '...' + word.slice(-2) + '，先记首尾，再补中间字母。';
  }

  function getUsageHook(w, word, firstMeaning) {
    const extras = (typeof WORD_EXTRAS !== 'undefined') ? WORD_EXTRAS[word] : null;
    if (extras && extras.phrase && extras.phrase.length > 0) {
      const p = extras.phrase[0];
      return '优先放进短语：' + p.p + (p.cn ? '（' + p.cn + '）' : '') + '，用固定搭配带动记忆。';
    }
    if (w.example) {
      return '优先跟例句走：读例句，遮住 ' + w.word + ' 后复述，再回填这个词。';
    }

    const pos = getPrimaryPos(w);
    if (/^v/i.test(pos)) return '输出模板：try to ' + w.word + ' something，把动词放进动作里背。';
    if (/^n/i.test(pos)) return '输出模板：a/the ' + w.word + ' in context，把名词放进具体场景里背。';
    if (/^adj/i.test(pos)) return '输出模板：a ' + w.word + ' problem/person，把形容词贴到名词前背。';
    if (/^adv/i.test(pos)) return '输出模板：do it ' + w.word + '，把副词放在动作后面背。';
    return '输出模板：用 ' + w.word + ' 写一个 8-12 词短句，写不出就回看释义。';
  }

  function generateStudyHooks(w) {
    const word = String(w.word || '').toLowerCase();
    const firstMeaning = getPrimaryDef(w);

    return [
      { label: '核心义', text: '先抓第一义项"' + firstMeaning + '"，其他义项围绕它扩展。' },
      { label: '词形', text: getFormHook(w, word, firstMeaning) },
      { label: '用法', text: getUsageHook(w, word, firstMeaning) }
    ];
  }

  function buildStudyHooksHTML(w) {
    const hooks = generateStudyHooks(w);
    return '<div class="word-detail-section">' +
      '<div class="word-detail-section-title">🧷 学习抓手（全词覆盖）</div>' +
      '<div class="word-study-hooks">' +
        hooks.map(h => '<div class="word-study-hook">' +
          '<span class="hook-label">' + C.esc(h.label) + '</span>' +
          '<span class="hook-text">' + C.esc(h.text) + '</span>' +
        '</div>').join('') +
      '</div>' +
    '</div>';
  }

  function generateMnemonicList(w) {
    const word = w.word.toLowerCase();
    const firstMeaning = getPrimaryDef(w);
    const tips = [];

    // ====== 第〇优先：人工精修助记（Phase B 数据） ======
    if (typeof WORD_MNEMONICS !== 'undefined' && WORD_MNEMONICS[word]) {
      return WORD_MNEMONICS[word].slice(0, 3);
    }

    // ====== 第一条：词根拆解 / 预制 memory（如果不是占位符）======
    if (w.roots && w.roots.breakdown) {
      pushMnemonicTip(tips, '🔬 构词拆解：' + w.roots.breakdown);
    } else if (w.memory && !isFallbackMemory(w.memory, word)) {
      // 用现成的非占位 memory
      pushMnemonicTip(tips, '💡 ' + w.memory);
    }

    // ====== 第二条：前后缀/词根特征（前端推算）======
    if (tips.length < 3) {
      const parts = [];
      let usedPrefix = null;
      for (const pf of PREFIXES) {
        if (word.startsWith(pf.p) && word.length > pf.p.length + 2) {
          parts.push('前缀 ' + pf.p + '-（' + pf.m + '）');
          usedPrefix = pf;
          break;
        }
      }
      if (C.findRoots) {
        const roots = C.findRoots(word);
        if (roots.length > 0) {
          parts.push('词根 ' + roots[0].root + '（' + roots[0].meaning + '）');
        }
      }
      for (const sf of SUFFIXES) {
        if (word.endsWith(sf.s) && word.length > sf.s.length + 2) {
          parts.push('后缀 -' + sf.s + '（' + sf.m + '）');
          break;
        }
      }
      if (parts.length >= 2) {
        const synth = '🧩 结构记忆：' + parts.join(' + ') + ' → ' + firstMeaning;
        if (!tips.some(t => t.includes(parts[0]))) pushMnemonicTip(tips, synth);
      } else if (parts.length === 1 && tips.length === 0) {
        // 至少有一个构词部分但不足以拆解，给出弱提示
        pushMnemonicTip(tips, '🧩 ' + parts[0] + '，结合释义"' + firstMeaning + '"记忆。');
      }
    }

    // ====== 第三条：音节拆分提示（避免无词根词只能死背）======
    if (tips.length < 3) {
      pushMnemonicTip(tips, buildSpellingTip(w, firstMeaning));
    }

    // ====== 第四条：词组/词族/同近词数据（kajweb extras）======
    if (tips.length < 3) {
      pushMnemonicTip(tips, buildExtrasTip(w, firstMeaning));
    }

    // ====== 第五条：词性/语义提示（从词尾推断词性，配合释义）======
    if (tips.length < 3) {
      pushMnemonicTip(tips, buildPosTip(word, firstMeaning));
    }

    // 再补一条"例句记忆"建议（如果还少于 3 条且有例句）
    if (tips.length < 3 && w.example) {
      pushMnemonicTip(tips, '📖 例句记忆：「' + w.example + '」反复读 3 遍，体会"' + firstMeaning + '"在语境中的用法。');
    }

    // 最终兜底：保证至少有 3 条可用提示
    if (tips.length < 3) {
      if (word.length <= 4) {
        pushMnemonicTip(tips, '🎯 短词直记：反复朗读 "' + w.word + '"，把它和"' + firstMeaning + '"绑定到一个具体场景。');
      } else {
        pushMnemonicTip(tips, '🎯 场景联想：给 "' + w.word + '" 造一个只包含"' + firstMeaning + '"核心义的短画面，先记画面再记拼写。');
      }
    }
    if (tips.length < 3) {
      pushMnemonicTip(tips, '✍️ 输出记忆：合上释义，用 ' + w.word + ' 写一个 8-12 词短句，写不出就回看例句。');
    }

    // 限定 3 条
    return tips.slice(0, 3);
  }

  function getBestMnemonic(w) {
    const tips = generateMnemonicList(w);
    if (!tips.length) return '';

    const priorities = [
      { re: /谐音|🎵/, score: 100 },
      { re: /搭配|📎/, score: 96 },
      { re: /构词拆解|词根拆解|🔬/, score: 92 },
      { re: /结构记忆|🧩/, score: 88 },
      { re: /词族|🌿/, score: 82 },
      { re: /例句|📖/, score: 76 },
      { re: /拼读|🔤/, score: 68 },
      { re: /场景|🎯/, score: 62 },
      { re: /输出|✍️/, score: 58 },
      { re: /词性|📌/, score: 52 }
    ];

    let best = tips[0];
    let bestScore = -1;
    tips.forEach((tip, index) => {
      const matched = priorities.find(p => p.re.test(tip));
      const score = (matched ? matched.score : 45) - index;
      if (score > bestScore) {
        best = tip;
        bestScore = score;
      }
    });
    return best;
  }

  // ========== 获取词组搭配 ==========

  function getCollocations(w) {
    const word = w.word.toLowerCase();
    const result = [];

    // 直接匹配
    if (COLLOCATIONS[word]) {
      result.push(...COLLOCATIONS[word]);
    }

    // 搜索所有词组中包含此单词的
    for (const [key, phrases] of Object.entries(COLLOCATIONS)) {
      if (key === word) continue;
      for (const phrase of phrases) {
        if (phrase.toLowerCase().includes(word) && !result.includes(phrase)) {
          result.push(phrase);
        }
      }
    }

    return result.slice(0, 6);
  }

  // ========== 真题例句展示 ==========

  function buildRealExamSentencesHTML(w) {
    const realExam = w.realExamSentence;
    if (!realExam || !realExam.sentences || realExam.sentences.length === 0) return '';

    let html = '<div class="word-detail-section">' +
      '<div class="word-detail-section-title">📝 真题例句（共 ' + realExam.sentences.length + ' 条）</div>' +
      '<div class="word-real-exam-sentences">';

    realExam.sentences.slice(0, 5).forEach(s => {
      const src = s.sourceInfo || {};
      const word = w.word.toLowerCase();
      const re = new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\w*\\b', 'gi');
      const highlighted = C.esc(s.sContent).replace(re, m => '<mark>' + m + '</mark>');

      html += '<div class="real-exam-sentence">' +
        '<div class="exam-source-tags">' +
          (src.year ? '<span class="exam-tag exam-year">' + C.esc(src.year) + '</span>' : '') +
          (src.type ? '<span class="exam-tag exam-type">' + C.esc(src.type) + '</span>' : '') +
          (src.paper ? '<span class="exam-tag exam-paper">' + C.esc(src.paper) + '</span>' : '') +
        '</div>' +
        '<div class="exam-sentence-content">' + highlighted + '</div>' +
      '</div>';
    });

    if (realExam.sentences.length > 5) {
      html += '<div class="exam-more-hint">还有 ' + (realExam.sentences.length - 5) + ' 条真题例句未显示</div>';
    }

    html += '</div></div>';
    return html;
  }

  // ========== 考频星级展示 ==========

  function renderStarRating(star) {
    if (!star || star === 0) return '';
    const stars = '⭐'.repeat(Math.min(star, 5));
    const label = star >= 4 ? '高频' : star >= 2 ? '中频' : '低频';
    const colorClass = star >= 4 ? 'freq-high' : star >= 2 ? 'freq-mid' : 'freq-low';
    return '<span class="word-star-rating ' + colorClass + '">' +
      stars + ' <span class="freq-label-inline">' + label + '</span>' +
    '</span>';
  }

  // ========== 获取派生词 ==========

  // 工具：从 WORD_EXTRAS 拿 kajweb 提供的同根词（最权威），转为统一格式
  function getKajwebDerivatives(word) {
    const extras = (typeof WORD_EXTRAS !== 'undefined') ? WORD_EXTRAS[word.toLowerCase()] : null;
    if (!extras || !extras.relWord) return [];
    const result = [];
    extras.relWord.forEach(group => {
      (group.words || []).forEach(rw => {
        if (!rw.w || rw.w.toLowerCase() === word.toLowerCase()) return;
        if (result.find(r => r.word.toLowerCase() === rw.w.toLowerCase())) return;
        result.push({
          word: rw.w,
          pos: group.pos || '',
          meaning: rw.tran || '',
          fromKaj: true
        });
      });
    });
    return result;
  }

  function getDerivatives(w) {
    const word = w.word.toLowerCase();

    // ===== 最优先：kajweb 同根词数据（每词独立标注） =====
    const kaj = getKajwebDerivatives(w.word);
    if (kaj.length > 0) {
      // 同步用本地词库填补：如果 kaj 的词在本地有，挂上 phonetic/example 等
      const enriched = kaj.map(k => {
        const inDict = C.words.find(x => x.word.toLowerCase() === k.word.toLowerCase());
        return inDict
          ? Object.assign({}, inDict, { _relPos: k.pos, _relMeaning: k.meaning, fromKaj: true })
          : { word: k.word, meaning: k.meaning, _relPos: k.pos, _relMeaning: k.meaning, fromKaj: true };
      });
      return enriched.slice(0, 8);
    }

    // ===== 优先使用预计算的 derivatives 数据 =====
    if (w.derivatives && w.derivatives.length > 0) {
      const result = [];
      w.derivatives.forEach(dw => {
        const inDict = C.words.find(x => x.word.toLowerCase() === dw.toLowerCase());
        if (inDict && inDict.word.toLowerCase() !== word) {
          if (!result.find(d => d.word === inDict.word)) {
            result.push(inDict);
          }
        }
      });
      if (result.length > 0) return result.slice(0, 8);
    }

    // ===== 回退：前端推算 =====
    const derivatives = [];

    // 通过添加/替换后缀生成可能的派生词
    const derivRules = [
      // 动词 → 名词
      { from: '', to: 'tion' }, { from: '', to: 'sion' }, { from: '', to: 'ment' },
      { from: '', to: 'ness' }, { from: '', to: 'ance' }, { from: '', to: 'ence' },
      { from: 'e', to: 'ation' }, { from: 'e', to: 'ion' },
      // 动词/名词 → 形容词
      { from: '', to: 'ful' }, { from: '', to: 'less' }, { from: '', to: 'ous' },
      { from: '', to: 'ive' }, { from: '', to: 'able' }, { from: '', to: 'al' },
      // 形容词 → 副词
      { from: '', to: 'ly' },
      // 名词 → 动词
      { from: '', to: 'ize' }, { from: '', to: 'ify' },
      // 反义
      { from: '', to: '', prefix: 'un' }, { from: '', to: '', prefix: 'dis' },
      { from: '', to: '', prefix: 'in' }, { from: '', to: '', prefix: 'im' },
      // 名词/形容词
      { from: '', to: 'er' }, { from: '', to: 'or' }, { from: '', to: 'ist' },
      { from: '', to: 'ity' }, { from: '', to: 'dom' }, { from: '', to: 'ship' }
    ];

    derivRules.forEach(rule => {
      let candidate;
      if (rule.prefix) {
        candidate = rule.prefix + word;
      } else if (rule.from && word.endsWith(rule.from)) {
        candidate = word.slice(0, -rule.from.length) + rule.to;
      } else if (!rule.from) {
        candidate = word + rule.to;
      } else {
        return;
      }

      const inDict = C.words.find(x => x.word.toLowerCase() === candidate);
      if (inDict && inDict.word.toLowerCase() !== word) {
        if (!derivatives.find(d => d.word === inDict.word)) {
          derivatives.push(inDict);
        }
      }
    });

    // 也查词根同族词
    if (C.findRoots) {
      const roots = C.findRoots(word);
      if (roots.length > 0) {
        const familyObj = C.getWordFamily ? C.getWordFamily(roots[0].root) : null;
        const family = familyObj ? (familyObj.examples || []) : (roots[0].examples || []);
        family.forEach(s => {
          if (s.toLowerCase() === word) return;
          const inDict = C.words.find(x => x.word.toLowerCase() === s.toLowerCase());
          if (inDict && !derivatives.find(d => d.word === inDict.word)) {
            derivatives.push(inDict);
          }
        });
      }
    }

    return derivatives.slice(0, 8);
  }

  // ========== 词频可视化 ==========

  function buildFreqHTML(w) {
    const freq = w.freq || 'low';
    const freqLabel = freq === 'high' ? '高频核心词' : freq === 'mid' ? '中频重点词' : '低频拓展词';
    const freqLevel = freq === 'high' ? 5 : freq === 'mid' ? 3 : 1;
    const freqColor = freq === 'high' ? 'var(--coral)' : freq === 'mid' ? 'var(--amber)' : 'var(--text-muted)';
    const freqTip = freq === 'high' ? '考试必考词汇，务必掌握！'
      : freq === 'mid' ? '考试常见词汇，建议熟记。'
      : '出现频率较低，了解即可。';

    let bars = '';
    for (let i = 0; i < 5; i++) {
      const active = i < freqLevel;
      bars += '<div class="freq-bar' + (active ? ' active' : '') + '" style="' +
        (active ? 'background:' + freqColor : '') + '"></div>';
    }

    return '<div class="word-detail-section">' +
      '<div class="word-detail-section-title">📊 词频等级</div>' +
      '<div class="word-freq-visual">' +
        '<div class="word-freq-bars">' + bars + '</div>' +
        '<span class="word-freq-label" style="color:' + freqColor + '">' + freqLabel + '</span>' +
      '</div>' +
      '<div class="word-freq-tip">' + freqTip + '</div>' +
    '</div>';
  }

  // ========== 构建泛化信息HTML（修复点击 bug，使用 data 属性） ==========

  function buildWordRelationsHTML(w) {
    const word = w.word.toLowerCase();
    let html = '';

    // 工具：取某个单词的简短释义（带词性），形如 "v. 放弃" 或 "n. 信封"
    function shortDef(dictWord) {
      if (!dictWord) return '';
      // 优先用 kajweb 同根词带过来的释义（更精确）
      if (dictWord._relMeaning) {
        return (dictWord._relPos ? dictWord._relPos + '. ' : '') + dictWord._relMeaning;
      }
      const defs = C.getDefs ? C.getDefs(dictWord) : null;
      if (defs && defs.length > 0) {
        const d = defs[0];
        const m = (d.meanings && d.meanings[0]) || '';
        return (d.pos ? d.pos + ' ' : '') + m;
      }
      return dictWord.meaning ? dictWord.meaning.slice(0, 30) : '';
    }
    // 工具：渲染一个带词性+释义的关系标签
    function relTag(wordStr, dictWord, current) {
      const meaning = shortDef(dictWord);
      const clickable = !!dictWord && !current;
      return '<span class="word-relation-tag' +
        (current ? ' current' : '') +
        (clickable ? ' clickable' : '') +
        (dictWord ? '' : ' missing') + '"' +
        (clickable ? ' data-word="' + C.esc(dictWord.word) + '"' : '') +
        '>' +
          '<span class="rel-word">' + C.esc(wordStr) + '</span>' +
          (meaning ? '<span class="rel-meaning">' + C.esc(meaning) + '</span>' : (dictWord ? '' : '<span class="rel-meaning" style="opacity:0.45">词库外</span>')) +
        '</span>';
    }

    // 1. 派生词
    const derivatives = getDerivatives(w);
    if (derivatives.length > 0) {
      html += '<div class="word-detail-section">' +
        '<div class="word-detail-section-title">🌿 派生词（同根 · 共 ' + derivatives.length + ' 个）</div>' +
        '<div class="word-relation-tags rel-grid">' +
          derivatives.map(d => relTag(d.word, d, false)).join('') +
        '</div>' +
      '</div>';
    }

    // 1.5 同近词（kajweb 数据）
    const extras = (typeof WORD_EXTRAS !== 'undefined') ? WORD_EXTRAS[word] : null;
    if (extras && extras.syno && extras.syno.length > 0) {
      const synoTags = [];
      extras.syno.forEach(group => {
        (group.words || []).forEach(synoWord => {
          if (synoWord.toLowerCase() === word) return;
          if (synoTags.find(t => t.word.toLowerCase() === synoWord.toLowerCase())) return;
          const inDict = C.words.find(x => x.word.toLowerCase() === synoWord.toLowerCase());
          synoTags.push({
            word: synoWord,
            inDict,
            pos: group.pos || '',
            tran: group.tran || ''
          });
        });
      });
      if (synoTags.length > 0) {
        html += '<div class="word-detail-section">' +
          '<div class="word-detail-section-title">🔁 同近词（共 ' + synoTags.length + ' 个）</div>' +
          '<div class="word-relation-tags rel-grid">' +
            synoTags.slice(0, 8).map(t => {
              const decorated = t.inDict
                ? Object.assign({}, t.inDict, { _relPos: t.pos, _relMeaning: t.tran })
                : { word: t.word, _relPos: t.pos, _relMeaning: t.tran };
              return relTag(t.word, decorated, false);
            }).join('') +
          '</div>' +
        '</div>';
      }
    }

    // 1.6 反义词（新增）
    const antos = w.antos;
    if (antos && antos.anto && antos.anto.length > 0) {
      const antoWords = antos.anto.map(a => a.hwd).filter(Boolean);
      if (antoWords.length > 0) {
        html += '<div class="word-detail-section">' +
          '<div class="word-detail-section-title">↔️ 反义词（共 ' + antoWords.length + ' 个）</div>' +
          '<div class="word-relation-tags rel-grid">' +
            antoWords.map(aw => {
              const inDict = C.words.find(x => x.word.toLowerCase() === aw.toLowerCase());
              return relTag(aw, inDict || null, false);
            }).join('') +
          '</div>' +
        '</div>';
      }
    }

    // 2. 词根同族词
    if (C.findRoots) {
      const roots = C.findRoots(word);
      if (roots.length > 0) {
        const r = roots[0];
        const familyObj = C.getWordFamily ? C.getWordFamily(r.root) : null;
        const family = familyObj ? (familyObj.examples || []) : (r.examples || []);
        const siblings = family.filter(x => x.toLowerCase() !== word);
        const derivWords = new Set(derivatives.map(d => d.word.toLowerCase()));
        const uniqueSiblings = siblings.filter(s => !derivWords.has(s.toLowerCase()));
        if (uniqueSiblings.length > 0) {
          html += '<div class="word-detail-section">' +
            '<div class="word-detail-section-title">🌳 词族（' + C.esc(r.root) + ' = ' + C.esc(r.meaning) + '）</div>' +
            '<div class="word-relation-tags rel-grid">' +
              uniqueSiblings.slice(0, 8).map(s => {
                const inDict = C.words.find(x => x.word.toLowerCase() === s.toLowerCase());
                return relTag(s, inDict || null, false);
              }).join('') +
            '</div>' +
          '</div>';
        }
      }
    }

    // 3. 形近词/易混词：合并 CONFUSABLES + 算法补足，目标 4-5 个
    let confusableTip = '';
    let confusableWords = [];   // 字符串数组
    if (C.findConfusables) {
      const groups = C.findConfusables(word);
      if (groups.length > 0) {
        const merged = new Set();
        groups.forEach(g => {
          if (!confusableTip && g.tip) confusableTip = g.tip;
          g.words.forEach(x => { if (x.toLowerCase() !== word) merged.add(x); });
        });
        confusableWords = Array.from(merged);
      }
    }
    // 不足 4 个时用算法补
    if (confusableWords.length < 4 && C.findSimilarSpellings) {
      const need = 4 - confusableWords.length;
      const have = new Set(confusableWords.map(s => s.toLowerCase()));
      const auto = C.findSimilarSpellings(word, C.words, need + 2)
        .filter(x => !have.has(x.word.toLowerCase()))
        .slice(0, need);
      confusableWords = confusableWords.concat(auto.map(a => a.word));
    }
    if (confusableWords.length > 0) {
      // 包含当前词，方便对比
      const all = [w.word].concat(confusableWords).slice(0, 6);
      html += '<div class="word-detail-section">' +
        '<div class="word-detail-section-title">⚠️ 易混词辨析（共 ' + (all.length - 1) + ' 个）</div>' +
        '<div class="word-relation-confusable">' +
          '<div class="word-relation-tags rel-grid">' +
            all.map(cw => {
              const inDict = C.words.find(x => x.word.toLowerCase() === cw.toLowerCase());
              const isCurrent = cw.toLowerCase() === word;
              return relTag(cw, inDict || null, isCurrent);
            }).join('') +
          '</div>' +
          (confusableTip ? '<div class="word-relation-tip">' + C.esc(confusableTip) + '</div>' : '') +
        '</div>' +
      '</div>';
    }

    // 4. 词组搭配（优先用 kajweb 短语数据）
    const kajPhrases = (extras && extras.phrase) ? extras.phrase : null;
    const collocations = getCollocations(w);
    if (kajPhrases && kajPhrases.length > 0) {
      html += '<div class="word-detail-section">' +
        '<div class="word-detail-section-title">🔗 常见搭配（共 ' + kajPhrases.length + ' 条）</div>' +
        '<div class="word-collocations">' +
          kajPhrases.map(ph => {
            const re = new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\w*\\b', 'gi');
            const highlighted = C.esc(ph.p).replace(re, m => '<strong>' + m + '</strong>');
            return '<div class="word-collocation-item">' +
              '<span class="phrase-en">' + highlighted + '</span>' +
              (ph.cn ? '<span class="phrase-cn"> — ' + C.esc(ph.cn) + '</span>' : '') +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';
    } else if (collocations.length > 0) {
      html += '<div class="word-detail-section">' +
        '<div class="word-detail-section-title">🔗 常见搭配</div>' +
        '<div class="word-collocations">' +
          collocations.map(phrase => {
            const highlighted = phrase.replace(
              new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi'),
              '<strong>' + C.esc(w.word) + '</strong>'
            );
            return '<div class="word-collocation-item">' + highlighted + '</div>';
          }).join('') +
        '</div>' +
      '</div>';
    }

    return html;
  }

  // ========== 柯林斯风格释义（基于 defs 数据） ==========

  function buildCollinsHTML(w) {
    const defs = C.getDefs(w);
    // 只有一个词性且只有一个义项时不显示柯林斯格式
    if (defs.length === 1 && defs[0].meanings.length <= 1) return '';

    let html = '<div class="word-detail-section">' +
      '<div class="word-detail-section-title">📘 详细释义</div>' +
      '<div class="word-collins">';

    let idx = 0;
    defs.forEach(d => {
      d.meanings.forEach(m => {
        idx++;
        html += '<div class="collins-entry">' +
          '<span class="collins-num">' + idx + '</span>' +
          (d.pos ? '<span class="collins-pos">' + C.esc(d.pos) + '</span>' : '') +
          '<span class="collins-def">' + C.esc(m) + '</span>' +
        '</div>';
      });
    });

    html += '</div></div>';
    return html;
  }

  // ========== 显示单词详情弹窗 ==========

  function showWordDetail(w) {
    document.querySelectorAll('.word-detail-overlay').forEach(el => el.remove());

    const st = C.status(w.word);
    const wc = C.notebook[w.word]?.count || 0;
    const fl = w.freq === 'high' ? '高频' : w.freq === 'mid' ? '中频' : '低频';
    const freqClass = w.freq || 'low';
    const stLabel = st === 'mastered' ? '已掌握' : st === 'learning' ? '学习中' : '未学习';

    const mnemonicList = generateMnemonicList(w);
    const breakdownHTML = buildWordBreakdown(w);
    const studyHooksHTML = buildStudyHooksHTML(w);
    const collinsHTML = buildCollinsHTML(w);
    const freqHTML = buildFreqHTML(w);
    const relationsHTML = buildWordRelationsHTML(w);

    const overlay = document.createElement('div');
    overlay.className = 'word-detail-overlay';

    // 统一关闭路径：移除 DOM + 摘掉 keydown 监听，保证三个出口（X、backdrop、Esc）都能彻底清理
    let escHandler = null;
    function closeOverlay() {
      if (escHandler) {
        document.removeEventListener('keydown', escHandler);
        escHandler = null;
      }
      overlay.remove();
    }

    overlay.innerHTML =
      '<div class="word-detail-modal">' +
        '<div class="word-detail-header">' +
          '<button class="word-detail-close" data-action="close">✕</button>' +
          '<div class="word-detail-word">' + C.esc(w.word) + '</div>' +
          '<div class="word-detail-phonetic">' + C.esc(w.phonetic || '') + '</div>' +
          '<div class="word-detail-speak-row">' +
            '<button class="word-detail-speak-btn' + (C.accentMode === 'us' ? ' active' : '') + '" data-action="speak" data-accent="us">' +
              '🔊 美式' +
            '</button>' +
            '<button class="word-detail-speak-btn' + (C.accentMode === 'uk' ? ' active' : '') + '" data-action="speak" data-accent="uk">' +
              '🔊 英式' +
            '</button>' +
          '</div>' +
          '<span class="word-detail-freq freq-tag ' + freqClass + '">' + fl + '</span>' +
          (w.star ? renderStarRating(w.star) : '') +
        '</div>' +
        '<div class="word-detail-body">' +
          '<div class="word-detail-section">' +
            '<div class="word-detail-section-title">📖 释义</div>' +
            '<div class="word-detail-meaning">' + C.getDefsHTML(w) + '</div>' +
          '</div>' +
          collinsHTML +
          buildRealExamSentencesHTML(w) +
          (w.example ?
          '<div class="word-detail-section">' +
            '<div class="word-detail-section-title">💬 例句</div>' +
            '<div class="word-detail-example">' + C.esc(w.example) + '</div>' +
            '<div class="example-speak-row">' +
              '<button class="example-speak-btn" data-action="speak-example" data-accent="us">🔊 美式朗读</button>' +
              '<button class="example-speak-btn" data-action="speak-example" data-accent="uk">🔊 英式朗读</button>' +
            '</div>' +
          '</div>' : '') +
          breakdownHTML +
          studyHooksHTML +
          '<div class="word-detail-section">' +
            '<div class="word-detail-section-title">🧠 助记（共 ' + mnemonicList.length + ' 条）</div>' +
            '<div class="word-detail-mnemonic-list">' +
              mnemonicList.map(t => '<div class="word-detail-mnemonic-item">' + C.esc(t) + '</div>').join('') +
            '</div>' +
          '</div>' +
          freqHTML +
          relationsHTML +
          '<div class="word-detail-section">' +
            '<div class="word-detail-section-title">📋 学习状态</div>' +
            '<div class="word-detail-status">' +
              '<span class="word-detail-status-tag ' + st + '">' + stLabel + '</span>' +
              (wc > 0 ? '<span class="word-detail-status-tag wrong">错误 ' + wc + ' 次</span>' : '') +
              (C.progress[w.word]?.reviewStage ? '<span class="word-detail-status-tag learning">复习阶段 ' + C.progress[w.word].reviewStage + '</span>' : '') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    // 事件委托：处理所有点击
    overlay.addEventListener('click', function(e) {
      // 关闭按钮
      const closeBtn = e.target.closest('[data-action="close"]');
      if (closeBtn) { closeOverlay(); return; }

      // 单词发音按钮
      const speakBtn = e.target.closest('[data-action="speak"]');
      if (speakBtn) {
        C.speak(w.word, speakBtn.dataset.accent);
        return;
      }

      // 例句发音按钮
      const exSpeakBtn = e.target.closest('[data-action="speak-example"]');
      if (exSpeakBtn && w.example) {
        C.speakSentence(w.example, exSpeakBtn.dataset.accent);
        return;
      }

      // 可点击的关联词标签
      const tag = e.target.closest('.word-relation-tag[data-word]');
      if (tag) {
        const targetWord = tag.dataset.word;
        const wordObj = C.words.find(x => x.word === targetWord) ||
                        C.words.find(x => x.word.toLowerCase() === targetWord.toLowerCase());
        if (wordObj) {
          // 跳转新单词前先清理当前 keydown，避免监听堆积；
          // 走 C.showWordDetail 以确保目标词所在的 wordbank 分片已加载
          closeOverlay();
          C.showWordDetail(wordObj);
        }
        return;
      }

      // 点击遮罩层关闭
      if (e.target === overlay) closeOverlay();
    });

    document.body.appendChild(overlay);

    // 题型强化按钮（新增）
    const bodyDiv = overlay.querySelector('.word-detail-body');
    if (bodyDiv && C.addPracticeButtons) {
      C.addPracticeButtons(bodyDiv, w);
    }

    // 词库增强数据：ECDICT 词形变化/词频考纲 + Tatoeba 真实例句。
    // 走 /wordbank 分片按需异步加载，拿不到数据时静默跳过，不影响弹窗其余部分。
    if (bodyDiv && C.addWordBankSections) {
      C.addWordBankSections(bodyDiv, w);
    }

    // 给弹窗加彩色透明背景
    const modal = overlay.querySelector('.word-detail-modal');
    if (modal && C.applyCardTheme) C.applyCardTheme(modal);

    escHandler = (e) => { if (e.key === 'Escape') closeOverlay(); };
    document.addEventListener('keydown', escHandler);
  }

  // 注册到共享对象
  // 弹窗内的同近词/派生词/搭配依赖 window.WORD_EXTRAS，该数据现由 /wordbank 分片按需下发
  // （原为 3.23MB 同步脚本，占首屏体积最大的一块）。因此渲染前先确保对应分片就绪；
  // 分片拉取失败时也照常渲染，只是这几块内容为空，不影响弹窗其余部分。
  C.showWordDetail = function(w) {
    const render = () => showWordDetail(w);
    if (C.ensureWordBank && w && w.word) C.ensureWordBank(w.word).then(render, render);
    else render();
  };
  C.generateMnemonic = generateMnemonic;
  C.generateMnemonicList = generateMnemonicList;
  C.getBestMnemonic = getBestMnemonic;
  C.generateStudyHooks = generateStudyHooks;
})();
