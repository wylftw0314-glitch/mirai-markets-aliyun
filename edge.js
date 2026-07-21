const japanSymbols=["^N225","^TOPX","6758.T","8035.T","6857.T","6861.T","9984.T","6723.T","6146.T","7974.T"];
const japanInfo={
  "^N225":["nikkei","日经 225","index"],"^TOPX":["topix","TOPIX","index"],
  "6758.T":["sony","索尼集团","stock"],"8035.T":["tel","东京电子","stock"],
  "6857.T":["advantest","爱德万测试","stock"],"6861.T":["keyence","基恩士","stock"],
  "9984.T":["softbank","软银集团","stock"],"6723.T":["renesas","瑞萨电子","stock"],
  "6146.T":["disco","迪思科","stock"],"7974.T":["nintendo","任天堂","stock"]
};
const koreaInfo={
  KOSPI:["kospi","KOSPI","index"],KOSDAQ:["kosdaq","KOSDAQ","index"],
  "005930":["samsung","三星电子","stock"],"000660":["skhynix","SK 海力士","stock"],
  "035420":["naver","NAVER","stock"],"035720":["kakao","Kakao","stock"],
  "066570":["lge","LG电子","stock"],"009150":["semco","三星电机","stock"],
  "042700":["hanmi","韩美半导体","stock"],"373220":["lges","LG新能源","stock"]
};

function jsonResponse(data,status){
  return new Response(JSON.stringify(data),{status:status,headers:{"content-type":"application/json;charset=UTF-8","cache-control":"public,max-age=30","access-control-allow-origin":"*"}});
}

const quoteInfo={
  "^N225":["nikkei","日经 225","JP","index"],"^TOPX":["topix","TOPIX","JP","index"],
  "^KS11":["kospi","KOSPI","KR","index"],"^KQ11":["kosdaq","KOSDAQ","KR","index"],
  "6758.T":["sony","索尼集团","JP","stock"],"8035.T":["tel","东京电子","JP","stock"],
  "6857.T":["advantest","爱德万测试","JP","stock"],"6861.T":["keyence","基恩士","JP","stock"],
  "9984.T":["softbank","软银集团","JP","stock"],"6723.T":["renesas","瑞萨电子","JP","stock"],
  "6146.T":["disco","迪思科","JP","stock"],"7974.T":["nintendo","任天堂","JP","stock"],
  "005930.KS":["samsung","三星电子","KR","stock"],"000660.KS":["skhynix","SK 海力士","KR","stock"],
  "035420.KS":["naver","NAVER","KR","stock"],"035720.KS":["kakao","Kakao","KR","stock"],
  "066570.KS":["lge","LG电子","KR","stock"],"009150.KS":["semco","三星电机","KR","stock"],
  "042700.KS":["hanmi","韩美半导体","KR","stock"],"373220.KS":["lges","LG新能源","KR","stock"]
};

const searchCatalog=[
  {symbol:"6758.T",market:"JP",name:"索尼集团",localName:"Sony Group ソニーグループ"},{symbol:"8035.T",market:"JP",name:"东京电子",localName:"Tokyo Electron 東京エレクトロン"},{symbol:"6857.T",market:"JP",name:"爱德万测试",localName:"Advantest アドバンテスト"},{symbol:"6861.T",market:"JP",name:"基恩士",localName:"Keyence キーエンス"},{symbol:"9984.T",market:"JP",name:"软银集团",localName:"SoftBank Group ソフトバンク"},{symbol:"6723.T",market:"JP",name:"瑞萨电子",localName:"Renesas ルネサス"},{symbol:"6146.T",market:"JP",name:"迪思科",localName:"Disco ディスコ"},{symbol:"7974.T",market:"JP",name:"任天堂",localName:"Nintendo 任天堂"},{symbol:"7203.T",market:"JP",name:"丰田汽车",localName:"Toyota トヨタ自動車"},
  {symbol:"005930.KS",market:"KR",name:"三星电子",localName:"Samsung Electronics 삼성전자"},{symbol:"000660.KS",market:"KR",name:"SK海力士",localName:"SK hynix SK하이닉스"},{symbol:"035420.KS",market:"KR",name:"NAVER",localName:"네이버"},{symbol:"035720.KS",market:"KR",name:"Kakao",localName:"카카오"},{symbol:"066570.KS",market:"KR",name:"LG电子",localName:"LG Electronics LG전자"},{symbol:"009150.KS",market:"KR",name:"三星电机",localName:"Samsung Electro-Mechanics 삼성전기"},{symbol:"042700.KS",market:"KR",name:"韩美半导体",localName:"Hanmi Semiconductor 한미반도체"},{symbol:"373220.KS",market:"KR",name:"LG新能源",localName:"LG Energy Solution"},
  {symbol:"AAPL",market:"US",name:"苹果",localName:"Apple Inc."},{symbol:"MSFT",market:"US",name:"微软",localName:"Microsoft Corporation"},{symbol:"NVDA",market:"US",name:"英伟达",localName:"NVIDIA Corporation"},{symbol:"AMZN",market:"US",name:"亚马逊",localName:"Amazon.com Inc."},{symbol:"GOOGL",market:"US",name:"谷歌",localName:"Alphabet Inc."},{symbol:"META",market:"US",name:"Meta",localName:"Meta Platforms"},{symbol:"TSLA",market:"US",name:"特斯拉",localName:"Tesla Inc."},{symbol:"AMD",market:"US",name:"AMD",localName:"Advanced Micro Devices"}
];

