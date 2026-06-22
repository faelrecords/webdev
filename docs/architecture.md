# Arquitetura

## Camadas

1. Interface React.
2. Estado Zustand.
3. Modelo documental local.
4. Canvas `iframe srcdoc`.
5. Persistência IndexedDB.
6. Importadores e exportadores.

## Fluxo editorial

```text
arquivo → parser → documento visual → comandos → autosave → exportador
```

Cada elemento recebe `data-wd-id`. Esse ID conecta seleção, propriedades, histórico e regras responsivas.

## Canvas

Canvas roda em iframe. Bridge interno publica seleção e alterações via `postMessage`. Scripts importados ficam desativados por padrão. Preview pode executá-los.

## Estado

`editorStore` mantém projeto ativo, página, dispositivo, seleção, histórico, zoom e estado de salvamento. Alterações importantes geram snapshot reversível.

## Persistência

IndexedDB armazena projetos, blobs e metadados. Esquema atual: versão 1. Backups JSON permitem transporte manual.

## Responsividade

Base mobile-first. Breakpoints padrão:

- Celular: até 767px.
- Tablet: 768–1024px.
- Desktop: acima de 1024px.

Regras personalizadas permanecem no CSS da página.
