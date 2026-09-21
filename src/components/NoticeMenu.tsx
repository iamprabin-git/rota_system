"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { formatRelative } from "@/lib/format";
import { noticeIcon, type StaffNotice } from "@/lib/notice-types";

export function NoticeMenu({ userId, notices }: { userId: string; notices: StaffNotice[] }) {
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [items, setItems] = useState(notices);
  const [read, setRead] = useState<string[]>([]);
  const storageKey = `rs_notice_read_${userId}`;

  useEffect(() => {
    setItems(notices);
  }, [notices]);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) setRead(JSON.parse(stored) as string[]);
  }, [storageKey]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = useMemo(() => items.filter((item) => !read.includes(item.id)), [items, read]);
  const visible = tab === "unread" ? unread : items;
  const count = unread.length > 99 ? "99+" : String(unread.length);

  function persist(next: string[]) {
    setRead(next);
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  }

  function markRead(id?: string) {
    persist(id ? [...new Set([...read, id])] : items.map((item) => item.id));
  }

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      const response = await fetch("/api/notifications");
      if (response.ok) setItems((await response.json()) as StaffNotice[]);
    }
  }

  return (
    <div className="notice-menu" ref={root}>
      <button
        className={`notice-btn ${open ? "on" : ""}`}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={unread.length ? `${unread.length} notifications` : "Notifications"}
        onClick={() => void toggle()}
      >
        <Icon name="bell" size={20} />
        {unread.length > 0 ? <span className="notice-count">{count}</span> : null}
      </button>
      {open ? (
        <div className="notice-drop" role="menu">
          <div className="notice-drop-head">
            <h2>Notifications</h2>
            {items.length > 0 ? (
              <button className="notice-mark" type="button" onClick={() => markRead()} title="Mark all as read">
                <Icon name="check" size={16} />
              </button>
            ) : null}
          </div>
          <div className="notice-tabs">
            <button className={`notice-tab ${tab === "all" ? "on" : ""}`} type="button" onClick={() => setTab("all")}>
              All
            </button>
            <button className={`notice-tab ${tab === "unread" ? "on" : ""}`} type="button" onClick={() => setTab("unread")}>
              Unread{unread.length ? ` ${unread.length}` : ""}
            </button>
          </div>
          <ul className="notice-drop-list">
            {visible.length === 0 ? (
              <li className="notice-empty">{tab === "unread" ? "No unread notifications." : "No notifications."}</li>
            ) : (
              visible.map((notice) => {
                const isRead = read.includes(notice.id);
                return (
                  <li key={notice.id}>
                    <Link
                      href={notice.href}
                      role="menuitem"
                      className={`notice-row ${isRead ? "read" : "unread"}`}
                      onClick={() => markRead(notice.id)}
                    >
                      <span className={`notice-avatar kind-${notice.kind}`} aria-hidden>
                        <Icon name={noticeIcon(notice.kind)} size={22} />
                      </span>
                      <span className="notice-copy">
                        <strong>{notice.title}</strong>
                        <span>{notice.body}</span>
                        <time className="notice-when" dateTime={notice.createdAt}>
                          {formatRelative(notice.createdAt)}
                        </time>
                      </span>
                      {isRead ? null : <span className="notice-unread-dot" aria-hidden />}
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
