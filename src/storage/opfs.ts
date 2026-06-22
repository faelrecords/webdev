const rootFolder = 'webdev-studio-assets';

type OpfsRoot = FileSystemDirectoryHandle & {
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<OpfsRoot>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle & { createWritable(): Promise<FileSystemWritableFileStream> }>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
};

export function supportsOpfs() {
  return typeof navigator !== 'undefined' && 'storage' in navigator && typeof navigator.storage.getDirectory === 'function';
}

async function projectDirectory(projectId: string, create = true) {
  const root = await navigator.storage.getDirectory() as OpfsRoot;
  const base = await root.getDirectoryHandle(rootFolder, { create });
  return base.getDirectoryHandle(projectId, { create });
}

export async function writeProjectBlob(projectId: string, storageKey: string, blob: Blob) {
  const directory = await projectDirectory(projectId);
  const handle = await directory.getFileHandle(storageKey, { create: true });
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

export async function readProjectBlob(projectId: string, storageKey: string) {
  const directory = await projectDirectory(projectId, false);
  return (await directory.getFileHandle(storageKey)).getFile();
}

export async function removeProjectBlobs(projectId: string) {
  if (!supportsOpfs()) return;
  const root = await navigator.storage.getDirectory() as OpfsRoot;
  try {
    const base = await root.getDirectoryHandle(rootFolder);
    await base.removeEntry(projectId, { recursive: true });
  } catch (error) {
    if (!(error instanceof DOMException) || error.name !== 'NotFoundError') throw error;
  }
}
