'use strict';
(async()=>{
 const fail=()=>{document.getElementById('context').textContent='Chưa tải được bộ dữ liệu. Anh tải lại trang để xem kết quả.';document.getElementById('date-range').textContent='Dữ liệu chưa tải hoàn tất';};
 try{
  const res=await fetch('subsector-data.json.gz?v=1');if(!res.ok)throw Error('Data unavailable');
  const bytes=new Uint8Array(await res.arrayBuffer());let json;
  if(bytes[0]===31&&bytes[1]===139){
   if(typeof DecompressionStream==='undefined')throw Error('Browser unsupported');
   const decoded=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
   json=await new Response(decoded).text();
  }else json=new TextDecoder().decode(bytes);
  window.SUBSECTOR_DATA=JSON.parse(json);
  const app=document.createElement('script');app.src='subsector-app.js?v=1';app.onerror=fail;document.head.append(app);
 }catch{fail();}
})();
