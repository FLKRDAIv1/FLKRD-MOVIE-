import { useState, useEffect, useCallback } from 'react';

type StorageType = 'local' | 'session';

interface UsePersistentStateOptions {
  storage?: StorageType;
  prefix?: string;
}

type SetStateAction<T> = T | ((prev: T) => T);

/**
 * Custom hook that provides localStorage/sessionStorage persistence for React state
 * @param key - The storage key (will be prefixed)
 * @param defaultValue - Default value when no stored data exists
 * @param options - Configuration options
 * @returns [state, setState] tuple similar to useState
 */
export function usePersistentState<T>(
  key: string,
  defaultValue: T,
  options: UsePersistentStateOptions = {}
): [T, (value: SetStateAction<T>) => void] {
  const { storage = 'local', prefix = 'flkrd_' } = options;
  const prefixedKey = `${prefix}${key}`;

  // Get the appropriate storage object
  const getStorage = useCallback((): Storage | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const storageObj = storage === 'local' ? localStorage : sessionStorage;
      // Test if storage is available by trying to set/get a test value
      const testKey = '__storage_test__';
      storageObj.setItem(testKey, 'test');
      storageObj.removeItem(testKey);
      return storageObj;
    } catch (error) {
      console.warn(`[usePersistentState] ${storage}Storage is not available:`, error);
      return null;
    }
  }, [storage]);

  // Initialize state with value from storage or default
  const [state, setState] = useState<T>(() => {
    const storageObj = getStorage();
    if (!storageObj) return defaultValue;

    try {
      const storedValue = storageObj.getItem(prefixedKey);
      if (storedValue === null) return defaultValue;
      
      return JSON.parse(storedValue);
    } catch (error) {
      console.warn(`[usePersistentState] Failed to parse stored value for key "${prefixedKey}":`, error);
      
      // Clear corrupted data
      try {
        storageObj.removeItem(prefixedKey);
      } catch (clearError) {
        console.warn(`[usePersistentState] Failed to clear corrupted data:`, clearError);
      }
      
      return defaultValue;
    }
  });

  // Save state to storage whenever it changes
  useEffect(() => {
    const storageObj = getStorage();
    if (!storageObj) return;

    try {
      const serializedValue = JSON.stringify(state);
      storageObj.setItem(prefixedKey, serializedValue);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn(`[usePersistentState] Storage quota exceeded for key "${prefixedKey}". Falling back to memory-only state.`);
      } else {
        console.warn(`[usePersistentState] Failed to save state for key "${prefixedKey}":`, error);
      }
    }
  }, [state, prefixedKey, getStorage]);

  // Enhanced setState that supports functional updates
  const setPersistentState = useCallback((value: SetStateAction<T>) => {
    setState(prevState => {
      const newState = typeof value === 'function' 
        ? (value as (prev: T) => T)(prevState)
        : value;
      
      return newState;
    });
  }, []);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === prefixedKey && e.storageArea === getStorage()) {
        try {
          const newValue = e.newValue ? JSON.parse(e.newValue) : defaultValue;
          setState(newValue);
        } catch (error) {
          console.warn(`[usePersistentState] Failed to sync storage change for key "${prefixedKey}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [prefixedKey, defaultValue, getStorage]);

  return [state, setPersistentState];
}

/**
 * Utility function to clear all persistent state with a specific prefix
 * @param prefix - The prefix to match (defaults to 'flkrd_')
 * @param storage - Which storage to clear ('local' | 'session' | 'both')
 */
export function clearPersistentState(
  prefix: string = 'flkrd_',
  storage: StorageType | 'both' = 'both'
): void {
  if (typeof window === 'undefined') return;

  const clearStorage = (storageObj: Storage) => {
    try {
      const keys = Object.keys(storageObj).filter(key => key.startsWith(prefix));
      keys.forEach(key => storageObj.removeItem(key));
      console.log(`[usePersistentState] Cleared ${keys.length} items with prefix "${prefix}"`);
    } catch (error) {
      console.warn(`[usePersistentState] Failed to clear storage:`, error);
    }
  };

  if (storage === 'local' || storage === 'both') {
    clearStorage(localStorage);
  }
  
  if (storage === 'session' || storage === 'both') {
    clearStorage(sessionStorage);
  }
}

/**
 * Utility function to get all persistent state keys with a specific prefix
 * @param prefix - The prefix to match (defaults to 'flkrd_')
 * @param storage - Which storage to check ('local' | 'session')
 * @returns Array of keys (without prefix)
 */
export function getPersistentStateKeys(
  prefix: string = 'flkrd_',
  storage: StorageType = 'local'
): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const storageObj = storage === 'local' ? localStorage : sessionStorage;
    return Object.keys(storageObj)
      .filter(key => key.startsWith(prefix))
      .map(key => key.slice(prefix.length));
  } catch (error) {
    console.warn(`[usePersistentState] Failed to get storage keys:`, error);
    return [];
  }
}