/* ============================================================
 * 民爆"最后一公里"监管 · 演示数据层（纯前端，无数据库）
 * localStorage 持久化，可随时重置
 * ============================================================ */

const DB_KEY = 'mb_lastmile_demo_v2';

/* ---------- 品种字典 ---------- */
const GOODS = {
  zy: { name: '炸药',   unit: 'kg', specs: ['2号岩石乳化炸药', '膨化硝铵炸药'], ratio: 1 },
  lg: { name: '雷管',   unit: '发', specs: ['8#工业电雷管', '数码电子雷管'],    ratio: 0.001 },
  db: { name: '导爆索', unit: 'm',  specs: ['普通导爆索'],                       ratio: 0.012 }
};

/* ---------- 分级阈值（R8 / K04，治安管理员可配）---------- */
function settings() {
  if (!DB) DB = {};
  if (!DB.settings) DB.settings = { tierLow: 600, tierHigh: 1200, planAudit: true, warnDeviation: true, warnStay: true };
  return DB.settings;
}
function tierOf(kg) {
  const s = DB ? settings() : { tierLow: 600, tierHigh: 1200 };
  if (kg < s.tierLow)  return { level: '抽查', unit: '辖区民警', cls: 'lv1' };
  if (kg <= s.tierHigh) return { level: '工区警务室到场', unit: '工区警务室', cls: 'lv2' };
  return { level: '治安大队到场', unit: '治安大队', cls: 'lv3' };
}
function planKg(items) {
  return (items || []).reduce((s, it) => s + (it.qty * (GOODS[it.goods] ? GOODS[it.goods].ratio : 1)), 0);
}

/* ---------- 主数据 ---------- */
const MASTER = {
  companies: [
    { id: 'C1', name: '宏泰民爆工程有限公司', addr: '乐山市市中区民爆产业园 8 号', legal: '刘宏', staff: 86, licence: 'PB作许字[2024]08号', licenceExpire: '2028-06-30', status: '生效' },
    { id: 'C2', name: '宏安爆破有限责任公司', addr: '乐山市沙湾区工农路 21 号', legal: '吴安', staff: 52, licence: 'PB作许字[2023]21号', licenceExpire: '2027-03-31', status: '生效' }
  ],
  persons: [
    { id: 'P1',  name: '陈志远', role: '项目负责人', company: 'C1', idno: '510102********0011', remark: '', phone: '138****1201', cert: 'GA-PM-2024-011', certExpire: '2028-01-31', status: '在岗' },
    { id: 'P2',  name: '李建国', role: '安全监理',   company: 'C1', idno: '510102********0012', remark: '', phone: '138****1202', cert: 'GA-JL-2023-052', certExpire: '2027-08-31', status: '在岗' },
    { id: 'P3',  name: '赵铁柱', role: '安全员',     company: 'C1', idno: '510102********0013', remark: '', phone: '138****1203', cert: 'GA-AQ-2024-103', certExpire: '2027-12-31', status: '在岗' },
    { id: 'P4',  name: '钱有德', role: '保管员',     company: 'C1', idno: '510102********0014', remark: '城西销售库负责人', phone: '138****1204', cert: 'GA-BG-2022-077', certExpire: '2026-12-31', status: '在岗' },
    { id: 'P5',  name: '孙立冬', role: '押运员',     company: 'C1', idno: '510102********0015', remark: '', phone: '138****1205', cert: 'GA-YY-2024-066', certExpire: '2028-04-30', status: '在岗' },
    { id: 'P6',  name: '周大河', role: '爆破员',     company: 'C1', idno: '510102********0016', remark: '', phone: '138****1206', cert: 'GA-BP-2023-019', certExpire: '2027-06-30', status: '在岗' },
    { id: 'P7',  name: '张 明', role: '测量技术员', company: 'C1', idno: '510102********0017', remark: '负责各作业点测量与计划填报', phone: '138****1207', cert: 'GA-CS-2025-014', certExpire: '2029-03-31', status: '在岗' },
    { id: 'P8',  name: '郑 安', role: '安全监管',   company: 'C1', idno: '510102********0018', remark: '青龙山工区安全监管', phone: '138****1208', cert: 'GA-AQ-2025-141', certExpire: '2028-09-30', status: '在岗' },
    { id: 'P9',  name: '吴秀英', role: '保管员',     company: 'C1', idno: '510102********0019', remark: '城西销售库复核保管员', phone: '138****1209', cert: 'GA-BG-2023-031', certExpire: '2027-09-30', status: '在岗' },
    { id: 'POL1', name: '王卫民', role: '民警',     company: '城关派出所', phone: '139****3301', cert: 'GA-ZA-2022-018', certExpire: '2029-12-31', status: '在岗' },
    { id: 'POL2', name: '刘 峰', role: '民警',     company: '工区警务室', phone: '139****3302', cert: 'GA-ZA-2022-018', certExpire: '2029-12-31', status: '在岗' },
    { id: 'POL3', name: '高志强', role: '民警',     company: '治安大队',   phone: '139****3303', cert: 'GA-ZA-2022-018', certExpire: '2029-12-31', status: '在岗' },
    { id: 'ADM1', name: '马国平', role: '治安管理员', company: '支队',    phone: '139****3304', cert: 'GA-ZA-2022-018', certExpire: '2029-12-31', status: '在岗' }
  ],
  storages: [
    { id: 'S1', name: '城西销售库', type: '销售库', company: 'C1', addr: '市中区城西路 66 号', builtAt: '2015-06-18', area: 3200, dailyUse: 900, keepers: ['P4', 'P9'], fence: 200,
      stock: { zy: { '2号岩石乳化炸药': 2400, '膨化硝铵炸药': 800 }, lg: { '8#工业电雷管': 20000, '数码电子雷管': 6000 }, db: { '普通导爆索': 12000 } },
      safe: { zy: 500, lg: 5000, db: 2000 } },
    { id: 'S2', name: '青龙山使用库', type: '使用库', company: 'C1', addr: '青龙山工区 2 号便道旁', builtAt: '2024-11-02', area: 450, dailyUse: 260, keepers: ['P3'], fence: 150,
      stock: { zy: { '2号岩石乳化炸药': 60 }, lg: { '8#工业电雷管': 400 }, db: {} }, safe: {} }
  ],
  vehicles: [
    { id: 'V1', plate: '川L·10295', model: '厢式危险品运输车', load: 2000, company: 'C1', transLicence: '川交运许[2024]0118号', transGoods: '炸药、雷管', annualExpire: '2026-12-31', remark: '', status: '在用' },
    { id: 'V2', plate: '川L·20847', model: '厢式危险品运输车', load: 1500, company: 'C1', transLicence: '川交运许[2024]0119号', transGoods: '炸药、雷管', annualExpire: '2027-05-31', remark: '', status: '在用' },
    { id: 'V3', plate: '川L·33201', model: '小型危险品运输车', load: 600, company: 'C1', transLicence: '川交运许[2025]0043号', transGoods: '雷管', annualExpire: '2026-11-30', remark: '零星雷管配送用', status: '在用' }
  ],
  drivers: [
    { id: 'D1', name: '王 强', cert: '从业资格证 JZ-3301', phone: '139****5678', status: '在岗' },
    { id: 'D2', name: '何 刚', cert: '从业资格证 JZ-3312', phone: '139****5679', status: '在岗' }
  ],
  workareas: [
    { id: 'WA1', name: '青龙山工区', police: 'POL2', unit: '工区警务室', scope: '青龙山隧道群 K3+200 ~ K5+800' },
    { id: 'WA2', name: '龙泉工区', police: 'POL1', unit: '城关派出所', scope: '龙泉矿区 B 区及周边 5km' }
  ],
  projects: [
    { id: 'PR1', name: '青龙山隧道爆破项目', company: 'C1', workarea: 'WA1', area: '青龙山工区 K3+200 ~ K5+800', type: '隧道开挖', valid: '2026-03-01 ~ 2027-02-28' },
    { id: 'PR2', name: '龙泉矿山台阶爆破项目', company: 'C2', workarea: 'WA2', area: '龙泉矿区 B 区', type: '露天台阶', valid: '2026-06-01 ~ 2027-05-31' }
  ],
  sites: [
    { id: 'Z1', name: '青龙山隧道进口作业点', project: 'PR1', fence: 300, hist: 12 },
    { id: 'Z2', name: '青龙山隧道出口作业点', project: 'PR1', fence: 300, hist: 8 },
    { id: 'Z3', name: '龙泉矿区 B2 台阶作业点', project: 'PR2', fence: 500, hist: 21 }
  ],
  routes: [
    { id: 'R1', name: '城西销售库 → 青龙山隧道群', from: 'S1', to: 'Z1', via: 'G318 国道 → 青龙山专线', km: 42,
      checkPoints: ['青龙山专线入口', '隧道施工便道口'], status: '启用' },
    { id: 'R2', name: '城西销售库 → 龙泉矿区', from: 'S1', to: 'Z3', via: 'G318 国道 → 龙泉矿区专用道', km: 68,
      checkPoints: ['龙泉矿区大门', '矿区 3 号岔路口'], status: '启用' },
    { id: 'R3', name: '青龙山使用库 → 青龙山隧道出口', from: 'S2', to: 'Z2', via: '青龙山施工便道', km: 9,
      checkPoints: ['隧道施工便道口'], status: '启用' }
  ]
};

