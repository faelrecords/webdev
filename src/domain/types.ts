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
  storageKey?: string;
  modified: boolean;
}

export interface PageDocument {
  id: string;
  name: string;
  path: string;
  html: string;
  css: string;
  javascript: string;
  headCode?: string;
  seo?: { title?: string; description?: string; keywords?: string; canonical?: string; ogImage?: string; noindex?: boolean };
}

export interface ProjectSettings {
  breakpoints: { mobile: number; tablet: number; desktop: number };
  executeScripts: boolean;
  autoResponsive: boolean;
  locale: 'pt-BR';
  faviconPath?: string;
  globalHeadCode?: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  activePageId: string;
  pages: PageDocument[];
  files: ProjectFile[];
  templates: { id: string; name: string; html: string; css?: string; global?: boolean; createdAt: number }[];
  settings: ProjectSettings;
  version: 1;
}

export interface HistoryEntry {
  label: string;
  pageId: string;
  before: Partial<PageDocument>;
  after: Partial<PageDocument>;
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
