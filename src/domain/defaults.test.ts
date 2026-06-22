import { describe, expect, it } from 'vitest';
import { createProject } from './defaults';

describe('createProject', () => {
  it('cria projeto pronto em pt-BR', () => {
    const project = createProject('Teste');
    expect(project.name).toBe('Teste');
    expect(project.pages).toHaveLength(1);
    expect(project.pages[0]?.path).toBe('index.html');
    expect(project.settings.locale).toBe('pt-BR');
  });
});
