export function ensureWidgetRuntime(javascript:string,html:string){
  let next=javascript;
  if(html.includes('data-wd-countdown')&&!next.includes('wd-countdown-runtime'))next+=`\n/* wd-countdown-runtime */\n(()=>{const update=()=>document.querySelectorAll('[data-wd-countdown]').forEach(root=>{const remaining=Math.max(0,new Date(root.dataset.wdCountdown).getTime()-Date.now());const values=[Math.floor(remaining/864e5),Math.floor(remaining/36e5)%24,Math.floor(remaining/6e4)%60];[...root.querySelectorAll('strong')].forEach((node,index)=>{const label=node.querySelector('small')?.outerHTML||'';node.innerHTML=String(values[index]??0).padStart(2,'0')+'<br>'+label})});update();setInterval(update,60000)})();`;
  return next;
}
