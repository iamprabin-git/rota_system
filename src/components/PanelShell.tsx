"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CompanyMark } from "@/components/CompanyMark";
import { Icon } from "@/components/Icon";
import { NoticeMenu } from "@/components/NoticeMenu";
import { ShiftReminders } from "@/components/ShiftReminders";
import { UiSettings } from "@/components/UiSettings";
import { ProfileMenu } from "@/components/ProfileMenu";
import { companyDisplayName } from "@/lib/profile";
import type { StaffNotice } from "@/lib/notice-types";
import {
  isPanelActive,
  panelBrandIcon,
  panelHeading,
  panelHome,
  panelLabel,
  panelNavGroups,
} from "@/lib/panel-nav";
import type { Company, SessionUser } from "@/lib/types";

export function PanelShell({
  user,
  company,
  subtitle,
  meta,
  notifications = [],
  children,
}: {
  user: SessionUser;
  company?: Pick<Company, "id" | "name" | "tradingName" | "logo"> | null;
  subtitle: string;
  meta?: string;
  notifications?: StaffNotice[];
  children: React.ReactNode;
}) {
  const brandName = companyDisplayName(company);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(true);
  const groups = panelNavGroups(user.role);
  const home = panelHome(user.role);
  const heading = panelHeading(user.role, pathname);

  useEffect(() => {
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
  }, [pathname, mobile]);

  useEffect(() => {
    document.body.classList.toggle("nav-locked", open && mobile);
    return () => document.body.classList.remove("nav-locked");
  }, [open, mobile]);

  return (
    <div className="staff-app">
      <div className={`staff-scrim no-print ${open && mobile ? "show" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`staff-sidebar no-print ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="staff-brand">
          {company ? (
            <CompanyMark name={brandName} logo={company.logo} companyId={company.id} />
          ) : (
            <span className="heading-icon compact">
              <Icon name={panelBrandIcon(user.role)} size={16} />
            </span>
          )}
          <span className="min-w-0">
            <span className="serif staff-brand-title">{brandName || "RotaSystem"}</span>
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
          {groups.map((group) => (
            <div key={group.label} className="staff-nav-group">
              <p className="staff-nav-label">{group.label}</p>
              {group.items.map((item) => {
                const active = isPanelActive(pathname, item.href, home);
                return (
                  <Link key={item.href} href={item.href} className={`staff-link ${active ? "active" : ""}`}>
                    <span className="staff-link-icon">
                      <Icon name={item.icon} size={16} />
                    </span>
                    <span className="staff-link-copy">
                      <span className="block font-semibold">{item.label}</span>
                      <span className="staff-link-hint">{item.hint}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
          <div className="staff-nav-group workspace">
            <p className="staff-nav-label">Workspace</p>
            <UiSettings variant="nav" onOpen={() => mobile && setOpen(false)} />
          </div>
        </nav>

        {meta ? (
          <div className="staff-sidebar-foot">
            <p className="staff-meta">{meta}</p>
          </div>
        ) : null}
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
            {company ? (
              <>
                <span className="staff-header-company">
                  <CompanyMark name={brandName} logo={company.logo} companyId={company.id} size="sm" />
                  <span className="min-w-0">
                    <p className="staff-kicker">{panelLabel(user.role)}</p>
                    <p className="staff-header-company-name">{brandName}</p>
                  </span>
                </span>
                <span className="staff-header-split" aria-hidden />
              </>
            ) : null}
            <span className="heading-icon compact">
              <Icon name={heading.icon} size={16} />
            </span>
            <div className="min-w-0 staff-header-page">
              <p className="staff-kicker">{heading.kicker}</p>
              <h1 className="staff-title">{heading.title}</h1>
            </div>
          </div>
          <div className="staff-header-actions">
            <NoticeMenu userId={user.id} notices={notifications} />
            <ProfileMenu user={user} subtitle={subtitle} />
          </div>
        </header>

        <div className="staff-content">
          {user.role === "user" ? <ShiftReminders /> : null}
          {children}
        </div>
      </div>
    </div>
  );
}
