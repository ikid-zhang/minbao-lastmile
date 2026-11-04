/* ============================================================
 * pages-a.js — 入口 / 共享页 / 项目负责人 / 库管员
 * ============================================================ */
const PAGES = {};

/* ---------- 通用 tab 图标 ---------- */
const IC = {
  home: '<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  msg: '<path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  me: '<circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5 20c1.5-4 5-5.5 7-5.5s5.5 1.5 7 5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  doc: '<path d="M7 3h7l4 4v14H7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M10 9h5M10 13h5M10 17h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 12l2.2 2.2L15.5 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>'
};

function roleTabs(home, active) {
  return [
    { label: '首页', icon: IC.home, active: active === 0, go: `nav.reset('${home}')` },
    { label: '消息', icon: IC.msg, active: active === 1, go: "nav.reset('messages')" },
    { label: '我的', icon: IC.me, active: active === 2, go: "nav.reset('my')" }
  ];
}

/* ================= 入口：角色选择 ================= */
PAGES['entry'] = {
  title: '民爆"最后一公里"监管',
  render() {
    const roleDefs = [
      { r: '测量技术员', n: '张 明', d: '作业点位测距报量 · 当日 24 点前报明日计划', g: '企业侧' },
      { r: '安全监管', n: '郑 安', d: '作业点安全把关 · 技术员计划签字放行', g: '企业侧' },
      { r: '项目负责人', n: '陈志远', d: '汇总审核上报 · 选库房与公安责任区', g: '企业侧' },
      { r: '库管员', n: '钱有德', d: '出库登记 · 双人复核 · 扣库存 · 退库核销', g: '企业侧' },
      { r: '押运员', n: '孙立冬', d: '扫码签收 · 打卡点设置 · 途中扫码打卡 · 反向押送', g: '企业侧' },
      { r: '安全员', n: '赵铁柱', d: '到场接收 · 到达时间确认 · 逐项核量', g: '企业侧' },
      { r: '安全监理', n: '李建国', d: '爆破登记 · 退库/销毁 · 四量平衡 · 核验手签', g: '企业侧' },
      { r: '民警', n: '刘 峰', d: '按工区审核 · 远程核验 · 分级检查', g: '公安侧' },
      { r: '治安管理员', n: '马国平', d: '全域统计 · 主数据完整率 · 检查覆盖率', g: '公安侧' }
    ];
    const card = rd => `<div class="role-card" onclick="${rd.r === '库管员' ? "switchKeeper()" : `switchRole('${rd.r}')`}">
      <div class="role-ava">${rd.n[0]}</div>
      <div class="role-info"><b>${rd.r}</b><span>${esc(rd.d)}</span></div>
      <svg viewBox="0 0 24 24" width="18" height="18" class="role-arr"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2"/></svg>
    </div>`;
    return `
    <div class="entry-hero">
      <div class="entry-badge">演示原型 · 纯前端数据</div>
      <div class="entry-title">民爆"最后一公里"监管</div>
      <div class="entry-sub">计划 — 出库 — 运输 — 到场 — 爆破 — 核验 全链闭环<br>各角色选择身份后，可完整走通六节点流程</div>
    </div>
    <div class="entry-sec">企业侧角色</div>
    ${roleDefs.filter(x => x.g === '企业侧').map(card).join('')}
    <div class="entry-sec">公安侧角色</div>
    ${roleDefs.filter(x => x.g === '公安侧').map(card).join('')}
    <div class="entry-tip">提示：数据仅存于浏览器本地，可在「我的」页一键重置。库管员含登记/复核双人身份（双人双锁）。</div>`;
  }
};
/* 库管员身份选择：登记库管员与复核库管员为不同人（双人双锁） */
function switchKeeper() {
  sheet('选择库管员身份', [
    { label: '钱有德 · 保管员（登记出库）', id: 'P4' },
    { label: '吴秀英 · 保管员（复核签名）', id: 'P9' }
  ], x => { DB.keeperId = x.id; switchRole('库管员'); });
}

/* ================= 共享：消息 ================= */
PAGES['messages'] = {
  title: '消息',
  tabs: () => roleTabs('messages', 1),
  render() {
    const role = DB.role;
    const list = DB.messages.filter(m => (m.to === role || m.to === '全部') && (role !== '民警' || isMyAreaMsg(m)));
    return `<div class="page-title">消息通知<span class="page-sub">订阅消息 · 当前角色：${esc(role)}</span></div>` +
      (list.length ? list.map(m => `<div class="msg-item"><div class="msg-dot"></div><div><p>${esc(m.text)}</p><time>${timeAgo(m.time)}${m.to === '全部' ? ' · 全员通知' : ''}</time></div></div>`).join('') : EMPTY('当前角色暂无订阅消息'));
  }
};

/* ================= 共享：我的 ================= */
PAGES['my'] = {
  title: '我的',
  tabs: () => roleTabs('my', 2),
  render() {
    const role = DB.role;
    const u = role === '民警' ? curPolice() : MASTER.persons.find(p => p.id === (role === '库管员' ? (DB.keeperId || 'P4') : null) || p.role === role);
    return `
    <div class="me-card">
      <div class="role-ava big">${(u ? u.name : role)[0]}</div>
      <div class="me-info"><b>${esc(u ? u.name : role)}</b><span>${esc(role)} · ${esc(u ? u.company : '')}${role === '民警' ? ' · ' + esc(curArea().name) : ''}</span><span>资格证 ${esc(u ? u.cert : '-')} · 有效期至 ${esc(u ? u.certExpire : '-')}</span></div>
    </div>
    <div class="cell-group">
      <div class="cell" onclick="toEntry()"><span>切换角色</span><small>演示用 · 一键切换身份</small></div>
      <div class="cell" onclick="confirmSheet('重置演示数据','将清空本地演示数据并恢复初始场景（含待审核计划、在途运输、待到场检查任务），确定？',resetAll,'重置',true)">重置演示数据</div>
      <div class="cell" onclick="showFlowDoc()"><span>流程说明</span><small>六节点闭环 · 分级检查规则</small></div>
    </div>
    <div class="foot-note">林安码小程序 · 民爆"最后一公里"监管<br>设计依据《民爆最后一公里监管功能设计说明》V1.2 · 数据为前端演示</div>`;
  },
  after() {}
};
function resetAll() { resetDB(); toast('演示数据已重置', true); toEntry(); }
function showFlowDoc() {
  sheet('流程与规则', [
    { label: '① 计划：项目负责人提前 ≥6h 上报（R9），民警审核（R7 开关）' },
    { label: '② 出库：登记库管员签名 + 第二位库管员复核签名（双人双锁）后生效扣库存，实发 ≤计划量×105%（R3）' },
    { label: '③ 押运：扫码签收 → 人车路线 → 发车打点 → 在途轨迹（R6）' },
    { label: '④ 到场：安全员确认到达时间（R1 以安全员为准）· 逐项核量，差异必留证（R4）' },
    { label: '⑤ 爆破：监理登记三态结果，退库可跨日（R2 三量平衡）' },
    { label: '⑤\' 退库反向押送回销售库，库管员核销入库（E03）' },
    { label: '⑥ 核验：民警远程核验（Q2 无需到场），24h 内完成（R5）' },
    { label: '分级检查（R8）：<600kg 抽查；600–1200kg 工区警务室到场；>1200kg 治安大队到场' },
    { label: '开始演示：建议从「民警」审核 BBJH20261103001 走全流程' }
  ]);
}