const nationalTeamEtfs=[
  {symbol:"510300",secid:"1.510300",name:"华泰柏瑞沪深300ETF",index:"沪深300"},{symbol:"510330",secid:"1.510330",name:"华夏沪深300ETF",index:"沪深300"},{symbol:"510310",secid:"1.510310",name:"易方达沪深300ETF",index:"沪深300"},{symbol:"159919",secid:"0.159919",name:"嘉实沪深300ETF",index:"沪深300"},{symbol:"510050",secid:"1.510050",name:"华夏上证50ETF",index:"上证50"},{symbol:"510500",secid:"1.510500",name:"南方中证500ETF",index:"中证500"},{symbol:"512100",secid:"1.512100",name:"南方中证1000ETF",index:"中证1000"},{symbol:"560010",secid:"1.560010",name:"广发中证1000ETF",index:"中证1000"}
];

async function getChinaEtfFlow(etf){
  const responses=await Promise.all([
    fetch("https://push2.eastmoney.com/api/qt/stock/fflow/kline/get?secid="+etf.secid+"&lmt=1&klt=101&fields1=f1,f2,f3,f7&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61",{headers:{"User-Agent":"Mozilla/5.0","Referer":"https://quote.eastmoney.com/"}}),
    fetch("https://push2.eastmoney.com/api/qt/stock/get?secid="+etf.secid+"&fields=f43,f57,f58,f170",{headers:{"User-Agent":"Mozilla/5.0","Referer":"https://quote.eastmoney.com/"}})
  ]),flow=await eastmoneyJson(responses[0],"ETF资金"),quote=await eastmoneyJson(responses[1],"ETF行情"),line=flow&&flow.data&&flow.data.klines&&flow.data.klines[0]?flow.data.klines[0].split(","):[];
  return {...etf,date:line[0]||null,mainNet:Number(line[1])||0,mainRatio:Number(line[6])||0,price:quote&&quote.data?Number(quote.data.f43)/1000:null,changePercent:quote&&quote.data?Number(quote.data.f170)/100:null,available:Boolean(line.length)};
}

function getChinaEtfFlows(){
  return {rows:nationalTeamEtfs,updatedAt:new Date().toISOString(),source:"东方财富 ETF 主力资金流",basis:"公开基金定期报告重点持有人观察池；资金字段为二级市场主力交易资金口径，不等于ETF净申购"};
}

function eastmoneyJson(response,label){
  if(!response.ok)throw new Error(label+" HTTP "+response.status);
  return response.text().then(function(text){try{return JSON.parse(text)}catch(error){throw new Error(label+" 返回了非JSON内容")}});
}

async function getChinaEtfDetail(symbol,interval){
  const etf=nationalTeamEtfs.find(function(item){return item.symbol===symbol});
  if(!etf)throw new Error("不支持的宽基ETF代码");
  const allowed=[1,5,15,30,60],period=allowed.includes(Number(interval))?Number(interval):1;
  const base="https://push2.eastmoney.com/api/qt/stock/",chartUrl=period===1
    ?base+"trends2/get?secid="+etf.secid+"&ndays=5&iscr=0&fields1=f1,f2,f3,f4,f5,f6,f7,f8&fields2=f51,f52,f53,f54,f55,f56,f57,f58"
    :base+"kline/get?secid="+etf.secid+"&klt="+period+"&fqt=1&lmt=1000&end=20500101&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61";
  const quoteUrl="https://push2.eastmoney.com/api/qt/stock/get?secid="+etf.secid+"&fields=f43,f57,f58,f60,f169,f170";
  const headers={"User-Agent":"Mozilla/5.0","Referer":"https://quote.eastmoney.com/","Accept":"application/json"};
  const responses=await Promise.all([fetch(chartUrl,{headers:headers}),fetch(quoteUrl,{headers:headers})]);
  const payloads=await Promise.all([eastmoneyJson(responses[0],"ETF分时"),eastmoneyJson(responses[1],"ETF行情")]),chart=payloads[0],quote=payloads[1]&&payloads[1].data||{};
  const raw=period===1?(chart.data&&chart.data.trends||[]):(chart.data&&chart.data.klines||[]),all=[];
  raw.forEach(function(line){const cells=String(line).split(","),stamp=cells[0],price=Number(period===1?cells[1]:cells[2]);if(/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(stamp)&&Number.isFinite(price)&&price>0)all.push({stamp:stamp,price:price})});
  if(!all.length)throw new Error("最近交易日暂无有效分时数据");
  const tradingDate=all[all.length-1].stamp.slice(0,10),selected=all.filter(function(point){return point.stamp.slice(0,10)===tradingDate}),today=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Shanghai",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  return {symbol:etf.symbol,name:etf.name,index:etf.index,interval:period,labels:selected.map(function(point){return point.stamp.replace(" ","T")+":00+08:00"}),points:selected.map(function(point){return point.price}),sessions:selected.map(function(){return "regular"}),source:"东方财富 ETF 分时",marketDate:tradingDate,marketTimeZone:"Asia/Shanghai",marketClosed:false,fallbackDate:tradingDate!==today,previousClose:Number(quote.f60)/1000||null,price:Number(quote.f43)/1000||selected[selected.length-1].price,change:Number(quote.f169)/1000||0,changePercent:Number(quote.f170)/100||0,currency:"CNY"};
}

