
'use strict';
(()=>{const q=document.getElementById('directorySearch');if(q){q.addEventListener('input',()=>{let n=0;document.querySelectorAll('#directoryList .directoryItem').forEach(c=>{c.hidden=!c.textContent.toLowerCase().includes(q.value.trim().toLowerCase());if(!c.hidden)n++});document.getElementById('directoryCount').textContent=n+'大学';});}
const search=document.getElementById('rankSearch'),order=document.getElementById('rankOrder');if(search){const body=document.querySelector('#overallRanks tbody'),rows=[...body.rows];const apply=()=>{const idx={qs:2,the:3,arwu:4}[order.value];rows.sort((a,b)=>(parseInt(a.cells[idx].textContent.replace(/,/g,''))||99999)-(parseInt(b.cells[idx].textContent.replace(/,/g,''))||99999));for(const r of rows){r.hidden=!r.textContent.toLowerCase().includes(search.value.trim().toLowerCase());body.append(r)}};search.addEventListener('input',apply);order.addEventListener('change',apply);}
const sub=document.getElementById('subjectSearch'),discipline=document.getElementById('discipline');
if(sub&&discipline){const rows=[...document.querySelectorAll('#subjectRanks tbody tr')],count=document.getElementById('subjectCount'),empty=document.getElementById('subjectEmpty');
 const apply=()=>{const query=sub.value.trim().toLocaleLowerCase(),selected=discipline.value;let visible=0;
  for(const row of rows){row.hidden=(selected&&row.dataset.discipline!==selected)||!row.textContent.toLocaleLowerCase().includes(query);if(!row.hidden)visible++;}
  count.textContent=visible+'件を表示';empty.hidden=visible!==0;
 };
 sub.addEventListener('input',apply);discipline.addEventListener('change',apply);apply();}
})();
