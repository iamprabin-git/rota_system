import type { IconName } from "@/components/Icon";
import type { UserRole } from "@/lib/types";

export type PanelNavItem = {
  href: string;
  label: string;
  hint: string;
  icon: IconName;
};

export type PanelNavGroup = {
  label: string;
  items: PanelNavItem[];
};

export type PanelHeading = {
  kicker: string;
  title: string;
  icon: IconName;
};

export const ADMIN_NAV: PanelNavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", hint: "Platform overview", icon: "layout" }],
  },
  {
    label: "Companies",
    items: [
      { href: "/admin/companies", label: "Companies", hint: "Create and allow access", icon: "building" },
      { href: "/admin/payments", label: "Payments", hint: "Company invoices", icon: "wallet" },
      { href: "/admin/crm", label: "CRM", hint: "Follow-ups and notes", icon: "phone" },
    ],
  },
  {
    label: "Access",
    items: [{ href: "/admin/agents", label: "Agents", hint: "Payroll logins", icon: "users" }],
  },
];

export const AGENT_NAV: PanelNavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/agent", label: "Dashboard", hint: "Company payroll", icon: "layout" }],
  },
  {
    label: "Hours",
    items: [
      { href: "/agent/rota", label: "Rota", hint: "Create hours for people", icon: "calendar" },
      { href: "/agent/hours", label: "Hours", hint: "Approve timesheets", icon: "clock" },
    ],
  },
  {
    label: "Workforce",
    items: [
      { href: "/agent/employees", label: "People", hint: "Staff and wages", icon: "users" },
      { href: "/agent/users", label: "Users", hint: "Create and approve logins", icon: "lock" },
    ],
  },
  {
    label: "Payroll",
    items: [{ href: "/agent/payslips", label: "Payslips", hint: "Generate and approve", icon: "fileText" }],
  },
  {
    label: "Company",
    items: [{ href: "/agent/settings", label: "Employer", hint: "Company details", icon: "briefcase" }],
  },
];

export const USER_NAV: PanelNavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/me", label: "Overview", hint: "Hours, pay and files", icon: "home" }],
  },
  {
    label: "Time",
    items: [
      { href: "/me/hours", label: "Hours", hint: "Timesheet entries", icon: "clock" },
      { href: "/me/rota", label: "Rota", hint: "Your scheduled days", icon: "calendar" },
    ],
  },
  {
    label: "Pay",
    items: [
      { href: "/me/statements", label: "Statements", hint: "Daily hours and payslips", icon: "fileText" },
      { href: "/me/payments", label: "Payments", hint: "Due and received", icon: "wallet" },
    ],
  },
  {
    label: "Tools",
    items: [{ href: "/me/calculators", label: "Calculators", hint: "Hours and take-home", icon: "calculator" }],
  },
  {
    label: "Records",
    items: [{ href: "/me/files", label: "Files", hint: "Personal records", icon: "folder" }],
  },
];

const ADMIN_TITLES: Record<string, PanelHeading> = {
  "/admin": { kicker: "Admin panel", title: "Dashboard", icon: "layout" },
  "/admin/companies/new": { kicker: "Companies", title: "New company", icon: "buildingPlus" },
  "/admin/companies": { kicker: "Platform", title: "Companies", icon: "building" },
  "/admin/payments": { kicker: "Billing", title: "Company payments", icon: "wallet" },
  "/admin/crm": { kicker: "Accounts", title: "Company CRM", icon: "phone" },
  "/admin/agents": { kicker: "Access", title: "Agents", icon: "users" },
  "/profile": { kicker: "Account", title: "Profile", icon: "user" },
};

const AGENT_TITLES: Record<string, PanelHeading> = {
  "/agent": { kicker: "Agent panel", title: "Dashboard", icon: "layout" },
  "/agent/rota": { kicker: "Weekly hours", title: "Create rota", icon: "calendar" },
  "/agent/hours": { kicker: "Timesheets", title: "Approve hours", icon: "clock" },
  "/agent/employees/new": { kicker: "Workforce", title: "Add a person", icon: "userPlus" },
  "/agent/employees": { kicker: "Workforce", title: "People", icon: "users" },
  "/agent/users": { kicker: "Access", title: "User management", icon: "lock" },
  "/agent/payslips/new": { kicker: "PAYE 2026/27", title: "Generate payslip", icon: "receipt" },
  "/agent/payslips": { kicker: "PAYE 2026/27", title: "Approve payslips", icon: "fileText" },
  "/agent/settings": { kicker: "Employer", title: "Company details", icon: "briefcase" },
  "/payslips": { kicker: "Statement", title: "Payslip", icon: "fileText" },
  "/profile": { kicker: "Account", title: "Profile", icon: "user" },
};

const USER_TITLES: Record<string, PanelHeading> = {
  "/me": { kicker: "Personal workspace", title: "Overview", icon: "home" },
  "/me/hours": { kicker: "Timesheet", title: "Hours worked", icon: "clock" },
  "/me/rota": { kicker: "Schedule", title: "My rota", icon: "calendar" },
  "/me/statements": { kicker: "Payroll", title: "Statements", icon: "fileText" },
  "/me/calculators": { kicker: "Tools", title: "Calculators", icon: "calculator" },
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

export function panelNavGroups(role: UserRole): PanelNavGroup[] {
  if (role === "admin") return ADMIN_NAV;
  if (role === "agent") return AGENT_NAV;
  return USER_NAV;
}

export function panelNav(role: UserRole): PanelNavItem[] {
  return panelNavGroups(role).flatMap((group) => group.items);
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
