import { Hono } from "hono";
import type { Client } from "@sdk/server-types";
import { db } from "../db"; 
import { incidents } from "../__generated__/schema";
import { CreateIncidentSchema } from "../validation/schemas"; // Import Zod Schema

export function safetyRoutes(app: Hono, edgespark: Client<any>) {
  /**
   * GET /api/safety/incidents
   * Fetch all incidents from the real expanded SQLite database
   */
  app.get('/api/safety/incidents', async (c) => {
    try {
      const allIncidents = await db.select().from(incidents);
      return c.json({ success: true, data: allIncidents });
    } catch (error) {
      console.error("GET DB Error:", error);
      return c.json({ success: false, error: 'Failed to fetch incidents' }, 500);
    }
  });

  /**
   * POST /api/safety/incidents
   * Validates and saves a complete incident report from the frontend
   */
  app.post('/api/safety/incidents', async (c) => {
    try {
      const body = await c.req.json();
      
      // 1. Validate incoming data using Zod (Security Gate)
      const validatedData = CreateIncidentSchema.parse(body);
      
      // 2. Insert into the expanded 15+ field database
      const result = await db.insert(incidents).values({
        ...validatedData,
        status: 'open',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }).returning();
      
      return c.json({ 
        success: true, 
        message: 'Incident reported successfully!', 
        data: result[0] 
      }, 201);
      
    } catch (error) {
      // Global error handler (index.ts) will catch Zod errors and show 400
      throw error; 
    }
  });
}