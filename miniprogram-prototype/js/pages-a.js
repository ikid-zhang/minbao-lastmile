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
      <div class="entry-badge">真实业务系统 · 后端已联通</div>
      <div class="entry-title">民爆"最后一公里"监管</div>
      <div class="entry-sub">计划 — 出库 — 运输 — 到场 — 爆破 — 退库 — 核验 全链真实闭环<br>基于统一后端服务实时持久化，支持各岗位协同流转</div>
    </div>
    <div class="entry-sec">企业侧角色</div>
    ${roleDefs.filter(x => x.g === '企业侧').map(card).join('')}
    <div class="entry-sec">公安侧角色</div>
    ${roleDefs.filter(x => x.g === '公安侧').map(card).join('')}
    <div class="entry-tip">提示：通过林安码统一登录鉴权，账号与权限复用林安码权限管理（甲方确认 Q18）。数据实时与服务端同步，库管员含登记/复核双人身份（双人双锁）。</div>`;
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
    return `<div class="page-title">消息通知<span class="page-sub">系统通知消息（甲方确认 Q16）· 当前角色：${esc(role)}</span></div>` +
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
      <div class="me-info"><b>${esc(u ? u.name : role)}</b><span>${esc(role)} · ${esc(u ? u.company : '')}${role === '民警' ? ' · ' + esc(curArea().name) : ''}</span><span>资格证 ${esc(u ? certOf(u) : '-')} · 有效期至 ${esc(u ? certExpireOf(u) : '-')}</span></div>
    </div>
    <div class="cell-group">
      <div class="cell" onclick="toEntry()"><span>切换岗位工作台</span><small>按岗位切换工作台视图</small></div>
      <div class="cell" onclick="confirmSheet('重置清空业务流水','将清空所有作业单据与流水并恢复系统空白初始状态，确定？',resetAll,'清空重置',true)">清空业务流水（重置初始状态）</div>
      <div class="cell" onclick="showFlowDoc()"><span>流程说明</span><small>六节点闭环 · 分级检查规则</small></div>
    </div>
    <div class="foot-note">林安码小程序 · 民爆"最后一公里"监管<br>设计依据《民爆最后一公里监管功能设计说明》V1.6 · 结合甲方需求澄清确认结论（2026-11-05）· 数据全链路实时驱动</div>`;
  },
  after() {}
};
function resetAll() { resetDB(); toast('业务流水已重置为空白状态', true); toEntry(); }

function showFlowDoc() {
  sheet('流程与规则', [
    { label: '① 计划：24:00 前提交次日计划 + 至少提前 6h（双规则同时生效 Q01）；民警审核（开关开启时，Q02）' },
    { label: '② 出库：登记库管员签名 + 第二位库管员复核签名（双人双锁，按身份证核验 Q05）后生效扣库存；实发严格按计划，不能超（Q03）' },
    { label: '③ 押运：扫码签收 → 人车路线 → 发车打点 → 在途轨迹（R6）' },
    { label: '④ 到场：安全员确认到达时间（R1 以安全员为准）· 逐项核量，差异必留证（R4）' },
    { label: '⑤ 爆破：监理登记三态结果，退库可跨日（R2 三量平衡）' },
    { label: '⑤\' 退库反向押送回销售库，库管员核销入库（E03）' },
    { label: '⑥ 核验：民警远程核验（Q2 无需到场），24h 内完成（R5）' },
    { label: '分级检查（R8）：<600kg 抽查；600–1200kg 工区警务室到场；>1200kg 治安大队到场' },
    { label: '操作指引：请从【测量技术员】填报次日计划开始，走通六节点全流程' }
  ]);
}

/* ================= 项目负责人：首页 ================= */
PAGES['pm-home'] = {
  title: '作业计划',
  tabs: () => roleTabs('pm-home', 0),
  render(p) {
    const f = p.f || 'all';
    const ORDER = { '待监管签字': 0.5, '待负责人审核': 0.6, '待审核': 1, '已驳回': 2, '待出库': 3, '待运输': 3, '待发车': 3, '运输中': 4, '待接收': 4, '已到场': 5, '待退库': 6, '退库运输中': 6, '待核验': 7, '责令整改': 8, '已完成': 9, '已作废': 10 };
    let list = DB.plans.slice().sort((a, b) => (ORDER[a.status] - ORDER[b.status]) || b.createdAt - a.createdAt);
    if (f === 'run') list = list.filter(x => ['待监管签字', '待负责人审核', '待审核', '已驳回', '待出库', '待运输', '待发车', '运输中', '待接收', '已到场', '待退库', '退库运输中', '待核验'].includes(x.status));
    if (f === 'done') list = list.filter(x => ['已完成', '已作废', '责令整改'].includes(x.status));
    const segs = [['all', '全部'], ['run', '进行中'], ['done', '已结束']];
    const pending = DB.plans.filter(x => x.status === '待负责人审核');
    /* 所辖作业点汇总：按作业日按天分组，每天独立汇总各点位 */
    const dsel = p.d || 'all';
    const RUN = ['待监管签字', '待负责人审核', '待审核', '已驳回', '待出库', '待运输', '待发车', '运输中', '待接收', '已到场', '待退库', '退库运输中', '待核验'];
    const scopeSites = ownerSites('P1');
    const pad2 = n => String(n).padStart(2, '0');
    const dayOf = ts => { const d = new Date(Number(ts) || 0); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
    const todayStr = dayOf(Date.now());
    const yestStr = dayOf(Date.now() - 86400000);
    const runPlans = DB.plans.filter(x => RUN.includes(x.status) && x.planStart);
    const allDays = Array.from(new Set(runPlans.map(x => dayOf(x.planStart)))).sort().reverse();
    const dayList = dsel === 'all' ? allDays : [dsel];
    const daySum = day => {
      const mine = runPlans.filter(x => dayOf(x.planStart) === day);
      const rows = scopeSites.map(s => {
        const ps = mine.filter(x => planSites(x).some(y => y.site === s.id));
        const kg = ps.reduce((sum, x) => {
          const sp = planSites(x).find(y => y.site === s.id);
          return sum + planKg((sp && sp.items) || []);
        }, 0);
        return { s, count: ps.length, kg: Math.round(kg), pend: ps.filter(x => x.status === '待负责人审核').length };
      });
      return { day, rows, n: rows.reduce((a, r) => a + r.count, 0), kg: rows.reduce((a, r) => a + r.kg, 0) };
    };
    const blocks = dayList.map(daySum);
    const grandN = blocks.reduce((a, b) => a + b.n, 0);
    const grandKg = blocks.reduce((a, b) => a + b.kg, 0);
    const dayLabel = d => d === todayStr ? '今天' : d === yestStr ? '昨天' : '';
    const wdText = d => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(d + 'T00:00:00').getDay()] || '';
    const blockHtml = b => `
      <div class="card">
        <div class="fc-title">${b.day.slice(5).replace('-', '/')} ${wdText(b.day)}${dayLabel(b.day) ? `<span style="color:var(--acc);font-weight:400;font-size:11px;margin-left:5px">${dayLabel(b.day)}</span>` : ''}<span style="float:right;font-weight:400;color:var(--ink2);font-size:11px">${b.n} 条 · ${b.kg} kg</span></div>
        ${b.n ? b.rows.filter(r => r.count).map(r => `<div class="kv"${r.pend ? ` style="cursor:pointer" onclick="pmGoSite('${r.s.id}')"` : ''}><span>${esc(r.s.name)}${r.pend ? `<em style="font-style:normal;color:var(--warn);font-size:11px;margin-left:4px">待核 ${r.pend}</em>` : ''}</span><b style="white-space:nowrap">${r.count} 条 · ${r.kg} kg${r.pend ? '<i style="font-style:normal;color:var(--acc);margin-left:5px">›</i>' : ''}</b></div>`).join('')
          : `<div class="f-note" style="padding:6px 0 2px">该作业日暂无所辖点位的进行中计划</div>`}
        ${b.n ? `<div class="kv" style="border-top:1px solid var(--rule);margin-top:6px;padding-top:8px"><span><b>${dayLabel(b.day) || '当日'}合计</b></span><b style="color:var(--acc)">${b.n} 条 · ${b.kg} kg</b></div>` : ''}
      </div>`;
    return `
    <div class="page-title">作业计划管理<span class="page-sub">技术员按点位上报 → 安全监管签字 → 负责人汇总核实并安排运输 → 民警审核</span></div>
    <div class="card">
      <div class="fc-title">按作业日筛选汇总</div>
      <div class="seg" style="margin-top:6px">
        <button type="button" class="seg-i ${dsel === 'all' ? 'on' : ''}" onclick="nav.reset('pm-home',{d:'all',f:'${f}'})">全部日期</button>
        <button type="button" class="seg-i ${dsel === todayStr ? 'on' : ''}" onclick="nav.reset('pm-home',{d:'${todayStr}',f:'${f}'})">今天</button>
        <button type="button" class="seg-i ${dsel === yestStr ? 'on' : ''}" onclick="nav.reset('pm-home',{d:'${yestStr}',f:'${f}'})">昨天</button>
      </div>
      <div class="f-row" style="margin-top:8px"><label>指定日期</label><input type="date" id="pm-day" value="${dsel !== 'all' ? dsel : ''}" onchange="pmPickDay(this.value)"></div>
      <div class="f-note">按计划作业日分天汇总${dsel === 'all' ? '（逐日分列）' : '（' + (dayLabel(dsel) || dsel) + '）'}：每天一个独立合计，点位用量不跨日、不跨点位合并。${dsel === 'all' ? `当前共 ${blocks.length} 个作业日 · ${grandN} 条 · ${grandKg} kg` : ''}</div>
    </div>
    ${blocks.map(blockHtml).join('') || `<div class="card"><div class="f-note">${dsel === 'all' ? '暂无进行中的作业计划' : (dayLabel(dsel) || dsel) + ' 没有作业计划'}</div></div>`}
    <div style="display:flex;gap:8px;margin-bottom:calc(var(--sc)*14px)">
      <button class="btn ghost" style="flex:1" onclick="nav.push('pm-review')">逐条核实提交</button>
      <button class="btn ${pending.length ? 'primary' : 'ghost'}" style="flex:1.3" onclick="nav.push('pm-review-batch')">汇总提交${pending.length ? `（${pending.length} 条待核）` : '（暂无待核）'}</button>
    </div>
    <div class="seg" style="margin-top:calc(var(--sc)*12px)">${segs.map(s => `<button type="button" class="seg-i ${f === s[0] ? 'on' : ''}" onclick="nav.reset('pm-home',{f:'${s[0]}'})">${s[1]}</button>`).join('')}</div>
    ${list.map(x => planCard(x, 'pmGoPlan')).join('') || EMPTY('暂无计划')}
    <div class="f-tip" onclick="nav.push('plan-logs',{id:'${list[0] ? list[0].id : ''}'})">⌁ 查看计划流程日志与台账导出（从计划详情进入）</div>`;
  }
};
function pmGoPlan(id) { nav.push('pm-plan-detail', { id }); }
/* 项目负责人：按作业日切换汇总（保留当前的进行中/已结束筛选） */
function pmPickDay(v) {
  const t = (nav.top && nav.top()) || {};
  const p = t.params || {};
  nav.reset('pm-home', { d: v || 'all', f: p.f || 'all' });
}

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

