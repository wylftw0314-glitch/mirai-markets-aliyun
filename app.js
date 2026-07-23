const DEFAULT_SYMBOLS = [
  '^N225','^TOPX','^KS11','^KQ11',
  '6758.T','8035.T','6857.T','6861.T','9984.T','6723.T','6146.T','7974.T',
  '005930.KS','000660.KS','035420.KS','035720.KS','066570.KS','009150.KS','042700.KS','373220.KS',
  'AAPL','MSFT','NVDA','AMZN','GOOGL','META','TSLA','AMD'
];

function readJSON(key,fallback){
  try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}
  catch(error){return fallback}
}
function readSectorLimit(){const saved=localStorage.getItem('mirai-sector-limit');return saved===null?60:[0,30,60,100,200].includes(Number(saved))?Number(saved):60}

const state={
  items:[],market:'ALL',
  chinaEtfs:[],activeEtf:null,activeDetail:null,detailDate:null,detailDates:[],detailInterval:1,flowInitialized:false,lastFlowAlert:null,flowDate:null,flowViewDate:null,flowDates:[],flowChartData:null,flowSeries:{speed:true,sh:true,sz:true,cyb:true,star50:true},flowXZoom:1,flowYZoom:1,flowYOffset:0,sectors:[],sectorType:'industry',sectorSort:'heat',sectorQuery:'',sectorLimit:readSectorLimit(),sectorFavorites:readJSON('mirai-sector-favorites',[]),activeSector:null,sectorDate:null,sectorInterval:1,sectorDetailData:null,sectorSeries:{sector:true},
  favorites:readJSON('mirai-favorites',[]),
  customStocks:readJSON('mirai-custom-stocks',[]),
  currency:localStorage.getItem('mirai-currency')||'LOCAL',
  rates:{USD:1}
};
const settings={theme:'paper',rise:'green',accent:'#0d6b55',...readJSON('mirai-settings',{})};
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

$('#market-closed').insertAdjacentHTML('afterend','<div id="detail-date-controls" class="detail-date-controls"><button id="detail-prev-day" type="button" aria-label="上一交易日">‹ 上一交易日</button><label>交易日 <input id="detail-date" type="date" aria-label="选择交易日"></label><button id="detail-next-day" type="button" aria-label="下一交易日">下一交易日 ›</button><button id="detail-latest-day" type="button">最新</button></div>');
$('#china-market-section .china-banner').insertAdjacentHTML('afterend','<section class="flow-radar" aria-labelledby="flow-radar-title"><div class="flow-radar-head"><div><p>A-SHARE MONEY FLOW RADAR</p><h3 id="flow-radar-title">当日主力资金流速</h3><span id="flow-radar-time">正在连接沪深分钟资金流</span></div><button id="flow-notification-toggle" type="button">开启提醒</button></div><div class="flow-day-controls"><button id="flow-prev-day" type="button">‹ 上一交易日</button><label>交易日 <input id="flow-date" type="date"></label><button id="flow-next-day" type="button">下一交易日 ›</button><button id="flow-latest-day" type="button">最新</button></div><div class="flow-radar-grid"><div><span>沪深累计主力净流入</span><strong id="flow-radar-net">—</strong></div><div><span>当前流速（3分钟平滑）</span><strong id="flow-radar-speed">—</strong></div><div><span>流速状态</span><strong id="flow-radar-status">等待数据</strong></div></div><div class="flow-chart-legend"><span class="speed">资金流速</span><span class="sh">上证</span><span class="sz">深指</span><span class="cyb">创业板</span><span class="star50">科创50</span></div><div id="flow-radar-chart" class="flow-radar-chart" aria-label="主力资金流速与主要指数走势"></div><div id="flow-alert-history" class="flow-alert-history"><span>提醒记录</span><p>尚未触发流速提醒</p></div><small>口径：上证指数与深证成指对应市场主力净流入合计；指数曲线按所选交易日首个点位归一化为涨跌幅。主力分钟历史通过阿里云边缘存储逐日积累。</small></section>');
$('.flow-chart-legend').innerHTML='<button class="speed active" data-flow-series="speed">资金流速</button><button class="sh active" data-flow-series="sh">上证</button><button class="sz active" data-flow-series="sz">深指</button><button class="cyb active" data-flow-series="cyb">创业板</button><button class="star50 active" data-flow-series="star50">科创50</button>';
$('.flow-chart-legend').insertAdjacentHTML('afterend','<div class="flow-chart-controls"><label>时间范围 <select id="flow-x-zoom"><option value="1">全天</option><option value="0.75">最近75%</option><option value="0.5">最近50%</option><option value="0.25">最近25%</option></select></label><span>纵向</span><button type="button" data-flow-action="zoom-in">放大＋</button><button type="button" data-flow-action="zoom-out">缩小－</button><button type="button" data-flow-action="up">上移↑</button><button type="button" data-flow-action="down">下移↓</button><button type="button" data-flow-action="reset">复位</button></div>');
$('.flow-radar').insertAdjacentHTML('afterend','<section class="sector-monitor"><div class="sector-monitor-head"><div><p>A-SHARE SECTOR WATCH</p><h3>A股板块看盘</h3><span id="sector-updated">正在加载板块数据</span></div><button id="refresh-sectors" type="button">刷新板块</button></div><div class="sector-toolbar"><div class="sector-tabs"><button class="active" data-sector-type="industry">行业板块</button><button data-sector-type="concept">概念板块</button></div><input id="sector-search" type="search" placeholder="搜索板块或龙头股" aria-label="搜索板块"><label>排序 <select id="sector-sort"><option value="heat">市场热度</option><option value="changePercent">当日涨幅</option><option value="fiveMinute">5分钟动量</option><option value="mainNet">主力净流入</option><option value="mainSpeed">资金流速</option><option value="amount">成交额</option><option value="amountSpeed">成交额增速</option><option value="turnover">换手率</option></select></label></div><div class="sector-summary" id="sector-summary"></div><div class="sector-table-wrap"><table class="sector-table"><thead><tr><th>板块 / 龙头</th><th>涨跌</th><th>5分钟</th><th>相对沪深300</th><th>成交额 / 增速</th><th>换手</th><th>主力净流入 / 流速</th><th>涨 / 跌</th><th>热度</th></tr></thead><tbody id="sector-body"><tr><td colspan="9">正在获取板块行情…</td></tr></tbody></table></div></section>');
$('.sector-table-wrap').outerHTML='<section id="sector-favorites" class="sector-favorites" hidden><div class="sector-subhead"><h4>收藏置顶</h4><span id="sector-favorite-count"></span></div><div id="sector-favorite-mosaic" class="sector-mosaic favorite-mosaic"></div></section><div id="sector-mosaic" class="sector-mosaic" aria-live="polite"><p class="sector-loading">正在获取板块行情…</p></div>';
$('.sector-summary').insertAdjacentHTML('afterend','<div class="sector-heat-legend"><span><i class="rise"></i>上涨</span><span><i class="fall"></i>下跌</span><span><i class="flat"></i>平盘</span><b>拼图面积代表市场热度</b></div>');
$('.sector-toolbar').insertAdjacentHTML('beforeend','<label class="sector-limit-control">显示数量 <select id="sector-limit" aria-label="选择显示板块数量"><option value="30">30</option><option value="60">60</option><option value="100">100</option><option value="200">200</option><option value="0">全部</option></select></label><button id="sector-fullscreen" class="sector-fullscreen-button" type="button">全屏看盘</button>');
document.body.insertAdjacentHTML('beforeend','<div id="sector-detail" class="detail-backdrop sector-detail-backdrop" hidden><section class="detail-panel sector-detail-panel" role="dialog" aria-modal="true" aria-labelledby="sector-detail-name"><div class="detail-top"><div><p>A-SHARE SECTOR DETAIL</p><h2 id="sector-detail-name">板块详情</h2><span id="sector-detail-meta"></span></div><button id="close-sector-detail" aria-label="关闭板块详情">×</button></div><div class="sector-detail-controls"><button id="sector-prev-day">‹ 上一交易日</button><input id="sector-date" type="date" aria-label="板块交易日"><button id="sector-next-day">下一交易日 ›</button><button id="sector-latest-day">最新</button><div class="interval-switch sector-intervals"><button data-sector-interval="1" class="active">1分</button><button data-sector-interval="5">5分</button><button data-sector-interval="15">15分</button><button data-sector-interval="30">30分</button><button data-sector-interval="60">60分</button></div></div><div class="sector-detail-stats"><div><span>板块最新</span><strong id="sector-detail-price">—</strong></div><div><span>30分钟动量</span><strong id="sector-detail-momentum">—</strong></div><div><span>数据状态</span><strong id="sector-detail-source">正在加载</strong></div></div><h4>板块指数 · 成交量 · MACD</h4><div id="sector-technical-chart" class="detail-chart"></div><div class="sector-leader-heading"><h4>龙头个股日内走势</h4><div id="sector-leader-legend" class="sector-leader-legend"></div></div><div id="sector-leader-chart" class="sector-leader-chart"></div><div class="table-wrap"><table class="monitor-table sector-leader-table"><thead><tr><th>综合排名</th><th>龙头个股</th><th>价格</th><th>涨跌</th><th>成交额</th><th>主力净流入</th><th>换手率</th></tr></thead><tbody id="sector-leader-body"></tbody></table></div></section></div>');
$('#sector-detail-source').parentElement.insertAdjacentHTML('beforebegin','<div><span>分时点位</span><strong id="sector-detail-point">将鼠标移到曲线上</strong></div>');
document.body.insertAdjacentHTML('beforeend','<div id="flow-toast" class="flow-toast" role="status" aria-live="assertive" hidden></div>');

