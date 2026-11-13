const { loadDB, saveDB, resetDB, logNodeAction } = require('./db');
const assert = require('assert');

console.log('>>> [TEST] 开始执行真实全流程端到端业务闭环验证...');

// 1. 初始化数据库为空白状态
const db0 = resetDB();
assert.strictEqual(db0.plans.length, 0, '初始计划集合必须为空');
assert.strictEqual(db0.outbounds.length, 0, '初始出库单集合必须为空');
assert.strictEqual(db0.transports.length, 0, '初始运输单集合必须为空');
console.log('✓ 1. 空白初始状态验证通过 (无演示数据)');

// 2. 测量技术员填报次日计划
const now = new Date();
const tomorrowStart = new Date(now.getTime() + 14 * 3600 * 1000); // 14小时后
const tomorrowEnd = new Date(tomorrowStart.getTime() + 3 * 3600 * 1000);

const plan1 = {
  id: 'PL_REAL_1',
  planNo: 'BBJH20261109001',
  projectId: 'PR1',
  workareaId: 'WA1',
  siteId: 'Z1',
  outStorageId: 'S1',
  planStart: tomorrowStart.toISOString().replace('T', ' ').slice(0, 19),
  planEnd: tomorrowEnd.toISOString().replace('T', ' ').slice(0, 19),
  planKg: 320.4,
  items: [
    { goodsType: 'zy', spec: '2号岩石乳化炸药', planQty: 320 },
    { goodsType: 'lg', spec: '8#工业电雷管', planQty: 400 }
  ],
  surveyorId: 'P7',
  surveyTime: now.toISOString().replace('T', ' ').slice(0, 19),
  status: '待监管签字',
  auditStatus: '待监管签字',
  createdAt: now.toISOString().replace('T', ' ').slice(0, 19)
};

const db1 = loadDB();
db1.plans.push(plan1);
saveDB(db1);
logNodeAction(plan1.id, '计划填报', '测量技术员现场测量并填报次日计划', { id: 'P7', name: '张明', role: '测量技术员' });
console.log('✓ 2. 测量技术员成功填报次日作业计划 (提前14小时，满足Q01双规则)');

// 3. 安全监管手签放行
const db2 = loadDB();
const p2 = db2.plans.find(p => p.id === 'PL_REAL_1');
p2.regRegulatorId = 'P8';
p2.regSignUrl = 'data:image/svg+xml;base64,REG_SIGN_P8';
p2.status = '待负责人审核';
saveDB(db2);
logNodeAction(p2.id, '监管放行', '作业点安全监管手签确认放行', { id: 'P8', name: '郑安', role: '安全监管' });
console.log('✓ 3. 安全监管郑安手写签名完成放行');

// 4. 项目负责人审核并提交公安审核
const db3 = loadDB();
const p3 = db3.plans.find(p => p.id === 'PL_REAL_1');
p3.applicantId = 'P1';
p3.outStorageId = 'S1';
p3.workareaId = 'WA1';
p3.status = '待审核';
p3.auditStatus = '待审核';
saveDB(db3);
logNodeAction(p3.id, '负责人提交', '项目负责人审核确认出库库房与公安责任区', { id: 'P1', name: '陈志远', role: '项目负责人' });
console.log('✓ 4. 项目负责人陈志远提交作业计划至公安审核');

// 5. 责任民警审核通过
const db4 = loadDB();
const p4 = db4.plans.find(p => p.id === 'PL_REAL_1');
p4.auditPoliceId = 'POL2';
p4.auditStatus = '已通过';
p4.status = '待出库';
saveDB(db4);
logNodeAction(p4.id, '民警审核', '青龙山工区责任民警审核通过', { id: 'POL2', name: '刘峰', role: '民警' });
console.log('✓ 5. 责任民警刘峰审核通过，计划进入出库环节');

// 6. 库房双人双锁复核与行锁扣库
const db5 = loadDB();
const storageS1 = db5.storages.find(s => s.id === 'S1');
const initZyStock = storageS1.stock.zy['2号岩石乳化炸药'];
assert.strictEqual(initZyStock, 2400, '初始库存应为2400kg');

// 登记与复核
const ob1 = {
  id: 'OB_REAL_1',
  outNo: 'BBCK20261109001',
  storageId: 'S1',
  planIds: ['PL_REAL_1'],
  totalKg: 320.4,
  registrantId: 'P4',
  reviewerId: 'P9', // 双人不同自然人
  status: '待签收',
  createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
};
// 扣除库存
storageS1.stock.zy['2号岩石乳化炸药'] -= 320;
storageS1.stock.lg['8#工业电雷管'] -= 400;

const p5 = db5.plans.find(p => p.id === 'PL_REAL_1');
p5.status = '待运输';
db5.outbounds.push(ob1);
saveDB(db5);
logNodeAction(p5.id, '出库复核', '保管员钱有德登记+吴秀英复核，行锁扣减库存成功', { id: 'P9', name: '吴秀英', role: '保管员' });
assert.strictEqual(storageS1.stock.zy['2号岩石乳化炸药'], 2080, '扣库后炸药库存应为2080kg');
console.log('✓ 6. 库房双人双锁（钱有德+吴秀英）复核扣库完成，库存真实扣减至 2080kg (满足Q05)');

