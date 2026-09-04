import { useCallback, useEffect, useState } from 'react';

function safeRead<T>(key: string, initialValue: T | (() => T)): T {
  if (typeof window === 'undefined') {
    return typeof initialValue === 'function'
      ? (initialValue as () => T)()
      : initialValue;
  }

  try {
    const stored = localStorage.getItem(key);
    if (stored === null) {
      return typeof initialValue === 'function'
        ? (initialValue as () => T)()
        : initialValue;
    }
    return JSON.parse(stored) as T;
  } catch {
    return typeof initialValue === 'function'
      ? (initialValue as () => T)()
      : initialValue;
  }
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() =>
    safeRead(key, initialValue),
  );

  useEffect(() => {
    setStoredValue(safeRead(key, initialValue));
  }, [key, initialValue]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // quota exceeded or similar
        }
        return next;
      });
    },
    [key],
  );

  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    setStoredValue(
      typeof initialValue === 'function'
        ? (initialValue as () => T)()
        : initialValue,
    );
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