/* ================= 测量技术员：填报计划（多点位、按点位分别报量） ================= */
PAGES['sv-plan-new'] = {
  title: '填报作业计划',
  render(p) {
    window._formState = { photos: 0 };
    const editing = p.edit ? planById(p.edit) : null;
    const rejected = editing && editing.status === '已驳回';
    const draft = window._planDraft = { picks: {}, editingId: editing ? editing.id : null };
    if (editing) planSites(editing).forEach(sp => {
      draft.picks[sp.site] = { items: (sp.items || []).map(x => ({ ...x })) };
    });
    const last = DB.plans.filter(x => x.surveyor === 'P7' && x !== editing).slice(-1)[0];
    const tm = new Date(Date.now() + 24 * H);
    const minDT = new Date(tm.getFullYear(), tm.getMonth(), tm.getDate(), 0, 1);
    const min = `${minDT.getFullYear()}-${pad(minDT.getMonth() + 1)}-${pad(minDT.getDate())}T00:01`;
    const curArea = editing ? planArea(editing) : null;
    const curPr = editing ? project(editing.project) : null;
    const siteCnt = Object.keys(draft.picks).length;
    /* 人员只能从「本项目 + 本点位」关联的人里选，不存在通用人员 */
    const pickedIds = Object.keys(draft.picks);
    const fitPerson = role => MASTER.persons.filter(p => p.role === role && (p.status || '在岗') !== '停用'
      && (curPr ? p.project === curPr.id : false) && (p.sites || []).some(s => pickedIds.includes(s)));
    const offCand = fitPerson('安全员'), supCand = fitPerson('安全监理');
    const offId = (editing && editing.officer) || (offCand[0] ? offCand[0].id : '');
    const supId = (editing && editing.supervisor) || (supCand[0] ? supCand[0].id : '');
    return `
    ${wizBar(1, 3, ['基本信息', '点位用量', '人员与附件'])}
    <div data-wst="1">
    ${rejected ? `<div class="card warn-card sm"><div class="fc-title">民警驳回意见</div><p class="f-note">${esc(editing.auditRemark || '无')}</p><div class="f-note">请修改后重新上报，流程重新走安全监管签字。</div></div>` : ''}
    <div class="form-card">
      <div class="f-row"><label>所属工区</label><div class="f-select" id="f_area" data-v="${curArea ? curArea.id : ''}" onclick="pickArea()">${curArea ? esc(curArea.name) : '请选择工区'}</div></div>
      <div class="f-row"><label>所属项目</label><div class="f-select" id="f_project" data-v="${curPr ? curPr.id : ''}" onclick="pickProject()">${curPr ? esc(curPr.name) : '请选择'}</div></div>
      <div class="site-pick-block">
        <div class="spb-title">作业点位（单选 · 每位测量技术员只负责本点位）<em>已选 ${siteCnt} 个</em></div>
        <div id="site-pick">${sitePickHTML(curPr ? curPr.id : '')}</div>
        <div class="f-note">每位测量技术员只负责本人作业点位，<b>一次只能选 1 个点位</b>、单独填写计划用量；多名技术员各报各点，由项目负责人汇总。</div>
      </div>
      <div class="f-row"><label>计划爆破开始</label><input id="f_start" type="datetime-local" min="${min}" value="${editing ? toLocalInput(editing.planStart) : ''}"></div>
      <div class="f-row"><label>计划爆破结束</label><input id="f_end" type="datetime-local" value="${editing ? toLocalInput(editing.planEnd) : ''}"></div>
      <div class="f-note">计划时限双规则同时生效（甲方确认 Q01）：① 次日计划须于当日 24:00 前提交（作业日期必须为明天）；② 距计划爆破开始不少于 6 小时。节假日、跨日作业、紧急任务与超时补报第一阶段均不支持。</div>
    </div>
    </div>
    <div data-wst="2">
    <div id="site-item-box"></div>
    </div>
    <div data-wst="3">
    <div class="form-card">
      <div class="f-row"><label>现场安全员</label><div class="f-select" id="f_officer" data-v="${offId}" onclick="pickSiteOfficer('officer')">${offId ? esc(person(offId).name) + ' · ' + esc(certOf(person(offId))) : '请先选项目与点位'}</div></div>
      <div class="f-row"><label>安全监理</label><div class="f-select" id="f_supervisor" data-v="${supId}" onclick="pickSiteOfficer('supervisor')">${supId ? esc(person(supId).name) + ' · ' + esc(certOf(person(supId))) : '请先选项目与点位'}</div></div>
      <div class="f-row"><label>爆破设计书</label>${photoStrip(st(), 'photos')}</div>
    </div>
    ${last && !editing ? `<div class="f-tip" onclick="reuseLastPlan()">⌁ 沿用上次计划（${esc(last.planNo)}）· 按点位带出品种与用量</div>` : ''}
    <button class="btn primary block" onclick="submitSurveyForm(${editing ? `'${editing.id}'` : 'null'})">${rejected ? '修改后重新上报' : '提交计划（送安全监管签字）'}</button>
    </div>
    ${wizNav(1, 3)}`;
  },
  after() { renderSiteCards(); wizApply(1); }
};
function st() { return window._formState; }
const toLocalInput = ts => { const d = new Date(ts); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };

