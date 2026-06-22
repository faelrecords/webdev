import { describe, expect, it } from 'vitest';
import { importFiles } from './projectImporter';
import { createProject } from '../domain/defaults';

describe('importFiles', () => {
  it('separa HTML, CSS e JavaScript internos', async () => {
    const file = new File(['<!doctype html><html><head><style>h1{color:red}</style></head><body><h1>Olá</h1><script>window.x=1</script></body></html>'], 'pagina.html', { type: 'text/html' });
    const { project, report } = await importFiles([file]);
    expect(project.pages[0]?.html).toContain('<h1>Olá</h1>');
    expect(project.pages[0]?.css).toContain('color:red');
    expect(project.pages[0]?.javascript).toContain('window.x=1');
    expect(report.pages).toBe(1);
  });

  it('mantém projeto utilizável sem HTML', async () => {
    const file = new File(['body{}'], 'style.css', { type: 'text/css' });
    const { project, report } = await importFiles([file]);
    expect(project.pages).toHaveLength(1);
    expect(report.warnings).toContain('Nenhum HTML encontrado. Página inicial criada.');
  });

  it('incorpora CSS clássico sem duplicar link e preserva módulo',async()=>{
    const html=new File(['<html><head><link rel="stylesheet" href="style.css"><meta name="description" content="Teste"></head><body><h1>Oi</h1><script type="module" src="app.js"></script></body></html>'],'index.html',{type:'text/html'});
    const css=new File(['h1{color:blue}'],'style.css',{type:'text/css'});const js=new File(['export{}'],'app.js',{type:'text/javascript'});
    const {project}=await importFiles([html,css,js]);const page=project.pages[0]!;
    expect(page.css).toContain('color:blue');expect(page.html).not.toContain('stylesheet');expect(page.html).toContain('type="module"');expect(page.seo?.description).toBe('Teste');
  });

  it('restaura ativo binário do backup',async()=>{
    const project=createProject();const backup={...project,files:[{path:'assets/a.txt',name:'a.txt',type:'text/plain',size:2,modified:false,dataUrl:'data:text/plain;base64,b2s='}]};
    const file=new File([JSON.stringify(backup)],'teste.webdev.json',{type:'application/json'});const result=await importFiles([file]);
    expect(result.project.files[0]?.blob?.size).toBe(2);
  });

  it('processa projeto com muitos arquivos em lotes',async()=>{
    const files:File[]=[new File(['<main>Grande</main>'],'index.html',{type:'text/html'})];for(let index=0;index<1200;index++)files.push(new File([`v${index}`],`asset-${index}.txt`,{type:'text/plain'}));
    const {project}=await importFiles(files);expect(project.files).toHaveLength(1200);
  },10000);
});
