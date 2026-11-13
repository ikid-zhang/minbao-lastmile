/* ============================================================
 * pages-b.js — 押运员 / 安全员 / 安全监理
 * ============================================================ */
/* 当前登录的押运员：默认演示账号 P5 孙立冬 */
function escortMe() { return (DB && DB.escortId) || 'P5'; }
/* 计划上的押运安排（项目负责人上报时确定） */
function planTp(o) { const pl = planById(o.plan); return (pl && pl.transPlan) || {}; }

Object.assign(PAGES, {

  /* ================= 押运员：首页 ================= */
  'escort-home': {
    title: '押运任务',
    tabs: () => roleTabs('escort-home', 0),
    render(p) {
      const f = p.f || 'sign';
      const me = escortMe();
      const scans = (DB.escortScans || []).filter(s => s.by === me).map(s => s.out);
      /* 一单多点：出库单内任一计划指派给本人，整张单都算「指派给我」（与扫码后的押运单保持一致） */
      const outMine = o => outGroups(o).some(g => { const q = planById(g.plan) || {}; return !!(q.transPlan && q.transPlan.escort === me); });
      const unsigned = DB.outbounds.filter(o => !o.signed && o.status === '待签收')
        .map(o => ({ o, mine: outMine(o), scanned: scans.includes(o.id) }))
        .filter(x => x.mine || x.scanned)
        .sort((a, b) => (b.mine - a.mine));
      const onroad = DB.transports.filter(t => t.direction === 'GO' && ['待发车', '运输中'].includes(t.status));
      const retMine = r => !!(r.escortScan && r.escortScan.by === me);
      const rets = DB.returns.filter(r => ['待押送', '押送中'].includes(r.status) && (retMine(r) || r.status === '押送中'));
      const retOpen = DB.returns.filter(r => r.status === '待押送' && !retMine(r));
      let body = '';
      if (f === 'sign') body = unsigned.length ? unsigned.map(({ o, mine, scanned }) => {
        const pl = planById(o.plan);
        const tp = planTp(o);
        const dest = outGroups(o).length > 1 ? `${outGroups(o).length} 个作业点（${outGroups(o).map(g => site(g.site).name).join('、')}）` : site(pl.site).name;
        const noTp = !tp.escort;
        const who = tp.escort ? person(tp.escort).name : '未安排';
        const tag = mine ? `<span class="pill s-done">指派给我</span>`
          : `<span class="pill s-run">扫码接管</span>`;
        return `<div class="card plan-card" onclick="nav.push('escort-sign',{id:'${o.id}'})">
          <div class="pc-top"><span class="pc-no">${esc(o.outNo)}</span>${tag}</div>
          <div class="pc-name">扫码签收 → ${esc(dest)}</div>
          <div class="pc-sub">出库 ${fmtTime(o.outTime)} · 合计 ${Math.round(planKg(o.items))}kg · 车辆 ${esc(tp.vehicle ? vehicle(tp.vehicle).plate : '-')}${tp.route ? ' · 路线 ' + esc((MASTER.routes.find(r => r.id === tp.route) || {}).name || tp.route) : ''}</div>
          <div class="pc-sub">${mine ? '已指派给本人，无需扫码，直接核对签收（无需补办手续）' : (noTp ? '已扫码绑定：负责人未安排押运员，由本人直接押运（自动留痕）' : `已扫码绑定：计划押运员 ${esc(who)}，签收前须办理变更押运员手续`)}</div></div>`;
      }).join('') : EMPTY('暂无待签收出库单');
      if (f === 'road') body = onroad.length ? onroad.map(t => {
        const pl = planById(t.plan);
        return `<div class="card plan-card" onclick="nav.push('escort-transit',{id:'${t.id}'})">
          <div class="pc-top"><span class="pc-no">${esc(t.no)}</span>${statusPill(t.status)}</div>
          <div class="pc-name">${esc(t.route.from)} → ${esc(t.route.to)}</div>
          <div class="pc-sub">${esc(vehicle(t.vehicle).plate)} · ${t.departTime ? '已发车 ' + fmtTime(t.departTime) : '待发车'} · 进度 ${t.progress || 0}%</div></div>`;
      }).join('') : EMPTY('暂无在途任务');
      if (f === 'ret') body = rets.length ? rets.map(r => {
        const pl = planById(r.plan);
        return `<div class="card plan-card" onclick="nav.push('escort-return',{id:'${r.id}'})">
          <div class="pc-top"><span class="pc-no">${esc(r.retNo)}</span>${statusPill(r.status)}</div>
          <div class="pc-name">反向押送：${esc(site(pl.site).name)} → ${esc(r.targetName || storage(r.target || 'S1').name)}</div>
          <div class="pc-sub">${r.items.map(i => goodsName(i.goods) + ' ' + i.qty + GOODS[i.goods].unit).join('、')}</div>
          <div class="pc-sub">${r.escortScan ? `已扫码接单 ${fmtTime(r.escortScan.time)} · 接单人 ${esc(person(r.escortScan.by).name)}` : '押运中'}</div></div>`;
      }).join('') : EMPTY(`暂无已接单的返程押送任务${retOpen.length ? '（有 ' + retOpen.length + ' 张退库单待扫码接单，点右上角「扫码」）' : ''}`);
      return `
      <div class="page-title" style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
        <div>押运运输（C 模块）<span class="page-sub">签收 → 人车路线 → 发车打点 → 在途轨迹</span></div>
        <button class="btn ghost sm" type="button" style="white-space:nowrap" onclick="scanSheet()">扫码</button>
      </div>
      <div class="seg">
        <button type="button" class="seg-i ${f === 'sign' ? 'on' : ''}" onclick="nav.reset('escort-home',{f:'sign'})">待签收 ${unsigned.length || ''}</button>
        <button type="button" class="seg-i ${f === 'road' ? 'on' : ''}" onclick="nav.reset('escort-home',{f:'road'})">在途 ${onroad.length || ''}</button>
        <button type="button" class="seg-i ${f === 'ret' ? 'on' : ''}" onclick="nav.reset('escort-home',{f:'ret'})">返程押送 ${rets.length || ''}</button>
      </div>
      ${body}`;
    }
  },

  /* ================= 押运员：扫码页（直接扫码，不列清单）================= */
  'escort-scan': {
    title: '扫码',
    render() {
      const me = escortMe();
      return `
      <div class="page-title">扫码接单<span class="page-sub">对准联单二维码，识别后按单号自动绑定</span></div>
      <div class="card">
        <div class="scan-box">
          <video id="scan-video" playsinline muted></video>
          <div class="scan-line"></div>
          <span class="scan-ph" id="scan-ph">正在启用摄像头…</span>
        </div>
        <div class="f-note" id="scan-hint" style="text-align:center;margin-top:12px">出库单扫码后直接进入「押运签收」页，退库单扫码后进入「返程押送」</div>
      </div>
      <div class="card sm">
        <div class="kv"><span>当前扫码人</span><b>${esc(person(me).name)} · ${esc(person(me).cert || '-')}</b></div>
        <input class="inp" id="scan-code" placeholder="输入二维码内容（单号）" style="margin-top:10px;display:block;width:100%;box-sizing:border-box" onkeydown="if(event.key==='Enter')submitScanCode()">
        <button class="btn ghost" type="button" style="width:100%;margin-top:10px" onclick="submitScanCode()">确认单号</button>
      </div>`;
    },
    after() {
      window.__scanDone = false;
      initScanCamera();
    }
  },

  /* ================= 押运员：扫码签收（一单可多点 · 校验载重 · 可调卸货顺序）================= */
  'escort-sign': {
    title: '押运签收',
    render(p) {
      const o = outboundById(p.id);
      const groups = outGroups(o);
      const kg = Math.round(planKg(o.items));
      window._formState = { sign: false, tpCheck: {} };
      const ordered = groups.slice().sort((a, b) => MASTER.sites.findIndex(s => s.id === a.site) - MASTER.sites.findIndex(s => s.id === b.site));
      const pl0 = planById(o.plan) || {};
      /* 路线与计划绑定：单点直接用计划路线；一单多点则按每个卸货点匹配「起运库房=出库库房、到达=该点位」的在册路线分段 */
      const planRid0 = (pl0.transPlan && pl0.transPlan.route) || pl0.route || '';
      const planRt0 = MASTER.routes.find(r => r.id === planRid0) || null;
      const segs = ordered.map((g, i) => {
        const gp = planById(g.plan) || {};
        const gt = gp.transPlan || {};
        const rid = gt.route || gp.route || '';
        const rt = MASTER.routes.find(r => r.id === rid) || null;
        const fit = MASTER.routes.find(r => (r.status || '启用') !== '停用' && r.from === o.storage && r.to === g.site) || null;
        const useRt = (rt && rt.from === o.storage && rt.to === g.site) ? rt : (fit || rt);
        const ok = !!(useRt && useRt.from === o.storage && useRt.to === g.site);
        return { idx: i + 1, planNo: gp.planNo || '', site: g.site, rid: (useRt && useRt.id) || '', rt: useRt, exact: ok, planned: rt };
      });
      window._rvSegs = segs;
      // 项目负责人在核实上报时已安排运输车辆与押运员，押运员签收时须逐项核实
      const tp = (planById(o.plan) || {}).transPlan || null;
      const tv = tp ? vehicle(tp.vehicle) : null;
      const te = tp ? person(tp.escort) : null;
      const tpCard = tp ? `<div class="card tp-card">
        <div class="tp-head"><b>项目负责人运输安排 · 待押运员核实</b><span class="pill s-pend">待核实</span></div>
        <div class="kv"><span>运输车辆</span><b>${esc(tv.plate)} · ${esc(tv.model)}</b></div>
        <div class="kv"><span>核定载重 / 本次合计</span><b>${tv.load}kg / ${kg}kg ${tv.load >= kg ? '<em class="ok">载重足够</em>' : '<em class="bad">载重不足</em>'}</b></div>
        <div class="kv"><span>运输许可证</span><b>${esc(tv.transLicence || '-')}</b></div>
        <div class="kv"><span>运输证载明</span><b>${esc(tv.transGoods || '-')} · 路线 ${esc(tv.transRange || '按审批路线')}</b></div>
        <div class="kv"><span>押运员</span><b>${esc(te.name)} · ${esc(te.cert || '-')}（有效期 ${esc(te.certExpire || '-')}）</b></div>
        <div class="kv"><span>安排人 / 时间</span><b>${esc(person(tp.by).name)} · ${fmtTime(tp.arrangedAt)}</b></div>
        <div class="tp-checks">
          <label class="ck-line"><input type="checkbox" data-tpcheck="1" onchange="tpCheck(this)"><span>现场车辆与安排一致（车牌、车型相符）</span></label>
          <label class="ck-line"><input type="checkbox" data-tpcheck="1" onchange="tpCheck(this)"><span>运输许可证与实车一致（证号、路线、物品、运输量）</span></label>
          <label class="ck-line"><input type="checkbox" data-tpcheck="1" onchange="tpCheck(this)"><span>装载量未超核定载重，满足本次 ${kg}kg</span></label>
        </div>
        <div class="f-note">三项核实通过后方可签收发车；发现不一致请驳回并说明，或申请变更车辆（留痕）。</div>
        <div class="tp-ops">
          <button class="btn ghost sm" type="button" onclick="rejectTransport('${o.id}')">上报不一致</button>
          <button class="btn ghost sm" type="button" onclick="pickVehicle(${kg}, true)">申请变更车辆</button>
        </div>
      </div>` : `<div class="card warn-card sm"><div class="f-note">项目负责人尚未安排运输车辆与押运员，本次由押运员现场选定（建议负责人核实环节先行安排）。</div></div>`;
      const me = escortMe();
      /* 一单多点：本单任一点位的计划押运员是本人，即视为「指派给我」，免扫直签 */
      const assigned = outGroups(o).some(g => { const q = planById(g.plan) || {}; return !!(q.transPlan && q.transPlan.escort === me); });
      const mine = assigned;
      const chg = !assigned && !!tp && !!tp.escort && tp.escort !== me;
      const chgCard = chg ? `<div class="card warn-card sm">
        <div class="fc-title">押运员变更手续（本人非计划押运员）</div>
        <div class="kv"><span>计划押运员（主计划）</span><b>${esc(person(tp.escort).name)} · ${esc(person(tp.escort).cert || '-')}</b></div>
        <div class="kv"><span>当前扫码人</span><b>${esc(person(me).name)} · ${esc(person(me).cert || '-')}</b></div>
        <div class="f-row"><label>变更原因</label><input id="ec_reason" class="f-sel w" placeholder="如：原押运员临时调班，现场由本人押运"></div>
        <div class="f-note">计划押运员正常扫码无需补办任何手续；人换了才需办理本变更手续，办理后由本人完成签收，全程留痕并通知项目负责人。</div>
        <button class="btn ghost block" type="button" onclick="doEscortChange('${o.id}')">办理变更押运员手续</button>
      </div>` : (tp && tp.escort ? `<div class="card sm"><div class="f-note">计划押运员即本人（${esc(person(me).name)}），本单已指派给你，无需扫码，核对运输安排后直接签收（无需补办押运员手续）。</div></div>` : `<div class="card sm"><div class="f-note">负责人未安排押运员，本次由现场押运员 ${esc(person(me).name)} 直接押运，签收记录自动留痕。</div></div>`);
      // 指派给我的单不出现扫码步骤；只有扫码接管（本人非计划押运员）才需扫联单二维码
      const qrCard = assigned ? `
      <div class="card sm">
        <div class="kv"><span>本单来源</span><b>负责人指派 · 无需扫码（免扫直签）</b></div>
        <div class="kv"><span>签收人</span><b>${esc(person(me).name)} · ${esc((person(me).phone || '').replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2'))}</b></div>
      </div>` : `
      <div class="card qr-card sm">
        <div class="scan-btn" onclick="window.__scanDone=false;nav.push('escort-scan')">
          <svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 4h6M20 4h-4M4 20v-6M20 20h-6M4 8v4h4M20 8v4h-4" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>
          <span>打开摄像头扫码接单（C01）</span>
        </div>
        <div class="qr-tip">签收人实名绑定：${esc(person(escortMe()).name)} ${esc((person(escortMe()).phone || '').replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2'))}</div>
      </div>`;
      return `${wizBar(1, 3, ['运输安排', '数量与车辆', '路线与打卡'])}
      <div data-wst="1">${tpCard}${chgCard}</div>
      <div data-wst="2">${qrCard}</div>
      <div data-wst="2">` + `
      <div class="form-card">
        <div class="fc-title">逐品种核对数量（${groups.length > 1 ? '一单多点 · 合计 ' + kg + 'kg' : '单点 · ' + kg + 'kg'}）</div>
        ${groups.map(g => `<div class="fc-title" style="margin-top:6px">${esc(site(g.site).name)} · ${esc(planById(g.plan).planNo)}</div>` + g.items.map(it => `<div class="kv"><span>${esc(goodsName(it.goods))} · ${esc(it.spec)}<i class="batch">${esc(it.batch)}</i></span><b>${it.qty} ${esc(GOODS[it.goods].unit)} <em class="ok">✓</em></b></div>`).join('')).join('')}
      </div>
      <div class="form-card">
        <div class="fc-title">驾驶员 / 车辆（C02）· 累计重量 ${kg}kg · 载重不足车辆不可选</div>
        <div class="f-row"><label>驾驶员</label><div class="f-select" id="e_driver" data-v="D1" onclick="pickDriver()">王 强 · 从业资格证 JZ-3301</div></div>
        <div class="f-row"><label>车辆</label><div class="f-select" id="e_vehicle" data-v="${tp ? tp.vehicle : 'V1'}" onclick="pickVehicle(${kg}, true)">${tp ? esc(tv.plate) + ' · 载重 ' + tv.load + 'kg（负责人安排）' : vehicleFor(kg) + ' · 载重合适'}</div></div>
      </div>
      </div>
      <div data-wst="3">
      <div class="form-card">
        <div class="fc-title">运输路线（与计划绑定 · 不可自行改线）</div>
        <div class="kv"><span>起运库房</span><b>${esc(storage(o.storage).name)}</b></div>
        ${segs.map(s => {
          const okTag = (s.planned && s.rt && s.planned.id === s.rt.id) ? '计划绑定' : '按库房+点位匹配';
          const tagTxt = s.exact ? okTag : (s.rt ? '计划路线起运点与本次不符' : '无在册路线，需在 PC 路线维护补录');
          const tagStyle = s.exact ? 'color:#2F7D4F' : 'color:#C0392B';
          return `<div class="kv" style="align-items:flex-start"><span>第 ${s.idx} 段 → ${esc(site(s.site).name)}</span>
            <div style="text-align:right;max-width:62%"><b>${s.rt ? esc(s.rt.name) : '——'}</b>
            <div class="f-note" style="margin:2px 0 0;text-align:right">${s.rt ? (s.rt.km || 0) + 'km' : ''}${s.planNo ? ' · ' + esc(s.planNo) : ''} · <span style="${tagStyle}">${tagTxt}</span></div></div>
          </div>`;
        }).join('')}
        <div class="f-row"><label>途经路线</label><input id="e_via" class="f-sel w" readonly value="${esc(segs.map(s => s.rt ? s.rt.name : '待补录').join(' → '))}"></div>
        <div class="f-note">${segs.length > 1 ? '一单多点：共 ' + segs.length + ' 段路线，按卸货顺序逐段行驶；每段均取自 PC 端路线维护，押运员不改线。' : '单点位：直接使用项目负责人核实上报时绑定的计划路线。'}${planRt0 ? ' 计划路线：' + esc(planRt0.name) + '。' : ''}</div>
      </div>
      <div class="form-card">
        <div class="fc-title">卸货点顺序（可调整 · 调整留痕）</div>
        <div id="stop-list">
          ${ordered.map(g => `<div class="ck-line" data-plan="${g.plan}">
            <span class="f-sel w" style="flex:1">${esc(site(g.site).name)}</span>
            <button class="btn ghost sm" type="button" onclick="moveStop(this,-1)">↑</button>
            <button class="btn ghost sm" type="button" onclick="moveStop(this,1)">↓</button>
          </div>`).join('')}
        </div>
        <div class="f-note">默认按路线远近建议排序；每到一个卸货点须围栏判定并核量本点明细。</div>
      </div>
      <div class="form-card">
        <div class="fc-title">沿途打卡点设置（运输途中逐点扫码打卡）</div>
        <div id="cp-list">
          <div class="ck-line"><input data-cp="1" value="青龙山专线入口" class="f-sel w" placeholder="打卡点名称"><button class="it-del" aria-label="删除" type="button" onclick="this.closest('.ck-line').remove()">✕</button></div>
          <div class="ck-line"><input data-cp="1" value="隧道施工便道口" class="f-sel w" placeholder="打卡点名称"><button class="it-del" aria-label="删除" type="button" onclick="this.closest('.ck-line').remove()">✕</button></div>
        </div>
        <button class="btn ghost sm" onclick="addCpLine()">＋ 添加打卡点</button>
        <div class="f-note">发车后每到一个打卡点须扫码并上传现场照片；全部打卡点记录时间与定位。</div>
      </div>
      <button class="btn primary block" onclick="doSign('${o.id}')">确认签收 · 生成运输单</button>
      </div>
      ${wizNav(1, 3)}`;
    },
    after() { wizApply(1); }
  }
});
/* 扫码绑定出库单：非指派给我的单默认不可见，现场扫码后才进入「我的押运任务」 */
function scanOutSheet() {
  const me = escortMe();
  const scans = (DB.escortScans || []).filter(s => s.by === me).map(s => s.out);
  const cand = DB.outbounds.filter(o => !o.signed && o.status === '待签收' && planTp(o).escort !== me && !scans.includes(o.id));
  if (!cand.length) return toast('暂无其他可扫码绑定的出库单', false);
  const rows = cand.map(o => {
    const pl = planById(o.plan);
    const tp = planTp(o);
    return `<label class="ck-line"><input type="radio" name="scan_out" value="${o.id}" style="margin-top:3px">
      <span style="flex:1">${esc(o.outNo)} · ${esc(pl ? site(pl.site).name : '-')} · 计划押运员 ${esc(tp.escort ? person(tp.escort).name : '未安排')}</span></label>`;
  }).join('');
  formSheet('扫联单二维码 · 绑定出库单',
    `<div class="f-note">用本人账号扫现场出库单联单二维码（演示：从下方选择要绑定的出库单）。绑定后该单才会出现在「我的押运任务」；若本人非计划押运员，签收前还须办理变更押运员手续。</div>${rows}`,
    mask => {
      const r = mask.querySelector('input[name=scan_out]:checked');
      if (!r) return toast('请选择要扫的出库单', false);
      closeSheet(mask);
      bindEscortOut(r.value);
    }, '扫码绑定');
}
/* 扫码接单（统一入口）：出库单签收 + 退库单反向押送 */
/* 扫码入口：直接进入扫码页，不再弹出待扫单据清单 */
function scanSheet() {
  const me = escortMe();
  const scans = (DB.escortScans || []).filter(s => s.by === me).map(s => s.out);
  const outs = DB.outbounds.filter(o => !o.signed && o.status === '待签收' && planTp(o).escort !== me && !scans.includes(o.id));
  const rets = DB.returns.filter(r => r.status === '待押送' && !(r.escortScan && r.escortScan.by === me));
  if (!outs.length && !rets.length) toast('当前没有待接单据，可直接扫码校验单号', false);
  nav.push('escort-scan', {});
}

