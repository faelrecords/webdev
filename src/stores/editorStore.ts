import { create } from 'zustand';
import type { Device, EditorTab, HistoryEntry, InspectorTab, PageDocument, Project, SelectedElement } from '../domain/types';
import { createProject } from '../domain/defaults';
import { saveProject } from '../storage/database';

interface EditorState {
  project: Project;
  device: Device;
  leftTab: EditorTab;
  inspectorTab: InspectorTab;
  selected: SelectedElement | null;
  past: HistoryEntry[];
  future: HistoryEntry[];
  zoom: number;
  saved: boolean;
  preview: boolean;
  setProject(project: Project): void;
  setDevice(device: Device): void;
  setLeftTab(tab: EditorTab): void;
  setInspectorTab(tab: InspectorTab): void;
  setSelected(element: SelectedElement | null): void;
  setZoom(zoom: number): void;
  setPreview(preview: boolean): void;
  updatePage(change: Partial<PageDocument>, label: string, record?: boolean): void;
  addPage(name: string): void;
  duplicatePage(id:string): void;
  deletePage(id:string): void;
  movePage(id:string,direction:-1|1): void;
  addAssets(files: File[]): Promise<void>;
  renameAsset(path:string,nextPath:string): void;
  deleteAsset(path:string): void;
  updateSettings(change: Partial<Project['settings']>): void;
  addTemplate(name: string, html: string, css?:string): void;
  selectPage(id: string): void;
  undo(): void;
  redo(): void;
  restoreHistory(index: number): void;
  persist(): Promise<void>;
}

function currentPage(project: Project) {
  return project.pages.find((page) => page.id === project.activePageId) ?? project.pages[0]!;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  project: createProject(), device: 'desktop', leftTab: 'elements', inspectorTab: 'style', selected: null,
  past: [], future: [], zoom: .62, saved: true, preview: false,
  setProject: (project) => set({ project, past: [], future: [], selected: null, saved: true }),
  setDevice: (device) => set({ device }),
  setLeftTab: (leftTab) => set({ leftTab }),
  setInspectorTab: (inspectorTab) => set({ inspectorTab }),
  setSelected: (selected) => set({ selected }),
  setZoom: (zoom) => set({ zoom: Math.min(1.5, Math.max(0.35, zoom)) }),
  setPreview: (preview) => set({ preview, selected: preview ? null : get().selected }),
  updatePage: (change, label, record = true) => set((state) => {
    const original = currentPage(state.project);
    const before = Object.fromEntries(Object.keys(change).map((key) => [key, original[key as keyof typeof change]]));
    const page = { ...original, ...change };
    let project = { ...state.project, pages: state.project.pages.map((item) => item.id === page.id ? page : item), updatedAt: Date.now() };
    if (change.html?.includes('data-wd-component')) project = synchronizeComponents(project, page.id);
    const previous = state.past.at(-1);
    const coalesce = record && previous?.label === label && previous.pageId === page.id && Date.now() - previous.timestamp < 500;
    const past = !record ? state.past : coalesce
      ? [...state.past.slice(0, -1), { ...previous, after: { ...previous.after, ...change }, timestamp: Date.now() }]
      : [...state.past, { label, pageId: page.id, before, after: change, timestamp: Date.now() }].slice(-80);
    return { project, past, future: record ? [] : state.future, saved: false };
  }),
  addPage: (name) => set((state) => {
    const id = crypto.randomUUID();
    const page = { id, name, path: `${name.toLowerCase().replace(/\s+/g, '-')}.html`, html: '<main><section><h1>Nova página</h1><p>Comece adicionando elementos.</p></section></main>', css: 'body{font-family:Inter,system-ui,sans-serif;margin:0}section{padding:80px 24px;max-width:1180px;margin:auto}', javascript: '' };
    const project = { ...state.project, pages: [...state.project.pages, page], activePageId: id, updatedAt: Date.now() };
    return { project, selected: null, past: [], future: [], saved: false };
  }),
  duplicatePage:(id)=>set(state=>{const source=state.project.pages.find(page=>page.id===id);if(!source)return state;const copy={...structuredClone(source),id:crypto.randomUUID(),name:`${source.name} — cópia`,path:uniquePagePath(state.project.pages,source.path)};return{project:{...state.project,pages:[...state.project.pages,copy],activePageId:copy.id,updatedAt:Date.now()},selected:null,past:[],future:[],saved:false}}),
  deletePage:(id)=>set(state=>{if(state.project.pages.length===1)return state;const pages=state.project.pages.filter(page=>page.id!==id);return{project:{...state.project,pages,activePageId:state.project.activePageId===id?pages[0]!.id:state.project.activePageId,updatedAt:Date.now()},selected:null,past:[],future:[],saved:false}}),
  movePage:(id,direction)=>set(state=>{const pages=[...state.project.pages];const index=pages.findIndex(page=>page.id===id);const target=index+direction;if(index<0||target<0||target>=pages.length)return state;[pages[index],pages[target]]=[pages[target]!,pages[index]!];return{project:{...state.project,pages,updatedAt:Date.now()},saved:false}}),
  addAssets: async (files) => {
    const assets = await Promise.all(files.map(async (file) => ({ path: `assets/${file.name}`, name: file.name, type: file.type || 'application/octet-stream', size: file.size, blob: file, modified: true })));
    set((state) => ({ project: { ...state.project, files: [...state.project.files.filter((current) => !assets.some((asset) => asset.path === current.path)), ...assets], updatedAt: Date.now() }, saved: false }));
  },
  renameAsset:(path,nextPath)=>set(state=>{const normalized=nextPath.replace(/\\/g,'/').replace(/^\/+/, '');if(!normalized||state.project.files.some(file=>file.path===normalized))return state;const files=state.project.files.map(file=>file.path===path?{...file,path:normalized,name:normalized.split('/').pop()??normalized,modified:true}:file);const pages=state.project.pages.map(page=>({...page,html:page.html.split(path).join(normalized),css:page.css.split(path).join(normalized),javascript:page.javascript.split(path).join(normalized)}));return{project:{...state.project,files,pages,updatedAt:Date.now()},saved:false}}),
  deleteAsset:(path)=>set(state=>({project:{...state.project,files:state.project.files.filter(file=>file.path!==path),updatedAt:Date.now()},saved:false})),
  updateSettings: (change) => set((state) => ({ project: { ...state.project, settings: { ...state.project.settings, ...change }, updatedAt: Date.now() }, saved: false })),
  addTemplate: (name, html,css) => set((state) => {const doc=new DOMParser().parseFromString(html,'text/html');const root=doc.body.firstElementChild;root?.classList.remove('wd-selected');root?.removeAttribute('draggable');const componentId=root?.getAttribute('data-wd-component');return { project: { ...state.project, templates: [...(state.project.templates ?? []), { id: componentId??crypto.randomUUID(), name, html:root?.outerHTML??html,...(css?{css}:{}), global:Boolean(componentId), createdAt: Date.now() }], updatedAt: Date.now() }, saved: false }}),
  selectPage: (id) => set((state) => ({ project: { ...state.project, activePageId: id }, selected: null, past: [], future: [] })),
  undo: () => set((state) => {
    const entry = state.past.at(-1);
    if (!entry) return state;
    const project = applyHistory(state.project, entry.pageId, entry.before);
    const future = [entry, ...state.future];
    return { project, past: state.past.slice(0, -1), future, selected: null, saved: false };
  }),
  redo: () => set((state) => {
    const entry = state.future[0];
    if (!entry) return state;
    const project = applyHistory(state.project, entry.pageId, entry.after);
    const past = [...state.past, entry];
    return { project, past, future: state.future.slice(1), selected: null, saved: false };
  }),
  restoreHistory: (index) => set((state) => {
    const entry = state.past[index];
    if (!entry) return state;
    let project = state.project;
    const entries = state.past.slice(index).reverse();
    entries.forEach((item) => { project = applyHistory(project, item.pageId, item.before); });
    return { project, past: state.past.slice(0, index), future: [...entries.reverse(), ...state.future], selected: null, saved: false };
  }),
  persist: async () => {
    const project = get().project;
    await saveProject(project);
    if (get().project.updatedAt === project.updatedAt) set({ saved: true });
  },
}));

