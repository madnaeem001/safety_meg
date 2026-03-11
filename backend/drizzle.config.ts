import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/__generated__/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'file:./local.sqlite',
  },
});