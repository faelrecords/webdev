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
  if (css.includes('WebDev Studio: animações')) return css;
  return `${css}\n/* WebDev Studio: animações */
@keyframes wdFadeUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}@keyframes wdFadeDown{from{opacity:0;transform:translateY(-40px)}to{opacity:1;transform:none}}@keyframes wdFadeLeft{from{opacity:0;transform:translateX(45px)}to{opacity:1;transform:none}}@keyframes wdFadeRight{from{opacity:0;transform:translateX(-45px)}to{opacity:1;transform:none}}@keyframes wdFadeIn{from{opacity:0}to{opacity:1}}@keyframes wdZoomIn{from{opacity:0;transform:scale(.82)}to{opacity:1;transform:none}}@keyframes wdRotateIn{from{opacity:0;transform:rotate(-12deg) scale(.9)}to{opacity:1;transform:none}}@keyframes wdFlipIn{from{opacity:0;transform:perspective(600px) rotateX(75deg)}to{opacity:1;transform:none}}@keyframes wdBounce{0%{opacity:0;transform:translateY(35px)}60%{opacity:1;transform:translateY(-10px)}100%{transform:none}}@keyframes wdBlurIn{from{opacity:0;filter:blur(15px)}to{opacity:1;filter:none}}@keyframes wdPulse{50%{transform:scale(1.05)}}@keyframes wdFloat{50%{transform:translateY(-12px)}}
[data-wd-animation]{opacity:0}[data-wd-animation].wd-animate{animation-duration:var(--wd-duration,.7s);animation-delay:var(--wd-delay,0s);animation-timing-function:var(--wd-easing,ease);animation-fill-mode:both;animation-iteration-count:var(--wd-iterations,1)}[data-wd-animation="fade-up"].wd-animate{animation-name:wdFadeUp}[data-wd-animation="fade-down"].wd-animate{animation-name:wdFadeDown}[data-wd-animation="fade-left"].wd-animate{animation-name:wdFadeLeft}[data-wd-animation="fade-right"].wd-animate{animation-name:wdFadeRight}[data-wd-animation="fade-in"].wd-animate{animation-name:wdFadeIn}[data-wd-animation="zoom-in"].wd-animate{animation-name:wdZoomIn}[data-wd-animation="rotate-in"].wd-animate{animation-name:wdRotateIn}[data-wd-animation="flip-in"].wd-animate{animation-name:wdFlipIn}[data-wd-animation="bounce"].wd-animate{animation-name:wdBounce}[data-wd-animation="blur-in"].wd-animate{animation-name:wdBlurIn}[data-wd-hover="grow"]{transition:transform .25s ease}[data-wd-hover="grow"]:hover{transform:scale(1.05)}[data-wd-hover="lift"]{transition:transform .25s ease,box-shadow .25s ease}[data-wd-hover="lift"]:hover{transform:translateY(-8px);box-shadow:0 16px 35px #0003}[data-wd-loop="pulse"]{animation:wdPulse var(--wd-duration,1.5s) ease-in-out infinite}[data-wd-loop="float"]{animation:wdFloat var(--wd-duration,2s) ease-in-out infinite}[data-wd-stagger]>*:nth-child(2){--wd-delay:90ms}[data-wd-stagger]>*:nth-child(3){--wd-delay:180ms}[data-wd-stagger]>*:nth-child(4){--wd-delay:270ms}[data-wd-stagger]>*:nth-child(5){--wd-delay:360ms}[data-wd-stagger]>*:nth-child(6){--wd-delay:450ms}[data-wd-stagger]>*:nth-child(7){--wd-delay:540ms}[data-wd-stagger]>*:nth-child(8){--wd-delay:630ms}
@media(prefers-reduced-motion:reduce){[data-wd-animation],[data-wd-loop]{opacity:1!important;animation:none!important;transition:none!important;transform:none!important}}`;
}

export function ensureAnimationRuntime(javascript: string) {
  if (javascript.includes('wd-animation-runtime')) return javascript;
  return `${javascript}\n/* wd-animation-runtime */\n(()=>{const start=el=>el.classList.add('wd-animate');const items=[...document.querySelectorAll('[data-wd-animation]')];if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){start(entry.target);if(entry.target.dataset.wdRepeat!=='true')observer.unobserve(entry.target)}else if(entry.target.dataset.wdRepeat==='true')entry.target.classList.remove('wd-animate')}),{threshold:.12});items.forEach(el=>observer.observe(el))}else items.forEach(start);const parallax=[...document.querySelectorAll('[data-wd-parallax]')];if(parallax.length){let queued=false;addEventListener('scroll',()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{parallax.forEach(el=>{const speed=Number(el.dataset.wdParallax||.15);const rect=el.getBoundingClientRect();el.style.translate='0 '+Math.round((innerHeight/2-rect.top)*speed)+'px'});queued=false})},{passive:true})}document.querySelectorAll('[data-wd-mouse="true"]').forEach(el=>el.addEventListener('pointermove',event=>{const rect=el.getBoundingClientRect();el.style.transform='perspective(700px) rotateX('+((event.clientY-rect.top)/rect.height-.5)*-8+'deg) rotateY('+((event.clientX-rect.left)/rect.width-.5)*8+'deg)'}))})();`;
}
