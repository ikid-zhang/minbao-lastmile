#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成《民爆“最后一公里”监管》产品宣讲 PPT（公安蓝）。"""
from pathlib import Path

SKILL = Path("/Users/zhangkai/.workbuddy/skills/ppt-master")
OUT = Path("/Volumes/z/0.code/民爆最后一公里/ppt")

THEME_EXTRA = """
/* ============ 13. 公安蓝 police-blue ============
   藏青 + 警蓝，浅底正文页 + 深色"场"页（.slide.field）交替。 */
html[data-theme="police-blue"]{
  --page-bg:#dbe4f0; --bg:#f7f9fc; --surface:#ffffff;
  --ink:#0b1f3a; --ink-2:#2e4565; --ink-3:#6d84a2;
  --accent:#0b53c4; --accent-ink:#ffffff; --accent-soft:#e6eefb;
  --line:#d6e0ec; --radius:6px; --radius-sm:2px; --radius-pill:2px; --dot-radius:1px;
  --shadow:none; --h-weight:700;
  --font-h:var(--font-sans); --font-b:var(--font-sans); --font-m:var(--font-mono); --font-n:var(--font-figure);
  --pb-navy:#0b2647; --pb-blue:#0b53c4; --pb-red:#c8102e; --pb-sky:#4a9eff;
}
html[data-theme="police-blue"] .slide::before{
  content:"";position:absolute;top:0;left:0;right:0;height:calc(var(--sc)*5px);z-index:2;
  background:linear-gradient(90deg,var(--pb-blue) 0 calc(var(--sc)*150px),var(--pb-red) calc(var(--sc)*150px) calc(var(--sc)*200px),transparent calc(var(--sc)*200px));
}
html[data-theme="police-blue"] .slide.field{background:var(--pb-navy);color:#eaf2fd}
html[data-theme="police-blue"] .slide.field::before{
  background:linear-gradient(90deg,#7cb8ff 0 calc(var(--sc)*150px),var(--pb-red) calc(var(--sc)*150px) calc(var(--sc)*200px),transparent calc(var(--sc)*200px));
}
html[data-theme="police-blue"] .slide.field::after{
  content:"";position:absolute;inset:0;pointer-events:none;z-index:0;
  background:
    radial-gradient(760px 460px at 92% 4%, rgba(74,158,255,.20), transparent 62%),
    linear-gradient(rgba(140,180,235,.07) 1px,transparent 1px) 0 0/calc(var(--sc)*72px) calc(var(--sc)*72px),
    linear-gradient(90deg,rgba(140,180,235,.07) 1px,transparent 1px) 0 0/calc(var(--sc)*72px) calc(var(--sc)*72px);
}
html[data-theme="police-blue"] .slide.field .h1,
html[data-theme="police-blue"] .slide.field .big,
html[data-theme="police-blue"] .slide.field .cv-t,
html[data-theme="police-blue"] .slide.field .h2{color:#f3f8ff}
html[data-theme="police-blue"] .slide.field .lead,
html[data-theme="police-blue"] .slide.field .body,
html[data-theme="police-blue"] .slide.field .cv-s,
html[data-theme="police-blue"] .slide.field .bullets li{color:#b8cbe6}
html[data-theme="police-blue"] .slide.field .kicker{color:#7cb8ff}
html[data-theme="police-blue"] .slide.field .foot,
html[data-theme="police-blue"] .slide.field .small,
html[data-theme="police-blue"] .slide.field .cv-m{color:#88a4c8}
html[data-theme="police-blue"] .slide.field .mark{background:linear-gradient(transparent 58%,rgba(74,158,255,.32) 58%)}
html[data-theme="police-blue"] .slide.field .accent{color:#7cb8ff}
html[data-theme="police-blue"] .slide.field .tag{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.2);color:#dbe8f8}
html[data-theme="police-blue"] .slide.field .tag.solid{background:#7cb8ff;color:#0b2647;border-color:transparent}

/* ---- 六节点链路 ---- */
.chain{display:grid;grid-template-columns:repeat(6,1fr);gap:calc(var(--sc)*12px)}
.chain .nd{
  background:var(--surface);border:1px solid var(--line);border-top:calc(var(--sc)*3px) solid var(--accent);
  border-radius:var(--radius);padding:calc(var(--sc)*16px);display:flex;flex-direction:column;gap:calc(var(--sc)*8px);min-width:0;
}
.chain .nd .n{font-family:var(--font-n);font-size:calc(var(--sc)*15px);font-weight:700;color:var(--accent);letter-spacing:.08em}
.chain .nd .t{font-size:calc(var(--sc)*20px);font-weight:650;color:var(--ink);line-height:1.3}
.chain .nd .r{font-size:calc(var(--sc)*14px);color:var(--ink-3)}
.chain .nd .o{font-size:calc(var(--sc)*14px);color:var(--ink-2);line-height:1.55;border-top:1px solid var(--line);padding-top:calc(var(--sc)*8px);margin-top:auto}

/* ---- 手机示意 ---- */
.phone{
  width:calc(var(--sc)*300px);flex:none;background:var(--pb-navy);border-radius:calc(var(--sc)*32px);
  padding:calc(var(--sc)*8px);box-shadow:0 calc(var(--sc)*16px) calc(var(--sc)*40px) rgba(11,38,71,.26);
}
.phone .scr{background:#fff;border-radius:calc(var(--sc)*25px);overflow:hidden;display:flex;flex-direction:column}
.phone .pbar{display:flex;justify-content:space-between;font-size:calc(var(--sc)*11px);color:#8b9bb4;padding:calc(var(--sc)*10px) calc(var(--sc)*16px) 0;font-family:var(--font-n)}
.phone .phd{padding:calc(var(--sc)*12px) calc(var(--sc)*16px) calc(var(--sc)*10px);font-size:calc(var(--sc)*17px);font-weight:650;color:#0b1f3a}
.phone .pbody{padding:0 calc(var(--sc)*14px) calc(var(--sc)*14px);display:flex;flex-direction:column;gap:calc(var(--sc)*8px)}
.phone .fld{background:#f4f7fc;border:1px solid #e2e9f3;border-radius:calc(var(--sc)*7px);padding:calc(var(--sc)*9px) calc(var(--sc)*11px);display:flex;justify-content:space-between;align-items:center;gap:calc(var(--sc)*8px)}
.phone .fld .k{font-size:calc(var(--sc)*14px);color:#6d84a2;flex:none}
.phone .fld .v{font-size:calc(var(--sc)*14px);color:#0b1f3a;font-weight:600;white-space:nowrap}
.phone .tip{font-size:calc(var(--sc)*14px);color:#1c7a4a;background:#eaf7ef;border-radius:calc(var(--sc)*5px);padding:calc(var(--sc)*7px) calc(var(--sc)*9px)}
.phone .btnp{background:#0b53c4;color:#fff;text-align:center;font-size:calc(var(--sc)*15px);font-weight:650;border-radius:calc(var(--sc)*7px);padding:calc(var(--sc)*11px)}
.phone .ptab{display:flex;gap:calc(var(--sc)*10px);padding:calc(var(--sc)*8px) calc(var(--sc)*14px) calc(var(--sc)*12px);border-top:1px solid #eef2f8}
.phone .ptab span{flex:1;height:calc(var(--sc)*4px);background:#e6ecf6;border-radius:2px}
.phone .ptab span:first-child{background:#0b53c4}

/* ---- 平衡等式 ---- */
.eq{display:grid;grid-template-columns:1fr auto 1fr auto 1fr auto 1fr;align-items:center;gap:calc(var(--sc)*10px)}
.eq .term{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:calc(var(--sc)*18px) calc(var(--sc)*12px);text-align:center}
.eq .term.key{background:var(--accent-soft);border-color:transparent}
.eq .term .q{font-family:var(--font-n);font-size:calc(var(--sc)*34px);font-weight:700;color:var(--accent);line-height:1}
.eq .term .eu{font-size:calc(var(--sc)*15px);color:var(--ink-3);margin-top:calc(var(--sc)*6px)}
.eq .op{font-family:var(--font-n);font-size:calc(var(--sc)*24px);color:var(--ink-3);font-weight:600}
"""

