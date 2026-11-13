/* ============================================================
 * core.js — 手机壳路由栈 + 通用组件
 * ============================================================ */

const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r2 = n => Math.round(Number(n || 0) * 100) / 100;

const ROLE_HOME = {
  '项目负责人': 'pm-home',
  '库管员': 'keeper-home',
  '押运员': 'escort-home',
  '安全员': 'safety-home',
  '安全监理': 'sup-home',
  '测量技术员': 'sv-home',
  '安全监管': 'reg-home',
  '民警': 'police-home',
  '治安管理员': 'admin-home'
};

/* ---------- 路由栈 ---------- */
const nav = {
  stack: [],
  push(id, params) { this.stack.push({ id, params }); this.render(); window.scrollTo(0, 0); },
  back() { this.stack.pop(); this.render(); },
  reset(id, params) { this.stack = [{ id, params }]; this.render(); },
  top() { return this.stack[this.stack.length - 1]; },
  render() {
    if (typeof stopScanCamera === 'function') stopScanCamera();
    const cur = this.top();
    if (!cur) return;
    saveDB();
    const fn = PAGES[cur.id];
    const view = $('#view');
    const tabbar = $('#tabbar');
    const appbar = $('#appbar');
    // 顶栏
    const showBack = this.stack.length > 1;
    const title = cur.id.split('-')[0];
    const meta = (fn && fn.title) ? fn.title : (ROLE_TITLES[cur.id] || '林安码 · 民爆监管');
    appbar.innerHTML = `
      <button type="button" class="ab-back ${showBack ? '' : 'hide'}" aria-label="返回" onclick="nav.back()">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div class="ab-title">${esc(meta)}</div>
      <div class="ab-right"></div>`;
    // 内容
    view.innerHTML = fn && fn.render ? fn.render(cur.params || {}) : '<div class="empty">页面不存在</div>';
    // 底部 tab
    const tabs = fn && fn.tabs ? fn.tabs() : null;
    tabbar.style.display = tabs ? 'flex' : 'none';
    if (tabs) tabbar.innerHTML = tabs.map(t => `
      <button type="button" class="tab ${t.active ? 'on' : ''}" onclick="${t.go}">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">${t.icon}</svg>
        <span>${t.label}</span>
      </button>`).join('');
    if (fn && fn.after) fn.after(cur.params || {});
    if (window.updateServerStatusBadge) window.updateServerStatusBadge();
  }
};
const ROLE_TITLES = {};

/* ---------- Toast ---------- */
let _toastTimer = null;
function toast(msg, ok) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); document.body.appendChild(t); }
  t.innerHTML = `${ok ? '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M5 12l5 5 9-10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}<span>${esc(msg)}</span>`;
  t.className = 'show' + (ok === false ? ' err' : '');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.className = '', 2200);
}

