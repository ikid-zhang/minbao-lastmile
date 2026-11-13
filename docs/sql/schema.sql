-- =============================================================================
-- 民爆“最后一公里”全链路监管系统 - 数据库 DDL 脚本 (MySQL 8.0+)
-- 版本：V1.5 (依据设计说明书与甲方需求澄清清单落地)
-- 包含：主数据底座 (J)、业务流水表 (A-F)、分级检查 (K)、全链留痕与日志 (I/L)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `minbao_lastmile` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `minbao_lastmile`;

-- -----------------------------------------------------------------------------
-- 1. 主数据表 (Master Data)
-- -----------------------------------------------------------------------------

-- 1.1 民爆公司主档 (J01)
DROP TABLE IF EXISTS `t_bb_company`;
CREATE TABLE `t_bb_company` (
  `id` VARCHAR(32) NOT NULL COMMENT '公司ID (如 C1)',
  `name` VARCHAR(128) NOT NULL COMMENT '公司全称',
  `addr` VARCHAR(255) DEFAULT '' COMMENT '注册/经营地址',
  `legal_person` VARCHAR(32) NOT NULL COMMENT '法定代表人姓名',
  `staff_num` INT DEFAULT 0 COMMENT '从业人员数',
  `licence_no` VARCHAR(64) NOT NULL COMMENT '爆破作业单位许可证编号',
  `licence_expire` DATE NOT NULL COMMENT '许可证有效期止',
  `area_code` VARCHAR(32) DEFAULT '' COMMENT '所属行政区划代码',
  `status` VARCHAR(16) NOT NULL DEFAULT '生效' COMMENT '状态：生效/停用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_company_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='民爆公司主档表';

-- 1.2 人员主档 (J02，四大员/负责人/监理/技术员/安全监管/民警)
DROP TABLE IF EXISTS `t_bb_person`;
CREATE TABLE `t_bb_person` (
  `id` VARCHAR(32) NOT NULL COMMENT '人员ID (如 P1, POL1)',
  `name` VARCHAR(32) NOT NULL COMMENT '人员姓名',
  `role` VARCHAR(32) NOT NULL COMMENT '角色：项目负责人/安全监理/安全员/保管员/押运员/爆破员/测量技术员/安全监管/民警/治安管理员',
  `company_id` VARCHAR(32) DEFAULT '' COMMENT '所属单位ID (关联 t_bb_company 或派出所名称)',
  `storage_ids` JSON DEFAULT NULL COMMENT '所属库房ID列表 (JSON Array，库房员工表单“所属库房”口径)',
  `site_ids` JSON DEFAULT NULL COMMENT '关联作业点位ID列表 (JSON Array，爆破员/安全员按点位派工口径)',
  `id_no` VARCHAR(128) NOT NULL COMMENT '身份证号 (AES-256 加密存储)',
  `phone` VARCHAR(32) DEFAULT '' COMMENT '联系电话',
  `cert_no` VARCHAR(64) DEFAULT '' COMMENT '从业资格证号',
  `cert_expire` DATE DEFAULT NULL COMMENT '资格证到期日',
  `status` VARCHAR(16) NOT NULL DEFAULT '在岗' COMMENT '状态：在岗/休假/离职/停用',
  `remark` VARCHAR(255) DEFAULT '' COMMENT '备注说明 (如城西销售库负责人)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_person_role` (`role`),
  INDEX `idx_person_company` (`company_id`),
  INDEX `idx_person_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='人员主档表';

-- 1.3 库房主档 (J03，销售库/使用库)
DROP TABLE IF EXISTS `t_bb_storage`;
CREATE TABLE `t_bb_storage` (
  `id` VARCHAR(32) NOT NULL COMMENT '库房ID (如 S1, S2)',
  `name` VARCHAR(64) NOT NULL COMMENT '库房名称',
  `type` VARCHAR(16) NOT NULL COMMENT '类型：销售库/使用库',
  `company_id` VARCHAR(32) NOT NULL COMMENT '所属公司ID',
  `addr` VARCHAR(255) DEFAULT '' COMMENT '详细地址',
  `built_at` DATE DEFAULT NULL COMMENT '建成投产日期',
  `area_sqm` DECIMAL(10,2) DEFAULT 0.00 COMMENT '占地面积(平方米)',
  `daily_use_limit` DECIMAL(10,2) DEFAULT 0.00 COMMENT '核准日周转量/设计存量(kg)',
  `lng` DECIMAL(10,6) DEFAULT NULL COMMENT '经度',
  `lat` DECIMAL(10,6) DEFAULT NULL COMMENT '纬度',
  `fence_radius` INT DEFAULT 200 COMMENT '围栏半径(米)',
  `keeper_ids` JSON DEFAULT NULL COMMENT '绑定的库管员人员ID列表 (JSON Array)',
  `staff_num` INT DEFAULT 0 COMMENT '库房员工人数（表单口径，含保管员/值守人员）',
  `supply_unit` VARCHAR(128) DEFAULT '' COMMENT '供给单位（炸药/雷管供货或调拨来源单位）',
  `status` VARCHAR(16) NOT NULL DEFAULT '生效' COMMENT '状态：生效/停用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_storage_type` (`type`),
  INDEX `idx_storage_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='民爆储存库房主档表';

-- 1.4 库存台账 (J04)
DROP TABLE IF EXISTS `t_bb_inventory`;
CREATE TABLE `t_bb_inventory` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `storage_id` VARCHAR(32) NOT NULL COMMENT '库房ID',
  `goods_type` VARCHAR(16) NOT NULL COMMENT '品种类型：zy(炸药)/lg(雷管)/db(导爆索)',
  `spec` VARCHAR(64) NOT NULL COMMENT '品种规格 (如 2号岩石乳化炸药/8#工业电雷管)',
  `unit` VARCHAR(16) NOT NULL COMMENT '计量单位 (kg/发/m)',
  `stock_qty` DECIMAL(12,3) NOT NULL DEFAULT 0.000 COMMENT '当前实时在库数量',
  `safe_qty` DECIMAL(12,3) NOT NULL DEFAULT 0.000 COMMENT '安全预警库存值',
  `version` INT NOT NULL DEFAULT 0 COMMENT '乐观锁版本号',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_storage_goods_spec` (`storage_id`, `goods_type`, `spec`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库房实时库存台账表';

-- 1.5 库房出入库流水 (J05)
DROP TABLE IF EXISTS `t_bb_stock_log`;
CREATE TABLE `t_bb_stock_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `storage_id` VARCHAR(32) NOT NULL COMMENT '库房ID',
  `goods_type` VARCHAR(16) NOT NULL COMMENT '品种类型',
  `spec` VARCHAR(64) NOT NULL COMMENT '规格',
  `change_qty` DECIMAL(12,3) NOT NULL COMMENT '变动数量 (正数为入，负数为出)',
  `bill_type` VARCHAR(32) NOT NULL COMMENT '单据类型：采购入库/盘盈调整/盘亏核销/作业出库/作业退库/内部移库',
  `biz_id` VARCHAR(64) DEFAULT '' COMMENT '关联业务单据号 (出库单号/退库单号等)',
  `operator_id` VARCHAR(32) NOT NULL COMMENT '经办人ID',
  `op_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  `remark` VARCHAR(255) DEFAULT '' COMMENT '流水备注',
  PRIMARY KEY (`id`),
  INDEX `idx_stock_log_storage` (`storage_id`, `op_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存日常变动流水明细表';

-- 1.6 运输车辆档案 (J06)
DROP TABLE IF EXISTS `t_bb_vehicle`;
CREATE TABLE `t_bb_vehicle` (
  `id` VARCHAR(32) NOT NULL COMMENT '车辆ID (如 V1)',
  `plate_no` VARCHAR(32) NOT NULL COMMENT '车牌号 (如 川L·10295)',
  `model` VARCHAR(64) NOT NULL COMMENT '车型描述 (如 厢式危险品运输车)',
  `load_limit` DECIMAL(10,2) NOT NULL COMMENT '核定载重(kg)',
  `company_id` VARCHAR(32) NOT NULL COMMENT '所属单位ID',
  `trans_licence` VARCHAR(64) DEFAULT '' COMMENT '道路危险货物运输许可证号',
  `trans_goods` VARCHAR(64) DEFAULT '' COMMENT '核准运输品类 (如 炸药、雷管)',
  `annual_expire` DATE NOT NULL COMMENT '年审有效截止日',
  `status` VARCHAR(16) NOT NULL DEFAULT '在用' COMMENT '状态：在用/停用/维修',
  `remark` VARCHAR(255) DEFAULT '' COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_vehicle_plate` (`plate_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='运输车辆主档表';

-- 1.7 驾驶员档案 (J07)
DROP TABLE IF EXISTS `t_bb_driver`;
CREATE TABLE `t_bb_driver` (
  `id` VARCHAR(32) NOT NULL COMMENT '驾驶员ID (如 D1)',
  `name` VARCHAR(32) NOT NULL COMMENT '姓名',
  `id_no` VARCHAR(128) DEFAULT '' COMMENT '身份证号(加密)',
  `cert_no` VARCHAR(64) NOT NULL COMMENT '道路危险货物运输驾驶员从业资格证',
  `phone` VARCHAR(32) NOT NULL COMMENT '联系电话',
  `status` VARCHAR(16) NOT NULL DEFAULT '在岗' COMMENT '状态：在岗/休假/停用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='驾驶员主档表';

-- 1.8 工区与项目档案 (J08)
DROP TABLE IF EXISTS `t_bb_workarea`;
CREATE TABLE `t_bb_workarea` (
  `id` VARCHAR(32) NOT NULL COMMENT '工区ID (如 WA1)',
  `name` VARCHAR(64) NOT NULL COMMENT '工区名称',
  `police_id` VARCHAR(32) NOT NULL COMMENT '责任民警ID (关联 t_bb_person)',
  `police_unit` VARCHAR(64) NOT NULL COMMENT '责任单位 (工区警务室/城关派出所)',
  `scope_desc` VARCHAR(255) DEFAULT '' COMMENT '管辖范围描述',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='公安责任工区配置表';

DROP TABLE IF EXISTS `t_bb_project`;
CREATE TABLE `t_bb_project` (
  `id` VARCHAR(32) NOT NULL COMMENT '项目ID (如 PR1)',
  `name` VARCHAR(128) NOT NULL COMMENT '爆破工程项目名称',
  `company_id` VARCHAR(32) NOT NULL COMMENT '施工单位ID',
  `workarea_id` VARCHAR(32) NOT NULL COMMENT '所属工区ID',
  `project_type` VARCHAR(64) DEFAULT '' COMMENT '作业类型 (如 隧道开挖/露天台阶)',
  `valid_start` DATE NOT NULL COMMENT '备案起始日期',
  `valid_end` DATE NOT NULL COMMENT '备案截止日期',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_project_company` (`company_id`),
  INDEX `idx_project_workarea` (`workarea_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='民爆施工工程项目表';

-- 1.9 作业点主档 (A02)
DROP TABLE IF EXISTS `t_bb_site`;
CREATE TABLE `t_bb_site` (
  `id` VARCHAR(32) NOT NULL COMMENT '作业点ID (如 Z1)',
  `name` VARCHAR(64) NOT NULL COMMENT '作业点名称',
  `project_id` VARCHAR(32) NOT NULL COMMENT '所属项目ID',
  `lng` DECIMAL(10,6) DEFAULT NULL COMMENT '经度坐标',
  `lat` DECIMAL(10,6) DEFAULT NULL COMMENT '纬度坐标',
  `fence_radius` INT DEFAULT 300 COMMENT '围栏半径(米，预留)',
  `history_count` INT DEFAULT 0 COMMENT '历史累计爆破次数',
  `status` VARCHAR(16) NOT NULL DEFAULT '启用' COMMENT '状态：启用/停用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_site_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='作业点档案表';

-- 1.10 运输路线主档及打卡点 (J11/R15)
DROP TABLE IF EXISTS `t_bb_route`;
CREATE TABLE `t_bb_route` (
  `id` VARCHAR(32) NOT NULL COMMENT '路线ID (如 R1)',
  `name` VARCHAR(128) NOT NULL COMMENT '路线名称',
  `from_storage_id` VARCHAR(32) NOT NULL COMMENT '起运库房ID',
  `to_site_id` VARCHAR(32) NOT NULL COMMENT '目的作业点ID',
  `via_road` VARCHAR(255) DEFAULT '' COMMENT '途经主要道路',
  `km` DECIMAL(8,2) DEFAULT 0.00 COMMENT '里程数(km)',
  `status` VARCHAR(16) NOT NULL DEFAULT '启用' COMMENT '状态：启用/停用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_route_storage` (`from_storage_id`),
  INDEX `idx_route_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='运输路线主档表';

DROP TABLE IF EXISTS `t_bb_route_checkpoint`;
CREATE TABLE `t_bb_route_checkpoint` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `route_id` VARCHAR(32) NOT NULL COMMENT '路线ID',
  `seq` INT NOT NULL DEFAULT 1 COMMENT '顺序序号',
  `name` VARCHAR(64) NOT NULL COMMENT '打卡点名称',
  `lng` DECIMAL(10,6) DEFAULT NULL COMMENT '打卡点经度',
  `lat` DECIMAL(10,6) DEFAULT NULL COMMENT '打卡点纬度',
  PRIMARY KEY (`id`),
  INDEX `idx_route_seq` (`route_id`, `seq`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='路线沿途打卡点配置表';

-- -----------------------------------------------------------------------------
-- 2. 作业计划与业务流转表 (Business Workflow)
-- -----------------------------------------------------------------------------

-- 2.1 作业计划主表 (A01-A08)
DROP TABLE IF EXISTS `t_bb_plan`;
CREATE TABLE `t_bb_plan` (
  `id` VARCHAR(32) NOT NULL COMMENT '计划ID (如 PL1)',
  `plan_no` VARCHAR(64) NOT NULL COMMENT '计划编号 (BBJH+yyyyMMdd+流水)',
  `project_id` VARCHAR(32) NOT NULL COMMENT '项目ID',
  `site_id` VARCHAR(32) NOT NULL COMMENT '作业点ID',
  `out_storage_id` VARCHAR(32) NOT NULL COMMENT '发料出库库房ID (销售库)',
  `workarea_id` VARCHAR(32) NOT NULL COMMENT '公安责任区ID (工区)',
  `plan_start` DATETIME NOT NULL COMMENT '计划作业开始时间',
  `plan_end` DATETIME NOT NULL COMMENT '计划作业结束时间',
  `plan_kg` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '计划折算总装药量(kg)',
  `surveyor_id` VARCHAR(32) NOT NULL COMMENT '测量技术员ID',
  `survey_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '技术员填报提交时间',
  `reg_regulator_id` VARCHAR(32) DEFAULT NULL COMMENT '安全监管人员ID',
  `reg_sign_url` VARCHAR(255) DEFAULT '' COMMENT '安全监管手写签名图片URL',
  `reg_sign_time` DATETIME DEFAULT NULL COMMENT '安全监管签字时间',
  `applicant_id` VARCHAR(32) DEFAULT NULL COMMENT '项目负责人ID (审核人)',
  `submit_time` DATETIME DEFAULT NULL COMMENT '负责人审核上报时间',
  `audit_status` VARCHAR(16) NOT NULL DEFAULT '待审核' COMMENT '民警审核状态：待审核/已通过/已驳回/免审直接出库',
  `audit_police_id` VARCHAR(32) DEFAULT NULL COMMENT '审核民警ID',
  `audit_time` DATETIME DEFAULT NULL COMMENT '审核时间',
  `audit_remark` VARCHAR(255) DEFAULT '' COMMENT '审核意见/驳回原因',
  `status` VARCHAR(32) NOT NULL DEFAULT '待监管签字' COMMENT '状态机：待监管签字/待负责人审核/待出库/出库中/待运输/运输中/部分到达/已到场/爆破中/待退库/待核验/已完成/异常挂起',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_plan_no` (`plan_no`),
  INDEX `idx_plan_site` (`site_id`),
  INDEX `idx_plan_status` (`status`),
  INDEX `idx_plan_start` (`plan_start`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='作业计划主表';

-- 2.2 计划明细清单 (A07)
DROP TABLE IF EXISTS `t_bb_plan_item`;
CREATE TABLE `t_bb_plan_item` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `plan_id` VARCHAR(32) NOT NULL COMMENT '计划ID',
  `goods_type` VARCHAR(16) NOT NULL COMMENT '品种类型 (zy/lg/db)',
  `spec` VARCHAR(64) NOT NULL COMMENT '规格',
  `unit` VARCHAR(16) NOT NULL COMMENT '单位',
  `plan_qty` DECIMAL(10,2) NOT NULL COMMENT '计划申请数量',
  PRIMARY KEY (`id`),
  INDEX `idx_item_plan` (`plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='作业计划物品明细表';

-- 2.3 出库管理单 (B01-B07，支持一单多点与双人双锁)
DROP TABLE IF EXISTS `t_bb_outbound`;
CREATE TABLE `t_bb_outbound` (
  `id` VARCHAR(32) NOT NULL COMMENT '出库单ID (如 OB1)',
  `out_no` VARCHAR(64) NOT NULL COMMENT '出库联单编号 (BBCK+yyyyMMdd+流水)',
  `storage_id` VARCHAR(32) NOT NULL COMMENT '出库库房ID (销售库)',
  `plans_json` JSON NOT NULL COMMENT '合并计划列表 [{planId, planNo, siteId, siteName, items: [...]}]',
  `total_kg` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '出库合计重量(kg)',
  `registrant_id` VARCHAR(32) NOT NULL COMMENT '登记库管员ID (第一人)',
  `reg_sign_url` VARCHAR(255) NOT NULL COMMENT '登记库管员手写签名URL',
  `reg_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '登记提交时间 (此时不扣库存)',
  `reviewer_id` VARCHAR(32) DEFAULT NULL COMMENT '复核库管员ID (第二人，必须不同自然人)',
  `reviewer_idcard_last4` VARCHAR(8) DEFAULT '' COMMENT '复核人身份证后四位核验记录',
  `rev_sign_url` VARCHAR(255) DEFAULT '' COMMENT '复核库管员手写签名URL',
  `rev_time` DATETIME DEFAULT NULL COMMENT '复核生效时间 (行锁在此扣除库存)',
  `status` VARCHAR(16) NOT NULL DEFAULT '待复核' COMMENT '状态：待复核/已生效/待签收/运输中/已完成',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_outbound_no` (`out_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='作业出库登记主表';

DROP TABLE IF EXISTS `t_bb_outbound_item`;
CREATE TABLE `t_bb_outbound_item` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `outbound_id` VARCHAR(32) NOT NULL COMMENT '出库单ID',
  `plan_id` VARCHAR(32) NOT NULL COMMENT '所属计划ID',
  `goods_type` VARCHAR(16) NOT NULL COMMENT '品种类型',
  `spec` VARCHAR(64) NOT NULL COMMENT '规格',
  `qty` DECIMAL(10,2) NOT NULL COMMENT '实发数量 (严格 <= 计划量)',
  `batch_no` VARCHAR(64) NOT NULL COMMENT '出库批次号/箱号',
  PRIMARY KEY (`id`),
  INDEX `idx_outbound_item` (`outbound_id`, `plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='出库单按批次物品发料明细表';

-- 2.4 押运与运输单 (C01-C12)
DROP TABLE IF EXISTS `t_bb_transport`;
CREATE TABLE `t_bb_transport` (
  `id` VARCHAR(32) NOT NULL COMMENT '运输单ID (如 TR1)',
  `outbound_id` VARCHAR(32) NOT NULL COMMENT '关联出库单ID',
  `direction` VARCHAR(16) NOT NULL DEFAULT '去程' COMMENT '运输方向：去程/返程退库',
  `escort_id` VARCHAR(32) NOT NULL COMMENT '押运员ID',
  `driver_id` VARCHAR(32) NOT NULL COMMENT '驾驶员ID',
  `vehicle_id` VARCHAR(32) NOT NULL COMMENT '车辆ID',
  `vehicle_load` DECIMAL(10,2) NOT NULL COMMENT '车辆核定载重(kg)',
  `total_weight` DECIMAL(10,2) NOT NULL COMMENT '运输实际总重量(kg，必须 <= vehicle_load)',
  `route_id` VARCHAR(32) NOT NULL COMMENT '套用路线ID',
  `via_road` VARCHAR(255) DEFAULT '' COMMENT '途经道路说明',
  `expected_arrive_time` DATETIME DEFAULT NULL COMMENT '预计到达时间（负责人上报运输安排时填写，表单单列）',
  `police_id` VARCHAR(32) DEFAULT NULL COMMENT '监管民警ID（本次押运的监管责任人，表单单列）',
  `remark` VARCHAR(255) DEFAULT '' COMMENT '运输备注',
  `stops_json` JSON NOT NULL COMMENT '卸货点排序序列 [{seq, planId, siteId, arriveTime, status: 待到达/已到达}]',
  `checkpoints_json` JSON DEFAULT NULL COMMENT '打卡点完成状态 [{seq, name, checkTime, lng, lat, photoUrl}]',
  `depart_time` DATETIME DEFAULT NULL COMMENT '发车打点时间',
  `depart_lng` DECIMAL(10,6) DEFAULT NULL COMMENT '发车经度',
  `depart_lat` DECIMAL(10,6) DEFAULT NULL COMMENT '发车纬度',
  `finish_time` DATETIME DEFAULT NULL COMMENT '整趟全部卸货点到达闭环时间',
  `status` VARCHAR(16) NOT NULL DEFAULT '待发车' COMMENT '状态：待发车/运输中/部分到达/已到达/运输异常',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_trans_outbound` (`outbound_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='押运运输主单表';

-- 2.5 现场到场接收单 (D01-D06)
DROP TABLE IF EXISTS `t_bb_receive`;
CREATE TABLE `t_bb_receive` (
  `id` VARCHAR(32) NOT NULL COMMENT '接收单ID (如 RC1)',
  `transport_id` VARCHAR(32) NOT NULL COMMENT '运输单ID',
  `plan_id` VARCHAR(32) NOT NULL COMMENT '对应的计划ID',
  `site_id` VARCHAR(32) NOT NULL COMMENT '作业点ID',
  `safety_officer_id` VARCHAR(32) NOT NULL COMMENT '现场安全员ID',
  `arrive_time` DATETIME NOT NULL COMMENT '安全员确认的实际到达时间',
  `arrive_time_source` VARCHAR(16) NOT NULL DEFAULT 'MANUAL' COMMENT '时间来源：MANUAL(一期手动点击)',
  `items_verify_json` JSON NOT NULL COMMENT '逐项核量记录 [{goodsType, spec, sendQty, recvQty, diffQty, batchNo}]',
  `diff_flag` TINYINT NOT NULL DEFAULT 0 COMMENT '是否存在数量差异 (0-无, 1-有差异)',
  `diff_remark` VARCHAR(255) DEFAULT '' COMMENT '差异说明',
  `diff_photo_url` VARCHAR(255) DEFAULT '' COMMENT '差异现场拍照存证URL',
  `scene_photos_json` JSON DEFAULT NULL COMMENT '现场摆放/堆码/警戒区照片数组',
  `sign_url` VARCHAR(255) DEFAULT '' COMMENT '安全员手写签名URL',
  `to_storage_id` VARCHAR(32) DEFAULT '' COMMENT '暂存使用库ID (若入使用库)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_recv_plan` (`plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='现场到场接收与核量单表';

-- 2.6 爆破作业记录 (E01-E09)
DROP TABLE IF EXISTS `t_bb_blasting`;
CREATE TABLE `t_bb_blasting` (
  `id` VARCHAR(32) NOT NULL COMMENT '爆破单ID (如 BL1)',
  `plan_id` VARCHAR(32) NOT NULL COMMENT '作业计划ID',
  `supervisor_id` VARCHAR(32) NOT NULL COMMENT '安全监理人员ID',
  `blast_time` DATETIME NOT NULL COMMENT '起爆时间',
  `blast_method` VARCHAR(64) DEFAULT '电力起爆' COMMENT '爆破方式',
  `weather` VARCHAR(32) DEFAULT '' COMMENT '天气情况（晴/雨/大风/雷电等，现场登记）',
  `out_storage_id` VARCHAR(32) DEFAULT '' COMMENT '炸药领取库房ID（本次实际发料的库房）',
  `blast_effect` VARCHAR(64) DEFAULT '良好' COMMENT '爆破效果',
  `blast_result` VARCHAR(32) NOT NULL COMMENT '结果状态：NORMAL_NO_RETURN(正常无返库)/NORMAL_RETURN(正常有返库)/ABNORMAL(异常)',
  `used_qty_json` JSON NOT NULL COMMENT '实际消耗量明细 [{goodsType, spec, usedQty}]',
  `used_zy_qty` DECIMAL(12,3) DEFAULT 0.000 COMMENT '炸药实际用量合计(kg，表单单列口径)',
  `used_lg_qty` DECIMAL(12,3) DEFAULT 0.000 COMMENT '雷管实际用量合计(发，表单单列口径)',
  `used_db_qty` DECIMAL(12,3) DEFAULT 0.000 COMMENT '导爆索实际用量合计(m，表单单列口径)',
  `blaster_ids` JSON DEFAULT NULL COMMENT '现场爆破员ID列表 (JSON Array，三大员在岗核验口径)',
  `safety_officer_ids` JSON DEFAULT NULL COMMENT '现场安全员ID列表 (JSON Array，三大员在岗核验口径)',
  `remark` VARCHAR(255) DEFAULT '' COMMENT '爆破作业备注',
  `co_verifier_ids` JSON NOT NULL COMMENT '共同核验人员ID数组 (技术员/安全员等 >=1人)',
  `supervisor_sign_url` VARCHAR(255) NOT NULL COMMENT '安全监理手写签名URL',
  `blind_flag` TINYINT NOT NULL DEFAULT 0 COMMENT '是否存在盲炮 (0-无, 1-有)',
  `blind_remark` VARCHAR(255) DEFAULT '' COMMENT '盲炮处理说明',
  `clear_scene_time` DATETIME DEFAULT NULL COMMENT '警戒解除清场时间',
  `clear_photos_json` JSON DEFAULT NULL COMMENT '人员撤离与清场留证照片',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_blast_plan` (`plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='爆破施工作业登记表';

-- 2.7 剩余物销毁登记 (E08/Q06)
DROP TABLE IF EXISTS `t_bb_destroy`;
CREATE TABLE `t_bb_destroy` (
  `id` VARCHAR(32) NOT NULL COMMENT '销毁登记ID (如 DS1)',
  `destroy_no` VARCHAR(64) NOT NULL COMMENT '销毁编号 (BBXH+yyyyMMdd+流水)',
  `plan_id` VARCHAR(32) NOT NULL COMMENT '关联计划ID',
  `supervisor_id` VARCHAR(32) NOT NULL COMMENT '登记监理ID',
  `items_json` JSON NOT NULL COMMENT '分品种销毁量明细 [{goodsType, spec, destroyQty}]',
  `destroy_reason` VARCHAR(255) NOT NULL COMMENT '销毁原因',
  `destroy_photos_json` JSON NOT NULL COMMENT '现场销毁凭证照片 (强制上传)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '登记时间',
  PRIMARY KEY (`id`),
  INDEX `idx_destroy_plan` (`plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='剩余物现场销毁登记表';

-- 2.8 剩余物退库单 (E02-E03/Q07，可跨日一次退完回原库)
DROP TABLE IF EXISTS `t_bb_return`;
CREATE TABLE `t_bb_return` (
  `id` VARCHAR(32) NOT NULL COMMENT '退库单ID (如 RT1)',
  `return_no` VARCHAR(64) NOT NULL COMMENT '退库单号 (BBTK+yyyyMMdd+流水)',
  `plan_id` VARCHAR(32) NOT NULL COMMENT '关联原作业计划ID',
  `outbound_id` VARCHAR(32) NOT NULL COMMENT '关联原出库单ID',
  `target_storage_id` VARCHAR(32) NOT NULL COMMENT '回库目标销售库ID (必须原库退回)',
  `return_items_json` JSON NOT NULL COMMENT '退库物品明细 [{goodsType, spec, returnQty, batchNo}]',
  `supervisor_id` VARCHAR(32) NOT NULL COMMENT '发起监理ID',
  `escort_id` VARCHAR(32) NOT NULL COMMENT '负责反向押送的押运员ID',
  `driver_id` VARCHAR(32) NOT NULL COMMENT '返程驾驶员ID',
  `escort_scan_confirmed` TINYINT NOT NULL DEFAULT 0 COMMENT '押运员扫码确认退库状态 (0-未确认, 1-已确认)',
  `escort_scan_time` DATETIME DEFAULT NULL COMMENT '押运员扫码确认发车时间',
  `keeper_id` VARCHAR(32) DEFAULT NULL COMMENT '入库核销库管员ID',
  `keeper_confirm_time` DATETIME DEFAULT NULL COMMENT '库房核销入库时间 (库存回加)',
  `status` VARCHAR(16) NOT NULL DEFAULT '待返库' COMMENT '状态：待返库/返程中/已核销入库',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_return_plan` (`plan_id`),
  INDEX `idx_return_outbound` (`outbound_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='剩余物品退库业务主表';

-- 2.9 民警远程核验记录 (F01-F05)
DROP TABLE IF EXISTS `t_bb_verify`;
CREATE TABLE `t_bb_verify` (
  `id` VARCHAR(32) NOT NULL COMMENT '核验记录ID (如 VF1)',
  `plan_id` VARCHAR(32) NOT NULL COMMENT '关联计划ID',
  `police_id` VARCHAR(32) NOT NULL COMMENT '核验民警ID',
  `check_items_json` JSON NOT NULL COMMENT '五项核验清单结果 [{name: "证照齐全/警戒设置/人员在岗/监控在线/台账一致", passed: true/false}]',
  `four_balance_flag` TINYINT NOT NULL DEFAULT 1 COMMENT '四量平衡比对结论 (1-平衡, 0-不平衡)',
  `conclusion` VARCHAR(16) NOT NULL COMMENT '核验结论：通过/责令限期整改/移交查处',
  `remark` VARCHAR(255) DEFAULT '' COMMENT '核验备注说明',
  `rectify_id` VARCHAR(32) DEFAULT NULL COMMENT '关联整改单ID (若有)',
  `verify_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '核验签署时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_verify_plan` (`plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='民警远程数据核验记录表';

-- -----------------------------------------------------------------------------
-- 3. 公安分级检查与整改 (Inspection & Supervision)
-- -----------------------------------------------------------------------------

-- 3.1 检查分级阈值配置 (K04)
DROP TABLE IF EXISTS `t_bb_check_rule`;
CREATE TABLE `t_bb_check_rule` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '主键',
  `min_qty` DECIMAL(10,2) NOT NULL COMMENT '作业量区间下限(kg)',
  `max_qty` DECIMAL(10,2) NOT NULL COMMENT '作业量区间上限(kg)',
  `level_name` VARCHAR(32) NOT NULL COMMENT '分级名称：抽查 / 工区警务室到场 / 治安大队到场',
  `arrive_unit` VARCHAR(64) NOT NULL COMMENT '执行到场监管单位',
  `tnt_ratio` DECIMAL(6,4) NOT NULL DEFAULT 0.0010 COMMENT '雷管折算TNT当量系数 (默认1发=0.001kg)',
  `is_active` TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='公安分级检查阈值规则配置表';

-- 3.2 环节公安检查单 (K01-K06)
DROP TABLE IF EXISTS `t_bb_check`;
CREATE TABLE `t_bb_check` (
  `id` VARCHAR(32) NOT NULL COMMENT '检查单ID (如 CK1)',
  `plan_id` VARCHAR(32) NOT NULL COMMENT '关联计划ID',
  `node_name` VARCHAR(32) NOT NULL COMMENT '检查环节：出库/运输/到场/爆破/退库/核验',
  `level_name` VARCHAR(32) NOT NULL COMMENT '检查等级：抽查/警务室到场/治安大队到场',
  `inspector_id` VARCHAR(32) NOT NULL COMMENT '检查人ID',
  `check_items_json` JSON NOT NULL COMMENT '检查清单及得分明细',
  `photos_json` JSON NOT NULL COMMENT '现场检查照片凭证 (强制上传)',
  `result` VARCHAR(16) NOT NULL COMMENT '检查结果：合格/限期整改/停工查处',
  `arrive_signed_time` DATETIME DEFAULT NULL COMMENT '现场到场签到时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发起检查时间',
  PRIMARY KEY (`id`),
  INDEX `idx_check_plan` (`plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='公安环节检查单表';

-- 3.3 限期整改闭环单 (K06)
DROP TABLE IF EXISTS `t_bb_rectify`;
CREATE TABLE `t_bb_rectify` (
  `id` VARCHAR(32) NOT NULL COMMENT '整改单ID (如 RC01)',
  `check_id` VARCHAR(32) NOT NULL COMMENT '关联检查单ID',
  `plan_id` VARCHAR(32) NOT NULL COMMENT '关联计划ID',
  `issue_desc` VARCHAR(255) NOT NULL COMMENT '隐患或问题描述',
  `deadline` DATETIME NOT NULL COMMENT '整改截止时限',
  `rectify_result` VARCHAR(255) DEFAULT '' COMMENT '整改落实结果说明',
  `rectify_photos_json` JSON DEFAULT NULL COMMENT '整改后复核拍照',
  `status` VARCHAR(16) NOT NULL DEFAULT '待整改' COMMENT '状态：待整改/待复核/已销号/逾期未改',
  `confirm_police_id` VARCHAR(32) DEFAULT NULL COMMENT '销号复查民警ID',
  `confirm_time` DATETIME DEFAULT NULL COMMENT '销号时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='问题限期整改与闭环表';

-- -----------------------------------------------------------------------------
-- 4. 全链路留痕、证据审计与系统日志 (Audit & Evidence)
-- -----------------------------------------------------------------------------

-- 4.1 全链路节点操作流水与电子凭据 (I07/Q15)
DROP TABLE IF EXISTS `t_bb_node_log`;
CREATE TABLE `t_bb_node_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `plan_id` VARCHAR(32) NOT NULL COMMENT '作业计划ID',
  `node` VARCHAR(32) NOT NULL COMMENT '业务节点：计划填报/监管手签/负责人审核/民警审核/出库登记/出库复核/押运签收/发车打点/途中打卡/手动到达/到场核量/爆破登记/监理手签/销毁登记/退库扫码/退库核销/民警核验',
  `action` VARCHAR(64) NOT NULL COMMENT '操作动作描述',
  `operator_id` VARCHAR(32) NOT NULL COMMENT '操作人ID',
  `operator_name` VARCHAR(32) NOT NULL COMMENT '操作人姓名',
  `operator_role` VARCHAR(32) NOT NULL COMMENT '操作人角色',
  `lng` DECIMAL(10,6) DEFAULT NULL COMMENT '操作发生经度',
  `lat` DECIMAL(10,6) DEFAULT NULL COMMENT '操作发生纬度',
  `sign_url` VARCHAR(255) DEFAULT '' COMMENT '手写签名图片路径(如有)',
  `photo_urls_json` JSON DEFAULT NULL COMMENT '现场照片URL数组(如有)',
  `id_card_verify` VARCHAR(32) DEFAULT '' COMMENT '关键环节身份证核验证据',
  `hash_sha256` VARCHAR(64) DEFAULT '' COMMENT '防篡改内容摘要哈希',
  `op_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间戳',
  PRIMARY KEY (`id`),
  INDEX `idx_node_plan` (`plan_id`, `op_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='全链路节点流转日志与电子证据表';

-- 4.2 主数据维护审计留痕 (J12/L02)
DROP TABLE IF EXISTS `t_bb_master_log`;
CREATE TABLE `t_bb_master_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `data_type` VARCHAR(32) NOT NULL COMMENT '主数据类别：民爆公司/作业点/库房/四大员/项目备案/负责人/车辆/路线',
  `data_id` VARCHAR(32) NOT NULL COMMENT '主数据业务标识',
  `action` VARCHAR(16) NOT NULL COMMENT '维护动作：新增/编辑修正/停用/恢复',
  `operator_id` VARCHAR(32) NOT NULL COMMENT '操作管理员ID',
  `operator_name` VARCHAR(32) NOT NULL COMMENT '操作人姓名',
  `op_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '维护发生时间',
  `content_diff_json` JSON DEFAULT NULL COMMENT '变更字段前值后值差量快照',
  `remark` VARCHAR(255) DEFAULT '' COMMENT '维护备注',
  PRIMARY KEY (`id`),
  INDEX `idx_master_type_id` (`data_type`, `data_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='8类主数据维护留痕表';

-- 4.3 每日监管统计快照表 (供 PC 管理后台及大屏看板快速提取)
DROP TABLE IF EXISTS `t_bb_stat_daily`;
CREATE TABLE `t_bb_stat_daily` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
  `stat_date` DATE NOT NULL COMMENT '统计日期',
  `workarea_id` VARCHAR(32) NOT NULL DEFAULT 'ALL' COMMENT '工区编码 (ALL表示全域汇总)',
  `plan_count` INT NOT NULL DEFAULT 0 COMMENT '当日计划上报总数',
  `outbound_qty_kg` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '出库炸药当量总量(kg)',
  `closed_count` INT NOT NULL DEFAULT 0 COMMENT '全链路闭环完成数',
  `closing_rate` DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '闭环率(%)',
  `exception_count` INT NOT NULL DEFAULT 0 COMMENT '产生差异或异常数',
  `check_count` INT NOT NULL DEFAULT 0 COMMENT '公安检查完成人次',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_stat_date_area` (`stat_date`, `workarea_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='监管日报汇总表';

-- -----------------------------------------------------------------------------
-- 5. 表单专有对象（对应《民爆管理表单.et》第 9 项及表单口径视图）
-- -----------------------------------------------------------------------------

-- 5.1 亡人事件登记表（表单第 9 项：序号/时间/地点/姓名/身份证号/事件原因/备注）
DROP TABLE IF EXISTS `t_bb_accident`;
CREATE TABLE `t_bb_accident` (
  `id` VARCHAR(32) NOT NULL COMMENT '事件ID (如 AC1)',
  `event_time` DATETIME NOT NULL COMMENT '事件发生时间',
  `place` VARCHAR(255) NOT NULL COMMENT '事件发生地点（详细描述）',
  `site_id` VARCHAR(32) DEFAULT '' COMMENT '关联作业点ID（若发生在作业点）',
  `plan_id` VARCHAR(32) DEFAULT '' COMMENT '关联作业计划ID（若可对应）',
  `person_id` VARCHAR(32) DEFAULT '' COMMENT '涉事人员ID（关联 t_bb_person，可为空）',
  `person_name` VARCHAR(32) NOT NULL COMMENT '涉事人员姓名（表单原文姓名）',
  `id_no` VARCHAR(128) NOT NULL COMMENT '涉事人员身份证号 (AES-256 加密存储)',
  `reason` VARCHAR(255) NOT NULL COMMENT '事件原因',
  `remark` VARCHAR(255) DEFAULT '' COMMENT '备注',
  `report_unit` VARCHAR(128) DEFAULT '' COMMENT '上报单位',
  `status` VARCHAR(16) NOT NULL DEFAULT '已登记' COMMENT '状态：已登记/调查中/已结案',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '登记时间',
  PRIMARY KEY (`id`),
  INDEX `idx_accident_time` (`event_time`),
  INDEX `idx_accident_site` (`site_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='亡人事件登记表';

-- 5.2 库房表单口径视图（表单单列“存量/员工人数/供给单位”均由视图一次取齐）
CREATE OR REPLACE VIEW `v_bb_storage_form` AS
SELECT s.`id` AS `序号`,
       s.`name` AS `库房名称`,
       s.`addr` AS `所在地址`,
       s.`built_at` AS `建库时间`,
       s.`area_sqm` AS `库房面积`,
       s.`type` AS `使用性质`,
       s.`daily_use_limit` AS `日均用量`,
       (SELECT IFNULL(SUM(i.`stock_qty`),0) FROM `t_bb_inventory` i
         WHERE i.`storage_id`=s.`id` AND i.`goods_type`='zy') AS `炸药存量`,
       (SELECT IFNULL(SUM(i.`stock_qty`),0) FROM `t_bb_inventory` i
         WHERE i.`storage_id`=s.`id` AND i.`goods_type`='lg') AS `雷管存量`,
       (SELECT IFNULL(SUM(i.`stock_qty`),0) FROM `t_bb_inventory` i
         WHERE i.`storage_id`=s.`id` AND i.`goods_type`='db') AS `导爆索存量`,
       s.`staff_num` AS `员工人数`,
       s.`supply_unit` AS `供给单位`
FROM `t_bb_storage` s;

-- 5.3 今日爆破点表单口径视图（15 列一次取齐，含点位/责任单位/领取库房/车辆派生）
CREATE OR REPLACE VIEW `v_bb_blasting_form` AS
SELECT b.`id` AS `序号`,
       IFNULL(b.`blast_time`, p.`plan_start`) AS `爆破日期与时间`,
       st.`name` AS `爆破地点`,
       c.`name` AS `爆破责任单位`,
       b.`blast_method` AS `爆破类型`,
       b.`weather` AS `天气情况`,
       b.`used_zy_qty` AS `总用药量`,
       b.`used_lg_qty` AS `雷管用量`,
       b.`used_db_qty` AS `导爆索用量`,
       s2.`name` AS `炸药领取库房名称`,
       b.`supervisor_id` AS `安全监理`,
       b.`blaster_ids` AS `爆破员`,
       b.`safety_officer_ids` AS `安全员`,
       t.`vehicle_id` AS `民爆运输车辆`,
       b.`remark` AS `备注`
FROM `t_bb_blasting` b
LEFT JOIN `t_bb_plan` p ON p.`id`=b.`plan_id`
LEFT JOIN `t_bb_site` st ON st.`id`=p.`site_id`
LEFT JOIN `t_bb_project` pr ON pr.`id`=p.`project_id`
LEFT JOIN `t_bb_company` c ON c.`id`=pr.`company_id`
LEFT JOIN `t_bb_storage` s2 ON s2.`id`=IFNULL(NULLIF(b.`out_storage_id`,''), p.`out_storage_id`)
LEFT JOIN `t_bb_receive` r ON r.`plan_id`=b.`plan_id`
LEFT JOIN `t_bb_transport` t ON t.`id`=r.`transport_id`;

-- 5.4 主界面展示数据视图（表单第 1 项的 9 项指标）
CREATE OR REPLACE VIEW `v_bb_dashboard` AS
SELECT
  (SELECT IFNULL(SUM(`stock_qty`),0) FROM `t_bb_inventory` WHERE `goods_type`='zy') AS `炸药总存量`,
  (SELECT COUNT(*) FROM `t_bb_storage` WHERE `status`='生效') AS `库房`,
  (SELECT COUNT(*) FROM `t_bb_company` WHERE `status`='生效') AS `爆破公司`,
  (SELECT IFNULL(SUM(`stock_qty`),0) FROM `t_bb_inventory` WHERE `goods_type`='db') AS `导爆索总数`,
  (SELECT IFNULL(SUM(`stock_qty`),0) FROM `t_bb_inventory` WHERE `goods_type`='lg') AS `雷管总数`,
  (SELECT COUNT(*) FROM `t_bb_person` WHERE `role`='爆破员') AS `爆破员总数`,
  (SELECT COUNT(*) FROM `t_bb_person` WHERE `role`='安全员') AS `安全员总数`,
  (SELECT COUNT(*) FROM `t_bb_person` WHERE `role`='保管员') AS `库管员总数`,
  (SELECT COUNT(DISTINCT `site_id`) FROM `t_bb_plan` WHERE DATE(`plan_start`)=CURDATE()) AS `今日爆破点`;