function csvCells(line){const cells=[];let value="",quoted=false;for(let i=0;i<line.length;i++){const char=line[i];if(char==='"'){if(quoted&&line[i+1]==='"'){value+='"';i++}else quoted=!quoted}else if(char===","&&!quoted){cells.push(value.trim());value=""}else value+=char}cells.push(value.trim());return cells}
function numberCell(value){const number=Number(String(value||"").replace(/,/g,"").replace(/[^\d.-]/g,""));return Number.isFinite(number)?number:0}
function cffexDate(date){return date.getUTCFullYear().toString()+String(date.getUTCMonth()+1).padStart(2,"0")+String(date.getUTCDate()).padStart(2,"0")}

async function fetchCffexCsv(product,date){
  const ymd=cffexDate(date),url="https://www.cffex.com.cn/sj/ccpm/"+ymd.slice(0,6)+"/"+ymd.slice(6)+"/"+product+"_1.csv",controller=new AbortController(),timer=setTimeout(function(){controller.abort()},2200);let response;
  try{response=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0","Referer":"https://www.cffex.com.cn/"},signal:controller.signal})}finally{clearTimeout(timer)}
  if(!response.ok)throw new Error("HTTP "+response.status);
  const buffer=await response.arrayBuffer(),utf8=new TextDecoder("utf-8").decode(buffer);let text=utf8;
  if(utf8.includes("�")||(!utf8.includes("会员")&&!utf8.includes("持买")&&!utf8.includes("持卖"))){try{const gb=new TextDecoder("gb18030").decode(buffer);if(!gb.includes("�"))text=gb}catch(error){}}
  const lines=text.split(/\r?\n/).filter(line=>line.trim());
  if(lines.length<2||!lines.some(line=>csvCells(line).length>=10))throw new Error("empty ranking");
  return {date:ymd,text:text};
}

function parseCffexRankings(product,text,store){
  const add=(name,side,position,change)=>{const cleaned=String(name||"").replace(/（代客）|\(代客\)|期货有限公司|有限公司/g,"").trim();if(!cleaned||/会员简称|合计/.test(cleaned)||!Number.isFinite(Number(String(position||"").replace(/,/g,""))))return;store[cleaned]=store[cleaned]||{institution:cleaned,long:0,longChange:0,short:0,shortChange:0,products:new Set()};store[cleaned][side]+=numberCell(position);store[cleaned][side+"Change"]+=numberCell(change);store[cleaned].products.add(product)};
  text.split(/\r?\n/).forEach(line=>{const cells=csvCells(line);if(cells.length<10)return;add(cells[4],"long",cells[5],cells[6]);add(cells[7],"short",cells[8],cells[9])})
}

async function getCffexPositions(){
  const products=["IF","IH","IC","IM"],focus=/中信|国泰君安|华泰|中金|银河|永安|东证|招商|广发|申万|海通/,hour=Number(new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Shanghai",hour:"2-digit",hour12:false}).format(new Date())),startOffset=hour>=17?0:1;let attempts=0;
  for(let offset=startOffset;offset<7&&attempts<2;offset++){const date=new Date(Date.now()-offset*86400000);if([0,6].includes(date.getUTCDay()))continue;attempts++;const results=await Promise.allSettled(products.map(product=>fetchCffexCsv(product,date)));if(!results.some(result=>result.status==="fulfilled"))continue;const store={};let actualDate=null;results.forEach((result,index)=>{if(result.status==="fulfilled"){actualDate=result.value.date;parseCffexRankings(products[index],result.value.text,store)}});const rows=Object.values(store).filter(row=>focus.test(row.institution)).map(row=>({...row,products:[...row.products],net:row.long-row.short,netChange:row.longChange-row.shortChange})).sort((a,b)=>Math.abs(b.net)-Math.abs(a.net));return {date:actualDate,rows:rows,source:"中国金融期货交易所成交持仓排名",basis:"期货公司结算会员席位汇总，不代表期货公司自营或单一客户观点"}}
  return {date:null,rows:[],source:"中国金融期货交易所成交持仓排名",error:"最近已收盘交易日未取得排名数据，请稍后刷新"};
}

function marketFromYahoo(symbol,exchange){
  if(/\.T$/i.test(symbol)||/JPX|TYO/i.test(exchange||""))return "JP";
  if(/\.(KS|KQ)$/i.test(symbol)||/KSC|KOE/i.test(exchange||""))return "KR";
  if(inferredInfo(String(symbol||"").toUpperCase())?.[2]==="US")return "US";
  return null;
}

async function searchStocks(query,market){
  const term=String(query||"").trim(),wanted=market&&market!=="ALL"?market:null,needle=term.toLocaleLowerCase(),results=[];
  searchCatalog.forEach(item=>{const haystack=(item.symbol+" "+item.name+" "+item.localName).toLocaleLowerCase();if((!wanted||item.market===wanted)&&haystack.includes(needle))results.push(item)});
  try{
    const response=await fetch("https://query1.finance.yahoo.com/v1/finance/search?q="+encodeURIComponent(term)+"&quotesCount=12&newsCount=0",{headers:{"User-Agent":"Mozilla/5.0","Accept":"application/json"}});
    if(response.ok){const json=await response.json();(json.quotes||[]).forEach(quote=>{if(!["EQUITY","ETF"].includes(quote.quoteType))return;const symbol=String(quote.symbol||"").toUpperCase(),detected=marketFromYahoo(symbol,quote.exchange);if(!detected||wanted&&detected!==wanted||!inferredInfo(symbol))return;results.push({symbol:symbol,market:detected,name:quote.longname||quote.shortname||symbol,localName:quote.shortname||quote.longname||symbol})})}
  }catch(error){}
  const seen=new Set();return results.filter(item=>{if(seen.has(item.symbol))return false;seen.add(item.symbol);return true}).slice(0,12);
}

function inferredInfo(symbol){
  const fixed=quoteInfo[symbol];
  if(fixed)return fixed;
  const clean=String(symbol||"").toUpperCase().trim();
  if(/^\d{6}\.(KS|KQ)$/.test(clean))return ["custom-"+clean,clean,"KR","stock"];
  if(/^\d{4}\.T$/.test(clean))return ["custom-"+clean,clean,"JP","stock"];
  if(/^[A-Z][A-Z0-9.-]{0,11}$/.test(clean))return ["custom-"+clean,clean,"US","stock"];
  return null;
}

function marketDate(date,timeZone){
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:timeZone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date);
  const get=type=>(parts.find(part=>part.type===type)||{}).value||"";
  return get("year")+get("month")+get("day");
}

function sessionForNewYork(date){
  const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(date);
  const hour=Number((parts.find(part=>part.type==="hour")||{}).value),minute=Number((parts.find(part=>part.type==="minute")||{}).value),total=hour*60+minute;
  if(total>=240&&total<570)return "pre";
  if(total>=570&&total<960)return "regular";
  if(total>=960&&total<1200)return "after";
  return "closed";
}

async function getYahooQuote(symbol){
  const metaInfo=inferredInfo(symbol);
  if(!metaInfo)return jsonResponse({error:"Unsupported symbol"},400);
  const url="https://query1.finance.yahoo.com/v8/finance/chart/"+encodeURIComponent(symbol)+"?range=1d&interval=5m&includePrePost=true";
  const response=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0","Accept":"application/json"}});
  if(!response.ok&&metaInfo[2]==="JP"&&metaInfo[3]==="index")return getGoogleJapanIndex(symbol,"Yahoo HTTP "+response.status);
  if(!response.ok&&metaInfo[2]==="JP"&&metaInfo[3]==="stock")return getNaverWorldQuote(symbol,"Yahoo HTTP "+response.status);
  if(!response.ok&&metaInfo[2]==="US")return getNaverWorldQuote(symbol,"Yahoo HTTP "+response.status);
  if(!response.ok)return jsonResponse({error:"Yahoo HTTP "+response.status,symbol:symbol},502);
  const json=await response.json();
  const result=json.chart&&json.chart.result&&json.chart.result[0]?json.chart.result[0]:null;
  if(!result||!result.meta)return jsonResponse({error:"Yahoo empty response",symbol:symbol},502);
  const meta=result.meta;
  const raw=result.indicators&&result.indicators.quote&&result.indicators.quote[0]?result.indicators.quote[0].close:[];
  const points=(raw||[]).filter(function(value){return typeof value==="number"&&Number.isFinite(value)});
  const price=Number(metaInfo[2]==="US"&&points.length?points[points.length-1]:meta.regularMarketPrice||points[points.length-1]);
  const previous=Number(meta.chartPreviousClose||meta.previousClose||points[0]||price);
  const change=price-previous;
  const step=Math.max(1,Math.floor(points.length/24));
  const chartPoints=points.filter(function(value,index){return index%step===0}).slice(-24);
  const id=metaInfo[0],name=metaInfo[1],marketName=metaInfo[2],kind=metaInfo[3];
  const lastTimestamp=result.timestamp&&result.timestamp.length?result.timestamp[result.timestamp.length-1]:null;
  const item={id:id,name:meta.longName||meta.shortName||name,localName:meta.shortName||meta.longName||name,symbol:symbol,market:marketName,kind:kind,price:price,change:change,changePercent:previous?change/previous*100:0,currency:meta.currency||(marketName==="JP"?"JPY":marketName==="US"?"USD":"KRW"),points:chartPoints.length?chartPoints:[previous,price],source:"Yahoo Chart",marketSession:marketName==="US"&&lastTimestamp?sessionForNewYork(new Date(lastTimestamp*1000)):"regular"};
  return jsonResponse({item:item,updatedAt:new Date().toISOString(),source:"Yahoo Chart",subrequests:1},200);
}

async function getGoogleJapanIndex(symbol,previousError){
  const googleCode=symbol==="^N225"?"NI225:INDEXNIKKEI":"TOPX:INDEXTOPIX";
  const response=await fetch("https://www.google.com/finance/quote/"+googleCode+"?hl=en",{headers:{"User-Agent":"Mozilla/5.0","Accept":"text/html"}});
  if(!response.ok)return jsonResponse({error:previousError+" / Google Finance HTTP "+response.status,symbol:symbol},502);
  const html=await response.text();
  const priceMatch=html.match(/data-last-price="([^"]+)"/);
  if(!priceMatch)return jsonResponse({error:previousError+" / Google Finance empty",symbol:symbol},502);
  const price=Number(priceMatch[1]),metaInfo=quoteInfo[symbol];
  const item={id:metaInfo[0],name:metaInfo[1],localName:metaInfo[1],symbol:symbol,market:"JP",kind:"index",price:price,change:0,changePercent:0,currency:"JPY",points:[price,price],source:"Google Finance"};
  return jsonResponse({item:item,updatedAt:new Date().toISOString(),source:"Google Finance",subrequests:2},200);
}

