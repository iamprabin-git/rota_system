import { formatDate, hoursLabel, money, startOfWeek } from "./format";
import { listFiles, listHourLogs, listPayslips, listPayments } from "./db";

export type StaffNotice = {
  id: string;
  title: string;
  body: string;
  href: string;
  kind: "pay" | "hours" | "statement" | "file";
  createdAt: string;
};

export function buildStaffNotifications(employeeId: string): StaffNotice[] {
  const notices: StaffNotice[] = [];
  const due = listPayments(employeeId).filter((item) => item.status === "due");
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
  const weekHours = listHourLogs(employeeId).filter((log) => log.date >= weekStart);
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

  const slips = listPayslips(employeeId);
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

  const files = listFiles(employeeId);
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

  return notices.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
