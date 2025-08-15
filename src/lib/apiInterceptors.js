import { toast } from 'react-hot-toast';

// 用于存储加载状态的计数器
let loadingCount = 0;
let loadingToastId = null;

// 延迟显示加载提示，避免闪烁
const LOADING_DELAY = 300; // 毫秒
let loadingTimer = null;

export const requestInterceptor = {
  onRequest: () => {
    loadingCount++;
    
    // Clear previous timer
    if (loadingTimer) {
      clearTimeout(loadingTimer);
    }
    
    // 如果没有显示 loading，则设置延迟显示
    if (!loadingToastId) {
      loadingTimer = setTimeout(() => {
        if (loadingCount > 0) {
          loadingToastId = toast.loading('Loading...');
        }
      }, LOADING_DELAY);
    }
  },
  
  onResponse: () => {
    loadingCount = Math.max(0, loadingCount - 1);
    
    // If no pending requests, clear loading state
    if (loadingCount === 0) {
      if (loadingTimer) {
        clearTimeout(loadingTimer);
        loadingTimer = null;
      }
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
        loadingToastId = null;
      }
    }
  },
  
  onError: (error) => {
    loadingCount = Math.max(0, loadingCount - 1);
    
    // Clear loading state
    if (loadingTimer) {
      clearTimeout(loadingTimer);
      loadingTimer = null;
    }
    if (loadingToastId) {
      toast.dismiss(loadingToastId);
      loadingToastId = null;
    }
    
    // 根据错误类型显示不同的错误信息
    if (error.name === 'AbortError') {
      toast.error('Request timeout. Please try again.');
    } else if (!navigator.onLine) {
      toast.error('No internet connection. Please check your network.');
    } else {
      const errorMessage = error.message || 'An error occurred. Please try again.';
      // 避免显示技术细节给用户
      const userFriendlyMessage = errorMessage.includes('Failed to fetch') 
        ? 'Connection failed. Please check your network.' 
        : errorMessage;
      toast.error(userFriendlyMessage);
    }
  }
};