function naverFundamental(data,codes){
  const rows=(data.stockItemTotalInfos||[]).concat(data.totalInfos||[]);
  for(let i=0;i<codes.length;i++){const code=codes[i].toLowerCase();for(let j=0;j<rows.length;j++){const key=String(rows[j].code||rows[j].key||"").toLowerCase();if(key===code)return rows[j].value||null}}
  return null;
}

async function getNaverWorldQuote(symbol,previousError){
  const metaInfo=inferredInfo(symbol);
  let naverSymbol=symbol,response=null;
  const candidates=metaInfo&&metaInfo[2]==="US"?[symbol+".O",symbol+".N",symbol+".K"]:[symbol];
  for(let i=0;i<candidates.length;i++){const candidate=candidates[i];const attempt=await fetch("https://api.stock.naver.com/stock/"+encodeURIComponent(candidate)+"/basic",{headers:{"User-Agent":"Mozilla/5.0","Referer":"https://m.stock.naver.com/","Accept":"application/json"}});if(attempt.ok){naverSymbol=candidate;response=attempt;break}response=attempt}
  if(!response.ok)return jsonResponse({error:previousError+" / Naver Japan HTTP "+response.status,symbol:symbol},502);
  const data=await response.json();
  if(data.closePrice==null)return jsonResponse({error:previousError+" / Naver Japan empty",symbol:symbol},502);
  const over=metaInfo[2]==="US"&&data.overMarketPriceInfo&&data.overMarketPriceInfo.overMarketStatus==="OPEN"?data.overMarketPriceInfo:null;
  const direction=(over?over.compareToPreviousPrice:data.compareToPreviousPrice)&&String((over?over.compareToPreviousPrice:data.compareToPreviousPrice).code)==="5"?-1:1;
  const price=naverNumber(over?over.overPrice:data.closePrice),change=Math.abs(naverNumber(over?over.compareToPreviousClosePrice:data.compareToPreviousClosePrice))*direction;
  const item={id:metaInfo[0],name:data.stockNameEng||data.stockName||metaInfo[1],localName:data.stockName||data.stockNameEng||metaInfo[1],symbol:symbol,providerSymbol:naverSymbol,market:metaInfo[2],kind:metaInfo[3],price:price,change:change,changePercent:Math.abs(naverNumber(over?over.fluctuationsRatio:data.fluctuationsRatio))*direction,currency:data.currencyType&&data.currencyType.code?data.currencyType.code:(metaInfo[2]==="US"?"USD":"JPY"),points:[price-change,price],source:"Naver World Stock",pe:data.per||naverFundamental(data,["per"]),marketCap:data.marketValue||naverFundamental(data,["marketValue","marketCap"]),marketStatus:over?over.overMarketStatus:data.marketStatus||null,marketSession:over&&String(over.tradingSessionType).includes("PRE")?"pre":over?"after":"regular"};
  return jsonResponse({item:item,updatedAt:new Date().toISOString(),source:"Naver World Stock",subrequests:2},200);
}

