export function ensureElementIds(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.body.querySelectorAll('*').forEach((node) => {
    if (!node.hasAttribute('data-wd-id')) node.setAttribute('data-wd-id', crypto.randomUUID());
  });
  return doc.body.innerHTML;
}

export function mutateElement(html: string, id: string, mutation: (element: HTMLElement) => void) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const element = doc.querySelector<HTMLElement>(`[data-wd-id="${CSS.escape(id)}"]`);
  if (element) mutation(element);
  return doc.body.innerHTML;
}

export function getLayerTree(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return [...doc.body.children].map(toLayer);
}

export interface LayerNode { id: string; name: string; tag: string; children: LayerNode[] }
function toLayer(element: Element): LayerNode {
  return { id: element.getAttribute('data-wd-id') ?? '', name: element.getAttribute('data-wd-name') || element.classList[0] || element.tagName.toLowerCase(), tag: element.tagName.toLowerCase(), children: [...element.children].map(toLayer) };
}
