window.Q={
 profiles:{
  auto:{label:'Auto',w:3840,h:2160,br:8000000},
  max:{label:'Max/4K',w:3840,h:2160,br:14000000},
  '1080p':{label:'1080p',w:1920,h:1080,br:5000000},
  '720p':{label:'720p',w:1280,h:720,br:2500000}
 },
 bitrate(mode){return (this.profiles[mode]||this.profiles.auto).br},
 async getMedia(facing,wantAudio,mode){
  const order=mode==='720p'?[[1280,720],[1280,720]]:mode==='1080p'?[[1920,1080],[1280,720]]:[[3840,2160],[1920,1080],[1280,720]];
  let last;for(const [w,h] of order){
   try{return await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing},width:{ideal:w},height:{ideal:h}},audio:!!wantAudio})}
   catch(e){last=e}}throw last||new Error('camera')},
  async apply(track,mode,force){
  if(!track)return null;const p=this.profiles[mode]||this.profiles.auto;
  let tw=p.w,th=p.h,tier=mode;
  if(mode==='auto'){const a=this.autoLevel();tw=a.w;th=a.h;tier=a.tier;
   if(!force&&this._lastTier&&this._lastTier===tier){const s=track.getSettings?track.getSettings():{};return {w:s.width||tw,h:s.height||th,mode,label:this.label(mode,s.width||tw,s.height||th)}}
   // hysteresis: require tier change (already gated) 
   this._lastTier=tier}
  try{await track.applyConstraints({width:{ideal:tw},height:{ideal:th}})}catch(e){console.warn('applyConstraints',e)}
  const s=track.getSettings?track.getSettings():{};
  return {w:s.width||tw,h:s.height||th,mode,label:this.label(mode,s.width||tw,s.height||th)}},
 autoLevel(){
  let tier='1080p';
  try{const c=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
   if(c){const t=(c.effectiveType||'').toLowerCase(),down=c.downlink||0;
    if(c.saveData||t==='2g'||t==='slow-2g'||down&&down<1.5)tier='720p';
    else if(t==='3g'||(down&&down<5))tier='1080p';
    else tier='max'}}catch(e){}
  const p=this.profiles[tier==='max'?'max':tier];return {w:p.w,h:p.h,tier,br:p.br}},
 netLabel(){try{const c=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
  if(!c)return 'link ?';const t=(c.effectiveType||'wifi').toUpperCase();
  const down=c.downlink;let q='ok';if(c.saveData||(down&&down<1.5))q='poor';else if(down&&down<5)q='fair';else q='good';
  const type=c.type==='wifi'||!c.type?'Wi-Fi':c.type;return type+' '+q}catch(e){return 'link ?'}},
 resName(w){if(w>=3200)return '4K';if(w>=1600)return '1080p';if(w>=1100)return '720p';return (w||'?')+'p'},
 label(mode,w,h){const m=mode==='auto'?'Auto':(this.profiles[mode]||{}).label||mode;return m+' · '+this.resName(w)+' · '+this.netLabel()},
 estHours(mb,mode){const br=(this.profiles[mode==='auto'?'1080p':mode]||this.profiles['1080p']).br;return ((mb*8*1e6)/br/3600).toFixed(1)},
 async outboundMbps(pc){if(!pc)return null;try{const stats=await pc.getStats();let bps=0;stats.forEach(r=>{if(r.type==='outbound-rtp'&&r.kind==='video'&&r.bytesSent!=null){if(r.bitrate)bps=r.bitrate;else if(this._prev){const dt=(r.timestamp-this._prev.ts)/1000;if(dt>0)bps=8*(r.bytesSent-this._prev.bytes)/dt}this._prev={ts:r.timestamp,bytes:r.bytesSent}}});return bps/1e6}catch(e){return null}}
};
