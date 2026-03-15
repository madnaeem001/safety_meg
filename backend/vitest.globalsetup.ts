/**
 * Vitest global setup
 * Runs once before all test suites.
 * Sets required environment variables so that backend modules can load without
 * calling process.exit(1).
 *
 * NOTE: Must match the JWT_SECRET used in individual test files so that token
 * signing/verification is consistent across tests.
 */
export function setup() {
  process.env.NODE_ENV = 'test';
  // Must be ≥32 chars.  Matches value used in existing test file token helpers.
  process.env.JWT_SECRET =
    process.env.JWT_SECRET ?? 'safetymeg-jwt-secret-2025-change-in-production';
}
