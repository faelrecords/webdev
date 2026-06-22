import { openDB, type DBSchema } from 'idb';
import type { Project } from '../domain/types';
import { readProjectBlob, removeProjectBlobs, supportsOpfs, writeProjectBlob } from './opfs';

const opfsThreshold = 2 * 1024 * 1024;

interface StudioDB extends DBSchema {
  projects: { key: string; value: Project; indexes: { 'by-updated': number } };
  settings: { key: string; value: unknown };
}

const database = openDB<StudioDB>('webdev-studio', 1, {
  upgrade(db) {
    const projects = db.createObjectStore('projects', { keyPath: 'id' });
    projects.createIndex('by-updated', 'updatedAt');
    db.createObjectStore('settings');
  },
});

export async function saveProject(project: Project) {
  if (supportsOpfs()) {
    for (const file of project.files) {
      if (!file.blob || file.blob.size < opfsThreshold) continue;
      file.storageKey ??= crypto.randomUUID();
      if (file.modified || !await opfsBlobExists(project.id, file.storageKey)) await writeProjectBlob(project.id, file.storageKey, file.blob);
      file.modified = false;
    }
  }
  const stored = structuredClone(project);
  if (supportsOpfs()) for (const file of stored.files) if (file.storageKey) delete file.blob;
  return (await database).put('projects', stored);
}

export async function loadProject(id: string) {
  const project = await (await database).get('projects', id);
  if (!project || !supportsOpfs()) return project;
  await Promise.all(project.files.map(async (file) => {
    if (!file.storageKey || file.blob) return;
    try { file.blob = await readProjectBlob(project.id, file.storageKey); }
    catch { delete file.storageKey; }
  }));
  return project;
}

export async function listProjects() {
  const values = await (await database).getAllFromIndex('projects', 'by-updated');
  return values.reverse();
}

export async function deleteProject(id: string) {
  await Promise.all([(await database).delete('projects', id), removeProjectBlobs(id)]);
}

export async function duplicateProject(id: string) {
  const source = await loadProject(id);
  if (!source) return undefined;
  const copy = structuredClone(source);
  copy.id = crypto.randomUUID();
  copy.name = `${copy.name} — cópia`;
  copy.createdAt = Date.now();
  copy.updatedAt = Date.now();
  await saveProject(copy);
  return copy;
}

async function opfsBlobExists(projectId: string, storageKey: string) {
  try { await readProjectBlob(projectId, storageKey); return true; }
  catch { return false; }
}
