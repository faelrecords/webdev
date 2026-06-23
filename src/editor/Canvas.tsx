import { useEffect, useMemo, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';
import { getActivePage, useEditorStore } from '../stores/editorStore';
import { ensureElementIds } from '../utils/html';
import { ensureWidgetRuntime } from '../utils/widgetRuntime';

const bridge = String.raw`<script id="wd-editor-bridge">
(() => {
  const send = (type, data={}) => parent.postMessage({source:'webdev-canvas',type,...data}, '*');
  let selected=[]; let dragged=''; let resizeStart=null; let moving=null;
  const serialize=()=>{const body=document.body.cloneNode(true);body.querySelector('#wd-editor-bridge')?.remove();body.querySelectorAll('.wd-context-menu').forEach(el=>el.remove());body.querySelectorAll('.wd-selected').forEach(el=>el.classList.remove('wd-selected'));body.querySelectorAll('[contenteditable],[draggable]').forEach(el=>{el.removeAttribute('contenteditable');el.removeAttribute('draggable')});return body.innerHTML};
  const change=(label)=>send('change',{html:serialize(),label});
  const clear=()=>{selected.forEach(el=>{el.classList.remove('wd-selected');el.removeAttribute('draggable')});selected=[]};
  const details=el=>{const styles=getComputedStyle(el);return{id:el.dataset.wdId,tagName:el.tagName.toLowerCase(),text:el.childElementCount?'':el.textContent||'',className:el.className.replace('wd-selected','').trim(),attributes:Object.fromEntries([...el.attributes].filter(attr=>!['draggable','contenteditable'].includes(attr.name)).map(attr=>[attr.name,attr.value])),styles:Object.fromEntries(['display','width','height','minWidth','maxWidth','minHeight','maxHeight','margin','padding','color','backgroundColor','fontSize','fontWeight','textAlign','border','borderRadius','boxShadow','opacity','position','top','right','bottom','left','zIndex','overflow','gap','flexDirection','flexWrap','justifyContent','alignItems','order','gridTemplateColumns','gridColumn','aspectRatio','transform'].map(key=>[key,styles[key]]))}};
  const sync=()=>send('select',{element:selected.length?details(selected.at(-1)):null,ids:selected.map(el=>el.dataset.wdId)});
  const choose=(el,add=false)=>{if(!add)clear();if(add&&selected.includes(el)){el.classList.remove('wd-selected');el.removeAttribute('draggable');selected=selected.filter(item=>item!==el)}else{selected.push(el);el.classList.add('wd-selected');el.draggable=true}sync()};
  document.addEventListener('click', e => {
    if(e.target.closest('.wd-context-menu'))return;e.preventDefault();e.stopPropagation();
    const el = e.target.closest('[data-wd-id]'); if (!el) return;
    choose(el,e.ctrlKey||e.metaKey||e.shiftKey);
  });
  document.addEventListener('dblclick', e => { const el=e.target.closest('[data-wd-id]'); if(el && !['IMG','VIDEO'].includes(el.tagName)){el.contentEditable='true';el.focus()} });
  document.addEventListener('focusout', e => { if(e.target.isContentEditable){e.target.contentEditable='false';change('Editar texto')} },true);
  document.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect='copy'; });
  document.addEventListener('dragstart',e=>{const el=e.target.closest('.wd-selected');if(el){dragged=el.dataset.wdId;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/webdev-element',dragged)}});
  document.addEventListener('drop', e => { e.preventDefault();const target=e.target.closest('[data-wd-id]');const moving=document.querySelector('[data-wd-id="'+CSS.escape(e.dataTransfer.getData('text/webdev-element')||dragged)+'"]');if(moving&&target&&moving!==target&&!moving.contains(target)){const rect=target.getBoundingClientRect();target.parentElement.insertBefore(moving,e.clientY<rect.top+rect.height/2?target:target.nextSibling);change('Reordenar elemento');return}const html=e.dataTransfer.getData('text/webdev-widget');if(!html)return;const wrapper=document.createElement('div');wrapper.innerHTML=html;const node=wrapper.firstElementChild;if(!node)return;node.querySelectorAll('*').forEach(x=>x.dataset.wdId ||= crypto.randomUUID());node.dataset.wdId ||= crypto.randomUUID();(target||document.body).appendChild(node);change('Adicionar elemento') });
  document.addEventListener('keydown',e=>{if(e.target.isContentEditable)return;const key=e.key.toLowerCase();if((e.ctrlKey||e.metaKey)&&['c','x'].includes(key)&&selected.length){e.preventDefault();send('clipboard',{html:selected.map(el=>el.outerHTML).join(''),cut:key==='x'});if(key==='x'){selected.forEach(el=>el.remove());clear();change('Recortar elemento')}}if((e.ctrlKey||e.metaKey)&&key==='v'){e.preventDefault();send('paste-request')}if((e.key==='Delete'||e.key==='Backspace')&&selected.length){e.preventDefault();selected.forEach(el=>el.remove());clear();change('Excluir elemento')}});
  document.addEventListener('contextmenu',e=>{const el=e.target.closest('[data-wd-id]');if(!el)return;e.preventDefault();choose(el,false);document.querySelector('.wd-context-menu')?.remove();const menu=document.createElement('div');menu.className='wd-context-menu';menu.style.cssText='position:fixed;z-index:2147483647;left:'+e.clientX+'px;top:'+e.clientY+'px;background:#17212b;color:#fff;border:1px solid #34414e;border-radius:6px;padding:5px;font:12px system-ui;box-shadow:0 10px 30px #0008';[['Duplicar','duplicate'],['Copiar','copy'],['Mover acima','up'],['Mover abaixo','down'],['Excluir','delete']].forEach(([label,action])=>{const button=document.createElement('button');button.textContent=label;button.style.cssText='display:block;width:130px;border:0;background:transparent;color:inherit;padding:7px;text-align:left';button.onclick=()=>{run(action);menu.remove()};menu.appendChild(button)});document.body.appendChild(menu)});
  document.addEventListener('pointerdown',e=>{const el=e.target.closest('.wd-selected');if(!el)return;resizeStart={el,width:el.offsetWidth,height:el.offsetHeight};if(e.altKey){e.preventDefault();const rect=el.getBoundingClientRect();moving={el,startX:e.clientX,startY:e.clientY,left:rect.left+scrollX,top:rect.top+scrollY};el.setPointerCapture(e.pointerId)}});
  document.addEventListener('pointermove',e=>{if(!moving)return;moving.el.style.position='absolute';moving.el.style.left=Math.round((moving.left+e.clientX-moving.startX)/8)*8+'px';moving.el.style.top=Math.round((moving.top+e.clientY-moving.startY)/8)*8+'px'});
  document.addEventListener('pointerup',()=>{if(moving){moving=null;resizeStart=null;change('Mover elemento');return}if(resizeStart&&(resizeStart.width!==resizeStart.el.offsetWidth||resizeStart.height!==resizeStart.el.offsetHeight)){resizeStart.el.style.width=resizeStart.el.offsetWidth+'px';resizeStart.el.style.height=resizeStart.el.offsetHeight+'px';change('Redimensionar elemento')}resizeStart=null});
  function cloneElements(){return selected.map(el=>{const clone=el.cloneNode(true);clone.querySelectorAll('[data-wd-id]').forEach(x=>x.dataset.wdId=crypto.randomUUID());clone.dataset.wdId=crypto.randomUUID();el.after(clone);return clone})}
  function align(type){if(!selected.length)return;const parent=selected[0].parentElement;if(!parent||selected.some(item=>item.parentElement!==parent))return;parent.style.position=parent.style.position==='static'?'relative':parent.style.position;const width=parent.clientWidth;if(type==='distribute'&&selected.length>1){const ordered=[...selected].sort((a,b)=>a.offsetLeft-b.offsetLeft);const used=ordered.reduce((sum,item)=>sum+item.offsetWidth,0);let left=0;const gap=(width-used)/(ordered.length-1);ordered.forEach(item=>{item.style.position='absolute';item.style.left=Math.round(left)+'px';left+=item.offsetWidth+gap})}else selected.forEach(item=>{item.style.position='absolute';item.style.left=type==='align-left'?'0px':type==='align-center'?Math.round((width-item.offsetWidth)/2)+'px':Math.max(0,width-item.offsetWidth)+'px'});change('Alinhar elementos')}
  function paste(html){const holder=document.createElement('div');holder.innerHTML=html;const nodes=[...holder.children];nodes.forEach(node=>{node.querySelectorAll('[data-wd-id]').forEach(x=>x.dataset.wdId=crypto.randomUUID());node.dataset.wdId=crypto.randomUUID();(selected.at(-1)?.parentElement||document.body).appendChild(node)});clear();nodes.forEach(node=>choose(node,true));change('Colar elemento')}
  function run(type,m={}){const el=document.querySelector('[data-wd-id="'+CSS.escape(m.id||selected.at(-1)?.dataset.wdId||'')+'"]');if(type==='live-style'&&el){el.style[m.property]=m.value;sync();return}if(type==='style'&&el){el.style[m.property]=m.value;change('Alterar estilo');choose(el,false)}if(type==='content'&&el){if(m.property==='text')el.textContent=m.value;else if(m.property==='className')el.className=m.value;else if(m.value==='')el.removeAttribute(m.property);else el.setAttribute(m.property,m.value);change('Alterar conteúdo');choose(el,false)}if(type==='delete'){selected.forEach(item=>item.remove());clear();change('Excluir elemento')}if(type==='duplicate'){const clones=cloneElements();clear();clones.forEach(item=>choose(item,true));change('Duplicar elemento')}if(type==='copy'||type==='cut'){send('clipboard',{html:selected.map(item=>item.outerHTML).join(''),cut:type==='cut'});if(type==='cut'){selected.forEach(item=>item.remove());clear();change('Recortar elemento')}}if(type==='paste')paste(m.html||'');if(type==='up'){selected.forEach(item=>item.previousElementSibling?.before(item));change('Mover elemento')}if(type==='down'){[...selected].reverse().forEach(item=>item.nextElementSibling?.after(item));change('Mover elemento')}if(type==='lock'){selected.forEach(item=>item.toggleAttribute('data-wd-locked'));change('Bloquear elemento')}if(type==='hide'){selected.forEach(item=>item.toggleAttribute('hidden'));change('Ocultar elemento')}if(type.startsWith('align-')||type==='distribute')align(type);if(type==='request-template'&&el)send('template',{html:el.outerHTML,name:m.name||'Modelo'})}
  window.addEventListener('message', e => { const m=e.data;if(m?.source!=='webdev-editor')return;if(m.type==='request-template'){const el=document.querySelector('[data-wd-id="'+CSS.escape(m.id||'')+'"]');if(el){el.dataset.wdComponent||=crypto.randomUUID();send('template',{html:el.outerHTML,name:m.name||'Componente'});change('Criar componente global')}return}run(m.type,m) });
  const motionItems=[...document.querySelectorAll('[data-wd-animation]')];if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.isIntersecting&&entry.target.classList.add('wd-animate')),{threshold:.1});motionItems.forEach(item=>observer.observe(item))}else motionItems.forEach(item=>item.classList.add('wd-animate'));
  send('ready');
})();
</script>`;

function resolveRelativePath(base: string, value: string) {
  const stack:string[]=[];
  for(const part of `${base}${value}`.split('/')) { if(part==='..') stack.pop(); else if(part!=='.') stack.push(part); }
  return stack.join('/');
}

export function Canvas() {
  const iframe = useRef<HTMLIFrameElement>(null);
  const area = useRef<HTMLElement>(null);
  const clipboard = useRef('');
  const project = useEditorStore((state) => state.project);
  const device = useEditorStore((state) => state.device);
  const zoom = useEditorStore((state) => state.zoom);
  const preview = useEditorStore((state) => state.preview);
  const { setSelected, updatePage, setZoom } = useEditorStore();
  const addTemplate = useEditorStore((state)=>state.addTemplate);
  const page = getActivePage(project);
  useEffect(() => { if (!page.html.includes('data-wd-id')) updatePage({ html: ensureElementIds(page.html) }, 'Preparar documento', false) }, [page.html, updatePage]);
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.data?.source !== 'webdev-canvas') return;
      if (event.data.type === 'select') setSelected(event.data.element);
      if (event.data.type === 'change') {const javascript=ensureWidgetRuntime(page.javascript,event.data.html);updatePage({ html: event.data.html, ...(javascript===page.javascript?{}:{javascript}) }, event.data.label ?? 'Editar conteúdo')}
      if (event.data.type === 'template') addTemplate(event.data.name,event.data.html,page.css);
      if (event.data.type === 'clipboard') clipboard.current=event.data.html;
      if (event.data.type === 'paste-request'&&clipboard.current) iframe.current?.contentWindow?.postMessage({source:'webdev-editor',type:'paste',html:clipboard.current},'*');
    }
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [addTemplate, page.css, page.javascript, setSelected, updatePage]);
  useEffect(()=>{const command=(event:Event)=>{const detail=(event as CustomEvent<{type:string}>).detail;iframe.current?.contentWindow?.postMessage({source:'webdev-editor',...detail,...(detail.type==='paste'?{html:clipboard.current}:{})},'*')};window.addEventListener('webdev-canvas-command',command);return()=>window.removeEventListener('webdev-canvas-command',command)},[]);
  useEffect(() => {
    function insert(event: Event) {
      const html=(event as CustomEvent<string>).detail;
      const doc=new DOMParser().parseFromString(page.html,'text/html');
      const holder=doc.createElement('div');holder.innerHTML=html;
      const node=holder.firstElementChild;
      if(!node)return;
      node.querySelectorAll('*').forEach(element=>element.setAttribute('data-wd-id',crypto.randomUUID()));
      node.setAttribute('data-wd-id',crypto.randomUUID());doc.body.appendChild(node);
      const nextHtml=doc.body.innerHTML;updatePage({html:nextHtml,javascript:ensureWidgetRuntime(page.javascript,nextHtml)},'Adicionar elemento');
    }
    window.addEventListener('webdev-insert-widget',insert);
    return()=>window.removeEventListener('webdev-insert-widget',insert);
  },[page.html,page.javascript,updatePage]);
  const activeAssetPaths = useMemo(() => {
    const base=page.path.includes('/')?page.path.slice(0,page.path.lastIndexOf('/')+1):'';
    const paths=new Set<string>();
    const doc=new DOMParser().parseFromString(page.html,'text/html');
    doc.querySelectorAll<HTMLElement>('[src],[poster]').forEach((node)=>{for(const attribute of ['src','poster']){const value=node.getAttribute(attribute);if(value&&!/^(?:https?:|data:|blob:|#)/.test(value))paths.add(resolveRelativePath(base,value))}});
    for(const match of page.css.matchAll(/url\((['"]?)(?!data:|https?:|blob:)([^)'"\s]+)\1\)/g)) paths.add(resolveRelativePath(base,match[2]!));
    return paths;
  },[page.css,page.html,page.path]);
  const assetUrls = useMemo(() => project.files.filter((file)=>activeAssetPaths.has(file.path)).map((file) => ({ path: file.path, url: file.blob ? URL.createObjectURL(file.blob) : file.text !== undefined && !/\.(css|js|html?|json|txt|md)$/i.test(file.path) ? URL.createObjectURL(new Blob([file.text], { type: file.type })) : '' })).filter((item) => item.url), [activeAssetPaths,project.files]);
  useEffect(() => () => assetUrls.forEach((item) => URL.revokeObjectURL(item.url)), [assetUrls]);
  const resolved = useMemo(() => {
    const pageBase=page.path.includes('/')?page.path.slice(0,page.path.lastIndexOf('/')+1):'';
    const normalize=(value:string)=>resolveRelativePath(pageBase,value);
    const find=(value:string)=>assetUrls.find(item=>item.path===normalize(value))?.url;
    const doc=new DOMParser().parseFromString(page.html,'text/html');
    doc.querySelectorAll<HTMLElement>('[src],[poster]').forEach(node=>{for(const attr of ['src','poster']){const value=node.getAttribute(attr);if(value&&!/^(?:https?:|data:|blob:|#)/.test(value)){const url=find(value);if(url)node.setAttribute(attr,url)}}});
    const css=page.css.replace(/url\((['"]?)(?!data:|https?:|blob:)([^)'"\s]+)\1\)/g,(_all,quote:string,path:string)=>{const url=find(path);return url?`url(${quote}${url}${quote})`:_all});
    return {html:doc.body.innerHTML,css};
  },[assetUrls,page.css,page.html,page.path]);
  const srcDoc = useMemo(() => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${resolved.css}\n${preview ? '' : '[data-wd-id]{outline:1px solid transparent;outline-offset:-1px}[data-wd-id]:hover{outline-color:#8ea0ff}.wd-selected{outline:2px solid #3563ff!important;outline-offset:-2px;position:relative;resize:both}.wd-selected[data-wd-locked]{outline-style:dashed!important}.wd-selected[hidden]{display:block!important;opacity:.3!important}'}\n</style></head><body>${resolved.html}${project.settings.executeScripts || preview ? `<script>${page.javascript}</script>` : ''}${preview ? '' : bridge}</body></html>`, [page.javascript, preview, project.settings.executeScripts, resolved.css, resolved.html]);
  const width = device === 'desktop' ? 1366 : device === 'tablet' ? 768 : 390;
  const height = device === 'desktop' ? 900 : device === 'tablet' ? 1024 : 844;
  useEffect(()=>{
    const element=area.current;if(!element)return;
    const fit=()=>setZoom(Math.min(.9,(element.clientWidth-64)/width));
    fit();const observer=new ResizeObserver(fit);observer.observe(element);
    return()=>observer.disconnect();
  },[device,setZoom,width]);
  return <main ref={area} className="canvas-area"><div className="canvas-ruler"><span>0</span><span>200</span><span>400</span><span>600</span><span>800</span><span>1000</span><span>1200</span></div><div className="canvas-scroll"><div className="canvas-scale" style={{ width:width*zoom, height:height*zoom }}><div className="canvas-frame" style={{ width, height, transform: `scale(${zoom})` }}><iframe ref={iframe} title="Canvas da página" srcDoc={srcDoc} sandbox={preview ? 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals' : 'allow-scripts allow-same-origin allow-modals'}/></div></div></div><div className="zoom-control"><button onClick={() => setZoom(zoom - .1)}><Minus size={14}/></button><span>{Math.round(zoom*100)}%</span><button onClick={() => setZoom(zoom + .1)}><Plus size={14}/></button></div></main>;
}
