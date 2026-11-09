// Checks the switches on a page: clicks every carousel and toggle and looks at whether the state changed.
// node tools/verify/ev.mjs http://localhost:3000/pot-ru 1440 tools/verify/clicks.js
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const res=[];
// carousels driven by data-state
for(const g of [...document.querySelectorAll('[data-state]')].filter(e=>e.offsetParent)){
  const t=[...g.querySelectorAll('[data-swap-map]')].find(e=>e.offsetParent&&JSON.parse(e.dataset.swapMap)[g.dataset.state]&&e.closest('[data-state]')===g);
  if(!t){res.push('state: no active arrow');continue;}
  const want=JSON.parse(t.dataset.swapMap)[g.dataset.state];t.click();await sleep(450);
  res.push(g.dataset.state===want?'state ok':'state FAIL');
}
// blocks built from layers (VariantGroup)
const shown=(g)=>[...g.children].find(c=>getComputedStyle(c).opacity==='1')?.dataset.variant;
const seen=new Set();
for(const t of [...document.querySelectorAll('[data-swap-to]')].filter(e=>e.offsetParent&&getComputedStyle(e.closest('[data-variant]')||e).opacity!=='0')){
  let g=t.parentElement;while(g&&![...g.children].some(c=>c.dataset?.variant===t.dataset.swapTo))g=g.parentElement;
  if(!g||seen.has(g))continue;seen.add(g);
  const before=shown(g);t.click();await sleep(450);
  res.push(shown(g)===t.dataset.swapTo&&before!==shown(g)?'layers ok':'layers FAIL');
}
return res.join(', ')||'no switches';
