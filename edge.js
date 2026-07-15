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

async function getYahooQuote(symbol){
  const metaInfo=quoteInfo[symbol];
  if(!metaInfo)return jsonResponse({error:"Unsupported symbol"},400);
  const url="https://query1.finance.yahoo.com/v8/finance/chart/"+encodeURIComponent(symbol)+"?range=1d&interval=5m";
  const response=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0","Accept":"application/json"}});
  if(!response.ok)return jsonResponse({error:"Yahoo HTTP "+response.status,symbol:symbol},502);
  const json=await response.json();
  const result=json.chart&&json.chart.result&&json.chart.result[0]?json.chart.result[0]:null;
  if(!result||!result.meta)return jsonResponse({error:"Yahoo empty response",symbol:symbol},502);
  const meta=result.meta;
  const raw=result.indicators&&result.indicators.quote&&result.indicators.quote[0]?result.indicators.quote[0].close:[];
  const points=(raw||[]).filter(function(value){return typeof value==="number"&&Number.isFinite(value)});
  const price=Number(meta.regularMarketPrice||points[points.length-1]);
  const previous=Number(meta.chartPreviousClose||meta.previousClose||points[0]||price);
  const change=price-previous;
  const step=Math.max(1,Math.floor(points.length/24));
  const chartPoints=points.filter(function(value,index){return index%step===0}).slice(-24);
  const id=metaInfo[0],name=metaInfo[1],marketName=metaInfo[2],kind=metaInfo[3];
  const item={id:id,name:name,localName:meta.longName||meta.shortName||name,symbol:symbol,market:marketName,kind:kind,price:price,change:change,changePercent:previous?change/previous*100:0,currency:meta.currency||(marketName==="JP"?"JPY":"KRW"),points:chartPoints.length?chartPoints:[previous,price],source:"Yahoo Chart"};
  return jsonResponse({item:item,updatedAt:new Date().toISOString(),source:"Yahoo Chart",subrequests:1},200);
}

function naverNumber(value){
  return Number(String(value==null?"0":value).replace(/,/g,"").replace(/%/g,""));
}

async function getNaverQuote(symbol){
  const metaInfo=quoteInfo[symbol];
  if(!metaInfo)return jsonResponse({error:"Unsupported symbol"},400);
  const isIndex=symbol==="^KS11"||symbol==="^KQ11";
  const code=isIndex?(symbol==="^KS11"?"KOSPI":"KOSDAQ"):symbol.replace(".KS","");
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
  const item={id:id,name:name,localName:data.stockName||name,symbol:symbol,market:marketName,kind:kind,price:price,change:change,changePercent:percent,currency:"KRW",points:[price-change,price],source:"Naver Finance"};
  return jsonResponse({item:item,updatedAt:new Date().toISOString(),source:"Naver Finance",subrequests:1},200);
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
  if(url.pathname==="/api/quote"){
    const symbol=url.searchParams.get("symbol")||"";
    const info=quoteInfo[symbol];
    if(info&&info[2]==="KR")return getNaverQuote(symbol);
    return getYahooQuote(symbol);
  }
  if(url.pathname==="/api/market")return market();
  return new Response("Not Found",{status:404,headers:{"content-type":"text/plain;charset=UTF-8"}});
}
export default {
  fetch:function(request){
    return handleRequest(request);
  }
};
