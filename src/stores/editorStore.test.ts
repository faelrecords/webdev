import { beforeEach, describe, expect, it } from 'vitest';
import { createProject } from '../domain/defaults';
import { getActivePage, useEditorStore } from './editorStore';

describe('histórico incremental', () => {
  beforeEach(() => useEditorStore.getState().setProject(createProject('Teste')));

  it('desfaz e refaz apenas campos alterados', () => {
    const initial = getActivePage(useEditorStore.getState().project);
    useEditorStore.getState().updatePage({ javascript: 'console.log(1)' }, 'Editar JavaScript');
    useEditorStore.getState().undo();
    expect(getActivePage(useEditorStore.getState().project).javascript).toBe(initial.javascript);
    useEditorStore.getState().redo();
    expect(getActivePage(useEditorStore.getState().project).javascript).toBe('console.log(1)');
  });

  it('agrupa mudanças contínuas', () => {
    useEditorStore.getState().updatePage({ css: 'a{}' }, 'Editar CSS');
    useEditorStore.getState().updatePage({ css: 'b{}' }, 'Editar CSS');
    expect(useEditorStore.getState().past).toHaveLength(1);
    useEditorStore.getState().undo();
    expect(getActivePage(useEditorStore.getState().project).css).not.toBe('a{}');
  });

  it('sincroniza componentes entre páginas', () => {
    const project=createProject('Globais');
    const first=project.pages[0]!;
    first.html='<header data-wd-id="a" data-wd-component="global"><h2 data-wd-id="b">Original</h2></header>';
    project.pages.push({...first,id:'segunda',name:'Segunda',path:'segunda.html',html:'<header data-wd-id="c" data-wd-component="global"><h2 data-wd-id="d">Antigo</h2></header>'});
    useEditorStore.getState().setProject(project);
    useEditorStore.getState().updatePage({html:'<header data-wd-id="a" data-wd-component="global"><h2 data-wd-id="b">Atualizado</h2></header>'},'Editar global');
    expect(useEditorStore.getState().project.pages[1]!.html).toContain('Atualizado');
  });

  it('duplica página e renomeia referências de ativo', () => {
    const project=createProject('Arquivos');project.files=[{path:'assets/a.png',name:'a.png',type:'image/png',size:1,modified:false}];project.pages[0]!.html='<img src="assets/a.png">';useEditorStore.getState().setProject(project);
    useEditorStore.getState().duplicatePage(project.activePageId);
    expect(useEditorStore.getState().project.pages).toHaveLength(2);
    useEditorStore.getState().renameAsset('assets/a.png','images/a.png');
    expect(useEditorStore.getState().project.pages.every(page=>page.html.includes('images/a.png'))).toBe(true);
  });
});
