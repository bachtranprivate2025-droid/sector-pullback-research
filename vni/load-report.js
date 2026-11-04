'use strict';
(() => {
  const full=new URLSearchParams(location.search).get('sample')==='full';
  const selected=full?'full':'ten-year';
  document.querySelectorAll('[data-sample]').forEach(a=>{
    const active=a.dataset.sample===selected;a.classList.toggle('active',active);
    if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  });
  const fail=()=>{document.querySelector('#result-count').textContent='Chưa tải được bộ dữ liệu. Anh tải lại trang hoặc chọn bộ còn lại.';document.querySelector('#sample-note').textContent='Tải dữ liệu chưa hoàn tất; chưa hiển thị kết quả backtest.';};
  const data=document.createElement('script');data.src=full?'data-full.js?v=1':'data-ten-year.js?v=1';
  data.onerror=fail;data.onload=()=>{const app=document.createElement('script');app.src='app.js?v=2';app.onerror=fail;document.head.append(app);};
  document.head.append(data);
})();
