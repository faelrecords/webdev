import { useEffect, useMemo, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';
import { getActivePage, useEditorStore } from '../stores/editorStore';
import { ensureElementIds } from '../utils/html';

const bridge = String.raw`<script>
(() => {
  const send = (type, data={}) => parent.postMessage({source:'webdev-canvas',type,...data}, '*');
  const clean = () => document.querySelectorAll('.wd-selected').forEach(el => el.classList.remove('wd-selected'));
  document.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation(); clean();
    const el = e.target.closest('[data-wd-id]'); if (!el) return;
    el.classList.add('wd-selected');
    const styles = getComputedStyle(el);
    send('select',{element:{id:el.dataset.wdId,tagName:el.tagName.toLowerCase(),text:el.childElementCount ? '' : el.textContent || '',className:el.className.replace('wd-selected','').trim(),attributes:Object.fromEntries([...el.attributes].map(attr=>[attr.name,attr.value])),styles:{display:styles.display,width:styles.width,height:styles.height,margin:styles.margin,padding:styles.padding,color:styles.color,backgroundColor:styles.backgroundColor,fontSize:styles.fontSize,fontWeight:styles.fontWeight,textAlign:styles.textAlign,borderRadius:styles.borderRadius}}});
  });
  document.addEventListener('dblclick', e => { const el=e.target.closest('[data-wd-id]'); if(el && !['IMG','VIDEO'].includes(el.tagName)){el.contentEditable='true';el.focus()} });
  document.addEventListener('focusout', e => { if(e.target.isContentEditable){e.target.contentEditable='false';send('change',{html:document.body.innerHTML})} },true);
  document.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect='copy'; });
  document.addEventListener('drop', e => { e.preventDefault(); const html=e.dataTransfer.getData('text/webdev-widget');if(!html)return;const range=document.caretRangeFromPoint?.(e.clientX,e.clientY);const host=range?.startContainer.nodeType===3?range.startContainer.parentElement:range?.startContainer;const wrapper=document.createElement('div');wrapper.innerHTML=html;const node=wrapper.firstElementChild;if(!node)return;node.querySelectorAll('*').forEach(x=>x.dataset.wdId ||= crypto.randomUUID());node.dataset.wdId ||= crypto.randomUUID();(host?.closest('[data-wd-id]')||document.body).appendChild(node);send('change',{html:document.body.innerHTML,label:'Adicionar elemento'}) });
  document.addEventListener('keydown', e => { if((e.key==='Delete'||e.key==='Backspace')&&!e.target.isContentEditable){const el=document.querySelector('.wd-selected');if(el&&confirm('Excluir elemento?')){el.remove();send('change',{html:document.body.innerHTML,label:'Excluir elemento'})}} });
  window.addEventListener('message', e => { const m=e.data;if(m?.source!=='webdev-editor')return;const el=document.querySelector('[data-wd-id="'+CSS.escape(m.id||'')+'"]');if(m.type==='style'&&el){el.style[m.property]=m.value;send('change',{html:document.body.innerHTML,label:'Alterar estilo'})}if(m.type==='content'&&el){if(m.property==='text')el.textContent=m.value;else if(m.property==='className')el.className=m.value;else el.setAttribute(m.property,m.value);send('change',{html:document.body.innerHTML,label:'Alterar conteúdo'})}if(m.type==='delete'&&el){el.remove();send('change',{html:document.body.innerHTML,label:'Excluir elemento'})}if(m.type==='duplicate'&&el){const clone=el.cloneNode(true);clone.querySelectorAll('[data-wd-id]').forEach(x=>x.dataset.wdId=crypto.randomUUID());clone.dataset.wdId=crypto.randomUUID();el.after(clone);send('change',{html:document.body.innerHTML,label:'Duplicar elemento'})}if(m.type==='request-template'&&el)send('template',{html:el.outerHTML,name:m.name||'Modelo'})});
  send('ready');
})();
</script>`;

export function Canvas() {
  const iframe = useRef<HTMLIFrameElement>(null);
  const area = useRef<HTMLElement>(null);
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
      if (event.data.type === 'change') updatePage({ html: event.data.html }, event.data.label ?? 'Editar conteúdo');
      if (event.data.type === 'template') addTemplate(event.data.name,event.data.html);
    }
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [addTemplate, setSelected, updatePage]);
  useEffect(() => {
    function insert(event: Event) {
      const html=(event as CustomEvent<string>).detail;
      const doc=new DOMParser().parseFromString(page.html,'text/html');
      const holder=doc.createElement('div');holder.innerHTML=html;
      const node=holder.firstElementChild;
      if(!node)return;
      node.querySelectorAll('*').forEach(element=>element.setAttribute('data-wd-id',crypto.randomUUID()));
      node.setAttribute('data-wd-id',crypto.randomUUID());doc.body.appendChild(node);
      updatePage({html:doc.body.innerHTML},'Adicionar elemento');
    }
    window.addEventListener('webdev-insert-widget',insert);
    return()=>window.removeEventListener('webdev-insert-widget',insert);
  },[page.html,updatePage]);
  const assetUrls = useMemo(() => project.files.map((file) => ({ path: file.path, url: file.blob ? URL.createObjectURL(file.blob) : file.text !== undefined && !/\.(css|js|html?|json|txt|md)$/i.test(file.path) ? URL.createObjectURL(new Blob([file.text], { type: file.type })) : '' })).filter((item) => item.url), [project.files]);
  useEffect(() => () => assetUrls.forEach((item) => URL.revokeObjectURL(item.url)), [assetUrls]);
  const resolved = useMemo(() => {
    const pageBase=page.path.includes('/')?page.path.slice(0,page.path.lastIndexOf('/')+1):'';
    const normalize=(value:string)=>{const stack:string[]=[];for(const part of `${pageBase}${value}`.split('/')){if(part==='..')stack.pop();else if(part!=='.')stack.push(part)}return stack.join('/')};
    const find=(value:string)=>assetUrls.find(item=>item.path===normalize(value))?.url;
    const doc=new DOMParser().parseFromString(page.html,'text/html');
    doc.querySelectorAll<HTMLElement>('[src],[poster]').forEach(node=>{for(const attr of ['src','poster']){const value=node.getAttribute(attr);if(value&&!/^(?:https?:|data:|blob:|#)/.test(value)){const url=find(value);if(url)node.setAttribute(attr,url)}}});
    const css=page.css.replace(/url\((['"]?)(?!data:|https?:|blob:)([^)'"\s]+)\1\)/g,(_all,quote:string,path:string)=>{const url=find(path);return url?`url(${quote}${url}${quote})`:_all});
    return {html:doc.body.innerHTML,css};
  },[assetUrls,page.css,page.html,page.path]);
  const srcDoc = useMemo(() => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${resolved.css}\n${preview ? '' : '[data-wd-id]{outline:1px solid transparent;outline-offset:-1px}[data-wd-id]:hover{outline-color:#8ea0ff}.wd-selected{outline:2px solid #3563ff!important;outline-offset:-2px;position:relative}'}\n</style></head><body>${resolved.html}${project.settings.executeScripts || preview ? `<script>${page.javascript}</script>` : ''}${preview ? '' : bridge}</body></html>`, [page.javascript, preview, project.settings.executeScripts, resolved.css, resolved.html]);
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
