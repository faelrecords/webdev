import { describe, expect, it } from 'vitest';
import { importFiles } from './projectImporter';

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
});