function naverNumber(value){
  return Number(String(value==null?"0":value).replace(/,/g,"").replace(/%/g,""));
}

async function getNaverQuote(symbol){
  const metaInfo=inferredInfo(symbol);
  if(!metaInfo)return jsonResponse({error:"Unsupported symbol"},400);
  const isIndex=symbol==="^KS11"||symbol==="^KQ11";
  const code=isIndex?(symbol==="^KS11"?"KOSPI":"KOSDAQ"):symbol.replace(/\.(KS|KQ)$/," ").trim();
  const url=isIndex?"https://polling.finance.naver.com/api/realtime/domestic/index/"+code:"https://m.stock.naver.com/api/stock/"+code+"/basic";
  const response=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36","Referer":"https://m.stock.naver.com/","Accept":"application/json"}});
  if(!response.ok)return jsonResponse({error:"Naver HTTP "+response.status,symbol:symbol},502);
  const json=await response.json();
  const data=isIndex?(json.datas&&json.datas[0]?json.datas[0]:null):json;
  if(!data||data.closePrice==null)return jsonResponse({error:"Naver empty response",symbol:symbol},502);
  const direction=data.compareToPreviousPrice&&String(data.compareToPreviousPrice.code)==="5"?-1:1;
  const price=naverNumber(data.closePrice);
  const change=Math.abs(naverNumber(data.compareToPreviousClosePrice))*direction;
  const percent=Math.abs(naverNumber(data.fluctuationsRatio))*direction;
  const id=metaInfo[0],name=metaInfo[1],marketName=metaInfo[2],kind=metaInfo[3];
  const item={id:id,name:name,localName:data.stockName||name,symbol:symbol,market:marketName,kind:kind,price:price,change:change,changePercent:percent,currency:"KRW",points:[price-change,price],source:"Naver Finance",pe:data.per||naverFundamental(data,["per"]),marketCap:data.marketValue||naverFundamental(data,["marketValue","marketCap"])};
  return jsonResponse({item:item,updatedAt:new Date().toISOString(),source:"Naver Finance",subrequests:1},200);
}