/* ---------- 弹层 ---------- */
function closeSheet(mask) {
  if (!mask || mask._closing) return;
  mask._closing = true;
  mask.classList.add('closing');
  setTimeout(() => mask.remove(), 190);
}
function sheet(title, rows, onPick) {
  const mask = document.createElement('div');
  mask.className = 'sheet-mask';
  mask.innerHTML = `<div class="sheet">
    <div class="sheet-bar"><div class="sheet-title">${esc(title)}</div><button type="button" class="sheet-x" aria-label="关闭" onclick="closeSheet(this.closest('.sheet-mask'))">✕</button></div>
    <div class="sheet-body">${rows.map((r, i) => `<div class="sheet-row" data-i="${i}">${r.label ? esc(r.label) : r.html}</div>`).join('')}</div>
  </div>`;
  document.body.appendChild(mask);
  mask.addEventListener('click', e => { if (e.target === mask) closeSheet(mask); });
  mask.querySelectorAll('.sheet-row').forEach((el, i) => {
    el.addEventListener('click', () => { closeSheet(mask); if (onPick) onPick(rows[i], i); });
  });
}
function confirmSheet(title, text, onOk, okText, danger) {
  const mask = document.createElement('div');
  mask.className = 'sheet-mask';
  mask.innerHTML = `<div class="sheet dialog">
    <div class="dlg-title">${esc(title)}</div>
    <div class="dlg-text">${esc(text)}</div>
    <div class="dlg-btns">
      <button class="btn ghost" data-a="cancel">取消</button>
      <button class="btn ${danger ? 'danger' : 'primary'}" data-a="ok">${esc(okText || '确定')}</button>
    </div>
  </div>`;
  document.body.appendChild(mask);
  mask.addEventListener('click', e => { if (e.target === mask) closeSheet(mask); });
  mask.querySelector('[data-a=cancel]').onclick = () => closeSheet(mask);
  mask.querySelector('[data-a=ok]').onclick = () => { closeSheet(mask); onOk(); };
}
/* ---------- 分步表单：长表单按屏拆分（同页显隐，不重渲染，不丢已填内容） ---------- */
function wizBar(step, total, titles) {
  const t = titles || [];
  return `<div class="wiz" data-cur="${step}" data-total="${total}">${Array.from({ length: total }, (_, i) => {
    const n = i + 1, label = t[i] || ('第' + n + '步');
    return `<div class="wiz-i ${n === step ? 'on' : (n < step ? 'done' : '')}">${n}. ${esc(label)}</div>`;
  }).join('')}</div>`;
}
function wizNav(step, total) {
  return `<div class="wiz-nav">
    <button id="wiz_prev" class="btn ghost" type="button" onclick="wizStep(-1)" style="display:${step > 1 ? '' : 'none'}">上一步</button>
    <button id="wiz_next" class="btn primary" type="button" onclick="wizStep(1)" style="display:${step < total ? '' : 'none'}">下一步</button>
  </div>`;
}
function wizApply(step) {
  const bar = document.querySelector('.wiz');
  if (!bar) return;
  const total = +bar.dataset.total;
  bar.dataset.cur = step;
  bar.querySelectorAll('.wiz-i').forEach((el, i) => {
    const n = i + 1;
    el.classList.toggle('on', n === step);
    el.classList.toggle('done', n < step);
  });
  document.querySelectorAll('[data-wst]').forEach(el => {
    el.style.display = (+el.dataset.wst === step) ? '' : 'none';
  });
  const prev = document.getElementById('wiz_prev');
  const next = document.getElementById('wiz_next');
  if (prev) prev.style.display = step > 1 ? '' : 'none';
  if (next) next.style.display = step < total ? '' : 'none';
  const view = document.getElementById('view');
  if (view) view.scrollTop = 0;
}
function wizStep(delta) {
  const bar = document.querySelector('.wiz');
  if (!bar) return;
  const total = +bar.dataset.total;
  const cur = +bar.dataset.cur || 1;
  const next = Math.min(total, Math.max(1, cur + delta));
  if (next !== cur) wizApply(next);
}
function formSheet(title, html, onOk, okText) {
  const mask = document.createElement('div');
  mask.className = 'sheet-mask';
  mask.innerHTML = `<div class="sheet dialog dlg-form">
    <div class="dlg-title">${esc(title)}</div>
    <div class="dlg-body">${html}</div>
    <div class="dlg-btns">
      <button class="btn ghost" data-a="cancel">取消</button>
      <button class="btn primary" data-a="ok">${esc(okText || '确定')}</button>
    </div>
  </div>`;
  document.body.appendChild(mask);
  mask.addEventListener('click', e => { if (e.target === mask) closeSheet(mask); });
  mask.querySelector('[data-a=cancel]').onclick = () => closeSheet(mask);
  mask.querySelector('[data-a=ok]').onclick = () => { onOk(mask); };
  return mask;
}