function updateDetailDateControls(data){
  state.detailDate=data.marketDate||state.detailDate;
  state.detailDates=Array.isArray(data.availableDates)?data.availableDates:state.detailDate?[state.detailDate]:[];
  const input=$('#detail-date'),index=state.detailDates.indexOf(state.detailDate);
  input.value=state.detailDate||'';
  if(state.detailDates.length){input.min=state.detailDates[0];input.max=state.detailDates[state.detailDates.length-1]}
  $('#detail-prev-day').disabled=index<=0;
  $('#detail-next-day').disabled=index<0||index>=state.detailDates.length-1;
  $('#detail-latest-day').disabled=index===state.detailDates.length-1;
}

function reloadDetailForDate(date){
  state.detailDate=date||null;
  if(state.activeEtf)loadEtfChart(state.detailInterval,date);
  else if(state.activeDetail)openDetail(state.activeDetail.symbol,date);
}

function applySettings(){
  document.documentElement.dataset.theme=settings.theme;
  document.documentElement.dataset.rise=settings.rise;
  document.documentElement.style.setProperty('--accent',settings.accent);
  $('#accent').value=settings.accent;
  $('#accent-value').textContent=settings.accent.toUpperCase();
  $$('[data-theme]').forEach(element=>element.classList.toggle('selected',element.dataset.theme===settings.theme));
  $$('[data-rise]').forEach(element=>element.classList.toggle('selected',element.dataset.rise===settings.rise));
  localStorage.setItem('mirai-settings',JSON.stringify(settings));
}

function converted(value,from){
  if(state.currency==='LOCAL'||!state.rates[from])return {value:Number(value),currency:from};
  const usd=Number(value)/state.rates[from];
  return {value:state.currency==='USD'?usd:usd*(state.rates.CNY||1),currency:state.currency};
}

function money(value,currency){
  const result=converted(Number(value),currency);
  return result.value.toLocaleString(undefined,{maximumFractionDigits:['USD','CNY'].includes(result.currency)?2:0})+' '+result.currency;
}

function pointTime(value){
  const text=String(value||'').trim(),raw=text.replace(/\D/g,'');
  let date=null;
  if(/^\d{12,14}$/.test(text))date=new Date(Date.UTC(+raw.slice(0,4),+raw.slice(4,6)-1,+raw.slice(6,8),+raw.slice(8,10)-9,+raw.slice(10,12),raw.length>=14?+raw.slice(12,14):0));
  else if(/^\d{4}-\d{2}-\d{2}T/.test(text))date=new Date(text);
  if(!date||Number.isNaN(date.getTime()))return text;
  return new Intl.DateTimeFormat(undefined,{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZoneName:'short'}).format(date);
}

function marketCapValue(value){
  if(typeof value==='number')return value;
  const text=String(value||'').replace(/,/g,'');
  const jo=Number((text.match(/([\d.]+)\s*조/)||[])[1]||0),eok=Number((text.match(/([\d.]+)\s*억/)||[])[1]||0);
  if(jo||eok)return jo*1e12+eok*1e8;
  const plain=Number(text.replace(/[^\d.-]/g,''));
  return Number.isFinite(plain)&&plain>0?plain:null;
}

function marketCap(value,currency){
  const total=marketCapValue(value);
  if(!total)return value||'暂无数据';
  const result=converted(total,currency),unit={KRW:'韩元',JPY:'日元',USD:'美元',CNY:'人民币'}[result.currency]||result.currency;
  if(result.value>=1e12)return (result.value/1e12).toLocaleString('zh-CN',{maximumFractionDigits:2})+' 万亿'+unit;
  return (result.value/1e8).toLocaleString('zh-CN',{maximumFractionDigits:2})+' 亿'+unit;
}

function peRatio(value){
  const number=Number(String(value||'').replace(/,/g,'').replace(/배/gi,'').replace(/倍/g,'').trim());
  return Number.isFinite(number)&&number>0?number.toLocaleString('zh-CN',{maximumFractionDigits:2})+' 倍':value||'暂无数据';
}

function sessionLabel(value){return {pre:'盘前',regular:'盘中',after:'盘后',closed:'休市'}[value]||''}

function spark(points,positive){
  if(!points?.length||points.length<2)return '<span class="spark-empty">等待当日分时</span>';
  const min=Math.min(...points),max=Math.max(...points),range=max-min||1;
  const path=points.map((point,index)=>`${index?'L':'M'} ${(index/(points.length-1))*180} ${48-((point-min)/range)*42}`).join(' ');
  return `<svg class="spark" viewBox="0 0 180 52" aria-label="今日走势"><path class="${positive?'up':'down'}" d="${path}"/><path class="base" d="M0 51H180"/></svg>`;
}

function card(item){
  return `<article class="index-card"><div class="row"><div><span class="flag">${escapeHTML(item.market)}</span><h3>${escapeHTML(item.name)}</h3><small>${escapeHTML(item.localName)}</small></div><strong>${Number(item.price).toLocaleString()}</strong></div><div class="row chart"><span class="${item.change>=0?'gain':'loss'}">${item.change>=0?'+':''}${Number(item.changePercent).toFixed(2)}%</span>${spark(item.points,item.change>=0)}</div></article>`;
}

function stock(item){
  const favorite=state.favorites.includes(item.id),shownChange=converted(item.change,item.currency);
  const session=item.market==='US'?` · <b class="session-badge session-${escapeHTML(item.marketSession||'closed')}">${sessionLabel(item.marketSession||'closed')}</b>`:'';
  return `<article class="stock ${favorite?'favorite':''}" data-detail="${escapeHTML(item.symbol)}" role="button" tabindex="0" aria-label="查看 ${escapeHTML(item.name)} 详情"><div class="company"><span class="flag">${escapeHTML(item.market)}</span><div><h3>${escapeHTML(item.name)}</h3><small>${escapeHTML(item.localName)} · ${escapeHTML(item.symbol)}${session}</small></div></div><strong>${money(item.price,item.currency)}</strong><span class="${item.change>=0?'gain':'loss'}">${item.change>=0?'+':''}${Math.abs(shownChange.value).toLocaleString(undefined,{maximumFractionDigits:2})} ${shownChange.currency}<small>${item.changePercent>=0?'+':''}${Number(item.changePercent).toFixed(2)}%</small></span>${spark(item.points,item.change>=0)}<button class="star" data-favorite="${escapeHTML(item.id)}" aria-label="${favorite?'取消收藏':'收藏'}${escapeHTML(item.name)}">${favorite?'★':'☆'}</button></article>`;
}

function render(){
  const chinaOnly=state.market==='CN';
  $('#global-market-sections').hidden=chinaOnly;
  $('#china-market-section').hidden=!chinaOnly;
  const items=state.items.filter(item=>state.market==='ALL'||item.market===state.market).sort((a,b)=>Number(state.favorites.includes(b.id))-Number(state.favorites.includes(a.id)));
  $('#indexes').innerHTML=items.filter(item=>item.kind==='index').map(card).join('');
  $('#stocks').innerHTML=items.filter(item=>item.kind==='stock').map(stock).join('');
  const ups=state.items.filter(item=>item.changePercent>0).length;
  $('#sentiment').textContent=ups>=state.items.length/2?'偏多':'偏空';
  $('#sentiment-count').textContent=`上涨标的 ${ups} / ${state.items.length}`;
  $('#sentiment-bar').style.width=`${state.items.length?ups/state.items.length*100:0}%`;
  $$('[data-favorite]').forEach(button=>button.onclick=event=>{event.stopPropagation();state.favorites=state.favorites.includes(button.dataset.favorite)?state.favorites.filter(value=>value!==button.dataset.favorite):[...state.favorites,button.dataset.favorite];localStorage.setItem('mirai-favorites',JSON.stringify(state.favorites));render()});
  $$('[data-detail]').forEach(row=>{row.onclick=()=>openDetail(row.dataset.detail);row.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openDetail(row.dataset.detail)}}});
}