async function getYahooTodayDetail(symbol){
  const response=await fetch("https://query1.finance.yahoo.com/v8/finance/chart/"+encodeURIComponent(symbol)+"?range=1d&interval=5m&includePrePost=true",{headers:{"User-Agent":"Mozilla/5.0","Accept":"application/json"}});
  if(!response.ok)throw new Error("Yahoo HTTP "+response.status);
  const json=await response.json(),result=json.chart&&json.chart.result&&json.chart.result[0];
  if(!result)throw new Error("Yahoo empty response");
  const timestamps=result.timestamp||[],quotes=result.indicators&&result.indicators.quote&&result.indicators.quote[0],closes=quotes&&quotes.close||[],today=marketDate(new Date(),"America/New_York"),labels=[],points=[],sessions=[];
  timestamps.forEach(function(timestamp,index){const date=new Date(timestamp*1000),price=Number(closes[index]);if(marketDate(date,"America/New_York")===today&&Number.isFinite(price)){labels.push(date.toISOString());points.push(price);sessions.push(sessionForNewYork(date))}});
  const meta=result.meta||{};
  return {symbol:symbol,labels:labels,points:points,sessions:sessions,source:"Yahoo US intraday",marketDate:today,marketTimeZone:"America/New_York",marketClosed:points.length===0,marketStatus:meta.marketState||null,previousClose:Number(meta.chartPreviousClose||meta.previousClose)||null,pe:meta.trailingPE||null,marketCap:meta.marketCap||null};
}

async function resolveNaverWorld(symbol,market){
  const candidates=market==="US"?[symbol+".O",symbol+".N",symbol+".K"]:[symbol];
  for(let i=0;i<candidates.length;i++){const code=candidates[i],response=await fetch("https://api.stock.naver.com/stock/"+encodeURIComponent(code)+"/basic",{headers:{"User-Agent":"Mozilla/5.0","Referer":"https://m.stock.naver.com/","Accept":"application/json"}});if(response.ok)return {code:code,data:await response.json()}}
  throw new Error("Naver World symbol unavailable");
}

async function getNaverWorldTodayDetail(symbol,info){
  const resolved=await resolveNaverWorld(symbol,info[2]),code=resolved.code,basic=resolved.data,timeZone=info[2]==="US"?"America/New_York":"Asia/Tokyo",today=marketDate(new Date(),timeZone);
  const response=await fetch("https://api.stock.naver.com/chart/foreign/item/"+encodeURIComponent(code)+"?periodType=minute&count=500",{headers:{"User-Agent":"Mozilla/5.0","Referer":"https://m.stock.naver.com/","Accept":"application/json"}});
  const labels=[],points=[],sessions=[];
  if(response.ok){const json=await response.json(),rows=Array.isArray(json)?json:(json.result||json.priceInfos||[]);rows.forEach(function(row){const raw=row.localTradedAt||row.tradedAt||row.date||"",date=/^\d{12,14}$/.test(String(raw))?new Date(Date.UTC(Number(String(raw).slice(0,4)),Number(String(raw).slice(4,6))-1,Number(String(raw).slice(6,8)),Number(String(raw).slice(8,10))-(info[2]==="US"?0:9),Number(String(raw).slice(10,12)))):new Date(raw),price=naverNumber(row.closePrice||row.close||row.currentPrice);if(!Number.isNaN(date.getTime())&&marketDate(date,timeZone)===today&&Number.isFinite(price)&&price>0){labels.push(date.toISOString());points.push(price);sessions.push(info[2]==="US"?sessionForNewYork(date):"regular")}})}
  if(info[2]==="US"&&basic.overMarketPriceInfo&&basic.overMarketPriceInfo.localTradedAt){const over=basic.overMarketPriceInfo,date=new Date(over.localTradedAt),price=naverNumber(over.overPrice);if(marketDate(date,timeZone)===today&&Number.isFinite(price)&&price>0){labels.push(date.toISOString());points.push(price);sessions.push(String(over.tradingSessionType||"").includes("PRE")?"pre":"after")}}
  return {symbol:symbol,labels:labels,points:points,sessions:sessions,source:"Naver World intraday",marketDate:today,marketTimeZone:timeZone,marketClosed:points.length===0,marketStatus:basic.marketStatus||basic.overMarketPriceInfo&&basic.overMarketPriceInfo.overMarketStatus||null,previousClose:naverNumber(naverFundamental(basic,["basePrice"])),pe:basic.per||naverFundamental(basic,["per"]),marketCap:basic.marketValue||naverFundamental(basic,["marketValue","marketCap"])};
}

async function getTodayIntraday(symbol){
  const info=inferredInfo(symbol);
  if(!info)return jsonResponse({error:"Unsupported symbol"},400);
  if(info[2]==="US"){
    try{return jsonResponse(await getYahooTodayDetail(symbol),200)}catch(error){try{return jsonResponse(await getNaverWorldTodayDetail(symbol,info),200)}catch(fallback){return jsonResponse({error:error.message+" / "+fallback.message,symbol:symbol},502)}}
  }
  if(info[2]==="JP"){
    try{return jsonResponse(await getNaverWorldTodayDetail(symbol,info),200)}catch(error){return jsonResponse({error:error.message,symbol:symbol},502)}
  }
  if(info[2]==="KR"&&info[3]==="stock"){
    const code=symbol.replace(/\.(KS|KQ)$/,""),today=marketDate(new Date(),"Asia/Seoul"),response=await fetch("https://fchart.stock.naver.com/sise.nhn?symbol="+code+"&timeframe=minute&count=500&requestType=0",{headers:{"User-Agent":"Mozilla/5.0","Referer":"https://finance.naver.com/"}});
    if(!response.ok)return jsonResponse({error:"Naver chart HTTP "+response.status},502);
    const xml=await response.text(),labels=[],points=[],sessions=[],pattern=/<item\s+data=["']([^"']+)["']/g;let match;
    while((match=pattern.exec(xml))!==null){const fields=match[1].split("|"),stamp=fields[0],price=Number(fields[4]);if(String(stamp).slice(0,8)===today&&Number.isFinite(price)){labels.push(stamp);points.push(price);sessions.push("regular")}}
    let pe=null,marketCap=null;try{const fundamentalResponse=await fetch("https://m.stock.naver.com/api/stock/"+code+"/integration",{headers:{"User-Agent":"Mozilla/5.0","Referer":"https://m.stock.naver.com/","Accept":"application/json"}});if(fundamentalResponse.ok){const fundamental=await fundamentalResponse.json();pe=fundamental.per||naverFundamental(fundamental,["per"]);marketCap=fundamental.marketValue||naverFundamental(fundamental,["marketValue","marketCap"])}}catch(error){}
    return jsonResponse({symbol:symbol,labels:labels,points:points,sessions:sessions,source:"Naver Korea intraday",marketDate:today,marketTimeZone:"Asia/Seoul",marketClosed:points.length===0,pe:pe,marketCap:marketCap},200);
  }
  return jsonResponse({error:"该标的暂不支持当日分时",symbol:symbol},502);
}

