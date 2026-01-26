import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';

/**
 * Utility interface for user payload from JWT
 */
export interface UserPayload {
  sub?: string;
  id?: string;
  userId?: string;
}

/**
 * Extract user ID from various JWT payload formats
 */
export function extractUserId(payload: UserPayload | null | undefined): string | null {
  if (!payload) return null;
  return payload.sub || payload.id || payload.userId || null;
}

/**
 * Check if a user is an admin by their ID
 * Uses DataSource to avoid circular dependency issues
 */
export async function isUserAdmin(
  dataSource: DataSource,
  userPayload: UserPayload | null | undefined,
): Promise<boolean> {
  const userId = extractUserId(userPayload);
  if (!userId) return false;

  const user = await dataSource.getRepository(User).findOne({
    where: { id: userId },
    select: ['id', 'isAdmin'],
  });

  return user?.isAdmin === true;
}

/**
 * Check if the user in payload owns the resource (by seller ID)
 */
export function isResourceOwner(
  userPayload: UserPayload | null | undefined,
  ownerId: string,
): boolean {
  const userId = extractUserId(userPayload);
  return userId === ownerId;
}

/**
 * Check if user is admin or owns the resource
 */
export async function isAdminOrOwner(
  dataSource: DataSource,
  userPayload: UserPayload | null | undefined,
  ownerId: string,
): Promise<boolean> {
  if (isResourceOwner(userPayload, ownerId)) {
    return true;
  }
  return isUserAdmin(dataSource, userPayload);
}