/* 摄像头扫码：优先 BarcodeDetector 自动识别；无摄像头/不支持时降级为手动输入单号 */
function stopScanCamera() {
  if (window.__scanStream) {
    try { window.__scanStream.getTracks().forEach(t => t.stop()); } catch (e) {}
    window.__scanStream = null;
  }
}

async function initScanCamera() {
  const video = document.getElementById('scan-video');
  const ph = document.getElementById('scan-ph');
  const hint = document.getElementById('scan-hint');
  if (!video) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    if (video) video.style.display = 'none';
    if (ph) ph.textContent = '当前环境不支持摄像头';
    if (hint) hint.textContent = '请在下方输入二维码内容（单号）完成接单';
    return;
  }
  setTimeout(() => {
    if (!window.__scanStream) {
      if (video) video.style.display = 'none';
      if (ph) ph.textContent = '未检测到可用摄像头';
    }
  }, 6000);
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    window.__scanStream = stream;
    video.style.display = 'block';
    video.srcObject = stream;
    await video.play();
    if (ph) ph.style.display = 'none';
    if ('BarcodeDetector' in window) {
      const det = new window.BarcodeDetector({ formats: ['qr_code'] });
      if (hint) hint.textContent = '对准二维码，识别成功即自动接单';
      const loop = async () => {
        if (!window.__scanStream || window.__scanDone) return;
        try {
          const codes = await det.detect(video);
          if (codes && codes.length && codes[0].rawValue) return handleScanCode(codes[0].rawValue);
        } catch (e) { /* 单帧识别失败继续下一帧 */ }
        requestAnimationFrame(loop);
      };
      loop();
    } else if (hint) {
      hint.textContent = '当前浏览器不支持自动识别，请在下方输入二维码内容（单号）';
    }
  } catch (e) {
    if (video) video.style.display = 'none';
    if (ph) ph.textContent = '未检测到可用摄像头';
    if (hint) hint.textContent = '请在下方输入二维码内容（单号）完成接单';
  }
}

