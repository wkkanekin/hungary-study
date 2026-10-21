
'use strict';
(()=>{const q=document.getElementById('directorySearch');if(q){q.addEventListener('input',()=>{let n=0;document.querySelectorAll('#directoryList .directoryItem').forEach(c=>{c.hidden=!c.textContent.toLowerCase().includes(q.value.trim().toLowerCase());if(!c.hidden)n++});document.getElementById('directoryCount').textContent=n+'大学';});}
const search=document.getElementById('rankSearch'),order=document.getElementById('rankOrder');if(search){const body=document.querySelector('#overallRanks tbody'),rows=[...body.rows];const apply=()=>{const idx={qs:2,the:3,arwu:4}[order.value];rows.sort((a,b)=>(parseInt(a.cells[idx].textContent.replace(/,/g,''))||99999)-(parseInt(b.cells[idx].textContent.replace(/,/g,''))||99999));for(const r of rows){r.hidden=!r.textContent.toLowerCase().includes(search.value.trim().toLowerCase());body.append(r)}};search.addEventListener('input',apply);order.addEventListener('change',apply);}
const sub=document.getElementById('subjectSearch');if(sub)sub.addEventListener('input',()=>document.querySelectorAll('#subjectRanks tbody tr').forEach(r=>r.hidden=!r.textContent.toLowerCase().includes(sub.value.trim().toLowerCase())));
})();