function fullChart(points,labels=[],currency='KRW',reference=null,sessions=[]){
  if(!points?.length||points.length<2)return '<p>今日还没有足够的成交点位。</p>';
  const base=Number(reference),hasBase=Number.isFinite(base)&&base>0,scalePoints=hasBase?[...points,base]:points;
  const min=Math.min(...scalePoints),max=Math.max(...scalePoints),range=max-min||1,w=820,h=270,pad=18;
  const y=value=>h-pad-((value-min)/range)*(h-pad*2);
  const coordinates=points.map((value,index)=>[pad+(index/Math.max(1,points.length-1))*(w-pad*2),y(value)]);
  const allLine=coordinates.map((point,index)=>`${index?'L':'M'}${point[0].toFixed(1)},${point[1].toFixed(1)}`).join(' ');
  const area=allLine+` L${w-pad},${h-pad} L${pad},${h-pad} Z`;
  let lines='';
  for(let index=1;index<coordinates.length;index++){
    const session=sessions[index]||sessions[index-1]||'regular',from=coordinates[index-1],to=coordinates[index];
    lines+=`<path class="chart-line session-${escapeHTML(session)}" d="M${from[0].toFixed(1)},${from[1].toFixed(1)}L${to[0].toFixed(1)},${to[1].toFixed(1)}"/>`;
  }
  const hits=coordinates.map((point,index)=>{const label=labels[index]?pointTime(labels[index]):'点位 '+(index+1),session=sessions[index]||'regular';return `<circle class="chart-hit" tabindex="0" cx="${point[0].toFixed(1)}" cy="${point[1].toFixed(1)}" r="4" data-label="${escapeHTML(label)}" data-session="${escapeHTML(session)}" data-value="${points[index]}" data-currency="${escapeHTML(currency)}"><title>${escapeHTML(label)} · ${points[index]}</title></circle>`}).join('');
  const zero=hasBase?`<path class="chart-zero" d="M${pad},${y(base).toFixed(1)}H${w-pad}"/><text class="chart-zero-label" x="${w-pad-3}" y="${Math.max(12,y(base)-5).toFixed(1)}" text-anchor="end">0% · 昨收</text>`:'';
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="当日价格走势，相对昨收零轴">${zero}<path class="chart-base" d="M${pad},${h-pad}H${w-pad}"/><path class="chart-area" d="${area}"/>${lines}${hits}</svg>`;
}

function emaSeries(values,period){let previous=null,multiplier=2/(period+1);return values.map(value=>{previous=previous==null?Number(value):Number(value)*multiplier+previous*(1-multiplier);return previous})}
function macdSeries(values){const fast=emaSeries(values,12),slow=emaSeries(values,26),dif=values.map((_,index)=>fast[index]-slow[index]),dea=emaSeries(dif,9),hist=dif.map((value,index)=>(value-dea[index])*2);return {dif,dea,hist}}
function formatVolume(value){const number=Number(value)||0;if(number>=1e8)return (number/1e8).toFixed(2)+' 亿手';if(number>=1e4)return (number/1e4).toFixed(2)+' 万手';return number.toLocaleString('zh-CN')+' 手'}

function technicalChart(data,currency='CNY'){
  const points=data.points||[],labels=data.labels||[],volumes=data.volumes||[],amounts=data.amounts||[];
  if(points.length<2)return '<p>最近交易日还没有足够的技术指标点位。</p>';
  const w=820,h=520,pad=30,priceTop=22,priceBottom=252,volumeTop=292,volumeBottom=370,macdTop=410,macdBottom=498,base=Number(data.previousClose),hasBase=Number.isFinite(base)&&base>0,scalePoints=hasBase?[...points,base]:points,min=Math.min(...scalePoints),max=Math.max(...scalePoints),range=max-min||1,x=index=>pad+(index/Math.max(1,points.length-1))*(w-pad*2),priceY=value=>priceBottom-((value-min)/range)*(priceBottom-priceTop),coords=points.map((value,index)=>[x(index),priceY(value)]),line=coords.map((point,index)=>`${index?'L':'M'}${point[0].toFixed(1)},${point[1].toFixed(1)}`).join(' '),area=line+` L${x(points.length-1)},${priceBottom} L${pad},${priceBottom} Z`,barWidth=Math.max(1,Math.min(10,(w-pad*2)/points.length*.7)),volumeMax=Math.max(...volumes,1),amountMax=Math.max(...amounts,1),volumeY=value=>volumeBottom-(Number(value||0)/volumeMax)*(volumeBottom-volumeTop),amountY=value=>volumeBottom-(Number(value||0)/amountMax)*(volumeBottom-volumeTop),amountLine=amounts.map((value,index)=>`${index?'L':'M'}${x(index).toFixed(1)},${amountY(value).toFixed(1)}`).join(' '),macd=macdSeries(points),macdMax=Math.max(...macd.dif.map(Math.abs),...macd.dea.map(Math.abs),...macd.hist.map(Math.abs),.000001),macdZero=(macdTop+macdBottom)/2,macdY=value=>macdZero-(value/macdMax)*(macdBottom-macdTop)/2,difLine=macd.dif.map((value,index)=>`${index?'L':'M'}${x(index).toFixed(1)},${macdY(value).toFixed(1)}`).join(' '),deaLine=macd.dea.map((value,index)=>`${index?'L':'M'}${x(index).toFixed(1)},${macdY(value).toFixed(1)}`).join(' ');
  const volumeBars=volumes.map((value,index)=>{const y=volumeY(value),positive=index?points[index]>=points[index-1]:points[index]>=base;return `<rect class="volume-bar ${positive?'up':'down'}" x="${(x(index)-barWidth/2).toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${Math.max(1,volumeBottom-y).toFixed(1)}"/>`}).join('');
  const macdBars=macd.hist.map((value,index)=>{const y=macdY(value),top=Math.min(y,macdZero),height=Math.max(1,Math.abs(y-macdZero));return `<rect class="macd-bar ${value>=0?'up':'down'}" x="${(x(index)-barWidth/2).toFixed(1)}" y="${top.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${height.toFixed(1)}"/>`}).join('');
  const hits=coords.map((point,index)=>{const label=labels[index]?pointTime(labels[index]):'点位 '+(index+1);return `<circle class="chart-hit technical-hit" tabindex="0" cx="${point[0].toFixed(1)}" cy="${point[1].toFixed(1)}" r="4" data-label="${escapeHTML(label)}" data-session="regular" data-value="${points[index]}" data-currency="${currency}" data-volume="${Number(volumes[index]||0)}" data-amount="${Number(amounts[index]||0)}" data-dif="${macd.dif[index].toFixed(4)}" data-dea="${macd.dea[index].toFixed(4)}" data-macd="${macd.hist[index].toFixed(4)}"><title>${escapeHTML(label)} · ${points[index]}</title></circle>`}).join('');
  const tickIndexes=[0,Math.floor((points.length-1)/2),points.length-1],timeTicks=tickIndexes.map((index,position)=>{const date=new Date(labels[index]),text=Number.isNaN(date.getTime())?String(labels[index]||'').slice(11,16):date.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),anchor=position===0?'start':position===2?'end':'middle';return `<text class="time-tick" x="${x(index).toFixed(1)}" y="517" text-anchor="${anchor}">${escapeHTML(text)}</text>`}).join('');
  const zero=hasBase?`<path class="chart-zero" d="M${pad},${priceY(base).toFixed(1)}H${w-pad}"/><text class="chart-zero-label" x="${w-pad}" y="${Math.max(13,priceY(base)-5).toFixed(1)}" text-anchor="end">0% · 昨收</text>`:'';
  return `<svg class="technical-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="价格、成交量、成交额与MACD联动图">${zero}<text class="panel-label" x="${pad}" y="14">价格</text><path class="chart-area" d="${area}"/><path class="chart-line session-regular" d="${line}"/>${hits}<path class="panel-divider" d="M${pad},274H${w-pad}"/><text class="panel-label" x="${pad}" y="286">成交量</text><text class="panel-label amount" x="${pad+58}" y="286">成交额</text>${volumeBars}<path class="amount-line" d="${amountLine}"/><path class="panel-divider" d="M${pad},392H${w-pad}"/><text class="panel-label" x="${pad}" y="405">MACD (12,26,9)</text>${macdBars}<path class="macd-zero" d="M${pad},${macdZero}H${w-pad}"/><path class="dif-line" d="${difLine}"/><path class="dea-line" d="${deaLine}"/><text class="macd-legend dif" x="${w-150}" y="405">DIF</text><text class="macd-legend dea" x="${w-105}" y="405">DEA</text><text class="macd-legend hist" x="${w-58}" y="405">柱</text>${timeTicks}</svg>`;
}

function wireChartPoints(target='#detail-point'){
  const names={pre:'盘前',regular:'盘中',after:'盘后',closed:'非交易时段'};
  $$('.chart-hit').forEach(point=>{const show=()=>{const technical=point.dataset.volume!=null?` · 成交量 ${formatVolume(point.dataset.volume)} · 成交额 ${compactCny(point.dataset.amount)} · DIF ${point.dataset.dif} · DEA ${point.dataset.dea} · MACD ${point.dataset.macd}`:'';const output=$(target);if(output)output.textContent=`${point.dataset.label} · ${names[point.dataset.session]||''} · ${money(Number(point.dataset.value),point.dataset.currency)}${technical}`};point.onmouseenter=show;point.onclick=show;point.onfocus=show});
}

function parseDetailPayload(text){
  try{return JSON.parse(text)}catch(error){throw Error('详情接口返回了无法识别的内容')}
}