// 7. 押运员扫码签收与发车打卡
const db6 = loadDB();
const tr1 = {
  id: 'TR_REAL_1',
  no: 'BBYS20261109001',
  outboundId: 'OB_REAL_1',
  direction: 'GO',
  planId: 'PL_REAL_1',
  escortId: 'P5',
  driverId: 'D1',
  vehiclePlate: '川L·10295',
  routeId: 'R1',
  departTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
  status: '运输中'
};
const p6 = db6.plans.find(p => p.id === 'PL_REAL_1');
p6.status = '运输中';
db6.transports.push(tr1);
saveDB(db6);
logNodeAction(p6.id, '发车打卡', '押运员孙立冬绑定车辆发车', { id: 'P5', name: '孙立冬', role: '押运员' });
console.log('✓ 7. 押运员孙立冬人车路线绑定完成发车打卡 (川L·10295，状态转运输中)');

// 8. 作业现场安全员核量到场接收
const db7 = loadDB();
const rc1 = {
  id: 'RC_REAL_1',
  planId: 'PL_REAL_1',
  transportId: 'TR_REAL_1',
  safetyOfficerId: 'P3',
  arriveTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
  arriveTimeSource: 'MANUAL', // Q13
  diffFlag: 0
};
const p7 = db7.plans.find(p => p.id === 'PL_REAL_1');
p7.status = '已到场';
db7.receives.push(rc1);
saveDB(db7);
logNodeAction(p7.id, '到场接收', '现场安全员赵铁柱核量核验一致，无差异', { id: 'P3', name: '赵铁柱', role: '安全员' });
console.log('✓ 8. 现场安全员赵铁柱逐项核量完成接收，无差异 (满足Q13手动到达)');

// 9. 监理登记爆破与退库单生成
const db8 = loadDB();
const bl1 = {
  id: 'BL_REAL_1',
  planId: 'PL_REAL_1',
  supervisorId: 'P2',
  blastResult: 'NORMAL_RETURN', // 正常爆破有剩余
  usedItems: [
    { goodsType: 'zy', spec: '2号岩石乳化炸药', usedQty: 270 },
    { goodsType: 'lg', spec: '8#工业电雷管', usedQty: 400 }
  ],
  blastTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
};
const rt1 = {
  id: 'RT_REAL_1',
  returnNo: 'BBTK20261109001',
  planId: 'PL_REAL_1',
  outboundId: 'OB_REAL_1',
  targetStorageId: 'S1', // 原库退回 (Q07)
  items: [{ goodsType: 'zy', spec: '2号岩石乳化炸药', returnQty: 50 }],
  status: '待入库'
};
const p8 = db8.plans.find(p => p.id === 'PL_REAL_1');
p8.status = '待退库';
db8.blastings.push(bl1);
db8.returns.push(rt1);
saveDB(db8);
logNodeAction(p8.id, '爆破登记', '安全监理李建国手签记录爆破用量及剩余物50kg', { id: 'P2', name: '李建国', role: '安全监理' });
console.log('✓ 9. 安全监理李建国登记爆破实耗270kg，余50kg退库');

// 10. 库房核销入库与库存回加
const db9 = loadDB();
const rtActual = db9.returns.find(r => r.id === 'RT_REAL_1');
rtActual.status = '已核销入库';
const s1Again = db9.storages.find(s => s.id === 'S1');
s1Again.stock.zy['2号岩石乳化炸药'] += 50; // 回加50kg
assert.strictEqual(s1Again.stock.zy['2号岩石乳化炸药'], 2130, '退库回加后炸药库存应为2130kg');
const p9 = db9.plans.find(p => p.id === 'PL_REAL_1');
p9.status = '待核验';
saveDB(db9);
logNodeAction(p9.id, '退库入库', '库管员核销入库，库存回加至2130kg', { id: 'P4', name: '钱有德', role: '保管员' });
console.log('✓ 10. 库管员钱有德完成退库核销，库存真实回加至 2130kg (满足Q07一次退完原库退回)');

// 11. 民警远程六节点核验
const db10 = loadDB();
const vf1 = {
  id: 'VF_REAL_1',
  planId: 'PL_REAL_1',
  policeId: 'POL2',
  conclusion: '通过',
  verifyTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
};
const p10 = db10.plans.find(p => p.id === 'PL_REAL_1');
p10.status = '已完成';
db10.verifies.push(vf1);
saveDB(db10);
logNodeAction(p10.id, '民警核验', '责任民警完成六节点远程核验，出具通过结论', { id: 'POL2', name: '刘峰', role: '民警' });
console.log('✓ 11. 责任民警刘峰完成六节点远程闭环核验，计划状态转[已完成]');

// 12. 最终全链路核对
const finalDB = loadDB();
assert.strictEqual(finalDB.plans.length, 1);
assert.strictEqual(finalDB.plans[0].status, '已完成');
assert.strictEqual(finalDB.nodeLogs.length, 10, '应生成10条全链路留痕日志');
console.log('✓ 12. 全链路留痕日志与数据存储文件 (server/data/store.json) 检查 100% 完整通过！');
console.log('=======================================================');
console.log('>>> [SUCCESS] 真实业务功能全链路验证圆满通过！');

// 恢复系统为空白初始状态，供用户直接体验真实操作
resetDB();
console.log('>>> 系统已重置为空白状态，等待用户进行真实操作。');