function submitScanCode() {
  const el = document.getElementById('scan-code');
  handleScanCode(el ? el.value : '');
}

/* 按二维码内容（单号）精确匹配出库单 / 退库单，校验状态后绑定 */
function handleScanCode(raw) {
  if (window.__scanDone) return;
  const me = escortMe();
  const code = String(raw || '').trim().toUpperCase();
  if (!code) return toast('请扫描二维码或输入单号', false);

  const o = DB.outbounds.find(x => String(x.outNo || '').toUpperCase() === code);
  if (o) {
    if (o.signed || o.status !== '待签收') return toast('出库单 ' + o.outNo + ' 当前状态为「' + o.status + '」，无需接管', false);
    if (planTp(o).escort === me) return toast('出库单 ' + o.outNo + ' 已指派给你，无需扫码，直接在待签收列表核对签收', false);
    window.__scanDone = true;
    stopScanCamera();
    return bindEscortOut(o.id);
  }

  const r = DB.returns.find(x => String(x.retNo || '').toUpperCase() === code);
  if (r) {
    if (r.status !== '待押送') return toast('退库单 ' + r.retNo + ' 当前状态为「' + r.status + '」，无需接单', false);
    if (r.escortScan && r.escortScan.by && r.escortScan.by !== me) return toast('退库单 ' + r.retNo + ' 已被其他押运员接单', false);
    window.__scanDone = true;
    stopScanCamera();
    return bindEscortReturn(r.id);
  }

  toast('未匹配到单号「' + code + '」，请确认扫描的是出库单 / 退库单二维码', false);
}
/* 退库单接单：一单一位押运员，接单后方可在「返程押送」看到并押送 */
function bindEscortReturn(rtId) {
  const me = escortMe();
  const rt = byId(DB.returns, rtId);
  if (!rt) return toast('退库单不存在', false);
  if (rt.escortScan && rt.escortScan.by && rt.escortScan.by !== me) return toast('该退库单已被其他押运员接单', false);
  rt.escortScan = { by: me, time: Date.now() };
  const pl = planById(rt.plan);
  if (pl) addLog(pl, '退库', `押运员扫码接单 ${rt.retNo}（反向押送 ${site(pl.site).name} → ${rt.targetName || '原库'}）`, person(me).name);
  saveDB();
  toast(`已接单 ${rt.retNo}，请核对退库量后安排人车发车`, true);
  nav.reset('escort-home', { f: 'ret' });
  nav.push('escort-return', { id: rt.id });
}
function bindEscortOut(outId) {
  const me = escortMe();
  const o = outboundById(outId);
  if (!o) return toast('出库单不存在', false);
  DB.escortScans = DB.escortScans || [];
  if (!DB.escortScans.some(s => s.out === outId && s.by === me)) {
    DB.escortScans.push({ out: outId, by: me, time: Date.now() });
  }
  const pl = planById(o.plan);
  if (pl) addLog(pl, '运输', `押运员扫码绑定出库单 ${o.outNo}（本人接管本次押运）`, person(me).name);
  saveDB();
  toast(`已绑定出库单 ${o.outNo}，请核对后签收`, true);
  /* 扫码接收后直接进入押运签收页 */
  nav.reset('escort-sign', { id: outId });
}

function vehicleFor(kg) {
  const v = MASTER.vehicles.find(x => x.load >= kg) || MASTER.vehicles[0];
  return `${esc(v.plate)} · 载重 ${v.load}kg`;
}
function moveStop(btn, dir) {
  const line = btn.closest('.ck-line');
  const list = document.getElementById('stop-list');
  if (dir < 0 && line.previousElementSibling) list.insertBefore(line, line.previousElementSibling);
  if (dir > 0 && line.nextElementSibling) list.insertBefore(line.nextElementSibling, line);
}
function addCpLine() {
  const tmp = document.createElement('div');
  tmp.innerHTML = `<div class="ck-line"><input data-cp="1" class="f-sel w" placeholder="打卡点名称"><button class="it-del" aria-label="删除" type="button" onclick="this.closest('.ck-line').remove()">✕</button></div>`;
  $('#cp-list').appendChild(tmp.querySelector('.ck-line'));
}
function pickDriver() {
  sheet('选择驾驶员', MASTER.drivers.map(d => ({ label: `${d.name} · ${d.cert || '证书未维护'}`, id: d.id })), x => {
    $('#e_driver').textContent = x.label.split(' · ')[0] + ' · ' + x.label.split(' · ')[1];
    $('#e_driver').dataset.v = x.id;
  });
}
function pickRoute(fromId) {
  const list = routeEnabled(fromId);
  if (!list.length) return toast('当前起运库房暂无启用路线，可手工填写途经路线', false);
  sheet('选择路线（治安大队维护）', list.map(r => ({ label: `${r.name} · 约 ${r.km}km · ${(r.checkPoints || []).length} 个打卡点`, id: r.id })), x => {
    const r = routeById(x.id);
    $('#e_via').value = r.via;
    $('#e_route').textContent = r.name + '（已套用）';
    $('#e_route').dataset.v = r.id;
    document.getElementById('cp-list').innerHTML = (r.checkPoints || []).map(n =>
      `<div class="ck-line"><input data-cp="1" value="${esc(n)}" class="f-sel w" placeholder="打卡点名称"><button class="it-del" aria-label="删除" type="button" onclick="this.closest('.ck-line').remove()">✕</button></div>`).join('');
    toast(`已套用路线「${r.name}」，途经与打卡点已填充`, true);
  });
}
function pickVehicle(kg, isChange) {
  sheet('选择车辆（累计 ' + kg + 'kg）', MASTER.vehicles.filter(v => (v.status || '在用') !== '停用').map(v => ({ label: `${v.plate} · ${v.model} · 载重 ${v.load}kg${v.load < kg ? '（载重不足，不可选）' : ''}`, id: v.id, ok: v.load >= kg, load: v.load, plate: v.plate })), x => {
    if (!x.ok) return toast(`车辆 ${x.label.split(' · ')[0]} 载重不足 ${kg}kg，不可选`, false);
    const el = $('#e_vehicle');
    el.textContent = x.plate + ' · 载重 ' + x.load + 'kg' + (isChange ? '（押运员申请变更）' : '');
    el.dataset.v = x.id;
    if (isChange) {
      el.dataset.changed = '1';
      toast(`已申请变更车辆为 ${x.plate}，变更原因需在发车前说明并留痕`, true);
    }
  });
}
function tpCheck() {
  // 三项勾选由 doSign 直接读取 checkbox 状态；这里仅提示还需几项
  const list = [...document.querySelectorAll('[data-tpcheck]')];
  const left = list.filter(x => !x.checked).length;
  if (!left) toast('三项核实已完成，可以签收发车', true);
}
/* 变更押运员手续：计划押运员 ≠ 现场扫码人时，由现场押运员补办（留痕 + 通知负责人） */
function doEscortChange(outId) {
  const o = outboundById(outId);
  const pl = planById(o.plan);
  const tp = (pl && pl.transPlan) || {};
  const me = escortMe();
  const reason = (val('ec_reason') || '').trim();
  if (!reason) return toast('请填写变更押运员的原因', false);
  if (!tp.escort) return toast('本单未安排计划押运员，无需变更', false);
  const no = 'BBBG' + String(Date.now()).slice(-8);
  pl.escortChange = { no, from: tp.escort, to: me, reason, time: Date.now(), done: true };
  pl.escort = me;
  tp.escort = me;
  if (!DB.escortChanges) DB.escortChanges = [];
  DB.escortChanges.push({ id: no, plan: pl.id, outbound: o.id, from: pl.escortChange.from, to: me, reason, time: Date.now() });
  addLog(pl, '运输', `变更押运员手续 ${no}：${person(pl.escortChange.from).name} → ${person(me).name}，原因：${reason}`, person(me).name);
  pushMsg('项目负责人', `计划 ${pl.planNo} 押运员已变更为 ${person(me).name}（原 ${person(pl.escortChange.from).name}），变更单 ${no}，原因：${reason}。`);
  saveDB();
  toast(`变更押运员手续 ${no} 已完成，现可确认签收`, true);
  nav.reset('escort-sign', { id: outId, _t: Date.now() });
}
function rejectTransport(outId) {
  formSheet('上报运输安排不一致', `<div class="f-row"><label>不一致项</label><div class="f-select">车辆 / 运输证 / 载重 / 押运员</div></div>
    <div class="f-row"><label>说明</label><textarea class="f-ta" id="rj_note" placeholder="如：现场车辆为川L·XXXX，与安排的川L·10295 不符"></textarea></div>
    <div class="f-note">提交后推送项目负责人与安全监管，本次不予发车，须重新安排。</div>`, () => {
    const note = val('rj_note').trim();
    if (!note) return toast('请填写不一致说明', false);
    const o = outboundById(outId);
    const pl = planById(o.plan);
    if (pl) {
      pl.transPlanReject = { note, by: 'P5', time: Date.now() };
      addLog(pl, '运输', `押运员核实运输安排不一致：${note}，已退回项目负责人重新安排`, person('P5').name);
      pushMsg('项目负责人', `计划 ${pl.planNo} 的运输安排被押运员驳回：${note}，请重新安排车辆与押运员。`);
      saveDB();
    }
    toast('已上报不一致，已推送项目负责人重新安排', true);
    nav.reset('escort-home', { f: 'sign' });
  }, '提交');
}
function doSign(outId) {
  const o = outboundById(outId);
  const kg = Math.round(planKg(o.items));
  const tpChecks = [...document.querySelectorAll('[data-tpcheck]')];
  if (tpChecks.length && tpChecks.some(x => !x.checked)) {
    return toast('请先逐项核实项目负责人的运输安排：车辆一致 / 运输证一致 / 未超载重', false);
  }
  const v = vehicle($('#e_vehicle').dataset.v);
  if (v.load < kg) return toast(`车辆 ${v.plate} 载重 ${v.load}kg 不足累计 ${kg}kg，请更换车辆`, false);
  const cps = [];
  document.querySelectorAll('#cp-list [data-cp]').forEach(el => { const n = el.value.trim(); if (n) cps.push(n); });
  if (!cps.length) return toast('请至少设置 1 个沿途打卡点', false);
  const order = [...document.querySelectorAll('#stop-list [data-plan]')].map(el => el.dataset.plan);
  const pl0 = planById(o.plan);
  const tp = (pl0 || {}).transPlan || null;
  const me = escortMe();
  const escortId = me;   // 签收人 = 现场扫码人，不再一律记计划押运员
  if (tp && tp.escort && tp.escort !== me && !(pl0.escortChange && pl0.escortChange.done)) {
    return toast(`本单计划押运员为 ${person(tp.escort).name}，本人非计划押运员，请先在上方办理变更押运员手续`, false);
  }
  const tr = signTransport(o, escortId, $('#e_driver').dataset.v, $('#e_vehicle').dataset.v, val('e_via'), cps, order, window._rvSegs || []);
  if (tp && $('#e_vehicle').dataset.v !== tp.vehicle) {
    const pl = planById(o.plan);
    pl.vehicle = $('#e_vehicle').dataset.v;
    pl.transPlanChanged = { from: tp.vehicle, to: $('#e_vehicle').dataset.v, by: escortId, time: Date.now() };
    addLog(pl, '运输', `押运员申请变更车辆：${vehicle(tp.vehicle).plate} → ${vehicle($('#e_vehicle').dataset.v).plate}`, person(escortId).name);
  }
  saveDB();
  toast(`签收完成，运输单 ${tr.no} 已生成（${tr.stops.length} 个卸货点 · ${cps.length} 个打卡点）`, true);
  nav.reset('escort-home', { f: 'road' });
}

