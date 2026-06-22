# WebDev Studio

Editor visual client-side para projetos HTML independentes. Interface pt-BR, persistência local e exportação sem serviços pagos.

## Recursos

- Projeto HTML novo.
- Importação de HTML, pasta ou ZIP.
- Importação de backup `.webdev.json`.
- Canvas desktop, tablet e celular.
- 21 widgets visuais.
- Edição inline e por propriedades.
- Flexbox, Grid, tipografia e aparência.
- Animações e visibilidade responsiva.
- Modelos internos e personalizados.
- Árvore de camadas e arquivos.
- Monaco para HTML, CSS e JavaScript.
- Histórico, undo e redo.
- Autosave em IndexedDB.
- Ativos binários locais.
- Auditoria responsiva automática.
- Exportação HTML, ZIP, backup ou pasta.
- Preview com JavaScript opcional.

## Executar

```bash
npm install
npm run dev
```

Abrir `http://127.0.0.1:5173`.

## Verificar

```bash
npm run check
npm run test:e2e
```

## Produção

```bash
npm run build
npm run preview
```

Arquivos finais ficam em `dist/`.

## Armazenamento

Projetos ficam somente no navegador. Exporte backup antes de limpar dados, trocar navegador ou reinstalar sistema.

## Compatibilidade

HTML, CSS e JavaScript estáticos possuem melhor suporte. Projetos React, Vue, PHP, templates server-side e DOM gerado integralmente por JavaScript entram em compatibilidade parcial.

Documentação detalhada:

- [Arquitetura](docs/architecture.md)
- [Compatibilidade](docs/compatibility.md)
- [Importação e exportação](docs/import-export.md)
- [Segurança](docs/security.md)

## Git

```bash
git add .
git commit -m "feat: implementar WebDev Studio"
git push origin main
```
