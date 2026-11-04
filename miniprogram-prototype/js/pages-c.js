/* ============================================================
 * pages-c.js — 民警 / 治安管理员 / 启动入口
 * ============================================================ */
Object.assign(PAGES, {

  /* ================= 民警：待办首页 ================= */
  'police-home': {
    title: '民警监管',
    tabs: () => [
      { label: '待办', icon: IC.home, active: true, go: "nav.reset('police-home')" },
      { label: '检查', icon: IC.shield, go: "nav.reset('police-checks')" },
      { label: '统计', icon: IC.chart, go: "nav.reset('police-stats')" },
      { label: '消息', icon: IC.msg, go: "nav.reset('messages')" },
      { label: '我的', icon: IC.me, go: "nav.reset('my')" }
    ],
    render() {
      const wa = curArea(), pol = curPolice();
      const mine = areaPlans();
      const audit = mine.filter(x => x.status === '待审核');
      const verify = mine.filter(x => ['待核验', '责令整改'].includes(x.status));
      const overseen = mine.filter(x => ['运输中', '待接收', '已到场'].includes(x.status));
      const overdue = mine.filter(x => x.status === '待核验' && Date.now() - (x.blastTime || x.createdAt) > 24 * H);
      const myChecks = DB.checks.filter(c => !c.plan || planInMyArea(planById(c.plan)));
      const card = (x, fn) => planCard(x, fn);
      return `
      <div class="page-title">远程监管核验（F/K 模块）<span class="page-sub">远程核验无需到场（Q2）· 分级检查（R8）</span></div>
      <div class="card area-bar">
        <div class="ab-info"><b>${esc(wa.name)}</b><span>责任民警 ${esc(pol.name)} · ${esc(wa.unit)} · ${esc(wa.scope || '')}</span></div>
        <button class="btn ghost sm" onclick="pickPoliceArea()">切换工区民警</button>
      </div>
      <div class="card todo-head">
        <div class="td"><b>${audit.length}</b><span>待审核</span></div>
        <div class="td"><b>${verify.length}</b><span>待核验</span></div>
        <div class="td"><b>${myChecks.filter(c => c.status !== '已完成').length}</b><span>检查中</span></div>
        <div class="td ${overdue.length ? 'bad' : ''}"><b>${overdue.length}</b><span>超24h督办</span></div>
      </div>
      <div class="sec-title">待审核计划（A03 · R7 开关开启）</div>
      ${audit.length ? audit.map(x => card(x, 'policeGoAudit')).join('') : EMPTY('本工区暂无待审核计划')}
      <div class="sec-title">待远程核验（F01/F02）</div>
      ${verify.length ? verify.map(x => card(x, 'policeGoVerify')).join('') : EMPTY('本工区暂无待核验作业点')}
      <div class="sec-title">在管作业点（重点关注）</div>
      ${overseen.length ? overseen.map(x => card(x, 'policeGoVerify')).join('') : EMPTY('本工区暂无进行中作业点')}
      <button class="btn ghost block" onclick="nav.push('police-check-new')">＋ 对任一环节发起公安检查（K01）</button>`;
    }
  }
});
function pickPoliceArea() {
  sheet('切换工区责任民警（演示）', MASTER.workareas.map(w => ({ label: `${w.name} · ${person(w.police).name}`, id: w.police })), x => {
    DB.policeId = x.id;
    saveDB();
    toast(`已切换为 ${person(x.id).name}（${curArea().name}）`, true);
    nav.reset('police-home');
  });
}
function policeGoAudit(id) { nav.push('police-audit', { id }); }
function policeGoVerify(id) { nav.push('police-verify', { id }); }

Object.assign(PAGES, {
  /* ================= 民警：计划审核 ================= */
  'police-audit': {
    title: '计划审核',
    render(p) {
      const pl = planById(p.id);
      if (!planInMyArea(pl)) return `<div class="card warn-card">
        <div class="fc-title">不在本工区审核范围</div>
        <p class="f-note">该计划归属「${esc(planArea(pl).name)}」，责任民警为 ${esc(person(planArea(pl).police).name)}；当前身份为 ${esc(curArea().name)} · ${esc(curPolice().name)}，无权审核。</p>
      </div>
      <button class="btn ghost block" onclick="nav.back()">返回待办</button>`;
      const kg = Math.round(planKg(pl.items));
      const t = tierOf(planKg(pl.items));
      const gapH = (pl.planStart - Date.now()) / H;
      return `
      <div class="head-card">
        <div class="hc-top">${statusPill(pl.status)}<span class="lvb ${t.cls}">${esc(t.level)}</span></div>
        <div class="hc-no">${esc(pl.planNo)}</div>
        <div class="hc-name">${esc(site(pl.site).name)}</div>
        <div class="hc-sub">${esc(project(pl.project).name)} · 作业量 ${kg}kg</div>
        <div class="hc-sub">所属工区：${esc(planArea(pl).name)} · 责任民警 ${esc(person(planArea(pl).police).name)}</div>
        <div class="hc-time">计划爆破 ${fmtFull(pl.planStart)} ~ ${fmtFull(pl.planEnd)}</div>
        <div class="hc-time">填报提前量 ${gapH.toFixed(1)} 小时 ${gapH >= 6 ? '（满足 R9）' : '（异常）'}</div>
      </div>
      <div class="card">
        <div class="fc-title">计划明细</div>
        ${pl.items.map(it => `<div class="kv"><span>${esc(goodsName(it.goods))} · ${esc(it.spec)}</span><b>${it.qty} ${esc(GOODS[it.goods].unit)}</b></div>`).join('')}
        <div class="kv"><span>项目负责人</span><b>${esc(person(pl.applicant).name)}</b></div>
        <div class="kv"><span>安全员 / 监理</span><b>${esc(person(pl.officer).name)} / ${esc(person(pl.supervisor).name)}</b></div>
        ${pl.remark ? `<p class="f-note">${esc(pl.remark)}</p>` : ''}
      </div>
      ${t.level !== '抽查' ? `<div class="card warn-card sm"><div class="f-note">按作业量 ${kg}kg，审核通过后系统将自动向「${esc(t.unit)}」派发到场监督任务（K05）。</div></div>` : ''}
      <div class="form-card">
        <div class="fc-title">审核意见（驳回必填）</div>
        <textarea id="a_remark" class="f-ta" placeholder="通过可留空；驳回必须填写原因，将自动通知项目负责人"></textarea>
      </div>
      <div class="btn-row">
        <button class="btn ghost" onclick="doAudit('${pl.id}',false)">驳回</button>
        <button class="btn primary" onclick="doAudit('${pl.id}',true)">审核通过 · 允许出库</button>
      </div>`;
    }
  }
});
function doAudit(id, pass) {
  const pl = planById(id);
  if (!planInMyArea(pl)) return toast('该计划不属于本工区，无法审核', false);
  const r = val('a_remark').trim();
  if (!pass && !r) return toast('驳回必须填写原因', false);
  auditPlan(pl, pass, r, curPoliceId());
  saveDB();
  toast(pass ? '已通过，已通知库管员备料出库' : '已驳回，已通知项目负责人', true);
  nav.reset('police-home');
}
function closeException(id) {
  const e = byId(DB.exceptions, id);
  if (!e) return;
  confirmSheet('处置闭环', `确认「${e.type}」已完成现场核实与处置？闭环后相关计划可继续推进。`, () => {
    e.status = '已闭环'; e.closeTime = Date.now();
    if (e.plan) { const p = planById(e.plan); pushMsg('项目负责人', `异常已闭环：${e.type}（${p ? p.planNo : e.plan}）。`); }
    saveDB(); toast('异常已闭环，链路可继续推进', true); nav.render();
  }, '确认闭环');
}

