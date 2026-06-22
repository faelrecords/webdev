import { describe, expect, it } from 'vitest';
import { createProject } from '../domain/defaults';
import { fullHtml } from './projectExporter';

describe('fullHtml', () => {
  it('gera documento standalone', () => {
    const project = createProject();
    const output = fullHtml(project.pages[0]!);
    expect(output).toContain('<!doctype html>');
    expect(output).toContain('<meta name="viewport"');
    expect(output).toContain(project.pages[0]!.css);
  });
});
