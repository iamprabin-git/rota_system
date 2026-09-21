"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { UiSettings } from "@/components/UiSettings";
import { ProfileMenu } from "@/components/ProfileMenu";
import { formatDate } from "@/lib/format";
import type { StaffNotice } from "@/lib/notifications";
import {
  isPanelActive,
  panelBrandIcon,
  panelHeading,
  panelHome,
  panelLabel,
  panelNav,
} from "@/lib/panel-nav";
import type { SessionUser } from "@/lib/types";

export function PanelShell({
  user,
  subtitle,
  meta,
  notifications = [],
  children,
}: {
  user: SessionUser;
  subtitle: string;
  meta?: string;
  notifications?: StaffNotice[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(true);
  const [noticesOpen, setNoticesOpen] = useState(false);
  const [read, setRead] = useState<string[]>([]);
  const nav = panelNav(user.role);
  const home = panelHome(user.role);
  const heading = panelHeading(user.role, pathname);
  const showNotices = user.role === "user";

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
      <div className={`staff-scrim no-print ${open && mobile ? "show" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`staff-sidebar no-print ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="staff-brand">
          <span className="heading-icon compact">
            <Icon name={panelBrandIcon(user.role)} size={16} />
          </span>
          <span>
            <span className="serif staff-brand-title">RotaSystem</span>
            <span className="staff-brand-kicker">{panelLabel(user.role)}</span>
          </span>
          {mobile ? (
            <button className="staff-icon-btn staff-close" type="button" aria-label="Close menu" onClick={() => setOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          ) : null}
        </div>

        <nav className="staff-nav">
          {nav.map((item) => {
            const active = isPanelActive(pathname, item.href, home);
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
          {showNotices ? (
            <button
              className={`staff-link ${noticesOpen ? "active" : ""}`}
              type="button"
              onClick={() => {
                setNoticesOpen((value) => !value);
                if (mobile) setOpen(false);
              }}
            >
              <span className="staff-link-icon">
                <Icon name="bell" size={16} />
              </span>
              <span className="staff-link-copy">
                <span className="block font-semibold">Notifications</span>
                <span className="staff-link-hint">Payslip and hours notices</span>
              </span>
              {unread.length > 0 ? <span className="staff-badge">{unread.length}</span> : null}
            </button>
          ) : null}
          <UiSettings variant="nav" onOpen={() => mobile && setOpen(false)} />
        </nav>

        <div className="staff-sidebar-foot">
          {meta ? <p className="staff-meta">{meta}</p> : null}
          <button className="staff-signout" type="button" onClick={logout}>
            <Icon name="logout" size={15} />
            Sign out
          </button>
        </div>
      </aside>

      <div className={`staff-main ${open && !mobile ? "with-sidebar" : ""}`}>
        <header className="staff-header no-print">
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
            <ProfileMenu user={user} subtitle={subtitle} />
          </div>
        </header>

        {showNotices ? (
          <div className={`staff-notice-panel no-print ${noticesOpen ? "open" : ""}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="section-heading">
                <span className="heading-icon compact">
                  <Icon name="bell" size={16} />
                </span>
                <div>
                  <p className="staff-kicker">Notifications</p>
                  <h2 className="serif text-xl">For {user.name.split(" ")[0]}</h2>
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
        ) : null}

        <div className="staff-content">{children}</div>
      </div>
    </div>
  );
}