Object.assign(PAGES, {
  /* ================= 民警：远程核验（俯瞰卡片同源）================= */
  'police-verify': {
    title: '远程核验',
    render(p) {
      const pl = planById(p.id);
      if (!planInMyArea(pl)) return `<div class="card warn-card">
        <div class="fc-title">不在本工区管辖范围</div>
        <p class="f-note">该作业点归属「${esc(planArea(pl).name)}」，当前身份为 ${esc(curArea().name)} · ${esc(curPolice().name)}。</p>
      </div>
      <button class="btn ghost block" onclick="nav.back()">返回</button>`;
      const o = outboundByPlan(pl.id);
      const bl = blastingByPlan(pl.id);
      const rc = receiveByPlan(pl.id);
      const vf = verifyByPlan(pl.id);
      const checks = DB.checks.filter(c => c.plan === pl.id);
      return `
      <div class="head-card sm">
        <div class="hc-top">${statusPill(pl.status)}${levelBadge(pl)}</div>
        <div class="hc-no">${esc(pl.planNo)}</div>
        <div class="hc-name">${esc(site(pl.site).name)} · ${esc(person(pl.officer).name)} 等在岗</div>
      </div>
      ${timelineHTML(pl)}
      ${checks.length ? `<div class="card"><div class="fc-title">该作业点检查记录（K07 一作业点一档）</div>
        ${checks.map(c => `<div class="kv"><span>${esc(c.no)} · ${esc(c.bizType)} · ${esc(c.level)}</span><b>${c.result || c.status}</b></div>`).join('')}</div>` : ''}
      ${vf ? `<div class="card done-card"><div class="fc-title">已出具核验结论（F04）</div>
        <div class="kv"><span>结论</span><b>${esc(vf.conclusion)}</b></div><div class="kv"><span>核验人</span><b>${esc(person(vf.police).name)} · ${fmtTime(vf.time)}</b></div>
        ${vf.remark ? `<p class="f-note">${esc(vf.remark)}</p>` : ''}</div>
        <button class="btn ghost block" onclick="nav.push('police-check-new',{plan:'${pl.id}'})">对该作业点发起公安检查</button>` : `
      <div class="form-card">
        <div class="fc-title">核验清单（F03 · 5 项打勾，任一项不通过强制填说明）</div>
        ${[['cert', '证照齐全'], ['cordon', '警戒设置'], ['onduty', '人员在岗'], ['camera', '监控在线'], ['ledger', '台账一致']].map(x => `
          <label class="check-line"><input type="checkbox" id="v_${x[0]}" checked onchange="vfFailCheck()"><span>${x[1]}</span><i>通过</i></label>`).join('')}
        <textarea id="v_remark" class="f-ta" placeholder="核验意见 / 不通过项说明"></textarea>
      </div>
      <div class="form-card">
        <div class="fc-title">远程调阅（F06）· 无需到场</div>
        <div class="kv"><span>现场照片</span><b>${rc ? rc.photos : 0} 张（时间/坐标/人员水印）</b></div>
        <div class="kv"><span>轨迹回放</span><b><u style="cursor:pointer" onclick="toast('已调阅轨迹回放（演示）',true)">点击调阅</u></b></div>
        <div class="kv"><span>出库联单</span><b><u style="cursor:pointer" onclick="nav.push('keeper-out-detail',{id:'${o ? o.id : ''}'})">查看</u></b></div>
      </div>
      <div class="form-card">
        <div class="fc-title">核验结论</div>
        <div class="radios">
          <label><input type="radio" name="v_con" value="通过" checked>通过 · 归档</label>
          <label><input type="radio" name="v_con" value="责令整改">责令整改</label>
          <label><input type="radio" name="v_con" value="移交查处">移交查处</label>
        </div>
      </div>
      <button class="btn primary block" onclick="submitVf('${pl.id}')">出具核验结论（R5 · 归档前置条件）</button>`}`;
    }
  }
});
function vfFailCheck() {
  const allOk = ['cert', 'cordon', 'onduty', 'camera', 'ledger'].every(k => val('v_' + k) === 'true' || document.getElementById('v_' + k).checked);
  if (!allOk) toast('存在不通过项，必须填写说明并可能生成整改单', false);
}
function submitVf(id) {
  const pl = planById(id);
  const items = {}; let fail = false;
  ['cert', 'cordon', 'onduty', 'camera', 'ledger'].forEach(k => { items[k] = document.getElementById('v_' + k).checked; if (!items[k]) fail = true; });
  const con = (document.querySelector('input[name=v_con]:checked') || {}).value;
  const r = val('v_remark').trim();
  if (fail && !r) return toast('清单存在不通过项，必须填写说明', false);
  if (con !== '通过' && !r) return toast('非通过结论须填写核验意见', false);
  submitVerify(pl, items, con, r, 'POL1');
  saveDB();
  toast(con === '通过' ? '核验通过，链路归档完成' : '已出具「' + con + '」，进入整改闭环', true);
  nav.reset('police-home');
}

