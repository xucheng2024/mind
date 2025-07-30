// Test file to verify Node.js module polyfills
export function testNodeModules() {
  try {
    console.log('🧪 Testing Node.js module polyfills...');
    
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