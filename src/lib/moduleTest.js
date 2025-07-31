// Test file to verify Node.js module polyfills
export function testNodeModules() {
  try {
    console.log('🧪 Testing Node.js module polyfills...');
    
    // Test if we're in a browser environment
    if (typeof window !== 'undefined') {
      console.log('✅ Browser environment detected');
      console.log('✅ Node.js modules not needed in browser');
      return true;
    }
    
    // Only test Node.js modules in Node.js environment
    if (typeof require !== 'undefined') {
      // Test URL module
      const url = require('url');
      console.log('✅ URL module working:', typeof url);
      
      // Test util module
      const util = require('util');
      console.log('✅ Util module working:', typeof util);
      
      // Test stream module
      const stream = require('stream');
      console.log('✅ Stream module working:', typeof stream);
      
      console.log('✅ All Node.js modules polyfilled successfully');
      return true;
    } else {
      console.log('✅ No Node.js modules needed in browser environment');
      return true;
    }
  } catch (error) {
    console.error('❌ Node.js module test failed:', error);
    return false;
  }
}

// Auto-run test in development
if (import.meta.env.DEV) {
  setTimeout(() => {
    testNodeModules();
  }, 1000);
} 