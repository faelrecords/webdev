import { nanoid } from 'nanoid';
import type { Project } from './types';

export const starterHtml = `
<header class="site-header">
  <a class="brand" href="#">Aurora</a>
  <nav><a href="#servicos">Serviços</a><a href="#sobre">Sobre</a><a href="#contato">Contato</a></nav>
  <a class="button button-small" href="#contato">Falar conosco</a>
</header>
<main>
  <section class="hero" data-wd-name="Hero">
    <div class="hero-copy">
      <p class="eyebrow">ESTÚDIO DIGITAL</p>
      <h1>Sites que transformam ideias em resultados.</h1>
      <p class="lead">Estratégia, design e tecnologia para marcas que querem crescer com clareza.</p>
      <div class="actions"><a class="button" href="#contato">Começar projeto</a><a class="button secondary" href="#servicos">Ver serviços</a></div>
    </div>
    <div class="hero-art"><span>Design</span><strong>+ Código</strong><em>+ Estratégia</em></div>
  </section>
  <section id="servicos" class="services" data-wd-name="Serviços">
    <h2>Tudo para lançar melhor</h2>
    <div class="service-grid"><article><b>01</b><h3>Estratégia</h3><p>Posicionamento e arquitetura de informação.</p></article><article><b>02</b><h3>Design UX</h3><p>Interfaces claras, rápidas e acessíveis.</p></article><article><b>03</b><h3>Desenvolvimento</h3><p>Código responsivo pronto para produção.</p></article></div>
  </section>
</main>
<footer id="contato"><strong>Aurora</strong><span>contato@aurora.studio</span></footer>`;

export const starterCss = `
:root{font-family:Inter,system-ui,sans-serif;color:#111827;background:#fff;line-height:1.5}*{box-sizing:border-box}body{margin:0}a{color:inherit;text-decoration:none}.site-header{height:72px;display:flex;align-items:center;gap:32px;padding:0 max(24px,calc((100% - 1180px)/2));border-bottom:1px solid #e5e7eb}.brand{font-size:22px;font-weight:800}.site-header nav{display:flex;gap:26px;margin-left:auto;font-size:14px}.button{display:inline-flex;align-items:center;justify-content:center;background:#3f5bf6;color:#fff;padding:13px 20px;border-radius:7px;font-weight:650}.button-small{padding:9px 14px;font-size:13px}.button.secondary{background:#fff;color:#111827;border:1px solid #cbd5e1}.hero{min-height:620px;display:grid;grid-template-columns:1.05fr .95fr;align-items:center;gap:64px;max-width:1180px;margin:auto;padding:80px 24px}.eyebrow{color:#3f5bf6;font-size:12px;font-weight:800;letter-spacing:.16em}.hero h1{font-size:clamp(44px,6vw,76px);line-height:1.02;letter-spacing:-.05em;margin:18px 0}.lead{font-size:19px;color:#64748b;max-width:600px}.actions{display:flex;gap:12px;margin-top:30px}.hero-art{min-height:390px;background:#111827;color:#fff;border-radius:18px;padding:46px;display:flex;flex-direction:column;justify-content:center;font-size:48px;letter-spacing:-.04em}.hero-art strong{color:#8ea0ff}.hero-art em{font-style:normal;color:#94a3b8}.services{padding:96px max(24px,calc((100% - 1180px)/2));background:#f7f8fa}.services h2{font-size:40px;letter-spacing:-.03em}.service-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#dce1e8}.service-grid article{background:#fff;padding:32px}.service-grid b{color:#3f5bf6}footer{display:flex;justify-content:space-between;padding:40px max(24px,calc((100% - 1180px)/2));background:#111827;color:#fff}@media(max-width:767px){.site-header nav{display:none}.hero{grid-template-columns:1fr;padding-top:56px}.hero h1{font-size:44px}.hero-art{min-height:280px;font-size:36px}.service-grid{grid-template-columns:1fr}.actions{flex-direction:column}.site-header{padding:0 18px}.site-header .button{margin-left:auto}}img,video,svg{max-width:100%;height:auto}html,body{max-width:100%;overflow-x:clip}`;

export function createProject(name = 'Meu site'): Project {
  const pageId = nanoid();
  const now = Date.now();
  return {
    id: nanoid(), name, createdAt: now, updatedAt: now, activePageId: pageId,
    pages: [{ id: pageId, name: 'Início', path: 'index.html', html: starterHtml, css: starterCss, javascript: '' }],
    files: [], templates: [], version: 1,
    settings: { breakpoints: { mobile: 767, tablet: 1024, desktop: 1280 }, executeScripts: false, autoResponsive: true, locale: 'pt-BR' },
  };
}
