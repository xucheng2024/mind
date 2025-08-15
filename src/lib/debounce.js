// Debounce function
export function debounce(func, wait = 300) {
  let timeoutId;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeoutId);
      func(...args);
    };
    
    clearTimeout(timeoutId);
    timeoutId = setTimeout(later, wait);
  };
}