/* ================= 项目负责人：首页 ================= */
PAGES['pm-home'] = {
  title: '作业计划',
  tabs: () => roleTabs('pm-home', 0),
  render(p) {
    const f = p.f || 'all';
    const ORDER = { '待监管签字': 0.5, '待负责人审核': 0.6, '待审核': 1, '已驳回': 2, '待出库': 3, '待运输': 3, '待发车': 3, '运输中': 4, '待接收': 4, '已到场': 5, '待退库': 6, '退库运输中': 6, '待核验': 7, '责令整改': 8, '已完成': 9, '已作废': 10 };
    let list = DB.plans.filter(x => x.applicant === 'P1' || true).slice().sort((a, b) => (ORDER[a.status] - ORDER[b.status]) || b.createdAt - a.createdAt);
    if (f === 'run') list = list.filter(x => ['待监管签字', '待负责人审核', '待审核', '已驳回', '待出库', '待运输', '待发车', '运输中', '待接收', '已到场', '待退库', '退库运输中', '待核验'].includes(x.status));
    if (f === 'done') list = list.filter(x => ['已完成', '已作废', '责令整改'].includes(x.status));
    const segs = [['all', '全部'], ['run', '进行中'], ['done', '已结束']];
    const pending = DB.plans.filter(x => x.status === '待负责人审核');
    return `
    <div class="page-title">作业计划管理<span class="page-sub">技术员上报 → 安全监管签字 → 负责人审核提交 → 民警审核</span></div>
    <button class="btn ${pending.length ? 'primary' : 'ghost'} block" onclick="nav.push('pm-review')">审核提交计划${pending.length ? `（${pending.length} 条待提交，须选库房与公安责任区）` : '（暂无待提交）'}</button>
    <div class="seg" style="margin-top:calc(var(--sc)*12px)">${segs.map(s => `<button type="button" class="seg-i ${f === s[0] ? 'on' : ''}" onclick="nav.reset('pm-home',{f:'${s[0]}'})">${s[1]}</button>`).join('')}</div>
    ${list.map(x => planCard(x, 'pmGoPlan')).join('') || EMPTY('暂无计划')}
    <div class="f-tip" onclick="nav.push('plan-logs',{id:'${list[0] ? list[0].id : ''}'})">⌁ 查看计划流程日志与台账导出（从计划详情进入）</div>`;
  }
};
function pmGoPlan(id) { nav.push('pm-plan-detail', { id }); }

/* ================= 测量技术员：首页 ================= */
PAGES['sv-home'] = {
  title: '计划填报',
  tabs: () => roleTabs('sv-home', 0),
  render() {
    const mine = DB.plans.filter(x => x.surveyor === 'P7' || x.status === '待监管签字');
    const todo = mine.filter(x => ['待监管签字', '已驳回'].includes(x.status));
    const signed = mine.filter(x => ['待负责人审核', '待审核', '待出库', '待运输', '待发车', '运输中', '待接收', '已到场', '待退库', '退库运输中', '待核验', '已完成'].includes(x.status));
    return `
    <div class="page-title">作业计划填报<span class="page-sub">作业点位测量报量 · 当日 24:00 前提交次日计划</span></div>
    <div class="card legend-card sm"><div class="lg-row"><b>上报流程</b><span>测量技术员填报 → 作业点安全监管签字 → 项目负责人审核提交（选出库库房与公安责任区）→ 民警审核。</span></div></div>
    <div class="sec-title">待处理（${todo.length}）</div>
    ${todo.length ? todo.map(x => planCard(x, 'svGoEdit')).join('') : EMPTY('暂无待填报/被驳回计划')}
    <div class="sec-title">已上报（${signed.length}）</div>
    ${signed.length ? signed.slice(0, 6).map(x => planCard(x, 'pmGoPlan')).join('') : EMPTY('暂无已上报计划')}
    <button class="btn primary block" onclick="nav.push('sv-plan-new')">＋ 填报次日计划</button>`;
  }
};
function svGoEdit(id) { nav.push('sv-plan-new', { edit: id }); }

