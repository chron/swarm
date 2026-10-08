import { useEffect, useReducer } from 'react';

/** Re-render the calling component every `ms` milliseconds. */
export function useTick(ms: number) {
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    const i = setInterval(force, ms);
    return () => clearInterval(i);
  }, [ms]);
}