Object.assign(PAGES, {
  /* ================= 民警：检查任务列表 ================= */
  'police-checks': {
    title: '公安检查',
    tabs: () => [
      { label: '待办', icon: IC.home, go: "nav.reset('police-home')" },
      { label: '检查', icon: IC.shield, active: true, go: "nav.reset('police-checks')" },
      { label: '统计', icon: IC.chart, go: "nav.reset('police-stats')" },
      { label: '消息', icon: IC.msg, go: "nav.reset('messages')" },
      { label: '我的', icon: IC.me, go: "nav.reset('my')" }
    ],
    render() {
      const list = DB.checks.filter(c => !c.plan || planInMyArea(planById(c.plan)));
      return `
      <div class="page-title">公安检查与监督（K 模块）<span class="page-sub">分级到场 · 必须拍照留证（K03）</span></div>
      <div class="card rule-card">
        <div class="fc-title">分级阈值（K04 · 后台可配）</div>
        <div class="kv"><span>&lt; 600kg</span><b>辖区民警抽查</b></div>
        <div class="kv"><span>600 – 1200kg</span><b>工区警务室须到场</b></div>
        <div class="kv"><span>&gt; 1200kg</span><b>治安大队须到场</b></div>
        <div class="f-note">雷管按 TNT 当量折算（系数后台可配 tnt_ratio）。</div>
      </div>
      <div class="sec-title">检查任务</div>
      ${list.length ? list.map(c => {
        const pl = c.plan ? planById(c.plan) : null;
        return `<div class="card plan-card" onclick="nav.push('police-check-do',{id:'${c.id}'})">
          <div class="pc-top"><span class="pc-no">${esc(c.no)}</span>${statusPill(c.status)}${c.auto ? '<em class="auto-tag">系统按量派发</em>' : ''}</div>
          <div class="pc-name">${esc(c.bizType)}环节 · ${esc(c.level)}</div>
          <div class="pc-sub">${pl ? esc(pl.planNo) + ' · ' + esc(site(pl.site).name) : ''} · 到场单位：${esc(c.arriveUnit)}</div>
          <div class="pc-time">${c.sign ? '已签到 ' + fmtTime(c.sign.time) : '未签到'}</div>
        </div>`;
      }).join('') : EMPTY('本工区暂无检查任务')}
      <button class="btn ghost block" onclick="nav.push('police-check-new')">＋ 发起检查（K01 · 任一环节）</button>`;
    }
  },

  /* ================= 民警：发起/执行检查 ================= */
  'police-check-new': {
    title: '发起公安检查',
    render(p) {
      window._formState = { ckphotos: 0 };
      const plans = areaPlans();
      if (!plans.length) return `<div class="card warn-card"><p class="f-note">本工区暂无可检查的作业点。</p></div><button class="btn ghost block" onclick="nav.back()">返回</button>`;
      const def = (p.plan && planById(p.plan) && planInMyArea(planById(p.plan))) ? planById(p.plan) : plans[plans.length - 1];
      let biz = '计划';
      let tpl = TEMPLATES[biz];
      return `
      <div class="page-title">发起检查（K01）<span class="page-sub">六节点任一环节均可检查 · 内容可配置（K02）</span></div>
      <div class="form-card">
        <div class="f-row"><label>关联作业点</label><div class="f-select" id="c_plan" data-v="${def.id}" onclick="sheet('选择作业点（本工区）', areaPlans().map(x=>({label:x.planNo+' · '+site(x.site).name,id:x.id})),(x)=>{document.getElementById('c_plan').textContent=x.label.split(' · ')[0];document.getElementById('c_plan').dataset.v=x.id;})">${esc(def.planNo)}</div></div>
        <div class="f-row"><label>检查环节</label><select id="c_biz" class="f-sel w" onchange="renderCkTpl()">${Object.keys(TEMPLATES).map(k => `<option>${k}</option>`).join('')}</select></div>
      </div>
      <div class="form-card">
        <div class="fc-title">检查项（自定义模板 · 可增删）</div>
        <div id="c_tpl">${tpl.map(x => ckLine(x)).join('')}</div>
        <button class="btn ghost sm" onclick="addCkLine()">＋ 添加检查项</button>
      </div>
      <div class="form-card">
        <div class="fc-title">检查留证（K03 · 必须上传照片）</div>
        ${photoStrip(window._formState, 'ckphotos')}
      </div>
      <div class="form-card">
        <div class="fc-title">检查结论（K06）</div>
        <div class="radios">
          <label><input type="radio" name="c_con" value="合格" checked>合格</label>
          <label><input type="radio" name="c_con" value="限期整改">限期整改</label>
          <label><input type="radio" name="c_con" value="移交查处">移交查处</label>
        </div>
        <textarea id="c_remark" class="f-ta" placeholder="检查意见 / 整改要求"></textarea>
      </div>
      <button class="btn primary block" onclick="submitCheck()">提交检查结果</button>`;
    }
  },

  'police-check-do': {
    title: '检查任务',
    render(p) {
      const c = byId(DB.checks, p.id);
      const pl = c.plan ? planById(c.plan) : null;
      window._formState = (window._ckState && window._ckState.id === c.id) ? window._ckState
        : (window._ckState = { id: c.id, ckphotos: c.photos || 0, ck: {} });
      return `
      <div class="head-card sm">
        <div class="hc-top">${statusPill(c.status)}<span class="lvb ${tierOf(planKg(pl.items)).cls}">${esc(c.level)}</span></div>
        <div class="hc-no">${esc(c.no)} · ${esc(c.bizType)}环节</div>
        <div class="hc-name">${pl ? esc(site(pl.site).name) : ''}</div>
        <div class="hc-sub">到场单位：${esc(c.arriveUnit)}${c.auto ? ' · 系统按作业量自动派发（K05）' : ''}</div>
        ${c.sign ? `<div class="hc-time">已签到：${esc(c.sign.unit)} · ${fmtFull(c.sign.time)}（定位打卡）</div>` : ''}
      </div>
      ${c.result ? `<div class="card done-card">
        <div class="kv"><span>检查结论</span><b>${esc(c.result)}</b></div>
        <div class="kv"><span>照片留证</span><b>${c.photos} 张</b></div>
        ${c.remark ? `<p class="f-note">${esc(c.remark)}</p>` : ''}
      </div>` : `
      <div class="form-card">
        <div class="fc-title">检查项执行（K02 · 任一项异常须填说明）</div>
        ${(c.template || []).map((x, i) => ckExecLine(x, i)).join('')}
        <button class="btn ghost sm block" onclick="arriveSign('${c.id}')">到场签到（扫码/定位打卡 K05）</button>
      </div>
      <div class="form-card">
        <div class="fc-title">检查留证（K03 · 无照片禁止提交）</div>
        ${photoStrip(window._formState, 'ckphotos')}
      </div>
      <div class="form-card">
        <div class="fc-title">检查结论</div>
        <div class="radios">
          <label><input type="radio" name="d_con" value="合格" checked>合格</label>
          <label><input type="radio" name="d_con" value="限期整改">限期整改</label>
          <label><input type="radio" name="d_con" value="移交查处">移交查处</label>
        </div>
        <textarea id="d_remark" class="f-ta" placeholder="检查意见 / 整改要求（整改需回填结果与照片，形成闭环）"></textarea>
      </div>
      <button class="btn primary block" onclick="submitCheckDo('${c.id}')">提交检查结果</button>`}`;
    }
  }
});
function ckExecLine(x, i) {
  const st = (window._formState && window._formState.ck) || {};
  const bad = st[i] === 0;
  return `<div class="ck-line exec"><span class="ck-txt">${esc(x)}</span>
    <div class="ck-chips">
      <button type="button" class="chip ${bad ? '' : 'on'}" onclick="ckSet(${i},1,this)">通过</button>
      <button type="button" class="chip ${bad ? 'bad' : ''}" onclick="ckSet(${i},0,this)">异常</button>
    </div></div>`;
}
function ckSet(i, ok, btn) {
  const st = window._formState || (window._formState = { ck: {} });
  (st.ck = st.ck || {})[i] = ok ? 1 : 0;
  [...btn.parentNode.children].forEach(b => { b.classList.toggle('on', b === btn && !!ok); b.classList.toggle('bad', b === btn && !ok); });
}
function ckLine(x, idPrefix) {
  const id = (idPrefix || 'ck') + '_' + Math.random().toString(36).slice(2, 7);
  return `<div class="ck-line"><input id="${id}" data-ck="1" value="${esc(x)}" class="f-sel w"><button class="it-del" aria-label="删除" type="button" onclick="this.closest('.ck-line').remove()">✕</button></div>`;
}
function addCkLine() {
  const tmp = document.createElement('div'); tmp.innerHTML = ckLine('');
  $('#c_tpl').appendChild(tmp.querySelector('.ck-line'));
}
function renderCkTpl() {
  $('#c_tpl').innerHTML = TEMPLATES[val('c_biz')].map(x => ckLine(x)).join('');
}
function arriveSign(ckId) {
  const c = byId(DB.checks, ckId);
  arriveCheckSign(c, c.arriveUnit);
  saveDB(); toast('已到场签到（定位打卡）', true); nav.render();
}
function submitCheck(prePlan) {
  const planId = val('c_plan') || prePlan || (document.getElementById('c_plan') ? document.getElementById('c_plan').dataset.v : '');
  const pl = planById(planId);
  if (!pl) return toast('请选择作业点', false);
  const items = [];
  document.querySelectorAll('#c_tpl [data-ck]').forEach(el => { if (el.value.trim()) items.push(el.value.trim()); });
  if (!items.length) return toast('请配置检查项', false);
  if (!window._formState.ckphotos) return toast('检查必须上传照片（K03 拦截）', false);
  const con = (document.querySelector('input[name=c_con]:checked') || {}).value;
  const r = val('c_remark').trim();
  if (con !== '合格' && !r) return toast('非合格结论须填写检查意见', false);
  const ck = createCheck(pl, val('c_biz'), items, window._formState.ckphotos, con, r, curPoliceId());
  saveDB();
  toast(`检查单 ${ck.no} 已提交（${con}）`, true);
  nav.reset('police-checks');
}
function submitCheckDo(ckId) {
  const c = byId(DB.checks, ckId);
  if (!window._formState.ckphotos) return toast('检查必须上传照片（K03 拦截）', false);
  if (!c.sign && c.level !== '抽查') return toast('该级别须到场签到后提交（K05）', false);
  const con = (document.querySelector('input[name=d_con]:checked') || {}).value;
  const r = val('d_remark').trim();
  const ckMap = window._formState.ck || {};
  const bad = Object.keys(ckMap).filter(k => ckMap[k] === 0).length;
  if ((bad > 0 || con !== '合格') && !r) return toast('存在异常项 / 非合格结论，须填写说明或整改要求', false);
  c.items = c.template; c.abnormal = bad; c.itemResult = ckMap;
  c.photos = window._formState.ckphotos; c.result = con; c.remark = r; c.status = '已完成'; c.handler = curPoliceId(); c.time = Date.now();
  if (con !== '合格' || bad > 0) DB.exceptions.push({ id: 'EX' + (DB.seq.ex++), plan: c.plan, type: '公安检查·' + con, level: con === '移交查处' ? '高' : '中', time: Date.now(), status: '待处置', desc: r || `检查发现 ${bad} 项异常` });
  saveDB();
  toast(`检查完成（${con}）${con === '合格' ? '' : '，已生成整改单进入闭环'}`, true);
  nav.reset('police-checks');
}