/* ================= 测量技术员：填报计划 ================= */
PAGES['sv-plan-new'] = {
  title: '填报作业计划',
  render(p) {
    const st = window._formState = { photos: 0 };
    const editing = p.edit ? planById(p.edit) : null;
    const rejected = editing && editing.status === '已驳回';
    const items = editing ? editing.items : [{ goods: 'zy', spec: GOODS.zy.specs[0], qty: '' }, { goods: 'lg', spec: GOODS.lg.specs[0], qty: '' }];
    window._planDraft = { items };
    const last = DB.plans.filter(x => x.surveyor === 'P7' && x !== editing).slice(-1)[0];
    const tm = new Date(Date.now() + 24 * H);
    const minDT = new Date(tm.getFullYear(), tm.getMonth(), tm.getDate(), 0, 1);
    const min = `${minDT.getFullYear()}-${pad(minDT.getMonth() + 1)}-${pad(minDT.getDate())}T00:01`;
    const curArea = editing ? planArea(editing) : null;
    const curPr = editing ? project(editing.project) : null;
    const curSite = editing ? site(editing.site) : null;
    return `
    ${rejected ? `<div class="card warn-card sm"><div class="fc-title">民警驳回意见</div><p class="f-note">${esc(editing.auditRemark || '无')}</p><div class="f-note">请修改后重新上报，流程重新走安全监管签字。</div></div>` : ''}
    <div class="form-card">
      <div class="f-row"><label>所属工区</label><div class="f-select" id="f_area" data-v="${curArea ? curArea.id : ''}" onclick="pickArea()">${curArea ? esc(curArea.name) : '请选择工区'}</div></div>
      <div class="f-row"><label>所属项目</label><div class="f-select" id="f_project" data-v="${curPr ? curPr.id : ''}" onclick="pickProject()">${curPr ? esc(curPr.name) : '请选择'}</div></div>
      <div class="f-row"><label>作业点位</label><div class="f-select" id="f_site" data-v="${curSite ? curSite.id : ''}" onclick="pickSite()">${curSite ? esc(curSite.name) : '请选择（地图选点）'}</div></div>
      <div class="f-row"><label>计划爆破开始</label><input id="f_start" type="datetime-local" min="${min}"></div>
      <div class="f-row"><label>计划爆破结束</label><input id="f_end" type="datetime-local"></div>
      <div class="f-note">次日计划须于当日 24:00 前提交：作业日期必须为明天（系统按日历日校验）。</div>
    </div>
    <div class="form-card">
      <div class="fc-title">计划用量（现场测量报量）</div>
      <div id="plan-items">${items.map((it, i) => itemRow(it, i)).join('')}</div>
      <button class="btn ghost sm" onclick="addItemRow()">＋ 添加品种</button>
      <div class="f-note">分级规则：总量 &lt;600kg 公安抽查 · 600–1200kg 工区警务室到场 · &gt;1200kg 治安大队到场（R8）</div>
    </div>
    <div class="form-card">
      <div class="f-row"><label>现场安全员</label><div class="f-select" onclick="sheet('选择安全员', MASTER.persons.filter(p=>p.role==='安全员').map(p=>({label:p.name+' · '+p.cert})),x=>{})">赵铁柱 · GA-AQ-2024-103</div></div>
      <div class="f-row"><label>安全监理</label><div class="f-select" onclick="sheet('选择监理', MASTER.persons.filter(p=>p.role==='安全监理').map(p=>({label:p.name+' · '+p.cert})),x=>{})">李建国 · GA-JL-2023-052</div></div>
      <div class="f-row"><label>爆破设计书</label>${photoStrip(st, 'photos')}</div>
    </div>
    ${last && !editing ? `<div class="f-tip" onclick="reuseLastPlan()">⌁ 沿用上次计划（${esc(last.planNo)}）一键带出品种与用量</div>` : ''}
    <button class="btn primary block" onclick="submitSurveyForm(${editing ? `'${editing.id}'` : 'null'})">${rejected ? '修改后重新上报' : '提交计划（送安全监管签字）'}</button>`;
  }
};
function isTomorrow(ts) {
  const d = new Date(ts), n = new Date();
  const tm = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1);
  return d.getFullYear() === tm.getFullYear() && d.getMonth() === tm.getMonth() && d.getDate() === tm.getDate();
}
function submitSurveyForm(editId) {
  const areaId = $('#f_area').dataset.v;
  const projectId = $('#f_project').dataset.v, siteId = $('#f_site').dataset.v;
  const start = val('f_start'), end = val('f_end');
  if (!areaId) return toast('请选择所属工区（决定公安责任区）', false);
  if (!projectId || !siteId) return toast('请选择项目与作业点', false);
  const prObj = project(projectId);
  if (prObj.workarea && prObj.workarea !== areaId) return toast('所选项目不属于该工区，请重新选择', false);
  if (!start || !end) return toast('请填写计划爆破时间段', false);
  const st = new Date(start).getTime(), en = new Date(end).getTime();
  if (!isTomorrow(st)) return toast('次日计划须于当日 24:00 前提交：作业日期必须为明天（校验拦截）', false);
  if (en <= st) return toast('计划爆破结束须晚于开始时间', false);
  const items = [];
  document.querySelectorAll('.it-row').forEach(row => {
    const qty = parseFloat(row.querySelector('[data-qty]').value);
    if (qty > 0) items.push({ goods: row.querySelector('.f-sel').value, spec: row.querySelector('[data-spec]').value, qty });
  });
  if (!items.length) return toast('请填写计划用量', false);
  if (editId) {
    const old = planById(editId);
    Object.assign(old, { project: projectId, workarea: areaId, site: siteId, planStart: st, planEnd: en, items, status: '待监管签字', auditStatus: '', surveyor: 'P7' });
    pushMsg('安全监管', `计划 ${old.planNo} 已修改重新上报，待作业点安全监管签字。`);
    addLog(old, '计划', '测量技术员修改后重新上报', person('P7').name);
    toast('已重新上报，待安全监管签字', true);
  } else {
    const plan = {
      id: 'PL' + nextId('plan'), planNo: nextNo('BBJH', 'plan'), project: projectId, workarea: areaId, site: siteId,
      planStart: st, planEnd: en, items, officer: 'P3', supervisor: 'P2', applicant: 'P7', surveyor: 'P7',
      createdAt: Date.now(), status: '待监管签字', auditStatus: '',
      tier: tierOf(planKg(items)).level, exceptionFlag: false, remark: ''
    };
    DB.plans.push(plan);
    pushMsg('安全监管', `新计划 ${plan.planNo}（${site(plan.site).name}，${Math.round(planKg(items))}kg）待作业点安全监管签字。`);
    addLog(plan, '计划', `测量技术员现场测量上报（${items.map(i => goodsName(i.goods) + ' ' + i.qty).join('、')}）`, person('P7').name);
    toast(`已提交，单号 ${plan.planNo}，待安全监管签字`, true);
  }
  saveDB();
  nav.reset('sv-home');
}
function itemRow(it, i) {
  const g = GOODS[it.goods];
  return `<div class="it-row" data-i="${i}">
    <select class="f-sel" onchange="onItemGoods(this,${i})">${Object.keys(GOODS).map(k => `<option value="${k}" ${k === it.goods ? 'selected' : ''}>${GOODS[k].name}</option>`).join('')}</select>
    <select class="f-sel" data-spec>${g.specs.map(s => `<option ${s === it.spec ? 'selected' : ''}>${s}</option>`).join('')}</select>
    <input class="f-num" type="number" placeholder="0" value="${it.qty}" data-qty> <span class="f-unit">${g.unit}</span>
    <button class="it-del" aria-label="删除" type="button" onclick="this.closest('.it-row').remove()">✕</button>
  </div>`;
}
function addItemRow() {
  const tmp = document.createElement('div');
  tmp.innerHTML = itemRow({ goods: 'zy', spec: GOODS.zy.specs[0], qty: '' }, document.querySelectorAll('.it-row').length);
  $('#plan-items').appendChild(tmp.querySelector('.it-row'));
}
function onItemGoods(sel, i) {
  const row = sel.closest('.it-row');
  const specs = GOODS[sel.value].specs;
  row.querySelector('[data-spec]').innerHTML = specs.map(s => `<option>${s}</option>`).join('');
  row.querySelector('.f-unit').textContent = GOODS[sel.value].unit;
}
function reuseLastPlan() {
  const last = DB.plans.filter(x => x.surveyor === 'P7').slice(-1)[0];
  if (!last) return toast('暂无历史计划');
  $('#plan-items').innerHTML = last.items.map((it, i) => itemRow(it, i)).join('');
  toast('已沿用上次计划的品种与用量', true);
}
/* ================= 安全监管：首页 ================= */
PAGES['reg-home'] = {
  title: '签字放行',
  tabs: () => roleTabs('reg-home', 0),
  render() {
    const list = DB.plans.filter(x => x.status === '待监管签字');
    return `
    <div class="page-title">作业点安全监管<span class="page-sub">技术员上报计划 · 签字后方推项目负责人</span></div>
    <div class="sec-title">待签字（${list.length}）</div>
    ${list.length ? list.map(x => planCard(x, 'regGoSign')).join('') : EMPTY('暂无待签字计划')}
    <div class="f-note center">签字要求：核对测量报量与作业点实况，确认无误后手签放行。</div>`;
  }
};
function regGoSign(id) { nav.push('reg-sign', { id }); }

