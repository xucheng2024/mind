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
      // Clear localStorage (except login info)
      const loginKeys = ['user_id', 'user_row_id', 'clinic_id'];
      const keysToRemove = Object.keys(localStorage).filter(key => 
        !loginKeys.includes(key)
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
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

  // Save login info for auto-login
  saveLoginInfo(userId, userRowId, clinicId, fullName = '', gender = '') {
    try {
      localStorage.setItem('user_id', userId);
      localStorage.setItem('user_row_id', userRowId);
      localStorage.setItem('clinic_id', clinicId);
      localStorage.setItem('user_full_name', fullName);
      localStorage.setItem('user_gender', gender);
      localStorage.setItem('login_timestamp', Date.now().toString());
      return true;
    } catch (error) {
      console.error('❌ Error saving login info:', error);
      return false;
    }
  }

  // Check if user is logged in
  isLoggedIn() {
    const userId = localStorage.getItem('user_id');
    const userRowId = localStorage.getItem('user_row_id');
    const clinicId = localStorage.getItem('clinic_id');
    const loginTimestamp = localStorage.getItem('login_timestamp');
        
    // Check if login info exists and is not too old (30 days)
    if (userId && userRowId && clinicId && loginTimestamp) {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const isRecent = parseInt(loginTimestamp) > thirtyDaysAgo;
      
      if (isRecent) {
        return true;
      } else {
        this.clearLoginInfo();
        return false;
      }
    }
    
    return false;
  }

  // Clear login info
  clearLoginInfo() {
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_row_id');
    localStorage.removeItem('user_full_name');
    localStorage.removeItem('user_gender');
    localStorage.removeItem('login_timestamp');
  }

  // Get login info
  getLoginInfo() {
    const loginInfo = {
      userId: localStorage.getItem('user_id'),
      userRowId: localStorage.getItem('user_row_id'),
      clinicId: localStorage.getItem('clinic_id'),
      fullName: localStorage.getItem('user_full_name') || '',
      gender: localStorage.getItem('user_gender') || ''
    };
    return loginInfo;
  }

  // Get user data from localStorage (for backward compatibility)
  getUser() {
    return this.getLoginInfo();
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

export default cacheManager; 