import { nanoid } from 'nanoid';
import type { ImportReport, PageDocument, Project, ProjectFile } from '../domain/types';
import { createProject } from '../domain/defaults';
import { applySafeResponsiveFixes } from '../utils/responsive';
import { unzipArchive, type ArchiveProgress } from '../workers/archiveClient';

const textTypes = /(?:html?|css|js|mjs|json|txt|md|svg|xml)$/i;

function splitHtml(source: string, files = new Map<string, ProjectFile>(), htmlPath = '') {
  const doc = new DOMParser().parseFromString(source, 'text/html');
  const base = htmlPath.includes('/') ? htmlPath.slice(0, htmlPath.lastIndexOf('/') + 1) : '';
  const resolve = (path: string) => {
    const stack: string[] = [];
    for (const segment of `${base}${path}`.split('/')) {
      if (segment === '..') stack.pop();
      else if (segment !== '.') stack.push(segment);
    }
    return stack.join('/');
  };
  const styleLinks=[...doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]')];
  const externalStyles=styleLinks.map(node=>{const content=files.get(resolve(node.getAttribute('href')??''))?.text;if(content!==undefined)node.remove();return content??''}).join('\n');
  const inlineStyles=[...doc.querySelectorAll('style')];const styles=[inlineStyles.map(node=>node.textContent??'').join('\n'),externalStyles].filter(Boolean).join('\n');inlineStyles.forEach(node=>node.remove());
  const scripts:string[]=[];doc.querySelectorAll<HTMLScriptElement>('script').forEach(node=>{if(node.type==='module')return;const sourcePath=node.getAttribute('src');if(sourcePath){const content=files.get(resolve(sourcePath))?.text;if(content===undefined)return;scripts.push(content)}else scripts.push(node.textContent??'');node.remove()});
  const title=doc.title;const description=doc.querySelector<HTMLMetaElement>('meta[name="description"]')?.content;const keywords=doc.querySelector<HTMLMetaElement>('meta[name="keywords"]')?.content;const canonical=doc.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.getAttribute('href')??undefined;const ogImage=doc.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content;const noindex=/noindex/i.test(doc.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content??'');
  const seo={...(title?{title}:{}),...(description?{description}:{}),...(keywords?{keywords}:{}),...(canonical?{canonical}:{}),...(ogImage?{ogImage}:{}),...(noindex?{noindex:true}: {})};
  doc.head.querySelectorAll('title,meta[name="description"],meta[name="keywords"],meta[name="robots"],meta[property="og:image"],link[rel="canonical"],meta[charset],meta[name="viewport"]').forEach(node=>node.remove());
  return { html: doc.body.innerHTML, css: styles, javascript: scripts.join('\n'), headCode:doc.head.innerHTML, seo };
}

function toProjectFile(file: File, text?: string): ProjectFile {
  const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
  return { path, name: file.name, type: file.type || 'application/octet-stream', size: file.size, ...(text === undefined ? { blob: file } : { text }), modified: false };
}

function readText(file: File) {
  if (typeof file.text === 'function') return file.text();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsText(file);
  });
}

export async function importFiles(files: FileList | File[], onProgress?: (progress: ArchiveProgress) => void): Promise<{ project: Project; report: ImportReport }> {
  const input = Array.from(files);
  const backup = input.find((file) => /\.webdev\.json$/i.test(file.name));
  if (backup) {
    const parsed = JSON.parse(await readText(backup)) as Omit<Project,'files'>&{files:(ProjectFile&{dataUrl?:string})[]};
    if (!parsed.id || !Array.isArray(parsed.pages) || parsed.version !== 1) throw new Error('Backup WebDev inválido.');
    parsed.templates ??= [];
    await Promise.all(parsed.files.map(async file=>{if(file.dataUrl){file.blob=await(await fetch(file.dataUrl)).blob();delete file.dataUrl}}));
    parsed.updatedAt = Date.now();
    return { project: parsed, report: { pages: parsed.pages.length, assets: parsed.files.length, warnings: [], mode: 'visual' } };
  }
  const expanded: ProjectFile[] = [];
  for (const file of input.filter(file=>/\.zip$/i.test(file.name))) {
    if (/\.zip$/i.test(file.name)) {
      const content = await unzipArchive(file, onProgress);
      for (const entry of content) {
        const extension = entry.path.split('.').pop() ?? '';
        const size = entry.text === undefined ? entry.blob!.size : new Blob([entry.text]).size;
        expanded.push({ path: entry.path, name: entry.path.split('/').pop() ?? entry.path, type: '', size, ...(textTypes.test(extension) ? { text: entry.text ?? '' } : { blob: entry.blob! }), modified: false });
      }
    }
  }
  const plain=input.filter(file=>!/\.zip$/i.test(file.name));
  for(let offset=0;offset<plain.length;offset+=100){const batch=plain.slice(offset,offset+100);expanded.push(...await Promise.all(batch.map(async file=>toProjectFile(file,textTypes.test(file.name)?await readText(file):undefined))));onProgress?.({progress:Math.round(((offset+batch.length)/plain.length)*90),message:`Lendo ${Math.min(offset+batch.length,plain.length)} de ${plain.length}`})}
  const htmlFiles = expanded.filter((file) => /\.html?$/i.test(file.path));
  const filesByPath = new Map(expanded.map((file) => [file.path, file]));
  const pages: PageDocument[] = htmlFiles.map((file) => {
    const parsed = splitHtml(file.text ?? '', filesByPath, file.path);
    return { id: nanoid(), name: file.name.replace(/\.html?$/i, ''), path: file.path, ...parsed, css: applySafeResponsiveFixes(parsed.css) };
  });
  const project = createProject(input[0]?.name.replace(/\.(html?|zip)$/i, '') || 'Projeto importado');
  if (pages.length) {
    project.pages = pages;
    project.activePageId = pages.find((page) => /(^|\/)index\.html?$/i.test(page.path))?.id ?? pages[0]!.id;
  }
  project.files = expanded.filter((file) => !/\.html?$/i.test(file.path));
  const warnings: string[] = [];
  if (!pages.length) warnings.push('Nenhum HTML encontrado. Página inicial criada.');
  if (expanded.some((file) => /\.(php|jsx?|tsx?|vue|svelte)$/i.test(file.path))) warnings.push('Projeto dinâmico detectado. Compatibilidade visual parcial.');
  return { project, report: { pages: project.pages.length, assets: project.files.length, warnings, mode: warnings.length ? 'compatibility' : 'visual' } };
}

export async function pickDirectory(): Promise<File[]> {
  if (!('showDirectoryPicker' in window)) return [];
  const handle = await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker();
  const files: File[] = [];
  type IterableDirectory = FileSystemDirectoryHandle & { entries(): AsyncIterableIterator<[string, FileSystemFileHandle | FileSystemDirectoryHandle]> };
  async function walk(directory: FileSystemDirectoryHandle, prefix = '') {
    for await (const [name, entry] of (directory as IterableDirectory).entries()) {
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        Object.defineProperty(file, 'webkitRelativePath', { value: `${prefix}${name}` });
        files.push(file);
      } else await walk(entry, `${prefix}${name}/`);
    }
  }
  await walk(handle);
  return files;
}
