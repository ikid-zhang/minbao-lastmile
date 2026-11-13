-- ============================================================
-- 民爆“最后一公里”监管系统 · 本机演示库（SQLite）
-- 用途：无 MySQL 环境下跑通「前端 → API → 数据库」链路
-- 写入：t_store_doc 为权威存储（一条记录一行 JSON），后端业务代码零改动
-- 查询：t_bb_* 由 t_store_doc 每次写库后全量同步，供 SQL 查询与核对
-- 生产：改用 docs/sql/schema.sql（MySQL 8.0+，28 张实体表）
-- ============================================================

PRAGMA journal_mode = WAL;

-- 0. 权威存储
CREATE TABLE IF NOT EXISTS t_store_doc (
  coll       TEXT NOT NULL,
  doc_id     TEXT NOT NULL,
  payload    TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (coll, doc_id)
) WITHOUT ROWID;

-- 1. 作业计划
CREATE TABLE IF NOT EXISTS t_bb_plan (
  id TEXT PRIMARY KEY, plan_no TEXT, project_id TEXT, site_id TEXT,
  out_storage_id TEXT, workarea_id TEXT, plan_start TEXT, plan_end TEXT,
  plan_kg REAL, surveyor_id TEXT, reg_regulator_id TEXT, reg_sign_time TEXT,
  applicant_id TEXT, submit_time TEXT, audit_status TEXT, audit_police_id TEXT,
  audit_time TEXT, audit_remark TEXT, status TEXT, created_at TEXT, payload TEXT
);
CREATE INDEX IF NOT EXISTS idx_plan_status ON t_bb_plan(status);
CREATE INDEX IF NOT EXISTS idx_plan_site ON t_bb_plan(site_id);

-- 2. 计划明细
CREATE TABLE IF NOT EXISTS t_bb_plan_item (
  plan_id TEXT, goods_type TEXT, spec TEXT, unit TEXT, plan_qty REAL, payload TEXT
);
CREATE INDEX IF NOT EXISTS idx_item_plan ON t_bb_plan_item(plan_id);

-- 3. 出库单
CREATE TABLE IF NOT EXISTS t_bb_outbound (
  id TEXT PRIMARY KEY, out_no TEXT, storage_id TEXT, total_kg REAL, plans_json TEXT,
  registrant_id TEXT, reg_time TEXT, reviewer_id TEXT, rev_time TEXT,
  status TEXT, created_at TEXT, payload TEXT
);

-- 4. 运输单
CREATE TABLE IF NOT EXISTS t_bb_transport (
  id TEXT PRIMARY KEY, outbound_id TEXT, escort_id TEXT, driver_id TEXT, vehicle_id TEXT,
  vehicle_load REAL, total_weight REAL, route_id TEXT, depart_time TEXT,
  expected_arrive_time TEXT, police_id TEXT, remark TEXT,
  finish_time TEXT, status TEXT, payload TEXT
);

-- 5. 到场接收
CREATE TABLE IF NOT EXISTS t_bb_receive (
  id TEXT PRIMARY KEY, transport_id TEXT, plan_id TEXT, safety_officer_id TEXT,
  arrive_time TEXT, diff_flag INTEGER, payload TEXT
);

-- 6. 爆破登记
CREATE TABLE IF NOT EXISTS t_bb_blasting (
  id TEXT PRIMARY KEY, plan_id TEXT, supervisor_id TEXT, blast_time TEXT,
  blast_method TEXT, weather TEXT, out_storage_id TEXT,
  used_zy_qty REAL, used_lg_qty REAL, used_db_qty REAL,
  blaster_ids TEXT, safety_officer_ids TEXT, remark TEXT,
  blast_result TEXT, payload TEXT
);

-- 7. 退库单
CREATE TABLE IF NOT EXISTS t_bb_return (
  id TEXT PRIMARY KEY, return_no TEXT, plan_id TEXT, target_storage_id TEXT,
  status TEXT, keeper_confirmed INTEGER, payload TEXT
);

-- 8. 销毁登记
CREATE TABLE IF NOT EXISTS t_bb_destroy (
  id TEXT PRIMARY KEY, destroy_no TEXT, plan_id TEXT, reason TEXT, payload TEXT
);

-- 9. 核验单
CREATE TABLE IF NOT EXISTS t_bb_verify (
  id TEXT PRIMARY KEY, plan_id TEXT, police_id TEXT, conclusion TEXT, verify_time TEXT, payload TEXT
);

-- 10. 公安检查
CREATE TABLE IF NOT EXISTS t_bb_check (
  id TEXT PRIMARY KEY, plan_id TEXT, node_name TEXT, level_name TEXT,
  inspector_id TEXT, result TEXT, created_at TEXT, payload TEXT
);

-- 11. 全链路日志
CREATE TABLE IF NOT EXISTS t_bb_node_log (
  id TEXT PRIMARY KEY, plan_id TEXT, node TEXT, action TEXT,
  operator_id TEXT, operator_name TEXT, op_time TEXT, payload TEXT
);

-- 12. 主数据统一表（company/person/storage/vehicle/driver/workarea/project/site/route）
CREATE TABLE IF NOT EXISTS t_bb_master (
  coll TEXT NOT NULL, id TEXT NOT NULL, name TEXT, status TEXT, payload TEXT,
  PRIMARY KEY (coll, id)
) WITHOUT ROWID;

