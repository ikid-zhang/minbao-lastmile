/**
 * 业务演示种子重建脚本（一次性 / 可重复执行）
 * 背景：/api/reset 会清空业务单据，主数据保留；本脚本按演示口径重建 3 条计划及其
 * 出库 / 运输 / 接收 / 爆破 / 退库 / 节点日志链路，落 SQLite 与 JSON 快照。
 * 用法：node --experimental-sqlite server/seed-business.js
 */
const path = require('path')
const { loadDB, saveDB } = require(path.join(__dirname, 'db.js'))

const now = Date.now()
const ts = (min) => now - min * 60 * 1000

const zy = (qty) => ({ goods: 'zy', spec: '2号岩石乳化炸药', qty, batch: 'ZY-2026-B210' })
const lg = (qty) => ({ goods: 'lg', spec: '8#工业电雷管', qty, batch: 'ZY-2026-B211' })
const zyItem = (planQty) => ({ goodsType: 'zy', spec: '2号岩石乳化炸药', unit: 'kg', planQty })
const lgItem = (planQty) => ({ goodsType: 'lg', spec: '8#工业电雷管', unit: '发', planQty })

const plans = [
  {
    id: 'PL9', planNo: 'BBJH20261113010', project: 'PR1', workarea: 'WA1', site: 'Z1',
    sitePlans: [{ site: 'Z1', items: [zy(100), lg(100)] }],
    items: [zyItem(100), lgItem(100)],
    planStart: '2026-11-14 14:30:00', planEnd: '2026-11-14 15:30:00',
    officer: 'PE2105', supervisor: 'PE8946', applicant: 'P7', surveyor: 'P7',
    createdAt: '2026-11-13 12:30:30', status: '待运输', auditStatus: '通过', tier: '抽查',
    exceptionFlag: false, remark: '', projectId: 'PR1', workareaId: 'WA1', siteId: 'Z1',
    surveyorId: 'P7', applicantId: 'P7', planKg: 100.1, outStorage: 'S2',
    regRemark: '同意', vehicle: 'V1', escort: 'P5', route: 'R1',
  },
  {
    id: 'PL10', planNo: 'BBJH20261113011', project: 'PR1', workarea: 'WA1', site: 'Z1',
    sitePlans: [{ site: 'Z1', items: [zy(100), lg(100)] }],
    items: [zyItem(100), lgItem(100)],
    planStart: '2026-11-14 15:31:00', planEnd: '2026-11-14 16:31:00',
    officer: 'PE2105', supervisor: 'PE8946', applicant: 'P1', surveyor: 'P7',
    createdAt: '2026-11-13 12:40:30', status: '待核验', auditStatus: '通过', tier: '抽查',
    exceptionFlag: false, remark: '', projectId: 'PR1', workareaId: 'WA1', siteId: 'Z1',
    surveyorId: 'P7', applicantId: 'P1', planKg: 100.1, outStorage: 'S2',
    regRemark: '同意', vehicle: 'V1', escort: 'P5', route: 'R1',
  },
  {
    id: 'PL11', planNo: 'BBJH20261113012', project: 'PR1', workarea: 'WA1', site: 'Z1',
    sitePlans: [{ site: 'Z1', items: [zy(50), lg(50)] }],
    items: [zyItem(50), lgItem(50)],
    planStart: '2026-11-14 17:43:00', planEnd: '2026-11-14 18:43:00',
    officer: 'PE2105', supervisor: 'PE8946', applicant: 'P1', surveyor: 'P7',
    createdAt: '2026-11-13 12:50:30', status: '待核验', auditStatus: '通过', tier: '抽查',
    exceptionFlag: false, remark: '', projectId: 'PR1', workareaId: 'WA1', siteId: 'Z1',
    surveyorId: 'P7', applicantId: 'P1', planKg: 50.05, outStorage: 'S2',
    regRemark: '同意', vehicle: 'V1', escort: 'P5', route: 'R1',
  },
]

