import {KANJI_320 as K} from '../data/kanji-320.js';
import {esc,clean,shuffle,pct,bar} from './ui.js';
import {kstat,save,get} from './storage.js';
import {runQuiz} from './quiz-engine.js';
const meaningOf=k=>k.note||(k.vocab[0]?k.vocab[0].meaning:'');
const good=k=>k.vocab.filter(v=>!v.needs_review);
export const counts=()=>{const s=K.map(k=>kstat(k.n));return{total:320,studied:s.filter(x=>x.seen).length,mastered:s.filter(x=>x.status==='mastered').length,revision:s.filter(x=>x.status==='revision').length,right:s.reduce((a,x)=>a+x.right,0),wrong:s.reduce((a,x)=>a+x.wrong,0)}};
export function nextSuggested(){const f=K.find(k=>!kstat(k.n).seen);return f?f.n:1}
const num=(v,d)=>{v=parseInt(v);return isNaN(v)?d:Math.min(320,Math.max(1,v))};
function search(q){q=q.trim().toLowerCase();if(!q)return K;return K.filter(k=>k.kanji===q||(k.kun||'').includes(q)||(k.on||'').includes(q)||meaningOf(k).toLowerCase().includes(q)||k.vocab.some(v=>v.word.includes(q)||v.reading.includes(q)||v.meaning.toLowerCase().includes(q)))}
export function index(root){
 const c=counts();
 root.innerHTML=`<h2>Kanji 1–320</h2><p class="muted">Source: <i>Basic Kanji 320</i> by Meguro Language Center, in the original order. Not all 320 are official JLPT N5 kanji.</p>
 <div class="card"><b>${c.studied} / 320 studied</b> · ${c.mastered} mastered · ${c.revision} need revision${bar(pct(c.studied,320))}</div>
 <div class="card"><div class="row"><input id="q" type="search" placeholder="Search kanji, meaning, reading, word" aria-label="Search" style="flex:1;min-width:200px">
 <label>From <input id="a" type="number" min="1" max="320" value="1" style="width:70px"></label><label>to <input id="b" type="number" min="1" max="320" value="320" style="width:70px"></label>
 <select id="st" aria-label="Status"><option value="">All status</option><option>new</option><option>learning</option><option>mastered</option><option>revision</option></select>
 <label><input id="bm" type="checkbox"> Bookmarked</label></div>
 <div class="row">${[[1,50],[51,100],[101,150],[151,200],[201,250],[251,300],[301,320]].map(r=>`<button class="alt pre" data-a="${r[0]}" data-b="${r[1]}">${r[0]}–${r[1]}</button>`).join('')}</div>
 <div class="row"><a class="btn" id="fl" href="#/kanji-flash/1/320">Flashcards</a><a class="btn" href="#/kanji-quiz">Quizzes &amp; tests</a><span id="cnt" class="muted"></span></div></div><div class="grid" id="g"></div>`;
 const $=s=>root.querySelector(s);
 function draw(){const a=num($('#a').value,1),b=num($('#b').value,320),st=$('#st').value,bm=$('#bm').checked;
  const list=search($('#q').value).filter(k=>k.n>=a&&k.n<=b&&(!st||kstat(k.n).status===st)&&(!bm||kstat(k.n).bookmark));
  $('#cnt').textContent=list.length+' shown';$('#fl').href=`#/kanji-flash/${a}/${b}`;
  $('#g').innerHTML=list.map(k=>{const s=kstat(k.n);return`<a class="kcell s-${s.status}" href="#/kanji/${k.n}"><small>${k.n}${s.bookmark?' ★':''}</small><span class="ch">${k.kanji}</span><small>${esc(meaningOf(k)).slice(0,22)}</small></a>`}).join('')||'<p>No matches.</p>'}
 ['#q','#a','#b','#st','#bm'].forEach(s=>$(s).addEventListener('input',draw));
 root.querySelectorAll('.pre').forEach(b=>b.onclick=()=>{$('#a').value=b.dataset.a;$('#b').value=b.dataset.b;draw()});draw();
}
export function detail(root,n){
 n=num(n,1);const k=K[n-1],s=kstat(n);
 root.innerHTML=`<div class="row"><a class="btn alt" href="#/kanji">All kanji</a>${n>1?`<a class="btn alt" href="#/kanji/${n-1}">← ${n-1}</a>`:''}${n<320?`<a class="btn alt" href="#/kanji/${n+1}">${n+1} →</a>`:''}</div>
 <div class="card"><p class="muted">No. ${n}</p><div class="big">${k.kanji}</div>
 <p><b>Kun'yomi (hiragana):</b> ${esc(k.kun||'—')}<br><b>On'yomi (katakana):</b> ${esc(k.on||'—')}<br><b>Meaning note:</b> ${esc(k.note||'(none printed in source)')}</p>
 <p class="muted">Stroke count, stroke order and romaji: not available in the source, so not shown. ★ in a reading = not needed for N5; ◆ = not needed for N5/N4 (per the PDF).</p>
 ${k.review.length?`<p class="warn">Extraction notes: ${esc(k.review.join('; '))}. Check against the PDF.</p>`:''}
 <div class="row"><select id="st" aria-label="Status">${['new','learning','mastered','revision'].map(x=>`<option${s.status===x?' selected':''}>${x}</option>`).join('')}</select><button class="alt" id="bm">${s.bookmark?'Remove bookmark':'Bookmark'}</button></div>
 <p class="muted">Right ${s.right} · Wrong ${s.wrong} · Accuracy ${pct(s.right,s.right+s.wrong)}% · Last practised ${s.last?s.last.slice(0,10):'never'}</p></div>
 <div class="card"><h3>Vocabulary and examples (from the PDF)</h3>${k.vocab.length?`<table><tr><th>Word</th><th>Reading</th><th>Meaning</th><th>Example</th></tr>${k.vocab.map(v=>`<tr><td>${esc(clean(v.word))}</td><td>${esc(v.reading)}</td><td>${esc(v.meaning)}</td><td>${esc(clean(v.example))}</td></tr>`).join('')}</table>`:'<p>The source lists no vocabulary for this kanji.</p>'}</div>`;
 s.seen=true;save();
 root.querySelector('#st').onchange=e=>{s.status=e.target.value;save()};
 root.querySelector('#bm').onclick=e=>{s.bookmark=!s.bookmark;save();detail(root,n)};
}
export function flash(root,a,b){
 a=num(a,1);b=num(b,320);if(b<a)[a,b]=[b,a];let list=K.filter(k=>k.n>=a&&k.n<=b),i=0,show=false;
 function d(){const k=list[i],s=kstat(k.n);
  root.innerHTML=`<div class="row"><a class="btn alt" href="#/kanji">Back</a><span class="muted">Card ${i+1} / ${list.length} (kanji ${a}–${b})</span></div>
  <div class="card"><div class="big">${k.kanji}</div>${show?`<p><b>${esc(k.kun||'')}</b> ${esc(k.on||'')} ${k.note?`<span class="muted">(${esc(k.note)})</span>`:''}</p><table>${k.vocab.map(v=>`<tr><td>${esc(clean(v.word))}</td><td>${esc(v.reading)}</td><td>${esc(v.meaning)}</td></tr>`).join('')}</table>${k.vocab[0]?`<p class="muted">${esc(clean(k.vocab[0].example))}</p>`:''}`:'<p class="muted" style="text-align:center">Think of the reading and a word, then reveal.</p>'}
  <div class="row"><button id="p">←</button><button id="r">${show?'Hide':'Reveal'}</button><button id="nx">→</button><button class="alt" id="sh">Shuffle</button><button class="alt" id="bm">${s.bookmark?'★ Bookmarked':'☆ Bookmark'}</button>
  <select id="st" aria-label="Status">${['new','learning','mastered','revision'].map(x=>`<option${s.status===x?' selected':''}>${x}</option>`).join('')}</select></div></div>`;
  const $=q=>root.querySelector(q);
  $('#p').onclick=()=>{i=(i-1+list.length)%list.length;show=false;d()};$('#nx').onclick=()=>{i=(i+1)%list.length;show=false;d()};
  $('#r').onclick=()=>{show=!show;if(show){s.seen=true;if(s.status==='new')s.status='learning';save()}d()};
  $('#sh').onclick=()=>{list=shuffle(list);i=0;show=false;d()};
  $('#bm').onclick=()=>{s.bookmark=!s.bookmark;save();d()};$('#st').onchange=e=>{s.status=e.target.value;save()};}
 d();
}
// ---------- quizzes (only from verified source rows) ----------
function pick(arr,n,not){return shuffle(arr.filter(x=>!not.includes(x))).slice(0,n)}
export function make(k,type,all){
 const rows=good(k);if(!rows.length&&type!=='kanjireading')return null;
 const v=rows[Math.floor(Math.random()*rows.length)];
 const U=a=>[...new Set(a)];
 if(type==='reading'){const pool=U(all.flatMap(x=>good(x).map(r=>r.reading)));const d=pick(pool,3,[v.reading]);if(d.length<3)return null;
  return{n:k.n,prompt:`What is the reading of ${clean(v.word)}?`,options:[v.reading,...d],answer:v.reading,explain:`${clean(v.word)} = ${v.reading} (${v.meaning}). Source: kanji ${k.n}.`}}
 if(type==='vocab'){const pool=U(all.flatMap(x=>good(x).map(r=>r.meaning)));const d=pick(pool,3,[v.meaning]);if(d.length<3)return null;
  return{n:k.n,prompt:`What does ${clean(v.word)} (${v.reading}) mean?`,options:[v.meaning,...d],answer:v.meaning,explain:`${clean(v.word)} means "${v.meaning}".`}}
 if(type==='sentence'){const ex=clean(v.example);if(!ex)return null;const pool=U(all.flatMap(x=>good(x).map(r=>r.meaning)));const d=pick(pool,3,[v.meaning]);if(d.length<3)return null;
  return{n:k.n,prompt:`In 「${ex}」, what does ${clean(v.word)} mean?`,options:[v.meaning,...d],answer:v.meaning,explain:`${clean(v.word)} = ${v.meaning}.`}}
 if(type==='kanjireading'){const mine=[k.kun,k.on].filter(Boolean).join(' / ');const pool=U(all.map(x=>[x.kun,x.on].filter(Boolean).join(' / ')).filter(Boolean));const d=pick(pool,3,[mine]);if(!mine||d.length<3)return null;
  return{n:k.n,prompt:`Which readings are listed for ${k.kanji}?`,options:[mine,...d],answer:mine,explain:`The PDF lists: ${mine}.`}}
 if(type==='recognition'){const r=rows.find(r=>[...r.word].filter(c=>c===k.kanji).length&&r.word.length>1)||rows[0];if(!r.word.includes(k.kanji))return null;
  const d=pick(all.map(x=>x.kanji),3,[k.kanji]);return{n:k.n,prompt:`Which kanji is used in ${r.reading} (${r.meaning})?  Word: ${clean(r.word).replace(k.kanji,'＿')}`,options:[k.kanji,...d],answer:k.kanji,explain:`${clean(r.word)} contains ${k.kanji} (No. ${k.n}).`}}
 return null;
}
export function quizMenu(root){
 root.innerHTML=`<h2>Kanji quizzes</h2><div class="card"><div class="row">
 <label>Type <select id="t"><option value="reading">Reading quiz (word → reading)</option><option value="vocab">Vocabulary quiz (word → meaning)</option><option value="sentence">Sentence practice</option><option value="kanjireading">Kanji → listed readings</option><option value="recognition">Recognition challenge</option><option value="mixed">Mixed</option></select></label>
 <label>Questions <select id="c"><option>10</option><option>25</option><option>50</option><option>100</option></select></label>
 <label>Range <input id="a" type="number" min="1" max="320" value="1" style="width:70px"> – <input id="b" type="number" min="1" max="320" value="320" style="width:70px"></label>
 <label><input type="checkbox" id="tm"> Timed (30 s per question)</label><label><input type="checkbox" id="wk"> Weak kanji only</label></div>
 <button id="go">Start</button><p class="muted">There is no kanji → English meaning quiz yet: the PDF does not print one main meaning per kanji, so I won't make one up. All questions use readings, words, meanings and sentences printed in the PDF. Entries marked for review are skipped.</p><p id="msg" class="warn" hidden></p></div><div id="qz"></div>`;
 const $=s=>root.querySelector(s);
 $('#go').onclick=()=>{const a=num($('#a').value,1),b=num($('#b').value,320),cnt=+$('#c').value,t=$('#t').value;
  let pool=K.filter(k=>k.n>=Math.min(a,b)&&k.n<=Math.max(a,b));
  if($('#wk').checked)pool=pool.filter(k=>{const s=kstat(k.n);return s.wrong>0&&s.wrong>=s.right});
  const types=['reading','vocab','sentence','kanjireading','recognition'];const qs=[];let guard=0;
  while(qs.length<cnt&&pool.length&&guard++<cnt*20){const k=pool[Math.floor(Math.random()*pool.length)];
   const q=make(k,t==='mixed'?types[Math.floor(Math.random()*types.length)]:t,K);if(q&&!qs.some(x=>x.prompt===q.prompt))qs.push(q)}
  const m=$('#msg');if(!qs.length){m.hidden=false;m.textContent='No questions could be built for that selection (weak-kanji mode needs earlier mistakes).';return}
  m.hidden=qs.length>=cnt?true:false;if(!m.hidden)m.textContent=`Only ${qs.length} distinct questions available for this range; running those.`;
  qs.forEach((q,i)=>q.id=i);runQuiz($('#qz'),qs,{title:`Kanji ${t} test (${Math.min(a,b)}–${Math.max(a,b)})`,seconds:$('#tm').checked?qs.length*30:0});
  $('#qz').scrollIntoView();};
}
