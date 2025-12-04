// API client for database operations (bypasses RLS)
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://www.sgclinchub.com' : 'http://localhost:3001');

import { requestInterceptor } from './apiInterceptors';

// Fetch with timeout and retry
async function fetchWithRetry(url, options, retries = 3, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    requestInterceptor.onRequest();  // Show loading state when request starts
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    requestInterceptor.onResponse();  // Clear loading state when request completes
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (retries > 0 && error.name === 'AbortError') {
      return fetchWithRetry(url, options, retries - 1, timeout);
    }
    requestInterceptor.onError(error);  // Handle error cases
    throw error;
  }
}

export const apiClient = {
  // User operations
  async createUser(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users?action=create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }
      
      return data;
    } catch (error) {
      throw new Error(`Create user failed: ${error.message}`);
    }
  },

  async getUser(clinicId, userRowId) {
    const response = await fetch(`${API_BASE_URL}/api/users?action=get&clinicId=${clinicId}&userRowId=${userRowId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get user');
    }
    
    return response.json();
  },

  async queryUser(clinicId, phoneHash) {
    const response = await fetch(`${API_BASE_URL}/api/users?action=query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clinicId, phoneHash }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to query user');
    }
    
    return response.json();
  },

  // Check for duplicate users during registration
  async checkDuplicate(clinicId, phone, email) {
    const response = await fetch(`${API_BASE_URL}/api/users?action=check-duplicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clinicId, phone, email }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check duplicate');
    }
    
    return response.json();
  },

  // Visit operations
  async createVisit(visitData) {
    const response = await fetch(`${API_BASE_URL}/api/visits?action=create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(visitData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create visit');
    }
    
    return response.json();
  },

  async updateVisit(visitId, visitData) {
    const response = await fetch(`${API_BASE_URL}/api/visits?action=update&id=${visitId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(visitData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update visit');
    }
    
    return response.json();
  },

  // Get user visits
  async getUserVisits(clinicId, userRowId) {
    const response = await fetch(`${API_BASE_URL}/api/visits?action=get&clinicId=${clinicId}&userRowId=${userRowId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get user visits');
    }
    
    return response.json();
  },

  // Get clinic info
  async getClinicInfo(clinicId) {
    const response = await fetch(`${API_BASE_URL}/api/clinics/${clinicId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get clinic info');
    }
    
    return response.json();
  },



  // Check if user has existing visit
  async checkUserVisit(clinicId, userRowId) {
    const response = await fetch(`${API_BASE_URL}/api/visits?action=check&clinicId=${clinicId}&userRowId=${userRowId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check user visit');
    }
    
    return response.json();
  },

  // Validate user
  async validateUser(clinicId, userRowId) {
    const response = await fetch(`${API_BASE_URL}/api/users?action=validate&clinicId=${clinicId}&userRowId=${userRowId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'User validation failed');
    }
    
    return response.json();
  },

  // Storage operations (compression handled on frontend)
  async uploadFile(bucket, filename, fileData, contentType = 'application/octet-stream') {
    const response = await fetch(`${API_BASE_URL}/api/storage?action=upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bucket, filename, fileData, contentType }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload file');
    }
    
    return response.json();
  },

  // Get signed URL for encrypted file (returns signed URL through server)
  async getSignedUrl(bucket, filename, expiresIn = 94608000) { // Default 3 years expiration (3*365*24*3600)
    const response = await fetch(`${API_BASE_URL}/api/storage?action=signed-url&bucket=${bucket}&filename=${filename}&expiresIn=${expiresIn}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get signed URL');
    }
    
    return response.json();
  },

  // Download and decrypt file (returns decrypted file URL through server) - Keep backward compatibility
  getDecryptedFileUrl(bucket, filename) {
    return `${API_BASE_URL}/api/storage?action=download&bucket=${bucket}&filename=${filename}`;
  },

  async listFiles(bucket, limit = 100, search = null) {
    const queryParams = new URLSearchParams({ action: 'list', bucket, limit: limit.toString() });
    if (search) queryParams.append('search', search);
    
    const response = await fetch(`${API_BASE_URL}/api/storage?${queryParams}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to list files');
    }

    return response.json();
  },

};
