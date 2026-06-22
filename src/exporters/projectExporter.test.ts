import { describe, expect, it } from 'vitest';
import { createProject } from '../domain/defaults';
import { buildStandaloneHtml, fullHtml } from './projectExporter';

describe('fullHtml', () => {
  it('gera documento standalone', () => {
    const project = createProject();
    const output = fullHtml(project.pages[0]!);
    expect(output).toContain('<!doctype html>');
    expect(output).toContain('<meta name="viewport"');
    expect(output).toContain(project.pages[0]!.css);
  });

  it('exporta SEO e incorpora ativos',async()=>{
    const project=createProject();const page=project.pages[0]!;page.seo={title:'Título SEO',description:'Descrição'};page.html='<img src="assets/teste.svg">';project.files=[{path:'assets/teste.svg',name:'teste.svg',type:'image/svg+xml',size:6,text:'<svg/>',modified:false}];
    const output=await buildStandaloneHtml(project,page);
    expect(output).toContain('<title>Título SEO</title>');
    expect(output).toContain('data:image/svg+xml');
  });
});