/* 作业点位多选列表：勾选即纳入本计划，一个点位一块独立用量 */
function sitePickHTML(pid) {
  const picks = (window._planDraft && window._planDraft.picks) || {};
  const list = MASTER.sites.filter(s => (!pid || s.project === pid) && (s.status || '生效') !== '停用');
  if (!list.length) return '<div class="f-note">请先选择所属项目，再勾选作业点位</div>';
  return list.map(s => `<label class="check-line">
    <input type="radio" name="spick" data-sid="${s.id}" ${picks[s.id] ? 'checked' : ''} onchange="toggleSitePick('${s.id}')">
    <span>${esc(s.name)}<i style="font-style:normal;color:var(--ink2);font-size:11px;margin-left:6px">围栏 ${s.fence}m · 历史 ${s.hist} 次</i></span>
  </label>`).join('');
}
function refreshSitePick(pid) {
  const el = $('#site-pick'); if (el) el.innerHTML = sitePickHTML(pid);
  const box = document.querySelector('#f-site-cnt'); 
}
function toggleSitePick(sid) {
  const d = window._planDraft;
  /* 单选：选中新点位即清空原点位（每名技术员只负责一个作业点位的计划） */
  d.picks = {};
  d.picks[sid] = { items: [
    { goods: 'zy', spec: GOODS.zy.specs[0], qty: '' },
    { goods: 'lg', spec: GOODS.lg.specs[0], qty: '' }
  ] };
  const em = document.querySelector('.spb-title em');
  if (em) em.textContent = '已选 ' + Object.keys(d.picks).length + ' 个';
  renderSiteCards();
}
function renderSiteCards() {
  const box = document.querySelector('#site-item-box'); if (!box) return;
  const d = window._planDraft;
  const ids = Object.keys(d.picks);
  box.innerHTML = ids.length ? ids.map(sid => `
    <div class="form-card site-card" data-card="${sid}">
      <div class="fc-title" style="display:flex;justify-content:space-between;align-items:center">
        <span>${esc(site(sid).name)}</span>
        <span style="color:var(--acc);font-weight:700" data-kg="${sid}">${Math.round(planKg(d.picks[sid].items))} kg</span>
      </div>
      <div class="site-items">${d.picks[sid].items.map((it, i) => itemRow(it, i, sid)).join('')}</div>
      <button class="btn ghost sm" type="button" onclick="addSiteItem('${sid}')">＋ 添加品种</button>
    </div>`).join('')
    : '<div class="f-tip">↑ 先勾选作业点位，勾选后在下方分别填写各点位用量</div>';
}
function addSiteItem(sid) {
  const box = document.querySelector(`[data-card="${sid}"] .site-items`);
  if (!box) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = itemRow({ goods: 'zy', spec: GOODS.zy.specs[0], qty: '' }, box.children.length, sid);
  box.appendChild(tmp.querySelector('.it-row'));
}
function calcSiteKg(sid) {
  const el = document.querySelector(`[data-kg="${sid}"]`);
  if (el) el.textContent = Math.round(planKg(collectSiteItems(sid))) + ' kg';
}
function collectSiteItems(sid) {
  const items = [];
  document.querySelectorAll(`[data-card="${sid}"] .it-row`).forEach(row => {
    const qty = parseFloat(row.querySelector('[data-qty]').value);
    if (qty > 0) items.push({ goods: row.querySelector('.f-sel').value, spec: row.querySelector('[data-spec]').value, qty });
  });
  return items;
}
function isTomorrow(ts) {
  const d = new Date(ts), n = new Date();
  const tm = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1);
  return d.getFullYear() === tm.getFullYear() && d.getMonth() === tm.getMonth() && d.getDate() === tm.getDate();
}
function submitSurveyForm(editId) {
  const areaId = $('#f_area').dataset.v;
  const projectId = $('#f_project').dataset.v;
  const start = val('f_start'), end = val('f_end');
  if (!areaId) return toast('请选择所属工区（决定公安责任区）', false);
  if (!projectId) return toast('请选择所属项目', false);
  const prObj = project(projectId);
  if (prObj.workarea && prObj.workarea !== areaId) return toast('所选项目不属于该工区，请重新选择', false);
  const picked = Object.keys(window._planDraft.picks);
  if (!picked.length) return toast('请选择本次作业点位（单选）', false);
  if (picked.length > 1) return toast('每位测量技术员一次只能上报 1 个作业点位的计划，请只选择一个点位', false);
  const invalid = picked.filter(sid => {
    const st = MASTER.sites.find(x => x.id === sid);
    return !st || (st.status || '生效') === '停用';
  });
  if (invalid.length) return toast(`点位 ${invalid.join('、')} 已在主数据中停用或删除，请重新勾选生效点位`, false);
  const sitePlans = [];
  picked.forEach(sid => {
    const items = collectSiteItems(sid);
    if (items.length) sitePlans.push({ site: sid, items });
  });
  if (!sitePlans.length) return toast('请填写各作业点位的计划用量', false);
  /* 人员维度校验：必须同时关联本项目与本次作业点位，不存在「通用人员」 */
  const offId = ($('#f_officer') && $('#f_officer').dataset.v) || '';
  const supId = ($('#f_supervisor') && $('#f_supervisor').dataset.v) || '';
  const siteFit = (pid2, title) => {
    const p = MASTER.persons.find(x => x.id === pid2);
    if (!p) return `${title}未在主数据中建档或已删除`;
    if ((p.status || '在岗') === '停用') return `${title}「${p.name}」已停用，不可参与本计划`;
    if (!p.project) return `${title}「${p.name}」未关联项目，不可参与本计划（请先在 PC 端四大员维护关联项目）`;
    if (p.project !== projectId) return `${title}「${p.name}」关联项目为「${project(p.project).name}」，与本次计划项目不符`;
    const rel = p.sites || [];
    if (!rel.length) return `${title}「${p.name}」未关联作业点位，不可参与本计划（请先在 PC 端四大员维护关联点位）`;
    if (!rel.some(x => picked.includes(x))) return `${title}「${p.name}」仅关联 ${rel.join('/')}，与本次作业点位不符`;
    return '';
  };
  if (!offId) return toast('请选择现场安全员（仅可选取关联本项目与本次点位的人员）', false);
  if (!supId) return toast('请选择安全监理（仅可选取关联本项目与本次点位的人员）', false);
  const offErr = siteFit(offId, '安全员');
  if (offErr) return toast(offErr, false);
  const supErr = siteFit(supId, '安全监理');
  if (supErr) return toast(supErr, false);
  if (!start || !end) return toast('请填写计划爆破时间段', false);
  const st2 = new Date(start).getTime(), en = new Date(end).getTime();
  if (!isTomorrow(st2)) return toast('次日计划须于当日 24:00 前提交：作业日期必须为明天（校验拦截）', false);
  if (st2 - Date.now() < 6 * H) return toast('计划须至少提前 6 小时提交（甲方确认 Q01：24:00 前与提前 6h 双规则同时生效）', false);
  if (en <= st2) return toast('计划爆破结束须晚于开始时间', false);
  const items = sitePlans.reduce((a, x) => a.concat(x.items), []);
  const kg = Math.round(planKg(items));
  const siteTxt = sitePlans.map(sp => `${site(sp.site).name} ${Math.round(planKg(sp.items))}kg`).join('、');
  if (editId) {
    const old = planById(editId);
    Object.assign(old, { project: projectId, workarea: areaId, site: sitePlans[0].site, sitePlans, items, planStart: st2, planEnd: en, status: '待监管签字', auditStatus: '', surveyor: 'P7', officer: offId, supervisor: supId });
    pushMsg('安全监管', `计划 ${old.planNo} 已修改重新上报（${sitePlans.length} 个点位，合计 ${kg}kg），待作业点安全监管签字。`);
    addLog(old, '计划', `测量技术员修改后重新上报（${siteTxt}）`, person('P7').name);
    toast('已重新上报，待安全监管签字', true);
  } else {
    const plan = {
      id: safeId('PL', 'plan', 'plans'), planNo: safeNo('BBJH', 'plan', 'plans', 'planNo'), project: projectId, workarea: areaId,
      site: sitePlans[0].site, sitePlans, items,
      planStart: st2, planEnd: en, officer: offId, supervisor: supId, applicant: 'P7', surveyor: 'P7',
      createdAt: Date.now(), status: '待监管签字', auditStatus: '',
      tier: tierOf(planKg(items)).level, exceptionFlag: false, remark: ''
    };
    DB.plans.push(plan);
    pushMsg('安全监管', `新计划 ${plan.planNo}（${sitePlans.length} 个点位，合计 ${kg}kg）待作业点安全监管签字。`);
    addLog(plan, '计划', `测量技术员现场测量上报：${siteTxt}`, person('P7').name);
    toast(`已提交，单号 ${plan.planNo}（${sitePlans.length} 个点位）`, true);
  }
  saveDB();
  nav.reset('sv-home');
}
function itemRow(it, i, sid) {
  const g = GOODS[it.goods];
  return `<div class="it-row" data-i="${i}" data-site="${sid || ''}">
    <select class="f-sel" onchange="onItemGoods(this,${i})">${Object.keys(GOODS).map(k => `<option value="${k}" ${k === it.goods ? 'selected' : ''}>${GOODS[k].name}</option>`).join('')}</select>
    <select class="f-sel" data-spec>${g.specs.map(s => `<option ${s === it.spec ? 'selected' : ''}>${s}</option>`).join('')}</select>
    <input class="f-num" type="number" placeholder="0" value="${it.qty}" data-qty oninput="calcSiteKg('${sid || ''}')"> <span class="f-unit">${g.unit}</span>
    <button class="it-del" aria-label="删除" type="button" onclick="this.closest('.it-row').remove();calcSiteKg('${sid || ''}')">✕</button>
  </div>`;
}
function onItemGoods(sel, i) {
  const row = sel.closest('.it-row');
  const specs = GOODS[sel.value].specs;
  row.querySelector('[data-spec]').innerHTML = specs.map(s => `<option>${s}</option>`).join('');
  row.querySelector('.f-unit').textContent = GOODS[sel.value].unit;
  calcSiteKg(row.dataset.site || '');
}
function reuseLastPlan() {
  const last = DB.plans.filter(x => x.surveyor === 'P7').slice(-1)[0];
  if (!last) return toast('暂无历史计划');
  const d = window._planDraft;
  planSites(last).forEach(sp => { d.picks[sp.site] = { items: (sp.items || []).map(x => ({ ...x })) }; });
  const pid = $('#f_project').dataset.v;
  refreshSitePick(pid);
  renderSiteCards();
  toast('已沿用上次计划的点位与用量', true);
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
      <div class="hc-name">${planSiteCount(pl) > 1 ? `${esc(site(pl.site).name)} 等 ${planSiteCount(pl)} 个点位` : esc(site(pl.site).name)}</div>
      <div class="hc-sub">${esc(project(pl.project).name)} · 计划量 ${planTotalKg(pl)}kg · 计划爆破 ${fmtFull(pl.planStart)}</div>
    </div>
    <div class="card">
      <div class="fc-title">上报明细核对（按作业点位分列）</div>
      ${planSites(pl).map(sp => `
        <div class="site-sum">
          <div class="ss-top"><b>${esc(site(sp.site).name)}</b><span class="ss-kg">${Math.round(planKg(sp.items || []))} kg</span></div>
          ${(sp.items || []).map(it => `<div class="kv"><span>${esc(goodsName(it.goods))} · ${esc(it.spec)}</span><b>${it.qty} ${esc(GOODS[it.goods].unit)}</b></div>`).join('')}
        </div>`).join('')}
      <div class="kv" style="border-top:1px solid var(--rule);margin-top:8px;padding-top:8px"><span><b>合计</b></span><b style="color:var(--acc)">${planTotalKg(pl)} kg</b></div>
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
  render(p) {
    const sid = (p && p.site) || '';
    let list = DB.plans.filter(x => x.status === '待负责人审核');
    if (sid) list = list.filter(x => planSites(x).some(y => y.site === sid));
    return `
    <div class="page-title">逐条核实提交<span class="page-sub">${sid ? `仅看点位「${esc(site(sid).name)}」· ` : ''}每条计划单独选出库库房与公安责任区（F4）</span></div>
    ${list.length ? list.map(x => planCard(x, 'pmGoReview')).join('') : EMPTY('暂无待审核提交的计划')}
    <div class="f-note center">提交后计划进入对应公安责任区责任民警待办；次日计划须当日 24:00 前完成提交。</div>`;
  }
};
function pmGoReview(id) { nav.push('pm-review-form', { id }); }

