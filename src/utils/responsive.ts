export interface ResponsiveIssue { type: string; selector: string; message: string; fix: string }

export function analyzeResponsiveness(html: string, css: string): ResponsiveIssue[] {
  const issues: ResponsiveIssue[] = [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('img,video,iframe,table').forEach((node, index) => {
    const element = node as HTMLElement;
    if (element.hasAttribute('width') && Number(element.getAttribute('width')) > 767) issues.push({ type: 'fixed-media', selector: `${element.tagName.toLowerCase()}:nth(${index})`, message: 'Mídia possui largura fixa.', fix: 'max-width:100%;height:auto' });
  });
  const fixedWidth = /(?<!max-|min-)width\s*:\s*(\d{4,})px/gi;
  for (const match of css.matchAll(fixedWidth)) issues.push({ type: 'fixed-width', selector: 'CSS', message: `Largura fixa ${match[1]}px pode transbordar.`, fix: 'width:100%;max-width:<valor>px' });
  if (/100vw/.test(css)) issues.push({ type: 'viewport-width', selector: 'CSS', message: '100vw pode incluir scrollbar.', fix: 'width:100%' });
  if (!/@media/i.test(css)) issues.push({ type: 'missing-media', selector: 'CSS', message: 'Nenhum breakpoint encontrado.', fix: '@media(max-width:767px)' });
  return issues;
}

export function applySafeResponsiveFixes(css: string) {
  let next = css.replace(/width\s*:\s*100vw/g, 'width:100%');
  const guard = `\n/* WebDev Studio: proteção responsiva */\nimg,video,svg,canvas{max-width:100%;height:auto}iframe{max-width:100%}table{display:block;max-width:100%;overflow-x:auto}body{overflow-wrap:anywhere}html,body{max-width:100%;overflow-x:clip}\n`;
  if (!next.includes('WebDev Studio: proteção responsiva')) next += guard;
  return next;
}

export function setDeviceVisibility(css: string, id: string, device: 'desktop'|'tablet'|'mobile', hidden: boolean, breakpoints: {mobile:number;tablet:number}) {
  const marker = `/* wd-visibility:${id}:${device} */`;
  const escaped = id.replace(/["\\]/g, '\\$&');
  const query = device === 'mobile' ? `@media(max-width:${breakpoints.mobile}px)` : device === 'tablet' ? `@media(min-width:${breakpoints.mobile + 1}px) and (max-width:${breakpoints.tablet}px)` : `@media(min-width:${breakpoints.tablet + 1}px)`;
  const rule = `${marker}\n${query}{[data-wd-id="${escaped}"]{display:none!important}}`;
  const pattern = new RegExp(`/\\* wd-visibility:${escaped}:${device} \\*/[\\s\\S]*?\\}\\}`, 'g');
  const cleaned = css.replace(pattern, '');
  return hidden ? `${cleaned}\n${rule}` : cleaned;
}

export function setResponsiveStyle(css: string, id: string, property: string, value: string, device: 'desktop'|'tablet'|'mobile', breakpoints: {mobile:number;tablet:number}) {
  const token = `${encodeURIComponent(id)}:${device}:${property}`;
  const start = `/* wd-style:${token}:start */`;
  const end = `/* wd-style:${token}:end */`;
  const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const cleaned = css.replace(new RegExp(`/\\* wd-style:${escapedToken}:start \\*/[\\s\\S]*?/\\* wd-style:${escapedToken}:end \\*/`, 'g'), '').trimEnd();
  if (!value.trim()) return cleaned;
  const escapedId = CSS.escape(id);
  const query = device === 'mobile'
    ? `@media(max-width:${breakpoints.mobile}px)`
    : device === 'tablet'
      ? `@media(min-width:${breakpoints.mobile + 1}px) and (max-width:${breakpoints.tablet}px)`
      : `@media(min-width:${breakpoints.tablet + 1}px)`;
  return `${cleaned}\n${start}\n${query}{[data-wd-id="${escapedId}"]{${toKebabCase(property)}:${value}!important}}\n${end}`;
}

function toKebabCase(value: string) {
  return value.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`);
}

export function ensureAnimationStyles(css: string) {
  if (css.includes('wdFadeUp')) return css;
  return `${css}\n/* WebDev Studio: animações */\n@keyframes wdFadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}@keyframes wdFadeIn{from{opacity:0}to{opacity:1}}@keyframes wdZoomIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}}@media(prefers-reduced-motion:reduce){[data-wd-id]{animation:none!important;transition:none!important}}`;
}