async function openDetail(symbol,requestedDate){
  const item=state.items.find(value=>value.symbol===symbol);
  if(!item)return;
  state.activeEtf=null;
  state.activeDetail=item;
  state.detailDate=requestedDate||null;
  if(!requestedDate)state.detailDates=[];
  $('#detail').hidden=false;
  document.body.style.overflow='hidden';
  $('#detail-market').textContent=({KR:'韩国市场',JP:'日本市场',US:'美国市场'}[item.market]||item.market)+' · '+item.source;
  $('#detail-name').textContent=item.name;
  $('#detail-symbol').textContent=item.localName+' · '+item.symbol;
  $('#detail-price').textContent=money(item.price,item.currency);
  const shownChange=converted(item.change,item.currency);
  $('#detail-change').className=item.change>=0?'gain':'loss';
  $('#detail-change').textContent=(item.change>=0?'+':'')+Math.abs(shownChange.value).toLocaleString(undefined,{maximumFractionDigits:2})+' '+shownChange.currency+' · '+(item.changePercent>=0?'+':'')+Number(item.changePercent).toFixed(2)+'%';
  $('#detail-pe').textContent=peRatio(item.pe);
  $('#detail-cap').textContent=item._marketCapRaw?marketCap(item._marketCapRaw,item.currency):(item.marketCap||'暂无数据');
  $('#detail-point').textContent='将鼠标移到曲线上';
  $('#market-closed').hidden=true;
  $('#detail-intervals').hidden=true;
  $('#detail-date-note').textContent='仅显示交易所当地自然日的成交点位';
  $('#session-legend').hidden=true;
  $('#detail-chart').innerHTML='<p>正在获取交易所今日走势…</p>';
  $('#detail-source').textContent='正在连接详情数据源';
  try{
    const response=await fetch('/api/quote?mode=detail&symbol='+encodeURIComponent(symbol)+(requestedDate?'&date='+encodeURIComponent(requestedDate):''),{headers:{Accept:'application/json'}});
    if(!(response.headers.get('content-type')||'').toLowerCase().includes('application/json'))throw Error('详情接口被静态页面接管，请重新部署最新版本');
    const data=parseDetailPayload(await response.text());
    if(!response.ok)throw Error(data.error||'详情接口不可用');
    if(data.pe)$('#detail-pe').textContent=peRatio(data.pe);
    if(data.marketCap)$('#detail-cap').textContent=marketCap(data.marketCap,item.currency);
    updateDetailDateControls(data);
    const closed=Boolean(data.marketClosed)||!data.points?.length;
    $('#market-closed').hidden=!closed;
    $('#market-closed').textContent=`今日休市或尚无成交：${data.marketDate||'交易所今天'}没有有效分时点位。`;
    const hasExtended=item.market==='US'&&data.sessions?.some(session=>session==='pre'||session==='after');
    $('#session-legend').hidden=!hasExtended;
    $('#detail-chart').innerHTML=closed?'<p>所选交易日没有成交数据。</p>':fullChart(data.points,data.labels,item.currency,data.previousClose||data.points[0],data.sessions||[]);
    if(!closed)wireChartPoints();
    $('#detail-source').textContent=(data.source||'分时走势')+' · '+(data.points?.length||0)+' 个数据点';
    $('#detail-date-note').textContent=`交易日 ${data.marketDate} · 显示为用户本地时区`;
  }catch(error){
    $('#detail-chart').innerHTML=`<p>${escapeHTML(error.message)}</p>`;
    $('#detail-source').textContent='当日走势暂不可用';
  }
}

async function requestJSON(url,label){
  const response=await fetch(url,{headers:{Accept:'application/json'}}),text=await response.text(),type=(response.headers.get('content-type')||'').toLowerCase();
  if(!type.includes('application/json'))throw Error(label+'服务暂时返回了网页错误，请稍后刷新');
  let data;try{data=JSON.parse(text)}catch(error){throw Error(label+'接口返回了无法识别的内容')}
  if(!response.ok)throw Error(data.error||label+'接口不可用');
  return data;
}

async function loadEtfChart(interval,requestedDate){
  const etf=state.activeEtf;if(!etf)return;
  state.detailInterval=Number(interval)||1;
  if(requestedDate!==undefined)state.detailDate=requestedDate||null;
  $$('[data-etf-interval]').forEach(button=>button.classList.toggle('active',Number(button.dataset.etfInterval)===Number(interval)));
  $('#detail-chart').innerHTML='<p>正在获取最近交易日分时走势…</p>';
  $('#detail-source').textContent='正在连接ETF分时数据源';
  try{
    const data=await requestJSON('/api/china-etf-detail?symbol='+encodeURIComponent(etf.symbol)+'&interval='+interval+(state.detailDate?'&date='+encodeURIComponent(state.detailDate):''),'ETF分时');
    updateDetailDateControls(data);
    const fallback=Boolean(data.fallbackDate);
    $('#market-closed').hidden=!fallback;
    $('#market-closed').className='market-alert'+(fallback?' notice':'');
    $('#market-closed').textContent=fallback?`当前为非交易日或尚未开盘，展示最近交易日 ${data.marketDate} 的完整数据。`:'';
    $('#detail-chart').innerHTML=technicalChart(data,'CNY');
    $('#detail-source').textContent=`${data.source} · ${interval}分钟 · ${data.points.length} 个点位 · MACD(12,26,9)`;
    $('#detail-date-note').textContent=`交易日 ${data.marketDate} · 北京时间`;
    wireChartPoints();
  }catch(error){
    $('#detail-chart').innerHTML=`<p>${escapeHTML(error.message)}</p>`;
    $('#detail-source').textContent='ETF分时走势暂不可用';
  }
}

function openEtfDetail(symbol){
  const etf=state.chinaEtfs.find(item=>item.symbol===symbol);if(!etf)return;
  state.activeEtf=etf;
  state.activeDetail=null;state.detailDate=null;state.detailDates=[];state.detailInterval=1;
  $('#detail').hidden=false;document.body.style.overflow='hidden';
  $('#detail-market').textContent='中国A股 · 宽基ETF';
  $('#detail-name').textContent=etf.name;
  $('#detail-symbol').textContent=etf.index+' · '+etf.symbol;
  $('#detail-price').textContent=etf.price==null?'—':money(etf.price,'CNY');
  $('#detail-change').className=etf.changePercent>=0?'gain':'loss';
  $('#detail-change').textContent=etf.changePercent==null?'—':signedNumber(etf.changePercent)+'%';
  $('#detail-pe').textContent='ETF不适用';$('#detail-cap').textContent='ETF不适用';
  $('#detail-point').textContent='轻触或将鼠标移到曲线上';
  $('#session-legend').hidden=true;$('#market-closed').hidden=true;
  $('#detail-intervals').hidden=false;
  loadEtfChart(1);
}

$$('[data-etf-interval]').forEach(button=>button.onclick=()=>loadEtfChart(Number(button.dataset.etfInterval)));
$('#detail-date').onchange=event=>{if(event.target.value)reloadDetailForDate(event.target.value)};
$('#detail-prev-day').onclick=()=>{const index=state.detailDates.indexOf(state.detailDate);if(index>0)reloadDetailForDate(state.detailDates[index-1])};
$('#detail-next-day').onclick=()=>{const index=state.detailDates.indexOf(state.detailDate);if(index>=0&&index<state.detailDates.length-1)reloadDetailForDate(state.detailDates[index+1])};
$('#detail-latest-day').onclick=()=>reloadDetailForDate(null);

function closeDetail(){$('#detail').hidden=true;document.body.style.overflow=''}
$('#close-detail').onclick=closeDetail;
$('#detail').onclick=event=>{if(event.target.id==='detail')closeDetail()};
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('#detail').hidden)closeDetail()});

function normalizeCustomSymbol(market,input){
  const raw=String(input||'').toUpperCase().replace(/\s+/g,'');
  if(market==='ALL')market=/^[A-Z]/.test(raw)?'US':/^\d{4}(\.T)?$/.test(raw)?'JP':/^\d{6}(\.(KS|KQ))?$/.test(raw)?'KR':'';
  if(market==='US'&&/^[A-Z][A-Z0-9.-]{0,11}$/.test(raw))return raw;
  if(market==='JP'&&/^\d{4}(\.T)?$/.test(raw))return raw.endsWith('.T')?raw:raw+'.T';
  if(market==='KR'&&/^\d{6}(\.(KS|KQ))?$/.test(raw))return /\.(KS|KQ)$/.test(raw)?raw:raw+'.KS';
  return null;
}

function marketForSymbol(symbol){return /\.T$/.test(symbol)?'JP':/\.(KS|KQ)$/.test(symbol)?'KR':'US'}

function customForSymbol(symbol){return state.customStocks.find(item=>item.symbol===symbol)}
function allSymbols(){return [...new Set([...DEFAULT_SYMBOLS,...state.customStocks.map(item=>item.symbol)])]}

function renderCustomStocks(){
  $('#custom-stock-list').innerHTML=state.customStocks.length?state.customStocks.map(item=>`<div class="custom-stock-item"><span>${escapeHTML(item.market)} · ${escapeHTML(item.symbol)}${item.name?' · '+escapeHTML(item.name):''}</span><button data-remove-symbol="${escapeHTML(item.symbol)}">删除</button></div>`).join(''):'<small>尚未添加自定义股票</small>';
  $$('[data-remove-symbol]').forEach(button=>button.onclick=()=>{state.customStocks=state.customStocks.filter(item=>item.symbol!==button.dataset.removeSymbol);localStorage.setItem('mirai-custom-stocks',JSON.stringify(state.customStocks));renderCustomStocks();refreshQuotes(true)});
}

let selectedSearch=null,searchTimer=null,searchController=null;

function hideSearchResults(){$('#stock-search-results').hidden=true;$('#stock-search-results').innerHTML=''}
function chooseSearchResult(result){selectedSearch=result;$('#stock-symbol').value=result.symbol;$('#stock-query').value=result.name||result.localName||result.symbol;$('#stock-name').value=result.name||result.localName||'';$('#stock-market').value=result.market;$('#stock-search-state').textContent=`已选择 ${result.symbol}`;hideSearchResults()}
function renderSearchResults(results){
  const container=$('#stock-search-results');
  if(!results.length){container.innerHTML='<p>没有找到匹配股票，可直接输入规范代码添加。</p>';container.hidden=false;return}
  container.innerHTML=results.map((result,index)=>`<button type="button" data-search-index="${index}"><strong>${escapeHTML(result.name||result.localName||result.symbol)}</strong><span>${escapeHTML(result.symbol)} · ${escapeHTML(result.market)}${result.localName&&result.localName!==result.name?' · '+escapeHTML(result.localName):''}</span></button>`).join('');
  container.hidden=false;
  $$('[data-search-index]').forEach(button=>button.onclick=()=>chooseSearchResult(results[Number(button.dataset.searchIndex)]));
}

