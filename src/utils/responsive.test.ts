import { describe, expect, it } from 'vitest';
import { analyzeResponsiveness, applySafeResponsiveFixes, ensureAnimationRuntime, ensureAnimationStyles, setResponsiveStyle } from './responsive';

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

it('cria e atualiza estilo por breakpoint', () => {
  const first=setResponsiveStyle('', 'abc', 'fontSize', '20px', 'mobile', {mobile:767,tablet:1024});
  const second=setResponsiveStyle(first, 'abc', 'fontSize', '18px', 'mobile', {mobile:767,tablet:1024});
  expect(second).toContain('@media(max-width:767px)');
  expect(second).toContain('font-size:18px');
  expect(second).not.toContain('font-size:20px');
});

it('instala animações sem duplicar runtime', () => {
  expect(ensureAnimationStyles('')).toContain('wdFadeUp');
  const once=ensureAnimationRuntime('');
  expect(ensureAnimationRuntime(once)).toBe(once);
  expect(once).toContain('IntersectionObserver');
});
