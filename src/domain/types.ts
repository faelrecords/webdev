export type Device = 'desktop' | 'tablet' | 'mobile';
export type EditorTab = 'elements' | 'layers' | 'files' | 'templates' | 'history';
export type InspectorTab = 'content' | 'style' | 'advanced';

export interface ProjectFile {
  path: string;
  name: string;
  type: string;
  size: number;
  text?: string;
  blob?: Blob;
  modified: boolean;
}

export interface PageDocument {
  id: string;
  name: string;
  path: string;
  html: string;
  css: string;
  javascript: string;
}

export interface ProjectSettings {
  breakpoints: { mobile: number; tablet: number; desktop: number };
  executeScripts: boolean;
  autoResponsive: boolean;
  locale: 'pt-BR';
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  activePageId: string;
  pages: PageDocument[];
  files: ProjectFile[];
  templates: { id: string; name: string; html: string; createdAt: number }[];
  settings: ProjectSettings;
  version: 1;
}

export interface HistoryEntry {
  label: string;
  html: string;
  css: string;
  timestamp: number;
}

export interface SelectedElement {
  id: string;
  tagName: string;
  text: string;
  className: string;
  attributes: Record<string, string>;
  styles: Record<string, string>;
}

export interface ImportReport {
  pages: number;
  assets: number;
  warnings: string[];
  mode: 'visual' | 'compatibility';
}