async function searchStockNames(){
  const query=$('#stock-query').value.trim(),market=$('#stock-market').value;
  if(query.length<1){$('#stock-search-state').textContent='';hideSearchResults();return}
  if(searchController)searchController.abort();searchController=new AbortController();
  $('#stock-search-state').textContent='搜索中…';
  try{const response=await fetch('/api/search?q='+encodeURIComponent(query)+'&market='+encodeURIComponent(market),{signal:searchController.signal,headers:{Accept:'application/json'}});const data=await response.json();if(!response.ok)throw Error(data.error||'搜索失败');$('#stock-search-state').textContent=`找到 ${data.results.length} 项`;renderSearchResults(data.results)}catch(error){if(error.name!=='AbortError'){$('#stock-search-state').textContent='搜索暂不可用';hideSearchResults()}}
}

$('#stock-query').oninput=()=>{selectedSearch=null;$('#stock-symbol').value='';$('#add-stock-error').textContent='';clearTimeout(searchTimer);searchTimer=setTimeout(searchStockNames,300)};
$('#stock-market').onchange=()=>{selectedSearch=null;$('#stock-symbol').value='';clearTimeout(searchTimer);searchTimer=setTimeout(searchStockNames,100)};
$('#open-add-stock').onclick=()=>{$('#add-stock').hidden=false;renderCustomStocks();$('#stock-query').focus()};
$('#close-add-stock').onclick=()=>$('#add-stock').hidden=true;
$('#add-stock').onclick=event=>{if(event.target.id==='add-stock')event.currentTarget.hidden=true};
$('#add-stock-form').onsubmit=event=>{
  event.preventDefault();
  let market=selectedSearch?.market||$('#stock-market').value;
  const symbol=selectedSearch?.symbol||normalizeCustomSymbol(market,$('#stock-query').value),name=$('#stock-name').value.trim()||selectedSearch?.name||'';
  if(symbol&&market==='ALL')market=marketForSymbol(symbol);
  if(!symbol){$('#add-stock-error').textContent='代码格式不正确，请检查所选市场。';return}
  if(DEFAULT_SYMBOLS.includes(symbol)||customForSymbol(symbol)){$('#add-stock-error').textContent='该股票已经在列表中。';return}
  state.customStocks.push({market,symbol,name});
  localStorage.setItem('mirai-custom-stocks',JSON.stringify(state.customStocks));
  selectedSearch=null;$('#add-stock-error').textContent='';$('#stock-symbol').value='';$('#stock-query').value='';$('#stock-name').value='';$('#stock-search-state').textContent='';hideSearchResults();renderCustomStocks();refreshQuotes(true);
};

$('#currency-select').value=state.currency;
$('#currency-select').onchange=event=>{state.currency=event.target.value;localStorage.setItem('mirai-currency',state.currency);state.items.forEach(item=>{if(item._marketCapRaw)item.marketCap=marketCap(item._marketCapRaw,item.currency)});render();if(!$('#detail').hidden)closeDetail()};
fetch('/api/fx').then(response=>response.ok?response.json():Promise.reject()).then(data=>{state.rates=data.rates||state.rates;render()}).catch(()=>{});
$$('[data-market]').forEach(button=>button.onclick=()=>{state.market=button.dataset.market;$$('[data-market]').forEach(element=>element.classList.toggle('active',element===button));render();if(state.market==='CN'&&!state.sectors.length)loadSectors()});

$('#open-settings').onclick=()=>$('#settings').hidden=false;
$('#close-settings').onclick=()=>$('#settings').hidden=true;
$('#settings').onclick=event=>{if(event.target.id==='settings')event.currentTarget.hidden=true};
$$('[data-theme]').forEach(button=>button.onclick=()=>{settings.theme=button.dataset.theme;applySettings()});
$$('[data-rise]').forEach(button=>button.onclick=()=>{settings.rise=button.dataset.rise;applySettings();render()});
$('#accent').oninput=event=>{settings.accent=event.target.value;applySettings()};
applySettings();

let refreshing=false,refreshGeneration=0;

async function enrichIntraday(generation){
  const stocks=state.items.filter(item=>item.kind==='stock');
  for(let offset=0;offset<stocks.length;offset+=4){
    if(generation!==refreshGeneration)return;
    await Promise.allSettled(stocks.slice(offset,offset+4).map(async item=>{
      const response=await fetch('/api/quote?mode=detail&symbol='+encodeURIComponent(item.symbol),{headers:{Accept:'application/json'}});
      if(!response.ok)return;
      const data=await response.json();
      item.marketClosed=Boolean(data.marketClosed);
      if(item.market==='US')item.marketSession=data.marketClosed?'closed':(data.sessions?.[data.sessions.length-1]||item.marketSession||'regular');
      item.points=data.marketClosed?[]:(Array.isArray(data.points)&&data.points.length>1?data.points:item.points);
      if(data.pe)item.pe=peRatio(data.pe);
      if(data.marketCap){item._marketCapRaw=data.marketCap;item.marketCap=marketCap(data.marketCap,item.currency)}
    }));
    render();
  }
}

async function refreshQuotes(force=false){
  if(refreshing||(!force&&document.visibilityState==='hidden'))return;
  refreshing=true;
  const generation=++refreshGeneration;
  $('#updated').textContent='正在更新…';
  try{
    const symbols=allSymbols();
    const results=await Promise.allSettled(symbols.map(symbol=>fetch('/api/quote?symbol='+encodeURIComponent(symbol),{headers:{Accept:'application/json'}}).then(async response=>{const data=await response.json();if(!response.ok)throw Error(data.error||`HTTP ${response.status}`);return data.item})));
    const items=results.filter(result=>result.status==='fulfilled').map(result=>result.value);
    if(!items.length)throw Error(results.find(result=>result.status==='rejected')?.reason?.message||'接口未返回数据');
    items.forEach(item=>{const custom=customForSymbol(item.symbol);if(custom?.name)item.name=custom.name;if(item.pe)item.pe=peRatio(item.pe);if(item.marketCap){item._marketCapRaw=item.marketCap;item.marketCap=marketCap(item.marketCap,item.currency)}});
    state.items=items;
    const failed=results.length-items.length,counts={KR:0,JP:0,US:0};items.forEach(item=>counts[item.market]=(counts[item.market]||0)+1);
    $('#data-state').textContent=`韩国 ${counts.KR||0} · 日本 ${counts.JP||0} · 美国 ${counts.US||0}`+(failed?` · ${failed} 项失败`:'');
    $('#updated').textContent='更新 '+new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    render();enrichIntraday(generation);
  }catch(error){
    $('#data-state').textContent='接口错误：'+error.message;
    $('#updated').textContent='更新失败，60秒后重试';
    $('#sentiment').textContent='离线';
  }finally{refreshing=false}
}

function compactCny(value){const number=Number(value)||0,absolute=Math.abs(number);if(absolute>=1e8)return (number/1e8).toLocaleString('zh-CN',{maximumFractionDigits:2})+' 亿元';if(absolute>=1e4)return (number/1e4).toLocaleString('zh-CN',{maximumFractionDigits:2})+' 万元';return number.toLocaleString('zh-CN')+' 元'}
function signedNumber(value){const number=Number(value)||0;return (number>0?'+':'')+number.toLocaleString('zh-CN')}
function billboardHTML(data){
  if(data?.unavailable)return '<span class="billboard-empty">龙虎榜数据暂不可用</span>';
  if(!data?.listed)return '<span class="billboard-empty">当日无龙虎榜披露</span>';
  const side=(label,rows,className)=>`<div class="billboard-side ${className}"><b>${label}</b>${rows.length?rows.map(row=>`<span title="买入 ${compactCny(row.buy)} / 卖出 ${compactCny(row.sell)} / 净额 ${compactCny(row.net)}">${escapeHTML(row.name)} <em>${compactCny(row.amount)}</em></span>`).join(''):'<span>无公开席位</span>'}</div>`;
  return `<div class="billboard-seats" title="${escapeHTML(data.reason||'交易公开信息')}">${side('买入',data.buys||[],'buy')}${side('卖出',data.sells||[],'sell')}</div>`;
}

