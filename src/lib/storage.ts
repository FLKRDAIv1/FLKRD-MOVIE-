interface StorageOptions {
  expires?: Date | number;
  compress?: boolean;
  silent?: boolean;
}

interface StorageData<T> {
  value: T;
  expires?: number;
  compressed?: boolean;
  timestamp: number;
}

interface StorageStats {
  used: number;
  available: number;
  total: number;
  percentage: number;
}

type StorageSyncCallback<T = any> = (value: T | null, key: string) => void;

class LocalStorageUtility {
  private readonly APP_PREFIX = 'flkrd_';
  private readonly COMPRESSION_THRESHOLD = 1024; // 1KB
  private syncCallbacks = new Map<string, Set<StorageSyncCallback>>();
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.setupStorageSync();
      this.scheduleCleanup();
    }
  }

  /**
   * Check if localStorage is supported and available
   */
  isSupported(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      
      const test = '__localStorage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the full key with app prefix
   */
  private getKey(key: string): string {
    return `${this.APP_PREFIX}${key}`;
  }

  /**
   * Simple string compression using LZ-like algorithm
   */
  private compress(str: string): string {
    if (str.length < this.COMPRESSION_THRESHOLD) {
      return str;
    }

    const dict: Record<string, number> = {};
    const data = (str + '').split('');
    const out: (string | number)[] = [];
    let currChar: string;
    let phrase = data[0];
    let code = 256;

    for (let i = 1; i < data.length; i++) {
      currChar = data[i];
      if (dict[phrase + currChar] != null) {
        phrase += currChar;
      } else {
        out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
        dict[phrase + currChar] = code;
        code++;
        phrase = currChar;
      }
    }
    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
    
    return JSON.stringify(out);
  }

  /**
   * Decompress string
   */
  private decompress(str: string): string {
    try {
      const data = JSON.parse(str);
      if (!Array.isArray(data)) return str;

      const dict: Record<number, string> = {};
      let currChar = String.fromCharCode(data[0]);
      let oldPhrase = currChar;
      const out = [currChar];
      let code = 256;
      let phrase: string;

      for (let i = 1; i < data.length; i++) {
        const currCode = data[i];
        if (typeof currCode === 'number') {
          if (dict[currCode]) {
            phrase = dict[currCode];
          } else if (currCode === code) {
            phrase = oldPhrase + currChar;
          } else {
            throw new Error('Invalid compression data');
          }
        } else {
          phrase = currCode;
        }

        out.push(phrase);
        currChar = phrase.charAt(0);
        dict[code] = oldPhrase + currChar;
        code++;
        oldPhrase = phrase;
      }

      return out.join('');
    } catch {
      return str; // Return original if decompression fails
    }
  }

  /**
   * Calculate expiration timestamp
   */
  private getExpirationTime(expires?: Date | number): number | undefined {
    if (!expires) return undefined;
    
    if (expires instanceof Date) {
      return expires.getTime();
    }
    
    if (typeof expires === 'number') {
      return Date.now() + expires;
    }
    
    return undefined;
  }

  /**
   * Check if an item has expired
   */
  private isExpired(data: StorageData<any>): boolean {
    if (!data.expires) return false;
    return Date.now() > data.expires;
  }

  /**
   * Store an item with optional expiration and compression
   */
  setItem<T>(key: string, value: T, options: StorageOptions = {}): boolean {
    if (!this.isSupported()) {
      if (!options.silent) {
        console.warn('LocalStorage is not supported');
      }
      return false;
    }

    try {
      const storageData: StorageData<T> = {
        value,
        timestamp: Date.now(),
        expires: this.getExpirationTime(options.expires)
      };

      let serialized = JSON.stringify(storageData);
      
      // Apply compression if enabled and data is large enough
      if (options.compress && serialized.length >= this.COMPRESSION_THRESHOLD) {
        const compressed = this.compress(serialized);
        if (compressed.length < serialized.length) {
          serialized = compressed;
          storageData.compressed = true;
          serialized = JSON.stringify({ ...storageData, value: compressed });
        }
      }

      const fullKey = this.getKey(key);
      localStorage.setItem(fullKey, serialized);
      
      // Trigger sync callbacks
      this.triggerSync(key, value);
      
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.handleQuotaExceeded(key, options);
      }
      
      if (!options.silent) {
        console.error('Failed to set localStorage item:', error);
      }
      return false;
    }
  }

  /**
   * Retrieve an item with type safety
   */
  getItem<T>(key: string, defaultValue?: T): T | null {
    if (!this.isSupported()) {
      return defaultValue ?? null;
    }

    try {
      const fullKey = this.getKey(key);
      const item = localStorage.getItem(fullKey);
      
      if (!item) {
        return defaultValue ?? null;
      }

      let data: StorageData<T> = JSON.parse(item);
      
      // Handle compressed data
      if (data.compressed) {
        const decompressed = this.decompress(item);
        data = JSON.parse(decompressed);
      }

      // Check expiration
      if (this.isExpired(data)) {
        this.removeItem(key);
        return defaultValue ?? null;
      }

      return data.value;
    } catch (error) {
      console.error('Failed to get localStorage item:', error);
      // Try to recover by removing corrupted item
      this.removeItem(key);
      return defaultValue ?? null;
    }
  }

  /**
   * Remove an item
   */
  removeItem(key: string): boolean {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const fullKey = this.getKey(key);
      localStorage.removeItem(fullKey);
      
      // Trigger sync callbacks with null value
      this.triggerSync(key, null);
      
      return true;
    } catch (error) {
      console.error('Failed to remove localStorage item:', error);
      return false;
    }
  }

  /**
   * Clear all app-specific data
   */
  clear(): boolean {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.APP_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear all sync callbacks
      this.syncCallbacks.clear();
      
      return true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  }

  /**
   * Get storage usage statistics
   */
  getStorageSize(): StorageStats {
    if (!this.isSupported()) {
      return { used: 0, available: 0, total: 0, percentage: 0 };
    }

    try {
      let used = 0;
      const appKeys: string[] = [];

      // Calculate used space for app data
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          const size = key.length + (value?.length ?? 0);
          
          if (key.startsWith(this.APP_PREFIX)) {
            appKeys.push(key);
          }
          used += size;
        }
      }

      // Estimate total available space (typically 5-10MB)
      const total = 10 * 1024 * 1024; // 10MB estimate
      const available = total - used;
      const percentage = (used / total) * 100;

      return {
        used,
        available: Math.max(0, available),
        total,
        percentage: Math.min(100, percentage)
      };
    } catch (error) {
      console.error('Failed to calculate storage size:', error);
      return { used: 0, available: 0, total: 0, percentage: 0 };
    }
  }

  /**
   * Clean up expired items
   */
  cleanup(): number {
    if (!this.isSupported()) {
      return 0;
    }

    let removedCount = 0;
    const keysToRemove: string[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(this.APP_PREFIX)) continue;

        const item = localStorage.getItem(key);
        if (!item) continue;

        try {
          const data: StorageData<any> = JSON.parse(item);
          if (this.isExpired(data)) {
            keysToRemove.push(key);
          }
        } catch {
          // Remove corrupted items
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        removedCount++;
      });
    } catch (error) {
      console.error('Failed to cleanup localStorage:', error);
    }

    return removedCount;
  }

  /**
   * Set up cross-tab synchronization
   */
  private setupStorageSync(): void {
    window.addEventListener('storage', (event) => {
      if (!event.key || !event.key.startsWith(this.APP_PREFIX)) {
        return;
      }

      const key = event.key.substring(this.APP_PREFIX.length);
      let value: any = null;

      if (event.newValue) {
        try {
          const data: StorageData<any> = JSON.parse(event.newValue);
          if (!this.isExpired(data)) {
            value = data.value;
          }
        } catch {
          // Invalid data, ignore
        }
      }

      this.triggerSync(key, value);
    });
  }

  /**
   * Register a callback for cross-tab synchronization
   */
  sync<T>(key: string, callback: StorageSyncCallback<T>): () => void {
    if (!this.syncCallbacks.has(key)) {
      this.syncCallbacks.set(key, new Set());
    }
    
    this.syncCallbacks.get(key)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.syncCallbacks.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.syncCallbacks.delete(key);
        }
      }
    };
  }

  /**
   * Trigger sync callbacks
   */
  private triggerSync<T>(key: string, value: T | null): void {
    const callbacks = this.syncCallbacks.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(value, key);
        } catch (error) {
          console.error('Sync callback error:', error);
        }
      });
    }
  }

  /**
   * Handle quota exceeded error
   */
  private handleQuotaExceeded(key: string, options: StorageOptions): void {
    if (!options.silent) {
      console.warn('Storage quota exceeded, attempting cleanup...');
    }

    // Try to free up space
    const removedCount = this.cleanup();
    
    if (removedCount > 0 && !options.silent) {
      console.info(`Cleaned up ${removedCount} expired items`);
    }

    // If still not enough space, remove oldest items
    if (removedCount === 0) {
      this.removeOldestItems(5);
    }
  }

  /**
   * Remove oldest items to free up space
   */
  private removeOldestItems(count: number): number {
    const items: { key: string; timestamp: number }[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(this.APP_PREFIX)) continue;

        const item = localStorage.getItem(key);
        if (!item) continue;

        try {
          const data: StorageData<any> = JSON.parse(item);
          items.push({ key, timestamp: data.timestamp });
        } catch {
          // Remove corrupted items immediately
          localStorage.removeItem(key);
        }
      }

      // Sort by timestamp and remove oldest
      items.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = items.slice(0, count);
      
      toRemove.forEach(item => localStorage.removeItem(item.key));
      
      return toRemove.length;
    } catch (error) {
      console.error('Failed to remove oldest items:', error);
      return 0;
    }
  }

  /**
   * Schedule periodic cleanup
   */
  private scheduleCleanup(): void {
    // Clean up expired items every hour
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);

    // Clean up on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.cleanup();
      }
    });
  }

  /**
   * Get all app keys
   */
  getKeys(): string[] {
    if (!this.isSupported()) {
      return [];
    }

    const keys: string[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.APP_PREFIX)) {
          keys.push(key.substring(this.APP_PREFIX.length));
        }
      }
    } catch (error) {
      console.error('Failed to get keys:', error);
    }

    return keys;
  }

  /**
   * Check if a key exists
   */
  hasItem(key: string): boolean {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const fullKey = this.getKey(key);
      return localStorage.getItem(fullKey) !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get item size in bytes
   */
  getItemSize(key: string): number {
    if (!this.isSupported()) {
      return 0;
    }

    try {
      const fullKey = this.getKey(key);
      const value = localStorage.getItem(fullKey);
      return fullKey.length + (value?.length ?? 0);
    } catch {
      return 0;
    }
  }
}

// Create and export singleton instance
export const localStorageUtil = new LocalStorageUtility();

// Export types for external use
export type { StorageOptions, StorageStats, StorageSyncCallback };