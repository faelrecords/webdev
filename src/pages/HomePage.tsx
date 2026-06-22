import { useEffect, useRef, useState } from 'react';
import { FileArchive, FileCode2, FolderOpen, LayoutTemplate, MoreHorizontal, Plus, Trash2, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../domain/types';
import { createProject } from '../domain/defaults';
import { deleteProject, duplicateProject, listProjects, saveProject } from '../storage/database';
import { importFiles, pickDirectory } from '../importers/projectImporter';
import { useEditorStore } from '../stores/editorStore';

export function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [menu, setMenu] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const setProject = useEditorStore((state) => state.setProject);
  const refresh = () => void listProjects().then(setProjects);
  useEffect(refresh, []);

  async function open(project: Project) { setProject(project); navigate('/editor'); }
  async function create() { const project = createProject(); await saveProject(project); await open(project); }
  async function ingest(files: FileList | File[]) { if (!files.length) return; const result = await importFiles(files); await saveProject(result.project); if (result.report.warnings.length) window.alert(`Importação concluída.\n\n${result.report.warnings.join('\n')}`); await open(result.project); }
  async function chooseFolder() {
    const files = await pickDirectory();
    if (files.length) await ingest(files); else folderInput.current?.click();
  }

  return <div className="home-shell">
    <header className="home-header"><Brand /><div className="home-actions"><button className="button ghost" onClick={() => fileInput.current?.click()}><Upload size={16}/> Importar</button><button className="button primary" onClick={create}><Plus size={17}/> Novo projeto</button></div></header>
    <main className="home-main">
      <section className="home-intro"><h1>Crie sites visualmente.</h1><p>Importe HTML ou comece do zero. Tudo fica salvo neste navegador.</p></section>
      <section className="start-grid">
        <StartCard icon={<LayoutTemplate/>} title="Projeto vazio" text="Crie site responsivo do zero." onClick={create}/>
        <StartCard icon={<FileCode2/>} title="Importar HTML" text="Abra arquivo único completo." onClick={() => fileInput.current?.click()}/>
        <StartCard icon={<FolderOpen/>} title="Importar pasta" text="Mantenha arquivos e ativos." onClick={chooseFolder}/>
        <StartCard icon={<FileArchive/>} title="Importar ZIP" text="Restaure projeto compactado." onClick={() => fileInput.current?.click()}/>
      </section>
      <section className="recent-section"><div className="section-heading"><h2>Projetos recentes</h2><span>{projects.length} {projects.length === 1 ? 'projeto' : 'projetos'}</span></div>
        {projects.length ? <div className="project-grid">{projects.map((project) => <article className="project-card" key={project.id} onDoubleClick={() => open(project)}>
          <button className="project-preview" onClick={() => open(project)}><div className="mini-page"><span/><b>{project.name}</b><i/><i/><i/></div></button>
          <div className="project-meta"><div><strong>{project.name}</strong><small>Editado {new Date(project.updatedAt).toLocaleDateString('pt-BR')}</small></div><button className="icon-button" onClick={() => setMenu(menu === project.id ? null : project.id)} aria-label="Mais opções"><MoreHorizontal size={18}/></button></div>
          {menu === project.id ? <div className="project-menu"><button onClick={() => open(project)}>Abrir</button><button onClick={async()=>{await duplicateProject(project.id);refresh();setMenu(null)}}>Duplicar</button><button className="danger" onClick={async()=>{await deleteProject(project.id);refresh();setMenu(null)}}><Trash2 size={14}/> Excluir</button></div> : null}
        </article>)}</div> : <div className="empty-projects"><LayoutTemplate/><h3>Nenhum projeto local</h3><p>Crie ou importe primeiro projeto.</p></div>}
      </section>
    </main>
    <input ref={fileInput} hidden type="file" accept=".html,.htm,.zip,.json" multiple onChange={(event) => event.target.files && void ingest(event.target.files)}/>
    <input ref={folderInput} hidden type="file" multiple {...({ webkitdirectory: '' } as React.InputHTMLAttributes<HTMLInputElement>)} onChange={(event) => event.target.files && void ingest(event.target.files)}/>
  </div>;
}

function Brand() { return <div className="brand-lockup"><span>&lt;/&gt;</span><strong>WebDev Studio</strong></div> }
function StartCard({ icon, title, text, onClick }: { icon: React.ReactNode; title: string; text: string; onClick(): void }) { return <button className="start-card" onClick={onClick}><span>{icon}</span><div><strong>{title}</strong><small>{text}</small></div></button> }