Object.assign(PAGES, {
  /* ================= 押运员：在途（支持多点卸货序列）================= */
  'escort-transit': {
    title: '在途押运',
    render(p) {
      const tr = transportById(p.id);
      const pl = planById(tr.plan);
      const stops = tr.stops || null;
      const pendingIdx = stops ? tr.stops.findIndex(s => !s.done && !s.suggestArrive) : -1;
      return `
      <div class="route-wrap">${routeSVG(tr.progress)}
        <div class="route-meta">
          <span>${esc(tr.route.from)}</span>
          <b>${tr.progress || 0}%</b>
          <span>${stops ? tr.stops.length + ' 个卸货点' : esc(tr.route.to)}</span>
        </div>
        <div class="route-via">途经：${esc(tr.route.via)}</div>
      </div>
      <div class="card">
        <div class="fc-title">运输单 ${esc(tr.no)}</div>
        <div class="kv"><span>驾驶员</span><b>${esc(driver(tr.driver).name)}</b></div>
        <div class="kv"><span>车辆</span><b>${esc(vehicle(tr.vehicle).plate)}</b></div>
        ${stops ? `<div class="kv"><span>卸货点（${tr.stops.length}）</span><b>${tr.stops.map(s => esc(site(s.site).name)).join(' → ')}</b></div>` : ''}
        ${tr.departTime ? `<div class="kv"><span>出发打点</span><b>${fmtFull(tr.departTime)}（服务端时间记录）</b></div>` : ''}
        <div class="kv"><span>轨迹点</span><b>一期不启用（甲方确认 Q13）</b></div>
        ${tr.status === '运输中' ? `<div class="kv"><span>偏离预警</span><b>一期不启用（甲方确认 Q13）</b></div>` : ''}
      </div>
      ${(tr.cps || []).length ? `<div class="form-card">
        <div class="fc-title">沿途打卡点（${tr.cps.filter(c => c.time).length}/${tr.cps.length} 已打卡）</div>
        ${tr.cps.map((c, i) => `<div class="rc-item" ${c.time ? '' : 'id="cp_pending_' + i + '"'}>
          <div class="oi-name">${i + 1}. ${esc(c.name)}</div>
          ${c.time ? `<div class="kv"><span>打卡时间</span><b>${fmtFull(c.time)}</b></div>
          <div class="kv"><span>定位</span><b>${esc(c.geo)}</b></div>
          <div class="kv"><span>现场照片</span><b>${c.photos} 张 ✓</b></div>`
          : (tr.status === '运输中'
            ? `<button class="btn ghost sm block" onclick="cpScanCheck('${tr.id}',${i})">扫码打卡（时间 · 定位 · 照片）</button>`
            : '<div class="f-note">未打卡（运输已结束）</div>')}
        </div>`).join('')}
      </div>` : ''}
      ${stops ? `<div class="form-card">
        <div class="fc-title">卸货点序列（${tr.stops.filter(s => s.done).length}/${tr.stops.length} 站完成 · 押运员手动确认到达 + 本点核量）</div>
        ${tr.stops.map((s, i) => {
          const sp = planById(s.plan);
          const tier = tierOf(planKg(sp.items));
          return `<div class="rc-item">
          <div class="oi-name">${i + 1}. ${esc(site(s.site).name)} <i class="batch">${esc(sp.planNo)}</i>${tier.level !== '抽查' ? ` <em class="warn">${esc(tier.level)}</em>` : ''}</div>
          ${s.done ? `<div class="kv"><span>核量接收</span><b>已完成 · 到达 ${fmtTime(s.arriveTime)}</b></div>`
            : (s.suggestArrive ? `<div class="kv"><span>到达状态</span><b>押运员已确认到达 · 待安全员核量接收</b></div>`
              : (tr.status === '运输中' && i === pendingIdx
                ? `<button class="btn primary sm block" onclick="arriveStopCheck('${tr.id}',${i})">到达此卸货点（押运员手动确认）</button>`
                : '<div class="f-note">待前站完成后到达</div>'))}
        </div>`;
        }).join('')}
        <div class="f-note">定位 / 围栏 / 轨迹预警第一阶段不启用（甲方确认 Q13）：到达由押运员手动点击确认。单点核量不影响整趟。</div>
      </div>` : ''}
      ${tr.status === '待发车' ? `
        <button class="btn primary block" onclick="doDepart('${tr.id}')">发车 · 记录出发时间</button>
        <div class="f-note center">发车后逐点由押运员手动点击确认到达（Q13），安全员核量接收</div>` : ''}
      ${tr.status === '运输中' ? `
        <div class="btn-row">
          <button class="btn ghost" onclick="nav.push('keeper-out-detail',{id:'${tr.outbound}'})">查看出库联单</button>
        </div>
        <div class="f-note center">异常预警一期不启用，移至 P1 阶段（甲方确认 Q09）。${stops ? '每点到达后由现场安全员核量本点明细，全部点完成整趟结束' : '到达后由现场安全员进行「到场接收」确认'}</div>` : ''}
      ${tr.status === '已到达' ? `<div class="ok-strip">${stops ? '全部卸货点已完成核量接收，整趟押运结束' : '押运员已确认到达，待安全员核量确认（D02）'}</div>` : ''}`;
    }
  }
});
function doDepart(id) {
  const tr = transportById(id);
  departTransport(tr);
  saveDB();
  toast('已发车，出发时间已打点', true);
  nav.render();
  if (!tr.stops) startRouteAnim(tr);
}
/* 多点押运：到达卸货点（进入围栏），该点计划转入待接收 */
function arriveStopCheck(trId, idx) {
  const tr = transportById(trId);
  const st = tr.stops[idx];
  confirmSheet('到达卸货点', `确认已到达「${site(st.site).name}」作业点？确认后记录到达时间，该作业点转入待接收（安全员核量）。定位围栏与轨迹预警一期不启用（甲方确认 Q13），到达由押运员手动点击确认。`, () => {
    arriveStop(tr, idx);
    saveDB();
    toast(`已到达「${site(st.site).name}」，待安全员核量接收`, true);
    nav.render();
  }, '确认到达');
}
/* 沿途打卡点扫码打卡：记录打卡时间、定位、现场照片 */
function cpScanCheck(trId, idx) {
  const tr = transportById(trId);
  const cp = tr.cps[idx];
  window._formState = { cpphotos: 0 };
  formSheet(`扫码打卡 · ${cp.name}`, `
    <div class="card qr-card sm" style="margin:0 0 12px">
      <div class="scan-btn" onclick="this.textContent='✓ 已扫码（${esc(cp.name)}·点位码）';this.classList.add('ok')">
        <svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 4h6M20 4h-4M4 20v-6M20 20h-6M4 8v4h4M20 8v4h-4" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>
        <span>扫描点位二维码</span>
      </div>
    </div>
    <div class="kv"><span>打卡时间（系统）</span><b>${fmtFull(Date.now())}</b></div>
    <div class="kv"><span>定位</span><b>N30.02xx · E103.85xx（GPS）</b></div>
    <div class="f-row" style="margin-top:8px"><label>现场照片</label><div id="cpph">${photoStrip(window._formState, 'cpphotos')}</div></div>
    <div class="f-note">未扫码或无照片不可打卡；记录同步推送监管端。</div>
  `, mask => {
    const scanned = !!mask.querySelector('.scan-btn.ok');
    if (!scanned) { toast('请先扫描点位二维码', false); return; }
    if (!window._formState.cpphotos) { toast('打卡必须上传现场照片', false); return; }
    cpCheckIn(tr, idx, window._formState.cpphotos);
    saveDB();
    closeSheet(mask);
    toast(`已打卡「${cp.name}」（时间/定位/照片已留痕）`, true);
    nav.render();
  }, '提交打卡');
}
function reportAbnormal(trId) {
  formSheet('运输异常上报（C07）', `
    <div class="f-row"><label>异常类型</label><select id="ab_type" class="f-sel w"><option>车辆故障</option><option>交通事故</option><option>物品丢失/被盗</option><option>异常停留</option></select></div>
    <div class="f-row"><label>说明</label><textarea id="ab_desc" class="f-ta" placeholder="简述情况与位置"></textarea></div>
    <div class="f-row"><label>现场照片</label><div id="ab_photos">${photoStrip(window._formState || (window._formState = {}), 'ab')}</div></div>
  `, mask => {
    const t = mask.querySelector('#ab_type').value, d = mask.querySelector('#ab_desc').value.trim();
    if (!d) { toast('请填写说明', false); return; }
    if (t.includes('丢失') && !((window._formState || {}).ab)) { toast('涉丢失/被盗须上传现场照片', false); return; }
    const plan = planById(transportById(trId).plan);
    DB.exceptions.push({ id: 'EX' + (DB.seq.ex++), plan: plan.id, type: '运输异常·' + t, level: t.includes('丢失') ? '高' : '中', time: Date.now(), status: '待处置', desc: d });
    pushMsg('民警', `运输异常（${t}）：计划 ${plan.planNo}，${d}`);
    pushMsg('库管员', `运输异常（${t}）：${plan.planNo}`);
    saveDB();
    toast('异常已上报，已推送民警与库管员', true);
  }, '上报');
}