export function getActivePage(project: Project) {
  return currentPage(project);
}

function applyHistory(project: Project, pageId: string, change: HistoryEntry['before']) {
  return { ...project, pages: project.pages.map((page) => page.id === pageId ? { ...page, ...change } : page), activePageId: pageId, updatedAt: Date.now() };
}

function synchronizeComponents(project: Project, sourcePageId: string): Project {
  const sourcePage=project.pages.find(page=>page.id===sourcePageId);
  if(!sourcePage)return project;
  const sourceDoc=new DOMParser().parseFromString(sourcePage.html,'text/html');
  const components=[...sourceDoc.querySelectorAll<HTMLElement>('[data-wd-component]')];
  if(!components.length)return project;
  const pages=project.pages.map(page=>{
    if(page.id===sourcePageId)return page;
    const doc=new DOMParser().parseFromString(page.html,'text/html');let changed=false;
    for(const source of components){const id=source.dataset.wdComponent;const target=id?doc.querySelector<HTMLElement>(`[data-wd-component="${CSS.escape(id)}"]`):null;if(!target)continue;const clone=source.cloneNode(true) as HTMLElement;clone.dataset.wdId=target.dataset.wdId??crypto.randomUUID();clone.querySelectorAll<HTMLElement>('[data-wd-id]').forEach(node=>node.dataset.wdId=crypto.randomUUID());target.replaceWith(clone);changed=true}
    return changed?{...page,html:doc.body.innerHTML}:page;
  });
  const templates=project.templates.map(template=>{const source=components.find(component=>component.dataset.wdComponent===template.id);return source?{...template,html:source.outerHTML}:template});
  return {...project,pages,templates};
}

function uniquePagePath(pages:Project['pages'],path:string){const extension=path.match(/\.[^.]+$/)?.[0]??'.html';const base=path.slice(0,-extension.length);let candidate=`${base}-copia${extension}`;let index=2;while(pages.some(page=>page.path===candidate))candidate=`${base}-copia-${index++}${extension}`;return candidate}
