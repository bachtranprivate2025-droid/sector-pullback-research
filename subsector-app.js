'use strict';
(() => {
 const D=window.SUBSECTOR_DATA,$=id=>document.getElementById(id);
 if(!D){$('context').textContent='Chưa tải được dữ liệu. Anh tải lại trang.';return;}
 const entries={touch:'Chạm / vào vùng',hold:'Giữ MA cuối ngày',reclaim:'Lấy lại MA',sweep_close:'Sweep đóng trên đáy',sweep_next_confirm:'Sweep + phiên sau vượt đỉnh'};
 const rules={
  S20:'Xếp hạng performance 20 phiên, chọn ba ETF mạnh nhất thuộc ba nhóm khác nhau.',
  S60:'Xếp hạng performance 60 phiên, chọn ba ETF mạnh nhất thuộc ba nhóm khác nhau.',
  B3:'Chọn ba ETF yếu nhất theo performance 20 phiên hôm trước, mỗi nhóm một mã. Chưa cần xác nhận hồi.',
  BR3:'Bottom 4 theo performance 20 phiên hôm trước → chọn ba mã có performance 3 phiên tốt nhất. Vẫn có thể âm hoặc kém SPY.',
  Rmix:'Trong Bottom 3 hôm trước, ưu tiên mã có performance dương và vượt SPY ở cả 1D lẫn cộng dồn 3D. Thiếu mã thì điền Top 3 leader 20D.',
  Cmix:'Trong Bottom 4 hôm trước, ưu tiên mã vào Top 3 performance 3D toàn nhóm, có performance 3D dương và vượt SPY 3D. Thiếu thì điền leader 20D.',
  R3each:'Trong Bottom 4 hôm trước, ưu tiên mã vượt SPY TỪNG NGÀY ở cả ba phiên gần nhất và có performance cộng dồn 3D dương. Thiếu thì điền leader 20D.',
  Parent:'Chọn Top 3 sector 20D trước. Mỗi sector chọn nhánh con có performance 20D cao nhất nếu vượt sector đó; nếu không có hoặc không vượt thì giữ ETF sector. Đây là rổ kết hợp sector và sub-sector.',
  XL20:'Top 3 trong 11 ETF sector theo performance 20 phiên. Tính lại từ cùng dữ liệu TradingView và cùng lịch giao dịch.',
  SPY:'Mua duy nhất SPY, cùng ngày vào và thoát với các rổ khác; cùng phí khứ hồi.'
 };
 const state={mode:'summary',scope:'all',key:'setup',desc:false,method:'S20',hold:5};
 let filtered=[],lastFocus=null;
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const num=x=>x==null?'N/A':x.toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2});
 const pct=(x,d=2)=>x==null?'—':(x*100).toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d})+'%';
 const signed=x=>x==null?'—':(x>0?'+':'')+pct(x);
 const date=x=>x?x.split('-').reverse().join('/'):'—';
 const cls=x=>x==null?'neutral':x>0?'positive':x<0?'negative':'neutral';
 const ma=c=>c.ma==='SWING_LOW'?'SPY sweep swing low':`MA${c.ma.slice(1)} ${c.ma[0]==='D'?'Daily':'Weekly'}`;
 const band=c=>c.width_atr==null?'Đáy đã xác nhận':c.width_atr===0?'Chạm đúng đường':`±${String(c.width_atr).replace('.',',')} ATR`;
 const metric=(c,m=state.method)=>c.methods[m].all;
 const pf=(c,m=state.method)=>{const x=metric(c,m),v=x.pf;return `<button class="pf ${v==null?'na':v>=3?'purple':v>=2?'green':v<1?'red':''} ${x.n<20?'low':''}" data-detail="${c.id}" data-method="${m}" aria-label="Chi tiết ${esc(D.methods[m])}, ${esc(ma(c))}, ${band(c)}, ${entries[c.confirmation]}, giữ ${c.hold} phiên">${num(v)}</button>`;};
 const add=(id,items)=>{for(const [value,label] of items){const o=document.createElement('option');o.value=value;o.textContent=label;$(id).append(o);}};
 add('method',Object.entries(D.methods));add('entry',Object.entries(entries));
 $('sessions').textContent=D.sessions.toLocaleString('vi-VN');$('date-range').textContent=`${date(D.start)} → ${date(D.end)}`;
 function columns(){return [
  {key:'setup',label:'Setup SPY',get:c=>ma(c)+' '+band(c)+' '+entries[c.confirmation]},
  {key:'hold',label:'Giữ',get:c=>c.hold},{key:'n',label:'Số rổ',get:c=>metric(c).n},
  {key:'pf',label:'Profit factor',get:c=>metric(c).pf},
  {key:'bottom',label:'Top bottom hồi nhanh',get:c=>metric(c,'BR3').pf},
  {key:'sector',label:'Top 3 sector · PF',get:c=>metric(c,'XL20').pf},
  {key:'parent',label:'Sector → nhánh · PF',get:c=>metric(c,'Parent').pf},
  {key:'wr',label:'Win rate',get:c=>metric(c).wr},{key:'avg',label:'TB / rổ',get:c=>metric(c).avg},
  {key:'excess',label:'Hơn sector / rổ',get:c=>c.methods[state.method].paired?.avg_excess_XL20??(state.method==='XL20'?0:null)},
  {key:'cost',label:'PF phí 0,30%',get:c=>c.methods[state.method].cost.pf},
  {key:'drop',label:'PF bỏ 3 rổ tốt nhất',get:c=>c.methods[state.method].drop.pf},
  {key:'worst',label:'Rổ thua tệ nhất',get:c=>metric(c).worst},
 ];}
 function isSummary(c){return c.ma==='SWING_LOW'||(c.ma[0]==='D'&&c.width_atr===0&&c.confirmation==='hold')||(c.ma[0]==='W'&&c.width_atr===.5&&c.confirmation==='hold');}
 function render(){
  state.method=$('method').value;state.hold=Number($('hold').value);
  const q=$('search').value.toLowerCase().trim(),entry=$('entry').value,minN=Math.max(0,Number($('min-n').value)||0),cols=columns();
  filtered=D.configs.filter(c=>c.hold===state.hold&&(state.mode!=='summary'||isSummary(c))&&(state.scope==='all'||(state.scope==='SWING_LOW'?c.ma==='SWING_LOW':c.ma.startsWith(state.scope)))&&(!entry||c.confirmation===entry)&&metric(c).n>=minN&&(!q||(ma(c)+' '+band(c)+' '+entries[c.confirmation]).toLowerCase().includes(q)));
  const col=cols.find(c=>c.key===state.key),collator=new Intl.Collator('vi',{numeric:true});
  filtered.sort((a,b)=>{const x=col.get(a),y=col.get(b);if(x==null)return y==null?0:1;if(y==null)return-1;return (typeof x==='string'?collator.compare(x,y):x-y)*(state.desc?-1:1);});
  $('head').innerHTML=cols.map(c=>`<th scope="col" aria-sort="${state.key===c.key?(state.desc?'descending':'ascending'):'none'}"><button data-sort="${c.key}">${c.label}<span class="sort">${state.key===c.key?(state.desc?'↓':'↑'):'↕'}</span></button></th>`).join('');
  $('body').innerHTML=filtered.map(c=>{const m=metric(c),diff=c.methods[state.method].paired?.avg_excess_XL20??(state.method==='XL20'?0:null);return `<tr data-row="${c.id}"><td><b>${ma(c)}</b><small>${band(c)} · ${entries[c.confirmation]}</small></td><td>${c.hold} phiên</td><td><b>${m.n}</b><small class="${m.n<20?'sample':''}">${m.n<20?'Ít mẫu':'rổ giao dịch'}</small></td><td>${pf(c)}<small>${esc(D.methods[state.method])}</small></td><td>${pf(c,'BR3')}<small>Chưa bắt buộc vượt SPY</small></td><td>${pf(c,'XL20')}<small>Cùng ${m.n} tín hiệu</small></td><td>${pf(c,'Parent')}<small>Có thể giữ ETF sector</small></td><td>${pct(m.wr,1)}</td><td class="${cls(m.avg)}">${signed(m.avg)}</td><td class="${cls(diff)}">${diff==null?'—':(diff>0?'+':'')+(diff*100).toLocaleString('vi-VN',{maximumFractionDigits:2,minimumFractionDigits:2})+' đ.%'}</td><td>${num(c.methods[state.method].cost.pf)}</td><td>${num(c.methods[state.method].drop.pf)}</td><td class="${cls(m.worst)}">${signed(m.worst)}</td></tr>`;}).join('')||'<tr><td colspan="13" class="empty">Không có cấu hình khớp bộ lọc. Anh giảm số rổ tối thiểu hoặc chuyển sang Toàn bộ.</td></tr>';
  $('context').textContent=`${D.methods[state.method]} · giữ ${state.hold} phiên · mua open hôm sau, bán close phiên số ${state.hold}`;
  $('rule').textContent=rules[state.method];$('count').textContent=`${filtered.length} dòng · ${state.mode==='summary'?'Preset cố định, không chọn theo PF':'Toàn bộ setup phù hợp'}`;
  $('summary').classList.toggle('active',state.mode==='summary');$('all').classList.toggle('active',state.mode==='all');$('summary').setAttribute('aria-pressed',String(state.mode==='summary'));$('all').setAttribute('aria-pressed',String(state.mode==='all'));
  document.querySelectorAll('[data-scope]').forEach(b=>b.classList.toggle('active',b.dataset.scope===state.scope));
  requestAnimationFrame(syncWidth);
 }
 function syncWidth(){$('scroll-width').style.width=$('table-scroll').scrollWidth+'px';$('bottom-scroll').scrollLeft=$('table-scroll').scrollLeft;}
 $('head').addEventListener('click',e=>{const b=e.target.closest('[data-sort]');if(!b)return;const k=b.dataset.sort;if(k===state.key)state.desc=!state.desc;else{state.key=k;state.desc=k!=='setup';}render();});
 $('body').addEventListener('click',e=>{const b=e.target.closest('[data-detail]');if(b)detail(Number(b.dataset.detail),b.dataset.method);});
 for(const id of ['method','hold','entry','search','min-n'])$(id).addEventListener('input',render);
 $('summary').onclick=()=>{state.mode='summary';render();};$('all').onclick=()=>{state.mode='all';render();};
 document.querySelectorAll('[data-scope]').forEach(b=>b.onclick=()=>{state.scope=b.dataset.scope;render();});
 $('table-scroll').addEventListener('scroll',()=>{$('bottom-scroll').scrollLeft=$('table-scroll').scrollLeft;});
 $('bottom-scroll').addEventListener('scroll',()=>{$('table-scroll').scrollLeft=$('bottom-scroll').scrollLeft;});
 window.addEventListener('resize',syncWidth);
 function expandBoard(on){$('board').classList.toggle('expanded',on);document.body.style.overflow=on?'hidden':'';$('fullscreen').setAttribute('aria-label',on?'Thoát toàn màn hình bảng':'Toàn màn hình bảng');syncWidth();}
 $('fullscreen').onclick=async()=>{const on=!$('board').classList.contains('expanded');expandBoard(on);try{if(on&&!document.fullscreenElement)await $('board').requestFullscreen();else if(!on&&document.fullscreenElement)await document.exitFullscreen();}catch{/* The expanded page view remains available without browser fullscreen. */}};
 document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)expandBoard(false);});
 function entryRule(c){
  if(c.ma==='SWING_LOW')return c.confirmation==='sweep_close'?'SPY xuyên swing low đã xác nhận rồi đóng lại trên đáy. Mua open phiên kế tiếp.':'Sau nến sweep, ngay phiên kế tiếp phải close vượt high nến sweep. Mua open sau phiên xác nhận.';
  if(c.confirmation==='touch')return 'SPY từ trên đi xuống chạm đường/vùng, sau ba phiên chưa chạm. Mua open phiên kế tiếp, không bắt buộc close hồi lại trên MA.';
  if(c.confirmation==='hold')return 'Ngày SPY chạm vùng cần close ≥ tâm MA. Mua open phiên kế tiếp.';
  return 'Sau chạm vùng, chờ lần đầu SPY close ≥ tâm MA trong ngày chạm hoặc tối đa năm phiên sau. Mua open ngay sau phiên lấy lại MA.';
 }
 function chart(c,method){
  const keys=[...new Set([method,'XL20','SPY'])],colors=['#45d99a','#74aaff','#c084fc'];
  if(!c.calendar.length)return '<p>Không có giao dịch hoàn tất trong mẫu.</p>';
  const lines=keys.map(k=>{let eq=1;return [0,...c.logs[k].map(t=>(eq*=1+t[1]-.001)-1)];});
  const vals=lines.flat(),lo=Math.min(0,...vals),hi=Math.max(.01,...vals),pad=(hi-lo)*.1,min=lo-pad,max=hi+pad;
  const x=i=>50+i/(lines[0].length-1)*850,y=v=>205-(v-min)/(max-min)*175;
  let html='<svg viewBox="0 0 940 255" role="img" aria-label="Lợi nhuận lũy kế tại lúc đóng rổ">';
  for(let i=0;i<=4;i++){const v=min+(max-min)*i/4;html+=`<line x1="50" x2="900" y1="${y(v)}" y2="${y(v)}" stroke="#2b3746" stroke-dasharray="4 5"/><text x="45" y="${y(v)+4}" fill="#91a1b4" text-anchor="end" font-size="10">${pct(v,0)}</text>`;}
  lines.forEach((line,i)=>html+=`<polyline fill="none" stroke="${colors[i]}" stroke-width="2" points="${line.map((v,j)=>x(j)+','+y(v)).join(' ')}"/>`);
  html+=`<text x="50" y="228" fill="#91a1b4" font-size="11">Trước rổ đầu</text><text x="900" y="228" fill="#91a1b4" text-anchor="end" font-size="11">${date(c.calendar.at(-1)[3])} · ${c.calendar.length} rổ</text></svg>`;
  html+=`<p>${keys.map((k,i)=>`<span style="color:${colors[i]};margin-right:18px">● ${esc(D.methods[k])}</span>`).join('')}</p>`;return html;
 }
 function detail(id,method){
  const c=D.configs.find(c=>c.id===id);if(!c)return;
  const m=c.methods[method],a=m.all,peers=D.configs.filter(r=>r.ma===c.ma&&r.width_atr===c.width_atr&&r.confirmation===c.confirmation);
  lastFocus=document.activeElement;
  $('detail-content').innerHTML=`<h2 class="detail-title">${ma(c)}</h2><p class="detail-sub">${band(c)} · ${entries[c.confirmation]} · giữ ${c.hold} phiên<br>${esc(D.methods[method])} · #${c.id}</p><div class="detail-stats"><article><small>PROFIT FACTOR</small><b>${num(a.pf)}</b></article><article><small>SỐ RỔ</small><b>${a.n}</b></article><article><small>WIN RATE</small><b>${pct(a.wr,1)}</b></article><article><small>TB / RỔ SAU PHÍ</small><b class="${cls(a.avg)}">${signed(a.avg)}</b></article></div>${a.n<20?'<div class="notice">Ít hơn 20 rổ. Không xem PF hoặc win rate này là xác suất đáng tin cho lệnh tiếp theo.</div>':''}<section class="detail-block"><h3>Quy tắc của dòng này</h3><p>${entryRule(c)}</p><p>${esc(rules[method])}</p><p>Chia đều vốn đầu vào. Giữ nguyên mã đến close phiên ${c.hold}; không stop, không chồng thêm rổ.</p>${['Rmix','Cmix','R3each'].includes(method)?`<p><b class="positive">${a.qualified}/${a.n} rổ thực sự có ít nhất một mã bottom đạt điều kiện.</b> Các rổ còn lại là leader; kết quả tổng không phải hiệu quả của riêng bottom.</p>`:method==='Parent'?`<p>${a.qualified}/${a.n} rổ có thay ít nhất một ETF sector bằng nhánh con.</p>`:''}</section><section class="detail-block"><h3>Cùng setup · Cùng kỳ giữ</h3><div class="table-scroll"><table><thead><tr><th>Cách chọn</th><th>Rổ</th><th>PF</th><th>Win rate</th><th>TB / rổ</th><th>Hơn Top 3 sector</th><th>Rổ có thay mã*</th></tr></thead><tbody>${Object.keys(D.methods).map(k=>{const x=c.methods[k],v=x.all;return `<tr class="${k===method?'current':''}"><td><button data-show="${k}">${esc(D.methods[k])}</button></td><td>${v.n}</td><td>${num(v.pf)}</td><td>${pct(v.wr,1)}</td><td class="${cls(v.avg)}">${signed(v.avg)}</td><td>${x.paired?signed(x.paired.avg_excess_XL20):'—'}</td><td>${['Rmix','Cmix','R3each','Parent'].includes(k)?v.qualified:'—'}</td></tr>`;}).join('')}</tbody></table></div><p>*Rổ có bottom đạt điều kiện, hoặc có thay sector bằng nhánh con. Các phương pháp dùng cùng lịch giao dịch; các số chênh lệch là điểm phần trăm.</p></section><section class="detail-block"><h3>So sánh 5 / 10 / 20 phiên · Cùng công thức</h3><div class="table-scroll"><table><thead><tr><th>Giữ</th><th>Rổ</th><th>PF</th><th>Win rate</th><th>TB / rổ</th><th>Thua tệ nhất</th></tr></thead><tbody>${peers.map(p=>{const v=p.methods[method].all;return `<tr class="${p.hold===c.hold?'current':''}"><td><button data-config="${p.id}" data-m="${method}">${p.hold} phiên</button></td><td>${v.n}</td><td>${num(v.pf)}</td><td>${pct(v.wr,1)}</td><td>${signed(v.avg)}</td><td>${signed(v.worst)}</td></tr>`;}).join('')}</tbody></table></div><p>Mỗi kỳ giữ chạy lịch riêng, bỏ tín hiệu khi còn vị thế. Số rổ và ngày vào giữa các kỳ có thể khác nhau.</p></section><section class="detail-block"><h3>Lũy kế tại thời điểm đóng rổ</h3><div class="chart-wrap">${chart(c,method)}</div><p>Không phải đường equity mark-to-market hàng ngày; không thể hiện đầy đủ sụt giảm trong lúc giữ. Thời gian giữa các rổ giả định tiền mặt không sinh lãi.</p></section><section class="detail-block"><h3>Giai đoạn & độ bền</h3><table><thead><tr><th>Năm tín hiệu</th><th>Rổ</th><th>PF</th><th>TB / rổ</th></tr></thead><tbody>${Object.entries(m.years).map(([y,v])=>`<tr><td>${y}${y==='2023'||y==='2026'?' · một phần năm':''}</td><td>${v.n}</td><td>${num(v.pf)}</td><td>${signed(v.avg)}</td></tr>`).join('')}</tbody></table><p>PF khi phí 0,30%: <b>${num(m.cost.pf)}</b> · PF bỏ ba rổ tốt nhất: <b>${num(m.drop.pf)}</b><br>Rổ thua tệ nhất: <b>${signed(a.worst)}</b> · Drawdown khi đóng rổ: <b>${signed(a.closed_dd)}</b><br>Khoảng Wilson 95% cho win rate: ${pct(a.wr_low,1)}–${pct(a.wr_high,1)} (chưa điều chỉnh phụ thuộc giữa các giao dịch hoặc việc thử nhiều cấu hình).</p><p>Các năm là phân đoạn mô tả, không phải holdout độc lập. Lỗ lớn nhất lịch sử không giới hạn lỗ tương lai.</p></section><section class="detail-block"><h3>Nhật ký ${a.n} rổ · ${date(c.samples[method].first)} → ${date(c.samples[method].last)}</h3><div class="table-scroll"><table><thead><tr><th>Tín hiệu</th><th>Mua open</th><th>Bán close</th><th>ETF</th><th>Sau phí</th><th>SPY</th><th>Mã đủ điều kiện</th></tr></thead><tbody>${c.calendar.map((cal,i)=>{const t=c.logs[method][i];return `<tr><td>${date(cal[1])}</td><td>${date(cal[2])}</td><td>${date(cal[3])}</td><td>${esc(t[0].replaceAll('|',' · '))}</td><td class="${cls(t[1]-.001)}">${signed(t[1]-.001)}</td><td>${signed(cal[4])}</td><td>${t[3]}</td></tr>`;}).join('')}</tbody></table></div><p>Giá nguồn, lựa chọn ETF và lợi nhuận đầy đủ có trong gói CSV backtest.</p></section>`;
  $('detail-content').querySelectorAll('[data-show]').forEach(b=>b.onclick=()=>detail(c.id,b.dataset.show));
  $('detail-content').querySelectorAll('[data-config]').forEach(b=>b.onclick=()=>detail(Number(b.dataset.config),b.dataset.m));
  if(!$('detail').open)$('detail').showModal();$('detail').scrollTop=0;
 }
 $('close').onclick=()=>$('detail').close();$('detail').addEventListener('close',()=>lastFocus?.focus());
 $('export').onclick=()=>{const columns=['setup','band','entry_rule','hold','method','n','pf','win_rate','avg_net','bottom_pf','sector_pf','hybrid_pf','avg_excess_sector','pf_cost030','pf_drop3'];const lines=[columns,...filtered.map(c=>{const m=metric(c);return [ma(c),band(c),entries[c.confirmation],c.hold,D.methods[state.method],m.n,m.pf,m.wr,m.avg,metric(c,'BR3').pf,metric(c,'XL20').pf,metric(c,'Parent').pf,c.methods[state.method].paired?.avg_excess_XL20,c.methods[state.method].cost.pf,c.methods[state.method].drop.pf];})];const text='\uFEFF'+lines.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='subsector-filtered.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 $('universe').innerHTML=D.universe.map(u=>`<tr><td><a href="https://www.tradingview.com/symbols/${esc(u.tv.replace(':','-'))}/" target="_blank" rel="noopener">${u.symbol} ↗</a></td><td>${esc(u.name)}</td><td>${u.parent}</td><td>${esc(u.family)}</td><td>${u.eligible_sessions}/${u.total_sessions}<small>${pct(u.eligible_fraction,1)}</small></td></tr>`).join('');
 render();
})();
