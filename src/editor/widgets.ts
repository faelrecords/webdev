import { Box, ChartNoAxesColumn, ChevronDown, Columns3, GalleryHorizontal, Heading1, Image, LayoutGrid, List, Mail, MapPin, Menu, MessageSquareQuote, MousePointerClick, PanelTop, PlaySquare, SeparatorHorizontal, Share2, Space, Text, type LucideIcon } from 'lucide-react';

export interface Widget { id: string; name: string; icon: LucideIcon; html: string }
export const widgetGroups: { name: string; items: Widget[] }[] = [
  { name: 'Layout', items: [
    { id: 'container', name: 'Container', icon: Box, html: '<section data-wd-name="Container" style="padding:60px 24px"><div style="max-width:1180px;margin:auto"><h2>Novo container</h2><p>Adicione conteúdo aqui.</p></div></section>' },
    { id: 'grid', name: 'Grade', icon: LayoutGrid, html: '<div data-wd-name="Grade" style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding:24px"><div>Coluna 1</div><div>Coluna 2</div><div>Coluna 3</div></div>' },
    { id: 'columns', name: 'Colunas', icon: Columns3, html: '<div data-wd-name="Colunas" style="display:flex;gap:24px;padding:24px"><div style="flex:1">Coluna 1</div><div style="flex:1">Coluna 2</div></div>' },
  ]},
  { name: 'Básicos', items: [
    { id: 'heading', name: 'Título', icon: Heading1, html: '<h2>Novo título</h2>' },
    { id: 'text', name: 'Texto', icon: Text, html: '<p>Escreva seu conteúdo aqui.</p>' },
    { id: 'button', name: 'Botão', icon: MousePointerClick, html: '<a href="#" class="button">Clique aqui</a>' },
    { id: 'list', name: 'Lista', icon: List, html: '<ul><li>Primeiro item</li><li>Segundo item</li><li>Terceiro item</li></ul>' },
    { id: 'separator', name: 'Separador', icon: SeparatorHorizontal, html: '<hr style="border:0;border-top:1px solid #d8dee8;margin:24px 0">' },
    { id: 'spacer', name: 'Espaçador', icon: Space, html: '<div data-wd-name="Espaçador" style="height:48px"></div>' },
  ]},
  { name: 'Mídia', items: [
    { id: 'image', name: 'Imagem', icon: Image, html: '<img alt="Imagem" src="https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80">' },
    { id: 'video', name: 'Vídeo', icon: PlaySquare, html: '<div style="aspect-ratio:16/9;background:#111827;color:#fff;display:grid;place-items:center">Vídeo</div>' },
    { id: 'gallery', name: 'Galeria', icon: GalleryHorizontal, html: '<div data-wd-name="Galeria" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px"><img alt="Galeria 1" src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=600&q=80"><img alt="Galeria 2" src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=600&q=80"><img alt="Galeria 3" src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=600&q=80"></div>' },
  ]},
  { name: 'Interativos', items: [
    { id: 'form', name: 'Formulário', icon: Mail, html: '<form data-wd-name="Formulário" style="display:grid;gap:12px;max-width:560px"><label>Nome<input required name="nome" style="display:block;width:100%;padding:12px;margin-top:6px"></label><label>E-mail<input required type="email" name="email" style="display:block;width:100%;padding:12px;margin-top:6px"></label><label>Mensagem<textarea name="mensagem" style="display:block;width:100%;padding:12px;margin-top:6px;min-height:120px"></textarea></label><button class="button" type="submit">Enviar mensagem</button></form>' },
    { id: 'accordion', name: 'Acordeão', icon: ChevronDown, html: '<div data-wd-name="Acordeão"><details open style="border-bottom:1px solid #ddd;padding:16px 0"><summary style="font-weight:700;cursor:pointer">Pergunta frequente</summary><p>Resposta detalhada para seus visitantes.</p></details><details style="border-bottom:1px solid #ddd;padding:16px 0"><summary style="font-weight:700;cursor:pointer">Outra pergunta</summary><p>Outra resposta importante.</p></details></div>' },
    { id: 'tabs', name: 'Abas', icon: PanelTop, html: '<div data-wd-name="Abas"><div style="display:flex;gap:8px;border-bottom:1px solid #ddd"><button style="padding:10px 16px;border:0;border-bottom:2px solid #3563ff;background:none">Visão geral</button><button style="padding:10px 16px;border:0;background:none">Detalhes</button></div><div style="padding:20px 0"><h3>Conteúdo da aba</h3><p>Organize informações em áreas compactas.</p></div></div>' },
    { id: 'menu', name: 'Menu', icon: Menu, html: '<nav data-wd-name="Menu" style="display:flex;gap:24px;align-items:center"><a href="#inicio">Início</a><a href="#servicos">Serviços</a><a href="#sobre">Sobre</a><a href="#contato">Contato</a></nav>' },
  ]},
  { name: 'Avançados', items: [
    { id: 'testimonial', name: 'Depoimento', icon: MessageSquareQuote, html: '<figure data-wd-name="Depoimento" style="margin:0;padding:28px;border:1px solid #e2e8f0;border-radius:10px"><blockquote style="font-size:20px;margin:0 0 20px">“Excelente resultado e processo muito claro.”</blockquote><figcaption><strong>Nome do cliente</strong><br><small>Empresa</small></figcaption></figure>' },
    { id: 'counter', name: 'Contador', icon: ChartNoAxesColumn, html: '<div data-wd-name="Contador" style="text-align:center"><strong style="font-size:48px;color:#3563ff">250+</strong><p>Projetos entregues</p></div>' },
    { id: 'progress', name: 'Progresso', icon: ChartNoAxesColumn, html: '<div data-wd-name="Progresso"><div style="display:flex;justify-content:space-between"><strong>Desempenho</strong><span>85%</span></div><div style="height:8px;background:#e2e8f0;border-radius:4px;margin-top:8px"><div style="height:100%;width:85%;background:#3563ff;border-radius:4px"></div></div></div>' },
    { id: 'social', name: 'Redes sociais', icon: Share2, html: '<div data-wd-name="Redes sociais" style="display:flex;gap:10px"><a href="#" aria-label="Instagram" style="padding:10px;border:1px solid #ddd;border-radius:50%">IG</a><a href="#" aria-label="LinkedIn" style="padding:10px;border:1px solid #ddd;border-radius:50%">IN</a><a href="#" aria-label="YouTube" style="padding:10px;border:1px solid #ddd;border-radius:50%">YT</a></div>' },
    { id: 'map', name: 'Mapa', icon: MapPin, html: '<div data-wd-name="Mapa" style="min-height:320px;background:#e8edf3;display:grid;place-items:center;border-radius:8px"><div style="text-align:center"><strong>Mapa</strong><p>Insira código incorporado.</p></div></div>' },
  ]},
];