COVER = """
<section class="slide field" data-title="封面">
  <div class="inner layout-cover">
    <div class="kicker anim">林安码小程序 · 危爆物品监管</div>
    <h1 class="cv-t anim">民爆“最后一公里”<br>监管一条链</h1>
    <p class="cv-s anim">从库房出库到现场起爆，六个交接节点全部留痕；公安按作业量分级介入，链路可回放、可检查、可考核。</p>
    <div class="cv-m anim"><span>产品宣讲</span><span>2026.11</span><span>治安综合 · 民爆监管</span></div>
  </div>
  <div class="notes">今天只讲一件事：民爆物品出了库房以后，那一段没人看得见的路上，我们怎么把它管住。三分钟讲业务断点，五分钟讲产品怎么接，最后留几分钟谈试点。</div>
</section>
"""

PROBLEMS = """
<section class="slide" data-title="现状问题">
  <div class="inner">
    <div class="head tight">
      <div class="kicker anim">现状 / Problem</div>
      <h2 class="h2 anim">管得住库房，管不住去向</h2>
    </div>
    <div class="g3 grow center-v">
      <div class="card anim"><div class="idx">01 台账慢</div><div class="ct">纸质登记事后补</div><div class="cb">账实不符，责任难认定。</div></div>
      <div class="card anim"><div class="idx">02 交接空</div><div class="ct">口头清点无凭证</div><div class="cb">少件多件，发现滞后。</div></div>
      <div class="card anim"><div class="idx">03 在途盲</div><div class="ct">运输段没有记录</div><div class="cb">人车路线全凭回忆。</div></div>
      <div class="card anim"><div class="idx">04 流向糊</div><div class="ct">剩余量说不清楚</div><div class="cb">私存倒卖有可乘空间。</div></div>
      <div class="card anim"><div class="idx">05 检查虚</div><div class="ct">到场看一圈就走</div><div class="cb">查没查、怎么查，无据。</div></div>
      <div class="card tint anim"><div class="idx">根因</div><div class="ct">数据在事后才产生</div><div class="cb">动作发生那一刻，系统是空的。</div></div>
    </div>
    <div class="foot"><span>前五条是表现，最后一条是根因</span><span class="pg"></span></div>
  </div>
  <div class="notes">五个问题念标题就够，落点在最后一张卡：不是人不认真，是数据产生得太晚。所有问题共享同一个根因，所以解法不是加表，是把录入前移。</div>
</section>
"""