Object.assign(PAGES, {
  /* ================= 安全员：首页（多点押运按卸货点逐点接收）================= */
  'safety-home': {
    title: '到场接收',
    tabs: () => roleTabs('safety-home', 0),
    render() {
      const arrived = [], transit = [];
      DB.transports.filter(t => t.direction === 'GO' && planById(t.plan)).forEach(t => {
        if (t.stops) {
          t.stops.forEach(s => {
            const pl = planById(s.plan);
            if (s.done) return;
            if (s.suggestArrive && pl.status === '待接收') arrived.push({ t, plan: s.plan, stop: s });
            else transit.push({ t, plan: s.plan });
          });
        } else {
          const pl = planById(t.plan);
          if (t.status === '已到达' && pl.status === '待接收') arrived.push({ t, plan: t.plan, stop: null });
          else if (t.status === '运输中') transit.push({ t, plan: t.plan, stop: null });
        }
      });
      const done = DB.plans.filter(x => x.status === '已到场');
      const todo = arrived.map(x => {
        const pl = planById(x.plan);
        return `<div class="card plan-card" onclick="nav.push('safety-receive',{id:'${x.t.id}',plan:'${x.plan}'})">
          <div class="pc-top"><span class="pc-no">${esc(x.t.no)}${x.t.stops ? ' · 多点第 ' + (x.t.stops.indexOf(x.stop) + 1) + ' 站' : ''}</span>${statusPill('待接收')}</div>
          <div class="pc-name">${esc(site(pl.site).name)}</div>
          <div class="pc-sub">${esc(x.t.route.from)} → 已进场 · ${esc(vehicle(x.t.vehicle).plate)} · 驾驶员 ${esc(driver(x.t.driver).name)} · 押运员 ${esc(person(x.t.escort).name)}</div>
          ${x.stop ? `<div class="pc-time">本点明细单独核量 · 整趟 ${x.t.stops.length} 站已完成 ${x.t.stops.filter(s => s.done).length} 站</div>` : (x.t.suggestArrive ? `<div class="pc-time">系统建议到达时间：${fmtTime(x.t.suggestArrive)}（${esc(x.t.suggestSource || 'GEOFENCE')}）</div>` : '<div class="pc-time">已到达围栏，请手工确认到达时间</div>')}
          <div class="pc-cta">去核量接收 →</div>
        </div>`;
      }).join('');
      const ro = transit.map(x => {
        const pl = planById(x.plan);
        const pct = Math.max(0, Math.min(100, x.t.progress || 0));
        const mins = x.t.departTime ? Math.max(0, Math.round((Date.now() - x.t.departTime) / 60000)) : 0;
        return `<div class="card transit-card" onclick="safetyTrack('${x.t.id}','${x.plan}')">
          <div class="pc-top"><span class="pc-no">${esc(x.t.no)}${x.t.stops ? ' · 多点' : ''}</span>${statusPill('运输中')}<em class="ro-tag">只读跟踪</em></div>
          <div class="pc-name">${esc(site(pl.site).name)}</div>
          <div class="pc-sub">${esc(x.t.route.from)} → 现场 · ${esc(vehicle(x.t.vehicle).plate)} · 已行驶 ${mins} 分钟</div>
          <div class="pb"><i style="width:${pct}%"></i></div>
          <div class="pc-time">在途进度 ${pct}% · 尚未进场，到达围栏后方可核量接收</div>
        </div>`;
      }).join('');
      return `
      <div class="page-title">到场接收（D 模块）<span class="page-sub">到达时间以安全员确认为准（R1/Q1）· 多点押运逐点核量</span></div>
      <div class="card legend-card sm">
        <div class="lg-row"><b>运输中</b><span>车辆在途，系统持续跟踪轨迹与围栏距离；安全员此时<strong>不能接收</strong>，仅可查看在途信息。</span></div>
        <div class="lg-row"><b>待接收</b><span>车辆已进入作业点围栏并生成建议到达时间；安全员执行核量、拍照留证、差异说明与签名确认（D02–D06）。</span></div>
      </div>
      <div class="sec-title">待接收 · 可核量（${arrived.length}）</div>
      ${arrived.length ? todo : EMPTY('暂无待接收任务（车辆到达围栏后自动出现）')}
      <div class="sec-title">在途运输 · 只读跟踪（${transit.length}）</div>
      ${transit.length ? ro : EMPTY('暂无在途运输')}
      ${done.length ? `<div class="f-note center">已接收 ${done.length} 个作业点，等待安全监理爆破登记</div>` : ''}`;
    }
  },

  'safety-receive': {
    title: '到场接收单',
    render(p) {
      const tr = transportById(p.id);
      const planId = p.plan || tr.plan;
      const o = outboundById(tr.outbound);
      const group = outGroups(o).find(g => g.plan === planId) || { items: o.items };
      const pl = planById(planId);
      const stop = tr.stops ? tr.stops.find(s => s.plan === planId) : null;
      const canDo = tr.stops ? (stop && !stop.done && stop.suggestArrive) : (tr.status === '已到达' && pl.status === '待接收');
      if (!canDo) return `
      <div class="head-card sm">
        <div class="hc-no">${esc(tr.no)}</div>
        <div class="hc-name">${esc(site(pl.site).name)}</div>
        <div class="hc-sub">当前状态：${esc(pl.status)} · 在途进度 ${tr.progress || 0}%</div>
      </div>
      <div class="card warn-card">
        <div class="fc-title">车辆尚未进场，不可核量接收</div>
        <p class="f-note">安全员须在车辆进入作业点围栏、系统生成建议到达时间后，才能执行 D02–D06（到达确认、逐项核量、拍照留证、签名）。在途阶段请使用「在途跟踪」查看进度。</p>
      </div>
      <button class="btn ghost block" onclick="nav.reset('safety-home')">返回待接收列表</button>`;
      window._formState = { photos: 0, sign: false };
      const suggest = tr.stops ? stop.suggestArrive : tr.suggestArrive;
      return `
      <div class="head-card sm">
        <div class="hc-no">${esc(o.outNo)} · ${esc(tr.no)}${tr.stops ? ' · 第 ' + (tr.stops.indexOf(stop) + 1) + '/' + tr.stops.length + ' 站' : ''}</div>
        <div class="hc-name">${esc(site(pl.site).name)}</div>
        <div class="hc-sub">驾驶员 ${esc(driver(tr.driver).name)} · ${esc(vehicle(tr.vehicle).plate)} · 出发 ${fmtTime(tr.departTime)}</div>
      </div>
      <div class="form-card">
        <div class="fc-title">到达时间确认（D02）· 权威值=安全员确认</div>
        <div class="arrive-row">
          <div class="arr-sug">系统建议值<br><b>${suggest ? fmtFull(suggest) : '定位中…'}</b><i>来源 ${esc(tr.stops ? 'GEOFENCE' : (tr.suggestSource || 'GEOFENCE'))}</i></div>
          <div class="arr-btns">
            ${suggest ? `<button class="btn sm" onclick="useSuggest(${suggest})">采纳建议值</button>` : ''}
            <button class="btn ghost sm" onclick="manualArrive()">手工修正</button>
          </div>
        </div>
        <div class="kv"><span>确认到达时间</span><b id="arr_final">${suggest ? fmtFull(suggest) : '待确认'}</b></div>
        <input type="hidden" id="arr_ts" value="${suggest || ''}">
        <div class="f-note">无信号时可手工填入并标注原因，进入审计列表。</div>
      </div>
      <div class="form-card">
        <div class="fc-title">逐品种数量核对（D03）· ${tr.stops ? '仅核本点明细' : '按出库单'} · 差异行标红，差异必留证（R4）</div>
        ${group.items.map((it, i) => `<div class="rc-item" id="rci_${i}">
          <div class="oi-name">${esc(goodsName(it.goods))} · ${esc(it.spec)} <i class="batch">${esc(it.batch)}</i></div>
          <div class="oi-edit"><span>实发</span><b>${it.qty}</b><span class="f-unit">${esc(GOODS[it.goods].unit)}</span></div>
          <div class="oi-edit"><span>实收</span><input type="number" id="rg_${i}" value="${it.qty}" oninput="rcDiff(${i})"><span class="f-unit">${esc(GOODS[it.goods].unit)}</span></div>
          <div class="rc-diff" id="rcd_${i}"></div>
        </div>`).join('')}
      </div>
      <div class="form-card">
        <div class="f-row"><label>归集使用库（工区临时）</label><div class="f-select" id="rc_storage" data-v="" onclick="sheet('归集使用库（可选，R10）',[{label:'不归集，现场直用'},{label:'青龙山使用库（S2）'}],(x,i)=>{const el=document.getElementById('rc_storage');el.textContent=x.label;el.dataset.v=i?'S2':'';})">不归集，现场直用</div></div>
        <div class="f-row"><label>现场取证（D05）</label>${photoStrip(window._formState, 'photos')}</div>
        <div class="f-row"><label>接收签名（D06）</label><div class="sign-box sm"><canvas id="sign_cv" width="600" height="180"></canvas><div style="display:flex;gap:8px;margin-top:6px"><button class="btn ghost sm" onclick="clearSign('sign_cv',window._formState,'sign')">清除</button><button class="btn ghost sm" onclick="demoSign('sign_cv',window._formState,'sign')">演示快速签名</button></div></div></div>
      </div>
      <div id="diff_box"></div>
      <button class="btn primary block" onclick="submitReceive('${tr.id}','${planId}')">提交接收 · 推进至爆破环节</button>`;
    },
    after() { initSign('sign_cv', window._formState, 'sign'); }
  }
});
function safetyTrack(id, planId) {
  const t = transportById(id), pl = planById(planId || t.plan);
  const pct = Math.max(0, Math.min(100, t.progress || 0));
  const mins = t.departTime ? Math.max(0, Math.round((Date.now() - t.departTime) / 60000)) : 0;
  sheet('在途跟踪 · ' + t.no, [
    { label: `作业点：${site(pl.site).name}` },
    { label: `在途进度 ${pct}% · 已行驶 ${mins} 分钟` },
    { label: `路线：${t.route.from} → ${t.route.to}` },
    { label: `驾驶员 ${driver(t.driver).name} · ${vehicle(t.vehicle).plate}` },
    { label: t.stops ? `多点押运：${t.stops.length} 个卸货点，逐点进场后核量` : '到达围栏后系统生成建议到达时间，任务自动转入「待接收」' }
  ], null);
}
function useSuggest(ts) { $('#arr_ts').value = ts; $('#arr_final').textContent = fmtFull(ts); toast('已采纳建议值（GEOFENCE）', true); }
function manualArrive() {
  formSheet('手工修正到达时间', `<div class="f-row"><label>到达时间</label><input id="arr_m" type="datetime-local" class="f-sel w" value="${new Date(Date.now() - 1800000).toISOString().slice(0, 16)}"></div><div class="f-row"><label>修正原因</label><textarea class="f-ta" id="arr_r" placeholder="如：山区信号弱，围栏判定延迟"></textarea></div>`, mask => {
    const v = mask.querySelector('#arr_m').value, r = mask.querySelector('#arr_r').value.trim();
    if (!v) { toast('请填写时间', false); return; }
    const ts = new Date(v).getTime();
    $('#arr_ts').value = ts; $('#arr_final').textContent = fmtFull(ts);
    window._manualSource = r ? 'MANUAL（' + r + '）' : 'MANUAL';
    toast('已手工修正，来源标记 MANUAL', true);
  });
}
function rcDiff(i) {
  const got = parseFloat(val('rg_' + i));
  const sent = curGroup().items[i].qty;
  const d = got - sent;
  const box = $('#rcd_' + i);
  if (d === 0) { box.innerHTML = ''; $('#rci_' + i).classList.remove('diff'); }
  else { box.innerHTML = d > 0 ? `多收 ${d}，须说明并留证` : `少收 ${-d}，须说明并留证`; $('#rci_' + i).classList.add('diff'); }
  updateDiffBox();
}
let currentTrId = null, currentPlanId = null;
function curGroup() {
  const tr = transportById(currentTrId);
  const o = outboundById(tr.outbound);
  return outGroups(o).find(g => g.plan === (currentPlanId || tr.plan)) || { items: o.items };
}
function updateDiffBox() {
  const items = curGroup().items;
  const hasDiff = items.some((it, i) => parseFloat(val('rg_' + i)) !== it.qty);
  $('#diff_box').innerHTML = hasDiff ? `<div class="form-card warn-card">
    <div class="fc-title">检测到数量差异（R4）</div>
    <div class="f-row"><label>差异说明</label><textarea id="rc_diffdesc" class="f-ta" placeholder="必填：说明差异原因（如包装破损、运输颠簸等）"></textarea></div>
    <div class="f-note">提交后将自动生成异常单，推送民警与库管员；未闭环前禁止进入爆破环节（D04）。</div></div>` : '';
}
function submitReceive(trId, planId) {
  const tr = transportById(trId); currentTrId = trId; currentPlanId = planId || tr.plan;
  const group = curGroup();
  const pl = planById(currentPlanId);
  const stop = tr.stops ? tr.stops.find(s => s.plan === currentPlanId) : null;
  const canDo = tr.stops ? (stop && !stop.done && stop.suggestArrive) : (tr.status === '已到达' && pl.status === '待接收');
  if (!canDo) return toast('车辆尚在途，到达围栏后方可接收', false);
  const arrTs = parseFloat($('#arr_ts').value);
  if (!arrTs) return toast('请确认到达时间', false);
  if (!window._formState.sign) return toast('请安全员签名', false);
  if (!window._formState.photos) return toast('请现场拍照留证（D05）', false);
  const gotItems = group.items.map((it, i) => {
    const got = parseFloat(val('rg_' + i));
    return { goods: it.goods, spec: it.spec, sent: it.qty, got, diff: got - it.qty };
  });
  const diffFlag = gotItems.some(x => x.diff !== 0);
  if (diffFlag && !val('rc_diffdesc')) return toast('存在差异，必须填写差异说明并留证', false);
  const source = window._manualSource || (tr.stops ? 'GEOFENCE' : (tr.suggestSource || 'GEOFENCE'));
  window._manualSource = null;
  receiveConfirm(tr, gotItems, arrTs, source.split('（')[0], $('#rc_storage').dataset.v || '', window._formState.photos, diffFlag, 'P3', currentPlanId);
  saveDB();
  toast(diffFlag ? '已提交接收；差异已生成异常单并推送民警' : (tr.stops && tr.status !== '已到达' ? '本点接收完成，押运继续前往下一卸货点' : '接收完成，已推进至爆破环节'), true);
  nav.reset('safety-home');
}

