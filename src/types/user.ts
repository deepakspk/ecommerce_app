/**
 * Mirrors the backend's User model response shape
 * (01-DOCUMENTATION.md §4.1 / §5).
 */
export type UserRole = 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}
