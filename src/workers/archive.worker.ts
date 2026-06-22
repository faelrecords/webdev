import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';

type ImportRequest = { id: string; type: 'import'; file: Blob };
type ExportEntry = { path: string; text?: string; blob?: Blob };
type ExportRequest = { id: string; type: 'export'; entries: ExportEntry[] };
type Request = ImportRequest | ExportRequest;

const textExtensions = /\.(?:html?|css|js|mjs|json|txt|md|svg|xml|csv|tsv)$/i;
const MAX_ARCHIVE_BYTES = 512 * 1024 * 1024;
const MAX_EXPANDED_BYTES = 2 * 1024 * 1024 * 1024;
const MAX_ENTRY_BYTES = 256 * 1024 * 1024;
const MAX_ENTRIES = 50_000;

self.onmessage = async (event: MessageEvent<Request>) => {
  const request = event.data;
  try {
    if (request.type === 'import') {
      if (request.file.size > MAX_ARCHIVE_BYTES) throw new Error('ZIP excede limite de 512 MB. Importe pasta diretamente.');
      postProgress(request.id, 5, 'Lendo arquivo compactado');
      const source = new Uint8Array(await request.file.arrayBuffer());
      validateArchive(source);
      const archive = unzipSync(source);
      const paths = Object.keys(archive).filter((path) => !path.endsWith('/') && !path.includes('../'));
      const entries: { path: string; text?: string; bytes?: ArrayBuffer }[] = [];
      const transfers: Transferable[] = [];
      for (let index = 0; index < paths.length; index += 1) {
        const path = paths[index]!;
        const bytes = archive[path]!;
        if (textExtensions.test(path)) entries.push({ path, text: strFromU8(bytes) });
        else {
          const copy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
          entries.push({ path, bytes: copy });
          transfers.push(copy);
        }
        if (index % 25 === 0) postProgress(request.id, 10 + Math.round((index / paths.length) * 85), `Extraindo ${index + 1} de ${paths.length}`);
      }
      self.postMessage({ id: request.id, type: 'result', entries }, { transfer: transfers });
      return;
    }

    postProgress(request.id, 5, 'Preparando arquivos');
    const entries: Record<string, Uint8Array> = {};
    let totalBytes = 0;
    for (let index = 0; index < request.entries.length; index += 1) {
      const entry = request.entries[index]!;
      entries[entry.path] = entry.text === undefined ? new Uint8Array(await entry.blob!.arrayBuffer()) : strToU8(entry.text);
      totalBytes += entries[entry.path]!.byteLength;
      if (totalBytes > MAX_EXPANDED_BYTES) throw new Error('Projeto excede limite de exportação de 2 GB. Salve em pasta.');
      if (index % 25 === 0) postProgress(request.id, 10 + Math.round((index / request.entries.length) * 55), `Preparando ${index + 1} de ${request.entries.length}`);
    }
    postProgress(request.id, 70, 'Compactando projeto');
    const archive = zipSync(entries, { level: 6 });
    const output = archive.buffer.slice(archive.byteOffset, archive.byteOffset + archive.byteLength);
    self.postMessage({ id: request.id, type: 'result', bytes: output }, { transfer: [output] });
  } catch (error) {
    self.postMessage({ id: request.id, type: 'error', message: error instanceof Error ? error.message : 'Falha no processamento.' });
  }
};

function postProgress(id: string, progress: number, message: string) {
  self.postMessage({ id, type: 'progress', progress, message });
}

function validateArchive(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let entries = 0;
  let expandedBytes = 0;
  for (let offset = 0; offset <= bytes.byteLength - 46; offset += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) continue;
    entries += 1;
    const size = view.getUint32(offset + 24, true);
    expandedBytes += size;
    if (entries > MAX_ENTRIES) throw new Error('ZIP excede limite de 50 mil arquivos.');
    if (size > MAX_ENTRY_BYTES) throw new Error('ZIP contém arquivo maior que 256 MB. Importe pasta diretamente.');
    if (expandedBytes > MAX_EXPANDED_BYTES) throw new Error('ZIP expandido excede limite de 2 GB.');
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    offset += 45 + nameLength + extraLength + commentLength;
  }
  if (entries === 0) throw new Error('ZIP inválido ou vazio.');
}