function flowSpeedChart(points,indices){
  const allFlows=points||[],allCurves=indices||[];if(allFlows.length<2&&!allCurves.length)return '<p>所选交易日暂无分钟数据</p>';
  const width=900,height=260,padX=58,padTop=22,padBottom=34,mid=(padTop+height-padBottom)/2,amp=(height-padTop-padBottom)/2,sliceRecent=rows=>rows.slice(Math.max(0,Math.floor(rows.length*(1-state.flowXZoom)))),flows=sliceRecent(allFlows),allFlowValues=allFlows.map(point=>Number(point.speed)||0),flowValues=flows.map(point=>Number(point.speed)||0),flowMax=Math.max(...allFlowValues.map(Math.abs),1),indexSeries=allCurves.map(curve=>{const base=Number(curve.points?.[0]?.value)||1,allChanges=(curve.points||[]).map(point=>(Number(point.value)/base-1)*100),start=Math.max(0,Math.floor(allChanges.length*(1-state.flowXZoom)));return {...curve,changes:allChanges.slice(start),times:(curve.points||[]).slice(start).map(point=>point.time),visible:state.flowSeries[curve.id]!==false}}),indexMax=Math.max(...indexSeries.flatMap(curve=>curve.changes.map(Math.abs)),.1),x=(index,length)=>padX+index*(width-padX*2)/Math.max(1,length-1),y=(value,max)=>mid-(value/max-state.flowYOffset)*amp*state.flowYZoom,path=(values,max)=>values.map((value,index)=>(index?'L':'M')+x(index,values.length).toFixed(1)+' '+y(value,max).toFixed(1)).join(' ');
  const flowPath=state.flowSeries.speed&&flowValues.length>1?`<path d="${path(flowValues,flowMax)}" class="flow-speed-line ${flowValues[flowValues.length-1]>=0?'in':'out'}"/>`:'',indexPaths=indexSeries.filter(curve=>curve.visible).map(curve=>`<path d="${path(curve.changes,indexMax)}" class="flow-index-line ${escapeHTML(curve.id)}"/>`).join(''),gridRatios=[1,.5,0,-.5,-1],horizontal=gridRatios.map(ratio=>{const py=mid-ratio*amp;const normalized=state.flowYOffset+ratio/state.flowYZoom;return `<line x1="${padX}" y1="${py}" x2="${width-padX}" y2="${py}" class="flow-grid${ratio===0?' zero':''}"/><text x="${padX-7}" y="${py+3}" text-anchor="end" class="flow-axis-label">${(normalized*flowMax/1e8).toFixed(1)}</text><text x="${width-padX+7}" y="${py+3}" class="flow-axis-label">${(normalized*indexMax).toFixed(2)}%</text>`}).join(''),xSource=flows.length?flows:(indexSeries[0]?.times||[]).map(time=>({time:time})),ticks=[0,.25,.5,.75,1].map(ratio=>{const index=Math.min(xSource.length-1,Math.round((xSource.length-1)*ratio)),time=String(xSource[index]?.time||'').slice(11,16),px=padX+ratio*(width-padX*2);return `<line x1="${px}" y1="${padTop}" x2="${px}" y2="${height-padBottom}" class="flow-grid vertical"/><text x="${px}" y="${height-10}" text-anchor="middle" class="flow-axis-label">${escapeHTML(time)}</text>`}).join('');
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="可缩放的主力资金流速与四个主要指数日内涨跌图"><defs><clipPath id="flow-chart-clip"><rect x="${padX}" y="${padTop}" width="${width-padX*2}" height="${height-padTop-padBottom}"/></clipPath></defs><text x="4" y="14" class="flow-axis-title">亿元/分钟</text><text x="${width-4}" y="14" text-anchor="end" class="flow-axis-title">指数涨跌幅</text>${horizontal}${ticks}<g clip-path="url(#flow-chart-clip)">${flowPath}${indexPaths}</g></svg>`;
}

function renderFlowChart(){if(state.flowChartData)$('#flow-radar-chart').innerHTML=flowSpeedChart(state.flowChartData.points,state.flowChartData.indices)}
function changeFlowChart(action){
  if(action==='zoom-in')state.flowYZoom=Math.min(4,state.flowYZoom*1.25);
  if(action==='zoom-out')state.flowYZoom=Math.max(.5,state.flowYZoom/1.25);
  if(action==='up')state.flowYOffset=Math.min(1,state.flowYOffset+.12/state.flowYZoom);
  if(action==='down')state.flowYOffset=Math.max(-1,state.flowYOffset-.12/state.flowYZoom);
  if(action==='reset'){state.flowXZoom=1;state.flowYZoom=1;state.flowYOffset=0;$('#flow-x-zoom').value='1'}
  renderFlowChart();
}

function showFlowAlert(data){
  const incoming=data.direction==='in',title=incoming?'A股主力流入正在加速':'A股主力流出正在加速',message=`${title}：${compactCny(Math.abs(data.speed))}/分钟，累计${data.net>=0?'净流入':'净流出'} ${compactCny(Math.abs(data.net))}`;
  const toast=$('#flow-toast');toast.textContent=message;toast.hidden=false;clearTimeout(showFlowAlert.timer);showFlowAlert.timer=setTimeout(()=>toast.hidden=true,9000);
  $('#flow-alert-history').innerHTML=`<span>最近提醒</span><p>${escapeHTML(data.updatedAt)} · ${escapeHTML(message)}</p>`;
  if(localStorage.getItem('mirai-flow-notifications')==='on'&&window.isSecureContext&&'Notification'in window&&Notification.permission==='granted')new Notification(title,{body:message,tag:'mirai-a-share-flow'});
}

async function loadChinaFlowSpeed(requestedDate){
  if(requestedDate!==undefined)state.flowDate=requestedDate||null;
  try{
    const data=await requestJSON('/api/china-flow-speed?v='+Date.now()+(state.flowDate?'&date='+encodeURIComponent(state.flowDate):''),'A股主力资金流速'),speed=Number(data.speed)||0,previous=Number(data.previousSpeed)||0,incoming=speed>0,status=data.historyUnavailable?'历史流速尚未缓存':data.accelerating?(incoming?'流入加速':'流出加速'):(Math.abs(speed)<10000000?'流速平缓':incoming?'保持流入':'保持流出');
    state.flowViewDate=data.marketDate;state.flowDates=Array.isArray(data.availableDates)?data.availableDates:[];const dateIndex=state.flowDates.indexOf(state.flowViewDate),dateInput=$('#flow-date');dateInput.value=state.flowViewDate||'';if(state.flowDates.length){dateInput.min=state.flowDates[0];dateInput.max=state.flowDates[state.flowDates.length-1]}$('#flow-prev-day').disabled=dateIndex<=0;$('#flow-next-day').disabled=dateIndex<0||dateIndex>=state.flowDates.length-1;$('#flow-latest-day').disabled=!state.flowDate;
    $('#flow-radar-net').textContent=data.historyUnavailable?'—':(data.net>=0?'+':'-')+compactCny(Math.abs(data.net));
    $('#flow-radar-speed').textContent=data.historyUnavailable?'—':(speed>=0?'+':'-')+compactCny(Math.abs(speed))+'/分钟';
    $('#flow-radar-speed').className=incoming?'flow-in':'flow-out';$('#flow-radar-status').className=data.accelerating?(incoming?'flow-in':'flow-out'):'';$('#flow-radar-status').textContent=status;
    $('#flow-radar-time').textContent=`交易日 ${data.marketDate||'—'} · 更新 ${data.updatedAt?data.updatedAt.slice(11):'收盘数据'} · ${(data.coverage||['沪市','深市']).join('+')}${data.partial?'（部分）':''} · ${data.cached?'缓存命中':'实时查询'}`;
    state.flowChartData=data;renderFlowChart();
    const now=Date.now(),alertKey=data.updatedAt+'-'+data.direction,cooldown=!state.lastFlowAlert||now-state.lastFlowAlert.time>=300000;
    if(!state.flowDate&&state.flowInitialized&&data.accelerating&&alertKey!==state.lastFlowAlert?.key&&cooldown){showFlowAlert(data);state.lastFlowAlert={key:alertKey,time:now}}
    state.flowInitialized=true;
  }catch(error){$('#flow-radar-time').textContent='资金流速暂时不可用，将在60秒后重试';$('#flow-radar-status').textContent='连接中断'}
}

async function toggleFlowNotifications(){
  const button=$('#flow-notification-toggle');
  if(!window.isSecureContext||!('Notification'in window)){button.textContent='当前连接仅页面提醒';button.disabled=true;return}
  if(Notification.permission!=='granted'){const permission=await Notification.requestPermission();if(permission!=='granted'){button.textContent='系统通知未授权';return}}
  const enabled=localStorage.getItem('mirai-flow-notifications')!=='on';localStorage.setItem('mirai-flow-notifications',enabled?'on':'off');button.textContent=enabled?'系统通知已开启':'开启系统通知';button.classList.toggle('active',enabled);
}

function sectorMetric(value,suffix=''){return value==null||!Number.isFinite(Number(value))?'—':`${Number(value)>=0?'+':''}${Number(value).toFixed(2)}${suffix}`}
function sectorHeatStats(rows){const values=rows.map(row=>Math.abs(Number(row.heat)||0)),min=values.length?Math.min(...values):0,max=values.length?Math.max(...values):0;return {min,max,spread:max-min}}
function sectorTileSize(row,stats){if(stats.max<.05||stats.spread<.05)return 'small';const ratio=(Math.abs(Number(row.heat)||0)-stats.min)/stats.spread;if(ratio>=.88)return 'hero';if(ratio>=.65)return 'large';if(ratio>=.32)return 'medium';return 'small'}
function sectorTileHTML(row,size){const favorite=state.sectorFavorites.includes(row.code),change=Number(row.changePercent)||0,intensity=Math.min(88,42+Math.abs(change)*7+Math.abs(Number(row.heat)||0)*2),direction=change>0?'gain':change<0?'loss':'flat';return `<article class="sector-tile ${size} ${direction}" style="--tile-intensity:${intensity.toFixed(0)}%" data-sector-code="${escapeHTML(row.code)}" tabindex="0" role="button" aria-label="查看${escapeHTML(row.name)}详情"><button class="sector-favorite-button ${favorite?'active':''}" data-sector-favorite="${escapeHTML(row.code)}" type="button" aria-label="${favorite?'取消收藏':'收藏'}${escapeHTML(row.name)}" title="${favorite?'取消置顶':'收藏置顶'}">${favorite?'★':'☆'}</button><div><h4>${escapeHTML(row.name)}</h4><small>${escapeHTML(row.code)}</small></div><strong>${sectorMetric(row.changePercent,'%')}</strong><p>主力 ${row.mainNet>=0?'+':''}${compactCny(row.mainNet)}</p></article>`}
function toggleSectorFavorite(code){state.sectorFavorites=state.sectorFavorites.includes(code)?state.sectorFavorites.filter(value=>value!==code):[code,...state.sectorFavorites];localStorage.setItem('mirai-sector-favorites',JSON.stringify(state.sectorFavorites));renderSectors()}
function renderSectors(){
  const query=state.sectorQuery.trim().toLowerCase(),rows=state.sectors.filter(row=>!query||`${row.name} ${row.code} ${row.leaderName} ${row.leaderCode}`.toLowerCase().includes(query)).sort((a,b)=>(Number(b[state.sectorSort])||-Infinity)-(Number(a[state.sectorSort])||-Infinity)),limited=state.sectorLimit?rows.slice(0,state.sectorLimit):rows,favorites=state.sectors.filter(row=>state.sectorFavorites.includes(row.code)).sort((a,b)=>state.sectorFavorites.indexOf(a.code)-state.sectorFavorites.indexOf(b.code)),regular=limited.filter(row=>!state.sectorFavorites.includes(row.code)),stats=sectorHeatStats(regular),shown=new Set(favorites.concat(regular).map(row=>row.code)).size,up=state.sectors.filter(row=>row.changePercent>0).length,down=state.sectors.filter(row=>row.changePercent<0).length,totalNet=state.sectors.reduce((sum,row)=>sum+(Number(row.mainNet)||0),0);
  $('#sector-summary').innerHTML=`<span>共 <strong>${state.sectors.length}</strong> 个板块</span><span class="flow-in">上涨 ${up}</span><span class="flow-out">下跌 ${down}</span><span>合计主力 ${totalNet>=0?'+':''}${compactCny(totalNet)}</span><span>当前显示 <strong>${shown}</strong></span>`;
  $('#sector-favorites').hidden=!favorites.length;$('#sector-favorite-count').textContent=favorites.length?`${favorites.length} 个板块固定在顶部`:'';$('#sector-favorite-mosaic').innerHTML=favorites.map(row=>sectorTileHTML(row,'favorite')).join('');$('#sector-mosaic').innerHTML=regular.length?regular.map(row=>sectorTileHTML(row,sectorTileSize(row,stats))).join(''):'<p class="sector-loading">没有匹配的板块</p>';
  $$('[data-sector-code]').forEach(tile=>{tile.onclick=()=>openSectorDetail(tile.dataset.sectorCode);tile.onkeydown=event=>{if((event.key==='Enter'||event.key===' ')&&!event.target.closest('[data-sector-favorite]')){event.preventDefault();openSectorDetail(tile.dataset.sectorCode)}}});$$('[data-sector-favorite]').forEach(button=>button.onclick=event=>{event.stopPropagation();toggleSectorFavorite(button.dataset.sectorFavorite)});
}

async function loadSectors(type=state.sectorType){
  state.sectorType=type;$$('[data-sector-type]').forEach(button=>button.classList.toggle('active',button.dataset.sectorType===type));$('#sector-updated').textContent='正在更新板块行情…';$('#sector-mosaic').innerHTML='<p class="sector-loading">正在获取板块行情…</p>';
  try{const pages=await Promise.all([1,2,3,4,5].map(page=>requestJSON('/api/china-sectors?type='+encodeURIComponent(type)+'&page='+page,'A股板块'))),data=pages[0];state.sectors=pages.flatMap(page=>page.rows||[]);$('#sector-updated').textContent=`交易日 ${data.marketDate} · ${pages.every(page=>page.cached)?'缓存':'实时'} · ${new Date(data.updatedAt).toLocaleTimeString('zh-CN')}`;renderSectors()}catch(error){$('#sector-updated').textContent='板块行情暂不可用';$('#sector-mosaic').innerHTML=`<p class="sector-loading">${escapeHTML(error.message)}</p>`}
}

function sectorLeaderChart(leaders){
  const visible=(leaders||[]).filter(leader=>state.sectorSeries[leader.code]!==false&&leader.points?.length>1);if(!visible.length)return '<p>请选择至少一只龙头股</p>';const width=900,height=230,padX=48,padY=24,series=visible.map(leader=>{const base=leader.points[0].price||1;return {...leader,changes:leader.points.map(point=>(point.price/base-1)*100)}}),max=Math.max(...series.flatMap(item=>item.changes.map(Math.abs)),.1),x=(index,length)=>padX+index*(width-padX*2)/Math.max(1,length-1),y=value=>height/2-value/max*(height/2-padY),paths=series.map((item,index)=>`<path d="${item.changes.map((value,i)=>(i?'L':'M')+x(i,item.changes.length).toFixed(1)+' '+y(value).toFixed(1)).join(' ')}" class="sector-leader-line leader-${(leaders||[]).findIndex(row=>row.code===item.code)}"/>`).join(''),ticks=[1,.5,0,-.5,-1].map(ratio=>{const py=height/2-ratio*(height/2-padY);return `<line x1="${padX}" y1="${py}" x2="${width-padX}" y2="${py}" class="flow-grid${ratio===0?' zero':''}"/><text x="${padX-7}" y="${py+3}" text-anchor="end" class="flow-axis-label">${(ratio*max).toFixed(2)}%</text>`}).join(''),times=series[0].points,timeTicks=[0,.5,1].map(ratio=>{const index=Math.round((times.length-1)*ratio),px=padX+ratio*(width-padX*2);return `<text x="${px}" y="${height-7}" text-anchor="middle" class="flow-axis-label">${escapeHTML(String(times[index].time).slice(11,16))}</text>`}).join('');return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="板块龙头股日内涨跌幅走势">${ticks}${paths}${timeTicks}</svg>`;
}

