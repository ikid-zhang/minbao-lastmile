const fs = require('fs');
const path = require('path');


// 初始默认种子数据
const DEFAULT_STORE = {
  // 1. 系统配置
  settings: {
    tierLow: 600,
    tierHigh: 1200,
    planAudit: true, // plan_audit_enable
    warnDeviation: true,
    warnStay: true,
    tntRatio: 0.001
  },
  // 2. 主数据
  companies: [
    { id: 'C1', name: '宏泰民爆工程有限公司', addr: '乐山市市中区民爆产业园 8 号', legal: '刘宏', staff: 86, licence: 'PB作许字[2024]08号', licenceExpire: '2028-06-30', status: '生效' },
    { id: 'C2', name: '宏安爆破有限责任公司', addr: '乐山市沙湾区工农路 21 号', legal: '吴安', staff: 52, licence: 'PB作许字[2023]21号', licenceExpire: '2027-03-31', status: '生效' }
  ],
  persons: [
    { id: 'P1',  name: '陈志远', role: '项目负责人', company: 'C1', idno: '510102198501010011', phone: '13800001201', cert: 'GA-PM-2024-011', certExpire: '2028-01-31', status: '在岗', remark: '青龙山隧道群负责人' },
    { id: 'P2',  name: '李建国', role: '安全监理',   company: 'C1', idno: '510102198203050012', phone: '13800001202', cert: 'GA-JL-2023-052', certExpire: '2027-08-31', status: '在岗', remark: '专职安全监理' },
    { id: 'P3',  name: '赵铁柱', role: '安全员',     company: 'C1', storages: ['S2'], idno: '510102198907120013', phone: '13800001203', cert: 'GA-AQ-2024-103', certExpire: '2027-12-31', status: '在岗', remark: '现场安全员' },
    { id: 'P4',  name: '钱有德', role: '保管员',     company: 'C1', storages: ['S1'], idno: '510102197811200014', phone: '13800001204', cert: 'GA-BG-2022-077', certExpire: '2026-12-31', status: '在岗', remark: '城西销售库主登记保管员' },
    { id: 'P5',  name: '孙立冬', role: '押运员',     company: 'C1', idno: '510102199205160015', phone: '13800001205', cert: 'GA-YY-2024-066', certExpire: '2028-04-30', status: '在岗', remark: '危货专职押运员' },
    { id: 'P6',  name: '周大河', role: '爆破员',     company: 'C1', idno: '510102198709230016', phone: '13800001206', cert: 'GA-BP-2023-019', certExpire: '2027-06-30', status: '在岗', remark: '高级爆破工' },
    { id: 'P7',  name: '张明',   role: '测量技术员', company: 'C1', idno: '510102199504180017', phone: '13800001207', cert: 'GA-CS-2025-014', certExpire: '2029-03-31', status: '在岗', remark: '测量与填报' },
    { id: 'P8',  name: '郑安',   role: '安全监管',   company: 'C1', idno: '510102198602280018', phone: '13800001208', cert: 'GA-AQ-2025-141', certExpire: '2028-09-30', status: '在岗', remark: '工区安全把关' },
    { id: 'P9',  name: '吴秀英', role: '保管员',     company: 'C1', storages: ['S1'], idno: '510102198308100019', phone: '13800001209', cert: 'GA-BG-2023-031', certExpire: '2027-09-30', status: '在岗', remark: '城西销售库复核保管员' },
    { id: 'POL1', name: '王卫民', role: '民警',     company: '城关派出所', phone: '13900003301', cert: 'GA-ZA-2022-018', certExpire: '2029-12-31', status: '在岗', remark: '城关辖区' },
    { id: 'POL2', name: '刘峰',   role: '民警',     company: '工区警务室', phone: '13900003302', cert: 'GA-ZA-2022-018', certExpire: '2029-12-31', status: '在岗', remark: '青龙山工区责任民警' },
    { id: 'POL3', name: '高志强', role: '民警',     company: '治安大队',   phone: '13900003303', cert: 'GA-ZA-2022-018', certExpire: '2029-12-31', status: '在岗', remark: '治安大队专管' },
    { id: 'ADM1', name: '马国平', role: '治安管理员', company: '治安支队',   phone: '13900003304', cert: 'GA-ZA-2022-018', certExpire: '2029-12-31', status: '在岗', remark: '全市治安管理员' }
  ],
  storages: [
    {
      id: 'S1', name: '城西销售库', type: '销售库', company: 'C1', addr: '市中区城西路 66 号', builtAt: '2015-06-18', area: 3200, dailyUse: 900,
      keepers: ['P4', 'P9'], fence: 200, staff: 12, supplyUnit: '宏泰民爆工程有限公司（C1）', lng: 103.725890, lat: 29.562340, status: '生效',
      stock: {
        zy: { '2号岩石乳化炸药': 2400, '膨化硝铵炸药': 800 },
        lg: { '8#工业电雷管': 20000, '数码电子雷管': 6000 },
        db: { '普通导爆索': 12000 }
      },
      safe: { zy: 500, lg: 5000, db: 2000 }
    },
    {
      id: 'S2', name: '青龙山使用库', type: '使用库', company: 'C1', addr: '青龙山工区 2 号便道旁', builtAt: '2024-11-02', area: 450, dailyUse: 260,
      keepers: ['P3'], fence: 150, staff: 5, supplyUnit: '宏泰民爆工程有限公司（C1）', lng: 103.812400, lat: 29.610500, status: '生效',
      stock: {
        zy: { '2号岩石乳化炸药': 60 },
        lg: { '8#工业电雷管': 400 },
        db: {}
      },
      safe: { zy: 20, lg: 100, db: 0 }
    }
  ],
  vehicles: [
    { id: 'V1', plate: '川L·10295', model: '厢式危险品运输车', load: 2000, company: 'C1', transLicence: '川交运许[2024]0118号', transGoods: '炸药、雷管', annualExpire: '2026-12-31', status: '在用', remark: '主力运输车' },
    { id: 'V2', plate: '川L·20847', model: '厢式危险品运输车', load: 1500, company: 'C1', transLicence: '川交运许[2024]0119号', transGoods: '炸药、雷管', annualExpire: '2027-05-31', status: '在用', remark: '常备车辆' },
    { id: 'V3', plate: '川L·33201', model: '小型危险品运输车', load: 600, company: 'C1', transLicence: '川交运许[2025]0043号', transGoods: '雷管', annualExpire: '2026-11-30', status: '在用', remark: '小额配送' }
  ],
  drivers: [
    { id: 'D1', name: '王强', idno: '510102198104155678', cert: '从业资格证 JZ-3301', phone: '13900005678', status: '在岗' },
    { id: 'D2', name: '何刚', idno: '510102198509205679', cert: '从业资格证 JZ-3312', phone: '13900005679', status: '在岗' }
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
    { id: 'Z1', name: '青龙山隧道进口作业点', project: 'PR1', lng: 103.821000, lat: 29.615000, fence: 300, hist: 12, status: '启用' },
    { id: 'Z2', name: '青龙山隧道出口作业点', project: 'PR1', lng: 103.835000, lat: 29.621000, fence: 300, hist: 8, status: '启用' },
    { id: 'Z3', name: '龙泉矿区 B2 台阶作业点', project: 'PR2', lng: 103.910000, lat: 29.489000, fence: 500, hist: 21, status: '启用' }
  ],
  routes: [
    {
      id: 'R1', name: '城西销售库 → 青龙山隧道群', from: 'S1', to: 'Z1', via: 'G318 国道 → 青龙山专线', km: 42,
      checkPoints: ['青龙山专线入口', '隧道施工便道口'], status: '启用'
    },
    {
      id: 'R2', name: '城西销售库 → 龙泉矿区', from: 'S1', to: 'Z3', via: 'G318 国道 → 龙泉矿区专用道', km: 68,
      checkPoints: ['龙泉矿区大门', '矿区 3 号岔路口'], status: '启用'
    },
    {
      id: 'R3', name: '青龙山使用库 → 青龙山隧道出口', from: 'S2', to: 'Z2', via: '青龙山施工便道', km: 9,
      checkPoints: ['隧道施工便道口'], status: '启用'
    }
  ],
  // 3. 业务单据集合
  plans: [],
  outbounds: [],
  transports: [],
  receives: [],
  blastings: [],
  destroys: [],
  returns: [],
  verifies: [],
  checks: [],
  rectifies: [],
  // 表单第 9 项：亡人事件
  accidents: [],
  // 4. 留痕日志
  nodeLogs: [],
  masterLogs: []
};