Object.assign(PAGES, {
  /* ================= 安全监理：首页 ================= */  'sup-home': {
    title: '爆破与退库',
    tabs: () => roleTabs('sup-home', 0),
    render(p) {      const f = p.f || 'blast';
      const waitBlast = DB.plans.filter(x => x.status === '已到场');
      const waitRet = DB.plans.filter(x => ['待退库', '退库运输中'].includes(x.status));
      const exs = DB.exceptions.filter(e => DB.plans.find(x => x.id === e.plan && ['已到场', '待退库'].includes(x.status)));
      let body = '';
      if (f === 'blast') body = waitBlast.length ? waitBlast.map(x => planCard(x, 'supGoBlast')).join('') : EMPTY('暂无待爆破登记的作业点');
      if (f === 'ret') {
        /* 退库单产生后，安全监理同步可见并可跟踪：扫码接单 / 在途 / 到库 / 入库 */
        const rts = DB.returns.filter(r => ['待押送', '押送中', '待入库确认', '已入库'].includes(r.status)).slice().reverse();
        body = rts.length ? rts.map(r => {
          const pl2 = planById(r.plan) || {};
          const tl = [
            r.createTime ? '生成 ' + fmtTime(r.createTime) : '已生成',
            r.escortScan ? '押运员扫码接单 ' + fmtTime(r.escortScan.time) + '（' + person(r.escortScan.by).name + '）' : '待押运员扫码',
            r.arriveTime ? '到达库房 ' + fmtTime(r.arriveTime) : '',
            r.keeperConfirmTime ? '入库完成 ' + fmtTime(r.keeperConfirmTime) + (r.inPhotos ? '（照片 ' + r.inPhotos + ' 张）' : '') : ''
          ].filter(Boolean).join(' · ');
          return `<div class="card plan-card" onclick="nav.push('sup-return',{id:'${pl2.id || ''}'})">
            <div class="pc-top"><span class="pc-no">${esc(r.retNo)}</span>${statusPill(r.status)}</div>
            <div class="pc-name">${esc(site(pl2.site).name)} → ${esc(r.targetName || storage(r.target || 'S1').name)}</div>
            <div class="pc-sub">${r.items.map(i => goodsName(i.goods) + ' ' + i.qty + GOODS[i.goods].unit).join('、')}</div>
            <div class="pc-sub">${esc(tl)}</div>
          </div>`;
        }).join('') : EMPTY('暂无退库单');
      }
      return `
      <div class="page-title">爆破作业与退库（E 模块）<span class="page-sub">三态结果 · 三量平衡（R2）· 跨日退库（Q4）</span></div>
      <div class="seg">
        <button type="button" class="seg-i ${f === 'blast' ? 'on' : ''}" onclick="nav.reset('sup-home',{f:'blast'})">待爆破 ${waitBlast.length || ''}</button>
        <button type="button" class="seg-i ${f === 'ret' ? 'on' : ''}" onclick="nav.reset('sup-home',{f:'ret'})">退库 ${waitRet.length || ''}</button>
      </div>
      ${body}
      ${exs.length ? `<div class="card warn-card"><div class="fc-title">待处置异常（E07）</div>${exs.map(e => `<div class="kv"><span>${esc(e.type)} · ${timeAgo(e.time)}</span><b>${statusPill(e.status)}</b></div>`).join('')}</div>` : ''}`;
    }
  },

  /* ================= 安全监理：爆破登记 ================= */
  'sup-blast': {
    title: '爆破情况登记',
    render(p) {
      const pl = planById(p.id);
      const o = outboundByPlan(pl.id);
      const rc = receiveByPlan(pl.id);
      const q = blastQty(pl.id);
      window._formState = { photos: 0, ssign: false };
      const nowDT = new Date(Date.now());
      const dv = `${nowDT.getFullYear()}-${pad(nowDT.getMonth() + 1)}-${pad(nowDT.getDate())}T${pad(nowDT.getHours())}:${pad(nowDT.getMinutes())}`;
      return `
      ${wizBar(1, 3, ['爆破情况', '结果与用量', '核验与签名'])}
      <div class="head-card sm">
        <div class="hc-no">${esc(pl.planNo)}</div>
        <div class="hc-name">${esc(site(pl.site).name)}</div>
        <div class="hc-sub">到场 ${rc ? fmtTime(rc.arriveTime) : '-'} · 本点出库量 ${o ? Math.round(q.items.reduce((s, i) => s + (i.goods === 'zy' ? i.qty : 0), 0)) : 0}kg</div>
      </div>
      <div data-wst="1">
      <div class="form-card">
        <div class="fc-title">爆破情况（E01）</div>
        <div class="f-row"><label>实际起爆时间</label><input id="b_time" type="datetime-local" class="f-sel w" value="${dv}"></div>
        <div class="f-row"><label>爆破方式</label><select id="b_method" class="f-sel w"><option>毫秒延时爆破</option><option>光面爆破</option><option>预裂爆破</option><option>拆除爆破</option></select></div>
        <div class="f-row"><label>天气情况</label><select id="b_weather" class="f-sel w"><option>晴</option><option>多云</option><option>阴</option><option>小雨</option><option>大风（≥5级）</option></select></div>
        <div class="f-row"><label>炸药领取库房</label><b>${o ? esc(storage(o.storage).name) : '-'}<i class="src-note">（出库单自动带出）</i></b></div>
        <div class="f-row"><label>爆破责任单位</label><b>${esc(company(project(planById(p.id).project).company).name)}<i class="src-note">（项目备案带出）</i></b></div>
        ${outUsedRows(o, pl.id).map((r, i) => {
          const plQty = q.planItems.filter(i => i.goods === r.goods && (!i.spec || i.spec === r.spec))
            .reduce((s, i) => s + i.qty, 0) || q.planItems.filter(i => i.goods === r.goods).reduce((s, i) => s + i.qty, 0);
          const def = Math.min(r.qty, plQty || r.qty);
          return `<div class="oi-edit"><span>${esc(goodsName(r.goods))} 实际用量</span><input id="bu_${i}" type="number" value="${def}" oninput="renderBalance('${pl.id}')"><span class="f-unit">${esc(GOODS[r.goods].unit)}</span></div>
          <div class="oi-line" style="margin:-2px 0 10px">${esc(r.spec)}${r.n > 1 ? ` · 合并 ${r.n} 个批次（已按品种汇总）` : ''}</div>`;
        }).join('')}
      </div>
      </div>
      <div data-wst="2">
      <div class="form-card">
        <div class="fc-title">爆破结果（三态）与实测用量</div>
        <div class="radios">
          <label><input type="radio" name="b_result" value="NORMAL_NO_RETURN" onchange="renderBalance('${pl.id}')">正常 · 无返库</label>
          <label><input type="radio" name="b_result" value="NORMAL_RETURN" checked onchange="renderBalance('${pl.id}')">正常 · 有返库</label>
          <label><input type="radio" name="b_result" value="ABNORMAL" onchange="renderBalance('${pl.id}')">异常</label>
        </div>
        <div class="f-row"><label>盲炮未处理</label><select id="b_blind" class="f-sel w" onchange="renderBalance('${pl.id}')"><option value="">无</option><option value="1">有（双通知民警+监理单位）</option></select></div>
        <div class="f-row"><label>爆破效果</label><textarea id="b_effect" class="f-ta" placeholder="块度、飞石、盲炮等情况"></textarea></div>
        <div class="f-row"><label>备注</label><input id="b_remark" placeholder="其他需说明的情况（选填）"></div>
      </div>
      <div id="balance_card"></div>
      </div>
      <div data-wst="3">
      <div class="form-card">
        <div class="fc-title">监理核验人员（爆破结束后共同核验，F6）</div>
        ${(() => {
          const sids = planSites(pl).map(sp => sp.site);
          const cand = MASTER.persons.filter(pp => ['爆破员', '测量技术员', '安全员'].includes(pp.role)
            && (pp.status || '在岗') !== '停用' && pp.project === pl.project && (pp.sites || []).some(s => sids.includes(s)));
          if (!cand.length) return `<div class="f-note">本作业点位（${sids.map(s => site(s).name).join('、')}）暂无已关联的核验人员：请先在 PC 端「四大员维护」为爆破员 / 测量技术员 / 安全员填写所属项目与作业点位。</div>`;
          return cand.map(pp => `<div class="ck-line exec"><span class="ck-txt">${esc(pp.name)} · ${esc(pp.role)} · ${esc((pp.sites || []).map(s => site(s).name).join('/'))}</span><input type="checkbox" data-checker="${pp.id}" aria-label="选择${esc(pp.name)}"></div>`).join('');
        })()}
        <div class="f-note">只列本作业点位（${esc((planSites(pl).map(sp => site(sp.site).name)).join('、'))}）且属于本项目的人员；至少选择 1 名，所选人员随爆破记录留痕。</div>
      </div>
      <div class="form-card">
        <div class="fc-title">安全监理手签（必签 · F6）</div>
        <div class="sign-box"><canvas id="sup_sign" width="600" height="200"></canvas>
          <div style="display:flex;gap:8px;margin-top:6px">
            <button class="btn ghost sm" onclick="clearSign('sup_sign',window._formState,'ssign')">清除</button>
            <button class="btn ghost sm" onclick="demoSign('sup_sign',window._formState,'ssign')">演示快速签名（李建国）</button>
          </div></div>
      </div>
      <button class="btn primary block" onclick="submitBlast('${pl.id}')">提交爆破登记</button>
      <div class="f-note center">四量对照按出库单维度、允许跨日归集（R2 / E05）；不平不允许提交完成。</div>
      </div>
      ${wizNav(1, 3)}`;
    },
    after(p) { renderBalance(p.id); initSign('sup_sign', window._formState, 'ssign'); wizApply(1); }
  }
});
/* 合并出库单（一单多点）按本计划所在作业点取明细；单计划单据回退整单明细 */
function outItemsForPlan(o, planId) {
  if (!o) return [];
  const g = outGroups(o).find(x => x.plan === planId);
  return (g && g.items) ? g.items : (o.items || []);
}
/* 本计划所在点位：出库明细 + 计划明细 + 计划量 */
function blastQty(planId) {
  const pl = planById(planId);
  const o = outboundByPlan(planId);
  const items = outItemsForPlan(o, planId);
  const sp = planSites(pl).find(x => x.site === pl.site);
  const planItems = normItems((sp && sp.items) ? sp.items : (pl.items || []));
  return { o, items, planItems, planKgSum: planKg(planItems) };
}
/* 出库单明细按「品种+规格」聚合：同品种多批次不再重复出多个「实际用量」输入框 */
function outUsedRows(o, planId) {
  const map = {};
  (planId ? outItemsForPlan(o, planId) : (o && o.items) || []).forEach(it => {
    const k = it.goods + '|' + it.spec;
    if (!map[k]) map[k] = { key: k, goods: it.goods, spec: it.spec, qty: 0, n: 0 };
    map[k].qty += it.qty; map[k].n++;
  });
  return Object.keys(map).map(k => map[k]);
}
/* 本点位剩余量（真实）：本点出库明细（按品种聚合）− 监理填报的实际用量 */
function remainRows(planId) {
  const o = outboundByPlan(planId);
  const bl = blastingByPlan(planId);
  const usedMap = {};
  ((bl && bl.used) || []).forEach(u => { const k = u.goods + '|' + u.spec; usedMap[k] = (usedMap[k] || 0) + u.qty; });
  return outUsedRows(o, planId).map(r => {
    const u = usedMap[r.goods + '|' + r.spec] || 0;
    return { goods: r.goods, spec: r.spec, qty: r.qty, n: r.n, used: u, remain: r2(Math.max(0, r.qty - u)) };
  });
}
function renderBalance(planId) {
  const pl = planById(planId);
  const o = outboundByPlan(planId);
  const box = $('#balance_card');
  if (!box || !o) return;
  const q = blastQty(planId);
  const agg = outUsedRows(o, planId);
  const used = agg.map((r, i) => ({ goods: r.goods, spec: r.spec, qty: parseFloat(val('bu_' + i)) || 0 }));
  const planOf = r => q.planItems.filter(i => i.goods === r.goods && (!i.spec || i.spec === r.spec))
    .reduce((s, i) => s + i.qty, 0) || q.planItems.filter(i => i.goods === r.goods).reduce((s, i) => s + i.qty, 0);
  const overRows = used.filter(u => u.qty > planOf(u));
  const result = (document.querySelector('input[name=b_result]:checked') || {}).value;
  const remain = agg.map((r, i) => ({ goods: r.goods, spec: r.spec, qty: r2(Math.max(0, r.qty - used[i].qty)) }));
  const ret = result === 'NORMAL_RETURN' ? remain : [];
  const OUT = planKg(q.items), USE = planKg(used), RET = planKg(ret);
  const LOSS = Math.max(0, OUT - USE - RET);
  const balanced = Math.abs(OUT - USE - RET - LOSS) < 0.001;
  box.innerHTML = `<div class="card bal-card compact ${balanced ? '' : 'bad'}">
    <div class="fc-title">四量对照（实时 · 本作业点位）</div>
    <div class="bal-grid">
      <div class="bal-cell"><span>出库 OUT</span><b>${OUT.toFixed(1)}kg</b></div>
      <div class="bal-cell"><span>实爆 USE</span><b>${USE.toFixed(1)}kg</b></div>
      <div class="bal-cell"><span>退库 RET</span><b>${RET.toFixed(1)}kg</b></div>
      <div class="bal-cell"><span>损耗 LOSS</span><b>${LOSS.toFixed(1)}kg</b></div>
    </div>
    <div class="bal-sum ${balanced ? 'ok' : 'bad'}">${balanced ? '✓ 出库 = 实用 + 退库 + 损耗，账实相符' : '✗ 账实不符，禁止提交完成'}</div>
    <div class="f-note">退库/销毁量按实际数据算：本点出库 ${OUT.toFixed(1)}kg − 实际用量 ${USE.toFixed(1)}kg = <b>${Math.max(0, OUT - USE).toFixed(1)}kg</b>${result === 'NORMAL_RETURN' ? '（本次全部退回）' : '（无返库，剩余计入损耗）'}</div>
    ${overRows.length ? `<div class="bal-sum bad">✗ 实际用量超出计划：${overRows.map(u => `${esc(goodsName(u.goods))} 实用 ${u.qty} / 计划 ${planOf(u)} ${esc(GOODS[u.goods].unit)}`).join('，')}</div>` : ''}
  </div>`;
}
function submitBlast(planId) {
  const pl = planById(planId);
  const o = outboundByPlan(planId);
  const rc = receiveByPlan(planId);
  const openEx = DB.exceptions.some(e => e.plan === planId && e.status === '待处置');
  if (rc && rc.diffFlag && openEx) return toast('数量差异尚未闭环，禁止进入爆破环节（D04）', false);
  const t = val('b_time');
  if (!t) return toast('请填写起爆时间', false);
  const result = (document.querySelector('input[name=b_result]:checked') || {}).value;
  if (result === 'ABNORMAL' && !val('b_effect').trim()) return toast('异常结果必须填写说明', false);
  const qv = blastQty(planId);
  const used = outUsedRows(o, planId).map((r, i) => ({ goods: r.goods, spec: r.spec, qty: parseFloat(val('bu_' + i)) || 0 }));
  const planOf = r => qv.planItems.filter(i => i.goods === r.goods && (!i.spec || i.spec === r.spec))
    .reduce((s, i) => s + i.qty, 0) || qv.planItems.filter(i => i.goods === r.goods).reduce((s, i) => s + i.qty, 0);
  const overRows = used.filter(u => u.qty > planOf(u));
  if (overRows.length) return toast(`实际用量不得大于计划用量：${overRows.map(u => `${goodsName(u.goods)} 实用 ${u.qty} / 计划 ${planOf(u)} ${GOODS[u.goods].unit}`).join('；')}，请核对后重新填写`, false);
  const checkers = [...document.querySelectorAll('[data-checker]')].filter(c => c.checked).map(c => c.dataset.checker);
  if (!checkers.length) return toast('请选择参与核验的技术人员 / 安全员（至少 1 人）', false);
  if (!window._formState.ssign) return toast('爆破结束后须安全监理手签确认', false);
  const data = {
    blastTime: new Date(t).getTime(), method: val('b_method'), weather: val('b_weather'),
    fromStorage: o ? o.storage : null,
    used, result, blind: !!val('b_blind'),
    loss: [], effect: val('b_effect'), remark: val('b_remark'), supervisor: 'P2',
    checkers, supSign: true
  };
  submitBlasting(pl, data);
  saveDB();
  if (result === 'NORMAL_RETURN') {
    toast('已登记，请继续填写退库明细', true);
    nav.reset('sup-home', { f: 'ret' });
    nav.push('sup-return', { id: planId, fresh: 1 });
  } else {
    toast('爆破登记完成，链路进入待核验', true);
    nav.reset('sup-home');
  }
}

