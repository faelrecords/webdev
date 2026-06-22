import { openDB, type DBSchema } from 'idb';
import type { PageDocument, Project, ProjectFile } from '../domain/types';
import { readProjectBlob, removeProjectBlobs, supportsOpfs, writeProjectBlob } from './opfs';

const opfsThreshold = 2 * 1024 * 1024;
type StoredProject = Omit<Project, 'pages' | 'files'> & { pages: []; files: [] };
type StoredPage = { key: string; projectId: string; page: PageDocument };
type StoredFile = { key: string; projectId: string; file: ProjectFile };

interface StudioDB extends DBSchema {
  projects: { key: string; value: StoredProject | Project; indexes: { 'by-updated': number } };
  pages: { key: string; value: StoredPage; indexes: { 'by-project': string } };
  files: { key: string; value: StoredFile; indexes: { 'by-project': string } };
  settings: { key: string; value: unknown };
}

const persistedPages = new WeakSet<PageDocument>();
const persistedFiles = new WeakSet<ProjectFile>();

const database = openDB<StudioDB>('webdev-studio', 2, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('projects')) {
      const projects = db.createObjectStore('projects', { keyPath: 'id' });
      projects.createIndex('by-updated', 'updatedAt');
    }
    if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings');
    if (!db.objectStoreNames.contains('pages')) {
      const pages = db.createObjectStore('pages', { keyPath: 'key' });
      pages.createIndex('by-project', 'projectId');
    }
    if (!db.objectStoreNames.contains('files')) {
      const files = db.createObjectStore('files', { keyPath: 'key' });
      files.createIndex('by-project', 'projectId');
    }
  },
});

const pageKey = (projectId: string, pageId: string) => `${projectId}\u0000${pageId}`;
const fileKey = (projectId: string, path: string) => `${projectId}\u0000${path}`;

export async function saveProject(project: Project) {
  return withProjectLock(project.id, () => saveProjectUnlocked(project));
}

async function saveProjectUnlocked(project: Project) {
  await storeLargeBlobs(project);
  const db = await database;
  const tx = db.transaction(['projects', 'pages', 'files'], 'readwrite');
  const metadata: StoredProject = structuredClone({
    id: project.id, name: project.name, createdAt: project.createdAt, updatedAt: project.updatedAt,
    activePageId: project.activePageId, templates: project.templates, settings: project.settings,
    version: project.version, pages: [], files: [],
  });
  await tx.objectStore('projects').put(metadata);

  const pageStore = tx.objectStore('pages');
  const desiredPages = new Set(project.pages.map((page) => pageKey(project.id, page.id)));
  const oldPages = await pageStore.index('by-project').getAllKeys(project.id);
  await Promise.all(oldPages.filter((key) => !desiredPages.has(String(key))).map((key) => pageStore.delete(key)));
  for (const page of project.pages) {
    if (persistedPages.has(page)) continue;
    await pageStore.put({ key: pageKey(project.id, page.id), projectId: project.id, page: structuredClone(page) });
    persistedPages.add(page);
  }

  const fileStore = tx.objectStore('files');
  const desiredFiles = new Set(project.files.map((file) => fileKey(project.id, file.path)));
  const oldFiles = await fileStore.index('by-project').getAllKeys(project.id);
  await Promise.all(oldFiles.filter((key) => !desiredFiles.has(String(key))).map((key) => fileStore.delete(key)));
  for (const file of project.files) {
    if (persistedFiles.has(file)) continue;
    const stored = structuredClone(file);
    if (stored.storageKey) delete stored.blob;
    await fileStore.put({ key: fileKey(project.id, file.path), projectId: project.id, file: stored });
    persistedFiles.add(file);
  }
  await tx.done;
  return project.id;
}

export async function loadProject(id: string) {
  const db = await database;
  const record = await db.get('projects', id);
  if (!record) return undefined;
  if (record.pages.length) {
    await saveProject(record);
    return hydrateProject(record);
  }
  const project = await assembleProject(record as StoredProject, true);
  markPersisted(project);
  return project;
}

export async function listProjects() {
  const db = await database;
  const records = (await db.getAllFromIndex('projects', 'by-updated')).reverse();
  return Promise.all(records.map(async (record) => record.pages.length ? record : assembleProject(record as StoredProject, false)));
}

export async function deleteProject(id: string) {
  const db = await database;
  const tx = db.transaction(['projects', 'pages', 'files'], 'readwrite');
  const pages = await tx.objectStore('pages').index('by-project').getAllKeys(id);
  const files = await tx.objectStore('files').index('by-project').getAllKeys(id);
  await Promise.all([tx.objectStore('projects').delete(id), ...pages.map((key) => tx.objectStore('pages').delete(key)), ...files.map((key) => tx.objectStore('files').delete(key))]);
  await tx.done;
  await removeProjectBlobs(id);
}

export async function duplicateProject(id: string) {
  const source = await loadProject(id);
  if (!source) return undefined;
  const copy = structuredClone(source);
  copy.id = crypto.randomUUID();
  copy.name = `${copy.name} — cópia`;
  copy.createdAt = Date.now();
  copy.updatedAt = Date.now();
  copy.files.forEach((file) => { delete file.storageKey; file.modified = true; });
  await saveProject(copy);
  return copy;
}

async function assembleProject(record: StoredProject, hydrate: boolean): Promise<Project> {
  const db = await database;
  const [pages, files] = await Promise.all([
    db.getAllFromIndex('pages', 'by-project', record.id),
    db.getAllFromIndex('files', 'by-project', record.id),
  ]);
  const project = { ...record, pages: pages.map((item) => item.page), files: files.map((item) => item.file) } as Project;
  return hydrate ? hydrateProject(project) : project;
}

async function hydrateProject(project: Project) {
  if (!supportsOpfs()) return project;
  await Promise.all(project.files.map(async (file) => {
    if (!file.storageKey || file.blob) return;
    try { file.blob = await readProjectBlob(project.id, file.storageKey); }
    catch { delete file.storageKey; }
  }));
  return project;
}

async function storeLargeBlobs(project: Project) {
  if (!supportsOpfs()) return;
  for (const file of project.files) {
    if (!file.blob || file.blob.size < opfsThreshold) continue;
    file.storageKey ??= crypto.randomUUID();
    if (file.modified || !await opfsBlobExists(project.id, file.storageKey)) await writeProjectBlob(project.id, file.storageKey, file.blob);
    file.modified = false;
  }
}

function markPersisted(project: Project) {
  project.pages.forEach((page) => persistedPages.add(page));
  project.files.forEach((file) => persistedFiles.add(file));
}

async function opfsBlobExists(projectId: string, storageKey: string) {
  try { await readProjectBlob(projectId, storageKey); return true; }
  catch { return false; }
}

let fallbackSaveQueue = Promise.resolve();
function withProjectLock<T>(projectId: string, task: () => Promise<T>) {
  if (navigator.locks) return navigator.locks.request(`webdev-project-${projectId}`, task);
  const result = fallbackSaveQueue.then(task, task);
  fallbackSaveQueue = result.then(() => undefined, () => undefined);
  return result;
}