/* ---------- 状态徽标（语义收敛：琥珀=待办待审 / 蓝=进行就绪 / 绿=完成 / 红=驳回异常 / 灰=作废） ---------- */
const STATUS_CLS = {
  '待审核': 's-pend', '已驳回': 's-bad', '待出库': 's-run', '待运输': 's-run', '待发车': 's-run',
  '运输中': 's-run', '已到场': 's-run', '待接收': 's-run', '待退库': 's-pend', '退库运输中': 's-run',
  '待核验': 's-pend', '已完成': 's-done', '责令整改': 's-bad', '已作废': 's-void', '待押送': 's-pend', '押送中': 's-run', '待入库确认': 's-pend', '已入库': 's-done', '待签收': 's-pend', '已签收': 's-done', '已到达': 's-done', '检查中': 's-run', '待执行': 's-run', '待到场': 's-pend', '待处置': 's-bad', '待监管签字': 's-pend', '待负责人审核': 's-pend', '待复核': 's-pend', '部分到达': 's-run'
};
function statusPill(s) { return `<span class="pill ${STATUS_CLS[s] || 's-void'}">${esc(s)}</span>`; }
function levelBadge(plan) {
  const t = tierOf(planKg(plan.items));
  return `<span class="lvb ${t.cls}">${esc(t.level)}</span>`;
}

/* ---------- 通用表单值读取 ---------- */
function val(id) { const el = document.getElementById(id); return el ? el.value : ''; }

/* ---------- 照片留证（演示：打水印占位）---------- */
function photoStrip(state, key) {
  const n = state[key] || 0;
  let html = `<div class="photo-strip">`;
  for (let i = 0; i < n; i++) html += `<div class="ph-item"><svg viewBox="0 0 48 48" width="34" height="34"><rect x="4" y="10" width="40" height="30" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="16" cy="21" r="4" fill="currentColor" opacity=".35"/><path d="M8 36l10-9 7 6 9-10 8 8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg><i>已留证</i></div>`;
  html += `<button type="button" class="ph-add" onclick="uiAddPhoto(this,'${key}')">＋ 现场拍照留证</button></div>`;
  return html;
}
function uiAddPhoto(btn, key) {
  const state = window._formState || (window._formState = {});
  state[key] = (state[key] || 0) + 1;
  toast('已现场拍照并打水印（时间/坐标/作业点/人员）· 仅限现场拍摄，不可从相册选择（甲方确认 Q15）', true);
  const wrap = btn.closest('.photo-strip');
  const tmp = document.createElement('div');
  tmp.innerHTML = photoStrip(state, key);
  wrap.replaceWith(tmp.querySelector('.photo-strip'));
}

/* ---------- 手写签名（canvas 演示）---------- */
function initSign(canvasId, state, key) {
  const cv = document.getElementById(canvasId);
  if (!cv) return;
  const ctx = cv.getContext('2d');
  let drawing = false, drawn = false, last = null;
  ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.strokeStyle = '#0E1A3C';
  const pos = e => {
    const r = cv.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: (t.clientX - r.left) * cv.width / r.width, y: (t.clientY - r.top) * cv.height / r.height };
  };
  const down = e => { drawing = true; drawn = true; last = pos(e); e.preventDefault(); };
  const move = e => {
    if (!drawing) return;
    const p = pos(e);
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last = p; e.preventDefault();
  };
  const up = () => { drawing = false; if (drawn) { state[key] = true; } };
  cv.addEventListener('touchstart', down, { passive: false });
  cv.addEventListener('touchmove', move, { passive: false });
  cv.addEventListener('touchend', up);
  cv.addEventListener('mousedown', down);
  cv.addEventListener('mousemove', move);
  cv.addEventListener('mouseup', up);
  cv.addEventListener('mouseleave', up);
}
function clearSign(canvasId, state, key) {
  const cv = document.getElementById(canvasId);
  if (cv) cv.getContext('2d').clearRect(0, 0, cv.width, cv.height);
  if (state) state[key] = false;
}
function demoSign(cvId, state, key) {
  if (state) state[key] = true;
  const cv = document.getElementById(cvId);
  if (cv) { const ctx = cv.getContext('2d'); ctx.lineWidth = 2.4; ctx.strokeStyle = '#0E1A3C'; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(80, 110); ctx.bezierCurveTo(140, 40, 220, 160, 320, 80); ctx.bezierCurveTo(380, 40, 430, 130, 520, 90); ctx.stroke(); }
  toast('已手写签名（演示快速签名）', true);
}

