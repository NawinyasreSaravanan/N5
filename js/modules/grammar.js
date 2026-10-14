import {esc,shuffle} from './ui.js';
import {gstat,save} from './storage.js';
import {runQuiz} from './quiz-engine.js';
export const GRAMMAR=MINNA_GRAMMAR;
const gkey=g=>g.l+':'+g.p;
const title=l=>l===0?'Particles at a glance':`Lesson ${l}`;
export function grammarIndex(root,lesson){
 lesson=lesson||'all';const nLessons=[...new Set(GRAMMAR.map(g=>g.l))].sort((a,b)=>a-b);
 const list=GRAMMAR.filter(g=>lesson==='all'||String(g.l)===String(lesson));
 root.innerHTML=`<h2>Grammar &amp; Particles (Minna no Nihongo I)</h2><p class="muted">${GRAMMAR.filter(g=>!g.particle).length} grammar patterns across Lessons 1–25 plus ${GRAMMAR.filter(g=>g.particle).length} core particles. Explanations and examples are original, written for this app (not copied from the textbook). Lessons with fewer patterns (such as 15, 20, 22–25) still need expanding.</p>
 <div class="card"><div class="row"><select id="l" aria-label="Lesson"><option value="all">All lessons</option>${nLessons.map(l=>`<option value="${l}"${String(lesson)===String(l)?' selected':''}>${title(l)}</option>`).join('')}</select><a class="btn" href="#/grammar-quiz">Practice questions</a><span class="muted">${list.length} shown</span></div></div>`+
 list.map(g=>{const s=gstat(gkey(g));return`<details class="card"><summary><b>${esc(g.p)}</b> <span class="tag">${title(g.l)}</span> — ${esc(g.m)}</summary>
  <p><b>Formation:</b> ${esc(g.f)}</p><p>${esc(g.e)}</p><table>${g.x.map(x=>`<tr><td>${esc(x[0])}</td><td>${esc(x[1])}</td><td>${esc(x[2])}</td></tr>`).join('')}</table>${g.n?`<p class="warn">${esc(g.n)}</p>`:''}${g.d.length?`<p class="muted">Practice: ${g.d.length} question(s) · ${s.right} right / ${s.wrong} wrong</p>`:''}</details>`}).join('');
 root.querySelector('#l').onchange=e=>{location.hash='#/grammar/'+e.target.value};
}
export function grammarQs(lesson,count){
 const items=[];for(const g of GRAMMAR)if(lesson==='all'||String(g.l)===String(lesson))for(const d of g.d)items.push({g,d});
 return shuffle(items).slice(0,count).map(({g,d})=>{const wrong=[...new Set(d[2])].filter(x=>x!==d[1]);return{prompt:d[0],options:[d[1],...wrong],answer:d[1],explain:`${d[3]} (${g.p})`,rec:ok=>{const s=gstat(gkey(g));ok?s.right++:s.wrong++;s.last=new Date().toISOString()}}})}
export function grammarQuizMenu(root){
 const nLessons=[...new Set(GRAMMAR.filter(g=>g.d.length).map(g=>g.l))].sort((a,b)=>a-b);
 root.innerHTML=`<h2>Grammar &amp; particle practice</h2><div class="card"><div class="row"><label>Scope <select id="l"><option value="all">All lessons</option>${nLessons.map(l=>`<option value="${l}">${title(l)}</option>`).join('')}</select></label><label>Questions <select id="c"><option>10</option><option>25</option><option>50</option></select></label></div><button id="go">Start</button><p id="msg" class="warn" hidden></p></div><div id="qz"></div>`;
 root.querySelector('#go').onclick=()=>{const qs=grammarQs(root.querySelector('#l').value,+root.querySelector('#c').value);const m=root.querySelector('#msg');
  if(!qs.length){m.hidden=false;m.textContent='No questions for that scope.';return}m.hidden=qs.length>=+root.querySelector('#c').value;if(!m.hidden)m.textContent=`Only ${qs.length} questions available here; running those.`;
  runQuiz(root.querySelector('#qz'),qs,{title:'Grammar practice',back:'#/grammar',backLabel:'Back to grammar'});root.querySelector('#qz').scrollIntoView()};
}
