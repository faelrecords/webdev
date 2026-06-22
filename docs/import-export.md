# Importação e exportação

## Importação

Formatos aceitos:

- `.html` e `.htm`.
- Pasta completa.
- `.zip`.
- `.webdev.json`.

API de diretórios é testada primeiro. Navegadores incompatíveis usam seletor de pasta ou ZIP.

ZIPs ignoram caminhos que escapam raiz. Páginas `index.html` recebem prioridade.

## Exportação

- HTML atual completo.
- Projeto ZIP.
- Escrita direta em pasta.
- Backup WebDev JSON.

Escrita direta pede permissão do navegador. Sem API compatível, exportação muda para ZIP.

Ativos binários são mantidos no ZIP e na pasta final.