/* 点位直投入口：该点位只有 1 条待核 → 直接单条核实；多条 → 进按点位过滤的逐条列表 */
function pmGoSite(siteId) {
  const list = DB.plans.filter(x => x.status === '待负责人审核' && planSites(x).some(y => y.site === siteId));
  if (!list.length) return toast('该点位暂无待提交计划', false);
  if (list.length === 1) return nav.push('pm-review-form', { id: list[0].id });
  nav.push('pm-review', { site: siteId });
}

/* ================= 项目负责人：汇总提交（多条计划共用一批运输安排） ================= */
PAGES['pm-review-batch'] = {
  title: '汇总提交',
  render(p) {
    const ids = (p && Array.isArray(p.ids) && p.ids.length) ? p.ids : DB.plans.filter(x => x.status === '待负责人审核').map(x => x.id);
    const list = ids.map(planById).filter(x => x && x.status === '待负责人审核');
    if (!list.length) return EMPTY('暂无待汇总提交的计划') + `<button class="btn ghost block" onclick="nav.back()">返回</button>`;
    window._rvBatch = list.map(x => x.id);
    const totalKg = Math.round(list.reduce((a, x) => a + planTotalKg(x), 0));
    window._rvKg = totalKg;   // 本批载重基准
    const bySite = {};
    list.forEach(x => planSites(x).forEach(sp => {
      bySite[sp.site] = bySite[sp.site] || { n: 0, kg: 0 };
      bySite[sp.site].n += 1;
      bySite[sp.site].kg += planKg(sp.items || []);
    }));
    const wa = planArea(list[0]);
    return `
    ${wizBar(1, 2, ['汇总范围', '运输与责任区'])}
    <div class="page-title">汇总提交计划<span class="page-sub">一次为 ${list.length} 条待核计划安排同批运输 → 民警审核</span></div>
    <div data-wst="1">
    <div class="card">
      <div class="fc-title">本次汇总范围（${Object.keys(bySite).length} 个点位 · ${list.length} 条 · ${totalKg}kg）</div>
      ${Object.keys(bySite).map(sid => `<div class="kv"><span>${esc(site(sid).name)}</span><b>${bySite[sid].n} 条 · ${Math.round(bySite[sid].kg)} kg</b></div>`).join('')}
      <div class="kv" style="border-top:1px solid var(--rule);margin-top:6px;padding-top:8px"><span><b>合计</b></span><b style="color:var(--acc)">${totalKg} kg</b></div>
      <div class="f-note">各点位用量仍按点位独立核算；汇总提交只是共用同一次运输安排（一车多点），每条计划分别进入责任民警审核。</div>
    </div>
    </div>
    <div data-wst="2">
    <div class="form-card">
      <div class="fc-title">运输安排（提交前必选）</div>
      <div class="f-row"><label>运输车辆</label><div class="f-select" id="rv_vehicle" data-v="" onclick="pickReviewVehicle()">请选择车辆</div></div>
      <div class="f-row"><label>押运员</label><div class="f-select" id="rv_escort" data-v="" onclick="pickReviewEscort()">请选择押运员</div></div>
      <div class="f-note" id="rv_loadtip">本批合计 ${totalKg}kg，车辆核定载重须 ≥ 本批合计用量</div>
    </div>
    <div class="form-card">
      <div class="fc-title">出库与责任区（提交前必选）</div>
      <div class="f-row"><label>出库库房</label><div class="f-select" id="rv_storage" data-v="" onclick="pickOutStorage()">请选择出库库房</div></div>
      <div class="f-row"><label>运输路线</label><div class="f-select" id="rv_route" data-v="" onclick="pickReviewRoute()">请先选出库库房，再选路线</div></div>
      <div class="f-row"><label>公安责任区</label><div class="f-select" id="rv_area" data-v="${wa.id}" onclick="pickAuditArea()">${esc(wa.name)} · 责任民警 ${esc(person(wa.police).name)}</div></div>
      <div class="f-note">同一批次共用一个出库库房；若各点位需分别从不同库房出库，请用「逐条核实提交」。</div>
    </div>
    <button class="btn primary block" onclick="submitPmReviewBatch()">汇总提交 ${list.length} 条（合计 ${totalKg}kg）</button>
    <div class="f-note center">只想提交某个点位时，返回上一页点该点位行「单独提交」。</div>
    </div>
    ${wizNav(1, 2)}`;
  },
  after() { wizApply(1); }
};

