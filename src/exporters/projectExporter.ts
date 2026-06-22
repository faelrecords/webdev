import { strToU8, zipSync } from 'fflate';
import type { PageDocument, Project } from '../domain/types';

function fullHtml(page: PageDocument, executeScripts = true) {
  return `<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>${page.name}</title>\n<style>\n${page.css}\n</style>\n</head>\n<body>\n${page.html}\n${executeScripts && page.javascript ? `<script>\n${page.javascript}\n</script>` : ''}\n</body>\n</html>`;
}

export function exportHtml(project: Project, page: PageDocument) {
  download(new Blob([fullHtml(page)], { type: 'text/html;charset=utf-8' }), page.path.split('/').pop() ?? 'index.html');
}

export async function exportProjectZip(project: Project) {
  const entries: Record<string, Uint8Array> = {};
  for (const page of project.pages) entries[page.path] = strToU8(fullHtml(page));
  for (const file of project.files) {
    if (file.text !== undefined) entries[file.path] = strToU8(file.text);
    else if (file.blob) entries[file.path] = new Uint8Array(await file.blob.arrayBuffer());
  }
  const bytes = zipSync(entries, { level: 6 });
  download(new Blob([bytes], { type: 'application/zip' }), `${slug(project.name)}.zip`);
}

type WritableFileHandle = FileSystemFileHandle & { createWritable(): Promise<{ write(data: Blob|string): Promise<void>; close(): Promise<void> }> };
type WritableDirectoryHandle = FileSystemDirectoryHandle & { getDirectoryHandle(name:string,options:{create:boolean}):Promise<WritableDirectoryHandle>; getFileHandle(name:string,options:{create:boolean}):Promise<WritableFileHandle> };

export async function saveProjectToDirectory(project: Project) {
  if (!('showDirectoryPicker' in window)) {
    await exportProjectZip(project);
    return 'zip' as const;
  }
  const root = await (window as unknown as { showDirectoryPicker(): Promise<WritableDirectoryHandle> }).showDirectoryPicker();
  async function write(path:string,data:Blob|string) {
    const parts=path.split('/').filter(Boolean);const filename=parts.pop();if(!filename)return;
    let directory=root;
    for(const part of parts)directory=await directory.getDirectoryHandle(part,{create:true});
    const handle=await directory.getFileHandle(filename,{create:true});const writable=await handle.createWritable();await writable.write(data);await writable.close();
  }
  for(const page of project.pages)await write(page.path,fullHtml(page));
  for(const file of project.files)await write(file.path,file.text??file.blob??'');
  return 'directory' as const;
}

export function exportBackup(project: Project) {
  download(new Blob([JSON.stringify(project)], { type: 'application/json' }), `${slug(project.name)}.webdev.json`);
}

function slug(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'projeto';
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export { fullHtml };
