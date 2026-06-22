export interface ArchiveEntry { path: string; text?: string; blob?: Blob }
export interface ArchiveProgress { progress: number; message: string }
type ProgressCallback = (progress: ArchiveProgress) => void;

interface PendingRequest {
  resolve(value: unknown): void;
  reject(reason: unknown): void;
  onProgress?: ProgressCallback;
}

let worker: Worker | undefined;
const pending = new Map<string, PendingRequest>();

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./archive.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (event: MessageEvent) => {
    const message = event.data as { id: string; type: string; progress?: number; message?: string; entries?: { path: string; text?: string; bytes?: ArrayBuffer }[]; bytes?: ArrayBuffer };
    const request = pending.get(message.id);
    if (!request) return;
    if (message.type === 'progress') {
      request.onProgress?.({ progress: message.progress ?? 0, message: message.message ?? '' });
      return;
    }
    pending.delete(message.id);
    if (message.type === 'error') request.reject(new Error(message.message));
    else if (message.entries) request.resolve(message.entries.map((entry) => ({ path: entry.path, ...(entry.text === undefined ? { blob: new Blob([entry.bytes!]) } : { text: entry.text }) })));
    else request.resolve(new Blob([message.bytes!], { type: 'application/zip' }));
  };
  worker.onerror = (event) => {
    for (const request of pending.values()) request.reject(event.error ?? new Error(event.message));
    pending.clear();
    worker?.terminate();
    worker = undefined;
  };
  return worker;
}

function requestWorker<T>(payload: Record<string, unknown>, onProgress?: ProgressCallback) {
  const id = crypto.randomUUID();
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (value: unknown) => void, reject, ...(onProgress ? { onProgress } : {}) });
    getWorker().postMessage({ id, ...payload });
  });
}

export function unzipArchive(file: Blob, onProgress?: ProgressCallback) {
  return requestWorker<ArchiveEntry[]>({ type: 'import', file }, onProgress);
}

export function zipArchive(entries: ArchiveEntry[], onProgress?: ProgressCallback) {
  return requestWorker<Blob>({ type: 'export', entries }, onProgress);
}