/* ============================================================
 * 存储层（2026-11-11）：SQLite 优先，JSON 文件兜底
 *  - 权威表 t_store_doc（一条记录一行 JSON），loadDB/saveDB 签名不变
 *  - 每次 saveDB 后在同一个事务里把业务数据镜像到 t_bb_* 表，供 SQL 查询
 *  - 启动：node --experimental-sqlite server.js（见 package.json）
 * ============================================================ */
const DATA_DIR = path.join(__dirname, 'data');
const SQLITE_FILE = path.join(DATA_DIR, 'minbao.db');
const JSON_FILE = path.join(DATA_DIR, 'store.json');
const DDL_FILE = path.join(__dirname, '..', 'docs', 'sql', 'schema.sqlite.sql');

let sqlite = null;
try { sqlite = require('node:sqlite'); } catch (e) { sqlite = null; }

const ARRAY_COLLS = [
  'companies','persons','storages','vehicles','drivers','workareas','projects','sites','routes',
  'plans','outbounds','transports','receives','blastings','destroys','returns','verifies','checks','rectifies',
  'accidents','nodeLogs','masterLogs'
];
const OBJECT_COLLS = ['settings'];

let _conn = null;

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

/* 表结构迁移：给已存在的旧表补列（SQLite 不支持 ADD COLUMN IF NOT EXISTS，逐条 try） */
const SCHEMA_PATCHES = [
  ['t_bb_transport', 'expected_arrive_time', 'TEXT'],
  ['t_bb_transport', 'police_id', 'TEXT'],
  ['t_bb_transport', 'remark', 'TEXT'],
  ['t_bb_blasting', 'blast_method', 'TEXT'],
  ['t_bb_blasting', 'weather', 'TEXT'],
  ['t_bb_blasting', 'out_storage_id', 'TEXT'],
  ['t_bb_blasting', 'used_zy_qty', 'REAL'],
  ['t_bb_blasting', 'used_lg_qty', 'REAL'],
  ['t_bb_blasting', 'used_db_qty', 'REAL'],
  ['t_bb_blasting', 'blaster_ids', 'TEXT'],
  ['t_bb_blasting', 'safety_officer_ids', 'TEXT'],
  ['t_bb_blasting', 'remark', 'TEXT']
];

