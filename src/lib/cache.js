// Cache utility for better performance
class Cache {
  constructor() {
    this.storage = new Map();
    this.maxSize = 100;
  }

  set(key, value, ttl = 5 * 60 * 1000) { // 5 minutes default
    if (this.storage.size >= this.maxSize) {
      const firstKey = this.storage.keys().next().value;
      this.storage.delete(firstKey);
    }

    this.storage.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key) {
    const item = this.storage.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.storage.delete(key);
      return null;
    }

    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    return this.storage.delete(key);
  }

  clear() {
    this.storage.clear();
  }

  size() {
    return this.storage.size;
  }
}

// Local storage wrapper
export const localStorageCache = {
  set: (key, value, ttl = 5 * 60 * 1000) => {
    try {
      const item = {
        value,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },

  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      const isExpired = Date.now() - parsed.timestamp > parsed.ttl;
      
      if (isExpired) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed.value;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  },

  has: (key) => {
    return localStorageCache.get(key) !== null;
  },

  delete: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('Failed to delete from localStorage:', error);
      return false;
    }
  },

  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  },
};

// Memory cache instance
export const memoryCache = new Cache();

// Session storage wrapper
export const sessionStorageCache = {
  set: (key, value, ttl = 5 * 60 * 1000) => {
    try {
      const item = {
        value,
        timestamp: Date.now(),
        ttl,
      };
      sessionStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to save to sessionStorage:', error);
    }
  },

  get: (key) => {
    try {
      const item = sessionStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      const isExpired = Date.now() - parsed.timestamp > parsed.ttl;
      
      if (isExpired) {
        sessionStorage.removeItem(key);
        return null;
      }

      return parsed.value;
    } catch (error) {
      console.warn('Failed to read from sessionStorage:', error);
      return null;
    }
  },

  has: (key) => {
    return sessionStorageCache.get(key) !== null;
  },

  delete: (key) => {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('Failed to delete from sessionStorage:', error);
      return false;
    }
  },

  clear: () => {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.warn('Failed to clear sessionStorage:', error);
    }
  },
}; 