const outbounds = [
  {
    id: 'OB6', outNo: 'BBCK20261113901', storageId: 'S2', planIds: ['PL9'], totalKg: 100.1,
    plans: [{ plan: 'PL9', site: 'Z1', items: [zy(100), lg(100)] }],
    items: [{ goodsType: 'zy', spec: '2号岩石乳化炸药', qty: 100 }, { goodsType: 'lg', spec: '8#工业电雷管', qty: 100 }],
    registrantId: 'P4', regSignUrl: 'mockRegSign.png', regTime: '2026-11-14 13:50:00',
    reviewerId: 'P9', revSignUrl: 'mockRevSign.png', revTime: '2026-11-14 13:58:00', status: '待签收',
    createdAt: '2026-11-14 13:50:00',
  },
  {
    id: 'OB7', outNo: 'BBCK20261113902', storageId: 'S2', planIds: ['PL10', 'PL11'], totalKg: 150.15,
    plans: [
      { plan: 'PL10', site: 'Z1', items: [zy(100), lg(100)] },
      { plan: 'PL11', site: 'Z1', items: [zy(50), lg(50)] },
    ],
    items: [{ goodsType: 'zy', spec: '2号岩石乳化炸药', qty: 150 }, { goodsType: 'lg', spec: '8#工业电雷管', qty: 150 }],
    registrantId: 'P4', regSignUrl: 'mockRegSign.png', regTime: '2026-11-14 14:10:00',
    reviewerId: 'P9', revSignUrl: 'mockRevSign.png', revTime: '2026-11-14 14:18:00', status: '待发车',
    createdAt: '2026-11-14 14:10:00',
  },
]

const transports = [
  { id: 'TR5', outboundId: 'OB7', outbound: 'OB7', plan: 'PL10', vehicleId: 'V1', vehiclePlate: '川L·10295', vehicleLoad: 2000, driverId: 'D1', escortId: 'P5', routeId: 'R1', totalKg: 100.1, status: '已到达', departTime: '2026-11-14 14:30:00', createdAt: '2026-11-14 14:20:00' },
  { id: 'TR11', outboundId: 'OB7', outbound: 'OB7', plan: 'PL11', vehicleId: 'V1', vehiclePlate: '川L·10295', vehicleLoad: 2000, driverId: 'D1', escortId: 'P5', routeId: 'R1', totalKg: 50.05, status: '已到达', departTime: '2026-11-14 17:00:00', createdAt: '2026-11-14 16:50:00' },
  { id: 'TR6', outboundId: 'OB7', outbound: 'OB7', plan: 'PL11', vehicleId: 'V1', vehiclePlate: '川L·10295', vehicleLoad: 2000, driverId: 'D1', escortId: 'P5', routeId: 'R1', totalKg: 50.05, status: '已到达', departTime: '2026-11-14 17:05:00', createdAt: '2026-11-14 16:55:00' },
]

const receives = [
  { id: 'RC7', planId: 'PL10', plan: 'PL10', transportId: 'TR5', safetyOfficerId: 'P3', arriveTime: '2026-11-14 15:00:00', arriveTimeSource: 'MANUAL', items: [zyItem(100), lgItem(100)], diffFlag: 0, diffRemark: '', signUrl: 'mockSafetySign.png', createdAt: '2026-11-14 15:00:00' },
  { id: 'RC8', planId: 'PL11', plan: 'PL11', transportId: 'TR11', safetyOfficerId: 'P3', arriveTime: '2026-11-14 17:30:00', arriveTimeSource: 'MANUAL', items: [zyItem(50), lgItem(50)], diffFlag: 0, diffRemark: '', signUrl: 'mockSafetySign.png', createdAt: '2026-11-14 17:30:00' },
]

const blastings = [
  { id: 'BL9', planId: 'PL10', plan: 'PL10', supervisorId: 'P2', blastTime: '2026-11-14 15:40:00', blastResult: 'NORMAL_NO_RETURN', usedItems: [zyItem(100), lgItem(100)], coVerifierIds: ['P3', 'P6'], supervisorSignUrl: 'mockSupervisorSign.png', blindFlag: 0, createdAt: '2026-11-14 15:40:00' },
  { id: 'BL10', planId: 'PL11', plan: 'PL11', supervisorId: 'P2', blastTime: '2026-11-14 18:10:00', blastResult: 'NORMAL_RETURN', usedItems: [zyItem(50), lgItem(50)], coVerifierIds: ['P3', 'P6'], supervisorSignUrl: 'mockSupervisorSign.png', blindFlag: 0, createdAt: '2026-11-14 18:10:00' },
]

