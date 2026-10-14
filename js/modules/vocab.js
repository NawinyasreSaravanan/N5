import {esc,shuffle,pct,bar} from './ui.js';
import {vstat,save,get} from './storage.js';
import {runQuiz} from './quiz-engine.js';
// Build one record per word (words in several lessons are merged and list every lesson)
export const VOCAB=(()=>{const m=new Map();for(const L of MINNA_VOCAB)for(const line of L.w.trim().split('\n')){const [w,r,en,t]=line.split('|');const rd=r||w;const key=w+'|'+rd;let e=m.get(key);if(!e){e={key,w,r:rd,en:[],t,ls:[]};m.set(key,e)}if(!e.en.includes(en))e.en.push(en);if(!e.ls.includes(L.l))e.ls.push(L.l)}return [...m.values()].map(e=>({...e,meaning:e.en.join('; ')}))})();
export const VOCAB_ENTRIES=MINNA_VOCAB.reduce((a,L)=>a+L.w.trim().split('\n').length,0);
const TYPES={n:'noun',v:'verb',i:'i-adj',na:'na-adj',adv:'adverb',pron:'pronoun',ptcl:'particle',ph:'phrase',ctr:'counter',conj:'conjunction'};
const lessonOpts=sel=>`<option value="all">All lessons</option>`+MINNA_VOCAB.map(L=>`<option value="${L.l}"${String(sel)===String(L.l)?' selected':''}>Lesson ${L.l} – ${esc(L.t)}</option>`).join('');
const inLesson=(e,l)=>l==='all'||e.ls.includes(+l);
export const vocabCounts=()=>({total:VOCAB.length,learned:VOCAB.filter(e=>vstat(e.key).learned).length});
export function vocabIndex(root){
 const c=vocabCounts();
 root.innerHTML=`<h2>Vocabulary (Minna no Nihongo I, Lessons 1–25)</h2><p class="muted">${VOCAB.length} distinct words (${VOCAB_ENTRIES} lesson entries; words that appear in several lessons are merged). Word lists were written for this app and checked against the reference PDF's English glosses; a few may differ from your textbook edition.</p>
 <div class="card"><b>${c.learned} / ${c.total} learned</b>${bar(pct(c.learned,c.total))}</div>
 <div class="card"><div class="row"><input id="q" type="search" placeholder="Search Japanese or English" aria-label="Search" style="flex:1;min-width:200px"><select id="l" aria-label="Lesson">${lessonOpts('all')}</select>
 <select id="t" aria-label="Word type"><option value="">All types</option>${Object.entries(TYPES).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select>
 <select id="s" aria-label="Status"><option value="">All</option><option value="unlearned">Not learned</option><option value="learned">Learned</option><option value="bookmark">Bookmarked</option><option value="difficult">Difficult</option></select></div>
 <div class="row"><a class="btn" id="fl" href="#/vocab-flash/all">Flashcards</a><a class="btn" href="#/vocab-quiz">Vocabulary quizzes</a><span id="cnt" class="muted"></span></div></div><div class="card" style="overflow:auto"><table><thead><tr><th>Word</th><th>Reading</th><th>Meaning</th><th>Type</th><th>Lesson</th><th>Learned</th><th>★</th></tr></thead><tbody id="b"></tbody></table></div>`;
 const $=s=>root.querySelector(s);
 function draw(){const q=$('#q').value.trim().toLowerCase(),l=$('#l').value,t=$('#t').value,s=$('#s').value;
  const list=VOCAB.filter(e=>{const v=vstat(e.key);return inLesson(e,l)&&(!t||e.t===t)&&(!q||e.w.includes(q)||e.r.includes(q)||e.meaning.toLowerCase().includes(q))&&(!s||(s==='learned'?v.learned:s==='unlearned'?!v.learned:s==='bookmark'?v.bookmark:v.wrong>v.right))});
  $('#cnt').textContent=list.length+' shown';$('#fl').href='#/vocab-flash/'+l;
  $('#b').innerHTML=list.map(e=>{const v=vstat(e.key);return`<tr><td style="font-size:20px">${esc(e.w)}</td><td>${esc(e.r)}</td><td>${esc(e.meaning)}</td><td>${TYPES[e.t]||''}</td><td>${e.ls.join(', ')}</td><td><input type="checkbox" data-k="${esc(e.key)}" class="lr" aria-label="Learned"${v.learned?' checked':''}></td><td><button class="alt bk" data-k="${esc(e.key)}" aria-label="Bookmark">${v.bookmark?'★':'☆'}</button></td></tr>`}).join('')||'<tr><td colspan="7">No matches.</td></tr>'}
 ['#q','#l','#t','#s'].forEach(s=>$(s).addEventListener('input',draw));
 $('#b').addEventListener('change',e=>{if(e.target.classList.contains('lr')){vstat(e.target.dataset.k).learned=e.target.checked;save()}});
 $('#b').addEventListener('click',e=>{const b=e.target.closest('.bk');if(b){const v=vstat(b.dataset.k);v.bookmark=!v.bookmark;save();b.textContent=v.bookmark?'★':'☆'}});
 draw();
}
export function vocabFlash(root,lesson){
 lesson=lesson||'all';let list=VOCAB.filter(e=>inLesson(e,lesson)),i=0,show=false,enFirst=false;
 function d(){if(!list.length){root.innerHTML='<p>No words.</p><a class="btn" href="#/vocab">Back</a>';return}const e=list[i],v=vstat(e.key);
  const front=enFirst?esc(e.meaning):`<span style="font-size:48px">${esc(e.w)}</span>`;
  const back=enFirst?`<span style="font-size:40px">${esc(e.w)}</span><br>${esc(e.r)}`:`${esc(e.r)}<br><b>${esc(e.meaning)}</b>`;
  root.innerHTML=`<div class="row"><a class="btn alt" href="#/vocab">Back</a><select id="l" aria-label="Lesson">${lessonOpts(lesson)}</select><label><input type="checkbox" id="dir"${enFirst?' checked':''}> English first</label><span class="muted">Card ${i+1} / ${list.length}</span></div>
  <div class="card" style="text-align:center;min-height:200px"><p>${front}</p>${show?`<p style="font-size:22px">${back}</p><p class="muted">Lesson ${e.ls.join(', ')} · ${TYPES[e.t]||''}</p>`:'<p class="muted">Try to recall, then reveal.</p>'}
  <div class="row" style="justify-content:center"><button id="p">←</button><button id="r">${show?'Hide':'Reveal'}</button><button id="n">→</button><button class="alt" id="sh">Shuffle</button><button class="alt" id="lr">${v.learned?'✓ Learned':'Mark learned'}</button><button class="alt" id="bm">${v.bookmark?'★':'☆'}</button></div></div>`;
  const $=q=>root.querySelector(q);
  $('#p').onclick=()=>{i=(i-1+list.length)%list.length;show=false;d()};$('#n').onclick=()=>{i=(i+1)%list.length;show=false;d()};$('#r').onclick=()=>{show=!show;d()};
  $('#sh').onclick=()=>{list=shuffle(list);i=0;show=false;d()};$('#lr').onclick=()=>{v.learned=!v.learned;save();d()};$('#bm').onclick=()=>{v.bookmark=!v.bookmark;save();d()};
  $('#dir').onchange=ev=>{enFirst=ev.target.checked;show=false;d()};$('#l').onchange=ev=>{lesson=ev.target.value;list=VOCAB.filter(x=>inLesson(x,lesson));i=0;show=false;d()};}
 d();
}
const disp=e=>e.r===e.w?e.w:`${e.w}（${e.r}）`;
export function vocabQs(mode,pool,count,all){
 const qs=[];const seen=new Set();let g=0;
 while(qs.length<count&&pool.length&&g++<count*30){const e=pool[Math.floor(Math.random()*pool.length)];if(seen.has(e.key))continue;
  const same=all.filter(x=>x.t===e.t&&x.key!==e.key);const others=shuffle(same.length>=8?same:all.filter(x=>x.key!==e.key));
  let q;
  if(mode==='jp-en'){const ds=[...new Set(others.map(x=>x.meaning))].filter(m=>m!==e.meaning).slice(0,3);q={prompt:`What does ${disp(e)} mean?`,options:[e.meaning,...ds],answer:e.meaning,explain:`${disp(e)} = ${e.meaning}.`}}
  else if(mode==='en-jp'){const ds=[...new Set(others.filter(x=>x.meaning!==e.meaning).map(disp))].filter(m=>m!==disp(e)).slice(0,3);q={prompt:`Which Japanese word means "${e.meaning}"?`,options:[disp(e),...ds],answer:disp(e),explain:`"${e.meaning}" = ${disp(e)}.`}}
  else{if(e.w===e.r)continue;const ds=[...new Set(others.map(x=>x.r))].filter(m=>m!==e.r).slice(0,3);q={prompt:`How do you read ${e.w}?`,options:[e.r,...ds],answer:e.r,explain:`${e.w} is read ${e.r} (${e.meaning}).`}}
  if(q.options.length<4)continue;seen.add(e.key);q.rec=ok=>{const v=vstat(e.key);ok?v.right++:v.wrong++;v.last=new Date().toISOString()};qs.push(q)}
 return qs}