ABSTRACT = """
<section class="slide" data-title="结论先行">
  <div class="inner">
    <div class="head tight"><div class="kicker anim">结论先行 / Abstract</div></div>
    <div class="grow col center-v">
      <p class="big anim">把五个交接动作搬进小程序：<span class="accent">一条链、六个节点、全程留痕</span>。</p>
      <div class="g3 anim">
        <div class="card"><div class="idx">01 事前</div><div class="ct">有计划，才管得住量</div><div class="cb">提前 6 小时报工区、点位、用量。</div></div>
        <div class="card"><div class="idx">02 事中</div><div class="ct">每步有人签、有时有地</div><div class="cb">签名、定位、照片随动作落库。</div></div>
        <div class="card"><div class="idx">03 事后</div><div class="ct">检查与核验可量化</div><div class="cb">分级到场，24 小时内核验。</div></div>
      </div>
    </div>
    <div class="foot"><span>先记住“一条链”，后面逐段展开</span><span class="pg"></span></div>
  </div>
  <div class="notes">如果只记一页，记这页。事前有计划，事中有留痕，事后可考核——三件事缺一件，链子就断。</div>
</section>
"""

PROBLEM = """
<section class="slide" data-title="业务断点">
  <div class="inner">
    <div class="head tight">
      <div class="kicker anim">现状 / Problem</div>
      <h2 class="h2 anim">六个环节，五处断点</h2>
    </div>
    <table class="tbl anim">
      <thead><tr><th style="width:22%">环节</th><th style="width:34%">今天怎么做</th><th>出了事才知道</th></tr></thead>
      <tbody>
        <tr><td><b>作业计划</b></td><td>电话、微信群报备</td><td>变更作业点没人知道</td></tr>
        <tr><td><b>出库交接</b></td><td>纸质三联单</td><td>账实不符，责任不清</td></tr>
        <tr class="hl"><td><b>运输在途</b></td><td>没有在途记录</td><td>人、车、路线全凭回忆</td></tr>
        <tr><td><b>到场接收</b></td><td>口头清点</td><td>少件多件，发现滞后</td></tr>
        <tr><td><b>爆破使用</b></td><td>记录事后补</td><td>剩余炸药流向不明</td></tr>
        <tr><td><b>公安监管</b></td><td>到场看一圈</td><td>去了没留痕</td></tr>
      </tbody>
    </table>
    <div class="foot"><span>来源：维稳一张网 2026-10-22 修改意见（民爆类 7 条）</span><span class="pg"></span></div>
  </div>
  <div class="notes">重点讲高亮那一行。前几行是“记不全”，这一行是“完全不知道”——物品在路上，系统里一个字都没有。这就是最后一公里。</div>
</section>
"""

