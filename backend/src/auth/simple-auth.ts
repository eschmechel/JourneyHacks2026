import { eq } from 'drizzle-orm';
import { users } from '../db/schema';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

/**
 * Generate a device secret using crypto.randomUUID()
 * Format: UUID v4 (e.g., "550e8400-e29b-41d4-a716-446655440000")
 */
export function generateDeviceSecret(): string {
  return crypto.randomUUID();
}

/**
 * Verify a device secret by looking it up in the database
 * @param db - Drizzle database instance
 * @param secret - Device secret to verify
 * @returns User record if valid, null if not found
 */
export async function verifyDeviceSecret(
  db: DrizzleD1Database,
  secret: string
): Promise<typeof users.$inferSelect | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.deviceSecret, secret))
    .limit(1);

  return user || null;
}
