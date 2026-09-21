import type { User } from "./types";

export type PublicProfile = {
  id: string;
  email: string;
  name: string;
  role: User["role"];
  companyId: string | null;
  employeeId: string | null;
  avatar: string;
  phone: string;
  jobTitle: string;
  notifyEmail: boolean;
};

export function publicProfile(user: User): PublicProfile {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    companyId: user.companyId,
    employeeId: user.employeeId,
    avatar: user.avatar || "",
    phone: user.phone || "",
    jobTitle: user.jobTitle || "",
    notifyEmail: user.notifyEmail !== false,
  };
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] || ""}${parts[1]?.[0] || parts[0]?.[1] || ""}`.toUpperCase();
}