Object.assign(PAGES, {
  /* ================= 民警 / 管理员：统计 ================= */
  'police-stats': {
    title: '监管统计',
    tabs: () => [
      { label: '待办', icon: IC.home, go: "nav.reset('police-home')" },
      { label: '检查', icon: IC.shield, go: "nav.reset('police-checks')" },
      { label: '统计', icon: IC.chart, active: true, go: "nav.reset('police-stats')" },
      { label: '消息', icon: IC.msg, go: "nav.reset('messages')" },
      { label: '我的', icon: IC.me, go: "nav.reset('my')" }
    ],
    render() {
      const scoped = DB.role !== '治安管理员';
      const s = stats(scoped ? curArea().id : null);
      const excList = DB.exceptions.filter(e => !scoped || !e.plan || planInMyArea(planById(e.plan)));
      const met = (label, v, unit, good) => `<div class="metric ${good ? 'good' : ''}"><b>${v}<i>${unit}</i></b><span>${label}</span></div>`;
      return `
      <div class="page-title">监管统计（I06/K08 · 与第三方大屏同源）<span class="page-sub">${scoped ? esc(curArea().name) + ' · ' + esc(curPolice().name) : '全域口径（治安管理员）'}</span></div>
      <div class="metric-grid">
        ${met('链路闭环率', s.closedRate, '%', s.closedRate >= 95)}
        ${met('民警核验覆盖率', s.verifyRate, '%', s.verifyRate >= 100)}
        ${met('节点完整率', 98, '%', true)}
        ${met('提前6h填报率', 92, '%', true)}
        ${met('数量差异率', s.diffRate, '%', s.diffRate <= 2)}
        ${met('退库执行率', s.returnRate, '%', s.returnRate >= 100)}
        ${met('检查覆盖率', s.checkRate, '%', true)}
        ${met('平均在途时长', s.avgTransit, 'min', true)}
      </div>
      <div class="card">
        <div class="fc-title">当前态势</div>
        <div class="kv"><span>计划总数</span><b>${s.total}（在途 ${s.inTransit}）</b></div>
        <div class="kv"><span>已完成闭环</span><b>${s.done}</b></div>
        <div class="kv"><span>检查任务</span><b>${s.checks} 单 · 完成 ${s.checksDone}</b></div>
        <div class="kv ${s.exceptions ? 'warn' : ''}"><span>异常/预警</span><b>${s.exceptions} 条</b></div>
      </div>
      <div class="sec-title">异常看板（G05 · 同步第三方大屏）</div>
      ${excList.length ? excList.map(e => `<div class="card warn-card sm">
        <div class="kv"><span>${esc(e.type)} · ${timeAgo(e.time)}</span><b>${statusPill(e.status)}</b></div>
        <p class="f-note">${esc(e.desc)}</p>
        ${e.status === '待处置' ? `<button class="btn ghost sm block" onclick="closeException('${e.id}')">现场核实 · 处置闭环</button>` : ''}</div>`).join('') : EMPTY('暂无异常事件')}`;
    }
  },

  /* ================= 治安管理员：工作台（基础数据 + 预警和看板）================= */
  'admin-home': {
    title: '治安管理',
    tabs: () => [
      { label: '工作台', icon: IC.chart, active: true, go: "nav.reset('admin-home')" },
      { label: '消息', icon: IC.msg, go: "nav.reset('messages')" },
      { label: '我的', icon: IC.me, go: "nav.reset('my')" }
    ],
    render() {
      const s = stats();
      const open = DB.exceptions.filter(e => e.status !== '已闭环').length;
      const transit = DB.plans.filter(p => p.status === '运输中').length;
      const four = MASTER.persons.filter(p => ['爆破员', '安全员', '保管员', '押运员'].includes(p.role)).length;
      const leaders = MASTER.persons.filter(p => p.role === '项目负责人').length;
      const arrow = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      const item = (page, params, name, desc, tag, n) => `
      <div class="card menu-card" onclick="nav.push('${page}'${params ? ',' + params : ''})" role="button" tabindex="0" aria-label="进入${name}">
        <div class="mc-l"><b>${name}</b><span>${desc}</span></div>
        <i class="mc-n">${n != null ? `<b>${n}</b>` : ''}${tag ? `<span class="src-tag ${tag === '对接' ? 'sync' : 'self'}">${tag}</span>` : ''}${arrow}</i>
      </div>`;
      return `
      <div class="page-title">治安管理员工作台<span class="page-sub">基础数据对接展示 · 预警看板全域口径</span></div>
      <div class="card todo-head">
        <div class="td"><b>${s.closedRate}<i>%</i></b><span>闭环率</span></div>
        <div class="td ${open ? 'bad' : ''}"><b>${open}</b><span>未闭环异常</span></div>
        <div class="td"><b>${transit}</b><span>在途运输</span></div>
      </div>
      <div class="sec-title">基础数据<em class="src-note">对接数据可修正维护 · 车辆/路线由治安大队自录</em></div>
      ${item('admin-base', "{type:'company'}", '民爆公司数据', '公司主体与资质证照（J01）· 可维护', '对接', MASTER.companies.length)}
      ${item('admin-base', "{type:'site'}", '民爆点位数据', '作业点与电子围栏 · 可维护', '对接', MASTER.sites.length)}
      ${item('admin-base', "{type:'storage'}", '库房数据', '销售库/使用库与库存台账（J03/J04）· 可维护', '对接', MASTER.storages.length)}
      ${item('admin-base', "{type:'person'}", '四大员数据', '爆破/安全/保管/押运员（J02）· 可维护', '对接', four)}
      ${item('admin-base', "{type:'project'}", '项目备案数据', '项目、工区范围、有效期（J08）· 可维护', '对接', MASTER.projects.length)}
      ${item('admin-base', "{type:'leader'}", '项目负责人数据', '随公司档案建档（J01/J02）· 可维护', '对接', leaders)}
      ${item('admin-vehicles', null, '车辆数据', '车牌、载重、年审 · 自录即生效（J06/J07）', '自录', MASTER.vehicles.length)}
      ${item('admin-base', "{type:'route'}", '路线数据', '押运路线、里程与沿途打卡点 · 自录', '自录', MASTER.routes.length)}
      <div class="sec-title">预警和看板</div>
      ${item('admin-check-new', null, '发起公安检查', '任一作业点 · 六环节 · 派发或直查（K01）')}
      ${item('admin-board', null, '治安管理员看板', '闭环率、主数据完整率、资质临期（I06/J10）')}
      ${item('admin-mon', null, '监控统计', '在途运输、预警记录、异常督办（G05）', null, open || null)}
      ${item('admin-tier', null, '分级阈值与规则', '到场阈值与规则开关（K04）')}
      ${item('admin-area', null, '工区与责任民警', '计划按工区路由到对应民警（R3）')}`;
    }
  },

  /* ================= 治安管理员：管理员看板（I06/J10）================= */
  'admin-board': {
    title: '管理员看板',
    render() {
      const s = stats();
      const excList = DB.exceptions.filter(e => e.status !== '已闭环');
      return `
      <div class="page-title">治安管理员看板<span class="page-sub">全域数据权限 · 闭环率与异常考核（I06）</span></div>
      <div class="metric-grid">
        <div class="metric good"><b>${s.closedRate}<i>%</i></b><span>链路闭环率</span></div>
        <div class="metric"><b>${s.verifyRate}<i>%</i></b><span>核验覆盖率</span></div>
        <div class="metric"><b>${s.checkRate}<i>%</i></b><span>检查覆盖率</span></div>
        <div class="metric ${s.exceptions ? 'bad' : 'good'}"><b>${s.exceptions}<i>条</i></b><span>未闭环异常</span></div>
      </div>
      <div class="card">
        <div class="fc-title">主数据完整率（J10）· 目标 ≥98%</div>
        ${MASTER.companies.map(c => `<div class="kv"><span>${esc(c.name)} · 资质至 ${esc(c.licenceExpire)}</span><b class="ok">完整</b></div>`).join('')}
        <div class="kv"><span>人员 / 车辆 / 库房 / 项目</span><b>${MASTER.persons.filter(p => p.role !== '民警' && p.role !== '治安管理员').length} / ${MASTER.vehicles.length} / ${MASTER.storages.length} / ${MASTER.projects.length}</b></div>
      </div>
      <div class="card">
        <div class="fc-title">资质临期提醒（XXL-Job 日扫）</div>
        <div class="kv warn"><span>钱有德 保管员资格证 2026-12-31</span><b>30 天内到期</b></div>
      </div>
      <div class="sec-title">异常速览</div>
      ${excList.length ? excList.map(e => `<div class="card warn-card sm"><div class="kv"><span>${esc(e.type)}</span><b>${statusPill(e.status)}</b></div><p class="f-note">${esc(e.desc)}</p>${e.status === '待处置' ? `<button class="btn ghost sm block" onclick="closeException('${e.id}')">督办 · 处置闭环</button>` : ''}</div>`).join('') : EMPTY('暂无异常')}
      <div class="f-tip" onclick="nav.push('admin-mon')">⌁ 在途监控与督办明细</div>`;
    }
  },

  /* ================= 治安管理员：基础数据维护（对接可修正 · 自录即生效）================= */
  'admin-base': {
    title: '基础数据',
    render(p) {
      const invSum = st => {
        const t = k => Object.values(st.stock[k] || {}).reduce((a, b) => a + b, 0);
        return `炸药 ${t('zy')} kg · 雷管 ${t('lg')} 发 · 导爆索 ${t('db')} 米`;
      };
      const T = {
        company: { name: '民爆公司数据', j: 'J01 公司档案', src: '对接', list: MASTER.companies, form: 'company',
          rows: c => [`法定代表人 ${esc(c.legal)} · 员工 ${c.staff || '-'} 人`, `${esc(c.addr || '')}`, `${esc(c.licence)} · 资质有效期至 ${esc(c.licenceExpire)}`],
          title: c => `${esc(c.name)}`, status: c => c.status },
        site: { name: '民爆点位数据', j: '作业点 / 电子围栏', src: '对接', list: MASTER.sites, form: 'site',
          rows: z => [`所属项目 ${esc(project(z.project).name)} · 围栏半径 ${z.fence} 米`, `历史作业 ${z.hist} 次`],
          title: z => `${esc(z.name)}`, status: z => z.status },
        storage: { name: '库房数据', j: 'J03/J04 库房与库存', src: '对接', list: MASTER.storages, form: 'storage',
          rows: st => [`${esc(st.type)} · ${esc(st.addr || '')}`, `建库 ${esc(st.builtAt || '-')} · 面积 ${st.area || '-'}㎡ · 日均用量 ${st.dailyUse || '-'}kg · 员工 ${st.keepers.length} 人`, `围栏 ${st.fence} 米 · 库管员 ${st.keepers.map(k => esc(person(k).name)).join('、')} · 当前库存：${invSum(st)}`],
          title: st => `${esc(st.name)}`, status: st => st.status },
        person: { name: '四大员数据', j: 'J02 人员档案', src: '对接', list: MASTER.persons.filter(x => ['爆破员', '安全员', '保管员', '押运员'].includes(x.role)), form: 'person',
          rows: x => [`${esc(x.role)} · ${esc(company(x.company).name || x.company)} · ${esc(x.idno || '')}`, `${esc(x.cert)} · 有效期至 ${esc(x.certExpire)} · ${esc(x.phone)}${x.remark ? ' · 备注：' + esc(x.remark) : ''}`],
          title: x => `${esc(x.name)}`, status: x => x.status },
        project: { name: '项目备案数据', j: 'J08 项目档案', src: '对接', list: MASTER.projects, form: 'project',
          rows: x => [`${esc(x.type || '')} · 工区 ${esc(workarea(x.workarea).name)}`, `作业范围 ${esc(x.area)} · 备案有效期 ${esc(x.valid)}`],
          title: x => `${esc(x.name)}`, status: x => x.status },
        leader: { name: '项目负责人数据', j: 'J01/J02 随公司档案', src: '对接', list: MASTER.persons.filter(x => x.role === '项目负责人'), form: 'leader',
          rows: x => [`${esc(company(x.company).name || x.company)} · ${esc(x.idno || '')}`, `${esc(x.cert)} · 有效期至 ${esc(x.certExpire)} · ${esc(x.phone)}${x.remark ? ' · 备注：' + esc(x.remark) : ''}`],
          title: x => `${esc(x.name)}`, status: x => x.status },
        route: { name: '路线数据', j: '押运路线 / 沿途打卡点', src: '自录', list: MASTER.routes, form: 'route',
          rows: r => [`${esc(storage(r.from).name)} → ${esc(site(r.to).name)} · 约 ${r.km} km`, `途经 ${esc(r.via)} · 打卡点 ${(r.checkPoints || []).length} 个：${esc((r.checkPoints || []).join('、'))}`],
          title: r => `${esc(r.name)}`, status: r => r.status }
      };
      const cfg = T[p && p.type] || T.company;
      const isRoute = (p && p.type) === 'route';
      const offed = cfg.list.filter(x => (x.status === '停用')).length;
      const logs = masterLogList().filter(m => !isRoute || m.type === '路线').slice(0, 5);
      return `
      <div class="page-title">${cfg.name}<span class="page-sub">${cfg.src === '自录' ? '治安大队自录 · 保存即生效' : '对接数据 · 可本地修正维护'}（${cfg.j}）</span></div>
      <div class="card tint sm"><div class="cb">${cfg.src === '自录'
        ? `由治安大队在本端维护，共 ${cfg.list.length} 条（停用 ${offed} 条）；保存即生效，押运签收等业务节点立即可引用。`
        : `数据源自省民爆信息系统（每日 06:00 同步），共 ${cfg.list.length} 条；治安管理员可在此<strong>修正维护</strong>（如证照临期更新、新增人员备案），修改留痕并标记「本地修正」。`}</div></div>
      ${cfg.list.map(x => {
        const st = x.status || (cfg.src === '自录' ? '' : '生效');
        const off = st === '停用';
        return `<div class="card sm" ${off ? 'style="opacity:.55"' : ''}>
        <div class="kv"><span><b>${cfg.title(x)}</b></span><span class="src-tag ${cfg.src === '自录' ? 'self' : 'sync'}">${cfg.src}</span></div>
        ${cfg.rows(x).map(r => `<p class="f-note">${r}</p>`).join('')}
        ${off ? '<p class="f-note warn">已停用 · 业务节点不可引用</p>' : ''}
        <div class="btn-row">
          <button class="btn ghost sm" onclick="adminForm('${cfg.form}','${x.id}')">编辑</button>
          <button class="btn ghost sm" onclick="confirmSheet('${off ? '恢复' : '停用'}','确认${off ? '恢复' : '停用'}「${cfg.title(x)}」？${off ? '恢复后业务节点可重新引用。' : '停用后业务节点不可再引用。'}',()=>adminToggle('${p && p.type || 'company'}','${x.id}'),'确认',true)">${off ? '恢复' : '停用'}</button>
        </div>
      </div>`; }).join('')}
      <button type="button" class="btn primary block" onclick="adminForm('${cfg.form}')">＋ 新增${cfg.name.replace('数据', '')}</button>
      <div class="sec-title">维护记录（留痕）</div>
      ${logs.length ? `<div class="card sm">${logs.map(m => `<div class="kv"><span>${esc(m.type)} · ${esc(m.name)}</span><b>${esc(m.action)} · ${timeAgo(m.time)}</b></div>`).join('')}</div>` : EMPTY('暂无维护记录')}
      <div class="f-tip" onclick="nav.push('admin-vehicles')">⌁ 车辆数据为自录维护（独立页）</div>`;
    }
  },

  /* ================= 治安管理员：车辆数据（自录 J06/J07）================= */
  'admin-vehicles': {
    title: '车辆数据',
    render() {
      return `
      <div class="page-title">车辆数据（自录）<span class="page-sub">治安大队录入 · 保存即生效，运输节点可引用（J06/J07）</span></div>
      ${MASTER.vehicles.map(v => {
        const soon = v.annualExpire && v.annualExpire <= '2027-01-31';
        const comp = MASTER.companies.find(c => c.id === v.company);
        const act = v.status === '在用' ? '停用' : '恢复';
        const note = v.status === '在用' ? '停用后运输节点不可再选用' : '恢复后运输节点可重新选用';
        return `<div class="card sm">
          <div class="kv"><span><b>${esc(v.plate)}</b> · ${esc(v.model)}</span>${statusPill(v.status)}</div>
          <p class="f-note">承运 ${esc(comp ? comp.name : v.company)} · 核定载重 ${v.load} kg · 许可证 ${esc(v.transLicence || '-')}</p>
          <p class="f-note">运输物品：${esc(v.transGoods || '-')} · 年审至 ${esc(v.annualExpire)}${soon ? ' ⚠ 30 天内到期' : ''}${v.remark ? ' · 备注：' + esc(v.remark) : ''}</p>
          <div class="btn-row">
            <button class="btn ghost sm" onclick="editVehicle('${v.id}')">编辑</button>
            <button class="btn ghost sm" onclick="confirmSheet('${act}车辆','${act} ${esc(v.plate)}？${note}。',()=>toggleVehicle('${v.id}'),'确认',true)">停用 / 恢复</button>
          </div>
        </div>`;
      }).join('')}
      <button type="button" class="btn primary block" onclick="editVehicle()">＋ 新增车辆</button>
      <div class="f-tip">车辆由治安大队自录维护，保存即生效；对接类基础数据（公司 / 点位 / 库房 / 人员 / 项目）不在此修改。</div>`;
    }
  },

  /* ================= 治安管理员：监控统计（G05/K06）================= */
  'admin-mon': {
    title: '监控统计',
    render() {
      const s = stats();
      const transit = DB.plans.filter(p => p.status === '运输中');
      const open = DB.exceptions.filter(e => e.status !== '已闭环');
      const closed = DB.exceptions.filter(e => e.status === '已闭环');
      const overdue = DB.plans.filter(p => ['待核验', '责令整改'].includes(p.status) && Date.now() - (p.blastTime || p.createdAt) > 24 * H);
      return `
      <div class="page-title">监控统计<span class="page-sub">在途运输 · 预警记录 · 检查任务 · 异常督办（G05/K06）</span></div>
      <button class="btn ghost block" onclick="nav.push('admin-check-new')">＋ 对任一环节发起公安检查（K01）</button>
      <div class="card todo-head" style="margin-top:calc(var(--sc)*12px)">
        <div class="td"><b>${transit.length}</b><span>在途运输</span></div>
        <div class="td ${overdue.length ? 'bad' : ''}"><b>${overdue.length}</b><span>超24h未核验</span></div>
        <div class="td"><b>${closed.length}</b><span>已闭环</span></div>
      </div>
      <div class="sec-title">检查任务（全域 · K01 派发与执行）</div>
      ${DB.checks.length ? DB.checks.slice().reverse().slice(0, 8).map(c => {
        const pl = c.plan ? planById(c.plan) : null;
        const wa = pl ? planArea(pl) : null;
        return `<div class="card plan-card" onclick="nav.push('police-check-do',{id:'${c.id}'})">
          <div class="pc-top"><span class="pc-no">${esc(c.no)}</span>${statusPill(c.status)}${c.auto ? '<em class="auto-tag">系统按量派发</em>' : '<em class="auto-tag">管理员发起</em>'}</div>
          <div class="pc-name">${esc(c.bizType)}环节 · ${esc(c.level)}</div>
          <div class="pc-sub">${pl ? esc(pl.planNo) + ' · ' + esc(site(pl.site).name) : ''}${wa ? ' · ' + esc(wa.name) : ''} · 到场单位：${esc(c.arriveUnit)}</div>
          <div class="pc-time">${c.result ? '结论：' + esc(c.result) : (c.sign ? '已签到 ' + fmtTime(c.sign.time) : '未签到 · 点击执行')}</div>
        </div>`;
      }).join('') : EMPTY('暂无检查任务，可对任一环节发起')}
      <div class="sec-title">在途运输监控</div>
      ${transit.length ? transit.map(pl => `<div class="card sm">
        <div class="kv"><span><b>${esc(pl.planNo)}</b> · ${esc(site(pl.site).name)}</span>${statusPill(pl.status)}</div>
        <p class="f-note">押运 ${esc(person(pl.escort).name)} · 驾驶员 ${esc(driver(pl.driver).name)} · ${esc(vehicle(pl.vehicle).plate)} · 出发于 ${timeAgo(pl.departTime || pl.createdAt)}</p>
        <button class="btn ghost sm block" onclick="nav.push('admin-check-new',{plan:'${pl.id}'})">对该运输发起公安检查</button>
      </div>`).join('') : EMPTY('当前无在途运输')}
      <div class="sec-title">预警与异常督办</div>
      ${open.length ? open.map(e => {
        const pl = e.plan ? planById(e.plan) : null;
        return `<div class="card warn-card sm">
          <div class="kv"><span>${esc(e.type)} · ${pl ? esc(pl.planNo) : '无关联计划'}</span><b>${statusPill(e.status)}</b></div>
          <p class="f-note">${esc(e.desc)}${pl ? ' · ' + esc(site(pl.site).name) : ''} · ${timeAgo(e.time)}</p>
          <button class="btn ghost sm block" onclick="closeException('${e.id}')">督办 · 处置闭环</button>
        </div>`;
      }).join('') : EMPTY('暂无预警与异常')}
      <div class="sec-title">预警规则与统计口径</div>
      <div class="card sm">
        <div class="kv"><span>偏离路线预警</span><b>${settings().warnDeviation ? '已开启' : '已关闭'}</b></div>
        <div class="kv"><span>非作业点停留预警</span><b>${settings().warnStay ? '已开启' : '已关闭'}</b></div>
        <div class="kv"><span>闭环率 / 核验覆盖 / 检查覆盖</span><b>${s.closedRate}% / ${s.verifyRate}% / ${s.checkRate}%</b></div>
        <button class="btn ghost sm block" onclick="nav.push('admin-tier')">调整阈值与规则</button>
      </div>
      <div class="f-tip" onclick="nav.push('police-stats')">⌁ 查看完整监管统计</div>`;
    }
  },

  /* ================= 治安管理员：发起公安检查（K01 · 全域）================= */
  'admin-check-new': {
    title: '发起公安检查',
    render(p) {
      window._formState = { ckphotos: 0 };
      const plans = DB.plans.slice();
      if (!plans.length) return `<div class="card warn-card"><p class="f-note">暂无可检查的作业点。</p></div><button class="btn ghost block" onclick="nav.back()">返回</button>`;
      const want = p && p.plan ? planById(p.plan) : null;
      const def = (want && plans.includes(want)) ? want : plans[plans.length - 1];
      const bizKeys = Object.keys(TEMPLATES);
      return `
      <div class="page-title">发起公安检查（K01）<span class="page-sub">全域作业点 · 六节点任一环节 · 检查内容可配置（K02）</span></div>
      <div class="form-card">
        <div class="f-row"><label>关联作业点</label><div class="f-select" id="a_plan" data-v="${def.id}" onclick="sheet('选择作业点（全域）', DB.plans.map(x=>({label:x.planNo+' · '+site(x.site).name,id:x.id})),(x)=>{document.getElementById('a_plan').textContent=x.label.split(' · ')[0];document.getElementById('a_plan').dataset.v=x.id;})">${esc(def.planNo)}</div></div>
        <div class="f-row"><label>检查环节</label><select id="a_biz" class="f-sel w" onchange="renderAcTpl()">${bizKeys.map(k => `<option>${k}</option>`).join('')}</select></div>
      </div>
      <div class="form-card">
        <div class="fc-title">检查项（自定义模板 · 可增删）</div>
        <div id="a_tpl">${TEMPLATES[bizKeys[0]].map(x => ckLine(x, 'ack')).join('')}</div>
        <button class="btn ghost sm" onclick="addAcLine()">＋ 添加检查项</button>
      </div>
      <div class="form-card">
        <div class="fc-title">发起方式</div>
        <div class="radios">
          <label><input type="radio" name="a_mode" value="dispatch" checked onchange="acMode()">派发到场单位执行（按分级阈值自动定到场单位）</label>
          <label><input type="radio" name="a_mode" value="direct" onchange="acMode()">治安管理员直接检查并出结论</label>
        </div>
        <p class="f-note" id="a_mode_note">任务将派发至作业点所属工区责任民警/到场单位，民警在其「检查任务」列表执行，须到场签到并拍照留证。</p>
      </div>
      <div class="form-card" id="a_direct" style="display:none">
        <div class="fc-title">检查留证（K03 · 必须上传照片）</div>
        ${photoStrip(window._formState, 'ckphotos')}
        <div class="fc-title" style="margin-top:calc(var(--sc)*12px)">检查结论（K06）</div>
        <div class="radios">
          <label><input type="radio" name="a_con" value="合格" checked>合格</label>
          <label><input type="radio" name="a_con" value="限期整改">限期整改</label>
          <label><input type="radio" name="a_con" value="移交查处">移交查处</label>
        </div>
        <textarea id="a_remark" class="f-ta" placeholder="检查意见 / 整改要求"></textarea>
      </div>
      <button class="btn primary block" id="a_submit" onclick="submitAdminCheck()">派发检查任务</button>`;
    }
  },

  /* ================= 治安管理员：工区与责任民警（R3）================= */
  'admin-area': {
    title: '工区与民警',
    render() {
      return `
      <div class="page-title">工区与责任民警<span class="page-sub">计划提交时按所属工区路由到对应民警（R3）</span></div>
      ${MASTER.workareas.map(w => {
        const pol = person(w.police);
        const plans = DB.plans.filter(p => planArea(p).id === w.id);
        return `<div class="card sm">
          <div class="kv"><span>${esc(w.name)}</span><b class="ok">${esc(w.unit)}</b></div>
          <p class="f-note">责任民警 ${esc(pol.name)} · ${esc(pol.phone)}</p>
          <p class="f-note">管辖范围：${esc(w.scope || '-')}</p>
          <div class="kv"><span>在建计划</span><b>${plans.length} 个（在办 ${plans.filter(p => p.status !== '已完成').length}）</b></div>
          <button class="btn ghost sm block" onclick="reassignPolice('${w.id}')">调整责任民警</button>
        </div>`;
      }).join('')}
      <div class="f-tip">调整后，新提交计划即时按新民警路由；在办计划归属不变。</div>`;
    }
  },

  /* ================= 治安管理员：分级阈值与规则（K04）================= */
  'admin-tier': {
    title: '阈值与规则',
    render() {
      const s = settings();
      const sw = (k, label, note) => `<div class="card sm menu-card" onclick="toggleSetting('${k}')" role="switch" aria-checked="${!!s[k]}" tabindex="0">
        <div class="mc-l"><b>${label}</b><span>${note}</span></div>
        <i class="mc-n"><span class="sw ${s[k] ? 'on' : ''}"></span></i>
      </div>`;
      return `
      <div class="page-title">分级阈值与规则<span class="page-sub">治安大队配置 · 全域生效（K04/R7）</span></div>
      <div class="card sm">
        <div class="fc-title">分级到场阈值（雷管按 TNT 当量折算）</div>
        <div class="kv"><span>&lt; ${s.tierLow} kg</span><b>抽查 · 辖区民警</b></div>
        <div class="kv"><span>${s.tierLow} – ${s.tierHigh} kg</span><b>工区警务室到场</b></div>
        <div class="kv"><span>&gt; ${s.tierHigh} kg</span><b>治安大队到场</b></div>
        <button class="btn primary sm block" onclick="editTier()">调整阈值</button>
      </div>
      <div class="sec-title">业务规则开关</div>
      ${sw('planAudit', '计划须民警审核', '关闭后计划提交即生效（R7）')}
      ${sw('warnDeviation', '运输偏离路线预警', '偏离 500 米连续 3 点自动预警')}
      ${sw('warnStay', '非作业点停留预警', '停留超 15 分钟自动预警')}
      <div class="f-tip">阈值即时生效，仅影响此后新生成的计划与检查任务。</div>`;
    }
  }
});

