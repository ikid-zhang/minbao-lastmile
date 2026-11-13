/* ============================================================
 * api.js — 民爆“最后一公里”前后端实时通信与双模同步客户端
 * 支持真实 RESTful API 交互与离线本地演示模式自动切换
 * ============================================================ */

const API_BASE = (window.location.origin && window.location.origin.startsWith('http'))
  ? (window.location.origin + '/api')
  : 'http://localhost:8080/api';

window.IS_ONLINE = false;
// 是否已完成首次全量拉取：未完成前禁止回推，避免空种子覆盖后端数据
window.__mbReady = false;

// 通用异步网络请求
/* ---------- 库房存量同步（出库扣减 / 退库入库必须真实落库，不得只在前端内存里变）---------- */
window.__stockSnap = window.__stockSnap || null;
function syncStocks() {
  if (window.IS_ONLINE !== true || typeof httpReq !== 'function') return;
  if (!window.__stockSnap) {
    window.__stockSnap = {};
    MASTER.storages.forEach(st => { window.__stockSnap[st.id] = JSON.stringify(st.stock || {}); });
    return;   // 首轮只建基线，不推送
  }
  MASTER.storages.forEach(st => {
    const cur = JSON.stringify(st.stock || {});
    if (window.__stockSnap[st.id] === cur) return;
    window.__stockSnap[st.id] = cur;
    httpReq('/master/storages', 'POST', { id: st.id, stock: st.stock, _remark: '存量变更（出库扣减 / 退库入库）' })
      .then(r => { if (!r.ok) { window.__stockSnap[st.id] = null; } })
      .catch(() => { window.__stockSnap[st.id] = null; });
  });
}

async function httpReq(path, method = 'GET', data = null) {
  const url = API_BASE + path;
  try {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (data && method !== 'GET') {
      opts.body = JSON.stringify(data);
    }
    const resp = await fetch(url, opts);
    if (!resp.ok) {
      const errJson = await resp.json().catch(() => ({ msg: resp.statusText }));
      return { ok: false, status: resp.status, msg: errJson.msg || resp.statusText };
    }
    const json = await resp.json();
    return { ok: true, data: json.data, msg: json.msg, code: json.code };
  } catch (err) {
    return { ok: false, error: err, msg: '网络连接失败，自动转为离线模式' };
  }
}

// 检查服务端连通状态
async function checkServerHealth() {
  const res = await httpReq('/health');
  window.IS_ONLINE = !!(res.ok && (res.code === 200 || res.code === 0));
  window.__apiErr = res.ok ? '' : (res.msg || (res.error && res.error.message) || 'HTTP 失败');
  updateServerStatusBadge();
  if (window.IS_ONLINE) { _hcDelay = 2000; }
  scheduleHealthCheck(window.IS_ONLINE ? 20000 : _hcDelay);
  return window.IS_ONLINE;
}
/* 健康巡检：首次失败会按退避自动重连（2s→4s→8s→…→20s），在线后每 20s 复检 */
let _hcTimer = null, _hcDelay = 2000;
function scheduleHealthCheck(delay) {
  if (_hcTimer) clearTimeout(_hcTimer);
  _hcTimer = setTimeout(async () => {
    const wasOnline = window.IS_ONLINE;
    const ok = await checkServerHealth();
    if (ok && !wasOnline) {
      if (!window.__mbReady) pullFromServer();
      else if (window.__mbDirty && typeof syncDeltas === 'function') syncDeltas();
    }
    if (!ok) _hcDelay = Math.min(Math.round(_hcDelay * 1.6), 20000);
  }, delay);
}

