const KEY='minna-n5-v1';
const blank=()=>({v:1,settings:{name:'',goal:20,exam:'',romaji:true},kanji:{},vocab:{},grammar:{},log:[],mistakes:{},results:[]});
let state;
export function load(){try{state=JSON.parse(localStorage.getItem(KEY))||blank()}catch{state=blank()}return state}
export function get(){return state||load()}
export function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){console.warn('save failed',e)}}
export function kstat(n){const k=get().kanji;return k[n]||(k[n]={seen:false,status:'new',right:0,wrong:0,last:null,bookmark:false})}
export function record(n,ok){const s=kstat(n);s.seen=true;ok?s.right++:s.wrong++;s.last=new Date().toISOString();
 if(s.status==='new')s.status='learning';
 const t=s.right+s.wrong;if(t>=3&&s.right/t>=.85&&s.right>=3)s.status='mastered';else if(!ok&&s.status==='mastered')s.status='revision';
 if(!ok&&s.wrong>s.right)s.status='revision';
 const day=new Date().toISOString().slice(0,10);const L=get().log;L.push({d:day,n,ok});if(L.length>3000)L.splice(0,L.length-3000);save()}
export function vstat(k){const v=get().vocab||(get().vocab={});return v[k]||(v[k]={learned:false,bookmark:false,right:0,wrong:0,last:null})}
export function gstat(k){const v=get().grammar||(get().grammar={});return v[k]||(v[k]={right:0,wrong:0,last:null})}
export function logAns(ok){const day=new Date().toISOString().slice(0,10);const L=get().log;L.push({d:day,n:0,ok});if(L.length>3000)L.splice(0,L.length-3000)}
export function exportJSON(){return JSON.stringify(get(),null,1)}
export function importJSON(txt){const o=JSON.parse(txt);
 if(!o||o.v!==1||typeof o.kanji!=='object'||!Array.isArray(o.log)||typeof o.settings!=='object')throw new Error('Not a valid MINNA N5 progress file');
 for(const [k,s] of Object.entries(o.kanji)){if(!(+k>=1&&+k<=320)||typeof s.right!=='number'||typeof s.wrong!=='number')throw new Error('Invalid kanji record '+k)}
 state=Object.assign(blank(),o);save()}
export function reset(){state=blank();save()}