/* ---------- 工具 ---------- */
const pad = n => String(n).padStart(2, '0');
function fmtTime(t) {
  if (!t) return '-';
  const d = new Date(t);
  return `${d.getMonth() + 1}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fmtFull(t) {
  if (!t) return '-';
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function minutesAgo(ts) { return Math.floor((Date.now() - ts) / 60000); }
function timeAgo(t) {
  const m = minutesAgo(t);
  if (m < 1) return '刚刚';
  if (m < 60) return m + ' 分钟前';
  if (m < 1440) return Math.floor(m / 60) + ' 小时前';
  return Math.floor(m / 1440) + ' 天前';
}
const H = 3600000, MIN = 60000;

/* ---------- 种子业务数据（相对当前时间生成）---------- */
function seedDB() {
  const now = Date.now();
  const tm = new Date(now + 24 * H);
  const tmStart = new Date(tm.getFullYear(), tm.getMonth(), tm.getDate(), 10, 0).getTime();
  const tmEnd = tmStart + 3 * H;

  const planA = {
    id: 'PL1', planNo: 'BBJH20261101001', project: 'PR1', workarea: 'WA1', site: 'Z1',
    planStart: now - 44 * H, planEnd: now - 41 * H,
    items: [
      { goods: 'zy', spec: '2号岩石乳化炸药', qty: 320 },
      { goods: 'lg', spec: '8#工业电雷管', qty: 400 }
    ],
    officer: 'P3', supervisor: 'P2', applicant: 'P1',
    createdAt: now - 51 * H, status: '已完成',
    auditStatus: '通过', auditBy: 'POL1', auditTime: now - 50 * H,
    outTime: now - 43 * H, departTime: now - 42.5 * H, arriveTime: now - 42 * H,
    blastTime: now - 40.5 * H, returnConfirmTime: now - 38 * H, verifyTime: now - 35 * H,
    tier: '抽查', exceptionFlag: false
  };
  const outA = {
    id: 'OB1', outNo: 'BBCK20261101001', plan: 'PL1', storage: 'S1', keeper: 'P4',
    items: [
      { goods: 'zy', spec: '2号岩石乳化炸药', qty: 320, batch: 'ZY-2026-B120' },
      { goods: 'lg', spec: '8#工业电雷管', qty: 400, batch: 'LG-2026-D087' }
    ],
    outTime: now - 43 * H, status: '已到达', signed: true, signTime: now - 43 * H,
    signs: [{ by: 'P4', time: now - 43 * H }, { by: 'P9', time: now - 43 * H }]
  };
  const trA = {
    id: 'TR1', no: 'BBYS20261101001', outbound: 'OB1', direction: 'GO', plan: 'PL1',
    escort: 'P5', driver: 'D1', vehicle: 'V1',
    route: { from: '城西销售库', to: '青龙山隧道进口作业点', via: 'G318 国道 → 青龙山专线' },
    cps: [
      { name: '青龙山专线入口', time: now - 42.3 * H, geo: 'N30.0212 E103.8534', photos: 1 },
      { name: '隧道施工便道口', time: now - 42.1 * H, geo: 'N30.0245 E103.8601', photos: 1 }
    ],
    departTime: now - 42.5 * H, arriveTime: now - 42 * H, status: '已到达',
    progress: 100, tracks: 6, suggestArrive: now - 42 * H, suggestSource: 'GEOFENCE'
  };
  const rcA = {
    id: 'RC1', transport: 'TR1', plan: 'PL1', receiver: 'P3',
    arriveTime: now - 42 * H, arriveSource: 'GEOFENCE', toStorage: null,
    items: [
      { goods: 'zy', spec: '2号岩石乳化炸药', sent: 320, got: 320, diff: 0 },
      { goods: 'lg', spec: '8#工业电雷管', sent: 400, got: 400, diff: 0 }
    ],
    diffFlag: false, photos: 3, sign: true, time: now - 42 * H
  };
  const blA = {
    id: 'BL1', plan: 'PL1', blastTime: now - 40.5 * H, method: '毫秒延时爆破', effect: '良好，块度均匀',
    used: [
      { goods: 'zy', spec: '2号岩石乳化炸药', qty: 268 },
      { goods: 'lg', spec: '8#工业电雷管', qty: 400 }
    ],
    loss: [{ goods: 'zy', spec: '2号岩石乳化炸药', qty: 2 }],
    result: 'NORMAL_RETURN', blind: false, submitTime: now - 40 * H, supervisor: 'P2'
  };
  const rtA = {
    id: 'RT1', retNo: 'BBTK20261101001', outbound: 'OB1', plan: 'PL1',
    items: [{ goods: 'zy', spec: '2号岩石乳化炸药', qty: 50, batch: 'ZY-2026-B120' }],
    status: '已入库', keeper: 'P4', keeperConfirmTime: now - 38 * H,
    transport: {
      id: 'TR2', no: 'BBYS20261101002', direction: 'RETURN', plan: 'PL1',
      escort: 'P5', driver: 'D1', vehicle: 'V1',
      route: { from: '青龙山隧道进口作业点', to: '城西销售库', via: '青龙山专线 → G318 国道' },
      departTime: now - 39 * H, arriveTime: now - 38.2 * H, status: '已到达', progress: 100, tracks: 5
    },
    submitTime: now - 40 * H, supervisor: 'P2'
  };
  const vfA = {
    id: 'VF1', plan: 'PL1', police: 'POL1', time: now - 35 * H, conclusion: '通过',
    items: { cert: true, cordon: true, onduty: true, camera: true, ledger: true }, remark: '六节点齐全，四量平衡，证据完整。'
  };

  const planB = {
    id: 'PL2', planNo: 'BBJH20261103001', project: 'PR1', workarea: 'WA1', site: 'Z2',
    planStart: now + 8 * H, planEnd: now + 11 * H,
    items: [
      { goods: 'zy', spec: '2号岩石乳化炸药', qty: 480 },
      { goods: 'lg', spec: '8#工业电雷管', qty: 600 },
      { goods: 'db', spec: '普通导爆索', qty: 800 }
    ],
    officer: 'P3', supervisor: 'P2', applicant: 'P1',
    createdAt: now - 1.2 * H, status: '待审核',
    auditStatus: '待审核', tier: '抽查', exceptionFlag: false,
    remark: 'K4+020 段全断面开挖，请予审核。'
  };

  const planC = {
    id: 'PL3', planNo: 'BBJH20261103002', project: 'PR2', workarea: 'WA2', site: 'Z3',
    planStart: now + 2 * H, planEnd: now + 5 * H,
    items: [
      { goods: 'zy', spec: '膨化硝铵炸药', qty: 900 },
      { goods: 'lg', spec: '8#工业电雷管', qty: 1200 }
    ],
    officer: 'P3', supervisor: 'P2', applicant: 'P1',
    createdAt: now - 9 * H, status: '运输中',
    auditStatus: '通过', auditBy: 'POL1', auditTime: now - 8.5 * H,
    outTime: now - 1.5 * H, departTime: now - 40 * MIN,
    tier: '工区警务室到场', exceptionFlag: false
  };
  const outC = {
    id: 'OB2', outNo: 'BBCK20261103001', plan: 'PL3', storage: 'S1', keeper: 'P4',
    items: [
      { goods: 'zy', spec: '膨化硝铵炸药', qty: 900, batch: 'ZY-2026-B208' },
      { goods: 'lg', spec: '8#工业电雷管', qty: 1200, batch: 'LG-2026-D092' }
    ],
    outTime: now - 1.5 * H, status: '运输中', signed: true, signTime: now - 1.4 * H,
    signs: [{ by: 'P4', time: now - 1.5 * H }, { by: 'P9', time: now - 1.45 * H }]
  };
  const trC = {
    id: 'TR3', no: 'BBYS20261103001', outbound: 'OB2', direction: 'GO', plan: 'PL3',
    escort: 'P5', driver: 'D2', vehicle: 'V2',
    route: { from: '城西销售库', to: '龙泉矿区 B2 台阶作业点', via: 'G318 国道 → 龙泉矿区道路' },
    cps: [
      { name: '龙泉矿区检查站', time: null, geo: null, photos: 0 },
      { name: '矿区 B 区岔路口', time: null, geo: null, photos: 0 }
    ],
    departTime: now - 40 * MIN, status: '运输中', progress: 35, tracks: 4,
    suggestArrive: null, suggestSource: null, arriveTime: null
  };
  const chkC = {
    id: 'CK1', no: 'GAJC20261103001', bizType: '运输', bizId: 'PL3', plan: 'PL3',
    level: '工区警务室到场', arriveUnit: '工区警务室', handler: null, bizNo: 'BBJH20261103002',
    template: ['运输路线一致性', '人车证相符', '货箱封识完好', '停靠点合规'],
    items: null, photos: 0, result: null, status: '待到场', sign: null, time: now - 30 * MIN,
    auto: true
  };

  const planD = {
    id: 'PL4', planNo: 'BBJH20261104001', project: 'PR1', workarea: 'WA1', site: 'Z1',
    planStart: tmStart, planEnd: tmEnd,
    items: [
      { goods: 'zy', spec: '2号岩石乳化炸药', qty: 260 },
      { goods: 'lg', spec: '数码电子雷管', qty: 300 }
    ],
    officer: 'P3', supervisor: 'P2', applicant: 'P7', surveyor: 'P7',
    createdAt: now - 30 * MIN, status: '待监管签字', auditStatus: '',
    tier: '抽查', exceptionFlag: false,
    remark: '测量技术员现场测得 K3+500 段断面成型，按设计轮廓填报。'
  };

  const planE = {
    id: 'PL5', planNo: 'BBJH20261104002', project: 'PR1', workarea: 'WA1', site: 'Z1',
    planStart: now + 8 * H, planEnd: now + 10 * H,
    items: [
      { goods: 'zy', spec: '2号岩石乳化炸药', qty: 200 },
      { goods: 'lg', spec: '8#工业电雷管', qty: 200 }
    ],
    officer: 'P3', supervisor: 'P2', applicant: 'P1',
    createdAt: now - 2 * H, status: '待出库', auditStatus: '通过', auditBy: 'POL1', auditTime: now - 1.8 * H,
    tier: '抽查', exceptionFlag: false,
    remark: 'K3+300 段周边孔光面爆破，用量较小。'
  };

  return {
    v: 2, role: 'entry', policeId: 'POL2',
    plans: [planA, planB, planC, planD, planE],
    outbounds: [outA, outC],
    transports: [trA, trC],
    receives: [rcA],
    blastings: [blA],
    returns: [rtA],
    verifies: [vfA],
    checks: [chkC],
    exceptions: [],
    messages: [
      { id: 'M1', to: '项目负责人', text: '计划 BBJH20261103001 已提交，等待民警审核。', time: now - 1.2 * H },
      { id: 'M2', to: '民警', area: 'WA1', text: '【青龙山工区】新计划待审核：BBJH20261103001（青龙山隧道出口作业点，480kg）。', time: now - 1.2 * H },
      { id: 'M3', to: '民警', area: 'WA1', text: '【青龙山工区】计划 BBJH20261103002 作业量 901kg，已自动生成"工区警务室到场"检查任务。', time: now - 8.5 * H },
      { id: 'M4', to: '押运员', text: '出库单 BBCK20261103001 待签收。', time: now - 1.5 * H },
      { id: 'M5', to: '测量技术员', text: '请填报明日作业计划（当日 24:00 前完成提交）。', time: now - 2 * H },
      { id: 'M6', to: '安全监管', text: '计划 BBJH20261104001（青龙山隧道进口作业点）待安全监管签字。', time: now - 30 * MIN },
      { id: 'M7', to: '库管员', text: '计划 BBJH20261104002 审核通过，可办理出库（可与同方向计划合并一车）。', time: now - 1.8 * H }
    ],
    seq: { plan: 6, out: 3, tr: 4, rt: 2, ck: 2, m: 8, ex: 1, lg: 1, dh: 1 }
  };
}

/* ---------- 存取 ---------- */
let DB = null;
/* 库存快照随 DB 一起持久化，避免刷新后单据与存量不一致 */
const STOCK0 = JSON.parse(JSON.stringify(MASTER.storages.map(s => ({ id: s.id, stock: s.stock }))));
const MASTER0 = JSON.parse(JSON.stringify(MASTER));
const snapshotStock = () => { const o = {}; MASTER.storages.forEach(s => o[s.id] = s.stock); return o; };
const applyStock = map => { MASTER.storages.forEach(s => { if (map && map[s.id]) s.stock = map[s.id]; }); };
function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      DB = JSON.parse(raw);
      if (DB._master) Object.assign(MASTER, DB._master);
      if (DB._stock) applyStock(DB._stock);
      delete DB._master;
      return;
    }
  } catch (e) { /* ignore */ }
  DB = seedDB(); saveDB();
}
function saveDB() { DB._stock = snapshotStock(); DB._master = JSON.parse(JSON.stringify(MASTER)); try { localStorage.setItem(DB_KEY, JSON.stringify(DB)); } catch (e) {} }
function resetDB() { Object.assign(MASTER, JSON.parse(JSON.stringify(MASTER0))); DB = seedDB(); applyStock(JSON.parse(JSON.stringify(STOCK0))); saveDB(); }

/* ---------- 主数据审核（J09，治安管理员）---------- */
function masterAuditList() {
  if (!DB.masterAudit) DB.masterAudit = [
    { id: 'MA1', kind: '人员', name: '秦 岭', detail: '爆破员 · 宏泰民爆工程有限公司', cert: 'GA-BP-2026-108', expire: '2029-06-30', status: '待审核' },
    { id: 'MA2', kind: '车辆', name: '川L·51888', detail: '厢式危险品运输车 · 宏安爆破有限责任公司', cert: '行驶证年检', expire: '2027-06-30', status: '待审核' }
  ];
  return DB.masterAudit;
}
function auditMaster(id, pass) {
  const rec = masterAuditList().find(m => m.id === id);
  if (!rec) return;
  if (pass) {
    rec.status = '已生效'; rec.auditTime = Date.now();
    toast('主数据已审核生效，作业节点可引用', true);
  } else {
    DB.masterAudit = DB.masterAudit.filter(m => m.id !== id);
    toast('已驳回，录入单位可修改后重新提交', true);
  }
  saveDB();
  nav.render();
}

/* ---------- 治安管理员：基础数据维护（新增/修正/停用，全程留痕）---------- */
function masterLogList() {
  if (!DB.masterLog) DB.masterLog = [
    { id: 'ML0', time: now0(), type: '车辆', name: '川L·33201', action: '新增（自录）' }
  ];
  return DB.masterLog;
}
function now0() { return Date.now(); }
function pushMasterLog(type, name, action) {
  masterLogList().unshift({ id: 'ML' + Date.now().toString(36).toUpperCase(), time: Date.now(), type, name, action });
  if (masterLogList().length > 50) DB.masterLog.length = 50;
}
function masterUpsert(type, rec) {
  const arr = MASTER[type];
  const isNew = !rec.id;
  if (isNew) {
    rec.id = type[0].toUpperCase() + Date.now().toString(36).toUpperCase();
    arr.push(rec);
    pushMasterLog(typeName(type), rec.name || rec.plate || '-', '新增（治安大队维护）');
  } else {
    const old = arr.find(x => x.id === rec.id);
    Object.assign(old, rec);
    pushMasterLog(typeName(type), old.name || old.plate || '-', '信息修正');
  }
  saveDB();
  return rec;
}
function masterToggle(type, id) {
  const ST = { companies: ['生效', '停用'], sites: ['生效', '停用'], storages: ['生效', '停用'],
    persons: ['在岗', '停用'], projects: ['生效', '停用'], routes: ['启用', '停用'], vehicles: ['在用', '停用'] };
  const rec = MASTER[type].find(x => x.id === id);
  if (!rec) return null;
  const [on, off] = ST[type] || ['生效', '停用'];
  rec.status = rec.status === off ? on : off;
  pushMasterLog(typeName(type), rec.name || rec.plate || '-', rec.status === on ? '恢复' : '停用');
  saveDB();
  return rec;
}
function typeName(type) {
  return { companies: '民爆公司', sites: '民爆点位', storages: '库房', persons: '四大员',
    projects: '项目备案', routes: '路线', vehicles: '车辆' }[type] || type;
}
const routeById = id => byId(MASTER.routes, id);
const routeEnabled = (fromId, toId) => MASTER.routes.filter(r => r.status === '启用' && (!fromId || r.from === fromId) && (!toId || r.to === toId));

/* ---------- 查询助手 ---------- */
const byId = (arr, id) => arr.find(x => x.id === id) || null;
const planById = id => byId(DB.plans, id);
/* 合并出库单：plans 为按作业点拆分的分组（[{plan, site, items}]），兼容旧单计划结构 */
const outGroups = o => o.plans || [{ plan: o.plan, items: o.items }];
const outKg = o => outGroups(o).reduce((s, g) => s + planKg(g.items), 0);
const outboundByPlan = pid => DB.outbounds.find(o => o.plan === pid || (o.plans || []).some(g => g.plan === pid)) || null;
const outboundById = id => byId(DB.outbounds, id);
const transportById = id => byId(DB.transports, id);
const transportByPlan = (pid, dir) => DB.transports.find(t => t.direction === dir && (t.plan === pid || (t.plans || []).includes(pid))) || null;
const receiveByPlan = pid => DB.receives.find(r => r.plan === pid) || null;
const blastingByPlan = pid => DB.blastings.find(b => b.plan === pid) || null;
const returnByPlan = pid => DB.returns.find(r => r.plan === pid) || null;
const verifyByPlan = pid => DB.verifies.find(v => v.plan === pid) || null;
const person = id => byId(MASTER.persons, id) || { name: id };
const storage = id => byId(MASTER.storages, id) || { name: id };
const vehicle = id => byId(MASTER.vehicles, id) || { plate: id };
const driver = id => byId(MASTER.drivers, id) || { name: id };
const project = id => byId(MASTER.projects, id) || { name: id };
const company = id => byId(MASTER.companies, id) || { name: id };
const site = id => byId(MASTER.sites, id) || { name: id };
const goodsName = g => GOODS[g] ? GOODS[g].name : g;
/* ---------- 工区与责任民警 ---------- */
const workarea = id => byId(MASTER.workareas, id) || { id: id || '-', name: '未划分工区', unit: '-', police: null };
const curPoliceId = () => DB.policeId || 'POL2';
const curPolice = () => person(curPoliceId());
const curArea = () => MASTER.workareas.find(w => w.police === curPoliceId()) || MASTER.workareas[0];
const planArea = p => workarea(p.workarea || (project(p.project) || {}).workarea);
const areaPlans = () => DB.plans.filter(p => planArea(p).id === curArea().id);
const planInMyArea = p => !!p && planArea(p).id === curArea().id;
const isMyAreaMsg = m => !m.area || m.area === curArea().id;

/* ---------- 单号 ---------- */
function nextNo(prefix, key) {
  const d = new Date();
  const day = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  DB.seq[key] = (DB.seq[key] || 1);
  const no = `${prefix}${day}${String(DB.seq[key]).padStart(3, '0')}`;
  DB.seq[key]++;
  return no;
}
function nextId(key) { DB.seq[key] = (DB.seq[key] || 1); return DB.seq[key]++; }

/* ---------- 消息 ---------- */
function pushMsg(to, text, area) {
  DB.messages.unshift({ id: 'M' + (DB.seq.m++), to, text, time: Date.now(), area: area || null });
}

/* ---------- 流程日志（F5：每环节留痕，可按模板导出台账）---------- */
const NODE_LABEL = { '计划': '计划上报', '出库': '出库', '运输': '押运运输', '到场': '到场接收', '爆破': '爆破作业', '退库': '退库/销毁', '核验': '民警核验', '检查': '公安检查' };
function addLog(plan, node, action, who) {
  if (!DB.logs) DB.logs = [];
  DB.logs.unshift({ id: 'LG' + nextId('lg'), plan: plan ? plan.id : null, planNo: plan ? plan.planNo : '-', node, action, who: who || '系统', time: Date.now() });
}
function planLogs(planId) { if (!DB.logs) DB.logs = []; return DB.logs.filter(l => l.plan === planId); }

/* ---------- 状态推进（对应状态机 §3.2）---------- */
function submitPlanAudit(plan) {
  plan.status = '待审核'; plan.auditStatus = '待审核';
  const wa = workarea(plan.auditArea || plan.workarea), pol = person(wa.police);
  plan.auditPolice = wa.police;
  pushMsg('民警', `【${wa.name}】新计划待审核：${plan.planNo}（${site(plan.site).name}，${Math.round(planKg(plan.items))}kg），责任民警 ${pol.name}。`, wa.id);
  addLog(plan, '计划', `审核提交（出库库房 ${storage(plan.outStorage || 'S1').name} · 公安责任区 ${wa.name}）`, person(plan.applicant).name);
}
function auditPlan(plan, pass, remark, police) {
  plan.auditStatus = pass ? '通过' : '驳回'; plan.auditBy = police; plan.auditTime = Date.now(); plan.auditRemark = remark || '';
  addLog(plan, '计划', pass ? '民警审核通过' : `民警驳回：${remark || '无意见'}`, person(police).name);
  if (pass) { plan.status = '待出库'; pushMsg('库管员', `计划 ${plan.planNo} 审核通过，可办理出库。`); pushMsg('项目负责人', `计划 ${plan.planNo} 已审核通过。`); }
  else { plan.status = '已驳回'; pushMsg('测量技术员', `计划 ${plan.planNo} 被民警驳回：${remark}。请修改后重新上报。`); }
}
/* 出库两步签（双人双锁）：登记库管员签名 → 第二位库管员复核签名 → 生效扣库存
   groups = [{plan, site, items}]：一单多点（同一趟押运可覆盖多个作业点），单点时仅一个分组 */
function createOutbound(groups, keeperId) {
  const out = {
    id: 'OB' + nextId('out'), outNo: nextNo('BBCK', 'out'), plan: groups[0].plan, storage: 'S1', keeper: keeperId,
    plans: groups, items: groups.reduce((a, g) => a.concat(g.items), []),
    outTime: Date.now(), status: '待复核', signed: false,
    signs: [{ by: keeperId, time: Date.now() }]
  };
  DB.outbounds.push(out);
  pushMsg('库管员', `出库单 ${out.outNo} 已登记（${groups.length > 1 ? groups.length + ' 个作业点合并 · ' : ''}合计 ${Math.round(planKg(out.items))}kg），待第二位库管员复核签名后生效。`);
  groups.forEach(g => addLog(planById(g.plan), '出库', `出库登记 ${out.outNo}（${groups.length > 1 ? '多点合并 · ' : ''}登记库管员 ${person(keeperId).name} 已签名），待复核`, person(keeperId).name));
  return out;
}
function confirmOutbound(out, keeperId) {
  out.signs.push({ by: keeperId, time: Date.now() });
  out.status = '待签收'; out.effTime = Date.now();
  // 复核生效后行锁扣减库存（销售库 S1）
  const st = MASTER.storages.find(s => s.id === 'S1');
  out.items.forEach(it => { st.stock[it.goods][it.spec] -= it.qty; });
  outGroups(out).forEach(g => { const pl = planById(g.plan); pl.status = '待运输'; pl.outTime = out.effTime; });
  pushMsg('押运员', `出库单 ${out.outNo} 双人签名生效（${outGroups(out).length} 个卸货点 · ${Math.round(planKg(out.items))}kg），请扫码签收。`);
  outGroups(out).forEach(g => addLog(planById(g.plan), '出库', `复核库管员 ${person(keeperId).name} 签名确认，出库单生效（双人双锁），库存已扣减`, person(keeperId).name));
  return out;
}
function signTransport(out, escortId, driverId, vehicleId, via, cps, order) {
  const groups = outGroups(out);
  const seq = (order && order.length) ? order : groups.map(g => g.plan);
  const stops = seq.map(pid => { const g = groups.find(x => x.plan === pid); return { plan: pid, site: g.site, arriveTime: null, done: false }; });
  const tr = {
    id: 'TR' + nextId('tr'), no: nextNo('BBYS', 'tr'), outbound: out.id, direction: 'GO', plan: stops[0].plan,
    plans: stops.map(s => s.plan), stops,
    escort: escortId, driver: driverId, vehicle: vehicleId,
    route: { from: storage(out.storage).name, to: stops.map(s => site(s.site).name).join(' → '), via },
    cps: (cps || []).map(n => ({ name: n, time: null, geo: null, photos: 0 })),
    departTime: null, arriveTime: null, status: '待发车', progress: 0, tracks: 0, suggestArrive: null, suggestSource: null
  };
  DB.transports.push(tr);
  out.status = '已签收'; out.signed = true; out.signTime = Date.now();
  stops.forEach(s => { planById(s.plan).status = '待发车'; });
  addLog(planById(stops[0].plan), '运输', `押运扫码签收 ${tr.no}（${stops.length > 1 ? stops.length + ' 个卸货点 · ' : ''}人车绑定，设 ${tr.cps.length} 个沿途打卡点）`, person(escortId).name);
  if (stops.length > 1) addLog(planById(stops[0].plan), '运输', `卸货顺序确认：${stops.map(s => site(s.site).name).join(' → ')}（押运员可调整，调整留痕）`, person(escortId).name);
  return tr;
}
function departTransport(tr) {
  tr.departTime = Date.now(); tr.status = '运输中'; tr.tracks = 1;
  const pids = tr.plans || [tr.plan];
  pids.forEach(pid => { const pl = planById(pid); pl.status = '运输中'; pl.departTime = tr.departTime; });
  addLog(planById(tr.plan), '运输', '发车打点（服务端时间+定位双写）', person(tr.escort).name);
}
/* 多点押运：到达某一卸货点（进入围栏），该点计划转入待接收 */
function arriveStop(tr, idx) {
  const st = tr.stops[idx];
  st.arriveTime = Date.now(); st.suggestArrive = Date.now(); st.suggestSource = 'GEOFENCE';
  const pl = planById(st.plan);
  pl.status = '待接收'; pl.arriveTime = st.arriveTime;
  const doneN = tr.stops.filter(s => s.done).length;
  tr.progress = Math.round(doneN / tr.stops.length * 100);
  pushMsg('安全员', `运输单 ${tr.no} 已到达「${site(st.site).name}」围栏，请确认接收（仅核本点明细）。`);
  addLog(pl, '运输', `到达卸货点「${site(st.site).name}」（第 ${idx + 1}/${tr.stops.length} 站），生成建议到达时间`, person(tr.escort).name);
}
function cpCheckIn(tr, idx, photos) {
  const cp = tr.cps[idx];
  cp.time = Date.now();
  cp.geo = `N30.02${String(10 + idx)}, E103.85${String(20 + idx)}`;
  cp.photos = photos;
  const plan = planById(tr.plan);
  addLog(plan, '运输', `沿途打卡「${cp.name}」：扫码通过 · 定位 ${cp.geo} · 照片 ${photos} 张`, person(tr.escort).name);
  return cp;
}
function receiveConfirm(tr, gotItems, arriveTime, arriveSource, toStorage, photos, diffFlag, receiverId, planId) {
  const pid = planId || tr.plan;
  const plan = planById(pid);
  const out = outboundById(tr.outbound);
  const rc = {
    id: 'RC' + nextId('tr'), transport: tr.id, plan: pid, receiver: receiverId,
    arriveTime, arriveSource, toStorage: toStorage || null,
    items: gotItems, diffFlag, photos, sign: true, time: Date.now()
  };
  DB.receives.push(rc);
  plan.status = '已到场'; plan.arriveTime = arriveTime;
  if (tr.stops) {
    // 多点押运：逐点核量，全部点位完成后整趟才算到达
    const st = tr.stops.find(s => s.plan === pid);
    if (st) { st.done = true; st.arriveTime = arriveTime; }
    const doneN = tr.stops.filter(s => s.done).length;
    tr.progress = Math.round(doneN / tr.stops.length * 100);
    if (doneN >= tr.stops.length) { tr.status = '已到达'; tr.arriveTime = arriveTime; out.status = '已到达'; }
    else { out.status = '部分到达'; }
  } else {
    tr.status = '已到达'; tr.arriveTime = arriveTime; tr.progress = 100;
    out.status = '已到达';
  }
  if (diffFlag) {
    plan.exceptionFlag = true;
    DB.exceptions.push({ id: 'EX' + (DB.seq.ex++), plan: plan.id, type: '数量差异', level: '高', time: Date.now(), status: '待处置', desc: '到场核量与出库数量不符' });
    pushMsg('民警', `作业点 ${site(plan.site).name} 到场核量存在差异，已生成异常单，请核验确认。`);
    pushMsg('库管员', `出库单 ${out.outNo} 到场核量存在差异。`);
  }
  // 归集使用库
  if (toStorage) {
    const st = MASTER.storages.find(s => s.id === toStorage);
    gotItems.forEach(it => { if (!st.stock[it.goods]) st.stock[it.goods] = {}; st.stock[it.goods][it.spec] = (st.stock[it.goods][it.spec] || 0) + it.got; });
  }
  pushMsg('安全监理', `作业点 ${site(plan.site).name} 已到场接收完成，可进行爆破登记。`);
  const remain = tr.stops ? `（第 ${tr.stops.filter(s => s.done).length}/${tr.stops.length} 站${tr.status === '已到达' ? '，整趟完成' : '，押运继续前往下一卸货点'}）` : '';
  addLog(plan, '到场', `核量接收完成${diffFlag ? '（存在差异，已生成异常单）' : '，数量一致'}${remain}`, person(receiverId).name);
  return rc;
}
function submitBlasting(plan, data) {
  const bl = Object.assign({ id: 'BL' + nextId('tr'), plan: plan.id, submitTime: Date.now() }, data);
  DB.blastings.push(bl);
  plan.status = data.result === 'NORMAL_RETURN' ? '待退库' : '待核验';
  plan.blastTime = data.blastTime;
  addLog(plan, '爆破', `爆破登记（${RESULT_LABEL[data.result] || data.result}），监理核验人员：${(data.checkers || []).map(c => person(c).name).join('、') || '-'} · 监理已手签`, person(data.supervisor).name);
  if (data.result === 'ABNORMAL' || data.blind) {
    plan.exceptionFlag = true;
    DB.exceptions.push({ id: 'EX' + (DB.seq.ex++), plan: plan.id, type: data.blind ? '盲炮' : '爆破异常', level: '高', time: Date.now(), status: '待处置', desc: data.remark || '爆破结果异常' });
    pushMsg('民警', `作业点 ${site(plan.site).name} 爆破异常${data.blind ? '（盲炮未处理）' : ''}，请及时核验处置。`);
  }
  return bl;
}
function createReturn(plan, items, supervisorId) {
  const out = outboundByPlan(plan.id);
  const rt = {
    id: 'RT' + nextId('rt'), retNo: nextNo('BBTK', 'rt'), outbound: out.id, plan: plan.id,
    items, status: '待押送', keeper: null, keeperConfirmTime: null, transport: null,
    submitTime: Date.now(), supervisor: supervisorId
  };
  DB.returns.push(rt);
  plan.status = '待退库';
  pushMsg('押运员', `退库单 ${rt.retNo} 已生成，请扫码确认后退库物品反向押送回库。`);
  addLog(plan, '退库', `退库单 ${rt.retNo} 生成（${items.map(i => goodsName(i.goods) + ' ' + i.qty + GOODS[i.goods].unit).join('、')}），原押运路线反向回库`, person(supervisorId).name);
  return rt;
}
/* 销毁：销售库出来未用完的爆炸物两条处置路线之一（另一条为退库） */
function createDestroy(plan, items, reason, photos, supervisorId) {
  if (!DB.destroys) DB.destroys = [];
  const dh = {
    id: 'DH' + nextId('dh'), no: nextNo('BBXH', 'dh'), plan: plan.id,
    items, reason, photos, supervisor: supervisorId, time: Date.now(), status: '已销毁'
  };
  DB.destroys.push(dh);
  plan.status = '待核验';
  pushMsg('民警', `作业点 ${site(plan.site).name} 剩余爆炸物品已登记销毁（${dh.no}），请核验确认销毁记录。`);
  pushMsg('库管员', `销毁单 ${dh.no}：${items.map(i => goodsName(i.goods) + ' ' + i.qty + GOODS[i.goods].unit).join('、')}，台账已记销毁出账。`);
  addLog(plan, '退库', `剩余物品销毁 ${dh.no}（${items.map(i => goodsName(i.goods) + ' ' + i.qty + GOODS[i.goods].unit).join('、')}），原因：${reason}`, person(supervisorId).name);
  return dh;
}
function departReturn(rt, escortId, driverId, vehicleId) {
  const plan = planById(rt.plan);
  const tr = {
    id: 'TR' + nextId('tr'), no: nextNo('BBYS', 'tr'), outbound: rt.outbound, direction: 'RETURN', plan: plan.id, ret: rt.id,
    escort: escortId, driver: driverId, vehicle: vehicleId,
    route: { from: site(plan.site).name, to: '城西销售库', via: '原路返回（青龙山专线 → G318 国道）' },
    departTime: null, arriveTime: null, status: '待发车', progress: 0, tracks: 0
  };
  DB.transports.push(tr);
  rt.transport = tr.id; rt.status = '押送中';
  plan.status = '退库运输中';
  addLog(plan, '退库', `押运员扫码确认退库单 ${rt.retNo}（退库量/驾驶员/押运员核对无误），反向押送发车`, person(escortId).name);
  return tr;
}
function arriveReturn(rt) {
  const tr = transportById(rt.transport);
  tr.status = '已到达'; tr.arriveTime = Date.now(); tr.progress = 100;
  rt.status = '待入库确认';
  pushMsg('库管员', `退库单 ${rt.retNo} 已到库，请按批次核销入库。`);
  addLog(planById(rt.plan), '退库', '退库物品到库，待库管员核销', '系统');
}
function confirmReturn(rt, keeperId) {
  const st = MASTER.storages.find(s => s.id === 'S1');
  rt.items.forEach(it => { if (!st.stock[it.goods]) st.stock[it.goods] = {}; st.stock[it.goods][it.spec] = (st.stock[it.goods][it.spec] || 0) + it.qty; });
  rt.status = '已入库'; rt.keeper = keeperId; rt.keeperConfirmTime = Date.now();
  const plan = planById(rt.plan);
  plan.status = '待核验'; plan.returnConfirmTime = rt.keeperConfirmTime;
  addLog(plan, '退库', `退库核销入库完成，库存回加`, person(keeperId).name);
}
function submitVerify(plan, items, conclusion, remark, policeId) {
  const vf = { id: 'VF' + nextId('tr'), plan: plan.id, police: policeId, time: Date.now(), conclusion, items, remark: remark || '' };
  DB.verifies.push(vf);
  plan.status = conclusion === '通过' ? '已完成' : '责令整改';
  plan.verifyTime = vf.time;
  pushMsg('项目负责人', `计划 ${plan.planNo} 核验结论：${conclusion}。`);
  addLog(plan, '核验', `民警核验结论：${conclusion}`, person(policeId).name);
  return vf;
}
function createCheck(plan, bizType, items, photos, result, remark, policeId) {
  const kg = Math.round(planKg(plan.items));
  const tier = tierOf(kg);
  const ck = {
    id: 'CK' + nextId('ck'), no: nextNo('GAJC', 'ck'), bizType, bizId: plan.id, plan: plan.id, bizNo: plan.planNo,
    level: tier.level, arriveUnit: tier.unit, handler: policeId,
    template: TEMPLATES[bizType] || [], items, photos, result, remark: remark || '',
    status: result ? '已完成' : '检查中', sign: null, time: Date.now(), auto: false
  };
  DB.checks.push(ck);
  return ck;
}
function arriveCheckSign(ck, unit) { ck.sign = { unit, time: Date.now() }; if (ck.status === '待到场' || ck.status === '待执行') ck.status = '检查中'; }

/* ---------- 计划上报三级流（F3：测量技术员→安全监管→项目负责人）---------- */
function supervisorSignPlan(planId) {
  const pl = planById(planId);
  pl.status = '待负责人审核'; pl.regSign = { by: 'P8', time: Date.now() };
  pushMsg('项目负责人', `计划 ${pl.planNo} 已由安全监管 ${person('P8').name} 签字，待您审核提交（选择出库库房与公安责任区）。`);
  addLog(pl, '计划', `作业点安全监管 ${person('P8').name} 手签放行`, person('P8').name);
}

/* ---------- 检查项模板（K02 自定义）---------- */
const TEMPLATES = {
  '计划': ['作业点与批复位置一致', '提前 6 小时填报', '安全员/监理在册', '爆破设计书附件齐全'],
  '出库': ['出库联单齐全', '双人双锁执行', '批次登记与台账一致', '库存扣减准确'],
  '运输': ['运输路线一致性', '人车证相符', '货箱封识完好', '停靠点合规'],
  '到场': ['到达时间与围栏判定相符', '数量核对无差异', '警戒区设置合规', '物品堆码合规'],
  '爆破': ['警戒距离达标', '起爆前清场确认', '盲炮处置规范', '四量平衡'],
  '核验': ['证照齐全', '警戒设置', '人员在岗', '台账一致']
};

/* ---------- 演示统计（I06 / K08 口径，可按工区下钻）---------- */
function stats(areaId) {
  const plans = DB.plans.filter(p => !areaId || planArea(p).id === areaId);
  const ids = {}; plans.forEach(p => { ids[p.id] = 1; });
  const receives = DB.receives.filter(r => ids[r.plan]);
  const returns = DB.returns.filter(r => ids[r.plan]);
  const checks = DB.checks.filter(c => !c.plan || ids[c.plan]);
  const exceptions = DB.exceptions.filter(e => !e.plan || ids[e.plan]);
  const verifies = DB.verifies.filter(v => ids[v.plan]);
  const done = plans.filter(p => p.status === '已完成').length;
  const diffs = receives.filter(r => r.diffFlag).length;
  const closedReturn = returns.filter(r => r.status === '已入库').length;
  const inTransit = plans.filter(p => ['待运输', '待发车', '运输中'].includes(p.status)).length;
  const checksDone = checks.filter(c => c.status === '已完成').length;
  return {
    total: plans.length, done,
    closedRate: plans.length ? Math.round(done / plans.length * 100) : 0,
    verifyRate: plans.length ? Math.round(verifies.length / plans.length * 100) : 0,
    diffRate: receives.length ? Math.round(diffs / receives.length * 100) : 0,
    returnRate: returns.length ? Math.round(closedReturn / returns.length * 100) : 100,
    inTransit, checks: checks.length, checksDone,
    checkRate: checks.length ? Math.round(checksDone / checks.length * 100) : 0,
    exceptions: exceptions.filter(e => e.status !== '已闭环').length,
    avgTransit: 38 // 分钟（演示值：出发→到达均值）
  };
}
