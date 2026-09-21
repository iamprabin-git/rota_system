import { accountStatus } from "./approvals";
import { companyAccess, followUpDue } from "./company";
import { getEmployee, listAgents, listCompanies, listCompanyFollowUps, listCompanyPayments, listEmployees, listFiles, listHourLogs, listPayslips, listPayments, listRota, listUsers } from "./db";
import { formatDate, formatDateLong, hoursLabel, money, startOfWeek } from "./format";
import { dueShiftReminders, upcomingShifts } from "./shifts";
import type { StaffNotice } from "./notice-types";
import type { SessionUser } from "./types";

export type { NoticeKind, StaffNotice } from "./notice-types";
export { noticeIcon } from "./notice-types";

export async function buildNotifications(user: Pick<SessionUser, "role" | "companyId" | "employeeId">): Promise<StaffNotice[]> {
  if (user.role === "admin") return buildAdminNotifications();
  if (user.role === "agent") return buildAgentNotifications(user.companyId);
  if (user.employeeId) return buildStaffNotifications(user.employeeId);
  return [
    {
      id: "user-unlinked",
      title: "No staff record linked",
      body: "Ask payroll to link this login to a person before hours and payslips appear.",
      href: "/profile",
      kind: "user",
      createdAt: new Date().toISOString(),
    },
  ];
}

export async function buildStaffNotifications(employeeId: string): Promise<StaffNotice[]> {
  const notices: StaffNotice[] = [];
  const due = (await listPayments(employeeId)).filter((item) => item.status === "due");
  const dueTotal = due.reduce((sum, item) => sum + item.amount, 0);
  if (dueTotal > 0) {
    const latest = due[0];
    notices.push({
      id: `due-${latest.id}`,
      title: "Payment due",
      body: `${money(dueTotal)} is waiting to be marked as received.`,
      href: "/me/payments",
      kind: "pay",
      createdAt: latest.createdAt,
    });
  }

  const weekStart = startOfWeek();
  const logs = await listHourLogs(employeeId);
  const pendingHours = logs.filter((log) => log.status === "pending");
  if (pendingHours.length) {
    notices.push({
      id: `hours-pending-${weekStart}`,
      title: "Hours waiting for approval",
      body: `${pendingHours.length} timesheet ${pendingHours.length === 1 ? "entry is" : "entries are"} with payroll.`,
      href: "/me/hours",
      kind: "hours",
      createdAt: pendingHours[0].updatedAt,
    });
  } else {
    const weekHours = logs.filter((log) => log.date >= weekStart && log.status !== "rejected");
    const weekTotal = weekHours.reduce((sum, log) => sum + log.hours + log.overtimeHours, 0);
    if (weekTotal === 0) {
      notices.push({
        id: `hours-week-${weekStart}`,
        title: "Hours not logged",
        body: "This week has no hours on your record yet.",
        href: "/me/hours",
        kind: "hours",
        createdAt: new Date().toISOString(),
      });
    }
  }

  const slips = (await listPayslips(employeeId)).filter((slip) => slip.status === "approved");
  if (slips[0]) {
    const slip = slips[0];
    notices.push({
      id: `slip-${slip.id}`,
      title: "Statement ready",
      body: `${formatDate(slip.periodStart)} – ${formatDate(slip.periodEnd)} · ${hoursLabel(slip.calculation.regularHours + slip.calculation.overtimeHours)} · ${money(slip.calculation.netPay)} net.`,
      href: `/payslips/${slip.id}`,
      kind: "statement",
      createdAt: slip.createdAt,
    });
  }

  const employee = await getEmployee(employeeId);
  const rota = await listRota(undefined, employee?.companyId);
  const mine = rota.filter((entry) => entry.employeeId === employeeId);
  for (const reminder of dueShiftReminders(upcomingShifts(logs, mine))) {
    notices.push({
      id: reminder.id,
      title: "Shift starts in 1 hour",
      body: `${formatDateLong(reminder.date)} ${reminder.startTime}–${reminder.endTime} · ${hoursLabel(reminder.hours)} scheduled.`,
      href: "/me/rota",
      kind: "rota",
      createdAt: reminder.remindAt,
    });
  }

  const files = await listFiles(employeeId);
  if (files[0]) {
    notices.push({
      id: `file-${files[0].id}`,
      title: "Latest record file",
      body: files[0].originalName,
      href: "/me/files",
      kind: "file",
      createdAt: files[0].uploadedAt,
    });
  }

  return sortNotices(notices);
}

