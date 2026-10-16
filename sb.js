window.SB={
 cfg(){return JSON.parse(localStorage.getItem('alfredSB')||'null')},
 saveCfg(o){localStorage.setItem('alfredSB',JSON.stringify(o));this._c=null},
 client(){const c=this.cfg();if(!c||!c.url||!c.key||!window.supabase)return null;
  if(!this._c)this._c=supabase.createClient(c.url,c.key,{auth:{persistSession:true,storageKey:'alfredSBauth'}});return this._c},
 async user(){const c=this.client();if(!c)return null;const {data}=await c.auth.getSession();return data.session&&data.session.user},
 BUCKET:'alfred-clips',
 async uploadClip(path,blob,meta){const c=this.client(),u=await this.user();if(!c||!u)return null;
  const {error}=await c.storage.from(this.BUCKET).upload(path,blob,{contentType:blob.type||'video/webm',upsert:true,metadata:meta||{}});
  if(error)throw error;return path},
 async listClips(prefix){const c=this.client(),u=await this.user();if(!c||!u)return[];
  const {data,error}=await c.storage.from(this.BUCKET).list(prefix||'',{limit:100,sortBy:{column:'created_at',order:'desc'}});
  if(error)throw error;return data||[]},
 async listAll(){const c=this.client(),u=await this.user();if(!c||!u)return[];
  const {data:folders}=await c.storage.from(this.BUCKET).list('',{limit:100});
  const out=[];for(const f of(folders||[])){if(f.id){out.push({...f,folder:''});continue}
   const {data}=await c.storage.from(this.BUCKET).list(f.name,{limit:50,sortBy:{column:'created_at',order:'desc'}});
   (data||[]).forEach(x=>out.push({...x,folder:f.name}))}return out.sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''))},
 async url(path){const c=this.client();const {data}=await c.storage.from(this.BUCKET).createSignedUrl(path,3600);return data&&data.signedUrl},
 async del(path){const c=this.client();return c.storage.from(this.BUCKET).remove([path])},
 async notify(payload){const c=this.client(),cfg=this.cfg();if(!c||!cfg)return;
  const {data:{session}}=await c.auth.getSession();if(!session)return;
  try{await fetch(cfg.url.replace(/\/$/,'')+'/functions/v1/notify',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token,apikey:cfg.key},body:JSON.stringify(payload)})}catch(e){console.warn('notify',e)}},
 async saveSub(sub){const c=this.client(),u=await this.user();if(!c||!u)return;
  await c.from('push_subs').upsert({user_id:u.id,endpoint:sub.endpoint,subscription:sub},{onConflict:'endpoint'})}
};