/* ---------- 治安管理员操作 ---------- */
function acMode() {
  const direct = (document.querySelector('input[name=a_mode]:checked') || {}).value === 'direct';
  const d = document.getElementById('a_direct');
  if (d) d.style.display = direct ? '' : 'none';
  const note = document.getElementById('a_mode_note');
  if (note) note.textContent = direct
    ? '治安管理员当场检查：须上传照片（K03），并给出检查结论；非合格结论自动生成异常单进入闭环。'
    : '任务将派发至作业点所属工区责任民警/到场单位，民警在其「检查任务」列表执行，须到场签到并拍照留证。';
  const btn = document.getElementById('a_submit');
  if (btn) btn.textContent = direct ? '提交检查结果' : '派发检查任务';
}
function addAcLine() {
  const tmp = document.createElement('div'); tmp.innerHTML = ckLine('');
  $('#a_tpl').appendChild(tmp.querySelector('.ck-line'));
}
function renderAcTpl() {
  $('#a_tpl').innerHTML = TEMPLATES[val('a_biz')].map(x => ckLine(x, 'ack')).join('');
}
function submitAdminCheck() {
  const planId = document.getElementById('a_plan').dataset.v;
  const pl = planById(planId);
  if (!pl) return toast('请选择作业点', false);
  const items = [];
  document.querySelectorAll('#a_tpl [data-ck]').forEach(el => { if (el.value.trim()) items.push(el.value.trim()); });
  if (!items.length) return toast('请配置检查项', false);
  const biz = val('a_biz');
  const direct = (document.querySelector('input[name=a_mode]:checked') || {}).value === 'direct';
  const wa = planArea(pl), pol = person(wa.police);
  if (!direct) {
    const ck = createCheck(pl, biz, items, 0, null, '', curPoliceId());
    ck.dispatchBy = '治安管理员'; ck.status = '待执行';
    pushMsg('民警', `【${wa.name}】治安管理员派发检查任务 ${ck.no}：${pl.planNo}（${biz}环节），到场单位 ${ck.arriveUnit}，请查收执行。`, wa.id);
    saveDB();
    toast(`检查单 ${ck.no} 已派发至 ${wa.name} · ${pol.name}`, true);
    nav.reset('admin-mon');
    return;
  }
  if (!window._formState.ckphotos) return toast('直接检查必须上传照片（K03 拦截）', false);
  const con = (document.querySelector('input[name=a_con]:checked') || {}).value;
  const r = val('a_remark').trim();
  if (con !== '合格' && !r) return toast('非合格结论须填写检查意见', false);
  const ck = createCheck(pl, biz, items, window._formState.ckphotos, con, r, curPoliceId());
  ck.dispatchBy = '治安管理员';
  if (con !== '合格') DB.exceptions.push({ id: 'EX' + (DB.seq.ex++), plan: ck.plan, type: '公安检查·' + con, level: con === '移交查处' ? '高' : '中', time: Date.now(), status: '待处置', desc: r || `治安管理员直查（${biz}环节）发现异常` });
  saveDB();
  toast(`检查单 ${ck.no} 已完成（${con}）${con === '合格' ? '' : '，已生成异常单进入闭环'}`, true);
  nav.reset('admin-mon');
}
function reassignPolice(areaId) {
  const cands = MASTER.persons.filter(p => p.role === '民警');
  sheet('调整责任民警', cands.map(p => ({ label: `${p.name} · ${p.company}`, id: p.id })), x => {
    const w = workarea(areaId);
    w.police = x.id;
    saveDB();
    toast(`${w.name} 责任民警已调整为 ${person(x.id).name}`, true);
    nav.render();
  });
}
function editTier() {
  const s = settings();
  formSheet('调整分级阈值（kg）', `
    <div class="f-row"><label>抽查上限</label><input id="t_low" class="f-num" type="number" value="${s.tierLow}" inputmode="numeric"></div>
    <div class="f-row"><label>警务室上限</label><input id="t_high" class="f-num" type="number" value="${s.tierHigh}" inputmode="numeric"></div>
    <p class="f-note">低于抽查上限→抽查；两者之间→工区警务室到场；高于警务室上限→治安大队到场。</p>
  `, mask => {
    const lo = parseInt(val('t_low'), 10), hi = parseInt(val('t_high'), 10);
    if (!lo || !hi || lo <= 0 || hi <= lo) return toast('请输入有效阈值：上限需大于下限', false);
    s.tierLow = lo; s.tierHigh = hi; saveDB();
    closeSheet(mask);
    toast('阈值已更新，全域生效', true);
    nav.render();
  }, '保存');
}
function toggleSetting(key) {
  const s = settings();
  s[key] = !s[key];
  saveDB();
  toast(s[key] ? '已开启' : '已关闭', true);
  nav.render();
}