function migrateSchema(conn) {
  for (const [table, col, type] of SCHEMA_PATCHES) {
    try { conn.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`); } catch (e) { /* 列已存在或表未建，忽略 */ }
  }
  /* 视图定义随表单口径变更，先删后由 DDL 重建 */
  for (const v of ['v_bb_storage_form', 'v_bb_blasting_form', 'v_bb_dashboard']) {
    try { conn.exec(`DROP VIEW IF EXISTS ${v}`); } catch (e) { /* 忽略 */ }
  }
  /* 库房档案曾被小程序回推的 {id, stock} 覆盖，这里用内置完整档案补齐缺失字段 */
  try {
    const seeds = (DEFAULT_STORE.storages || []);
    const rows = conn.prepare("SELECT doc_id, payload FROM t_store_doc WHERE coll='storages'").all();
    const put = conn.prepare("INSERT OR REPLACE INTO t_store_doc(coll, doc_id, payload, updated_at) VALUES ('storages', ?, ?, datetime('now'))");
    rows.forEach(r => {
      let cur = {}; try { cur = JSON.parse(r.payload); } catch (e) {}
      if (cur.name) return;
      const seed = seeds.find(s => s.id === cur.id);
      if (seed) {
        put.run(cur.id, JSON.stringify(Object.assign({}, seed, { stock: cur.stock || seed.stock })));
        return;
      }
      /* 新建库房只剩 id + stock：先写占位名称，避免列表出现空行，具体档案在 PC 端补录 */
      cur.name = '待补录库房（' + (cur.id || '') + '）';
      cur.status = cur.status || '生效';
      put.run(cur.id, JSON.stringify(cur));
    });
  } catch (e) { /* 迁移失败不阻断启动 */ }
}

function openConn() {
  if (!sqlite) return null;
  if (_conn) return _conn;
  ensureDir(DATA_DIR);
  _conn = new sqlite.DatabaseSync(SQLITE_FILE);
  _conn.exec('PRAGMA journal_mode = WAL;');
  if (fs.existsSync(DDL_FILE)) {
    migrateSchema(_conn);
    _conn.exec(fs.readFileSync(DDL_FILE, 'utf-8'));
  } else {
    _conn.exec('CREATE TABLE IF NOT EXISTS t_store_doc(coll TEXT, doc_id TEXT, payload TEXT, updated_at TEXT, PRIMARY KEY(coll, doc_id)) WITHOUT ROWID;');
  }
  return _conn;
}

function isSqliteReady() { return !!openConn(); }

/* ---------- 读库：把 t_store_doc 组装回原来的对象结构 ---------- */
function loadDB() {
  const conn = openConn();
  if (!conn) return loadJSON();

  const rows = conn.prepare('SELECT coll, doc_id, payload FROM t_store_doc').all();
  if (rows.length === 0) {
    const seed = readJSONOrSeed();
    saveDB(seed);
    return seed;
  }

  const out = {};
  for (const coll of [...ARRAY_COLLS, ...OBJECT_COLLS]) out[coll] = [];
  out.settings = {};

  for (const r of rows) {
    let val;
    try { val = JSON.parse(r.payload); } catch (e) { continue; }
    if (r.coll === 'settings') { out.settings = val; continue; }
    if (!out[r.coll]) out[r.coll] = [];
    if (Array.isArray(out[r.coll])) out[r.coll].push(val);
  }
  // 补齐 DEFAULT_STORE 里存在但库里还没有的集合，避免业务代码读到 undefined
  for (const k of Object.keys(DEFAULT_STORE)) {
    if (out[k] === undefined) out[k] = JSON.parse(JSON.stringify(DEFAULT_STORE[k]));
  }
  return out;
}

/* ---------- 写库：整体快照 + 业务表镜像（单事务） ---------- */
function saveDB(data) {
  const conn = openConn();
  if (!conn) return saveJSON(data);

  conn.exec('BEGIN IMMEDIATE');
  try {
    conn.exec('DELETE FROM t_store_doc');
    // 同一集合内若出现重复 id（如日志同毫秒生成），用 OR REPLACE 兜住，避免整事务回滚导致服务退出
    const put = conn.prepare('INSERT OR REPLACE INTO t_store_doc(coll, doc_id, payload, updated_at) VALUES (?,?,?,datetime(\'now\'))');

    for (const coll of ARRAY_COLLS) {
      const arr = data[coll];
      if (!Array.isArray(arr)) continue;
      arr.forEach((item, idx) => {
        const id = String(item && (item.id || item.dataId) || idx);
        put.run(coll, id, JSON.stringify(item || {}));
      });
    }
    for (const coll of OBJECT_COLLS) {
      if (data[coll] === undefined) continue;
      put.run(coll, '__' + coll + '__', JSON.stringify(data[coll]));
    }

    syncMirror(conn);
    conn.exec('COMMIT');
  } catch (err) {
    conn.exec('ROLLBACK');
    throw err;
  }

  // 额外落一份 JSON 快照，便于人直接看（不参与读写）
  try { saveJSON(data); } catch (e) {}
}

/* ---------- 业务表镜像：从 JSON 抽出同名列，供 SQL 直接查 ---------- */
const MIRROR_SQL = [
  `DELETE FROM t_bb_plan;
   INSERT INTO t_bb_plan(id,plan_no,project_id,site_id,out_storage_id,workarea_id,plan_start,plan_end,plan_kg,
     surveyor_id,reg_regulator_id,reg_sign_time,applicant_id,submit_time,audit_status,audit_police_id,audit_time,
     audit_remark,status,created_at,payload)
   SELECT json_extract(payload,'$.id'),json_extract(payload,'$.planNo'),
     IFNULL(json_extract(payload,'$.projectId'),json_extract(payload,'$.project')),
     IFNULL(json_extract(payload,'$.siteId'),json_extract(payload,'$.site')),
     IFNULL(json_extract(payload,'$.outStorageId'),json_extract(payload,'$.outStorage')),
     IFNULL(json_extract(payload,'$.workareaId'),json_extract(payload,'$.workarea')),
     CASE WHEN typeof(json_extract(payload,'$.planStart'))='integer' AND json_extract(payload,'$.planStart')>100000000000 THEN datetime(json_extract(payload,'$.planStart')/1000,'unixepoch','localtime') ELSE json_extract(payload,'$.planStart') END,CASE WHEN typeof(json_extract(payload,'$.planEnd'))='integer' AND json_extract(payload,'$.planEnd')>100000000000 THEN datetime(json_extract(payload,'$.planEnd')/1000,'unixepoch','localtime') ELSE json_extract(payload,'$.planEnd') END,json_extract(payload,'$.planKg'),
     IFNULL(json_extract(payload,'$.surveyorId'),json_extract(payload,'$.surveyor')),
     IFNULL(json_extract(payload,'$.regRegulatorId'),json_extract(payload,'$.regulator')),
     json_extract(payload,'$.regSign'),
     IFNULL(json_extract(payload,'$.applicantId'),json_extract(payload,'$.applicant')),
     IFNULL(json_extract(payload,'$.submitTime'),json_extract(payload,'$.submitAt')),
     json_extract(payload,'$.auditStatus'),
     IFNULL(json_extract(payload,'$.auditPoliceId'),json_extract(payload,'$.auditPolice')),
     json_extract(payload,'$.auditTime'),json_extract(payload,'$.auditRemark'),
     json_extract(payload,'$.status'),CASE WHEN typeof(json_extract(payload,'$.createdAt'))='integer' AND json_extract(payload,'$.createdAt')>100000000000 THEN datetime(json_extract(payload,'$.createdAt')/1000,'unixepoch','localtime') ELSE json_extract(payload,'$.createdAt') END,payload
   FROM t_store_doc WHERE coll='plans';`,

  `DELETE FROM t_bb_plan_item;
   INSERT INTO t_bb_plan_item(plan_id,goods_type,spec,unit,plan_qty,payload)
   SELECT json_extract(d.payload,'$.id'),
     IFNULL(json_extract(i.value,'$.goodsType'),json_extract(i.value,'$.goods')),
     json_extract(i.value,'$.spec'),IFNULL(json_extract(i.value,'$.unit'),'kg'),
     IFNULL(json_extract(i.value,'$.planQty'),json_extract(i.value,'$.qty')),i.value
   FROM t_store_doc d, json_each(d.payload,'$.items') i WHERE d.coll='plans';`,

  `DELETE FROM t_bb_outbound;
   INSERT INTO t_bb_outbound(id,out_no,storage_id,total_kg,plans_json,registrant_id,reg_time,reviewer_id,rev_time,status,created_at,payload)
   SELECT json_extract(payload,'$.id'),json_extract(payload,'$.outNo'),
     IFNULL(json_extract(payload,'$.storageId'),json_extract(payload,'$.storage')),
     (SELECT IFNULL(SUM(IFNULL(json_extract(it.value,'$.qty'),0)),0)
        FROM json_each(json_extract(payload,'$.items')) it
        WHERE IFNULL(json_extract(it.value,'$.goods'),'')='zy'),
     json_extract(payload,'$.plans'),
     IFNULL(json_extract(payload,'$.registrantId'),json_extract(payload,'$.keeper')),
     IFNULL(json_extract(payload,'$.regTime'),json_extract(payload,'$.outTime')),
     json_extract(payload,'$.reviewerId'),json_extract(payload,'$.revTime'),
     json_extract(payload,'$.status'),IFNULL(json_extract(payload,'$.createdAt'),json_extract(payload,'$.outTime')),payload
   FROM t_store_doc WHERE coll='outbounds';`,

  `DELETE FROM t_bb_transport;
   INSERT INTO t_bb_transport(id,outbound_id,escort_id,driver_id,vehicle_id,vehicle_load,total_weight,route_id,
     depart_time,expected_arrive_time,police_id,remark,finish_time,status,payload)
   SELECT json_extract(payload,'$.id'),
     IFNULL(json_extract(payload,'$.outboundId'),json_extract(payload,'$.outbound')),
     IFNULL(json_extract(payload,'$.escortId'),json_extract(payload,'$.escort')),
     IFNULL(json_extract(payload,'$.driverId'),json_extract(payload,'$.driver')),
     IFNULL(json_extract(payload,'$.vehicleId'),json_extract(payload,'$.vehicle')),
     json_extract(payload,'$.vehicleLoad'),json_extract(payload,'$.totalWeight'),
     IFNULL(json_extract(payload,'$.routeId'),CASE WHEN json_type(payload,'$.route')='object' THEN IFNULL(json_extract(payload,'$.route.name'),IFNULL(json_extract(payload,'$.route.via'),json_extract(payload,'$.route.to'))) ELSE json_extract(payload,'$.route') END),
     CASE WHEN typeof(json_extract(payload,'$.departTime'))='integer' AND json_extract(payload,'$.departTime')>100000000000 THEN datetime(json_extract(payload,'$.departTime')/1000,'unixepoch','localtime') ELSE json_extract(payload,'$.departTime') END,
     IFNULL(json_extract(payload,'$.expectedArriveTime'),json_extract(payload,'$.suggestArrive')),
     json_extract(payload,'$.policeId'),json_extract(payload,'$.remark'),
     CASE WHEN typeof(IFNULL(json_extract(payload,'$.finishTime'),json_extract(payload,'$.arriveTime')))='integer' AND IFNULL(json_extract(payload,'$.finishTime'),json_extract(payload,'$.arriveTime'))>100000000000 THEN datetime(IFNULL(json_extract(payload,'$.finishTime'),json_extract(payload,'$.arriveTime'))/1000,'unixepoch','localtime') ELSE IFNULL(json_extract(payload,'$.finishTime'),json_extract(payload,'$.arriveTime')) END,
     json_extract(payload,'$.status'),payload
   FROM t_store_doc WHERE coll='transports';`,

  `DELETE FROM t_bb_receive;
   INSERT INTO t_bb_receive(id,transport_id,plan_id,safety_officer_id,arrive_time,diff_flag,payload)
   SELECT json_extract(payload,'$.id'),
     IFNULL(json_extract(payload,'$.transportId'),json_extract(payload,'$.transport')),
     IFNULL(json_extract(payload,'$.planId'),json_extract(payload,'$.plan')),
     IFNULL(json_extract(payload,'$.safetyOfficerId'),json_extract(payload,'$.receiver')),
     json_extract(payload,'$.arriveTime'),IFNULL(json_extract(payload,'$.diffFlag'),0),payload
   FROM t_store_doc WHERE coll='receives';`,

  `DELETE FROM t_bb_blasting;
   INSERT INTO t_bb_blasting(id,plan_id,supervisor_id,blast_time,blast_method,weather,out_storage_id,
     used_zy_qty,used_lg_qty,used_db_qty,blaster_ids,safety_officer_ids,remark,blast_result,payload)
   SELECT json_extract(payload,'$.id'),
     IFNULL(json_extract(payload,'$.planId'),json_extract(payload,'$.plan')),
     IFNULL(json_extract(payload,'$.supervisorId'),json_extract(payload,'$.supervisor')),
     CASE WHEN typeof(IFNULL(json_extract(payload,'$.blastTime'),json_extract(payload,'$.time')))='integer' AND IFNULL(json_extract(payload,'$.blastTime'),json_extract(payload,'$.time'))>100000000000 THEN datetime(IFNULL(json_extract(payload,'$.blastTime'),json_extract(payload,'$.time'))/1000,'unixepoch','localtime') ELSE IFNULL(json_extract(payload,'$.blastTime'),json_extract(payload,'$.time')) END,
     json_extract(payload,'$.blastMethod'),json_extract(payload,'$.weather'),
     IFNULL(json_extract(payload,'$.outStorage'),json_extract(payload,'$.fromStorage')),
     (SELECT IFNULL(SUM(IFNULL(json_extract(u.value,'$.qty'),0)),0) FROM json_each(json_extract(payload,'$.used')) u
        WHERE IFNULL(json_extract(u.value,'$.goods'),'')='zy'),
     (SELECT IFNULL(SUM(IFNULL(json_extract(u.value,'$.qty'),0)),0) FROM json_each(json_extract(payload,'$.used')) u
        WHERE IFNULL(json_extract(u.value,'$.goods'),'')='lg'),
     (SELECT IFNULL(SUM(IFNULL(json_extract(u.value,'$.qty'),0)),0) FROM json_each(json_extract(payload,'$.used')) u
        WHERE IFNULL(json_extract(u.value,'$.goods'),'')='db'),
     json_extract(payload,'$.blasters'),json_extract(payload,'$.safetyOfficers'),
     json_extract(payload,'$.remark'),
     json_extract(payload,'$.status'),payload
   FROM t_store_doc WHERE coll='blastings';`,

  `DELETE FROM t_bb_return;
   INSERT INTO t_bb_return(id,return_no,plan_id,target_storage_id,status,keeper_confirmed,payload)
   SELECT json_extract(payload,'$.id'),
     IFNULL(json_extract(payload,'$.returnNo'),json_extract(payload,'$.retNo')),
     IFNULL(json_extract(payload,'$.planId'),json_extract(payload,'$.plan')),
     IFNULL(json_extract(payload,'$.targetStorageId'),json_extract(payload,'$.target')),
     json_extract(payload,'$.status'),
     CASE WHEN json_extract(payload,'$.keeperConfirmTime') IS NOT NULL THEN 1 ELSE 0 END,payload
   FROM t_store_doc WHERE coll='returns';`,

  `DELETE FROM t_bb_destroy;
   INSERT INTO t_bb_destroy(id,destroy_no,plan_id,reason,payload)
   SELECT json_extract(payload,'$.id'),
     IFNULL(json_extract(payload,'$.destroyNo'),json_extract(payload,'$.no')),
     IFNULL(json_extract(payload,'$.planId'),json_extract(payload,'$.plan')),
     IFNULL(json_extract(payload,'$.destroyReason'),json_extract(payload,'$.reason')),payload
   FROM t_store_doc WHERE coll='destroys';`,

  `DELETE FROM t_bb_verify;
   INSERT INTO t_bb_verify(id,plan_id,police_id,conclusion,verify_time,payload)
   SELECT json_extract(payload,'$.id'),
     IFNULL(json_extract(payload,'$.planId'),json_extract(payload,'$.plan')),
     IFNULL(json_extract(payload,'$.policeId'),json_extract(payload,'$.police')),
     json_extract(payload,'$.conclusion'),
     IFNULL(json_extract(payload,'$.verifyTime'),json_extract(payload,'$.time')),payload
   FROM t_store_doc WHERE coll='verifies';`,

  `DELETE FROM t_bb_check;
   INSERT INTO t_bb_check(id,plan_id,node_name,level_name,inspector_id,result,created_at,payload)
   SELECT json_extract(payload,'$.id'),
     IFNULL(json_extract(payload,'$.planId'),json_extract(payload,'$.plan')),
     IFNULL(json_extract(payload,'$.nodeName'),json_extract(payload,'$.node')),
     IFNULL(json_extract(payload,'$.levelName'),json_extract(payload,'$.level')),
     IFNULL(json_extract(payload,'$.inspectorId'),json_extract(payload,'$.inspector')),
     json_extract(payload,'$.result'),
     IFNULL(json_extract(payload,'$.createdAt'),json_extract(payload,'$.time')),payload
   FROM t_store_doc WHERE coll='checks';`,

  `DELETE FROM t_bb_node_log;
   INSERT INTO t_bb_node_log(id,plan_id,node,action,operator_id,operator_name,op_time,payload)
   SELECT json_extract(payload,'$.id'),
     IFNULL(json_extract(payload,'$.planId'),json_extract(payload,'$.plan')),
     json_extract(payload,'$.node'),json_extract(payload,'$.action'),
     IFNULL(json_extract(payload,'$.operatorId'),json_extract(payload,'$.by')),
     IFNULL(json_extract(payload,'$.operatorName'),json_extract(payload,'$.who')),
     IFNULL(json_extract(payload,'$.opTime'),json_extract(payload,'$.time')),payload
   FROM t_store_doc WHERE coll IN ('nodeLogs','logs');`,

  `DELETE FROM t_bb_accident;
   INSERT INTO t_bb_accident(id,event_time,place,site_id,plan_id,person_id,person_name,id_no,reason,remark,report_unit,status,payload)
   SELECT json_extract(payload,'$.id'),json_extract(payload,'$.eventTime'),
     json_extract(payload,'$.place'),json_extract(payload,'$.site'),json_extract(payload,'$.plan'),
     json_extract(payload,'$.person'),json_extract(payload,'$.name'),json_extract(payload,'$.idno'),
     json_extract(payload,'$.reason'),json_extract(payload,'$.remark'),
     json_extract(payload,'$.reportUnit'),json_extract(payload,'$.status'),payload
   FROM t_store_doc WHERE coll='accidents';`,

  `DELETE FROM t_bb_master;
   INSERT INTO t_bb_master(coll,id,name,status,payload)
   SELECT coll,json_extract(payload,'$.id'),json_extract(payload,'$.name'),json_extract(payload,'$.status'),payload
   FROM t_store_doc WHERE coll IN ('companies','persons','storages','vehicles','drivers','workareas','projects','sites','routes');`,

  `DELETE FROM t_bb_inventory;
   INSERT INTO t_bb_inventory(storage_id,goods_type,spec,stock_qty,safe_qty)
   SELECT json_extract(d.payload,'$.id'),j.key,k.key,k.value,json_extract(d.payload,'$.safe.'||j.key)
   FROM t_store_doc d, json_each(d.payload,'$.stock') j, json_each(j.value) k
   WHERE d.coll='storages';`,

  `DELETE FROM t_bb_settings;
   INSERT INTO t_bb_settings(id,payload) SELECT 'system',payload FROM t_store_doc WHERE coll='settings';`
];


function syncMirror(conn) {
  for (const sql of MIRROR_SQL) conn.exec(sql);
}

/* ---------- 初始化 / 重置 ---------- */
function readJSONOrSeed() {
  if (fs.existsSync(JSON_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));
      if (parsed && typeof parsed === 'object') return mergeSeed(parsed);
    } catch (e) {
      console.warn('[db] store.json 解析失败，改用内置种子：', e.message);
    }
  }
  return JSON.parse(JSON.stringify(DEFAULT_STORE));
}

function mergeSeed(obj) {
  const base = JSON.parse(JSON.stringify(DEFAULT_STORE));
  for (const k of Object.keys(base)) if (obj[k] === undefined) obj[k] = base[k];
  return obj;
}

/* ---------- JSON 兜底（没装 --experimental-sqlite 时） ---------- */
function loadJSON() {
  if (!fs.existsSync(JSON_FILE)) { saveJSON(DEFAULT_STORE); return JSON.parse(JSON.stringify(DEFAULT_STORE)); }
  try { return JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8')); }
  catch (e) { console.error('[db] JSON 读取失败，回退种子:', e.message); return JSON.parse(JSON.stringify(DEFAULT_STORE)); }
}
function saveJSON(data) {
  ensureDir(DATA_DIR);
  fs.writeFileSync(JSON_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/* ---------- 日志（I07/Q15、J12/Q11） ---------- */
function logNodeAction(planId, node, action, operator, signUrl = '', photos = [], extra = {}) {
  const db = loadDB();
  const logEntry = {
    id: 'NL_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    planId, node, action,
    operatorId: operator.id || '',
    operatorName: operator.name || '',
    operatorRole: operator.role || '',
    signUrl: signUrl || '',
    photos: photos || [],
    opTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    ...extra
  };
  db.nodeLogs.push(logEntry);
  saveDB(db);
  return logEntry;
}

function logMasterAction(dataType, dataId, action, operator, remark = '', diff = null, dbInstance = null) {
  const db = dbInstance || loadDB();
  const masterLog = {
    id: 'ML_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    dataType, dataId, action,
    operatorId: operator.id || 'ADM1',
    operatorName: operator.name || '治安管理员',
    opTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    remark, diff
  };
  db.masterLogs.push(masterLog);
  saveDB(db);
  return masterLog;
}

function getSeedData() {
  const seed = JSON.parse(JSON.stringify(DEFAULT_STORE));
  seed.plans = []; seed.outbounds = []; seed.transports = []; seed.receives = [];
  seed.blastings = []; seed.destroys = []; seed.returns = []; seed.verifies = [];
  seed.checks = []; seed.rectifies = []; seed.nodeLogs = [];
  seed.masterLogs = [{
    id: 'ML_INIT', dataType: 'system', dataId: 'SYS_01', action: '系统初始化',
    operatorId: 'ADM1', operatorName: '治安管理员',
    opTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    remark: '数据库已初始化（SQLite / ' + path.basename(SQLITE_FILE) + '），业务流水就绪'
  }];
  return seed;
}

function resetDB() {
  const seed = getSeedData();
  saveDB(seed);
  return seed;
}

/* ---------- 单文档写库：前端每次业务操作直接调接口，一条记录一次落库 ---------- */
function upsertDoc(coll, doc) {
  if (!coll) throw new Error('集合名必填');
  if (!doc || !(doc.id || doc.dataId)) throw new Error('文档 id 必填');
  const id = String(doc.id || doc.dataId);
  const conn = openConn();
  if (!conn) {
    const data = loadJSON();
    const arr = Array.isArray(data[coll]) ? data[coll] : (data[coll] = []);
    const i = arr.findIndex(x => String((x && (x.id || x.dataId)) || '') === id);
    if (i >= 0) arr[i] = doc; else arr.push(doc);
    saveJSON(data);
    return doc;
  }
  conn.exec('BEGIN IMMEDIATE');
  try {
    conn.prepare("INSERT OR REPLACE INTO t_store_doc(coll,doc_id,payload,updated_at) VALUES (?,?,?,datetime('now'))")
      .run(coll, id, JSON.stringify(doc));
    syncMirror(conn);
    conn.exec('COMMIT');
  } catch (err) {
    conn.exec('ROLLBACK');
    throw err;
  }
  try { saveJSON(loadDB()); } catch (e) {}
  return doc;
}

function deleteDoc(coll, id) {
  if (!coll || !id) throw new Error('集合名与文档 id 必填');
  const conn = openConn();
  if (!conn) {
    const data = loadJSON();
    if (Array.isArray(data[coll])) data[coll] = data[coll].filter(x => String((x && (x.id || x.dataId)) || '') !== String(id));
    saveJSON(data);
    return true;
  }
  conn.exec('BEGIN IMMEDIATE');
  try {
    conn.prepare('DELETE FROM t_store_doc WHERE coll=? AND doc_id=?').run(coll, String(id));
    syncMirror(conn);
    conn.exec('COMMIT');
  } catch (err) {
    conn.exec('ROLLBACK');
    throw err;
  }
  try { saveJSON(loadDB()); } catch (e) {}
  return true;
}

module.exports = {
  loadDB, saveDB, resetDB, logNodeAction, logMasterAction, upsertDoc, deleteDoc,
  isSqliteReady, SQLITE_FILE, DDL_FILE
};
