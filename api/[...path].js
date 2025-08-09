// Vercel serverless function handler
import { createApp } from '../lib/server-app.js';

const app = createApp();

// Export for Vercel
export default app;
