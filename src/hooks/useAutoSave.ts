"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseAutoSaveOptions {
  debounceDelay?: number;
  storageType?: 'localStorage' | 'sessionStorage';
  compress?: boolean;
  validateData?: (data: any) => boolean;
  onSave?: (data: any, key: string) => void;
  onLoad?: (data: any, key: string) => void;
  onError?: (error: Error) => void;
}

export interface UseAutoSaveReturn<T> {
  data: T;
  setData: (data: T | ((prev: T) => T)) => void;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  clearSaved: () => void;
  lastSaved: Date | null;
  forceSave: () => Promise<void>;
  isDataDirty: boolean;
}

// Simple compression using JSON + base64 (can be enhanced with actual compression libraries)
const compressData = (data: string): string => {
  try {
    return btoa(data);
  } catch {
    return data;
  }
};

const decompressData = (compressed: string): string => {
  try {
    return atob(compressed);
  } catch {
    return compressed;
  }
};

export function useAutoSave<T>(
  key: string,
  initialData: T,
  options: UseAutoSaveOptions = {}
): UseAutoSaveReturn<T> {
  const {
    debounceDelay = 1000,
    storageType = 'localStorage',
    compress = false,
    validateData,
    onSave,
    onLoad,
    onError
  } = options;

  const [data, setDataState] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDataDirty, setIsDataDirty] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<T>(initialData);
  const storageRef = useRef<Storage | null>(null);

  // Initialize storage reference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      storageRef.current = storageType === 'localStorage' ? window.localStorage : window.sessionStorage;
    }
  }, [storageType]);

  // Load data from storage on mount
  useEffect(() => {
    const loadData = async () => {
      if (!storageRef.current) {
        setIsLoading(false);
        return;
      }

      try {
        const savedData = storageRef.current.getItem(key);
        if (savedData !== null) {
          let parsedData: T;
          
          if (compress) {
            const decompressed = decompressData(savedData);
            parsedData = JSON.parse(decompressed);
          } else {
            parsedData = JSON.parse(savedData);
          }

          // Validate data if validator is provided
          if (validateData && !validateData(parsedData)) {
            throw new Error('Loaded data failed validation');
          }

          setDataState(parsedData);
          previousDataRef.current = parsedData;
          setLastSaved(new Date());
          onLoad?.(parsedData, key);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load saved data';
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
        
        // Clear corrupted data
        try {
          storageRef.current?.removeItem(key);
        } catch {
          // Ignore cleanup errors
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [key, compress, validateData, onLoad, onError]);

  // Save data to storage
  const saveData = useCallback(async (dataToSave: T): Promise<void> => {
    if (!storageRef.current) {
      throw new Error('Storage not available');
    }

    // Validate data if validator is provided
    if (validateData && !validateData(dataToSave)) {
      throw new Error('Data failed validation');
    }

    setIsSaving(true);
    setError(null);

    try {
      let serializedData = JSON.stringify(dataToSave);
      
      if (compress) {
        serializedData = compressData(serializedData);
      }

      // Check storage quota
      const testKey = `${key}_test`;
      storageRef.current.setItem(testKey, serializedData);
      storageRef.current.removeItem(testKey);
      
      // Actually save the data
      storageRef.current.setItem(key, serializedData);
      
      setLastSaved(new Date());
      setIsDataDirty(false);
      previousDataRef.current = dataToSave;
      onSave?.(dataToSave, key);
    } catch (err) {
      let errorMessage = 'Failed to save data';
      
      if (err instanceof Error) {
        if (err.name === 'QuotaExceededError') {
          errorMessage = 'Storage quota exceeded';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [key, compress, validateData, onSave, onError]);

  // Debounced save function
  const debouncedSave = useCallback((dataToSave: T) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        await saveData(dataToSave);
      } catch {
        // Error is already handled in saveData
      }
    }, debounceDelay);
  }, [saveData, debounceDelay]);

  // Set data function with auto-save
  const setData = useCallback((newData: T | ((prev: T) => T)) => {
    setDataState(prevData => {
      const updatedData = typeof newData === 'function' 
        ? (newData as (prev: T) => T)(prevData)
        : newData;
      
      // Check if data actually changed
      const hasChanged = JSON.stringify(updatedData) !== JSON.stringify(previousDataRef.current);
      
      if (hasChanged) {
        setIsDataDirty(true);
        debouncedSave(updatedData);
      }
      
      return updatedData;
    });
  }, [debouncedSave]);

  // Force save function
  const forceSave = useCallback(async (): Promise<void> => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    await saveData(data);
  }, [saveData, data]);

  // Clear saved data
  const clearSaved = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    try {
      storageRef.current?.removeItem(key);
      setLastSaved(null);
      setIsDataDirty(false);
      setError(null);
      previousDataRef.current = initialData;
      setDataState(initialData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear saved data';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  }, [key, initialData, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    data,
    setData,
    isLoading,
    isSaving,
    error,
    clearSaved,
    lastSaved,
    forceSave,
    isDataDirty
  };
}

export default useAutoSave;