/* All verified rows are readable without JavaScript or a network fetch. */
(() => {
  'use strict';
  const normalize = (s) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  document.querySelectorAll('[data-ranking-overall]').forEach((root) => {
    const search=root.querySelector('[data-university-search]');
    const sort=root.querySelector('[data-ranking-sort]');
    const type=root.querySelector('[data-institution-type]');
    const status=root.querySelector('[data-ranking-status]');
    const tbody=root.querySelector('tbody');
    const rows=Array.from(root.querySelectorAll('[data-overall-row]'));
    const prev=root.querySelector('[data-page-prev]'),next=root.querySelector('[data-page-next]');
    const pageSize=15;let page=0;
    const apply=() => {
      const query=normalize(search.value);
      const sorted=sort.value==='default' ? rows : [...rows].sort((a,b)=> Number(a.dataset[sort.value])-Number(b.dataset[sort.value]));
      const matches=sorted.filter(row=>normalize(row.dataset.search).includes(query)&&(type.value==='all'||type.value===row.dataset.type)&&(status.value==='all'||row.dataset.ranked==='true'));
      const pages=Math.max(1,Math.ceil(matches.length/pageSize));page=Math.min(page,pages-1);
      rows.forEach(row=>row.hidden=true);
      matches.slice(page*pageSize,(page+1)*pageSize).forEach(row=>row.hidden=false);
      sorted.forEach(row=>tbody.appendChild(row));
      root.querySelector('[data-overall-count]').textContent=`${matches.length} / ${rows.length}校が該当（${matches.length? page*pageSize+1:0}〜${Math.min(matches.length,(page+1)*pageSize)}校目を表示）`;
      root.querySelector('[data-overall-empty]').hidden=matches.length>0;
      root.querySelector('[data-page-label]').textContent=`${page+1} / ${pages}ページ`;
      prev.disabled=page===0;next.disabled=page>=pages-1;
      root.querySelector('[data-pagination]').hidden=pages===1;
    };
    const resetPage=()=>{page=0;apply();};
    search.addEventListener('input',resetPage);
    [sort,type,status].forEach(el=>el.addEventListener('change',resetPage));
    root.querySelector('[data-reset]').addEventListener('click',()=>{search.value='';sort.value='default';type.value='all';status.value='all';resetPage();search.focus();});
    const navigate=(delta)=>{page+=delta;apply();root.querySelector('[data-overall-count]').scrollIntoView({block:'start'});};
    prev.addEventListener('click',()=>navigate(-1));next.addEventListener('click',()=>navigate(1));
    root.querySelector('[data-controls]').hidden=false;apply();
  });
  document.querySelectorAll('[data-ranking-subjects]').forEach(root=>{
    const category=root.querySelector('[data-subject-category]');
    const provider=root.querySelector('[data-subject-provider]');
    const university=root.querySelector('[data-subject-university]');
    const year=root.querySelector('[data-subject-year-filter]');
    const search=root.querySelector('[data-subject-search]');
    const rows=Array.from(root.querySelectorAll('[data-subject-row]'));
    const requestedUniversity = new URLSearchParams(window.location.search).get('university');
    if (requestedUniversity && Array.from(university.options).some(option => option.value === requestedUniversity)) {
      university.value = requestedUniversity;
    }
    const apply=()=>{
      let count=0;const query=normalize(search.value);
      rows.forEach(row=>{
        row.hidden=!(normalize(row.dataset.search).includes(query)&&(category.value==='all'||row.dataset.category===category.value)&&(provider.value==='all'||row.dataset.provider===provider.value)&&(university.value==='all'||row.dataset.university===university.value)&&(year.value==='all'||row.dataset.year===year.value));
        if(!row.hidden)count++;
      });
      root.querySelector('[data-subject-count]').textContent=`確認済み ${count}件（各行に版年を表示）`;
      root.querySelector('[data-subject-table]').hidden=count===0;
      root.querySelector('[data-subject-empty]').hidden=count>0||category.value==='tourism';
      root.querySelector('[data-tourism-note]').hidden=category.value!=='tourism';
    };
    [category,provider,university,year].forEach(el=>el.addEventListener('change',apply));
    search.addEventListener('input',apply);
    root.querySelector('[data-subject-reset]').addEventListener('click',()=>{[category,provider,university,year].forEach(el=>el.value='all');search.value='';apply();search.focus();});
    root.querySelector('[data-controls]').hidden=false;apply();
  });
})();

