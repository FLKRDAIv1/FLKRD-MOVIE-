"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

// Types for PWA functionality
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  hasUpdate: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  displayMode: 'browser' | 'standalone' | 'minimal-ui' | 'fullscreen';
  cacheSize: number;
  isLoading: boolean;
  error: string | null;
}

interface PWAHookReturn extends PWAState {
  installPWA: () => Promise<boolean>;
  updatePWA: () => Promise<boolean>;
  getCacheSize: () => Promise<number>;
  clearCache: () => Promise<boolean>;
  dismissInstallPrompt: () => void;
  registerBackgroundSync: (tag: string) => Promise<boolean>;
  showUpdateNotification: () => void;
}

interface PWAStorageState {
  installDismissed: boolean;
  lastInstallPrompt: number;
  updateDismissed: boolean;
  preferences: {
    autoUpdate: boolean;
    backgroundSync: boolean;
    offlineMode: boolean;
  };
}

const STORAGE_KEY = 'pwa-state';
const INSTALL_PROMPT_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

export const usePWA = (): PWAHookReturn => {
  // Core PWA state
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOffline: false,
    hasUpdate: false,
    installPrompt: null,
    displayMode: 'browser',
    cacheSize: 0,
    isLoading: true,
    error: null,
  });

  // Refs for cleanup and persistence
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const updateWaitingRef = useRef<ServiceWorker | null>(null);
  const storageStateRef = useRef<PWAStorageState>({
    installDismissed: false,
    lastInstallPrompt: 0,
    updateDismissed: false,
    preferences: {
      autoUpdate: false,
      backgroundSync: true,
      offlineMode: true,
    },
  });

  // Utility functions
  const updateState = useCallback((updates: Partial<PWAState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleError = useCallback((error: Error | string) => {
    const message = error instanceof Error ? error.message : error;
    console.error('PWA Error:', message);
    updateState({ error: message, isLoading: false });
  }, [updateState]);

  const loadStorageState = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        storageStateRef.current = { ...storageStateRef.current, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load PWA storage state:', error);
    }
  }, []);

  const saveStorageState = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storageStateRef.current));
    } catch (error) {
      console.warn('Failed to save PWA storage state:', error);
    }
  }, []);

  // Detect display mode
  const detectDisplayMode = useCallback((): 'browser' | 'standalone' | 'minimal-ui' | 'fullscreen' => {
    if (typeof window === 'undefined') return 'browser';

    // Check for standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return 'standalone';
    }
    if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      return 'minimal-ui';
    }
    if (window.matchMedia('(display-mode: fullscreen)').matches) {
      return 'fullscreen';
    }

    // iOS Safari PWA detection
    if ('standalone' in window.navigator && (window.navigator as any).standalone) {
      return 'standalone';
    }

    return 'browser';
  }, []);

  // Check if PWA is installed
  const checkInstallStatus = useCallback(() => {
    const displayMode = detectDisplayMode();
    const isInstalled = displayMode !== 'browser';
    
    updateState({ 
      isInstalled,
      displayMode,
    });

    return isInstalled;
  }, [detectDisplayMode, updateState]);

  // Calculate cache size
  const calculateCacheSize = useCallback(async (): Promise<number> => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return estimate.usage || 0;
      }
      return 0;
    } catch (error) {
      console.warn('Failed to calculate cache size:', error);
      return 0;
    }
  }, []);

  // Service Worker registration and management
  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      handleError('Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      swRegistrationRef.current = registration;

      // Listen for service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            updateWaitingRef.current = newWorker;
            updateState({ hasUpdate: true });
            
            if (storageStateRef.current.preferences.autoUpdate) {
              updatePWA();
            }
          }
        });
      });

      // Check for waiting service worker
      if (registration.waiting) {
        updateWaitingRef.current = registration.waiting;
        updateState({ hasUpdate: true });
      }

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
          calculateCacheSize().then(size => updateState({ cacheSize: size }));
        }
      });

      console.log('Service Worker registered successfully');
    } catch (error) {
      handleError(`Service Worker registration failed: ${error}`);
    }
  }, [handleError, updateState, calculateCacheSize]);

  // Online/offline detection
  const setupOnlineOfflineDetection = useCallback(() => {
    const updateOnlineStatus = () => {
      updateState({ isOffline: !navigator.onLine });
    };

    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [updateState]);

  // Install prompt handling
  const setupInstallPrompt = useCallback(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      
      // Check cooldown period
      const now = Date.now();
      const lastPrompt = storageStateRef.current.lastInstallPrompt;
      const cooldownPassed = now - lastPrompt > INSTALL_PROMPT_COOLDOWN;
      
      if (!storageStateRef.current.installDismissed || cooldownPassed) {
        updateState({ 
          isInstallable: true, 
          installPrompt: event 
        });
      }
    };

    const handleAppInstalled = () => {
      updateState({ 
        isInstallable: false, 
        isInstalled: true, 
        installPrompt: null 
      });
      storageStateRef.current.installDismissed = false;
      saveStorageState();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [updateState, saveStorageState]);

  // PWA installation function
  const installPWA = useCallback(async (): Promise<boolean> => {
    if (!state.installPrompt) {
      handleError('No install prompt available');
      return false;
    }

    try {
      updateState({ isLoading: true, error: null });
      
      await state.installPrompt.prompt();
      const choiceResult = await state.installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        updateState({ 
          isInstallable: false, 
          installPrompt: null,
          isLoading: false 
        });
        storageStateRef.current.lastInstallPrompt = Date.now();
        saveStorageState();
        return true;
      } else {
        updateState({ isLoading: false });
        storageStateRef.current.installDismissed = true;
        storageStateRef.current.lastInstallPrompt = Date.now();
        saveStorageState();
        return false;
      }
    } catch (error) {
      handleError(`Installation failed: ${error}`);
      return false;
    }
  }, [state.installPrompt, updateState, handleError, saveStorageState]);

  // PWA update function
  const updatePWA = useCallback(async (): Promise<boolean> => {
    if (!updateWaitingRef.current) {
      handleError('No update available');
      return false;
    }

    try {
      updateState({ isLoading: true, error: null });
      
      // Post message to waiting service worker to skip waiting
      updateWaitingRef.current.postMessage({ type: 'SKIP_WAITING' });
      
      // Wait for the new service worker to control the page
      const waitForControlling = new Promise<boolean>((resolve) => {
        const handleControllerChange = () => {
          navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
          resolve(true);
        };
        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
          resolve(false);
        }, 10000);
      });

      const success = await waitForControlling;
      
      if (success) {
        updateState({ 
          hasUpdate: false, 
          isLoading: false 
        });
        updateWaitingRef.current = null;
        
        // Reload the page to use the new service worker
        window.location.reload();
        return true;
      } else {
        handleError('Update timeout');
        return false;
      }
    } catch (error) {
      handleError(`Update failed: ${error}`);
      return false;
    }
  }, [updateState, handleError]);

  // Get current cache size
  const getCacheSize = useCallback(async (): Promise<number> => {
    try {
      const size = await calculateCacheSize();
      updateState({ cacheSize: size });
      return size;
    } catch (error) {
      handleError(`Failed to get cache size: ${error}`);
      return 0;
    }
  }, [calculateCacheSize, updateState, handleError]);

  // Clear all caches
  const clearCache = useCallback(async (): Promise<boolean> => {
    try {
      updateState({ isLoading: true, error: null });

      // Clear all caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));

      // Clear storage if supported
      if ('storage' in navigator && 'clear' in navigator.storage) {
        await navigator.storage.persist();
      }

      const newSize = await calculateCacheSize();
      updateState({ 
        cacheSize: newSize, 
        isLoading: false 
      });

      return true;
    } catch (error) {
      handleError(`Failed to clear cache: ${error}`);
      return false;
    }
  }, [updateState, handleError, calculateCacheSize]);

  // Dismiss install prompt
  const dismissInstallPrompt = useCallback(() => {
    updateState({ 
      isInstallable: false, 
      installPrompt: null 
    });
    storageStateRef.current.installDismissed = true;
    storageStateRef.current.lastInstallPrompt = Date.now();
    saveStorageState();
  }, [updateState, saveStorageState]);

  // Register background sync
  const registerBackgroundSync = useCallback(async (tag: string): Promise<boolean> => {
    if (!swRegistrationRef.current || !('sync' in swRegistrationRef.current)) {
      handleError('Background Sync not supported');
      return false;
    }

    try {
      await swRegistrationRef.current.sync.register(tag);
      return true;
    } catch (error) {
      handleError(`Background sync registration failed: ${error}`);
      return false;
    }
  }, [handleError]);

  // Show update notification
  const showUpdateNotification = useCallback(() => {
    if (!state.hasUpdate) return;
    
    // This would typically trigger a toast or notification
    // Implementation depends on your notification system
    console.log('PWA update available');
  }, [state.hasUpdate]);

  // Initialize PWA functionality
  useEffect(() => {
    let cleanup: (() => void)[] = [];

    const initializePWA = async () => {
      try {
        loadStorageState();
        
        // Check install status
        checkInstallStatus();
        
        // Setup event listeners
        cleanup.push(setupOnlineOfflineDetection());
        cleanup.push(setupInstallPrompt());
        
        // Register service worker
        await registerServiceWorker();
        
        // Calculate initial cache size
        const initialCacheSize = await calculateCacheSize();
        
        updateState({ 
          cacheSize: initialCacheSize,
          isLoading: false 
        });
      } catch (error) {
        handleError(`PWA initialization failed: ${error}`);
      }
    };

    initializePWA();

    // Cleanup function
    return () => {
      cleanup.forEach(fn => fn());
    };
  }, [
    loadStorageState,
    checkInstallStatus,
    setupOnlineOfflineDetection,
    setupInstallPrompt,
    registerServiceWorker,
    calculateCacheSize,
    updateState,
    handleError,
  ]);

  // Listen for display mode changes
  useEffect(() => {
    const mediaQueries = [
      window.matchMedia('(display-mode: standalone)'),
      window.matchMedia('(display-mode: minimal-ui)'),
      window.matchMedia('(display-mode: fullscreen)'),
    ];

    const handleDisplayModeChange = () => {
      const newDisplayMode = detectDisplayMode();
      const isInstalled = newDisplayMode !== 'browser';
      
      updateState({ 
        displayMode: newDisplayMode,
        isInstalled 
      });
    };

    mediaQueries.forEach(mq => mq.addEventListener('change', handleDisplayModeChange));

    return () => {
      mediaQueries.forEach(mq => mq.removeEventListener('change', handleDisplayModeChange));
    };
  }, [detectDisplayMode, updateState]);

  // Return hook API
  return {
    // State
    isInstallable: state.isInstallable,
    isInstalled: state.isInstalled,
    isOffline: state.isOffline,
    hasUpdate: state.hasUpdate,
    installPrompt: state.installPrompt,
    displayMode: state.displayMode,
    cacheSize: state.cacheSize,
    isLoading: state.isLoading,
    error: state.error,
    
    // Functions
    installPWA,
    updatePWA,
    getCacheSize,
    clearCache,
    dismissInstallPrompt,
    registerBackgroundSync,
    showUpdateNotification,
  };
};

export default usePWA;