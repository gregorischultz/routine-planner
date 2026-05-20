'use client';

import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
  key: string,
  initial: T,
): [T, (val: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) setValue(JSON.parse(stored) as T);
    } catch {
      // ignore parse errors
    }
    setHydrated(true);
  }, [key]);

  function set(val: T | ((prev: T) => T)) {
    setValue((prev) => {
      const next = typeof val === 'function' ? (val as (p: T) => T)(prev) : val;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }

  return [hydrated ? value : initial, set];
}
