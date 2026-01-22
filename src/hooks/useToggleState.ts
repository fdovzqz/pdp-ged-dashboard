import { useState, useCallback } from 'react';

/**
 * Custom hook for managing toggle state of multiple items
 * Useful for year/forecast filters in charts
 * 
 * @param initialItems - Array of initially active items
 * @returns Tuple of [activeItems, toggleItem] 
 */
export function useToggleState<T extends string>(
  initialItems: T[]
): [T[], (item: T) => void] {
  const [items, setItems] = useState<T[]>(initialItems);

  const toggle = useCallback((item: T) => {
    setItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }, []);

  return [items, toggle];
}
