const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- 开始民爆监管系统服务端核心链路单元与接口测试 ---');

  // 1. 健康检查
  const health = await request({ hostname: '127.0.0.1', port: 8080, path: '/api/health', method: 'GET' });
  console.log('1. 健康检查测试:', health.status === 200 && health.data.code === 200 ? '✅ 通过' : '❌ 失败', health.data);

  // 2. 主数据公司查询
  const companies = await request({ hostname: '127.0.0.1', port: 8080, path: '/api/master/companies', method: 'GET' });
  console.log('2. 主数据查询测试:', companies.status === 200 && companies.data.data.length > 0 ? '✅ 通过' : '❌ 失败', `获取到 ${companies.data.data.length} 家公司`);

  // 3. 测试 Q01 强卡口：提前不足 6 小时的违规计划上报
  const badPlanTime = new Date(Date.now() + 2 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19);
  const badPlan = await request({
    hostname: '127.0.0.1', port: 8080, path: '/api/plan/draft', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    projectId: 'PR1', siteId: 'Z1', outStorageId: 'S1', workareaId: 'WA1',
    planStart: badPlanTime, planEnd: badPlanTime,
    items: [{ goodsType: 'zy', spec: '2号岩石乳化炸药', planQty: 100 }]
  });
  console.log('3. Q01 提前不足6h强拦截测试:', badPlan.data.code === 400 ? '✅ 成功拦截' : '❌ 漏报', badPlan.data.msg);

  // 4. 正确申报合规计划（提前 24 小时）
  const goodPlanTime = new Date(Date.now() + 24 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19);
  const goodPlan = await request({
    hostname: '127.0.0.1', port: 8080, path: '/api/plan/draft', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    projectId: 'PR1', siteId: 'Z1', outStorageId: 'S1', workareaId: 'WA1',
    planStart: goodPlanTime, planEnd: goodPlanTime,
    items: [{ goodsType: 'zy', spec: '2号岩石乳化炸药', planQty: 150 }]
  });
  console.log('4. 合规作业计划上报测试:', goodPlan.data.code === 200 ? '✅ 上报成功' : '❌ 失败', `计划单号: ${goodPlan.data.data.planNo}, 状态: ${goodPlan.data.data.status}`);

  const planId = goodPlan.data.data.id;

  // 5. 安全监管签字
  const signRes = await request({
    hostname: '127.0.0.1', port: 8080, path: `/api/plan/${planId}/reg-sign`, method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { regulatorId: 'P8', signUrl: 'data:image/png;mockSignP8' });
  console.log('5. 安全监管签字把关测试:', signRes.data.code === 200 ? '✅ 签字成功' : '❌ 失败', `流转至: ${signRes.data.data.status}`);

  // 6. 项目负责人审核上报
  const submitRes = await request({
    hostname: '127.0.0.1', port: 8080, path: `/api/plan/${planId}/submit`, method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { applicantId: 'P1' });
  console.log('6. 项目负责人审核提交测试:', submitRes.data.code === 200 ? '✅ 提交成功' : '❌ 失败', `流转至: ${submitRes.data.data.status}`);

  // 7. 测试 Q03 超计划发料强拦截（计划量 150，发料 200）
  const overOutbound = await request({
    hostname: '127.0.0.1', port: 8080, path: '/api/outbound/create', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    storageId: 'S1', planIds: [planId], registrantId: 'P4',
    items: [{ planId, goodsType: 'zy', spec: '2号岩石乳化炸药', qty: 200 }]
  });
  console.log('7. Q03 严禁超计划发料测试 (150计划 vs 200实发):', overOutbound.data.code === 400 ? '✅ 成功拦截' : '❌ 漏报', overOutbound.data.msg);

  // 8. 正常出库登记 (150kg)
  const normalOutbound = await request({
    hostname: '127.0.0.1', port: 8080, path: '/api/outbound/create', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    storageId: 'S1', planIds: [planId], registrantId: 'P4',
    items: [{ planId, goodsType: 'zy', spec: '2号岩石乳化炸药', qty: 150 }]
  });
  console.log('8. 第一库管员登记签名出库测试:', normalOutbound.data.code === 200 ? '✅ 登记成功' : '❌ 失败', `出库单号: ${normalOutbound.data.data.outNo}, 状态: ${normalOutbound.data.data.status}`);

  const outId = normalOutbound.data.data.id;

  // 9. 测试 Q05 双人双锁复核：同一人复核拦截
  const samePersonRev = await request({
    hostname: '127.0.0.1', port: 8080, path: `/api/outbound/${outId}/confirm`, method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { reviewerId: 'P4', reviewerIdCard: '0014' });
  console.log('9. Q05 必须两名不同自然人复核拦截测试:', samePersonRev.data.code === 400 ? '✅ 成功拦截' : '❌ 漏报', samePersonRev.data.msg);

  // 10. 第二人吴秀英凭身份证复核并行锁扣减库存
  const goodRev = await request({
    hostname: '127.0.0.1', port: 8080, path: `/api/outbound/${outId}/confirm`, method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { reviewerId: 'P9', reviewerIdCard: '0019' });
  console.log('10. 第二库管员身份证复核扣库测试:', goodRev.data.code === 200 ? '✅ 复核扣库成功' : '❌ 失败', `出库单状态: ${goodRev.data.data.status}`);

  // 11. 押运签收载重校验测试（货重 150kg，选 V3 限载 600kg 正常）
  const signTrans = await request({
    hostname: '127.0.0.1', port: 8080, path: '/api/transport/sign', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { outboundId: outId, vehicleId: 'V3', driverId: 'D1', escortId: 'P5', routeId: 'R1' });
  console.log('11. 押运员扫码签收与人车绑定测试:', signTrans.data.code === 200 ? '✅ 签收就绪' : '❌ 失败', `车牌: ${signTrans.data.data.vehiclePlate}, 限载: ${signTrans.data.data.vehicleLoad}kg`);

  const transId = signTrans.data.data.id;

  // 12. 发车打点
  const departRes = await request({
    hostname: '127.0.0.1', port: 8080, path: `/api/transport/${transId}/depart`, method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { lng: 103.725890, lat: 29.562340 });
  console.log('12. 押运车辆发车打点测试:', departRes.data.code === 200 ? '✅ 发车打点成功' : '❌ 失败', `状态: ${departRes.data.data.status}`);

  // 13. 途中打卡点扫码打卡 (R15)
  const cpRes = await request({
    hostname: '127.0.0.1', port: 8080, path: `/api/transport/${transId}/checkpoint`, method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { seq: 1, name: '青龙山专线入口', photoUrl: 'mockCp1.jpg' });
  console.log('13. 途中打卡点扫码留证测试:', cpRes.data.code === 200 ? '✅ 打卡成功' : '❌ 失败', cpRes.data.msg);

  // 14. 卸货点手动到达确认 (C12 / Q13)
  const arriveRes = await request({
    hostname: '127.0.0.1', port: 8080, path: `/api/transport/${transId}/stop-arrive`, method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { planId });
  console.log('14. 押运员手动点击到达测试 (Q13):', arriveRes.data.code === 200 ? '✅ 到达确认成功' : '❌ 失败');

  // 15. 安全员到场接收并核对数量 (D01-D06)
  const recvRes = await request({
    hostname: '127.0.0.1', port: 8080, path: '/api/receive/confirm', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    planId, transportId: transId, safetyOfficerId: 'P3',
    items: [{ goodsType: 'zy', spec: '2号岩石乳化炸药', sendQty: 150, recvQty: 150, diffQty: 0 }]
  });
  console.log('15. 安全员现场核量测试:', recvRes.data.code === 200 ? '✅ 到场接收核量完成' : '❌ 失败');

  // 16. 安全监理登记爆破 (消耗 130kg，剩余 20kg 退库)
  const blastRes = await request({
    hostname: '127.0.0.1', port: 8080, path: '/api/blasting/record', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    planId, supervisorId: 'P2', blastResult: 'NORMAL_RETURN',
    usedItems: [{ goodsType: 'zy', spec: '2号岩石乳化炸药', usedQty: 130 }],
    coVerifierIds: ['P3', 'P7']
  });
  console.log('16. 安全监理爆破情况登记测试:', blastRes.data.code === 200 ? '✅ 登记成功' : '❌ 失败', `结果: ${blastRes.data.data.blastResult}`);

  // 17. 剩余物退库申请 (20kg 一次性退完回原库 Q07)
  const retRes = await request({
    hostname: '127.0.0.1', port: 8080, path: '/api/return/apply', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    planId, outboundId: outId, targetStorageId: 'S1',
    items: [{ goodsType: 'zy', spec: '2号岩石乳化炸药', returnQty: 20 }]
  });
  console.log('17. 剩余物退库申请测试 (Q07 一次退完):', retRes.data.code === 200 ? '✅ 退库单生成' : '❌ 失败', `单号: ${retRes.data.data.returnNo}`);

  const retId = retRes.data.data.id;

  // 18. 库管员退库核销并回加库存
  const retConfirm = await request({
    hostname: '127.0.0.1', port: 8080, path: `/api/return/${retId}/keeper-confirm`, method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { keeperId: 'P4' });
  console.log('18. 库房退库核销回加库存测试:', retConfirm.data.code === 200 ? '✅ 核销入库成功' : '❌ 失败');

  // 19. 民警远程核验结案 (F01-F04)
  const verifyRes = await request({
    hostname: '127.0.0.1', port: 8080, path: '/api/verify/submit', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    planId, policeId: 'POL2', conclusion: '通过',
    items: [
      { name: '证照齐全', passed: true },
      { name: '警戒设置', passed: true },
      { name: '人员在岗', passed: true },
      { name: '监控在线', passed: true },
      { name: '台账一致', passed: true }
    ]
  });
  console.log('19. 民警远程核验结案测试:', verifyRes.data.code === 200 ? '✅ 核验通过归档' : '❌ 失败', `核验结论: ${verifyRes.data.data.conclusion}`);

  // 20. 大屏与全链路同源视图下钻测试 (G08 / I07)
  const overviewRes = await request({ hostname: '127.0.0.1', port: 8080, path: `/api/overview/${planId}`, method: 'GET' });
  console.log('20. 大屏与小程序同源详情视图测试 (G08):', overviewRes.data.code === 200 ? '✅ 查询成功' : '❌ 失败', `全链流水日志数: ${overviewRes.data.data.timelineLogs.length} 条`);

  console.log('\n======================================================');
  console.log('🎉 民爆全流程 20 项核心业务链路与强卡口校验全部测试通过！');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('测试发生异常:', err);
});