// 更新顶栏服务端状态标签
function updateServerStatusBadge() {
  let badge = document.getElementById('serverStatusBadge');
  if (!badge) {
    const appbar = document.getElementById('appbar');
    if (!appbar) return;
    badge = document.createElement('div');
    badge.id = 'serverStatusBadge';
    badge.style.cssText = 'font-size:11px;padding:2px 8px;border-radius:999px;margin-right:8px;display:inline-flex;align-items:center;gap:4px;cursor:pointer;white-space:nowrap;flex:0 0 auto;';
    const right = appbar.querySelector('.ab-right');
    if (right) {
      right.prepend(badge);
    }
  }

  if (window.IS_ONLINE) {
    badge.innerHTML = `<span style="width:6px;height:6px;border-radius:50%;background:#00e676;display:inline-block;"></span><span style="color:#00e676;">已连接</span>`;
    badge.title = '当前连接后端真实服务，数据全链路持久化并与大屏/PC实时同步';
  } else {
    badge.innerHTML = `<span style="width:6px;height:6px;border-radius:50%;background:#a9b1bf;display:inline-block;"></span><span style="color:#a9b1bf;">离线·重连中</span>`;
    badge.title = '未连上后端，正在自动重连（点击查看诊断）';
    badge.style.cursor = 'pointer';
    badge.onclick = () => {
      const info = `接口地址 ${API_BASE}｜最近错误：${window.__apiErr || '无响应'}。请确认后端已启动（node server/server.js，端口 8080），且本页通过 http://localhost:8080 打开。`;
      if (typeof toast === 'function') toast(info, false);
      else alert(info);
      checkServerHealth();
    };
  }
}

