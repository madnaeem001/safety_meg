import 'dotenv/config';
import { serve } from '@hono/node-server';
import { createApp } from './index';
import { edgespark } from './db'; // Ensure edgespark client is exported from db.ts

async function start() {
  const app = await createApp(edgespark);
  
  console.log('🚀 SafetyMEG Backend running on http://localhost:8787');
  
  serve({
    fetch: app.fetch,
    port: 8787
  });
}

start();