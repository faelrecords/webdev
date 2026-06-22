import { openDB, type DBSchema } from 'idb';
import type { Project } from '../domain/types';

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
  return (await database).put('projects', project);
}

export async function loadProject(id: string) {
  return (await database).get('projects', id);
}

export async function listProjects() {
  const values = await (await database).getAllFromIndex('projects', 'by-updated');
  return values.reverse();
}

export async function deleteProject(id: string) {
  return (await database).delete('projects', id);
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