/* ---------- 六节点时间轴（俯瞰卡片 F05 同源数据）---------- */
function timelineOf(plan) {
  const out = outboundByPlan(plan.id);
  const tr = transportByPlan(plan.id, 'GO');
  const rc = receiveByPlan(plan.id);
  const bl = blastingByPlan(plan.id);
  const rt = returnByPlan(plan.id);
  const vf = verifyByPlan(plan.id);
  return [
    { key: 'plan', label: '计划上报', time: plan.createdAt, who: person(plan.applicant).name, ok: !!plan.createdAt,
      note: plan.auditStatus ? `审核：${plan.auditStatus}${plan.auditBy ? ' · ' + person(plan.auditBy).name : ''}` : '' },
    { key: 'out', label: '出库', time: plan.outTime, who: out ? person(out.keeper).name : '', ok: !!out,
      note: out ? `${out.outNo} · ${site(plan.site).name}` : '' },
    { key: 'transport', label: '押运出发', time: tr ? tr.departTime : null, who: tr ? person(tr.escort).name : '', ok: !!(tr && tr.departTime),
      note: tr ? `${vehicle(tr.vehicle).plate} · ${driver(tr.driver).name}` : '' },
    { key: 'arrive', label: '到场接收', time: rc ? rc.arriveTime : null, who: rc ? person(rc.receiver).name : '', ok: !!rc,
      note: rc ? `到达来源：${rc.arriveSource}${rc.diffFlag ? ' · 有差异' : ' · 核量一致'}` : '' },
    { key: 'blast', label: '爆破登记', time: bl ? bl.blastTime : null, who: bl ? person(bl.supervisor).name : '', ok: !!bl,
      note: bl ? RESULT_LABEL[bl.result] + (rt ? ' · 有退库' : '') : '' },
    { key: 'verify', label: '民警核验', time: plan.verifyTime, who: vf ? person(vf.police).name : '', ok: !!vf,
      note: vf ? vf.conclusion : '' }
  ];
}
const RESULT_LABEL = { NORMAL_NO_RETURN: '正常无返库', NORMAL_RETURN: '正常有返库', ABNORMAL: '异常' };

function timelineHTML(plan) {
  const nodes = timelineOf(plan);
  let html = `<div class="tl-card"><div class="tl-title">六节点时序 · 与俯瞰大屏同源（/bb/overview）</div><div class="tl">`;
  nodes.forEach((n, i) => {
    html += `<div class="tl-item ${n.ok ? 'done' : ''}">
      <div class="tl-rail">${i < nodes.length - 1 ? '<i></i>' : ''}</div>
      <div class="tl-dot"></div>
      <div class="tl-main">
        <div class="tl-head"><b>${esc(n.label)}</b><span>${n.ok ? fmtTime(n.time) : '未完成'}</span></div>
        ${n.ok ? `<div class="tl-note">${esc(n.who ? n.who + (n.note ? ' · ' + n.note : '') : (n.note || ''))}</div>` : ''}
      </div></div>`;
  });
  html += `</div></div>`;
  return html;
}

