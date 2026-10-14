import {load,get,save,exportJSON,importJSON,reset} from './modules/storage.js';
import * as kanji from './modules/kanji.js';
import {vocabIndex,vocabFlash,vocabQuizMenu,vocabCounts} from './modules/vocab.js';
import {grammarIndex,grammarQuizMenu,grammarQs} from './modules/grammar.js';
import {esc,pct,bar} from './modules/ui.js';
load();
const routes=[['#/','Dashboard'],['#/kanji','Kanji 1–320'],['#/kanji-quiz','Kanji quizzes'],['#/vocab','Vocabulary'],['#/grammar','Grammar & Particles'],['#/settings','Settings']];
const nav=document.getElementById('nav'),main=document.getElementById('main');
function dashboard(){const c=kanji.counts(),s=get(),r=s.results.slice(-5).reverse();
 const today=new Date().toISOString().slice(0,10);const days=[...Array(7)].map((_,i)=>{const d=new Date(Date.now()-(6-i)*864e5).toISOString().slice(0,10);return{d,n:s.log.filter(x=>x.d===d).length}});const mx=Math.max(1,...days.map(x=>x.n));
 const vc=vocabCounts();const gr=Object.values(s.grammar||{}).reduce((a,x)=>[a[0]+x.right,a[1]+x.wrong],[0,0]);const answered=c.right+c.wrong;const nx=kanji.nextSuggested();
 main.innerHTML=`<h2>${s.settings.name?'Welcome, '+esc(s.settings.name):'MINNA N5'}</h2><p><i>Study Japanese. Practise every day. Be exam-ready.</i></p>
 <div class="stats"><div class="card stat"><b>${c.studied} / 320</b>kanji studied${bar(pct(c.studied,320))}</div><div class="card stat"><b>${c.mastered}</b>kanji mastered</div><div class="card stat"><b>${c.revision}</b>need revision</div><div class="card stat"><b>${answered}</b>questions answered</div><div class="card stat"><b>${pct(c.right,answered)}%</b>kanji accuracy</div><div class="card stat"><b>${vc.learned} / ${vc.total}</b>vocabulary learned${bar(pct(vc.learned,vc.total))}</div><div class="card stat"><b>${pct(gr[0],gr[0]+gr[1])}%</b>grammar accuracy (${gr[0]+gr[1]} answered)</div></div>
 <div class="card"><h3>This week (questions per day)</h3><div class="row" style="align-items:flex-end;height:110px">${days.map(x=>`<div style="flex:1;text-align:center"><div style="background:var(--purple);height:${Math.round(80*x.n/mx)}px;border-radius:4px 4px 0 0" title="${x.n}"></div><small>${x.d.slice(5)}<br>${x.n}</small></div>`).join('')}</div></div>
 <div class="card"><h3>Suggested next</h3><p><a class="btn" href="#/kanji/${nx}">Kanji ${nx}</a> <a class="btn alt" href="#/kanji-quiz">Take a quiz</a></p></div>
 <div class="card"><h3>Latest scores</h3>${r.length?r.map(x=>`<p>${esc(x.title)}: <b>${x.score}/${x.total}</b> <span class="muted">${x.d.slice(0,10)}</span></p>`).join(''):'<p class="muted">No quizzes taken yet.</p>'}</div>
 <p class="warn">Work in progress: built so far are Kanji 1–320, Vocabulary and Grammar &amp; Particles. Full lesson pages, kana, reading, listening, mock exams and the study plan are not built yet.</p>`;}
function settings(){const s=get().settings;
 main.innerHTML=`<h2>Settings</h2><div class="card"><div class="row"><label>Display name <input id="nm" value="${esc(s.name)}"></label><label>Daily goal (questions) <input id="gl" type="number" min="1" value="${s.goal}" style="width:80px"></label><label>Target exam date <input id="ex" type="date" value="${esc(s.exam)}"></label></div><button id="sv">Save</button></div>
 <div class="card"><h3>Your data</h3><p class="muted">Progress is stored in this browser's LocalStorage only. It does not sync between devices — use export/import to move it.</p>
 <div class="row"><button id="exp">Export progress</button><label class="btn alt">Import progress<input id="imp" type="file" accept="application/json" hidden></label><button class="danger" id="rs">Reset all progress</button></div><p id="m" aria-live="polite"></p></div>`;
 const $=q=>main.querySelector(q);
 $('#sv').onclick=()=>{s.name=$('#nm').value.trim();s.goal=Math.max(1,+$('#gl').value||20);s.exam=$('#ex').value;save();$('#m').textContent='Saved.'};
 $('#exp').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([exportJSON()],{type:'application/json'}));a.download='minna-n5-progress.json';a.click()};
 $('#imp').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const t=await f.text();JSON.parse(t);if(confirm('Replace current progress with this file?')){importJSON(t);$('#m').textContent='Imported.'}}catch(err){$('#m').textContent='Import failed: '+err.message}};
 $('#rs').onclick=()=>{if(confirm('Delete ALL progress? This cannot be undone.')){reset();$('#m').textContent='Progress reset.'}};}
function render(){const h=location.hash||'#/';const p=h.split('/');
 nav.innerHTML=`<h1>MINNA N5</h1><p>Study Japanese. Practise every day.</p>`+routes.map(r=>`<a href="${r[0]}" class="${h===r[0]||(r[0]==='#/kanji'&&/^#\/kanji(\/|-flash)/.test(h))?'on':''}">${r[1]}</a>`).join('');
 nav.classList.remove('open');
 if(h==='#/'||h==='#')dashboard();else if(h==='#/kanji')kanji.index(main);else if(p[1]==='kanji'&&p[2])kanji.detail(main,p[2]);
 else if(p[1]==='kanji-flash')kanji.flash(main,p[2],p[3]);else if(h==='#/kanji-quiz')kanji.quizMenu(main);else if(h==='#/vocab')vocabIndex(main);else if(p[1]==='vocab-flash')vocabFlash(main,p[2]);else if(h==='#/vocab-quiz')vocabQuizMenu(main);else if(p[1]==='grammar'&&!p[2])grammarIndex(main);else if(p[1]==='grammar'&&p[2])grammarIndex(main,p[2]);else if(h==='#/grammar-quiz')grammarQuizMenu(main);else if(h==='#/settings')settings();else dashboard();
 main.focus({preventScroll:true});scrollTo(0,0)}
addEventListener('hashchange',render);
document.getElementById('menuBtn').onclick=e=>{const o=nav.classList.toggle('open');e.target.setAttribute('aria-expanded',o)};
render();