/* ================= 安全监管：签字页 ================= */
PAGES['reg-sign'] = {
  title: '安全监管签字',
  render(p) {
    const pl = planById(p.id);
    if (!pl || pl.status !== '待监管签字') return EMPTY('该计划不在待签字状态') + `<button class="btn ghost block" onclick="nav.back()">返回</button>`;
    window._formState = { sign: false };
    const kg = Math.round(planKg(pl.items));
    return `
    <div class="head-card sm">
      <div class="hc-no">${esc(pl.planNo)}</div>
      <div class="hc-name">${esc(site(pl.site).name)}</div>
      <div class="hc-sub">${esc(project(pl.project).name)} · 计划量 ${kg}kg · 计划爆破 ${fmtFull(pl.planStart)}</div>
    </div>
    <div class="card">
      <div class="fc-title">上报明细核对</div>
      ${pl.items.map(it => `<div class="kv"><span>${esc(goodsName(it.goods))} · ${esc(it.spec)}</span><b>${it.qty} ${esc(GOODS[it.goods].unit)}</b></div>`).join('')}
      ${pl.remark ? `<p class="f-note">${esc(pl.remark)}</p>` : ''}
    </div>
    <div class="form-card">
      <div class="fc-title">安全监管意见与签字（签字后才推送项目负责人）</div>
      <textarea id="rg_op" class="f-ta" placeholder="核对意见（选填）"></textarea>
      <div class="sign-box"><canvas id="sign_cv" width="600" height="200"></canvas>
        <div style="display:flex;gap:8px;margin-top:6px">
          <button class="btn ghost sm" onclick="clearSign('sign_cv',window._formState,'sign')">清除</button>
          <button class="btn ghost sm" onclick="demoSign('sign_cv',window._formState,'sign')">演示快速签名（郑 安）</button>
        </div></div>
    </div>
    <button class="btn primary block" onclick="doRegSign('${pl.id}')">签字放行 · 推送项目负责人</button>`;
  },
  after() { initSign('sign_cv', window._formState, 'sign'); }
};
function doRegSign(planId) {
  if (!window._formState.sign) return toast('请安全监管手写签名后放行', false);
  const pl = planById(planId);
  pl.regRemark = val('rg_op').trim();
  supervisorSignPlan(planId);
  saveDB();
  toast(`已签字放行，${pl.planNo} 推送项目负责人审核`, true);
  nav.reset('reg-home');
}

/* ================= 项目负责人：审核提交（F3/F4）================= */
PAGES['pm-review'] = {
  title: '审核提交',
  render() {
    const list = DB.plans.filter(x => x.status === '待负责人审核');
    return `
    <div class="page-title">审核提交计划<span class="page-sub">汇总技术员上报 · 选出库库房与公安责任区（F4）</span></div>
    ${list.length ? list.map(x => planCard(x, 'pmGoReview')).join('') : EMPTY('暂无待审核提交的计划')}
    <div class="f-note center">提交后计划进入对应公安责任区责任民警待办；次日计划须当日 24:00 前完成提交。</div>`;
  }
};
function pmGoReview(id) { nav.push('pm-review-form', { id }); }

PAGES['pm-review-form'] = {
  title: '审核提交',
  render(p) {
    const pl = planById(p.id);
    if (!pl || pl.status !== '待负责人审核') return EMPTY('该计划不在待审核提交状态') + `<button class="btn ghost block" onclick="nav.back()">返回</button>`;
    const kg = Math.round(planKg(pl.items));
    const t = tierOf(planKg(pl.items));
    const wa = planArea(pl);
    return `
    <div class="head-card sm">
      <div class="hc-top">${statusPill(pl.status)}<span class="lvb ${t.cls}">${esc(t.level)}</span></div>
      <div class="hc-no">${esc(pl.planNo)}</div>
      <div class="hc-name">${esc(site(pl.site).name)}</div>
      <div class="hc-sub">${esc(project(pl.project).name)} · 计划量 ${kg}kg</div>
      <div class="hc-time">计划爆破 ${fmtFull(pl.planStart)} ~ ${fmtFull(pl.planEnd)}</div>
    </div>
    <div class="card">
      <div class="fc-title">上报链路核验</div>
      <div class="kv"><span>测量技术员</span><b>${esc(person(pl.surveyor || 'P7').name)}（已上报）</b></div>
      <div class="kv"><span>安全监管</span><b>${esc(person(pl.regSign.by).name)} · ${fmtTime(pl.regSign.time)} 已签字</b></div>
      ${pl.regRemark ? `<p class="f-note">${esc(pl.regRemark)}</p>` : ''}
    </div>
    <div class="form-card">
      <div class="fc-title">出库与责任区（提交前必选）</div>
      <div class="f-row"><label>出库库房</label><div class="f-select" id="rv_storage" data-v="" onclick="pickOutStorage()">请选择出库库房</div></div>
      <div class="f-row"><label>公安责任区</label><div class="f-select" id="rv_area" data-v="${wa.id}" onclick="pickAuditArea()">${esc(wa.name)} · 责任民警 ${esc(person(wa.police).name)}</div></div>
      <div class="f-note">公安责任区决定审核民警与分级检查到场单位；默认取作业点所属工区，可调整。</div>
    </div>
    <div class="form-card">
      <div class="fc-title">计划用量明细</div>
      ${pl.items.map(it => `<div class="kv"><span>${esc(goodsName(it.goods))} · ${esc(it.spec)}</span><b>${it.qty} ${esc(GOODS[it.goods].unit)}</b></div>`).join('')}
      <div class="kv"><span>现场安全员 / 监理</span><b>${esc(person(pl.officer).name)} / ${esc(person(pl.supervisor).name)}</b></div>
    </div>
    <button class="btn primary block" onclick="submitPmReview('${pl.id}')">审核提交（送公安责任区民警审核）</button>`;
  }
};
function pickOutStorage() {
  const list = MASTER.storages.filter(s => s.type === '销售库');
  sheet('选择出库库房', list.map(s => ({ label: `${s.name} · ${s.type}`, id: s.id })), x => {
    const el = $('#rv_storage');
    el.textContent = x.label.split(' · ')[0];
    el.dataset.v = x.id;
  });
}
function pickAuditArea() {
  sheet('选择公安责任区', MASTER.workareas.map(w => ({ label: `${w.name} · 责任民警 ${person(w.police).name}`, id: w.id })), x => {
    const el = $('#rv_area');
    el.textContent = x.label.split(' · ')[0];
    el.dataset.v = x.id;
  });
}
function submitPmReview(planId) {
  const pl = planById(planId);
  const sid = $('#rv_storage').dataset.v, aid = $('#rv_area').dataset.v;
  if (!sid) return toast('请选择出库库房', false);
  if (!aid) return toast('请选择公安责任区', false);
  if (!isTomorrow(pl.planStart)) return toast('次日计划须于当日 24:00 前提交，该计划作业日已过期，请退回技术员重新填报', false);
  pl.outStorage = sid; pl.auditArea = aid;
  if (pl.workarea !== aid) pl.workarea = aid; // 公安责任区即路由区域：待办/统计/检查均按该区收敛
  submitPlanAudit(pl);
  pushMsg('测量技术员', `计划 ${pl.planNo} 已由项目负责人审核提交至公安审核。`);
  saveDB();
  toast(`已提交公安审核，责任民警 ${person(planArea(pl).police).name}`, true);
  nav.reset('pm-home');
}
function pickArea() {
  sheet('选择所属工区', MASTER.workareas.map(w => ({ label: `${w.name} · 责任民警 ${person(w.police).name}`, id: w.id })), x => {
    const el = $('#f_area');
    el.textContent = x.label.split(' · ')[0];
    el.dataset.v = x.id;
    const pj = $('#f_project'), st = $('#f_site');
    pj.textContent = '请选择'; pj.dataset.v = '';
    st.textContent = '请选择（地图选点）'; st.dataset.v = '';
  });
}
function pickProject() {
  const aid = $('#f_area').dataset.v;
  if (!aid) return toast('请先选择所属工区', false);
  const list = MASTER.projects.filter(pr => !pr.workarea || pr.workarea === aid);
  if (!list.length) return toast('该工区暂无在册项目', false);
  sheet('选择项目', list.map(pr => ({ label: `${pr.name}（${pr.area}）`, id: pr.id })), (x, i) => {
    $('#f_project').textContent = x.label.split('（')[0];
    $('#f_project').dataset.v = x.id;
    const st = $('#f_site');
    st.textContent = '请选择（地图选点）';
    st.dataset.v = '';
  });
}
function pickSite() {
  const pid = $('#f_project').dataset.v;
  const sites = MASTER.sites.filter(s => !pid || s.project === pid);
  sheet('选择作业点（示意）', sites.map(s => ({ label: `${s.name} · 围栏${s.fence}m · 历史爆破${s.hist}次`, id: s.id })), x => {
    $('#f_site').textContent = x.label.split(' · ')[0];
    $('#f_site').dataset.v = x.id;
  });
}

