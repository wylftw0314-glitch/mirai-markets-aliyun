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

async function fetchWithTimeout(url,options={},timeout=8000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeout);
  try{return await fetch(url,{...options,signal:controller.signal})}finally{clearTimeout(timer)}
}

async function getNaverKorea(){
  const stocks=Object.keys(koreaInfo).filter(code=>/^\d/.test(code)).map(code=>`SERVICE_ITEM:${code}`);
  const query=[...stocks,"SERVICE_INDEX:KOSPI","SERVICE_INDEX:KOSDAQ"].join("|");
  const response=await fetchWithTimeout(`https://polling.finance.naver.com/api/realtime?query=${encodeURIComponent(query)}`,{
    headers:{"User-Agent":"Mozilla/5.0","Referer":"https://finance.naver.com/","Accept":"application/json"}
  });
  if(!response.ok)throw new Error(`Naver ${response.status}`);
  const json=await response.json();
  const rows=(json.result?.areas||[]).flatMap(area=>area.datas||[]);
  return rows.map(row=>{
    const code=String(row.cd||"");
    const meta=koreaInfo[code];
    if(!meta)return null;
    const [id,name,kind]=meta;
    const scale=kind==="index"?100:1;
    const price=Number(row.nv)/scale;
    const change=Math.abs(Number(row.cv||0))/scale*(String(row.rf)==="5"?-1:1);
    const percent=Math.abs(Number(row.cr||0))*(String(row.rf)==="5"?-1:1);
    const previous=price-change;
    return {id,name,localName:name,symbol:kind==="stock"?`${code}.KS`:code,market:"KR",kind,price,change,changePercent:percent,currency:"KRW",points:[previous,price],source:"Naver Finance"};
  }).filter(item=>item&&Number.isFinite(item.price));
}

async function getYahooJapanBatch(){
  const url=`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(japanSymbols.join(","))}`;
  const response=await fetchWithTimeout(url,{headers:{"User-Agent":"Mozilla/5.0"}});
  if(!response.ok)throw new Error(`Yahoo ${response.status}`);
  const json=await response.json();
  const quotes=json.quoteResponse?.result||[];
  return quotes.map(quote=>{
    const symbol=quote.symbol;
    const meta=japanInfo[symbol];
    if(!meta)return null;
    const [id,name,kind]=meta;
    const price=Number(quote.regularMarketPrice);
    const change=Number(quote.regularMarketChange||0);
    const percent=Number(quote.regularMarketChangePercent||0);
    const previous=Number(quote.regularMarketPreviousClose||price-change);
    return {id,name,localName:quote.longName||quote.shortName||name,symbol,market:"JP",kind,price,change,changePercent:percent,currency:quote.currency||"JPY",points:[previous,price],source:"Yahoo Finance"};
  }).filter(item=>item&&Number.isFinite(item.price));
}

async function market(){
  const [korea,japan]=await Promise.allSettled([
    getNaverKorea(),
    getYahooJapanBatch()
  ]);
  const items=[];
  const sources=[];
  const errors=[];
  if(korea.status==="fulfilled"){items.push(...korea.value);sources.push("Naver Finance")}
  else errors.push(`Naver: ${korea.reason?.message||"failed"}`);
  if(japan.status==="fulfilled"&&japan.value.length){items.push(...japan.value);sources.push("Yahoo Finance")}
  else errors.push(`Yahoo: ${japan.reason?.message||"empty"}`);
  return new Response(JSON.stringify({items,updatedAt:new Date().toISOString(),sources,errors,subrequests:2}),{
    status:items.length?200:502,
    headers:{"content-type":"application/json;charset=UTF-8","cache-control":"public,max-age=30","access-control-allow-origin":"*"}
  });
}

async function handleRequest(request){
  const url=new URL(request.url);
  if(url.pathname==="/api/market")return market();
  return new Response("Not Found",{status:404,headers:{"content-type":"text/plain;charset=UTF-8"}});
}
addEventListener("fetch",event=>event.respondWith(handleRequest(event.request)));
