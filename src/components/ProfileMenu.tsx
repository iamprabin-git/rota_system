"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { UserPhoto } from "@/components/UserPhoto";
import type { SessionUser } from "@/lib/types";

export function ProfileMenu({ user, subtitle }: { user: SessionUser; subtitle: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const active = pathname === "/profile" || pathname.startsWith("/profile/");

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

  function toggle() {
    setOpen((value) => !value);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="profile-menu" ref={root}>
      <button
        className={`profile-btn ${open || active ? "on" : ""}`}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        onClick={toggle}
      >
        <UserPhoto name={user.name} avatar={user.avatar} size="sm" />
        <span className="profile-btn-copy">
          <span className="profile-btn-name">{user.name}</span>
          <span className="profile-btn-role">{subtitle}</span>
        </span>
        <Icon name="chevron" size={14} />
      </button>
      {open ? (
        <div className="profile-drop" role="menu">
          <Link href="/profile" role="menuitem" className="profile-item" onClick={() => setOpen(false)}>
            <Icon name="user" size={16} />
            My profile
          </Link>
          <Link href="/profile#photo" role="menuitem" className="profile-item" onClick={() => setOpen(false)}>
            <Icon name="camera" size={16} />
            Change photo
          </Link>
          <Link href="/profile#password" role="menuitem" className="profile-item" onClick={() => setOpen(false)}>
            <Icon name="lock" size={16} />
            Change password
          </Link>
          <Link href="/profile#contact" role="menuitem" className="profile-item" onClick={() => setOpen(false)}>
            <Icon name="mail" size={16} />
            Email and phone
          </Link>
          <button className="profile-item danger" type="button" role="menuitem" onClick={() => void logout()}>
            <Icon name="logout" size={16} />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
