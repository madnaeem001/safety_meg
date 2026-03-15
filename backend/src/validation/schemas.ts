import { z } from 'zod';

// ── Auth schemas ──────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  fullName: z.string().min(2).max(200),
  role: z
    .enum(['worker', 'supervisor', 'manager', 'safety_officer', 'admin'])
    .default('worker'),
  department: z.string().optional(),
  organization: z.string().optional(),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Valid email required'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(32, 'Invalid reset token'),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
});

// ── Email schemas ─────────────────────────────────────────────────────────────

export const SendEmailSchema = z.object({
  to: z.string().email('Valid recipient email required'),
  subject: z.string().min(1, 'Subject is required').max(200),
  html: z.string().min(1, 'Email body is required'),
});

// ── Notification schemas ──────────────────────────────────────────────────────

export const CreateNotificationSchema = z.object({
  userId: z.number().int().positive().optional(),
  type: z.string().min(1),
  title: z.string().min(1).max(200),
  message: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

// ── AI request schemas ────────────────────────────────────────────────────────

export const AiChatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(10000),
  context: z.string().optional(),
  conversationId: z.string().optional(),
});

// ── Incident schemas ──────────────────────────────────────────────────────────

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