/* ================= 项目负责人：计划详情 ================= */
PAGES['pm-plan-detail'] = {
  title: '计划详情',
  render(p) {
    const pl = planById(p.id);
    if (!pl) return EMPTY('计划不存在');
    const kg = Math.round(planKg(pl.items));
    const t = tierOf(planKg(pl.items));
    let act = '';
    if (pl.status === '待负责人审核') act = `<button class="btn primary block" onclick="nav.push('pm-review-form',{id:'${pl.id}'})">审核提交（选库房/公安责任区）</button>`;
    if (pl.status === '待监管签字') act = `<div class="ok-strip">测量技术员已上报，待作业点安全监管 ${esc(person('P8').name)} 签字后推送</div>`;
    if (pl.status === '待审核') act = `<button class="btn ghost block" onclick="withdrawPlan('${pl.id}')">撤回计划</button>`;
    if (pl.status === '已驳回') act = `<button class="btn primary block" onclick="nav.push('sv-plan-new',{edit:'${pl.id}'})">退回测量技术员 · 修改重新上报</button>`;
    if (['待运输', '待发车', '运输中', '待接收', '已到场'].includes(pl.status))
      act = `<button class="btn ghost block" onclick="planChange('${pl.id}')">已出库 · 提交变更申请</button>`;
    return `
    <div class="head-card">
      <div class="hc-top">${statusPill(pl.status)}<span class="lvb ${t.cls}">${esc(t.level)}</span></div>
      <div class="hc-no">${esc(pl.planNo)}</div>
      <div class="hc-name">${esc(site(pl.site).name)}</div>
      <div class="hc-sub">${esc(project(pl.project).name)} · 计划量 ${kg}kg（雷管按当量折算）</div>
      <div class="hc-sub">${pl.surveyor ? `上报：${esc(person(pl.surveyor).name)}（技术员） → ${esc(person(pl.regSign ? pl.regSign.by : 'P8').name)}（监管签字${pl.regSign ? ' ✓' : ' 待签'}） → ${esc(person(pl.applicant).name)}（审核提交）` : `所属工区：${esc(planArea(pl).name)} · 审核民警 ${esc(person(planArea(pl).police).name)}`}</div>
      ${pl.outStorage || pl.auditArea ? `<div class="hc-sub">出库库房：${esc(storage(pl.outStorage || 'S1').name)} · 公安责任区：${esc(workarea(pl.auditArea || pl.workarea).name)}</div>` : ''}
      <div class="hc-time">计划爆破 ${fmtFull(pl.planStart)} ~ ${fmtFull(pl.planEnd)}</div>
    </div>
    ${timelineHTML(pl)}
    <div class="card">
      <div class="fc-title">计划用量明细</div>
      ${pl.items.map(it => `<div class="kv"><span>${esc(goodsName(it.goods))} · ${esc(it.spec)}</span><b>${it.qty} ${esc(GOODS[it.goods].unit)}</b></div>`).join('')}
      <div class="kv"><span>现场安全员</span><b>${esc(person(pl.officer).name)}</b></div>
      <div class="kv"><span>安全监理</span><b>${esc(person(pl.supervisor).name)}</b></div>
    </div>
    ${pl.auditRemark ? `<div class="card"><div class="fc-title">审核意见</div><p class="f-note">${esc(pl.auditRemark)}</p></div>` : ''}
    ${act}
    <button class="btn ghost block" onclick="nav.push('plan-logs',{id:'${pl.id}'})">流程日志 · 按模板导出台账文件</button>`;
  }
};

