import type { IconName } from "@/components/Icon";
import type { UserRole } from "@/lib/types";

export type PanelNavItem = {
  href: string;
  label: string;
  hint: string;
  icon: IconName;
};

export type PanelHeading = {
  kicker: string;
  title: string;
  icon: IconName;
};

export const ADMIN_NAV: PanelNavItem[] = [
  { href: "/admin", label: "Dashboard", hint: "Platform overview", icon: "layout" },
  { href: "/admin/companies", label: "Companies", hint: "Employers on the system", icon: "building" },
  { href: "/admin/agents", label: "Agents", hint: "Payroll logins", icon: "users" },
];

export const AGENT_NAV: PanelNavItem[] = [
  { href: "/agent", label: "Dashboard", hint: "Company payroll", icon: "layout" },
  { href: "/agent/rota", label: "Rota", hint: "Weekly hours", icon: "calendar" },
  { href: "/agent/employees", label: "People", hint: "Staff and wages", icon: "users" },
  { href: "/agent/payslips", label: "Payslips", hint: "UK PAYE statements", icon: "fileText" },
  { href: "/agent/settings", label: "Employer", hint: "Company details", icon: "briefcase" },
];

export const USER_NAV: PanelNavItem[] = [
  { href: "/me", label: "Overview", hint: "Hours, pay and files", icon: "home" },
  { href: "/me/hours", label: "Hours", hint: "Timesheet entries", icon: "clock" },
  { href: "/me/statements", label: "Statements", hint: "Itemised payslips", icon: "fileText" },
  { href: "/me/payments", label: "Payments", hint: "Due and received", icon: "wallet" },
  { href: "/me/files", label: "Files", hint: "Personal records", icon: "folder" },
];

const ADMIN_TITLES: Record<string, PanelHeading> = {
  "/admin": { kicker: "Admin panel", title: "Dashboard", icon: "layout" },
  "/admin/companies/new": { kicker: "Companies", title: "New company", icon: "buildingPlus" },
  "/admin/companies": { kicker: "Platform", title: "Companies", icon: "building" },
  "/admin/agents": { kicker: "Access", title: "Agents", icon: "users" },
  "/profile": { kicker: "Account", title: "Profile", icon: "user" },
};

const AGENT_TITLES: Record<string, PanelHeading> = {
  "/agent": { kicker: "Agent panel", title: "Dashboard", icon: "layout" },
  "/agent/rota": { kicker: "Weekly hours", title: "Rota", icon: "calendar" },
  "/agent/employees/new": { kicker: "Workforce", title: "Add a person", icon: "userPlus" },
  "/agent/employees": { kicker: "Workforce", title: "People", icon: "users" },
  "/agent/payslips/new": { kicker: "PAYE 2026/27", title: "Generate payslip", icon: "receipt" },
  "/agent/payslips": { kicker: "PAYE 2026/27", title: "Payslips", icon: "fileText" },
  "/agent/settings": { kicker: "Employer", title: "Company details", icon: "briefcase" },
  "/payslips": { kicker: "Statement", title: "Payslip", icon: "fileText" },
  "/profile": { kicker: "Account", title: "Profile", icon: "user" },
};

const USER_TITLES: Record<string, PanelHeading> = {
  "/me": { kicker: "Personal workspace", title: "Overview", icon: "home" },
  "/me/hours": { kicker: "Timesheet", title: "Hours worked", icon: "clock" },
  "/me/statements": { kicker: "Payroll", title: "Statements", icon: "fileText" },
  "/me/payments": { kicker: "Money", title: "Payments", icon: "wallet" },
  "/me/files": { kicker: "Records", title: "Files", icon: "folder" },
  "/payslips": { kicker: "Statement", title: "Payslip", icon: "fileText" },
  "/profile": { kicker: "Account", title: "Profile", icon: "user" },
};

const FALLBACK: Record<UserRole, PanelHeading> = {
  admin: ADMIN_TITLES["/admin"],
  agent: AGENT_TITLES["/agent"],
  user: USER_TITLES["/me"],
};

export function panelNav(role: UserRole): PanelNavItem[] {
  if (role === "admin") return ADMIN_NAV;
  if (role === "agent") return AGENT_NAV;
  return USER_NAV;
}

export function panelHome(role: UserRole): string {
  if (role === "admin") return "/admin";
  if (role === "agent") return "/agent";
  return "/me";
}

export function panelLabel(role: UserRole): string {
  if (role === "admin") return "Admin panel";
  if (role === "agent") return "Agent panel";
  return "User panel";
}

export function panelBrandIcon(role: UserRole): IconName {
  if (role === "admin") return "shield";
  if (role === "agent") return "briefcase";
  return "user";
}

export function panelHeading(role: UserRole, pathname: string): PanelHeading {
  const titles = role === "admin" ? ADMIN_TITLES : role === "agent" ? AGENT_TITLES : USER_TITLES;
  if (titles[pathname]) return titles[pathname];
  const match = Object.keys(titles)
    .filter((key) => pathname === key || pathname.startsWith(`${key}/`))
    .sort((a, b) => b.length - a.length)[0];
  return match ? titles[match] : FALLBACK[role];
}

export function isPanelActive(pathname: string, href: string, home: string) {
  if (href === home) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