// 从服务端拉取全量最新数据并合并
/* 同一 id 只保留最后一条：早期 seq 重置会生成重复 id，重复项会让 planById 命中旧记录 */
function dedupeById(list) {
  const map = new Map();
  (list || []).forEach(x => { if (x && x.id) map.set(x.id, x); });
  return Array.from(map.values());
}
async function pullFromServer() {
  if (!window.IS_ONLINE) {
    const online = await checkServerHealth();
    if (!online) return false;
  }

  const res = await httpReq('/all');
  if (res.ok && res.data) {
    /* 拉取前先记住本地记录：服务端还没有的（刚提交但尚未同步成功）不能被覆盖掉 */
    const localBefore = {};
    DOC_COLLS.forEach(k => { localBefore[k] = (DB[k] || []).map(x => JSON.parse(JSON.stringify(x))); });
    const srv = res.data;
    if (Array.isArray(srv.plans)) {
      DB.plans = dedupeById(srv.plans).map(p => Object.assign({}, p, {
        project: p.projectId || p.project,
        workarea: p.workareaId || p.workarea,
        site: p.siteId || p.site,
        planStart: typeof p.planStart === 'number' ? p.planStart : (p.planStart ? new Date(p.planStart).getTime() : Date.now()),
        planEnd: typeof p.planEnd === 'number' ? p.planEnd : (p.planEnd ? new Date(p.planEnd).getTime() : Date.now() + 3600000),
        items: (p.items || []).map(it => ({ goods: it.goodsType || it.goods, spec: it.spec, qty: it.planQty !== undefined ? it.planQty : it.qty })),
        surveyor: p.surveyorId || p.surveyor || 'P7',
        applicant: p.applicantId || p.applicant || 'P1',
        rawServerItems: undefined,
        createdAt: typeof p.createdAt === 'number' ? p.createdAt : (p.createdAt ? new Date(p.createdAt).getTime() : Date.now()),
        outStorage: p.outStorageId || p.outStorage || 'S1',
        tier: p.tier || tierOf(p.planKg || planKg(p.items || [])).level,
        /* 多点位明细：回拉时按后端格式重建，避免多轮同步丢点位 */
        sitePlans: (p.sitePlans && p.sitePlans.length)
          ? p.sitePlans.map(sp => ({
              site: sp.site || sp.siteId,
              items: (sp.items || []).map(it => ({ goods: it.goodsType || it.goods, spec: it.spec, qty: it.planQty !== undefined ? it.planQty : it.qty }))
            }))
          : null
      }));
    }
    if (Array.isArray(srv.outbounds)) DB.outbounds = srv.outbounds;
    if (Array.isArray(srv.transports)) DB.transports = srv.transports;
    if (Array.isArray(srv.receives)) DB.receives = srv.receives;
    if (Array.isArray(srv.blastings)) DB.blastings = srv.blastings;
    if (Array.isArray(srv.destroys)) DB.destroys = srv.destroys;
    if (Array.isArray(srv.returns)) DB.returns = srv.returns;
    if (Array.isArray(srv.verifies)) DB.verifies = srv.verifies;
    if (Array.isArray(srv.checks)) DB.checks = srv.checks;
    if (Array.isArray(srv.rectifies)) DB.rectifies = srv.rectifies;
    if (Array.isArray(srv.accidents)) DB.accidents = srv.accidents;
    if (Array.isArray(srv.exceptions)) DB.exceptions = srv.exceptions;
    if (Array.isArray(srv.messages)) DB.messages = srv.messages;
    /* 留痕与扫码绑定也必须以数据库为准，否则刷新后日志/接管记录丢失 */
    if (Array.isArray(srv.nodeLogs)) DB.logs = srv.nodeLogs;
    if (Array.isArray(srv.masterLogs)) DB.masterLogs = srv.masterLogs;
    if (Array.isArray(srv.escortScans)) DB.escortScans = srv.escortScans;

    /* ---------- 基础数据与业务同源：PC 端维护的点位/路线/库房/四大员直接驱动小程序 ---------- */
    if (Array.isArray(srv.companies) && srv.companies.length) MASTER.companies = srv.companies;
    if (Array.isArray(srv.persons) && srv.persons.length) MASTER.persons = srv.persons;
    if (Array.isArray(srv.vehicles) && srv.vehicles.length) MASTER.vehicles = srv.vehicles.map(v => Object.assign({ load: 0, status: '在用' }, v));
    if (Array.isArray(srv.drivers) && srv.drivers.length) MASTER.drivers = srv.drivers;
    if (Array.isArray(srv.workareas) && srv.workareas.length) MASTER.workareas = srv.workareas;
    if (Array.isArray(srv.projects) && srv.projects.length) MASTER.projects = srv.projects;
    if (Array.isArray(srv.sites) && srv.sites.length) {
      MASTER.sites = srv.sites.map(x => Object.assign({ fence: 0, hist: 0, status: '生效' }, x));
    }
    if (Array.isArray(srv.routes) && srv.routes.length) {
      MASTER.routes = srv.routes.map(x => Object.assign({ checkPoints: [], km: 0, status: '启用' }, x));
    }
    if (Array.isArray(srv.storages) && srv.storages.length) {
      /* 库房按 id 逐字段合并：远端只回带 id+stock 时不会把本地档案（名称/类型/保管员）抹掉 */
      srv.storages.forEach(ss => {
        let local = MASTER.storages.find(x => x.id === ss.id);
        if (!local) {
          local = { id: ss.id, name: ss.name || ss.id, type: ss.type || '使用库', keepers: [], fence: 0,
                    stock: { zy: {}, lg: {}, db: {} }, status: '生效' };
          MASTER.storages.push(local);
        }
        Object.keys(ss).forEach(k => {
          if (k === 'stock') { local.stock = ss.stock; return; }
          if (ss[k] !== undefined && ss[k] !== null && ss[k] !== '') local[k] = ss[k];
        });
      });
      applyStock(srv.storages.reduce((acc, s) => { acc[s.id] = s.stock; return acc; }, {}));
    }
    window.__stockSnap = {};
    MASTER.storages.forEach(st => { window.__stockSnap[st.id] = JSON.stringify(st.stock || {}); });
    try { localStorage.setItem(DB_KEY, JSON.stringify(DB)); } catch(e) {}
    window.__mbDirty = false;
    window.__mbReady = true;
    /* 本地上次已同步过、但服务端现在没有的记录 = 服务端删除 → 尊重删除；
       本地从未同步过的记录 = 刚提交还没写库 → 必须保留并补传 */
    const syncedBefore = {};
    DOC_COLLS.forEach(k => { syncedBefore[k] = Object.keys((window.__docSnap && window.__docSnap[k]) || {}); });
    const keptIds = {};
    DOC_COLLS.forEach(k => {
      const cur = Array.isArray(DB[k]) ? DB[k] : [];
      const ids = new Set(cur.filter(x => x && x.id).map(x => String(x.id)));
      const prevSet = new Set(syncedBefore[k]);
      const kept = (localBefore[k] || []).filter(x => x && x.id && !ids.has(String(x.id)) && !prevSet.has(String(x.id)));
      if (kept.length) {
        DB[k] = cur.concat(kept);
        keptIds[k] = kept.map(x => String(x.id));
      }
    });
    const baseSnap = collectSnap();
    Object.keys(keptIds).forEach(k => keptIds[k].forEach(id => { if (baseSnap[k]) delete baseSnap[k][id]; }));
    window.__docSnap = baseSnap;   // 以服务端数据为基线，本地尚未上传的记录仍留在差异队列
    if (window.__mbDirty || Object.keys(keptIds).length) scheduleSync();
    if (window.nav && window.nav.render) {
      window.nav.render();
    }
    return true;
  }
  return false;
}