async function getIntradayDetail(symbol){
  const info=quoteInfo[symbol];
  if(!info)return jsonResponse({error:"Unsupported symbol"},400);
  if(info[2]==="KR"&&info[3]==="stock"){
    const code=symbol.replace(".KS","");
    const response=await fetch("https://fchart.stock.naver.com/sise.nhn?symbol="+code+"&timeframe=minute&count=500&requestType=0",{headers:{"User-Agent":"Mozilla/5.0","Referer":"https://finance.naver.com/"}});
    if(!response.ok)return jsonResponse({error:"Naver chart HTTP "+response.status},502);
    const xml=await response.text();
    const labels=[],points=[];
    const pattern=/<item\s+data=["']([^"']+)["']/g;
    let match;
    while((match=pattern.exec(xml))!==null){const fields=match[1].split("|");const close=Number(fields[4]);if(Number.isFinite(close)){labels.push(fields[0]);points.push(close)}}
    if(points.length){
      let pe=null,marketCap=null;
      const fundamentalResponse=await fetch("https://m.stock.naver.com/api/stock/"+code+"/integration",{headers:{"User-Agent":"Mozilla/5.0","Referer":"https://m.stock.naver.com/","Accept":"application/json"}});
      if(fundamentalResponse.ok){const fundamental=await fundamentalResponse.json();pe=fundamental.per||naverFundamental(fundamental,["per"]);marketCap=fundamental.marketValue||naverFundamental(fundamental,["marketValue","marketCap"])}
      return jsonResponse({symbol:symbol,labels:labels,points:points,source:"Naver intraday",completeDay:true,pe:pe,marketCap:marketCap},200);
    }
  }
  if(info[2]==="JP"&&info[3]==="stock"){
    const response=await fetch("https://api.stock.naver.com/chart/foreign/item/"+encodeURIComponent(symbol)+"?periodType=minute&count=500",{headers:{"User-Agent":"Mozilla/5.0","Referer":"https://m.stock.naver.com/","Accept":"application/json"}});
    if(response.ok){
      const json=await response.json();const rows=Array.isArray(json)?json:(json.result||json.priceInfos||[]);const labels=[],points=[];
      rows.forEach(function(row){const close=naverNumber(row.closePrice||row.close);if(Number.isFinite(close)&&close>0){labels.push(row.localTradedAt||row.date||"");points.push(close)}});
      if(points.length){
        let pe=null,marketCap=null;const fundamentalResponse=await fetch("https://api.stock.naver.com/stock/"+encodeURIComponent(symbol)+"/basic",{headers:{"User-Agent":"Mozilla/5.0","Referer":"https://m.stock.naver.com/","Accept":"application/json"}});
        if(fundamentalResponse.ok){const fundamental=await fundamentalResponse.json();pe=fundamental.per||naverFundamental(fundamental,["per"]);marketCap=fundamental.marketValue||naverFundamental(fundamental,["marketValue","marketCap"])}
        return jsonResponse({symbol:symbol,labels:labels,points:points,source:"Naver World intraday",completeDay:true,pe:pe,marketCap:marketCap},200);
      }
    }
  }
  return jsonResponse({error:"该数据源暂未提供完整日内走势",symbol:symbol},502);
}

async function getNaverKorea(){
  const codes=Object.keys(koreaInfo).filter(function(code){return /^\d/.test(code)});
  const services=codes.map(function(code){return "SERVICE_ITEM:"+code});
  services.push("SERVICE_INDEX:KOSPI","SERVICE_INDEX:KOSDAQ");
  const url="https://polling.finance.naver.com/api/realtime?query="+encodeURIComponent(services.join("|"));
  const response=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0","Referer":"https://finance.naver.com/","Accept":"application/json"}});
  if(!response.ok)throw new Error("HTTP "+response.status);
  const json=await response.json();
  const areas=json.result&&json.result.areas?json.result.areas:[];
  let rows=[];
  areas.forEach(function(area){rows=rows.concat(area.datas||[])});
  return rows.map(function(row){
    const code=String(row.cd||"");
    const meta=koreaInfo[code];
    if(!meta)return null;
    const id=meta[0],name=meta[1],kind=meta[2];
    const scale=kind==="index"?100:1;
    const direction=String(row.rf)==="5"?-1:1;
    const price=Number(row.nv)/scale;
    const change=Math.abs(Number(row.cv||0))/scale*direction;
    const percent=Math.abs(Number(row.cr||0))*direction;
    return {id:id,name:name,localName:name,symbol:kind==="stock"?code+".KS":code,market:"KR",kind:kind,price:price,change:change,changePercent:percent,currency:"KRW",points:[price-change,price],source:"Naver Finance"};
  }).filter(function(item){return item&&Number.isFinite(item.price)});
}

