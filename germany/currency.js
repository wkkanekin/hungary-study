/* Append reference yen estimates to visible EUR amounts, including refreshed widgets. */
(() => {
  'use strict';
  const data=window.GERMANY_CONFIG?.currency;
  if (!data || !(data.rate>0)) return;
  const number='\\d[\\d,]*(?:\\.\\d+)?';
  const pattern=new RegExp('€\\s*('+number+')(?:\\s*([〜～–-])\\s*(?:€\\s*)?('+number+'))?|('+number+')(?:\\s*([〜～–-])\\s*('+number+'))?\\s*(ユーロ|EUR|€)','g');
  const yen=n=>{const value=Number(n.replaceAll(',',''))*data.rate,step=value>=1000?100:10;return (Math.round(value/step)*step).toLocaleString('ja-JP')};
  const convert=text=>text.replace(pattern,(full,a,b,c,d,e,f,unit,offset)=>{
    if (/^\s*[（(]約[^）)]*円/.test(text.slice(offset+full.length))) return full;
    return full+'（約'+yen(a||d)+((c||f)?'〜'+yen(c||f):'')+'円）';
  });
  function refresh() {
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    const changes=[];let n;
    while((n=walker.nextNode())) {
      if (!n.parentElement || n.parentElement.closest('script,style,textarea,input,select,code,#currency-reference,.leaflet-control-attribution')) continue;
      const text=n.nodeValue;if(!/€|ユーロ|EUR/.test(text))continue;
      const next=convert(text);if(next!==text)changes.push([n,next]);
    }
    changes.forEach(([n,value])=>n.nodeValue=value);
    if (changes.length && !document.getElementById('currency-reference')) {
      const p=document.createElement('p');p.id='currency-reference';p.className='currencyReference';
      p.append(document.createTextNode('円の目安：1ユーロ＝'+data.rate+'円（ECB・'+data.date+'）。10円または100円単位に丸めています。実際の決済・送金額は為替・手数料で変わります。 '));
      const a=document.createElement('a');a.href=data.source;a.textContent='参考レートの出典 ↗';a.target='_blank';a.rel='noopener noreferrer';p.append(a);
      (document.querySelector('main')||document.querySelector('.container')||document.body).append(p);
    }
  }
  refresh(); let queued=false;
  new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;refresh()})}).observe(document.body,{subtree:true,childList:true,characterData:true});
})();