function renderSectorDetail(data){
  state.sectorDetailData=data;state.sectorDate=data.marketDate;$('#sector-detail-name').textContent=data.name;$('#sector-detail-meta').textContent=`${data.code} · 交易日 ${data.marketDate} · ${data.interval}分钟`;$('#sector-detail-price').textContent=data.points.length?Number(data.points[data.points.length-1]).toFixed(2):'—';$('#sector-detail-momentum').textContent=sectorMetric(data.thirtyMinute,'%');$('#sector-detail-source').textContent=`${data.cached?'缓存':'实时'} · ${data.source}`;
  const input=$('#sector-date'),dates=data.availableDates||[],index=dates.indexOf(data.marketDate);input.value=data.marketDate;input.min=dates[0]||'';input.max=dates[dates.length-1]||'';$('#sector-prev-day').disabled=index<=0;$('#sector-next-day').disabled=index<0||index>=dates.length-1;$('#sector-latest-day').disabled=index===dates.length-1;$$('[data-sector-interval]').forEach(button=>button.classList.toggle('active',Number(button.dataset.sectorInterval)===Number(data.interval)));
  $('#sector-technical-chart').innerHTML=technicalChart({...data,sessions:data.points.map(()=> 'regular')},'');wireChartPoints('#sector-detail-point');data.leaders.forEach(leader=>{if(state.sectorSeries[leader.code]===undefined)state.sectorSeries[leader.code]=true});$('#sector-leader-legend').innerHTML=data.leaders.map((leader,index)=>`<button class="leader-${index} ${state.sectorSeries[leader.code]!==false?'active':''}" data-sector-leader="${escapeHTML(leader.code)}">${escapeHTML(leader.name)}</button>`).join('');$('#sector-leader-chart').innerHTML=sectorLeaderChart(data.leaders);$('#sector-leader-body').innerHTML=data.leaders.map((leader,index)=>`<tr><td>${index+1}</td><td><strong>${escapeHTML(leader.name)}</strong><small>${escapeHTML(leader.code)}</small></td><td>${Number(leader.price).toFixed(2)}</td><td class="${leader.changePercent>=0?'flow-in':'flow-out'}">${sectorMetric(leader.changePercent,'%')}</td><td>${compactCny(leader.amount)}</td><td class="${leader.mainNet>=0?'flow-in':'flow-out'}">${leader.mainNet>=0?'+':''}${compactCny(leader.mainNet)}</td><td>${Number(leader.turnover).toFixed(2)}%</td></tr>`).join('');$$('[data-sector-leader]').forEach(button=>button.onclick=()=>{const code=button.dataset.sectorLeader;state.sectorSeries[code]=!state.sectorSeries[code];button.classList.toggle('active',state.sectorSeries[code]);$('#sector-leader-chart').innerHTML=sectorLeaderChart(data.leaders)})
}

async function loadSectorDetail(){
  const sector=state.activeSector;if(!sector)return;$('#sector-technical-chart').innerHTML='<p>正在获取板块分时与龙头走势…</p>';$('#sector-leader-chart').innerHTML='<p>正在计算龙头股…</p>';
  try{const data=await requestJSON('/api/china-sector-detail?code='+encodeURIComponent(sector.code)+'&interval='+state.sectorInterval+(state.sectorDate?'&date='+encodeURIComponent(state.sectorDate):''),'板块详情');renderSectorDetail(data);const curves=await Promise.all(data.leaders.map(leader=>requestJSON('/api/china-sector-leader?market='+leader.market+'&code='+encodeURIComponent(leader.code)+'&date='+encodeURIComponent(data.marketDate),'龙头股分时').catch(()=>null)));data.leaders=data.leaders.map((leader,index)=>({...leader,points:curves[index]?.points||[]}));renderSectorDetail(data)}catch(error){$('#sector-technical-chart').innerHTML=`<p>${escapeHTML(error.message)}</p>`;$('#sector-leader-chart').innerHTML=''}
}
function openSectorDetail(code){const sector=state.sectors.find(row=>row.code===code);if(!sector)return;state.activeSector=sector;state.sectorDate=null;state.sectorInterval=1;state.sectorSeries={sector:true};$('#sector-detail').hidden=false;document.body.style.overflow='hidden';$('#sector-detail-name').textContent=sector.name;$('#sector-detail-meta').textContent=sector.code;loadSectorDetail()}
function closeSectorDetail(){$('#sector-detail').hidden=true;document.body.style.overflow=''}

