import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { ThemeScript } from "@/components/ThemeScript";
import { assertCompanyAllowed } from "@/lib/access";
import { getSession, toSessionUser } from "@/lib/auth";
import { isAccountActive } from "@/lib/approvals";
import { getCompany, getEmployee, getUser } from "@/lib/db";
import { buildNotifications } from "@/lib/notifications";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RotaSystem — UK payslips",
  description: "UK working hours, hourly wages, and PAYE payslip generator for the 2026/27 tax year.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  const stored = session ? await getUser(session.id) : undefined;
  const active = stored && isAccountActive(stored) ? toSessionUser(stored) : stored ? null : session;
  const companyGate = active ? await assertCompanyAllowed(active) : { ok: true };
  const user = companyGate.ok ? active : null;
  const employee = user?.employeeId ? await getEmployee(user.employeeId) : undefined;
  const companyId = user?.companyId || employee?.companyId;
  const company = companyId ? await getCompany(companyId) : undefined;
  const notifications = user ? await buildNotifications(user) : [];
  return (
    <html
      lang="en-GB"
      data-theme="light"
      suppressHydrationWarning
      className={`${figtree.variable} ${fraunces.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className="min-h-full">
        <AppShell
          user={user}
          employee={employee}
          company={company}
          notifications={notifications}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
