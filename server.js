// server.js - Local development server
import { createApp } from './lib/server-app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;

// Debug environment
console.log('🚀 Server starting...');
console.log('📍 PORT:', PORT);
console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔗 FRONTEND_URL:', process.env.FRONTEND_URL);

const app = createApp();

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// For Vercel deployment
export default app;
