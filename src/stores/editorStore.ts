import { create } from 'zustand';
import type { Device, EditorTab, HistoryEntry, InspectorTab, Project, SelectedElement } from '../domain/types';
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
  updatePage(change: Partial<{ html: string; css: string; javascript: string; name: string }>, label: string, record?: boolean): void;
  addPage(name: string): void;
  addAssets(files: File[]): Promise<void>;
  updateSettings(change: Partial<Project['settings']>): void;
  addTemplate(name: string, html: string): void;
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
    const project = structuredClone(state.project);
    const page = currentPage(project);
    const past = record ? [...state.past, { label, html: page.html, css: page.css, timestamp: Date.now() }].slice(-80) : state.past;
    Object.assign(page, change);
    project.updatedAt = Date.now();
    return { project, past, future: record ? [] : state.future, saved: false };
  }),
  addPage: (name) => set((state) => {
    const project = structuredClone(state.project);
    const id = crypto.randomUUID();
    project.pages.push({ id, name, path: `${name.toLowerCase().replace(/\s+/g, '-')}.html`, html: '<main><section><h1>Nova página</h1><p>Comece adicionando elementos.</p></section></main>', css: 'body{font-family:Inter,system-ui,sans-serif;margin:0}section{padding:80px 24px;max-width:1180px;margin:auto}', javascript: '' });
    project.activePageId = id;
    project.updatedAt = Date.now();
    return { project, selected: null, past: [], future: [], saved: false };
  }),
  addAssets: async (files) => {
    const assets = await Promise.all(files.map(async (file) => ({ path: `assets/${file.name}`, name: file.name, type: file.type || 'application/octet-stream', size: file.size, blob: file, modified: true })));
    set((state) => ({ project: { ...state.project, files: [...state.project.files.filter((current) => !assets.some((asset) => asset.path === current.path)), ...assets], updatedAt: Date.now() }, saved: false }));
  },
  updateSettings: (change) => set((state) => ({ project: { ...state.project, settings: { ...state.project.settings, ...change }, updatedAt: Date.now() }, saved: false })),
  addTemplate: (name, html) => set((state) => ({ project: { ...state.project, templates: [...(state.project.templates ?? []), { id: crypto.randomUUID(), name, html, createdAt: Date.now() }], updatedAt: Date.now() }, saved: false })),
  selectPage: (id) => set((state) => ({ project: { ...state.project, activePageId: id }, selected: null, past: [], future: [] })),
  undo: () => set((state) => {
    const entry = state.past.at(-1);
    if (!entry) return state;
    const project = structuredClone(state.project);
    const page = currentPage(project);
    const future = [{ label: entry.label, html: page.html, css: page.css, timestamp: Date.now() }, ...state.future];
    page.html = entry.html; page.css = entry.css;
    return { project, past: state.past.slice(0, -1), future, selected: null, saved: false };
  }),
  redo: () => set((state) => {
    const entry = state.future[0];
    if (!entry) return state;
    const project = structuredClone(state.project);
    const page = currentPage(project);
    const past = [...state.past, { label: entry.label, html: page.html, css: page.css, timestamp: Date.now() }];
    page.html = entry.html; page.css = entry.css;
    return { project, past, future: state.future.slice(1), selected: null, saved: false };
  }),
  restoreHistory: (index) => set((state) => {
    const entry = state.past[index];
    if (!entry) return state;
    const project = structuredClone(state.project);
    const page = currentPage(project);
    const future = [{ label: 'Estado atual', html: page.html, css: page.css, timestamp: Date.now() }, ...state.past.slice(index + 1).reverse(), ...state.future];
    page.html = entry.html; page.css = entry.css;
    return { project, past: state.past.slice(0, index), future, selected: null, saved: false };
  }),
  persist: async () => {
    const project = get().project;
    await saveProject(project);
    set({ saved: true });
  },
}));

export function getActivePage(project: Project) {
  return currentPage(project);
}
