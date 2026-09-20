"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { ThemeToggle } from "@/components/ThemeToggle";
import { formatDate, fullName, money } from "@/lib/format";
import type { Employee } from "@/lib/types";
import type { StaffNotice } from "@/lib/notifications";

const NAV: { href: string; label: string; hint: string; icon: IconName }[] = [
  { href: "/me", label: "Overview", hint: "Hours, pay and files", icon: "home" },
  { href: "/me/hours", label: "Hours", hint: "Timesheet entries", icon: "clock" },
  { href: "/me/statements", label: "Statements", hint: "Itemised payslips", icon: "fileText" },
  { href: "/me/payments", label: "Payments", hint: "Due and received", icon: "wallet" },
  { href: "/me/files", label: "Files", hint: "Personal records", icon: "folder" },
];

const TITLES: Record<string, { kicker: string; title: string; icon: IconName }> = {
  "/me": { kicker: "Personal workspace", title: "Overview", icon: "home" },
  "/me/hours": { kicker: "Timesheet", title: "Hours worked", icon: "clock" },
  "/me/statements": { kicker: "Payroll", title: "Statements", icon: "fileText" },
  "/me/payments": { kicker: "Money", title: "Payments", icon: "wallet" },
  "/me/files": { kicker: "Records", title: "Files", icon: "folder" },
};

function initials(employee: Employee) {
  return `${employee.firstName[0] || ""}${employee.lastName[0] || ""}`.toUpperCase();
}

function isActive(pathname: string, href: string) {
  if (href === "/me") return pathname === "/me";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StaffShell({
  employee,
  notifications,
  children,
}: {
  employee: Employee;
  notifications: StaffNotice[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(true);
  const [noticesOpen, setNoticesOpen] = useState(false);
  const [read, setRead] = useState<string[]>([]);

  useEffect(() => {
    const stored = window.localStorage.getItem("rs_notice_read");
    if (stored) setRead(JSON.parse(stored) as string[]);
    const mq = window.matchMedia("(max-width: 960px)");
    const apply = () => {
      setMobile(mq.matches);
      setOpen(!mq.matches);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (mobile) setOpen(false);
    setNoticesOpen(false);
  }, [pathname, mobile]);

  useEffect(() => {
    document.body.classList.toggle("nav-locked", open && mobile);
    return () => document.body.classList.remove("nav-locked");
  }, [open, mobile]);

  const unread = useMemo(
    () => notifications.filter((item) => !read.includes(item.id)),
    [notifications, read],
  );
  const heading = TITLES[pathname] || TITLES["/me"];
  const name = fullName(employee);

  function markRead(id?: string) {
    const next = id ? [...new Set([...read, id])] : notifications.map((item) => item.id);
    setRead(next);
    window.localStorage.setItem("rs_notice_read", JSON.stringify(next));
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="staff-app">
      <div className={`staff-scrim ${open && mobile ? "show" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`staff-sidebar ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="staff-brand">
          <span className="heading-icon compact">
            <Icon name="user" size={16} />
          </span>
          <span>
            <span className="serif staff-brand-title">RotaSystem</span>
            <span className="staff-brand-kicker">User panel</span>
          </span>
          {mobile ? (
            <button className="staff-icon-btn staff-close" type="button" aria-label="Close menu" onClick={() => setOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          ) : null}
        </div>

        <div className="staff-person">
          <span className="staff-avatar">{initials(employee)}</span>
          <span className="min-w-0">
            <span className="staff-person-name">{name}</span>
            <span className="staff-person-role">{employee.jobTitle}</span>
          </span>
        </div>

        <nav className="staff-nav">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const payBadge = item.href === "/me/payments" ? unread.filter((n) => n.kind === "pay").length : 0;
            return (
              <Link key={item.href} href={item.href} className={`staff-link ${active ? "active" : ""}`}>
                <span className="staff-link-icon">
                  <Icon name={item.icon} size={16} />
                </span>
                <span className="staff-link-copy">
                  <span className="block font-semibold">{item.label}</span>
                  <span className="staff-link-hint">{item.hint}</span>
                </span>
                {payBadge > 0 ? <span className="staff-badge">{payBadge}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="staff-sidebar-foot">
          <p className="staff-meta">
            {employee.payrollNumber} · {money(employee.hourlyRate)}/h
          </p>
          <button className="staff-signout" type="button" onClick={logout}>
            <Icon name="logout" size={15} />
            Sign out
          </button>
        </div>
      </aside>

      <div className={`staff-main ${open && !mobile ? "with-sidebar" : ""}`}>
        <header className="staff-header">
          <div className="staff-header-left">
            <button
              className="staff-icon-btn"
              type="button"
              aria-label={open ? "Hide navigation" : "Show navigation"}
              onClick={() => setOpen((value) => !value)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <span className="heading-icon compact">
              <Icon name={heading.icon} size={16} />
            </span>
            <div className="min-w-0">
              <p className="staff-kicker">{heading.kicker}</p>
              <h1 className="staff-title">{heading.title}</h1>
            </div>
          </div>

          <div className="staff-header-actions">
            <div className="staff-header-name">
              <p className="font-semibold leading-tight">{name}</p>
              <p className="text-xs text-ink-soft">{employee.department || employee.jobTitle}</p>
            </div>
            <ThemeToggle />
            <button
              className="staff-icon-btn relative"
              type="button"
              aria-label="Notifications"
              onClick={() => setNoticesOpen((value) => !value)}
            >
              <Icon name="bell" size={18} />
              {unread.length > 0 ? <span className="staff-dot">{unread.length}</span> : null}
            </button>
            <span className="staff-avatar compact staff-header-avatar">{initials(employee)}</span>
          </div>
        </header>

        <div className={`staff-notice-panel ${noticesOpen ? "open" : ""}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="section-heading">
              <span className="heading-icon compact">
                <Icon name="bell" size={16} />
              </span>
              <div>
                <p className="staff-kicker">Notifications</p>
                <h2 className="serif text-xl">For {employee.firstName}</h2>
              </div>
            </div>
            <button className="text-sm font-semibold text-ink-soft" type="button" onClick={() => markRead()}>
              Mark all read
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            {notifications.length === 0 ? (
              <li className="notice-empty">No notices on your record.</li>
            ) : (
              notifications.map((notice) => (
                <li key={notice.id}>
                  <Link
                    href={notice.href}
                    className={`notice-item ${read.includes(notice.id) ? "read" : "unread"}`}
                    onClick={() => markRead(notice.id)}
                  >
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <Icon
                        name={
                          notice.kind === "pay"
                            ? "wallet"
                            : notice.kind === "hours"
                              ? "clock"
                              : notice.kind === "file"
                                ? "folder"
                                : "fileText"
                        }
                        size={15}
                      />
                      {notice.title}
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">{notice.body}</p>
                    <p className="notice-time">{formatDate(notice.createdAt)}</p>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="staff-content">{children}</div>
      </div>
    </div>
  );
}