Object.assign(PAGES, {
  /* ================= 安全监理：退库/销毁登记（销售库余量两条处置路线）================= */
  'sup-return': {
    title: '退库/销毁',
    render(p) {
      const pl = planById(p.id);
      const o = outboundByPlan(pl.id);
      const bl = blastingByPlan(pl.id);
      const rr = returnRoute(pl);
      window._formState = { dphotos: 0 };
      const rows = remainRows(pl.id);
      const retRows = rows.map((r, i) => `<div class="rc-item">
          <div class="oi-name">${esc(goodsName(r.goods))} · ${esc(r.spec)} <i class="batch">${r.n > 1 ? '合并 ' + r.n + ' 个批次' : ''}</i></div>
          <div class="oi-edit"><span>出库 ${r.qty}</span><span>实用 ${r.used}</span><b id="rr_${i}">可退 ${r.remain}</b><span class="f-unit">${esc(GOODS[r.goods].unit)}</span></div>
          <div class="oi-edit"><span>本次退库</span><input id="rq_${i}" type="number" value="${r.remain}" max="${r.remain}"><span class="f-unit">${esc(GOODS[r.goods].unit)}</span></div>
        </div>`).join('');
      const dhRows = rows.map((r, i) => `<div class="rc-item">
          <div class="oi-name">${esc(goodsName(r.goods))} · ${esc(r.spec)} <i class="batch">${r.n > 1 ? '合并 ' + r.n + ' 个批次' : ''}</i></div>
          <div class="oi-edit"><span>出库 ${r.qty}</span><span>实用 ${r.used}</span><b>剩余 ${r.remain}</b><span class="f-unit">${esc(GOODS[r.goods].unit)}</span></div>
          <div class="oi-edit"><span>销毁量</span><input id="xq_${i}" type="number" value="${r.remain}" max="${r.remain}"><span class="f-unit">${esc(GOODS[r.goods].unit)}</span></div>
        </div>`).join('');
      return `
      <div class="head-card sm"><div class="hc-no">${esc(pl.planNo)}</div>
        <div class="hc-name">${esc(site(pl.site).name)}</div>
        <div class="hc-sub">关联原出库单 ${esc(o.outNo)}（Q4）· 退库规则见下方说明（甲方确认 Q07）</div>
      </div>
      ${rr.isUse ? `<div class="form-card">
        <div class="fc-title">处置方式（使用库出库 · 强制原路原库退回）</div>
        <div class="kv"><span>出库库房</span><b>${esc(rr.src.name)}（${esc(rr.src.type)}）</b></div>
        <div class="kv"><span>退库去向</span><b>${esc(rr.targetName)}（原库 · 不可更改）</b></div>
        <div class="f-note">${esc(rr.tip)}</div>
      </div>` : `<div class="form-card">
        <div class="fc-title">处置方式（销售库出库 · 未用完二选一）</div>
        <div class="radios">
          <label><input type="radio" name="d_mode" value="return" checked onchange="dispMode()">退回中间库 · ${esc(rr.targetName)}（库管员入库）</label>
          <label><input type="radio" name="d_mode" value="destroy" onchange="dispMode()">销毁 · 现场登记销毁量</label>
        </div>
        <div class="f-note" id="dm_note">生成退库单并推送押运员：确认退库量、驾驶员、押运员后押送至「${esc(rr.targetName)}」，由库管员入库。</div>
      </div>`}
      <div id="ret_box">
        <div class="form-card">
          <div class="fc-title">退库明细（E02）· 须一次退完剩余量</div>
          ${retRows}
        </div>
        <div class="card warn-card sm">
          <div class="f-note">退库规则：可跨日，但不能分批、必须一次退完；库房不能拒收。使用库出库的必须原路原库退回；销售库出库的可退中间库或销毁。本次去向：<b>${esc(rr.targetName)}</b>。</div>
        </div>
        <button class="btn primary block" onclick="submitReturn('${pl.id}')">提交退库单 · 生成反向押送任务</button>
      </div>
      <div id="dh_box" style="display:none">
        <div class="form-card">
          <div class="fc-title">销毁登记 · 逐品种销毁量</div>
          ${dhRows}
          <div class="f-row" style="margin-top:8px"><label>销毁原因 / 方式</label><textarea id="dh_reason" class="f-ta" placeholder="如：受潮结块失效，按 GB6722 规程现场爆破销毁"></textarea></div>
          <div class="f-row"><label>销毁现场照片</label><div id="dhph">${photoStrip(window._formState, 'dphotos')}</div></div>
          <div class="f-note">销毁只做登记（甲方确认 Q06）：本系统仅登记销毁量 / 原因 / 现场照片并同步台账与民警，销毁审批与见证流程不在一期建设范围。</div>
        </div>
        <button class="btn danger block" onclick="submitDestroy('${pl.id}')">提交销毁记录（须照片留证）</button>
      </div>`;
    }
  }
});
function dispMode() {
  const checked = document.querySelector('input[name=d_mode]:checked');
  if (!checked) return;              // 使用库出库：无处置方式选择，固定退库
  const destroy = checked.value === 'destroy';
  const ret = $('#ret_box'), dh = $('#dh_box'), note = $('#dm_note');
  if (ret) ret.style.display = destroy ? 'none' : '';
  if (dh) dh.style.display = destroy ? '' : 'none';
  if (note) note.textContent = destroy
    ? '销毁只做登记（甲方确认 Q06）：逐品种登记销毁量、原因并拍照留证，记录推送民警与库管员；审批与见证流程不在一期范围。'
    : '生成退库单并推送押运员：扫码确认退库量、驾驶员、押运员后按原押运路线反向回库（一次退完 · 原库退回 · 不能拒收，Q07）。';
}
function submitDestroy(planId) {
  const pl = planById(planId);
  const rr = returnRoute(pl);
  if (rr.isUse) return toast(`本批物品从「${rr.src.name}」（使用库）出库，未用完必须原路原库退回，不允许销毁`, false);
  const rows = remainRows(planId);
  const items = [];
  let bad = false;
  rows.forEach((r, i) => {
    const q = parseFloat(val('xq_' + i)) || 0;
    if (q > r.remain) bad = true;
    if (q > 0) items.push({ goods: r.goods, spec: r.spec, qty: q, batch: r.n > 1 ? `合并 ${r.n} 批次` : '' });
  });
  if (bad) return toast('销毁量超过剩余量（出库 − 实际用量），已拦截', false);
  if (!items.length) return toast('销毁量不能为 0', false);
  const reason = val('dh_reason').trim();
  if (!reason) return toast('请填写销毁原因 / 方式', false);
  if (!window._formState.dphotos) return toast('销毁必须上传现场照片留证', false);
  const dh = createDestroy(pl, items, reason, window._formState.dphotos, 'P2');
  saveDB();
  toast(`销毁记录 ${dh.no} 已登记，链路进入待核验`, true);
  nav.reset('sup-home');
}
function submitReturn(planId) {
  const pl = planById(planId);
  const o = outboundByPlan(planId);
  const bl = blastingByPlan(planId);
  const rows = remainRows(planId);
  const items = [];
  let bad = false;
  rows.forEach((r, i) => {
    const q = parseFloat(val('rq_' + i)) || 0;
    if (q > r.remain) bad = true;
    if (q > 0) items.push({ goods: r.goods, spec: r.spec, qty: q, batch: r.n > 1 ? `合并 ${r.n} 批次` : '' });
  });
  if (bad) return toast('退库量超过可退量（出库 − 实际用量），已拦截', false);
  if (!items.length) return toast('退库量不能为 0', false);
  for (let i = 0; i < rows.length; i++) {
    const q = parseFloat(val('rq_' + i)) || 0;
    if (rows[i].remain > 0 && q < rows[i].remain) return toast('退库必须一次退完剩余量，不能分批（甲方确认 Q07）', false);
  }
  const rt = createReturn(pl, items, 'P2');
  saveDB();
  toast(`退库单 ${rt.retNo} 已生成，请让押运员扫码接单`, true);
  nav.reset('sup-home', { f: 'ret' });
  nav.push('sup-return-qr', { id: rt.id });
}

