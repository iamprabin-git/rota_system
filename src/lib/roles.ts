import type { UserRole } from "./types";

export function homePath(role: UserRole): string {
  if (role === "admin") return "/admin";
  if (role === "agent") return "/agent";
  return "/me";
}
