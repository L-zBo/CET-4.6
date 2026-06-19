// ========== CET 词汇大师 — 认证模块 (auth.js) ==========
// 登录/注册 UI、用户状态管理、管理面板
// 依赖: core.js
(function() {
  'use strict';
  const C = window._C;

  // ========== 认证 API 封装 ==========

  async function apiPost(path, body) {
    const res = await fetch(C.API_BASE + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(C.authToken ? { 'Authorization': 'Bearer ' + C.authToken } : {})
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '请求失败');
    return data;
  }

  async function apiGet(path) {
    const res = await fetch(C.API_BASE + path, {
      headers: { 'Authorization': 'Bearer ' + C.authToken }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '请求失败');
    return data;
  }

  async function apiDelete(path) {
    const res = await fetch(C.API_BASE + path, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + C.authToken }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '请求失败');
    return data;
  }

  async function apiPut(path, body) {
    const res = await fetch(C.API_BASE + path, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + C.authToken
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '请求失败');
    return data;
  }

  // ========== 登录/注册逻辑 ==========

  async function login(username, password) {
    const { token, user } = await apiPost('/auth/login', { username, password });
    C.authToken = token;
    C.currentUser = user;
    localStorage.setItem('cet_auth_token', token);
    updateAuthUI();
    C.toast('欢迎回来，' + user.username + (user.role === 'admin' ? ' [管理员]' : ''), 'success');
    // 登录后拉取服务端数据
    if (C.currentLevel) C.fetchServerData();
  }

  async function register(username, password) {
    const { token, user } = await apiPost('/auth/register', { username, password });
    C.authToken = token;
    C.currentUser = user;
    localStorage.setItem('cet_auth_token', token);
    updateAuthUI();
    C.toast('注册成功！欢迎 ' + user.username, 'success');
  }

  function logout() {
    C.authToken = '';
    C.currentUser = null;
    localStorage.removeItem('cet_auth_token');
    updateAuthUI();
    C.toast('已退出登录', 'success');
  }

  // 一键切换账号：登出当前账号并直接弹出登录窗口
  function switchAccount() {
    C.authToken = '';
    C.currentUser = null;
    localStorage.removeItem('cet_auth_token');
    updateAuthUI();
    showAuthDialog('login');
  }

  async function checkAuth() {
    if (!C.authToken) return;
    try {
      const user = await apiGet('/auth/me');
      C.currentUser = user;
      updateAuthUI();
    } catch {
      C.authToken = '';
      C.currentUser = null;
      localStorage.removeItem('cet_auth_token');
    }
  }

  // ========== 登录弹窗 UI ==========

  function showAuthDialog(mode) {
    // 移除已有弹窗
    const existing = document.getElementById('auth-dialog-overlay');
    if (existing) existing.remove();

    const isLogin = mode === 'login';
    const overlay = document.createElement('div');
    overlay.id = 'auth-dialog-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px)';

    overlay.innerHTML = `
      <div style="background:linear-gradient(145deg,#0f1724,#162033);border:1px solid rgba(245,158,11,0.3);border-radius:16px;padding:36px;width:360px;max-width:90vw;box-shadow:0 24px 80px rgba(0,0,0,0.6)">
        <h2 style="text-align:center;margin:0 0 24px;font-size:1.5rem;color:#f59e0b">${isLogin ? '登录' : '注册'}</h2>
        <div style="margin-bottom:16px">
          <label style="display:block;font-size:0.85rem;color:#a0a8b8;margin-bottom:6px">用户名</label>
          <input id="auth-username" type="text" placeholder="输入用户名" autocomplete="username"
            style="width:100%;padding:10px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:#e0e6ed;font-size:1rem;outline:none;box-sizing:border-box"
            onfocus="this.style.borderColor='#f59e0b'" onblur="this.style.borderColor='rgba(255,255,255,0.15)'" />
        </div>
        <div style="margin-bottom:24px">
          <label style="display:block;font-size:0.85rem;color:#a0a8b8;margin-bottom:6px">密码</label>
          <input id="auth-password" type="password" placeholder="${isLogin ? '输入密码' : '至少 4 位'}" autocomplete="${isLogin ? 'current-password' : 'new-password'}"
            style="width:100%;padding:10px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:#e0e6ed;font-size:1rem;outline:none;box-sizing:border-box"
            onfocus="this.style.borderColor='#f59e0b'" onblur="this.style.borderColor='rgba(255,255,255,0.15)'" />
        </div>
        <div id="auth-error" style="color:#ff6b6b;font-size:0.85rem;margin-bottom:12px;display:none"></div>
        <button id="auth-submit-btn" onclick="window._authSubmit('${mode}')"
          style="width:100%;padding:12px;border-radius:8px;border:none;background:linear-gradient(135deg,#f59e0b,#d97706);color:#0f1724;font-size:1rem;font-weight:700;cursor:pointer;transition:opacity 0.2s"
          onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
          ${isLogin ? '登 录' : '注 册'}
        </button>
        <div style="text-align:center;margin-top:16px;font-size:0.85rem;color:#6b7280">
          ${isLogin
            ? '没有账号？<a href="#" onclick="window._C.showAuthDialog(\'register\');return false" style="color:#f59e0b;text-decoration:none">立即注册</a>'
            : '已有账号？<a href="#" onclick="window._C.showAuthDialog(\'login\');return false" style="color:#f59e0b;text-decoration:none">去登录</a>'
          }
        </div>
        <button onclick="this.closest('#auth-dialog-overlay').remove()"
          style="position:absolute;top:12px;right:16px;background:none;border:none;color:#6b7280;font-size:1.5rem;cursor:pointer;padding:4px">×</button>
      </div>
    `;
    overlay.querySelector('div').style.position = 'relative';
    document.body.appendChild(overlay);

    // 回车提交
    const pwdInput = document.getElementById('auth-password');
    pwdInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') window._authSubmit(mode);
    });
    document.getElementById('auth-username').focus();
  }

  // 全局提交处理
  window._authSubmit = async function(mode) {
    const btn = document.getElementById('auth-submit-btn');
    const errEl = document.getElementById('auth-error');
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;

    if (!username || !password) {
      errEl.textContent = '请填写用户名和密码';
      errEl.style.display = 'block';
      return;
    }

    btn.disabled = true;
    btn.textContent = '处理中...';
    errEl.style.display = 'none';

    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register(username, password);
      }
      // 成功，关闭弹窗
      document.getElementById('auth-dialog-overlay')?.remove();
    } catch (e) {
      errEl.textContent = e.message;
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = mode === 'login' ? '登 录' : '注 册';
    }
  };

  // ========== 导航栏用户状态 ==========

  function updateAuthUI() {
    const area = document.getElementById('auth-user-area');
    if (!area) return;

    if (!C.isServerMode) {
      area.style.display = 'none';
      return;
    }

    area.style.display = 'flex';

    if (C.currentUser) {
      const isAdmin = C.currentUser.role === 'admin';
      area.innerHTML = `
        <span style="color:#a0a8b8;font-size:0.85rem;margin-right:8px">
          ${C.esc(C.currentUser.username)}
          ${isAdmin ? '<span style="color:#f59e0b;font-size:0.75rem;margin-left:4px">[管理员]</span>' : ''}
        </span>
        ${isAdmin ? '<button class="btn btn-sm btn-ghost" onclick="window._C.showAdminPanel()" style="color:#f59e0b;font-size:0.8rem;margin-right:4px">管理</button>' : ''}
        <button class="btn btn-sm btn-ghost" onclick="window._C.showAccountSettings()" style="font-size:0.8rem;margin-right:4px">账号</button>
        <button class="btn btn-sm btn-ghost" onclick="window._C.switchAccount()" style="font-size:0.8rem;margin-right:4px" title="登出当前账号并打开登录窗口">切换</button>
        <button class="btn btn-sm btn-ghost" onclick="window._C.logout()" style="font-size:0.8rem">退出</button>
      `;
    } else {
      area.innerHTML = `
        <button class="btn btn-sm" onclick="window._C.showAuthDialog('login')"
          style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#0f1724;font-weight:600;font-size:0.8rem;border:none;padding:6px 14px;border-radius:6px">
          登录
        </button>
      `;
    }
  }

  // ========== 管理面板 ==========

  async function showAdminPanel() {
    if (!C.currentUser || C.currentUser.role !== 'admin') return;

    const existing = document.getElementById('admin-panel-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'admin-panel-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px)';

    overlay.innerHTML = `
      <div style="background:linear-gradient(145deg,#0f1724,#162033);border:1px solid rgba(245,158,11,0.3);border-radius:16px;padding:32px;width:960px;max-width:95vw;max-height:85vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.6);position:relative">
        <button onclick="this.closest('#admin-panel-overlay').remove()"
          style="position:absolute;top:12px;right:16px;background:none;border:none;color:#6b7280;font-size:1.5rem;cursor:pointer">×</button>
        <h2 style="margin:0 0 20px;color:#f59e0b;font-size:1.4rem">管理面板</h2>
        <div id="admin-stats" style="margin-bottom:20px"></div>
        <h3 style="color:#e0e6ed;font-size:1.1rem;margin-bottom:12px">用户列表</h3>
        <div id="admin-users-list" style="color:#a0a8b8">加载中...</div>
      </div>
    `;
    document.body.appendChild(overlay);

    // 加载数据
    try {
      const [stats, users] = await Promise.all([
        apiGet('/admin/stats'),
        apiGet('/admin/users')
      ]);

      document.getElementById('admin-stats').innerHTML = `
        <div style="display:flex;gap:16px;flex-wrap:wrap">
          <div style="flex:1;min-width:120px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:16px;text-align:center">
            <div style="font-size:2rem;font-weight:700;color:#f59e0b">${stats.userCount}</div>
            <div style="font-size:0.85rem;color:#a0a8b8">总用户数</div>
          </div>
          <div style="flex:1;min-width:120px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);border-radius:10px;padding:16px;text-align:center">
            <div style="font-size:2rem;font-weight:700;color:#10b981">${stats.todayActive}</div>
            <div style="font-size:0.85rem;color:#a0a8b8">今日活跃</div>
          </div>
          <div style="flex:1;min-width:120px;background:rgba(14,165,233,0.1);border:1px solid rgba(14,165,233,0.2);border-radius:10px;padding:16px;text-align:center">
            <div style="font-size:2rem;font-weight:700;color:#0ea5e9">${stats.dataCount}</div>
            <div style="font-size:0.85rem;color:#a0a8b8">学习记录</div>
          </div>
        </div>
      `;

      const listEl = document.getElementById('admin-users-list');
      if (users.length === 0) {
        listEl.textContent = '暂无用户';
        return;
      }

      listEl.innerHTML = `
        <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:0.9rem;table-layout:fixed">
          <colgroup>
            <col style="width:50px">
            <col style="width:auto">
            <col style="width:72px">
            <col style="width:150px">
            <col style="width:150px">
            <col style="width:180px">
          </colgroup>
          <thead>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.1)">
              <th style="text-align:left;padding:10px 8px;color:#a0a8b8">ID</th>
              <th style="text-align:left;padding:10px 8px;color:#a0a8b8">用户名</th>
              <th style="text-align:left;padding:10px 8px;color:#a0a8b8">角色</th>
              <th style="text-align:left;padding:10px 8px;color:#a0a8b8">注册时间</th>
              <th style="text-align:left;padding:10px 8px;color:#a0a8b8">最近登录</th>
              <th style="text-align:right;padding:10px 8px;color:#a0a8b8">操作</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => {
              return `
              <tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
                <td style="padding:10px 8px;color:#6b7280">${u.id}</td>
                <td style="padding:10px 8px;color:#e0e6ed;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${C.esc(u.username)}">${C.esc(u.username)}</td>
                <td style="padding:10px 8px">
                  <span style="color:${u.role === 'admin' ? '#f59e0b' : '#10b981'};font-size:0.8rem;padding:2px 8px;border-radius:4px;background:${u.role === 'admin' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)'}">
                    ${u.role === 'admin' ? '管理员' : '用户'}
                  </span>
                </td>
                <td style="padding:10px 8px;color:#6b7280;font-size:0.82rem;white-space:nowrap">${u.created_at || '-'}</td>
                <td style="padding:10px 8px;color:#6b7280;font-size:0.82rem;white-space:nowrap">${u.last_login || '从未'}</td>
                <td style="padding:10px 8px;text-align:right;white-space:nowrap">
                  <button data-action="view" data-uid="${u.id}" class="btn btn-sm" style="background:rgba(14,165,233,0.15);color:#0ea5e9;border:1px solid rgba(14,165,233,0.3);font-size:0.75rem;padding:4px 10px;border-radius:4px;cursor:pointer;margin-right:4px" title="查看学习进度">详情</button>
                  <button data-action="edit" data-uid="${u.id}" data-uname="${C.esc(u.username)}" class="btn btn-sm" style="background:rgba(245,158,11,0.15);color:#f59e0b;border:1px solid rgba(245,158,11,0.3);font-size:0.75rem;padding:4px 10px;border-radius:4px;cursor:pointer;margin-right:4px" title="修改用户名/密码">编辑</button>
                  ${u.id !== C.currentUser.id
                    ? `<button data-action="delete" data-uid="${u.id}" data-uname="${C.esc(u.username)}" class="btn btn-sm" style="background:rgba(255,107,107,0.15);color:#ff6b6b;border:1px solid rgba(255,107,107,0.3);font-size:0.75rem;padding:4px 10px;border-radius:4px;cursor:pointer">删除</button>`
                    : '<span style="color:#6b7280;font-size:0.75rem">当前</span>'
                  }
                </td>
              </tr>
            `}).join('')}
          </tbody>
        </table>
        </div>
      `;

      // 事件委托：处理操作按钮点击
      listEl.addEventListener('click', function(e) {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const uid = parseInt(btn.dataset.uid);
        const uname = btn.dataset.uname || '';
        switch (btn.dataset.action) {
          case 'view': window._adminViewUser(uid); break;
          case 'edit': window._adminEditUser(uid, uname); break;
          case 'delete': window._adminDeleteUser(uid, uname); break;
        }
      });
    } catch (e) {
      document.getElementById('admin-users-list').textContent = '加载失败: ' + e.message;
    }
  }

  window._adminDeleteUser = async function(id, name) {
    if (!confirm('确定要删除用户 "' + name + '" 吗？\n该用户所有学习数据将被永久删除。')) return;
    try {
      await apiDelete('/admin/users/' + id);
      C.toast('已删除用户 ' + name, 'success');
      showAdminPanel(); // 刷新面板
    } catch (e) {
      C.toast('删除失败: ' + e.message, 'error');
    }
  };

  // ========== 编辑用户（改名/改密码） ==========

  window._adminEditUser = function(id, username) {
    const existing = document.getElementById('admin-edit-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'admin-edit-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10001;display:flex;align-items:center;justify-content:center';

    overlay.innerHTML = `
      <div style="background:linear-gradient(145deg,#0f1724,#162033);border:1px solid rgba(245,158,11,0.3);border-radius:12px;padding:28px;width:380px;max-width:90vw;box-shadow:0 16px 60px rgba(0,0,0,0.5);position:relative">
        <button onclick="this.closest('#admin-edit-overlay').remove()"
          style="position:absolute;top:8px;right:12px;background:none;border:none;color:#6b7280;font-size:1.3rem;cursor:pointer">×</button>
        <h3 style="margin:0 0 20px;color:#f59e0b;font-size:1.2rem">编辑用户 #${id}</h3>
        <div style="margin-bottom:14px">
          <label style="display:block;font-size:0.8rem;color:#a0a8b8;margin-bottom:4px">新用户名（留空不修改）</label>
          <input id="edit-username" type="text" value="${C.esc(username)}" placeholder="2-20 个字符"
            style="width:100%;padding:8px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:#e0e6ed;font-size:0.95rem;outline:none;box-sizing:border-box" />
        </div>
        <div style="margin-bottom:20px">
          <label style="display:block;font-size:0.8rem;color:#a0a8b8;margin-bottom:4px">新密码（留空不修改）</label>
          <input id="edit-password" type="text" placeholder="至少 4 位"
            style="width:100%;padding:8px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:#e0e6ed;font-size:0.95rem;outline:none;box-sizing:border-box" />
        </div>
        <div id="edit-error" style="color:#ff6b6b;font-size:0.8rem;margin-bottom:10px;display:none"></div>
        <button id="edit-save-btn" onclick="window._adminSaveEdit(${id})"
          style="width:100%;padding:10px;border-radius:6px;border:none;background:linear-gradient(135deg,#f59e0b,#d97706);color:#0f1724;font-size:0.95rem;font-weight:700;cursor:pointer">保存修改</button>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('edit-username').focus();
  };

  window._adminSaveEdit = async function(id) {
    const btn = document.getElementById('edit-save-btn');
    const errEl = document.getElementById('edit-error');
    const newName = document.getElementById('edit-username').value.trim();
    const newPwd = document.getElementById('edit-password').value;

    btn.disabled = true;
    btn.textContent = '保存中...';
    errEl.style.display = 'none';

    try {
      if (newName) {
        await apiPut('/admin/users/' + id + '/username', { username: newName });
      }
      if (newPwd) {
        await apiPut('/admin/users/' + id + '/password', { password: newPwd });
      }
      if (!newName && !newPwd) {
        errEl.textContent = '请至少修改一项';
        errEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = '保存修改';
        return;
      }
      // 如果管理员改了自己的用户名，同步更新右上角 + 刷新身份
      if (newName && id === C.currentUser.id) {
        C.currentUser.username = newName;
        // 从服务端重新拉取最新身份（/me 现在从数据库读）
        try { await checkAuth(); } catch {}
      }
      C.toast('用户信息已更新', 'success');
      document.getElementById('admin-edit-overlay')?.remove();
      showAdminPanel();
    } catch (e) {
      errEl.textContent = e.message;
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = '保存修改';
    }
  };

  // ========== 查看用户学习详情 ==========

  window._adminViewUser = async function(id) {
    const existing = document.getElementById('admin-detail-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'admin-detail-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10001;display:flex;align-items:center;justify-content:center';

    overlay.innerHTML = `
      <div style="background:linear-gradient(145deg,#0f1724,#162033);border:1px solid rgba(14,165,233,0.3);border-radius:12px;padding:28px;width:800px;max-width:95vw;max-height:85vh;overflow-y:auto;box-shadow:0 16px 60px rgba(0,0,0,0.5);position:relative">
        <button onclick="this.closest('#admin-detail-overlay').remove()"
          style="position:absolute;top:8px;right:12px;background:none;border:none;color:#6b7280;font-size:1.3rem;cursor:pointer">×</button>
        <div id="admin-detail-content" style="color:#a0a8b8">加载中...</div>
      </div>
    `;
    document.body.appendChild(overlay);

    try {
      const data = await apiGet('/admin/users/' + id + '/stats');
      const el = document.getElementById('admin-detail-content');

      const levelNames = { cet4: 'CET-4 四级', cet6: 'CET-6 六级' };
      let levelsHtml = '';

      if (Object.keys(data.levels).length === 0) {
        levelsHtml = '<div style="color:#6b7280;padding:12px 0">暂无学习记录</div>';
      } else {
        for (const [level, info] of Object.entries(data.levels)) {
          // 30天柱状图
          const maxD = Math.max(...info.dailyHistory.map(d => d.learned), 1);
          let barHtml = '';
          info.dailyHistory.forEach(d => {
            const h = Math.max(2, Math.round(d.learned / maxD * 80));
            const clr = d.learned === 0 ? '#2a2f3a' : d.learned >= 30 ? '#10b981' : '#f59e0b';
            const label = d.date.slice(5);
            barHtml += '<div style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:0" title="' + label + ': ' + d.learned + ' 词">' +
              '<div style="width:100%;max-width:14px;height:' + h + 'px;background:' + clr + ';border-radius:2px;margin-bottom:2px"></div>' +
              '</div>';
          });

          // 周期总计
          const last7 = info.dailyHistory.slice(-7).reduce((s, d) => s + d.learned, 0);
          const last30 = info.dailyHistory.reduce((s, d) => s + d.learned, 0);

          levelsHtml += `
            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:18px;margin-bottom:14px">
              <div style="font-size:1.05rem;font-weight:600;color:#e0e6ed;margin-bottom:14px">${levelNames[level] || level}</div>
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">
                <div style="text-align:center;padding:10px;background:rgba(14,165,233,0.1);border-radius:8px">
                  <div style="font-size:1.5rem;font-weight:700;color:#0ea5e9">${info.wordCount}</div>
                  <div style="font-size:0.72rem;color:#a0a8b8">已学单词</div>
                </div>
                <div style="text-align:center;padding:10px;background:rgba(16,185,129,0.1);border-radius:8px">
                  <div style="font-size:1.5rem;font-weight:700;color:#10b981">${info.mastered}</div>
                  <div style="font-size:0.72rem;color:#a0a8b8">已掌握</div>
                </div>
                <div style="text-align:center;padding:10px;background:rgba(245,158,11,0.1);border-radius:8px">
                  <div style="font-size:1.5rem;font-weight:700;color:#f59e0b">${info.learning}</div>
                  <div style="font-size:0.72rem;color:#a0a8b8">学习中</div>
                </div>
              </div>
              <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">
                <div style="text-align:center;padding:8px;background:rgba(168,85,247,0.1);border-radius:6px">
                  <div style="font-size:1.2rem;font-weight:700;color:#a855f7">${info.currentStreak}</div>
                  <div style="font-size:0.7rem;color:#a0a8b8">连续天数</div>
                </div>
                <div style="text-align:center;padding:8px;background:rgba(244,114,182,0.1);border-radius:6px">
                  <div style="font-size:1.2rem;font-weight:700;color:#f472b6">${info.longestStreak}</div>
                  <div style="font-size:0.7rem;color:#a0a8b8">最长连续</div>
                </div>
                <div style="text-align:center;padding:8px;background:rgba(96,165,250,0.1);border-radius:6px">
                  <div style="font-size:1.2rem;font-weight:700;color:#60a5fa">${info.totalDays}</div>
                  <div style="font-size:0.7rem;color:#a0a8b8">累计学习天</div>
                </div>
                <div style="text-align:center;padding:8px;background:rgba(251,113,133,0.1);border-radius:6px">
                  <div style="font-size:1.2rem;font-weight:700;color:#fb7185">${info.notebookCount}</div>
                  <div style="font-size:0.7rem;color:#a0a8b8">错题本</div>
                </div>
              </div>
              <div style="margin-bottom:6px;font-size:0.8rem;color:#a0a8b8">
                近 30 天学词量
                <span style="float:right;color:#6b7280">近7天: ${last7} · 近30天: ${last30}</span>
              </div>
              <div style="display:flex;align-items:flex-end;gap:1px;height:84px;background:rgba(255,255,255,0.02);border-radius:6px;padding:2px 4px">
                ${barHtml}
              </div>
              <div style="display:flex;justify-content:space-between;font-size:0.65rem;color:#6b7280;margin-top:3px;padding:0 4px">
                <span>${info.dailyHistory[0]?.date.slice(5) || ''}</span>
                <span>今天</span>
              </div>
              <div style="font-size:0.72rem;color:#6b7280;margin-top:10px;text-align:right">最后同步: ${info.saved_at || '-'}</div>
            </div>
          `;
        }
      }

      el.innerHTML = `
        <h3 style="margin:0 0 6px;color:#0ea5e9;font-size:1.2rem">${C.esc(data.username)} 的学习详情</h3>
        <div style="font-size:0.8rem;color:#6b7280;margin-bottom:16px">
          角色: ${data.role === 'admin' ? '管理员' : '用户'} · 注册: ${data.created_at || '-'} · 最近登录: ${data.last_login || '从未'}
        </div>
        ${levelsHtml}
      `;
    } catch (e) {
      document.getElementById('admin-detail-content').textContent = '加载失败: ' + e.message;
    }
  };

  // ========== 账号设置（用户自助修改） ==========

  function showAccountSettings() {
    if (!C.currentUser) return;
    const existing = document.getElementById('account-settings-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'account-settings-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px)';

    overlay.innerHTML = `
      <div style="background:linear-gradient(145deg,#0f1724,#162033);border:1px solid rgba(245,158,11,0.3);border-radius:16px;padding:36px;width:400px;max-width:90vw;box-shadow:0 24px 80px rgba(0,0,0,0.6);position:relative">
        <button onclick="this.closest('#account-settings-overlay').remove()"
          style="position:absolute;top:12px;right:16px;background:none;border:none;color:#6b7280;font-size:1.5rem;cursor:pointer">×</button>
        <h2 style="text-align:center;margin:0 0 24px;font-size:1.4rem;color:#f59e0b">账号设置</h2>
        <div style="font-size:0.85rem;color:#a0a8b8;text-align:center;margin-bottom:20px">当前用户: <span style="color:#e0e6ed">${C.esc(C.currentUser.username)}</span></div>

        <div style="margin-bottom:16px">
          <label style="display:block;font-size:0.8rem;color:#a0a8b8;margin-bottom:4px">新用户名（留空不修改）</label>
          <input id="acct-new-username" type="text" placeholder="2-20 个字符"
            style="width:100%;padding:8px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:#e0e6ed;font-size:0.95rem;outline:none;box-sizing:border-box" />
        </div>

        <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;margin-top:16px;margin-bottom:12px">
          <label style="display:block;font-size:0.8rem;color:#a0a8b8;margin-bottom:4px">原密码（修改密码时必填）</label>
          <input id="acct-old-password" type="password" placeholder="输入当前密码"
            style="width:100%;padding:8px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:#e0e6ed;font-size:0.95rem;outline:none;box-sizing:border-box" />
        </div>
        <div style="margin-bottom:20px">
          <label style="display:block;font-size:0.8rem;color:#a0a8b8;margin-bottom:4px">新密码（留空不修改）</label>
          <input id="acct-new-password" type="password" placeholder="至少 4 位"
            style="width:100%;padding:8px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:#e0e6ed;font-size:0.95rem;outline:none;box-sizing:border-box" />
        </div>

        <div id="acct-error" style="color:#ff6b6b;font-size:0.8rem;margin-bottom:10px;display:none"></div>
        <button id="acct-save-btn" onclick="window._acctSave()"
          style="width:100%;padding:10px;border-radius:6px;border:none;background:linear-gradient(135deg,#f59e0b,#d97706);color:#0f1724;font-size:0.95rem;font-weight:700;cursor:pointer">保存修改</button>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  window._acctSave = async function() {
    const btn = document.getElementById('acct-save-btn');
    const errEl = document.getElementById('acct-error');
    const newUsername = document.getElementById('acct-new-username').value.trim();
    const oldPwd = document.getElementById('acct-old-password').value;
    const newPwd = document.getElementById('acct-new-password').value;

    if (!newUsername && !newPwd) {
      errEl.textContent = '请至少修改一项';
      errEl.style.display = 'block';
      return;
    }
    if (newPwd && !oldPwd) {
      errEl.textContent = '修改密码需要填写原密码';
      errEl.style.display = 'block';
      return;
    }

    btn.disabled = true;
    btn.textContent = '保存中...';
    errEl.style.display = 'none';

    try {
      // 改用户名：管理员用 admin 接口改自己，普通用户也用 admin 接口（如果是管理员）或专用接口
      if (newUsername) {
        const result = await apiPost('/auth/change-username', { username: newUsername });
        C.currentUser.username = newUsername;
        // 保存服务端返回的新 token，避免刷新后恢复旧用户名
        if (result.token) {
          C.authToken = result.token;
          localStorage.setItem('cet_auth_token', result.token);
        }
      }
      // 改密码：用 auth 接口验证旧密码
      if (newPwd) {
        await apiPost('/auth/change-password', { oldPassword: oldPwd, newPassword: newPwd });
      }
      C.toast('账号信息已更新', 'success');
      updateAuthUI();
      document.getElementById('account-settings-overlay')?.remove();
    } catch (e) {
      errEl.textContent = e.message;
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = '保存修改';
    }
  };

  // ========== 注册到 _C ==========

  C.checkAuth = checkAuth;
  C.showAuthDialog = showAuthDialog;
  C.showAccountSettings = showAccountSettings;
  C.login = login;
  C.register = register;
  C.logout = logout;
  C.switchAccount = switchAccount;
  C.updateAuthUI = updateAuthUI;
  C.showAdminPanel = showAdminPanel;
})();
