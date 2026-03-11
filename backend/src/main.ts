import 'dotenv/config';
import { serve } from '@hono/node-server';
import { createApp } from './index';
import { edgespark } from './db';
import { initializeDatabase } from './init-db';

async function start() {
  // Always initialize DB first — creates all tables if they don't exist
  initializeDatabase();

  const app = await createApp(edgespark);
  const port = Number(process.env.PORT) || 8787;
  
  console.log(`🚀 SafetyMEG Backend running on port ${port}`);
  
  serve({
    fetch: app.fetch,
    port,
  });
}

start();