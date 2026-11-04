/* ============================================================
 * pages-b.js — 押运员 / 安全员 / 安全监理
 * ============================================================ */
Object.assign(PAGES, {

  /* ================= 押运员：首页 ================= */
  'escort-home': {
    title: '押运任务',
    tabs: () => roleTabs('escort-home', 0),
    render(p) {
      const f = p.f || 'sign';
      const unsigned = DB.outbounds.filter(o => !o.signed && o.status === '待签收');
      const onroad = DB.transports.filter(t => t.direction === 'GO' && ['待发车', '运输中'].includes(t.status));
      const rets = DB.returns.filter(r => ['待押送', '押送中'].includes(r.status));
      let body = '';
      if (f === 'sign') body = unsigned.length ? unsigned.map(o => {
        const pl = planById(o.plan);
        const dest = outGroups(o).length > 1 ? `${outGroups(o).length} 个作业点（${outGroups(o).map(g => site(g.site).name).join('、')}）` : site(pl.site).name;
        return `<div class="card plan-card" onclick="nav.push('escort-sign',{id:'${o.id}'})">
          <div class="pc-top"><span class="pc-no">${esc(o.outNo)}</span>${statusPill(o.status)}</div>
          <div class="pc-name">扫码签收 → ${esc(dest)}</div>
          <div class="pc-sub">出库 ${fmtTime(o.outTime)} · 合计 ${Math.round(planKg(o.items))}kg · 长按联单二维码可扫</div></div>`;
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
          <div class="pc-name">反向押送：${esc(site(pl.site).name)} → 城西销售库</div>
          <div class="pc-sub">${r.items.map(i => goodsName(i.goods) + ' ' + i.qty + GOODS[i.goods].unit).join('、')}</div></div>`;
      }).join('') : EMPTY('暂无返程押送任务');
      return `
      <div class="page-title">押运运输（C 模块）<span class="page-sub">签收 → 人车路线 → 发车打点 → 在途轨迹</span></div>
      <div class="seg">
        <button type="button" class="seg-i ${f === 'sign' ? 'on' : ''}" onclick="nav.reset('escort-home',{f:'sign'})">待签收 ${unsigned.length || ''}</button>
        <button type="button" class="seg-i ${f === 'road' ? 'on' : ''}" onclick="nav.reset('escort-home',{f:'road'})">在途 ${onroad.length || ''}</button>
        <button type="button" class="seg-i ${f === 'ret' ? 'on' : ''}" onclick="nav.reset('escort-home',{f:'ret'})">返程押送 ${rets.length || ''}</button>
      </div>
      ${body}`;
    }
  },

  /* ================= 押运员：扫码签收（一单可多点 · 校验载重 · 可调卸货顺序）================= */
  'escort-sign': {
    title: '押运签收',
    render(p) {
      const o = outboundById(p.id);
      const groups = outGroups(o);
      const kg = Math.round(planKg(o.items));
      window._formState = { sign: false };
      const ordered = groups.slice().sort((a, b) => MASTER.sites.findIndex(s => s.id === a.site) - MASTER.sites.findIndex(s => s.id === b.site));
      return `
      <div class="card qr-card sm">
        <div class="scan-btn" onclick="this.textContent='✓ 已扫码（${esc(o.outNo)}）';this.classList.add('ok')">
          <svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 4h6M20 4h-4M4 20v-6M20 20h-6M4 8v4h4M20 8v4h-4" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>
          <span>模拟扫联单二维码（C01）</span>
        </div>
        <div class="qr-tip">签收人实名绑定：孙立冬 138****1205</div>
      </div>
      <div class="form-card">
        <div class="fc-title">逐品种核对数量（${groups.length > 1 ? '一单多点 · 合计 ' + kg + 'kg' : '单点 · ' + kg + 'kg'}）</div>
        ${groups.map(g => `<div class="fc-title" style="margin-top:6px">${esc(site(g.site).name)} · ${esc(planById(g.plan).planNo)}</div>` + g.items.map(it => `<div class="kv"><span>${esc(goodsName(it.goods))} · ${esc(it.spec)}<i class="batch">${esc(it.batch)}</i></span><b>${it.qty} ${esc(GOODS[it.goods].unit)} <em class="ok">✓</em></b></div>`).join('')).join('')}
        ${groups.length > 1 ? `<div class="f-note">合并总重 ${kg}kg，车辆选择时将校验载重（载重不足的车辆不可选）。</div>` : ''}
      </div>
      <div class="form-card">
        <div class="fc-title">驾驶员 / 车辆（C02）· 累计重量 ${kg}kg · 载重不足车辆不可选</div>
        <div class="f-row"><label>驾驶员</label><div class="f-select" id="e_driver" data-v="D1" onclick="pickDriver()">王 强 · 从业资格证 JZ-3301</div></div>
        <div class="f-row"><label>车辆</label><div class="f-select" id="e_vehicle" data-v="V1" onclick="pickVehicle(${kg})">${vehicleFor(kg)} · 载重合适</div></div>
        <div class="f-row"><label>路线快选</label><div class="f-select" id="e_route" data-v="" onclick="pickRoute('${o.storage}')">从治安大队维护的路线中选择（可跳过）</div></div>
        <div class="f-row"><label>途经路线</label><input id="e_via" class="f-sel w" value="G318 国道 → 青龙山专线"></div>
        <div class="f-note">起运点 ${esc(storage(o.storage).name)} → 卸货点 ${groups.length} 处（自动带出，C03）</div>
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
      <button class="btn primary block" onclick="doSign('${o.id}')">确认签收 · 生成运输单</button>`;
    }
  }
});
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
  sheet('选择驾驶员', MASTER.drivers.map(d => ({ label: `${d.name} · ${d.cert}`, id: d.id })), x => {
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
function pickVehicle(kg) {
  sheet('选择车辆（累计 ' + kg + 'kg）', MASTER.vehicles.map(v => ({ label: `${v.plate} · ${v.model} · 载重 ${v.load}kg${v.load < kg ? '（载重不足，不可选）' : ''}`, id: v.id, ok: v.load >= kg })), x => {
    if (!x.ok) return toast(`车辆 ${x.label.split(' · ')[0]} 载重不足 ${kg}kg，不可选`, false);
    $('#e_vehicle').textContent = x.label.split(' · ')[0] + ' · 载重 ' + (x.label.match(/载重 (\d+)kg/) || [])[1] + 'kg';
    $('#e_vehicle').dataset.v = x.id;
  });
}
function doSign(outId) {
  const o = outboundById(outId);
  const kg = Math.round(planKg(o.items));
  const v = vehicle($('#e_vehicle').dataset.v);
  if (v.load < kg) return toast(`车辆 ${v.plate} 载重 ${v.load}kg 不足累计 ${kg}kg，请更换车辆`, false);
  const cps = [];
  document.querySelectorAll('#cp-list [data-cp]').forEach(el => { const n = el.value.trim(); if (n) cps.push(n); });
  if (!cps.length) return toast('请至少设置 1 个沿途打卡点', false);
  const order = [...document.querySelectorAll('#stop-list [data-plan]')].map(el => el.dataset.plan);
  const tr = signTransport(o, 'P5', $('#e_driver').dataset.v, $('#e_vehicle').dataset.v, val('e_via'), cps, order);
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
        ${tr.departTime ? `<div class="kv"><span>出发打点</span><b>${fmtFull(tr.departTime)}（服务端时间+定位双写）</b></div>` : ''}
        <div class="kv"><span>轨迹点</span><b>${tr.tracks || 0} 个 · 30s 间隔上报（C05）</b></div>
        ${tr.status === '运输中' ? `<div class="kv"><span>偏离预警</span><b class="ok">未触发（>500m×3 点判异，C06）</b></div>` : ''}
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
        <div class="fc-title">卸货点序列（${tr.stops.filter(s => s.done).length}/${tr.stops.length} 站完成 · 逐点围栏判定 + 本点核量）</div>
        ${tr.stops.map((s, i) => {
          const sp = planById(s.plan);
          const tier = tierOf(planKg(sp.items));
          return `<div class="rc-item">
          <div class="oi-name">${i + 1}. ${esc(site(s.site).name)} <i class="batch">${esc(sp.planNo)}</i>${tier.level !== '抽查' ? ` <em class="warn">${esc(tier.level)}</em>` : ''}</div>
          ${s.done ? `<div class="kv"><span>核量接收</span><b>已完成 · 到达 ${fmtTime(s.arriveTime)}</b></div>`
            : (s.suggestArrive ? `<div class="kv"><span>围栏判定</span><b>已进场 · 待安全员核量接收</b></div>`
              : (tr.status === '运输中' && i === pendingIdx
                ? `<button class="btn primary sm block" onclick="arriveStopCheck('${tr.id}',${i})">到达此卸货点（进入围栏 D01）</button>`
                : '<div class="f-note">待前站完成后到达</div>'))}
        </div>`;
        }).join('')}
        <div class="f-note">单点核量不影响整趟：某点差异生成异常单后，押运继续前往下一卸货点。</div>
      </div>` : ''}
      ${tr.status === '待发车' ? `
        <button class="btn primary block" onclick="doDepart('${tr.id}')">发车 · 记录出发时间（定位打点 C04）</button>
        <div class="f-note center">发车后自动开启在途轨迹上报，逐点进入围栏后由押运员确认到达</div>` : ''}
      ${tr.status === '运输中' ? `
        <div class="btn-row">
          <button class="btn ghost" onclick="reportAbnormal('${tr.id}')">异常上报（C07）</button>
          <button class="btn ghost" onclick="nav.push('keeper-out-detail',{id:'${tr.outbound}'})">查看出库联单</button>
        </div>
        <div class="f-note center">${stops ? '每点到达后由现场安全员核量本点明细，全部点完成整趟结束' : '到达后由现场安全员进行「到场接收」确认'}</div>` : ''}
      ${tr.status === '已到达' ? `<div class="ok-strip">${stops ? '全部卸货点已完成核量接收，整趟押运结束' : '已到达作业点围栏，建议到达时间已生成，待安全员确认（D02）'}</div>` : ''}`;
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
  confirmSheet('到达卸货点', `进入「${site(st.site).name}」围栏，系统将记录到达时间与定位，该作业点转入待接收（安全员核量）。`, () => {
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
      if (f === 'ret') body = waitRet.length ? waitRet.map(x => `<div class="card plan-card" onclick="nav.push('sup-return',{id:'${x.id}'})">
        <div class="pc-top"><span class="pc-no">${esc(x.planNo)}</span>${statusPill(x.status)}</div>
        <div class="pc-name">${esc(site(x.site).name)}</div>
        <div class="pc-sub">退库登记 / 反向押送进度</div></div>`).join('') : EMPTY('暂无退库中作业点');
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
      window._formState = { photos: 0, ssign: false };
      const nowDT = new Date(Date.now());
      const dv = `${nowDT.getFullYear()}-${pad(nowDT.getMonth() + 1)}-${pad(nowDT.getDate())}T${pad(nowDT.getHours())}:${pad(nowDT.getMinutes())}`;
      return `
      <div class="head-card sm">
        <div class="hc-no">${esc(pl.planNo)}</div>
        <div class="hc-name">${esc(site(pl.site).name)}</div>
        <div class="hc-sub">到场 ${rc ? fmtTime(rc.arriveTime) : '-'} · 出库量 ${o ? o.items.reduce((s, i) => s + (i.goods === 'zy' ? i.qty : 0), 0) : 0}kg</div>
      </div>
      <div class="form-card">
        <div class="fc-title">爆破情况（E01）</div>
        <div class="f-row"><label>实际起爆时间</label><input id="b_time" type="datetime-local" class="f-sel w" value="${dv}"></div>
        <div class="f-row"><label>爆破方式</label><select id="b_method" class="f-sel w"><option>毫秒延时爆破</option><option>光面爆破</option><option>预裂爆破</option><option>拆除爆破</option></select></div>
        <div class="f-row"><label>天气情况</label><select id="b_weather" class="f-sel w"><option>晴</option><option>多云</option><option>阴</option><option>小雨</option><option>大风（≥5级）</option></select></div>
        <div class="f-row"><label>炸药领取库房</label><b>${o ? esc(storage(o.storage).name) : '-'}<i class="src-note">（出库单自动带出）</i></b></div>
        <div class="f-row"><label>爆破责任单位</label><b>${esc(company(project(planById(p.id).project).company).name)}<i class="src-note">（项目备案带出）</i></b></div>
        ${o.items.map((it, i) => {
          const def = it.goods === 'lg' ? it.qty : (it.goods === 'zy' ? Math.round(it.qty * 0.84 * 10) / 10 : Math.round(it.qty * 0.8 * 10) / 10);
          return `<div class="oi-edit"><span>${esc(goodsName(it.goods))} 实际用量</span><input id="bu_${i}" type="number" value="${def}" oninput="renderBalance('${pl.id}')"><span class="f-unit">${esc(GOODS[it.goods].unit)}</span></div>`;
        }).join('')}
        <div class="f-row"><label>爆破效果</label><textarea id="b_effect" class="f-ta" placeholder="块度、飞石、盲炮等情况"></textarea></div>
        <div class="f-row"><label>备注</label><input id="b_remark" placeholder="其他需说明的情况（选填）"></div>
      </div>
      <div class="form-card">
        <div class="fc-title">爆破结果（三态）</div>
        <div class="radios">
          <label><input type="radio" name="b_result" value="NORMAL_NO_RETURN" onchange="renderBalance('${pl.id}')">正常 · 无返库</label>
          <label><input type="radio" name="b_result" value="NORMAL_RETURN" checked onchange="renderBalance('${pl.id}')">正常 · 有返库</label>
          <label><input type="radio" name="b_result" value="ABNORMAL" onchange="renderBalance('${pl.id}')">异常</label>
        </div>
        <div class="f-row"><label>盲炮未处理</label><select id="b_blind" class="f-sel w" onchange="renderBalance('${pl.id}')"><option value="">无</option><option value="1">有（双通知民警+监理单位）</option></select></div>
      </div>
      <div class="form-card">
        <div class="fc-title">监理核验人员（爆破结束后共同核验，F6）</div>
        ${MASTER.persons.filter(pp => ['爆破员', '测量技术员', '安全员'].includes(pp.role)).map(pp => `<div class="ck-line exec"><span class="ck-txt">${esc(pp.name)} · ${esc(pp.role)}</span><input type="checkbox" data-checker="${pp.id}" aria-label="选择${esc(pp.name)}"></div>`).join('')}
        <div class="f-note">至少选择 1 名技术人员 / 安全员参与核验；所选人员随爆破记录留痕。</div>
      </div>
      <div class="form-card">
        <div class="fc-title">安全监理手签（必签 · F6）</div>
        <div class="sign-box"><canvas id="sup_sign" width="600" height="200"></canvas>
          <div style="display:flex;gap:8px;margin-top:6px">
            <button class="btn ghost sm" onclick="clearSign('sup_sign',window._formState,'ssign')">清除</button>
            <button class="btn ghost sm" onclick="demoSign('sup_sign',window._formState,'ssign')">演示快速签名（李建国）</button>
          </div></div>
      </div>
      <div id="balance_card"></div>
      <button class="btn primary block" onclick="submitBlast('${pl.id}')">提交爆破登记</button>
      <div class="f-note center">四量对照按出库单维度、允许跨日归集（R2 / E05）；不平不允许提交完成。</div>`;
    },
    after(p) { renderBalance(p.id); initSign('sup_sign', window._formState, 'ssign'); }
  }
});
function renderBalance(planId) {
  const pl = planById(planId);
  const o = outboundByPlan(planId);
  const box = $('#balance_card');
  if (!box || !o) return;
  const used = o.items.map((it, i) => ({ goods: it.goods, spec: it.spec, qty: parseFloat(val('bu_' + i)) || 0 }));
  const result = (document.querySelector('input[name=b_result]:checked') || {}).value;
  const ret = result === 'NORMAL_RETURN' ? used.map(u => ({ ...u, qty: Math.max(0, u.qty * 0.15) })) : [];
  const blind = val('b_blind') ? 1 : 0;
  const OUT = planKg(o.items), USE = planKg(used), RET = planKg(ret);
  const LOSS = Math.max(0, OUT - USE - RET) || (blind ? 1 : 0);
  const balanced = Math.abs(OUT - USE - RET - LOSS) < 0.001;
  box.innerHTML = `<div class="card bal-card ${balanced ? '' : 'bad'}">
    <div class="fc-title">四量对照（实时 · 按出库单维度）</div>
    <div class="bal-row"><span>出库 OUT</span><b>${OUT.toFixed(1)}kg</b></div>
    <div class="bal-row"><span>实爆 USE</span><b>${USE.toFixed(1)}kg</b></div>
    <div class="bal-row"><span>退库 RET${result === 'NORMAL_RETURN' ? '（预估，提交后登记明细）' : ''}</span><b>${RET.toFixed(1)}kg</b></div>
    <div class="bal-row"><span>损耗 LOSS（含盲炮）</span><b>${LOSS.toFixed(1)}kg</b></div>
    <div class="bal-sum ${balanced ? 'ok' : 'bad'}">${balanced ? '✓ OUT = USE + RET + LOSS，平衡' : '✗ 不平衡，禁止提交完成'}</div>
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
  const checkers = [...document.querySelectorAll('[data-checker]')].filter(c => c.checked).map(c => c.dataset.checker);
  if (!checkers.length) return toast('请选择参与核验的技术人员 / 安全员（至少 1 人）', false);
  if (!window._formState.ssign) return toast('爆破结束后须安全监理手签确认', false);
  const used = o.items.map((it, i) => ({ goods: it.goods, spec: it.spec, qty: parseFloat(val('bu_' + i)) || 0 }));
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
      const usedMap = {};
      bl.used.forEach(u => usedMap[u.goods + u.spec] = u.qty);
      window._formState = { dphotos: 0 };
      const rows = o.items.map((it, i) => {
        const remain = r2(Math.max(0, it.qty - (usedMap[it.goods + it.spec] || 0)));
        return { i, it, remain };
      });
      const retRows = rows.map(r => `<div class="rc-item">
          <div class="oi-name">${esc(goodsName(r.it.goods))} · ${esc(r.it.spec)} <i class="batch">${esc(r.it.batch)}</i></div>
          <div class="oi-edit"><span>可退</span><b id="rr_${r.i}">${r.remain}</b><span class="f-unit">${esc(GOODS[r.it.goods].unit)}</span></div>
          <div class="oi-edit"><span>本次退库</span><input id="rq_${r.i}" type="number" value="${r.remain}" max="${r.remain}"><span class="f-unit">${esc(GOODS[r.it.goods].unit)}</span></div>
        </div>`).join('');
      const dhRows = rows.map(r => `<div class="rc-item">
          <div class="oi-name">${esc(goodsName(r.it.goods))} · ${esc(r.it.spec)} <i class="batch">${esc(r.it.batch)}</i></div>
          <div class="oi-edit"><span>剩余量</span><b>${r.remain}</b><span class="f-unit">${esc(GOODS[r.it.goods].unit)}</span></div>
          <div class="oi-edit"><span>销毁量</span><input id="xq_${r.i}" type="number" value="0" max="${r.remain}"><span class="f-unit">${esc(GOODS[r.it.goods].unit)}</span></div>
        </div>`).join('');
      return `
      <div class="head-card sm"><div class="hc-no">${esc(pl.planNo)}</div>
        <div class="hc-name">${esc(site(pl.site).name)}</div>
        <div class="hc-sub">关联原出库单 ${esc(o.outNo)}（Q4）· 支持当日 / 跨日 / 多次处置</div>
      </div>
      <div class="form-card">
        <div class="fc-title">处置方式（销售库出来未用完的爆炸物）</div>
        <div class="radios">
          <label><input type="radio" name="d_mode" value="return" checked onchange="dispMode()">退库 · 反向押送回原销售库</label>
          <label><input type="radio" name="d_mode" value="destroy" onchange="dispMode()">销毁 · 现场登记销毁量</label>
        </div>
        <div class="f-note" id="dm_note">生成退库单并推送押运员：扫码确认退库量、驾驶员、押运员后按原押运路线反向回库。</div>
      </div>
      <div id="ret_box">
        <div class="form-card">
          <div class="fc-title">退库明细（E02）· 不可超剩余量</div>
          ${retRows}
        </div>
        <div class="card warn-card sm">
          <div class="f-note">跨日退库说明：退库可跨日归集到同一出库单；默认 T+3 未退库转预警（12.4 约束 3）。</div>
        </div>
        <button class="btn primary block" onclick="submitReturn('${pl.id}')">提交退库单 · 生成反向押送任务</button>
      </div>
      <div id="dh_box" style="display:none">
        <div class="form-card">
          <div class="fc-title">销毁登记 · 逐品种销毁量</div>
          ${dhRows}
          <div class="f-row" style="margin-top:8px"><label>销毁原因 / 方式</label><textarea id="dh_reason" class="f-ta" placeholder="如：受潮结块失效，按 GB6722 规程现场爆破销毁"></textarea></div>
          <div class="f-row"><label>销毁现场照片</label><div id="dhph">${photoStrip(window._formState, 'dphotos')}</div></div>
          <div class="f-note">销毁记录同步民警与库管员（台账记销毁出账），链路直接进入待核验。</div>
        </div>
        <button class="btn danger block" onclick="submitDestroy('${pl.id}')">提交销毁记录（须照片留证）</button>
      </div>`;
    }
  }
});
function dispMode() {
  const destroy = (document.querySelector('input[name=d_mode]:checked') || {}).value === 'destroy';
  const ret = $('#ret_box'), dh = $('#dh_box'), note = $('#dm_note');
  if (ret) ret.style.display = destroy ? 'none' : '';
  if (dh) dh.style.display = destroy ? '' : 'none';
  if (note) note.textContent = destroy
    ? '销毁须逐品种登记销毁量、原因并拍照留证；记录推送民警与库管员。'
    : '生成退库单并推送押运员：扫码确认退库量、驾驶员、押运员后按原押运路线反向回库。';
}
function submitDestroy(planId) {
  const pl = planById(planId);
  const o = outboundByPlan(planId);
  const bl = blastingByPlan(planId);
  const usedMap = {}; bl.used.forEach(u => usedMap[u.goods + u.spec] = u.qty);
  const items = [];
  o.items.forEach((it, i) => {
    const q = parseFloat(val('xq_' + i)) || 0;
    const remain = r2(Math.max(0, it.qty - (usedMap[it.goods + it.spec] || 0)));
    if (q > remain) { items.push('__BAD__'); return; }
    if (q > 0) items.push({ goods: it.goods, spec: it.spec, qty: q, batch: it.batch });
  });
  if (items.includes('__BAD__')) return toast('销毁量超过剩余量，已拦截', false);
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
  const usedMap = {}; bl.used.forEach(u => usedMap[u.goods + u.spec] = u.qty);
  const items = [];
  o.items.forEach((it, i) => {
    const q = parseFloat(val('rq_' + i)) || 0;
    const remain = r2(Math.max(0, it.qty - (usedMap[it.goods + it.spec] || 0)));
    if (q > remain) { items.push('__BAD__'); return; }
    if (q > 0) items.push({ goods: it.goods, spec: it.spec, qty: q, batch: it.batch });
  });
  if (items.includes('__BAD__')) return toast('退库量超过剩余量，已拦截（行级防超退）', false);
  if (!items.length) return toast('退库量不能为 0', false);
  const rt = createReturn(pl, items, 'P2');
  saveDB();
  toast(`退库单 ${rt.retNo} 已生成，已推送押运员反向押送`, true);
  nav.reset('sup-home');
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
        <div class="hc-name">${esc(site(pl.site).name)} → 城西销售库</div>
        <div class="hc-sub">${rt.items.map(i => goodsName(i.goods) + ' ' + i.qty + GOODS[i.goods].unit).join('、')}</div>
      </div>
      ${!tr ? `
      <div class="card qr-card sm">
        <div class="scan-btn" onclick="this.textContent='✓ 已扫码（${esc(rt.retNo)}）';this.classList.add('ok');window._formState.scan=true">
          <svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 4h6M20 4h-4M4 20v-6M20 20h-6M4 8v4h4M20 8v4h-4" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>
          <span>押运员扫码确认退库单</span>
        </div>
        <div class="qr-tip">扫码核对：退库量 · 驾驶员 · 押运员（确认后方可发车）</div>
      </div>
      <div class="form-card">
        <div class="fc-title">退库单确认（E03 · 扫码即核对）</div>
        ${rt.items.map(i => `<div class="kv"><span>${esc(goodsName(i.goods))} · ${esc(i.spec)}<i class="batch">${esc(i.batch)}</i></span><b>退库量 ${i.qty} ${esc(GOODS[i.goods].unit)}</b></div>`).join('')}
        <div class="kv"><span>押运员</span><b>孙立冬（本人）</b></div>
        <div class="kv"><span>路线</span><b>原押运路线反向：${esc(site(pl.site).name)} → 城西销售库</b></div>
      </div>
      <div class="form-card">
        <div class="fc-title">接收退库物品并安排人车（E03）</div>
        <div class="f-row"><label>驾驶员</label><div class="f-select" id="e_driver" data-v="D1" onclick="pickDriver()">王 强 · 从业资格证 JZ-3301</div></div>
        <div class="f-row"><label>车辆</label><div class="f-select" id="e_vehicle" data-v="V1" onclick="pickVehicle()">川L·10295 · 载重 2000kg</div></div>
      </div>
      <button class="btn primary block" onclick="doReturnDepart('${rt.id}')">确认接收 · 发车反向押送</button>` : `
      <div class="route-wrap">${routeSVG(tr.progress)}
        <div class="route-meta"><span>${esc(tr.route.from)}</span><b>${tr.progress || 0}%</b><span>销售库</span></div>
      </div>
      <div class="ok-strip">${rt.status === '待入库确认' ? '已到库，待库管员核销入库' : '反向押送中…'}</div>`}
      <div class="f-note center">退库反向押送复用运输链路（direction=RETURN），到库后由库管员按批次核销、库存回加。</div>`;
    }
  }
});
function doReturnDepart(rtId) {
  if (!(window._formState && window._formState.scan)) return toast('请先扫码确认退库单（退库量/驾驶员/押运员）', false);
  const rt = byId(DB.returns, rtId);
  const tr = departReturn(rt, 'P5', $('#e_driver').dataset.v, $('#e_vehicle').dataset.v);
  saveDB();
  toast('扫码确认完成，已发车反向押送', true);
  nav.render();
  startRouteAnim(tr);
}
function supGoBlast(id) { nav.push('sup-blast', { id }); }
