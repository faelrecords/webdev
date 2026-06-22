import Editor from '@monaco-editor/react';
import { Braces, Code2, FileCode, X } from 'lucide-react';
import { useState } from 'react';
import { getActivePage, useEditorStore } from '../stores/editorStore';

export function CodeDrawer({onClose}:{onClose:()=>void}) {
  const [tab,setTab]=useState<'html'|'css'|'javascript'>('html');
  const project=useEditorStore(state=>state.project);
  const updatePage=useEditorStore(state=>state.updatePage);
  const page=getActivePage(project);
  const value=page[tab];
  return <div className="code-drawer"><header><strong><Code2/>Editor de código</strong><div className="code-tabs"><button className={tab==='html'?'active':''} onClick={()=>setTab('html')}><FileCode/>HTML</button><button className={tab==='css'?'active':''} onClick={()=>setTab('css')}><Braces/>CSS</button><button className={tab==='javascript'?'active':''} onClick={()=>setTab('javascript')}><Code2/>JavaScript</button></div><button className="icon-button" onClick={onClose}><X/></button></header><Editor height="100%" theme="vs-dark" language={tab==='javascript'?'javascript':tab} value={value} onChange={(next)=>updatePage({[tab]:next??''},`Editar ${tab.toUpperCase()}`,false)} options={{fontSize:13,minimap:{enabled:false},wordWrap:'on',automaticLayout:true,formatOnPaste:true,tabSize:2}}/></div>;
}
