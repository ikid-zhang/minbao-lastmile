# 民爆“最后一公里”监管系统 核心接口规范 (RESTful API)

- **版本**：V1.5 (2026-11)
- **协议**：HTTPS / JSON
- **统一响应格式**：
```json
{
  "code": 200,
  "msg": "success",
  "data": {}
}
```

---

## 1. 作业计划管理 (Module A)

### 1.1 测量技术员填报作业点计划草稿
- **接口**：`POST /bb/plan/draft`
- **角色**：测量技术员
- **卡口规则**：
  - 次日计划必须在当日 24:00 前提交（逾期拦截）。
  - 计划作业开始时间距提交时间必须 $\ge 6$ 小时。
- **请求体 (Request)**：
```json
{
  "projectId": "PR1",
  "siteId": "Z1",
  "outStorageId": "S1",
  "workareaId": "WA1",
  "planStart": "2026-11-09 10:00:00",
  "planEnd": "2026-11-09 13:00:00",
  "items": [
    { "goodsType": "zy", "spec": "2号岩石乳化炸药", "unit": "kg", "planQty": 200.0 },
    { "goodsType": "lg", "spec": "8#工业电雷管", "unit": "发", "planQty": 50.0 }
  ]
}
```
- **响应 (Response)**：
```json
{
  "code": 200,
  "msg": "提交成功，等待安全监管签字",
  "data": { "planId": "PL001", "status": "待监管签字" }
}
```

### 1.2 安全监管手签确认
- **接口**：`POST /bb/plan/{id}/reg-sign`
- **角色**：安全监管
- **请求体**：
```json
{
  "signUrl": "https://minio.local/signatures/reg_sign_p8.png"
}
```
- **响应**：状态推进至 `待负责人审核`。

### 1.3 项目负责人审核提交
- **接口**：`POST /bb/plan/{id}/submit`
- **角色**：项目负责人
- **逻辑**：负责人审核并确认出库库房（销售库）与公安责任工区。若开启民警计划审核 (`plan_audit_enable=1`)，状态置为 `待出库/待民警审核`；若关闭审核，直接置为 `待出库`。

### 1.4 民警审核计划
- **接口**：`POST /bb/plan/{id}/audit`
- **角色**：工区责任民警
- **请求体**：
```json
{
  "passed": true,
  "remark": "审核通过，符合开采爆破规范"
}
```

---

## 2. 出库管理 (Module B)

### 2.1 创建出库单（支持一单多点合并出库）
- **接口**：`POST /bb/outbound/create`
- **角色**：登记库管员
- **卡口规则**：
  - 实发数量严格 $\le$ 计划量（Q03 严禁超计划，无容差）。
  - 实发数量之和不得大于库房当前实时库存。
  - 第一步登记**不扣减库存**，状态置为 `待复核`。
- **请求体**：
```json
{
  "storageId": "S1",
  "planIds": ["PL001", "PL002"],
  "registrantSignUrl": "https://minio.local/signatures/keeper_p4.png",
  "items": [
    { "planId": "PL001", "goodsType": "zy", "spec": "2号岩石乳化炸药", "qty": 200.0, "batchNo": "ZY-20261108-01" },
    { "planId": "PL001", "goodsType": "lg", "spec": "8#工业电雷管", "qty": 50.0, "batchNo": "LG-20261108-A" }
  ]
}
```

### 2.2 出库双人双锁复核扣库
- **接口**：`POST /bb/outbound/{id}/confirm`
- **角色**：复核库管员（必须不同自然人）
- **卡口规则**：
  - 复核人必须验证身份证（Q05）。
  - 点击通过后在同一事务内行锁扣减 `t_bb_inventory`。
  - 出库单置为 `待签收`，推送押运员。
- **请求体**：
```json
{
  "reviewerId": "P9",
  "reviewerIdCard": "510102198308100019",
  "reviewerSignUrl": "https://minio.local/signatures/keeper_p9.png"
}
```

---

## 3. 押运运输管理 (Module C)

### 3.1 押运员扫码签收与人车绑定
- **接口**：`POST /bb/transport/sign`
- **角色**：押运员
- **卡口规则**：发料总重量必须 $\le$ 所选车辆的 `load_limit`，超重强拦截（C09）。
- **请求体**：
```json
{
  "outboundId": "OB001",
  "driverId": "D1",
  "vehicleId": "V1",
  "routeId": "R1",
  "stopsSequence": [
    { "seq": 1, "planId": "PL001", "siteId": "Z1" },
    { "seq": 2, "planId": "PL002", "siteId": "Z2" }
  ]
}
```

### 3.2 发车打点
- **接口**：`POST /bb/transport/{id}/depart`
- **角色**：押运员
- **请求体**：
```json
{
  "lng": 103.725890,
  "lat": 29.562340
}
```

### 3.3 沿途打卡点打卡 (R15)
- **接口**：`POST /bb/transport/{id}/checkpoint`
- **请求体**：
```json
{
  "seq": 1,
  "name": "青龙山专线入口",
  "lng": 103.765000,
  "lat": 29.589000,
  "photoUrl": "https://minio.local/evidence/cp1_photo.jpg"
}
```