/* 时间戳 / 日期 → 后端可读的 "YYYY-MM-DD HH:mm:ss" */
function tsToStr(t) {
  if (t == null || t === '') return null;
  if (typeof t === 'string' && t.indexOf('-') > -1) return t.slice(0, 19);
  const d = new Date(Number(t));
  if (isNaN(d.getTime())) return null;
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/* 前端字段 → 后端字段（保证落库后 t_bb_* 表可直接查询） */
function toServerPlan(p) {
  const unitOf = g => (typeof GOODS !== 'undefined' && GOODS[g] ? GOODS[g].unit : '');
  const ratioOf = g => (typeof GOODS !== 'undefined' && GOODS[g] ? (GOODS[g].ratio || 1) : 1);
  const kg = p.planKg !== undefined ? p.planKg
    : (p.items || []).reduce((s, it) => s + (it.planQty !== undefined ? it.planQty : it.qty || 0) * ratioOf(it.goodsType || it.goods), 0);
  return Object.assign({}, p, {
    projectId: p.projectId || p.project,
    workareaId: p.workareaId || p.workarea,
    siteId: p.siteId || p.site,
    surveyorId: p.surveyorId || p.surveyor,
    applicantId: p.applicantId || p.applicant,
    regRegulatorId: p.regRegulatorId || p.regulator || null,
    planStart: tsToStr(p.planStart),
    planEnd: tsToStr(p.planEnd),
    planKg: Math.round(kg * 100) / 100,
    createdAt: tsToStr(p.createdAt),
    items: (p.items || []).map(it => ({
      goodsType: it.goodsType || it.goods,
      spec: it.spec,
      unit: it.unit || unitOf(it.goodsType || it.goods),
      planQty: it.planQty !== undefined ? it.planQty : it.qty
    }))
  });
}

/* 数据变更后的防抖同步：合并 1.5s 内的多次保存，只推一次 */
/* ============================================================
 * 写入链路：所有业务数据逐条调接口落库
 *  - saveDB() 只做「与上次快照的差异比对」，把新增/变更的记录
 *    PUT /api/doc/{coll}/{id}、删除的记录 DELETE 同名接口
 *  - 服务端 upsert 到 t_store_doc 并同步镜像表 t_bb_*
 *  - 不再整库 POST /api/all，避免前端快照覆盖数据库
 * ============================================================ */
const DOC_COLLS = ['plans', 'outbounds', 'transports', 'receives', 'blastings', 'destroys', 'returns',
  'verifies', 'checks', 'rectifies', 'accidents', 'messages', 'exceptions', 'escortScans', 'logs', 'masterLogs'];

function collOf(k) { return k === 'logs' ? 'nodeLogs' : k; }

function listOf(k) {
  if (k === 'plans') return dedupeById(DB.plans || []).map(toServerPlan);
  return DB[k] || [];
}

/* 为无 id 的记录补稳定 id（扫码绑定/历史消息），保证能逐条落库 */
function ensureId(k, item, idx) {
  if (!item || item.id || item.dataId) return item;
  if (k === 'escortScans') item.id = 'SC_' + (item.out || '') + '_' + (item.by || '');
  else item.id = collOf(k) + '_' + (item.time || Date.now()) + '_' + idx;
  return item;
}

/* 本地状态 → { 集合: { id: JSON字符串 } } */
function collectSnap() {
  const snap = {};
  DOC_COLLS.forEach(k => {
    const map = {};
    listOf(k).forEach((it, idx) => {
      const doc = ensureId(k, it, idx);
      if (doc && (doc.id || doc.dataId)) map[String(doc.id || doc.dataId)] = JSON.stringify(doc);
    });
    snap[k] = map;
  });
  return snap;
}

/* 与上次快照比对 → 待写队列 [coll, id, doc|null] */
function collectDiffs() {
  const prev = window.__docSnap || {};
  const next = collectSnap();
  const queue = [];
  DOC_COLLS.forEach(k => {
    const coll = collOf(k);
    const p = prev[k] || {};
    for (const id in next[k]) {
      if (!p[id] || p[id] !== next[k][id]) queue.push([coll, id, JSON.parse(next[k][id])]);
    }
    for (const id in p) if (!next[k][id]) queue.push([coll, id, null]);
  });
  return { queue, next };
}

let _syncTimer = null;
let _syncing = false;
function scheduleSync(delay) {
  /* 首次拉取尚未完成时不能直接丢弃：先标记脏数据，pull 成功后会自动补传 */
  if (!window.__mbReady) { window.__mbDirty = true; return; }
  const wait = typeof delay === 'number' ? delay : 100;
  if (_syncTimer) clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => { _syncTimer = null; syncDeltas(); }, wait);
}

