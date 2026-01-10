import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Generate a random 8-character alphanumeric friend code
 * @returns 8-character uppercase alphanumeric string
 */
function generateRandomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate a unique friend code that doesn't exist in the database
 * @param db - Drizzle database instance
 * @returns Unique 8-character friend code
 */
export async function generateFriendCode(db: DrizzleD1Database): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const code = generateRandomCode();
    
    // Check if code already exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.friendCode, code))
      .limit(1);
    
    if (existing.length === 0) {
      return code;
    }
    
    attempts++;
  }
  
  throw new Error('Failed to generate unique friend code after 10 attempts');
}
