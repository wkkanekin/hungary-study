/* DOM adapter executes the production event handlers; no browser rendering claims. */
const fs=require('fs'),vm=require('vm'),assert=require('assert');const fixture=JSON.parse(fs.readFileSync(0,'utf8')), nodes={};
class Element{
 constructor(value=''){this.value=value;this.hidden=false;this.disabled=false;this.events={};this.options=[];this.dataset={};}
 addEventListener(type,cb){this.events[type]=cb}get selectedOptions(){return [this.options.find(o=>o.value===this.value)||this.options[0]]}get value(){return this._value}set value(v){this._value=v}
}
for(const id of ['search','category','state','city','reset','overallProvider','overallSort','subjectProvider','discipline','subjectSort','overallCount','subjectCount','overallEmpty','subjectEmpty'])nodes[id]=new Element();
for(const [id,values] of Object.entries({state:['',...fixture.states],city:['',...fixture.cities],discipline:['',...fixture.disciplines]}))nodes[id].options=values.map(v=>new Element(v));
for(const id of ['overallSort','subjectSort'])nodes[id].value='asc';nodes.subjectProvider.value='QS';
function makeRow(x){const r=new Element();r.dataset=x.dataset;r.cells=x.cells.map(c=>Object.assign(new Element(),{dataset:c}));r.querySelector=q=>r.cells.find(c=>q.includes('"'+c.dataset.provider+'"'));return r;}
const tables={};for(const [id,rs] of Object.entries(fixture.rows)){const body={rows:rs.map(makeRow),append(frag){this.rows=frag.rows}};tables[id]={tBodies:[body],headers:['QS','THE','ARWU'].map(p=>Object.assign(new Element(),{dataset:{provider:p}})),querySelectorAll(){return [...this.headers,...this.tBodies[0].rows.flatMap(r=>r.cells)]}};nodes[id]=tables[id]}
const document={getElementById:id=>nodes[id],createDocumentFragment:()=>({rows:[],append(r){this.rows.push(r)}})};
vm.runInNewContext(fs.readFileSync('germany/ranking-comparison.js','utf8'),{document});
const visible=id=>tables[id].tBodies[0].rows.filter(r=>!r.hidden);const act=(id,value,event='input')=>{nodes[id].value=value;nodes[id].events[event]()};const reset=()=>nodes.reset.events.click();
assert.equal(visible('overallTable').length,77);assert(visible('subjectTable').every(r=>r.dataset.publisher==='QS'));assert.equal(visible('overallTable')[0].dataset.university,'tum');
act('search','ミュンヘン工科');assert.deepEqual(visible('overallTable').map(r=>r.dataset.university),['tum']);assert(visible('subjectTable').length>5);
act('search','Göttingen');assert.equal(visible('overallTable').length,1);act('search','Gottingen');assert.equal(visible('overallTable').length,1);reset();
act('state','Bayern');assert(visible('overallTable').length>5);assert(visible('overallTable').every(r=>r.dataset.state==='Bayern'));act('city','München');assert(visible('overallTable').length>=2);act('state','Berlin');assert.equal(nodes.city.value,'');assert(visible('overallTable').every(r=>r.dataset.city==='Berlin'));reset();
act('category','architecture');assert.equal(visible('subjectTable').length,11);assert(visible('subjectTable').every(r=>r.dataset.subject==='Architecture & Built Environment'));act('subjectProvider','THE','change');assert.equal(visible('subjectTable').length,0);assert.equal(nodes.subjectEmpty.hidden,false);reset();
act('category','computing');act('discipline','Data Science & Artificial Intelligence','change');assert.equal(visible('subjectTable').length,6);assert.equal(visible('subjectTable')[0].dataset.university,'tum');reset();
act('overallProvider','ARWU','change');assert.equal(visible('overallTable')[0].dataset.university,'tum');assert(tables.overallTable.headers.find(h=>h.dataset.provider==='QS').hidden);act('overallSort','desc','change');assert(Number(visible('overallTable')[0].cells.find(c=>c.dataset.provider==='ARWU').dataset.rank)>=900);assert.equal(visible('overallTable').at(-1).cells.find(c=>c.dataset.provider==='ARWU').dataset.rank,'999999');reset();
act('search','xxxxx-does-not-exist');assert.equal(visible('overallTable').length,0);assert.equal(nodes.overallEmpty.hidden,false);reset();assert.equal(visible('overallTable').length,77);
console.log('PASS: production JS search, accented names, category, AI, city/state dependency, providers, sorting, empty states and reset');
