# Compatibilidade

## Suporte completo

- HTML estático.
- CSS interno ou separado.
- JavaScript clássico.
- Imagens, SVG, vídeos e fontes.
- Múltiplas páginas HTML.
- Caminhos relativos.

## Suporte parcial

- Módulos ES externos.
- Imports dinâmicos.
- Service Workers.
- Canvas desenhado por script.
- Shadow DOM.
- Web Components complexos.
- Sites dependentes de CORS.

## Modo compatibilidade

Projetos com PHP, JSX, TSX, Vue ou Svelte recebem aviso. Arquivos ficam preservados. Edição visual atua somente sobre HTML detectado.

## Formatação

Fonte importada fica preservada nos arquivos virtuais. Documento visual usa serialização DOM. Comentários ou espaços internos podem mudar após edição visual. Backup deve ser criado antes de mudanças extensas.
