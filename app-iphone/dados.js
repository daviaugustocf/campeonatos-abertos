
'use strict';
const KEY='campeonatos-abertos-offline-v1';
const byId=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pair=(a,b)=>[a,b].sort().join('|');
const makeId=()=> 't'+Date.now().toString(36)+Math.random().toString(36).slice(2,10);
let state, storageBlocked=false, isExample=false;
function validState(s){
 if(!s || s.version!==1 || !Array.isArray(s.teams) || s.teams.length<2 || s.teams.length>16 || !s.scores || typeof s.scores!=='object' || Array.isArray(s.scores)) return false;
 const ids=new Set();
 for(const t of s.teams){if(!t || typeof t.id!=='string' || !/^t[a-z0-9]+$/.test(t.id) || ids.has(t.id) || typeof t.name!=='string' || !t.name.trim() || t.name.length>60)return false;ids.add(t.id)}
 for(const [key,v] of Object.entries(s.scores)){const p=key.split('|');if(p.length!==2||!ids.has(p[0])||!ids.has(p[1])||p[0]===p[1]||pair(p[0],p[1])!==key||!v||typeof v!=='object'||Array.isArray(v))return false;for(const id of Object.keys(v)){if(!p.includes(id)||!(v[id]===null||(Number.isInteger(v[id])&&v[id]>=0&&v[id]<=999)))return false}}
 if(s.mode!==undefined && s.mode!=='completo' && s.mode!=='simples')return false;
 if(s.simplePoints!==undefined){if(!s.simplePoints || typeof s.simplePoints!=='object' || Array.isArray(s.simplePoints))return false;for(const [id,n] of Object.entries(s.simplePoints)){if(!ids.has(id)||!Number.isSafeInteger(n)||n<0||n>999999)return false}}
 return true;
}
function warn(message){const el=byId('storageWarning');el.textContent=message;el.hidden=false}
function load(){
 let raw;
 try{raw=localStorage.getItem(KEY)}catch(e){storageBlocked=true;warn('Não foi possível acessar o armazenamento. As alterações podem ser perdidas ao fechar o app.')}
 if(raw!==null && raw!==undefined){try{let saved=JSON.parse(raw);if(!validState(saved))throw Error('dados inválidos');state=saved;state.mode=state.mode||'completo';state.simplePoints=state.simplePoints||{};isExample=saved.example===true;byId('exampleNotice').hidden=!isExample;return}catch(e){storageBlocked=true;warn('Não foi possível ler os dados salvos. Para protegê-los, as alterações nesta tela não serão gravadas. Não limpe os dados do app.')}}
 state={version:1,teams:[{id:makeId(),name:'Davi'},{id:makeId(),name:'Maitê'}],scores:{},mode:'completo',simplePoints:{}};isExample=true;byId('exampleNotice').hidden=false;
}
function save(){if(storageBlocked)return;state.example=isExample;try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){warn('Não foi possível salvar as alterações. Elas podem ser perdidas ao fechar o app. Verifique o espaço disponível.')}}
function rounds(teams){
 let list=teams.map(t=>t.id);if(list.length%2)list.push(null);
 const out=[];for(let r=0;r<list.length-1;r++){const games=[];for(let i=0;i<list.length/2;i++){const a=list[i],b=list[list.length-1-i];if(a&&b)games.push([a,b])}out.push(games);list=[list[0],list[list.length-1],...list.slice(1,-1)]}return out;
}
function stats(){
 const table=state.teams.map(t=>({id:t.id,name:t.name,pts:0,j:0,v:0,e:0,d:0,sg:0,gp:0}));const map=Object.fromEntries(table.map(t=>[t.id,t]));let played=0;
 for(const [key,score] of Object.entries(state.scores)){const [a,b]=key.split('|');if(!map[a]||!map[b]||!Number.isInteger(score[a])||!Number.isInteger(score[b]))continue;const x=map[a],y=map[b],sa=score[a],sb=score[b];played++;x.j++;y.j++;x.gp+=sa;y.gp+=sb;x.sg+=sa-sb;y.sg+=sb-sa;if(sa>sb){x.v++;y.d++;x.pts+=3}else if(sa<sb){y.v++;x.d++;y.pts+=3}else{x.e++;y.e++;x.pts++;y.pts++}}
 table.sort((a,b)=>b.pts-a.pts||b.sg-a.sg||b.gp-a.gp||a.name.localeCompare(b.name,'pt-BR',{sensitivity:'base'})||a.id.localeCompare(b.id));return {table,played};
}