STATEMENT = """
<section class="slide field" data-title="核心判断">
  <div class="inner layout-statement">
    <p class="big anim">纸质台账能证明“有人签过字”，<br>证明不了物品此刻在哪。</p>
    <p class="lead anim" style="max-width:78%">所以我们没有再造一张登记表，而是把录入时点前移到动作发生那一刻：系统预填时间与位置，人只做确认。</p>
    <div class="foot"><span>三个设计取舍：发生时即录 · 预填多手填少 · 一处数据两处视图</span><span class="pg"></span></div>
  </div>
  <div class="notes">这句话是产品立论。停两秒再讲下半句：如果录入发生在事后，所有数据都只是回忆的整理，监管价值为零。</div>
</section>
"""

CHAIN = """
<section class="slide" data-title="六节点闭环">
  <div class="inner">
    <div class="head tight">
      <div class="kicker anim">方案 / The Chain</div>
      <h2 class="h2 anim">六节点闭环，每步都有责任人和单据</h2>
    </div>
    <div class="grow col center-v" style="gap:calc(var(--sc)*22px)">
      <div class="chain anim">
        <div class="nd"><div class="n">01</div><div class="t">计划上报</div><div class="r">项目负责人</div><div class="o">工区 · 点位 · 用量</div></div>
        <div class="nd"><div class="n">02</div><div class="t">出库</div><div class="r">库管员</div><div class="o">按批次扣库存</div></div>
        <div class="nd"><div class="n">03</div><div class="t">押运出发</div><div class="r">押运员</div><div class="o">签收 · 人车 · 发车</div></div>
        <div class="nd"><div class="n">04</div><div class="t">到场接收</div><div class="r">安全员</div><div class="o">确认到达 · 核量</div></div>
        <div class="nd"><div class="n">05</div><div class="t">爆破登记</div><div class="r">安全监理</div><div class="o">实爆量 · 退库单</div></div>
        <div class="nd"><div class="n">06</div><div class="t">民警核验</div><div class="r">辖区民警</div><div class="o">清单 · 结论</div></div>
      </div>
      <div class="card flat anim" style="padding:calc(var(--sc)*16px) calc(var(--sc)*20px)">
        <div class="body" style="font-size:calc(var(--sc)*18px)">六节点数据同源：一个接口供大屏与小程序共用。</div>
      </div>
    </div>
    <div class="foot"><span>退库是反向第 3 段，复用押运链路</span><span class="pg"></span></div>
  </div>
  <div class="notes">从左往右讲，每个节点只说一句：谁做、留下什么。最后指一下底下那条：六个节点的数据出口只有一个接口。</div>
</section>
"""

