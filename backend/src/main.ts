import 'dotenv/config';
import { serve } from '@hono/node-server';
import { createApp } from './index';
import { edgespark } from './db'; // Ensure edgespark client is exported from db.ts

async function start() {
  const app = await createApp(edgespark);
  const port = Number(process.env.PORT) || 8787;
  
  console.log(`🚀 SafetyMEG Backend running on port ${port}`);
  
  serve({
    fetch: app.fetch,
    port,
  });
}

start();