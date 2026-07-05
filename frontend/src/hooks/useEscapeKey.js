'use client';
import { useEffect } from 'react';

export function useEscapeKey(onEscape) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onEscape();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onEscape]);
}
