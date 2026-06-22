import { describe, expect, it } from 'vitest';
import { analyzeResponsiveness, applySafeResponsiveFixes } from './responsive';

describe('responsividade', () => {
  it('detecta largura arriscada', () => {
    expect(analyzeResponsiveness('<img width="1200">', '.hero{width:100vw}').map((issue) => issue.type)).toEqual(expect.arrayContaining(['fixed-media', 'viewport-width', 'missing-media']));
  });

  it('aplica correções idempotentes', () => {
    const once = applySafeResponsiveFixes('.hero{width:100vw}');
    const twice = applySafeResponsiveFixes(once);
    expect(once).toBe(twice);
    expect(once).toContain('width:100%');
  });
});
