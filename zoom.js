window.Zoom={
 attach(el,opts){
  opts=opts||{};const state={scale:1,x:0,y:0,max:opts.max||8};
  const target=opts.target||el.querySelector('video')||el;
  const wrap=el;wrap.classList.add('zoom-wrap');
  const apply=()=>{target.style.transform=`translate(${state.x}px,${state.y}px) scale(${state.scale})`;target.style.transformOrigin='center center';
   if(ui)ui.querySelector('.zlab').textContent=state.scale.toFixed(1)+'×'};
  const clamp=()=>{state.scale=Math.min(state.max,Math.max(1,state.scale));if(state.scale===1){state.x=0;state.y=0}};
  let ui=null;
  if(opts.controls!==false){ui=document.createElement('div');ui.className='zoom-ui';
   ui.innerHTML=`<button type="button" class="ghost zm">−</button><span class="zlab mut">1.0×</span><button type="button" class="ghost zp">+</button><button type="button" class="ghost zr">Reset</button>`;
   ui.querySelector('.zm').onclick=e=>{e.stopPropagation();state.scale/=1.25;clamp();apply()};
   ui.querySelector('.zp').onclick=e=>{e.stopPropagation();state.scale*=1.25;clamp();apply()};
   ui.querySelector('.zr').onclick=e=>{e.stopPropagation();state.scale=1;state.x=0;state.y=0;apply()};
   wrap.appendChild(ui)}
  // wheel
  wrap.addEventListener('wheel',e=>{e.preventDefault();state.scale*=(e.deltaY<0?1.1:1/1.1);clamp();apply()},{passive:false});
  // drag pan when zoomed
  let drag=null;
  wrap.addEventListener('pointerdown',e=>{if(e.button!==0||state.scale<=1||e.target.closest('.zoom-ui'))return;drag={x:e.clientX-state.x,y:e.clientY-state.y};wrap.setPointerCapture(e.pointerId)});
  wrap.addEventListener('pointermove',e=>{if(!drag)return;state.x=e.clientX-drag.x;state.y=e.clientY-drag.y;apply()});
  wrap.addEventListener('pointerup',()=>drag=null);
  // pinch
  let pinch=null;
  wrap.addEventListener('touchstart',e=>{if(e.touches.length===2){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);pinch={d,s:state.scale,x:state.x,y:state.y}}}, {passive:true});
  wrap.addEventListener('touchmove',e=>{if(!pinch||e.touches.length!==2)return;e.preventDefault();const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);state.scale=pinch.s*(d/pinch.d);clamp();apply()},{passive:false});
  wrap.addEventListener('touchend',()=>pinch=null);
  // double-tap / double-click 2x toggle
  let lastTap=0;
  const toggle=()=>{if(state.scale>1.2){state.scale=1;state.x=0;state.y=0}else state.scale=2;clamp();apply()};
  wrap.addEventListener('dblclick',e=>{if(e.target.closest('.zoom-ui'))return;e.preventDefault();toggle()});
  wrap.addEventListener('touchend',e=>{if(e.touches.length)return;const n=Date.now();if(n-lastTap<300)toggle();lastTap=n},{passive:true});
  apply();
  return {set(s){state.scale=s;clamp();apply()},get:()=>state.scale,reset(){state.scale=1;state.x=0;state.y=0;apply()}}
 },
 sensorSlider(track,host){
  if(!track||!track.getCapabilities)return null;const caps=track.getCapabilities();
  if(!caps.zoom)return null;const sl=document.createElement('input');sl.type='range';sl.min=caps.zoom.min;sl.max=caps.zoom.max;sl.step=caps.zoom.step||0.1;
  const cur=(track.getSettings()||{}).zoom||caps.zoom.min;sl.value=cur;sl.title='Sensor zoom';
  sl.oninput=()=>{try{track.applyConstraints({advanced:[{zoom:+sl.value}]})}catch(e){}};
  const row=document.createElement('div');row.className='row sensor-zoom';row.innerHTML='<span class="mut">Lens zoom</span>';row.appendChild(sl);host.appendChild(row);return sl}
};
