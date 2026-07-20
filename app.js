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

const state={
  items:[],market:'ALL',
  favorites:readJSON('mirai-favorites',[]),
  customStocks:readJSON('mirai-custom-stocks',[]),
  currency:localStorage.getItem('mirai-currency')||'LOCAL',
  rates:{USD:1}
};
const settings={theme:'paper',rise:'green',accent:'#0d6b55',...readJSON('mirai-settings',{})};
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

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

function wireChartPoints(){
  const names={pre:'盘前',regular:'盘中',after:'盘后',closed:'非交易时段'};
  $$('.chart-hit').forEach(point=>{const show=()=>{$('#detail-point').textContent=`${point.dataset.label} · ${names[point.dataset.session]||''} · ${money(Number(point.dataset.value),point.dataset.currency)}`};point.onmouseenter=show;point.onclick=show;point.onfocus=show});
}

function parseDetailPayload(text){
  try{return JSON.parse(text)}catch(error){throw Error('详情接口返回了无法识别的内容')}
}

async function openDetail(symbol){
  const item=state.items.find(value=>value.symbol===symbol);
  if(!item)return;
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
  $('#session-legend').hidden=true;
  $('#detail-chart').innerHTML='<p>正在获取交易所今日走势…</p>';
  $('#detail-source').textContent='正在连接详情数据源';
  try{
    const response=await fetch('/api/quote?mode=detail&symbol='+encodeURIComponent(symbol),{headers:{Accept:'application/json'}});
    if(!(response.headers.get('content-type')||'').toLowerCase().includes('application/json'))throw Error('详情接口被静态页面接管，请重新部署最新版本');
    const data=parseDetailPayload(await response.text());
    if(!response.ok)throw Error(data.error||'详情接口不可用');
    if(data.pe)$('#detail-pe').textContent=peRatio(data.pe);
    if(data.marketCap)$('#detail-cap').textContent=marketCap(data.marketCap,item.currency);
    const closed=Boolean(data.marketClosed)||!data.points?.length;
    $('#market-closed').hidden=!closed;
    $('#market-closed').textContent=`今日休市或尚无成交：${data.marketDate||'交易所今天'}没有有效分时点位。`;
    const hasExtended=item.market==='US'&&data.sessions?.some(session=>session==='pre'||session==='after');
    $('#session-legend').hidden=!hasExtended;
    $('#detail-chart').innerHTML=closed?'<p>今日没有成交数据，不展示上一交易日走势。</p>':fullChart(data.points,data.labels,item.currency,data.previousClose||item.price-item.change,data.sessions||[]);
    if(!closed)wireChartPoints();
    $('#detail-source').textContent=(data.source||'当日走势')+' · '+(data.points?.length||0)+' 个当日数据点';
  }catch(error){
    $('#detail-chart').innerHTML=`<p>${escapeHTML(error.message)}</p>`;
    $('#detail-source').textContent='当日走势暂不可用';
  }
}

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
$$('[data-market]').forEach(button=>button.onclick=()=>{state.market=button.dataset.market;$$('[data-market]').forEach(element=>element.classList.toggle('active',element===button));render()});

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

async function loadChinaMonitor(){
  $('#etf-flow-updated').textContent='正在更新…';$('#cffex-updated').textContent='正在更新…';
  const [etfResult,cffexResult]=await Promise.allSettled([
    fetch('/api/china-etf-flow',{headers:{Accept:'application/json'}}).then(async response=>{const data=await response.json();if(!response.ok)throw Error(data.error||'ETF资金接口失败');return data}),
    fetch('/api/cffex-positions',{headers:{Accept:'application/json'}}).then(async response=>{const data=await response.json();if(!response.ok)throw Error(data.error||'中金所接口失败');return data})
  ]);
  if(etfResult.status==='fulfilled'){
    const data=etfResult.value;$('#etf-flow-updated').textContent='更新 '+new Date(data.updatedAt).toLocaleString('zh-CN');
    $('#etf-flow-body').innerHTML=data.rows.map(row=>`<tr><td><strong>${escapeHTML(row.symbol)}</strong><small>${escapeHTML(row.name)}</small></td><td>${escapeHTML(row.index)}</td><td>${row.price==null?'—':Number(row.price).toFixed(3)}</td><td class="${row.changePercent>=0?'flow-in':'flow-out'}">${row.changePercent==null?'—':signedNumber(row.changePercent)+'%'}</td><td class="${row.mainNet>=0?'flow-in':'flow-out'}">${row.available?compactCny(row.mainNet):'暂无'}</td><td class="${row.mainRatio>=0?'flow-in':'flow-out'}">${row.available?signedNumber(row.mainRatio)+'%':'—'}</td><td>${escapeHTML(row.date||'—')}</td></tr>`).join('');
  }else{$('#etf-flow-updated').textContent='更新失败';$('#etf-flow-body').innerHTML=`<tr><td colspan="7">${escapeHTML(etfResult.reason?.message||'ETF资金数据暂不可用')}</td></tr>`}
  if(cffexResult.status==='fulfilled'){
    const data=cffexResult.value;$('#cffex-updated').textContent=data.date?`交易日 ${data.date.slice(0,4)}-${data.date.slice(4,6)}-${data.date.slice(6,8)}`:'暂无收盘数据';
    $('#cffex-position-body').innerHTML=data.rows.length?data.rows.map(row=>`<tr><td><strong>${escapeHTML(row.institution)}</strong></td><td>${escapeHTML(row.products.join(' / '))}</td><td>${Number(row.long).toLocaleString('zh-CN')}</td><td class="${row.longChange>=0?'flow-in':'flow-out'}">${signedNumber(row.longChange)}</td><td>${Number(row.short).toLocaleString('zh-CN')}</td><td class="${row.shortChange<=0?'flow-in':'flow-out'}">${signedNumber(row.shortChange)}</td><td class="${row.net>=0?'flow-in':'flow-out'}">${signedNumber(row.net)}</td><td class="${row.netChange>=0?'flow-in':'flow-out'}">${signedNumber(row.netChange)}</td></tr>`).join(''):`<tr><td colspan="8">${escapeHTML(data.error||'该交易日未匹配到重点机构席位')}</td></tr>`;
  }else{$('#cffex-updated').textContent='更新失败';$('#cffex-position-body').innerHTML=`<tr><td colspan="8">${escapeHTML(cffexResult.reason?.message||'中金所排名暂不可用')}</td></tr>`}
}

$('#refresh-china-monitor').onclick=loadChinaMonitor;

refreshQuotes();
loadChinaMonitor();
setInterval(refreshQuotes,60000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshQuotes()});
