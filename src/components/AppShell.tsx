"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";
import { ThemeToggle } from "@/components/ThemeToggle";
import { homePath } from "@/lib/roles";
import type { SessionUser } from "@/lib/types";

const ADMIN_NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin", label: "Companies", icon: "building" },
];

const AGENT_NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/agent", label: "Dashboard", icon: "layout" },
  { href: "/agent/rota", label: "Rota", icon: "calendar" },
  { href: "/agent/employees", label: "People", icon: "users" },
  { href: "/agent/payslips", label: "Payslips", icon: "fileText" },
  { href: "/agent/settings", label: "Employer", icon: "briefcase" },
];

export function AppShell({ children, user }: { children: React.ReactNode; user: SessionUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const login = pathname === "/login";
  const printing = pathname.startsWith("/payslips/") && pathname !== "/payslips/new" && !pathname.startsWith("/agent/payslips");
  const nav = user?.role === "admin" ? ADMIN_NAV : user?.role === "agent" ? AGENT_NAV : [];
  const home = user ? homePath(user.role) : "/login";
  const panelLabel = user?.role === "admin" ? "Admin panel" : user?.role === "agent" ? "Agent panel" : "User panel";
  const brandIcon: IconName = user?.role === "admin" ? "shield" : user?.role === "agent" ? "briefcase" : "user";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (login) {
    return <>{children}</>;
  }

  if (user?.role === "user" && pathname.startsWith("/me")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-full">
      <header className="site-header no-print sticky top-0 z-30">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href={home} className="flex items-center gap-3">
            <span className="heading-icon compact">
              <Icon name={brandIcon} size={16} />
            </span>
            <span>
              <span className="serif block text-lg leading-none">RotaSystem</span>
              <span className="text-[0.7rem] uppercase tracking-[0.18em] text-ink-soft">
                {panelLabel}
              </span>
            </span>
          </Link>
          <nav className="order-3 flex w-full flex-wrap items-center gap-1 text-sm md:order-none md:w-auto">
            {nav.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname.startsWith("/admin")
                  : item.href === "/agent"
                    ? pathname === "/agent"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-icon-link rounded-full px-3 py-1.5 ${
                    active ? "bg-ink text-card" : "text-ink-soft hover:bg-paper-deep"
                  }`}
                >
                  <Icon name={item.icon} size={15} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user?.role === "agent" ? (
              <Link href="/agent/payslips/new" className="btn btn-accent hidden sm:inline-flex">
                <Icon name="filePlus" size={16} />
                New payslip
              </Link>
            ) : null}
            {user ? (
              <button className="btn btn-ghost" type="button" onClick={logout}>
                <Icon name="logout" size={15} />
                {user.name.split(" ")[0]} · Sign out
              </button>
            ) : null}
          </div>
        </div>
      </header>
      <main className={`mx-auto min-h-[calc(100vh-4.2rem)] w-full ${printing ? "max-w-none p-0" : "max-w-6xl px-4 py-8 sm:px-6"}`}>
        {children}
      </main>
    </div>
  );
}
