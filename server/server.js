const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const { loadDB, saveDB, resetDB, logNodeAction, logMasterAction, upsertDoc, deleteDoc } = require('./db');
const QRCode = require('qrcode');

const PORT = process.env.PORT || 8080;
const ROOT_DIR = path.resolve(__dirname, '..');

// MIME 类型字典
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// 物品字典
const GOODS_DICT = {
  zy: { name: '炸药', unit: 'kg', ratio: 1.0 },
  lg: { name: '雷管', unit: '发', ratio: 0.001 },
  db: { name: '导爆索', unit: 'm', ratio: 0.012 }
};

// JSON 解析工具
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

// 统一 JSON 响应
function sendJSON(res, code, msg, data = null) {
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  });
  res.end(JSON.stringify({ code, msg, data }));
}

// 静态文件服务
function serveStatic(req, res, pathname) {
  let filePath = path.join(ROOT_DIR, pathname);
  if (pathname === '/' || pathname === '') {
    filePath = path.join(ROOT_DIR, 'index.html');
  }

  // 安全检查防止目录穿越
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found: ' + pathname);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

// 生成编号
function genNo(prefix) {
  const d = new Date();
  const ymd = d.getFullYear() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `${prefix}${ymd}${seq}`;
}

const server = http.createServer(async (req, res) => {
  // 处理 OPTIONS 跨域
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    });
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // -------------------------------------------------------------
  // API 路由分发
  // -------------------------------------------------------------
  if (pathname.startsWith('/api/')) {
    const db = loadDB();

    // 1. 系统健康、全量数据与重置
    if (pathname === '/api/health' && method === 'GET') {
      return sendJSON(res, 200, '系统运行正常', { time: new Date().toISOString() });
    }

    /* 二维码图片：/api/qr?text=单号 —— 供出库单/退库单联单现场扫码 */
    if (pathname === '/api/qr' && method === 'GET') {
      const text = String(parsedUrl.query.text || '').trim();
      if (!text) return sendJSON(res, 400, '缺少 text 参数');
      try {
        const png = await QRCode.toBuffer(text, { type: 'png', width: 420, margin: 1, errorCorrectionLevel: 'M' });
        res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600', 'Access-Control-Allow-Origin': '*' });
        res.end(png);
      } catch (e) {
        return sendJSON(res, 500, '二维码生成失败：' + e.message);
      }
      return;
    }

    if (pathname === '/api/all' && method === 'GET') {
      return sendJSON(res, 200, 'success', db);
    }

    if (pathname === '/api/all' && method === 'POST') {
      const body = await parseBody(req);      /* 小程序回推的 storages 只带 id + stock：只合并库存，档案字段以 PC / 治安管理员维护为准 */
      if (Array.isArray(body.storages)) {
        body.storages.forEach(ss => {
          const cur = db.storages.find(x => x.id === ss.id);
          if (cur && ss.stock) cur.stock = ss.stock;
          else if (!cur && ss.name) db.storages.push(ss);   // 主数据里没有的新库房才建档
        });
        delete body.storages;
      }
      saveDB({ ...db, ...body });
      return sendJSON(res, 200, '全量数据同步成功', loadDB());
    }

    // 单文档读写（前端每笔业务操作直接调用，逐条落库）
    // GET /api/doc/{coll}            → 该集合全部记录
    // GET /api/doc/{coll}/{id}       → 单条记录
    // POST|PUT /api/doc/{coll}[/{id}] → 新增或更新一条（写 t_store_doc + 镜像表）
    // DELETE /api/doc/{coll}/{id}    → 删除一条
    if (pathname.startsWith('/api/doc/')) {
      const parts = pathname.replace('/api/doc/', '').split('/').map(decodeURIComponent);
      const coll = parts[0];
      const id = parts[1];
      if (!coll) return sendJSON(res, 400, '集合名必填');
      try {
        if (method === 'GET') {
          const cur = loadDB();
          if (!id) return sendJSON(res, 200, 'success', cur[coll] || []);
          const one = (cur[coll] || []).find(x => String(x.id || x.dataId) === id);
          return one ? sendJSON(res, 200, 'success', one) : sendJSON(res, 404, '记录不存在');
        }
        if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
          const body = await parseBody(req);
          const doc = id ? Object.assign({}, body, { id }) : body;
          const saved = upsertDoc(coll, doc);
          return sendJSON(res, 200, '已写入数据库', saved);
        }
        if (method === 'DELETE') {
          if (!id) return sendJSON(res, 400, '文档 id 必填');
          deleteDoc(coll, id);
          return sendJSON(res, 200, '已从数据库删除', { id });
        }
      } catch (e) {
        return sendJSON(res, 400, '写库失败：' + e.message);
      }
    }

    if (pathname === '/api/reset' && method === 'POST') {
      const refreshed = resetDB();
      return sendJSON(res, 200, '演示数据已重置为初始种子状态', refreshed);
    }

    if (pathname === '/api/settings' && method === 'GET') {
      return sendJSON(res, 200, 'success', db.settings);
    }
    if (pathname === '/api/settings' && method === 'POST') {
      const body = await parseBody(req);
      db.settings = { ...db.settings, ...body };
      saveDB(db);
      return sendJSON(res, 200, '系统参数更新成功', db.settings);
    }

    // 2. 8 类主数据管理 (J01-J12 / L02 / Q11)
    if (pathname.startsWith('/api/master/')) {
      const rest = pathname.replace('/api/master/', '');
      const [type, mid] = rest.split('/');
      const subId = mid ? decodeURIComponent(mid) : '';

      // 获取列表
      if (method === 'GET') {
        if (type === 'logs') {
          return sendJSON(res, 200, 'success', db.masterLogs.slice().reverse());
        }
        if (db[type]) {
          return sendJSON(res, 200, 'success', db[type]);
        }
        return sendJSON(res, 404, '未知的主数据类型: ' + type);
      }

      // 新增或更新主数据
      if (method === 'POST') {
        const body = await parseBody(req);
        if (!db[type]) {
          return sendJSON(res, 400, '主数据集合不存在: ' + type);
        }

        const operator = body._operator || { id: 'ADM1', name: '治安管理员', role: '治安管理员' };
        delete body._operator;

        let existingIndex = -1;
        if (body.id) {
          existingIndex = db[type].findIndex(it => it.id === body.id);
        }

        if (existingIndex >= 0) {
          // 更新
          const oldData = db[type][existingIndex];
          db[type][existingIndex] = { ...oldData, ...body };
          logMasterAction(type, body.id, '编辑修正', operator, body._remark || '修改信息', { before: oldData, after: db[type][existingIndex] }, db);
          saveDB(db);
          return sendJSON(res, 200, '主数据修改成功并留痕', db[type][existingIndex]);
        } else {
          // 新增
          if (!body.id) {
            body.id = type.slice(0, 2).toUpperCase() + Date.now().toString().slice(-4);
          }
          db[type].push(body);
          logMasterAction(type, body.id, '新增建档', operator, body._remark || '新增登记', null, db);
          saveDB(db);
          return sendJSON(res, 200, '主数据建档成功并留痕', body);
        }
      }

      // 删除档案（DELETE /api/master/{type}/{id}）
      if (method === 'DELETE') {
        const delId = subId || (await parseBody(req)).id;
        if (!delId) return sendJSON(res, 400, '缺少要删除的记录 id');
        const idx = (db[type] || []).findIndex(it => it.id === delId);
        if (idx < 0) return sendJSON(res, 404, '记录不存在: ' + delId);
        const removed = db[type][idx];
        db[type].splice(idx, 1);
        logMasterAction(type, delId, '删除档案', { id: 'ADM1', name: '治安管理员', role: '治安管理员' }, (removed.name || delId) + ' 已删除', { before: removed, after: null }, db);
        saveDB(db);
        return sendJSON(res, 200, '档案已删除并留痕', removed);
      }
    }

    // 3. 作业计划管理 (A01-A08 / Q01 / Q02)
    // 3.1 列表
    if (pathname === '/api/plan/list' && method === 'GET') {
      return sendJSON(res, 200, 'success', db.plans.slice().reverse());
    }

    // 3.2 测量技术员填报次日计划草稿 (A07 / Q01 双规则校验)
    if (pathname === '/api/plan/draft' && method === 'POST') {
      const body = await parseBody(req);
      const now = new Date();

      // Q01 规则 1：次日计划必须在当日 24:00 前提交
      // Q01 规则 2：计划开始时间必须提前 >= 6小时
      const planStart = new Date(body.planStart);
      const diffHours = (planStart.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (diffHours < 6) {
        return sendJSON(res, 400, `【强卡口拦截·Q01】必须提前至少 6 小时上报作业计划！当前仅提前 ${diffHours.toFixed(1)} 小时，禁止提交。`);
      }

      // 计算计划总重量 (kg)
      let planKg = 0;
      (body.items || []).forEach(it => {
        const ratio = (GOODS_DICT[it.goodsType] || {}).ratio || 1;
        planKg += (it.planQty || 0) * ratio;
      });

      const newPlan = {
        id: 'PL' + Date.now().toString().slice(-5),
        planNo: genNo('BBJH'),
        projectId: body.projectId || 'PR1',
        siteId: body.siteId || 'Z1',
        outStorageId: body.outStorageId || 'S1',
        workareaId: body.workareaId || 'WA1',
        planStart: body.planStart,
        planEnd: body.planEnd,
        planKg: parseFloat(planKg.toFixed(2)),
        items: body.items || [],
        surveyorId: body.surveyorId || 'P7',
        surveyTime: now.toISOString().replace('T', ' ').slice(0, 19),
        regRegulatorId: null,
        regSignUrl: '',
        applicantId: null,
        auditStatus: '待监管签字',
        status: '待监管签字',
        createdAt: now.toISOString().replace('T', ' ').slice(0, 19)
      };

      db.plans.push(newPlan);
      saveDB(db);

      logNodeAction(newPlan.id, '计划填报', '测量技术员提交作业点计划', { id: newPlan.surveyorId, name: '测量技术员' });
      return sendJSON(res, 200, '计划已提交，等待安全监管手写签字', newPlan);
    }

    // 3.3 安全监管签字 (A08)
    if (pathname.match(/^\/api\/plan\/[^/]+\/reg-sign$/) && method === 'POST') {
      const planId = pathname.split('/')[3];
      const body = await parseBody(req);
      const plan = db.plans.find(p => p.id === planId);
      if (!plan) return sendJSON(res, 404, '未找到作业计划');

      plan.regRegulatorId = body.regulatorId || 'P8';
      plan.regSignUrl = body.signUrl || 'data:image/png;base64,mockSign';
      plan.regSignTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
      plan.status = '待负责人审核';
      saveDB(db);

      logNodeAction(planId, '监管手签', '安全监管完成把关手写签名', { id: plan.regRegulatorId, name: '安全监管' }, plan.regSignUrl);
      return sendJSON(res, 200, '安全监管签字成功，已推送项目负责人', plan);
    }

    // 3.4 项目负责人审核上报 (A01)
    if (pathname.match(/^\/api\/plan\/[^/]+\/submit$/) && method === 'POST') {
      const planId = pathname.split('/')[3];
      const body = await parseBody(req);
      const plan = db.plans.find(p => p.id === planId);
      if (!plan) return sendJSON(res, 404, '未找到作业计划');

      plan.applicantId = body.applicantId || 'P1';
      plan.outStorageId = body.outStorageId || plan.outStorageId;
      plan.workareaId = body.workareaId || plan.workareaId;

      // 检查民警审核开关 (Q02)
      if (db.settings.planAudit) {
        plan.status = '待出库';
        plan.auditStatus = '待审核';
      } else {
        plan.status = '待出库';
        plan.auditStatus = '免审直接出库';
      }
      saveDB(db);

      logNodeAction(planId, '负责人审核', '项目负责人审核提交计划，绑定出库库房与公安责任区', { id: plan.applicantId, name: '项目负责人' });
      return sendJSON(res, 200, '计划审核提交成功', plan);
    }

    // 3.5 民警审核 (A03 / Q02)
    if (pathname.match(/^\/api\/plan\/[^/]+\/audit$/) && method === 'POST') {
      const planId = pathname.split('/')[3];
      const body = await parseBody(req);
      const plan = db.plans.find(p => p.id === planId);
      if (!plan) return sendJSON(res, 404, '未找到作业计划');

      plan.auditPoliceId = body.policeId || 'POL2';
      plan.auditTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
      plan.auditRemark = body.remark || (body.passed ? '审核通过' : '驳回');

      if (body.passed) {
        plan.auditStatus = '已通过';
        plan.status = '待出库';
      } else {
        plan.auditStatus = '已驳回';
        plan.status = '已驳回';
      }
      saveDB(db);

      logNodeAction(planId, '民警审核', `责任民警完成审核：${plan.auditStatus} (${plan.auditRemark})`, { id: plan.auditPoliceId, name: '责任民警' });
      return sendJSON(res, 200, '民警审核处理完成', plan);
    }

    // 4. 出库管理 (B01-B07 / Q03 / Q05)
    // 4.1 列表
    if (pathname === '/api/outbound/list' && method === 'GET') {
      return sendJSON(res, 200, 'success', db.outbounds.slice().reverse());
    }

    // 4.2 创建出库单（支持一单多点，严禁超计划 Q03）
    if (pathname === '/api/outbound/create' && method === 'POST') {
      const body = await parseBody(req);
      const storage = db.storages.find(s => s.id === body.storageId);
      if (!storage) return sendJSON(res, 404, '发料库房不存在');

      // 强卡口 Q03：严禁超计划，实发 <= 计划量
      let totalOutKg = 0;
      for (const item of (body.items || [])) {
        const p = db.plans.find(x => x.id === item.planId);
        if (p) {
          const planItem = (p.items || []).find(it => it.goodsType === item.goodsType && it.spec === item.spec);
          if (planItem && item.qty > planItem.planQty) {
            return sendJSON(res, 400, `【强卡口拦截·Q03】严禁超计划出库！品种 [${item.spec}] 计划量为 ${planItem.planQty}，实发量 ${item.qty} 已超额，禁止出库。`);
          }
        }
        const ratio = (GOODS_DICT[item.goodsType] || {}).ratio || 1;
        totalOutKg += item.qty * ratio;
      }

      const newOutbound = {
        id: 'OB' + Date.now().toString().slice(-5),
        outNo: genNo('BBCK'),
        storageId: body.storageId,
        planIds: body.planIds || [],
        totalKg: parseFloat(totalOutKg.toFixed(2)),
        items: body.items || [],
        registrantId: body.registrantId || 'P4',
        regSignUrl: body.regSignUrl || 'data:image/png;base64,mockRegSign',
        regTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        reviewerId: null,
        revSignUrl: '',
        status: '待复核', // 第一步登记不扣库存 (Q05)
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
      };

      // 关联的计划更新为出库中
      (body.planIds || []).forEach(pid => {
        const p = db.plans.find(x => x.id === pid);
        if (p) p.status = '出库中';
        logNodeAction(pid, '出库登记', `第一库管员填报出库并签名，出库单置待复核 (不扣库存)`, { id: newOutbound.registrantId, name: '登记保管员' }, newOutbound.regSignUrl);
      });

      db.outbounds.push(newOutbound);
      saveDB(db);
      return sendJSON(res, 200, '出库登记成功，单据进入待复核状态', newOutbound);
    }

    // 4.3 双人双锁复核扣库 (Q05)
    if (pathname.match(/^\/api\/outbound\/[^/]+\/confirm$/) && method === 'POST') {
      const outId = pathname.split('/')[3];
      const body = await parseBody(req);
      const ob = db.outbounds.find(o => o.id === outId);
      if (!ob) return sendJSON(res, 404, '出库单不存在');

      if (ob.status !== '待复核') {
        return sendJSON(res, 400, '出库单当前不是待复核状态');
      }

      // Q05 校验：复核人与登记人必须为不同自然人
      if (ob.registrantId === body.reviewerId) {
        return sendJSON(res, 400, '【强卡口拦截·Q05】双人双锁要求登记人与复核人必须为两个不同的自然人！');
      }

      // 验证身份证 (Q05)
      const reviewer = db.persons.find(p => p.id === body.reviewerId);
      if (!reviewer) return sendJSON(res, 400, '复核人员不存在');
      if (reviewer.idno && body.reviewerIdCard && !reviewer.idno.endsWith(body.reviewerIdCard.slice(-4))) {
        return sendJSON(res, 400, '【强卡口拦截·Q05】复核库管员身份证校验未通过！');
      }

      // 执行行锁扣减库存 (Q05)
      const storage = db.storages.find(s => s.id === ob.storageId);
      if (!storage) return sendJSON(res, 500, '库房不存在');

      for (const it of ob.items) {
        if (!storage.stock) storage.stock = { zy: {}, lg: {}, db: {} };
        if (!storage.stock[it.goodsType]) storage.stock[it.goodsType] = {};
        const curr = storage.stock[it.goodsType][it.spec] || 0;
        if (curr < it.qty) {
          return sendJSON(res, 400, `库存不足！库房 [${it.spec}] 当前存量 ${curr}，不足以扣减 ${it.qty}`);
        }
        storage.stock[it.goodsType][it.spec] = curr - it.qty;
      }

      ob.reviewerId = body.reviewerId;
      ob.reviewerIdCard = body.reviewerIdCard;
      ob.revSignUrl = body.signUrl || 'data:image/png;base64,mockRevSign';
      ob.revTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
      ob.status = '待签收';

      // 对应计划推进至待运输
      (ob.planIds || []).forEach(pid => {
        const p = db.plans.find(x => x.id === pid);
        if (p) p.status = '待运输';
        logNodeAction(pid, '出库复核', '第二库管员核验身份证并通过复核，库存扣减完成，推送押运员', { id: ob.reviewerId, name: reviewer.name }, ob.revSignUrl);
      });

      saveDB(db);
      return sendJSON(res, 200, '双人复核通过，库存已成功扣除，出库单已生效', ob);
    }

    // 5. 押运运输管理 (C01-C12 / C09 / C10 / Q13)
    // 5.1 列表
    if (pathname === '/api/transport/list' && method === 'GET') {
      return sendJSON(res, 200, 'success', db.transports.slice().reverse());
    }

    // 5.2 押运签收与载重校验 (C01 / C09 / C10)
    if (pathname === '/api/transport/sign' && method === 'POST') {
      const body = await parseBody(req);
      const vehicle = db.vehicles.find(v => v.id === body.vehicleId);
      if (!vehicle) return sendJSON(res, 404, '所选运输车辆不存在');

      const outbound = db.outbounds.find(o => o.id === body.outboundId);
      if (!outbound) return sendJSON(res, 404, '关联出库单不存在');

      // 载重校验 (C09)
      if (vehicle.load < outbound.totalKg) {
        return sendJSON(res, 400, `【强卡口拦截·C09】车辆载重不足！车辆核定载重 ${vehicle.load}kg，货物总重 ${outbound.totalKg}kg，严禁选择超重车辆！`);
      }

      const newTransport = {
        id: 'TR' + Date.now().toString().slice(-5),
        outboundId: body.outboundId,
        vehicleId: body.vehicleId,
        vehiclePlate: vehicle.plate,
        vehicleLoad: vehicle.load,
        driverId: body.driverId || 'D1',
        escortId: body.escortId || 'P5',
        routeId: body.routeId || 'R1',
        totalKg: outbound.totalKg,
        stops: body.stops || outbound.planIds.map((pid, idx) => ({ seq: idx + 1, planId: pid, status: '在途' })),
        checkpoints: (db.routes.find(r => r.id === body.routeId) || {}).checkPoints || [],
        departTime: null,
        status: '待发车',
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
      };

      outbound.status = '待发车';
      db.transports.push(newTransport);
      saveDB(db);

      outbound.planIds.forEach(pid => {
        logNodeAction(pid, '押运签收', `押运员扫码签收，绑定车辆 [${vehicle.plate}] 及路线，载重校验通过`, { id: newTransport.escortId, name: '押运员' });
      });

      return sendJSON(res, 200, '押运签收成功，人车绑定就绪', newTransport);
    }

    // 5.3 发车打点 (C04)
    if (pathname.match(/^\/api\/transport\/[^/]+\/depart$/) && method === 'POST') {
      const transId = pathname.split('/')[3];
      const body = await parseBody(req);
      const tr = db.transports.find(t => t.id === transId);
      if (!tr) return sendJSON(res, 404, '运输单不存在');

      tr.departTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
      tr.departLng = body.lng || 103.725890;
      tr.departLat = body.lat || 29.562340;
      tr.status = '运输中';

      const ob = db.outbounds.find(o => o.id === tr.outboundId);
      if (ob) {
        ob.status = '运输中';
        ob.planIds.forEach(pid => {
          const p = db.plans.find(x => x.id === pid);
          if (p) p.status = '运输中';
          logNodeAction(pid, '发车打点', '押运车辆正式启程发车，记录发车时间与定位', { id: tr.escortId, name: '押运员' });
        });
      }

      saveDB(db);
      return sendJSON(res, 200, '发车打点完成，车辆在途监控中', tr);
    }

    // 5.4 途中打卡点扫码打卡 (R15)
    if (pathname.match(/^\/api\/transport\/[^/]+\/checkpoint$/) && method === 'POST') {
      const transId = pathname.split('/')[3];
      const body = await parseBody(req);
      const tr = db.transports.find(t => t.id === transId);
      if (!tr) return sendJSON(res, 404, '运输单不存在');

      if (!tr.checkedPoints) tr.checkedPoints = [];
      const cpEntry = {
        seq: body.seq,
        name: body.name,
        time: new Date().toISOString().replace('T', ' ').slice(0, 19),
        lng: body.lng || 103.805000,
        lat: body.lat || 29.608000,
        photoUrl: body.photoUrl || 'mockCheckpointPhoto.jpg'
      };
      tr.checkedPoints.push(cpEntry);

      const ob = db.outbounds.find(o => o.id === tr.outboundId);
      if (ob) {
        ob.planIds.forEach(pid => {
          logNodeAction(pid, '途中打卡', `车辆途经沿途打卡点 [${body.name}]，打卡拍照留痕`, { id: tr.escortId, name: '押运员' }, '', [cpEntry.photoUrl]);
        });
      }

      saveDB(db);
      return sendJSON(res, 200, `打卡点 [${body.name}] 打卡成功`, cpEntry);
    }

    // 5.5 卸货点手动点击到达 (C12 / Q13)
    if (pathname.match(/^\/api\/transport\/[^/]+\/stop-arrive$/) && method === 'POST') {
      const transId = pathname.split('/')[3];
      const body = await parseBody(req);
      const tr = db.transports.find(t => t.id === transId);
      if (!tr) return sendJSON(res, 404, '运输单不存在');

      const stop = (tr.stops || []).find(s => s.planId === body.planId);
      if (stop) {
        stop.status = '已到达';
        stop.arriveTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
      }

      const plan = db.plans.find(p => p.id === body.planId);
      if (plan) plan.status = '待接收';

      logNodeAction(body.planId, '手动到达', '押运员抵达作业现场，手动点击到达确认，等待安全员核量', { id: tr.escortId, name: '押运员' });
      saveDB(db);
      return sendJSON(res, 200, '卸货点到达确认成功，已流转至现场安全员', tr);
    }

    // 6. 现场到场接收单与核量 (D01-D06)
    if (pathname === '/api/receive/confirm' && method === 'POST') {
      const body = await parseBody(req);
      const plan = db.plans.find(p => p.id === body.planId);
      if (!plan) return sendJSON(res, 404, '作业计划不存在');

      const newReceive = {
        id: 'RC' + Date.now().toString().slice(-5),
        planId: body.planId,
        transportId: body.transportId,
        safetyOfficerId: body.safetyOfficerId || 'P3',
        arriveTime: body.arriveTime || new Date().toISOString().replace('T', ' ').slice(0, 19),
        arriveTimeSource: 'MANUAL', // Q13
        items: body.items || [],
        diffFlag: body.diffFlag ? 1 : 0,
        diffRemark: body.diffRemark || '',
        signUrl: body.signUrl || 'mockSafetySign.png',
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
      };

      plan.status = '已到场';
      db.receives.push(newReceive);
      saveDB(db);

      logNodeAction(body.planId, '到场接收', `现场安全员确认到场并逐项核量完成，差异标记: ${newReceive.diffFlag ? '存在差异' : '账实相符'}`, { id: newReceive.safetyOfficerId, name: '现场安全员' }, newReceive.signUrl);
      return sendJSON(res, 200, '安全员到场核量完成', newReceive);
    }

    // 7. 爆破作业登记 (E01-E09)
    if (pathname === '/api/blasting/record' && method === 'POST') {
      const body = await parseBody(req);
      const plan = db.plans.find(p => p.id === body.planId);
      if (!plan) return sendJSON(res, 404, '作业计划不存在');

      const newBlasting = {
        id: 'BL' + Date.now().toString().slice(-5),
        planId: body.planId,
        supervisorId: body.supervisorId || 'P2',
        blastTime: body.blastTime || new Date().toISOString().replace('T', ' ').slice(0, 19),
        blastResult: body.blastResult || 'NORMAL_NO_RETURN',
        usedItems: body.usedItems || [],
        coVerifierIds: body.coVerifierIds || ['P3'],
        supervisorSignUrl: body.supervisorSignUrl || 'mockSupervisorSign.png',
        blindFlag: body.blindFlag ? 1 : 0,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
      };

      if (body.blastResult === 'NORMAL_RETURN') {
        plan.status = '待退库';
      } else {
        plan.status = '待核验';
      }

      db.blastings.push(newBlasting);
      saveDB(db);

      logNodeAction(body.planId, '爆破登记', `安全监理登记爆破完成情况，签署手写签名，共核验人参与核实`, { id: newBlasting.supervisorId, name: '安全监理' }, newBlasting.supervisorSignUrl);
      return sendJSON(res, 200, '爆破作业情况登记成功', newBlasting);
    }

    // 8. 剩余物销毁登记 (E08 / Q06)
    if (pathname === '/api/destroy/record' && method === 'POST') {
      const body = await parseBody(req);
      if (!body.photos || body.photos.length === 0) {
        return sendJSON(res, 400, '【强卡口·Q06】销毁登记必须上传现场拍照证据！');
      }

      const newDestroy = {
        id: 'DS' + Date.now().toString().slice(-5),
        destroyNo: genNo('BBXH'),
        planId: body.planId,
        items: body.items || [],
        destroyReason: body.destroyReason || '受潮破损现场销毁',
        photos: body.photos,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
      };

      db.destroys.push(newDestroy);
      saveDB(db);

      logNodeAction(body.planId, '销毁登记', `安全监理登记剩余物现场销毁并拍照留存`, { id: 'P2', name: '安全监理' }, '', newDestroy.photos);
      return sendJSON(res, 200, '剩余物销毁登记成功', newDestroy);
    }

    // 9. 剩余物退库 (E02-E03 / Q07)
    // 9.1 退库申请
    if (pathname === '/api/return/apply' && method === 'POST') {
      const body = await parseBody(req);
      const plan = db.plans.find(p => p.id === body.planId);
      if (!plan) return sendJSON(res, 404, '作业计划不存在');

      const newReturn = {
        id: 'RT' + Date.now().toString().slice(-5),
        returnNo: genNo('BBTK'),
        planId: body.planId,
        outboundId: body.outboundId,
        targetStorageId: body.targetStorageId || plan.outStorageId,
        items: body.items || [],
        supervisorId: body.supervisorId || 'P2',
        escortId: body.escortId || 'P5',
        escortConfirmed: false,
        keeperConfirmed: false,
        status: '待返库',
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
      };

      db.returns.push(newReturn);
      plan.status = '待退库';
      saveDB(db);

      logNodeAction(body.planId, '退库申请', '安全监理发起剩余物退库申请，单据推送押运员扫码确认', { id: newReturn.supervisorId, name: '安全监理' });
      return sendJSON(res, 200, '退库申请已提交', newReturn);
    }

    // 9.2 押运员扫码确认反向押运发车 (Q07)
    if (pathname.match(/^\/api\/return\/[^/]+\/escort-confirm$/) && method === 'POST') {
      const returnId = pathname.split('/')[3];
      const ret = db.returns.find(r => r.id === returnId);
      if (!ret) return sendJSON(res, 404, '退库单不存在');

      ret.escortConfirmed = true;
      ret.escortScanTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
      ret.status = '返程中';
      saveDB(db);

      logNodeAction(ret.planId, '退库发车', '押运员扫码确认退库品项及数量，启动反向押送回原库', { id: ret.escortId, name: '押运员' });
      return sendJSON(res, 200, '押运员扫码确认成功，反向押运启程', ret);
    }

    // 9.3 库管员入库核销回加库存 (Q07 / R2 三量平衡)
    if (pathname.match(/^\/api\/return\/[^/]+\/keeper-confirm$/) && method === 'POST') {
      const returnId = pathname.split('/')[3];
      const body = await parseBody(req);
      const ret = db.returns.find(r => r.id === returnId);
      if (!ret) return sendJSON(res, 404, '退库单不存在');

      const storage = db.storages.find(s => s.id === ret.targetStorageId);
      if (!storage) return sendJSON(res, 404, '目标库房不存在');

      // 回加库存
      for (const it of ret.items) {
        if (!storage.stock) storage.stock = { zy: {}, lg: {}, db: {} };
        if (!storage.stock[it.goodsType]) storage.stock[it.goodsType] = {};
        const curr = storage.stock[it.goodsType][it.spec] || 0;
        storage.stock[it.goodsType][it.spec] = curr + it.returnQty;
      }

      ret.keeperConfirmed = true;
      ret.keeperId = body.keeperId || 'P4';
      ret.keeperConfirmTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
      ret.status = '已核销入库';

      const plan = db.plans.find(p => p.id === ret.planId);
      if (plan) plan.status = '待核验';

      saveDB(db);
      logNodeAction(ret.planId, '退库核销', '库管员核验入库，库存回加完成，单据流转至责任民警远程核验', { id: ret.keeperId, name: '库管员' });
      return sendJSON(res, 200, '退库核销完成，库存已成功回加', ret);
    }

    // 10. 民警远程核验 (F01-F05)
    if (pathname === '/api/verify/submit' && method === 'POST') {
      const body = await parseBody(req);
      const plan = db.plans.find(p => p.id === body.planId);
      if (!plan) return sendJSON(res, 404, '作业计划不存在');

      const newVerify = {
        id: 'VF' + Date.now().toString().slice(-5),
        planId: body.planId,
        policeId: body.policeId || 'POL2',
        checkItems: body.items || [],
        conclusion: body.conclusion || '通过',
        remark: body.remark || '核验通过',
        verifyTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
      };

      if (body.conclusion === '通过') {
        plan.status = '已完成';
      } else {
        plan.status = '异常挂起';
      }

      db.verifies.push(newVerify);
      saveDB(db);

      logNodeAction(body.planId, '民警核验', `责任民警完成远程全流程核验，结论: [${newVerify.conclusion}]`, { id: newVerify.policeId, name: '责任民警' });
      return sendJSON(res, 200, '民警远程核验完成', newVerify);
    }

    // 11. 公安分级检查 (K01-K06)
    if (pathname === '/api/check/create' && method === 'POST') {
      const body = await parseBody(req);
      if (!body.photos || body.photos.length === 0) {
        return sendJSON(res, 400, '【强卡口·K03】公安检查必须上传现场照片留证！');
      }

      const newCheck = {
        id: 'CK' + Date.now().toString().slice(-5),
        planId: body.planId,
        nodeName: body.nodeName || '作业现场',
        levelName: body.levelName || '工区警务室到场',
        inspectorId: body.inspectorId || 'POL2',
        items: body.items || [],
        photos: body.photos,
        result: body.result || '合格',
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
      };

      db.checks.push(newCheck);
      saveDB(db);

      logNodeAction(body.planId, '公安检查', `公安民警发起 [${newCheck.nodeName}] 环节分级检查，结果: [${newCheck.result}]`, { id: newCheck.inspectorId, name: '检查民警' }, '', newCheck.photos);
      return sendJSON(res, 200, '公安检查记录创建成功', newCheck);
    }

    // 12. 俯瞰大屏与全链路同源视图 (G01-G08)
    // 12.1 单点全节点同源数据
    if (pathname.match(/^\/api\/overview\/[^/]+$/) && pathname !== '/api/overview/kpi' && method === 'GET') {
      const planId = pathname.split('/')[3];
      const plan = db.plans.find(p => p.id === planId);
      if (!plan) return sendJSON(res, 404, '作业计划不存在');

      const site = db.sites.find(s => s.id === (plan.siteId || plan.site)) || {};
      const storage = db.storages.find(s => s.id === (plan.outStorageId || plan.outStorage)) || {};
      const outbound = db.outbounds.find(o =>
        (o.planIds || []).includes(planId) ||
        (o.plans || []).some(x => x.plan === planId)) || null;
      let transport = db.transports.find(t => t.plan === planId || t.planId === planId) || null;
      if (!transport && outbound) {
        transport = db.transports.find(t => t.outboundId === outbound.id || t.outbound === outbound.id) || null;
      }
      const receive = db.receives.find(r => r.planId === planId || r.plan === planId) || null;
      const blasting = db.blastings.find(b => b.planId === planId || b.plan === planId) || null;
      const destroy = db.destroys.find(d => d.planId === planId || d.plan === planId) || null;
      const ret = db.returns.find(r => r.planId === planId || r.plan === planId) || null;
      const verify = db.verifies.find(v => v.planId === planId || v.plan === planId) || null;
      const logs = db.nodeLogs.filter(l => l.planId === planId || l.plan === planId);

      return sendJSON(res, 200, 'success', {
        plan,
        site,
        storage,
        outbound,
        transport,
        receive,
        blasting,
        destroy,
        return: ret,
        verify,
        timelineLogs: logs
      });
    }

    // 12.2 大屏 KPI 统计指标
    if (pathname === '/api/overview/kpi' && method === 'GET') {
      const totalPlans = db.plans.length;
      const completedPlans = db.plans.filter(p => p.status === '已完成').length;
      const inTransport = db.plans.filter(p => p.status === '运输中').length;
      let totalOutKg = 0;
      db.outbounds.forEach(o => { totalOutKg += o.totalKg || 0; });

      return sendJSON(res, 200, 'success', {
        todayPlanCount: totalPlans,
        outboundQtyKg: parseFloat(totalOutKg.toFixed(1)),
        inTransportVehicles: inTransport,
        closingRate: totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 100,
        exceptionCount: db.receives.filter(r => r.diffFlag === 1).length
      });
    }

    // 12.3 全链路节点日志查询 (I07 / Q15)
    if (pathname.match(/^\/api\/plan\/[^/]+\/logs$/) && method === 'GET') {
      const planId = pathname.split('/')[3];
      const logs = db.nodeLogs.filter(l => l.planId === planId);
      return sendJSON(res, 200, 'success', logs);
    }

    return sendJSON(res, 404, '接口路径不存在: ' + pathname);
  }

  // -------------------------------------------------------------
  // 静态页面服务：支持访问 miniprogram-prototype, pc-admin, bigscreen
  // -------------------------------------------------------------
  serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`民爆“最后一公里”监管系统统一服务端已启动！`);
  console.log(`服务监听端口: http://localhost:${PORT}`);
  console.log(`小程序原型入口: http://localhost:${PORT}/miniprogram-prototype/index.html`);
  console.log(`PC 管理后台入口: http://localhost:${PORT}/pc-admin/index.html`);
  console.log(`自建俯瞰大屏入口: http://localhost:${PORT}/bigscreen/index.html`);
  console.log(`健康检查接口: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});