PLAN = """
<section class="slide" data-title="计划环节">
  <div class="inner">
    <div class="head tight">
      <div class="kicker anim">环节一 / 计划</div>
      <h2 class="h2 anim">提前 6 小时不是提醒，是硬卡口</h2>
    </div>
    <div class="g21 grow" style="align-items:center">
      <div class="col" style="gap:calc(var(--sc)*22px)">
        <ul class="bullets anim">
          <li><b>不足 6 小时提交不了。</b>按服务端时间硬校验。</li>
          <li><b>工区必选。</b>计划自动落到本工区责任民警。</li>
          <li><b>计划量就是上限。</b>超 5% 拦截，超量须审批。</li>
        </ul>
        <div class="rule thick anim"></div>
      </div>
      <div class="anim" style="display:flex;justify-content:center">
        <div class="phone">
          <div class="scr">
                        <div class="phd">提交作业计划</div>
            <div class="pbody">
              <div class="fld"><span class="k">所属工区</span><span class="v">青龙山工区</span></div>
              <div class="fld"><span class="k">作业点位</span><span class="v">K01 东坡平台</span></div>
              <div class="fld"><span class="k">炸药</span><span class="v">480 kg</span></div>
              <div class="fld"><span class="k">计划爆破</span><span class="v">11-05 14:00</span></div>
              <div class="tip">可提交</div>
              <div class="btnp">提交计划</div>
            </div>
            <div class="ptab"><span></span><span></span><span></span><span></span></div>
          </div>
        </div>
      </div>
    </div>
    <div class="foot"><span>计划审核开关默认开启，低风险场景可由派出所关闭</span><span class="pg"></span></div>
  </div>
  <div class="notes">“提前 6 小时”不是为了卡人，是为了给库房备料、给民警留出审核和到场的时间。工区必选最容易被忽略，但它决定了责任民警是谁。</div>
</section>
"""

TRANSPORT = """
<section class="slide" data-title="押运环节">
  <div class="inner">
    <div class="head tight">
      <div class="kicker anim">环节二 / 押运</div>
      <h2 class="h2 anim">运输段补齐人、车、路、时四个要素</h2>
    </div>
    <div class="g3 grow">
      <div class="card anim"><div class="idx">01 签收</div><div class="ct">扫码核量，未签收停在待运输</div><div class="cb">按出库联单逐品种核对。</div></div>
      <div class="card anim"><div class="idx">02 人车</div><div class="ct">档案带出，现场只勾选</div><div class="cb">来自主数据。</div></div>
      <div class="card anim"><div class="idx">03 发车</div><div class="ct">时间与定位双写留痕</div><div class="cb">修正可留痕，路线可绘制。</div></div>
    </div>
    <div class="card flat anim" style="margin-top:calc(var(--sc)*22px)">
      <div class="cb">在途 30–60 秒上报一次定位；偏离路线 500 米连续 3 点、或非作业点停留超 15 分钟，自动预警到民警与库管员。</div>
    </div>
    <div class="foot"><span>山区无信号可离线暂存，恢复后自动补传</span><span class="pg"></span></div>
  </div>
  <div class="notes">这一段是最后一公里的核心。以前问押运员几点出发、走的哪条路，只能靠回忆；现在三个动作各留一个时间戳和一个坐标。</div>
</section>
"""

RECEIVE = """
<section class="slide" data-title="到场核量">
  <div class="inner">
    <div class="head tight">
      <div class="kicker anim">环节三 / 到场</div>
      <h2 class="h2 anim">到达时间以安全员确认为准</h2>
    </div>
    <div class="grow center-v">
      <div class="vs anim">
        <div class="side">
          <div class="sh">过去</div>
          <h3 class="h3">口头交接</h3>
          <ul class="bullets">
            <li>到达时间凭回忆</li>
            <li>差异说不清</li>
            <li>没有凭证</li>
          </ul>
        </div>
        <div class="mid">VS</div>
        <div class="side win">
          <div class="sh">现在</div>
          <h3 class="h3">确认式交接</h3>
          <ul class="bullets">
            <li>围栏预填建议到达时间</li>
            <li>安全员确认后才落库，来源留档</li>
            <li>差异须拍照说明，自动生成异常单</li>
          </ul>
        </div>
      </div>
    </div>
    <div class="foot"><span>系统预填只作提速，不自动落库；无信号可手填并标注原因</span><span class="pg"></span></div>
  </div>
  <div class="notes">这里有个刻意的克制：系统明明知道车几点进围栏，但不替安全员签字。谁确认、谁负责。</div>
</section>
"""

