import type { UserRole } from "./auth";

export type AdminUser = {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  athleteProfile: { displayName: string } | null;
  coachProfile: { displayName: string } | null;
};

export type AdminUsersResponse = {
  items: AdminUser[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};
