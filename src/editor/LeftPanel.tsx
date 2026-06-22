import { ChevronDown, Clock3, File, Folder, Image as ImageIcon, Layers3, LayoutGrid, Search, Star, Upload, type LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { widgetGroups, type Widget } from './widgets';
import { getActivePage, useEditorStore } from '../stores/editorStore';
import { getLayerTree, type LayerNode } from '../utils/html';
import type { Project, ProjectFile } from '../domain/types';

const tabs: { id: 'elements'|'layers'|'files'|'templates'|'history'; label: string; icon: LucideIcon }[] = [
  { id: 'elements', label: 'Elementos', icon: LayoutGrid }, { id: 'layers', label: 'Camadas', icon: Layers3 }, { id: 'files', label: 'Arquivos', icon: Folder }, { id: 'templates', label: 'Modelos', icon: Star }, { id: 'history', label: 'Histórico', icon: Clock3 },
];

export function LeftPanel() {
  const tab = useEditorStore((state) => state.leftTab);
  const setTab = useEditorStore((state) => state.setLeftTab);
  const [query, setQuery] = useState('');
  const [visibleFileCount,setVisibleFileCount]=useState(300);
  const project = useEditorStore((state) => state.project);
  const addAssets = useEditorStore((state) => state.addAssets);
  const renameAsset=useEditorStore(state=>state.renameAsset);
  const deleteAsset=useEditorStore(state=>state.deleteAsset);
  const assetInput = useRef<HTMLInputElement>(null);
  const page = getActivePage(project);
  const layers = useMemo(() => getLayerTree(page.html), [page.html]);
  const past = useEditorStore((state)=>state.past);
  const restoreHistory = useEditorStore((state)=>state.restoreHistory);
  const broken=useMemo(()=>findBrokenReferences(project),[project]);
  return <aside className="left-panel"><div className="panel-tabs">{tabs.map(({ id,label,icon:Icon }) => <button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}><Icon size={18}/><span>{label}</span></button>)}</div>
    <div className="panel-content">{tab === 'elements' ? <><label className="search-field"><Search size={15}/><input placeholder="Buscar elementos" value={query} onChange={e=>setQuery(e.target.value)}/></label><WidgetLibrary query={query}/></> : null}
    {tab === 'layers' ? <div className="layers-panel"><h3>Estrutura da página</h3>{layers.map((node)=><Layer key={node.id} node={node} depth={0}/>)}</div> : null}
    {tab === 'files' ? <div className="files-panel"><h3>Arquivos <button className="tiny-action" onClick={()=>assetInput.current?.click()}><Upload size={12}/>Adicionar</button></h3>{broken.length?<p className="asset-warning">{broken.length} referências quebradas</p>:null}<div className="file-row active"><File size={15}/><span>{page.path}</span></div>{project.files.slice(0,visibleFileCount).map(file=><AssetRow key={file.path} file={file} rename={()=>{const next=window.prompt('Novo caminho:',file.path);if(next)renameAsset(file.path,next)}} remove={()=>{if(window.confirm(`Excluir ${file.path}?`))deleteAsset(file.path)}}/>)}{visibleFileCount<project.files.length?<button className="load-more" onClick={()=>setVisibleFileCount((count)=>count+300)}>Carregar mais {Math.min(300,project.files.length-visibleFileCount)}</button>:null}<input ref={assetInput} type="file" hidden multiple accept="image/*,video/*,.svg,.woff,.woff2,.ttf,.css,.js" onChange={event=>event.target.files&&void addAssets(Array.from(event.target.files))}/></div> : null}
    {tab === 'templates' ? <Templates/> : null}
    {tab === 'history' ? <div className="history-panel"><h3>Histórico desta página</h3>{past.length?<>{past.map((entry,index)=><button key={`${entry.timestamp}-${index}`} onClick={()=>restoreHistory(index)}><Clock3/><span><strong>{entry.label}</strong><small>{new Date(entry.timestamp).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</small></span></button>)}</>:<p>Nenhuma alteração registrada.</p>}</div> : null}</div>
  </aside>;
}

function AssetRow({file,rename,remove}:{file:ProjectFile;rename:()=>void;remove:()=>void}){
  const preview=useMemo(()=>{if(!file.type.startsWith('image')&&!/\.(png|jpe?g|gif|webp|svg)$/i.test(file.path))return '';const blob=file.blob??(file.text!==undefined?new Blob([file.text],{type:file.type}):null);return blob?URL.createObjectURL(blob):''},[file]);
  useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview)},[preview]);
  return <div className="file-row asset-row">{preview?<img src={preview} alt=""/>:file.type.startsWith('image')?<ImageIcon size={15}/>:<File size={15}/>}<span title={file.path}>{file.path}</span><button title="Renomear" onClick={rename}>✎</button><button title="Excluir" onClick={remove}>×</button></div>
}