BLAST = """
<section class="slide" data-title="爆破与退库">
  <div class="inner">
    <div class="head tight">
      <div class="kicker anim">环节四 / 爆破与退库</div>
      <h2 class="h2 anim">三量平衡容差为零，不平就结不了单</h2>
    </div>
    <div class="grow col center-v" style="gap:calc(var(--sc)*28px)">
      <div class="eq anim">
        <div class="term key"><div class="q">480</div><div class="eu">出库量</div></div>
        <div class="op">=</div>
        <div class="term"><div class="q">432</div><div class="eu">实爆用量</div></div>
        <div class="op">+</div>
        <div class="term"><div class="q">48</div><div class="eu">退库量</div></div>
        <div class="op">+</div>
        <div class="term"><div class="q">0</div><div class="eu">损耗 / 盲炮</div></div>
      </div>
      <div class="g3">
        <div class="card anim"><div class="idx">三态结果</div><div class="ct">无返库 / 有返库 / 异常</div><div class="cb">盲炮处置一并登记。</div></div>
        <div class="card anim"><div class="idx">跨日退库</div><div class="ct">关联原出库单，可多次</div><div class="cb">按出库单归集，不限当日。</div></div>
        <div class="card anim"><div class="idx">反向押送</div><div class="ct">现场押回销售库</div><div class="cb">库管员核销，库存回加。</div></div>
      </div>
    </div>
    <div class="foot"><span>不平衡须生成异常单，民警确认后才能归档</span><span class="pg"></span></div>
  </div>
  <div class="notes">这条等式是整个系统的账。等式不平就不让结单——不是难为监理，是让剩余炸药没有“说不清”的空间。</div>
</section>
"""

CHECK = """
<section class="slide" data-title="公安分级检查">
  <div class="inner">
    <div class="head tight">
      <div class="kicker anim">监管 / 分级到场</div>
      <h2 class="h2 anim">按作业量自动定到场级别</h2>
    </div>
    <div class="g3 grow center-v">
      <div class="card anim">
        <div class="idx">&lt; 600 kg</div>
        <div class="metric"><div class="n">抽查</div></div>
        <div class="cb">随机抽查，可远程调阅。</div>
      </div>
      <div class="card tint anim">
        <div class="idx">600 – 1200 kg</div>
        <div class="metric"><div class="n">警务室</div></div>
        <div class="cb">必须到场，扫码签到。</div>
      </div>
      <div class="card anim">
        <div class="idx">&gt; 1200 kg</div>
        <div class="metric"><div class="n">治安大队</div></div>
        <div class="cb">必须到场，全程监督。</div>
      </div>
    </div>
    <div class="card flat anim" style="margin-top:calc(var(--sc)*20px)">
      <div class="cb">六环节任一处可发起检查；检查项模板化，<b>必须拍照留证</b>，结论分合格、整改、移交。</div>
    </div>
    <div class="foot"><span>雷管按 TNT 当量折算，阈值与到场单位后台可配</span><span class="pg"></span></div>
  </div>
  <div class="notes">以前“要不要去现场”靠经验，现在系统按量派单。这一条直接对应检查覆盖率和分级到场执行率。</div>
</section>
"""

VERIFY = """
<section class="slide" data-title="核验与俯瞰">
  <div class="inner">
    <div class="head tight">
      <div class="kicker anim">监管 / 核验</div>
      <h2 class="h2 anim">一处数据、两处视图</h2>
    </div>
    <div class="g21 grow">
      <div class="col" style="gap:calc(var(--sc)*14px)">
        <p class="lead anim">民警不必到场：调阅六节点数据与证据，逐项打勾出结论。</p>
        <div class="card anim" style="gap:calc(var(--sc)*10px)">
          <div class="idx">核验清单</div>
          <div class="cb">证照 · 警戒 · 在岗 · 监控 · 台账</div>
        </div>
        <div class="tags anim"><span class="tag solid">通过</span><span class="tag">责令整改</span><span class="tag">移交查处</span></div>
      </div>
      <div class="col center-v" style="gap:calc(var(--sc)*10px)">
        <div class="card anim" style="text-align:center;padding:calc(var(--sc)*18px)"><div class="ct">民警核验页</div><div class="cb">六节点时间轴</div></div>
        <div class="anim" style="text-align:center;color:var(--accent);font-size:calc(var(--sc)*18px)">↕</div>
        <div class="card tint anim" style="text-align:center;padding:calc(var(--sc)*18px)"><div class="ct">统一接口</div><div class="cb mono">/bb/overview/{planId}</div></div>
        <div class="anim" style="text-align:center;color:var(--accent);font-size:calc(var(--sc)*18px)">↕</div>
        <div class="card anim" style="text-align:center;padding:calc(var(--sc)*18px)"><div class="ct">俯瞰大屏（自建）</div><div class="cb">GIS 一张图 · 事件墙 · 同一份 JSON</div></div>
      </div>
    </div>
    <div class="foot"><span>超 24 小时未核验进督办列表</span><span class="pg"></span></div>
  </div>
  <div class="notes">俯瞰大屏由我们建设（系统建设内容）：中央地图一张图，作业点、库房、在途车辆三层图层，异常事件墙实时滚动。我们保证：大屏点开一个作业点，看到的数据和民警手机上一样——同一份 JSON，同源同口径。</div>
</section>
"""

