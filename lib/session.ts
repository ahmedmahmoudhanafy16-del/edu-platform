import { getCurrentUser } from '@/lib/auth';

/**
 * Returns the current authenticated session user.
 * Read session in Server Components with: import { getSession } from '@/lib/session'
 */
export async function getSession() {
  return await getCurrentUser();
}