async function buildAgentNotifications(companyId: string | null): Promise<StaffNotice[]> {
  if (!companyId) {
    return [
      {
        id: "agent-no-company",
        title: "No company linked",
        body: "This agent login is not attached to an employer.",
        href: "/agent/settings",
        kind: "company",
        createdAt: new Date().toISOString(),
      },
    ];
  }

  const notices: StaffNotice[] = [];
  const logs = await listHourLogs(undefined, companyId);
  const pendingHours = logs.filter((log) => log.status === "pending");
  if (pendingHours.length) {
    notices.push({
      id: "agent-hours-pending",
      title: "Hours to approve",
      body: `${pendingHours.length} timesheet ${pendingHours.length === 1 ? "entry is" : "entries are"} waiting.`,
      href: "/agent/hours",
      kind: "hours",
      createdAt: pendingHours[0].updatedAt || pendingHours[0].createdAt,
    });
  }

  const slips = await listPayslips(undefined, companyId);
  const pendingSlips = slips.filter((slip) => slip.status === "pending");
  if (pendingSlips.length) {
    notices.push({
      id: "agent-payslips-pending",
      title: "Payslips to approve",
      body: `${pendingSlips.length} statement${pendingSlips.length === 1 ? "" : "s"} waiting to publish to staff.`,
      href: "/agent/payslips",
      kind: "statement",
      createdAt: pendingSlips[0].createdAt,
    });
  }

  const users = (await listUsers(companyId)).filter((item) => item.role === "user");
  const pendingUsers = users.filter((item) => accountStatus(item) === "pending");
  if (pendingUsers.length) {
    notices.push({
      id: "agent-users-pending",
      title: "Users waiting for approval",
      body: `${pendingUsers.length} staff login${pendingUsers.length === 1 ? "" : "s"} cannot sign in until approved.`,
      href: "/agent/users",
      kind: "user",
      createdAt: pendingUsers[0].createdAt,
    });
  }

  const employees = await listEmployees(companyId);
  const linked = new Set(users.map((item) => item.employeeId).filter(Boolean));
  const unlinked = employees.filter((employee) => !linked.has(employee.id));
  if (unlinked.length) {
    notices.push({
      id: "agent-users-unlinked",
      title: "People without a login",
      body: `${unlinked.length} payroll record${unlinked.length === 1 ? " has" : "s have"} no user account.`,
      href: "/agent/users",
      kind: "user",
      createdAt: unlinked[0].createdAt,
    });
  }

  const due = (await listPayments(undefined, companyId)).filter((item) => item.status === "due");
  const dueTotal = due.reduce((sum, item) => sum + item.amount, 0);
  if (dueTotal > 0) {
    notices.push({
      id: `agent-pay-due-${due[0].id}`,
      title: "Payments due",
      body: `${money(dueTotal)} across ${due.length} payment${due.length === 1 ? "" : "s"} still marked as due.`,
      href: "/agent",
      kind: "pay",
      createdAt: due[0].createdAt,
    });
  }

  return sortNotices(notices);
}

async function buildAdminNotifications(): Promise<StaffNotice[]> {
  const notices: StaffNotice[] = [];
  const companies = await listCompanies();
  const agents = await listAgents();
  const people = await listEmployees();

  if (companies.length === 0) {
    notices.push({
      id: "admin-no-companies",
      title: "No companies yet",
      body: "Add an employer so agents can run payroll.",
      href: "/admin/companies/new",
      kind: "company",
      createdAt: new Date().toISOString(),
    });
    return notices;
  }

  const missingAgents = companies.filter((company) => !agents.some((agent) => agent.companyId === company.id));
  for (const company of missingAgents.slice(0, 6)) {
    notices.push({
      id: `admin-no-agent-${company.id}`,
      title: "Company needs an agent",
      body: `${company.tradingName || company.name} has no payroll login.`,
      href: `/admin/companies/${company.id}`,
      kind: "agent",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  }

  const emptyCompanies = companies.filter((company) => !people.some((person) => person.companyId === company.id));
  for (const company of emptyCompanies.slice(0, 4)) {
    notices.push({
      id: `admin-no-people-${company.id}`,
      title: "Company has no people",
      body: `${company.tradingName || company.name} has no staff records yet.`,
      href: `/admin/companies/${company.id}`,
      kind: "company",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  }

  if (agents.length === 0) {
    notices.push({
      id: "admin-no-agents",
      title: "No agents on the platform",
      body: "Create a company agent so payroll can start.",
      href: "/admin/agents",
      kind: "agent",
      createdAt: new Date().toISOString(),
    });
  }

  const blocked = companies.filter((company) => companyAccess(company) === "disallowed");
  if (blocked[0]) {
    notices.push({
      id: `admin-disallowed-${blocked[0].id}`,
      title: "Companies disallowed",
      body: `${blocked.length} compan${blocked.length === 1 ? "y is" : "ies are"} blocked from signing in.`,
      href: "/admin/companies",
      kind: "company",
      createdAt: new Date().toISOString(),
    });
  }

  const invoices = await listCompanyPayments();
  const deactive = companies.filter((company) => {
    if (companyAccess(company) !== "allowed") return false;
    const due = invoices.filter((item) => item.companyId === company.id && item.status === "due");
    return company.live === "deactive" || due.length > 0;
  });
  if (deactive[0]) {
    notices.push({
      id: `admin-deactive-${deactive[0].id}`,
      title: "Companies deactive",
      body: `${deactive.length} allowed compan${deactive.length === 1 ? "y is" : "ies are"} deactive until payment is received.`,
      href: "/admin/companies",
      kind: "pay",
      createdAt: new Date().toISOString(),
    });
  }

  const dueInvoices = invoices.filter((item) => item.status === "due");
  const dueTotal = dueInvoices.reduce((sum, item) => sum + item.amount, 0);
  if (dueTotal > 0) {
    notices.push({
      id: `admin-company-pay-${dueInvoices[0].id}`,
      title: "Company payments due",
      body: `${money(dueTotal)} across ${dueInvoices.length} company invoice${dueInvoices.length === 1 ? "" : "s"}.`,
      href: "/admin/payments",
      kind: "pay",
      createdAt: dueInvoices[0].createdAt,
    });
  }

  const followUps = (await listCompanyFollowUps()).filter((item) => followUpDue(item));
  if (followUps[0]) {
    notices.push({
      id: `admin-followup-${followUps[0].id}`,
      title: "Company follow-ups due",
      body: `${followUps.length} compan${followUps.length === 1 ? "y needs" : "ies need"} a follow-up.`,
      href: "/admin/crm",
      kind: "company",
      createdAt: followUps[0].createdAt,
    });
  }

  return sortNotices(notices);
}

function sortNotices(notices: StaffNotice[]) {
  return notices.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