ROLES = """
<section class="slide" data-title="角色分工">
  <div class="inner">
    <div class="head tight">
      <div class="kicker anim">落地 / 谁来做</div>
      <h2 class="h2 anim">七类角色，各管一段</h2>
    </div>
    <table class="tbl anim">
      <thead><tr><th style="width:22%">角色</th><th style="width:44%">关键动作</th><th>数据权限</th></tr></thead>
      <tbody>
        <tr><td><b>项目负责人</b></td><td>提前 6h 报计划</td><td>本单位项目</td></tr>
        <tr><td><b>库管员</b></td><td>批次出库与入库</td><td>本库库存</td></tr>
        <tr><td><b>押运员</b></td><td>签收 / 人车 / 发车</td><td>本车次</td></tr>
        <tr><td><b>安全员</b></td><td>确认到达、核量</td><td>本作业点</td></tr>
        <tr><td><b>安全监理</b></td><td>爆破登记、退库</td><td>本作业点</td></tr>
        <tr class="hl"><td><b>辖区民警</b></td><td>审核、检查、核验</td><td>本工区</td></tr>
        <tr><td><b>治安管理员</b></td><td>主数据与阈值配置</td><td>全域</td></tr>
      </tbody>
    </table>
    <div class="foot"><span>一线少填字，后台多配置</span><span class="pg"></span></div>
  </div>
  <div class="notes">点一下高亮行：民警不是最后一个签字的人，他是全程都看得见的人。</div>
</section>
"""

KPI = """
<section class="slide" data-title="考核指标">
  <div class="inner">
    <div class="head">
      <div class="kicker anim">成效 / Metrics</div>
      <h2 class="h2 anim">四个数字，按月出账</h2>
      <p class="sub anim">系统自动计算，不需要另做报表。</p>
    </div>
    <div class="g4 grow center-v">
      <div class="card anim"><div class="metric"><div class="n">95<small>%</small></div><div class="l">链路闭环率</div></div></div>
      <div class="card anim"><div class="metric"><div class="n">98<small>%</small></div><div class="l">六节点完整率</div></div></div>
      <div class="card anim"><div class="metric"><div class="n">100<small>%</small></div><div class="l">24h 核验覆盖</div></div></div>
      <div class="card anim"><div class="metric"><div class="n">2<small>%</small></div><div class="l">数量差异率上限</div></div></div>
    </div>
    <div class="card flat anim" style="margin-top:calc(var(--sc)*22px)">
      <div class="cb">辅助：主数据完整率 ≥ 98%、6h 填报率 ≥ 90%、分级到场执行率 100%。</div>
    </div>
    <div class="foot"><span>口径见设计说明第 9 节</span><span class="pg"></span></div>
  </div>
  <div class="notes">闭环率是第一指标，其余三个是它的拆解。数字不达标，通常是某一类角色没在用。</div>
</section>
"""

ROADMAP = """
<section class="slide" data-title="推进路线">
  <div class="inner">
    <div class="head tight">
      <div class="kicker anim">Roadmap</div>
      <h2 class="h2 anim">三期推进：先闭环，再预警，后智能</h2>
    </div>
    <div class="grow center-v">
      <div class="timeline anim">
        <div class="tl-item cur"><div class="ty">一期</div><div class="tt">闭环最小可用</div><div class="td">主数据 + 六节点全链 + 分级检查 + 远程核验。</div></div>
        <div class="tl-item"><div class="ty">二期</div><div class="tt">监管增强</div><div class="td">轨迹预警、核验督办、覆盖率考核。</div></div>
        <div class="tl-item"><div class="ty">三期</div><div class="tt">智能提升</div><div class="td">一物一码、AI 比对、区块链存证。</div></div>
      </div>
    </div>
    <div class="foot"><span>一期范围：A–G + J 主数据 + K 检查，共 59 项</span><span class="pg"></span></div>
  </div>
  <div class="notes">一期不求全，只求链子闭合。链子闭合了，二三期才有数据可用。</div>
</section>
"""