-- 13. 库存台账（按 库房×品种×规格 展开，便于 SQL 统计）
CREATE TABLE IF NOT EXISTS t_bb_inventory (
  storage_id TEXT, goods_type TEXT, spec TEXT, stock_qty REAL, safe_qty REAL,
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (storage_id, goods_type, spec)
) WITHOUT ROWID;

-- 14. 系统参数
CREATE TABLE IF NOT EXISTS t_bb_settings (
  id TEXT PRIMARY KEY, payload TEXT, updated_at TEXT DEFAULT (datetime('now'))
);

-- 15. 亡人事件登记（对应表单第 9 项）
CREATE TABLE IF NOT EXISTS t_bb_accident (
  id TEXT PRIMARY KEY, event_time TEXT, place TEXT, site_id TEXT, plan_id TEXT,
  person_id TEXT, person_name TEXT, id_no TEXT, reason TEXT, remark TEXT,
  report_unit TEXT, status TEXT, payload TEXT
);

-- 16. 表单口径视图：库房表单（12 列一次取齐）
CREATE VIEW IF NOT EXISTS v_bb_storage_form AS
SELECT m.id AS seq,
       json_extract(m.payload,'$.name') AS storage_name,
       json_extract(m.payload,'$.addr') AS addr,
       json_extract(m.payload,'$.builtAt') AS built_at,
       json_extract(m.payload,'$.area') AS area_sqm,
       json_extract(m.payload,'$.type') AS use_type,
       json_extract(m.payload,'$.dailyUse') AS daily_use_limit,
       IFNULL((SELECT SUM(stock_qty) FROM t_bb_inventory i WHERE i.storage_id=m.id AND i.goods_type='zy'),0) AS zy_stock,
       IFNULL((SELECT SUM(stock_qty) FROM t_bb_inventory i WHERE i.storage_id=m.id AND i.goods_type='lg'),0) AS lg_stock,
       IFNULL((SELECT SUM(stock_qty) FROM t_bb_inventory i WHERE i.storage_id=m.id AND i.goods_type='db'),0) AS db_stock,
       json_extract(m.payload,'$.staff') AS staff_num,
       json_extract(m.payload,'$.supplyUnit') AS supply_unit
FROM t_bb_master m WHERE m.coll='storages';

-- 17. 表单口径视图：今日爆破点（15 列一次取齐）
CREATE VIEW IF NOT EXISTS v_bb_blasting_form AS
SELECT b.id AS seq, IFNULL(b.blast_time, p.plan_start) AS blast_time, s.name AS blast_site, c.name AS duty_company,
       b.blast_method, b.weather, b.used_zy_qty AS total_used_kg,
       b.used_lg_qty AS detonator_qty, b.used_db_qty AS fuse_qty,
       st2.name AS from_storage_name, b.supervisor_id, b.blaster_ids,
       b.safety_officer_ids, t.vehicle_id, b.remark
FROM t_bb_blasting b
LEFT JOIN t_bb_plan p ON p.id=b.plan_id
LEFT JOIN t_bb_master s ON s.coll='sites' AND s.id=p.site_id
LEFT JOIN t_bb_master pr ON pr.coll='projects' AND pr.id=p.project_id
LEFT JOIN t_bb_master c ON c.coll='companies' AND c.id=json_extract(pr.payload,'$.company')
LEFT JOIN t_bb_master st2 ON st2.coll='storages' AND st2.id=IFNULL(NULLIF(b.out_storage_id,''),json_extract(p.payload,'$.outStorage'))
LEFT JOIN t_bb_receive r ON r.plan_id=b.plan_id
LEFT JOIN t_bb_transport t ON t.id=r.transport_id;

-- 18. 表单口径视图：主界面 9 项指标
CREATE VIEW IF NOT EXISTS v_bb_dashboard AS
SELECT
  (SELECT IFNULL(SUM(stock_qty),0) FROM t_bb_inventory WHERE goods_type='zy') AS zy_total_kg,
  (SELECT COUNT(*) FROM t_bb_master WHERE coll='storages') AS storage_count,
  (SELECT COUNT(*) FROM t_bb_master WHERE coll='companies') AS company_count,
  (SELECT IFNULL(SUM(stock_qty),0) FROM t_bb_inventory WHERE goods_type='db') AS db_total_m,
  (SELECT IFNULL(SUM(stock_qty),0) FROM t_bb_inventory WHERE goods_type='lg') AS lg_total_fa,
  (SELECT COUNT(*) FROM t_bb_master WHERE coll='persons' AND json_extract(payload,'$.role')='爆破员') AS blaster_count,
  (SELECT COUNT(*) FROM t_bb_master WHERE coll='persons' AND json_extract(payload,'$.role')='安全员') AS safety_count,
  (SELECT COUNT(*) FROM t_bb_master WHERE coll='persons' AND json_extract(payload,'$.role')='保管员') AS keeper_count,
  (SELECT COUNT(DISTINCT site_id) FROM t_bb_plan WHERE date(plan_start)=date('now','localtime')) AS today_site_count;
