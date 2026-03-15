import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { createHash, randomBytes } from 'crypto';
import { sendSystemEmail } from '../services/email';
import { env, DB_PATH } from '../config/env';
import { createLogger } from '../services/logger';

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');

const logger = createLogger('Auth');

// ── JWT CONFIG ─────────────────────────────────────────────────────────────
const JWT_SECRET = env.JWT_SECRET;
const JWT_EXPIRES_IN = 60 * 60 * 24; // 24 hours in seconds
const REFRESH_EXPIRES_IN = 60 * 60 * 24 * 30; // 30 days

// ── ENSURE USERS TABLE EXISTS ──────────────────────────────────────────────
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS auth_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'worker',
    department TEXT,
    organization TEXT DEFAULT 'SafetyMEG',
    is_active INTEGER NOT NULL DEFAULT 1,
    last_login INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT UNIQUE NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT UNIQUE NOT NULL,
    expires_at INTEGER NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
  );
`);

// ── DEFAULT ADMIN SEED ────────────────────────────────────────────────────
function hashPassword(password: string, salt: string): string {
  return createHash('sha256').update(salt + password + JWT_SECRET).digest('hex');
}

function generateSalt(): string {
  return randomBytes(16).toString('hex');
}

// Seed default admin if not exists
const adminExists = sqlite.prepare('SELECT id FROM auth_users WHERE email = ?').get('admin@safetymeg.com');
if (!adminExists) {
  const salt = generateSalt();
  const hash = hashPassword('Admin@SafetyMEG2025', salt);
  sqlite.prepare(`
    INSERT INTO auth_users (email, password_hash, salt, full_name, role, department, organization)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('admin@safetymeg.com', hash, salt, 'System Administrator', 'admin', 'EHS', 'SafetyMEG');
  logger.info('Default admin user seeded: admin@safetymeg.com / Admin@SafetyMEG2025');
}

// ── VALIDATION SCHEMAS ─────────────────────────────────────────────────────
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/, 'Must have uppercase').regex(/[0-9]/, 'Must have number'),
  fullName: z.string().min(2).max(200),
  role: z.enum(['worker', 'supervisor', 'manager', 'safety_officer', 'admin']).default('worker'),
  department: z.string().optional(),
  organization: z.string().optional(),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8).regex(/[A-Z]/, 'Must have uppercase').regex(/[0-9]/, 'Must have number'),
});

// ── HELPERS ────────────────────────────────────────────────────────────────
function now(): number { return Date.now(); }

function mapUser(r: any) {
  return {
    id: r.id,
    email: r.email,
    fullName: r.full_name,
    role: r.role,
    department: r.department,
    organization: r.organization,
    isActive: Boolean(r.is_active),
    lastLogin: r.last_login,
    createdAt: r.created_at,
  };
}

async function generateTokenPair(userId: number, role: string, email: string) {
  const accessPayload = {
    sub: String(userId),
    userId,
    role,
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + JWT_EXPIRES_IN,
  };

  const accessToken = await sign(accessPayload, JWT_SECRET);

  // Generate refresh token
  const refreshToken = randomBytes(48).toString('hex');
  const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex');
  const refreshExpires = now() + REFRESH_EXPIRES_IN * 1000;

  // Store refresh token
  sqlite.prepare(`
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
    VALUES (?, ?, ?)
  `).run(userId, refreshTokenHash, refreshExpires);

  // Cleanup old refresh tokens
  sqlite.prepare('DELETE FROM refresh_tokens WHERE expires_at < ?').run(now());

  return { accessToken, refreshToken, expiresIn: JWT_EXPIRES_IN };
}