export function vocabQuizMenu(root){
 root.innerHTML=`<h2>Vocabulary quizzes</h2><div class="card"><div class="row"><label>Type <select id="m"><option value="jp-en">Japanese → English</option><option value="en-jp">English → Japanese</option><option value="reading">Kanji word → reading</option></select></label>
 <label>Lessons <select id="a" aria-label="From lesson">${MINNA_VOCAB.map(L=>`<option value="${L.l}">${L.l}</option>`).join('')}</select> to <select id="b" aria-label="To lesson">${MINNA_VOCAB.map(L=>`<option value="${L.l}"${L.l===25?' selected':''}>${L.l}</option>`).join('')}</select></label>
 <label>Questions <select id="c"><option>10</option><option>25</option><option>50</option></select></label><label><input type="checkbox" id="df"> Difficult words only</label></div><button id="go">Start</button><p id="msg" class="warn" hidden></p></div><div id="qz"></div>`;
 const $=s=>root.querySelector(s);
 $('#go').onclick=()=>{let a=+$('#a').value,b=+$('#b').value;if(a>b)[a,b]=[b,a];let pool=VOCAB.filter(e=>e.ls.some(l=>l>=a&&l<=b));if($('#df').checked)pool=pool.filter(e=>{const v=vstat(e.key);return v.wrong>v.right});
  const qs=vocabQs($('#m').value,pool,+$('#c').value,VOCAB);const m=$('#msg');
  if(!qs.length){m.hidden=false;m.textContent='No questions for that selection (difficult-word mode needs earlier mistakes).';return}
  m.hidden=qs.length>=+$('#c').value;if(!m.hidden)m.textContent=`Only ${qs.length} questions available; running those.`;
  runQuiz($('#qz'),qs,{title:`Vocabulary ${$('#m').value} (lessons ${a}–${b})`,back:'#/vocab',backLabel:'Back to vocabulary'});$('#qz').scrollIntoView()};
}
