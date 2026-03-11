import { z } from 'zod';

export const CreateIncidentSchema = z.object({
  type: z.enum(['incident', 'near-miss', 'injury', 'property', 'vehicle', 'hazard']),
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  location: z.string().min(3, "Location is required"),
  department: z.string().optional(),
  incidentDate: z.string(),
  incidentTime: z.string(),
  industrySector: z.string().optional(),
  incidentType: z.string(),
  regulatoryReportable: z.boolean().optional(),
  bodyPartAffected: z.string().optional(),
  injuryType: z.string().optional(),
  immediateActions: z.string().optional(),
  witnesses: z.string().optional(),
  rootCauses: z.string().optional(),
  correctiveActions: z.string().optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
  isoClause: z.string().optional(),
});