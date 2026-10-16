// Minimal IndexedDB helper for Alfred offline mode
window.IDB=(function(){
 const DB='alfred',VER=2;
 function open(){return new Promise((res,rej)=>{const r=indexedDB.open(DB,VER);r.onupgradeneeded=()=>{const d=r.result;
  if(!d.objectStoreNames.contains('frames'))d.createObjectStore('frames',{keyPath:'code'});
  if(!d.objectStoreNames.contains('events'))d.createObjectStore('events',{keyPath:'id',autoIncrement:true});
  if(!d.objectStoreNames.contains('clips'))d.createObjectStore('clips',{keyPath:'id',autoIncrement:true});
  if(!d.objectStoreNames.contains('clipMeta'))d.createObjectStore('clipMeta',{keyPath:'path'});
  if(!d.objectStoreNames.contains('kv'))d.createObjectStore('kv',{keyPath:'k'});
  if(!d.objectStoreNames.contains('stars'))d.createObjectStore('stars',{keyPath:'path'});
 };r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
 async function tx(store,mode,fn){const db=await open();return new Promise((res,rej)=>{const t=db.transaction(store,mode),s=t.objectStore(store);
  const p=Promise.resolve(fn(s));t.oncomplete=()=>p.then(res);t.onerror=()=>rej(t.error);p.catch(rej)})}
 return{
  putFrame(code,dataUrl,t){return tx('frames','readwrite',s=>s.put({code,dataUrl,t}))},
  getFrame(code){return tx('frames','readonly',s=>new Promise(r=>{const q=s.get(code);q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)}))},
  addEvent(ev){return tx('events','readwrite',s=>s.add(ev))},
  listEvents(limit){return tx('events','readonly',s=>new Promise(r=>{const out=[];s.openCursor(null,'prev').onsuccess=e=>{const c=e.target.result;if(c&&out.length<(limit||50)){out.push(c.value);c.continue()}else r(out)}}))},
  queueClip(rec){return tx('clips','readwrite',s=>s.add(rec))},
  listQueuedClips(){return tx('clips','readonly',s=>new Promise(r=>{const out=[];s.openCursor().onsuccess=e=>{const c=e.target.result;if(c){out.push(c.value);c.continue()}else r(out)}}))},
  delQueued(id){return tx('clips','readwrite',s=>s.delete(id))},
  putClipMeta(list){return tx('clipMeta','readwrite',s=>{s.clear();list.forEach(x=>s.put(x))})},
  listClipMeta(){return tx('clipMeta','readonly',s=>new Promise(r=>{const out=[];s.openCursor().onsuccess=e=>{const c=e.target.result;if(c){out.push(c.value);c.continue()}else r(out)}}))},
  set(k,v){return tx('kv','readwrite',s=>s.put({k,v}))},
  get(k){return tx('kv','readonly',s=>new Promise(r=>{const q=s.get(k);q.onsuccess=()=>r(q.result&&q.result.v);q.onerror=()=>r(null)}))},
  star(path,on){return tx('stars','readwrite',s=>on?s.put({path,t:Date.now()}):s.delete(path))},
  isStarred(path){return tx('stars','readonly',s=>new Promise(r=>{const q=s.get(path);q.onsuccess=()=>r(!!q.result);q.onerror=()=>r(false)}))},
  allStars(){return tx('stars','readonly',s=>new Promise(r=>{const out=[];s.openCursor().onsuccess=e=>{const c=e.target.result;if(c){out.push(c.value.path);c.continue()}else r(out)}}))}
 };
})();