/* 逐条调接口写库 */
async function syncDeltas() {
  if (!window.__mbReady || _syncing) return false;
  if (!window.IS_ONLINE) {
    const online = await checkServerHealth();
    if (!online) return false;
  }
  const { queue, next } = collectDiffs();
  if (!queue.length) { window.__docSnap = next; window.__mbDirty = false; return true; }
  _syncing = true;
  let ok = true;
  for (const [coll, id, doc] of queue) {
    const p = '/doc/' + coll + '/' + encodeURIComponent(id);
    const res = doc ? await httpReq(p, 'PUT', doc) : await httpReq(p, 'DELETE');
    if (!res.ok) { ok = false; break; }
  }
  _syncing = false;
  if (ok) { window.__docSnap = next; window.__mbDirty = false; }
  else if (!window.__syncFailTip) {
    window.__syncFailTip = true;
    if (typeof window.toast === 'function') window.toast('写入数据库失败，网络恢复后会自动重试', false);
  }
  return ok;
}
const pushToServer = syncDeltas;

/* 刷新 / 关页 / 切后台：把还没发出的差异用 keepalive 立即落库 */
function flushSync() {
  if (!window.__mbReady) return;
  const { queue } = collectDiffs();
  if (!queue.length) return;
  queue.forEach(([coll, id, doc]) => {
    try {
      fetch(API_BASE + '/doc/' + coll + '/' + encodeURIComponent(id), {
        method: doc ? 'PUT' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: doc ? JSON.stringify(doc) : undefined,
        keepalive: true
      });
    } catch (e) {}
  });
}
window.addEventListener('pagehide', flushSync);
window.addEventListener('beforeunload', flushSync);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSync(); });

// 页面加载完成后自动探测并拉取
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    checkServerHealth().then(online => {
      if (online) pullFromServer();
    });
  }, 200);
});
/* 切回前台立即复检，避免长时间挂后台后状态停旧 */
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !window.IS_ONLINE) scheduleHealthCheck(600);
});