### 3.4 卸货点手动到达确认 (C12/Q13)
- **接口**：`POST /bb/transport/{id}/stop-arrive`
- **请求体**：
```json
{
  "planId": "PL001",
  "siteId": "Z1"
}
```
- **逻辑**：该作业点进入 `待接收` 状态，安全员可核量。

---

## 4. 到场接收与爆破核量 (Module D & E)

### 4.1 现场安全员到场接收核量 (D01-D06)
- **接口**：`POST /bb/receive/confirm`
- **角色**：安全员
- **请求体**：
```json
{
  "transportId": "TR001",
  "planId": "PL001",
  "siteId": "Z1",
  "arriveTime": "2026-11-09 09:35:00",
  "signUrl": "https://minio.local/signatures/safety_p3.png",
  "items": [
    { "goodsType": "zy", "spec": "2号岩石乳化炸药", "sendQty": 200.0, "recvQty": 200.0, "diffQty": 0.0 }
  ],
  "scenePhotos": [
    "https://minio.local/evidence/scene_1.jpg"
  ]
}
```

### 4.2 爆破施工作业登记 (E01-E09)
- **接口**：`POST /bb/blasting/record`
- **角色**：安全监理
- **请求体**：
```json
{
  "planId": "PL001",
  "blastTime": "2026-11-09 11:15:00",
  "blastMethod": "电力起爆",
  "blastResult": "NORMAL_RETURN",
  "usedItems": [
    { "goodsType": "zy", "spec": "2号岩石乳化炸药", "usedQty": 180.0 }
  ],
  "coVerifierIds": ["P3", "P7"],
  "supervisorSignUrl": "https://minio.local/signatures/super_p2.png",
  "blindFlag": 0
}
```

### 4.3 剩余物销毁登记 (E08/Q06)
- **接口**：`POST /bb/destroy/record`
- **请求体**：
```json
{
  "planId": "PL001",
  "destroyReason": "受潮破损炸药按规现场销毁",
  "items": [
    { "goodsType": "zy", "spec": "2号岩石乳化炸药", "destroyQty": 5.0 }
  ],
  "photos": [
    "https://minio.local/evidence/destroy_01.jpg"
  ]
}
```

### 4.4 剩余物退库与押运确认 (E02-E03/Q07)
- **接口**：
  1. 监理提交退库：`POST /bb/return/apply`
  2. 押运员扫码确认发车：`POST /bb/return/{id}/escort-confirm`
  3. 库管员入库核销（行锁回加库存）：`POST /bb/return/{id}/keeper-confirm`
- **卡口规则**：
  - 必须一次退完，不可分批（Q07）。
  - 必须原库退回。
  - 三量平衡硬校验：$\text{出库量} = \text{实爆量} + \text{退库量} + \text{销毁/损耗量}$。

---

## 5. 民警远程核验与大屏同源数据 (Module F & G)

### 5.1 民警远程核验签署 (F01-F04)
- **接口**：`POST /bb/verify/submit`
- **角色**：责任民警
- **请求体**：
```json
{
  "planId": "PL001",
  "items": [
    { "name": "证照齐全", "passed": true },
    { "name": "警戒设置", "passed": true },
    { "name": "人员在岗", "passed": true },
    { "name": "监控在线", "passed": true },
    { "name": "台账一致", "passed": true }
  ],
  "conclusion": "通过",
  "remark": "远程调阅全链凭据完整，四量平衡无误，准予结案归档"
}
```

### 5.2 俯瞰大屏与小程序同源详情视图 (G08)
- **接口**：`GET /bb/overview/{planId}`
- **说明**：大屏右侧抽屉与小程序端监管详情共用此接口。
- **返回结构**：
```json
{
  "code": 200,
  "data": {
    "plan": { "planNo": "BBJH20261108001", "siteName": "青龙山隧道进口作业点", "status": "已完成" },
    "outbound": { "outNo": "BBCK20261108001", "regKeeper": "钱有德", "revKeeper": "吴秀英", "revTime": "..." },
    "transport": { "vehiclePlate": "川L·10295", "escort": "孙立冬", "driver": "王强", "departTime": "...", "arriveTime": "..." },
    "receive": { "safetyOfficer": "赵铁柱", "arriveTime": "...", "diffFlag": 0 },
    "blasting": { "blastTime": "...", "supervisor": "李建国", "coVerifiers": ["赵铁柱", "张明"] },
    "returnOrDestroy": { "type": "退库", "qty": 15.0, "status": "已入库" },
    "verify": { "policeName": "刘峰", "conclusion": "通过", "verifyTime": "..." },
    "timelineLogs": [
      { "node": "计划填报", "opTime": "...", "operator": "张明" },
      { "node": "出库复核", "opTime": "...", "operator": "吴秀英" },
      { "node": "民警核验", "opTime": "...", "operator": "刘峰" }
    ]
  }
}
```

### 5.3 俯瞰大屏全域 GIS 态势接口 (G01)
- **接口**：`GET /bb/overview/map`
- **说明**：返回当日全域作业点、库房、车辆态势 GeoJSON 图层。

