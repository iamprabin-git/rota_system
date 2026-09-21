"use client";

import { useEffect } from "react";
import { Icon } from "@/components/Icon";

export function PrintButton({
  label,
  auto = false,
  variant = "primary",
}: {
  label: string;
  auto?: boolean;
  variant?: "primary" | "ghost" | "icon";
}) {
  useEffect(() => {
    if (!auto) return;
    const timer = window.setTimeout(() => window.print(), 350);
    return () => window.clearTimeout(timer);
  }, [auto]);

  if (variant === "icon") {
    return (
      <button className="staff-icon-btn" type="button" aria-label={label} title={label} onClick={() => window.print()}>
        <Icon name="printer" size={16} />
      </button>
    );
  }

  return (
    <button className={`btn ${variant === "ghost" ? "btn-ghost" : "btn-primary"}`} type="button" onClick={() => window.print()}>
      <Icon name="printer" size={16} />
      {label}
    </button>
  );
}