/* ================= 共享：流程日志与台账导出（F5）================= */
PAGES['plan-logs'] = {
  title: '流程日志',
  render(p) {
    const pl = planById(p.id);
    if (!pl) return EMPTY('计划不存在');
    const logs = planLogs(p.id);
    return `
    <div class="head-card sm">
      <div class="hc-no">${esc(pl.planNo)}</div>
      <div class="hc-name">${esc(site(pl.site).name)}</div>
      <div class="hc-sub">全流程留痕 ${logs.length} 条 · 与六节点数据同源（F5）</div>
    </div>
    ${logs.length ? logs.map(l => `<div class="card sm">
      <div class="kv"><span><b>${esc(NODE_LABEL[l.node] || l.node)}</b> · ${esc(l.who)}</span><time class="pc-time">${fmtFull(l.time)}</time></div>
      <p class="f-note">${esc(l.action)}</p>
    </div>`).join('') : EMPTY('暂无日志')}
    <button class="btn primary block" onclick="exportPlanLogs('${pl.id}')">按模板生成台账文件（下载）</button>
    <div class="f-note center">模板：计划上报 / 出库 / 押运运输 / 到场接收 / 爆破作业 / 退库销毁 / 民警核验 / 公安检查 分节留痕</div>`;
  }
};
function exportPlanLogs(id) {
  const pl = planById(id);
  const logs = planLogs(id).slice().reverse();
  const nodes = {};
  logs.forEach(l => { (nodes[l.node] = nodes[l.node] || []).push(l); });
  let txt = `民爆“最后一公里”作业流程台账\n══════════════════════════\n计划单号：${pl.planNo}\n作业点位：${site(pl.site).name}\n所属项目：${project(pl.project).name}\n计划爆破：${fmtFull(pl.planStart)} ~ ${fmtFull(pl.planEnd)}\n出库库房：${storage(pl.outStorage || 'S1').name} · 公安责任区：${workarea(pl.auditArea || pl.workarea).name}\n生成时间：${fmtFull(Date.now())}\n`;
  ['计划', '出库', '运输', '到场', '爆破', '退库', '核验', '检查'].forEach(nd => {
    if (nodes[nd] && nodes[nd].length) {
      txt += `\n【${NODE_LABEL[nd] || nd}】\n`;
      nodes[nd].forEach(l => { txt += `  ${fmtFull(l.time)}  ${l.who}  ${l.action}\n`; });
    }
  });
  txt += `\n—— 共 ${logs.length} 条留痕记录，与小程序六节点数据同源 ——\n`;
  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${pl.planNo}流程台账.txt`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  toast('台账文件已按模板生成并下载', true);
}
function withdrawPlan(id) {
  confirmSheet('撤回计划', '撤回后计划作废，需重新上报。确定撤回？', () => {
    const pl = planById(id); pl.status = '已作废';
    pushMsg('民警', `【${planArea(pl).name}】计划 ${pl.planNo} 已由项目负责人撤回作废。`, planArea(pl).id);
    saveDB(); toast('已撤回', true); nav.back();
  }, '撤回', true);
}
function planChange(id) {
  formSheet('变更申请（已出库）', `<textarea id="chg_reason" class="f-ta" placeholder="说明变更内容（作业点/用量/时间），提交后自动通知辖区民警审核"></textarea>`, mask => {
    const r = mask.querySelector('#chg_reason').value.trim();
    if (!r) { toast('请填写变更原因', false); return; }
    pushMsg('民警', `计划 ${planById(id).planNo} 提交变更申请：${r}`);
    saveDB(); toast('变更申请已提交，等待民警审核', true);
  });
}

/* ================= 库管员：首页 ================= */
PAGES['keeper-home'] = {
  title: '出库与台账',
  tabs: () => roleTabs('keeper-home', 0),
  render(p) {
    const f = p.f || 'ready';
    const pending = DB.outbounds.filter(o => o.status === '待复核');
    const ready = DB.plans.filter(x => x.status === '待出库').filter(x => (outboundByPlan(x.id) || {}).status !== '待复核');
    const outs = DB.outbounds;
    const rets = DB.returns.filter(r => r.status === '待入库确认');
    const st = MASTER.storages.find(s => s.id === 'S1');
    let body = '';
    if (f === 'ready') body = (ready.length ? ready.map(x => `<div class="card plan-card">
        <div class="pc-top"><span class="pc-no">${esc(x.planNo)}</span>${statusPill(x.status)}</div>
        <div class="pc-name">${esc(site(x.site).name)}</div>
        <div class="pc-sub">${esc(project(x.project).name)} · 计划量 ${Math.round(planKg(x.items))}kg ${levelBadge(x)}<span class="pc-area">${esc(planArea(x).name)}</span></div>
        <div class="pc-time">计划爆破 ${fmtTime(x.planStart)} ~ ${fmtTime(x.planEnd)}</div>
      </div>`).join('') + (ready.length ? `<button class="btn primary block" onclick="nav.push('keeper-out-new')">出库登记 · 可勾选多个计划合并一车</button>` : '')
      : EMPTY('暂无审核通过的待出库计划'));
    if (f === 'review') body = pending.length ? pending.map(o => {
      const pl = planById(o.plan);
      return `<div class="card plan-card" onclick="nav.push('keeper-out-confirm',{id:'${o.id}'})">
        <div class="pc-top"><span class="pc-no">${esc(o.outNo)}</span>${statusPill(o.status)}</div>
        <div class="pc-name">复核签名 → ${esc(site(pl.site).name)}</div>
        <div class="pc-sub">登记库管员 ${esc(person(o.keeper).name)} · 出库 ${fmtTime(o.outTime)} · 待第二位库管员复核</div></div>`;
    }).join('') : EMPTY('暂无待复核出库单');
    if (f === 'out') body = outs.length ? outs.map(o => {
      const pl = planById(o.plan);
      return `<div class="card plan-card" onclick="nav.push('keeper-out-detail',{id:'${o.id}'})">
        <div class="pc-top"><span class="pc-no">${esc(o.outNo)}</span>${statusPill(o.status)}</div>
        <div class="pc-name">${esc(pl ? site(pl.site).name : '')}</div>
        <div class="pc-sub">出库 ${fmtTime(o.outTime)} · ${o.items.length} 个批次</div></div>`;
    }).join('') : EMPTY('暂无出库单');
    if (f === 'ret') body = rets.length ? rets.map(r => {
      const pl = planById(r.plan);
      return `<div class="card plan-card" onclick="keeperConfirmReturn('${r.id}')">
        <div class="pc-top"><span class="pc-no">${esc(r.retNo)}</span>${statusPill(r.status)}</div>
        <div class="pc-name">${esc(r.retNo)} · 反向押送到库</div>
        <div class="pc-sub">来源作业点 ${esc(site(pl.site).name)} · ${r.items.length} 项待核销</div></div>`;
    }).join('') : EMPTY('暂无待入库确认的退库单');
    return `
    <div class="stock-strip">
      <div class="ss-t">城西销售库 · 实时存量</div>
      <div class="ss-chips">
        <span class="ss-chip">炸药 ${Object.values(st.stock.zy).reduce((a, b) => a + b, 0)}kg</span>
        <span class="ss-chip">雷管 ${Object.values(st.stock.lg).reduce((a, b) => a + b, 0)}发</span>
        <span class="ss-chip">导爆索 ${Object.values(st.stock.db || {}).reduce((a, b) => a + b, 0)}m</span>
        <span class="ss-more" onclick="nav.push('keeper-stock')">台账 →</span>
      </div>
    </div>
    <div class="seg">
      <button type="button" class="seg-i ${f === 'ready' ? 'on' : ''}" onclick="nav.reset('keeper-home',{f:'ready'})">待出库 ${ready.length || ''}</button>
      <button type="button" class="seg-i ${f === 'review' ? 'on' : ''}" onclick="nav.reset('keeper-home',{f:'review'})">待复核 ${pending.length || ''}</button>
      <button type="button" class="seg-i ${f === 'out' ? 'on' : ''}" onclick="nav.reset('keeper-home',{f:'out'})">出库单 ${outs.length}</button>
      <button type="button" class="seg-i ${f === 'ret' ? 'on' : ''}" onclick="nav.reset('keeper-home',{f:'ret'})">退库核销 ${rets.length || ''}</button>
    </div>
    ${body}
    <div class="f-tip" onclick="nav.push('keeper-daily')">⌁ 日常出入库维护（采购入库 / 移库 / 盘点调整 J05）</div>`;
  }
};
/* ================= 库管员：出库单创建（一单多点，可合并多个计划）================= */
PAGES['keeper-out-new'] = {
  title: '出库登记',
  render(p) {
    const ready = DB.plans.filter(x => x.status === '待出库' && !outboundByPlan(x.id));
    if (!ready.length) return EMPTY('暂无审核通过的待出库计划') + `<button class="btn ghost block" onclick="nav.back()">返回</button>`;
    const st = MASTER.storages.find(s => s.id === 'S1');
    window._formState = { sign: false };
    const totalKg = Math.round(ready.reduce((s, x) => s + planKg(x.items), 0));
    return `
    <div class="head-card sm">
      <div class="hc-no">从 城西销售库 发出</div>
      <div class="hc-name">出库登记 · 一单可覆盖多个作业点</div>
      <div class="hc-sub">勾选本次装车的计划（可合并），按作业点拆分明细；合并总重 ${totalKg}kg（勾选实时累计），签收时将校验车辆载重</div>
    </div>
    ${ready.map((pl, i) => {
      const checked = i === 0 ? 'checked' : '';
      return `<div class="form-card out-plan" id="op_${i}">
      <div class="fc-title"><label style="display:flex;align-items:center;gap:6px"><input type="checkbox" id="os_${i}" ${checked} onchange="toggleOutPlan(${i})"> ${esc(pl.planNo)} · ${esc(site(pl.site).name)}（${Math.round(planKg(pl.items))}kg）</label></div>
      ${pl.items.map((it, j) => {
        const stockQty = (st.stock[it.goods] && st.stock[it.goods][it.spec]) || 0;
        return `<div class="out-item" style="opacity:${checked ? 1 : 0.45}">
          <div class="oi-name">${esc(goodsName(it.goods))} · ${esc(it.spec)}</div>
          <div class="oi-line">计划 <b>${it.qty}</b> ${esc(GOODS[it.goods].unit)} · 库存 <b>${stockQty}</b></div>
          <div class="oi-edit">
            <span>实发</span><input type="number" id="oq_${i}_${j}" value="${it.qty}" data-max="${Math.floor(it.qty * 1.05)}">
            <span class="f-unit">${esc(GOODS[it.goods].unit)}</span>
          </div>
          <div class="oi-edit"><span>批次号</span><input id="ob_${i}_${j}" value="ZY-2026-B${210 + i * 3 + j}"></div>
        </div>`;
      }).join('')}
      <div class="f-note">实发 ≤ 计划×105%（R3）；超出须民警线上审批。</div>
    </div>`;
    }).join('')}
    <div class="form-card">
      <div class="fc-title">出库时间与登记签名（B03）· 双人双锁：登记 + 复核</div>
      <div class="kv"><span>出库时间（系统）</span><b id="ot_now">${fmtFull(Date.now())}</b></div>
      <div class="kv"><span>登记库管员</span><b>${esc(person(DB.keeperId || 'P4').name)}（当前登录）</b></div>
      <div class="kv"><span>勾选合计</span><b id="out_total">${totalKg}kg · ${ready.length} 个作业点</b></div>
      <div class="sign-box"><canvas id="sign_cv" width="600" height="200"></canvas>
        <div style="display:flex;gap:8px;margin-top:6px">
          <button class="btn ghost sm" onclick="clearSign('sign_cv',window._formState,'sign')">清除</button>
          <button class="btn ghost sm" onclick="demoSign('sign_cv',window._formState,'sign')">演示快速签名</button>
        </div></div>
      <div class="f-note">提交后出库单为「待复核」，须由第二位库管员（吴秀英）复核签名后方生效并扣减库存。</div>
    </div>
    <button class="btn primary block" onclick="submitOutbound()">提交出库登记</button>`;
  },
  after() { initSign('sign_cv', window._formState, 'sign'); }
};
function toggleOutPlan(i) {
  const on = document.getElementById('os_' + i).checked;
  const card = document.getElementById('op_' + i);
  card.querySelectorAll('.out-item').forEach(el => el.style.opacity = on ? 1 : 0.45);
  recalcOutTotal();
}
function recalcOutTotal() {
  const ready = DB.plans.filter(x => x.status === '待出库' && !outboundByPlan(x.id));
  let kg = 0, n = 0;
  ready.forEach((pl, i) => {
    if (!document.getElementById('os_' + i) || !document.getElementById('os_' + i).checked) return;
    n++; kg += pl.items.reduce((s, it, j) => s + (parseFloat(val('oq_' + i + '_' + j)) || 0) * (GOODS[it.goods] ? GOODS[it.goods].ratio : 1), 0);
  });
  const el = document.getElementById('out_total');
  if (el) el.textContent = `${Math.round(kg)}kg · ${n} 个作业点`;
}
function submitOutbound() {
  const ready = DB.plans.filter(x => x.status === '待出库' && !outboundByPlan(x.id));
  const st = MASTER.storages.find(s => s.id === 'S1');
  const groups = [];
  let bad = null, noSel = true;
  ready.forEach((pl, i) => {
    if (!document.getElementById('os_' + i).checked) return;
    noSel = false;
    const items = [];
    pl.items.forEach((it, j) => {
      const q = parseFloat(val('oq_' + i + '_' + j));
      if (!(q > 0)) bad = it;
      if (q > Math.floor(it.qty * 1.05)) bad = it;
      items.push({ goods: it.goods, spec: it.spec, qty: q, batch: val('ob_' + i + '_' + j) });
    });
    groups.push({ plan: pl.id, site: pl.site, items });
  });
  if (noSel) return toast('请至少勾选 1 个计划', false);
  if (!window._formState.sign) return toast('请登记库管员手写签名', false);
  if (bad) return toast(`「${goodsName(bad.goods)}」实发超计划 105%，需民警线上审批后放行（R3 拦截）`, false);
  // 累计重量与库存校验（多计划合计不得超过库存）
  const need = {};
  groups.forEach(g => g.items.forEach(it => { const k = it.goods + '|' + it.spec; need[k] = (need[k] || 0) + it.qty; }));
  for (const k of Object.keys(need)) {
    const [g, sp] = k.split('|');
    const stockQty = (st.stock[g] && st.stock[g][sp]) || 0;
    if (need[k] > stockQty) return toast(`「${goodsName(g)} · ${sp}」合并需求 ${need[k]} 超库存 ${stockQty}`, false);
  }
  const out = createOutbound(groups, DB.keeperId || 'P4');
  saveDB();
  toast(`出库单 ${out.outNo} 已登记（${groups.length} 个作业点），待第二位库管员复核签名`, true);
  nav.reset('keeper-home', { f: 'review' });
}

/* ================= 库管员：出库复核签名（双人双锁第二步）================= */
PAGES['keeper-out-confirm'] = {
  title: '出库复核',
  render(p) {
    const o = outboundById(p.id);
    const pl = planById(o.plan);
    const me = DB.keeperId || 'P4';
    window._formState = { sign2: false };
    return `
    <div class="head-card sm">
      <div class="hc-no">${esc(o.outNo)}</div>
      <div class="hc-name">${esc(site(pl.site).name)}</div>
      <div class="hc-sub">计划 ${esc(pl.planNo)} · 登记库管员 ${esc(person(o.keeper).name)}</div>
    </div>
    <div class="form-card">
      <div class="fc-title">出库明细（按作业点 · 合并 ${outGroups(o).length > 1 ? outGroups(o).length + ' 个计划 · 合计 ' + Math.round(planKg(o.items)) + 'kg' : '单计划'}）</div>
      ${outGroups(o).map(g => `<div class="fc-title" style="margin-top:6px">${esc(site(g.site).name)} · ${esc(planById(g.plan).planNo)}</div>` + g.items.map(it => `<div class="kv"><span>${esc(goodsName(it.goods))} · ${esc(it.spec)}<i class="batch">${esc(it.batch)}</i></span><b>${it.qty} ${esc(GOODS[it.goods].unit)}</b></div>`).join('')).join('')}
      <div class="kv"><span>登记签名</span><b>${esc(person(o.keeper).name)} · ${fmtFull(o.signs[0] ? o.signs[0].time : o.outTime)}</b></div>
    </div>
    <div class="form-card">
      <div class="fc-title">复核签名（第二位库管员）· 双人双锁</div>
      <div class="kv"><span>当前登录</span><b>${esc(person(me).name)}</b></div>
      <div class="sign-box"><canvas id="sign2_cv" width="600" height="200"></canvas>
        <div style="display:flex;gap:8px;margin-top:6px">
          <button class="btn ghost sm" onclick="clearSign('sign2_cv',window._formState,'sign2')">清除</button>
          <button class="btn ghost sm" onclick="demoSign('sign2_cv',window._formState,'sign2')">演示快速签名</button>
        </div></div>
      <div class="f-note">复核通过后出库单生效：库存扣减、推送押运员签收；登记与复核须为不同库管员。</div>
    </div>
    <button class="btn primary block" onclick="submitOutConfirm('${o.id}')">复核签名确认 · 出库生效</button>`;
  },
  after() { initSign('sign2_cv', window._formState, 'sign2'); }
};
function submitOutConfirm(outId) {
  const o = outboundById(outId);
  const me = DB.keeperId || 'P4';
  if (me === o.keeper) return toast('登记与复核须为不同库管员（双人双锁），请切换身份后复核', false);
  if (!window._formState.sign2) return toast('请复核库管员手写签名', false);
  confirmOutbound(o, me);
  saveDB();
  toast(`出库单 ${o.outNo} 双人签名生效，库存已扣减`, true);
  nav.reset('keeper-home', { f: 'out' });
}

/* ================= 库管员：出库单详情（联单）================= */
PAGES['keeper-out-detail'] = {
  title: '出库联单',
  render(p) {
    const o = outboundById(p.id);
    const pl = planById(o.plan);
    const tr = transportByPlan(o.plan, 'GO');
    return `
    <div class="card qr-card">
      ${qrSVG(o.outNo)}
      <div class="qr-no">${esc(o.outNo)}</div>
      <div class="qr-tip">押运员扫码签收（C01）· ${o.signed ? '已签收 ' + fmtTime(o.signTime) : (o.status === '待复核' ? '待复核签名，未生效' : '待签收')}</div>
    </div>
    <div class="card">
      <div class="fc-title">出库明细（按作业点 · ${outGroups(o).length > 1 ? '合并 ' + outGroups(o).length + ' 个计划 · 合计 ' + Math.round(planKg(o.items)) + 'kg' : '单计划'}）</div>
      ${outGroups(o).map(g => `<div class="fc-title" style="margin-top:6px">${esc(site(g.site).name)} · ${esc(planById(g.plan).planNo)}</div>` + g.items.map(it => `<div class="kv"><span>${esc(goodsName(it.goods))} · ${esc(it.spec)}<i class="batch">${esc(it.batch)}</i></span><b>${it.qty} ${esc(GOODS[it.goods].unit)}</b></div>`).join('')).join('')}
      <div class="kv"><span>出库库房</span><b>${esc(storage(o.storage).name)}</b></div>
      ${(o.signs && o.signs.length ? o.signs : [{ by: o.keeper, time: o.signTime || o.outTime }]).map((s, i) => `<div class="kv"><span>${i === 0 ? '登记库管员（签名）' : '复核库管员（签名）'}</span><b>${esc(person(s.by).name)} · ${fmtFull(s.time)}</b></div>`).join('')}
      <div class="kv"><span>出库时间</span><b>${fmtFull(o.effTime || o.outTime)}</b></div>
      ${tr ? `<div class="kv"><span>押运</span><b>${esc(person(tr.escort).name)} · ${esc(vehicle(tr.vehicle).plate)}</b></div>
      ${tr.stops ? `<div class="kv"><span>卸货点（${tr.stops.length}）</span><b>${tr.stops.map(s => esc(site(s.site).name)).join(' → ')}</b></div>` : ''}` : ''}
    </div>
    <div class="f-note center">联单可下载 PDF（B05）· 数据同步俯瞰大屏（G08）</div>`;
  }
};

/* ================= 库管员：库存台账 ================= */
PAGES['keeper-stock'] = {
  title: '库存台账',
  render(p) {
    const sid = p.sid || 'S1';
    const st = MASTER.storages.find(s => s.id === sid);
    const rows = [];
    ['zy', 'lg', 'db'].forEach(g => {
      const specs = st.stock[g] || {};
      Object.keys(specs).forEach(sp => {
        const qty = specs[sp];
        const unsafe = st.safe[g] != null && qty < st.safe[g];
        rows.push({ g, sp, qty, unsafe, safe: st.safe[g] });
      });
    });
    return `
    <div class="seg">${MASTER.storages.map(s => `<button type="button" class="seg-i ${s.id === sid ? 'on' : ''}" onclick="nav.reset('keeper-stock',{sid:'${s.id}'})">${esc(s.name)}（${esc(s.type)}）</button>`).join('')}</div>
    <div class="card">
      <div class="fc-title">分品种规格存量（J04）· 行锁扣减，作业出库与日常出入库共账（R10）</div>
      ${rows.length ? rows.map(r => `<div class="kv ${r.unsafe ? 'warn' : ''}">
        <span>${esc(GOODS[r.g].name)} · ${esc(r.sp)}${r.unsafe ? ' <em>低于安全库存</em>' : ''}</span>
        <b>${r.qty} <i>${esc(GOODS[r.g].unit)}</i>${r.safe ? `<small> / 安全线 ${r.safe}</small>` : ''}</b>
      </div>`).join('') : EMPTY('该库暂无库存')}
    </div>
    <div class="f-tip" onclick="dailyStockOp('${sid}')">⌁ 日常出入库维护（J05）</div>`;
  }
};
function dailyStockOp(sid) {
  const st = MASTER.storages.find(s => s.id === sid);
  formSheet('日常出入库维护（J05）', `
    <div class="f-row"><label>单据类型</label><select id="d_type" class="f-sel w"><option>采购入库</option><option>盘盈调整</option><option>盘亏调整</option><option>移库（销售库→使用库）</option></select></div>
    <div class="f-row"><label>品种</label><select id="d_goods" class="f-sel w" onchange="document.getElementById('d_spec').innerHTML=GOODS[this.value].specs.map(s=>'<option>'+s+'</option>').join('')">${Object.keys(GOODS).map(k => `<option value="${k}">${GOODS[k].name}</option>`).join('')}</select></div>
    <div class="f-row"><label>规格</label><select id="d_spec" class="f-sel w"><option>2号岩石乳化炸药</option><option>膨化硝铵炸药</option></select></div>
    <div class="f-row"><label>数量（${esc(st.name)}）</label><input id="d_qty" type="number" class="f-sel w" placeholder="0"></div>
  `, mask => {
    const type = mask.querySelector('#d_type').value, g = mask.querySelector('#d_goods').value,
      spec = mask.querySelector('#d_spec').value, qty = parseFloat(mask.querySelector('#d_qty').value);
    if (!(qty > 0)) { toast('请填写数量', false); return; }
    if (!st.stock[g]) st.stock[g] = {};
    const delta = type === '盘亏调整' ? -qty : qty;
    st.stock[g][spec] = (st.stock[g][spec] || 0) + delta;
    saveDB();
    toast(`已登记「${type}」${qty}${GOODS[g].unit}，库存台账已更新`, true);
    nav.render();
  }, '登记并更新台账');
}

/* ================= 库管员：退库入库确认（E03）================= */
function keeperConfirmReturn(id) {
  const rt = byId(DB.returns, id);
  const pl = planById(rt.plan);
  confirmSheet('退库入库确认', `退库单 ${rt.retNo} · ${rt.items.map(i => goodsName(i.goods) + ' ' + i.qty + GOODS[i.goods].unit).join('、')}。确认按批次核销并入库存？`, () => {
    confirmReturn(rt, 'P4');
    saveDB();
    toast('已核销入库，库存已回加，退库链路闭环', true);
    nav.render();
  }, '确认入库');
}