const returns = [
  { id: 'RT10', returnNo: 'BBTK20261113910', planId: 'PL11', plan: 'PL11', outboundId: 'OB7', targetStorageId: 'S2', items: [{ goodsType: 'zy', spec: '2号岩石乳化炸药', returnQty: 5 }, { goodsType: 'lg', spec: '8#工业电雷管', returnQty: 3 }], supervisorId: 'P2', escortId: 'P5', escortConfirmed: true, keeperConfirmed: true, status: '已核销入库', createdAt: '2026-11-14 18:20:00' },
  { id: 'RT9', returnNo: 'BBTK20261113909', planId: 'PL11', plan: 'PL11', outboundId: 'OB7', targetStorageId: 'S2', items: [{ goodsType: 'zy', spec: '2号岩石乳化炸药', returnQty: 2 }], supervisorId: 'P2', escortId: 'P5', escortConfirmed: true, keeperConfirmed: false, status: '待入库确认', createdAt: '2026-11-14 18:15:00' },
]

const nodeLogs = [
  ['PL9', 'BBJH20261113010', '计划', '测量技术员现场测量上报：测试第5个点位 100kg', '张明', 200],
  ['PL9', 'BBJH20261113010', '计划', '作业点安全监管 郑安 手签放行', '郑安', 190],
  ['PL9', 'BBJH20261113010', '计划', '项目负责人核实通过并安排运输', '陈志远', 180],
  ['PL9', 'BBJH20261113010', '出库', '第一库管员填报出库并签名，出库单置待复核', '钱有德', 170],
  ['PL9', 'BBJH20261113010', '出库', '第二库管员复核通过，库存扣减完成', '吴秀英', 160],
  ['PL10', 'BBJH20261113011', '计划', '测量技术员现场测量上报：测试第5个点位 100kg', '张明', 150],
  ['PL10', 'BBJH20261113011', '计划', '作业点安全监管 郑安 手签放行', '郑安', 140],
  ['PL10', 'BBJH20261113011', '计划', '项目负责人审核提交计划，绑定出库库房与责任区', '陈志远', 130],
  ['PL10', 'BBJH20261113011', '出库', '双人复核通过，库存已成功扣除', '吴秀英', 120],
  ['PL10', 'BBJH20261113011', '运输', '押运员扫码签收，绑定车辆及路线，载重校验通过', '孙立冬', 110],
  ['PL10', 'BBJH20261113011', '运输', '押运车辆正式启程发车，记录发车时间与定位', '孙立冬', 100],
  ['PL10', 'BBJH20261113011', '到场', '现场安全员确认到场并逐项核量完成，账实相符', '赵铁柱', 90],
  ['PL10', 'BBJH20261113011', '爆破', '爆破登记（正常无返库），监理已手签', '李建国', 80],
  ['PL11', 'BBJH20261113012', '计划', '测量技术员现场测量上报：青龙山隧道进口作业点 50kg', '张明', 70],
  ['PL11', 'BBJH20261113012', '出库', '双人复核通过，库存已成功扣除', '吴秀英', 60],
  ['PL11', 'BBJH20261113012', '运输', '押运员扫码签收，绑定车辆及路线', '孙立冬', 50],
  ['PL11', 'BBJH20261113012', '到场', '现场安全员确认到场并逐项核量完成，账实相符', '赵铁柱', 40],
  ['PL11', 'BBJH20261113012', '爆破', '爆破登记（正常有返库），监理已手签', '李建国', 30],
  ['PL11', 'BBJH20261113012', '退库', '安全监理发起剩余物退库申请', '李建国', 20],
  ['PL11', 'BBJH20261113012', '退库', '押运员扫码确认退库品项及数量，启动反向押送', '孙立冬', 10],
].map(([plan, planNo, node, action, who, min], i) => ({
  id: 'LG' + (i + 1), plan, planNo, node, action, who, time: ts(min),
}))

const db = loadDB()
db.plans = plans
db.outbounds = outbounds
db.transports = transports
db.receives = receives
db.blastings = blastings
db.destroys = []
db.returns = returns
db.verifies = []
db.checks = []
db.nodeLogs = nodeLogs
saveDB(db)

console.log(`业务种子已重建：plans=${plans.length} outbounds=${outbounds.length} transports=${transports.length} receives=${receives.length} blastings=${blastings.length} returns=${returns.length} nodeLogs=${nodeLogs.length}`)
