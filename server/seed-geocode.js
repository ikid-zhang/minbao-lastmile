/**
 * 主数据对齐脚本（一次性 / 可重复执行）
 * 背景：主数据种子原为乐山口径，地图中心固定林芝巴宜区后点位漂出视野；
 * 本脚本把库房 / 作业点 / 打卡点经纬度，以及公司 / 库房地址、车辆车牌与
 * 运输许可证前缀，按内置种子（DEFAULT_STORE）同步到运行库（SQLite + JSON 快照），
 * 保留库房 stock 等运行态字段。
 * 用法：node --experimental-sqlite server/seed-geocode.js
 */
const path = require('path')
const { loadDB, saveDB, DEFAULT_STORE } = require(path.join(__dirname, 'db.js'))

const GEO_COLLS = ['storages', 'sites', 'checkpoints']
const TEXT_FIELDS = ['addr', 'plate', 'transLicence']
const SYNC_COLLS = ['companies', 'storages', 'vehicles', 'sites', 'checkpoints']

const db = loadDB()
let n = 0
for (const coll of SYNC_COLLS) {
  const seedList = DEFAULT_STORE[coll] || []
  for (const rec of db[coll] || []) {
    const s = seedList.find((x) => x.id === rec.id)
    if (!s) continue
    if (GEO_COLLS.includes(coll) && s.lng != null) { rec.lng = s.lng; rec.lat = s.lat }
    for (const f of TEXT_FIELDS) if (s[f] != null) rec[f] = s[f]
    n++
  }
}
saveDB(db)
console.log(`[seed-geocode] 已对齐 ${n} 条主数据（林芝巴宜区周边坐标 + 展示字段）`)