PAGES['pm-review-form'] = {
  title: '审核提交',
  render(p) {
    const pl = planById(p.id);
    if (!pl || pl.status !== '待负责人审核') return EMPTY('该计划不在待审核提交状态') + `<button class="btn ghost block" onclick="nav.back()">返回</button>`;
    window._rvPlan = pl.id;
    const kg = planTotalKg(pl);
    window._rvKg = kg;   // 车辆载重校验基准（单条提交）
    const t = tierOf(planKg(pl.items));
    const wa = planArea(pl);
    const n = planSites(pl).length;
    return `
    ${wizBar(1, 2, ['核验与用量', '运输与出库量'])}
    <div class="head-card sm">
      <div class="hc-top">${statusPill(pl.status)}<span class="lvb ${t.cls}">${esc(t.level)}</span></div>
      <div class="hc-no">${esc(pl.planNo)}</div>
      <div class="hc-name">${n > 1 ? `${esc(site(pl.site).name)} 等 ${n} 个作业点位` : esc(site(pl.site).name)}</div>
      <div class="hc-sub">${esc(project(pl.project).name)} · 合计计划量 ${kg}kg</div>
      <div class="hc-time">计划爆破 ${fmtFull(pl.planStart)} ~ ${fmtFull(pl.planEnd)}</div>
    </div>
    <div data-wst="1">
    <div class="card">
      <div class="fc-title">上报链路核验</div>
      <div class="kv"><span>测量技术员</span><b>${esc(person(pl.surveyor || 'P7').name)}（已上报）</b></div>
      <div class="kv"><span>安全监管</span><b>${pl.regSign ? `${esc(person(pl.regSign.by).name)} · ${fmtTime(pl.regSign.time)} 已签字` : '已签字（历史数据未记录签名人）'}</b></div>
      ${pl.regRemark ? `<p class="f-note">${esc(pl.regRemark)}</p>` : ''}
    </div>
    <div class="card">
      <div class="fc-title">按作业点位核对用量（各点独立，不合并）</div>
      ${planSites(pl).map(sp => `
        <div class="site-sum">
          <div class="ss-top"><b>${esc(site(sp.site).name)}</b><span class="ss-kg">${Math.round(planKg(sp.items))} kg</span></div>
          ${(sp.items || []).map(it => `<div class="kv"><span>${esc(goodsName(it.goods))} · ${esc(it.spec)}</span><b>${it.qty} ${esc(GOODS[it.goods].unit)}</b></div>`).join('')}
        </div>`).join('')}
      <div class="kv" style="border-top:1px solid var(--rule);margin-top:8px;padding-top:8px"><span><b>合计</b></span><b style="color:var(--acc)">${kg} kg</b></div>
      <div class="f-note">雷管、导爆索按当量折算为公斤；分级判定按合计量。</div>
    </div>
    </div>
    <div data-wst="2">
    <div class="form-card">
      <div class="fc-title">运输安排（提交前必选）</div>
      <div class="f-row"><label>运输车辆</label><div class="f-select" id="rv_vehicle" data-v="" onclick="pickReviewVehicle()">请选择车辆</div></div>
      <div class="f-row"><label>押运员</label><div class="f-select" id="rv_escort" data-v="" onclick="pickReviewEscort()">请选择押运员</div></div>
      <div class="f-note" id="rv_loadtip">车辆核定载重须 ≥ 本计划合计用量 ${kg}kg（多点位合并计算）</div>
    </div>
    <div class="form-card">
      <div class="fc-title">出库与责任区（提交前必选）</div>
      <div class="f-row"><label>出库库房</label><div class="f-select" id="rv_storage" data-v="" onclick="pickOutStorage()">请选择出库库房</div></div>
      <div class="f-row"><label>运输路线</label><div class="f-select" id="rv_route" data-v="" onclick="pickReviewRoute()">请先选出库库房，再选路线</div></div>
      <div class="f-row"><label>公安责任区</label><div class="f-select" id="rv_area" data-v="${wa.id}" onclick="pickAuditArea()">${esc(wa.name)} · 责任民警 ${esc(person(wa.police).name)}</div></div>
      <div class="f-note">公安责任区决定审核民警与分级检查到场单位；默认取作业点所属工区，可调整。</div>
    </div>
    <button class="btn primary block" onclick="submitPmReview('${pl.id}')">审核提交（送公安责任区民警审核）</button>
    </div>
    ${wizNav(1, 2)}`;
  },
  after() { wizApply(1); }
};
/* 本次提交涉及的计划（单条核实 = 1 条；汇总提交 = 本批多条） */
function rvPlans() {
  const ids = (window._rvBatch && window._rvBatch.length) ? window._rvBatch : (window._rvPlan ? [window._rvPlan] : []);
  return ids.map(planById).filter(Boolean);
}
function pickReviewVehicle() {
  const kg = window._rvKg || 0;   // 单条提交 = 该计划合计；汇总提交 = 本批合计
  const plans = rvPlans();
  const pids = Array.from(new Set(plans.map(p => p.project).filter(Boolean)));
  const cos = Array.from(new Set(pids.map(id => (project(id) || {}).company).filter(Boolean)));
  const offStorageTip = $('#rv_storage');
  /* 只列关联本项目的在册车辆（无项目关联的车辆不参与本项目运输） */
  const list = MASTER.vehicles.filter(v => (v.status || '在用') !== '停用' && v.project && pids.includes(v.project)).map(v => {
    const coName = v.company ? company(v.company).name : '';
    const crossCo = v.company && cos.length && !cos.includes(v.company);
    const tags = [];
    tags.push(`限 ${project(v.project).name}`);
    if (coName) tags.push(coName);
    if (crossCo) tags.push('跨公司调用');
    tags.push(v.transLicence || '无运输证');
    return {
      label: `${v.plate} · ${v.model} · 载重 ${v.load}kg · ${tags.join(' · ')}`,
      id: v.id
    };
  });
  if (!list.length) return toast(`本项目（${project(pids[0]).name}）暂无关联的可用运输车辆，请先在 PC 端「运输车辆维护」关联该项目`, false);
  sheet('选择运输车辆（仅本项目关联车辆，按载重校验）', list, x => {
    const el = $('#rv_vehicle');
    el.textContent = x.label.split(' · ')[0] + ' · ' + x.label.split(' · ')[1];
    el.dataset.v = x.id;
    const v = vehicle(x.id);
    const ok = v.load >= kg;
    const tip = $('#rv_loadtip');
    if (tip) {
      tip.textContent = ok
        ? `已选 ${v.plate}：核定载重 ${v.load}kg ≥ 合计 ${kg}kg，符合要求（运输证 ${v.transLicence}）`
        : `⚠ ${v.plate} 核定载重 ${v.load}kg 小于合计 ${kg}kg，禁止安排该车`;
      tip.style.color = ok ? 'var(--ok)' : 'var(--bad)';
    }
  });
}
function pickReviewEscort() {
  const plans = rvPlans();
  const pids = Array.from(new Set(plans.map(p => p.project).filter(Boolean)));
  const sids = Array.from(new Set(plans.flatMap(p => planSites(p).map(sp => sp.site))));
  /* 押运员同样只认「本项目 + 本点位」关联人员，没有通用押运员 */
  const list = MASTER.persons
    .filter(p => p.role === '押运员' && (p.status || '在岗') !== '停用'
      && p.project && pids.includes(p.project) && (p.sites || []).some(x => sids.includes(x)))
    .map(p => {
      const coName = p.company ? company(p.company).name : '';
      return {
        label: `${p.name} · ${certOf(p)} · ${coName || p.company || ''} · 关联 ${(p.sites || []).join('/')} · 有效期至 ${certExpireOf(p)}`,
        id: p.id
      };
    });
  if (!list.length) return toast(`本项目（${project(pids[0]).name}）与本次点位下暂无在岗押运员，请先在 PC 端「四大员维护」补录并关联项目与点位`, false);
  sheet('选择押运员（仅本项目 + 本点位关联人员）', list, x => {
    const el = $('#rv_escort');
    el.textContent = x.label.split(' · ')[0] + ' · ' + x.label.split(' · ')[1];
    el.dataset.v = x.id;
  });
}
/* 选安全员 / 安全监理：只列「本项目 + 本次所选点位」都有档案关联的在岗人员 */
function pickSiteOfficer(kind) {
  const role = kind === 'officer' ? '安全员' : '安全监理';
  const picks = Object.keys((window._planDraft || {}).picks || {});
  const prjId = ($('#f_project') && $('#f_project').dataset.v) || '';
  if (!prjId) return toast('请先选择所属项目，人员按项目与点位关联筛选', false);
  if (!picks.length) return toast('请先勾选作业点位，人员按点位关联筛选', false);
  const list = MASTER.persons.filter(p => p.role === role && (p.status || '在岗') !== '停用'
    && p.project === prjId && (p.sites || []).some(x => picks.includes(x)));
  if (!list.length) return toast(`本项目（${project(prjId).name}）与所选点位下没有在岗${role}，请先在 PC 端「四大员维护」补录并关联项目与点位`, false);
  sheet(`选择${role}（仅本项目 + 本点位关联人员）`, list.map(p => ({
    label: `${p.name} · ${certOf(p)} · 有效期至 ${certExpireOf(p)} · 关联 ${(p.sites || []).join('/')}`,
    id: p.id
  })), x => {
    const el = $(kind === 'officer' ? '#f_officer' : '#f_supervisor');
    el.textContent = x.label.split(' · ')[0] + ' · ' + x.label.split(' · ')[1];
    el.dataset.v = x.id;
  });
}
/* 选运输路线：只列 PC 端维护、起运库房与所选出库库房一致、且到达点位落在本次作业点位内的启用路线 */
function pickReviewRoute() {
  const sid = ($('#rv_storage') || {}).dataset ? $('#rv_storage').dataset.v : '';
  if (!sid) return toast('请先选择出库库房，路线按起运库房匹配', false);
  const plans = rvPlans();
  const sids = Array.from(new Set(plans.flatMap(p => planSites(p).map(sp => sp.site))));
  /* 库房维度：只列起运库房=本次出库库房，且到达点位在本次作业点位内的路线 */
  const list = MASTER.routes.filter(r => (r.status || '启用') !== '停用' && r.from === sid && sids.includes(r.to));
  if (!list.length) return toast(`${storage(sid).name} 没有可到达本次作业点位（${sids.map(s => site(s).name).join('、')}）的在册路线，请先在 PC 端「路线维护」补录`, false);
  sheet('选择运输路线（起运库房已锁定）', list.map(r => {
    return {
      label: `${r.name} · ${r.km}km · 打卡点 ${(r.checkPoints || []).length} 个`,
      id: r.id, ok: true
    };
  }), x => {
    const el = $('#rv_route');
    el.textContent = x.label.split(' · ')[0] + ' · ' + x.label.split(' · ')[1];
    el.dataset.v = x.id;
    const rt = MASTER.routes.find(r => r.id === x.id);
    const tip = $('#rv_loadtip');
    if (tip && rt) {
      tip.textContent = `路线 ${rt.name}：${storage(rt.from).name} → ${site(rt.to).name}，里程 ${rt.km}km，${(rt.checkPoints || []).length} 个打卡点`;
      tip.style.color = 'var(--ok)';
    }
  });
}
/* 运输安排摘要：车辆 / 押运员 / 路线（取项目负责人核实上报时写入的 transPlan） */
function transBrief(pl) {
  const tp = (pl && pl.transPlan) || {};
  const v = tp.vehicle ? MASTER.vehicles.find(x => x.id === tp.vehicle) : null;
  const e = tp.escort ? MASTER.persons.find(x => x.id === tp.escort) : null;
  const r = tp.route ? MASTER.routes.find(x => x.id === tp.route) : null;
  return {
    v: v ? `${v.plate}（${v.load}kg）` : '未安排车辆',
    e: e ? `${e.name}` : '未安排押运员',
    r: r ? `${r.name} · ${r.km}km` : '未安排路线',
    full: `车辆 ${v ? v.plate : '未安排'} · 押运员 ${e ? e.name : '未安排'} · 路线 ${r ? r.name : '未安排'}`
  };
}
function pickOutStorage() {
  // 销售库 / 使用库 / 中间库 均可作为出库源；退库去向按库房类型自动判定
  const list = MASTER.storages.filter(s => ['销售库', '使用库', '中间库'].includes(s.type) && (s.status || '生效') !== '停用');
  sheet('选择出库库房', list.map(s => ({ label: `${s.name} · ${s.type}${s.type === '使用库' ? '（退库须原路原库退回）' : s.type === '销售库' ? '（未用完可退中间库或销毁）' : '（可发给作业点，退库回本库）'}`, id: s.id })), x => {
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
  if (!pl) return toast('计划不存在', false);
  const sid = $('#rv_storage').dataset.v, aid = $('#rv_area').dataset.v;
  const vid = $('#rv_vehicle').dataset.v, eid = $('#rv_escort').dataset.v, rid = ($('#rv_route') || {}).dataset ? $('#rv_route').dataset.v : '';
  if (!sid) return toast('请选择出库库房', false);
  if (!aid) return toast('请选择公安责任区', false);
  if (!vid) return toast('请安排运输车辆（提交前必选）', false);
  if (!eid) return toast('请安排押运员（提交前必选）', false);
  if (!rid) return toast('请选择运输路线（从 PC 端维护的路线中选）', false);
  const rt = MASTER.routes.find(x => x.id === rid);
  if (!rt || (rt.status || '启用') === '停用') return toast('所选运输路线已停用，请重新选择', false);
  if (rt.from !== sid) return toast(`路线「${rt.name}」起运库房为 ${storage(rt.from).name}，与出库库房不一致`, false);
  if (!planSites(pl).some(sp => sp.site === rt.to)) return toast(`路线「${rt.name}」到达点位为 ${site(rt.to).name}，不在本计划作业点位内`, false);
  const stObj = MASTER.storages.find(x => x.id === sid);
  if (!stObj || (stObj.status || '生效') === '停用') return toast('所选出库库房已在主数据中停用，请重新选择', false);
  const escObj = MASTER.persons.find(x => x.id === eid);
  if (!escObj || (escObj.status || '在岗') === '停用') return toast('所选押运员已停用或证件失效，请重新选择', false);
  if (!escObj.project || escObj.project !== pl.project) return toast(`押运员「${escObj.name}」未关联本项目或关联项目不符，不可安排`, false);
  const escRelSites = escObj.sites || [];
  const plSiteIds = planSites(pl).map(sp => sp.site);
  if (!escRelSites.length || !escRelSites.some(s => plSiteIds.includes(s))) return toast(`押运员「${escObj.name}」未关联本次作业点位（${plSiteIds.map(s => site(s).name).join('、')}），不可安排`, false);
  const v = vehicle(vid);
  const kg = planTotalKg(pl);
  if (!v.project || v.project !== pl.project) return toast(`车辆 ${v.plate} 未关联本项目或关联项目不符，不可安排`, false);
  if (v.load < kg) return toast(`${v.plate} 核定载重 ${v.load}kg 小于计划合计 ${kg}kg，禁止安排该车`, false);
  if (!isTomorrow(pl.planStart)) return toast('次日计划须于当日 24:00 前提交，该计划作业日已过期，请退回技术员重新填报', false);
  pl.outStorage = sid; pl.auditArea = aid;
  pl.vehicle = vid; pl.escort = eid;
  pl.route = rid;
  pl.transPlan = { vehicle: vid, escort: eid, route: rid, load: v.load, totalKg: kg, arrangedAt: Date.now(), by: 'P1' };
  if (pl.workarea !== aid) pl.workarea = aid; // 公安责任区即路由区域：待办/统计/检查均按该区收敛
  submitPlanAudit(pl);
  addLog(pl, '计划', `项目负责人核实通过并安排运输：${v.plate}（载重 ${v.load}kg）+ 押运员 ${person(eid).name} + 路线 ${rt.name}（${rt.km}km），计划合计 ${kg}kg`, person('P1').name);
  pushMsg('测量技术员', `计划 ${pl.planNo} 已由项目负责人审核提交至公安审核（车辆 ${v.plate} · 押运员 ${person(eid).name}）。`);
  pushMsg('押运员', `计划 ${pl.planNo} 已安排你押运：${v.plate}，合计 ${kg}kg，待民警审核后出库。`);
  saveDB();
  toast(`已提交公安审核，责任民警 ${person(planArea(pl).police).name}；车辆 ${v.plate} · 押运员 ${person(eid).name}`, true);
  nav.reset('pm-home');
}
function submitPmReviewBatch() {
  const list = (window._rvBatch || []).map(planById).filter(x => x && x.status === '待负责人审核');
  if (!list.length) return toast('没有可汇总提交的计划', false);
  const sid = $('#rv_storage').dataset.v, aid = $('#rv_area').dataset.v;
  const vid = $('#rv_vehicle').dataset.v, eid = $('#rv_escort').dataset.v, rid = ($('#rv_route') || {}).dataset ? $('#rv_route').dataset.v : '';
  if (!sid) return toast('请选择出库库房', false);
  if (!aid) return toast('请选择公安责任区', false);
  if (!vid) return toast('请安排运输车辆（提交前必选）', false);
  if (!eid) return toast('请安排押运员（提交前必选）', false);
  if (!rid) return toast('请选择运输路线（从 PC 端维护的路线中选）', false);
  const rt = MASTER.routes.find(x => x.id === rid);
  if (!rt || (rt.status || '启用') === '停用') return toast('所选运输路线已停用，请重新选择', false);
  if (rt.from !== sid) return toast(`路线「${rt.name}」起运库房为 ${storage(rt.from).name}，与出库库房不一致`, false);
  if (!list.some(pl => planSites(pl).some(sp => sp.site === rt.to))) return toast(`路线「${rt.name}」到达点位不在本批任何作业点位内`, false);
  const stObj = MASTER.storages.find(x => x.id === sid);
  if (!stObj || (stObj.status || '生效') === '停用') return toast('所选出库库房已在主数据中停用，请重新选择', false);
  const escObj = MASTER.persons.find(x => x.id === eid);
  if (!escObj || (escObj.status || '在岗') === '停用') return toast('所选押运员已停用或证件失效，请重新选择', false);
  const batchSites = Array.from(new Set(list.flatMap(pl => planSites(pl).map(sp => sp.site))));
  const batchProjects = Array.from(new Set(list.map(pl => pl.project).filter(Boolean)));
  if (!escObj.project || !batchProjects.includes(escObj.project)) return toast(`押运员「${escObj.name}」未关联本批计划的项目或项目不符，不可安排`, false);
  const escBatchSites = escObj.sites || [];
  if (!escBatchSites.length || !escBatchSites.some(s => batchSites.includes(s))) return toast(`押运员「${escObj.name}」未关联本批作业点位，不可安排`, false);
  const v = vehicle(vid);
  const total = Math.round(list.reduce((a, x) => a + planTotalKg(x), 0));
  if (!v.project || !batchProjects.includes(v.project)) return toast(`车辆 ${v.plate} 未关联本批计划的项目或项目不符，不可安排`, false);
  if (v.load < total) return toast(`${v.plate} 核定载重 ${v.load}kg 小于本批合计 ${total}kg，禁止安排该车`, false);
  const expired = list.filter(x => !isTomorrow(x.planStart));
  if (expired.length) return toast(`计划 ${expired[0].planNo} 作业日已过期，请退回技术员重新填报后再汇总提交`, false);
  const batchNo = 'BT' + String(Date.now()).slice(-6);
  list.forEach(pl => {
    const kg = planTotalKg(pl);
    pl.outStorage = sid; pl.auditArea = aid;
    pl.vehicle = vid; pl.escort = eid;
    pl.route = rid;
    pl.transPlan = { vehicle: vid, escort: eid, route: rid, load: v.load, totalKg: kg, batch: batchNo, batchTotalKg: total, arrangedAt: Date.now(), by: 'P1' };
    if (pl.workarea !== aid) pl.workarea = aid;
    submitPlanAudit(pl);
    addLog(pl, '计划', `项目负责人汇总提交（批次 ${batchNo}）：出库 ${storage(sid).name} · 路线 ${rt.name} · ${v.plate} + 押运员 ${person(eid).name}；本批 ${list.length} 条合计 ${total}kg，本计划 ${kg}kg`, person('P1').name);
    pushMsg('押运员', `计划 ${pl.planNo} 已安排你押运：${v.plate}（批次 ${batchNo}，合计 ${kg}kg），待民警审核后出库。`);
    pushMsg('测量技术员', `计划 ${pl.planNo} 已随批次 ${batchNo} 提交公安审核（车辆 ${v.plate}）。`);
  });
  saveDB();
  toast(`已汇总提交 ${list.length} 条计划（合计 ${total}kg），责任民警 ${person(planArea(list[0]).police).name}；车辆 ${v.plate} · 押运员 ${person(eid).name}`, true);
  nav.reset('pm-home');
}
function pickArea() {
  sheet('选择所属工区', MASTER.workareas.map(w => ({ label: `${w.name} · 责任民警 ${person(w.police).name}`, id: w.id })), x => {
    const el = $('#f_area');
    el.textContent = x.label.split(' · ')[0];
    el.dataset.v = x.id;
    const pj = $('#f_project');
    pj.textContent = '请选择'; pj.dataset.v = '';
    if (window._planDraft) window._planDraft.picks = {};
    refreshSitePick('');
    renderSiteCards();
  });
}
function pickProject() {
  const aid = $('#f_area').dataset.v;
  if (!aid) return toast('请先选择所属工区', false);
  const list = MASTER.projects.filter(pr => !pr.workarea || pr.workarea === aid);
  if (!list.length) return toast('该工区暂无在册项目', false);
  sheet('选择项目', list.map(pr => ({ label: `${pr.name}（${pr.area}）`, id: pr.id })), (x) => {
    $('#f_project').textContent = x.label.split('（')[0];
    $('#f_project').dataset.v = x.id;
    // 切项目后，已勾选点位若不属于该项目则移除
    if (window._planDraft) {
      const valid = MASTER.sites.filter(s => s.project === x.id).map(s => s.id);
      Object.keys(window._planDraft.picks).forEach(k => { if (!valid.includes(k)) delete window._planDraft.picks[k]; });
    }
    refreshSitePick(x.id);
    renderSiteCards();
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
      act = `<div class="ok-strip">已出库计划不允许变更（甲方确认 Q02）；如遇特殊情况请联系责任民警按流程处置</div>`;
    return `
    <div class="head-card">
      <div class="hc-top">${statusPill(pl.status)}<span class="lvb ${t.cls}">${esc(t.level)}</span></div>
      <div class="hc-no">${esc(pl.planNo)}</div>
      <div class="hc-name">${planSiteCount(pl) > 1 ? `${esc(site(pl.site).name)} 等 ${planSiteCount(pl)} 个点位` : esc(site(pl.site).name)}</div>
      <div class="hc-sub">${esc(project(pl.project).name)} · 计划量 ${planTotalKg(pl)}kg（雷管按当量折算）</div>
      <div class="hc-sub">${pl.surveyor ? `上报：${esc(person(pl.surveyor).name)}（技术员） → ${esc(person(pl.regSign ? pl.regSign.by : 'P8').name)}（监管签字${pl.regSign ? ' ✓' : ' 待签'}） → ${esc(person(pl.applicant).name)}（审核提交）` : `所属工区：${esc(planArea(pl).name)} · 审核民警 ${esc(person(planArea(pl).police).name)}`}</div>
      ${pl.outStorage || pl.auditArea ? `<div class="hc-sub">出库库房：${esc(storage(pl.outStorage || 'S1').name)} · 公安责任区：${esc(workarea(pl.auditArea || pl.workarea).name)}</div>` : ''}
      <div class="hc-time">计划爆破 ${fmtFull(pl.planStart)} ~ ${fmtFull(pl.planEnd)}</div>
    </div>
    ${timelineHTML(pl)}
    <div class="card">
      <div class="fc-title">计划用量明细（按作业点位分列）</div>
      ${planSites(pl).map(sp => `
        <div class="site-sum">
          <div class="ss-top"><b>${esc(site(sp.site).name)}</b><span class="ss-kg">${Math.round(planKg(sp.items || []))} kg</span></div>
          ${(sp.items || []).map(it => `<div class="kv"><span>${esc(goodsName(it.goods))} · ${esc(it.spec)}</span><b>${it.qty} ${esc(GOODS[it.goods].unit)}</b></div>`).join('')}
        </div>`).join('')}
      <div class="kv" style="border-top:1px solid var(--rule);margin-top:8px;padding-top:8px"><span><b>合计</b></span><b style="color:var(--acc)">${planTotalKg(pl)} kg</b></div>
      <div class="kv"><span>现场安全员</span><b>${esc(person(pl.officer).name)}</b></div>
      <div class="kv"><span>安全监理</span><b>${esc(person(pl.supervisor).name)}</b></div>
    </div>
    ${pl.vehicle || pl.escort ? `<div class="card">
      <div class="fc-title">运输安排（项目负责人核实）</div>
      <div class="kv"><span>运输车辆</span><b>${esc(vehicle(pl.vehicle || '').plate || '-')}${pl.transPlan ? ` · 核定载重 ${pl.transPlan.load}kg` : ''}</b></div>
      <div class="kv"><span>押运员</span><b>${esc(person(pl.escort || '').name || '-')}</b></div>
      <div class="kv"><span>计划合计</span><b>${pl.transPlan ? pl.transPlan.totalKg : planTotalKg(pl)} kg</b></div>
    </div>` : ''}
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
/* 计划变更：出库后不允许变更（甲方确认 Q02），原变更申请入口已下线 */

/* ================= 库管员：首页 ================= */
PAGES['keeper-home'] = {
  title: '出库与台账',
  tabs: () => roleTabs('keeper-home', 0),
  render(p) {
    const f = p.f || 'ready';
    const pending = DB.outbounds.filter(o => o.status === '待复核');
    const ready = DB.plans.filter(x => x.status === '待出库').filter(x => (outboundByPlan(x.id) || {}).status !== '待复核');
    const outs = DB.outbounds;
    /* 原出库库管员同步可见：在途（押送中）可跟踪，到库（待入库确认）方可拍照核销 */
    const retsAll = DB.returns.filter(r => ['押送中', '待入库确认'].includes(r.status));
    const rets = DB.returns.filter(r => r.status === '待入库确认');
    const st = MASTER.storages.find(s => s.id === 'S1');
    let body = '';
    if (f === 'ready') body = (ready.length ? ready.map(x => `<div class="card plan-card">
        <div class="pc-top"><span class="pc-no">${esc(x.planNo)}</span>${statusPill(x.status)}</div>
        <div class="pc-name">${esc(site(x.site).name)}</div>
        <div class="pc-sub">${esc(project(x.project).name)} · 计划量 ${Math.round(planKg(x.items))}kg ${levelBadge(x)}<span class="pc-area">${esc(planArea(x).name)}</span></div>
        <div class="pc-time">计划爆破 ${fmtTime(x.planStart)} ~ ${fmtTime(x.planEnd)}</div>
        <div class="pc-time">运输安排：${esc(transBrief(x).full)}</div>
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
    if (f === 'ret') body = retsAll.length ? retsAll.map(r => {
      const pl = planById(r.plan);
      const tl = r.escortScan ? `押运员已扫码接单 ${fmtTime(r.escortScan.time)}（${esc(person(r.escortScan.by).name)}）` : '待押运员扫码';
      const canIn = r.status === '待入库确认';
      return `<div class="card plan-card" ${canIn ? `onclick="keeperConfirmReturn('${r.id}')"` : ''}>
        <div class="pc-top"><span class="pc-no">${esc(r.retNo)}</span>${statusPill(r.status)}</div>
        <div class="pc-name">${esc(site(pl.site).name)} → <b>${esc(r.targetName || storage(r.target || 'S1').name)}</b></div>
        <div class="pc-sub">${r.items.map(i => goodsName(i.goods) + ' ' + i.qty + GOODS[i.goods].unit).join('、')} · ${r.items.length} 项</div>
        <div class="pc-sub">${esc(tl)}${r.arriveTime ? ' · 到达 ' + fmtTime(r.arriveTime) : ''}${canIn ? ' · 点卡片拍照核销入库' : ' · 押运员尚未确认到达'}</div></div>`;
    }).join('') : EMPTY('暂无在途或待入库的退库单');
    return `
    <div class="stock-strip">
      <div class="ss-t">城西销售库 · 实时存量<i class="ss-hint">（出库与退库入库按库房分别记账）</i></div>
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
      <button type="button" class="seg-i ${f === 'ret' ? 'on' : ''}" onclick="nav.reset('keeper-home',{f:'ret'})">退库核销 ${retsAll.length || ''}</button>
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
    ${wizBar(1, 2, ['选计划与明细', '签名提交'])}
    <div class="head-card sm">
      <div class="hc-no">从 城西销售库 发出</div>
      <div class="hc-name">出库登记 · 一单可覆盖多个作业点</div>
      <div class="hc-sub">勾选本次装车的计划（可合并），按作业点拆分明细；合并总重 ${totalKg}kg（勾选实时累计），签收时将校验车辆载重</div>
    </div>
    <div data-wst="1">
    ${ready.map((pl, i) => {
      const checked = i === 0 ? 'checked' : '';
      return `<div class="form-card out-plan" id="op_${i}">
      <div class="fc-title"><label style="display:flex;align-items:center;gap:6px"><input type="checkbox" id="os_${i}" ${checked} onchange="toggleOutPlan(${i})"> ${esc(pl.planNo)} · ${esc(site(pl.site).name)}（${Math.round(planKg(pl.items))}kg）</label></div>
      <div class="kv"><span>运输安排（负责人）</span><b style="font-size:12px;text-align:right">${esc(transBrief(pl).v)} · ${esc(transBrief(pl).e)}<br>${esc(transBrief(pl).r)}</b></div>
      ${pl.items.map((it, j) => {
        const stockQty = (st.stock[it.goods] && st.stock[it.goods][it.spec]) || 0;
        return `<div class="out-item" style="opacity:${checked ? 1 : 0.45}">
          <div class="oi-name">${esc(goodsName(it.goods))} · ${esc(it.spec)}</div>
          <div class="oi-line">计划 <b>${it.qty}</b> ${esc(GOODS[it.goods].unit)} · 库存 <b>${stockQty}</b></div>
          <div class="oi-edit">
            <span>实发</span><input type="number" id="oq_${i}_${j}" value="${it.qty}" data-max="${it.qty}">
            <span class="f-unit">${esc(GOODS[it.goods].unit)}</span>
          </div>
          <div class="oi-edit"><span>批次号</span><input id="ob_${i}_${j}" value="ZY-2026-B${210 + i * 3 + j}"></div>
        </div>`;
      }).join('')}
      <div class="f-note">实发必须等于计划量，不能超计划发料（甲方确认 Q03）；库存不足时须先补充库存或调整计划。</div>
    </div>`;
    }).join('')}
    </div>
    <div data-wst="2">
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
    <button class="btn primary block" onclick="submitOutbound()">提交出库登记</button>
    </div>
    ${wizNav(1, 2)}`;
  },
  after() { initSign('sign_cv', window._formState, 'sign'); wizApply(1); }
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
      if (q > it.qty) bad = it;
      items.push({ goods: it.goods, spec: it.spec, qty: q, batch: val('ob_' + i + '_' + j) });
    });
    groups.push({ plan: pl.id, site: pl.site, items });
  });
  if (noSel) return toast('请至少勾选 1 个计划', false);
  if (!window._formState.sign) return toast('请登记库管员手写签名', false);
  if (bad) return toast(`「${goodsName(bad.goods)}」实发超出计划量：严格按作业计划出库，不能超（甲方确认 Q03）`, false);
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
      <div class="f-row"><label>复核人身份证号（Q05 身份核验）</label><input id="rc_idno" placeholder="输入本人身份证号进行身份验证"></div>
      <div class="sign-box"><canvas id="sign2_cv" width="600" height="200"></canvas>
        <div style="display:flex;gap:8px;margin-top:6px">
          <button class="btn ghost sm" onclick="clearSign('sign2_cv',window._formState,'sign2')">清除</button>
          <button class="btn ghost sm" onclick="demoSign('sign2_cv',window._formState,'sign2')">演示快速签名</button>
        </div></div>
      <div class="f-note">登记人与复核人须为 2 名及以上不同自然人，按身份证核验身份（甲方确认 Q05）；库存于复核人点击通过后扣减；不考虑复核超时或撤销，驳回时由登记库管员修改后重新提交。</div>
    </div>
    <button class="btn primary block" onclick="submitOutConfirm('${o.id}')">复核签名确认 · 出库生效</button>`;
  },
  after() { initSign('sign2_cv', window._formState, 'sign2'); }
};
function submitOutConfirm(outId) {
  const o = outboundById(outId);
  const me = DB.keeperId || 'P4';
  if (me === o.keeper) return toast('登记与复核须为不同库管员（双人双锁），请切换身份后复核', false);
  if (!val('rc_idno').trim()) return toast('请输入复核人身份证号完成身份验证（甲方确认 Q05）', false);
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
  if (!rt) return toast('退库单不存在', false);
  if (rt.status !== '待入库确认') return toast('押运员尚未确认到达，暂不能入库确认', false);
  const pl = planById(rt.plan);
  const st = storage(rt.target || 'S1');
  const kind = rt.useStorage ? `原路退回原库「${st.name}」` : `退回中间库「${st.name}」`;
  const before = Object.values(st.stock.zy || {}).reduce((a, b) => a + b, 0);
  formSheet('退库入库确认（拍照核实）', `
    <div class="kv"><span>退库单</span><b>${esc(rt.retNo)}</b></div>
    <div class="kv"><span>入库去向</span><b>${esc(kind)}</b></div>
    <div class="kv"><span>来源作业点</span><b>${esc(site(pl.site).name)}</b></div>
    ${rt.items.map(i => `<div class="kv"><span>${esc(goodsName(i.goods))} · ${esc(i.spec)}<i class="batch">${esc(i.batch)}</i></span><b>+${i.qty} ${esc(GOODS[i.goods].unit)}</b></div>`).join('')}
    <div class="kv"><span>入库前库存</span><b>炸药 ${before}kg</b></div>
    <div class="f-row"><label>入库照片</label><input id="in_photo" type="file" accept="image/*" capture="environment" multiple class="f-sel w"></div>
    <div class="f-note">须现场拍摄退库货物与库房实景，核对批次与数量一致后方可入库；入库后库存按批次回加。</div>
  `, mask => {
    const fi = mask.querySelector('#in_photo');
    const n = fi && fi.files ? fi.files.length : 0;
    if (!n) { toast('请至少拍摄 / 选择 1 张入库照片', false); return; }
    confirmReturn(rt, 'P4', n);
    saveDB();
    const after = Object.values(st.stock.zy || {}).reduce((a, b) => a + b, 0);
    closeSheet(mask);
    toast(`已拍照核销入库「${st.name}」，库存 ${before}kg → ${after}kg`, true);
    nav.render();
  }, '拍照核实并入库');
}
