import type { PageDocument, Project } from '../domain/types';
import { zipArchive, type ArchiveEntry, type ArchiveProgress } from '../workers/archiveClient';

function fullHtml(page:PageDocument,executeScripts=true,project?:Project){
  const seo=page.seo??{};const metadata=[seo.description?`<meta name="description" content="${escapeHtml(seo.description)}">`:'',seo.keywords?`<meta name="keywords" content="${escapeHtml(seo.keywords)}">`:'',seo.canonical?`<link rel="canonical" href="${escapeHtml(seo.canonical)}">`:'',seo.ogImage?`<meta property="og:image" content="${escapeHtml(seo.ogImage)}">`:'',seo.noindex?'<meta name="robots" content="noindex,nofollow">':'',project?.settings.faviconPath?`<link rel="icon" href="${escapeHtml(project.settings.faviconPath)}">`:''].filter(Boolean).join('\n');
  return `<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n${metadata}\n${project?.settings.globalHeadCode??''}\n${page.headCode??''}\n<title>${escapeHtml(seo.title||page.name)}</title>\n<style>\n${page.css}\n</style>\n</head>\n<body>\n${cleanEditorArtifacts(page.html)}\n${executeScripts&&page.javascript?`<script>\n${page.javascript}\n</script>`:''}\n</body>\n</html>`;
}

export async function exportHtml(project:Project,page:PageDocument){const html=await buildStandaloneHtml(project,page);download(new Blob([html],{type:'text/html;charset=utf-8'}),page.path.split('/').pop()??'index.html')}

export async function exportProjectZip(project:Project,onProgress?:(progress:ArchiveProgress)=>void){const entries:ArchiveEntry[]=[];for(const page of project.pages)entries.push({path:page.path,text:fullHtml(page,true,project)});for(const file of project.files){if(file.text!==undefined)entries.push({path:file.path,text:file.text});else if(file.blob)entries.push({path:file.path,blob:file.blob})}download(await zipArchive(entries,onProgress),`${slug(project.name)}.zip`)}

type WritableFileHandle=FileSystemFileHandle&{createWritable():Promise<{write(data:Blob|string):Promise<void>;close():Promise<void>}>};
type WritableDirectoryHandle=FileSystemDirectoryHandle&{getDirectoryHandle(name:string,options:{create:boolean}):Promise<WritableDirectoryHandle>;getFileHandle(name:string,options:{create:boolean}):Promise<WritableFileHandle>};

export async function saveProjectToDirectory(project:Project){if(!('showDirectoryPicker'in window)){await exportProjectZip(project);return'zip'as const}const root=await(window as unknown as{showDirectoryPicker():Promise<WritableDirectoryHandle>}).showDirectoryPicker();async function write(path:string,data:Blob|string){const parts=path.split('/').filter(Boolean);const filename=parts.pop();if(!filename)return;let directory=root;for(const part of parts)directory=await directory.getDirectoryHandle(part,{create:true});const handle=await directory.getFileHandle(filename,{create:true});const writable=await handle.createWritable();await writable.write(data);await writable.close()}for(const page of project.pages)await write(page.path,fullHtml(page,true,project));for(const file of project.files)await write(file.path,file.text??file.blob??'');return'directory'as const}

export async function exportBackup(project:Project){const backup=structuredClone(project)as Project&{files:(Project['files'][number]&{dataUrl?:string})[]};for(const file of backup.files){if(file.blob){file.dataUrl=await blobToDataUrl(file.blob);delete file.blob}}download(new Blob([JSON.stringify(backup)],{type:'application/json'}),`${slug(project.name)}.webdev.json`)}

async function buildStandaloneHtml(project:Project,page:PageDocument){let html=fullHtml(page,true,project);for(const file of project.files){const blob=file.blob??(file.text!==undefined?new Blob([file.text],{type:file.type}):null);if(!blob)continue;const dataUrl=await blobToDataUrl(blob);const relative=relativePath(page.path,file.path);html=html.split(`./${relative}`).join(dataUrl).split(relative).join(dataUrl)}return html}
function relativePath(from:string,to:string){const fromParts=from.split('/');fromParts.pop();const toParts=to.split('/');while(fromParts.length&&toParts.length&&fromParts[0]===toParts[0]){fromParts.shift();toParts.shift()}return`${'../'.repeat(fromParts.length)}${toParts.join('/')}`}
function blobToDataUrl(blob:Blob){return new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(reader.error);reader.onload=()=>resolve(String(reader.result));reader.readAsDataURL(blob)})}
function cleanEditorArtifacts(html:string){const doc=new DOMParser().parseFromString(html,'text/html');doc.querySelectorAll('.wd-selected').forEach(node=>node.classList.remove('wd-selected'));doc.querySelectorAll('[draggable],[contenteditable],[data-wd-locked]').forEach(node=>{node.removeAttribute('draggable');node.removeAttribute('contenteditable');node.removeAttribute('data-wd-locked')});return doc.body.innerHTML}
function escapeHtml(value:string){return value.replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]!))}
function slug(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'projeto'}
function download(blob:Blob,filename:string){const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),500)}

export{fullHtml,buildStandaloneHtml};