// ── AUTH ROUTES ────────────────────────────────────────────────────────────
export function authRoutes(app: Hono) {

  /**
   * POST /api/auth/login
   */
  app.post('/api/auth/login', async (c) => {
    try {
      const body = await c.req.json();
      const v = LoginSchema.parse(body);

      const user = sqlite.prepare('SELECT * FROM auth_users WHERE email = ? AND is_active = 1').get(v.email) as any;
      if (!user) {
        logger.warn('Login failed - user not found', { email: v.email });
        return c.json({ success: false, error: 'Invalid email or password' }, 401);
      }

      const hash = hashPassword(v.password, user.salt);
      if (hash !== user.password_hash) {
        logger.warn('Login failed - wrong password', { email: v.email });
        return c.json({ success: false, error: 'Invalid email or password' }, 401);
      }

      // Update last login
      sqlite.prepare('UPDATE auth_users SET last_login = ? WHERE id = ?').run(now(), user.id);

      const { accessToken, refreshToken, expiresIn } = await generateTokenPair(user.id, user.role, user.email);

      logger.info('Login successful', { userId: user.id, email: user.email, role: user.role });

      return c.json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          expiresIn,
          tokenType: 'Bearer',
          user: mapUser(user),
        }
      }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      if (error instanceof SyntaxError) {
        return c.json({ success: false, error: 'Invalid JSON body' }, 400);
      }
      logger.error('Login error', { error });
      return c.json({ success: false, error: 'Login failed' }, 500);
    }
  });

  /**
   * POST /api/auth/register
   */
  app.post('/api/auth/register', async (c) => {
    try {
      const body = await c.req.json();
      const v = RegisterSchema.parse(body);

      const existing = sqlite.prepare('SELECT id FROM auth_users WHERE email = ?').get(v.email);
      if (existing) {
        return c.json({ success: false, error: 'Email already registered' }, 409);
      }

      const salt = generateSalt();
      const hash = hashPassword(v.password, salt);

      const result = sqlite.prepare(`
        INSERT INTO auth_users (email, password_hash, salt, full_name, role, department, organization)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(v.email, hash, salt, v.fullName, v.role, v.department ?? null, v.organization ?? 'SafetyMEG');

      const user = sqlite.prepare('SELECT * FROM auth_users WHERE id = ?').get(result.lastInsertRowid) as any;
      const { accessToken, refreshToken, expiresIn } = await generateTokenPair(user.id, user.role, user.email);

      logger.info('User registered', { userId: user.id, email: user.email, role: user.role });
      // Send Welcome Email
await sendSystemEmail({
  to: user.email,
  subject: 'Welcome to SafetyMEG Platform!',
  html: `<h2>Welcome, ${user.full_name}!</h2><p>Your account has been successfully created. You can now log in to the SafetyMEG Dashboard.</p>`
});

      return c.json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          expiresIn,
          tokenType: 'Bearer',
          user: mapUser(user),
        }
      }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      if (error instanceof SyntaxError) {
        return c.json({ success: false, error: 'Invalid JSON body' }, 400);
      }
      logger.error('Register error', { error });
      return c.json({ success: false, error: 'Registration failed' }, 500);
    }
  });

  /**
   * POST /api/auth/refresh
   */
  app.post('/api/auth/refresh', async (c) => {
    try {
      const body = await c.req.json();
      const { refreshToken } = body;
      if (!refreshToken) return c.json({ success: false, error: 'Refresh token required' }, 400);

      const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
      const stored = sqlite.prepare(`
        SELECT rt.*, au.email, au.role, au.is_active
        FROM refresh_tokens rt
        JOIN auth_users au ON rt.user_id = au.id
        WHERE rt.token_hash = ? AND rt.expires_at > ?
      `).get(tokenHash, now()) as any;

      if (!stored || !stored.is_active) {
        return c.json({ success: false, error: 'Invalid or expired refresh token' }, 401);
      }

      // Delete old refresh token
      sqlite.prepare('DELETE FROM refresh_tokens WHERE token_hash = ?').run(tokenHash);

      const { accessToken, refreshToken: newRefreshToken, expiresIn } = await generateTokenPair(stored.user_id, stored.role, stored.email);
      const user = sqlite.prepare('SELECT * FROM auth_users WHERE id = ?').get(stored.user_id);

      return c.json({
        success: true,
        data: {
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn,
          tokenType: 'Bearer',
          user: mapUser(user),
        }
      });
    } catch (error) {
      logger.error('Refresh token error', { error });
      return c.json({ success: false, error: 'Token refresh failed' }, 500);
    }
  });

  /**
   * POST /api/auth/logout
   */
  app.post('/api/auth/logout', async (c) => {
    try {
      const body = await c.req.json().catch(() => ({})) as any;
      const { refreshToken } = body;

      if (refreshToken) {
        const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
        sqlite.prepare('DELETE FROM refresh_tokens WHERE token_hash = ?').run(tokenHash);
      }

      return c.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      return c.json({ success: false, error: 'Logout failed' }, 500);
    }
  });

  /**
   * GET /api/auth/me
   * Get current user from JWT token
   */
  app.get('/api/auth/me', async (c) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return c.json({ success: false, error: 'Authorization token required' }, 401);
      }

      const token = authHeader.slice(7);
      let payload: any;
      try {
        payload = await verify(token, JWT_SECRET);
      } catch {
        return c.json({ success: false, error: 'Invalid or expired token' }, 401);
      }

      const user = sqlite.prepare('SELECT * FROM auth_users WHERE id = ? AND is_active = 1').get(payload.userId) as any;
      if (!user) {
        return c.json({ success: false, error: 'User not found' }, 404);
      }

      return c.json({ success: true, data: mapUser(user) });
    } catch (error) {
      logger.error('Get me error', { error });
      return c.json({ success: false, error: 'Failed to get user' }, 500);
    }
  });

  /**
   * PUT /api/auth/me
   * Update current user's profile
   */
  app.put('/api/auth/me', async (c) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return c.json({ success: false, error: 'Authorization token required' }, 401);
      }

      const token = authHeader.slice(7);
      let payload: any;
      try {
        payload = await verify(token, JWT_SECRET);
      } catch {
        return c.json({ success: false, error: 'Invalid or expired token' }, 401);
      }

      const body = await c.req.json();
      const UpdateSchema = z.object({
        fullName: z.string().min(2).max(200).optional(),
        department: z.string().optional(),
        organization: z.string().optional(),
      });
      const v = UpdateSchema.parse(body);

      const fields: string[] = ['updated_at = ?'];
      const params: any[] = [now()];
      if (v.fullName !== undefined) { fields.push('full_name = ?'); params.push(v.fullName); }
      if (v.department !== undefined) { fields.push('department = ?'); params.push(v.department); }
      if (v.organization !== undefined) { fields.push('organization = ?'); params.push(v.organization); }
      params.push(payload.userId);

      sqlite.prepare(`UPDATE auth_users SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      const user = sqlite.prepare('SELECT * FROM auth_users WHERE id = ?').get(payload.userId);

      return c.json({ success: true, data: mapUser(user) });
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      if (error instanceof SyntaxError) return c.json({ success: false, error: 'Invalid JSON body' }, 400);
      logger.error('Update profile error', { error });
      return c.json({ success: false, error: 'Failed to update profile' }, 500);
    }
  });

  app.post('/api/auth/forgot-password', async (c) => {
    try {
      const body = await c.req.json();
      const parsed = z.object({ email: z.string().email() }).safeParse(body);
      if (!parsed.success) {
        return c.json({ success: false, error: 'Valid email address is required' }, 400);
      }
      const { email } = parsed.data;

      const user = sqlite.prepare('SELECT id, full_name FROM auth_users WHERE email = ?').get(email) as any;
      if (!user) {
        // Security best practice: Don't reveal if email exists or not
        return c.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
      }

      // Generate a secure cryptographic reset token (48 random bytes = 96 hex chars)
      const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
      const resetToken = randomBytes(48).toString('hex');
      const resetTokenHash = createHash('sha256').update(resetToken).digest('hex');
      const resetExpires = now() + RESET_TOKEN_TTL_MS;

      // Invalidate any previous unused tokens for this user
      sqlite.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id);
      sqlite.prepare(
        'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
      ).run(user.id, resetTokenHash, resetExpires);

      const appUrl = process.env.FRONTEND_URL || 'https://safetymeg.com';
      const resetLink = `${appUrl}/#/reset-password?token=${resetToken}`;

      await sendSystemEmail({
        to: email,
        subject: 'SafetyMEG - Password Reset Request',
        html: `<p>Hi ${user.full_name},</p><p>Click the link below to reset your password (valid for 1 hour):</p><a href="${resetLink}">Reset Password</a><p>If you did not request this, please ignore this email.</p>`
      });

      return c.json({ success: true, message: 'Password reset link sent to email.' });
    } catch (error) {
      logger.error('Forgot password error', error);
      return c.json({ success: false, error: 'Failed to process request' }, 500);
    }
  });

  /**
   * POST /api/auth/reset-password
   * Consumes a valid password reset token and sets a new password.
   */
  app.post('/api/auth/reset-password', async (c) => {
    try {
      const body = await c.req.json();
      const { token, newPassword } = body;

      if (!token || typeof token !== 'string' || token.length < 32) {
        return c.json({ success: false, error: 'Invalid reset token' }, 400);
      }
      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
        return c.json({ success: false, error: 'New password must be at least 8 characters' }, 400);
      }
      if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        return c.json({ success: false, error: 'Password must contain an uppercase letter and a number' }, 400);
      }

      const tokenHash = createHash('sha256').update(token).digest('hex');
      const record = sqlite.prepare(
        'SELECT * FROM password_reset_tokens WHERE token_hash = ? AND expires_at > ? AND used = 0'
      ).get(tokenHash, now()) as any;

      if (!record) {
        return c.json({ success: false, error: 'Reset token is invalid or has expired' }, 400);
      }

      const newSalt = generateSalt();
      const newHash = hashPassword(newPassword, newSalt);

      // Update password and mark token as used in one atomic operation
      const updatePwd = sqlite.prepare(
        'UPDATE auth_users SET password_hash = ?, salt = ?, updated_at = ? WHERE id = ?'
      );
      const markUsed = sqlite.prepare(
        'UPDATE password_reset_tokens SET used = 1 WHERE token_hash = ?'
      );
      const revokeTokens = sqlite.prepare(
        'DELETE FROM refresh_tokens WHERE user_id = ?'
      );

      sqlite.transaction(() => {
        updatePwd.run(newHash, newSalt, now(), record.user_id);
        markUsed.run(tokenHash);
        revokeTokens.run(record.user_id);
      })();

      logger.info('Password reset completed', { userId: record.user_id });
      return c.json({ success: true, message: 'Password has been reset successfully. Please log in.' });
    } catch (error) {
      logger.error('Reset password error', error);
      return c.json({ success: false, error: 'Failed to reset password' }, 500);
    }
  });

  /**
   * POST /api/auth/change-password
   */
  app.post('/api/auth/change-password', async (c) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return c.json({ success: false, error: 'Authorization token required' }, 401);
      }

      const token = authHeader.slice(7);
      let payload: any;
      try {
        payload = await verify(token, JWT_SECRET);
      } catch {
        return c.json({ success: false, error: 'Invalid or expired token' }, 401);
      }

      const body = await c.req.json();
      const v = ChangePasswordSchema.parse(body);

      const user = sqlite.prepare('SELECT * FROM auth_users WHERE id = ?').get(payload.userId) as any;
      if (!user) return c.json({ success: false, error: 'User not found' }, 404);

      const currentHash = hashPassword(v.currentPassword, user.salt);
      if (currentHash !== user.password_hash) {
        return c.json({ success: false, error: 'Current password is incorrect' }, 400);
      }

      const newSalt = generateSalt();
      const newHash = hashPassword(v.newPassword, newSalt);
      sqlite.prepare('UPDATE auth_users SET password_hash = ?, salt = ?, updated_at = ? WHERE id = ?')
        .run(newHash, newSalt, now(), payload.userId);

      // Revoke all refresh tokens
      sqlite.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(payload.userId);

      logger.info('Password changed', { userId: payload.userId });
      return c.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      if (error instanceof SyntaxError) return c.json({ success: false, error: 'Invalid JSON body' }, 400);
      logger.error('Change password error', { error });
      return c.json({ success: false, error: 'Failed to change password' }, 500);
    }
  });

  /**
   * GET /api/auth/users
   * Admin only: list all users
   */
  app.get('/api/auth/users', async (c) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return c.json({ success: false, error: 'Authorization required' }, 401);
      }

      const token = authHeader.slice(7);
      let payload: any;
      try {
        payload = await verify(token, JWT_SECRET);
      } catch {
        return c.json({ success: false, error: 'Invalid token' }, 401);
      }

      if (!['admin', 'manager', 'safety_officer'].includes(payload.role)) {
        return c.json({ success: false, error: 'Insufficient permissions' }, 403);
      }

      const users = sqlite.prepare('SELECT * FROM auth_users ORDER BY created_at DESC').all() as any[];
      return c.json({
        success: true,
        data: users.map(mapUser),
        count: users.length,
      });
    } catch (error) {
      logger.error('List users error', { error });
      return c.json({ success: false, error: 'Failed to list users' }, 500);
    }
  });
}

// ── JWT MIDDLEWARE FACTORY ─────────────────────────────────────────────────
export async function verifyJWT(token: string): Promise<any | null> {
  try {
    return await verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function createAuthMiddleware(requiredRoles?: string[]) {
  return async (c: any, next: any) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ success: false, error: 'Authorization token required' }, 401);
    }

    const token = authHeader.slice(7);
    const payload = await verifyJWT(token);
    if (!payload) {
      return c.json({ success: false, error: 'Invalid or expired token' }, 401);
    }

    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(payload.role)) {
        return c.json({ success: false, error: 'Insufficient permissions', required: requiredRoles, current: payload.role }, 403);
      }
    }

    c.set('user', payload);
    c.set('userId', payload.userId);
    c.set('userRole', payload.role);
    await next();
  };
}
