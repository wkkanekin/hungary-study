(()=>{
 const root=document.getElementById('hsl-everyday');
 if(!root)return;
 const stores=Array.from(root.querySelectorAll('#ep-stores button'));
 const tabs=[root.querySelector('#ep-food-tab'),root.querySelector('#ep-daily-tab')];
 let selectedStore='ALDI Süd',active=0;
 function update(){
  stores.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.store===selectedStore)));
  tabs.forEach((b,i)=>{
   const panel=root.querySelector('#'+b.getAttribute('aria-controls'));
   let count=0;
   panel.querySelectorAll('.ep-row').forEach(row=>{row.hidden=row.dataset.store!==selectedStore;if(!row.hidden)count++;});
   panel.hidden=i!==active;
   panel.querySelector('.ep-empty').hidden=count!==0;
   b.setAttribute('aria-selected',String(i===active));
   b.setAttribute('tabindex',i===active?'0':'-1');
   b.textContent=(i===0?'食品':'日用品')+' '+count+'品';
   if(i===active)root.querySelector('#ep-count').textContent=selectedStore+'｜'+(i===0?'食品':'日用品')+' '+count+'品｜2026/10/16 確認';
  });
 }
 stores.forEach(b=>b.addEventListener('click',()=>{selectedStore=b.dataset.store;update();}));
 tabs.forEach((b,i)=>{b.addEventListener('click',()=>{active=i;update();});b.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();tabs[1-i].click();tabs[1-i].focus();}});});
 update();
})();
