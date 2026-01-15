import { useState, useEffect } from 'react';

/**
 * Hook to debounce a value
 * @template T
 * @param {T} value - Value to debounce
 * @param {number} delay - Delay time in milliseconds
 * @returns {T} Debounced value
 * @example
 * const debouncedSearch = useDebounce(searchTerm, 500);
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timerId);
    };
  }, [value, delay]);

  return debouncedValue;
}
