import { useEffect } from 'react';
import { useEditorStore } from '../stores/editorStore';

export function useAutosave() {
  const project = useEditorStore((state) => state.project);
  const saved = useEditorStore((state) => state.saved);
  const persist = useEditorStore((state) => state.persist);
  useEffect(() => {
    if (saved) return;
    const timer = window.setTimeout(() => void persist(), 1000);
    return () => window.clearTimeout(timer);
  }, [persist, project, saved]);
}