/* ---------- 治安管理员：基础数据维护表单（8 类通用，修改留痕）---------- */
const ADMIN_FORMS = {
  company: { key: 'companies', name: '民爆公司', status: '生效', fields: [
    { id: 'name', label: '公司名称', req: 1 },
    { id: 'addr', label: '所在地址', ph: '乐山市市中区××路 ×× 号' },
    { id: 'legal', label: '法定代表人', req: 1 },
    { id: 'staff', label: '员工人数', num: 1, ph: '86' },
    { id: 'licence', label: '许可证编号', ph: 'PB作许字[2026]01号' },
    { id: 'licenceExpire', label: '资质有效期至', ph: '2028-12-31' }
  ] },
  site: { key: 'sites', name: '民爆点位', status: '生效', fields: [
    { id: 'name', label: '作业点名称', req: 1 },
    { id: 'project', label: '所属项目', sel: () => MASTER.projects, req: 1 },
    { id: 'fence', label: '围栏半径（米）', num: 1, req: 1 }
  ] },
  storage: { key: 'storages', name: '库房', status: '生效', fields: [
    { id: 'name', label: '库房名称', req: 1 },
    { id: 'type', label: '使用性质', opts: ['销售库', '使用库'], req: 1 },
    { id: 'addr', label: '所在地址', ph: '市中区城西路 66 号' },
    { id: 'builtAt', label: '建库时间', ph: '2015-06-18' },
    { id: 'area', label: '库房面积（㎡）', num: 1, ph: '3200' },
    { id: 'dailyUse', label: '日均用量（kg）', num: 1, ph: '900' },
    { id: 'company', label: '供给单位', sel: () => MASTER.companies, req: 1 },
    { id: 'fence', label: '围栏半径（米）', num: 1, req: 1 }
  ] },
  person: { key: 'persons', name: '四大员', status: '在岗', fields: [
    { id: 'name', label: '姓名', req: 1 },
    { id: 'role', label: '岗位', opts: ['爆破员', '安全员', '保管员', '押运员'], req: 1 },
    { id: 'company', label: '所属公司', sel: () => MASTER.companies, req: 1 },
    { id: 'idno', label: '身份证号', ph: '510102********0011' },
    { id: 'phone', label: '联系电话', ph: '138****0000' },
    { id: 'cert', label: '作业证号', ph: 'GA-XX-2026-001' },
    { id: 'certExpire', label: '作业证件有效时间', ph: '2028-12-31' },
    { id: 'remark', label: '备注', ph: '如：城西销售库负责人' }
  ] },
  leader: { key: 'persons', name: '项目负责人', status: '在岗', fixRole: '项目负责人', fields: [
    { id: 'name', label: '姓名', req: 1 },
    { id: 'company', label: '所属公司', sel: () => MASTER.companies, req: 1 },
    { id: 'idno', label: '身份证号', ph: '510102********0011' },
    { id: 'phone', label: '联系电话', ph: '138****0000' },
    { id: 'cert', label: '作业证号', ph: 'GA-PM-2026-001' },
    { id: 'certExpire', label: '作业证件有效时间', ph: '2028-12-31' },
    { id: 'remark', label: '备注', ph: '' }
  ] },
  project: { key: 'projects', name: '项目备案', status: '生效', fields: [
    { id: 'name', label: '项目名称', req: 1 },
    { id: 'company', label: '所属公司', sel: () => MASTER.companies, req: 1 },
    { id: 'workarea', label: '所属工区', sel: () => MASTER.workareas, req: 1 },
    { id: 'type', label: '爆破类型', ph: '隧道开挖 / 露天台阶' },
    { id: 'area', label: '作业范围', ph: '青龙山工区 K3+200 ~ K5+800' },
    { id: 'valid', label: '备案有效期', ph: '2026-03-01 ~ 2027-02-28' }
  ] },
  route: { key: 'routes', name: '路线', status: '启用', fields: [
    { id: 'name', label: '路线名称', req: 1 },
    { id: 'from', label: '起运库房', sel: () => MASTER.storages, req: 1 },
    { id: 'to', label: '终点作业点', sel: () => MASTER.sites, req: 1 },
    { id: 'via', label: '途经道路', ph: 'G318 国道 → 青龙山专线' },
    { id: 'km', label: '里程（km）', num: 1 },
    { id: 'checkPoints', label: '沿途打卡点（每行一个）', ta: 1, ph: '青龙山专线入口\n隧道施工便道口' }
  ] }
};
function adminForm(formType, id) {
  const cfg = ADMIN_FORMS[formType];
  if (!cfg) return toast('未知数据类型', false);
  const rec = id ? MASTER[cfg.key].find(x => x.id === id) : null;
  const fieldHtml = cfg.fields.map(f => {
    const v = rec ? (rec[f.id] != null ? rec[f.id] : '') : '';
    if (f.sel) {
      const list = f.sel();
      const cur = rec ? v : list[0].id;
      return `<div class="f-row"><label>${f.label}</label><select id="mf_${f.id}" class="f-sel">${list.map(o => `<option value="${o.id}" ${cur === o.id ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select></div>`;
    }
    if (f.opts) {
      const cur = rec ? v : f.opts[0];
      return `<div class="f-row"><label>${f.label}</label><select id="mf_${f.id}" class="f-sel">${f.opts.map(o => `<option ${cur === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></div>`;
    }
    if (f.ta) return `<div class="f-row"><label>${f.label}</label><textarea id="mf_${f.id}" class="f-ta" placeholder="${esc(f.ph || '')}">${esc(v)}</textarea></div>`;
    return `<div class="f-row"><label>${f.label}${f.req ? ' *' : ''}</label><input id="mf_${f.id}" ${f.num ? 'type="number" inputmode="numeric"' : ''} value="${esc(v)}" placeholder="${esc(f.ph || '')}"></div>`;
  }).join('');
  formSheet(rec ? `编辑${cfg.name}` : `新增${cfg.name}${formType === 'route' || formType === 'company' ? '' : '（对接数据本地维护）'}`, `
    ${fieldHtml}
    <p class="f-note">${formType === 'route'
      ? '路线保存后，押运员签收时可直接快选套用（自动填充途经道路与沿途打卡点）。'
      : '对接类数据的修改会标记「本地修正」并留痕于维护记录；源头系统同步不会覆盖本地修正。'}</p>
  `, mask => {
    const out = {};
    let bad = null;
    cfg.fields.forEach(f => {
      let v = val('mf_' + f.id).trim();
      if (f.num) v = parseFloat(v);
      if (f.req && (v === '' || v == null || (f.num && !(v > 0)))) bad = bad || f;
      if (f.ta) v = v.split('\n').map(s => s.trim()).filter(Boolean);
      out[f.id] = v;
    });
    if (bad) return toast(`请填写「${bad.label}」`, false);
    if (cfg.fixRole) out.role = cfg.fixRole;
    out.status = rec ? rec.status : cfg.status;
    if (rec) out.id = rec.id;
    masterUpsert(cfg.key, out);
    closeSheet(mask);
    toast(rec ? `${cfg.name}信息已修正（已留痕）` : `${cfg.name}已新增生效`, true);
    nav.render();
  }, rec ? '保存修正' : '保存生效');
}
const ADMIN_TYPE_KEY = { company: 'companies', site: 'sites', storage: 'storages', person: 'persons', project: 'projects', leader: 'persons', route: 'routes' };
function adminToggle(baseType, id) {
  const rec = masterToggle(ADMIN_TYPE_KEY[baseType] || 'companies', id);
  if (rec) toast(rec.status === '停用' ? '已停用，业务节点不可再引用' : '已恢复，业务节点可重新引用', true);
  nav.render();
}

/* ---------- 治安管理员：车辆自录（J06/J07） ---------- */
function editVehicle(id) {
  const v = id ? MASTER.vehicles.find(x => x.id === id) : null;
  formSheet(v ? '编辑车辆' : '新增车辆（自录）', `
    <div class="f-row"><label>车牌号</label><input id="v_plate" value="${v ? esc(v.plate) : ''}" placeholder="如 川L·12345"></div>
    <div class="f-row"><label>车型</label><input id="v_model" value="${v ? esc(v.model) : ''}" placeholder="厢式危险品运输车"></div>
    <div class="f-row"><label>核定载重</label><input id="v_load" class="f-num" type="number" value="${v ? v.load : ''}" inputmode="numeric"><span class="src-note">kg</span></div>
    <div class="f-row"><label>承运单位</label><select id="v_company" class="f-sel">${MASTER.companies.map(c => `<option value="${c.id}" ${v && v.company === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
    <div class="f-row"><label>运输许可证</label><input id="v_licence" value="${v ? esc(v.transLicence || '') : ''}" placeholder="川交运许[2024]0118号"></div>
    <div class="f-row"><label>运输物品</label><select id="v_goods" class="f-sel">${['炸药、雷管', '炸药', '雷管', '导爆索'].map(g => `<option ${v && v.transGoods === g ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select></div>
    <div class="f-row"><label>年审到期</label><input id="v_exp" value="${v ? esc(v.annualExpire) : ''}" placeholder="2027-12-31"></div>
    <div class="f-row"><label>备注</label><input id="v_remark" value="${v ? esc(v.remark || '') : ''}" placeholder="如：零星雷管配送用"></div>
    <p class="f-note">车牌格式：省份简称 + 发文机关字 + · + 5 位编号。保存即生效，运输节点立即可选用。</p>
  `, mask => {
    const plate = val('v_plate').trim(), model = val('v_model').trim() || '厢式危险品运输车';
    const load = parseInt(val('v_load'), 10), comp = val('v_company'), exp = val('v_exp').trim();
    const lic = val('v_licence').trim(), goods = val('v_goods'), remark = val('v_remark').trim();
    if (!/^[\u4e00-\u9fa5][A-Z]·\d{5}$/.test(plate)) return toast('车牌格式不正确，如 川L·10295', false);
    if (!load || load <= 0 || load > 50000) return toast('请输入有效核定载重（1–50000kg）', false);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(exp)) return toast('年审到期日期格式应为 2027-12-31', false);
    if (v) {
      Object.assign(v, { plate, model, load, company: comp, transLicence: lic, transGoods: goods, annualExpire: exp, remark });
      toast('车辆信息已更新', true);
    } else {
      MASTER.vehicles.push({ id: 'V' + Date.now().toString(36).toUpperCase(), plate, model, load, company: comp, transLicence: lic, transGoods: goods, annualExpire: exp, remark, status: '在用' });
      toast('车辆已录入生效', true);
    }
    saveDB();
    closeSheet(mask);
    nav.render();
  }, v ? '保存' : '录入生效');
}
function toggleVehicle(id) {
  const v = MASTER.vehicles.find(x => x.id === id);
  if (!v) return;
  v.status = v.status === '在用' ? '停用' : '在用';
  saveDB();
  toast(v.status === '在用' ? '已恢复在用' : '已停用，运输节点不可选用', true);
  nav.render();
}

/* ================= 启动 ================= */
window.addEventListener('DOMContentLoaded', () => {
  loadDB();
  const start = DB.role && DB.role !== 'entry' ? ROLE_HOME[DB.role] : 'entry';
  nav.reset(DB.role && DB.role !== 'entry' ? start : 'entry');
  if (DB.role === 'entry') DB.role = 'entry';
});
