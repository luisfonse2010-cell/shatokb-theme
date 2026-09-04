/**
 * fetch-meli.js — GitHub Actions runner
 * Corre en servidores de GitHub (IP no-Cloudflare) → MeLi responde ✅
 */
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const PAISES = [
  { id: 'BR', site: 'MLB', nombre: 'Brasil',    moneda: 'BRL' },
  { id: 'MX', site: 'MLM', nombre: 'México',    moneda: 'MXN' },
  { id: 'CO', site: 'MCO', nombre: 'Colombia',  moneda: 'COP' },
  { id: 'AR', site: 'MLA', nombre: 'Argentina', moneda: 'ARS' },
  { id: 'CL', site: 'MLC', nombre: 'Chile',     moneda: 'CLP' },
  { id: 'PE', site: 'MPE', nombre: 'Perú',      moneda: 'PEN' },
  { id: 'UY', site: 'MLU', nombre: 'Uruguay',   moneda: 'UYU' },
  { id: 'EC', site: 'MEC', nombre: 'Ecuador',   moneda: 'USD' },
];

function fetchJson(url, retries=3){
  return new Promise((resolve,reject)=>{
    const attempt=(n)=>{
      const req=https.get(url,{headers:{'User-Agent':'Mozilla/5.0 (compatible; kabuby-bot/1.0)','Accept':'application/json'},timeout:15000},(res)=>{
        let data='';
        res.on('data',chunk=>data+=chunk);
        res.on('end',()=>{
          if(res.statusCode===200){ try{resolve(JSON.parse(data));}catch(e){reject(new Error('JSON parse error'));} }
          else if(res.statusCode===429&&n>0){ console.log('  Rate limit, reintentando...'); setTimeout(()=>attempt(n-1),3000); }
          else reject(new Error('HTTP '+res.statusCode));
        });
      });
      req.on('error',(e)=>{ if(n>0)setTimeout(()=>attempt(n-1),2000); else reject(e); });
      req.on('timeout',()=>{ req.destroy(); if(n>0)attempt(n-1); else reject(new Error('Timeout')); });
    };
    attempt(retries);
  });
}

async function buscarProducto(site,query,limit=10){
  const url='https://api.mercadolibre.com/sites/'+site+'/search?q='+encodeURIComponent(query)+'&limit='+limit;
  console.log('  Fetching '+site+': '+query);
  const data=await fetchJson(url);
  const results=(data.results||[]).map(item=>({id:item.id,title:item.title,price:item.price,currency:item.currency_id,sold_qty:item.sold_quantity||0,url:item.permalink}));
  const prices=results.map(r=>r.price).filter(p=>p>0).sort((a,b)=>a-b);
  const medianPrice=prices.length?prices[Math.floor(prices.length/2)]:0;
  const total=(data.paging&&data.paging.total)?data.paging.total:results.length;
  return{site,query,total,median_price:medianPrice,results,fetched_at:new Date().toISOString()};
}

async function buscarEnTodos(query){
  console.log('\n🔍 Buscando: "'+query+'"');
  const resultados={};
  for(const pais of PAISES){
    try{
      const r=await buscarProducto(pais.site,query);
      resultados[pais.id]={pais_id:pais.id,pais_nombre:pais.nombre,site:pais.site,total:r.total,median_price:r.median_price,currency:pais.moneda,results:r.results,fetched_at:r.fetched_at,_src:'github-actions'};
      console.log('  ✅ '+pais.nombre+': '+r.total+' resultados, precio mediano '+r.median_price+' '+pais.moneda);
      await new Promise(res=>setTimeout(res,300));
    }catch(e){
      console.log('  ❌ '+pais.nombre+': '+e.message);
      resultados[pais.id]={pais_id:pais.id,pais_nombre:pais.nombre,site:pais.site,total:0,error:e.message,fetched_at:new Date().toISOString(),_src:'error'};
    }
  }
  return resultados;
}

async function main(){
  const args=process.argv.slice(2);
  const outputDir=path.join(__dirname,'..','meli-data');
  if(!fs.existsSync(outputDir)) fs.mkdirSync(outputDir,{recursive:true});

  if(args.length===0){
    console.log('🚀 Modo TRENDING');
    const TRENDING_TERMS=['crema facial','protector solar','suero vitamina c','acido hialuronico','retinol','colageno','auriculares bluetooth','smartwatch','cargador portatil','funda celular','camara web','teclado mecanico'];
    const trendingData={};
    for(const term of TRENDING_TERMS){ trendingData[term]=await buscarEnTodos(term); }
    const output={type:'trending',generated_at:new Date().toISOString(),terms:trendingData};
    fs.writeFileSync(path.join(outputDir,'trending.json'),JSON.stringify(output,null,2));
    console.log('\n✅ Trending guardado');
  }else{
    console.log('🚀 Modo BÚSQUEDA — '+args.length+' producto(s)');
    const searchData={};
    for(const query of args){ searchData[query]=await buscarEnTodos(query); }
    const output={type:'search',generated_at:new Date().toISOString(),queries:searchData};
    const slug=args[0].toLowerCase().replace(/[^a-z0-9]+/g,'-').substring(0,50);
    const outPath=path.join(outputDir,'search-'+slug+'.json');
    fs.writeFileSync(outPath,JSON.stringify(output,null,2));
    console.log('\n✅ Búsqueda guardada en '+outPath);
    const indexPath=path.join(outputDir,'search-index.json');
    let index={};
    if(fs.existsSync(indexPath)){ try{index=JSON.parse(fs.readFileSync(indexPath,'utf8'));}catch(e){} }
    for(const query of args){ index[query]={file:'search-'+slug+'.json',generated_at:output.generated_at}; }
    const entries=Object.entries(index).sort((a,b)=>new Date(b[1].generated_at)-new Date(a[1].generated_at)).slice(0,50);
    fs.writeFileSync(indexPath,JSON.stringify(Object.fromEntries(entries),null,2));
  }
  console.log('\n🎉 fetch-meli.js completado');
}

main().catch(e=>{ console.error('❌ Error fatal:',e.message); process.exit(1); });
