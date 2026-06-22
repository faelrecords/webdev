import type { ArchiveProgress } from '../workers/archiveClient';

export function ProgressOverlay({ value, title }: { value: ArchiveProgress; title: string }) {
  return <div className="progress-overlay"><section><strong>{title}</strong><p>{value.message}</p><div><span style={{ width: `${Math.max(2, Math.min(100, value.progress))}%` }}/></div><small>{value.progress}%</small></section></div>;
}