END = """
<section class="slide field" data-title="下一步">
  <div class="inner layout-end">
    <div class="kicker plain anim">Next Step</div>
    <h1 class="h1 anim">先选一个县，把链子跑通</h1>
    <ul class="bullets lg anim" style="text-align:left;max-width:calc(var(--sc)*820px)">
      <li>1 个县、2 个工区试点，先跑通“出库—运输—到场—爆破—退库”全链</li>
      <li>主数据先建档生效，再放开作业节点</li>
      <li>以闭环率、核验覆盖率两条线验收，达标后扩面</li>
    </ul>
    <div class="tags anim"><span class="tag solid">闭环率 ≥ 95%</span><span class="tag">24h 核验覆盖 100%</span><span class="tag">林安码小程序</span></div>
  </div>
  <div class="notes">收尾给三件具体的事，不说“请领导支持”。最后一句：链子通不通，跑一个县就知道。</div>
</section>
"""

SOURCE = """
<section class="slide" data-title="数据来源">
  <div class="inner">
    <div class="head tight">
      <div class="kicker anim">答疑 / 主数据</div>
      <h2 class="h2 anim">基础数据：企业报、公安审，生效才能用</h2>
    </div>
    <table class="tbl anim">
      <thead><tr><th style="width:20%">数据</th><th style="width:56%">来源凭证</th><th>落地</th></tr></thead>
      <tbody>
        <tr><td><b>库房</b></td><td>企业建档：销售库/使用库、围栏</td><td>J03–J05</td></tr>
        <tr><td><b>四大员</b></td><td>公司申报，附从业资格证</td><td>J02</td></tr>
        <tr><td><b>项目备案</b></td><td>工区范围、关联公司、有效期</td><td>J08</td></tr>
        <tr><td><b>项目负责人</b></td><td>随公司档案，独立岗位</td><td>J01/J02</td></tr>
        <tr><td><b>车辆</b></td><td>车牌载重 + 驾驶员资格证</td><td>J06/J07</td></tr>
      </tbody>
    </table>
    <div class="card tint anim" style="margin-top:calc(var(--sc)*18px)">
      <div class="cb">治安管理员审核生效后方可引用，杜绝先建后审。</div>
    </div>
    <div class="foot"><span>人车库项目，全程可追溯</span><span class="pg"></span></div>
  </div>
  <div class="notes">答疑页：数据从哪来？全部走“企业报、公安审”两条腿，审核不生效就用不了，杜绝先上车后补票。补充两点：未生效数据不能被任何作业节点引用；预留公安部民爆信息系统双向回传接口。</div>
</section>
"""

SLIDES = [COVER, PROBLEMS, ABSTRACT, PROBLEM, STATEMENT, CHAIN, PLAN, TRANSPORT,
          RECEIVE, BLAST, CHECK, VERIFY, ROLES, KPI, ROADMAP, SOURCE, END]


def main():
    tpl = (SKILL / "assets" / "deck-template.html").read_text(encoding="utf-8")
    themes = (SKILL / "assets" / "themes.css").read_text(encoding="utf-8")
    html = (tpl
            .replace("__TITLE__", "民爆“最后一公里”监管 · 产品宣讲")
            .replace("__THEME__", "police-blue")
            .replace("__RATIO__", "16:9")
            .replace("__W__", "1280")
            .replace("__H__", "720")
            .replace("__THEMES__", themes + THEME_EXTRA)
            .replace("__SLIDES__", "\n".join(SLIDES)))
    (OUT / "index.html").write_text(html, encoding="utf-8")
    print("pages:", len(SLIDES), "bytes:", len(html.encode()))


if __name__ == "__main__":
    main()
