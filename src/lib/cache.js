import { get, set, del, clear } from 'idb-keyval';

// Cache management utility for PWA
class CacheManager {
  constructor() {
    this.cacheNames = {
      registration: 'registration-cache',
      images: 'images-cache',
      forms: 'forms-cache',
      camera: 'camera-cache'
    };
  }

  // Clear all registration related data
  async clearRegistrationCache() {
    
    try {
      // Clear localStorage
      localStorage.removeItem('registrationData');
      localStorage.removeItem('registrationFormDraft');
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear IndexedDB
      await clear();
      
      // Clear Service Worker cache
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const registrationCaches = cacheNames.filter(name => 
          name.includes('registration') || name.includes('form')
        );
        
        await Promise.all(
          registrationCaches.map(name => caches.delete(name))
        );
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error clearing registration cache:', error);
      return false;
    }
  }

  // Save registration data to IndexedDB
  async saveRegistrationData(data) {
    try {
      await set('registrationData', data);
      return true;
    } catch (error) {
      console.error('❌ Error saving registration data:', error);
      return false;
    }
  }

  // Load registration data from IndexedDB
  async loadRegistrationData() {
    try {
      const data = await get('registrationData');
      return data || {};
    } catch (error) {
      console.error('❌ Error loading registration data:', error);
      return {};
    }
  }

  // Clear all app cache
  async clearAllCache() {
    
    try {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear IndexedDB
      await clear();
      
      // Clear Service Worker cache
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name => caches.delete(name))
        );
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error clearing all cache:', error);
      return false;
    }
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

export default cacheManager; 