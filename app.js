'use strict';
(() => {
  const DATA=window.RESEARCH_DATA;
  if(!DATA){document.querySelector('#result-count').textContent='Chưa tải được dữ liệu. Vui lòng tải lại trang.';return;}
  const $=id=>document.getElementById(id);
  const tenYear=DATA.sample?.id==='ten-year';
  const rows=DATA.rows,byId=new Map(rows.map(r=>[r.id,r]));
  const curatedOrder=new Map(DATA.curated.map((id,i)=>[id,i]));
  const holdingKey=(r,h=r.hold)=>JSON.stringify([r.ma,r.width_atr,r.confirmation,r.policy,h]);
  const byHolding=new Map(rows.map(r=>[holdingKey(r),r]));
  // Fixed BR3 comparator: same setup, band, confirmation and holding schedule.
  const bottomRow=r=>byHolding.get(holdingKey({...r,policy:'BR3'}));
  const policyLabels={L20:'Top 3 mạnh 20D',L60:'Top 3 mạnh 60D',B3:'Bottom 3 theo 20D',BR3:'Bottom hồi tương đối',Cmix:'Bottom vào Top 3 RS3 + leader',Rmix:'Bottom hồi + leader',B3switch:'Đổi rổ khi bottom đột biến',SPY:'SPY đối chiếu'};
  const policyShort={L20:'Xếp hạng performance 20 phiên',L60:'Xếp hạng performance 60 phiên',B3:'Ba ngành yếu nhất hôm trước',BR3:'Bottom 4, chọn 3 mã hồi tốt nhất 3D',Cmix:'Có xác nhận hạng & tăng giá',Rmix:'Tăng giá và vượt SPY · điền leader',B3switch:'Chỉ đổi khi cả rổ có xác nhận',SPY:'Benchmark · không phải rổ 3 mã'};
  const entryLabels={touch:'Chạm / vào vùng',hold:'Giữ MA cuối ngày',reclaim:'Lấy lại MA',sweep_close:'Sweep đóng trên đáy',sweep_next_confirm:'Sweep + phiên sau vượt đỉnh'};
  const maKeys=['D10','D20','D50','D200','W10','W20','W50','W200','SWING_LOW'];
  const state={mode:'summary',scope:'all',sortKey:'curated',descending:false,page:1,pageSize:25};
  let filtered=[],lastFocus=null,toastTimer;
  const pct=(v,d=2)=>v==null?'—':(v*100).toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d})+'%';
  const signed=(v,d=2)=>v==null?'—':(v>0?'+':'')+pct(v,d);
  const num=v=>v==null?'—':v.toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2});
  const count=v=>v.toLocaleString('vi-VN');
  const dateLabel=v=>v?v.split('-').reverse().join('/'):'—';
  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
  const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const maLabel=r=>r.ma==='SWING_LOW'?'SPY sweep swing low':`MA${r.ma.slice(1)} ${r.ma[0]==='D'?'Daily':'Weekly'}`;
  const widthLabel=r=>r.width_atr==null?'Đáy đã xác nhận':r.width_atr===0?'Chạm đúng đường':`Vùng ±${r.width_atr.toLocaleString('vi-VN')} ATR`;
  const positiveClass=v=>v==null?'neutral-text':v>0?'pos':v<0?'neg':'neutral-text';
  function pfClass(v,n){return v==null?'pf-unavailable':n<20?'pf-low-sample':v>=3?'pf-purple':v>=2?'pf-green':v<1?'pf-red':'pf-neutral';}
  function pfHTML(v,n){return `<span class="pf-pill ${pfClass(v,n)}">${num(v)}</span>`;}
  function setupDescription(r){return `${widthLabel(r)} · ${entryLabels[r.confirmation]}`;}
  function bottomHTML(r){
    const b=bottomRow(r);if(!b)return '<span class="neutral-text">Chưa có dữ liệu</span>';
    return `<button class="bottom-result" type="button" data-bottom-detail="${b.id}" aria-label="Xem bottom hồi nhanh: ${escape(maLabel(r))}, giữ ${r.hold} phiên" title="BR3: Bottom 4 theo 20D hôm trước → Top 3 theo PERF 3D tại ngày tín hiệu. Bấm xem chi tiết."><span class="bottom-main"><span class="bottom-label">PF</span>${pfHTML(b.all.pf,b.all.n)}<span class="${b.all.n<20?'sample-warning':'cell-sub'}">${b.all.n} rổ${b.all.n<20?' · Ít mẫu':''}</span></span><span class="bottom-metrics"><span>Win <b>${pct(b.all.wr,1)}</b></span><span>TB/rổ <b class="${positiveClass(b.all.avg)}">${signed(b.all.avg)}</b></span></span></button>`;
  }
  function addOptions(id,items){for(const [value,label] of items){const o=document.createElement('option');o.value=value;o.textContent=label;$(id).append(o);}}
  addOptions('policy',Object.entries(policyLabels));addOptions('confirmation',Object.entries(entryLabels));
  addOptions('ma',maKeys.map(ma=>[ma,ma==='SWING_LOW'?'SPY sweep swing low':maLabel({ma})]));

  const columns=[
    {key:'setup',label:'Setup SPY',value:r=>maLabel(r)},
    {key:'policy',label:'Chọn ngành',value:r=>policyLabels[r.policy]},
    {key:'hold',label:'Giữ',value:r=>r.hold},
    {key:'n',label:'Số rổ',value:r=>r.all.n},
    {key:'pf',label:'Profit factor',value:r=>r.all.pf},
    {key:'bottom',label:'Top bottom hồi phục nhanh nhất',value:r=>bottomRow(r)?.all.pf??null},
    {key:'wr',label:'Win rate',value:r=>r.all.wr},
    {key:'avg',label:'TB / rổ',value:r=>r.all.avg},
    {key:'recent',label:'PF 2025–26',value:r=>r.recent.pf},
    {key:'cost',label:'PF phí 0,30%',value:r=>r.cost030.pf},
    {key:'drop',label:'PF bỏ 3 rổ tốt nhất',value:r=>r.drop3.pf},
    {key:'worst',label:'Rổ thua tệ nhất',value:r=>r.all.worst},
    {key:'details',label:'',value:r=>r.id}
  ];
  function renderHead(){
    $('table-head').replaceChildren();
    for(const col of columns){const th=document.createElement('th');th.scope='col';th.dataset.column=col.key;
      if(col.key==='details'){th.innerHTML='<span class="neutral-text">Chi tiết</span>';}
      else{th.setAttribute('aria-sort',state.sortKey===col.key?(state.descending?'descending':'ascending'):'none');
        const b=document.createElement('button');b.type='button';b.dataset.sort=col.key;b.innerHTML=escape(col.label)+'<span class="sort-icon" aria-hidden="true">'+(state.sortKey===col.key?(state.descending?'↓':'↑'):'↕')+'</span>';
        b.addEventListener('click',()=>{if(state.sortKey===col.key)state.descending=!state.descending;else{state.sortKey=col.key;state.descending=!['setup','policy','hold'].includes(col.key);}state.page=1;render();});th.append(b);}
      $('table-head').append(th);
    }
  }
  function getFiltered(){
    const q=norm($('search').value.trim()),policy=$('policy').value,confirmation=$('confirmation').value,hold=$('hold').value,ma=$('ma').value,width=$('width').value;
    const minN=Math.max(0,Number($('min-n').value)||0),minPF=Math.max(0,Number($('min-pf').value)||0);
    let list=rows.filter(r=>{
      if(state.mode==='summary'&&!curatedOrder.has(r.id))return false;
      if(!$('benchmark').checked&&r.policy==='SPY')return false;
      if(state.scope==='daily'&&!r.ma.startsWith('D'))return false;
      if(state.scope==='weekly'&&!r.ma.startsWith('W'))return false;
      if(state.scope==='sweep'&&r.ma!=='SWING_LOW')return false;
      if(policy&&r.policy!==policy||confirmation&&r.confirmation!==confirmation||hold&&r.hold!==Number(hold)||ma&&r.ma!==ma)return false;
      if(width!==''&&(r.width_atr==null||r.width_atr!==Number(width)))return false;
      if(r.all.n<minN||minPF>0&&(r.all.pf==null||r.all.pf<minPF))return false;
      if(q&&!norm(`${maLabel(r)} ${r.ma} ${widthLabel(r)} ${entryLabels[r.confirmation]} ${policyLabels[r.policy]} ${policyShort[r.policy]}`).includes(q))return false;
      return true;
    });
    if(state.sortKey==='curated')list.sort((a,b)=>(curatedOrder.get(a.id)??a.id+100)-(curatedOrder.get(b.id)??b.id+100));
    else{const col=columns.find(c=>c.key===state.sortKey);list.sort((a,b)=>{const x=col.value(a),y=col.value(b);if(x==null)return y==null?0:1;if(y==null)return-1;return (typeof x==='string'?x.localeCompare(y,'vi'):x-y)*(state.descending?-1:1);});}
    return list;
  }
  function rowHTML(r){
    const sparse=r.all.n<20;
    let flag=r.ma==='SWING_LOW'?'<span class="mini-tag">SWEEP</span>':r.ma.startsWith('W')?'<span class="mini-tag">W</span>':'<span class="mini-tag">D</span>';
    return `<td><div class="setup-primary">${escape(maLabel(r))} ${flag}</div><div class="setup-secondary">${escape(setupDescription(r))}</div></td>
      <td><div class="policy-name">${escape(policyLabels[r.policy])}</div><div class="policy-description">${escape(policyShort[r.policy])}</div></td>
      <td>${r.hold} phiên</td><td><span class="sample-count">${r.all.n}</span><span class="${sparse?'sample-warning':'sample-ok'}">${sparse?'Ít mẫu':'rổ giao dịch'}</span></td>
      <td>${pfHTML(r.all.pf,r.all.n)}</td>
      <td class="bottom-cell">${bottomHTML(r)}</td>
      <td><div class="wr-wrap"><span>${pct(r.all.wr,1)}</span><div class="wr-track" aria-hidden="true"><div class="wr-fill" style="width:${Math.max(0,Math.min(100,(r.all.wr??0)*100))}%"></div></div></div></td>
      <td class="${positiveClass(r.all.avg)}">${signed(r.all.avg)}</td>
      <td>${pfHTML(r.recent.pf,r.recent.n)}<div class="cell-sub">${r.recent.n} rổ</div></td>
      <td>${pfHTML(r.cost030.pf,r.cost030.n)}</td><td>${pfHTML(r.drop3.pf,r.drop3.n)}</td>
      <td class="${positiveClass(r.all.worst)}">${signed(r.all.worst)}</td>
      <td><button class="detail-link" data-detail="${r.id}" aria-label="Chi tiết ${escape(maLabel(r))}, ${escape(policyLabels[r.policy])}">↗</button></td>`;
  }
  function render(){
    filtered=getFiltered();const pages=Math.max(1,Math.ceil(filtered.length/state.pageSize));state.page=Math.min(state.page,pages);
    const start=(state.page-1)*state.pageSize,visible=filtered.slice(start,start+state.pageSize);
    const frag=document.createDocumentFragment();
    for(const r of visible){const tr=document.createElement('tr');tr.dataset.id=r.id;tr.tabIndex=0;tr.setAttribute('aria-label',`${maLabel(r)}, ${policyLabels[r.policy]}, ${r.all.n} rổ, PF ${num(r.all.pf)}`);tr.innerHTML=rowHTML(r);tr.addEventListener('click',e=>{const target=e.target.closest('[data-bottom-detail]');openDetail(target?target.dataset.bottomDetail:r.id);});tr.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target===tr){e.preventDefault();openDetail(r.id);}});frag.append(tr);}
    $('table-body').replaceChildren(frag);$('empty').hidden=filtered.length!==0;$('research-table').hidden=filtered.length===0;
    $('result-count').innerHTML=`<b>${count(filtered.length)}</b> ${state.mode==='summary'?'dòng tổng kết':'cấu hình phù hợp'} <span>· ${state.mode==='summary'?'Bản so sánh đã chọn':'Trên '+count(DATA.count)+' cấu hình, gồm SPY đối chiếu'}</span>`;
    $('page-info').textContent=`${state.page} / ${pages}`;$('prev-page').disabled=state.page===1;$('next-page').disabled=state.page===pages;
    $('summary-view').classList.toggle('active',state.mode==='summary');$('all-view').classList.toggle('active',state.mode==='all');$('summary-view').setAttribute('aria-pressed',String(state.mode==='summary'));$('all-view').setAttribute('aria-pressed',String(state.mode==='all'));
    document.querySelectorAll('[data-scope]').forEach(b=>{b.classList.toggle('active',b.dataset.scope===state.scope);b.setAttribute('aria-pressed',String(b.dataset.scope===state.scope));});
    renderHead();renderHighlights();requestAnimationFrame(syncScrollWidth);
  }
  function syncScrollWidth(){const v=$('table-scroll');$('horizontal-width').style.width=v.scrollWidth+'px';$('horizontal-scroll').scrollLeft=v.scrollLeft;}
  $('table-scroll').addEventListener('scroll',()=>{$('horizontal-scroll').scrollLeft=$('table-scroll').scrollLeft;},{passive:true});
  $('horizontal-scroll').addEventListener('scroll',()=>{$('table-scroll').scrollLeft=$('horizontal-scroll').scrollLeft;},{passive:true});
  window.addEventListener('resize',syncScrollWidth);
  function setView(mode,resetScope=true){state.mode=mode;state.page=1;state.sortKey=mode==='summary'?'curated':'pf';state.descending=mode!=='summary';$('min-n').value=mode==='summary'?'0':'20';if(resetScope)state.scope='all';render();}
  $('summary-view').addEventListener('click',()=>setView('summary'));$('all-view').addEventListener('click',()=>setView('all'));
  document.querySelectorAll('[data-scope]').forEach(b=>b.addEventListener('click',()=>{state.scope=b.dataset.scope;state.mode=state.scope==='all'?state.mode:'all';state.page=1;state.sortKey=state.mode==='summary'?'curated':'pf';state.descending=state.mode==='all';$('ma').value='';$('width').value='';$('confirmation').value='';$('min-n').value=state.mode==='summary'?'0':'20';render();}));
  for(const id of ['search','policy','confirmation','hold','ma','width','min-n','min-pf','benchmark'])$(id).addEventListener('input',()=>{if(id==='hold'&&$('hold').value==='3'&&state.mode==='summary'){state.mode='all';state.sortKey='pf';state.descending=true;$('min-n').value='20';}state.page=1;render();});
  document.querySelectorAll('[data-hold]').forEach(b=>b.addEventListener('click',()=>{$('hold').value=b.dataset.hold;state.page=1;render();}));
  $('more-filters').addEventListener('click',()=>{const expanded=$('more-filters').getAttribute('aria-expanded')==='true';$('more-filters').setAttribute('aria-expanded',String(!expanded));$('advanced-filters').hidden=expanded;});
  function reset(){for(const id of ['search','policy','confirmation','ma','width'])$(id).value='';$('hold').value='5';$('min-pf').value='0';$('min-n').value=state.mode==='summary'?'0':'20';$('benchmark').checked=false;state.scope='all';state.page=1;state.sortKey=state.mode==='summary'?'curated':'pf';state.descending=state.mode==='all';render();}
  $('reset').addEventListener('click',reset);$('empty-reset').addEventListener('click',reset);
  $('page-size').addEventListener('change',()=>{state.pageSize=Number($('page-size').value);state.page=1;render();});
  $('prev-page').addEventListener('click',()=>{state.page--;render();$('table-scroll').scrollTop=0;});$('next-page').addEventListener('click',()=>{state.page++;render();$('table-scroll').scrollTop=0;});
  function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3500);}
  async function fullScreen(target){try{if(document.fullscreenElement)await document.exitFullscreen();else if(target.requestFullscreen)await target.requestFullscreen();else toast('Thiết bị này chưa hỗ trợ chế độ toàn màn hình.');}catch{toast('Trình duyệt chưa cho phép toàn màn hình.');}}
  $('fullscreen').addEventListener('click',()=>fullScreen(document.documentElement));$('table-fullscreen').addEventListener('click',()=>fullScreen(document.querySelector('.workspace')));
  $('export').addEventListener('click',()=>{
    const headers=['ID','Setup','Vùng','Xác nhận','Chọn ngành','Giữ phiên','Số rổ','PF','Win rate','Return trung bình','PF 2025-2026','Rổ 2025-2026','PF phí0.30%','PF bỏ3','Rổ thua tệ nhất','Bottom hồi nhanh: ID BR3','Bottom hồi nhanh: Số rổ','Bottom hồi nhanh: PF','Bottom hồi nhanh: Win rate','Bottom hồi nhanh: Return trung bình','Nguồn dữ liệu','Cửa sổ mẫu'];
    const cell=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
    const lines=[headers,...filtered.map(r=>{const b=bottomRow(r);return [r.id,maLabel(r),widthLabel(r),entryLabels[r.confirmation],policyLabels[r.policy],r.hold,r.all.n,r.all.pf,r.all.wr,r.all.avg,r.recent.pf,r.recent.n,r.cost030.pf,r.drop3.pf,r.all.worst,b?.id,b?.all.n,b?.all.pf,b?.all.wr,b?.all.avg,tenYear?DATA.sample.source:'CSV TradingView gốc',tenYear?DATA.sample.start+' → '+DATA.sample.end:'2019–2026 sau khởi tạo MA'];})];
    const blob=new Blob(['\ufeff'+lines.map(line=>line.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='pullback-research-filtered.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(`Đã xuất ${count(filtered.length)} dòng đang lọc.`);
  });

  function entryExplanation(r){
    if(r.ma==='SWING_LOW')return r.confirmation==='sweep_close'?'SPY xuyên swing low đã xác nhận rồi đóng lại trên đáy. Mua tại open phiên kế tiếp.':'Sau nến sweep, ngay phiên tiếp theo phải close vượt high nến sweep. Mua open sau phiên xác nhận; không chờ các phiên muộn hơn.';
    const level=r.width_atr===0?'đường MA':'vùng quanh MA';
    if(r.confirmation==='touch')return `SPY từ trên đi xuống chạm ${level}, sau 3 phiên chưa chạm. Mua open hôm sau; không bắt buộc close hồi lại trên MA. Gap xuyên cũng tính.`;
    if(r.confirmation==='hold')return `Ngày SPY đi vào ${level} phải close ≥ tâm MA. Mua open phiên kế tiếp nếu điều kiện này đạt.`;
    return `Sau khi SPY đi vào ${level}, chờ lần đầu close ≥ tâm MA trong ngày chạm hoặc tối đa 5 phiên sau. Mua open ngay sau ngày lấy lại MA.`;
  }
  function policyExplanation(r){return ({L20:'Chọn ba ETF đứng đầu return 20 phiên tại ngày tín hiệu; mỗi mã ⅓ vốn dành cho rổ.',L60:'Chọn ba ETF đứng đầu return 60 phiên tại ngày tín hiệu; mỗi mã ⅓ vốn dành cho rổ.',B3:'Mua ba ETF cuối return 20 phiên của ngày trước ngày tín hiệu; mỗi mã ⅓. Không bắt buộc các mã đã tăng giá.',BR3:'Lấy bottom 4 theo return20 của hôm trước; chọn 3 mã có return3D hiện tại tốt nhất. Hồi tương đối vẫn có thể là giảm chậm hơn.',Cmix:'Trong bottom4 hôm trước, ưu tiên mã hiện vào Top3 return3D và có return3D dương, vượt SPY. Thiếu vị trí thì điền bằng leader20.',Rmix:'Trong Bottom3 hôm trước, ưu tiên mã có return3D dương và vượt SPY3D, đồng thời phiên tín hiệu tăng giá và vượt SPY. Thiếu vị trí thì điền bằng leader20.',B3switch:'Chuyển toàn rổ sang Bottom3 chỉ khi trung bình return3D của rổ dương và vượt SPY3D, đồng thời return ngày của rổ dương và vượt SPY. Nếu không đạt, vẫn mua Top3 leader20.',SPY:'Mua duy nhất SPY để đối chiếu cùng thời điểm, không phải rổ ba mã.'})[r.policy];}
  function openDetail(id){
    const r=byId.get(Number(id));if(!r)return;lastFocus=document.activeElement;
    const periods=[['Đầu mẫu–2022',r.early],['2023–2024',r.middle],['2025–2026',r.recent]];
    const peers=[5,10,20].map(h=>byHolding.get(holdingKey(r,h))).filter(Boolean);
    const sampleHTML=r.sample?`<section class="detail-block"><h3>Mẫu thực tế của cấu hình</h3><p>Tín hiệu: <b>${dateLabel(r.sample.first_signal)}</b> → <b>${dateLabel(r.sample.last_signal)}</b><br>Giao dịch đã đóng: ${dateLabel(r.sample.first_entry)} → ${dateLabel(r.sample.last_exit)}<br>${r.all.n} rổ trong cửa sổ ${dateLabel(DATA.sample.start)}–${dateLabel(DATA.sample.end)}.</p><details class="year-counts"><summary>Số rổ theo năm tín hiệu</summary><div>${Array.from({length:11},(_,i)=>String(2016+i)).map(y=>`<span>${y}<b>${r.sample.year_counts[y]??0}</b></span>`).join('')}</div><p>2016 và 2026 là các năm chỉ có một phần trong cửa sổ 10 năm.</p></details></section>`:'';
    $('detail-content').innerHTML=`<h2 id="detail-title">${escape(maLabel(r))}</h2><p class="detail-sub">${escape(setupDescription(r))}<br>${escape(policyLabels[r.policy])} · Cấu hình #${r.id}</p>
      <div class="detail-badges"><span class="tag blue">Long-only</span><span class="tag gray">${r.hold} phiên</span><span class="tag ${r.all.n<20?'amber':'mint'}">${r.all.n} rổ${r.all.n<20?' · Ít mẫu':''}</span></div>
      <div class="detail-stats"><div class="detail-stat"><small>Profit factor sau phí</small><b>${num(r.all.pf)}</b></div><div class="detail-stat"><small>Win rate</small><b>${pct(r.all.wr,1)}</b></div><div class="detail-stat"><small>Return trung bình / rổ</small><b class="${positiveClass(r.all.avg)}">${signed(r.all.avg)}</b></div><div class="detail-stat"><small>Trung vị return / rổ</small><b class="${positiveClass(r.all.median)}">${signed(r.all.median)}</b></div></div>
      ${r.all.n<20?'<div class="detail-note">Ít hơn 20 rổ. PF có thể thay đổi mạnh chỉ bởi một vài giao dịch; không xem đây là mức kỳ vọng.</div>':''}
      ${sampleHTML}
      <section class="detail-block"><h3>Cùng công thức · So sánh 5 / 10 / 20 phiên</h3><div class="holding-comparison-scroll"><table class="period-table holding-comparison"><thead><tr><th>Giữ</th><th>Rổ</th><th>PF</th><th>Win rate</th><th>TB / rổ</th><th>Thua tệ nhất</th></tr></thead><tbody>${peers.map(q=>`<tr class="${q.hold===r.hold?'current-holding':''}"><td>${q.hold} phiên</td><td>${q.all.n}</td><td>${num(q.all.pf)}</td><td>${pct(q.all.wr,1)}</td><td class="${positiveClass(q.all.avg)}">${signed(q.all.avg)}</td><td class="${positiveClass(q.all.worst)}">${signed(q.all.worst)}</td></tr>`).join('')}</tbody></table></div><p>Mỗi kỳ chạy lịch riêng và bỏ tín hiệu khi còn giữ rổ; số rổ và ngày vào có thể khác nhau. Chỉ tính lệnh đủ dữ liệu thoát; phí khứ hồi 0,10%.</p></section>
      <section class="detail-block"><h3>Cách vào và thoát</h3><p>${escape(entryExplanation(r))}</p><p>${escape(policyExplanation(r))}</p><p>Bán cuối phiên giữ thứ <b>${r.hold}</b>. Phiên mua tính là số 1. Không đổi mã hoặc cân bằng lại; đang có vị thế thì bỏ tín hiệu mới. Chưa có stop-loss.</p></section>
      <section class="detail-block"><h3>Kết quả theo giai đoạn</h3><table class="period-table"><thead><tr><th>Giai đoạn</th><th>Rổ</th><th>PF</th><th>TB / rổ</th></tr></thead><tbody>${periods.map(([label,m])=>`<tr><td>${label}</td><td>${m.n}${m.n<20?' · Ít mẫu':''}</td><td>${pfHTML(m.pf,m.n)}</td><td class="${positiveClass(m.avg)}">${signed(m.avg)}</td></tr>`).join('')}</tbody></table><p>${tenYear?'Phân nhóm theo ngày tín hiệu; ba giai đoạn bao phủ toàn bộ rổ. Đây không phải các tập holdout độc lập.':'Rổ đi qua mốc năm 2022/23 hoặc 2024/25 không nằm trong các nhóm giai đoạn, nhưng vẫn có trong kết quả tổng.'}</p></section>
      <section class="detail-block"><h3>Kiểm tra độ bền</h3><p>PF khi phí khứ hồi 0,30%: <b>${num(r.cost030.pf)}</b><br>PF bỏ ba rổ thắng lớn nhất: <b>${num(r.drop3.pf)}</b><br>Rổ thua tệ nhất: <b>${signed(r.all.worst)}</b><br>Drawdown tại lúc đóng rổ: <b>${signed(r.all.closed_dd)}</b></p><p>Drawdown này chưa bao gồm đầy đủ diễn biến trong thời gian giữ. Lỗ lớn nhất lịch sử không phải giới hạn lỗ.</p></section>
      <section class="detail-block"><h3>Đọc đúng số liệu</h3><p>PF trên cùng vốn cơ sở mỗi rổ, sau phí 0,10%. “—” nghĩa là không ước lượng được, ví dụ không có lệnh lỗ hoặc không có mẫu. Dữ liệu đã được xem nhiều lần; chưa có kiểm định độc lập mới.</p></section>`;
    $('drawer-backdrop').hidden=false;$('detail-drawer').hidden=false;document.body.classList.add('drawer-open');$('detail-drawer').scrollTop=0;$('close-drawer').focus();
  }
  function closeDetail(){$('drawer-backdrop').hidden=true;$('detail-drawer').hidden=true;document.body.classList.remove('drawer-open');if(lastFocus&&lastFocus.isConnected)lastFocus.focus();}
  $('close-drawer').addEventListener('click',closeDetail);$('drawer-backdrop').addEventListener('click',closeDetail);
  document.addEventListener('keydown',e=>{if(!$('detail-drawer').hidden){if(e.key==='Escape'){e.preventDefault();closeDetail();}else if(e.key==='Tab'){const targets=[...$('detail-drawer').querySelectorAll('button,a[href],input,select,[tabindex="0"]')].filter(e=>!e.disabled);if(targets.length){const first=targets[0],last=targets.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}}});
  const spotIds={daily:DATA.curated[0],weekly:DATA.curated[1],recover:DATA.curated[2]};
  function renderHighlights(){
    const hold=Number($('hold').value)||5;
    $('holding-context').textContent=$('hold').value?`Kết quả giữ ${hold} phiên · Mua open hôm sau, bán close phiên số ${hold} · Phiên mua tính là số 1`:'Bảng hiển thị mọi kỳ · Các ô kết quả phía trên đang thể hiện kỳ giữ 5 phiên';
    document.querySelectorAll('[data-hold]').forEach(b=>{const active=b.dataset.hold===$('hold').value;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    document.querySelectorAll('[data-spot]').forEach(b=>{
      const base=byId.get(DATA.curated[{daily:0,weekly:1,recover:2}[b.dataset.spot]]),r=byHolding.get(holdingKey(base,hold));
      spotIds[b.dataset.spot]=r.id;b.querySelector('.metric-main strong').textContent=num(r.all.pf);b.querySelector('.metric-main>span').textContent=`PF · giữ ${hold} phiên`;
      b.querySelector('.metric-bottom').innerHTML=`<span><b>${r.all.n}</b> rổ</span><span><b>${pct(r.all.wr,1)}</b> win rate</span><span class="tag ${r.all.n<20?'amber':'mint'}">${r.all.n<20?'Ít mẫu':b.dataset.spot==='recover'?r.baskets_with_recovering_bottom+' nhịp có hồi':b.dataset.spot==='daily'?'Top 3 leader':'±0,5 ATR'}</span>`;
    });
  }
  document.querySelectorAll('[data-spot]').forEach(b=>b.addEventListener('click',()=>openDetail(spotIds[b.dataset.spot])));
  function applySampleMeta(){
    const assets=DATA.assets??{};
    const mapping={'research-results.csv':assets.csv,'research-methodology.md':assets.methodology,'holding_comparison_baskets.csv':assets.baskets,'holding_comparison_legs.csv':assets.legs};
    for(const [original,target] of Object.entries(mapping)){if(target)document.querySelectorAll(`a[href="${original}"]`).forEach(a=>{a.href=target;if(original==='holding_comparison_legs.csv')a.textContent='Giá điều chỉnh từng ETF';});}
    $('source-label').textContent=tenYear?DATA.sample.source:'CSV TradingView do anh cung cấp';
    document.querySelector('.hero-tags span').textContent=tenYear?'10 → 11 ETF đủ điều kiện':'11 ETF ngành';
    if(tenYear){
      $('sample-note').innerHTML=`<b>${dateLabel(DATA.sample.start)}–${dateLabel(DATA.sample.end)}</b> · ${count(DATA.sample.sessions)} phiên · XLC đủ điều kiện từ ${dateLabel(DATA.sample.XLC_eligible)} sau 200 phiên lịch sử. Nguồn, độ dài mẫu và nhóm ETF khác CSV gốc. <a href="${assets.sourceAudit}" download>Nguồn & phạm vi</a> · <a href="${assets.verification}" download>Kiểm tra</a> · <a href="${assets.prices}" download>OHLC điều chỉnh</a>`;
      document.querySelector('.page-footer span:last-child').textContent=`10 năm · 10 → 11 ETF · Yahoo điều chỉnh · Chốt ${dateLabel(DATA.asof)}`;
      document.querySelectorAll('.methodology-content p').forEach(p=>{if(p.textContent.startsWith('Chi phí & rủi ro:'))p.innerHTML='<b>Chi phí & rủi ro:</b> 0,10% khứ hồi theo vốn đầu tư; chưa có thuế/funding hay hard stop. Drawdown chỉ tại lúc đóng rổ. Nguồn Yahoo OHLC điều chỉnh cổ tức/split; giá điều chỉnh là cơ sở nghiên cứu, không phải giá USD khớp lệnh lịch sử. ETF cần đủ 200 phiên trước tín hiệu; XLC thêm từ 05/04/2019. Phân nhóm giai đoạn theo ngày tín hiệu.';});
    }else $('sample-note').innerHTML='<b>CSV gốc · ~7,5 năm giao dịch</b> · Dữ liệu chung đủ 11 ETF từ 19/06/2018; giao dịch sau khởi tạo MA từ 2019, chốt 03/11/2026. Kết quả và nguồn gốc được giữ nguyên để đối chiếu với bản 10 năm.';
  }
  applySampleMeta();
  render();
  document.body.classList.remove('data-loading');
})();
