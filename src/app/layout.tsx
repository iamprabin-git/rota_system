import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { ThemeScript } from "@/components/ThemeScript";
import { getSession, toSessionUser } from "@/lib/auth";
import { getCompany, getEmployee, getUser } from "@/lib/db";
import { buildStaffNotifications } from "@/lib/notifications";
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
  const user = stored ? toSessionUser(stored) : session;
  const employee = user?.employeeId ? await getEmployee(user.employeeId) : undefined;
  const company = user?.companyId ? await getCompany(user.companyId) : undefined;
  const notifications = employee ? await buildStaffNotifications(employee.id) : [];
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
          companyName={company?.tradingName || company?.name}
          notifications={notifications}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
