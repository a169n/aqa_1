import type { UserRole } from '../constants/roles';

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl: string | null;
}