/* ---------- 路线示意 SVG（抽象示意图，非真实地图）---------- */
function routeSVG(progress) {
  const p = Math.max(0, Math.min(100, progress || 0));
  return `<svg viewBox="0 0 340 120" class="route-svg">
    <rect x="0" y="0" width="340" height="120" rx="10" fill="#E4EAF5" stroke="#C3D4F0" stroke-width="1.5"/>
    <path d="M12 5 C 60 10, 80 35, 120 60 S 200 105, 260 105 S 310 95, 330 78" fill="none" stroke="#3a4150" stroke-width="5" stroke-linecap="round"/>
    <path d="M12 5 C 60 10, 80 35, 120 60 S 200 105, 260 105 S 310 95, 330 78" fill="none" stroke="#7c9bff" stroke-width="2" stroke-dasharray="6 7" stroke-linecap="round" class="dash"/>
    <circle cx="12" cy="5" r="7" fill="#fcfcfd"/>
    <text x="12" y="26" font-size="11" fill="#d0d4dd" text-anchor="middle">起运点</text>
    <circle cx="330" cy="78" r="7" fill="#7c9bff"/>
    <text x="330" y="99" font-size="11" fill="#d0d4dd" text-anchor="middle">作业点</text>
    <g class="truck"><rect x="-9" y="-6" width="18" height="12" rx="2" fill="#1E5EFF" stroke="#9FB6E0" stroke-width="1.5"/><circle cx="-4" cy="7" r="2.4" fill="#9FB6E0"/><circle cx="5" cy="7" r="2.4" fill="#9FB6E0"/></g>
  </svg>`;
}
/* 轨迹动画：由 JS 移动 .truck */
const ROUTE_PTS = [[12, 5], [60, 20], [100, 42], [140, 64], [190, 86], [245, 100], [290, 97], [330, 78]];
function startRouteAnim(tr) {
  const svg = document.querySelector('.route-svg');
  if (!svg) return;
  const truck = svg.querySelector('.truck');
  let timer = setInterval(() => {
    tr.progress = Math.min(100, (tr.progress || 0) + 8);
    tr.tracks = (tr.tracks || 0) + 1;
    const t = tr.progress / 100;
    const seg = Math.min(ROUTE_PTS.length - 2, Math.floor(t * (ROUTE_PTS.length - 1)));
    const f = t * (ROUTE_PTS.length - 1) - seg;
    const a = ROUTE_PTS[seg], b = ROUTE_PTS[seg + 1];
    const x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f;
    truck.setAttribute('transform', `translate(${x},${y})`);
    if (tr.progress >= 100) {
      clearInterval(timer);
      tr.suggestArrive = Date.now(); tr.suggestSource = 'GEOFENCE'; tr.status = '已到达';
      saveDB();
      if (tr.direction === 'RETURN') {
        /* 到达需押运员手动确认，动画到端点只提示「已进入库区」 */
        toast('已进入库区，请点「到达指定库房」确认后库管员方可入库', true);
      } else {
        planById(tr.plan).status = '待接收';
        pushMsg('安全员', `运输单 ${tr.no} 已到达围栏，建议到达时间 ${fmtTime(tr.suggestArrive)} 已生成，请确认接收。`);
        toast('已进入作业点围栏，生成建议到达时间', true);
      }
      nav.render();
    } else { saveDB(); }
  }, 700);
  window._routeTimer && clearInterval(window._routeTimer);
  window._routeTimer = timer;
}

/* ---------- 单号二维码（服务端生成，现场可真实扫描） ---------- */
function qrSVG(text) {
  const base = (typeof API_BASE === 'string' && API_BASE) ? API_BASE : '/api';
  /* API_BASE 已带 /api 前缀，这里只拼 /qr，避免出现 /api/api/qr 导致图片加载失败 */
  const img = `<img class="qr" width="132" height="132" alt="${esc(text)}" src="${base}/qr?text=${encodeURIComponent(text)}" style="border:1px solid #C3D4F0;border-radius:8px;background:#fff;display:block;margin:0 auto">`;
  return img;
}

/* ---------- 空态 ---------- */
const EMPTY = t => `<div class="empty"><svg viewBox="0 0 24 24" width="40" height="40"><path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/></svg><p>${esc(t)}</p></div>`;

/* ---------- 角色切换 ---------- */
function switchRole(role) {
  DB.role = role; saveDB();
  const home = ROLE_HOME[role];
  nav.reset(home);
  toast(`已切换：${role}`, true);
}
function toEntry() { DB.role = 'entry'; saveDB(); nav.reset('entry'); }

/* ---------- 计划卡片 ---------- */
function planCard(p, onclick) {
  const s = site(p.site), pr = project(p.project);
  const n = planSiteCount(p);
  const kg = planTotalKg(p);
  const siteText = n > 1 ? `${s.name} 等 ${n} 个点位` : s.name;
  return `<div class="card plan-card" onclick="${onclick}('${p.id}')">
    <div class="pc-top"><span class="pc-no">${esc(p.planNo)}</span>${statusPill(p.status)}</div>
    <div class="pc-name">${esc(siteText)}</div>
    <div class="pc-sub">${esc(pr.name)} · 计划量 ${kg}kg ${levelBadge(p)}<span class="pc-area">${esc(planArea(p).name)}</span></div>
    <div class="pc-time">计划爆破 ${fmtTime(p.planStart)} ~ ${fmtTime(p.planEnd)}</div>
    ${p.exceptionFlag ? '<div class="pc-warn">⚠ 存在异常单，待处置</div>' : ''}
  </div>`;
}