async function getYahooJapanBatch(){
  const url="https://query1.finance.yahoo.com/v7/finance/quote?symbols="+encodeURIComponent(japanSymbols.join(","));
  const response=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0","Accept":"application/json"}});
  if(!response.ok)throw new Error("HTTP "+response.status);
  const json=await response.json();
  const quotes=json.quoteResponse&&json.quoteResponse.result?json.quoteResponse.result:[];
  return quotes.map(function(quote){
    const symbol=quote.symbol;
    const meta=japanInfo[symbol];
    if(!meta)return null;
    const id=meta[0],name=meta[1],kind=meta[2];
    const price=Number(quote.regularMarketPrice);
    const change=Number(quote.regularMarketChange||0);
    const percent=Number(quote.regularMarketChangePercent||0);
    const previous=Number(quote.regularMarketPreviousClose||price-change);
    return {id:id,name:name,localName:quote.longName||quote.shortName||name,symbol:symbol,market:"JP",kind:kind,price:price,change:change,changePercent:percent,currency:quote.currency||"JPY",points:[previous,price],source:"Yahoo Finance"};
  }).filter(function(item){return item&&Number.isFinite(item.price)});
}

async function market(){
  const results=await Promise.all([
    getNaverKorea().then(function(items){return {source:"Naver Finance",items:items}}).catch(function(error){return {source:"Naver Finance",items:[],error:error.message||String(error)}}),
    getYahooJapanBatch().then(function(items){return {source:"Yahoo Finance",items:items}}).catch(function(error){return {source:"Yahoo Finance",items:[],error:error.message||String(error)}})
  ]);
  let items=[],sources=[],errors=[];
  results.forEach(function(result){
    if(result.items.length){items=items.concat(result.items);sources.push(result.source)}
    if(result.error)errors.push(result.source+": "+result.error);
  });
  return jsonResponse({items:items,updatedAt:new Date().toISOString(),sources:sources,errors:errors,subrequests:2,runtime:"es6-compatible"},items.length?200:502);
}

async function handleRequest(request){
  const url=new URL(request.url);
  if(url.pathname==="/api/health")return jsonResponse({ok:true,runtime:"es6-compatible",time:new Date().toISOString()},200);
  if(url.pathname==="/api/fx"){
    const response=await fetch("https://api.frankfurter.dev/v2/rates?base=USD&quotes=CNY,JPY,KRW",{headers:{"Accept":"application/json"}});
    if(!response.ok)return jsonResponse({error:"FX HTTP "+response.status},502);
    const rows=await response.json(),rates={USD:1};
    rows.forEach(function(row){rates[row.quote]=Number(row.rate)});
    return jsonResponse({base:"USD",rates:rates,date:rows[0]&&rows[0].date?rows[0].date:null,source:"Frankfurter"},200);
  }
  if(url.pathname==="/api/search"){
    const query=(url.searchParams.get("q")||"").trim(),market=(url.searchParams.get("market")||"ALL").toUpperCase();
    if(query.length<1||query.length>40)return jsonResponse({error:"搜索词长度应为 1-40 个字符"},400);
    if(!["ALL","US","JP","KR"].includes(market))return jsonResponse({error:"不支持的市场"},400);
    return jsonResponse({query:query,market:market,results:await searchStocks(query,market)},200);
  }
  if(url.pathname==="/api/china-etf-flow"){try{const symbol=(url.searchParams.get("symbol")||"").trim(),etf=symbol&&nationalTeamEtfs.find(function(item){return item.symbol===symbol});return jsonResponse(etf?{row:await getChinaEtfFlow(etf),updatedAt:new Date().toISOString()}:getChinaEtfFlows(),200)}catch(error){return jsonResponse({error:error.message||"ETF资金数据暂不可用"},502)}}
  if(url.pathname==="/api/china-etf-detail"){try{return jsonResponse(await getChinaEtfDetail((url.searchParams.get("symbol")||"").trim(),url.searchParams.get("interval")),200)}catch(error){return jsonResponse({error:error.message||"ETF分时数据暂不可用"},502)}}
  if(url.pathname==="/api/cffex-positions"){try{return jsonResponse(await getCffexPositions(),200)}catch(error){return jsonResponse({date:null,rows:[],error:error.message||"中金所排名暂不可用"},502)}}
  if(url.pathname==="/api/quote"){
    const symbol=(url.searchParams.get("symbol")||"").toUpperCase().trim();
    if(url.searchParams.get("mode")==="detail")return getTodayIntraday(symbol);
    const info=inferredInfo(symbol);
    if(info&&info[2]==="KR")return getNaverQuote(symbol);
    return getYahooQuote(symbol);
  }
  if(url.pathname==="/api/detail")return getTodayIntraday((url.searchParams.get("symbol")||"").toUpperCase().trim());
  if(url.pathname==="/api/market")return market();
  return new Response("Not Found",{status:404,headers:{"content-type":"text/plain;charset=UTF-8"}});
}
export default {
  fetch:function(request){
    return handleRequest(request);
  }
};
