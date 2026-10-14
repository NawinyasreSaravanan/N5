import {esc,shuffle,pct,bar} from './ui.js';
import {record,get,save,logAns} from './storage.js';
// question: {id,n,type,prompt,options:[str],answer:str,explain}
export function runQuiz(root,questions,{title='Quiz',seconds=0,onDone,back='#/kanji',backLabel='Back'}={}){
 let i=0,sel=null,done=false,score=0,wrong=[],left=seconds,timer=null;
 const qs=questions.map(q=>({...q,options:shuffle(q.options)}));
 function tick(){if(!seconds)return;timer=setInterval(()=>{left--;const t=root.querySelector('#t');if(t)t.textContent=fmt(left);if(left<=0){clearInterval(timer);finish(true)}},1000)}
 const fmt=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
 function show(){
  const q=qs[i];let answered=sel!==null&&q._shown;
  root.innerHTML=`<div class="card"><div class="row"><strong>${esc(title)}</strong><span class="muted">Question ${i+1} / ${qs.length}</span>${seconds?`<span class="tag">Time left <span id="t">${fmt(left)}</span></span>`:''}</div>${bar(pct(i,qs.length))}
  <p style="font-size:20px;margin-top:16px">${esc(q.prompt)}</p><div id="opts">${q.options.map((o,k)=>`<button class="opt" data-k="${k}">${esc(o)}</button>`).join('')}</div>
  <div id="fb" aria-live="polite"></div><div class="row"><button id="sub" disabled>Submit</button></div></div>`;
  const opts=[...root.querySelectorAll('.opt')];
  opts.forEach(b=>b.onclick=()=>{if(q._shown)return;sel=q.options[b.dataset.k];opts.forEach(x=>x.classList.remove('sel'));b.classList.add('sel');root.querySelector('#sub').disabled=false});
  root.querySelector('#sub').onclick=()=>{
   if(!q._shown){q._shown=true;const ok=sel===q.answer;if(ok)score++;else wrong.push({q,picked:sel});if(q.n)record(q.n,ok);if(q.rec){q.rec(ok);logAns(ok);save()}
    opts.forEach(b=>{const v=q.options[b.dataset.k];if(v===q.answer)b.classList.add('ok');else if(v===sel)b.classList.add('bad')});
    root.querySelector('#fb').innerHTML=`<p><b>${ok?'Correct.':'Not quite.'}</b> ${esc(q.explain||'')}</p>`;
    const s=root.querySelector('#sub');s.textContent=i+1<qs.length?'Next':'Finish';
   }else{sel=null;if(i+1<qs.length){i++;show()}else finish(false)}};
 }
 function finish(timeUp){clearInterval(timer);if(done)return;done=true;
  const attempted=qs.filter(q=>q._shown).length;
  get().results.push({d:new Date().toISOString(),title,score,total:qs.length});save();
  root.innerHTML=`<div class="card"><h2>${esc(title)} — result</h2>${timeUp?'<p class="warn">Time ran out. Unanswered questions count as incorrect.</p>':''}
  <p style="font-size:24px"><b>${score} / ${qs.length}</b> (${pct(score,qs.length)}%)</p><p class="muted">Answered ${attempted} of ${qs.length}.</p>
  <div class="row"><button id="retry">Retry</button><a class="btn alt" href="${back}">${backLabel}</a></div></div>
  ${wrong.length?`<div class="card"><h3>Review incorrect answers</h3>${wrong.map(w=>`<p><b>${esc(w.q.prompt)}</b><br>Your answer: ${esc(w.picked)}<br>Correct: ${esc(w.q.answer)}<br><span class="muted">${esc(w.q.explain||'')}</span></p>`).join('')}</div>`:''}`;
  root.querySelector('#retry').onclick=()=>runQuiz(root,questions,{title,seconds,onDone,back,backLabel});if(onDone)onDone({score,total:qs.length});}
 show();tick();
}