async function loadChinaMonitor(){
  $('#etf-flow-updated').textContent='正在更新…';$('#cffex-updated').textContent='正在更新…';
  const [etfResult,cffexResult]=await Promise.allSettled([
    requestJSON('/api/china-etf-flow','ETF资金'),
    requestJSON('/api/cffex-positions','中金所')
  ]);
  if(etfResult.status==='fulfilled'){
    const data=etfResult.value,details=await Promise.all((data.rows||[]).map(row=>requestJSON('/api/china-etf-flow?symbol='+encodeURIComponent(row.symbol),'ETF资金').then(result=>result.row).catch(error=>({...row,available:false,error:error.message}))));state.chinaEtfs=details;$('#etf-flow-updated').textContent='更新 '+new Date(data.updatedAt).toLocaleString('zh-CN');
    $('#etf-flow-body').innerHTML=state.chinaEtfs.map(row=>`<tr class="etf-row" data-etf-detail="${escapeHTML(row.symbol)}" tabindex="0" role="button"><td><strong>${escapeHTML(row.symbol)}</strong><small>${escapeHTML(row.name)}</small></td><td>${escapeHTML(row.index)}</td><td>${row.price==null?'—':Number(row.price).toFixed(3)}</td><td class="${row.changePercent>=0?'flow-in':'flow-out'}">${row.changePercent==null?'—':signedNumber(row.changePercent)+'%'}</td><td class="${row.mainNet>=0?'flow-in':'flow-out'}">${row.available?compactCny(row.mainNet):'暂无'}</td><td class="${row.mainRatio>=0?'flow-in':'flow-out'}">${row.available?signedNumber(row.mainRatio)+'%':'—'}</td><td class="billboard-cell">${billboardHTML(row.billboard)}</td><td>${escapeHTML(row.date||'—')}</td></tr>`).join('');
    $$('[data-etf-detail]').forEach(row=>{row.onclick=()=>openEtfDetail(row.dataset.etfDetail);row.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openEtfDetail(row.dataset.etfDetail)}}});
  }else{$('#etf-flow-updated').textContent='更新失败';$('#etf-flow-body').innerHTML=`<tr><td colspan="8">${escapeHTML(etfResult.reason?.message||'ETF资金数据暂不可用')}</td></tr>`}
  if(cffexResult.status==='fulfilled'){
    const data=cffexResult.value;$('#cffex-updated').textContent=data.date?`交易日 ${data.date.slice(0,4)}-${data.date.slice(4,6)}-${data.date.slice(6,8)}`:'暂无收盘数据';
    $('#cffex-position-body').innerHTML=data.rows.length?data.rows.map(row=>`<tr><td><strong>${escapeHTML(row.institution)}</strong></td><td>${escapeHTML(row.products.join(' / '))}</td><td>${Number(row.long).toLocaleString('zh-CN')}</td><td class="${row.longChange>=0?'flow-in':'flow-out'}">${signedNumber(row.longChange)}</td><td>${Number(row.short).toLocaleString('zh-CN')}</td><td class="${row.shortChange<=0?'flow-in':'flow-out'}">${signedNumber(row.shortChange)}</td><td class="${row.net>=0?'flow-in':'flow-out'}">${signedNumber(row.net)}</td><td class="${row.netChange>=0?'flow-in':'flow-out'}">${signedNumber(row.netChange)}</td></tr>`).join(''):`<tr><td colspan="8">${escapeHTML(data.error||'该交易日未匹配到重点机构席位')}</td></tr>`;
  }else{$('#cffex-updated').textContent='更新失败';$('#cffex-position-body').innerHTML=`<tr><td colspan="8">${escapeHTML(cffexResult.reason?.message||'中金所排名暂不可用')}</td></tr>`}
}

$('#refresh-china-monitor').onclick=loadChinaMonitor;
$('#refresh-sectors').onclick=()=>loadSectors();
$$('[data-sector-type]').forEach(button=>button.onclick=()=>loadSectors(button.dataset.sectorType));
$('#sector-search').oninput=event=>{state.sectorQuery=event.target.value;renderSectors()};
$('#sector-sort').onchange=event=>{state.sectorSort=event.target.value;renderSectors()};
$('#sector-limit').value=String(state.sectorLimit);$('#sector-limit').onchange=event=>{state.sectorLimit=Number(event.target.value);localStorage.setItem('mirai-sector-limit',String(state.sectorLimit));renderSectors()};
async function toggleSectorFullscreen(){if(window.innerWidth<=900)return;const panel=$('.sector-monitor');if(document.fullscreenElement){await document.exitFullscreen();return}if(panel.classList.contains('sector-fullscreen-fallback')){panel.classList.remove('sector-fullscreen-fallback');document.body.style.overflow='';$('#sector-fullscreen').textContent='全屏看盘';return}try{if(panel.requestFullscreen){await panel.requestFullscreen();return}}catch(error){}panel.classList.add('sector-fullscreen-fallback');document.body.style.overflow='hidden';$('#sector-fullscreen').textContent='退出全屏'}
$('#sector-fullscreen').onclick=toggleSectorFullscreen;document.addEventListener('fullscreenchange',()=>{$('#sector-fullscreen').textContent=document.fullscreenElement?'退出全屏':'全屏看盘'});window.addEventListener('resize',()=>{if(window.innerWidth<=900&&$('.sector-monitor').classList.contains('sector-fullscreen-fallback'))toggleSectorFullscreen()});
$('#close-sector-detail').onclick=closeSectorDetail;
$('#sector-detail').onclick=event=>{if(event.target.id==='sector-detail')closeSectorDetail()};
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('#sector-detail').hidden)closeSectorDetail()});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('.sector-monitor').classList.contains('sector-fullscreen-fallback'))toggleSectorFullscreen()});
$$('[data-sector-interval]').forEach(button=>button.onclick=()=>{state.sectorInterval=Number(button.dataset.sectorInterval);loadSectorDetail()});
$('#sector-date').onchange=event=>{state.sectorDate=event.target.value;loadSectorDetail()};
$('#sector-prev-day').onclick=()=>{const dates=state.sectorDetailData?.availableDates||[],index=dates.indexOf(state.sectorDate);if(index>0){state.sectorDate=dates[index-1];loadSectorDetail()}};
$('#sector-next-day').onclick=()=>{const dates=state.sectorDetailData?.availableDates||[],index=dates.indexOf(state.sectorDate);if(index>=0&&index<dates.length-1){state.sectorDate=dates[index+1];loadSectorDetail()}};
$('#sector-latest-day').onclick=()=>{state.sectorDate=null;loadSectorDetail()};
$('#flow-notification-toggle').onclick=toggleFlowNotifications;
$('#flow-date').onchange=event=>{if(event.target.value)loadChinaFlowSpeed(event.target.value)};
$('#flow-prev-day').onclick=()=>{const index=state.flowDates.indexOf(state.flowViewDate);if(index>0)loadChinaFlowSpeed(state.flowDates[index-1])};
$('#flow-next-day').onclick=()=>{const index=state.flowDates.indexOf(state.flowViewDate);if(index>=0&&index<state.flowDates.length-1)loadChinaFlowSpeed(state.flowDates[index+1])};
$('#flow-latest-day').onclick=()=>loadChinaFlowSpeed(null);
$$('[data-flow-series]').forEach(button=>button.onclick=()=>{const id=button.dataset.flowSeries;state.flowSeries[id]=!state.flowSeries[id];button.classList.toggle('active',state.flowSeries[id]);button.setAttribute('aria-pressed',String(state.flowSeries[id]));renderFlowChart()});
$('#flow-x-zoom').onchange=event=>{state.flowXZoom=Number(event.target.value)||1;renderFlowChart()};
$$('[data-flow-action]').forEach(button=>button.onclick=()=>changeFlowChart(button.dataset.flowAction));
const flowChartElement=$('#flow-radar-chart');let flowDrag=null;
flowChartElement.onwheel=event=>{event.preventDefault();changeFlowChart(event.deltaY<0?'zoom-in':'zoom-out')};
flowChartElement.onpointerdown=event=>{flowDrag={y:event.clientY,offset:state.flowYOffset};flowChartElement.setPointerCapture(event.pointerId);flowChartElement.classList.add('dragging')};
flowChartElement.onpointermove=event=>{if(!flowDrag)return;state.flowYOffset=Math.max(-1,Math.min(1,flowDrag.offset+(event.clientY-flowDrag.y)/(Math.max(120,flowChartElement.clientHeight)*state.flowYZoom)));renderFlowChart()};
flowChartElement.onpointerup=flowChartElement.onpointercancel=()=>{flowDrag=null;flowChartElement.classList.remove('dragging')};
if(localStorage.getItem('mirai-flow-notifications')==='on'){$('#flow-notification-toggle').textContent='系统通知已开启';$('#flow-notification-toggle').classList.add('active')}
if(!window.isSecureContext||!('Notification'in window)){$('#flow-notification-toggle').textContent='当前连接仅页面提醒';$('#flow-notification-toggle').disabled=true}

refreshQuotes();
loadChinaMonitor();
loadChinaFlowSpeed();
setInterval(refreshQuotes,60000);
setInterval(()=>{if(!state.flowDate)loadChinaFlowSpeed()},60000);
setInterval(()=>{if(state.market==='CN')loadSectors()},120000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){refreshQuotes();if(!state.flowDate)loadChinaFlowSpeed();if(state.market==='CN')loadSectors()}});