function findBrokenReferences(project:Project){const available=new Set([...project.files.map(file=>file.path),...project.pages.map(page=>page.path)]);const found=new Set<string>();for(const page of project.pages){const source=`${page.html}\n${page.css}`;for(const match of source.matchAll(/(?:src|href)=["']([^"'#]+)["']|url\(["']?([^"')]+)/gi)){const value=match[1]??match[2];if(value&&!/^(?:https?:|data:|blob:|mailto:|tel:|\/)/i.test(value)&&/\.[a-z0-9]{2,5}(?:\?|$)/i.test(value)&&!available.has(value.split('?')[0]!))found.add(value)}}return [...found]}

function WidgetLibrary({ query }: { query: string }) {
  const filtered = widgetGroups.map(group=>({...group,items:group.items.filter(item=>item.name.toLowerCase().includes(query.toLowerCase()))})).filter(group=>group.items.length);
  function insert(widget: Widget) { window.dispatchEvent(new CustomEvent('webdev-insert-widget',{detail:widget.html})); }
  return <div className="widget-library">{filtered.map(group=><section key={group.name}><h3>{group.name}<ChevronDown size={14}/></h3><div className="widget-grid">{group.items.map(({id,name,icon:Icon,html})=><button key={id} draggable onDragStart={e=>{e.dataTransfer.setData('text/webdev-widget',html);e.dataTransfer.effectAllowed='copy'}} onDoubleClick={()=>insert({id,name,icon:Icon,html})}><Icon/><span>{name}</span></button>)}</div></section>)}</div>;
}

function Layer({ node, depth }: { node: LayerNode; depth: number }) {
  const [open,setOpen]=useState(true);
  return <div><button className="layer-row" style={{paddingLeft:10+depth*14}} onClick={()=>setOpen(!open)}>{node.children.length?<ChevronDown size={13} className={open?'':'closed'}/>:<span className="layer-spacer"/>}<span className="tag-badge">{node.tag}</span><span>{node.name}</span></button>{open?node.children.map(child=><Layer key={child.id} node={child} depth={depth+1}/>):null}</div>;
}

function Templates() {
  const custom=useEditorStore(state=>state.project.templates??[]);
  const templates=[
    {name:'Hero moderno',text:'Título, texto e chamada',html:'<section data-wd-name="Hero moderno" style="padding:100px 24px;background:#111827;color:white;text-align:center"><div style="max-width:850px;margin:auto"><h1 style="font-size:clamp(42px,7vw,78px);line-height:1.02;margin:0">Uma grande ideia merece presença forte.</h1><p style="font-size:19px;color:#b7c1ce;margin:24px auto;max-width:650px">Crie experiência clara, responsiva e pronta para crescer.</p><a class="button" href="#">Começar agora</a></div></section>'},
    {name:'Serviços em grade',text:'Três colunas responsivas',html:'<section data-wd-name="Serviços" style="padding:80px 24px"><div style="max-width:1180px;margin:auto"><h2 style="font-size:42px">Nossos serviços</h2><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:24px"><article><h3>Estratégia</h3><p>Plano claro para melhores decisões.</p></article><article><h3>Design</h3><p>Experiências úteis e memoráveis.</p></article><article><h3>Tecnologia</h3><p>Soluções rápidas e escaláveis.</p></article></div></div></section>'},
    {name:'Chamada final',text:'Conversão com dois botões',html:'<section data-wd-name="Chamada final" style="padding:80px 24px;background:#3563ff;color:white;text-align:center"><h2 style="font-size:42px;margin-top:0">Pronto para começar?</h2><p>Converse com nossa equipe hoje.</p><div style="display:flex;justify-content:center;gap:12px"><a class="button" style="background:white;color:#111827" href="#">Solicitar proposta</a><a class="button" style="border:1px solid white" href="#">Conhecer serviços</a></div></section>'},
    {name:'Rodapé completo',text:'Links e contato',html:'<footer data-wd-name="Rodapé" style="padding:60px 24px;background:#0f172a;color:white"><div style="max-width:1180px;margin:auto;display:grid;grid-template-columns:2fr 1fr 1fr;gap:40px"><div><h2>Sua marca</h2><p style="color:#94a3b8">Mensagem curta sobre empresa.</p></div><div><strong>Empresa</strong><p>Sobre<br>Serviços<br>Contato</p></div><div><strong>Contato</strong><p>contato@empresa.com<br>São Paulo, Brasil</p></div></div></footer>'},
  ];
  return <div className="templates-panel"><h3>Modelos locais</h3>{custom.map((template,index)=><button className="template-card" key={template.id} onClick={()=>window.dispatchEvent(new CustomEvent('webdev-insert-widget',{detail:template.html}))}><span className={`template-thumb template-${index%4}`}/><strong>{template.name}</strong><small>Modelo personalizado</small></button>)}{templates.map(({name,text,html},index)=><button className="template-card" key={name} onClick={()=>window.dispatchEvent(new CustomEvent('webdev-insert-widget',{detail:html}))}><span className={`template-thumb template-${index}`}/><strong>{name}</strong><small>{text}</small></button>)}</div>;
}
