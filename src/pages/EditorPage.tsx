import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowLeft, Check, Code2, Download, Eye, FileDown, Laptop, Menu, Monitor, Plus, Redo2, Save, Settings, Smartphone, Tablet, Undo2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '../editor/Canvas';
import { LeftPanel } from '../editor/LeftPanel';
import { Inspector } from '../editor/Inspector';
import { SettingsModal } from '../editor/SettingsModal';
import { useEditorStore, getActivePage } from '../stores/editorStore';
import { useAutosave } from '../hooks/useAutosave';
import { exportBackup, exportHtml, exportProjectZip, saveProjectToDirectory } from '../exporters/projectExporter';
import { ProgressOverlay } from '../components/ProgressOverlay';
import type { ArchiveProgress } from '../workers/archiveClient';

const CodeDrawer = lazy(() => import('../editor/CodeDrawer').then((module) => ({ default: module.CodeDrawer })));

export function EditorPage() {
  const navigate = useNavigate();
  const [codeOpen, setCodeOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [pageOpen, setPageOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [progress, setProgress] = useState<ArchiveProgress | null>(null);
  const project = useEditorStore((state) => state.project);
  const device = useEditorStore((state) => state.device);
  const saved = useEditorStore((state) => state.saved);
  const preview = useEditorStore((state) => state.preview);
  const past = useEditorStore((state) => state.past);
  const future = useEditorStore((state) => state.future);
  const { setDevice, undo, redo, persist, setPreview, selectPage, addPage } = useEditorStore();
  const page = getActivePage(project);
  useAutosave();
  useEffect(() => {
    function shortcuts(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() === 's') { event.preventDefault(); void persist(); }
      if (event.key.toLowerCase() === 'z') { event.preventDefault(); if (event.shiftKey) redo(); else undo(); }
    }
    window.addEventListener('keydown', shortcuts);
    return () => window.removeEventListener('keydown', shortcuts);
  }, [persist, redo, undo]);

  function newPage() { const name = window.prompt('Nome da página:', 'Nova página'); if (name?.trim()) addPage(name.trim()); }
  async function exportZip() { setProgress({progress:1,message:'Preparando exportação'}); try { await exportProjectZip(project,setProgress); } finally { setProgress(null); } }

  return <div className={`editor-shell ${preview ? 'is-preview' : ''}`}>
    <header className="editor-topbar">
      <div className="toolbar-start"><button className="icon-button" onClick={() => navigate('/')} title="Voltar"><ArrowLeft size={18}/></button><div className="editor-brand"><span>&lt;/&gt;</span><strong>WebDev Studio</strong></div><span className="toolbar-divider"/><button className="project-name"><Menu size={15}/>{project.name}</button><div className="page-switcher"><button onClick={() => setPageOpen(!pageOpen)}>Página: <strong>{page.name}</strong><span>⌄</span></button>{pageOpen ? <div className="popover page-menu">{project.pages.map((item) => <button className={item.id === page.id ? 'active' : ''} key={item.id} onClick={() => { selectPage(item.id);setPageOpen(false) }}>{item.name}{item.id === page.id ? <Check size={14}/> : null}</button>)}<button onClick={newPage}><Plus size={14}/> Nova página</button></div> : null}</div>
      </div>
      <div className="toolbar-center"><button disabled={!past.length} onClick={undo} title="Desfazer"><Undo2 size={17}/></button><button disabled={!future.length} onClick={redo} title="Refazer"><Redo2 size={17}/></button><span className="toolbar-divider"/>{(['desktop','tablet','mobile'] as const).map((item) => { const Icon = item === 'desktop' ? Monitor : item === 'tablet' ? Tablet : Smartphone; return <button key={item} className={device === item ? 'active' : ''} onClick={() => setDevice(item)} title={item}><Icon size={17}/></button> })}</div>
      <div className="toolbar-end"><button className="save-state" onClick={() => void persist()}>{saved ? <Check size={15}/> : <Save size={15}/>} {saved ? 'Salvo' : 'Salvar'}</button><button onClick={() => setPreview(!preview)}><Eye size={16}/> {preview ? 'Editar' : 'Visualizar'}</button><button onClick={() => setCodeOpen(!codeOpen)}><Code2 size={16}/> Código</button><div className="export-wrap"><button className="button primary compact" onClick={() => setExportOpen(!exportOpen)}><Download size={16}/> Exportar</button>{exportOpen ? <div className="popover export-menu"><button onClick={() => exportHtml(project, page)}><FileDown/> HTML atual</button><button onClick={() => void exportZip()}><Download/> Projeto ZIP</button><button onClick={() => void saveProjectToDirectory(project)}><FileDown/> Salvar em pasta</button><button onClick={() => exportBackup(project)}><Save/> Backup local</button></div> : null}</div><button className="icon-button" title="Configurações" onClick={()=>setSettingsOpen(true)}><Settings size={18}/></button></div>
    </header>
    <div className="editor-workspace"><LeftPanel/><Canvas/><Inspector/></div>
    <footer className="statusbar"><span className={saved ? 'status-saved' : 'status-saving'}></span>{saved ? 'Salvo localmente' : 'Salvando...'}<span className="status-spacer"/><span><Laptop size={13}/> {device === 'desktop' ? '1366 × 768' : device === 'tablet' ? '768 × 1024' : '390 × 844'}</span><span>Chrome local</span></footer>
    {codeOpen ? <Suspense fallback={<div className="code-loading">Carregando editor...</div>}><CodeDrawer onClose={() => setCodeOpen(false)}/></Suspense> : null}
    {settingsOpen ? <SettingsModal onClose={()=>setSettingsOpen(false)}/> : null}
    {progress ? <ProgressOverlay value={progress} title="Exportando projeto"/> : null}
  </div>;
}