Object.assign(PAGES, {
  /* ================= 押运员：返程押送 ================= */
  'escort-return': {
    title: '反向押送',
    render(p) {
      const rt = byId(DB.returns, p.id);
      if (!rt.transport) window._formState = { scan: false };
      const pl = planById(rt.plan);
      const tr = rt.transport ? transportById(rt.transport) : null;
      return `
      <div class="head-card sm"><div class="hc-no">${esc(rt.retNo)}</div>
        <div class="hc-name">${esc(site(pl.site).name)} → ${esc(rt.targetName || storage(rt.target || 'S1').name)}</div>
        <div class="hc-sub">${rt.items.map(i => goodsName(i.goods) + ' ' + i.qty + GOODS[i.goods].unit).join('、')}</div>
      </div>
      ${!tr ? `
      <div class="card sm">
        <div class="kv"><span>退库单来源</span><b>扫码接单 · ${esc(rt.escortScan ? person(rt.escortScan.by).name + ' · ' + fmtTime(rt.escortScan.time) : '已绑定')}</b></div>
        <div class="kv"><span>接单人</span><b>${esc(person(escortMe()).name)}（本人）</b></div>
      </div>
      <div class="form-card">
        <div class="fc-title">退库单明细核对（E03 · 扫码时已获取，无需二次扫码）</div>
        ${rt.items.map(i => `<div class="kv"><span>${esc(goodsName(i.goods))} · ${esc(i.spec)}<i class="batch">${esc(i.batch)}</i></span><b>退库量 ${i.qty} ${esc(GOODS[i.goods].unit)}</b></div>`).join('')}
        <div class="kv"><span>反向路线</span><b>${esc(site(pl.site).name)} → ${esc(rt.targetName || storage(rt.target || 'S1').name)}</b></div>
      </div>
      <div class="form-card">
        <div class="fc-title">接收退库物品并安排人车（E03）</div>
        <div class="f-row"><label>驾驶员</label><div class="f-select" id="e_driver" data-v="D1" onclick="pickDriver()">王 强 · 从业资格证 JZ-3301</div></div>
        <div class="f-row"><label>车辆</label><div class="f-select" id="e_vehicle" data-v="V1" onclick="pickVehicle()">川L·10295 · 载重 2000kg</div></div>
      </div>
      <button class="btn primary block" onclick="doReturnDepart('${rt.id}')">确认接收 · 发车反向押送</button>` : `
      <div class="route-wrap">${routeSVG(tr.progress)}
        <div class="route-meta"><span>${esc(tr.route.from)}</span><b>${tr.progress || 0}%</b><span>${esc(tr.route.to)}</span></div>
      </div>
      <div class="ok-strip">${rt.status === '待入库确认' ? '已到库，待库管员拍照核销入库' : '反向押送中 · 安全监理与原出库库管员实时跟踪'}</div>
      ${rt.status === '押送中' ? `<div class="form-card">
        <div class="fc-title">到达指定库房（手动确认）</div>
        <div class="kv"><span>目标库房</span><b>${esc(rt.targetName || storage(rt.target || 'S1').name)}</b></div>
        <div class="kv"><span>状态同步</span><b>安全监理 · 原出库库管员 · 押运员</b></div>
        <div class="f-note">到达后点下方按钮，库管员才能进入待入库确认（需拍照核实后库存回加）。</div>
        <button class="btn primary block" type="button" onclick="escortArriveReturn('${rt.id}')">到达指定库房 · 通知库管员入库</button>
      </div>` : ''}`}
      <div class="f-note center">退库反向押送复用运输链路（direction=RETURN），到库后由库管员按批次核销、库存回加。</div>`;
    }
  }
});
function doReturnDepart(rtId) {
  /* 扫码接单时已获取退库单并绑定本人，这里不再要求二次扫码 */
  if (!window._formState || window._formState.scan !== 'skip') window._formState = { scan: 'skip' };
  const rt = byId(DB.returns, rtId);
  const tr = departReturn(rt, 'P5', $('#e_driver').dataset.v, $('#e_vehicle').dataset.v);
  saveDB();
  toast('已发车反向押送，安全监理与原出库库管员可实时跟踪', true);
  nav.render();
  startRouteAnim(tr);
}
/* 押运员手动确认到达指定库房 → 库管员方可入库确认 */
function escortArriveReturn(rtId) {
  const rt = byId(DB.returns, rtId);
  if (!rt) return toast('退库单不存在', false);
  if (rt.status !== '押送中') return toast(`当前状态为「${rt.status}」，不可重复确认到达`, false);
  const target = rt.targetName || storage(rt.target || 'S1').name;
  confirmSheet('到达确认', `确认已将退库物品送达「${target}」？\n确认后安全监理与原出库库管员同步看到「待入库确认」，库管员方可拍照核销入库。`,
    () => {
      arriveReturn(rt);
      saveDB();
      toast('已确认到达，等待库管员拍照核销入库', true);
      nav.render();
    }, '确认到达');
}
function supGoBlast(id) { nav.push('sup-blast', { id }); }

/* ================= 安全监理：退库单二维码（押运员扫码接单）================= */
Object.assign(PAGES, {
  'sup-return-qr': {
    title: '退库单二维码',
    render(p) {
      const rt = byId(DB.returns, p.id);
      if (!rt) return EMPTY('退库单不存在') + `<button class="btn ghost block" onclick="nav.reset('sup-home',{f:'ret'})">返回</button>`;
      const pl = planById(rt.plan);
      const out = outboundById(rt.outbound);
      const target = rt.targetName || storage(rt.target || 'S1').name;
      return `
      <div class="head-card sm">
        <div class="hc-no">${esc(rt.retNo)}</div>
        <div class="hc-name">${esc(site(pl.site).name)} → ${esc(target)}</div>
        <div class="hc-sub">退库单已生成 · 等待押运员扫码接单</div>
      </div>
      <div class="card qr-card qr-sm">
        ${qrSVG(rt.retNo)}
        <div class="qr-no">${esc(rt.retNo)}</div>
        <div class="qr-tip">押运员扫码接单（E03）· 扫码后该单才进入其「返程押送」，未接单他人不可见</div>
      </div>
      <div class="form-card">
        <div class="fc-title">退库单内容（押运员扫码后核对）</div>
        ${rt.items.map(i => `<div class="kv"><span>${esc(goodsName(i.goods))} · ${esc(i.spec)}</span><b>${i.qty} ${esc(GOODS[i.goods].unit)}</b></div>`).join('')}
        <div class="kv"><span>退库去向</span><b>${esc(target)}</b></div>
        <div class="kv"><span>关联原出库单</span><b>${esc(out ? out.outNo : '-')}</b></div>
        <div class="kv"><span>监护人</span><b>${esc(person(rt.supervisor || 'P2').name)}（安全监理）</b></div>
        <div class="kv"><span>接单状态</span><b>${rt.escortScan ? `已接单 · ${esc(person(rt.escortScan.by).name)} · ${fmtTime(rt.escortScan.time)}` : '待押运员扫码接单'}</b></div>
      </div>
      <div class="f-note" style="margin:8px 2px">一单一码一位押运员：接单后按原路线反向回库，库管员核销入库；不可分批、库房不能拒收（Q07）。</div>
      <button class="btn primary block" onclick="nav.reset('sup-home',{f:'ret'})">完成 · 返回退库列表</button>`;
    }
  }
});
